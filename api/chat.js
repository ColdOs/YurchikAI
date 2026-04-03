export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Достаем сообщение. Добавим проверку, чтобы точно не было пустоты
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Поле message пустое" });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Отвечай на русском языке. Пиши простым текстом без Markdown." },
                    { role: "user", content: String(message) } // Принудительно превращаем в строку
                ]
            })
        });

        const data = await response.json();
        
        // Если Groq вернул ошибку, пробросим её в консоль
        if (data.error) {
            console.error("Groq Error:", data.error);
            return res.status(500).json(data);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
}