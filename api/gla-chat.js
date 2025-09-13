export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { message } = req.body || {};
  if (!message) {
    res.status(400).json({ error: 'Missing message' });
    return;
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          { role: "system", content: "You are Global Legal Advisor, a professional cross-border legal consultant. Provide structured, strategic, and clear insights." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content || "No reply generated.";
    res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
