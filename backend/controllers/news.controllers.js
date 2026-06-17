import redis from "../config/redis.js";
import crypto from "crypto";
import { generateAIResponse } from "../services/groqService.js";

// Helper to sanitize title to a valid caching key
const getCacheKey = (title) => {
  const hash = crypto.createHash("md5").update(title).digest("hex");
  return `news:summary:${hash}`;
};

// Category classification helper based on keyword presence
const classifyCategory = (title = "", description = "", content = "") => {
  const text = `${title} ${description} ${content}`.toLowerCase();
  
  if (
    text.includes("artificial intelligence") || 
    text.includes("machine learning") || 
    text.includes("openai") || 
    text.includes("chatgpt") || 
    text.includes("claude") || 
    text.includes("gemini") || 
    text.includes("deep learning") || 
    text.includes("llm") || 
    text.includes("neural network") || 
    text.includes("ai model") || 
    text.includes("robotics") || 
    text.includes("robot")
  ) {
    return "AI";
  }
  if (
    text.includes("startup") || 
    text.includes("founder") || 
    text.includes("venture capital") || 
    text.includes("funding round") || 
    text.includes("raised $") || 
    text.includes("seed stage") || 
    text.includes("y combinator") || 
    text.includes("ipo") || 
    text.includes("incubator")
  ) {
    return "Startups";
  }
  if (
    text.includes("social media") || 
    text.includes("instagram") || 
    text.includes("snapchat") || 
    text.includes("tiktok") || 
    text.includes("twitter") || 
    text.includes("facebook") || 
    text.includes("meta") || 
    text.includes("youtube") || 
    text.includes("influencer") || 
    text.includes("tweet") || 
    text.includes("reddit")
  ) {
    return "Social Media";
  }
  return "Technology"; // Fallback category
};

// Generative AI Summarization utilizing groqService and llama-3.3-70b-versatile
const getNewsSummary = async (title, description) => {
  const prompt = `You are a professional news summarizer for Connectly.
Summarize the following news article into a single, objective, factual paragraph.
Strictly adhere to the following rules:
1. The summary MUST be between 50 to 80 words.
2. Remove all clickbait, advertising copy, sensationalism, and hyperbole.
3. Start directly with the factual statement. Do not add intro headers like "Summary:" or "Here is the summary".
4. Write in a clean, professional, readable style (similar to Inshorts).

Article Title: ${title}
Article Description: ${description}`;

  try {
    const chatCompletion = await generateAIResponse(prompt, {
      systemPrompt: "You are a professional news summarizer for Connectly.",
      stream: false,
      rateLimitKey: "news-summarization"
    });
    const txt = chatCompletion.choices?.[0]?.message?.content;
    if (txt) {
      return txt.trim();
    }
  } catch (err) {
    console.error("Groq News Summarization error:", err.message);
  }

  return description ? (description.slice(0, 150) + "...") : "No summary available.";
};

// Score using: Recency, Source popularity, Category relevance
const calculateTrendingScore = (article) => {
  const now = Date.now();
  const publishedTime = new Date(article.publishedAt).getTime();
  const hoursOld = Math.max(0, (now - publishedTime) / (1000 * 60 * 60));
  
  // Recency score: Max 50 points, decays by 1 point per hour
  const recencyScore = Math.max(0, 50 - hoursOld);

  // Source popularity score: Max 30 points
  const popularSources = [
    "TechCrunch", "VentureBeat", "Bloomberg", "Reuters", "Wired", "The Verge", 
    "ESPN", "IGN", "Forbes", "NYTimes", "BBC", "CNN", "The Wall Street Journal"
  ];
  const isPopular = popularSources.some(s => article.source.toLowerCase().includes(s.toLowerCase()));
  const sourceScore = isPopular ? 30 : 10;

  // Category relevance score: Max 20 points
  const categoryRelevanceMap = {
    "AI": 20,
    "Startups": 20,
    "Technology": 15,
    "Business": 15,
    "Gaming": 10,
    "Sports": 5,
    "Entertainment": 5
  };
  const relevanceScore = categoryRelevanceMap[article.category] || 0;

  return recencyScore + sourceScore + relevanceScore;
};

