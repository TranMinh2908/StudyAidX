// ==UserScript==
// @name         StudyAidX
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  A helper tool for quizzes on lms.vinschool.edu.vn by Tran Quang Minh
// @match        https://lms.vinschool.edu.vn/*
// @match        https://online.vinschool.edu.vn/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

        const style = document.createElement('style');
    style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');

:root {
    --primary-gradient: linear-gradient(135deg, #333, #000);
    --secondary-gradient: linear-gradient(135deg, #666, #333);
    --bg-color: #fff;
    --text-color: #333;
    --primary-color: #000;
    --secondary-color: #333;
    --border-color: #e0e0e0;
    --success-color: #4caf50;
    --error-color: #f44336;
    --warning-color: #ffc107;
    --info-color: #2196f3;
    --shadow-color: rgba(0, 0, 0, 0.1);
    --transition-speed: 0.3s;
    --border-radius: 8px;
}

body {
    font-family: 'Poppins', sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
    line-height: 1.6;
    margin: 0;
    padding: 0;
}

#quizHelperMenu {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 90vh;
    max-height: 90vh;
    background: white;
    border-radius: var(--border-radius);
    box-shadow: 0 10px 30px var(--shadow-color);
    overflow: hidden;
    transition: all var(--transition-speed);
    z-index: 10000;
}

#quizHelperMenu #menuHeader {
    background: var(--primary-gradient);
    color: white;
    padding: 20px;
    font-weight: 600;
    font-size: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
}

#quizHelperMenu #menuContent {
    padding: 24px;
    max-height: calc(90vh - 80px);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--primary-color) var(--bg-color);
}

#quizHelperMenu .section {
    margin-bottom: 28px;
    animation: fadeIn 0.5s ease-out;
}

#quizHelperMenu .section-title {
    font-weight: 600;
    margin-bottom: 14px;
    color: var(--primary-color);
    font-size: 20px;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 8px;
}

#quizHelperMenu button {
    background: var(--primary-gradient);
    color: white;
    border: none;
    padding: 12px 18px;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all var(--transition-speed);
    font-size: 16px;
    font-weight: 500;
    margin-right: 12px;
    margin-bottom: 12px;
    box-shadow: 0 4px 6px var(--shadow-color);
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

#quizHelperMenu button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px var(--shadow-color);
}

#quizHelperMenu button:active {
    transform: translateY(-1px);
    box-shadow: 0 3px 6px var(--shadow-color);
}

#quizHelperMenu input[type="text"], input[type="number"] {
    width: 100%;
    padding: 12px;
    margin-bottom: 12px;
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: 16px;
    transition: all var(--transition-speed);
}

#quizHelperMenu input[type="text"]:focus, input[type="number"]:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
    outline: none;
}

#quizHelperMenu #timerDisplay {
    font-size: 28px;
    font-weight: bold;
    color: var(--primary-color);
    text-align: center;
    margin-top: 10px;
    animation: pulse 2s infinite;
}

#quizHelperMenu @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

#quizHelperMenu .toggle-switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
}

#quizHelperMenu .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

#quizHelperMenu .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
}

#quizHelperMenu .toggle-slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

#quizHelperMenu input:checked + .toggle-slider {
    background: var(--primary-gradient);
}

#quizHelperMenu input:checked + .toggle-slider:before {
    transform: translateX(26px);
}

    #welcomeScreen {
        background: linear-gradient(135deg, #00c6ff, #0072ff);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        margin-bottom: 20px;
    }
    #welcomeContent {
        color: white;
    }
    #welcomeIcon {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        margin-bottom: 10px;
    }
    #welcomeScreen h1 {
        font-size: 2rem;
        margin: 0;
    }
    #welcomeScreen p {
        font-size: 1rem;
        margin: 5px 0 0;
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

#quizHelperMenu #keyTypes {
    display: flex;
    justify-content: space-between;
    gap: 20px;
}

#quizHelperMenu #freeKeySection, #premiumKeySection {
    flex: 1;
    background: var(--secondary-gradient);
    padding: 20px;
    border-radius: var(--border-radius);
    color: white;
}

#quizHelperMenu #freeKeySection h3, #premiumKeySection h3 {
    margin-top: 0;
    font-size: 18px;
}

#quizHelperMenu #freeKeySection p, #premiumKeySection p {
    font-size: 14px;
    margin-bottom: 10px;
}

#quizHelperMenu #volumeSlider {
    width: 100%;
    margin-top: 10px;
}

#quizHelperMenu #currentTrack {
    margin-top: 10px;
    font-style: italic;
}

#quizHelperMenu @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Dark mode styles */
#quizHelperMenu .dark-mode {
    --bg-color: #333;
    --text-color: #f5f5f5;
    --border-color: #555;
    --shadow-color: rgba(0, 0, 0, 0.3);
}

#quizHelperMenu .dark-mode #quizHelperMenu {
    background: #444;
}

#quizHelperMenu .dark-mode input[type="text"], .dark-mode input[type="number"] {
    background-color: #555;
    color: white;
}

/* Responsive design */
#quizHelperMenu @media (max-width: 600px) {
    #quizHelperMenu {
        width: 90%;
        left: 5%;
        right: 5%;
    }

    #keyTypes {
        flex-direction: column;
    }
}

/* Accessibility improvements */
#quizHelperMenu button:focus, input:focus {
    outline: 3px solid var(--info-color);
    outline-offset: 2px;
}

/* Additional animations */
#quizHelperMenu @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}

#quizHelperMenu {
    animation: slideIn 0.5s ease-out;
}

#extractionPopup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--bg-color);
    padding: 28px;
    border-radius: 30px;
    box-shadow: 0 10px 30px var(--shadow-color);
    z-index: 10001;
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
    display: none;
    opacity: 1;
    transition: all var(--transition-speed);
    animation: zoomIn var(--animation-duration) ease-out;
}

@keyframes zoomIn {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}

#extractionPopup h2 {
    color: var(--primary-color);
    margin-bottom: 20px;
    font-size: 28px;
    text-align: center;
}

#extractionContent {
    white-space: pre-wrap;
    margin-bottom: 20px;
    line-height: 1.7;
    font-size: 18px;
    background-color: var(--secondary-color);
    padding: 20px;
    border-radius: 20px;
}

#toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(100%);
    background-color: var(--primary-color);
    color: white;
    padding: 14px 28px;
    border-radius: 50px;
    opacity: 0;
    transition: all var(--transition-speed);
    font-size: 18px;
    box-shadow: 0 4px 12px var(--shadow-color);
}

#toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    animation: toastSlideUp var(--animation-duration) ease-out, toastFadeOut 0.5s ease-out 2.5s forwards;
}

@keyframes toastSlideUp {
    from {
        transform: translateX(-50%) translateY(100%);
    }
    to {
        transform: translateX(-50%) translateY(0);
    }
}

@keyframes toastFadeOut {
    to {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
    }
}

.selected-answer {
    background-color: var(--success-color);
    color: white;
    padding: 8px 12px;
    border-radius: 50px;
    transition: all var(--transition-speed);
    font-weight: bold;
    animation: answerPop 0.3s ease-out;
}

@keyframes answerPop {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
    }
}

/* Hover effects for better interactivity */
.section-title:hover {
    color: var(--secondary-color);
    transition: color var(--transition-speed);
}

/* Improved scrollbar styling */
#menuContent::-webkit-scrollbar {
    width: 10px;
}

#menuContent::-webkit-scrollbar-track {
    background: var(--bg-color);
}

#menuContent::-webkit-scrollbar-thumb {
    background: var(--primary-color);
    border-radius: 5px;
}

#menuContent::-webkit-scrollbar-thumb:hover {
    background: var(--secondary-color);
}

#quizHelperMenu {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    height: 500px;
    background-color: white;
    border: 1px solid #ccc;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    overflow: auto;
    resize: both;
    z-index: 9999;
}

#resizeHandle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, transparent 50%, #ccc 50%);
    cursor: nwse-resize;
}

#resizeControls {
    margin-top: 20px;
}

.customize-group {
    margin-bottom: 20px;
}

.section {
    margin-bottom: 20px;
}

.section-title {
    font-size: 18px;
    margin-bottom: 10px;
    font-weight: bold;
}

#customizeIcon {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #000;
    color: white;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 1000;
    font-size: 24px;
}
#customizeSection {
    position: fixed;
    top: -100%;
    right: 0;
    width: 300px;
    height: 100%;
    background-color: #f8f9fa;
    transition: top 0.3s ease-in-out;
    overflow-y: auto;
    padding: 20px;
    box-sizing: border-box;
}
.section-title {
    font-size: 24px;
    margin-bottom: 20px;
}
.customize-group {
    margin-bottom: 20px;
}
.customize-group h3 {
    margin-top: 0;
}
label {
    display: block;
    margin-bottom: 5px;
}
input[type="checkbox"], input[type="color"], input[type="range"], select, input[type="file"] {
    margin-bottom: 10px;
}
#quizHelperMenu {
    transition: transform 0.3s ease, opacity 0.3s ease;
    transform-origin: top right;
}
#quizHelperMenu.minimized {
    transform: scale(0);
    opacity: 0;
}
#advertisementSection {
    background: transparent;
    min-height: 250px; /* Minimum height for ad space */
    position: relative;
    z-index: 1000;
}
 #adPopup {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.7);
    z-index: 10000;
  }

  .popup-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
  }

  .ad-container {
    min-height: 250px;
    min-width: 300px;
  }

  .close-button {
    position: absolute;
    top: 5px;
    right: 10px;
    font-size: 24px;
    cursor: pointer;
    color: #333;
  }

  .close-button:hover {
    color: #000;
  }
/* AI Chat Feature Styles */

/* AI Button Styles */
.ai-question-button {
    position: absolute;
    right: -40px;
    top: 50%;
    transform: translateY(-50%);
    background: #4a90e2;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ai-question-button:hover {
    background: #357abd;
    transform: translateY(-50%) scale(1.1);
}

.ai-icon {
    color: white;
    font-size: 14px;
    font-weight: bold;
}

/* Chat Popup Styles */
.ai-chat-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 500px;
    height: 80vh;
    max-height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    z-index: 1000;
}

/* Popup Header */
.popup-header {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 12px 12px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
}

.popup-header h3 {
    margin: 0;
    color: #333;
    font-size: 16px;
}

.close-popup {
    background: none;
    border: none;
    font-size: 24px;
    color: #666;
    cursor: pointer;
    padding: 0 8px;
}

.close-popup:hover {
    color: #333;
}

/* Chat Messages Container */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Message Styles */
.chat-message {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    max-width: 80%;
    position: relative;
}

.user-message {
    margin-left: auto;
    flex-direction: row-reverse;
}

.message-content {
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.4;
}

.user-message .message-content {
    background: #4a90e2;
    color: white;
    border-radius: 12px 12px 0 12px;
}

.ai-message .message-content {
    background: #f1f3f4;
    color: #333;
    border-radius: 12px 12px 12px 0;
}

.error-message .message-content {
    background: #ffebee;
    color: #c62828;
    border-radius: 12px;
}

