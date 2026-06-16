import express from "express";
import { chatWithFriend } from "../controllers/friend.controllers.js";

const router = express.Router();

router.post("/chat", chatWithFriend);

export default router;
