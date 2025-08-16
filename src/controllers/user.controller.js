import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudnary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

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

export {
    registerUser,
}