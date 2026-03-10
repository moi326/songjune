
const generatorBtn = document.getElementById("generator-btn");
const lottoDisplay = document.querySelector(".lotto-display");
const historyList = document.getElementById("history-list");

generatorBtn.addEventListener("click", () => {
    lottoDisplay.innerHTML = "";
    const numbers = [];
    while (numbers.length < 6) {
        const randomNumber = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(randomNumber)) {
            numbers.push(randomNumber);
        }
    }

    numbers.sort((a, b) => a - b);

    for (const number of numbers) {
        const lottoBall = document.createElement("div");
        lottoBall.classList.add("lotto-ball");
        lottoBall.textContent = number;
        lottoDisplay.appendChild(lottoBall);
    }

    const historyItem = document.createElement("li");
    historyItem.textContent = numbers.join(", ");
    historyList.appendChild(historyItem);
});
