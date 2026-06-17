import fs from "fs";
import { generateVisionResponse } from "../services/groqService.js";

/**
 * Controller to generate AI post captions using Groq's Vision Model.
 * Expects:
 * - req.file: The uploaded image file (via multer)
 * - req.body.vibe: Optional prompt or vibe direction from the user
 */
export const generateCaption = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file uploaded." });
  }

  const filePath = req.file.path;
  const userVibe = req.body.vibe || req.body.prompt || "";

  try {
    // 1. Read file to buffer
    const buffer = fs.readFileSync(filePath);
    const mimetype = req.file.mimetype;

    // 2. Prepare the vision model prompt
    const prompt = `Analyze this image and generate 5 creative, highly engaging social media captions.
The 5 caption types must be:
- Short: A punchy, brief caption (ideally under 10 words).
- Medium: A standard engaging caption (1-2 sentences).
- Viral: A catchy, trend-style caption with high clickability (use relevant emojis/hashtags).
- Professional: A clean, formal, or inspiring business-like caption.
- Funny: A witty, humorous, or playful caption.

${userVibe ? `Crucial direction: The user requests the captions to have this vibe/style: "${userVibe}"` : ""}

You MUST return the output as a valid JSON object matching exactly this schema:
{
  "captions": [
    { "type": "Short", "text": "your short caption text here" },
    { "type": "Medium", "text": "your medium caption text here" },
    { "type": "Viral", "text": "your viral caption text here" },
    { "type": "Professional", "text": "your professional caption text here" },
    { "type": "Funny", "text": "your funny caption text here" }
  ]
}

Only return raw JSON. Do not include markdown code block syntax, any explanations, preambles, or postscripts.`;

    // 3. Call Groq Service
    const aiResponseText = await generateVisionResponse(buffer, mimetype, prompt);

    // 4. Parse JSON with cleanup fallback (sometimes models wrap in markdown ```json)
    let cleanedResponse = aiResponseText.trim();
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
    }

    const parsedData = JSON.parse(cleanedResponse);

    if (!parsedData || !Array.isArray(parsedData.captions)) {
      throw new Error("Invalid response format received from Groq AI service.");
    }

    return res.status(200).json({
      success: true,
      captions: parsedData.captions
    });

  } catch (error) {
    console.error("Error generating captions:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate captions. Please try again."
    });
  } finally {
    // 5. Clean up the uploaded file to prevent disk usage leaks
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupError) {
      console.error("Failed to delete temp file:", cleanupError);
    }
  }
};
