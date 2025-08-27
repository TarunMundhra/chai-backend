import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudnary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import { configDotenv } from "dotenv";

const generateAccessTokenAndrefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()    

        user.refreshToken = refreshToken
        //didnot understood
        await user.save({validateBeforeSave : false})

        return { accessToken , refreshToken }
    } catch (error) {
        console.log(error);
        throw new ApiError(500,"Something went wrong while generating AccessToken or refreshToken")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    //get details of the user from the frontend
    // validation - not empty
    //check if user already exists:through username , or email
    //check for image, check for avatar
    //upload them to cloudinary, check for avatar here too
    //create user object - create entry in db
    // remove password and refresh token field from the response
    // check if user creation,, response get or not get
    // return res
    const{fullName,email,username,password} = req.body
    console.log("email:",email)
    if(
        [email,fullName,username,password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [ { username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "user with same username already exists")
    }
    // files fiels given by multer
    const avatarLocalPath = req.files?.avatar[0]?.path;

    //debug avatar file not uploading
    console.log("FILES RECEIVED:", req.files);


    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let  coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudnary(avatarLocalPath)
    const coverImage = await uploadOnCloudnary(coverImageLocalPath)


    

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }
    
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,      
        password,
        username : username.toLowerCase()
    })

    const userCreated = await User.findById(user._id).select( 
        "-password -refreshToken"
    )
    if (!userCreated) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, userCreated, "user registered successfully")
    )
})

const loginUser = asyncHandler(async(req,res) =>{
    // req.body -> data
    // username or email
    // find the user
    //password check
    //access and refresh token renegrate 
    // send cookie
    
    const {email,username,password}  = req.body

    if(!(email || username)){
        throw new ApiError(400,"Either email or username is  required ")
    }


    //why colon and curly braces required search 
    // see criteria for 'new' before methods
    const user = await User.findOne({
        $or : [{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"User is not registered or found")
    }

    const validatePassword = await user.isPasswordCorrect(password)

    if(!validatePassword){
        throw new ApiError(401,"wrong user credentials")
    }

    const {accessToken,refreshToken} = await 
    generateAccessTokenAndrefreshToken(user._id)


    const loggedInUser =    await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly : true, // allows only server to modify cookies 
        sucure : true
    }

    return res
    .status(200)
    .cookie("refreshToken", refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, 
                accessToken: accessToken,
                refreshToken: refreshToken
            },
            "user logged in successfully"
        )
    )
})


const logoutUser = asyncHandler(async(req,res) =>{
    //req.user._id //.user created during jwtverify similar to req.body and req.cookie
     await  User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1,

            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true, // allows only server to modify cookies 
        sucure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res) =>{
    const incomingRefeshToken = req.cookies.refreshToken 
    || req.body.refreshToken //req.body for mobile application
    if(!incomingRefeshToken){
        throw new ApiError(401,"Invalid RefreshError during regenerating access token")
    }

    try {
        const decodedRefreshToken = jwt.verify(
            incomingRefeshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        // console.log(decodedRefreshToken)
        const user = await User.findById(decodedRefreshToken?._id)
    
        if(!user){
            throw new ApiError(401,"user not found while regenerating access token")
        }
        //console.log(user);
        // console.log(user?.refreshToken)
        if(incomingRefeshToken !== user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        const options = {
            httpOnly :  true,
            sucure : true
        }
    
        const { accessToken , newRefreshToken }  = await generateAccessTokenAndrefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken , refreshToken : newRefreshToken},
                "Access token refreshed succussfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || 
        "Invaild access token 222")
    }
})

