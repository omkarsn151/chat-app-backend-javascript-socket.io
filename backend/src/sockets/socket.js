import { Server } from "socket.io";
import { Message } from "../models/message.model.js";

export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected: " + socket.id);

        // Join room for user
        socket.on("join", (userId) => {
            socket.join(userId);
            socket.userId = userId; // Store userId for later use
            console.log(`User ${userId} joined their room`);
        });

        // Send message (persist to DB, emit with metadata)
        socket.on("send_message", async ({ receiverId, message }, callback) => {
            try {
                if (!socket.userId) {
                    if (callback) callback({ success: false, error: "Not joined" });
                    return;
                }
                // Save message to DB
                const newMessage = await Message.create({
                    senderId: socket.userId,
                    receiverId,
                    message,
                    seen: false
                });

                const payload = {
                    _id: newMessage._id,
                    senderId: socket.userId,
                    receiverId,
                    message,
                    seen: false,
                    createdAt: newMessage.createdAt
                };

                io.to(receiverId).emit("receive_message", payload);
                socket.emit("message_sent", payload);

                if (callback) callback({ success: true, message: payload });
            } catch (error) {
                if (callback) callback({ success: false, error: error.message });
            }
        });

        // Handle seen status
        socket.on("message_seen", async ({ messageId }) => {
            try {
                const updated = await Message.findByIdAndUpdate(
                    messageId,
                    { seen: true },
                    { new: true }
                );
                if (updated) {
                    // Notify sender that message was seen
                    io.to(updated.senderId.toString()).emit("message_seen_ack", {
                        messageId: updated._id,
                        seen: true
                    });
                }
            } catch (error) {
                console.error("Error updating seen status:", error.message);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected: " + socket.id);
        });
    });

    return io;
};





// client side
// socket.emit("send_message", { receiverId, message }, (ack) => {
//   if (ack.success) {
//     // Message sent and saved
//   } else {
//     // Handle error
//   }
// });
// socket.emit("message_seen", { messageId });
// socket.on("message_seen_ack", ({ messageId, seen }) => {
//   // Update UI to show message as seen
// });



// import { Server } from "socket.io";

// export const initSocket = (server) => {
//     const io = new Server(server, {
//         cors: {
//             origin: process.env.CORS_ORIGIN,
//             methods: ["GET", "POST"]
//         }
//     });

//     io.on("connection", (socket) => {
//         console.log("User connected: " + socket.id);

//         // Join room for user
//         socket.on("join", (userId) => {
//             socket.join(userId);
//             console.log(`User ${userId} joined their room`);
//         });

//         // Send message
//         socket.on("send_message", ({ receiverId, message }) => {
//             io.to(receiverId).emit("receive_message", message);
//         });

//         socket.on("disconnect", () => {
//             console.log("User disconnected: " + socket.id);
//         });
//     });

//     return io;
// };












































