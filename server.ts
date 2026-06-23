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

  // 1. GPTC Assistant Chat API Endpoint
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

      const systemInstruction = `You are GPTC Assistant, the official AI Chat Assistant for Govt Polytechnic College Kaduthuruthy (located in Kerala, India).
Your sole purpose is assisting students, visitors, faculty members, and coordinators.

STRICT LAWS OF COGNITION:
1. SCOPE BOUNDARY: You must ONLY answer inquiries about Govt Polytechnic College Kaduthuruthy (GPC Kaduthuruthy), including its departments, staff, current notices, assignments, download keys, student records, student attendance logs/percentages, syllabus notes, question sheets, and blood bank donors.
2. OUT-OF-SCOPE INSTRUCTIONS: For any question that is not specifically about Govt Polytechnic College Kaduthuruthy (e.g. "Write me a Python program for sorting", "What is the capital of France?", "Teach me quantum mechanics", "Who is Isaac Newton?"), you MUST refuse and reply with this exact sentence:
"I am GPTC Assistant and can only answer questions related to Govt Polytechnic College Kaduthuruthy and information available in the GPTC Connect database."
Do not add anything else. Do not provide hints. Do not apologize. Simply return that string.

3. CONTEXT INTEGRITY: Below is the actual live database context currently active on campus. Use this context to answer queries accurately, including student attendance details, monthly statistics, or students with attendance shortages below 75%. If the information isn't in the provided context and you are unsure, state clearly that you don't have that specific record, and suggest they contact the respective department HOD.
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
        message: e.message || "An unexpected error occurred while communicating with GPTC Assistant."
      });
    }
  });

  // 2. Server-side Complaint Submission (bypasses Firestore client security rules)
  app.post("/api/submit-complaint", async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.title || !payload.description || !payload.name || !payload.phoneNumber) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Missing required complaint fields." });
        return;
      }

      // Dynamically import firebase-admin to avoid top-level issues
      const admin = await import("firebase-admin").catch(() => null);
      if (!admin) {
        res.status(500).json({ error: "SERVER_ERROR", message: "Firebase Admin not available." });
        return;
      }

      // Initialize admin app only once
      if (!admin.apps || admin.apps.length === 0) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          : null;
        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } else {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: "ai-studio-applet-webapp-d8652",
          });
        }
      }

      const db = admin.firestore();
      db.settings({ databaseId: "ai-studio-40f6a32a-42e4-4283-89a7-890d8e65cc7e" });

      const docRef = db.collection("complaints").doc();
      const complaintId = docRef.id;
      const timestamp = new Date().toISOString();

      await docRef.set({
        ...payload,
        complaintId,
        id: complaintId,
        createdAt: timestamp,
        submittedAt: timestamp,
        updatedAt: timestamp,
        status: "Pending",
      });

      res.json({ success: true, complaintId });
    } catch (err: any) {
      console.error("[Complaint Submit API] Error:", err);
      res.status(500).json({ error: "SERVER_ERROR", message: err.message || "Failed to submit complaint." });
    }
  });

  // 3. Admin Management API routes (Super Admin only — uses Firebase Admin SDK)

  // Helper: lazily initialize and return firebase-admin app
  async function getAdminApp() {
    const admin = await import("firebase-admin").catch(() => null);
    if (!admin) throw new Error("firebase-admin module not available");

    if (!admin.apps || admin.apps.length === 0) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;
      if (serviceAccount) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } else {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: "ai-studio-applet-webapp-d8652",
        });
      }
    }
    return admin;
  }

  // POST /api/create-admin — create Firebase Auth user + adminUsers doc
  app.post("/api/create-admin", async (req, res) => {
    try {
      const { name, email, phone, role, password, createdBy } = req.body;
      if (!name || !email || !role || !password) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Name, email, role, and password are required." });
        return;
      }
      const admin = await getAdminApp();
      const db = admin.firestore();
      db.settings({ databaseId: "ai-studio-40f6a32a-42e4-4283-89a7-890d8e65cc7e" });

      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({ email, password, displayName: name });

      // Write adminUsers doc
      await db.collection("adminUsers").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        name,
        phone: phone || "",
        role,
        suspended: false,
        createdAt: new Date().toISOString(),
        createdBy: createdBy || "super_admin",
      });

      res.json({ success: true, uid: userRecord.uid });
    } catch (err: any) {
      console.error("[Create Admin API] Error:", err);
      if (err.code === "auth/email-already-exists") {
        res.status(409).json({ error: "EMAIL_EXISTS", message: "An account with this email already exists." });
      } else {
        res.status(500).json({ error: "SERVER_ERROR", message: err.message || "Failed to create admin." });
      }
    }
  });

  // POST /api/update-admin — update role, name, phone, suspension, customPermissions
  app.post("/api/update-admin", async (req, res) => {
    try {
      const { uid, updates } = req.body;
      if (!uid || !updates) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "uid and updates are required." });
        return;
      }
      const admin = await getAdminApp();
      const db = admin.firestore();
      db.settings({ databaseId: "ai-studio-40f6a32a-42e4-4283-89a7-890d8e65cc7e" });

      await db.collection("adminUsers").doc(uid).update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // If new displayName provided, update Auth too
      if (updates.name) {
        await admin.auth().updateUser(uid, { displayName: updates.name });
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("[Update Admin API] Error:", err);
      res.status(500).json({ error: "SERVER_ERROR", message: err.message || "Failed to update admin." });
    }
  });

  // POST /api/reset-admin-password — reset password for a given uid
  app.post("/api/reset-admin-password", async (req, res) => {
    try {
      const { uid, newPassword } = req.body;
      if (!uid || !newPassword || newPassword.length < 6) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "uid and a newPassword (min 6 chars) are required." });
        return;
      }
      const admin = await getAdminApp();
      await admin.auth().updateUser(uid, { password: newPassword });
      res.json({ success: true });
    } catch (err: any) {
      console.error("[Reset Password API] Error:", err);
      res.status(500).json({ error: "SERVER_ERROR", message: err.message || "Failed to reset password." });
    }
  });

  // POST /api/delete-admin — delete Firebase Auth user + adminUsers doc
  app.post("/api/delete-admin", async (req, res) => {
    try {
      const { uid } = req.body;
      if (!uid) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "uid is required." });
        return;
      }
      const admin = await getAdminApp();
      const db = admin.firestore();
      db.settings({ databaseId: "ai-studio-40f6a32a-42e4-4283-89a7-890d8e65cc7e" });

      await admin.auth().deleteUser(uid);
      await db.collection("adminUsers").doc(uid).delete();

      res.json({ success: true });
    } catch (err: any) {
      console.error("[Delete Admin API] Error:", err);
      res.status(500).json({ error: "SERVER_ERROR", message: err.message || "Failed to delete admin." });
    }
  });

  // 4. Health check route
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
    console.log(`GPTC Connect server online on http://0.0.0.0:${PORT} [NODE_ENV=${process.env.NODE_ENV || 'dev'}]`);
  });
}

startServer();