const changePassword = asyncHandler(async(req,res) =>{
    const {oldPassword, newPassword} = req.body

    if(!oldPassword || !newPassword){
        throw new ApiError(400,"Old password and new password are required")
    }

    const user = await User.findById(req.user._id)

    if(!user){
        throw new ApiError(404,"User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Old password is incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : true})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{}, "Password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async(req,res) =>{
    //  generated by copilot
    
    // const user = await User.findById(req.user._id)
    // .select("-password -refreshToken")

    // if(!user){
    //     throw new ApiError(404,"User not found")
    // }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Current user fetched successfully")
    )
})

const updateaccount = asyncHandler(async(req,res) =>{
    const {fullName,username} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"Full name and email are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                email : email,
                username: username
            }
        },
        { new: true  } // to return the updated user and validate before saving
    ).select("-password");

    // if(!user){
    //     throw new ApiError(404,"User not found")
    // }

    // user.email = email
    // user.username = username.toLowerCase()

    // handle avatar and cover image updates
    // if(req.files?.avatar && req.files.avatar.length > 0) {
    //     const avatarLocalPath = req.files.avatar[0].path;
    //     user.avatar = (await uploadOnCloudnary(avatarLocalPath)).url;
    // }

    // if(req.files?.coverImage && req.files.coverImage.length > 0) {
    //     const coverImageLocalPath = req.files.coverImage[0].path;
    //     user.coverImage = (await uploadOnCloudnary(coverImageLocalPath)).url;
    // }

    // await user.save({validateBeforeSave: true});

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User account updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async(req,res) =>{
    const user = await User.findById(req.user._id).select("-password ");

    if(!user){
        throw new ApiError(404,"User not found")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; //req.files is from multer

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing or not provided")
    }

    // user.avatar = (await uploadOnCloudnary(avatarLocalPath)).url;

    // if(!user.avatar){
    //     throw new ApiError(400,"Avatar file upload failed")
    // }

    const avatar = await uploadOnCloudnary(avatarLocalPath);
    if(!avatar.url){    
        throw new ApiError(400," New Avatar file upload failed")
    }

    user.avatar = avatar.url;
    // Save the user with the new avatar not whole user object
    // to avoid overwriting other fields like password or refreshToken
    // no need to use set operator here as we are directly updating the avatar field
    // and not the whole user object

    await user.save({validateBeforeSave: true});

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User avatar updated successfully")
    )
})
const updateUserCoverImage = asyncHandler(async(req,res) =>{
    const user = await User.findById(req.user._id).select("-password ");

    if(!user){
        throw new ApiError(404,"User not found")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; //req.files is from multer

    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage file is missing or not provided")
    }

    // user.coverImage = (await uploadOnCloudnary(coverImageLocalPath)).url;

    // if(!user.coverImage){
    //     throw new ApiError(400,"coverImage file upload failed")
    // }

    const coverImage = await uploadOnCloudnary(coverImageLocalPath);
    if(!coverImage.url){    
        throw new ApiError(400," New coverImage file upload failed")
    }

    user.coverImage = coverImage.url;
    // Save the user with the new coverImage not whole user object
    // to avoid overwriting other fields like password or refreshToken
    // no need to use set operator here as we are directly updating the coverImage field
    // and not the whole user object

    await user.save({validateBeforeSave: true});

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User coverImage updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res) =>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup:{
               from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo" 
            }
        },
        {
            $addFields : {
                subscibersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                //TODO
                isSubcribed : {
                    $cond : {
                        if : {$in: [ req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                fullName : 1,
                username : 1,
                avatar : 1,
                coverImage : 1,
                subscibersCount : 1,
                channelsSubscribedToCount : 1,
                isSubcribed : 1,
                email : 1
            }
        }
        
    ])

    if(!channel?.length){
        throw new ApiError(404," channel doesnot exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0],
        "user channel fetched successfully"))
    
})

const getwatchHistory = asyncHandler(async(req,res) =>{
    const user = await User.aggregate([
        {   
            $match : {
                _id : req.user._id
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline : [
                                {
                                    $project : { // gives in the owner field
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1  
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner : {
                                $first:"$owner"
                                // $ written to get from field
                            }
                        }
                    } 
                ]
            }
        },
        {
            $addFields : {
                watchHistoryCount : {$size: "$watchHistory"}
            }
        },
        {
            $project : {
                watchHistory : 1,
                watchHistoryCount : 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user.watchHistory,
            "User watch history fetched successfully"
        )
    )
})   


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateaccount,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getwatchHistory
}