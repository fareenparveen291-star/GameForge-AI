# GameForge AI v2 — Beginner setup (Hinglish)

## Is version mein kya hai?
- Real AI se browser-game ya Unity C# code generate karne ka interface.
- Generated files ko select, copy aur download karna.
- Browser game ke `index.html` ka sandboxed preview.
- Code + exact error paste karke AI se fix suggestion mangna.
- API key server par rakhi jaati hai, browser HTML mein nahi.

## Zaroori baat
Yeh project ek Node.js server maangta hai. Sirf `public/index.html` ko phone mein open karne se real AI call nahi chalegi. Server ko online host karna hoga. API usage free tier mein limited ho sakti hai; quotas/availability badal sakte hain.

## Setup ka seedha plan
1. ZIP ko kisi Node.js-compatible hosting/editor mein upload karo.
2. Project ke root folder mein `package.json`, `server.js`, `.env.example`, aur `public/index.html` hone chahiye.
3. Hosting settings mein `GEMINI_API_KEY` naam ka **Secret / Environment Variable** banao aur Google AI Studio se apni API key uski value mein rakho.
4. Start command `npm start` rakho. Node.js 18+ chahiye.
5. Hosting logs mein `GameForge AI v2 running on port ...` jaisa message dekho.
6. App khol kar pehle browser-game example generate karo.

## API key safety
- Real key ko chat, public HTML, screenshots, GitHub/public repo, ya kisi aur ko mat bhejna.
- `.env.example` mein placeholder hi rehne do; actual key hosting ke Secrets panel mein daalo.
- API key aur quota ko manage karne ke liye trusted adult ki help lo, kyunki provider terms/account requirements badal sakte hain.
- Agar key kabhi public ho jaaye, use revoke/rotate karo.

## Testing limitations
- Browser preview ek iframe mein HTML chalata hai; har browser API ya external asset kaam nahi karega.
- AI code galat ho sakta hai. Preview/test karo aur code samjhe bina apne device par unknown scripts mat chalao.
- Unity C# scripts is web server par compile nahi hote. Unhe Unity Editor mein test karna hoga, jo aam taur par desktop/laptop par use hota hai.
- “Fix” feature code aur error ko AI ko bhejta hai aur suggested changes deta hai; yeh automatic Unity compilation ya guaranteed repair nahi hai.

## Common errors
- `GEMINI_API_KEY not set`: hosting ke Secret/Environment Variable mein key add karo, phir server restart/redeploy.
- `429`: AI provider ki quota/rate limit ho sakti hai; kuch der baad try karo ya provider dashboard check karo.
- `502` / parse error: prompt chhota karo aur simple first version maango.
- App page khul rahi hai, AI nahi chal raha: check karo ki backend server start hua hai aur `/api/health` endpoint JSON return karta hai.
