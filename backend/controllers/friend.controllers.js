import { generateAIResponse } from "../services/groqService.js";

// Controller for AI Friend chat assistant with streaming and context memory
export const chatWithFriend = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: "Valid messages array is required." });
  }

  // Set headers for Server-Sent Events (SSE) streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Establish the SSE connection immediately

  // Define systemic friend personality guidelines
  const systemPrompt = "You are a warm, casual, extremely supportive, and fun companion named 'Friend' on the Connectly platform. " +
                       "You talk like a real human friend (using emojis like 💜, 🌟, ✨, 🤔, etc.). " +
                       "Avoid looking like a customer support assistant or robotic engine. Be empathetic, friendly, and engaging. " +
                       "Keep paragraphs short. Use markdown formatting and lists when helpful. " +
                       "If code block syntax is used, make sure to format it cleanly using markdown.";

  try {
    // Call Groq service with the message history array
    const chatStream = await generateAIResponse(messages, {
      systemPrompt,
      stream: true,
      rateLimitKey: "friend-chat-stream"
    });

    for await (const chunk of chatStream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    return res.end();

  } catch (err) {
    console.error("friend controller error using groqService:", err.message);
    res.write(`data: ${JSON.stringify({ content: " Sorry about that, I got a bit dizzy there. Can you repeat that? 💜" })}\n\n`);
    res.write("data: [DONE]\n\n");
    return res.end();
  }
};
