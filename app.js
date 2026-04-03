let model;
let wordIndex = {}; // Наш словарь (база знаний слов)
const maxLen = 10;   // Максимальная длина фразы

async function prepareData() {
    const response = await fetch('data.json');
    const data = await response.json();

    // 1. Создаем словарь уникальных слов
    let currentIdx = 1;
    data.forEach(item => {
        item.input.split(' ').forEach(word => {
            if (!wordIndex[word]) wordIndex[word] = currentIdx++;
        });
    });

    // 2. Превращаем текст в массивы чисел (Padding)
    const inputs = data.map(item => {
        const sequence = item.input.split(' ').map(word => wordIndex[word] || 0);
        while (sequence.length < maxLen) sequence.push(0); // Добиваем нулями до maxLen
        return sequence;
    });

    const outputs = data.map(item => item.output);

    return {
        x: tf.tensor2d(inputs),
        y: tf.tensor2d(outputs, [outputs.length, 1])
    };
}

async function createModel() {
    model = tf.sequential();
    
    // Слои нейросети
    model.add(tf.layers.embedding({ inputDim: 100, outputDim: 8, inputLength: maxLen }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });
}

async function train() {
    const status = document.getElementById('status');
    const data = await prepareData();
    await createModel();

    status.innerText = "Обучение нейросети...";
    
    await model.fit(data.x, data.y, {
    epochs: 200,          // Сколько раз прогнать через данные
    batchSize: 4,         // Сколько примеров брать за один раз
    shuffle: true,        // Перемешивать данные (очень важно!)
    callbacks: {
        onEpochEnd: (epoch, logs) => {
            console.log(`Эпоха ${epoch}: Точность = ${logs.acc.toFixed(2)}`);
        }
    }
});

    status.innerText = "Готов! Попробуйте ввести фразу из базы.";
}

window.predict = async function() {
    const text = document.getElementById('userInput').value.toLowerCase();
    const sequence = text.split(' ').map(word => wordIndex[word] || 0);
    while (sequence.length < maxLen) sequence.push(0);

    const inputTensor = tf.tensor2d([sequence]);
    const prediction = model.predict(inputTensor);
    const score = (await prediction.data())[0];

    document.getElementById('status').innerText = 
        score > 0.5 ? `😊 Позитив (${(score*100).toFixed(1)}%)` : `😞 Негатив (${(score*100).toFixed(1)}%)`;
}

train();