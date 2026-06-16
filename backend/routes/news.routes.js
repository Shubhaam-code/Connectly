import express from "express";
import { getNews, getTrendingNews, getNewsByCategory, summarizeText } from "../controllers/news.controllers.js";

const router = express.Router();

router.get("/", getNews);
router.get("/trending", getTrendingNews);
router.get("/category", getNewsByCategory);
router.post("/summarize", summarizeText);

export default router;
