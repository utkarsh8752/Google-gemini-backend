import { GoogleGenAI } from "@google/genai";
import Message from "../models/Message.js";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = "gemini-2.5-flash";

const generate = async (prompt) => {
  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  return response.text;
};

export const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const userId = req.user.sub;

    await Message.create({
      userId,
      role: "user",
      text: message,
    });

    const answer = await generate(message);

    await Message.create({
      userId,
      role: "bot",
      text: answer,
    });

    res.json({
      success: true,
      answer,
      user: req.user,
    });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to generate response",
    });
  }
};

export const history = async (req, res) => {
  try {
    const items = await Message.find({ userId: req.user.sub })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("role text createdAt -_id")
      .lean();

    return res.json({
      history: items.reverse().map((m) => ({
        role: m.role,
        text: m.text,
        ts: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("History error:", err);
    return res.status(500).json({ error: "Failed to load history" });
  }
};

export const clearHistory = async (req, res) => {
  try {
    await Message.deleteMany({ userId: req.user.sub });
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete history error:", err);
    return res.status(500).json({ error: "Failed to clear history" });
  }
};

// backward compatibility: public chat without auth (no history)
export const publicChat = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }
    const answer = await generate(question);
    return res.json({ success: true, answer });
  } catch (err) {
    console.error("Gemini Error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to generate response" });
  }
};
