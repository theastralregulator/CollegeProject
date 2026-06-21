import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side lazy client for Gemini
  let aiClient: GoogleGenAI | null = null;
  function getAiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        throw new Error("GEMINI_API_KEY is not set. Please add it to your .env file.");
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // 1. CampusAI Assistant Chat API Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, contextSummary, chatHistory } = req.body;
      if (!message) {
        res.status(400).json({ error: "No message string provided." });
        return;
      }

      // Initialize Gemini safely
      let ai;
      try {
        ai = getAiClient();
      } catch (keyErr: any) {
        res.status(400).json({ 
          error: "API_KEY_MISSING", 
          message: keyErr.message || "Please provide GEMINI_API_KEY in active environment settings."
        });
        return;
      }

      const systemInstruction = `You are CampusAI, the official AI Voice & Chat Assistant for Govt Polytechnic College Kaduthuruthy (located in Kerala, India).
Your sole purpose is assisting students, visitors, faculty members, and coordinators.

STRICT LAWS OF COGNITION:
1. SCOPE BOUNDARY: You must ONLY answer inquiries about Govt Polytechnic College Kaduthuruthy (GPC Kaduthuruthy), including its departments, staff, current notices, assignments, download keys, student records, syllabus notes, question sheets, and blood bank donors.
2. OUT-OF-SCOPE INSTRUCTIONS: For any question that is not specifically about Govt Polytechnic College Kaduthuruthy (e.g. "Write me a Python program for sorting", "What is the capital of France?", "Teach me quantum mechanics", "Who is Isaac Newton?"), you MUST refuse and reply with this exact sentence:
"I am CampusAI and can only answer questions related to Govt Polytechnic College Kaduthuruthy and information available in the CampusAI database."
Do not add anything else. Do not provide hints. Do not apologize. Simply return that string.

3. CONTEXT INTEGRITY: Below is the actual live database context currently active on campus. Use this context to answer queries accurately. If the information isn't in the provided context and you are unsure, state clearly that you don't have that specific record, and suggest they contact the respective department HOD.
4. Keep the formatting neat and responsive. Use markdown bullet points and short blocks.

----------------------------------------------
LIVE CAMPUS DATABASE CONTEXT:
${contextSummary || "Default: Govt Polytechnic College Kaduthuruthy offers Diploma programs in Computer, Electronics, and Computer Hardware Engineering."}
------------------------------
`;

      const contents = [];
      
      // Load previous chat history if provided
      if (chatHistory && Array.isArray(chatHistory)) {
        for (const turn of chatHistory) {
          contents.push({
            role: turn.role,
            parts: [{ text: turn.text }]
          });
        }
      }

      // Append current user message
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      // Execute generation with gemini-2.5-flash
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.1, // Low temperature to maintain strict scope enforcement
          maxOutputTokens: 800,
        }
      });

      const replyText = response.text || "No response generated.";
      res.json({ reply: replyText });

    } catch (e: any) {
      console.error("Gemini API server failure:", e);
      res.status(500).json({ 
        error: "SERVER_ERROR", 
        message: e.message || "An unexpected error occurred while communicating with CampusAI."
      });
    }
  });

  // 2. Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // 3. Vite asset-server configuration / Static Asset Handlers
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CampusAI server online on http://0.0.0.0:${PORT} [NODE_ENV=${process.env.NODE_ENV || 'dev'}]`);
  });
}

startServer();
