import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

// Send a message
export const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, message, media } = req.body;
    const senderId = req.user._id;

    if (!receiverId) throw new ApiError(400, "Receiver ID is required");

    const newMessage = await Message.create({
        senderId,
        receiverId,
        message,
        media
    });

    return res
        .status(201)
        .json(new ApiResponse(201, newMessage, "Message sent successfully"));
});

// Get messages between two users
export const getMessages = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const { userId } = req.params;

    const messages = await Message.find({
        $or: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId }
        ]
    }).sort({ createdAt: 1 });

    return res.status(200).json(new ApiResponse(200, messages));
});

// Get all users current user has chatted with
export const getChatUsers = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;

    const messages = await Message.find({
        $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
    });

    const userIds = new Set();

    messages.forEach(msg => {
        if (msg.senderId.toString() !== currentUserId.toString()) {
            userIds.add(msg.senderId.toString());
        }
        if (msg.receiverId.toString() !== currentUserId.toString()) {
            userIds.add(msg.receiverId.toString());
        }
    });

    const users = await User.find({ _id: { $in: [...userIds] } }).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, users));
});


const getAllUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const users = await User.find({ _id: { $ne: currentUserId } }).select(
    "_id fullName userName avatar"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, users, "All users fetched successfully"));
});

export { getAllUsers };
