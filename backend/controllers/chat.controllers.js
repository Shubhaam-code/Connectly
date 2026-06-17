import { generateAIResponse } from "../services/groqService.js";
import redis from "../config/redis.js";

// In-memory rate limiting fallback cache in case Redis is offline
const memoryCache = new Map();

// Helper to cleanup memory cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of memoryCache.entries()) {
    if (val.resetTime < now) {
      memoryCache.delete(key);
    }
  }
}, 60000);

export const chatWithGroq = async (req, res) => {
  try {
    const { message, stream = true } = req.body;

    // 1. Validation
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Valid message content is required." });
    }

    // 2. Rate Limiting (20 requests per minute per IP)
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown-ip";
    const rateLimitKey = `ratelimit:chat:${ip}`;
    let isRateLimited = false;

    // Attempt Redis rate limit
    if (redis && redis.status === "ready") {
      try {
        const count = await redis.incr(rateLimitKey);
        if (count === 1) {
          await redis.expire(rateLimitKey, 60);
        }
        if (count > 20) {
          isRateLimited = true;
        }
      } catch (redisErr) {
        console.error("Redis rate limiter failed, falling back to memory:", redisErr);
      }
    }

    // Fallback to in-memory rate limiting if Redis is down/not configured or if rate limit check isn't complete
    if (!isRateLimited && (!redis || redis.status !== "ready")) {
      const now = Date.now();
      const clientRecord = memoryCache.get(rateLimitKey);

      if (!clientRecord || clientRecord.resetTime < now) {
        memoryCache.set(rateLimitKey, {
          count: 1,
          resetTime: now + 60000
        });
      } else {
        clientRecord.count += 1;
        if (clientRecord.count > 20) {
          isRateLimited = true;
        }
      }
    }

    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        message: "You are sending messages too quickly. Please wait a moment before trying again."
      });
    }

    // 3. Friend Persona System Prompt
    const systemPrompt = "You are a warm, casual, extremely supportive, and fun companion named 'Friend' on the Connectly platform. " +
                         "You talk like a real human friend (using emojis like 💜, 🌟, ✨, 🤔, etc.). " +
                         "Avoid looking like a customer support assistant or robotic engine. Be empathetic, friendly, and engaging. " +
                         "Keep paragraphs short. Use markdown formatting and lists when helpful. " +
                         "If code block syntax is used, make sure to format it cleanly using markdown.";

    if (stream) {
      // Set headers for Server-Sent Events (SSE) streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      try {
        const chatCompletionStream = await generateAIResponse(message, {
          systemPrompt,
          stream: true,
          rateLimitKey
        });

        for await (const chunk of chatCompletionStream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        res.write("data: [DONE]\n\n");
        res.end();
      } catch (err) {
        console.error("Groq streaming fetch failed:", err.message);
        res.write(`data: ${JSON.stringify({ content: " I got a bit dizzy there. Can you repeat that? 💜" })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
      }
    } else {
      // Non-streaming response format: { success: true, reply: "AI response" }
      try {
        const chatCompletion = await generateAIResponse(message, {
          systemPrompt,
          stream: false,
          rateLimitKey
        });

        const reply = chatCompletion.choices[0]?.message?.content || "";
        return res.status(200).json({ success: true, reply });
      } catch (err) {
        console.error("Groq non-streaming fetch failed:", err.message);
        return res.status(500).json({
          success: false,
          message: "I am having trouble processing that right now. Please try again in a bit!"
        });
      }
    }
  } catch (err) {
    console.error("Chat controller global error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Internal server error in AI chat." });
    } else {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
};
