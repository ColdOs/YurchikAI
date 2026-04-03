export default async function handler(req, res) {
    // Включаем логи, чтобы видеть ошибки в панели Vercel
    console.log("Method:", req.method);
    console.log("Body:", req.body);

    if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            // Передаем тело запроса. Vercel сам парсит JSON в req.body
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Groq API Error:", data);
            return res.status(response.status).json(data);
        }

        res.status(200).json(data);
    } catch (e) {
        console.error("Fetch error:", e.message);
        res.status(500).json({ error: e.message });
    }
}