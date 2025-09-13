// Vercel serverless function: POST /api/gla-chat
// Receives { message }, calls OpenAI with your server-side API key, returns { reply }.

export default async function handler(req, res) {
  // --- CORS (Squarespace-safe) ---
  const ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (ORIGINS.length === 0 || ORIGINS.includes('*') || ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'Missing message' });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not set' });

    const systemPrompt = `
You are Global Legal Advisor — an international legal consultant for cross-border matters.
Provide structured, professional, and accessible guidance in: International Diplomatic Law,
International Business Law, Criminal Defence, and Civil Litigation. Offer frameworks and
comparative insights across jurisdictions without giving binding country-specific legal advice,
and do not claim to be a licensed attorney. Be authoritative yet approachable. If jurisdiction,
goals, or context are unclear, state assumptions and proceed. Keep legal expertise primary.
Be precise, strategic, and clear.
    `.trim();

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',          // use a strong model you have access to
        temperature: 0.2,
        top_p: 0.9,
        presence_penalty: 0.0,
        frequency_penalty: 0.1,
        max_tokens: 900,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: String(message).trim() }
        ]
      })
    });

    if (!r.ok) {
      const err = await r.text().catch(() => '');
      return res.status(502).json({ error: 'OpenAI error', detail: err });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'I could not generate a reply.';
    return res.status(200).json({ reply });
  } catch (e) {
    console.error('gla-chat error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
