// import express from "express";
// import cors from "cors";

// const app = express();

// app.use(express.json());
// app.use(cors({
//     origin: process.env.CORS_ORIGIN
// }))
// app.use(express.json({limit: "16kb"}))
// app.use(express.urlencoded({extended: true, limit: "16kb"}))
// app.use(express.static("public"))

// // routes
// import userRouter from './routes/user.routes.js'

// // routes declaration
// app.use("/api/v1/users", userRouter);

// export default app;

import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// routes
import userRouter from "./routes/user.routes.js";
import messageRouter from "./routes/message.routes.js"; // ✅ NEW

// route declarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/messages", messageRouter); // ✅ NEW

export default app;
