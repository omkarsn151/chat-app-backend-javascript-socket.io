import { asyncHandler } from "../utils/asyncHandler.js";
import { User} from "../models/user.model.js"
import { ApiError  } from "../utils/apiError.js";
import { ApiResponse  } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export { registerUser };