import { Groq } from "groq-sdk";

// Lazy-loaded Groq client to avoid boot crashes if key is missing
let groqClientInstance = null;

const getGroqClient = () => {
  if (groqClientInstance) return groqClientInstance;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in environment variables.");
  }
  groqClientInstance = new Groq({ apiKey });
  return groqClientInstance;
};

// Global, simple in-memory rate limiter for backend calls (fallback/guard)
const serviceRateLimiter = new Map();

/**
 * Validates and checks rate limits for the service call.
 * Limits to 30 requests per minute globally per key/endpoint context.
 */
const checkServiceRateLimit = (contextKey, limit = 30) => {
  const now = Date.now();
  const record = serviceRateLimiter.get(contextKey);

  if (!record || record.resetTime < now) {
    serviceRateLimiter.set(contextKey, { count: 1, resetTime: now + 60000 });
    return true;
  }

  record.count += 1;
  if (record.count > limit) {
    return false;
  }
  return true;
};

/**
 * Reusable function to generate AI responses using the official Groq SDK.
 * Target model: llama-3.3-70b-versatile
 * Includes: retry logic, timeout protection, rate limits, and request validation.
 * 
 * @param {string|Array} messageOrMessages - A user prompt string or an array of message objects.
 * @param {Object} options - Custom parameters (e.g., systemPrompt, stream, timeout, rateLimitKey)
 * @returns {Promise<Object|AsyncIterable>} - Standard completion or streaming iterable
 */
export const generateAIResponse = async (messageOrMessages, options = {}) => {
  // 1. Validation
  if (!messageOrMessages) {
    throw new Error("Validation failed: prompt/messages cannot be empty.");
  }

  let formattedMessages = [];
  if (typeof messageOrMessages === "string") {
    if (!messageOrMessages.trim()) {
      throw new Error("Validation failed: message cannot be an empty string.");
    }
    const systemPrompt = options.systemPrompt || "You are a helpful AI assistant.";
    formattedMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: messageOrMessages }
    ];
  } else if (Array.isArray(messageOrMessages)) {
    if (messageOrMessages.length === 0) {
      throw new Error("Validation failed: messages array cannot be empty.");
    }
    // Clean and validate message history structure
    formattedMessages = messageOrMessages.map(msg => {
      const role = msg.role || (msg.sender === "user" ? "user" : "assistant");
      const content = msg.content || msg.text || "";
      if (!content || typeof content !== "string" || !content.trim()) {
        throw new Error("Validation failed: each message must contain valid text content.");
      }
      return { role, content };
    });

    // Add optional system prompt to the beginning of context list if not present
    if (options.systemPrompt && !formattedMessages.some(m => m.role === "system")) {
      formattedMessages.unshift({ role: "system", content: options.systemPrompt });
    }
  } else {
    throw new Error("Validation failed: message must be a string or an array of message objects.");
  }

  // 2. Service Rate Limiting
  const rateLimitKey = options.rateLimitKey || "global-groq-service";
  if (!checkServiceRateLimit(rateLimitKey)) {
    throw new Error("Rate limit exceeded at the AI service layer. Please wait a moment.");
  }

  // 3. SDK execution with retries and timeout
  const groq = getGroqClient();
  const model = options.model || "llama-3.3-70b-versatile";
  const isStream = options.stream || false;
  const timeoutMs = options.timeout || 12000; // 12-second default timeout

  let retries = 2; // Will attempt up to 3 times total (initial + 2 retries)
  
  while (retries >= 0) {
    try {
      // Create controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Trigger Groq Completion request
      const requestPromise = groq.chat.completions.create({
        messages: formattedMessages,
        model,
        stream: isStream,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
      });

      // Race request against abort signal
      const response = await Promise.race([
        requestPromise,
        new Promise((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error("Request timed out."));
          });
        })
      ]);

      clearTimeout(timeoutId);
      return response;

    } catch (err) {
      console.error(`groqService: Attempt failed (attempts remaining: ${retries}). Error: ${err.message}`);
      retries--;
      
      if (retries < 0) {
        if (err.name === "AbortError" || err.message === "Request timed out.") {
          throw new Error("Groq API response timed out. Please try again.");
        }
        throw new Error(`Groq API Error: ${err.message}`);
      }
      
      // Delay before retrying (exponential backoff helper)
      await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
    }
  }
};

/**
 * Reusable function to generate vision response using the Llama 3.2 vision model on Groq.
 * 
 * @param {Buffer} imageBuffer - Buffer containing the image file.
 * @param {string} mimetype - The mime type of the image.
 * @param {string} prompt - Prompt/instruction text.
 * @param {Object} options - Custom parameters (e.g., model)
 * @returns {Promise<string>} - The string reply from the model
 */
export const generateVisionResponse = async (imageBuffer, mimetype, prompt, options = {}) => {
  if (!imageBuffer || !mimetype) {
    throw new Error("Validation failed: imageBuffer and mimetype are required.");
  }

  const base64Image = imageBuffer.toString("base64");
  const groq = getGroqClient();
  const model = options.model || "meta-llama/llama-4-scout-17b-16e-instruct";

  const response = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimetype};base64,${base64Image}`
            }
          }
        ]
      }
    ],
    temperature: options.temperature || 0.7,
    max_tokens: 1024
  });

  return response.choices[0]?.message?.content || "";
};
