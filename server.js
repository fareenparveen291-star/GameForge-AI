const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, genre } = req.body;
    const userPrompt = prompt || genre || "fun arcade game";
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not set in Render' });
    }

    const systemPrompt = `
You are GameForge AI. Create a complete playable HTML5 game in SINGLE HTML file.
User Idea: "${userPrompt}"

RULES:
- Return ONLY valid JSON like this: {"title":"Game Name","description":"short desc","html":"<html>...</html>"}
- The html field must be a FULL playable game using <canvas> or <div>, with <style> and <script> inside. Use arrow keys / WASD / touch.
- No external libraries, no external images. Keep it simple but fun and completable.
- Make sure html is escaped properly in JSON string.
- DO NOT add markdown, ONLY raw JSON.
`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8000 }
      })
    });

    const data = await geminiRes.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean markdown if AI added ```json
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const json = JSON.parse(text);
    res.json(json);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI generation failed', details: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log('GameForge AI Live on', PORT));
