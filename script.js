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
function applySelectedCards() {
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
        let inputField = document.getElementById(`need_${getColorKey(color)}`);
        inputField.value = totalHearts[color];
    });
}

// **ハート不足数を計算**
function calculateRequiredHearts() {
    // 必要なハート数（ライブカード）
    let requiredHearts = {
        桃: parseInt(document.getElementById("need_pink").value, 10) || 0,
        赤: parseInt(document.getElementById("need_red").value, 10) || 0,
        黄: parseInt(document.getElementById("need_yellow").value, 10) || 0,
        緑: parseInt(document.getElementById("need_green").value, 10) || 0,
        青: parseInt(document.getElementById("need_blue").value, 10) || 0,
        紫: parseInt(document.getElementById("need_purple").value, 10) || 0,
        灰: parseInt(document.getElementById("need_gray").value, 10) || 0 // 任意の色が必要
    };
    // 持っているハート数（ALL はどの色でも使える）
    let availableHearts = {
        桃: parseInt(document.getElementById("have_pink").value, 10) || 0,
        赤: parseInt(document.getElementById("have_red").value, 10) || 0,
        黄: parseInt(document.getElementById("have_yellow").value, 10) || 0,
        緑: parseInt(document.getElementById("have_green").value, 10) || 0,
        青: parseInt(document.getElementById("have_blue").value, 10) || 0,
        紫: parseInt(document.getElementById("have_purple").value, 10) || 0,
        ALL: parseInt(document.getElementById("have_all").value, 10) || 0 // ALL はどの色でも使える
    };
    // 絵文字の対応表
    let heartEmojis = {
        桃: "🩷", 赤: "❤️", 黄: "💛", 緑: "💚", 青: "💙", 紫: "💜", 灰: "🩶"
    };
    // **1. 灰色以外のハートを自分の場のハートで埋める**
    let missingHearts = { 桃: 0, 赤: 0, 黄: 0, 緑: 0, 青: 0, 紫: 0 };
    
    for (let color of ["桃", "赤", "黄", "緑", "青", "紫"]) {
        if (availableHearts[color] >= requiredHearts[color]) {
            availableHearts[color] -= requiredHearts[color]; // 必要分を消費
        } else {
            missingHearts[color] = requiredHearts[color] - availableHearts[color]; // 足りない数を記録
            availableHearts[color] = 0; // すべて消費
        }
    }
    // **2. 不足している色を ALL で埋める**
    for (let color of ["桃", "赤", "黄", "緑", "青", "紫"]) {
        if (availableHearts.ALL <= 0) break;
        let needed = missingHearts[color];
        let usedAll = Math.min(availableHearts.ALL, needed);
        missingHearts[color] -= usedAll;
        availableHearts.ALL -= usedAll;
    }
    // **3. 灰のハートを埋める**
    let remainingGray = requiredHearts.灰;
    // まだ使用していないハートで灰色を埋める
    for (let color of ["桃", "赤", "黄", "緑", "青", "紫"]) {
        if (remainingGray <= 0) break;
        let usedGray = Math.min(availableHearts[color], remainingGray);
        remainingGray -= usedGray;
        availableHearts[color] -= usedGray;
    }
    // **4. 残った ALL で灰色を埋める**
    let finalAllUsed = Math.min(availableHearts.ALL, remainingGray);
    remainingGray -= finalAllUsed;
    availableHearts.ALL -= finalAllUsed;
    // **5. ここまでで足りないハートがある場合、不足分を表示**
    let resultText = "現在のハートでライブ成功可能です！";
    let totalMissing = Object.values(missingHearts).reduce((sum, val) => sum + val, 0) + remainingGray;
    if (totalMissing > 0) {
        resultText = "ライブ成功には以下のハートが必要です<br>";
        for (let color in missingHearts) {
            if (missingHearts[color] > 0) {
                resultText += `${heartEmojis[color]} ${color}: ${missingHearts[color]}個<br>`;
            }
        }
        if (remainingGray > 0) {
            resultText += `🩶 灰: ${remainingGray}個<br>`;
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

// **イベントリスナーをHTMLがロードされた後に設定**
document.addEventListener("DOMContentLoaded", () => {
    loadLiveCards();

    document.getElementById("applyCards").addEventListener("click", applySelectedCards);
    document.getElementById("calculateHearts").addEventListener("click", calculateRequiredHearts);
});

// **色名をHTMLのIDに変換**
function getColorKey(color) {
    return { 桃: "pink", 赤: "red", 黄: "yellow", 緑: "green", 青: "blue", 紫: "purple", 灰: "gray" }[color];
}

// **絵文字を取得**
function getColorEmoji(color) {
    return { pink: "🩷", red: "❤️", yellow: "💛", green: "💚", blue: "💙", purple: "💜" }[color];
}
