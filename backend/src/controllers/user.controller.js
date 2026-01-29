import {asyncHandeler} from "../utils/asyncHandeler.js";


export const registerUser = asyncHandeler(async(req,res)=>{
    return res.status(200).json({
        success:true,
        message:"User registered successfully"
    });
});