/* Copy Button */
.copy-message {
    position: absolute;
    right: -30px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.ai-message:hover .copy-message {
    opacity: 1;
}

/* Chat Input Container */
.chat-input-container {
    padding: 16px;
    border-top: 1px solid #eee;
    display: flex;
    gap: 8px;
}

.chat-input {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    resize: none;
    min-height: 24px;
    max-height: 120px;
    line-height: 1.4;
}

.chat-input:focus {
    outline: none;
    border-color: #4a90e2;
}

.send-message {
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0 16px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.send-message:hover {
    background: #357abd;
}

/* Toast Notification */
.toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1001;
}

/* Responsive Design */
@media (max-width: 768px) {
    .ai-chat-popup {
        width: 95%;
        height: 90vh;
        max-height: none;
    }

    .chat-message {
        max-width: 90%;
    }

    .ai-question-button {
        right: -32px;
        width: 28px;
        height: 28px;
    }

    .ai-icon {
        font-size: 12px;
    }
}

/* Scrollbar Styles */
.chat-messages::-webkit-scrollbar {
    width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
    background: #555;
}
    `;
    document.head.appendChild(style);

    // Thêm đoạn code này vào cuối file JavaScript của bạn


// Function to check if welcome screen should be shown
function shouldShowWelcomeScreen() {
    const lastShown = localStorage.getItem('welcomeScreenLastShown');
    const now = new Date().toDateString();
    if (!lastShown || lastShown !== now) {
        localStorage.setItem('welcomeScreenLastShown', now);
        return true;
    }
    return false;
}

// Create welcome screen
function createWelcomeScreen() {
    const welcomeScreen = document.createElement('div');
    welcomeScreen.id = 'welcomeScreen';
    welcomeScreen.innerHTML = `
        <div id="welcomeContent">
            <img src="https://th.bing.com/th/id/OIG1.X_jd7pPvgBsjO5QX7DYI?w=1024&h=1024&rs=1&pid=ImgDetMain" alt="StudyAidX Icon" id="welcomeIcon">
            <h1>StudyAidX</h1>
            <p>Chill vibes. Epic grades.</p>
        </div>
    `;
    return welcomeScreen;
}

// Show welcome screen within menu
function showWelcomeScreen() {
    const menu = document.getElementById('quizHelperMenu');
    if (shouldShowWelcomeScreen()) {
        const welcomeScreen = createWelcomeScreen();
        menu.prepend(welcomeScreen);

        // Fade out welcome screen after 3 seconds
        setTimeout(() => {
            welcomeScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => welcomeScreen.remove(), 500);
        }, 3000);
    }
    menu.style.display = 'block';
    menu.style.animation = 'fadeIn 0.5s ease-out';
}



// Create menu
const menu = document.createElement('div');
menu.id = 'quizHelperMenu';
menu.innerHTML = `

<div id="menuHeader">
  <a href="https://ibb.co/41xKGX2"><img src="https://i.ibb.co/wc1BXP7/studyaidx-high-resolution-logo-white-transparent.png" alt="studyaidx-high-resolution-logo-white-transparent" border="0"></a>
  <button id="logoutButton" aria-label="Đăng xuất">🚪</button>
  <span id="remainingTime" style="display:none;">Thời gian sử dụng còn lại: <span id="timeLeft">30:00</span></span>
  <button id="minimizeButton" aria-label="Thu Gọn">_</button>
  <span>Press CTRL + Q to hide menu</span>
  <div id="customizeIcon">&#9881;</div>
  <span id="versionInfo">Version: <div id="currentVersion">1.15</div></span>
</div>

<div id="menuContent">

<div id="keySection" class="section">

<div class="section-title">Kích hoạt Key</div>

<div id="keyTypes">

<div id="freeKeySection">

<h3>Free Key (Giới hạn)</h3>

<p>Chức năng có sẵn: Khai thác dữ liệu, Lựa chọn mã đáp ứng, Kích hoạt đồng hồ</p>

<p>Thời hạn: 30 phút</p>

<button id="getFreeKeyButton">Lấy Key Miễn Phí</button>

<p id="freeKeyTimer" style="display:none;">Vui lòng chờ: <span id="freeKeyCountdown">60</span> giây</p>

<input type="text" id="freeKeyInput" placeholder="Nhập Free key" style="display:none;">

<button id="activateFreeKeyButton" style="display:none;">Kích hoạt Free Key</button>

</div>

<div id="premiumKeySection">

<h3>Premium Key (Khuyến nghị)</h3>

<p>✅ Truy cập đầy đủ tất cả chức năng</p>

<p>✅ Không giới hạn thời gian sử dụng</p>

<p>✅ Ưu tiên hỗ trợ kỹ thuật</p>

<p>✅ Cập nhật tính năng mới sớm nhất</p>

<input type="text" id="premiumKeyInput" placeholder="Nhập Premium key">

<button id="activatePremiumKeyButton">Kích hoạt Premium Key</button>

<button id="contactButton">Liên hệ để nhận ưu đãi đặc biệt!</button>

</div>

</div>

</div>

<div id="functionsSection" style="display: none;">

<div class="section">
    <div class="section-title">Hành Động</div>
    <button id="extractButton">📋 Khai Thác Dữ Liệu</button>
    <button id="calculatorButton">🧮 Máy tính</button>
    <button id="autoAnswerButton">🎲 Chọn Đáp Án (Random)</button>
    <button id="aiAnswerButton">🤖 Chọn Đáp Án (AI)</button>
    <div>
        <input type="checkbox" id="autoSubmitCheckbox">
        <label for="autoSubmitCheckbox">Auto Submit</label>
    </div>
    <button id="autoSubmitToggle" style="display: none;">🚀 Toggle Auto-Submit</button>
    <button id="openLinkPopupButton">🔗 Mở Popup Liên Kết</button>
    <div>
        <label class="toggle-switch">
            <input type="checkbox" id="copyPasteToggle">
            <span class="toggle-slider"></span>
        </label>
        <span>Cho phép Copy/Paste</span>
    </div>
</div>

<div class="section">
    <div class="section-title">Lựa Chọn Mã Đáp Ứng</div>
    <input id="answersInput" type="text" placeholder="Nhập mã đáp ứng, phân tách bằng dấu chấm phẩy">
      <div>
    <input type="checkbox" id="autoExtractCheckbox">
    <label for="autoExtractCheckbox">Tự động khai thác dữ liệu</label>
  </div>
    <button id="selectAnswersButton">✅ Chọn Đáp Án (Dựa Vào Input)</button>
    <label for="autoSubmitCheckbox">Tự động submit:</label>
    <input type="checkbox" id="autoSubmitCheckbox">
    <button id="saveAnswersButton">💾 Lưu Trữ Mã</button>
    <button id="loadAnswersButton">📂 Nạp Mã</button>
    <button id="highlightAnswersButton">🖍️ Highlight Answers</button>
    <button id="analyzeAnswersButton">📊 Analyze Answers</button>
</div>

<div class="section">

<div class="section-title">Cài Đặt</div>

<button id="toggleThemeButton" style="display = none">🌓 Chuyển Đổi Giao Diện</button>

</div>

<div class="section">

<div class="section-title">Đồng Hồ Đếm Ngược</div>

<input id="timerInput" type="number" min="1" max="180" placeholder="Nhập số phút">

<button id="startTimerButton">▶️ Kích Hoạt Đồng Hồ</button>

<div id="timerDisplay">0:00</div>

</div>

<div class="section" style="display: none;">

<div class="section-title">Nhạc</div>

<button id="playMusicButton">🎵 Play Music</button>

<button id="pauseMusicButton">⏸️ Pause Music</button>

<div>

<input type="range" id="volumeSlider" min="0" max="1" step="0.01" value="1">

<label for="volumeSlider">Volume</label>

</div>

<div id="currentTrack" style="display:none;">Đang phát: <span id="trackInfo"></span></div>

</div>

<div class="section">

<div class="section-title">Farm</div>

<div>

<input type="checkbox" id="farmRandom">

<label for="farmRandom">Farm Random</label>

</div>

<div>

<input type="checkbox" id="farmInput">

<label for="farmInput">Farm Dựa vào Input</label>

</div>

<label for="iterationsInput">Số Lần Farm:</label>

<input type="number" id="iterationsInput" min="1" value="10">

<button id="startFarmButton" class="btn btn-primary">Bắt đầu Farm</button>

</div>

<div class="section">

<div class="section-title">Cập Nhật Điểm Số</div>

<div>

<label class="toggle-switch">

<input type="checkbox" id="scoreUpdateToggle">

<span class="toggle-slider"></span>

</label>

<span>Tự động cập nhật điểm số</span>

</div>

</div>
  <div id="advertisementSection" class="section" style="text-align: center; margin-top: 20px; padding: 10px;">
    <!-- Google AdSense -->
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-5389521389166416"
         data-ad-slot="5189490411"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  </div>
</div>

    <div id="customizeSection" class="section">
        <div class="section-title">Tùy chỉnh giao diện</div>
        <div class="customize-group">
            <h3>Màu sắc</h3>
            <label for="colorCheckbox">Bật chức năng màu sắc:</label>
            <input type="checkbox" id="colorCheckbox" checked>
            <div id="colorControls">
                <label for="menuBackgroundColor">Màu nền:</label>
                <input type="color" id="menuBackgroundColor">
                <label for="menuTextColor">Màu chữ:</label>
                <input type="color" id="menuTextColor">
                <label for="menuAccentColor">Màu nhấn:</label>
                <input type="color" id="menuAccentColor">
            </div>
        </div>
        <div class="customize-group">
            <h3>Phông chữ</h3>
            <label for="fontCheckbox">Bật chức năng phông chữ:</label>
            <input type="checkbox" id="fontCheckbox" checked>
            <div id="fontControls">
                <label for="menuFontFamily">Kiểu chữ:</label>
                <select id="menuFontFamily">
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                </select>
                <label for="menuFontSize">Cỡ chữ:</label>
                <input type="range" id="menuFontSize" min="12" max="24" step="1" value="16">
                <span id="fontSizeValue">16px</span>
            </div>
        </div>
        <div class="customize-group">
            <h3>Hình nền</h3>
            <label for="imageCheckbox">Bật chức năng hình nền:</label>
            <input type="checkbox" id="imageCheckbox" checked>
            <div id="imageControls">
                <label for="menuImageBackground">Chọn hình nền:</label>
                <input type="file" id="menuImageBackground" accept="image/*">
                <label for="backgroundOpacity">Độ mờ nền:</label>
                <input type="range" id="backgroundOpacity" min="0" max="1" step="0.1" value="1">
                <span id="opacityValue">100%</span>
            </div>
        </div>
        <div class="customize-group">
            <h3>Bố cục</h3>
            <label for="layoutCheckbox">Bật chức năng bố cục:</label>
            <input type="checkbox" id="layoutCheckbox" checked>
            <div id="layoutControls">
                <label for="menuLayout">Kiểu bố cục:</label>
                <select id="menuLayout">
                    <option value="default">Mặc định</option>
                    <option value="compact">Gọn gàng</option>
                    <option value="spacious">Rộng rãi</option>
                </select>
                <label for="menuBorderRadius">Bo góc:</label>
                <input type="range" id="menuBorderRadius" min="0" max="20" step="1" value="0">
                <span id="borderRadiusValue">0px</span>
            </div>
        </div>
        <div id="resizeControls">
            <h3>Resize Section</h3>
            <label for="resizeCheckbox">Bật chức năng resize:</label>
            <input type="checkbox" id="resizeCheckbox" checked>
            <div id="resizeSettings">
                <label for="sectionWidth">Chiều rộng:</label>
                <input type="range" id="sectionWidth" min="300" max="1200" step="10" value="600">
                <span id="widthValue">600px</span>
                <label for="sectionHeight">Chiều cao:</label>
                <input type="range" id="sectionHeight" min="300" max="1000" step="10" value="400">
                <span id="heightValue">400px</span>
            </div>
        </div>
        <button id="applyCustomizationsButton">Áp dụng tất cả</button>
        <button id="resetCustomizationsButton">Đặt lại mặc định</button>
    </div>

`;

// Common UI improvements for smoother interaction
document.body.appendChild(menu);

// Function to select answers using AI
async function selectAnswersWithAI() {
    let quizText = '';
    const imagesToOpen = [];

    // Load the Google Generative AI library
    const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");
    const API_KEY = "AIzaSyAxasVpc8FGsLOcToZB9yslD-X4-WtaAd4"; // Replace with your actual API key
    const genAI = new GoogleGenerativeAI(API_KEY);

    async function sendToAI(prompt) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            return await result.response.text();
        } catch (error) {
            console.error("Error:", error);
            return "Error occurred while processing the request.";
        }
    }

    // Extract quiz questions
    const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');
    if (questionElements.length === 0) {
        showToast('Failed to extract questions. Please try again.');
        return;
    }

    questionElements.forEach((questionElement, index) => {
        let questionText = questionElement.querySelector('.question_text')
            ? questionElement.querySelector('.question_text').innerText
            : '';
        quizText += `Câu hỏi ${index + 1}: ${questionText}\n`;
        // Check for images in the question
        const questionImages = questionElement.querySelectorAll('img[alt*="Screenshot"]');
        questionImages.forEach((img, imgIndex) => {
            quizText += `Hình ảnh câu hỏi ${index + 1}.${imgIndex + 1}: [${img.alt}]\n`;
            imagesToOpen.push(img.src);
        });
        questionElement.querySelectorAll('.answer, .answer-text, .option').forEach((answerElement, answerIndex) => {
            let answerText = answerElement.innerText.trim();
            // Check for image elements inside the answer
            const imageElements = answerElement.querySelectorAll('img[alt*="Screenshot"]');
            if (imageElements.length > 0) {
                imageElements.forEach((img, imgIndex) => {
                    quizText += `Hình ảnh đáp án ${index + 1}.${answerIndex + 1}.${imgIndex + 1}: [${img.alt}]\n`;
                    imagesToOpen.push(img.src);
                });
            }
            // Append text if exists
            if (answerText) {
                quizText += `${answerText}\n`;
            }
        });
        quizText += '\n'; // Add a blank line between questions
    });

    // Add instruction to the extracted text
    const instruction = "\n\nĐưa đáp án cho các câu hỏi, mỗi đáp án cách nhau bằng dấu chấm phẩy (;). Chỉ ghi đúng nội dung đáp án, không thêm bất kỳ từ nào khác. Tất cả đáp án phải nằm trên một dòng duy nhất, không xuống dòng. Ví dụ: Cả hai đáp án đúng; Trồng lúa lấy gạo để xuất khẩu; Sử dụng thuốc hóa học; Cả 3 đáp án; Tăng diện tích đất trồng";
    quizText += instruction;

    // Send to AI and get response
    showToast('Đang xử lý câu trả lời bằng AI...');
    const aiResponse = await sendToAI(quizText);

    // Process AI response and select answers
    const correctAnswers = aiResponse.split(';').map(answer => answer.trim());
    const autoSubmit = loadAutoSubmitPreference();
    selectCorrectAnswers(correctAnswers, autoSubmit);

    showToast('Đã chọn đáp án bằng AI!');
}
document.getElementById('aiAnswerButton').addEventListener('click', selectAnswersWithAI);

// Function to create and add AI text link next to each question
function addAILinksToQuestions() {
    const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');
    questionElements.forEach((element, index) => {
        const link = document.createElement('span');
        link.className = 'ai-question-link';
        link.textContent = 'Ask AI';
        link.setAttribute('data-question-index', index);
        element.appendChild(link);

        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleQuestionAIClick(element, index);
        });
    });
}

// Chat history management
const chatHistory = new Map();

async function handleQuestionAIClick(questionElement, questionIndex) {
    let questionText = '';
    const imagesToOpen = [];

    // Extract question text and images
    const questionTextElement = questionElement.querySelector('.question_text');
    if (questionTextElement) {
        questionText = questionTextElement.innerText;
    }

    // Extract images from question
    const questionImages = questionElement.querySelectorAll('img[alt*="Screenshot"]');
    questionImages.forEach((img, imgIndex) => {
        questionText += `\nImage ${imgIndex + 1}: [${img.alt}]\n`;
        imagesToOpen.push(img.src);
    });

    // Extract answer options
    const answerElements = questionElement.querySelectorAll('.answer, .answer-text, .option');
    let optionsText = '\nAnswer options:\n';
    answerElements.forEach((answerElement, answerIndex) => {
        const answerText = answerElement.innerText.trim();
        optionsText += `${String.fromCharCode(65 + answerIndex)}. ${answerText}\n`;

        // Include images in answers if any
        const answerImages = answerElement.querySelectorAll('img[alt*="Screenshot"]');
        answerImages.forEach((img, imgIndex) => {
            optionsText += `Image for option ${String.fromCharCode(65 + answerIndex)}: [${img.alt}]\n`;
            imagesToOpen.push(img.src);
        });
    });

    // Simplified prompt for direct answer
    const simplePrompt = `For this multiple choice question:

Question: ${questionText}
${optionsText}

\n\nĐưa đáp án cho các câu hỏi, mỗi đáp án cách nhau bằng dấu chấm phẩy (;). Chỉ ghi đúng nội dung đáp án, không thêm bất kỳ từ nào khác. Tất cả đáp án phải nằm trên một dòng duy nhất, không xuống dòng. Ví dụ: Cả hai đáp án đúng; Trồng lúa lấy gạo để xuất khẩu; Sử dụng thuốc hóa học; Cả 3 đáp án; Tăng diện tích đất trồng`;

    // Create or show chat popup
    showChatPopup(questionIndex, simplePrompt);
}

// Function to create and show chat popup
function showChatPopup(questionIndex, initialQuestion) {
    // Remove existing popup if any
    const existingPopup = document.querySelector('.ai-chat-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'ai-chat-popup';

    // Create popup content
    const popupContent = `
        <div class="popup-header">
            <h3>AI Assistant - Question ${questionIndex + 1}</h3>
            <button class="close-popup">×</button>
        </div>
        <div class="chat-messages"></div>
        <div class="chat-input-container">
            <textarea class="chat-input" placeholder="Type your message..."></textarea>
            <button class="send-message">Send</button>
        </div>
    `;

    popup.innerHTML = popupContent;
    document.body.appendChild(popup);

    // Setup event listeners
    setupChatEventListeners(popup, questionIndex, initialQuestion);

    // Load and display chat history
    loadChatHistory(questionIndex, popup);

    // Send initial question if no history exists
    if (!chatHistory.has(questionIndex)) {
        sendMessageToAI(initialQuestion, questionIndex, popup);
    }
}

// Function to setup chat event listeners
function setupChatEventListeners(popup, questionIndex, initialQuestion) {
    const closeBtn = popup.querySelector('.close-popup');
    const sendBtn = popup.querySelector('.send-message');
    const input = popup.querySelector('.chat-input');

    closeBtn.addEventListener('click', () => popup.remove());

    sendBtn.addEventListener('click', () => {
        const message = input.value.trim();
        if (message) {
            sendMessageToAI(message, questionIndex, popup);
            input.value = '';
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });
}

// Function to send message to AI and handle response
async function sendMessageToAI(message, questionIndex, popup) {
    const messagesContainer = popup.querySelector('.chat-messages');

    // Add user message to chat
    addMessageToChat('user', message, messagesContainer);

    // Get chat history for context
    const history = chatHistory.get(questionIndex) || [];
    history.push({ role: 'user', content: message });

    try {
        // Load the Google Generative AI library
        const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");
        const API_KEY = "AIzaSyAxasVpc8FGsLOcToZB9yslD-X4-WtaAd4";
        const genAI = new GoogleGenerativeAI(API_KEY);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(message);
        const response = await result.response.text();

        // Add AI response to chat
        addMessageToChat('ai', response, messagesContainer);

        // Update chat history
        history.push({ role: 'assistant', content: response });
        chatHistory.set(questionIndex, history);

    } catch (error) {
        console.error("Error:", error);
        addMessageToChat('error', 'Sorry, an error occurred while processing your request.', messagesContainer);
    }
}

// Function to add message to chat display
function addMessageToChat(role, content, container) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}-message`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;

    if (role === 'ai') {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-message';
        copyButton.innerHTML = '📋';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(content);
            showToast('Copied to clipboard!');
        });
        messageDiv.appendChild(copyButton);
    }

    messageDiv.appendChild(messageContent);
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// Function to load chat history
function loadChatHistory(questionIndex, popup) {
    const history = chatHistory.get(questionIndex);
    if (history) {
        const messagesContainer = popup.querySelector('.chat-messages');
        history.forEach(msg => {
            addMessageToChat(msg.role === 'user' ? 'user' : 'ai', msg.content, messagesContainer);
        });
    }
}

