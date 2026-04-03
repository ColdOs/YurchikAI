let model, wordIndex = {}, db = {};
const maxLen = 10;
const EPOCHS = 150;

async function init() {
    const bar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    const overlay = document.getElementById('training-overlay');

    const res = await fetch('data.json');
    db = await res.json();

    let currentIdx = 1;
    const trainingInputs = [];
    const trainingOutputs = [];

    // Обучаем сеть только на ИНТЕНТАХ (типах фраз)
    db.intents.forEach((intent, idx) => {
        intent.patterns.forEach(phrase => {
            const sequence = phrase.toLowerCase().split(' ').map(word => {
                if (!wordIndex[word]) wordIndex[word] = currentIdx++;
                return wordIndex[word];
            });
            while (sequence.length < maxLen) sequence.push(0);
            trainingInputs.push(sequence);

            const output = new Array(db.intents.length).fill(0);
            output[idx] = 1;
            trainingOutputs.push(output);
        });
    });

    model = tf.sequential();
    model.add(tf.layers.embedding({ inputDim: currentIdx + 50, outputDim: 16, inputLength: maxLen }));
    model.add(tf.layers.globalAveragePooling1d());
    model.add(tf.layers.dense({ units: db.intents.length, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

    await model.fit(tf.tensor2d(trainingInputs), tf.tensor2d(trainingOutputs), {
        epochs: EPOCHS,
        callbacks: {
            onEpochEnd: (epoch) => {
                const percent = Math.round(((epoch + 1) / EPOCHS) * 100);
                bar.style.width = percent + '%';
                statusText.innerText = `Сборка модулей логики: ${percent}%`;
            }
        }
    });

    overlay.style.display = 'none';
}

// Функция поиска темы в тексте
function findTopic(text) {
    for (let topicName in db.topics) {
        const keywords = db.topics[topicName];
        if (keywords.some(keyword => text.includes(keyword))) {
            return topicName;
        }
    }
    return null;
}

window.sendMessage = async function() {
    const inputEl = document.getElementById('userInput');
    const rawText = inputEl.value.trim();
    if (!rawText) return;

    const text = rawText.toLowerCase();
    appendMsg('user', rawText);
    inputEl.value = '';

    // 1. Определяем ТЕМУ простым поиском
    const foundTopic = findTopic(text);

    // 2. Определяем ИНТЕНТ через нейросеть
    const tokens = text.replace(/[^\w\sа-яё]/gi, "").split(' ');
    const sequence = tokens.map(w => wordIndex[w] || 0);
    while (sequence.length < maxLen) sequence.push(0);

    const prediction = model.predict(tf.tensor2d([sequence]));
    const results = await prediction.data();
    const maxIdx = results.indexOf(Math.max(...results));
    const confidence = results[maxIdx];

    setTimeout(() => {
        let response;

        if (confidence > 0.4) {
            const intent = db.intents[maxIdx];
            // Выбираем случайный шаблон для этого интента
            let template = intent.templates[Math.floor(Math.random() * intent.templates.length)];
            
            // Если тема найдена — подставляем её, если нет — используем общую заглушку
            const topicLabel = foundTopic ? foundTopic : "эти вещи";
            response = template.replace("{topic}", topicLabel);
        } else {
            response = "Интересно... Расскажи подробнее, я фиксирую это в базе.";
        }

        appendMsg('ai', response);
    }, 400);
}

function appendMsg(role, text) {
    const chat = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.innerText = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

init();