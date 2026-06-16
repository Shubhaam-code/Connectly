import Tracking from "../models/tracking.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Story from "../models/story.model.js";
import Message from "../models/message.model.js";

// POST /api/analytics/track
export const trackEvent = async (req, res) => {
  try {
    const { eventType, targetId } = req.body;
    if (!eventType) {
      return res.status(400).json({ success: false, message: "eventType is required" });
    }

    const userId = req.userId;
    const data = {
      eventType,
      visitor: userId
    };

    if (eventType === "profile_visit" || eventType === "profile_open" || eventType === "profile_impression") {
      data.owner = targetId || userId;
    } else if (eventType === "post_impression") {
      const post = await Post.findById(targetId);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      data.owner = post.author;
      data.post = targetId;
    } else if (eventType === "story_impression") {
      const story = await Story.findById(targetId);
      if (!story) {
        return res.status(404).json({ success: false, message: "Story not found" });
      }
      data.owner = story.author;
      data.story = targetId;
    } else {
      return res.status(400).json({ success: false, message: "Invalid eventType for tracking" });
    }

    // Prevent counting owner views in user metrics
    if (data.owner.toString() === userId.toString()) {
      return res.status(200).json({ success: true, message: "Owner action not recorded in analytics" });
    }

    await Tracking.create(data);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("trackEvent controller error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/analytics/profile
export const getProfileAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Profile Views: sum of profile_visit and profile_open
    const profileViews = await Tracking.countDocuments({
      owner: userId,
      eventType: { $in: ["profile_visit", "profile_open"] }
    });

    // Profile Visitors: count of unique visitors
    const uniqueVisitorsResult = await Tracking.distinct("visitor", {
      owner: userId,
      eventType: "profile_visit"
    });
    const profileVisitors = uniqueVisitorsResult.length;

    // Profile Impressions
    const profileImpressions = await Tracking.countDocuments({
      owner: userId,
      eventType: "profile_impression"
    });

    // Posts written by the user
    const posts = await Post.find({ author: userId });
    const postIds = posts.map(p => p._id);

    // Likes & Comments received on posts
    let totalLikes = 0;
    let totalComments = 0;
    posts.forEach(p => {
      totalLikes += p.likes?.length || 0;
      (p.comments || []).forEach(c => {
        totalComments++;
        totalComments += c.replies?.length || 0;
      });
    });

    // Saves received
    const totalSaves = await User.countDocuments({
      saved: { $in: postIds }
    });

    // Messages received
    const totalMessages = await Message.countDocuments({
      receiver: userId
    });

    // New followers in past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newFollowers = await Tracking.countDocuments({
      owner: userId,
      eventType: "follow",
      createdAt: { $gte: sevenDaysAgo }
    });

    // Weekly Growth string (+X followers)
    const weeklyGrowth = `+${newFollowers}`;

    return res.status(200).json({
      success: true,
      data: {
        profileViews,
        profileVisitors,
        profileImpressions,
        totalLikes,
        totalComments,
        totalSaves,
        totalMessages,
        newFollowers,
        weeklyGrowth
      }
    });
  } catch (err) {
    console.error("getProfileAnalytics controller error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/analytics/impressions
export const getImpressionsAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const impressions = await Tracking.find({
      owner: userId,
      eventType: { $in: ["post_impression", "profile_impression", "story_impression"] },
      createdAt: { $gte: sevenDaysAgo }
    });

    // Generate last 7 days keys
    const breakdown = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      breakdown[dateStr] = { posts: 0, profile: 0, stories: 0 };
    }

    impressions.forEach(imp => {
      const dateStr = imp.createdAt.toISOString().split("T")[0];
      if (breakdown[dateStr]) {
        if (imp.eventType === "post_impression") breakdown[dateStr].posts++;
        else if (imp.eventType === "profile_impression") breakdown[dateStr].profile++;
        else if (imp.eventType === "story_impression") breakdown[dateStr].stories++;
      }
    });

    const result = Object.keys(breakdown).map(date => ({
      date,
      ...breakdown[date]
    }));

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error("getImpressionsAnalytics controller error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/analytics/visitors
export const getVisitorsAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const uniqueVisitors = await Tracking.aggregate([
      { $match: { owner: userId, eventType: "profile_visit", visitor: { $ne: null } } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: "$visitor",
          latestVisit: { $first: "$createdAt" }
        }
      },
      { $sort: { latestVisit: -1 } },
      { $limit: 10 }
    ]);

    const populated = await User.populate(uniqueVisitors, {
      path: "_id",
      select: "name userName profileImage profession followers"
    });

    const data = populated.map(v => {
      if (!v._id) return null;
      return {
        _id: v._id._id,
        name: v._id.name,
        userName: v._id.userName,
        profileImage: v._id.profileImage,
        profession: v._id.profession,
        followersCount: v._id.followers?.length || 0,
        visitedAt: v.latestVisit
      };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error("getVisitorsAnalytics controller error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
