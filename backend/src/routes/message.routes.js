import { Router } from "express";
import {
    sendMessage,
    getMessages,
    getChatUsers
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", sendMessage);
router.get("/chats", getChatUsers);
router.get("/:userId", getMessages);

export default router;
