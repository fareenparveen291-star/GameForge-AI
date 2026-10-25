import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_RULES = `
You are GameForge AI, a careful game-programming assistant for a beginner.
Create original, educational game code. Do not claim that code was tested unless it actually was.
Return ONLY valid JSON with this exact shape:
{
  "projectName": "short name",
  "summary": "short plain-language explanation",
  "files": [
    {"name": "index.html", "language": "html", "code": "complete file contents"}
  ],
  "runSteps": ["step one", "step two"],
  "tests": ["manual test to perform"]
}
Rules:
- Include complete code, not ellipses or placeholders.
- Use simple, maintainable code and comments.
- For browser games, provide a complete self-contained index.html with CSS and JavaScript included, so it can run in a browser iframe.
- For Unity, provide appropriate C# scripts and a README with setup instructions. Unity projects cannot be compiled by this hosted web server; clearly say the scripts need Unity Editor testing.
- Keep file names safe and simple. No external paid assets, trackers, or secrets.
- If a request is too large, make a small playable first version and list what is not included.
- Do not add features unrelated to the prompt.
`;

async function callGemini(userPrompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "PASTE_YOUR_KEY_IN_SERVER_ENVIRONMENT") {
    const err = new Error("Server par GEMINI_API_KEY set nahi hai. Hosting ke Secrets/Environment Variables mein key add karo.");
    err.status = 503;
    throw err;
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_RULES }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 12000
        }
      })
    }
  );

  const raw = await response.text();
  let payload;
  try { payload = JSON.parse(raw); } catch { payload = {}; }

  if (!response.ok) {
    const apiMessage = payload?.error?.message || `AI service error (${response.status})`;
    const err = new Error(apiMessage);
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }

  const generated = payload?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("")
    .trim();

  if (!generated) {
    const err = new Error("AI ne empty response diya. Prompt chhota karke dobara try karo.");
    err.status = 502;
    throw err;
  }

  try {
    return JSON.parse(generated);
  } catch {
    // A small recovery attempt for occasional fenced JSON output.
    const cleaned = generated.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try { return JSON.parse(cleaned); } catch {
      const err = new Error("AI response ko file format mein parse nahi kar paya. Dobara Generate dabao.");
      err.status = 502;
      throw err;
    }
  }
}

app.post("/api/generate", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    const platform = req.body?.platform === "unity" ? "Unity C#" : "Browser HTML/CSS/JavaScript";
    if (prompt.length < 8) {
      return res.status(400).json({ error: "Game ka prompt thoda detail mein likho (kam se kam 8 characters)." });
    }
    if (prompt.length > 4000) {
      return res.status(400).json({ error: "Prompt bahut lamba hai. Use 4000 characters se chhota rakho." });
    }
    const result = await callGemini(
      `Target platform: ${platform}\nUser's game request:\n${prompt}\nGenerate a small first version that matches the target platform.`
    );
    if (!Array.isArray(result.files) || result.files.length === 0) {
      return res.status(502).json({ error: "AI response mein files nahi mile. Dobara try karo." });
    }
    const safeFiles = result.files.slice(0, 12).map((f, i) => ({
      name: String(f.name || `file-${i + 1}.txt`).replace(/[\\/:*?"<>|]/g, "_").slice(0, 80),
      language: String(f.language || "text").slice(0, 30),
      code: String(f.code || "").slice(0, 180000)
    }));
    res.json({
      projectName: String(result.projectName || "My Game").slice(0, 100),
      summary: String(result.summary || ""),
      files: safeFiles,
      runSteps: Array.isArray(result.runSteps) ? result.runSteps.map(String).slice(0, 10) : [],
      tests: Array.isArray(result.tests) ? result.tests.map(String).slice(0, 10) : []
    });
  } catch (error) {
    console.error("Generate error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Unknown server error." });
  }
});

app.post("/api/fix", async (req, res) => {
  try {
    const code = String(req.body?.code || "").trim();
    const errorText = String(req.body?.error || "").trim();
    const platform = req.body?.platform === "unity" ? "Unity C#" : "Browser HTML/CSS/JavaScript";
    if (!code || !errorText) {
      return res.status(400).json({ error: "Code aur error message dono paste karo." });
    }
    if (code.length > 30000 || errorText.length > 5000) {
      return res.status(400).json({ error: "Code ya error bahut lamba hai. Chhota relevant part paste karo." });
    }
    const result = await callGemini(
      `Target platform: ${platform}\nPlease diagnose and fix the code below.\nReturn the same JSON file format as usual. Explain the likely cause in summary, provide complete corrected file(s), and list tests to run.\n\nERROR:\n${errorText}\n\nCODE:\n${code}`
    );
    res.json(result);
  } catch (error) {
    console.error("Fix error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Unknown server error." });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

app.listen(PORT, () => {
  console.log(`GameForge AI v2 running on port ${PORT}`);
});