// Function to show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize AI links when page loads
document.addEventListener('DOMContentLoaded', addAILinksToQuestions);

// Add this to your JavaScript code
let autoExtractEnabled = localStorage.getItem('autoExtractEnabled') === 'false';

const autoExtractCheckbox = document.getElementById('autoExtractCheckbox');
autoExtractCheckbox.checked = autoExtractEnabled;

autoExtractCheckbox.addEventListener('change', (e) => {
  autoExtractEnabled = e.target.checked;
  localStorage.setItem('autoExtractEnabled', autoExtractEnabled);
});

// Function to simulate clicking the extract button
function simulateExtractClick() {
  const extractButton = document.getElementById('extractButton');
  if (extractButton) {
    extractButton.click();
  }
}

// Function to handle auto-extraction
function handleAutoExtract() {
  if (autoExtractEnabled) {
    setTimeout(simulateExtractClick, 3000);
  }
}

// Listen for page loads
window.addEventListener('load', handleAutoExtract);

// Listen for navigation events (for single-page applications)
window.addEventListener('popstate', handleAutoExtract);

const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/TranMinh2908/Version/refs/heads/main/version.json';

// Hàm kiểm tra phiên bản hiện tại
async function checkVersion() {
  try {
    // Gọi API để lấy nội dung của file version.json
    const response = await fetch(VERSION_CHECK_URL, { cache: 'no-store' });
    const data = await response.json();

    // Lấy phiên bản hiện tại từ phần tử HTML
    const currentVersion = document.getElementById('currentVersion').textContent;

    // Log để kiểm tra phiên bản hiện tại và dữ liệu từ version.json
    console.log('Phiên bản hiện tại:', currentVersion);
    console.log('Dữ liệu phiên bản từ server:', data);

    // Kiểm tra nếu danh sách phiên bản hoặc phiên bản hiện tại không tồn tại trong danh sách
    if (!data.versions || !data.versions.includes(currentVersion)) {
      // Log danh sách phiên bản nếu phiên bản không hợp lệ
      console.log('Danh sách phiên bản hợp lệ:', data.versions);
      alert(`Phiên bản hiện tại (${currentVersion}) không hợp lệ hoặc không được tìm thấy. Vui lòng cập nhật phiên bản mới nhất.`);
      destroyMenu(); // Gọi hàm để xóa menu khi phiên bản không hợp lệ
    } else {
      // Log khi phiên bản hợp lệ
      console.log('Phiên bản hợp lệ:', currentVersion);
    }
  } catch (error) {
    // Xử lý lỗi khi gọi API hoặc parse JSON
    console.error('Lỗi khi kiểm tra phiên bản:', error);
    alert('Có lỗi xảy ra khi kiểm tra phiên bản. Vui lòng thử lại sau.');
    destroyMenu(); // Gọi hàm để xóa menu khi có lỗi
  }
}

// Hàm xóa menu nếu phiên bản không hợp lệ
function destroyMenu() {
  const menu = document.getElementById('quizHelperMenu');
  if (menu && menu.parentNode) {
    menu.parentNode.removeChild(menu); // Xóa menu khỏi DOM
  }
}

// Chờ 7 giây sau khi trang load xong rồi mới kiểm tra phiên bản
setTimeout(checkVersion, 5000);




// Create a small icon for reopening the menu
const reopenIcon = document.createElement('div');
reopenIcon.id = 'reopenIcon';
reopenIcon.innerHTML = '📚';
reopenIcon.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #007bff;
    color: white;
    padding: 15px;
    border-radius: 50%;
    cursor: pointer;
    display: none;
    z-index: 10000;
    font-size: 24px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
