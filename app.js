// Используем LSTM для работы с текстом
const net = new brain.recurrent.LSTM();

// Делаем функцию доступной глобально, чтобы onclick её видел
window.predict = function() {
    const input = document.getElementById('userInput').value.toLowerCase();
    const resultDiv = document.getElementById('result');
    
    if (input.trim() === "") return;

    try {
        const output = net.run(input);
        resultDiv.innerText = output === 'happy' ? "😊 Позитивно" : "😞 Негативно";
    } catch (e) {
        resultDiv.innerText = "Ошибка: Сеть еще не обучена.";
    }
}

async function start() {
    const resultDiv = document.getElementById('result');
    
    try {
        // 1. Загружаем базу знаний
        const response = await fetch('data.json');
        const trainingData = await response.json();

        resultDiv.innerText = "Обучение... подождите (10-20 сек)";

        // 2. Обучаем сеть
        await net.train(trainingData, {
            iterations: 100,
            errorThresh: 0.011,
            log: true
        });

        resultDiv.innerText = "Готов к работе! Введите текст.";
    } catch (error) {
        resultDiv.innerText = "Ошибка загрузки данных или обучения. Проверьте консоль.";
        console.error(error);
    }
}

// Запускаем процесс при загрузке страницы
start();