// Fetch real articles from GNews and cache for 15 minutes
const getCachedOrFetchNews = async () => {
  // Check global cache
  const cacheKeyAll = "news:all";
  const cachedNews = await redis.get(cacheKeyAll);
  if (cachedNews) {
    try {
      return JSON.parse(cachedNews);
    } catch (e) {
      console.error("Error parsing cached news:", e);
    }
  }

  const gnewsApiKey = process.env.GNEWS_API_KEY;
  if (!gnewsApiKey) {
    console.warn("⚠️ GNEWS_API_KEY is not defined in environment variables.");
    return [];
  }

  // Fetch from GNews search endpoint to cover all required keywords/categories
  const query = "technology OR AI OR startups OR \"social media\" OR instagram OR tiktok";
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=50&apikey=${gnewsApiKey}`;

  let articles = [];
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      throw new Error(`GNews API status: ${res.status}`);
    }
    const data = await res.json();
    articles = data.articles || [];
  } catch (err) {
    console.error("❌ GNews API fetch failed:", err.message);
    return [];
  }

  const processed = [];
  for (const art of articles) {
    // Requirements: Must use image returned by GNews, do not use fallback if missing
    if (!art.image) continue;

    const category = classifyCategory(art.title, art.description, art.content);
    
    // Cache check for individual summary to save API credits
    const summaryKey = getCacheKey(art.title);
    let summary = await redis.get(summaryKey);
    if (!summary) {
      summary = await getNewsSummary(art.title, art.description || art.content);
      // Cache summary indefinitely (or matching news:all expiration - let's set it to 1 day to be safe/clean)
      await redis.setex(summaryKey, 86400, summary);
    }

    processed.push({
      title: art.title || "",
      description: art.description || "",
      content: art.content || art.description || "",
      url: art.url || "",
      image: art.image,
      publishedAt: art.publishedAt || new Date().toISOString(),
      source: art.source?.name || "GNews",
      author: art.author || art.source?.name || "GNews",
      category,
      summary
    });
  }

  if (processed.length > 0) {
    // Cache the whole list for 15 minutes (900 seconds)
    await redis.setex(cacheKeyAll, 900, JSON.stringify(processed));
  }

  return processed;
};

// Endpoints Controllers

// GET /api/news
export const getNews = async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    if (forceRefresh) {
      await redis.del("news:all");
    }

    const list = await getCachedOrFetchNews();
    if (!list || list.length === 0) {
      return res.status(500).json({ success: false, message: "Could not fetch news articles from GNews API." });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const category = req.query.category || req.query.cat;

    let filtered = [...list];
    if (category && category.toLowerCase() !== "all") {
      filtered = filtered.filter(art => art.category.toLowerCase() === category.toLowerCase());
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total: filtered.length,
        page,
        limit,
        pages: Math.ceil(filtered.length / limit)
      }
    });
  } catch (err) {
    console.error("getNews Controller Error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching news." });
  }
};

// GET /api/news/trending
export const getTrendingNews = async (req, res) => {
  try {
    const list = await getCachedOrFetchNews();
    if (list.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Sort using trending algorithm score
    const scoredList = list.map(art => ({
      ...art,
      trendingScore: calculateTrendingScore(art)
    }));
    scoredList.sort((a, b) => b.trendingScore - a.trendingScore);

    // Limit to top 10 trending items
    const trending = scoredList.slice(0, 10);

    return res.status(200).json({ success: true, data: trending });
  } catch (err) {
    console.error("getTrendingNews Controller Error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching trending news." });
  }
};

// GET /api/news/category
export const getNewsByCategory = async (req, res) => {
  try {
    const categoryName = req.query.cat || req.query.category;
    if (!categoryName) {
      return res.status(400).json({ success: false, message: "Category name is required." });
    }

    const list = await getCachedOrFetchNews();
    if (list.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const filtered = list.filter(art => art.category.toLowerCase() === categoryName.toLowerCase());
    
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total: filtered.length,
        page,
        limit,
        pages: Math.ceil(filtered.length / limit)
      }
    });
  } catch (err) {
    console.error("getNewsByCategory Controller Error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching news by category." });
  }
};

// POST /api/news/summarize
export const summarizeText = async (req, res) => {
  try {
    const { text, mode = "summarize" } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "text is required" });
    }

    let prompt = `Summarize this text in 50-80 words: ${text}`;
    if (mode === "simplify") {
      prompt = `Simplify the language of this text so it's easy to read for anyone. Keep it professional yet direct: ${text}`;
    }

    const chatCompletion = await generateAIResponse(prompt, {
      systemPrompt: "You are a helpful text summarizer and simplifier.",
      stream: false,
      rateLimitKey: "text-summarizer-endpoint"
    });

    const result = chatCompletion.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({ success: true, summary: result });
  } catch (err) {
    console.error("summarizeText controller error using groqService:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
