import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudnary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const generateAccessTokenAndrefreshToken = async (userId) => {
    try {
        const user = User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()    

        user.refreshToken = refreshToken
        //didnot understood
        await user.save({validateBeforeSave : false})

        return { accessToken , refreshToken }
    } catch (error) {
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
        throw new ApiError(409, "user with user or username already exists")
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

    if(!email || !username){
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

    const validatePassword = await isPasswordCorrect(password)

    if(!validatePassword){
        throw new ApiError(401,"wrong user credentials")
    }

    const {accessToken,refreshToken} = await 
    generateAccessTokenAndrefreshToken(user._id)


    const loggedInUser = User.findById(user._id).
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
                user : accessToken,loggedInUser,refreshToken
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
            $set : {
                refreshToken : undefined
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
export {
    registerUser,
    loginUser,
    logoutUser
}