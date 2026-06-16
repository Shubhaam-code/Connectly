import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  trackEvent,
  getProfileAnalytics,
  getImpressionsAnalytics,
  getVisitorsAnalytics
} from "../controllers/analytics.controllers.js";

const router = express.Router();

router.post("/track", isAuth, trackEvent);
router.get("/profile", isAuth, getProfileAnalytics);
router.get("/impressions", isAuth, getImpressionsAnalytics);
router.get("/visitors", isAuth, getVisitorsAnalytics);

export default router;
