const net = new brain.recurrent.LSTM(); // Используем LSTM для работы с текстом

async function start() {
    const result Div = document.getElementById('result');
    
    // 1. Загружаем базу знаний
    const response = await fetch('data.json');
    const trainingData = await response.json();

    // 2. Обучаем сеть (это может занять 10-20 секунд)
    net.train(trainingData, {
        iterations: 100, // Количество проходов
        errorThresh: 0.011,
        log: true       // Видеть процесс в консоли браузера
    });

    resultDiv.innerText = "Готов к работе!";
}

function predict() {
    const input = document.getElementById('userInput').value.toLowerCase();
    const output = net.run(input);
    
    document.getElementById('result').innerText = 
        output === 'happy' ? "😊 Позитивно" : "🛰 Негативно";
}

start();