`;
document.body.appendChild(reopenIcon);



// Add hover effect for reopen icon
reopenIcon.addEventListener('mouseover', () => {
    reopenIcon.style.transform = 'scale(1.1)';
    reopenIcon.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
});
reopenIcon.addEventListener('mouseout', () => {
    reopenIcon.style.transform = 'scale(1)';
    reopenIcon.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
});


function toggleMinimize() {
    const menu = document.getElementById('quizHelperMenu');
    const reopenIcon = document.getElementById('reopenIcon');

    if (!menu.classList.contains('minimized')) {
        menu.classList.add('minimized');
        setTimeout(() => {
            menu.style.display = 'none';
            reopenIcon.style.display = 'block';
        }, 300); // Wait for the transition to complete
    } else {
        menu.style.display = 'block';
        reopenIcon.style.display = 'none';
        // Trigger reflow
        void menu.offsetWidth;
        menu.classList.remove('minimized');
    }
}

// Event listener for the minimize button
const minimizeButton = document.getElementById('minimizeButton');
minimizeButton.addEventListener('click', toggleMinimize);

// Event listener for the reopen icon
reopenIcon.addEventListener('click', toggleMinimize);

const customizeIcon = document.getElementById('customizeIcon');
const customizeSection = document.getElementById('customizeSection');
let isOpen = false;

customizeIcon.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
        customizeSection.style.top = '0';
    } else {
        customizeSection.style.top = '-100%';
    }
});

// Common UI improvements for smoother interaction
const quizHelperMenu = document.getElementById('quizHelperMenu');
const applyButton = document.getElementById('applyCustomizationsButton');
const resetButton = document.getElementById('resetCustomizationsButton');
const colorCheckbox = document.getElementById('colorCheckbox');
const fontCheckbox = document.getElementById('fontCheckbox');
const imageCheckbox = document.getElementById('imageCheckbox');
const layoutCheckbox = document.getElementById('layoutCheckbox');
const resizeCheckbox = document.getElementById('resizeCheckbox');

const colorControls = document.getElementById('colorControls');
const fontControls = document.getElementById('fontControls');
const imageControls = document.getElementById('imageControls');
const layoutControls = document.getElementById('layoutControls');
const resizeSettings = document.getElementById('resizeSettings');

const sectionWidthInput = document.getElementById('sectionWidth');
const sectionHeightInput = document.getElementById('sectionHeight');
const widthValueDisplay = document.getElementById('widthValue');
const heightValueDisplay = document.getElementById('heightValue');

// Load saved settings on page load
document.addEventListener('DOMContentLoaded', () => {
  const savedWidth = localStorage.getItem('sectionWidth');
  const savedHeight = localStorage.getItem('sectionHeight');
  const savedColorSettings = JSON.parse(localStorage.getItem('colorSettings'));
  const savedFontSettings = JSON.parse(localStorage.getItem('fontSettings'));
  const savedImageSettings = JSON.parse(localStorage.getItem('imageSettings'));
  const savedLayoutSettings = JSON.parse(localStorage.getItem('layoutSettings'));

  if (savedWidth && savedHeight) {
    quizHelperMenu.style.width = `${savedWidth}px`;
    quizHelperMenu.style.height = `${savedHeight}px`;

    sectionWidthInput.value = savedWidth;
    sectionHeightInput.value = savedHeight;
    widthValueDisplay.textContent = `${savedWidth}px`;
    heightValueDisplay.textContent = `${savedHeight}px`;
  }

  if (savedColorSettings) {
    document.getElementById('menuBackgroundColor').value = savedColorSettings.backgroundColor;
    document.getElementById('menuTextColor').value = savedColorSettings.textColor;
    document.getElementById('menuAccentColor').value = savedColorSettings.accentColor;
    colorCheckbox.checked = savedColorSettings.enabled;
    applyColorSettings(savedColorSettings);
  }

  if (savedFontSettings) {
    document.getElementById('menuFontFamily').value = savedFontSettings.fontFamily;
    document.getElementById('menuFontSize').value = savedFontSettings.fontSize;
    document.getElementById('fontSizeValue').textContent = `${savedFontSettings.fontSize}px`;
    fontCheckbox.checked = savedFontSettings.enabled;
    applyFontSettings(savedFontSettings);
  }

  if (savedImageSettings) {
    document.getElementById('backgroundOpacity').value = savedImageSettings.opacity;
    document.getElementById('opacityValue').textContent = `${savedImageSettings.opacity * 100}%`;
    imageCheckbox.checked = savedImageSettings.enabled;
    if (savedImageSettings.backgroundImage) {
      quizHelperMenu.style.backgroundImage = `url('${savedImageSettings.backgroundImage}')`;
      quizHelperMenu.style.backgroundSize = 'cover';
      quizHelperMenu.style.backgroundRepeat = 'no-repeat';
    }
    applyImageSettings(savedImageSettings);
  }

  if (savedLayoutSettings) {
    document.getElementById('menuLayout').value = savedLayoutSettings.layout;
    document.getElementById('menuBorderRadius').value = savedLayoutSettings.borderRadius;
    document.getElementById('borderRadiusValue').textContent = `${savedLayoutSettings.borderRadius}px`;
    layoutCheckbox.checked = savedLayoutSettings.enabled;
    applyLayoutSettings(savedLayoutSettings);
  }

  updateControlsState();
});

// Apply customizations
applyButton.addEventListener('click', () => {
  const colorSettings = {
    enabled: colorCheckbox.checked,
    backgroundColor: document.getElementById('menuBackgroundColor').value,
    textColor: document.getElementById('menuTextColor').value,
    accentColor: document.getElementById('menuAccentColor').value
  };

  const fontSettings = {
    enabled: fontCheckbox.checked,
    fontFamily: document.getElementById('menuFontFamily').value,
    fontSize: document.getElementById('menuFontSize').value
  };

  const imageSettings = {
    enabled: imageCheckbox.checked,
    opacity: document.getElementById('backgroundOpacity').value,
    backgroundImage: quizHelperMenu.style.backgroundImage.slice(4, -1).replace(/"/g, "") // Get the current background image URL
  };

  const layoutSettings = {
    enabled: layoutCheckbox.checked,
    layout: document.getElementById('menuLayout').value,
    borderRadius: document.getElementById('menuBorderRadius').value
  };

  const width = resizeCheckbox.checked ? sectionWidthInput.value : null;
  const height = resizeCheckbox.checked ? sectionHeightInput.value : null;

  applySettings(colorSettings, fontSettings, imageSettings, layoutSettings, width, height);

  localStorage.setItem('colorSettings', JSON.stringify(colorSettings));
  localStorage.setItem('fontSettings', JSON.stringify(fontSettings));
  localStorage.setItem('imageSettings', JSON.stringify(imageSettings));
  localStorage.setItem('layoutSettings', JSON.stringify(layoutSettings));
  localStorage.setItem('sectionWidth', width);
  localStorage.setItem('sectionHeight', height);
});

// Reset customizations
resetButton.addEventListener('click', () => {
  localStorage.removeItem('colorSettings');
  localStorage.removeItem('fontSettings');
  localStorage.removeItem('imageSettings');
  localStorage.removeItem('layoutSettings');
  localStorage.removeItem('sectionWidth');
  localStorage.removeItem('sectionHeight');

  document.getElementById('menuBackgroundColor').value = '#ffffff';
  document.getElementById('menuTextColor').value = '#000000';
  document.getElementById('menuAccentColor').value = '#0000ff';
  document.getElementById('menuFontFamily').value = 'Arial, sans-serif';
  document.getElementById('menuFontSize').value = '16';
  document.getElementById('fontSizeValue').textContent = '16px';
  document.getElementById('menuImageBackground').value = '';
  document.getElementById('backgroundOpacity').value = '1';
  document.getElementById('opacityValue').textContent = '100%';
  document.getElementById('menuLayout').value = 'default';
  document.getElementById('menuBorderRadius').value = '0';
  document.getElementById('borderRadiusValue').textContent = '0px';

  sectionWidthInput.value = '600';
  sectionHeightInput.value = '400';
  widthValueDisplay.textContent = '600px';
  heightValueDisplay.textContent = '400px';

  quizHelperMenu.style.width = '600px';
  quizHelperMenu.style.height = '400px';

  colorCheckbox.checked = true;
  fontCheckbox.checked = true;
  imageCheckbox.checked = true;
  layoutCheckbox.checked = true;
  resizeCheckbox.checked = true;

  updateControlsState();

  // Reset background image
  quizHelperMenu.style.backgroundImage = 'none';

  applySettings(
    {enabled: true, backgroundColor: '#ffffff', textColor: '#000000', accentColor: '#0000ff'},
    {enabled: true, fontFamily: 'Arial, sans-serif', fontSize: '16'},
    {enabled: true, opacity: '1', backgroundImage: ''},
    {enabled: true, layout: 'default', borderRadius: '0'},
    '600',
    '400'
  );
});

function updateControlsState() {
  const groups = [
    { checkbox: colorCheckbox, controls: colorControls },
    { checkbox: fontCheckbox, controls: fontControls },
    { checkbox: imageCheckbox, controls: imageControls },
    { checkbox: layoutCheckbox, controls: layoutControls },
    { checkbox: resizeCheckbox, controls: resizeSettings }
  ];

  groups.forEach(group => {
    const isEnabled = group.checkbox.checked;
    group.controls.classList.toggle('disabled', !isEnabled);
    group.controls.querySelectorAll('input, select').forEach(input => {
      input.disabled = !isEnabled;
    });
  });
}

// Add event listeners for checkboxes
[colorCheckbox, fontCheckbox, imageCheckbox, layoutCheckbox, resizeCheckbox].forEach(checkbox => {
  checkbox.addEventListener('change', updateControlsState);
});

// Call updateControlsState when the page is loaded
document.addEventListener('DOMContentLoaded', updateControlsState);

// Update value display for width and height sliders
sectionWidthInput.addEventListener('input', () => {
  widthValueDisplay.textContent = `${sectionWidthInput.value}px`;
});

sectionHeightInput.addEventListener('input', () => {
  heightValueDisplay.textContent = `${sectionHeightInput.value}px`;
});

// Function to apply settings
function applySettings(colorSettings, fontSettings, imageSettings, layoutSettings, width, height) {
  if (colorSettings.enabled) {
    applyColorSettings(colorSettings);
  }

  if (fontSettings.enabled) {
    applyFontSettings(fontSettings);
  }

  if (imageSettings.enabled) {
    applyImageSettings(imageSettings);
  }

  if (layoutSettings.enabled) {
    applyLayoutSettings(layoutSettings);
  }

  if (width && height) {
    quizHelperMenu.style.width = `${width}px`;
    quizHelperMenu.style.height = `${height}px`;
  }
}

function applyColorSettings(colorSettings) {
  quizHelperMenu.style.backgroundColor = colorSettings.backgroundColor;
  quizHelperMenu.style.color = colorSettings.textColor;
  // Apply accent color to appropriate elements
  document.querySelectorAll('.accent-color').forEach(el => {
    el.style.color = colorSettings.accentColor;
  });
}

function applyFontSettings(fontSettings) {
  quizHelperMenu.style.fontFamily = fontSettings.fontFamily;
  quizHelperMenu.style.fontSize = `${fontSettings.fontSize}px`;
}

function applyImageSettings(imageSettings) {
  if (imageSettings.backgroundImage) {
    quizHelperMenu.style.backgroundImage = `url('${imageSettings.backgroundImage}')`;
    quizHelperMenu.style.backgroundSize = 'cover';
    quizHelperMenu.style.backgroundRepeat = 'no-repeat';
  } else {
    quizHelperMenu.style.backgroundImage = 'none';
  }
  quizHelperMenu.style.opacity = imageSettings.opacity;
}

function applyLayoutSettings(layoutSettings) {
  switch(layoutSettings.layout) {
    case 'compact':
      quizHelperMenu.style.padding = '10px';
      break;
    case 'spacious':
      quizHelperMenu.style.padding = '30px';
      break;
    default:
      quizHelperMenu.style.padding = '20px';
  }
  quizHelperMenu.style.borderRadius = `${layoutSettings.borderRadius}px`;
}

// Add event listener for image upload
document.getElementById('menuImageBackground').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const imageDataUrl = e.target.result;
      quizHelperMenu.style.backgroundImage = `url('${imageDataUrl}')`;
      quizHelperMenu.style.backgroundSize = 'cover';
      quizHelperMenu.style.backgroundRepeat = 'no-repeat';
    };
    reader.readAsDataURL(file);
  }
});




// Add event listener for the new button
document.getElementById('openLinkPopupButton').addEventListener('click', createLinkPopup);

// Function to create and show the link popup
function createLinkPopup() {
    // Create style element
    let style = document.createElement('style');
    style.textContent = `
        .popup {
            font-family: Arial, sans-serif;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
            padding: 24px;
            max-width: 480px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 9999;
        }
        .popup-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 16px;
            color: #333;
        }
        .section {
            margin-bottom: 24px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 12px;
            color: #555;
        }
        .link-container {
            display: flex;
            flex-direction: column;
        }
        .link-label {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            color: #333;
        }
        .link-checkbox {
            margin-right: 8px;
        }
        .button-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 24px;
        }
        .button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .button-primary {
            background-color: #007bff;
            color: white;
        }
        .button-primary:hover {
            background-color: #0056b3;
        }
        .button-secondary {
            background-color: #6c757d;
            color: white;
            margin-left: 8px;
        }
        .button-secondary:hover {
            background-color: #545b62;
        }
    `;
    document.head.appendChild(style);

    // Create pop-up component
    let popup = document.createElement('div');
    popup.className = 'popup';

    // Pop-up title
    let title = document.createElement('h3');
    title.className = 'popup-title';
    title.textContent = 'Chọn liên kết để mở';
    popup.appendChild(title);

    // Create container for sections
    let sectionsContainer = document.createElement('div');
    popup.appendChild(sectionsContainer);

    // Create sections
    let sections = {
        'Quiz': [
            'trước tiết', 'pre-class', 'before class',
            'sau tiết học', 'post-class', 'after class',
            'tự học', 'self-study', 'independent learning',
            'tiết', 'lesson', 'period',
            'củng cố', 'reinforce', 'consolidate',
            'bài tập', 'exercise', 'homework', 'assignment',
            'đánh giá', 'assessment', 'evaluation', 'quiz',
            'nộp bài', 'submit', 'turn in',
            'kiểm tra', 'test', 'exam',
            'ôn tập', 'review', 'revision',
            'luyện tập', 'practice', 'drill',
            'trắc nghiệm', 'multiple choice', 'MCQ',
            'tự luận', 'essay', 'open-ended',
            'câu hỏi', 'question', 'query',
            'bài kiểm tra', 'test paper',
            'bài thi', 'examination paper',
            'điểm số', 'score', 'grade',
            'kết quả', 'result', 'outcome',
            'học trực tuyến', 'online learning', 'e-learning',
            'video bài giảng', 'lecture video',
            'tài liệu', 'document', 'material',
            'slide', 'presentation',
            'handout', 'tài liệu phát tay'
        ],
        'Thảo luận': [
            'thảo luận', 'discussion', 'debate',
            'forum', 'diễn đàn',
            'chat', 'trò chuyện',
            'hỏi đáp', 'Q&A', 'question and answer',
            'góp ý', 'feedback', 'comment',
            'chia sẻ', 'share', 'sharing',
            'trao đổi', 'exchange', 'interact',
            'bình luận', 'comment', 'remark',
            'phản hồi', 'respond', 'reply',
            'ý kiến', 'opinion', 'view',
            'tranh luận', 'argue', 'debate',
            'nhóm học tập', 'study group',
            'họp nhóm', 'group meeting',
            'seminar', 'hội thảo',
            'workshop', 'buổi thảo luận',
            'brainstorm', 'động não',
            'phân tích', 'analyze', 'discuss',
            'đề xuất', 'propose', 'suggestion',
            'giải pháp', 'solution', 'resolve',
            'vấn đề', 'issue', 'problem'
        ]
    };

    // Get links with class 'for-nvda'
    let links = document.querySelectorAll('a.for-nvda');
    let filteredLinks = [];

    let excludeKeyword = 'hướng dẫn';

    // Create sections and add checkbox for each matching link
    Object.entries(sections).forEach(([sectionName, keywords]) => {
        let sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';

        let sectionTitle = document.createElement('h4');
        sectionTitle.className = 'section-title';
        sectionTitle.textContent = sectionName;
        sectionDiv.appendChild(sectionTitle);

        let linkContainer = document.createElement('div');
        linkContainer.className = 'link-container';
        sectionDiv.appendChild(linkContainer);

        links.forEach(link => {
            let textContent = link.textContent.toLowerCase();
            let ariaLabel = link.getAttribute('aria-label') ? link.getAttribute('aria-label').toLowerCase() : '';

            if (keywords.some(keyword => (textContent.includes(keyword) || ariaLabel.includes(keyword))) &&
                !textContent.includes(excludeKeyword) && !ariaLabel.includes(excludeKeyword)) {

                filteredLinks.push(link);

                let label = document.createElement('label');
                label.className = 'link-label';
                let checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'link-checkbox';

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(link.textContent));

                linkContainer.appendChild(label);
            }
        });

        if (linkContainer.children.length > 0) {
            sectionsContainer.appendChild(sectionDiv);
        }
    });

    // Container for buttons
    let buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    popup.appendChild(buttonContainer);

    // "Open All" button
    let openAllBtn = document.createElement('button');
    openAllBtn.textContent = 'Mở tất cả';
    openAllBtn.className = 'button button-primary';
    buttonContainer.appendChild(openAllBtn);

    // "Open Selected" button
    let openSelectedBtn = document.createElement('button');
    openSelectedBtn.textContent = 'Mở link đã chọn';
    openSelectedBtn.className = 'button button-primary';
    buttonContainer.appendChild(openSelectedBtn);

// "Close" button
    let closeBtn = document.createElement('button');
    closeBtn.textContent = 'Đóng';
    closeBtn.className = 'button button-secondary';
    buttonContainer.appendChild(closeBtn);

    // Add pop-up to body
    document.body.appendChild(popup);

    // Handle "Open All" button click
    openAllBtn.addEventListener('click', () => {
        filteredLinks.forEach(link => {
            window.open(link.href, '_blank');
        });
    });

    // Handle "Open Selected" button click
    openSelectedBtn.addEventListener('click', () => {
        let checkboxes = sectionsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                window.open(filteredLinks[index].href, '_blank');
            }
        });
    });

    // Handle "Close" button click
    closeBtn.addEventListener('click', () => {
        popup.style.display = 'none';
    });
}

// Create calculator popup
const calculatorPopup = document.createElement('div');
calculatorPopup.id = 'calculatorPopup';
calculatorPopup.style.display = 'none';
calculatorPopup.style.position = 'fixed';
calculatorPopup.style.top = '50%';
calculatorPopup.style.left = '50%';
calculatorPopup.style.transform = 'translate(-50%, -50%)';
calculatorPopup.style.zIndex = '9999';
calculatorPopup.style.backgroundColor = '#ffffff';
calculatorPopup.style.borderRadius = '20px';
calculatorPopup.style.overflow = 'hidden';
calculatorPopup.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
calculatorPopup.style.transition = 'all 0.3s ease';

calculatorPopup.innerHTML = `
    <div id="calculatorHeader" style="padding: 20px; cursor: move; background-color: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 18px; font-weight: 600; color: #333;">Calculator</span>
        <button id="closeCalculatorButton" style="background: none; border: none; font-size: 24px; color: #666; cursor: pointer; transition: color 0.3s ease;">×</button>
    </div>
    <iframe src="https://bietmaytinh.com/casio-online/" width="800" height="600" style="border: none;"></iframe>
