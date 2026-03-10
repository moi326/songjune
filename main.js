const generatorBtn = document.getElementById("generator-btn");
const lottoDisplay = document.querySelector(".lotto-display");
const historyList = document.getElementById("history-list");
const themeBtn = document.getElementById("theme-btn");

// Theme management
const currentTheme = localStorage.getItem("theme") || "light";
if (currentTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeBtn.textContent = "☀️ Light Mode";
}

themeBtn.addEventListener("click", () => {
    let theme = document.documentElement.getAttribute("data-theme");
    if (theme === "dark") {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
        themeBtn.textContent = "🌙 Dark Mode";
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        themeBtn.textContent = "☀️ Light Mode";
    }
});

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
        
        // Add color based on number range
        if (number <= 10) lottoBall.classList.add("ball-yellow");
        else if (number <= 20) lottoBall.classList.add("ball-blue");
        else if (number <= 30) lottoBall.classList.add("ball-red");
        else if (number <= 40) lottoBall.classList.add("ball-gray");
        else lottoBall.classList.add("ball-green");

        lottoBall.textContent = number;
        lottoDisplay.appendChild(lottoBall);
    }

    const historyItem = document.createElement("li");
    historyItem.textContent = numbers.join(", ");
    // Add to top of history
    if (historyList.firstChild) {
        historyList.insertBefore(historyItem, historyList.firstChild);
    } else {
        historyList.appendChild(historyItem);
    }
});
