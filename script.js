let liveCards = {}; // JSONデータを格納

// JSON を読み込んでプルダウンに反映
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

// ライブカード選択用のプルダウンを初期化
function initializeDropdowns() {
    const cardSelectors = ["card1", "card2", "card3"];
    cardSelectors.forEach(id => {
        let select = document.getElementById(id);
        select.innerHTML = ""; // 初期化

        let defaultOption = document.createElement("option");
        defaultOption.value = "手入力";
        defaultOption.textContent = "手入力";
        select.appendChild(defaultOption);

        Object.keys(liveCards).forEach(card => {
            let option = document.createElement("option");
            option.value = card;
            option.textContent = card;
            select.appendChild(option);
        });
    });
}

// ライブカードの選択に応じて必要なハート数を更新
function updateHeartRequirements() {
    let totalHearts = { 桃: 0, 赤: 0, 黄: 0, 緑: 0, 青: 0, 紫: 0, 灰: 0 };
    let isManualInput = false; // 手入力モード判定

    ["card1", "card2", "card3"].forEach(id => {
        let selectedCard = document.getElementById(id).value;
        if (selectedCard === "手入力") {
            isManualInput = true;
        } else {
            let cardData = liveCards[selectedCard] || {};
            Object.keys(totalHearts).forEach(color => {
                totalHearts[color] += cardData[color] || 0;
            });
        }
    });

    // 手入力モードなら現在の値を保持
    if (!isManualInput) {
        Object.keys(totalHearts).forEach(color => {
            document.getElementById(`need_${getColorKey(color)}`).value = totalHearts[color];
        });
    }
}

// 色名をキーに変換
function getColorKey(color) {
    return { 桃: "pink", 赤: "red", 黄: "yellow", 緑: "green", 青: "blue", 紫: "purple", 灰: "gray" }[color];
}

// **ハートの不足数を計算する関数**
function calculateRequiredHearts() {
    // 必要なハート数
    let requiredHearts = {
        pink: parseInt(document.getElementById("need_pink").value, 10) || 0,
        red: parseInt(document.getElementById("need_red").value, 10) || 0,
        yellow: parseInt(document.getElementById("need_yellow").value, 10) || 0,
        green: parseInt(document.getElementById("need_green").value, 10) || 0,
        blue: parseInt(document.getElementById("need_blue").value, 10) || 0,
        purple: parseInt(document.getElementById("need_purple").value, 10) || 0,
        gray: parseInt(document.getElementById("need_gray").value, 10) || 0
    };

    // 持っているハート数（ALL はどの色でも使える）
    let availableHearts = {
        pink: parseInt(document.getElementById("have_pink").value, 10) || 0,
        red: parseInt(document.getElementById("have_red").value, 10) || 0,
        yellow: parseInt(document.getElementById("have_yellow").value, 10) || 0,
        green: parseInt(document.getElementById("have_green").value, 10) || 0,
        blue: parseInt(document.getElementById("have_blue").value, 10) || 0,
        purple: parseInt(document.getElementById("have_purple").value, 10) || 0,
        all: parseInt(document.getElementById("have_all").value, 10) || 0
    };

    // **1. 灰色以外のハートを自分の場のハートで埋める**
    let missingHearts = { pink: 0, red: 0, yellow: 0, green: 0, blue: 0, purple: 0 };
    
    for (let color of ["pink", "red", "yellow", "green", "blue", "purple"]) {
        if (availableHearts[color] >= requiredHearts[color]) {
            availableHearts[color] -= requiredHearts[color]; // 必要分を消費
        } else {
            missingHearts[color] = requiredHearts[color] - availableHearts[color]; // 足りない数を記録
            availableHearts[color] = 0; // すべて消費
        }
    }

    // **2. 不足している色を ALL で埋める**
    for (let color of ["pink", "red", "yellow", "green", "blue", "purple"]) {
        if (availableHearts.all <= 0) break;
        let needed = missingHearts[color];
        let usedAll = Math.min(availableHearts.all, needed);
        missingHearts[color] -= usedAll;
        availableHearts.all -= usedAll;
    }

    // **3. 灰のハートを埋める**
    let remainingGray = requiredHearts.gray;

    // まだ使用していないハートで灰色を埋める
    for (let color of ["pink", "red", "yellow", "green", "blue", "purple"]) {
        if (remainingGray <= 0) break;
        let usedGray = Math.min(availableHearts[color], remainingGray);
        remainingGray -= usedGray;
        availableHearts[color] -= usedGray;
    }

    // **4. 残った ALL で灰色を埋める**
    let finalAllUsed = Math.min(availableHearts.all, remainingGray);
    remainingGray -= finalAllUsed;
    availableHearts.all -= finalAllUsed;

    // **5. ここまでで足りないハートがある場合、不足分を表示**
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
            resultText += `🩶 ${remainingGray}個（任意の色）<br>`;
        }
    }

    document.getElementById("result").innerHTML = resultText;
}

// 絵文字を取得する関数
function getColorEmoji(color) {
    return { pink: "🩷", red: "❤️", yellow: "💛", green: "💚", blue: "💙", purple: "💜" }[color];
}

// 初期化
document.addEventListener("DOMContentLoaded", () => {
    loadLiveCards();
});