`;

document.body.appendChild(calculatorPopup);

// Add hover effect to close button
const closeButton = calculatorPopup.querySelector('#closeCalculatorButton');
closeButton.addEventListener('mouseover', () => closeButton.style.color = '#ff4d4d');
closeButton.addEventListener('mouseout', () => closeButton.style.color = '#666');

// Add subtle animation when showing/hiding
function toggleCalculator() {
    if (calculatorPopup.style.display === 'none') {
        calculatorPopup.style.display = 'block';
        calculatorPopup.style.opacity = '0';
        calculatorPopup.style.transform = 'translate(-50%, -48%) scale(0.98)';
        setTimeout(() => {
            calculatorPopup.style.opacity = '1';
            calculatorPopup.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 50);
    } else {
        calculatorPopup.style.opacity = '0';
        calculatorPopup.style.transform = 'translate(-50%, -48%) scale(0.98)';
        setTimeout(() => {
            calculatorPopup.style.display = 'none';
        }, 300);
    }
}

// Add event listener for calculator button
document.getElementById('calculatorButton').addEventListener('click', toggleCalculator);

// Add event listener for close calculator button
document.getElementById('closeCalculatorButton').addEventListener('click', toggleCalculator);

// Calculator functions
function toggleCalculator() {
    const calculatorPopup = document.getElementById('calculatorPopup');
    calculatorPopup.style.display = calculatorPopup.style.display === 'none' ? 'block' : 'none';
}

// Make the calculator popup draggable
dragElement(document.getElementById("calculatorPopup"));

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "Header")) {
        document.getElementById(elmnt.id + "Header").onmousedown = dragMouseDown;
    } else {
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}


// Function to update scores and totals
function updateScoresAndTotals() {
    // Select all rows in the table body (excluding the header and footer)
    let rows = document.querySelectorAll('table tbody tr');
    // Loop through each row and update the scores
    rows.forEach(row => {
        // Select the columns for "Điểm số" and "Trên tổng số"
        let scoreCell = row.children[3]; // Adjust the index if necessary
        let totalScoreCell = row.children[4]; // Adjust the index if necessary
        // If both cells are found, update the score
        if (scoreCell && totalScoreCell) {
            let totalScore = totalScoreCell.innerText;
            scoreCell.innerText = totalScore;
        }
    });
    // Update the semester percentages and overall percentage
    updatePercentages();
    // Update the "Tổng cộng" row
    updateTotalRow();
}

// Function to update semester percentages and overall percentage
function updatePercentages() {
    const percentageCells = [
        document.querySelector('tfoot tr:nth-child(1) td:nth-child(2)'), // Semester 1
        document.querySelector('tfoot tr:nth-child(2) td:nth-child(2)'), // Semester 2
        document.querySelector('tfoot tr:nth-child(3) td:nth-child(2)')  // Overall
    ];
    percentageCells.forEach(cell => {
        if (cell) cell.innerText = '100.00%';
    });
}

// Function to update the "Tổng cộng" row
function updateTotalRow() {
    let tongCongRow = document.querySelector('tfoot tr:last-child td:last-child');
    if (tongCongRow) {
        tongCongRow.innerText = '100.00%';
    }
}

// Function to save toggle state
function saveToggleState(toggleId, isChecked) {
    localStorage.setItem(`${toggleId}State`, isChecked);
}

// Function to load toggle state
function loadToggleState(toggleId) {
    return localStorage.getItem(`${toggleId}State`) === 'true';
}

// Function to enable score update
function enableScoreUpdate() {
    updateScoresAndTotals();
    window.scoreUpdateInterval = setInterval(updateScoresAndTotals, 5000);
}

// Function to disable score update
function disableScoreUpdate() {
    clearInterval(window.scoreUpdateInterval);
}

// Function to handle toggle change
function handleToggleChange(toggleId, enableFunction, disableFunction) {
    const toggle = document.getElementById(toggleId);
    toggle.addEventListener('change', function() {
        if (this.checked) {
            enableFunction();
        } else {
            disableFunction();
        }
        saveToggleState(toggleId, this.checked);
    });
}

// Initialize toggles
function initializeToggles() {
    const toggles = [
        { id: 'scoreUpdateToggle', enableFn: enableScoreUpdate, disableFn: disableScoreUpdate },
        // Add more toggles here as needed
    ];

    toggles.forEach(toggle => {
        const element = document.getElementById(toggle.id);
        if (element) {
            const savedState = loadToggleState(toggle.id);
            element.checked = savedState;
            if (savedState) {
                toggle.enableFn();
            }
            handleToggleChange(toggle.id, toggle.enableFn, toggle.disableFn);
        }
    });
}

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeToggles);
// Add event listener for the Copy/Paste toggle
const copyPasteToggle = document.getElementById('copyPasteToggle');

// Function to allow copy and paste
const allowCopyAndPaste = function(e) {
    e.stopImmediatePropagation();
    return true;
};

// Function to enable copy and paste
function enableCopyPaste() {
    document.addEventListener('copy', allowCopyAndPaste, true);
    document.addEventListener('paste', allowCopyAndPaste, true);
    document.addEventListener('onpaste', allowCopyAndPaste, true);
}

// Function to disable copy and paste
function disableCopyPaste() {
    document.removeEventListener('copy', allowCopyAndPaste, true);
    document.removeEventListener('paste', allowCopyAndPaste, true);
    document.removeEventListener('onpaste', allowCopyAndPaste, true);
}

// Load saved state from local storage
const savedState = localStorage.getItem('copyPasteEnabled');
if (savedState === 'true') {
    copyPasteToggle.checked = true;
    enableCopyPaste();
} else {
    copyPasteToggle.checked = false;
    disableCopyPaste();
}

copyPasteToggle.addEventListener('change', function() {
    if (this.checked) {
        enableCopyPaste();
        localStorage.setItem('copyPasteEnabled', 'true');
        alert('Copy and Paste functionality has been enabled!');
    } else {
        disableCopyPaste();
        localStorage.setItem('copyPasteEnabled', 'false');
        alert('Copy and Paste functionality has been disabled!');
    }
});
// Key system variables
let activeKey = null;
let keyExpirationTime = null;
let validPremiumKeys = {
  permanent: [],
  monthly: [],
  biweekly: [],
  weekly: []
};
let keyUsageInfo = {};
let lastKnownKeysHash = '';

// URL của file raw GitHub chứa premium keys
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/TranMinh2908/Premium-Key/refs/heads/main/premium_keys.json';

// Hàm để tải premium keys từ GitHub và kiểm tra sự thay đổi
async function loadPremiumKeys() {
  try {
    const response = await fetch(GITHUB_RAW_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const newKeysHash = JSON.stringify(data.validPremiumKeys);

    if (lastKnownKeysHash && lastKnownKeysHash !== newKeysHash) {
      console.log('Premium keys have changed. Logging out...');
      logout();
      return;
    }

    lastKnownKeysHash = newKeysHash;

    // Kiểm tra trạng thái của từng key và cập nhật danh sách validPremiumKeys
    const updatedValidPremiumKeys = {
      permanent: [],
      monthly: [],
      biweekly: [],
      weekly: []
    };

    for (const keyType in data.validPremiumKeys) {
      for (const key of data.validPremiumKeys[keyType]) {
        if (typeof key === 'object' && key.status === true) {
          updatedValidPremiumKeys[keyType].push(key.key);
        } else if (typeof key === 'string') {
          updatedValidPremiumKeys[keyType].push(key);
        }
      }
    }

    validPremiumKeys = updatedValidPremiumKeys;
    console.log('Premium keys loaded successfully');
  } catch (error) {
    console.error('Error loading premium keys:', error);
  }
}

// Hàm để lưu thông tin sử dụng key vào localStorage
function saveKeyUsageInfo() {
  localStorage.setItem('keyUsageInfo', JSON.stringify(keyUsageInfo));
}

// Hàm để tải thông tin sử dụng key từ localStorage
function loadKeyUsageInfo() {
  const storedInfo = localStorage.getItem('keyUsageInfo');
  if (storedInfo) {
    keyUsageInfo = JSON.parse(storedInfo);
  }
}

// Hàm kiểm tra xem có đang trong khung giờ vô hiệu hóa key hay không
function isKeySystemDisabled() {
  const now = new Date();
  const day = now.getDay(); // 0 là Chủ Nhật, 1 là Thứ Hai, ..., 6 là Thứ Bảy
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Kiểm tra xem có phải là Thứ Hai hoặc Thứ Tư không
  if (day === 1 || day === 3) {
    // Kiểm tra xem có trong khoảng thời gian từ 11:35 đến 12:20 không
    if ((hour === 11 && minute >= 35) || (hour === 12 && minute < 20)) {
      return true;
    }
  }

  return false;
}

// Key system functions
function getFreeKey() {
  if (isKeySystemDisabled()) {
    alert('Hệ thống key hiện đang bị vô hiệu hóa. Vui lòng thử lại sau.');
    return;
  }

  const feedbackElement = document.createElement('div');
  feedbackElement.id = 'feedbackMessage';
  feedbackElement.textContent = 'Vui lòng chờ... Chúng tôi đang chuyển bạn tới trang quảng cáo để nhận Key miễn phí.';
  document.body.appendChild(feedbackElement);

  setTimeout(() => {
    window.location.href = 'https://link-target.net/1226842/free-version-menu-lms';
  }, 2000);
}

function handleFreeKeyActivation() {
  if (isKeySystemDisabled()) {
    alert('Hệ thống key hiện đang bị vô hiệu hóa. Vui lòng thử lại sau.');
    return;
  }

  activeKey = 'FREE';
  keyExpirationTime = Date.now() + 1800000; // 30 phút
  localStorage.setItem('activeKey', activeKey);
  localStorage.setItem('keyExpirationTime', keyExpirationTime.toString());
  showFunctions();
  startKeyTimer();
  alert('Free Key đã được kích hoạt. Bạn có 30 phút để sử dụng. Một số chức năng có sẵn cho Free Key. Hãy cân nhắc nâng cấp lên Premium để có trải nghiệm tốt nhất');

  setTimeout(() => {
    window.location.href = 'https://lms.vinschool.edu.vn';
  }, 100);
}

async function activatePremiumKey() {
  if (isKeySystemDisabled()) {
    alert('Hệ thống key hiện đang bị vô hiệu hóa. Vui lòng thử lại sau.');
    return;
  }

  const inputKey = document.getElementById('premiumKeyInput').value;
  await loadPremiumKeys(); // Đảm bảo rằng danh sách key đã được tải và kiểm tra sự thay đổi

  let keyType = null;
  let expirationTime = null;

  if (validPremiumKeys.permanent.includes(inputKey)) {
    keyType = 'PREMIUM_PERMANENT';
  } else if (validPremiumKeys.monthly.includes(inputKey)) {
    keyType = 'PREMIUM_MONTHLY';
    expirationTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  } else if (validPremiumKeys.biweekly.includes(inputKey)) {
    keyType = 'PREMIUM_BIWEEKLY';
    expirationTime = Date.now() + 14 * 24 * 60 * 60 * 1000; // 14 days
  } else if (validPremiumKeys.weekly.includes(inputKey)) {
    keyType = 'PREMIUM_WEEKLY';
    expirationTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  if (keyType) {
    // Kiểm tra xem key đã được sử dụng chưa
    if (keyUsageInfo[inputKey] && Date.now() < keyUsageInfo[inputKey]) {
      expirationTime = keyUsageInfo[inputKey];
    } else {
      // Nếu key chưa được sử dụng hoặc đã hết hạn, cập nhật thông tin mới
      keyUsageInfo[inputKey] = expirationTime;
      saveKeyUsageInfo();
    }

    activeKey = keyType;
    keyExpirationTime = expirationTime;
    localStorage.setItem('activeKey', activeKey);
    if (expirationTime) {
      localStorage.setItem('keyExpirationTime', expirationTime.toString());
    } else {
      localStorage.removeItem('keyExpirationTime');
    }
    showFunctions();
    if (expirationTime) {
      startKeyTimer();
    }
    alert(`Chúc mừng Bạn đã kích hoạt ${keyType.replace('_', ' ')} Key. Tận hưởng đầy đủ tính năng`);
  } else {
    alert('Premium Key không hợp lệ Hãy liên hệ chúng tôi để mua Premium Key chính hãng.');
  }
}

function showFunctions() {
  document.getElementById('keySection').style.display = 'none';
  document.getElementById('functionsSection').style.display = 'block';
  const buttons = document.querySelectorAll('#functionsSection button');
  const inputs = document.querySelectorAll('#functionsSection input');

  buttons.forEach(button => {
    button.disabled = false;
    button.onclick = null;
  });

  inputs.forEach(input => {
    input.disabled = false;
  });
}

function showPremiumAlert() {
  alert('Tính năng này chỉ dành cho người dùng Premium. Vui lòng nâng cấp để sử dụng!');
}

function checkKeyValidity() {
  if (isKeySystemDisabled()) {
    activeKey = 'PREMIUM_TEMPORARY';
    showFunctions();
    return;
  }

  const storedKey = localStorage.getItem('activeKey');
  const storedExpirationTime = localStorage.getItem('keyExpirationTime');

  if (storedKey && storedKey.startsWith('PREMIUM')) {
    if (storedExpirationTime) {
      if (Date.now() < parseInt(storedExpirationTime)) {
        activeKey = storedKey;
        keyExpirationTime = parseInt(storedExpirationTime);
        showFunctions();
        startKeyTimer();
      } else {
        logout();
      }
    } else {
      activeKey = storedKey;
      showFunctions();
    }
  } else if (storedKey === 'FREE' && storedExpirationTime && Date.now() < parseInt(storedExpirationTime)) {
    activeKey = 'FREE';
    keyExpirationTime = parseInt(storedExpirationTime);
    showFunctions();
    startKeyTimer();
  } else {
    logout();
  }
}

function logout() {
  if (isKeySystemDisabled()) {
    alert('Hệ thống key hiện đang bị vô hiệu hóa. Bạn không thể đăng xuất lúc này.');
    return;
  }

  activeKey = null;
  keyExpirationTime = null;
  localStorage.removeItem('activeKey');
  localStorage.removeItem('keyExpirationTime');
  // Không xóa keyUsageInfo để giữ lại thông tin sử dụng key
  document.getElementById('keySection').style.display = 'block';
  document.getElementById('functionsSection').style.display = 'none';
  alert('Phiên của bạn đã kết thúc. Vui lòng kích hoạt key để tiếp tục sử dụng.');
}

function isFreeFeature(id) {
  return ['extractButton', 'selectAnswersButton', 'startTimerButton', 'playMusicButton', 'openGithubButton', 'startFarmButton'].includes(id);
}

function checkFreeKeyActivation() {
  if (window.location.href === 'https://lms.vinschool.edu.vn/free-key') {
    handleFreeKeyActivation();
  }
}

function addSecondKeyButton() {
  if (window.location.href === 'https://lms.vinschool.edu.vn/free-key2') {
    window.location.href = 'http://go.megaurl.in/z3xigk';
  }
}

function startKeyTimer() {
  const remainingTimeElement = document.getElementById('remainingTime');
  const timeLeftElement = document.getElementById('timeLeft');
  remainingTimeElement.style.display = 'block';

  const interval = setInterval(() => {
    if (isKeySystemDisabled()) {
      clearInterval(interval);
      remainingTimeElement.style.display = 'none';
      return;
    }

    const now = Date.now();
    const timeRemaining = keyExpirationTime - now;

    if (timeRemaining <= 0) {
      clearInterval(interval);
      logout();
    } else {
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      let timeString = '';
      if (days > 0) {
        timeString = `${days}d ${hours}h`;
      } else if (hours > 0) {
        timeString = `${hours}h ${minutes}m`;
      } else {
        timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      }

      timeLeftElement.textContent = timeString;

      if (activeKey === 'FREE' && minutes === 0 && seconds === 60) {
        alert('Còn 1 phút trước khi phiên miễn phí của bạn kết thúc.');
      }
    }
  }, 1000);
}

// Add event listeners
document.getElementById('getFreeKeyButton').addEventListener('click', getFreeKey);
document.getElementById('activatePremiumKeyButton').addEventListener('click', activatePremiumKey);
document.getElementById('logoutButton').addEventListener('click', logout);
document.getElementById('contactButton').addEventListener('click', () => {
  alert('Vui lòng liên hệ Admin để nhận thông tin về ưu đãi đặc biệt!');
});

// Check key validity and load premium keys on load
window.addEventListener('load', () => {
  loadPremiumKeys();
  loadKeyUsageInfo();
  checkKeyValidity();
  checkFreeKeyActivation();
  addSecondKeyButton();
});

// Kiểm tra sự thay đổi của premium keys mỗi 5 phút
setInterval(loadPremiumKeys, 300000);

// Show ads for Premium every 3 minutes for free users
setInterval(() => {
  if (activeKey === 'FREE' && !isKeySystemDisabled()) {
    if (window.location.href !== 'https://lms.vinschool.edu.vn/free-key-checkpoint1') {
      localStorage.setItem('previousPage', window.location.href);
      window.location.href = 'https://shrinkme.ink/Ads_LMS';
    } else {
      setTimeout(() => {
        localStorage.setItem('previousPage', window.location.href);
        window.location.href = 'https://shrinkme.ink/Ads_LMS';
      }, 300000);
    }
  }
}, 180000);

// Kiểm tra khi trang được tải
window.addEventListener('load', function() {
  if (window.location.href === 'https://shrinkme.ink/Ads_LMS') {
    setTimeout(function() {
      alert('Bạn đã xem quảng cáo thành công!');
      const previousPage = localStorage.getItem('previousPage');
      if (previousPage) {
        window.location.href = previousPage;
        localStorage.removeItem('previousPage');
      }
    }, 5000);
  }
});
// Auto-Submit Feature
let autoSubmitEnabled = false;

document.getElementById('autoSubmitToggle').addEventListener('click', () => {
    autoSubmitEnabled = !autoSubmitEnabled;
    alert(`Auto-Submit is now ${autoSubmitEnabled ? 'ENABLED' : 'DISABLED'}`);
    if (autoSubmitEnabled) {
        enableAutoSubmit();
    } else {
        disableAutoSubmit();
    }
});

function enableAutoSubmit() {
    // Set up a MutationObserver to observe changes in the document
    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' && autoSubmitEnabled) {
                const submitButton = document.querySelector('.btn.submit_button.quiz_submit.btn-primary');
                if (submitButton) {
                    submitButton.click();
                }
            }
        }
    });

    // Start observing the document body for child node changes
    observer.observe(document.body, { childList: true, subtree: true });

    // Store the observer so we can disconnect it later
    document.autoSubmitObserver = observer;
}

function disableAutoSubmit() {
    // Disconnect the MutationObserver if it exists
    if (document.autoSubmitObserver) {
        document.autoSubmitObserver.disconnect();
        document.autoSubmitObserver = null;
    }
}



// Add event listeners
let audio;
const playMusicButton = document.getElementById('playMusicButton');
const pauseMusicButton = document.getElementById('pauseMusicButton');
const volumeSlider = document.getElementById('volumeSlider');
const trackInfo = document.getElementById('trackInfo');
const currentTrack = document.getElementById('currentTrack');

playMusicButton.addEventListener('click', () => {
    if (!audio) {
        audio = new Audio('https://ia904603.us.archive.org/4/items/official-rickroll-download-pls-dont-give-me-copyright-strike/Official%20Rickroll%20Download%20%28Pls%20don%27t%20give%20me%20copyright%20strike%29.mp3');
        audio.addEventListener('loadedmetadata', () => {
            trackInfo.textContent = `:))) - ${audio.duration.toFixed(2)}s`;
            currentTrack.style.display = 'block';
        });
    }
    audio.play();
});

pauseMusicButton.addEventListener('click', () => {
    if (audio) {
        audio.pause();
    }
});

volumeSlider.addEventListener('input', (e) => {
    if (audio) {
        audio.volume = e.target.value;
    }
});



function showMenu() {
    const menu = document.getElementById('quizHelperMenu');
    menu.style.display = 'block';
    menu.style.animation = 'fadeIn 0.5s ease-out';
}

// Matrix effect in console
function runMatrix() {
    const columns = Math.floor(window.innerWidth / 10);
    const drops = Array(columns).fill(0);
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    console.clear();

    function drawMatrix() {
        let output = '';
        for (let i = 0; i < drops.length; i++) {
            const char = characters.charAt(Math.floor(Math.random() * characters.length));
            output += `%c${char} `;

            drops[i]++;

            if (drops[i] * 10 > window.innerHeight) {
                drops[i] = 0;
            }
        }
        console.log(output, 'color: lime;');
    }

    setInterval(drawMatrix, 100);
}

// Run matrix effect
runMatrix();

// Show the menu after the welcome animation
setTimeout(() => {
    menu.style.display = 'block';
    menu.style.animation = 'fadeIn 0.5s ease-out';
}); // 4000ms = 3s (welcome duration) + 0.5s (fade out) + 0.5s (buffer)

// Create extraction popup
const popup = document.createElement('div');
popup.id = 'extractionPopup';
popup.innerHTML = `
     <h2>Câu Hỏi Đã Khai Thác</h2>
    <div id="extractionContent"></div>
    <button id="copyButton">📋 Sao Chép vào Bộ Nhớ Tạm</button>
    <button id="closeButton">❌ Đóng</button>
