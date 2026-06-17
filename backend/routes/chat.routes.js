import express from "express";
import { chatWithGroq } from "../controllers/chat.controllers.js";

const router = express.Router();

router.post("/", chatWithGroq);

export default router;
