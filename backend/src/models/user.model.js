import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, //cloudinary  image URL
            required: true,
            default: "" // URL to the user's avatar image
        },
        coverImage: {
            type: String, //cloudinary  image URL
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,   
                ref: "Video",
            }
        ],
        password: {
            type: String,
            required:[true, "Password is required"],
        },
        refreshTokens: {
            type: String
        }
    },
    { timestamps: true }
);      

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname},
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
    );
}

const User = mongoose.model("User", userSchema);

export default User;