`;
document.body.appendChild(popup);

// Create toast notification
const toast = document.createElement('div');
toast.id = 'toast';
document.body.appendChild(toast);

// Drag functionality
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;
let lastTime = 0;
let velocity = { x: 0, y: 0 };

const menuHeader = document.getElementById('menuHeader');
menuHeader.addEventListener("mousedown", dragStart);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", dragEnd);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === menuHeader) {
        isDragging = true;
        lastTime = performance.now();
        menu.style.transition = 'none';
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        const currentTime = performance.now();
        const dt = (currentTime - lastTime) / 1000; // delta time in seconds

        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Calculate velocity
        velocity.x = (currentX - xOffset) / dt;
        velocity.y = (currentY - yOffset) / dt;

        xOffset = currentX;
        yOffset = currentY;

        requestAnimationFrame(() => setTranslate(currentX, currentY, menu));

        lastTime = currentTime;
    }
}

function dragEnd(e) {
    isDragging = false;
    applyMomentum();
}

function applyMomentum() {
    const friction = 0.95;
    let animating = true;

    function momentumLoop() {
        if (!animating) return;

        velocity.x *= friction;
        velocity.y *= friction;

        xOffset += velocity.x * 0.016; // Assuming 60fps (1/60 ≈ 0.016)
        yOffset += velocity.y * 0.016;

        // Apply bounds
        const bounds = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        xOffset = Math.max(0, Math.min(xOffset, viewportWidth - bounds.width));
        yOffset = Math.max(0, Math.min(yOffset, viewportHeight - bounds.height));

        setTranslate(xOffset, yOffset, menu);

        if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
            requestAnimationFrame(momentumLoop);
        } else {
            animating = false;
            menu.style.transition = 'transform 0.3s ease-out';
        }
    }

    requestAnimationFrame(momentumLoop);
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

function extractQuizAnswers() {
    let quizText = '';
    const imagesToOpen = [];
    setTimeout(() => {
        const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');
        if (questionElements.length === 0) {
            showToast('Failed to extract questions. Please try again.');
            return;
        }
        questionElements.forEach((questionElement, index) => {
            let questionText = questionElement.querySelector('.question_text')
                ? questionElement.querySelector('.question_text').innerText
                : '';
            quizText += `Câu hỏi ${index + 1}: ${questionText}\n`;
            // Check for images in the question
            const questionImages = questionElement.querySelectorAll('img[alt*="Screenshot"]');
            questionImages.forEach((img, imgIndex) => {
                quizText += `Hình ảnh câu hỏi ${index + 1}.${imgIndex + 1}: [${img.alt}]\n`;
                imagesToOpen.push(img.src);
            });
            questionElement.querySelectorAll('.answer, .answer-text, .option').forEach((answerElement, answerIndex) => {
                let answerText = answerElement.innerText.trim();
                // Check for image elements inside the answer
                const imageElements = answerElement.querySelectorAll('img[alt*="Screenshot"]');
                if (imageElements.length > 0) {
                    imageElements.forEach((img, imgIndex) => {
                        quizText += `Hình ảnh đáp án ${index + 1}.${answerIndex + 1}.${imgIndex + 1}: [${img.alt}]\n`;
                        imagesToOpen.push(img.src);
                    });
                }
                // Append text if exists
                if (answerText) {
                    quizText += `${answerText}\n`;
                }
            });
            quizText += '\n'; // Add a blank line between questions
        });
        // Add instruction to the extracted text
        const instruction = "\n\nĐưa đáp án cho các câu hỏi, mỗi đáp án cách nhau bằng dấu chấm phẩy (;). Chỉ ghi đúng nội dung đáp án, không thêm bất kỳ từ nào khác. Tất cả đáp án phải nằm trên một dòng duy nhất, không xuống dòng. Ví dụ: Cả hai đáp án đúng; Trồng lúa lấy gạo để xuất khẩu; Sử dụng thuốc hóa học; Cả 3 đáp án; Tăng diện tích đất trồng";
        quizText += instruction;
        // Copy to clipboard
        navigator.clipboard.writeText(quizText).then(() => {
            showToast('Quiz content extracted and copied to clipboard!');
            // Open all image links in new tabs
            imagesToOpen.forEach(imageUrl => {
                window.open(imageUrl, '_blank');
            });
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy content. Please try again.');
        });
    }, 1000); // Wait 1 second to ensure all questions have fully loaded
}



function selectCorrectAnswers(correctAnswers, autoSubmit = false) {
    try {
        const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');
        let answerIndex = 0;
        questionElements.forEach((element) => {
            if (isMatchingQuestion(element)) {
                handleMatchingQuestionSelection(element, correctAnswers.slice(answerIndex));
                answerIndex += getMatchingPairsCount(element);
            } else if (isFillInTheBlankQuestion(element)) {
                const blankCount = handleFillInTheBlankQuestion(element, correctAnswers.slice(answerIndex));
                answerIndex += blankCount;
            } else if (isCheckboxListQuestion(element)) {
                const checkboxCount = handleCheckboxListQuestion(element, correctAnswers.slice(answerIndex));
                answerIndex += checkboxCount;
            } else {
                const answer = correctAnswers[answerIndex++];
                if (answer) {
                    selectMultipleChoiceAnswer(element, answer);
                }
            }
        });
        showToast('Answers selected successfully!');
        if (autoSubmit) {
            const submitButton = document.querySelector('.btn.submit_button.quiz_submit.btn-primary');
            if (submitButton) {
                submitButton.click();
            } else {
                showToast('Submit button not found. Please submit manually.');
            }
        }
    } catch (error) {
        handleError(error, 'Failed to select answers. Please try again.');
    }
}

function isMatchingQuestion(element) {
    return element.querySelectorAll('select').length > 0;
}

function isFillInTheBlankQuestion(element) {
    return element.querySelectorAll('input[type="text"]').length > 0;
}

function isCheckboxListQuestion(element) {
    return element.querySelectorAll('input[type="checkbox"]').length > 0;
}

function getMatchingPairsCount(element) {
    return element.querySelectorAll('select').length;
}

function handleMatchingQuestionSelection(element, answers) {
    const selects = element.querySelectorAll('select');
    selects.forEach((select, index) => {
        if (index < answers.length) {
            const answer = answers[index].trim().toLowerCase();
            const option = Array.from(select.options).find(opt =>
                opt.text.trim().toLowerCase().includes(answer) ||
                answer.includes(opt.text.trim().toLowerCase())
            );
            if (option) {
                select.value = option.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    });
}

function handleFillInTheBlankQuestion(element, answers) {
    const inputs = element.querySelectorAll('input[type="text"]');
    inputs.forEach((input, index) => {
        if (index < answers.length) {
            input.value = answers[index];
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    return inputs.length; // Return the number of blanks filled
}

function handleCheckboxListQuestion(element, answers) {
    const checkboxes = element.querySelectorAll('input[type="checkbox"]');
    let checkedCount = 0;
    checkboxes.forEach((checkbox, index) => {
        const label = checkbox.closest('label') || checkbox.nextElementSibling;
        if (label) {
            const labelText = label.textContent.trim().toLowerCase();
            const shouldBeChecked = answers.some(answer =>
                labelText.includes(answer.toLowerCase()) ||
                answer.toLowerCase().includes(labelText)
            );
            if (shouldBeChecked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                checkedCount++;
            }
        }
    });
    return checkedCount;
}

function selectMultipleChoiceAnswer(element, answer) {
    const answerElements = Array.from(element.querySelectorAll('input[type="radio"], input[type="checkbox"], .answer-choice, .mcq-option, div[role="radio"], div[role="checkbox"], label'));
    const matchingAnswer = answerElements.find(a => a.innerText.trim().toLowerCase().includes(answer.toLowerCase()));
    if (matchingAnswer) {
        matchingAnswer.click();
        matchingAnswer.classList.add('selected-answer');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function handleError(error, message) {
    console.error(error);
    showToast(message);
}

// New function to save auto-submit preference
function saveAutoSubmitPreference(autoSubmit) {
    localStorage.setItem('autoSubmitPreference', autoSubmit);
}

// New function to load auto-submit preference
function loadAutoSubmitPreference() {
    const savedPreference = localStorage.getItem('autoSubmitPreference');
    return savedPreference === 'true';
}

// New function to initialize the auto-submit checkbox
function initializeAutoSubmitCheckbox() {
    const autoSubmitCheckbox = document.getElementById('autoSubmitCheckbox');
    if (autoSubmitCheckbox) {
        const savedPreference = loadAutoSubmitPreference();
        autoSubmitCheckbox.checked = savedPreference;

        autoSubmitCheckbox.addEventListener('change', function() {
            saveAutoSubmitPreference(this.checked);
        });
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', initializeAutoSubmitCheckbox);

// Modify your existing code to use the new auto-submit preference
function yourExistingFunction() {
    const correctAnswers = ['answer1', 'answer2', 'answer3']; // Replace with your actual answers
    const autoSubmit = loadAutoSubmitPreference();
    selectCorrectAnswers(correctAnswers, autoSubmit);
}

// Event listener for the select answers button
document.getElementById('selectAnswersButton').addEventListener('click', function() {
    const answersInput = document.getElementById('answersInput').value;
    const correctAnswers = answersInput.split(';').map(answer => answer.trim());
    const autoSubmit = document.getElementById('autoSubmitCheckbox').checked;
    selectCorrectAnswers(correctAnswers, autoSubmit);
});
function autoAnswerRandom() {
    try {
        const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');
        questionElements.forEach(element => {
            if (isMatchingQuestion(element)) {
                handleMatchingQuestionRandom(element);
            } else {
                selectRandomMultipleChoiceAnswer(element);
            }
        });
        showToast('Random answers selected for all questions!');

        // Check if auto-submit is enabled and submit if it is
        if (document.getElementById('autoSubmitCheckbox').checked) {
            submitAnswers();
        }
    } catch (error) {
        handleError(error, 'Failed to select random answers. Please try again.');
    }
}

function handleMatchingQuestionRandom(element) {
    const selects = element.querySelectorAll('select');
    selects.forEach(select => {
        const options = Array.from(select.options).filter(option => option.value !== '');
        if (options.length > 0) {
            const randomOption = options[Math.floor(Math.random() * options.length)];
            select.value = randomOption.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}

function selectRandomMultipleChoiceAnswer(element) {
    const answers = Array.from(element.querySelectorAll('input[type="radio"], input[type="checkbox"], .answer-choice, .mcq-option'));
    if (answers.length > 0) {
        const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
        randomAnswer.click();
        randomAnswer.classList.add('selected-answer');
    }
}

function submitAnswers() {
    const submitButton = document.querySelector('.btn.submit_button.quiz_submit.btn-primary');
    if (submitButton) {
        submitButton.click();
    } else {
        showToast('Submit button not found. Please submit manually.');
    }
}
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('quizHelperDarkMode', isDarkMode);
    showToast(`${isDarkMode ? 'Dark' : 'Light'} mode enabled`);
}



// New functionality for saving and loading answers
function saveAnswers() {
    const answers = document.getElementById('answersInput').value;
    const blob = new Blob([answers], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'quiz_answers.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Answers saved and downloaded successfully!');

    // Also save to localStorage for auto-loading
    localStorage.setItem('quizHelperAnswers', answers);
}

function loadAnswers() {
    const savedAnswers = localStorage.getItem('quizHelperAnswers');
    if (savedAnswers) {
        document.getElementById('answersInput').value = savedAnswers;
        showToast('Answers loaded successfully!');
    } else {
        showToast('No saved answers found.');
    }
}

// Timer functionality
let timerInterval;
let timeLeft = 0;

function startTimer(duration) {
    clearInterval(timerInterval);
    timeLeft = duration * 60;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showToast('Time\'s up!');
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timerDisplay').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Answer highlighting
function highlightAnswers() {
    const answers = document.getElementById('answersInput').value.split(';').map(answer => answer.trim().toLowerCase());
    const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');

    questionElements.forEach((element) => {
        const answerElements = element.querySelectorAll('.answer, .answer-text, .option');
        answerElements.forEach((answerElement) => {
            const answerText = answerElement.innerText.trim().toLowerCase();
            if (answers.some(answer => answerText.includes(answer))) {
                answerElement.style.backgroundColor = 'yellow';
                answerElement.style.fontWeight = 'bold';
            }
        });
    });

    showToast('Answers highlighted!');
}

// Answer frequency analysis
function analyzeAnswerFrequency() {
    const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');
    const frequencyMap = new Map();

    questionElements.forEach((element) => {
        const selectedAnswer = element.querySelector('input:checked, select option:checked');
        if (selectedAnswer) {
            const answerText = selectedAnswer.value || selectedAnswer.textContent.trim();
            frequencyMap.set(answerText, (frequencyMap.get(answerText) || 0) + 1);
        }
    });

    let analysisText = 'Answer Frequency Analysis:\n\n';
    for (const [answer, frequency] of frequencyMap.entries()) {
        analysisText += `${answer}: ${frequency} time(s)\n`;
    }

    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.border = '1px solid black';
    popup.style.zIndex = '10000';
    popup.innerHTML = `<h3>Answer Frequency Analysis</h3><pre>${analysisText}</pre><button id="closeAnalysis">Close</button>`;

    document.body.appendChild(popup);

    document.getElementById('closeAnalysis').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
}

// Farm functionality
let isFarming = false;
let farmCount = 0;
let totalIterations = 0;

// Check if Tampermonkey is installed
const isTampermonkeyInstalled = typeof GM_info !== 'undefined';

document.addEventListener('DOMContentLoaded', (event) => {
    if (!isTampermonkeyInstalled) {
        alert("This script requires the Tampermonkey extension to function properly. Please install Tampermonkey before using this feature.");
        return;
    }

    // Load saved selections from localStorage
    const savedFarmRandom = localStorage.getItem('farmRandom') === 'true';
    const savedFarmInput = localStorage.getItem('farmInput') === 'true';
    const savedTotalIterations = localStorage.getItem('totalIterations');
    const savedFarmCount = localStorage.getItem('farmCount');

    if (savedFarmRandom || savedFarmInput) {
        document.getElementById('farmRandom').checked = savedFarmRandom;
        document.getElementById('farmInput').checked = savedFarmInput;
    }

    if (savedTotalIterations) {
        document.getElementById('iterationsInput').value = savedTotalIterations;
        totalIterations = parseInt(savedTotalIterations);
    }

    if (savedFarmCount) {
        farmCount = parseInt(savedFarmCount);
    }

    // Add event listeners to save selections when they change
    document.getElementById('farmRandom').addEventListener('change', (event) => {
        localStorage.setItem('farmRandom', event.target.checked);
    });
    document.getElementById('farmInput').addEventListener('change', (event) => {
        localStorage.setItem('farmInput', event.target.checked);
    });
    document.getElementById('iterationsInput').addEventListener('change', (event) => {
        localStorage.setItem('totalIterations', event.target.value);
    });

    // Start farming automatically after a delay to ensure page is fully loaded
    setTimeout(startFarming, 3000);
});

function startFarming() {
    if (!isTampermonkeyInstalled) {
        alert("This script requires the Tampermonkey extension to function properly. Please install Tampermonkey before using this feature.");
        return;
    }

    const farmRandom = document.getElementById('farmRandom').checked;
    const farmInput = document.getElementById('farmInput').checked;

    if (!farmRandom && !farmInput) {
        showToast('Please select at least one farming method!');
        return;
    }

    totalIterations = parseInt(document.getElementById('iterationsInput').value) || Infinity;
    localStorage.setItem('totalIterations', totalIterations);

    isFarming = true;
    farmStep();
}


function farmStep() {
    if (!isFarming) return;

    if (farmCount >= totalIterations && totalIterations !== Infinity) {
        stopFarming();
        return;
    }

    // Check if we're on the menu page or quiz page
    const primaryButton = document.querySelector('.btn.btn-primary');
    if (primaryButton) {
        // We're on the menu page, start a new quiz
        primaryButton.click();
        // Wait for 1 second before handling the quiz page
        setTimeout(handleQuizPage, 500);
    } else {
        // We might be on the quiz page already
        handleQuizPage();
    }
}

function handleQuizPage() {
    const farmRandom = document.getElementById('farmRandom').checked;
    const farmInput = document.getElementById('farmInput').checked;

    if (farmRandom) {
        autoAnswerRandom();
    } else if (farmInput) {
        const answers = document.getElementById('answersInput').value;
        if (answers) {
            const answersArray = answers.split(';').map(answer => answer.trim());
            selectCorrectAnswers(answersArray);
        } else {
            showToast('Please enter answers for input-based farming.');
            stopFarming();
            return;
        }
    }

    // Submit the quiz
    const submitButton = document.querySelector('.btn.submit_button.quiz_submit.btn-primary');
    if (submitButton) {
        submitButton.click();
        farmCount++;
        localStorage.setItem('farmCount', farmCount);

        // Wait for 1 second before continuing to the next step
        setTimeout(farmStep, 500);
    } else {
        showToast('Submit button not found. Reloading page.');
        setTimeout(() => location.reload(), 500);
    }
}

function stopFarming() {
    isFarming = false;
    localStorage.removeItem('farmCount');
    showToast('Farming stopped!');
}

// Add this function to handle visibility changes
document.addEventListener('visibilitychange', function() {
    if (!isTampermonkeyInstalled) {
        return;
    }

    if (!document.hidden && isFarming) {
        // When the page becomes visible again, wait for 1 second before continuing farming
        setTimeout(farmStep, 1000);
    }
});

// Add a check for Tampermonkey in the global scope
if (!isTampermonkeyInstalled) {
    console.warn("This script requires the Tampermonkey extension to function properly. Please install Tampermonkey before using this feature.");
}

// Add emergency stop button
const emergencyStopButton = document.createElement('button');
emergencyStopButton.textContent = 'Reset All';
emergencyStopButton.style.position = 'fixed';
emergencyStopButton.style.top = '10px';
emergencyStopButton.style.right = '10px';
emergencyStopButton.style.zIndex = '9999';
emergencyStopButton.addEventListener('click', function() {
    stopFarming();
    localStorage.clear();
    showToast('Data cleared.');
});
document.body.appendChild(emergencyStopButton);

// Event listeners
document.getElementById('extractButton').addEventListener('click', extractQuizAnswers);
document.getElementById('selectAnswersButton').addEventListener('click', () => {
    const answers = document.getElementById('answersInput').value;
    if (answers) {
        const answersArray = answers.split(';').map(answer => answer.trim());
        selectCorrectAnswers(answersArray);
    } else {
        showToast('Please enter answers before selecting.');
    }
});
document.getElementById('autoAnswerButton').addEventListener('click', autoAnswerRandom);
document.getElementById('toggleThemeButton').addEventListener('click', toggleTheme);
document.getElementById('minimizeButton').addEventListener('click', toggleMinimize);
document.getElementById('saveAnswersButton').addEventListener('click', saveAnswers);
document.getElementById('loadAnswersButton').addEventListener('click', loadAnswers);
document.getElementById('startTimerButton').addEventListener('click', () => {
    const duration = parseInt(document.getElementById('timerInput').value);
    if (duration > 0) {
        startTimer(duration);
    } else {
        showToast('Please enter a valid duration.');
    }
});
document.getElementById('highlightAnswersButton').addEventListener('click', highlightAnswers);
document.getElementById('analyzeAnswersButton').addEventListener('click', analyzeAnswerFrequency);
document.getElementById('startFarmButton').addEventListener('click', () => {
    if (isFarming) {
        stopFarming();
    } else {
        startFarming();
    }
});

const answersInput = document.getElementById('answersInput');
answersInput.addEventListener('paste', (e) => {
    e.stopPropagation();
});

document.getElementById('copyButton').addEventListener('click', () => {
    const content = document.getElementById('extractionContent').textContent;
    const instruction = "\n\nĐưa đáp án cho các câu hỏi, mỗi đáp án cách nhau bằng dấu chấm phẩy (;). Chỉ ghi đúng nội dung đáp án, không thêm bất kỳ từ nào khác. Tất cả đáp án phải nằm trên một dòng duy nhất, không xuống dòng. Ví dụ: Cả hai đáp án đúng; Trồng lúa lấy gạo để xuất khẩu; Sử dụng thuốc hóa học; Cả 3 đáp án; Tăng diện tích đất trồng";
    navigator.clipboard.writeText(content + instruction).then(() => {
        showToast('Content copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy content. Please try again.');
    });
});

document.getElementById('closeButton').addEventListener('click', () => {
    document.getElementById('extractionPopup').style.display = 'none';
});

// Function to initialize the menu state from local storage
function initializeMenuState() {
    const menu = document.getElementById('quizHelperMenu');
    const menuState = localStorage.getItem('quizHelperMenuState');

    if (menuState === 'none') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}

// Function to update the menu state in local storage
function updateMenuState(isVisible) {
    const menu = document.getElementById('quizHelperMenu');
    menu.style.display = isVisible ? 'block' : 'none';
    localStorage.setItem('quizHelperMenuState', isVisible ? 'block' : 'none');
    showToast(isVisible ? 'StudyAidX opened' : 'StudyAidX hidden');
}

// Event listener for keyboard shortcut
document.addEventListener('keydown', function(event) {
    // Ctrl + Q to toggle menu visibility
    if (event.ctrlKey && event.key === 'q') {
        event.preventDefault();
        const menu = document.getElementById('quizHelperMenu');
        const isVisible = menu.style.display !== 'none';
        updateMenuState(!isVisible);
    }
});

// Initialize the menu state when the page loads
document.addEventListener('DOMContentLoaded', initializeMenuState);
// Initialize theme
const savedTheme = localStorage.getItem('quizHelperDarkMode');
if (savedTheme === 'true') {
    document.body.classList.add('dark-mode');
}

// Accessibility improvements
function improveAccessibility() {
    const menu = document.getElementById('quizHelperMenu');
    menu.setAttribute('role', 'region');
    menu.setAttribute('aria-label', 'StudyAidX Menu');

    const buttons = menu.querySelectorAll('button');
    buttons.forEach(button => {
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', button.textContent.trim());
        }
    });

    const input = document.getElementById('answersInput');
    input.setAttribute('aria-label', 'Enter correct answers');
}

// Call accessibility improvements
improveAccessibility();

// Auto-load answers when the script runs
loadAnswers();

console.log('StudyAidX initialized successfully!');


})();
