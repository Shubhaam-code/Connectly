// Controller for AI Friend chat assistant with streaming and context memory
export const chatWithFriend = async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: "Valid messages array is required." });
  }

  // Set headers for Server-Sent Events (SSE) streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Establish the SSE connection immediately

  if (!apiKey) {
    console.warn("⚠️  OPENROUTER_API_KEY is not defined. Using offline simulated typing responses.");
    // Simulate a friendly typing fallback if no API key is present
    const fallbackMessage = "Hey there! 💜 I'd love to chat, but my connection key seems to be missing. Contact the system administrator to configure OPENROUTER_API_KEY! In the meantime, know that I'm always here for you.";
    
    // Stream fallback message in chunks to simulate typing speed
    const words = fallbackMessage.split(" ");
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? "" : " ") + words[i];
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 60)); // Simulate typing latency
    }
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  // Define systemic friend personality guidelines
  const systemPrompt = {
    role: "system",
    content: "You are a warm, casual, extremely supportive, and fun companion named 'Friend' on the Connectly platform. " +
             "You talk like a real human friend (using emojis like 💜, 🌟, ✨, 🤔, etc.). " +
             "Avoid looking like a customer support assistant or robotic engine. Be empathetic, friendly, and engaging. " +
             "Keep paragraphs short. Use markdown formatting and lists when helpful. " +
             "If code block syntax is used, make sure to format it cleanly using markdown."
  };

  // Limit conversation history to the last 10 messages to maintain speed & context length
  const recentHistory = messages
    .slice(-10)
    .filter(msg => msg.text && msg.text.trim())
    .map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));

  const fullPromptMessages = [systemPrompt, ...recentHistory];

  let retries = 2;
  let streamStarted = false;

  while (retries >= 0) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://connectly.app",
          "X-Title": "Connectly"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash", // Standard efficient model
          messages: fullPromptMessages,
          stream: true
        }),
        signal: AbortSignal.timeout(12000) // 12-second timeout per attempt
      });

      if (!response.ok) {
        throw new Error(`OpenRouter response error status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine === "data: [DONE]") {
            res.write("data: [DONE]\n\n");
            continue;
          }

          if (cleanLine.startsWith("data: ")) {
            try {
              const jsonStr = cleanLine.slice(6);
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                streamStarted = true;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              // Ignore partial parsing errors of streaming frames
            }
          }
        }
      }

      res.write("data: [DONE]\n\n");
      return res.end();

    } catch (err) {
      console.error(`OpenRouter fetch attempt failed (retries left: ${retries}):`, err.message);
      retries--;
      if (retries < 0 || streamStarted) {
        // Final failure handler: send a friendly message error
        res.write(`data: ${JSON.stringify({ content: " Sorry about that, I got a bit dizzy there. Can you repeat that? 💜" })}\n\n`);
        res.write("data: [DONE]\n\n");
        return res.end();
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay before retry
    }
  }
};
