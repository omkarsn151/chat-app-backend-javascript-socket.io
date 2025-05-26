// import "dotenv/config.js";
// import connectDB from "./db/index.js";
// import app from "./app.js";
    
// connectDB()
// .then(() => {
//     app.listen(process.env.PORT || 8000 , () => {
//         console.log(`Server running on port ${process.env.PORT}`);
//     });
//     console.log("MongoDB connected!!")
// })
// .catch((error) => {
//     console.log("MongoDB connection error!!: ",error)
//     // process.exit(1);
// });


// index.js
import "dotenv/config.js";
import connectDB from "./db/index.js";
import app from "./app.js";
import http from "http";
import { initSocket } from "./sockets/socket.js";

const PORT = process.env.PORT || 8000;

const server = http.createServer(app); // create server for Socket.IO
const startServer = async () => {
    try {
        await connectDB();
        console.log("MongoDB connected!!");

        const io = initSocket(server); // setup socket.io

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection error:", error);
        // process.exit(1);
    }
};

startServer();
