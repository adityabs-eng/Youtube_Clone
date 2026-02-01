import {asyncHandeler} from "../utils/asyncHandeler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/User.model.js";
import { uploadOnCloudinary} from "../utils/cloudinary.js";


export const registerUser = asyncHandeler(async(req,res)=>{

    //get user data from req body

    const {fullname,email,username,password} = req.body


    //validation of user data

    if(!fullname || !email || !username || !password){
        throw new ApiError(400,"All fields are required")
    }


    //check if user already exists: username & email
    
    const existingUser = await User.findOne({$or: [{email}, {username}]})
        if(existingUser){
            throw new ApiError(409,"User with this email or username already exists")
        }



    //check for images and avatar in req files
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar image is required")
    }


    //upload them cloudinary, avatar check for default avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath, "avatar");
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath, "coverImages") : null;

    if(!avatar){
        throw new ApiError(500,"Error in uploading avatar image")
    }


    //create user object - create entry in db

    const user = await User.create({
        fullname,
        email,
        username : username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || null
    });

   const createdUser = await User.findById(user._id).select("-password -refreshToken");

   if(!createdUser){
    throw new ApiError(500,"User creation failed, please try again")
   }

    //send response
   return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));

});