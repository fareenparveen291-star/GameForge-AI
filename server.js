const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/test', (req,res) => {
  res.json({ ok: true, hasKey: !!process.env.GEMINI_API_KEY });
});

app.post('/api/generate', async (req, res) => {
  try {
    const userIdea = req.body.prompt || req.body.genre || "fun arcade game";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Key missing in Render Environment' });

    const promptText = `Create a playable HTML5 game for idea: ${userIdea}. Return ONLY JSON: {"title":"...","description":"...","html":"<html>...</html>"}. html must be full single file game with canvas, style, script, keyboard controls. No markdown, only JSON.`;

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    const d = await r.json();
    let t = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    t = t.replace(/```json|```/g,'').trim();
    const j = JSON.parse(t);
    res.json(j);
  } catch(e){
    console.error(e);
    res.status(500).json({ error: 'AI failed', details: e.message });
  }
});

app.get('*', (req,res) => res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT, ()=>console.log('Live on '+PORT));
