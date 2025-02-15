let liveCards = {}; // JSONデータを格納

// **JSONを読み込み、プルダウンを初期化**
async function loadLiveCards() {
    try {
        const response = await fetch("cards.json");
        if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);
        
        liveCards = await response.json();
        initializeDropdowns();
    } catch (error) {
        console.error("ライブカード情報の読み込みに失敗:", error);
    }
}

// **プルダウンをセットアップ**
function initializeDropdowns() {
    const cardSelectors = ["card1", "card2", "card3"];
    cardSelectors.forEach(id => {
        let select = document.getElementById(id);
        select.innerHTML = ""; // 初期化

        let defaultOption = document.createElement("option");
        defaultOption.value = "none";
        defaultOption.textContent = "選択なし";
        select.appendChild(defaultOption);

        Object.keys(liveCards).forEach(card => {
            let option = document.createElement("option");
            option.value = card;
            option.textContent = card;
            select.appendChild(option);
        });
    });
}

// **ボタンを押すと、ライブカードのハート数をフォームに反映**
document.getElementById("applyCards").addEventListener("click", () => {
    let totalHearts = { 桃: 0, 赤: 0, 黄: 0, 緑: 0, 青: 0, 紫: 0, 灰: 0 };

    ["card1", "card2", "card3"].forEach(id => {
        let selectedCard = document.getElementById(id).value;
        if (selectedCard !== "none" && liveCards[selectedCard]) {
            let cardData = liveCards[selectedCard];
            Object.keys(totalHearts).forEach(color => {
                totalHearts[color] += cardData[color] || 0;
            });
        }
    });

    // 必要ハートを更新（ただし手入力も可能）
    Object.keys(totalHearts).forEach(color => {
        document.getElementById(`need_${getColorKey(color)}`).value = totalHearts[color];
    });
});

// **ハート不足数を計算**
function calculateRequiredHearts() {
    let requiredHearts = getHearts("need");
    let availableHearts = getHearts("have");

    let missingHearts = { pink: 0, red: 0, yellow: 0, green: 0, blue: 0, purple: 0 };

    for (let color of ["pink", "red", "yellow", "green", "blue", "purple"]) {
        if (availableHearts[color] >= requiredHearts[color]) {
            availableHearts[color] -= requiredHearts[color];
        } else {
            missingHearts[color] = requiredHearts[color] - availableHearts[color];
            availableHearts[color] = 0;
        }
    }

    for (let color of ["pink", "red", "yellow", "green", "blue", "purple"]) {
        if (availableHearts.all <= 0) break;
        let usedAll = Math.min(availableHearts.all, missingHearts[color]);
        missingHearts[color] -= usedAll;
        availableHearts.all -= usedAll;
    }

    let remainingGray = requiredHearts.gray;

    for (let color of ["pink", "red", "yellow", "green", "blue", "purple"]) {
        if (remainingGray <= 0) break;
        let usedGray = Math.min(availableHearts[color], remainingGray);
        remainingGray -= usedGray;
        availableHearts[color] -= usedGray;
    }

    let finalAllUsed = Math.min(availableHearts.all, remainingGray);
    remainingGray -= finalAllUsed;
    availableHearts.all -= finalAllUsed;

    let resultText = "現在のハートでライブ成功可能です！";
    let totalMissing = Object.values(missingHearts).reduce((sum, val) => sum + val, 0) + remainingGray;

    if (totalMissing > 0) {
        resultText = "ライブ成功には以下のハートが必要です:<br>";
        for (let color in missingHearts) {
            if (missingHearts[color] > 0) {
                resultText += `${getColorEmoji(color)} ${missingHearts[color]}個<br>`;
            }
        }
        if (remainingGray > 0) {
            resultText += `⚫ ${remainingGray}個（任意の色）<br>`;
        }
    }

    document.getElementById("result").innerHTML = resultText;
}

// **ハート情報を取得**
function getHearts(prefix) {
    return {
        pink: parseInt(document.getElementById(`${prefix}_pink`).value, 10) || 0,
        red: parseInt(document.getElementById(`${prefix}_red`).value, 10) || 0,
        yellow: parseInt(document.getElementById(`${prefix}_yellow`).value, 10) || 0,
        green: parseInt(document.getElementById(`${prefix}_green`).value, 10) || 0,
        blue: parseInt(document.getElementById(`${prefix}_blue`).value, 10) || 0,
        purple: parseInt(document.getElementById(`${prefix}_purple`).value, 10) || 0,
        gray: parseInt(document.getElementById(`${prefix}_gray`).value, 10) || 0,
        all: parseInt(document.getElementById("have_all").value, 10) || 0
    };
}

document.addEventListener("DOMContentLoaded", () => {
    loadLiveCards();
});
