import {asyncHandeler} from "../utils/asyncHandeler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/User.model.js";
import { uploadOnCloudinary} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        if(!user){
            throw new ApiError(404,"User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshTokens = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};  
    } catch (error) {
        console.log("Actual error:", error);
        throw new ApiError(500,"Error in generating tokens");
    }
}

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

export const loginUser = asyncHandeler(async(req,res)=>{
    const {email, username, password} = req.body;

    if(!(email || username)){
        throw new ApiError(400,"Email or Username is required");
    }

    if(!password){
        throw new ApiError(400,"Password is required");
    }
  
    const user = await User.findOne({$or: [{email}, {username}]});

    if(!user){
        throw new ApiError(404,"User not found with this email or username");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshTokens");

    const options = {
        httpOnly: true,
        secure:true
    };

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully"));
});

export const logoutUser = asyncHandeler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id, 
        {
           $set: {
            refreshTokens: undefined
            }
        },
        {new: true}
    );

    const options = {
        httpOnly: true,
        secure:true,
    };

    return res.status(200)
    .cookie("accessToken", "", {...options, maxAge: 0})
    .cookie("refreshToken", "", {...options, maxAge: 0})
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandeler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized access - no refresh token  provided");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);
    if(!user || user.refreshTokens !== incomingRefreshToken){
        throw new ApiError(401,"Invalid refresh token");
    }

    const options = {
        httpOnly: true,
        secure:true
    };

    await generateAccessAndRefreshTokens(user._id).then(({accessToken, refreshToken})=>{
        res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {accessToken, refreshToken}, "Access token refreshed successfully"));
    });

});