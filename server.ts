import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder (as specified in Production Directives)
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

interface ContentItem {
  role: "user" | "model";
  content: string;
}

async function generateContentWithFallback(
  contents: string | any[],
  systemInstruction?: string,
  responseSchemaJson?: boolean
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (responseSchemaJson) {
        config.responseMimeType = "application/json";
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      const responseText = response.text || "";
      if (responseText.trim().length > 0) {
        return { text: responseText, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Failed with model ${model}:`, err?.message || err);
      lastError = err;
      // Continue to next model in fallback ladder
    }
  }

  throw new Error(
    `All models in fallback ladder failed. Last error: ${lastError?.message || "Unknown error"}`
  );
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Prompt generator for daily reflection seeds
app.post("/api/gemini/prompt-ideas", async (req: Request, res: Response) => {
  try {
    const rawBody = req.body && typeof req.body === "object" ? req.body : {};
    const category = typeof rawBody.category === "string" ? rawBody.category.trim() : "general";

    const systemPrompt = `You are a thoughtful, empathetic mindful journaling coach. Generate 4 distinct, evocative reflection prompts for the category "${category}". 
Return ONLY valid JSON matching this structure:
{
  "prompts": [
    {
      "id": "1",
      "title": "Short title",
      "question": "Deep reflective question",
      "guidance": "Brief tip on what to explore"
    }
  ]
}`;

    const { text, modelUsed } = await generateContentWithFallback(
      `Generate 4 fresh reflection prompts for category: ${category}`,
      systemPrompt,
      true
    );

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = {
        prompts: [
          {
            id: "1",
            title: "Daily Flow",
            question: "What energized you most today, and what drained your focus?",
            guidance: "Reflect on specific moments and conversations.",
          },
        ],
      };
    }

    return res.json({ success: true, ...parsed, modelUsed });
  } catch (err: any) {
    console.error("Error generating prompt ideas:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate prompt ideas",
    });
  }
});

// Multi-turn reflection & synthesis endpoint
app.post("/api/gemini/reflect", async (req: Request, res: Response) => {
  try {
    // 2. Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];
    const mode = typeof body.mode === "string" ? body.mode : "reflect"; // 'reflect' | 'summarize' | 'brainstorm' | 'action_items'
    const entryTitle = typeof body.title === "string" ? body.title : "Untitled Reflection";

    if (!prompt && history.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Prompt or conversation history is required.",
      });
    }

    // Build structured Gemini contents
    const contents: any[] = [];
    for (const item of history) {
      if (item && typeof item.content === "string" && item.content.trim()) {
        contents.push({
          role: item.role === "model" ? "model" : "user",
          parts: [{ text: item.content }],
        });
      }
    }

    if (prompt) {
      contents.push({
        role: "user",
        parts: [{ text: prompt }],
      });
    }

    const systemInstruction = `You are an elite, empathetic reflection partner and journaling assistant.
Your goal is to guide the user in deep personal or professional reflection, intellectual inquiry, and constructive clarity.

Current interaction mode: ${mode.toUpperCase()}
Entry context title: "${entryTitle}"

Mode Guidelines:
- REFLECT: Listen deeply, provide thoughtful reflections, mirror core emotions, gently challenge blind spots, and ask 1-2 open-ended deepening questions.
- SUMMARIZE: Synthesize the key themes, emotional arcs, decisions, and takeaways in structured clarity.
- BRAINSTORM: Expand on the user's thoughts with divergent creative possibilities, structured angles, and unexpected synergies.
- ACTION_ITEMS: Distill practical, low-friction next steps, habits, or decisions derived from their reflection.

Format your response warmly and with markdown (bold key phrases, bullet points when organizing thoughts).
Keep your tone grounded, encouraging, and perceptive.`;

    const { text: aiReply, modelUsed } = await generateContentWithFallback(
      contents,
      systemInstruction
    );

    // Also generate a concise structured summary & key tags for the entry
    let analysis = {
      summary: "",
      tags: ["Reflection"],
      sentiment: "Balanced",
      keyInsight: "",
    };

    try {
      const allText = contents.map((c) => c.parts[0]?.text || "").join("\n") + "\n" + aiReply;
      const analysisPrompt = `Given this journal conversation:
---
${allText.slice(0, 3000)}
---
Analyze it and return ONLY JSON with:
{
  "summary": "1-2 sentence high-level executive summary of this reflection",
  "tags": ["3-5 descriptive keyword tags like 'Career', 'Mindset', 'Strategy']",
  "sentiment": "One of: 'Optimistic', 'Introspective', 'Challenged', 'Determined', 'Grateful', 'Curious', 'Balanced'",
  "keyInsight": "The single most actionable or profound takeaway in 1 sentence",
  "suggestedTitle": "A captivating, concise 3-5 word title for this entry"
}`;

      const { text: analysisRaw } = await generateContentWithFallback(
        analysisPrompt,
        "You are an analytical summarizer. Output strictly valid JSON.",
        true
      );
      const parsed = JSON.parse(analysisRaw);
      analysis = {
        summary: parsed.summary || "",
        tags: Array.isArray(parsed.tags) ? parsed.tags : ["Reflection"],
        sentiment: parsed.sentiment || "Balanced",
        keyInsight: parsed.keyInsight || "",
        ...(parsed.suggestedTitle ? { suggestedTitle: parsed.suggestedTitle } : {}),
      } as any;
    } catch (analysisErr) {
      console.warn("Failed to generate secondary analysis JSON, using fallback:", analysisErr);
      analysis = {
        summary: aiReply.slice(0, 160) + "...",
        tags: ["Reflection", mode],
        sentiment: "Introspective",
        keyInsight: "Ongoing reflection and mindful dialogue with Gemini.",
      };
    }

    return res.json({
      success: true,
      reply: aiReply,
      modelUsed,
      analysis,
    });
  } catch (err: any) {
    console.error("Error in /api/gemini/reflect:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to process reflection with Gemini.",
    });
  }
});

// Vite Middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
