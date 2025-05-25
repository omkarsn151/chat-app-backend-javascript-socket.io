import { asyncHandler } from "../utils/asyncHandler.js";
import { User} from "../models/user.model.js"
import { ApiError  } from "../utils/apiError.js";
import { ApiResponse  } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request: Refresh token missing");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (error) {
        throw new ApiError(401, "Refresh token is invalid or expired");
    }

    const user = await User.findById(decodedToken?._id);

    if (!user) {
        throw new ApiError(401, "User not found");
    }

    // ✅ Only now do we compare
    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token does not match or already used");
    }

    // ✅ Valid token → generate new ones
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
            "Access token refreshed successfully"
        )
    );
});


const loginUser = asyncHandler(async (req, res) => {
    const { email, userName, password } = req.body;

    if (!userName && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ userName }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    );
});


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "User logged out successfully")
    );
});




const registerUser = asyncHandler(async (req, res) => {
    const { userName, fullName, email, password } = req.body;

    // Validate required fields
    if ([fullName, email, userName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Optional avatar upload
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverLocalPath = req.files?.coverImage?.[0]?.path;
    let avatarUrl = "";
    let coverUrl = "";

    if (avatarLocalPath) {
        const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
        if (avatarUpload?.url) {
            avatarUrl = avatarUpload.url;
        }
    }
    // Upload cover image if present
    if (coverLocalPath) {
        const coverUpload = await uploadOnCloudinary(coverLocalPath);
        if (coverUpload?.url) coverUrl = coverUpload.url;
    }

    // Create user
    const user = await User.create({
        fullName,
        avatar: avatarUrl,
        coverImage: coverUrl,
        email,
        password,
        userName: userName.toLowerCase()
    });

    // Retrieve created user without sensitive fields
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

export { registerUser, refreshAccessToken, loginUser, logoutUser };