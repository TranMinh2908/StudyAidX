// ==UserScript==
    // @name         StudyAidX
    // @namespace    http://tampermonkey.net/
    // @version      1.1
    // @description  A helper tool for quizzes on lms.vinschool.edu.vn by StudyAidX Admin
    // @match        https://lms.vinschool.edu.vn/*
    // @grant        GM_setValue
    // @grant        GM_getValue
    // ==/UserScript==

    // Always enable copy and paste
    (function() {
        const events = ['copy', 'paste', 'onpaste'];
        const handler = (e) => {
            e.stopImmediatePropagation();
            return true;
        };
        events.forEach(event => {
            document.addEventListener(event, handler, true);
        });
    })();

    // Initialize menu hidden state from storage
    const isMenuHidden = GM_getValue('menuHidden', false);

    // Create menu with initial hidden state
    const menu = document.createElement('div');
    menu.id = 'studyAidMenu';
    menu.style.display = isMenuHidden ? 'none' : 'block';
    document.body.appendChild(menu);

    // Rest of menu creation code goes here

    // Add keyboard shortcut for hiding menu
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'q') {
            const menu = document.getElementById('studyAidMenu');
            const isHidden = menu.style.display === 'none';
            menu.style.display = isHidden ? 'block' : 'none';
            GM_setValue('menuHidden', !isHidden);
        }
    });

    // [Rest of the code remains the same...]
    const firebaseScript = document.createElement('script');
    firebaseScript.src = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js';
    document.head.appendChild(firebaseScript);

    const firebaseAuthScript = document.createElement('script');
    firebaseAuthScript.src = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js';

    const firebaseFirestoreScript = document.createElement('script');
    firebaseFirestoreScript.src = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js';

    const firebaseStorageScript = document.createElement('script');
    firebaseStorageScript.src = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage-compat.js';

    // Đợi Firebase load xong theo thứ tự
    firebaseScript.onload = () => {
        console.log('Firebase App loaded');
        document.head.appendChild(firebaseAuthScript);

        firebaseAuthScript.onload = () => {
            console.log('Firebase Auth loaded');
            document.head.appendChild(firebaseFirestoreScript);

            firebaseFirestoreScript.onload = () => {
                console.log('Firebase Firestore loaded');
                document.head.appendChild(firebaseStorageScript);

                firebaseStorageScript.onload = () => {
                    console.log('Firebase Storage loaded');
                    initializeFirebase();
                };
            };
        };
    };

    // [Rest of the code remains the same...]
    const loginStyle = document.createElement('style');
    loginStyle.textContent = `
        #googleSignInBtn, .google-sign-in-btn {
            background-color: #4285f4;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px;
            transition: background-color 0.3s;
        }

        #googleSignInBtn:hover, .google-sign-in-btn:hover {
            background-color: #357ae8;
        }

        #googleSignInBtn img, .google-sign-in-btn img {
            width: 20px;
            height: 20px;
        }

        #userInfo {
            display: none;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
            margin: 10px;
        }

        #userInfo.show {
            display: block;
        }

        .login-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            text-align: center;
        }

        .login-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        }

        .cancel-btn {
            background: #f1f1f1;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
        }

        .cancel-btn:hover {
            background: #e4e4e4;
        }
    `;
    document.head.appendChild(loginStyle);

    const loginSection = `
        <div id="loginSection" class="section">
            <div class="section-title">User Authentication</div>
            <button id="googleSignInBtn" title="Đăng nhập bằng tài khoản Google của bạn">
                <img src="https://www.google.com/favicon.ico" alt="Google Icon">
                Sign in with Google
            </button>
            <div id="userInfo"></div>
        </div>
    `;

    const keySection = `
        <div id="keySection" class="section">
            <div class="free-key-section">
                <div class="section-title">Free Key System</div>
                <input type="text" id="freeKeyInput" placeholder="Nhập Free Key của bạn">
                <button id="activateFreeKeyButton" title="Kích hoạt Free Key để sử dụng các tính năng cơ bản">Kích hoạt Free Key</button>
                <button id="getFreeKeyButton" title="Nhận Free Key miễn phí để dùng thử">Nhận Free Key</button>

            <div class="premium-key-section">
                <div class="section-title">Admin Key System</div>
                <input type="text" id="premiumKeyInput" placeholder="Nhập Admin Key của bạn">
                <button id="activatePremiumKeyButton" title="Kích hoạt Admin Key để sử dụng đầy đủ tính năng">Kích hoạt Admin Key</button>
                <button id="contactButton" title="Liên hệ với Admin để được hỗ trợ">Liên hệ Admin</button>
            </div>

            <div id="remainingTime" style="display: none;">
                <div class="section-title">Thời gian còn lại</div>
                <div id="timeLeft"></div>
            </div>
        </div>
    `;
    // Thêm style cho phần free key
    const keyStyle = document.createElement('style');
    keyStyle.textContent = `
        .free-key-section, .premium-key-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
        }

        .turbo-mode {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
        }

        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
        }

        input:checked + .slider {
            background-color: #2196F3;
        }

        input:checked + .slider:before {
            transform: translateX(26px);
        }

        .slider.round {
            border-radius: 24px;
        }

        .slider.round:before {
            border-radius: 50%;
        }

        #freeKeyInput, #premiumKeyInput {
            width: 100%;
            padding: 8px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }

        #activateFreeKeyButton, #getFreeKeyButton {
            margin-right: 10px;
        }

        #remainingTime {
            text-align: center;
            margin-top: 15px;
        }

        #timeLeft {
            font-size: 1.2em;
            font-weight: bold;
            color: #28a745;
        }
    `;
    document.head.appendChild(keyStyle);

    function formatBanDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('vi-VN');
    }

    async function showBannedUserAlert(banInfo) {
        const banDate = formatBanDate(banInfo.bannedAt);
        let message = `Tài khoản của bạn đã bị cấm sử dụng StudyAidX!\n\n`;
        message += `Thời gian bị cấm: ${banDate}\n`;
        message += `Lý do: ${banInfo.reason || 'Không có lý do được cung cấp'}\n`;
        if (banInfo.message) {
            message += `Ghi chú: ${banInfo.message}\n`;
        }
        alert(message);
    }

    function showLoginPopup() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'login-popup-overlay';

            const popup = document.createElement('div');
            popup.className = 'login-popup';
            popup.innerHTML = `
                <h3>Đăng nhập yêu cầu</h3>
                <p>Bạn cần đăng nhập để sử dụng StudyAidX</p>
                <button class="google-sign-in-btn" title="Đăng nhập bằng tài khoản Google của bạn">
                    <img src="https://www.google.com/favicon.ico" alt="Google Icon">
                    Sign in with Google
                </button>
                <br>
                <button class="cancel-btn" title="Hủy đăng nhập">
                    Hủy
                </button>
            `;

            const signInBtn = popup.querySelector('.google-sign-in-btn');
            const cancelBtn = popup.querySelector('.cancel-btn');

            signInBtn.addEventListener('click', () => {
                overlay.remove();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });

            overlay.appendChild(popup);
            document.body.appendChild(overlay);
        });
    }

    function initializeFirebase() {
        console.log('Script bắt đầu chạy.');
        const firebaseConfig = {
            apiKey: "AIzaSyBv_IpAjx-riZi5yizDjKHPugKgjkHIynQ",
            authDomain: "studyaidx.firebaseapp.com",
            projectId: "studyaidx",
            storageBucket: "studyaidx.firebasestorage.app",
            messagingSenderId: "388023302639",
            appId: "1:388023302639:web:b7b46b2c7712865214de1a",
            measurementId: "G-39155JDLZX"
        };

        try {
            firebase.initializeApp(firebaseConfig);
            console.log('Script đã tải xong.');
            const db = firebase.firestore();
            setupAuthUI();
            // AI Result Comparison System
    class AIResultComparisonSystem {
        constructor() {
            this.ai1Result = null;
            this.ai2Result = null;
        }

        // Process and format the answer according to system requirements
        formatAnswer(answer) {
            if (!answer) return null;

            // Ensure the answer follows the required format
            // Remove any analysis or explanation, keep only the final answer
            let formattedAnswer = answer;

            // Remove markdown formatting if present
            formattedAnswer = formattedAnswer.replace(/[*_#]/g, '');

            // Remove any analysis sections
            if (formattedAnswer.includes('Analysis')) {
                formattedAnswer = formattedAnswer.split('Analysis')[0];
            }

            // Remove any conclusion sections
            if (formattedAnswer.includes('Conclusion')) {
                formattedAnswer = formattedAnswer.split('Conclusion')[0];
            }

            return formattedAnswer.trim();
        }

        setAI1Result(result) {
            this.ai1Result = result;
        }

        setAI2Result(result) {
            this.ai2Result = result;
        }

        async compareResults() {
            if (!this.ai1Result || !this.ai2Result) {
                console.error('Both AI results must be set before comparison');
                return null;
            }

            // If answers are identical, return either one
            if (this.ai1Result === this.ai2Result) {
                return this.ai1Result;
            }

            // If answers are different, return AI2's answer directly
            // This ensures we get the complete answer without any analysis or explanation
            return this.ai2Result;
        }

        async getAI1Review() {
            // Simulate AI1's review process
            // In a real implementation, this would involve actual AI processing
            return new Promise(resolve => {
                setTimeout(() => {
                    // Compare results and make decision
                    const comparison = this.compareResultQuality();
                    resolve({
                        acceptsAI2Result: comparison.ai2Better,
                        reason: comparison.reason
                    });
                }, 1000);
            });
        }

        compareResultQuality() {
            // Implement result quality comparison logic here
            // This is a simplified example
            const ai1Score = this.evaluateResult(this.ai1Result);
            const ai2Score = this.evaluateResult(this.ai2Result);

            return {
                ai2Better: ai2Score > ai1Score,
                reason: ai2Score > ai1Score ?
                    'AI2 result appears more accurate' :
                    'AI1 result maintains better quality'
            };
        }

        evaluateResult(result) {
            // Implement result evaluation logic
            // This is a placeholder for actual evaluation logic
            let score = 0;
            if (result && typeof result === 'object') {
                // Add scoring criteria based on result structure and content
                score += Object.keys(result).length; // Example criterion
                score += this.evaluateResultDepth(result); // Example criterion
            }
            return score;
        }

        evaluateResultDepth(obj, depth = 0) {
            if (depth > 5) return 0; // Prevent infinite recursion
            let score = 0;
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    score += 1 + this.evaluateResultDepth(obj[key], depth + 1);
                }
            }
            return score;
        }
    }

    // Question Reply System
    class QuestionReplySystem {
        constructor() {
            this.db = firebase.firestore();
            this.setupQuestionReplyUI();
            this.setupEventListeners();
        }

        setupQuestionReplyUI() {
            // Add reply button to each question
            const questions = document.querySelectorAll('.question-container');
            questions.forEach(question => {
                if (!question.querySelector('.reply-button')) {
                    const replyButton = document.createElement('button');
                    replyButton.className = 'reply-button';
                    replyButton.innerHTML = 'Reply';
                    replyButton.dataset.questionId = question.id;
                    question.appendChild(replyButton);
                }
            });
        }

        setupEventListeners() {
            // Listen for reply button clicks
            document.addEventListener('click', async (e) => {
                if (e.target.classList.contains('reply-button')) {
                    const questionId = e.target.dataset.questionId;
                    const questionContainer = document.getElementById(questionId);

                    if (!questionContainer.querySelector('.reply-form')) {
                        this.createReplyForm(questionContainer);
                    }
                }
            });

            // Listen for form submissions
            document.addEventListener('submit', async (e) => {
                if (e.target.classList.contains('reply-form')) {
                    e.preventDefault();
                    const questionId = e.target.dataset.questionId;
                    const replyContent = e.target.querySelector('.reply-input').value;
                    await this.submitReply(questionId, replyContent);
                }
            });
        }

        createReplyForm(questionContainer) {
            const form = document.createElement('form');
            form.className = 'reply-form';
            form.dataset.questionId = questionContainer.id;

            const input = document.createElement('textarea');
            input.className = 'reply-input';
            input.placeholder = 'Type your reply here...';

            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.innerHTML = 'Submit Reply';

            form.appendChild(input);
            form.appendChild(submitButton);
            questionContainer.appendChild(form);
        }

        async submitReply(questionId, content) {
            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    alert('Please sign in to reply to questions.');
                    return;
                }

                await this.db.collection('replies').add({
                    questionId: questionId,
                    content: content,
                    userId: user.uid,
                    userName: user.displayName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Clear form and show success message
                const form = document.querySelector(`form[data-question-id="${questionId}"]`);
                if (form) {
                    form.querySelector('.reply-input').value = '';
                    this.showToast('Reply submitted successfully!');
                }

                // Refresh replies
                await this.loadReplies(questionId);

            } catch (error) {
                console.error('Error submitting reply:', error);
                this.showToast('Error submitting reply. Please try again.');
            }
        }

        async loadReplies(questionId) {
            try {
                const replies = await this.db.collection('replies')
                    .where('questionId', '==', questionId)
                    .orderBy('timestamp', 'desc')
                    .get();

                const repliesContainer = document.createElement('div');
                repliesContainer.className = 'replies-container';

                replies.forEach(reply => {
                    const replyData = reply.data();
                    const replyElement = document.createElement('div');
                    replyElement.className = 'reply';
                    replyElement.innerHTML = `
                        <div class="reply-header">
                            <span class="reply-author">${replyData.userName}</span>
                            <span class="reply-time">${new Date(replyData.timestamp?.toDate()).toLocaleString()}</span>
                        </div>
                        <div class="reply-content">${replyData.content}</div>
                    `;
                    repliesContainer.appendChild(replyElement);
                });

                // Replace existing replies container or add new one
                const questionContainer = document.getElementById(questionId);
                const existingReplies = questionContainer.querySelector('.replies-container');
                if (existingReplies) {
                    existingReplies.replaceWith(repliesContainer);
                } else {
                    questionContainer.appendChild(repliesContainer);
                }

            } catch (error) {
                console.error('Error loading replies:', error);
                this.showToast('Error loading replies. Please try again.');
            }
        }

        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
    }

    class UserConfig {
        constructor() {
            this.defaults = {
                farming: {
                    enabled: false,
                    iterations: 1,
                    targetType: 'quiz', // what to farm
                },
                autoSubmit: false,
                incognitoMode: false,
                features: {
                    copyPaste: false,
                    autoExtract: false,
                    autoAnswer: false
                }
            };
            this.config = null;
            this.initialized = false;
        }

        async initialize(userId) {
            if (!userId) {
                console.error('Cannot initialize config: No user ID provided');
                return;
            }
            this.userId = userId;
            await this.loadConfig();
            this.initialized = true;
        }

        async loadConfig() {
            try {
                const docRef = firebase.firestore().collection('userConfigs').doc(this.userId);
                const doc = await docRef.get();

                if (doc.exists) {
                    this.config = { ...this.defaults, ...doc.data() };
                } else {
                    this.config = { ...this.defaults };
                    await this.saveConfig(); // Save default config for new users
                }
            } catch (error) {
                console.error('Error loading user config:', error);
                this.config = { ...this.defaults };
            }
        }

        async saveConfig() {
            if (!this.initialized || !this.userId) {
                console.error('Cannot save config: Config not initialized or no user ID');
                return;
            }

            try {
                const docRef = firebase.firestore().collection('userConfigs').doc(this.userId);
                await docRef.set(this.config);
            } catch (error) {
                console.error('Error saving user config:', error);
            }
        }

        // Getters
        getFarmingConfig() {
            return this.config?.farming || this.defaults.farming;
        }

        getFeatureState(featureName) {
            return this.config?.features?.[featureName] ?? this.defaults.features[featureName];
        }

        // Setters
        async setFarmingConfig(farmingConfig) {
            this.config.farming = {
                ...this.config.farming,
                ...farmingConfig
            };
            await this.saveConfig();
        }

        async setFeatureState(featureName, state) {
            if (!this.config.features) {
                this.config.features = {};
            }
            this.config.features[featureName] = state;
            await this.saveConfig();
        }

        async setAutoSubmit(state) {
            this.config.autoSubmit = state;
            await this.saveConfig();
        }

        async setIncognitoMode(state) {
            this.config.incognitoMode = state;
            await this.saveConfig();
        }
    }

    // Initialize global config instance
    const userConfig = new UserConfig();

    // Update auth state handler to initialize config
    async function checkAuthState() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                await userConfig.initialize(user.uid);
                updateUserInfo(user);
            } else {
                showLoginPopup();
            }
        });
    }

    console.log('StudyAidX initialized successfully!');

            // Set up persistent auth state listener
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    // Check if user is banned
                    try {
                        const bannedDoc = await db.collection('banned_users').doc(user.email).get();
                        if (bannedDoc.exists) {
                            await firebase.auth().signOut();
                            await showBannedUserAlert(bannedDoc.data());
                            destroyMenu();
                            return;
                        }

                        // User is not banned, proceed normally
                        updateUserInfo(user);
                        if (window.authCheckInterval) {
                            clearInterval(window.authCheckInterval);
                            window.authCheckInterval = null;
                        }
                    } catch (error) {
                        console.error('Error checking banned status:', error);
                        alert('Có lỗi xảy ra khi kiểm tra trạng thái tài khoản!');
                    }
                } else {
                    // User is signed out
                    if (!window.authCheckInterval) {
                        checkAuthState();
                        window.authCheckInterval = setInterval(checkAuthState, 10000);
                    }
                }
            });

        } catch (error) {
            console.error('Firebase initialization error:', error);
            alert('Khởi tạo thất bại. Vui lòng tải lại trang!');
        }
    }

    async function signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        try {
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;

            // Check if user is banned
            const db = firebase.firestore();
            const bannedDoc = await db.collection('banned_users').doc(user.email).get();

            if (bannedDoc.exists) {
                await firebase.auth().signOut();
                await showBannedUserAlert(bannedDoc.data());
                destroyMenu();
                return null;
            }

            updateUserInfo(user);
            if (window.authCheckInterval) {
                clearInterval(window.authCheckInterval);
                window.authCheckInterval = null;
            }
            alert('Đăng nhập thành công!');
            window.location.reload();
            return user;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    // [Rest of the code remains the same...]
    function setupAuthUI() {
        const menuContent = document.getElementById('menuContent');
        if (!menuContent.querySelector('#loginSection')) {
            menuContent.insertAdjacentHTML('afterbegin', loginSection);
        }
        if (!menuContent.querySelector('#keySection')) {
            menuContent.insertAdjacentHTML('beforeend', keySection); // Thêm dòng này
        }

        const signInBtn = document.getElementById('googleSignInBtn');
        if (signInBtn) {
            signInBtn.addEventListener('click', signInWithGoogle);
        }
    }

    function updateUserInfo(user) {
        const userInfo = document.getElementById('userInfo');
        if (!userInfo) return;

        if (user) {
            userInfo.innerHTML = `
                <img src="${user.photoURL}" alt="Profile" style="width: 30px; border-radius: 50%;">
                <p>Welcome, ${user.displayName}</p>
                <button id="signOutBtn" class="button button-secondary" title="Đăng xuất khỏi tài khoản">Sign Out</button>
            `;
            userInfo.classList.add('show');

            const signOutBtn = document.getElementById('signOutBtn');
            if (signOutBtn) {
                signOutBtn.addEventListener('click', () => {
                    const shouldLogout = confirm('Bạn có chắc muốn đăng xuất không?');
                    if (shouldLogout) {
                        firebase.auth().signOut()
                            .then(() => {
                                alert('Đăng xuất thành công!');
                                userInfo.classList.remove('show');
                                userInfo.innerHTML = '';
                                destroyMenu();
                                setTimeout(() => location.reload(), 1000);
                            })
                            .catch((error) => {
                                console.error('Sign out error:', error);
                                alert('Đăng xuất thất bại. Vui lòng thử lại!');
                            });
                    }
                });
            }
        } else {
            userInfo.classList.remove('show');
            userInfo.innerHTML = '';
        }
    }

    async function checkAuthState() {
        const user = firebase.auth().currentUser;

        if (!user) {
            try {
                const shouldLogin = await showLoginPopup();
                if (shouldLogin) {
                    await signInWithGoogle();
                } else {
                    if (window.authCheckInterval) {
                        clearInterval(window.authCheckInterval);
                        window.authCheckInterval = null;
                    }
                    destroyMenu();
                    alert('Bạn đã hủy đăng nhập. StudyAidX sẽ bị vô hiệu hóa!');
                }
            } catch (error) {
                if (window.authCheckInterval) {
                    clearInterval(window.authCheckInterval);
                    window.authCheckInterval = null;
                }
                destroyMenu();
                alert('Đăng nhập bị hủy hoặc thất bại. StudyAidX sẽ bị vô hiệu hóa!');
            }
        }
    }

    function destroyMenu() {
        try {
            // Clear tất cả intervals
            if (window.scoreUpdateInterval) {
                clearInterval(window.scoreUpdateInterval);
            }
            if (window.authCheckInterval) {
                clearInterval(window.authCheckInterval);
            }
            if (window.keyCheckInterval) {
                clearInterval(window.keyCheckInterval);
            }
            if (window.farmInterval) {
                clearInterval(window.farmInterval);
            }

            // Stop farming nếu đang chạy
            if (typeof stopFarming === 'function') {
                stopFarming();
            }

            // Clear tất cả timeouts
            if (window.toastTimeout) {
                clearTimeout(window.toastTimeout);
            }

            // Xóa tất cả event listeners
            const menu = document.getElementById('quizHelperMenu');
            if (menu) {
                const clone = menu.cloneNode(true);
                menu.parentNode.replaceChild(clone, menu);
                clone.parentNode.removeChild(clone);
            }

            // Xóa tất cả elements tạo bởi script
            const elementsToRemove = [
                'quizHelperMenu',
                'toast',
                'calculatorPopup',
                'extractionPopup',
                'reopenIcon',
                'customizeIcon',
                'adPopup'
            ];

            elementsToRemove.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.remove();
                }
            });

            // Clear localStorage liên quan
            const keysToRemove = [
                'activeKey',
                'keyExpirationTime',
                'quizHelperMenuState',
                'quizHelperDarkMode',
                'autoExtractEnabled',
                'farmRandom',
                'farmInput',
                'totalIterations',
                'farmCount'
            ];

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // Reset tất cả biến global
            window.activeKey = null;
            window.keyExpirationTime = null;
            window.isFarming = false;
            window.farmCount = 0;
            window.totalIterations = 0;
            window.audio = null;

        } catch (error) {
            console.error('Error in destroyMenu:', error);
        }
    }

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
        --animation-duration: 0.4s;
        --font-size-base: 1rem;
    }

    body {
        font-family: 'Poppins', sans-serif;
        background-color: var(--bg-color);
        color: var(--text-color);
        line-height: 1.6;
        margin: 0;
        padding: 0;
        font-size: var(--font-size-base);
        transition: background-color var(--transition-speed), color var(--transition-speed);
    }

    #quizHelperMenu {
        position: fixed;
        top: 50px;
        right: 50px;
        width: 450px;
        max-height: calc(95vh - 100px);
        background: white;
        border-radius: var(--border-radius);
        box-shadow: 0 10px 30px var(--shadow-color);
        overflow: hidden;
        transition: all var(--transition-speed);
        z-index: 10000;
        display: flex;
        flex-direction: column;
    }

    #quizHelperMenu.minimized {
        transform: scale(0);
        opacity: 0;
    }

    #quizHelperMenu #menuHeader {
        background: var(--primary-gradient);
        color: white;
        padding: 15px;
        font-weight: 600;
        font-size: 1.1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
    }

    #quizHelperMenu #menuHeader img{
        width: 100px;
        height: auto;
    }

    #quizHelperMenu #menuContent {
        padding: 16px;
        max-height: calc(95vh - 130px);
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--primary-color) var(--bg-color);
        flex: 1;
    }

    #quizHelperMenu .section {
        margin-bottom: 20px;
        animation: fadeIn 0.5s ease-out;
    }

    #quizHelperMenu .section-title {
        font-weight: 600;
        margin-bottom: 10px;
        color: var(--primary-color);
        font-size: 1.1rem;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 5px;
        transition: color var(--transition-speed);
    }

    #quizHelperMenu button {
        background: var(--primary-gradient);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: all var(--transition-speed);
        font-size: var(--font-size-base);
        font-weight: 500;
        margin-right: 8px;
        margin-bottom: 8px;
        box-shadow: 0 4px 6px var(--shadow-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
        min-height: 44px;
    }

    #quizHelperMenu button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 10px var(--shadow-color);
    }

    #quizHelperMenu button:active {
        transform: translateY(-1px);
        box-shadow: 0 3px 6px var(--shadow-color);
    }

    #quizHelperMenu input[type="text"],
    #quizHelperMenu input[type="number"] {
        width: calc(100% - 20px);
        padding: 10px;
        margin-bottom: 10px;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: var(--font-size-base);
        transition: all var(--transition-speed);
        box-sizing: border-box;
    }

    #quizHelperMenu input[type="text"]:focus,
    #quizHelperMenu input[type="number"]:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        outline: none;
    }

    #quizHelperMenu #timerDisplay {
        font-size: 1.4rem;
        font-weight: bold;
        color: var(--primary-color);
        text-align: center;
        margin-top: 8px;
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
        width: 40px;
        height: 22px;
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
        border-radius: 22px;
    }

    #quizHelperMenu .toggle-slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }

    #quizHelperMenu input:checked + .toggle-slider {
        background: var(--primary-gradient);
    }

    #quizHelperMenu input:checked + .toggle-slider:before {
        transform: translateX(18px);
    }

    #welcomeScreen {
        background: linear-gradient(135deg, #00c6ff, #0072ff);
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 15px;
        transition: all var(--transition-speed);
    }

    #welcomeContent {
        color: white;
        transition: all var(--transition-speed);
    }

    #welcomeIcon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        margin-bottom: 10px;
    }

    #welcomeScreen h1 {
        font-size: 1.5rem;
        margin: 0;
        transition: all var(--transition-speed);
    }

    #welcomeScreen p {
        font-size: 0.9rem;
        margin: 5px 0 0;
        transition: all var(--transition-speed);
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
        gap: 15px;
    }

    #quizHelperMenu #freeKeySection,
    #quizHelperMenu #premiumKeySection {
        flex: 1;
        background: var(--secondary-gradient);
        padding: 15px;
        border-radius: var(--border-radius);
        color: white;
        transition: all var(--transition-speed);
    }

    #quizHelperMenu #freeKeySection h3,
    #quizHelperMenu #premiumKeySection h3 {
        margin-top: 0;
        font-size: 1.1rem;
        transition: all var(--transition-speed);
    }

    #quizHelperMenu #freeKeySection p,
    #quizHelperMenu #premiumKeySection p {
        font-size: 0.9rem;
        margin-bottom: 8px;
        transition: all var(--transition-speed);
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

    #quizHelperMenu .dark-mode input[type="text"],
    #quizHelperMenu .dark-mode input[type="number"] {
        background-color: #555;
        color: white;
    }

    /* Responsive design */
    @media (max-width: 600px) {
        #quizHelperMenu {
            width: 90%;
            left: 5%;
            right: 5%;
            top: 20px;
            height: auto;
        }

        #keyTypes {
            flex-direction: column;
        }

        :root {
        --font-size-base: 0.9rem;
        }

        #quizHelperMenu .section-title {
        font-size: 1rem;
        }

        #quizHelperMenu #menuHeader {
        font-size: 1rem;
        }
        #welcomeScreen h1 {
        font-size: 1.3rem;
        }
        #welcomeScreen p {
            font-size: 0.8rem;
        }
    }

    @media (min-width: 601px) and (max-width: 1024px) {
        :root {
        --font-size-base: 0.95rem;
        }

    }

    @media (min-width: 1025px) {
        #quizHelperMenu {
            width: 500px; /* tăng kích thước khi màn hình lớn */
            right: 80px; /* điều chỉnh vị trí khi màn hình lớn */
        }
        :root {
            --font-size-base: 1.05rem;
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
        padding: 20px;
        border-radius: 1.5rem;
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
        margin-bottom: 15px;
        font-size: 1.4rem;
        text-align: center;
    }

    #extractionContent {
        white-space: pre-wrap;
        margin-bottom: 15px;
        line-height: 1.7;
        font-size: var(--font-size-base);
        background-color: var(--secondary-color);
        padding: 15px;
        border-radius: 1rem;
        transition: all var(--transition-speed);
    }

    #toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100%);
        background-color: var(--primary-color);
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        opacity: 0;
        transition: all var(--transition-speed);
        font-size: var(--font-size-base);
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
        padding: 6px 10px;
        border-radius: 25px;
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
    }

    /* Improved scrollbar styling */
    #menuContent::-webkit-scrollbar {
        width: 8px;
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
        margin-top: 15px;
    }

    .customize-group {
        margin-bottom: 15px;
    }

    .section {
        margin-bottom: 15px;
    }

    .section-title {
        font-size: 1.1rem;
        margin-bottom: 8px;
        font-weight: bold;
    }

    #customizeIcon {
        position: absolute;
        top: 10px;
        right: 50px;
        background-color: transparent;
        color: white;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 1000;
        font-size: 20px;
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
        padding: 15px;
        box-sizing: border-box;
    }

    .section-title {
        font-size: 1.2rem;
        margin-bottom: 15px;
    }

    .customize-group {
        margin-bottom: 15px;
    }

    .customize-group h3 {
        margin-top: 0;
        font-size: 1rem;
    }

    label {
        display: block;
        margin-bottom: 3px;
        font-size: 0.9rem;
    }

    input[type="checkbox"],
    input[type="color"],
    input[type="range"],
    select,
    input[type="file"] {
        margin-bottom: 8px;
    }

    #advertisementSection {
        background: transparent;
        min-height: 150px;
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
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 10000;
    }

    .popup-content {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        padding: 15px;
        border-radius: 8px;
        max-width: 400px;
        width: 90%;
    }

    .ad-container {
        min-height: 150px;
        min-width: 200px;
    }

    .close-button {
        position: absolute;
        top: 5px;
        right: 10px;
        font-size: 20px;
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
        right: -35px;
        top: 50%;
        transform: translateY(-50%);
        background: #4a90e2;
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .ai-question-button:hover {
        background: #357abd;
        transform: translateY(-50%) scale(1.1);
    }

    .ai-icon {
        color: white;
        font-size: 12px;
        font-weight: bold;
    }

    /* Chat Popup Styles */
    .ai-chat-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 450px;
        height: 70vh;
        max-height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        z-index: 1000;
    }

    /* Popup Header */
    .popup-header {
        padding: 12px;
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
        font-size: 14px;
    }

    .close-popup {
        background: none;
        border: none;
        font-size: 20px;
        color: #666;
        cursor: pointer;
        padding: 0 6px;
        transition: color 0.2s ease;
    }

    .close-popup:hover {
        color: #333;
    }

    /* Chat Messages Container */
    .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: all var(--transition-speed);
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
        padding: 10px 12px;
        border-radius: 10px;
        font-size: 12px;
        line-height: 1.4;
        transition: all var(--transition-speed);
    }

    .user-message .message-content {
        background: #4a90e2;
        color: white;
        border-radius: 10px 10px 0 10px;
    }

    .ai-message .message-content {
        background: #f1f3f4;
        color: #333;
        border-radius: 10px 10px 10px 0;
    }

    .error-message .message-content {
        background: #ffebee;
        color: #c62828;
        border-radius: 10px;
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
        padding: 12px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 8px;
    }

    .chat-input {
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 10px;
        font-size: 12px;
        resize: none;
        min-height: 20px;
        max-height: 100px;
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
        border-radius: 6px;
        padding: 0 14px;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .send-message:hover {
        background: #357abd;
    }

    /* Toast Notification */
    .toast {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1001;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .ai-chat-popup {
            width: 95%;
            height: 85vh;
            max-height: none;
        }

        .chat-message {
            max-width: 90%;
        }

        .ai-question-button {
            right: -28px;
            width: 24px;
            height: 24px;
        }

        .ai-icon {
            font-size: 10px;
        }
    }

    /* Scrollbar Styles */
    .chat-messages::-webkit-scrollbar {
        width: 5px;
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

    .image-upload-section {
        margin: 10px 0;
    }

    .uploaded-images-preview {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
        max-height: 150px;
        overflow-y: auto;
    }

    .uploaded-image-preview {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 4px;
        position: relative;
    }

    .remove-image {
        position: absolute;
        top: 3px;
        right: 3px;
        background: rgba(255, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .toast-notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
    }

    .toast-notification.show {
        opacity: 1;
    }

    .edit-message,
    .save-message,
    .cancel-message,
    #upload-button,
    #clear-history,
    .stop-generating {
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 5px 10px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 14px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 5px;
    }

    .stop-generating {
        background-color: #f44336;
    }

    .cancel-message {
        background-color: #f44336;
    }

    .edit-input {
        width: 100%;
        height: 100px;
        margin-bottom: 5px;
    }

    .chat-controls {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    #model-select {
        padding: 5px;
        margin-right: 10px;
        border-radius: 5px;
    }

    .ai-loading-state {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8); /* Nền đen mờ, có thể điều chỉnh độ trong suốt */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        border-radius: inherit; /* Kế thừa border-radius từ phần tử cha */
        color: white; /* Màu chữ mặc định là trắng */
        font-family: sans-serif; /* Font chữ đơn giản, dễ đọc */
    }

    .loader {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .spinner {
        border: 4px solid rgba(255, 255, 255, 0.3); /* Màu xám nhạt cho phần nền spinner */
        border-top: 4px solid #f7971d; /* Màu cam thương hiệu, hoặc màu bạn muốn */
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite; /* Animation xoay vô hạn */
        margin-bottom: 10px; /* Khoảng cách giữa spinner và chữ */
    }

    .loading-text {
        font-size: 16px;
        color: white;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
        `;
        document.head.appendChild(style);



    // Create menu
    const menu = document.createElement('div');
    menu.id = 'quizHelperMenu';
    menu.innerHTML = `
        <div id="menuHeader">
            <a href="https://ibb.co/41xKGX2">
                <img src="https://studyaidx.web.app/studyaidx-uploads/1111a9ca-bbb6-46dd-bfbc-fcf9737a3b56.png"
                    alt="Logo StudyAidX"
                    border="0">
            </a>
            <button id="logoutButton" aria-label="Đăng xuất">🚪</button>
            <span id="remainingTime" style="display:none;">
                Thời gian sử dụng còn lại:
                <span id="timeLeft">30:00</span>
            </span>
            <button id="minimizeButton" aria-label="Thu Gọn">_</button>
            <span>Press CTRL + Q to hide menu</span>
            <div id="customizeIcon">⚙</div>
            <span id="versionInfo">
                Version:
                <div id="currentVersion">1.18</div>
            </span>
        </div>

        <div id="menuContent">
            <div id="keySection" class="section">
                <div class="free-key-section">
                    <div class="section-title">Free Key System</div>
                    <input type="text" id="freeKeyInput" placeholder="Nhập Free Key của bạn">
                    <button id="activateFreeKeyButton">Kích hoạt Free Key</button>
                    <button id="getFreeKeyButton">Nhận Free Key</button>
                </div>

                <div class="premium-key-section">
                    <div class="section-title">Admin Key System</div>
                    <input type="text" id="premiumKeyInput" placeholder="Nhập Admin Key của bạn">
                    <button id="activatePremiumKeyButton">Kích hoạt Admin Key</button>
                    <button id="contactButton">Key này chi có Admin mới có - key này không mua được !</button>
                </div>

                <div id="remainingTime" style="display: none;">
                    <div class="section-title">Thời gian còn lại</div>
                    <div id="timeLeft"></div>
                </div>
            </div>

            <div id="functionsSection" style="display: none;">
                <div class="section">
                    <div class="section-title">Hành Động</div>
                    <button id="extractButton" title="Trích xuất dữ liệu từ bài kiểm tra hiện tại">📋 Khai Thác Dữ Liệu</button>
                    <button id="calculatorButton" title="Mở máy tính để thực hiện các phép tính">🧮 Máy tính</button>
                    <button id="autoAnswerButton" title="Tự động chọn đáp án ngẫu nhiên cho các câu hỏi">🎲 Chọn Đáp Án (Random)</button>
                    <button id="aiAnswerButton" title="Sử dụng AI để chọn đáp án cho các câu hỏi">🤖 Chọn Đáp Án (AI)</button>
                                    <div class="turbo-mode">
                    <label class="toggle-switch" title="Bật/tắt chế độ Turbo để tăng tốc độ xử lý">
                        <input type="checkbox" id="turboToggle">
                        <span class="slider round"></span>
                    </label>
                    <span>Turbo Mode</span>
                </div>
            </div>

                    <button id="downloadImagesButton" style="display: none;" title="Tải xuống các hình ảnh cần thiết từ bài kiểm tra">📥 Download Images that need!</button>
                    <div class="image-upload-section">
                        <button id="uploadImagesButton" style="display: none;" title="Tải lên hình ảnh để sử dụng trong bài kiểm tra">📸 Upload Images</button>
                        <input type="file" id="imageUploader" multiple accept="image/*" style="display: none;">
                        <div id="uploadedImages" class="uploaded-images-preview"></div>
                    </div>
                    <div class="audio-upload-section">
                        <button id="uploadAudioButton" title="Tải lên file âm thanh để sử dụng trong bài kiểm tra">🎙️ Upload Audio</button>
                        <input type="file" id="audioUploader" multiple accept="audio/*" style="display: none;">
                        <div id="uploadedAudios" class="uploaded-audio-preview"></div>
                    </div>

                    <div>
                        <input type="checkbox" id="autoSubmitCheckbox">
                        <label for="autoSubmitCheckbox">Auto Submit</label>
                    </div>
            <div id="incognitoSection" class="section">
            <div class="section-title">Chế Độ Ẩn Danh (Incognito Mode)</div>
            <div>
                <label class="toggle-switch" title="Bật/tắt chế độ ẩn danh để không lưu lại hoạt động">
                <input type="checkbox" id="incognitoModeToggle">
                <span class="toggle-slider"></span>
                </label>
                <span>Kích hoạt Chế Độ Ẩn Danh</span>
            </div>
                    <button id="autoSubmitToggle" style="display: none;" title="Bật/tắt tự động nộp bài">🚀 Toggle Auto-Submit</button>
                    <button id="openLinkPopupButton" style="display: none;" title="Mở popup chứa các liên kết hữu ích">🔗 Mở Popup Liên Kết</button>

                    <div style="display: none;">
                        <label class="toggle-switch">
                            <input type="checkbox" id="copyPasteToggle">
                            <span class="toggle-slider"></span>
                        </label>
                        <span style="display: none;">Cho phép Copy/Paste</span>
                    </div>
                </div>

                <div class="section" style="display: none;">
                    <div class="section-title">Lựa Chọn Mã Đáp Ứng</div>

                    <input id="answersInput"
                        type="text"
                        placeholder="Nhập mã đáp ứng, phân tách bằng dấu chấm phẩy">

                    <div>
                        <input type="checkbox" id="autoExtractCheckbox">
                        <label for="autoExtractCheckbox">Tự động khai thác dữ liệu</label>
                    </div>

                    <button id="selectAnswersButton" title="Chọn đáp án dựa trên dữ liệu đã nhập">✅ Chọn Đáp Án (Dựa Vào Input)</button>

                    <label for="autoSubmitCheckbox">Tự động submit:</label>
                    <input type="checkbox" id="autoSubmitCheckbox">

                    <button id="saveAnswersButton" title="Lưu trữ mã đáp án để sử dụng sau này">💾 Lưu Trữ Mã</button>

                    <button id="loadAnswersButton" style="display:none;" title="Nạp mã đáp án đã lưu trước đó">📂 Nạp Mã</button>

                    <button id="highlightAnswersButton" style="display:none;" title="Đánh dấu các đáp án đã chọn">🖍️ Highlight Answers</button>

                    <button id="analyzeAnswersButton" style="display:none;" title="Phân tích tần suất các đáp án">📊 Analyze Answers</button>
                </div>

                <div class="section" style="display:none;">
                    <div class="section-title">Cài Đặt</div>
                    <button id="toggleThemeButton" title="Chuyển đổi giữa giao diện sáng và tối">🌓 Chuyển Đổi Giao Diện</button>
                </div>

                <div class="section" style="display:none;">
                    <div class="section-title">Đồng Hồ Đếm Ngược</div>

                    <input id="timerInput"
                        type="number"
                        min="1"
                        max="180"
                        placeholder="Nhập số phút">

                    <button id="startTimerButton" title="Bắt đầu đếm thời gian làm bài">▶️ Kích Hoạt Đồng Hồ</button>

                    <div id="timerDisplay">0:00</div>
                </div>

                <div class="section" style="display: none;">
                    <div class="section-title">Nhạc</div>
                    <button id="playMusicButton" title="Phát nhạc nền khi làm bài">🎵 Play Music</button>
                    <button id="pauseMusicButton" title="Tạm dừng phát nhạc">⏸️ Pause Music</button>
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
        <div>
            <input type="checkbox" id="farmAI">
            <label for="farmAI">Farm with AI</label>
        </div>
        <label for="iterationsInput">Số Lần Farm:</label>
        <input type="number" id="iterationsInput" min="1" value="10">
        <button id="startFarmButton" class="btn btn-primary" title="Bắt đầu quá trình farm điểm tự động">Bắt đầu Farm</button>
    </div>


                <div class="section" style="display: none;"s>
                    <div class="section-title">Cập Nhật Điểm Số</div>
                    <div>
                        <label class="toggle-switch" title="Bật/tắt tự động cập nhật điểm">
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
                <button id="applyCustomizationsButton" title="Áp dụng tất cả các tùy chỉnh đã thay đổi">Áp dụng tất cả</button>
                <button id="resetCustomizationsButton" title="Đặt lại tất cả tùy chỉnh về mặc định">Đặt lại mặc định</button>
            </div>

            <div id="incognitoInstructions" style="display:none;">
                <p>Các phím tắt (có thể tùy chỉnh):</p>
                <ul>
                <li>Khai Thác Dữ Liệu: <span id="extractShortcut">Ctrl + Q</span></li>
                <li>Máy Tính: <span id="calculatorShortcut">Ctrl + Alt + C</span></li>
                <li>Chọn Đáp Án (Random): <span id="autoAnswerShortcut">Ctrl + Alt + R</span></li>
                <li>Chọn Đáp Án (AI): <span id="aiAnswerShortcut">Ctrl + Alt + A</span></li>
                <li>Tải Xuống Hình Ảnh: <span id="downloadImagesShortcut">Ctrl + Alt + D</span></li>
                <li>Tải Lên Hình Ảnh: <span id="uploadImagesShortcut">Ctrl + Alt + U</span></li>
                <li>Tải Lên Âm Thanh: <span id="uploadAudioShortcut">Ctrl + Shift + U</span></li>
                <li>Auto Submit: <span id="autoSubmitShortcut">Ctrl + Alt + S</span></li>
                <li>Mở Popup Liên Kết: <span id="openLinkPopupShortcut">Ctrl + Alt + L</span></li>
                <li>Cho Phép Copy/Paste: <span id="copyPasteShortcut">Ctrl + Shift + C</span></li>
                <li>Chọn Đáp Án (Dựa Vào Input): <span id="selectAnswersShortcut">Ctrl + Shift + S</span></li>
                <li>Lưu Trữ Mã: <span id="saveAnswersShortcut">Ctrl + Shift + M</span></li>
                <li>Bật/Tắt Nhạc: <span id="toggleMusicShortcut">Ctrl + Alt + M</span></li>
                <li>Farm Random: <span id="farmRandomShortcut">Ctrl + Shift + R</span></li>
                <li>Farm Dựa Vào Input: <span id="farmInputShortcut">Ctrl + Shift + I</span></li>
                <li>Cập Nhật Điểm Số: <span id="scoreUpdateShortcut">Ctrl + Shift + P</span></li>
                <!-- Thêm các phím tắt khác vào đây -->
                </ul>
                <p>Để hiển thị lại menu, ấn tổ hợp phím: <span id="showMenuShortcut">Ctrl + Shift + O</span></p>
                <p><b>Lưu ý:</b> Khi chế độ ẩn danh được kích hoạt, menu sẽ bị ẩn cho đến khi bạn ấn tổ hợp phím để hiển thị lại.</p>
            </div>
            </div>
            <div id="incognitoTutorial" class="popup" style="display:none;">
            <div class="popup-content">
                <h3>Hướng Dẫn Chế Độ Ẩn Danh</h3>
                <p>Bạn đã bật chế độ ẩn danh. Dưới đây là các phím tắt:</p>
                <ul>
                <li>Khai Thác Dữ Liệu: <span id="extractShortcut">Ctrl + Q</span></li>
                <li>Máy Tính: <span id="calculatorShortcut">Ctrl + Alt + C</span></li>
                <li>Chọn Đáp Án (Random): <span id="autoAnswerShortcut">Ctrl + Alt + R</span></li>
                <li>Chọn Đáp Án (AI): <span id="aiAnswerShortcut">Ctrl + Alt + A</span></li>
                <li>Tải Xuống Hình Ảnh: <span id="downloadImagesShortcut">Ctrl + Alt + D</span></li>
                <li>Tải Lên Hình Ảnh: <span id="uploadImagesShortcut">Ctrl + Alt + U</span></li>
                <li>Tải Lên Âm Thanh: <span id="uploadAudioShortcut">Ctrl + Shift + U</span></li>
                <li>Auto Submit: <span id="autoSubmitShortcut">Ctrl + Alt + S</span></li>
                <li>Mở Popup Liên Kết: <span id="openLinkPopupShortcut">Ctrl + Alt + L</span></li>
                <li>Cho Phép Copy/Paste: <span id="copyPasteShortcut">Ctrl + Shift + C</span></li>
                <li>Chọn Đáp Án (Dựa Vào Input): <span id="selectAnswersShortcut">Ctrl + Shift + S</span></li>
                <li>Lưu Trữ Mã: <span id="saveAnswersShortcut">Ctrl + Shift + M</span></li>
                <li>Bật/Tắt Nhạc: <span id="toggleMusicShortcut">Ctrl + Alt + M</span></li>
                <li>Farm Random: <span id="farmRandomShortcut">Ctrl + Shift + R</span></li>
                <li>Farm Dựa Vào Input: <span id="farmInputShortcut">Ctrl + Shift + I</span></li>
                <li>Cập Nhật Điểm Số: <span id="scoreUpdateShortcut">Ctrl + Shift + P</span></li>
                </ul>
                <p>Để hiển thị lại menu, ấn tổ hợp phím: <span id="showMenuShortcut">Ctrl + Shift + O</span></p>
                <button id="closeTutorialButton" title="Đóng hướng dẫn và không hiển thị lại">Đã hiểu</button>
            </div>
            </div>
        </div>
        `;

    document.body.appendChild(menu);

    // Incognito Mode Logic
    const incognitoModeToggle = document.getElementById('incognitoModeToggle');
    const menuContent = document.getElementById('menuContent');

    // Load incognito mode state from localStorage
    const isIncognito = localStorage.getItem('incognitoMode') === 'true';
    incognitoModeToggle.checked = isIncognito;
    updateIncognitoMode(isIncognito);

    incognitoModeToggle.addEventListener('change', () => {
    const isIncognito = incognitoModeToggle.checked;
    localStorage.setItem('incognitoMode', isIncognito);
    updateIncognitoMode(isIncognito);

    // Clear incognito alert shown state when turning off incognito mode
    if (!isIncognito) {
        localStorage.removeItem('incognitoAlertShown');
    }
    });

    function updateIncognitoMode(isIncognito) {
        // Add this check at the top of the function
        const isReload = localStorage.getItem('incognitoModeActive') === 'true';

        if (isIncognito) {
            // Ẩn menu
            menuContent.style.display = 'none';
            document.getElementById('menuHeader').style.display = 'none';
            document.getElementById('customizeSection').style.display = 'none';

            // Thêm CSS để ẩn các hiệu ứng trực quan
            const incognitoStyle = document.createElement('style');
            incognitoStyle.id = 'incognitoStyle';
            incognitoStyle.textContent = `
                .ai-loading-state,
                .toast-notification,
                .selected-answer,
                .answer-display {
                    display: none !important;
                }
                .answer.correct,
                .answer.selected,
                .answer-choice.selected,
                .mcq-option.selected {
                    background-color: transparent !important;
                    border-color: inherit !important;
                    color: inherit !important;
                }
            `;
            document.head.appendChild(incognitoStyle);

            // Only show instructions if this is not a reload
            if (!isReload) {
                const instructions = `[TÍNH NĂNG BETA] Chế độ ẩn danh đã được kích hoạt! Nếu gặp lỗi vui lòng ấn Reset All ở góc trên để quay lại bình thường.\n\n
                Các phím tắt:\n
                - Khai Thác Dữ Liệu: Ctrl + Shift + X
                - Máy Tính: Ctrl + Alt + C
                - Chọn Đáp Án (Random): Ctrl + Shift + R
                // ... rest of shortcuts ...
                Để hiển thị lại menu, ấn: Ctrl + Shift + O`;

                alert(instructions);
                // Set the flag indicating incognito mode is active
                localStorage.setItem('incognitoModeActive', 'true');
            }

            // Xóa trạng thái loading của AI
            const loadingStates = document.querySelectorAll('.ai-loading-state');
            loadingStates.forEach(loadingState => loadingState.remove());
        } else {
            // Clear the incognito mode active flag when disabled
            localStorage.removeItem('incognitoModeActive');

            // Remove incognito style
            const incognitoStyle = document.getElementById('incognitoStyle');
            if (incognitoStyle) {
                incognitoStyle.remove();
            }

            // Hiển thị menu
            menuContent.style.display = 'block';
            document.getElementById('menuHeader').style.display = 'flex';
            document.getElementById('customizeSection').style.display = 'block';
        }
    }

    document.addEventListener('keydown', handleKeyDown);
    function handleKeyDown(event) {
        if (incognitoModeToggle.checked) {
            // Khai Thác Dữ Liệu (Alt + X)
            if (event.altKey && !event.ctrlKey && !event.shiftKey && event.key === 'x') {
                event.preventDefault();
                document.getElementById('extractButton').click();
            }
            // Máy Tính (Alt + C)
            else if (event.altKey && !event.ctrlKey && !event.shiftKey && event.key === 'c') {
                event.preventDefault();
                document.getElementById('calculatorButton').click();
            }
            // Chọn Đáp Án Random (Alt + R)
            else if (event.altKey && !event.ctrlKey && !event.shiftKey && event.key === 'r') {
                event.preventDefault();
                document.getElementById('autoAnswerButton').click();
            }
            // Chọn Đáp Án AI (Alt + A)
            else if (event.altKey && !event.ctrlKey && !event.shiftKey && event.key === 'a') {
                event.preventDefault();
                document.getElementById('aiAnswerButton').click();
            }
            // Tải Xuống Hình Ảnh (Alt + D)
            else if (event.altKey && !event.ctrlKey && !event.shiftKey && event.key === 'd') {
                event.preventDefault();
                document.getElementById('downloadImagesButton').click();
            }
            // Tải Lên Hình Ảnh (Alt + U)
            else if (event.altKey && !event.ctrlKey && !event.shiftKey && event.key === 'u') {
                event.preventDefault();
                document.getElementById('uploadImagesButton').click();
            }
            // Tải Lên Âm Thanh (Ctrl + Alt + U)
            else if (event.ctrlKey && event.altKey && event.key === 'u') {
                event.preventDefault();
                document.getElementById('uploadAudioButton').click();
            }
            // Auto Submit (Ctrl + Shift + Enter)
            else if (event.ctrlKey && event.shiftKey && event.key === 'Enter') {
                event.preventDefault();
                document.getElementById('autoSubmitCheckbox').checked = !document.getElementById('autoSubmitCheckbox').checked;
            }
            // Mở Popup Liên Kết (Ctrl + Shift + L)
            else if (event.ctrlKey && event.shiftKey && event.key === 'L') {
                event.preventDefault();
                document.getElementById('openLinkPopupButton').click();
            }
            // Chọn Đáp Án Dựa Vào Input (Ctrl + Alt + I)
            else if (event.ctrlKey && event.altKey && event.key === 'i') {
                event.preventDefault();
                document.getElementById('selectAnswersButton').click();
            }
            // Lưu Trữ Mã (Ctrl + Shift + M)
            else if (event.ctrlKey && event.shiftKey && event.key === 'M') {
                event.preventDefault();
                document.getElementById('saveAnswersButton').click();
            }
            // Bật/Tắt Nhạc (Ctrl + Shift + M)
            else if (event.ctrlKey && event.shiftKey && event.key === 'M') {
                event.preventDefault();
                const playMusicButton = document.getElementById('playMusicButton');
                const pauseMusicButton = document.getElementById('pauseMusicButton');
                if (playMusicButton.style.display !== 'none') {
                    playMusicButton.click();
                } else {
                    pauseMusicButton.click();
                }
            }
            // Farm Random (Ctrl + Alt + F)
            else if (event.ctrlKey && event.altKey && event.key === 'f') {
                event.preventDefault();
                document.getElementById('farmRandom').checked = !document.getElementById('farmRandom').checked;
            }
            // Farm Dựa Vào Input (Ctrl + Alt + G)
            else if (event.ctrlKey && event.altKey && event.key === 'g') {
                event.preventDefault();
                document.getElementById('farmInput').checked = !document.getElementById('farmInput').checked;
            }
            // Cập Nhật Điểm Số (Ctrl + Shift + P)
            else if (event.ctrlKey && event.shiftKey && event.key === 'P') {
                event.preventDefault();
                document.getElementById('scoreUpdateToggle').checked = !document.getElementById('scoreUpdateToggle').checked;
            }
            // Hiển thị lại menu (Ctrl + Shift + O)
            else if (event.ctrlKey && event.shiftKey && event.key === 'O') {
                event.preventDefault();
                incognitoModeToggle.checked = false;
                localStorage.setItem('incognitoMode', false);
                incognitoInstructions.style.display = 'none';
                menuContent.style.display = 'block';
                document.getElementById('menuHeader').style.display = 'flex';
                document.getElementById('customizeSection').style.display = 'block';
            }
        }
    }


    // Add event listener for the download images button
    document.getElementById('downloadImagesButton').addEventListener('click', function() {
        const questions = document.querySelector('div.assessing#questions');
        if (questions) {
            const images = questions.getElementsByTagName('img');
            for (const image of images) {
                const imageUrl = image.src;
                if (imageUrl) {
                    window.open(imageUrl, '_blank');
                }
            }
        }
    });


    // Modified image loading function with Firebase Storage upload
    async function convertImageToBase64(url) {
        console.log('🔄 Attempting to process image:', url);
        try {
            // First try to get the image
            const imageData = await fetchImageData(url);
            if (!imageData) {
                console.error('❌ Failed to fetch image data');
                return null;
            }

            // Then upload to Firebase Storage
            const firebaseUrl = await uploadImageToFirebase(imageData, url);
            if (firebaseUrl) {
                console.log('✅ Successfully uploaded image to Firebase:', firebaseUrl);
                return firebaseUrl;
            } else {
                // Fallback to the original base64 conversion if Firebase upload fails
                console.log('⚠️ Firebase upload failed, falling back to base64 conversion');
                return imageData;
            }
        } catch (error) {
            console.error('❌ Error processing image:', error);
            return null;
        }
    }

    // Function to fetch image data
    async function fetchImageData(url) {
        console.log('🔄 Fetching image data:', url);
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);

                        const dataUrl = canvas.toDataURL('image/jpeg');
                        console.log('✅ Successfully fetched image data:', url);
                        resolve(dataUrl);
                    } catch (err) {
                        console.error('❌ Canvas operation failed:', err);
                        resolve(null);
                    }
                };

                img.onerror = () => {
                    console.warn('⚠️ Failed to load image with CORS. Trying proxy fallback...');
                    tryProxyFallback(url).then(resolve).catch(reject);
                };

                const cacheBuster = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;
                img.src = cacheBuster;
            });
        } catch (error) {
            console.error('❌ Error fetching image data:', error);
            return null;
        }
    }

    // Function to upload image to Firebase Storage
    async function uploadImageToFirebase(dataUrl, originalUrl) {
        console.log('🔄 Uploading image to Firebase Storage');
        try {
            // Check if Firebase is initialized
            if (!firebase || !firebase.storage) {
                console.error('❌ Firebase or Firebase Storage is not initialized');
                return null;
            }

            // Create a reference to Firebase Storage with custom settings
            const storage = firebase.storage();
            storage.setCustomAuthHeaders({
                'Access-Control-Allow-Origin': 'https://lms.vinschool.edu.vn',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            const storageRef = storage.ref();

            // Generate a unique filename
            const filename = `images/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
            const imageRef = storageRef.child(filename);

            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // Upload the blob to Firebase Storage with metadata
            const metadata = {
                contentType: 'image/jpeg',
                customMetadata: {
                    'Access-Control-Allow-Origin': 'https://lms.vinschool.edu.vn'
                }
            };
            const snapshot = await imageRef.put(blob, metadata);

            // Get the download URL
            const downloadUrl = await snapshot.ref.getDownloadURL();
            console.log('✅ Image uploaded to Firebase Storage:', downloadUrl);

            return downloadUrl;
        } catch (error) {
            console.error('❌ Error uploading to Firebase Storage:', error);
            return null;
        }
    }

    async function tryProxyFallback(url) {
        console.log('🔄 Attempting proxy fallback for:', url);
        try {
            const proxyUrls = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                `https://cors-anywhere.herokuapp.com/${url}`,
                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
            ];

            for (const proxyUrl of proxyUrls) {
                try {
                    console.log('🔄 Trying proxy:', proxyUrl);
                    const response = await fetch(proxyUrl);
                    const blob = await response.blob();
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            console.log('✅ Proxy success for:', url);
                            resolve(reader.result);
                        };
                        reader.readAsDataURL(blob);
                    });
                } catch (err) {
                    console.warn('⚠️ Proxy failed:', proxyUrl, err);
                    continue;
                }
            }
            throw new Error('All proxy attempts failed');
        } catch (error) {
            console.error('❌ Proxy fallback failed:', error);
            return null;
        }
    }
    // Store uploaded images
    let uploadedImages = [];

    // Initialize image upload functionality
    document.getElementById('uploadImagesButton').addEventListener('click', () => {
        console.log('📸 Image upload button clicked');
        document.getElementById('imageUploader').click();
    });

    document.getElementById('imageUploader').addEventListener('change', (event) => {
        const files = event.target.files;
        console.log('📁 Processing uploaded files:', files.length);
        const previewContainer = document.getElementById('uploadedImages');

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                uploadedImages.push(imageData);
                console.log('✅ Successfully processed uploaded image:', file.name);

                const imgContainer = document.createElement('div');
                imgContainer.style.position = 'relative';

                const img = document.createElement('img');
                img.src = imageData;
                img.className = 'uploaded-image-preview';

                const removeButton = document.createElement('button');
                removeButton.className = 'remove-image';
                removeButton.innerHTML = '×';
                removeButton.onclick = () => {
                    uploadedImages = uploadedImages.filter(img => img !== imageData);
                    imgContainer.remove();
                    console.log('🗑️ Removed uploaded image:', file.name);
                };

                imgContainer.appendChild(img);
                imgContainer.appendChild(removeButton);
                previewContainer.appendChild(imgContainer);
            };
            reader.readAsDataURL(file);
        }
    });

    // Store uploaded audios
    let uploadedAudios = [];

    // Initialize audio upload functionality
    document.getElementById('uploadAudioButton').addEventListener('click', () => {
        console.log('🎙️ Audio upload button clicked');
        document.getElementById('audioUploader').click();
    });

    document.getElementById('audioUploader').addEventListener('change', (event) => {
        const files = event.target.files;
        console.log('📁 Processing uploaded audio files:', files.length);
        const previewContainer = document.getElementById('uploadedAudios');

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const audioData = e.target.result;
                uploadedAudios.push({data: audioData, type: file.type});
                console.log('✅ Successfully processed uploaded audio:', file.name);

                const audioContainer = document.createElement('div');
                audioContainer.style.position = 'relative';

                const audio = document.createElement('audio');
                audio.src = audioData;
                audio.controls = true;
                audio.className = 'uploaded-audio-preview';

                const removeButton = document.createElement('button');
                removeButton.className = 'remove-audio';
                removeButton.innerHTML = '×';
            removeButton.onclick = () => {
                    uploadedAudios = uploadedAudios.filter(audio => audio.data !== audioData);
                    audioContainer.remove();
                    console.log('🗑️ Removed uploaded audio:', file.name);
                };

                audioContainer.appendChild(audio);
                audioContainer.appendChild(removeButton);
                previewContainer.appendChild(audioContainer);
            };
            reader.readAsDataURL(file);
        }
    });
    async function selectAnswersWithAI() {
        console.log('🤖 Starting AI answer selection process');
        let quizText = '';
        let imagesToProcess = [...uploadedImages];
        let audiosToProcess = [...uploadedAudios];
        const extractedImageUrls = [];
        const isIncognito = localStorage.getItem('incognitoMode') === 'true';

        function addLoadingState(questionElement) {
            if (!isIncognito) {
                const loadingDiv = document.createElement('div');
                loadingDiv.classList.add('ai-loading-state');
                loadingDiv.innerHTML = `
                    <div class="loader">
                        <div class="spinner"></div>
                        <p class="loading-text">Đang tải...</p>
                    </div>
                `;
                questionElement.insertBefore(loadingDiv, questionElement.firstChild);
            }
        }

        function removeLoadingState(questionElement) {
            if (!isIncognito) {
                const loadingDiv = questionElement.querySelector('.ai-loading-state');
                if (loadingDiv) {
                    loadingDiv.remove();
                }
            }
        }

        try {
            console.log('🔄 Loading Google Generative AI...');
            const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");
            const API_KEY = "AIzaSyAxasVpc8FGsLOcToZB9yslD-X4-WtaAd4"; // Replace with your actual API key
            const genAI = new GoogleGenerativeAI(API_KEY);
            console.log('✅ Google Generative AI loaded successfully');

            async function sendToAI(prompt, images, audios) {
                const turboMode = document.getElementById('turboToggle')?.checked || false;
                console.log('🔄 Sending data to AI...', {
                    promptLength: prompt.length,
                    numberOfImages: images.length,
                    numberOfAudios: audios.length,
                    turboMode
                });
                try {
                    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
                    const parts = [{ text: prompt }];

                    let successfulImages = 0;
                    for (let imageData of images) {
                        if (imageData) {
                            try {
                                if (typeof imageData === 'string' && imageData.startsWith('http')) {
                                    console.log('🔄 Converting URL to base64:', imageData);
                                    imageData = await convertImageToBase64(imageData);
                                }

                                if (imageData) {
                                    const base64Data = imageData.replace(/^data:image\/(png|jpeg|jpg|gif);base64,/, '');
                                    parts.push({
                                        inlineData: {
                                            data: base64Data,
                                            mimeType: 'image/jpeg'
                                        }
                                    });
                                    successfulImages++;
                                    console.log('✅ Successfully added image to AI request');
                                }
                            } catch (err) {
                                console.warn('⚠️ Failed to process image:', err);
                                continue;
                            }
                        }
                    }
                    console.log(`📊 Successfully processed ${successfulImages} out of ${images.length} images`);

                    let successfulAudios = 0;
                    for (let audioData of audios) {
                        if (audioData && audioData.data) {
                            try {
                                const base64AudioData = audioData.data.split(',')[1]; // Remove the prefix
                                const mimeType = audioData.type;
                                parts.push({
                                    inlineData: {
                                        data: base64AudioData,
                                        mimeType: mimeType
                                    }
                                });
                                successfulAudios++;
                                console.log('✅ Successfully added audio to AI request');
                            } catch (err) {
                                console.warn('⚠️ Failed to process audio:', err);
                                continue;
                            }
                        }
                    }
                    console.log(`📊 Successfully processed ${successfulAudios} out of ${audios.length} audios`);

                    console.log('🤖 Generating AI response with primary model...');
                    try {
                        const result = await model.generateContent(parts);
                        const response = await result.response.text();
                        console.log('✅ Primary AI response received successfully:', response);

                        if (turboMode) {
                            console.log('🔄 Turbo Mode: Getting secondary AI response...');
                            try {
                                // Store the first AI response
                                const ai1Response = response;

                                // Get the second AI response
                                const fallbackGenAI = new GoogleGenerativeAI('AIzaSyBB5luT_N-hEvr-sPAHSHbsQC5UrZZvEf0');
                                const fallbackModel = fallbackGenAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
                                const fallbackResult = await fallbackModel.generateContent(parts);
                                const ai2Response = await fallbackResult.response.text();
                                console.log('✅ Secondary AI response received:', ai2Response);

                                if (ai1Response !== ai2Response) {
                                    console.log('⚠️ AI responses differ, asking AI 1 to reconsider...');
                                    const reconsiderPrompt = `You previously provided this answer to a question:

"${ai1Response}"

Another AI analyzed the same question and provided this different answer:

"${ai2Response}"

Please reconsider your answer. If you believe the other AI's answer is more accurate, respond with ONLY "USE_AI2_RESPONSE". If you still believe your original answer is correct, respond with ONLY "USE_AI1_RESPONSE".`;

                                    const reconsiderResult = await model.generateContent([{text: reconsiderPrompt}]);
                                    const reconsiderResponse = await reconsiderResult.response.text();
                                    console.log('✅ AI 1 reconsideration complete:', reconsiderResponse);

                                    // Use the stored responses based on AI 1's decision
                                    if (reconsiderResponse.includes('USE_AI2_RESPONSE')) {
                                        console.log('✅ AI 1 decided to use AI 2 response');
                                        return ai2Response;
                                    } else {
                                        console.log('✅ AI 1 decided to keep its original response');
                                        return ai1Response;
                                    }
                                }
                            } catch (turboError) {
                                console.warn('⚠️ Turbo mode failed, falling back to primary response:', turboError);
                            }
                        }
                        return response;
                    } catch (primaryError) {
                        console.warn('⚠️ Primary API failed, attempting fallback...', primaryError);
                        try {
                            const fallbackGenAI = new GoogleGenerativeAI('AIzaSyBB5luT_N-hEvr-sPAHSHbsQC5UrZZvEf0');
                            const fallbackModel = fallbackGenAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
                            console.log('🤖 Generating AI response with fallback model...');
                            const fallbackResult = await fallbackModel.generateContent(parts);
                            const fallbackResponse = await fallbackResult.response.text();
                            console.log('✅ Fallback AI response received successfully:', fallbackResponse);
                            return fallbackResponse;
                        } catch (fallbackError) {
                            console.error("❌ Both APIs failed:", { primary: primaryError, fallback: fallbackError });
                            showToast('Error processing request. Please try again later.');
                            return "Error occurred while processing the request.";
                        }
                    }
                } catch (error) {
                    console.error("❌ Unexpected error:", error);
                    showToast('An unexpected error occurred. Please try again.');
                    return "Error occurred while processing the request.";
                }
            }

            console.log('🔄 Extracting quiz content...');

            // Extract quiz title from quiz-header
            const quizTitle = document.querySelector('.quiz-header h1');
            if (quizTitle) {
                const titleText = quizTitle.innerText.trim();
                if (titleText) {
                    console.log('✅ Đã tìm thấy tiêu đề quiz:', titleText);
                    quizText += `Tiêu đề: ${titleText}\n\n`;
                }
            } else {
                console.log('⚠️ Không tìm thấy tiêu đề quiz');
            }

            // Extract instructions and reading content from #quiz-instructions
            const quizInstructions = document.querySelector('#quiz-instructions.user_content.enhanced');
            if (quizInstructions) {
                console.log('✅ Đã tìm thấy phần hướng dẫn và nội dung bài đọc');
                // Get all paragraphs from instructions
                const paragraphs = quizInstructions.querySelectorAll('p');
                paragraphs.forEach((p, index) => {
                    const text = p.innerText.trim();
                    if (text) {
                        console.log(`📝 Đoạn văn ${index + 1}:`, text.substring(0, 50) + '...');
                        quizText += `${text}\n\n`;
                    }
                });
            } else {
                console.log('⚠️ Không tìm thấy phần hướng dẫn và nội dung bài đọc');
            }


            const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');
            if (questionElements.length === 0) {
                console.error('❌ No questions found');
                showToast('Failed to extract questions. Please try again.');
                return;
            }
            console.log(`📝 Found ${questionElements.length} questions`);

            showToast('Đang xử lý hình ảnh và nội dung...');

            // Add loading state to all question containers
            if (!isIncognito) {
                questionElements.forEach(addLoadingState);
            }

            // Extract questions and images
            questionElements.forEach((questionElement, index) => {
                // Extract question text
                let questionTextElement = questionElement.querySelector('.question_text, .qtext');
                if (questionTextElement) {
                    let questionText = '';
                    for (let node of questionTextElement.childNodes) {
                        if (node.nodeType === Node.TEXT_NODE) {
                            questionText += node.textContent;
                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList.contains('MJX_Assistive_MathML')) {
                                questionText += node.textContent;
                            } else {
                                questionText += node.textContent;
                            }
                        }
                    }
                    quizText += `Câu hỏi ${index + 1}: ${questionText.trim()}\n`;
                }

                // Enhanced image detection
                const questionImages = questionElement.querySelectorAll('img:not([class*="emoji"]):not([class*="icon"])');
                console.log(`📸 Found ${questionImages.length} images in question ${index + 1}`);

                questionImages.forEach((img, imgIndex) => {
                    // Filter out small icons and decorative images
                    const width = img.width || img.getAttribute('width');
                    const height = img.height || img.getAttribute('height');
                    const isSmallImage = (width && width < 50) || (height && height < 50);

                    // Check if image is actually content-related
                    const isContentImage = img.src && (
                        img.src.includes('/preview') ||
                        img.src.includes('/files/') ||
                        img.src.includes('/courses/')
                    );

                    if (!isSmallImage && isContentImage) {
                        quizText += `Hình ảnh câu hỏi ${index + 1}.${imgIndex + 1}: [${img.alt || 'Image'}]\n`;
                        extractedImageUrls.push(img.src);
                        console.log(`✅ Added image from question ${index + 1}:`, img.src);
                    }
                });

                // Check if this is a multiple-choice question
                const isMultipleChoice = questionElement.querySelectorAll('input[type="checkbox"]').length > 0;
                if (isMultipleChoice) {
                    quizText += "Câu này có thể chọn nhiều đáp án, nhưng không phải lúc nào câu này cũng có 1 đáp án trở lên, xe xét kĩ trước khi đưa ra đáp án\n";
                }

                // **Corrected: Extract answer text, handling LaTeX properly**
                const answers = questionElement.querySelectorAll('.answer, .answer-text, .option, .ablock, .rightanswer');
                console.log(`📝 Found ${answers.length} answers for question ${index + 1}`);

                answers.forEach((answerElement, answerIndex) => {
                    let answerText = '';
                    // Find the LaTeX script element directly within the answer element
                    const latexScript = answerElement.querySelector('script[type="math/tex"]');
                    if (latexScript) {
                        // Extract only the LaTeX content
                        answerText = latexScript.textContent.trim();
                    } else {
                        // For non-LaTeX answers, extract text as before
                        for (let node of answerElement.childNodes) {
                            if (node.nodeType === Node.TEXT_NODE) {
                                answerText += node.textContent;
                            } else if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.classList.contains('MJX_Assistive_MathML')) {
                                    answerText += node.textContent;
                                } else if (node.tagName === 'IMG' && node.hasAttribute('alt')) {
                                    answerText += `[${node.alt}]`;
                                } else {
                                    answerText += node.textContent;
                                }
                            }
                        }
                    }

                    // Enhanced answer image detection
                    const imageElements = answerElement.querySelectorAll('img:not([class*="emoji"]):not([class*="icon"])');
                    imageElements.forEach((img, imgIndex) => {
                        // Filter out small icons and decorative images
                        const width = img.width || img.getAttribute('width');
                        const height = img.height || img.getAttribute('height');
                        const isSmallImage = (width && width < 50) || (height && height < 50);

                        // Check if image is actually content-related
                        const isContentImage = img.src && (
                            img.src.includes('/preview') ||
                            img.src.includes('/files/') ||
                            img.src.includes('/courses/')
                        );

                        if (!isSmallImage && isContentImage) {
                            quizText += `Hình ảnh đáp án ${index + 1}.${answerIndex + 1}.${imgIndex + 1}: [${img.alt || 'Image'}]\n`;
                            extractedImageUrls.push(img.src);
                            console.log(`✅ Added image from answer ${index + 1}.${answerIndex + 1}:`, img.src);
                        }
                    });

                    if (answerText) {
                        // **Improved: Add "Đáp án" label only if answer is not empty**
                        quizText += ` ${answerText.trim()}\n`;
                    }
                });

                quizText += '\n';
            });

            // Prompt (no changes needed here)
            quizText += "\n\nĐưa đáp án cho các câu hỏi, mỗi đáp án cách nhau bằng dấu chấm phẩy (;). QUAN TRỌNG: CHỈ trả về CHÍNH XÁC nội dung đáp án như nó xuất hiện trong câu hỏi, KHÔNG thêm ký hiệu (A., B., C., D.) hay bất kỳ thông tin nào khác. Ví dụ nếu đáp án là 'Gene là những đoạn DNA trên nhiễm sắc thể, mang thông tin quy định protein mà tế bào tạo ra' thì chỉ trả về chính xác chuỗi đó, không thêm 'D.' hay bất kỳ ký hiệu nào khác vào trước. Tất cả đáp án phải nằm trên một dòng duy nhất, không xuống dòng. **Nếu đáp án là các biểu thức toán học, hãy trả về chúng dưới dạng LaTeX, ví dụ: '\\frac{1}{2}'**. Ví dụ mẫu đáp án đúng: 'Cả hai đáp án đúng; Trồng lúa lấy gạo để xuất khẩu; Sử dụng thuốc hóa học; Tăng diện tích đất trồng'";
            console.log('🔄 Processing images...');
            showToast('Đang xử lý hình ảnh...');
            const processedImages = await Promise.allSettled(
                extractedImageUrls.map(async url => {
                    for (let attempt = 0; attempt < 3; attempt++) {
                        try {
                            console.log(`🔄 Attempt ${attempt + 1} for image:`, url);
                            const result = await convertImageToBase64(url);
                            if (result) {
                                console.log('✅ Image processed successfully:', url);
                                return result;
                            }
                        } catch (err) {
                            console.warn(`⚠️ Attempt ${attempt + 1} failed for ${url}:`, err);
                        }
                    }
                    return null;
                })
            );

            const successfulImages = processedImages
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value);

            console.log(`📊 Successfully processed ${successfulImages.length} out of ${extractedImageUrls.length} images`);
            imagesToProcess = [...imagesToProcess, ...successfulImages];

            showToast('Đang xử lý câu trả lời bằng AI...');
            console.log('🤖 Sending to AI for processing...');

            // Log the data being sent to AI
            console.log('Data sent to AI:', {
                prompt: quizText,
                images: imagesToProcess,
                audios: audiosToProcess
            });

            const aiResponse = await sendToAI(quizText, imagesToProcess, audiosToProcess);
            console.log('✅ AI Response received:', aiResponse);

            const correctAnswers = aiResponse.split(';').map(answer => answer.trim());
            console.log('📝 Parsed answers:', correctAnswers);

            const autoSubmit = loadAutoSubmitPreference();
            selectCorrectAnswers(correctAnswers, autoSubmit);

            // Remove loading state after AI processing is complete
            if (!isIncognito) {
                questionElements.forEach(removeLoadingState);
                console.log('✅ Answers selected successfully!');
                showToast('Đã chọn đáp án bằng AI!');
            }

        } catch (error) {
            // Remove loading state in case of error
            if (!isIncognito) {
                const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');
                questionElements.forEach(removeLoadingState);
                console.error('❌ Main process error:', error);
                showToast('Có lỗi xảy ra. Vui lòng thử lại.');
            }
        }
    }

    document.getElementById('aiAnswerButton').addEventListener('click', selectAnswersWithAI);

    async function handleQuestionReply() {
        console.log('🤖 Bắt đầu xử lý câu trả lời.');

        // Kiểm tra xem script đã được khởi tạo chưa
        if (!window.studyAidXInitialized) {
            console.log('⚠️ Script chưa được khởi tạo đầy đủ.');
            return;
        }

        let getAnswerButton;
        let contentType = ''; // Biến để theo dõi loại nội dung: 'discussion' hoặc 'assignment'

        try {
            // Kiểm tra xem nút đã tồn tại chưa để tránh tạo nhiều nút
            if (document.querySelector('.get-answer-btn')) {
                console.log('🔔 Nút "ẤN VÔ ĐÂY ĐỂ COPY ĐÁP ÁN" đã tồn tại.');
                return;
            }

            // Tạo nút ngay lập tức và thêm vào DOM
            getAnswerButton = document.createElement('button');
            getAnswerButton.textContent = 'ẤN VÔ ĐÂY ĐỂ COPY ĐÁP ÁN';
            getAnswerButton.className = 'btn-success get-answer-btn';
            getAnswerButton.style = `
                background: #0B874B;
                color: #FFFFFF;
                border: 1px solid #054024;
                border-radius: 4px;
                padding: 6px 12px;
                font-size: 14px;
                cursor: pointer;
                margin-left: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 200px;
            `;

            // Xác định loại nội dung và vị trí chèn nút dựa trên loại nội dung
            let titleSelector, questionSelector, answersSelector, insertionPoint;

            if (document.querySelector('.discussion-title')) {
                contentType = 'discussion';
                titleSelector = '.discussion-title';
                questionSelector = '.message_wrapper .message';
                answersSelector = '.message_wrapper .message.user_content.enhanced';
                insertionPoint = document.querySelector('.btn-success'); // Ưu tiên sau nút "Đã đăng ký" trong discussion
                if (!insertionPoint) insertionPoint = document.querySelector('.message_wrapper'); // Nếu không có "Đã đăng ký", chèn vào cuối thảo luận
            } else if (document.querySelector('.assignment-title')) {
                contentType = 'assignment';
                titleSelector = '.assignment-title';
                questionSelector = '.description.user_content.enhanced';
                answersSelector = null;
                insertionPoint = document.querySelector('.title-content'); // Chèn nút vào div có class "title-content" cho assignment
            } else {
                console.log('⚠️ Không xác định được loại nội dung (không phải discussion hoặc assignment).');
                return; // Không xử lý nếu không phải hai loại trên
            }

            if (insertionPoint) {
                if (contentType === 'discussion' && document.querySelector('.btn-success')) {
                    insertionPoint.parentNode.insertBefore(getAnswerButton, insertionPoint.nextSibling);
                    console.log(`✅ Đã chèn nút vào ${contentType} sau nút "Đã đăng ký".`);
                } else {
                    insertionPoint.appendChild(getAnswerButton);
                    console.log(`✅ Đã chèn nút vào cuối phần ${contentType}.`);
                }
            } else {
                console.log(`⚠️ Không tìm thấy vị trí chèn nút cho ${contentType}.`);
                return;
            }


            console.log('🔄 Đang tải Google Generative AI...');
            const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");
            const API_KEY = "AIzaSyAxasVpc8FGsLOcToZB9yslD-X4-WtaAd4"; // Replace with your actual API key
            const genAI = new GoogleGenerativeAI(API_KEY);

            async function sendToAI(prompt, focusPrompt = '') {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
                const parts = [{ text: `${focusPrompt}\n\n${prompt}` }];

                // Tạo 2 AI để tranh luận
                const ai1Result = await model.generateContent(parts);
                const ai1Response = await ai1Result.response.text();

                const ai2Parts = [{ text: `${focusPrompt}\n\n${prompt}\nHãy phân tích kết quả sau và đưa ra ý kiến của bạn: ${ai1Response}` }];
                const ai2Result = await model.generateContent(ai2Parts);
                const ai2Response = await ai2Result.response.text();

                // Nếu 2 AI có ý kiến khác nhau, cho họ tranh luận
                if (ai1Response !== ai2Response) {
                    const debateParts = [{ text: `${focusPrompt}\n\n${prompt}\n\nAI 1: ${ai1Response}\n\nAI 2: ${ai2Response}\n\nHãy phân tích cả 2 ý kiến trên và đưa ra kết luận cuối cùng theo đúng format yêu cầu.` }];
                    const finalResult = await model.generateContent(debateParts);
                    return await finalResult.response.text();
                }

                return ai1Response;
            }

            // Trích xuất nội dung dựa trên loại trang
            let discussionContent = '';
            if (contentType === 'discussion' || contentType === 'assignment') {
                // Trích xuất tiêu đề
                const titleElement = document.querySelector(titleSelector);
                const titleContent = titleElement ? titleElement.innerText.trim() : '';

                // Trích xuất câu hỏi
                const questionElement = document.querySelector(questionSelector);
                const questionContent = questionElement ? questionElement.innerText.trim() : '';

                let answersContent = "";
                if (contentType === 'discussion' && answersSelector) {
                    const answersElements = document.querySelectorAll(answersSelector);
                    answersElements.forEach(answerElement => {
                        answersContent += answerElement.innerText.trim() + "\n\n";
                    });
                }

                // Kiểm tra và xử lý nội dung trống
                if (!titleContent || !questionContent) {
                    console.log(`⚠️ Thiếu tiêu đề hoặc nội dung câu hỏi trong phần ${contentType}.`);
                    return;
                }

                // Tạo nội dung với định dạng cải tiến
                discussionContent = `Tiêu đề: ${titleContent.replace(/\n+/g, ' ').trim()}\n\nCâu hỏi: ${questionContent.replace(/\n+/g, ' ').trim()}`;

                // Thêm các câu trả lời khác nếu có và làm sạch định dạng
                if (answersContent) {
                    const cleanedAnswers = answersContent
                        .split('\n\n')
                        .filter(answer => answer.trim())
                        .map(answer => answer.replace(/\n+/g, ' ').trim())
                        .join('\n\n');
                    if (cleanedAnswers) {
                        discussionContent += `\n\nCác câu trả lời khác:\n${cleanedAnswers}`;
                    }
                }

                const customPrompt = `Vui lòng phân tích nội dung ${contentType} (bằng tiếng Việt) và tạo ra câu trả lời ngắn gọn, súc tích và thuyết phục dưới dạng HTML được định dạng tốt, có sử dụng CSS inline. Câu trả lời cần có bố cục rõ ràng, dễ đọc. Các phần văn bản của câu trả lời cần xuất hiện (animate in) mượt mà khi người dùng cuộn trang đến và biến mất (animate out) mượt mà khi người dùng cuộn trang ra khỏi, tạo hiệu ứng hiển thị/ẩn mượt mà dựa trên cuộn trang. Hiệu ứng này cần đạt được bằng cách sử dụng CSS keyframes và thuộc tính \`animation-timeline: view;\` và \`animation-range: entry cover;\` cho hoạt ảnh dựa trên cuộn trang, không sử dụng bất kỳ Javascript tùy chỉnh nào. Hãy sử dụng CSS ví dụ được cung cấp làm hướng dẫn cho hoạt ảnh, nhưng hãy điều chỉnh khi cần thiết cho nội dung cụ thể. Sử dụng các thẻ HTML ngữ nghĩa và các style inline liên quan để định dạng tốt hơn, dễ đọc và thuyết phục hơn. Đặc biệt chú ý làm cho câu trả lời dễ đọc và dễ hiểu. Sử dụng danh sách hoặc bảng khi thích hợp. HTML phải bao gồm một hình mờ bán trong suốt (watermark) với dòng chữ "Em không sử dụng A.I" được đặt ở góc dưới cùng bên phải của nội dung. Chỉ cung cấp nội dung HTML trong thẻ <body>, không có thẻ <html>, <head> hoặc <body> bao quanh. Không bao gồm bất kỳ nhận xét mở đầu hoặc kết thúc nào như "Chúc bạn học tốt!" hoặc bất kỳ văn bản nào khác ngoài phản hồi HTML có cấu trúc. Không đính kèm HTML bằng \`\`\`html hoặc \`\`\`. Câu trả lời cần trả lời được câu hỏi. Đối với ${contentType} là thảo luận, câu trả lời cần tham khảo và giống với các câu trả lời của các bạn học sinh khác đã được cung cấp (nếu có).`;


                // Add spinner style (chỉ thêm nếu chưa có)
                if (!document.querySelector('#spinnerAnimation')) {
                    const style = document.createElement('style');
                    style.id = 'spinnerAnimation';
                    style.textContent = `
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `;
                    document.head.appendChild(style);
                }

                // Enhanced loading state function
                const setLoading = (isLoading, phase = '') => {
                    if (isLoading) {
                        getAnswerButton.disabled = true;

                        const spinnerHTML = `
                            <div class="spinner" style="
                                display: inline-block;
                                width: 16px;
                                height: 16px;
                                border: 2px solid #ffffff;
                                border-radius: 50%;
                                border-top-color: transparent;
                                margin-right: 8px;
                                animation: spin 1s linear infinite;
                            "></div>`;

                        let loadingText = 'Đang khởi động AI...';
                        switch (phase) {
                            case 'analyzing':
                                loadingText = 'AI đang phân tích câu hỏi...';
                                break;
                            case 'generating':
                                loadingText = 'AI đang soạn câu trả lời...';
                                break;
                            case 'formatting':
                                loadingText = 'AI đang định dạng nội dung...';
                                break;
                            default:
                                loadingText = 'Đang xử lý...';
                        }

                        getAnswerButton.innerHTML = spinnerHTML + loadingText;
                        getAnswerButton.style.backgroundColor = '#666666';
                    } else {
                        getAnswerButton.disabled = false;
                        getAnswerButton.innerHTML = 'ẤN VÔ ĐÂY ĐỂ COPY ĐÁP ÁN';
                        getAnswerButton.style.backgroundColor = '#0B874B';
                    }
                };

                // Set initial loading state
                setLoading(true);

                // Wait for the next frame so the DOM has time to update
                await new Promise(resolve => requestAnimationFrame(resolve));

                // Update loading state for analysis
                setLoading(true, 'analyzing');
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Update loading state for generation
                setLoading(true, 'generating');
                let aiResponse = await sendToAI(discussionContent, customPrompt);

                // Remove "```html" and "```" from the AI response
                aiResponse = aiResponse.replace("```html", "").replace("```", "");

                // Update loading state for formatting
                setLoading(true, 'formatting');
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Reset loading state
                setLoading(false);

                // Copy AI response to clipboard on button click
                getAnswerButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(aiResponse).then(() => {
                        console.log(`✅ AI response (Styled HTML with Sources) cho ${contentType} đã được sao chép vào clipboard!`);
                    }).catch(err => {
                        console.error('❌ Không thể sao chép. Lỗi:', err);
                    });
                });
            }
        } catch (error) {
            console.error('❌ Lỗi trong quá trình xử lý:', error);
            if (getAnswerButton) {
                getAnswerButton.innerHTML = '❌ Đã xảy ra lỗi';
                getAnswerButton.style.backgroundColor = '#dc3545';
                setTimeout(() => {
                    getAnswerButton.innerHTML = 'ẤN VÔ ĐÂY ĐỂ COPY ĐÁP ÁN';
                    getAnswerButton.style.backgroundColor = '#0B874B';
                    getAnswerButton.disabled = false;
                }, 2000);
            }
        }
    }




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

    // Question analysis cache
    const questionAnalysisCache = new Map();

    // Image processing queue
    const imageProcessingQueue = [];
    let isProcessingImages = false;

    async function handleQuestionAIClick(questionElement, questionIndex) {
        try {
            // Check cache first
            const cacheKey = `question-${questionIndex}`;
            if (questionAnalysisCache.has(cacheKey)) {
                console.log('📝 Using cached question analysis for question', questionIndex);
                const cachedAnalysis = questionAnalysisCache.get(cacheKey);
                showChatPopup(questionIndex, cachedAnalysis.prompt);
                return;
            }

            console.log('🔍 Analyzing question', questionIndex);
            const analysis = await analyzeQuestion(questionElement, questionIndex);
            questionAnalysisCache.set(cacheKey, analysis);

            showChatPopup(questionIndex, analysis.prompt);
        } catch (error) {
            console.error('❌ Error analyzing question:', error);
            showToast('Failed to analyze question. Please try again.');
        }
    }

    async function analyzeQuestion(questionElement, questionIndex) {
        // Extract and validate question components
        const components = await extractQuestionComponents(questionElement);

        // Process images in parallel
        const processedImages = await processQuestionImages(components.images);

        // Generate enhanced prompt
        const prompt = generateQuestionPrompt(components, processedImages);

        return {
            components,
            processedImages,
            prompt
        };
    }

    async function extractQuestionComponents(questionElement) {
        const components = {
            text: '',
            images: [],
            options: [],
            type: detectQuestionType(questionElement),
            metadata: {}
        };

        // Extract question text with improved parsing
        const questionTextElement = questionElement.querySelector('.question_text');
        if (questionTextElement) {
            components.text = await parseQuestionText(questionTextElement);
        }

        // Extract and validate images
        const images = questionElement.querySelectorAll('img[alt*="Screenshot"]');
        components.images = Array.from(images).map(img => ({
            src: img.src,
            alt: img.alt,
            dimensions: {
                width: img.naturalWidth,
                height: img.naturalHeight
            }
        }));

        // Extract and categorize answer options
        const answerElements = questionElement.querySelectorAll('.answer, .answer-text, .option');
        components.options = await Promise.all(
            Array.from(answerElements).map(async (element, index) => {
                return {
                    index,
                    text: await parseAnswerText(element),
                    type: detectAnswerType(element),
                    images: Array.from(element.querySelectorAll('img')).map(img => ({
                        src: img.src,
                        alt: img.alt
                    }))
                };
            })
        );

        // Extract metadata
        components.metadata = {
            hasLatex: detectLatexContent(questionElement),
            hasCode: detectCodeContent(questionElement),
            complexity: assessQuestionComplexity(components)
        };

        return components;
    }

    async function parseQuestionText(element) {
        let text = '';

        // Handle LaTeX content
        const latexElements = element.querySelectorAll('script[type="math/tex"]');
        if (latexElements.length > 0) {
            for (const latex of latexElements) {
                text += `[LATEX]${latex.textContent}[/LATEX]`;
            }
        }

        // Handle regular text
        const textNodes = Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent.trim());

        text += textNodes.join(' ');

        return text;
    }

    async function processQuestionImages(images) {
        return new Promise((resolve, reject) => {
            imageProcessingQueue.push({
                images,
                resolve,
                reject
            });
            processImageQueue();
        });
    }

    async function processImageQueue() {
        if (isProcessingImages || imageProcessingQueue.length === 0) return;
        isProcessingImages = true;

        while (imageProcessingQueue.length > 0) {
            const { images, resolve, reject } = imageProcessingQueue.shift();

            try {
                const processedImages = await Promise.all(
                    images.map(async (img) => {
                        // Validate image
                        if (!await isValidImage(img.src)) {
                            console.warn('⚠️ Invalid image:', img.src);
                            return null;
                        }

                        // Process image with retries
                        for (let attempt = 0; attempt < 3; attempt++) {
                            try {
                                const base64Data = await convertImageToBase64(img.src);
                                if (base64Data) {
                                    return {
                                        ...img,
                                        base64: base64Data,
                                        processed: true
                                    };
                                }
                            } catch (err) {
                                console.warn(`⚠️ Attempt ${attempt + 1} failed for image:`, img.src);
                                if (attempt === 2) throw err;
                            }
                        }
                    })
                );

                resolve(processedImages.filter(img => img !== null));
            } catch (error) {
                reject(error);
            }
        }

        isProcessingImages = false;
    }

    async function isValidImage(src) {
        try {
            const response = await fetch(src);
            const contentType = response.headers.get('content-type');
            return contentType && contentType.startsWith('image/');
        } catch {
            return false;
        }
    }

    function detectQuestionType(element) {
        if (element.querySelector('select')) return 'matching';
        if (element.querySelector('input[type="checkbox"]')) return 'multiple_select';
        if (element.querySelector('input[type="radio"]')) return 'multiple_choice';
        if (element.querySelector('input[type="text"]')) return 'fill_in_blank';
        return 'unknown';
    }

    function detectAnswerType(element) {
        if (element.querySelector('img')) return 'image_based';
        if (element.querySelector('script[type="math/tex"]')) return 'latex';
        if (element.querySelector('code')) return 'code';
        return 'text';
    }

    function detectLatexContent(element) {
        return element.querySelector('script[type="math/tex"]') !== null;
    }

    function detectCodeContent(element) {
        return element.querySelector('code, pre') !== null;
    }

    function assessQuestionComplexity(components) {
        let complexity = 0;

        // Factor in text length
        complexity += components.text.length / 100;

        // Factor in number of images
        complexity += components.images.length * 2;

        // Factor in answer options
        complexity += components.options.length;

        // Factor in special content
        if (components.metadata.hasLatex) complexity += 2;
        if (components.metadata.hasCode) complexity += 2;

        return Math.min(Math.round(complexity), 10); // Scale from 0-10
    }

    function generateQuestionPrompt(components, processedImages) {
        let prompt = `[QUESTION TYPE: ${components.type.toUpperCase()}]\n\n`;

        // Add question text
        prompt += `Question: ${components.text}\n\n`;

        // Add processed images
        if (processedImages.length > 0) {
            prompt += 'Images:\n';
            processedImages.forEach((img, index) => {
                prompt += `[Image ${index + 1}]: ${img.alt}\n`;
            });
            prompt += '\n';
        }

        // Add answer options
        if (components.options.length > 0) {
            prompt += 'Answer Options:\n';
            components.options.forEach((option, index) => {
                prompt += `${String.fromCharCode(65 + index)}. ${option.text}\n`;
                if (option.images.length > 0) {
                    option.images.forEach((img, imgIndex) => {
                        prompt += `   Image ${imgIndex + 1}: ${img.alt}\n`;
                    });
                }
            });
        }

        // Add metadata for context
        prompt += `\nMetadata:\n`;
        prompt += `- Complexity: ${components.metadata.complexity}/10\n`;
        prompt += `- Contains LaTeX: ${components.metadata.hasLatex}\n`;
        prompt += `- Contains Code: ${components.metadata.hasCode}\n`;

        return prompt;
    }

    // Function to create and show chat popup
    function showChatPopup(questionIndex, initialQuestion) {
        try {
            // Remove existing popup if any
            const existingPopup = document.querySelector('.ai-chat-popup');
            if (existingPopup) {
                existingPopup.remove();
            }

            // Create popup with enhanced UI
            const popup = createEnhancedChatPopup(questionIndex);
            document.body.appendChild(popup);

            // Initialize chat state
            chatState.activeChats.set(questionIndex, {
                messages: [],
                status: 'active',
                lastActivity: Date.now()
            });

            // Setup event listeners and load history
            setupEnhancedChatEventListeners(popup, questionIndex, initialQuestion);
            loadChatHistoryWithRetry(questionIndex, popup);

            // Send initial question if no history exists
            if (!chatHistory.has(questionIndex) && !localStorage.getItem(`chatHistory-${questionIndex}`)) {
                sendMessageToAI(initialQuestion, questionIndex, popup);
            }

            // Add auto-save functionality
            setupAutoSave(popup, questionIndex);

        } catch (error) {
            console.error('Failed to create chat popup:', error);
            showToast('Failed to open chat. Please try again.');
        }
    }

    function createEnhancedChatPopup(questionIndex) {
        const popup = document.createElement('div');
        popup.className = 'ai-chat-popup enhanced';

        const popupContent = `
            <div class="popup-header">
                <div class="header-content">
                    <h3>AI Assistant - Question ${questionIndex + 1}</h3>
                    <div class="connection-status">Connected</div>
                </div>
                <div class="header-controls">
                    <select id="model-select" class="model-dropdown">
                        <option value="gemini-exp-1206">Gemini (Experimental)</option>
                        <option value="gemini-pro">Gemini Pro</option>
                    </select>
                    <button class="minimize-popup">_</button>
                    <button class="close-popup">×</button>
                </div>
            </div>
            <div class="chat-messages" role="log" aria-live="polite">
                <div class="messages-container"></div>
                <div class="typing-indicator" style="display: none;">
                    <span></span><span></span><span></span>
                </div>
            </div>
            <div class="chat-controls">
                <div class="control-buttons">
                    <input type="file" id="file-upload" accept="image/*, .pdf, .doc, .docx" style="display: none;">
                    <button id="upload-button" class="control-btn">
                        <span class="icon">📎</span>
                        Upload
                    </button>
                    <button id="clear-history" class="control-btn">
                        <span class="icon">🗑️</span>
                        Clear
                    </button>
                    <button id="export-chat" class="control-btn">
                        <span class="icon">📥</span>
                        Export
                    </button>
                </div>
            </div>
            <div class="chat-input-container">
                <textarea class="chat-input"
                        placeholder="Type your message... (Shift + Enter for new line)"
                        rows="1"
                        aria-label="Chat input"></textarea>
                <button class="send-message" disabled>
                    <span class="icon">📤</span>
                </button>
            </div>
            <div class="error-container" style="display: none;">
                <div class="error-message"></div>
                <button class="retry-button">Retry</button>
            </div>
        `;

        popup.innerHTML = popupContent;

        // Add drag functionality
        makeDraggable(popup);

        return popup;
    }

    function setupEnhancedChatEventListeners(popup, questionIndex, initialQuestion) {
        const elements = {
            closeBtn: popup.querySelector('.close-popup'),
            minimizeBtn: popup.querySelector('.minimize-popup'),
            sendBtn: popup.querySelector('.send-message'),
            input: popup.querySelector('.chat-input'),
            clearHistoryBtn: popup.querySelector('#clear-history'),
            uploadBtn: popup.querySelector('#upload-button'),
            fileInput: popup.querySelector('#file-upload'),
            modelSelect: popup.querySelector('#model-select'),
            exportBtn: popup.querySelector('#export-chat'),
            retryBtn: popup.querySelector('.retry-button'),
            errorContainer: popup.querySelector('.error-container')
        };

        // Close and minimize handlers
        elements.closeBtn.addEventListener('click', () => {
            saveAndCloseChat(popup, questionIndex);
        });

        elements.minimizeBtn.addEventListener('click', () => {
            minimizeChat(popup);
        });

        // Input handling with smart features
        setupEnhancedInputHandling(elements.input, elements.sendBtn, async (message) => {
            await sendMessageWithRetry(message, questionIndex, popup);
        });

        // Clear history with confirmation
        elements.clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the chat history?')) {
                clearChatHistoryWithBackup(questionIndex, popup);
            }
        });

        // Enhanced file upload
        setupEnhancedFileUpload(elements.uploadBtn, elements.fileInput, questionIndex, popup);

        // Model selection
        elements.modelSelect.addEventListener('change', () => {
            handleModelChange(elements.modelSelect.value, questionIndex);
        });

        // Export functionality
        elements.exportBtn.addEventListener('click', () => {
            exportChatHistory(questionIndex);
        });

        // Error retry handling
        elements.retryBtn.addEventListener('click', () => {
            retryFailedOperation(questionIndex, popup);
        });

        // Auto-resize input
        autoResizeInput(elements.input);
    }

    function setupEnhancedInputHandling(input, sendBtn, onSend) {
        let composing = false;

        const updateSendButton = () => {
            const hasContent = input.value.trim().length > 0;
            sendBtn.disabled = !hasContent;
            sendBtn.classList.toggle('active', hasContent);
        };

        input.addEventListener('input', () => {
            updateSendButton();
            autoResizeInput(input);
        });

        input.addEventListener('compositionstart', () => {
            composing = true;
        });

        input.addEventListener('compositionend', () => {
            composing = false;
        });

        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !composing) {
                e.preventDefault();
                const message = input.value.trim();
                if (message) {
                    input.value = '';
                    updateSendButton();
                    autoResizeInput(input);
                    await onSend(message);
                }
            }
        });

        sendBtn.addEventListener('click', async () => {
            const message = input.value.trim();
            if (message) {
                input.value = '';
                updateSendButton();
                autoResizeInput(input);
                await onSend(message);
            }
        });
    }

    function autoResizeInput(input) {
        input.style.height = 'auto';
        input.style.height = (input.scrollHeight) + 'px';
    }

    async function sendMessageWithRetry(message, questionIndex, popup, retryCount = 0) {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000;

        try {
            showTypingIndicator(popup);
            const response = await sendMessageToAI(message, questionIndex, popup);
            hideTypingIndicator(popup);
            return response;
        } catch (error) {
            hideTypingIndicator(popup);

            if (retryCount < MAX_RETRIES) {
                showToast(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return sendMessageWithRetry(message, questionIndex, popup, retryCount + 1);
            } else {
                showError(popup, 'Failed to send message after multiple attempts');
                throw error;
            }
        }
    }

    function showTypingIndicator(popup) {
        const indicator = popup.querySelector('.typing-indicator');
        indicator.style.display = 'flex';
    }

    function hideTypingIndicator(popup) {
        const indicator = popup.querySelector('.typing-indicator');
        indicator.style.display = 'none';
    }

    function showError(popup, message) {
        const errorContainer = popup.querySelector('.error-container');
        const errorMessage = popup.querySelector('.error-message');
        errorMessage.textContent = message;
        errorContainer.style.display = 'flex';
    }

    function hideError(popup) {
        const errorContainer = popup.querySelector('.error-container');
        errorContainer.style.display = 'none';
    }

    function setupAutoSave(popup, questionIndex) {
        let saveTimeout;
        const SAVE_DELAY = 1000; // 1 second delay

        const autoSave = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                const messages = chatState.activeChats.get(questionIndex)?.messages || [];
                saveChatHistoryToLocalStorage(questionIndex, messages);
            }, SAVE_DELAY);
        };

        // Listen for message additions
        const observer = new MutationObserver(autoSave);
        const messagesContainer = popup.querySelector('.messages-container');
        observer.observe(messagesContainer, { childList: true, subtree: true });

        // Cleanup on popup close
        popup.addEventListener('remove', () => {
            observer.disconnect();
            clearTimeout(saveTimeout);
        });
    }

    function exportChatHistory(questionIndex) {
        const history = chatHistory.get(questionIndex) || [];
        const exportData = {
            questionIndex,
            timestamp: new Date().toISOString(),
            messages: history
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-q${questionIndex + 1}-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector('.popup-header');

        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            const newTop = element.offsetTop - pos2;
            const newLeft = element.offsetLeft - pos1;

            // Keep within viewport
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;

            element.style.top = `${Math.min(Math.max(0, newTop), maxY)}px`;
            element.style.left = `${Math.min(Math.max(0, newLeft), maxX)}px`;
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // ... existing code ...

    // Function to send message to AI and handle response
    let generationToken = null;

    // Cache for AI responses
    const aiResponseCache = new Map();

    // Confidence threshold for AI responses
    const CONFIDENCE_THRESHOLD = 0.85;

    // Rate limiting and request queuing
    const requestQueue = [];
    let isProcessingQueue = false;
    const RATE_LIMIT_DELAY = 1000; // 1 second between requests

    // Performance metrics
    const performanceMetrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalResponseTime: 0
    };

    async function sendMessageToAI(message, questionIndex, popup) {
        const messagesContainer = popup.querySelector('.chat-messages');
        const cacheKey = `${questionIndex}-${message}`;

        // Check cache first
        if (aiResponseCache.has(cacheKey)) {
            console.log('🎯 Cache hit for question', questionIndex);
            const cachedResponse = aiResponseCache.get(cacheKey);
            addMessageToChat('user', message, messagesContainer);
            addMessageToChat('ai', cachedResponse, messagesContainer);
            return;
        }

        // Add request to queue
        return new Promise((resolve, reject) => {
            requestQueue.push({
                message,
                questionIndex,
                popup,
                resolve,
                reject,
                timestamp: Date.now()
            });
            processQueue();
        });
    }

    async function processQueue() {
        if (isProcessingQueue || requestQueue.length === 0) return;
        isProcessingQueue = true;

        while (requestQueue.length > 0) {
            const request = requestQueue.shift();
            const { message, questionIndex, popup, resolve, reject } = request;

            try {
                const startTime = performance.now();
                const response = await processAIRequest(message, questionIndex, popup);
                const endTime = performance.now();

                // Update performance metrics
                performanceMetrics.totalRequests++;
                performanceMetrics.successfulRequests++;
                performanceMetrics.totalResponseTime += (endTime - startTime);
                performanceMetrics.averageResponseTime = performanceMetrics.totalResponseTime / performanceMetrics.successfulRequests;

                resolve(response);

                // Rate limiting
                await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));
            } catch (error) {
                performanceMetrics.failedRequests++;
                reject(error);
            }
        }

        isProcessingQueue = false;
    }

    async function processAIRequest(message, questionIndex, popup) {
        const messagesContainer = popup.querySelector('.chat-messages');
        const modelSelect = popup.querySelector('#model-select');
        const selectedModel = modelSelect.value;

        // Add user message to chat
        const userMsg = addMessageToChat('user', message, messagesContainer);
        addEditButtonToMessage(userMsg, questionIndex, popup);

        // Display thinking message
        const thinkingMsg = addMessageToChat('ai', 'AI is thinking...', messagesContainer);

        try {
            // Load AI model with validation
            const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");
            if (!GoogleGenerativeAI) throw new Error('Failed to load AI model');

            const API_KEY = "AIzaSyAxasVpc8FGsLOcToZB9yslD-X4-WtaAd4";
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: selectedModel });

            // Enhanced context processing
            const enhancedMessage = await preprocessMessage(message);
            const result = await model.generateContent(enhancedMessage);

            // Validate response
            if (!result || !result.response) throw new Error('Invalid AI response');

            let response = await result.response.text();

            // Confidence scoring
            const confidence = calculateConfidence(response);
            if (confidence < CONFIDENCE_THRESHOLD) {
                console.warn(`Low confidence response (${confidence.toFixed(2)}) for question ${questionIndex}`);
                response = await enhanceResponse(response, model);
            }

            // Remove thinking message
            thinkingMsg.remove();

            // Format and cache response
            response = formatResponse(response);
            aiResponseCache.set(`${questionIndex}-${message}`, response);

            // Add to chat
            addMessageToChat('ai', response, messagesContainer);

            // Update chat history
            const history = chatHistory.get(questionIndex) || [];
            history.push({ role: 'user', content: message });
            history.push({ role: 'assistant', content: response });
            chatHistory.set(questionIndex, history);
            saveChatHistoryToLocalStorage(questionIndex, history);

            return response;

        } catch (error) {
            console.error("AI Processing Error:", error);
            thinkingMsg.remove();

            // Enhanced error handling
            const errorMessage = handleAIError(error);
            addMessageToChat('error', errorMessage, messagesContainer);
            throw error;
        }
    }

    async function preprocessMessage(message) {
        // Remove unnecessary whitespace and normalize text
        message = message.trim().replace(/\s+/g, ' ');

        // Extract key concepts and enhance context
        const concepts = extractKeyConcepts(message);

        // Add context markers for better AI understanding
        return `[CONTEXT] Question analysis request\n[CONCEPTS] ${concepts.join(', ')}\n[QUERY] ${message}`;
    }

    function extractKeyConcepts(message) {
        // Simple keyword extraction (can be enhanced with NLP)
        const keywords = message.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => word.length > 3);

        return [...new Set(keywords)];
    }

    function calculateConfidence(response) {
        // Implement confidence scoring based on:
        // 1. Response length and completeness
        // 2. Presence of key indicators
        // 3. Response structure

        let confidence = 1.0;

        if (response.length < 50) confidence *= 0.8;
        if (!response.includes('because')) confidence *= 0.9;
        if (response.includes('I am not sure') || response.includes('might be')) confidence *= 0.7;

        return confidence;
    }

    async function enhanceResponse(response, model) {
        // Add clarifications and confidence indicators
        const enhancedPrompt = `Please enhance this response with more detail and confidence:\n${response}`;
        const result = await model.generateContent(enhancedPrompt);
        return result.response.text();
    }

    function handleAIError(error) {
        // Categorize and handle different types of errors
        if (error.message.includes('API')) {
            return 'API Error: The AI service is temporarily unavailable. Please try again in a few moments.';
        } else if (error.message.includes('timeout')) {
            return 'Request timed out. The server might be busy, please try again.';
        } else if (error.message.includes('rate limit')) {
            return 'Rate limit reached. Please wait a moment before making another request.';
        }
        return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
    }

    // Function to add message to chat display with copy button for AI responses
    function addMessageToChat(role, content, container) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}-message`;
        messageDiv.setAttribute('data-role', role);

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = content; // Use innerHTML to render formatted text

        messageDiv.appendChild(messageContent);

        if (role === 'ai') {
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-message';
            copyButton.textContent = 'Copy';
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(content);
                showToast('Copied to clipboard!');
            });
            messageDiv.appendChild(copyButton);
        }

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;

        return messageDiv;
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
        const toast = document.getElementById('toast');
        if (!toast) {
            const newToast = document.createElement('div');
            newToast.id = 'toast';
            newToast.className = 'toast-notification';
            document.body.appendChild(newToast);
        }

        const toastElement = document.getElementById('toast');
        toastElement.textContent = message;
        toastElement.classList.add('show');

        setTimeout(() => {
            toastElement.classList.remove('show');
        }, 3000);
    }

    // Function to format the response (add line breaks, etc.)
    function formatResponse(response) {
        // Add line breaks
        response = response.replace(/\n/g, '<br>');

        // You can add more formatting here if needed (e.g., bold, italics)
        // For example, to make text between asterisks bold:
        // response = response.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

        return response;
    }

    // Initialize AI links when page loads
    document.addEventListener('DOMContentLoaded', addAILinksToQuestions);

    // Function to save chat history to local storage
    function saveChatHistoryToLocalStorage(questionIndex, history) {
        localStorage.setItem(`chatHistory-${questionIndex}`, JSON.stringify(history));
    }

    // Function to load chat history from local storage
    function loadChatHistoryFromLocalStorage(questionIndex, popup) {
        const history = JSON.parse(localStorage.getItem(`chatHistory-${questionIndex}`));
        if (history) {
            chatHistory.set(questionIndex, history);
            const messagesContainer = popup.querySelector('.chat-messages');
            history.forEach(msg => {
                const messageElement = addMessageToChat(msg.role, msg.content, messagesContainer);
                if (msg.role === 'user') {
                    addEditButtonToMessage(messageElement, questionIndex, popup);
                }
            });
        }
    }

    // Function to clear chat history
    function clearChatHistory(questionIndex, popup) {
        chatHistory.delete(questionIndex);
        localStorage.removeItem(`chatHistory-${questionIndex}`);
        const messagesContainer = popup.querySelector('.chat-messages');
        messagesContainer.innerHTML = ''; // Clear the messages in the popup
        showToast('Chat history cleared!');
    }

    // Function to handle file uploads
    async function handleFileUpload(file, questionIndex, popup) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const fileContent = e.target.result;
            const fileType = file.type;
            const fileName = file.name;

            // Prepare the message to be sent to the AI
            const message = `File uploaded: ${fileName}\nType: ${fileType}\nContent: ${fileContent.substring(0, 200)}...`;

            // Add file information to chat
            const messagesContainer = popup.querySelector('.chat-messages');
            addMessageToChat('user', `Uploaded file: ${fileName}`, messagesContainer);

            // Send message to AI (you might need a different endpoint for handling files)
            sendMessageToAI(message, questionIndex, popup);
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            showToast('Error reading file.');
        };

        // Read the file as text or data URL (consider handling different file types)
        reader.readAsDataURL(file); // Or readAsText(file) for text files
    }

    // Function to add an edit button to user messages
    function addEditButtonToMessage(messageElement, questionIndex, popup) {
        if (messageElement.getAttribute('data-role') === 'user') {
            const editButton = document.createElement('button');
            editButton.className = 'edit-message';
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => {
                startEditingMessage(messageElement, questionIndex, popup);
            });
            messageElement.appendChild(editButton);
        }
    }

    // Function to start editing a message
    function startEditingMessage(messageElement, questionIndex, popup) {
        const originalContent = messageElement.querySelector('.message-content').innerHTML;
        const editInput = document.createElement('textarea');
        editInput.className = 'edit-input';
        editInput.value = originalContent.replace(/<br>/g, '\n');

        messageElement.querySelector('.message-content').replaceWith(editInput);

        const saveButton = document.createElement('button');
        saveButton.className = 'save-message';
        saveButton.textContent = 'Save';
        messageElement.appendChild(saveButton);

        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-message';
        cancelButton.textContent = 'Cancel';
        messageElement.appendChild(cancelButton);

        editInput.focus();

        saveButton.addEventListener('click', () => {
            const newContent = editInput.value;
            finishEditingMessage(messageElement, newContent, questionIndex, popup);
        });

        cancelButton.addEventListener('click', () => {
            finishEditingMessage(messageElement, originalContent, questionIndex, popup, true);
        });
    }

    // Function to finish editing a message
    function finishEditingMessage(messageElement, newContent, questionIndex, popup, isCancel = false) {
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = isCancel ? newContent : newContent.replace(/\n/g, '<br>');
        messageElement.querySelector('.edit-input').replaceWith(messageContent);

        messageElement.querySelectorAll('.save-message, .cancel-message').forEach(button => button.remove());

        if (!isCancel) {
            // Update the chat history
            const history = chatHistory.get(questionIndex);
            const messageIndex = Array.from(popup.querySelectorAll('.user-message')).indexOf(messageElement);

            if (history && history[messageIndex]) {
                history[messageIndex].content = newContent;
                chatHistory.set(questionIndex, history);
                saveChatHistoryToLocalStorage(questionIndex, history);
            }
        }

        // Re-add the edit button
        addEditButtonToMessage(messageElement, questionIndex, popup);
    }

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

    async function checkVersion() {
        try {
            const currentVersion = document.getElementById('currentVersion').textContent;

            // Get all documents from the 'version' collection
            const versionsSnapshot = await firebase.firestore()
                .collection('version')
                .get();

            // Check if the current version exists as a document in the collection
            const versionExists = versionsSnapshot.docs.some(doc => doc.id === currentVersion);

            console.log('Current version:', currentVersion);
            console.log('Version exists in Firestore:', versionExists);

            if (!versionExists) {
                alert(`Your version (${currentVersion}) is not valid. Please update to the latest version from https://studyaidx.web.app/`);
                destroyMenu();
            } else {
                console.log('Version check passed:', currentVersion);
            }
        } catch (error) {
            console.error('Error checking version:', error);
            alert('Error checking version. Please try again later.');
            destroyMenu();
        }
    }

    function destroyMenu() {
        const menu = document.getElementById('quizHelperMenu');
        if (menu && menu.parentNode) {
            menu.parentNode.removeChild(menu);
        }
    }

    // Check version after 5 seconds
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
    document.addEventListener('DOMContentLoaded', () => {
    initializeToggles();
    // Initialize Question Reply System after Firebase initialization
    const questionReplySystem = new QuestionReplySystem();
    window.questionReplySystem = questionReplySystem; // Make it globally accessible
    });
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
    // Thêm biến để lưu trữ key đã sử dụng
    let previousKeys = {};

    // Hàm để lưu thông tin key đã sử dụng
    function savePreviousKey(keyId, keyData, userEmail) {
    try {
        previousKeys[userEmail] = {
        keyId: keyId,
        type: keyData.type,
        expirationTime: keyData.expirationDate ? keyData.expirationDate.toDate().getTime() : null
        };
        localStorage.setItem('previousKeys', JSON.stringify(previousKeys));
        console.log('Saved previous key:', previousKeys[userEmail]);
    } catch (error) {
        console.error('Error saving previous key:', error);
    }
    }

    // Hàm để load thông tin key đã sử dụng
    function loadPreviousKeys() {
    try {
        const saved = localStorage.getItem('previousKeys');
        if (saved) {
        previousKeys = JSON.parse(saved);
        console.log('Loaded previous keys:', previousKeys);
        }
    } catch (error) {
        console.error('Error loading previous keys:', error);
        previousKeys = {};
    }
    }

    // Hàm để hiển thị key đã sử dụng
    function showPreviousKeys() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const previousKey = previousKeys[user.email];
    if (!previousKey) return;

    const keySection = document.getElementById('keySection');

    // Xóa phần hiển thị key cũ nếu có
    const existingPreviousKeys = keySection.querySelector('.previous-keys-section');
    if (existingPreviousKeys) {
        existingPreviousKeys.remove();
    }

    const previousKeysDiv = document.createElement('div');
    previousKeysDiv.className = 'previous-keys-section';

    // Tính thời gian còn lại
    const timeRemaining = previousKey.expirationTime ? previousKey.expirationTime - Date.now() : null;
    const daysRemaining = timeRemaining ? Math.floor(timeRemaining / (1000 * 60 * 60 * 24)) : null;

    previousKeysDiv.innerHTML = `
        <div class="section-title">Key Đã Kích Hoạt Trước Đó</div>
        <div class="previous-key-info">
        <p>Key ID: ${previousKey.keyId}</p>
        <p>Loại: ${previousKey.type.toUpperCase()}</p>
        ${daysRemaining !== null ? `<p>Còn lại: ${daysRemaining} ngày</p>` : ''}
        <button id="reactivateKeyBtn" class="reactivate-btn">Kích Hoạt Lại</button>
        </div>
    `;

    keySection.insertBefore(previousKeysDiv, keySection.firstChild);

    // Thêm style cho phần key đã sử dụng nếu chưa có
    if (!document.getElementById('previousKeyStyles')) {
        const style = document.createElement('style');
        style.id = 'previousKeyStyles';
        style.textContent = `
        .previous-keys-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #dee2e6;
        }
        .previous-key-info {
            margin-top: 10px;
        }
        .previous-key-info p {
            margin: 5px 0;
        }
        .reactivate-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            transition: background-color 0.3s;
        }
        .reactivate-btn:hover {
            background: #218838;
        }
        `;
        document.head.appendChild(style);
    }

    // Thêm event listener cho nút kích hoạt lại
    document.getElementById('reactivateKeyBtn').addEventListener('click', async () => {
        try {
        document.getElementById('premiumKeyInput').value = previousKey.keyId;
        await activatePremiumKey();
        } catch (error) {
        console.error('Error reactivating key:', error);
        alert('Có lỗi xảy ra khi kích hoạt lại key.');
        }
    });
    }



    // Hàm để tải premium keys từ GitHub và kiểm tra sự thay đổi
    async function loadPremiumKeys() {
    try {
        const db = firebase.firestore();
        const keysSnapshot = await db.collection('premium_keys').get();

        const updatedValidPremiumKeys = {
        permanent: [],
        monthly: [],
        biweekly: [],
        weekly: []
        };

        keysSnapshot.forEach(doc => {
        const keyData = doc.data();
        const keyId = doc.id; // Key ID là tên của document

        // Kiểm tra xem key có còn hiệu lực không
        if (keyData.expirationDate && keyData.expirationDate.toDate() < new Date()) {
            return; // Bỏ qua key đã hết hạn
        }

        // Phân loại key dựa vào type
        switch(keyData.type) {
            case 'permanent':
            updatedValidPremiumKeys.permanent.push(keyId);
            break;
            case 'monthly':
            updatedValidPremiumKeys.monthly.push(keyId);
            break;
            case 'biweekly':
            updatedValidPremiumKeys.biweekly.push(keyId);
            break;
            case 'weekly':
            updatedValidPremiumKeys.weekly.push(keyId);
            break;
        }
        });

        validPremiumKeys = updatedValidPremiumKeys;
        console.log('Premium keys loaded successfully from Firebase');
    } catch (error) {
        console.error('Error loading premium keys from Firebase:', error);
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
    // Thêm hàm mới này vào phần key system functions
    async function activateFreeKey() {
        if (isKeySystemDisabled()) {
        alert('Hệ thống key hiện đang bị vô hiệu hóa. Vui lòng thử lại sau.');
        return;
        }

        const inputKey = document.getElementById('freeKeyInput').value;
        const db = firebase.firestore();
        const user = firebase.auth().currentUser;

        if (!user) {
        alert('Vui lòng đăng nhập để sử dụng key!');
        return;
        }

        try {
        const keyRef = db.collection('free_keys').doc(inputKey);

        // Bắt lấy giá trị trả về từ transaction
        const transactionResult = await db.runTransaction(async (transaction) => {
            const keyDoc = await transaction.get(keyRef);

            if (!keyDoc.exists) {
            throw new Error('Invalid key');
            }

            const keyData = keyDoc.data();

            // Kiểm tra xem key này có được tạo cho user này không
            if (keyData.createdFor !== user.email) {
            throw new Error('Wrong user');
            }

            // Thiết lập thời gian sử dụng từ thời điểm tạo key
            const expirationTime = keyData.expirationDate.toDate().getTime();

            // Kiểm tra xem key có còn hạn sử dụng không
            if (Date.now() > expirationTime) {
            throw new Error('Expired key');
            }

            // Kiểm tra nếu key đã được sử dụng bởi người khác
            if (keyData.isUsed && keyData.usedBy !== user.email) {
            throw new Error('Key already used by another user');
            }

            // Nếu key chưa được sử dụng hoặc được sử dụng bởi chính user này
            if (!keyData.isUsed) {
            // Cập nhật trạng thái sử dụng nếu key chưa được sử dụng
            transaction.update(keyRef, {
                isUsed: true,
                usedAt: firebase.firestore.FieldValue.serverTimestamp(),
                usedBy: user.email
            });
            }

            return { expirationTime };
        });

        // Sử dụng giá trị expirationTime từ kết quả transaction
        activeKey = 'FREE';
        keyExpirationTime = transactionResult.expirationTime;
        localStorage.setItem('activeKey', activeKey);
        localStorage.setItem('keyExpirationTime', keyExpirationTime.toString());

        showFunctions();
        startKeyTimer();
        alert('Free Key đã được kích hoạt. Bạn có 30 phút để sử dụng. Một số chức năng có sẵn cho Free Key.');

        } catch (error) {
        console.error('Error activating free key:', error);
        switch(error.message) {
            case 'Invalid key':
            alert('Free Key không hợp lệ.');
            break;
            case 'Expired key':
            alert('Free Key đã hết hạn.');
            break;
            case 'Wrong user':
            alert('Free Key này không được tạo cho tài khoản của bạn.');
            break;
            case 'Key already used by another user':
            alert('Free Key này đã được sử dụng bởi người dùng khác.');
            break;
            default:
            alert('Có lỗi xảy ra khi kích hoạt key. Vui lòng thử lại sau.');
        }
        }
    }



    async function activatePremiumKey() {
    if (isKeySystemDisabled()) {
        alert('Hệ thống key hiện đang bị vô hiệu hóa. Vui lòng thử lại sau.');
        return;
    }

    const inputKey = document.getElementById('premiumKeyInput').value;
    const db = firebase.firestore();
    const user = firebase.auth().currentUser;

    try {
        // Lấy document key và kiểm tra trong transaction để đảm bảo atomic operation
        const keyRef = db.collection('premium_keys').doc(inputKey);

        await db.runTransaction(async (transaction) => {
        const keyDoc = await transaction.get(keyRef);

        if (!keyDoc.exists) {
            throw new Error('Invalid key');
        }

        const keyData = keyDoc.data();

        // Kiểm tra hạn sử dụng
        if (keyData.expirationDate && keyData.expirationDate.toDate() < new Date()) {
            throw new Error('Expired key');
        }

        // Kiểm tra trạng thái isActivated
        if (keyData.isActivated === false) {
            // Nếu key chưa được kích hoạt, cập nhật trạng thái
            transaction.update(keyRef, {
            isActivated: true,
            activatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            activatedBy: user.email
            });
        } else if (keyData.activatedBy && keyData.activatedBy !== user.email) {
            // Nếu key đã được kích hoạt bởi người khác
            throw new Error('Key already activated');
        }
        // Nếu key đã được kích hoạt bởi chính user này thì cho phép sử dụng tiếp

        // Kiểm tra xem key đã được gán cho user nào chưa
        if (keyData.user) {
            // Nếu key đã có user và không phải user hiện tại
            if (keyData.user !== user.email) {
            throw new Error('Key already used');
            }
            // Nếu là user hiện tại thì cho phép sử dụng lại
        } else {
            // Nếu key chưa có user, gán user hiện tại
            transaction.update(keyRef, {
            user: user.email
            });
        }

        // Xử lý loại key và thời hạn
        let keyType = null;
        let expirationTime = null;

        switch(keyData.type) {
            case 'permanent':
            keyType = 'PREMIUM_PERMANENT';
            break;
            case 'monthly':
            keyType = 'PREMIUM_MONTHLY';
            expirationTime = keyData.expirationDate.toDate().getTime();
            break;
            case 'biweekly':
            keyType = 'PREMIUM_BIWEEKLY';
            expirationTime = keyData.expirationDate.toDate().getTime();
            break;
            case 'weekly':
            keyType = 'PREMIUM_WEEKLY';
            expirationTime = keyData.expirationDate.toDate().getTime();
            break;
        }

        // Lưu thông tin key đã sử dụng
        savePreviousKey(inputKey, keyData, user.email);

        // Cập nhật thông tin sử dụng
        activeKey = keyType;
        keyExpirationTime = expirationTime;
        localStorage.setItem('activeKey', activeKey);
        if (expirationTime) {
            localStorage.setItem('keyExpirationTime', expirationTime.toString());
        } else {
            localStorage.removeItem('keyExpirationTime');
        }

        return { keyType, expirationTime };
        });

        showFunctions();
        if (keyExpirationTime) {
        startKeyTimer();
        }
        alert(`Chúc mừng Bạn đã kích hoạt ${activeKey.replace('_', ' ')} Key. Tận hưởng đầy đủ tính năng`);

    } catch (error) {
        console.error('Error activating premium key:', error);
        switch(error.message) {
        case 'Invalid key':
            alert('Premium Key không hợp lệ. Hãy liên hệ chúng tôi để mua Premium Key chính hãng.');
            break;
        case 'Expired key':
            alert('Premium Key đã hết hạn.');
            break;
        case 'Key already used':
            alert('Key này đã được sử dụng bởi người dùng khác.');
            break;
        case 'Key already activated':
            alert('Key này đã được kích hoạt bởi người dùng khác.');
            break;
        default:
            alert('Có lỗi xảy ra khi kích hoạt key. Vui lòng thử lại sau.');
        }
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

    document.getElementById('keySection').style.display = 'block';
    document.getElementById('functionsSection').style.display = 'none';

    // Hiển thị key đã sử dụng nếu có
    showPreviousKeys();

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
    // Thay đổi event listener cho nút getFreeKeyButton
    document.getElementById('getFreeKeyButton').addEventListener('click', () => {
        document.getElementById('freeKeyInput').style.display = 'block';
        document.getElementById('activateFreeKeyButton').style.display = 'block';
        window.open('https://studyaidx.web.app/get-key', '_blank');
    });

    // Thêm event listener cho nút activateFreeKeyButton
    document.getElementById('activateFreeKeyButton').addEventListener('click', activateFreeKey);
    document.getElementById('activatePremiumKeyButton').addEventListener('click', activatePremiumKey);
    document.getElementById('logoutButton').addEventListener('click', logout);
    document.getElementById('contactButton').addEventListener('click', () => {
    window.open('https://studyaidx.web.app/get-key', '_blank');
    });

    // Check key validity and load premium keys on load
    window.addEventListener('load', () => {
    loadPremiumKeys();
    loadKeyUsageInfo();
    loadPreviousKeys(); // Thêm dòng này
    checkKeyValidity();
    checkFreeKeyActivation();
    addSecondKeyButton();
    });

    // Kiểm tra sự thay đổi của premium keys mỗi 5 phút
    setInterval(loadPremiumKeys, 300000);

    let autoSubmitEnabled = false; // Global variable to track state (default to off)

    // Function to save the auto-submit preference to localStorage
    function saveAutoSubmitPreference(autoSubmit) {
        localStorage.setItem('autoSubmitPreference', autoSubmit);
    }

    // Function to load the auto-submit preference from localStorage
    function loadAutoSubmitPreference() {
        const savedPreference = localStorage.getItem('autoSubmitPreference');
        // Return true if saved as 'true', otherwise return false (default)
        return savedPreference === 'true';
    }

    // Function to initialize the auto-submit checkbox and its event listener
    function initializeAutoSubmitCheckbox() {
        const autoSubmitCheckbox = document.getElementById('autoSubmitCheckbox');
        if (autoSubmitCheckbox) {
            // Load the saved preference and set the checkbox state
            const savedPreference = loadAutoSubmitPreference();
            autoSubmitCheckbox.checked = savedPreference;
            autoSubmitEnabled = savedPreference; // Update the global variable

            // Add the event listener to handle changes to the checkbox
            autoSubmitCheckbox.addEventListener('change', function() {
                autoSubmitEnabled = this.checked; // Update the global variable
                saveAutoSubmitPreference(this.checked); // Save the new state

                if (this.checked) {
                    enableAutoSubmit();
                } else {
                    disableAutoSubmit();
                }
            });
        }
    }

    // Function to enable the auto-submit functionality
    function enableAutoSubmit() {
        // Set up a MutationObserver to watch for changes in the document
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                // Check if nodes were added (childList) and if auto-submit is enabled
                if (mutation.type === 'childList' && autoSubmitEnabled) {
                    // Try to find the submit button using a comprehensive selector
                    const submitButton = document.querySelector('.btn.submit_button.quiz_submit.btn-primary, input[type="submit"], button[type="submit"], #submitbutton, .submit-btn'); // Add more selectors if needed
                    if (submitButton) {
                        submitButton.click(); // Click the submit button
                        // showToast('Auto-submitted the quiz!'); // Optional: Show a notification (make sure showToast is defined)
                    }
                }
            }
        });

        // Start observing the document body for changes (child nodes being added or removed)
        observer.observe(document.body, { childList: true, subtree: true });

        // Store the observer so we can disconnect it later
        document.autoSubmitObserver = observer;
    }

    // Function to disable the auto-submit functionality
    function disableAutoSubmit() {
        // Disconnect the MutationObserver if it exists
        if (document.autoSubmitObserver) {
            document.autoSubmitObserver.disconnect();
            document.autoSubmitObserver = null; // Clear the reference
        }
    }

    // Call initializeAutoSubmitCheckbox when the page loads
    document.addEventListener('DOMContentLoaded', initializeAutoSubmitCheckbox);



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

    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;
    let xOffset = 0;
    let yOffset = 0;
    let lastTime = 0;
    let velocity = { x: 0, y: 0 };
    let animationFrameId = null;
    const menuHeader = document.getElementById('menuHeader');

    menuHeader.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    function dragStart(e) {
    if (e.target !== menuHeader && !menuHeader.contains(e.target)) {
        return;
        }

    initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

    isDragging = true;
        lastTime = performance.now();
        menu.style.transition = 'none';
        menu.style.userSelect = 'none';
    menu.style.right = 'auto';


    cancelAnimationFrame(animationFrameId); // Clear any running momentum animations
        velocity = { x: 0, y: 0 };  //Reset the velocity
    }

    function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();

        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;


    const currentTime = performance.now();
    const dt = (currentTime - lastTime) / 1000; // in seconds

    velocity.x = (currentX - xOffset) / dt;
    velocity.y = (currentY - yOffset) / dt;


        xOffset = currentX;
        yOffset = currentY;

    setTranslate(xOffset,yOffset,menu);

        lastTime = currentTime;

    }

    function dragEnd() {
    isDragging = false;
        menu.style.userSelect= 'initial';
            applyMomentum();

    }

    function applyMomentum() {
    const friction = 0.95;


        function momentumLoop() {


        velocity.x *= friction;
            velocity.y *= friction;

        xOffset += velocity.x * 0.016; // use as delta value

        yOffset += velocity.y * 0.016;


            // Apply bounds
            const bounds = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

            xOffset = Math.max(0, Math.min(xOffset, viewportWidth - bounds.width));
        yOffset = Math.max(0, Math.min(yOffset, viewportHeight - bounds.height));



        setTranslate(xOffset,yOffset, menu);



            if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
                animationFrameId =  requestAnimationFrame(momentumLoop);
            }
        else {
            menu.style.transition = 'transform 0.3s ease-out';
        }
    }

    momentumLoop()


    }

    function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;

    }

    // Resize
    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'resizeHandle';
            menu.appendChild(resizeHandle);

            let isResizing = false;
        let initialWidth, initialHeight, initialResizeX, initialResizeY;

        resizeHandle.addEventListener('mousedown', (e) => {

        isResizing = true;
            initialWidth = menu.offsetWidth;
            initialHeight = menu.offsetHeight;
        initialResizeX = e.clientX;
        initialResizeY = e.clientY;

        e.stopPropagation();


    });

        document.addEventListener('mousemove', (e) => {


            if (!isResizing) return;

            const newWidth = initialWidth + (e.clientX - initialResizeX);
            const newHeight = initialHeight + (e.clientY - initialResizeY);

                if (newWidth >= 300 && newHeight >= 300) {
                menu.style.width = `${newWidth}px`;
                menu.style.height = `${newHeight}px`;

        }

    });

    document.addEventListener('mouseup', () => {
            isResizing = false;

    });


    function extractQuizAnswers() {
        let quizText = '';
        const imagesToOpen = [];
        setTimeout(() => {
            console.log('🔍 Bắt đầu trích xuất nội dung quiz...');

            // Extract quiz title from quiz-header
            const quizTitle = document.querySelector('.quiz-header h1');
            if (quizTitle) {
                const titleText = quizTitle.innerText.trim();
                if (titleText) {
                    console.log('✅ Đã tìm thấy tiêu đề quiz:', titleText);
                    quizText += `Tiêu đề: ${titleText}\n\n`;
                }
            } else {
                console.log('⚠️ Không tìm thấy tiêu đề quiz');
            }

            // Extract instructions and reading content from #quiz-instructions
            const quizInstructions = document.querySelector('#quiz-instructions.user_content.enhanced');
            if (quizInstructions) {
                console.log('✅ Đã tìm thấy phần hướng dẫn và nội dung bài đọc');
                // Get all paragraphs from instructions
                const paragraphs = quizInstructions.querySelectorAll('p');
                paragraphs.forEach((p, index) => {
                    const text = p.innerText.trim();
                    if (text) {
                        console.log(`📝 Đoạn văn ${index + 1}:`, text.substring(0, 50) + '...');
                        quizText += `${text}\n\n`;
                    }
                });
            } else {
                console.log('⚠️ Không tìm thấy phần hướng dẫn và nội dung bài đọc');
            }

            console.log('📋 Nội dung trích xuất được:', quizText);

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
                // Check for images in the question and add clear identifiers
                const questionImages = questionElement.querySelectorAll('img[alt*="Screenshot"]');
                if (questionImages.length > 0) {
                    quizText += `[Hình ảnh cho câu hỏi ${index + 1}]\n`;
                    questionImages.forEach((img, imgIndex) => {
                        quizText += `- Hình ${imgIndex + 1}: [${img.alt}]\n`;
                        imagesToOpen.push(img.src);
                    });
                }
                questionElement.querySelectorAll('.answer, .answer-text, .option').forEach((answerElement, answerIndex) => {
                    let answerText = answerElement.innerText.trim();
                    // Check for image elements inside the answer
                    const imageElements = answerElement.querySelectorAll('img[alt*="Screenshot"]');
                    if (imageElements.length > 0) {
                        quizText += `[Hình ảnh cho đáp án ${String.fromCharCode(65 + answerIndex)} của câu hỏi ${index + 1}]\n`;
                        imageElements.forEach((img, imgIndex) => {
                            quizText += `- Hình ${imgIndex + 1}: [${img.alt}]\n`;
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
            const instruction = "\n\nĐưa đáp án cho các câu hỏi, mỗi đáp án cách nhau bằng dấu chấm phẩy (;). QUAN TRỌNG: CHỈ trả về đáp án đầy đủ bao gồm ký hiệu và nội dung đáp án (ví dụ: 'A. Giúp tạo liên kết giữa hai bảng'), KHÔNG được thêm bất kỳ thông tin nào khác như 'Câu hỏi X:' hay số thứ tự. Tất cả đáp án phải nằm trên một dòng duy nhất, không xuống dòng. **Nếu đáp án là các biểu thức toán học, hãy trả về chúng dưới dạng LaTeX kèm theo ký hiệu đáp án, ví dụ: 'A. \\frac{1}{2}'**. Ví dụ mẫu đáp án đúng: 'A. Cả hai đáp án đúng; B. Trồng lúa lấy gạo để xuất khẩu; C. Sử dụng thuốc hóa học; D. Tăng diện tích đất trồng'";
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
        }, 100);
    }



    console.log('💡 Script bắt đầu chạy.'); // Kiểm tra xem script có được tải không



    // Function hiển thị đáp án với notification cảnh báo
    function displayAnswers(correctAnswersString) {
        try {
            let answersArray;

            // Xử lý dữ liệu đầu vào: chuyển chuỗi thành mảng nếu cần
            if (Array.isArray(correctAnswersString)) {
                answersArray = correctAnswersString;
            } else if (typeof correctAnswersString === 'string') {
                answersArray = correctAnswersString.split(';');
            } else {
                console.error("Lỗi: Dữ liệu đáp án không đúng định dạng:", correctAnswersString);
                handleError(new Error("Dữ liệu đáp án không hợp lệ."), 'Không thể hiển thị đáp án do dữ liệu không hợp lệ.');
                return;
            }

            // Lấy tất cả các element câu hỏi
            const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');
            let answerIndex = 0;

            // Tạo notification container cảnh báo
            const notificationContainer = document.createElement('div');
            notificationContainer.className = 'answer-notification';
            notificationContainer.style.backgroundColor = '#fff3cd'; // Màu vàng nhạt
            notificationContainer.style.color = '#85640a'; // Chữ nâu đậm
            notificationContainer.style.padding = '15px';
            notificationContainer.style.marginBottom = '15px';
            notificationContainer.style.border = '1px solid #ffe082'; // Viền vàng
            notificationContainer.style.borderRadius = '8px';
            notificationContainer.style.fontWeight = 'bold';
            notificationContainer.style.textAlign = 'center';
            notificationContainer.style.fontSize = '16px';

            const notificationText = document.createElement('span');
            notificationText.textContent = 'LƯU Ý: Đôi khi thuật toán có thể chọn sai. Vui lòng kiểm tra kỹ đáp án hiển thị để tránh mất điểm!';
            notificationContainer.appendChild(notificationText);

            // Thêm notification vào đầu trang hoặc trước câu hỏi đầu tiên
            const quizContainer = document.querySelector('.quiz-container') || document.querySelector('.question-container') || questionElements[0]?.parentElement || document.body;
            quizContainer.insertBefore(notificationContainer, questionElements[0] || quizContainer.firstChild);

            // Duyệt qua từng câu hỏi và hiển thị đáp án
            questionElements.forEach((element, index) => {
                // Xóa phần hiển thị đáp án cũ nếu có
                const existingDisplay = element.querySelector('.answer-display');
                if (existingDisplay) {
                    existingDisplay.remove();
                }

                // Tạo container mới cho đáp án
                const answerDisplay = document.createElement('div');
                answerDisplay.className = 'answer-display';
                answerDisplay.style.marginTop = '10px';
                answerDisplay.style.padding = '15px';
                answerDisplay.style.backgroundColor = '#ffffff';
                answerDisplay.style.border = '1px solid #e0e0e0';
                answerDisplay.style.borderRadius = '8px';
                answerDisplay.style.fontSize = '15px';
                answerDisplay.style.color = '#333';
                element.style.position = 'relative';

                let answerContent = document.createElement('div');

                // Xử lý từng loại câu hỏi
                if (isMatchingQuestion(element)) {
                    const pairsCount = getMatchingPairsCount(element);
                    const answersForQuestion = answersArray.slice(answerIndex, answerIndex + pairsCount);
                    if (answersForQuestion.length < pairsCount) {
                        answerContent.innerHTML = "<div class='no-answer'>Không đủ đáp án từ AI cho câu hỏi ghép cặp.</div>";
                    } else {
                        answerContent.innerHTML = formatMatchingAnswersEnhanced(answersForQuestion, element);
                        answerIndex += pairsCount;
                    }
                } else if (isFillInTheBlankQuestion(element)) {
                    const blankCount = element.querySelectorAll('input[type="text"]').length;
                    const answersForQuestion = answersArray.slice(answerIndex, answerIndex + blankCount);
                    if (answersForQuestion.length < blankCount) {
                        answerContent.innerHTML = "<div class='no-answer'>Không đủ đáp án từ AI cho câu hỏi điền vào chỗ trống.</div>";
                    } else {
                        answerContent.innerHTML = formatFillInBlankAnswersEnhanced(answersForQuestion, element);
                        answerIndex += blankCount;
                    }
                } else if (isCheckboxListQuestion(element)) {
                    if (answerIndex < answersArray.length) {
                        const answerForQuestion = answersArray[answerIndex++];
                        answerContent.innerHTML = formatCheckboxListAnswersEnhanced(answerForQuestion);
                    } else {
                        answerContent.innerHTML = "<div class='no-answer'>Không có đáp án từ AI.</div>";
                    }
                } else { // Multiple Choice Question
                    if (answerIndex < answersArray.length) {
                        const answer = answersArray[answerIndex++];
                        answerContent.innerHTML = formatMultipleChoiceAnswerEnhanced(answer, element);
                    } else {
                        answerContent.innerHTML = "<div class='no-answer'>Không có đáp án từ AI.</div>";
                    }
                }

                answerDisplay.appendChild(answerContent);
                element.appendChild(answerDisplay);
            });

            console.log('Đã hiển thị đáp án và notification cảnh báo!');

        } catch (error) {
            handleError(error, 'Không thể hiển thị đáp án. Vui lòng thử lại.');
        }
    }

    // Function format đáp án cho câu hỏi ghép cặp
    function formatMatchingAnswersEnhanced(answers, element) {
        if (!answers || answers.length === 0) return "<div class='no-answer'>Không có đáp án cho câu hỏi ghép cặp.</div>";

        let html = "<div class='matching-answers'>";
        html += "<div style='font-weight: bold; color: #555; margin-bottom: 8px;'>ĐÁP ÁN ĐÚNG LÀ:</div>";

        answers.forEach((answer, index) => {
            html += `<div style='margin-bottom: 5px; padding-left: 10px; position: relative;'>
                        <span style='position: absolute; left: 0; top: 2px;'>-</span> <span style='font-weight: 500; color: #444; margin-left: 5px;'>${answer}</span>
                    </div>`;
        });

        html += "</div>";
        return html;
    }

    // Function format đáp án cho câu hỏi điền vào chỗ trống
    function formatFillInBlankAnswersEnhanced(answers, element) {
        if (!answers || answers.length === 0) return "<div class='no-answer'>Không có đáp án cho câu hỏi điền vào chỗ trống.</div>";

        let html = "<div class='blank-answers'>";
        html += "<div style='font-weight: bold; color: #555; margin-bottom: 8px;'>ĐÁP ÁN ĐÚNG LÀ:</div>";

        answers.forEach((answer, index) => {
            html += `<div style='margin-bottom: 5px; padding-left: 10px; position: relative;'>
                        <span style='position: absolute; left: 0; top: 2px;'>-</span> <span style='font-weight: 500; color: #444; margin-left: 5px;'>${answer}</span> <span style='color: #777; font-size: 0.9em; margin-left: 5px;'>(Ô ${index + 1})</span>
                    </div>`;
        });

        html += "</div>";
        return html;
    }

    // Function format đáp án cho câu hỏi nhiều lựa chọn (checkbox)
    function formatCheckboxListAnswersEnhanced(answers) {
        if (!answers || answers.trim() === "") return "<div class='no-answer'>Không có đáp án cho câu hỏi nhiều lựa chọn.</div>";

        let html = "<div class='checkbox-answers'>";
        html += "<div style='font-weight: bold; color: #555; margin-bottom: 8px;'>CÁC ĐÁP ÁN ĐÚNG LÀ:</div>";

        const answerList = answers.split(',').map(a => a.trim()).filter(a => a);
        answerList.forEach(answer => {
            if (answer) {
                html += `<div style='margin-bottom: 5px; padding-left: 10px; position: relative;'>
                            <span style='position: absolute; left: 0; top: 2px;'>-</span> <span style='font-weight: 500; color: #444; margin-left: 5px;'>${answer}</span>
                        </div>`;
            }
        });

        html += "</div>";
        return html;
    }

    // Function format đáp án cho câu hỏi trắc nghiệm (multiple choice)
    function formatMultipleChoiceAnswerEnhanced(answer, element) {
        if (!answer) return "<div class='no-answer'>Không có đáp án.</div>";

        let html = "<div class='multiple-choice-answer'>";
        html += "<div style='font-weight: bold; color: #555; margin-bottom: 8px;'>ĐÁP ÁN ĐÚNG LÀ:</div>";
        html += `<div style='margin-bottom: 5px; padding-left: 10px; position: relative;'>
                    <span style='position: absolute; left: 0; top: 2px;'>-</span> <span style='font-weight: 500; color: #444; margin-left: 5px;'>${answer}</span>
                </div>`;
        html += "</div>";
        return html;
    }

    // Function lấy văn bản xung quanh input (dùng cho câu hỏi điền vào chỗ trống)
    function getSurroundingText(input) {
        let surroundingText = '';
        let node = input.previousSibling;

        while (node && surroundingText.length < 50) {
            if (node.nodeType === 3) {
                surroundingText = node.textContent.trim() + ' ' + surroundingText;
            }
            node = node.previousSibling;
        }

        node = input.nextSibling;
        while (node && surroundingText.length < 100) {
            if (node.nodeType === 3) {
                surroundingText += ' ' + node.textContent.trim();
            }
            node = node.nextSibling;
        }

        return surroundingText.trim();
    }

    // Function kiểm tra xem có phải câu hỏi ghép cặp không
    function isMatchingQuestion(element) {
        return element.classList.contains('quiz-item-matching');
    }

    // Function đếm số cặp ghép trong câu hỏi ghép cặp
    function getMatchingPairsCount(element) {
        return element.querySelectorAll('select').length;
    }

    // Function kiểm tra xem có phải câu hỏi điền vào chỗ trống không
    function isFillInTheBlankQuestion(element) {
        return element.classList.contains('quiz-item-fill-in-blank');
    }

    // Function kiểm tra xem có phải câu hỏi nhiều lựa chọn không
    function isCheckboxListQuestion(element) {
        return element.classList.contains('quiz-item-checkbox');
    }

    // Function xử lý lỗi chung
    function handleError(error, message) {
        console.error("Error:", message, error);
        alert(message);
    }

    function selectCorrectAnswers(correctAnswers, autoSubmit = false) {
        try {
            const isIncognito = localStorage.getItem('incognitoMode') === 'true';
            const questionElements = document.querySelectorAll('.question, .question-container, .quiz-item');
            let answerIndex = 0;
            let richTextAnswer = ""; // Store rich text answer separately

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
                } else if (isRichTextEditorQuestion(element)) {
                    // Handle Rich Text Editor Question
                    richTextAnswer = correctAnswers[answerIndex++]; // Get the rich text answer
                    handleRichTextEditorQuestion(element, richTextAnswer);


                } else {
                    let answer = correctAnswers[answerIndex++];
                    //Crucial part:  Check if the answer should be skipped (rich text editor placeholder)
                    if (answer === " ") { // Check for the space placeholder
                        //Skip this question (do nothing)

                    } else if (answer) {
                        selectMultipleChoiceAnswer(element, answer, isIncognito);
                    }
                }
            });


            // Hiển thị đáp án sau khi đã chọn (moved rich text display here)
            if (!isIncognito) {
                displayAnswers(correctAnswers);  // You might need to modify displayAnswers to *not* show the rich text placeholder.
                if (richTextAnswer) {
                    // Display the rich text answer separately.
                    // No longer appending here; handled in handleRichTextEditorQuestion
                }
                showToast('Đã chọn đáp án thành công!');
            }

            // Kiểm tra và click nút next-question sau khi chọn đáp án
            clickNextQuestionButton();


            // Check if auto-submit should be triggered (passed as an argument)
            if (autoSubmit) {
                const submitButton = document.querySelector('.btn.submit_button.quiz_submit.btn-primary, input[type="submit"], button[type="submit"], #submitbutton, .submit-btn');
                if (submitButton) {
                    submitButton.click();
                    if (!isIncognito) {
                        showToast('Đã tự động nộp bài!');
                    }
                } else if (!isIncognito) {
                    showToast('Không tìm thấy nút nộp bài.');
                }
            }
        } catch (error) {
            const isIncognito = localStorage.getItem('incognitoMode') === 'true';
            if (!isIncognito) {
                handleError(error, 'Không thể chọn đáp án. Vui lòng thử lại.');
            }
        }
    }



    function isRichTextEditorQuestion(element) {
        // Check for indicators of a rich text editor.  This is the most important part
        // and needs to be very specific to your LMS.  Here are some examples, but you
        // *MUST* adapt this to your specific LMS.

        // Example 1: Check for TinyMCE (common rich text editor)
        if (element.querySelector('iframe[id*="tinymce"]')) {  // Check for iframe with id containing "tinymce"
            return true;
        }

        // Example 2: Check for a specific class name
        if (element.querySelector('.rich-text-editor, .mce-content-body')) { // Adjust class names
            return true;
        }

        // Example 3: check for data-id
        if (element.querySelector('[data-id*="question_input"]'))
        {
            return true;
        }

        // Add more checks as needed based on your LMS's HTML structure.
        return false;
    }

    function handleRichTextEditorQuestion(element, answer) {
        // Find the iframe (if TinyMCE or similar is used)
        const iframe = element.querySelector('iframe[id*="tinymce"]'); // Adjust selector as needed

        if (iframe) {
            // Access the iframe's contentWindow and document
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

            // Find the editable element within the iframe (e.g., the body)
            const editableElement = iframeDocument.querySelector('body[id*="tinymce"], .mce-content-body'); // VERY IMPORTANT: Adjust this selector

            if (editableElement) {
                // Set the content (using innerHTML for rich text)
                editableElement.innerHTML = answer;

                // Dispatch events to trigger any necessary updates
                editableElement.dispatchEvent(new Event('input', { bubbles: true }));
                editableElement.dispatchEvent(new Event('change', { bubbles: true })); // Important!
                editableElement.dispatchEvent(new Event('blur', { bubbles: true }));  // Sometimes needed

            } else {
                console.error("Could not find editable element within the iframe.");
            }
        } else {
            // If no iframe, look for a regular contenteditable element (less common, but possible)
        const editableElement = element.querySelector('[contenteditable="true"]'); // Find element with contenteditable
            if(editableElement)
            {
                editableElement.innerHTML = answer;
                // Dispatch events to trigger any necessary updates
                editableElement.dispatchEvent(new Event('input', { bubbles: true }));
                editableElement.dispatchEvent(new Event('change', { bubbles: true })); // Important!
                editableElement.dispatchEvent(new Event('blur', { bubbles: true }));  // Sometimes needed
            }
            else{
                console.error("Could not find a rich text editor element.");
            }

        }
    }


    function selectMultipleChoiceAnswer(element, answer, isIncognito = false) {
        const answerElements = Array.from(element.querySelectorAll('input[type="radio"], input[type="checkbox"], .answer-choice, .mcq-option, div[role="radio"], div[role="checkbox"], label'));
        const matchingAnswer = answerElements.find(a => a.innerText?.trim().toLowerCase().includes(answer.toLowerCase()));
        if (matchingAnswer) {
            matchingAnswer.click();
            if (!isIncognito) {
                matchingAnswer.classList.add('selected-answer');
            }
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

    // --- Các hàm format hiển thị đáp án ---
    function formatMatchingAnswers(answers) {
        if (!answers || answers.length === 0) return "Đáp án: Không có đáp án cho câu hỏi ghép cặp.";
        let displayText = "Đáp án:\n";
        answers.forEach((answer, index) => {
            displayText += `Câu ${index + 1}: ${answer}\n`; // Mỗi cặp trên một dòng mới, có số thứ tự câu
        });
        return displayText.trim();
    }

    function formatFillInBlankAnswers(answers) {
        if (!answers || answers.length === 0) return "Đáp án: Không có đáp án cho câu hỏi điền vào chỗ trống.";
        let displayText = "Đáp án:\n"; // Bắt đầu bằng "Đáp án:" và xuống dòng
        answers.forEach((answer, index) => {
            displayText += `Ô ${index + 1}: ${answer}\n`; // Mỗi đáp án trên một dòng mới, có số thứ tự ô
        });
        return displayText.trim(); // Loại bỏ khoảng trắng và dòng trống cuối cùng
    }

    function formatCheckboxListAnswers(answers) {
        if (!answers || answers.length === 0) return "Đáp án: Không có đáp án cho câu hỏi checkbox.";
        let displayText = "Đáp án đúng là:\n"; // Bắt đầu bằng "Đáp án đúng là:" và xuống dòng
        answers.forEach((answer, index) => {
            displayText += `- ${answer}\n`; // Mỗi đáp án trên một dòng mới, dùng dấu gạch đầu dòng
        });
        return displayText.trim();
    }



    // Thử gọi hàm trực tiếp để kiểm tra (chú ý: hàm này cần dữ liệu đầu vào correctAnswers và phải chạy trong môi trường trang web bài kiểm tra)
    // Ví dụ:
    // const correctAnswersForTest = ["yawning", "pulling away from something sharp", "hitting a knee reflex", "pulling away from something hot", "sneezing", "brain", "a beating heart", "memory"];
    // selectCorrectAnswers(correctAnswersForTest);

    // Thử gọi hàm handleQuestionReply trực tiếp để kiểm tra (chú ý: cần chạy trên trang web có cấu trúc discussion hoặc assignment)
    // handleQuestionReply(); - function not defined in provided code

    // Đảm bảo rằng hàm handleQuestionReply được gọi sau khi DOM đã được tải đầy đủ - function not defined in provided code
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM đã được tải.');
        // handleQuestionReply(); - function not defined in provided code
    });

    console.log('🏁 Script đã tải xong.');

    // Hàm để xóa trạng thái tải (cần được định nghĩa dựa trên cách trang web hiển thị trạng thái tải)
    function removeLoadingState(questionElement) {
        // Ví dụ: Nếu trạng thái tải là một class trên questionElement
        questionElement.classList.remove('loading');
        // Hoặc nếu là một phần tử con cụ thể
        const loadingIndicator = questionElement.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }

        // Sau khi xóa loading state, kiểm tra và click nút next-question
        clickNextQuestionButton();
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
    let farmAI = false; // New variable to track "Farm with AI"

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
        const savedFarmAI = localStorage.getItem('farmAI') === 'true'; // Load "Farm with AI"
        const savedTotalIterations = localStorage.getItem('totalIterations');
        const savedFarmCount = localStorage.getItem('farmCount');

        if (savedFarmRandom || savedFarmInput || savedFarmAI) { // Include savedFarmAI
            document.getElementById('farmRandom').checked = savedFarmRandom;
            document.getElementById('farmInput').checked = savedFarmInput;
            document.getElementById('farmAI').checked = savedFarmAI; // Set checkbox
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
        document.getElementById('farmAI').addEventListener('change', (event) => { // Save "Farm with AI"
            localStorage.setItem('farmAI', event.target.checked);
        });
        document.getElementById('iterationsInput').addEventListener('change', (event) => {
            localStorage.setItem('totalIterations', event.target.value);
        });

        // Add event listener for visibility changes (Corrected)
        document.addEventListener('visibilitychange', async function() {
            if (!isTampermonkeyInstalled) {
                return;
            }

            if (!document.hidden && isFarming) {
                // When the page becomes visible again, wait and then continue farming
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                if (isFarming) { // Double-check isFarming after the delay
                    await farmStep(); // Now correctly awaits farmStep
                }
            }
        });
        // Start farming automatically after a delay to ensure page is fully loaded
        // setTimeout(startFarming, 3000); // REMOVED THIS
    });

    async function startFarming() {
        if (!isTampermonkeyInstalled) {
            alert("This script requires the Tampermonkey extension to function properly. Please install Tampermonkey before using this feature.");
            return;
        }

        const farmRandom = document.getElementById('farmRandom').checked;
        const farmInput = document.getElementById('farmInput').checked;
        farmAI = document.getElementById('farmAI').checked; // Get "Farm with AI" state

        if (!farmRandom && !farmInput && !farmAI) { // Include farmAI
            showToast('Please select at least one farming method!');
            return;
        }

        totalIterations = parseInt(document.getElementById('iterationsInput').value) || Infinity;
        localStorage.setItem('totalIterations', totalIterations);

        isFarming = true;
        await farmStep(); // Await farmStep, as it's now async
    }


    async function farmStep() {
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
            setTimeout(async () => await handleQuizPage(), 500); // Await handleQuizPage
        } else {
            // We might be on the quiz page already
            await handleQuizPage(); // Await handleQuizPage
        }
    }

    async function handleQuizPage() {
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
        } else if (farmAI) { // Handle AI farming
            try {
                await selectAnswersWithAI(); // AWAIT the AI selection
            } catch (error) {
                console.error("Error in AI answer selection during farming:", error);
                showToast("AI answer selection failed. Stopping farming.");
                stopFarming();
                return; // Stop if AI fails
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

            // Toggle menu visibility
            updateMenuState(!isVisible);

            // Save menu state to localStorage with a reload flag
            localStorage.setItem('quizHelperMenuVisible', !isVisible);
            localStorage.setItem('quizHelperMenuReload', 'true');
        }
    });

    // Function to restore menu state on page load
    function restoreMenuState() {
        const menu = document.getElementById('quizHelperMenu');
        const savedVisibility = localStorage.getItem('quizHelperMenuVisible');
        const isReload = localStorage.getItem('quizHelperMenuReload') === 'true';

        if (isReload) {
            if (savedVisibility === 'false') {
                updateMenuState(false);
            }

            // Clear the reload flag after processing
            localStorage.removeItem('quizHelperMenuReload');
        }
    }

    // Call restoreMenuState when the page loads
    document.addEventListener('DOMContentLoaded', restoreMenuState);

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

    // Function to automatically click the next question button
    function clickNextQuestionButton() {
        setTimeout(() => {
            const nextButton = document.querySelector('button.submit_button.next-question.btn-primary');
            if (nextButton) {
                console.log('Tự động click nút next-question');
                nextButton.click();
                showToast('Đã tự động chuyển sang câu hỏi tiếp theo!');
            }
        }, 1000); // Đợi 1 giây để đảm bảo trang đã xử lý xong việc chọn đáp án
    }

    // AI Result Comparison System
    class AIResultComparisonSystem {
        constructor() {
            this.ai1Result = null;
            this.ai2Result = null;
        }

        // Process and format the answer according to system requirements
        formatAnswer(answer) {
            if (!answer) return null;

            // Ensure the answer follows the required format
            // Remove any analysis or explanation, keep only the final answer
            let formattedAnswer = answer;

            // Remove markdown formatting if present
            formattedAnswer = formattedAnswer.replace(/[*_#]/g, '');

            // Remove any analysis sections
            if (formattedAnswer.includes('Analysis')) {
                formattedAnswer = formattedAnswer.split('Analysis')[0];
            }

            // Remove any conclusion sections
            if (formattedAnswer.includes('Conclusion')) {
                formattedAnswer = formattedAnswer.split('Conclusion')[0];
            }

            return formattedAnswer.trim();
        }

        setAI1Result(result) {
            this.ai1Result = result;
        }

        setAI2Result(result) {
            this.ai2Result = result;
        }

        async compareResults() {
            if (!this.ai1Result || !this.ai2Result) {
                console.error('Both AI results must be set before comparison');
                return null;
            }

            // If answers are identical, return either one
            if (this.ai1Result === this.ai2Result) {
                return this.ai1Result;
            }

            // If answers are different, return AI2's answer directly
            // This ensures we get the complete answer without any analysis or explanation
            return this.ai2Result;
        }

        async getAI1Review() {
            // Simulate AI1's review process
            // In a real implementation, this would involve actual AI processing
            return new Promise(resolve => {
                setTimeout(() => {
                    // Compare results and make decision
                    const comparison = this.compareResultQuality();
                    resolve({
                        acceptsAI2Result: comparison.ai2Better,
                        reason: comparison.reason
                    });
                }, 1000);
            });
        }

        compareResultQuality() {
            // Implement result quality comparison logic here
            // This is a simplified example
            const ai1Score = this.evaluateResult(this.ai1Result);
            const ai2Score = this.evaluateResult(this.ai2Result);

            return {
                ai2Better: ai2Score > ai1Score,
                reason: ai2Score > ai1Score ?
                    'AI2 result appears more accurate' :
                    'AI1 result maintains better quality'
            };
        }

        evaluateResult(result) {
            // Implement result evaluation logic
            // This is a placeholder for actual evaluation logic
            let score = 0;
            if (result && typeof result === 'object') {
                // Add scoring criteria based on result structure and content
                score += Object.keys(result).length; // Example criterion
                score += this.evaluateResultDepth(result); // Example criterion
            }
            return score;
        }

        evaluateResultDepth(obj, depth = 0) {
            if (depth > 5) return 0; // Prevent infinite recursion
            let score = 0;
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    score += 1 + this.evaluateResultDepth(obj[key], depth + 1);
                }
            }
            return score;
        }
    }

    // Question Reply System
    class QuestionReplySystem {
        constructor() {
            this.db = firebase.firestore();
            this.setupQuestionReplyUI();
            this.setupEventListeners();
        }

        setupQuestionReplyUI() {
            // Add reply button to each question
            const questions = document.querySelectorAll('.question-container');
            questions.forEach(question => {
                if (!question.querySelector('.reply-button')) {
                    const replyButton = document.createElement('button');
                    replyButton.className = 'reply-button';
                    replyButton.innerHTML = 'Reply';
                    replyButton.dataset.questionId = question.id;
                    question.appendChild(replyButton);
                }
            });
        }

        setupEventListeners() {
            // Listen for reply button clicks
            document.addEventListener('click', async (e) => {
                if (e.target.classList.contains('reply-button')) {
                    const questionId = e.target.dataset.questionId;
                    const questionContainer = document.getElementById(questionId);

                    if (!questionContainer.querySelector('.reply-form')) {
                        this.createReplyForm(questionContainer);
                    }
                }
            });

            // Listen for form submissions
            document.addEventListener('submit', async (e) => {
                if (e.target.classList.contains('reply-form')) {
                    e.preventDefault();
                    const questionId = e.target.dataset.questionId;
                    const replyContent = e.target.querySelector('.reply-input').value;
                    await this.submitReply(questionId, replyContent);
                }
            });
        }

        createReplyForm(questionContainer) {
            const form = document.createElement('form');
            form.className = 'reply-form';
            form.dataset.questionId = questionContainer.id;

            const input = document.createElement('textarea');
            input.className = 'reply-input';
            input.placeholder = 'Type your reply here...';

            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.innerHTML = 'Submit Reply';

            form.appendChild(input);
            form.appendChild(submitButton);
            questionContainer.appendChild(form);
        }

        async submitReply(questionId, content) {
            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    alert('Please sign in to reply to questions.');
                    return;
                }

                await this.db.collection('replies').add({
                    questionId: questionId,
                    content: content,
                    userId: user.uid,
                    userName: user.displayName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Clear form and show success message
                const form = document.querySelector(`form[data-question-id="${questionId}"]`);
                if (form) {
                    form.querySelector('.reply-input').value = '';
                    this.showToast('Reply submitted successfully!');
                }

                // Refresh replies
                await this.loadReplies(questionId);

            } catch (error) {
                console.error('Error submitting reply:', error);
                this.showToast('Error submitting reply. Please try again.');
            }
        }

        async loadReplies(questionId) {
            try {
                const replies = await this.db.collection('replies')
                    .where('questionId', '==', questionId)
                    .orderBy('timestamp', 'desc')
                    .get();

                const repliesContainer = document.createElement('div');
                repliesContainer.className = 'replies-container';

                replies.forEach(reply => {
                    const replyData = reply.data();
                    const replyElement = document.createElement('div');
                    replyElement.className = 'reply';
                    replyElement.innerHTML = `
                        <div class="reply-header">
                            <span class="reply-author">${replyData.userName}</span>
                            <span class="reply-time">${new Date(replyData.timestamp?.toDate()).toLocaleString()}</span>
                        </div>
                        <div class="reply-content">${replyData.content}</div>
                    `;
                    repliesContainer.appendChild(replyElement);
                });

                // Replace existing replies container or add new one
                const questionContainer = document.getElementById(questionId);
                const existingReplies = questionContainer.querySelector('.replies-container');
                if (existingReplies) {
                    existingReplies.replaceWith(repliesContainer);
                } else {
                    questionContainer.appendChild(repliesContainer);
                }

            } catch (error) {
                console.error('Error loading replies:', error);
                this.showToast('Error loading replies. Please try again.');
            }
        }

        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
    }

    console.log('StudyAidX initialized successfully!');



    })();


