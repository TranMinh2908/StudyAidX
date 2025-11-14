// ==UserScript==
// @name         StudyAidX
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  A helper tool for quizzes on lms.vinschool.edu.vn
// @match        https://lms.vinschool.edu.vn/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

// Always enable copy and paste
(function () {
    const events = ["copy", "paste", "onpaste"];
    const handler = (e) => {
        e.stopImmediatePropagation();
        return true;
    };
    events.forEach((event) => {
        document.addEventListener(event, handler, true);
    });
})();

// StudyAidX version selection
const STUDYAIDX_VERSION = {
    DEFAULT: "default",
    ASSISTANT: "assistant",
};

// Track current active version - prioritize localStorage first
let currentVersion =
    localStorage.getItem("studyAidXVersion") ||
    GM_getValue("studyAidXVersion", STUDYAIDX_VERSION.DEFAULT);

// Initialize menu hidden state from storage
const isMenuHidden = GM_getValue("menuHidden", false);

// Global function to stop farming - defined early to ensure availability
window.stopFarmingCompletely = async function () {
    console.log("🛑 Stopping farming completely...");
    try {
        // Clear farming state
        localStorage.removeItem("farmingState");
        localStorage.removeItem("isFarming");
        localStorage.removeItem("farmCount");

        // Reset farming variables if they exist
        if (typeof isFarming !== 'undefined') {
            isFarming = false;
        }
        if (typeof farmCount !== 'undefined') {
            farmCount = 0;
        }

        // Show success message
        if (typeof showToast === 'function') {
            showToast("🛑 Farming stopped successfully!");
        }

        console.log("✅ Farming stopped successfully");
        return true;
    } catch (error) {
        console.error("❌ Error stopping farming:", error);
        return false;
    }
};

// Global function to handle quiz page - defined early to ensure availability
window.handleQuizPage = async function () {
    console.log("🎯 Handling quiz page...");
    try {
        // Check if we have farming configuration
        const farmingState = JSON.parse(localStorage.getItem("farmingState") || "{}");

        if (farmingState.farmAI) {
            // Use AI to answer questions
            console.log("🤖 Using AI to answer questions...");
            if (typeof selectAnswersWithAI === 'function') {
                await selectAnswersWithAI();
            } else {
                console.log("❌ AI function not available, using random");
                performRandomAnswering();
            }
        } else if (farmingState.farmInput && farmingState.inputAnswers) {
            // Use input answers
            console.log("📝 Using input answers...");
            const answersArray = farmingState.inputAnswers.split(";").map(answer => answer.trim());
            if (typeof selectCorrectAnswers === 'function') {
                selectCorrectAnswers(answersArray);
            } else {
                performInputAnswering(answersArray);
            }
        } else {
            // Use random answers
            console.log("🎲 Using random answers...");
            if (typeof autoAnswerRandom === 'function') {
                autoAnswerRandom();
            } else {
                performRandomAnswering();
            }
        }

        // Wait a bit then submit
        setTimeout(() => {
            const submitButton = document.querySelector(".btn.submit_button.quiz_submit.btn-primary");
            if (submitButton) {
                console.log("📤 Submitting quiz...");
                submitButton.click();
            }
        }, 2000);

        return true;
    } catch (error) {
        console.error("❌ Error handling quiz page:", error);
        return false;
    }
};

// Helper function for random answering
function performRandomAnswering() {
    const questions = document.querySelectorAll(".question");
    questions.forEach((question, index) => {
        const answers = question.querySelectorAll("input[type='radio'], input[type='checkbox']");
        if (answers.length > 0) {
            const randomIndex = Math.floor(Math.random() * answers.length);
            answers[randomIndex].checked = true;
            console.log(`✅ Question ${index + 1}: Selected random answer ${randomIndex + 1}`);
        }
    });
}

// Helper function for input-based answering
function performInputAnswering(answersArray) {
    const questions = document.querySelectorAll(".question");
    questions.forEach((question, index) => {
        if (index < answersArray.length) {
            const targetAnswer = answersArray[index];
            const answers = question.querySelectorAll("input[type='radio'], input[type='checkbox']");

            // Try to find matching answer by text content
            let found = false;
            answers.forEach((answer) => {
                const label = answer.closest("label") || answer.parentElement;
                if (label && label.textContent.trim().includes(targetAnswer)) {
                    answer.checked = true;
                    found = true;
                    console.log(`✅ Question ${index + 1}: Selected answer "${targetAnswer}"`);
                }
            });

            if (!found && answers.length > 0) {
                // Fallback to first answer if no match found
                answers[0].checked = true;
                console.log(`⚠️ Question ${index + 1}: No match found, selected first answer`);
            }
        }
    });
}

// Ensure functions are available globally - backup definitions
if (typeof window.stopFarmingCompletely === 'undefined') {
    window.stopFarmingCompletely = async function () {
        console.log("🛑 [BACKUP] Stopping farming completely...");
        try {
            localStorage.removeItem("farmingState");
            localStorage.removeItem("isFarming");
            localStorage.removeItem("farmCount");
            console.log("✅ [BACKUP] Farming stopped successfully");
            return true;
        } catch (error) {
            console.error("❌ [BACKUP] Error stopping farming:", error);
            return false;
        }
    };
}

if (typeof window.handleQuizPage === 'undefined') {
    window.handleQuizPage = async function () {
        console.log("🎯 [BACKUP] Handling quiz page...");
        try {
            // Simple random answering as fallback
            const questions = document.querySelectorAll(".question");
            questions.forEach((question, index) => {
                const answers = question.querySelectorAll("input[type='radio'], input[type='checkbox']");
                if (answers.length > 0) {
                    const randomIndex = Math.floor(Math.random() * answers.length);
                    answers[randomIndex].checked = true;
                    console.log(`✅ [BACKUP] Question ${index + 1}: Selected random answer ${randomIndex + 1}`);
                }
            });

            // Submit after 2 seconds
            setTimeout(() => {
                const submitButton = document.querySelector(".btn.submit_button.quiz_submit.btn-primary");
                if (submitButton) {
                    console.log("📤 [BACKUP] Submitting quiz...");
                    submitButton.click();
                }
            }, 2000);

            return true;
        } catch (error) {
            console.error("❌ [BACKUP] Error handling quiz page:", error);
            return false;
        }
    };
}

// Make sure functions are accessible from global scope
window.performRandomAnswering = performRandomAnswering;
window.performInputAnswering = performInputAnswering;

// --- StudyAidX Bidirectional Communication System ---

/**
 * Bidirectional Communication System for StudyAidX Extension Detection
 * Handles timing issues between extension and user script
 */
(function setupStudyAidXBidirectionalCommunication() {
    let connectionEstablished = false;
    let extensionDetected = false;

    // Announce user script is ready
    function announceUserScriptReady() {
        if (connectionEstablished) return;

        try {
            // Set ready flag
            window.STUDYAIDX_USERSCRIPT_READY = {
                loaded: true,
                timestamp: Date.now(),
                version: '1.1.0'
            };

            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('studyaidx-userscript-ready', {
                detail: {
                    status: 'ready',
                    timestamp: Date.now()
                }
            }));

            console.log('%c🎯 [StudyAidX User Script] Ready! Waiting for extension...', 'color: #ff9500; font-weight: bold;');

            // Check if extension is already ready
            if (window.STUDYAIDX_EXTENSION_READY || window.__STUDYAIDX_READY__) {
                console.log('%c🤝 [StudyAidX User Script] Extension already detected!', 'color: #00ff00; font-weight: bold;');
                establishConnection();
            }
        } catch (e) {
            console.warn('⚠️ Error announcing user script ready:', e);
        }
    }

    // Listen for extension connection
    window.addEventListener('studyaidx-connection-established', function (event) {
        if (!connectionEstablished && event.detail && event.detail.signature === 'SAX_AS_LOADED_OK_2024') {
            connectionEstablished = true;
            extensionDetected = true;

            console.log('%c✅ [StudyAidX User Script] Connection with extension established!', 'color: #00ff00; font-weight: bold;');

            // Show StudyAidX Invisible notification
            showStudyAidXInvisibleDetection(event.detail);
        }
    });

    // Alternative: Monitor for extension signal via console
    const originalConsoleLog = console.log;
    console.log = function (...args) {
        // Call original console.log first
        originalConsoleLog.apply(console, args);

        // Check for extension signal
        if (!connectionEstablished && args.length > 0) {
            const message = args.join(' ');
            if (message.includes('STUDYAIDX_ANTI_SYSTEM_2024_LOADED') ||
                message.includes('🔥 STUDYAIDX_ANTI_SYSTEM_2024_LOADED 🔥')) {

                connectionEstablished = true;
                extensionDetected = true;

                console.log('%c🔥 [StudyAidX User Script] Extension signal detected via console!', 'color: #00ff00; font-weight: bold;');

                // Create detection result
                const detectionResult = {
                    detected: true,
                    status: {
                        signature: 'SAX_AS_LOADED_OK',
                        version: '2024',
                        timestamp: Date.now(),
                        detectedVia: 'console_signal'
                    },
                    version: '2024',
                    timestamp: Date.now(),
                    error: null
                };

                showStudyAidXInvisibleDetection(detectionResult);

                // Restore original console.log after detection
                setTimeout(() => {
                    console.log = originalConsoleLog;
                    console.log('🔧 Console monitor deactivated after successful detection');
                }, 1000);
            }
        }
    };

    // Function to establish connection
    function establishConnection() {
        console.log('%c🎯 [StudyAidX User Script] Establishing connection with extension...', 'color: #00ff00; font-weight: bold;');

        // Check window objects for extension data
        if (window.STUDYAIDX_ANTI_SYSTEM_STATUS) {
            const detectionResult = {
                detected: true,
                status: window.STUDYAIDX_ANTI_SYSTEM_STATUS,
                version: window.STUDYAIDX_ANTI_SYSTEM_STATUS.version || '2024',
                timestamp: window.STUDYAIDX_ANTI_SYSTEM_STATUS.timestamp || Date.now(),
                error: null
            };

            showStudyAidXInvisibleDetection(detectionResult);
        }
    }

    // Show StudyAidX Invisible detection notification
    function showStudyAidXInvisibleDetection(detectionResult) {
        console.log('%c🎯 StudyAidX Invisible extension detected via bidirectional communication!', 'color: #00ff00; font-weight: bold; background: #000; padding: 4px;');
        console.log('🔍 Extension Version:', detectionResult.version || '2024');
        console.log('⏰ Detection Time:', new Date().toLocaleString());
        console.log('🔥 Detection Method: Bidirectional Communication');

        // Show notification immediately
        setTimeout(() => {
            if (typeof showStudyAidXInvisibleNotification === 'function') {
                showStudyAidXInvisibleNotification(detectionResult);
            } else {
                // Fallback: show toast directly
                if (typeof createStudyAidXToast === 'function') {
                    createStudyAidXToast(detectionResult);

                    // Show logo after toast
                    setTimeout(() => {
                        if (typeof createStudyAidXLogo === 'function') {
                            createStudyAidXLogo(detectionResult);
                        }
                    }, 4000);
                }
            }
        }, 100);
    }

    // Initialize user script and announce ready
    function initUserScript() {
        console.log('%c🚀 [StudyAidX User Script] Initializing bidirectional communication...', 'color: #ff9500; font-weight: bold;');

        // Announce ready after initialization
        setTimeout(() => {
            announceUserScriptReady();
        }, 500);
    }

    // Store communication state globally for debugging
    window.studyAidXBidirectionalComm = {
        connectionEstablished: () => connectionEstablished,
        extensionDetected: () => extensionDetected,
        announceReady: announceUserScriptReady,
        establishConnection: establishConnection
    };

    // Start the bidirectional communication system
    initUserScript();
})();

// --- StudyAidX Invisible Detection Functions ---

/**
 * Detects if StudyAidX Invisible anti-cheat extension is active
 * Uses multiple detection methods including console monitoring and window object checking
 * Implements retry mechanism with 2-second delays up to 3 attempts
 * @returns {Promise<{detected: boolean, status: object|null, version: string|null, timestamp: number|null, error: string|null}>}
 */
async function checkStudyAidXInvisible() {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    let lastError = null;

    // Global console monitoring setup - activate immediately
    let extensionDetected = false;
    let detectionData = null;
    let consoleMonitorActive = false;

    // Set up console monitoring immediately to catch any future messages
    const originalConsoleLog = console.log;
    const consoleMonitor = function (...args) {
        originalConsoleLog.apply(console, args);

        // Check if any argument contains the extension signature
        const message = args.join(' ');
        if (message.includes('STUDYAIDX_ANTI_SYSTEM_2024_LOADED') ||
            message.includes('🔥 STUDYAIDX_ANTI_SYSTEM_2024_LOADED 🔥')) {
            extensionDetected = true;
            detectionData = {
                signature: 'SAX_AS_LOADED_OK', // Use the expected signature format
                timestamp: Date.now(),
                version: '2024',
                detectedVia: 'console_monitor'
            };
            originalConsoleLog('🔥 StudyAidX Invisible extension signature detected in console!');
        }
    };

    // Activate console monitoring immediately
    console.log = consoleMonitor;
    consoleMonitorActive = true;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Edge case: Handle rapid page navigation
            if (document.readyState === 'unloading') {
                console.log('⚠️ Page is unloading, skipping detection attempt');
                break;
            }

            // Method 1: Check console monitoring result
            if (extensionDetected && detectionData) {
                console.log('✅ StudyAidX Invisible detected via console monitoring!');
                console.log('🔍 Extension Version:', detectionData.version || 'Unknown');
                console.log('⏰ Detection Timestamp:', new Date(detectionData.timestamp).toLocaleString());
                console.log('� Dxetection Attempt:', attempt);
                console.log('🔥 Detection Method: Console Log Monitor');

                return {
                    detected: true,
                    status: detectionData,
                    version: detectionData.version,
                    timestamp: detectionData.timestamp,
                    error: null
                };
            }

            // Method 2: Check for window object (fallback method)
            let status;
            try {
                status = window.STUDYAIDX_ANTI_SYSTEM_STATUS;
            } catch (accessError) {
                console.warn(`⚠️ Cannot access window.STUDYAIDX_ANTI_SYSTEM_STATUS (attempt ${attempt}):`, accessError);
                lastError = `Window access error: ${accessError.message}`;
            }

            // Enhanced validation with type checking for window object method
            if (status &&
                typeof status === 'object' &&
                status.signature === 'SAX_AS_LOADED_OK') {

                // Additional validation for status object integrity
                const isValidStatus = (
                    status.hasOwnProperty('signature') &&
                    typeof status.signature === 'string' &&
                    status.signature.length > 0
                );

                if (isValidStatus) {
                    console.log('✅ StudyAidX Invisible detected via window object!');
                    console.log('🔍 Extension Version:', status.version || 'Unknown');
                    console.log('⏰ Loaded Timestamp:', status.timestamp ? new Date(status.timestamp).toLocaleString() : 'Unknown');
                    console.log('📊 Detection Attempt:', attempt);
                    console.log('🪟 Detection Method: Window Object');

                    // Validate version and timestamp if present
                    const validatedVersion = (status.version && typeof status.version === 'string') ? status.version : null;
                    const validatedTimestamp = (status.timestamp && typeof status.timestamp === 'number') ? status.timestamp : null;

                    return {
                        detected: true,
                        status: status,
                        version: validatedVersion,
                        timestamp: validatedTimestamp,
                        error: null
                    };
                }
            }

            // Method 3: Activate console monitoring for this attempt
            if (!consoleMonitorActive) {
                console.log(`🔍 Activating console monitor for StudyAidX Invisible detection (attempt ${attempt})...`);
                console.log = consoleMonitor;
                consoleMonitorActive = true;

                // Wait a bit for potential console messages
                await new Promise(resolve => setTimeout(resolve, 500));

                // Check again after monitoring activation
                if (extensionDetected && detectionData) {
                    console.log('✅ StudyAidX Invisible detected via console monitoring after activation!');
                    return {
                        detected: true,
                        status: detectionData,
                        version: detectionData.version,
                        timestamp: detectionData.timestamp,
                        error: null
                    };
                }
            }

            // Extension not detected on this attempt
            if (attempt < maxRetries) {
                console.log(`⏳ StudyAidX Invisible not detected (attempt ${attempt}/${maxRetries}). Retrying in ${retryDelay / 1000} seconds...`);

                // Edge case: Check if we should continue retrying
                if (document.visibilityState === 'hidden') {
                    console.log('⚠️ Page is hidden, reducing retry delay');
                    await new Promise(resolve => setTimeout(resolve, retryDelay / 2));
                } else {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            } else {
                console.log(`❌ StudyAidX Invisible not detected after ${maxRetries} attempts.`);
                lastError = `Extension not found after ${maxRetries} attempts`;
            }

        } catch (error) {
            console.error(`❌ Error during StudyAidX Invisible detection (attempt ${attempt}):`, error);
            lastError = error.message || 'Unknown detection error';

            // Edge case: Handle specific error types
            if (error.name === 'SecurityError') {
                console.error('🔒 Security error detected, stopping further attempts');
                break;
            }

            if (error.name === 'TypeError' && error.message.includes('window')) {
                console.error('🪟 Window access error, may be in restricted context');
                lastError = 'Window access restricted';
            }

            if (attempt < maxRetries) {
                console.log(`⏳ Retrying detection in ${retryDelay / 1000} seconds...`);

                // Progressive backoff for errors
                const errorDelay = retryDelay * attempt;
                await new Promise(resolve => setTimeout(resolve, errorDelay));
            }
        }
    }

    // Cleanup: Restore original console.log
    if (consoleMonitorActive) {
        console.log = originalConsoleLog;
        console.log('🔧 Console monitor deactivated');
    }

    // Extension not detected after all attempts
    return {
        detected: false,
        status: null,
        version: null,
        timestamp: null,
        error: lastError
    };
}

// Make the detection function globally accessible
window.checkStudyAidXInvisible = checkStudyAidXInvisible;

// Backup detection trigger - run after 3 seconds to ensure StudyAidX is fully loaded
setTimeout(() => {
    // Check if detection has already run
    if (typeof window.runStudyAidXInvisibleDetectionAfterLoad === 'function') {
        console.log('🔄 Backup detection trigger: Running StudyAidX Invisible detection...');
        window.runStudyAidXInvisibleDetectionAfterLoad();
    }


}, 3000);

// --- StudyAidX Invisible Toast Notification System ---

/**
 * Creates and displays a toast notification for StudyAidX Invisible detection
 * Shows Vietnamese text with fade-in animation and auto-hides after 3 seconds
 * Enhanced with comprehensive error handling and edge case management
 * @param {Object} detectionResult - Result from checkStudyAidXInvisible function
 * @returns {HTMLElement} The created toast element
 */
function createStudyAidXToast(detectionResult) {
    try {
        // Edge case: Check if DOM is available
        if (!document || !document.body) {
            console.warn('⚠️ DOM not available for toast creation');
            return null;
        }

        // Edge case: Check if we're in a restricted context
        if (document.readyState === 'unloading') {
            console.log('⚠️ Page is unloading, skipping toast creation');
            return null;
        }

        // Remove any existing toast to prevent duplicates with error handling
        try {
            const existingToast = document.querySelector('.studyaidx-invisible-toast');
            if (existingToast) {
                existingToast.remove();
                console.log('🗑️ Removed existing toast notification');
            }
        } catch (queryError) {
            console.warn('⚠️ Error removing existing toast:', queryError);
            // Continue anyway
        }

        // Create toast container with validation
        let toast;
        try {
            toast = document.createElement('div');
            if (!toast) {
                throw new Error('Failed to create toast element');
            }
        } catch (createError) {
            console.error('❌ Failed to create toast element:', createError);
            return null;
        }

        // Set up toast properties with error handling
        try {
            toast.className = 'studyaidx-invisible-toast';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');
        } catch (attributeError) {
            console.warn('⚠️ Error setting toast attributes:', attributeError);
            // Continue with basic functionality
        }

        // Create toast content with fallback handling
        try {
            const toastIcon = document.createElement('span');
            toastIcon.className = 'toast-icon';

            // Fallback for emoji support
            try {
                toastIcon.textContent = '🛡️';
            } catch (emojiError) {
                toastIcon.textContent = '[Shield]'; // Fallback text
                console.warn('⚠️ Emoji not supported, using fallback text');
            }

            const toastText = document.createElement('span');
            toastText.className = 'toast-text';
            toastText.textContent = 'StudyAidX Invisible đang hoạt động';

            // Add version info if available with validation
            if (detectionResult &&
                typeof detectionResult === 'object' &&
                detectionResult.version &&
                typeof detectionResult.version === 'string') {

                try {
                    const versionInfo = document.createElement('div');
                    versionInfo.style.fontSize = '12px';
                    versionInfo.style.opacity = '0.9';
                    versionInfo.style.marginTop = '4px';
                    versionInfo.textContent = `Phiên bản: ${detectionResult.version}`;
                    toast.appendChild(toastIcon);
                    toast.appendChild(toastText);
                    toast.appendChild(versionInfo);
                } catch (versionError) {
                    console.warn('⚠️ Error adding version info, using basic layout:', versionError);
                    toast.appendChild(toastIcon);
                    toast.appendChild(toastText);
                }
            } else {
                toast.appendChild(toastIcon);
                toast.appendChild(toastText);
            }
        } catch (contentError) {
            console.error('❌ Error creating toast content:', contentError);
            // Create minimal fallback content
            toast.textContent = 'StudyAidX Invisible Active';
        }

        // Add toast to DOM with error handling
        try {
            if (document.body) {
                document.body.appendChild(toast);
            } else {
                throw new Error('Document body not available');
            }
        } catch (appendError) {
            console.error('❌ Error adding toast to DOM:', appendError);
            return null;
        }

        // Set up animations with fallback for reduced motion
        const prefersReducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Trigger fade-in animation with error handling
        const showToast = () => {
            try {
                if (toast && toast.parentNode) {
                    toast.classList.add('show');
                    console.log('🎯 Toast notification displayed with fade-in animation');
                } else {
                    console.warn('⚠️ Toast element no longer in DOM, skipping animation');
                }
            } catch (animationError) {
                console.warn('⚠️ Error triggering toast animation:', animationError);
                // Fallback: make toast visible without animation
                if (toast) {
                    toast.style.opacity = '1';
                    toast.style.transform = 'translateX(0)';
                }
            }
        };

        // Morphing animation - transform toast to icon
        const morphToIcon = () => {
            try {
                if (toast && toast.parentNode) {
                    console.log('🔄 Starting morphing animation: toast → icon');

                    // Add morphing class to trigger CSS animation
                    toast.classList.remove('show');
                    toast.classList.add('morphing');

                    // After morphing animation completes, convert to permanent icon
                    setTimeout(() => {
                        try {
                            if (toast && toast.parentNode) {
                                // Transform the toast element into a permanent icon
                                toast.className = 'studyaidx-invisible-logo show';
                                toast.innerHTML = `
                                    <div class="studyaidx-invisible-logo-tooltip">
                                        StudyAidX Invisible đang hoạt động<br>
                                        <small>Phiên bản: ${detectionResult?.version || '2024'}</small>
                                    </div>
                                `;

                                // Icon will be handled by CSS ::before pseudo-element

                                // Add hover effects
                                toast.addEventListener('mouseenter', () => {
                                    console.log('🎯 Logo hover effect triggered');
                                });

                                toast.addEventListener('mouseleave', () => {
                                    console.log('🎯 Logo hover effect ended');
                                });

                                // Add click handler
                                toast.addEventListener('click', () => {
                                    console.log('🖱️ StudyAidX Invisible logo clicked - showing toast notification');

                                    // Add pulse animation
                                    toast.classList.add('pulse');
                                    setTimeout(() => {
                                        toast.classList.remove('pulse');
                                    }, 2000);

                                    // Show toast notification again
                                    if (typeof createStudyAidXToast === 'function') {
                                        createStudyAidXToast({
                                            detected: true,
                                            version: detectionResult?.version || '2024',
                                            timestamp: Date.now()
                                        });
                                    } else {
                                        // Fallback: create simple toast
                                        const newToast = document.createElement('div');
                                        newToast.className = 'studyaidx-invisible-toast show';
                                        newToast.innerHTML = `
                                            <span class="toast-icon">🛡️</span>
                                            <span class="toast-text">StudyAidX Invisible đang hoạt động</span>
                                        `;
                                        document.body.appendChild(newToast);

                                        // Auto hide after 3 seconds
                                        setTimeout(() => {
                                            newToast.classList.remove('show');
                                            setTimeout(() => {
                                                if (newToast.parentNode) {
                                                    newToast.remove();
                                                }
                                            }, 600);
                                        }, 3000);
                                    }
                                });

                                console.log('✅ Toast successfully morphed into permanent logo icon');
                            }
                        } catch (morphError) {
                            console.warn('⚠️ Error completing morphing animation:', morphError);
                        }
                    }, prefersReducedMotion ? 100 : 1000); // Match CSS animation duration (1.0s)

                } else {
                    console.warn('⚠️ Toast element no longer in DOM, skipping morphing animation');
                }
            } catch (morphError) {
                console.warn('⚠️ Error starting morphing animation:', morphError);
                // Fallback: remove toast and create separate logo
                if (toast && toast.parentNode) {
                    toast.remove();
                }
                // Create separate logo as fallback
                createSeparateLogo(detectionResult);
            }
        };

        // Fallback function to create separate logo if morphing fails
        const createSeparateLogo = (detectionResult) => {
            try {
                const logo = document.createElement('div');
                logo.className = 'studyaidx-invisible-logo';
                logo.innerHTML = `
                    <div class="studyaidx-invisible-logo-tooltip">
                        StudyAidX Invisible đang hoạt động<br>
                        <small>Phiên bản: ${detectionResult?.version || '2024'}</small>
                    </div>
                `;
                document.body.appendChild(logo);
                setTimeout(() => logo.classList.add('show'), 100);
                console.log('🔄 Fallback: Created separate logo icon');
            } catch (error) {
                console.warn('⚠️ Error creating fallback logo:', error);
            }
        };

        // Set up timers with reduced delays for reduced motion
        const showDelay = prefersReducedMotion ? 50 : 100;
        const hideDelay = prefersReducedMotion ? 1500 : 3000; // Shorter display time for reduced motion

        setTimeout(showToast, showDelay);
        setTimeout(morphToIcon, hideDelay);

        return toast;

    } catch (error) {
        console.error('❌ Error creating StudyAidX toast notification:', error);

        // Fallback: Create minimal notification
        try {
            const fallbackToast = document.createElement('div');
            fallbackToast.textContent = 'StudyAidX Invisible Active';
            fallbackToast.style.cssText = `
                position: fixed; top: 20px; right: 20px;
                background: #28a745; color: white; padding: 10px;
                border-radius: 4px; z-index: 10000;
            `;
            document.body.appendChild(fallbackToast);

            setTimeout(() => {
                if (fallbackToast.parentNode) {
                    fallbackToast.remove();
                }
            }, 3000);

            console.log('✅ Fallback toast notification created');
            return fallbackToast;
        } catch (fallbackError) {
            console.error('❌ Even fallback toast creation failed:', fallbackError);
            return null;
        }
    }
}

/**
 * Shows a toast notification when StudyAidX Invisible is detected
 * This is the main function to call when extension is detected
 * @param {Object} detectionResult - Result from checkStudyAidXInvisible function
 */
function showStudyAidXInvisibleToast(detectionResult) {
    try {
        console.log('📢 Showing StudyAidX Invisible detection toast...');

        // Ensure DOM is ready before creating toast
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createStudyAidXToast(detectionResult);
            });
        } else {
            createStudyAidXToast(detectionResult);
        }

    } catch (error) {
        console.error('❌ Error showing StudyAidX Invisible toast:', error);
    }
}

// Make toast functions globally accessible
window.createStudyAidXToast = createStudyAidXToast;
window.showStudyAidXInvisibleToast = showStudyAidXInvisibleToast;

// --- StudyAidX Invisible Logo Indicator System ---

/**
 * Creates a persistent logo indicator for StudyAidX Invisible detection
 * Shows a compact logo in bottom-right corner with hover functionality
 * @param {Object} detectionResult - Result from checkStudyAidXInvisible function
 * @returns {HTMLElement} The created logo element
 */
function createStudyAidXLogo(detectionResult) {
    try {
        // Remove any existing logo to prevent duplicates
        const existingLogo = document.querySelector('.studyaidx-invisible-logo');
        if (existingLogo) {
            existingLogo.remove();
        }

        // Create logo container
        const logo = document.createElement('div');
        logo.className = 'studyaidx-invisible-logo';
        logo.setAttribute('role', 'button');
        logo.setAttribute('aria-label', 'StudyAidX Invisible đang hoạt động');
        logo.setAttribute('tabindex', '0');

        // Create tooltip content
        const tooltip = document.createElement('div');
        tooltip.className = 'studyaidx-invisible-logo-tooltip';

        // Set tooltip text with version info if available
        if (detectionResult && detectionResult.version) {
            tooltip.innerHTML = `
                StudyAidX Invisible đang hoạt động<br>
                <small>Phiên bản: ${detectionResult.version}</small>
            `;
        } else {
            tooltip.textContent = 'StudyAidX Invisible đang hoạt động';
        }

        logo.appendChild(tooltip);

        // Add logo to DOM
        document.body.appendChild(logo);

        // Set up hover event handlers with 300ms transition timing
        let hoverTimeout;

        logo.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
            console.log('🎯 Logo hover effect triggered');
        });

        logo.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(() => {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateY(10px)';
                console.log('🎯 Logo hover effect ended');
            }, 50); // Small delay to prevent flickering
        });

        // Add keyboard support for accessibility
        logo.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                // Toggle tooltip visibility on keyboard interaction
                const isVisible = tooltip.style.opacity === '1';
                tooltip.style.opacity = isVisible ? '0' : '1';
                tooltip.style.transform = isVisible ? 'translateY(10px)' : 'translateY(0)';
                console.log('⌨️ Logo keyboard interaction:', isVisible ? 'hidden' : 'shown');
            }
        });

        // Add click handler for additional interaction
        logo.addEventListener('click', () => {
            console.log('🖱️ StudyAidX Invisible logo clicked - showing toast notification');

            // Add pulse animation on click
            logo.classList.add('pulse');
            setTimeout(() => {
                logo.classList.remove('pulse');
            }, 2000);

            // Show toast notification again
            if (typeof createStudyAidXToast === 'function') {
                createStudyAidXToast({
                    detected: true,
                    version: '2024',
                    timestamp: Date.now()
                });
            } else {
                // Fallback: create simple toast
                const toast = document.createElement('div');
                toast.className = 'studyaidx-invisible-toast show';
                toast.innerHTML = `
                    <span class="toast-icon">🛡️</span>
                    <span class="toast-text">StudyAidX Invisible đang hoạt động</span>
                `;
                document.body.appendChild(toast);

                // Auto hide after 3 seconds
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.remove();
                        }
                    }, 600);
                }, 3000);
            }
        });

        // Trigger show animation after a brief delay
        setTimeout(() => {
            logo.classList.add('show');
            console.log('🎯 Logo indicator displayed with scale animation');
        }, 100);

        return logo;

    } catch (error) {
        console.error('❌ Error creating StudyAidX logo indicator:', error);
        return null;
    }
}

/**
 * Shows the logo indicator after toast notification completes
 * This creates a smooth transition from toast to persistent logo
 * @param {Object} detectionResult - Result from checkStudyAidXInvisible function
 * @param {number} delay - Delay in milliseconds before showing logo (default: 4000ms)
 */
function showStudyAidXInvisibleLogo(detectionResult, delay = 4000) {
    try {
        console.log('📢 Scheduling StudyAidX Invisible logo display...');

        setTimeout(() => {
            // Ensure DOM is ready before creating logo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    createStudyAidXLogo(detectionResult);
                });
            } else {
                createStudyAidXLogo(detectionResult);
            }
        }, delay);

    } catch (error) {
        console.error('❌ Error scheduling StudyAidX Invisible logo:', error);
    }
}

/**
 * Complete notification sequence: shows toast first, then logo
 * This is the main function to call when StudyAidX Invisible is detected
 * @param {Object} detectionResult - Result from checkStudyAidXInvisible function
 */
function showStudyAidXInvisibleNotification(detectionResult) {
    try {
        console.log('🚀 Starting complete StudyAidX Invisible notification sequence...');

        // Show toast notification first (toast will morph into icon automatically)
        showStudyAidXInvisibleToast(detectionResult);

        // DISABLED: Don't create separate logo since toast morphs into icon
        // showStudyAidXInvisibleLogo(detectionResult, 4000);

    } catch (error) {
        console.error('❌ Error in StudyAidX Invisible notification sequence:', error);
    }
}

// Make logo functions globally accessible
window.createStudyAidXLogo = createStudyAidXLogo;
window.showStudyAidXInvisibleLogo = showStudyAidXInvisibleLogo;
window.showStudyAidXInvisibleNotification = showStudyAidXInvisibleNotification;

// --- StudyAidX Invisible Detection System Integration ---

// State tracking variables for detection status and UI elements
let studyAidXInvisibleDetectionState = {
    isInitialized: false,
    detectionResult: null,
    toastElement: null,
    logoElement: null,
    cleanupHandlers: []
};

/**
 * Initializes the StudyAidX Invisible detection system
 * Integrates with the main userscript initialization sequence
 */
async function initializeStudyAidXInvisibleDetection() {
    try {
        console.log('🚀 Initializing StudyAidX Invisible detection system...');

        // Prevent multiple initializations
        if (studyAidXInvisibleDetectionState.isInitialized) {
            console.log('⚠️ StudyAidX Invisible detection already initialized, skipping...');
            return;
        }

        // Wait for DOM to be ready before starting detection
        if (document.readyState === 'loading') {
            console.log('⏳ Waiting for DOM to be ready...');
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            });
        }

        // Don't run detection here - wait for StudyAidX to fully load
        console.log('⏳ StudyAidX Invisible detection system ready, waiting for StudyAidX to complete loading...');

        // Set up cleanup handlers for page unload
        setupStudyAidXInvisibleCleanup();

        // Mark as initialized
        studyAidXInvisibleDetectionState.isInitialized = true;
        console.log('✅ StudyAidX Invisible detection system initialized successfully');

        // StudyAidX initialization complete notification
        console.log("🎉 StudyAidX đã tải hoàn tất! Tất cả tính năng đã sẵn sàng sử dụng.");
        console.log("✅ StudyAidX initialization completed successfully!");

    } catch (error) {
        console.error('❌ Error initializing StudyAidX Invisible detection system:', error);

        // Ensure we don't break the main userscript functionality
        studyAidXInvisibleDetectionState.isInitialized = true; // Mark as initialized to prevent retries
    }
}

/**
 * Sets up cleanup handlers to prevent memory leaks on page unload
 */
function setupStudyAidXInvisibleCleanup() {
    try {
        // Cleanup function
        const cleanup = () => {
            console.log('🧹 Cleaning up StudyAidX Invisible detection system...');

            // Remove toast element if it exists
            const existingToast = document.querySelector('.studyaidx-invisible-toast');
            if (existingToast) {
                existingToast.remove();
            }

            // Remove logo element if it exists
            const existingLogo = document.querySelector('.studyaidx-invisible-logo');
            if (existingLogo) {
                existingLogo.remove();
            }

            // Clear state
            studyAidXInvisibleDetectionState = {
                isInitialized: false,
                detectionResult: null,
                toastElement: null,
                logoElement: null,
                cleanupHandlers: []
            };

            console.log('✅ StudyAidX Invisible detection cleanup completed');
        };

        // Add cleanup handlers for various page unload events
        const events = ['beforeunload', 'unload', 'pagehide'];
        events.forEach(eventType => {
            const handler = cleanup;
            window.addEventListener(eventType, handler, { once: true });
            studyAidXInvisibleDetectionState.cleanupHandlers.push({ eventType, handler });
        });

        // Also cleanup on navigation (for SPAs)
        if ('navigation' in window) {
            window.navigation.addEventListener('navigate', cleanup, { once: true });
        }

    } catch (error) {
        console.error('❌ Error setting up StudyAidX Invisible cleanup handlers:', error);
    }
}

/**
 * Re-runs detection (useful for testing or manual triggers)
 * @returns {Promise<Object>} Detection result
 */
async function rerunStudyAidXInvisibleDetection() {
    try {
        console.log('🔄 Re-running StudyAidX Invisible detection...');

        // Clear existing UI elements
        const existingToast = document.querySelector('.studyaidx-invisible-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const existingLogo = document.querySelector('.studyaidx-invisible-logo');
        if (existingLogo) {
            existingLogo.remove();
        }

        // Run detection again
        const detectionResult = await checkStudyAidXInvisible();
        studyAidXInvisibleDetectionState.detectionResult = detectionResult;

        if (detectionResult.detected) {
            showStudyAidXInvisibleNotification(detectionResult);
        }

        return detectionResult;

    } catch (error) {
        console.error('❌ Error re-running StudyAidX Invisible detection:', error);
        return { detected: false, status: null, version: null, timestamp: null };
    }
}

/**
 * Runs StudyAidX Invisible detection AFTER StudyAidX has fully loaded
 * This ensures detection only happens when all StudyAidX features are ready
 */
async function runStudyAidXInvisibleDetectionAfterLoad() {
    try {
        console.log('🔍 StudyAidX fully loaded! Now starting StudyAidX Invisible extension detection...');

        // Add a small delay to ensure everything is settled
        await new Promise(resolve => setTimeout(resolve, 500));

        // Run the detection
        const detectionResult = await checkStudyAidXInvisible();

        // Store the detection result
        studyAidXInvisibleDetectionState.detectionResult = detectionResult;

        if (detectionResult.detected) {
            console.log('✅ StudyAidX Invisible extension detected - showing notification sequence');

            // Show the complete notification sequence (toast + logo)
            showStudyAidXInvisibleNotification(detectionResult);

        } else {
            console.log('ℹ️ StudyAidX Invisible extension not detected');
        }

    } catch (error) {
        console.error('❌ Error running StudyAidX Invisible detection after load:', error);
    }
}

// Make detection system functions globally accessible
window.initializeStudyAidXInvisibleDetection = initializeStudyAidXInvisibleDetection;
window.rerunStudyAidXInvisibleDetection = rerunStudyAidXInvisibleDetection;
window.runStudyAidXInvisibleDetectionAfterLoad = runStudyAidXInvisibleDetectionAfterLoad;
window.studyAidXInvisibleDetectionState = studyAidXInvisibleDetectionState;

// --- Firestore Key Validation Functions ---

// Helper function to update user key status in Firestore
async function updateUserKeyStatusInFirestore(userId, status) {
    if (!userId || !status) return; // Basic validation
    const db = firebase.firestore();
    const userStatusRef = db.collection("user_key_status").doc(userId);
    try {
        await userStatusRef.set(
            {
                keyType: status.keyType,
                expirationTime: status.expirationTime, // Store as epoch ms or null
                activatedKeyId: localStorage.getItem("activatedKeyId"), // Get the ID used for validation
                lastChecked: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
        ); // Use merge to avoid overwriting other potential fields
        // console.log(`Successfully updated key status in Firestore for user ${userId}:`, status); // Removed for security
    } catch (error) {
        console.error(
            `Error updating key status in Firestore for user ${userId}:`,
            error,
        );
        // Decide if we should alert the user or just log
    }
}

// Helper function to clear user key status in Firestore
async function clearUserKeyStatusInFirestore(userId) {
    if (!userId) return;
    const db = firebase.firestore();
    const userStatusRef = db.collection("user_key_status").doc(userId);
    try {
        // Set specific fields to null or delete the document
        await userStatusRef.update({
            keyType: null,
            expirationTime: null,
            activatedKeyId: null,
            lastChecked: firebase.firestore.FieldValue.serverTimestamp(),
        });
        // Or: await userStatusRef.delete();
        // console.log(`Successfully cleared key status in Firestore for user ${userId}`); // Removed for security
    } catch (error) {
        // If the document doesn't exist, update will throw an error. Catch it gracefully.
        if (error.code === "not-found") {
            // console.log(`No key status document found for user ${userId} to clear.`); // Removed for security
        } else {
            console.error(
                `Error clearing key status in Firestore for user ${userId}:`,
                error,
            );
        }
    }
}

// --- Simplified checkKeyValidity (localStorage only) ---
async function checkKeyValidity() {
    // console.log("Running simplified checkKeyValidity (localStorage only)..."); // Removed for security
    const storedKeyId = localStorage.getItem("activatedKeyId");
    const expirationTimeStr = localStorage.getItem("keyExpirationTime"); // Assume expiration is stored

    if (!storedKeyId) {
        // console.log("No activatedKeyId found in localStorage."); // Removed for security
        // Optionally clear other related localStorage items if needed
        // localStorage.removeItem('keyExpirationTime');
        return {
            isValid: false,
            keyType: null,
            expirationTime: null,
            reason: "No key activated locally.",
        };
    }

    // Check expiration if it exists in localStorage
    if (expirationTimeStr) {
        const expirationTime = parseInt(expirationTimeStr, 10);
        const now = Date.now();
        if (isNaN(expirationTime)) {
            // console.log(`Key ${storedKeyId} has an invalid expiration time format: ${expirationTimeStr}`); // Removed for security
            // Clear invalid key info
        } else if (now >= expirationTime) {
            // console.log(`Key ${storedKeyId} expired at ${new Date(expirationTime)}.`); // Removed for security
            // Clear expired key info
        }
        if (isNaN(expirationTime) || now >= expirationTime) {
            localStorage.removeItem("activatedKeyId");
            localStorage.removeItem("keyExpirationTime");
            // Potentially clear other related items
            return {
                isValid: false,
                keyType: null,
                expirationTime: expirationTime || null,
                reason: "Key expired or invalid expiration time.",
            };
        }
        // Key is valid and has an expiration time
        // console.log(`Key ${storedKeyId} is valid. Expires at: ${new Date(expirationTime)}`); // Removed for security
        // We don't know the original key type (PREMIUM/FREE) from localStorage alone,
        // so we might return a generic type or null.
        return {
            isValid: true,
            keyType: "LOCAL_VALID",
            expirationTime: expirationTime,
            reason: "Valid key found in localStorage.",
        };
    } else {
        // Key exists but no expiration time stored - assume it's valid indefinitely (or handle as needed)
        // console.log(`Key ${storedKeyId} found in localStorage with no expiration time.`); // Removed for security
        // Decide how to handle keys without expiration. Treat as valid permanent?
        return {
            isValid: true,
            keyType: "LOCAL_PERMANENT",
            expirationTime: null,
            reason: "Valid key (no expiration) found in localStorage.",
        };
    }
}
// --- Fast Key Authentication Helper Functions ---

// 🚀 OPTIMIZATION: Cache for Firebase readiness to avoid repeated checks
let firebaseReadyCache = null;
let firebaseReadyPromise = null;

// 🚀 OPTIMIZATION: Cache for DOM readiness
let domReadyCache = null;

/**
 * Waits for Firebase to be fully initialized and ready
 * 🚀 OPTIMIZATION: Cached with memoization to avoid repeated checks
 */
async function waitForFirebaseReady(maxWaitTime = 10000) {
    // Return cached result if available
    if (firebaseReadyCache !== null) {
        return firebaseReadyCache;
    }

    // Return existing promise if already in progress
    if (firebaseReadyPromise) {
        return firebaseReadyPromise;
    }

    // Create new promise and cache it
    firebaseReadyPromise = (async () => {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            try {
                // Quick checks first - most likely to fail fast
                if (typeof firebase === 'undefined' ||
                    !firebase.auth ||
                    !firebase.firestore ||
                    firebase.auth().currentUser === undefined) {
                    await new Promise(resolve => setTimeout(resolve, 50)); // Reduced from 100ms
                    continue;
                }

                firebaseReadyCache = true;
                return true;

            } catch (error) {
                await new Promise(resolve => setTimeout(resolve, 50)); // Reduced delay
            }
        }
        firebaseReadyCache = false;
        return false;
    })();

    const result = await firebaseReadyPromise;
    firebaseReadyPromise = null; // Clear promise after completion
    return result;
}

/**
 * Waits for DOM elements to be ready
 * 🚀 OPTIMIZATION: Reduced delays and improved timing
 */
async function waitForDOMReady(maxWaitTime = 3000) {
    // Return cached result if available
    if (domReadyCache !== null) {
        return domReadyCache;
    }

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
        const keySection = document.getElementById("keySection");
        const functionsSection = document.getElementById("functionsSection");

        if (keySection && functionsSection) {
            domReadyCache = true;
            return true;
        }

        await new Promise(resolve => setTimeout(resolve, 25)); // Reduced from 100ms to 25ms
    }
    domReadyCache = false;
    return false;
}

/**
 * Lightweight version of showFunctions for fast authentication
 * Shows the functions menu and hides the key input sections
 */
function showFunctionsForFastAuth() {
    // Try multiple times with delays to ensure DOM is ready
    const attemptShowFunctions = (attempt = 1, maxAttempts = 10) => {
        try {
            // Check if DOM elements exist
            const keySection = document.getElementById("keySection");
            const functionsSection = document.getElementById("functionsSection");

            if (!keySection || !functionsSection) {
                if (attempt < maxAttempts) {
                    setTimeout(() => attemptShowFunctions(attempt + 1, maxAttempts), attempt * 200);
                    return;
                } else {
                    // Fallback: try to call original showFunctions if available
                    setTimeout(() => {
                        if (typeof showFunctions === 'function') {
                            try {
                                showFunctions();
                            } catch (e) {
                                // Silent fallback failure
                            }
                        }
                    }, 1000);
                    return;
                }
            }

            // Hide key section
            keySection.style.display = "none";

            // Show functions section
            functionsSection.style.display = "block";

            // Enable all buttons and inputs in functions section
            const buttons = functionsSection.querySelectorAll("button");
            const inputs = functionsSection.querySelectorAll("input");

            buttons.forEach((button) => {
                button.disabled = false;
                button.onclick = null;
            });

            inputs.forEach((input) => {
                input.disabled = false;
            });

        } catch (error) {
            // Fallback: try to call original showFunctions if available
            setTimeout(() => {
                if (typeof showFunctions === 'function') {
                    try {
                        showFunctions();
                    } catch (fallbackError) {
                        // Silent fallback failure
                    }
                }
            }, 1000);
        }
    };

    // Start the attempt process
    attemptShowFunctions();
}

/**
 * Lightweight version of startKeyTimer for fast authentication
 */
function startKeyTimerForFastAuth() {
    try {
        if (typeof startKeyTimer === 'function') {
            startKeyTimer();
        }
    } catch (error) {
        // Silent error handling
    }
}

// --- Fast Key Authentication Functions ---

/**
 * Fast authentication core function that validates stored keys directly from Firebase
 * without UI simulation. Provides instant authentication for users with valid stored keys.
 *
 * @returns {Promise<{success: boolean, keyType: string|null, expirationTime: number|null, requiresManualAuth: boolean, errorReason: string|null}>}
 */
async function fastKeyAuthentication() {

    try {
        // 🚀 OPTIMIZATION: Parallel processing - chạy song song để tăng tốc
        const [firebaseReady, user, keySystemDisabled] = await Promise.all([
            waitForFirebaseReady(),
            Promise.resolve(firebase.auth().currentUser),
            Promise.resolve((() => {
                try {
                    return typeof isKeySystemDisabled === 'function' ? isKeySystemDisabled() : false;
                } catch (e) {
                    return false;
                }
            })())
        ]);

        if (!user) {
            return {
                success: false,
                keyType: null,
                expirationTime: null,
                requiresManualAuth: true,
                errorReason: "User not authenticated"
            };
        }

        if (keySystemDisabled) {
            return {
                success: false,
                keyType: null,
                expirationTime: null,
                requiresManualAuth: false,
                errorReason: "Key system disabled"
            };
        }

        // Get stored key data from localStorage
        let storedKeyId = localStorage.getItem("activatedKeyId");
        let storedKeyType = localStorage.getItem("keyType");

        // If no local key, try to get from Firestore
        if (!storedKeyId || !storedKeyType) {
            try {
                const db = firebase.firestore();
                const userStatusRef = db.collection("user_key_status").doc(user.uid);
                const userStatusDoc = await userStatusRef.get();

                if (userStatusDoc.exists) {
                    const firestoreData = userStatusDoc.data();
                    const now = Date.now();

                    // Check if Firestore key is still valid
                    if (firestoreData.activatedKeyId &&
                        (!firestoreData.expirationTime || now < firestoreData.expirationTime)) {

                        // Restore key to localStorage
                        storedKeyId = firestoreData.activatedKeyId;
                        storedKeyType = firestoreData.keyType.includes("PREMIUM") ? "PREMIUM" : "FREE";

                        localStorage.setItem("activatedKeyId", storedKeyId);
                        localStorage.setItem("keyType", storedKeyType);
                    }
                }
            } catch (error) {
                // Silent error handling
            }
        }

        if (!storedKeyId || !storedKeyType) {
            return {
                success: false,
                keyType: null,
                expirationTime: null,
                requiresManualAuth: true,
                errorReason: "No stored key found"
            };
        }

        // 🚀 OPTIMIZATION: Combine validation and activation in single operation
        const [validationResult, domReady] = await Promise.all([
            validateStoredKeyDirect(storedKeyId, storedKeyType, user),
            waitForDOMReady() // Prepare DOM while validating
        ]);

        if (!validationResult.isValid) {
            // Clear invalid key data
            clearInvalidKeyData();

            return {
                success: false,
                keyType: null,
                expirationTime: null,
                requiresManualAuth: true,
                errorReason: validationResult.reason
            };
        }

        // Directly activate the validated key (DOM already ready)
        const activationResult = await activateKeyDirect(storedKeyId, storedKeyType, validationResult.keyData, user);

        if (!activationResult.success) {
            return {
                success: false,
                keyType: null,
                expirationTime: null,
                requiresManualAuth: true,
                errorReason: activationResult.reason
            };
        }

        return {
            success: true,
            keyType: storedKeyType,
            expirationTime: activationResult.expirationTime,
            requiresManualAuth: false,
            errorReason: null
        };

    } catch (error) {
        // Handle specific error types
        if (error.message && error.message.includes('network')) {
            return {
                success: false,
                keyType: null,
                expirationTime: null,
                requiresManualAuth: true,
                errorReason: "Network error - please check connection"
            };
        }

        if (error.code === 'unavailable') {
            return {
                success: false,
                keyType: null,
                expirationTime: null,
                requiresManualAuth: true,
                errorReason: "Database temporarily unavailable"
            };
        }

        return {
            success: false,
            keyType: null,
            expirationTime: null,
            requiresManualAuth: true,
            errorReason: `Unexpected error: ${error.message}`
        };
    }
}

/**
 * Validates a stored key directly from Firebase without UI interaction
 *
 * @param {string} keyId - The key identifier
 * @param {string} keyType - The key type ("FREE" or "PREMIUM")
 * @param {Object} user - Firebase user object
 * @returns {Promise<{isValid: boolean, keyData: object|null, reason: string, expirationTime: number|null}>}
 */
async function validateStoredKeyDirect(keyId, keyType, user) {
    try {
        const db = firebase.firestore();
        let keyRef, keyDoc, keyData;

        if (keyType === "FREE") {
            keyRef = db.collection("free_keys").doc(keyId);
            keyDoc = await keyRef.get();

            if (!keyDoc.exists) {
                return { isValid: false, keyData: null, reason: "Free key not found", expirationTime: null };
            }

            keyData = keyDoc.data();

            // Check if key is global or belongs to user
            if (keyData.isGlobal !== true && keyData.createdFor !== user.email) {
                return { isValid: false, keyData: null, reason: "Free key not created for this user", expirationTime: null };
            }

            // Check if key is used by another user (for non-global keys)
            if (keyData.isGlobal !== true && keyData.isUsed && keyData.usedBy && keyData.usedBy !== user.email) {
                return { isValid: false, keyData: null, reason: "Free key used by another user", expirationTime: null };
            }

            // Check expiration
            const expirationTime = keyData.expirationDate ? keyData.expirationDate.toDate().getTime() : null;
            if (expirationTime && Date.now() > expirationTime) {
                return { isValid: false, keyData: null, reason: "Free key expired", expirationTime };
            }

            return { isValid: true, keyData, reason: "Valid free key", expirationTime };

        } else if (keyType === "PREMIUM") {
            keyRef = db.collection("premium_keys").doc(keyId);
            keyDoc = await keyRef.get();

            if (!keyDoc.exists) {
                return { isValid: false, keyData: null, reason: "Premium key not found", expirationTime: null };
            }

            keyData = keyDoc.data();

            // Check if key is activated by another user (for non-global keys)
            if (keyData.isGlobal !== true && keyData.activatedBy && keyData.activatedBy !== user.email) {
                return { isValid: false, keyData: null, reason: "Premium key activated by another user", expirationTime: null };
            }

            // Check if key is user-specific
            if (keyData.isGlobal !== true && keyData.user && keyData.user !== user.email) {
                return { isValid: false, keyData: null, reason: "Premium key assigned to another user", expirationTime: null };
            }

            // Calculate expiration time for non-permanent keys
            let expirationTime = null;
            if (keyData.type !== "permanent" && keyData.activatedAt && keyData.duration) {
                const activatedAtMs = keyData.activatedAt.toDate().getTime();
                const durationMs = keyData.duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
                expirationTime = activatedAtMs + durationMs;

                if (Date.now() > expirationTime) {
                    return { isValid: false, keyData: null, reason: "Premium key expired", expirationTime };
                }
            }

            return { isValid: true, keyData, reason: "Valid premium key", expirationTime };

        } else {
            return { isValid: false, keyData: null, reason: "Unknown key type", expirationTime: null };
        }

    } catch (error) {
        console.error("Error validating stored key:", error);
        return { isValid: false, keyData: null, reason: `Validation error: ${error.message}`, expirationTime: null };
    }
}

/**
 * Directly activates a validated key without UI simulation
 *
 * @param {string} keyId - The key identifier
 * @param {string} keyType - The key type ("FREE" or "PREMIUM")
 * @param {Object} keyData - The validated key data from Firebase
 * @param {Object} user - Firebase user object
 * @returns {Promise<{success: boolean, expirationTime: number|null, reason: string}>}
 */
async function activateKeyDirect(keyId, keyType, keyData, user) {
    try {
        if (keyType === "FREE") {
            return await activateFreeKeyDirect(keyId, keyData, user);
        } else if (keyType === "PREMIUM") {
            return await activatePremiumKeyDirect(keyId, keyData, user);
        } else {
            return { success: false, expirationTime: null, reason: "Unknown key type for activation" };
        }
    } catch (error) {
        console.error("Error in direct key activation:", error);
        return { success: false, expirationTime: null, reason: `Activation error: ${error.message}` };
    }
}

/**
 * Directly activates a Free key without UI simulation
 */
async function activateFreeKeyDirect(keyId, keyData, user) {
    try {
        const db = firebase.firestore();
        const keyRef = db.collection("free_keys").doc(keyId);

        let usedAtTimestamp = null;

        // Update key usage if not already used or used by this user
        if (!keyData.isUsed || (keyData.isGlobal !== true && keyData.usedBy === user.email)) {
            await db.runTransaction(async (transaction) => {
                const updateData = {
                    isUsed: true,
                    usedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    usedBy: user.email
                };
                transaction.update(keyRef, updateData);
            });

            // Fetch the actual timestamp
            const updatedKeyDoc = await keyRef.get();
            const updatedKeyData = updatedKeyDoc.data();
            if (updatedKeyData.usedAt && updatedKeyData.usedAt.toDate) {
                usedAtTimestamp = updatedKeyData.usedAt.toDate().getTime();
            } else {
                usedAtTimestamp = Date.now();
            }
        } else {
            // Key already used, get existing timestamp
            if (keyData.usedAt && keyData.usedAt.toDate) {
                usedAtTimestamp = keyData.usedAt.toDate().getTime();
            } else {
                usedAtTimestamp = Date.now();
            }
        }

        // Set up Free key activation
        const freeKeyDurationMs = 30 * 60 * 1000; // 30 minutes
        const expirationTime = usedAtTimestamp + freeKeyDurationMs;

        // Update global state
        activeKey = "FREE";
        keyExpirationTime = expirationTime;

        // Update localStorage
        localStorage.setItem("activeKey", "FREE");
        localStorage.setItem("activatedKeyId", keyId);
        localStorage.setItem("keyType", "FREE");
        localStorage.setItem(`freeKeyUsedAt_${keyId}`, usedAtTimestamp.toString());
        localStorage.setItem(`freeKeyDuration_${keyId}`, freeKeyDurationMs.toString());
        localStorage.removeItem("keyExpirationTime");

        // Update Firestore user status
        await updateUserKeyStatusInFirestore(user.uid, {
            keyType: "FREE",
            expirationTime: expirationTime
        });

        // Wait for DOM to be ready before showing functions
        await waitForDOMReady();

        // Show functions and start timer
        showFunctionsForFastAuth();
        startKeyTimerForFastAuth();

        return { success: true, expirationTime, reason: "Free key activated successfully" };

    } catch (error) {
        return { success: false, expirationTime: null, reason: `Free key activation failed: ${error.message}` };
    }
}

/**
 * Directly activates a Premium key without UI simulation
 */
async function activatePremiumKeyDirect(keyId, keyData, user) {
    try {
        const db = firebase.firestore();
        const keyRef = db.collection("premium_keys").doc(keyId);

        let activationTimestamp = null;
        let needsTimestampFetch = false;

        // Handle key activation if not already activated
        if (keyData.isActivated === false) {
            await db.runTransaction(async (transaction) => {
                const updateData = {
                    isActivated: true,
                    activatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Only add activatedBy if the key is NOT global
                if (keyData.isGlobal !== true) {
                    updateData.activatedBy = user.email;
                }

                transaction.update(keyRef, updateData);
            });

            needsTimestampFetch = true;
        } else {
            // Key already activated, get existing timestamp
            if (keyData.activatedAt && keyData.activatedAt.toDate) {
                activationTimestamp = keyData.activatedAt.toDate().getTime();
            }
        }

        // Fetch timestamp if needed
        if (needsTimestampFetch) {
            const updatedKeyDoc = await keyRef.get();
            const updatedKeyData = updatedKeyDoc.data();
            if (updatedKeyData.activatedAt && updatedKeyData.activatedAt.toDate) {
                activationTimestamp = updatedKeyData.activatedAt.toDate().getTime();
            } else {
                activationTimestamp = Date.now();
            }
        }

        // Determine key type and expiration
        let keyTypeStr = keyData.type ? `PREMIUM_${keyData.type.toUpperCase()}` : "PREMIUM_UNKNOWN";
        if (keyData.type === "permanent") {
            keyTypeStr = "PREMIUM_PERMANENT";
        }

        let expirationTime = null;
        if (keyData.type !== "permanent" && keyData.duration) {
            const durationMs = keyData.duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
            expirationTime = activationTimestamp + durationMs;
        }

        // Update global state
        activeKey = keyTypeStr;
        keyExpirationTime = expirationTime;

        // Update localStorage
        localStorage.setItem("activeKey", keyTypeStr);
        localStorage.setItem("activatedKeyId", keyId);
        localStorage.setItem("keyType", "PREMIUM");
        localStorage.setItem(`keyDuration_${keyId}`, keyData.duration ? keyData.duration.toString() : "0");
        localStorage.setItem(`isGlobal_${keyId}`, (keyData.isGlobal === true).toString());

        if (keyData.type !== "permanent") {
            localStorage.setItem("keyDuration", keyData.duration.toString());
            localStorage.setItem("keyActivatedAt", activationTimestamp.toString());
        } else {
            localStorage.removeItem("keyDuration");
            localStorage.removeItem("keyActivatedAt");
        }

        // Update Firestore user status
        await updateUserKeyStatusInFirestore(user.uid, {
            keyType: keyTypeStr,
            expirationTime: expirationTime
        });

        // Show functions and start timer if needed
        showFunctionsForFastAuth();
        if (expirationTime) {
            startKeyTimerForFastAuth();
        }

        return { success: true, expirationTime, reason: "Premium key activated successfully" };

    } catch (error) {
        return { success: false, expirationTime: null, reason: `Premium key activation failed: ${error.message}` };
    }
}

/**
 * Clears invalid key data from localStorage when validation fails
 */
function clearInvalidKeyData() {
    const keyId = localStorage.getItem("activatedKeyId");

    // Clear main key data
    localStorage.removeItem("activatedKeyId");
    localStorage.removeItem("keyType");
    localStorage.removeItem("activeKey");
    localStorage.removeItem("keyExpirationTime");
    localStorage.removeItem("keyDuration");
    localStorage.removeItem("keyActivatedAt");

    // Clear key-specific data if keyId exists
    if (keyId) {
        localStorage.removeItem(`freeKeyUsedAt_${keyId}`);
        localStorage.removeItem(`freeKeyDuration_${keyId}`);
        localStorage.removeItem(`keyDuration_${keyId}`);
        localStorage.removeItem(`isGlobal_${keyId}`);
    }

    // Reset global state
    activeKey = null;
    keyExpirationTime = null;
}

// --- Expose Functions to Global Scope for Testing ---
window.fastKeyAuthentication = fastKeyAuthentication;
window.validateStoredKeyDirect = validateStoredKeyDirect;
window.activateKeyDirect = activateKeyDirect;
window.clearInvalidKeyData = clearInvalidKeyData;

// --- Fast Key Authentication Testing and Validation ---

/**
 * Performance testing utility for fast key authentication
 * Tests authentication speed and validates functionality
 */
async function testFastKeyAuthenticationPerformance() {
    console.log("🧪 Starting Fast Key Authentication Performance Tests...");

    const testResults = {
        timestamp: new Date().toISOString(),
        tests: [],
        summary: {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            averageAuthTime: 0,
            fastAuthSuccessRate: 0
        }
    };

    // Test 1: Performance with valid Free key
    try {
        console.log("Test 1: Valid Free Key Performance");
        const freeKeyTestStart = performance.now();

        // Mock a valid free key in localStorage
        const testFreeKeyId = "test-free-key-" + Date.now();
        localStorage.setItem("activatedKeyId", testFreeKeyId);
        localStorage.setItem("keyType", "FREE");

        const freeKeyResult = await fastKeyAuthentication();
        const freeKeyTestEnd = performance.now();
        const freeKeyDuration = freeKeyTestEnd - freeKeyTestStart;

        const freeKeyTest = {
            name: "Valid Free Key Performance",
            duration: freeKeyDuration,
            success: freeKeyResult.success,
            target: "< 1000ms",
            passed: freeKeyDuration < 1000,
            result: freeKeyResult,
            notes: freeKeyDuration < 1000 ? "✅ Sub-1-second performance achieved" : "❌ Performance target not met"
        };

        testResults.tests.push(freeKeyTest);
        console.log(`Test 1 Result: ${freeKeyDuration.toFixed(2)}ms - ${freeKeyTest.passed ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
        testResults.tests.push({
            name: "Valid Free Key Performance",
            duration: null,
            success: false,
            passed: false,
            error: error.message,
            notes: "❌ Test failed with error"
        });
        console.error("Test 1 Failed:", error);
    }

    // Test 2: Performance with valid Premium key
    try {
        console.log("Test 2: Valid Premium Key Performance");
        const premiumKeyTestStart = performance.now();

        // Mock a valid premium key in localStorage
        const testPremiumKeyId = "test-premium-key-" + Date.now();
        localStorage.setItem("activatedKeyId", testPremiumKeyId);
        localStorage.setItem("keyType", "PREMIUM");

        const premiumKeyResult = await fastKeyAuthentication();
        const premiumKeyTestEnd = performance.now();
        const premiumKeyDuration = premiumKeyTestEnd - premiumKeyTestStart;

        const premiumKeyTest = {
            name: "Valid Premium Key Performance",
            duration: premiumKeyDuration,
            success: premiumKeyResult.success,
            target: "< 1000ms",
            passed: premiumKeyDuration < 1000,
            result: premiumKeyResult,
            notes: premiumKeyDuration < 1000 ? "✅ Sub-1-second performance achieved" : "❌ Performance target not met"
        };

        testResults.tests.push(premiumKeyTest);
        console.log(`Test 2 Result: ${premiumKeyDuration.toFixed(2)}ms - ${premiumKeyTest.passed ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
        testResults.tests.push({
            name: "Valid Premium Key Performance",
            duration: null,
            success: false,
            passed: false,
            error: error.message,
            notes: "❌ Test failed with error"
        });
        console.error("Test 2 Failed:", error);
    }

    // Test 3: Fallback behavior with expired key
    try {
        console.log("Test 3: Expired Key Fallback Behavior");
        const expiredKeyTestStart = performance.now();

        // Mock an expired key
        localStorage.setItem("activatedKeyId", "expired-key-test");
        localStorage.setItem("keyType", "FREE");
        localStorage.setItem("keyExpirationTime", (Date.now() - 60000).toString()); // 1 minute ago

        const expiredKeyResult = await fastKeyAuthentication();
        const expiredKeyTestEnd = performance.now();
        const expiredKeyDuration = expiredKeyTestEnd - expiredKeyTestStart;

        const expiredKeyTest = {
            name: "Expired Key Fallback Behavior",
            duration: expiredKeyDuration,
            success: expiredKeyResult.success,
            requiresManualAuth: expiredKeyResult.requiresManualAuth,
            passed: !expiredKeyResult.success && expiredKeyResult.requiresManualAuth,
            result: expiredKeyResult,
            notes: expiredKeyTest.passed ? "✅ Proper fallback to manual auth" : "❌ Fallback behavior incorrect"
        };

        testResults.tests.push(expiredKeyTest);
        console.log(`Test 3 Result: ${expiredKeyDuration.toFixed(2)}ms - ${expiredKeyTest.passed ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
        testResults.tests.push({
            name: "Expired Key Fallback Behavior",
            duration: null,
            success: false,
            passed: false,
            error: error.message,
            notes: "❌ Test failed with error"
        });
        console.error("Test 3 Failed:", error);
    }

    // Test 4: Invalid key cleanup
    try {
        console.log("Test 4: Invalid Key Data Cleanup");
        const cleanupTestStart = performance.now();

        // Mock invalid key data
        localStorage.setItem("activatedKeyId", "invalid-key-format-123!@#");
        localStorage.setItem("keyType", "INVALID_TYPE");

        const invalidKeyResult = await fastKeyAuthentication();
        const cleanupTestEnd = performance.now();
        const cleanupDuration = cleanupTestEnd - cleanupTestStart;

        // Check if invalid data was cleaned up
        const keyIdAfterTest = localStorage.getItem("activatedKeyId");
        const keyTypeAfterTest = localStorage.getItem("keyType");

        const cleanupTest = {
            name: "Invalid Key Data Cleanup",
            duration: cleanupDuration,
            success: invalidKeyResult.success,
            dataCleanedUp: !keyIdAfterTest && !keyTypeAfterTest,
            passed: !invalidKeyResult.success && !keyIdAfterTest && !keyTypeAfterTest,
            result: invalidKeyResult,
            notes: cleanupTest.passed ? "✅ Invalid data properly cleaned up" : "❌ Cleanup failed"
        };

        testResults.tests.push(cleanupTest);
        console.log(`Test 4 Result: ${cleanupDuration.toFixed(2)}ms - ${cleanupTest.passed ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
        testResults.tests.push({
            name: "Invalid Key Data Cleanup",
            duration: null,
            success: false,
            passed: false,
            error: error.message,
            notes: "❌ Test failed with error"
        });
        console.error("Test 4 Failed:", error);
    }

    // Calculate summary statistics
    testResults.summary.totalTests = testResults.tests.length;
    testResults.summary.passedTests = testResults.tests.filter(test => test.passed).length;
    testResults.summary.failedTests = testResults.summary.totalTests - testResults.summary.passedTests;

    const validDurations = testResults.tests.filter(test => test.duration !== null).map(test => test.duration);
    testResults.summary.averageAuthTime = validDurations.length > 0
        ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length
        : 0;

    testResults.summary.fastAuthSuccessRate = testResults.summary.totalTests > 0
        ? (testResults.summary.passedTests / testResults.summary.totalTests) * 100
        : 0;

    // Clean up test data
    localStorage.removeItem("activatedKeyId");
    localStorage.removeItem("keyType");
    localStorage.removeItem("keyExpirationTime");

    // Log comprehensive results
    console.log("🧪 Fast Key Authentication Performance Test Results:");
    console.log(`📊 Total Tests: ${testResults.summary.totalTests}`);
    console.log(`✅ Passed: ${testResults.summary.passedTests}`);
    console.log(`❌ Failed: ${testResults.summary.failedTests}`);
    console.log(`⚡ Average Auth Time: ${testResults.summary.averageAuthTime.toFixed(2)}ms`);
    console.log(`📈 Success Rate: ${testResults.summary.fastAuthSuccessRate.toFixed(1)}%`);

    // Performance validation
    const performanceTarget = 1000; // 1 second
    const performanceMet = testResults.summary.averageAuthTime < performanceTarget;

    console.log(`🎯 Performance Target (<${performanceTarget}ms): ${performanceMet ? '✅ MET' : '❌ NOT MET'}`);

    if (performanceMet) {
        console.log("🚀 Fast Key Authentication system is performing optimally!");
    } else {
        console.warn("⚠️ Performance optimization may be needed");
    }

    return testResults;
}

/**
 * Validates that all existing functionality is preserved
 */
function validateExistingFunctionality() {
    console.log("🔍 Validating Existing Functionality Preservation...");

    const validationResults = {
        timestamp: new Date().toISOString(),
        checks: [],
        allFunctionalityPreserved: true
    };

    // Check 1: Core functions exist
    const coreFunctions = [
        'fastKeyAuthentication',
        'validateStoredKeyDirect',
        'activateKeyDirect',
        'activateFreeKeyDirect',
        'activatePremiumKeyDirect',
        'clearInvalidKeyData',
        'updateUserKeyStatusInFirestore',
        'clearUserKeyStatusInFirestore'
    ];

    coreFunctions.forEach(funcName => {
        const exists = typeof window[funcName] === 'function' || typeof eval(funcName) === 'function';
        validationResults.checks.push({
            name: `Function ${funcName} exists`,
            passed: exists,
            notes: exists ? "✅ Function available" : "❌ Function missing"
        });
        if (!exists) validationResults.allFunctionalityPreserved = false;
    });

    // Check 2: Original activation functions still exist
    const originalFunctions = ['activateFreeKey', 'activatePremiumKey'];
    originalFunctions.forEach(funcName => {
        const exists = typeof window[funcName] === 'function' || typeof eval(funcName) === 'function';
        validationResults.checks.push({
            name: `Original ${funcName} preserved`,
            passed: exists,
            notes: exists ? "✅ Original function preserved" : "❌ Original function missing"
        });
        if (!exists) validationResults.allFunctionalityPreserved = false;
    });

    // Check 3: UI elements still functional
    const uiElements = ['freeKeyInput', 'premiumKeyInput', 'activateFreeKeyButton', 'activatePremiumKeyButton'];
    uiElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        const exists = element !== null;
        validationResults.checks.push({
            name: `UI element ${elementId} exists`,
            passed: exists,
            notes: exists ? "✅ UI element available" : "⚠️ UI element not found (may be normal if not loaded)"
        });
    });

    console.log("🔍 Functionality Validation Results:");
    validationResults.checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}: ${check.notes}`);
    });

    console.log(`🎯 All Functionality Preserved: ${validationResults.allFunctionalityPreserved ? '✅ YES' : '❌ NO'}`);

    return validationResults;
}

/**
 * Comprehensive system health check
 */
async function performSystemHealthCheck() {
    console.log("🏥 Performing Fast Key Authentication System Health Check...");

    const healthCheck = {
        timestamp: new Date().toISOString(),
        systemStatus: "unknown",
        components: {},
        recommendations: []
    };

    try {
        // Check Firebase connection
        const user = firebase.auth().currentUser;
        healthCheck.components.firebase = {
            status: user ? "connected" : "not_authenticated",
            user: user ? user.email : null
        };

        // Check localStorage availability
        try {
            localStorage.setItem("health_check_test", "test");
            localStorage.removeItem("health_check_test");
            healthCheck.components.localStorage = { status: "available" };
        } catch (e) {
            healthCheck.components.localStorage = { status: "unavailable", error: e.message };
        }

        // Check key system status
        healthCheck.components.keySystem = {
            status: isKeySystemDisabled() ? "disabled" : "enabled"
        };

        // Run performance test
        const performanceResults = await testFastKeyAuthenticationPerformance();
        healthCheck.components.performance = {
            averageTime: performanceResults.summary.averageAuthTime,
            successRate: performanceResults.summary.fastAuthSuccessRate,
            status: performanceResults.summary.averageAuthTime < 1000 ? "optimal" : "needs_optimization"
        };

        // Run functionality validation
        const functionalityResults = validateExistingFunctionality();
        healthCheck.components.functionality = {
            preserved: functionalityResults.allFunctionalityPreserved,
            status: functionalityResults.allFunctionalityPreserved ? "intact" : "compromised"
        };

        // Determine overall system status
        const criticalIssues = Object.values(healthCheck.components).filter(component =>
            component.status === "unavailable" || component.status === "compromised"
        );

        if (criticalIssues.length === 0) {
            healthCheck.systemStatus = "healthy";
        } else if (criticalIssues.length <= 1) {
            healthCheck.systemStatus = "warning";
        } else {
            healthCheck.systemStatus = "critical";
        }

        // Generate recommendations
        if (healthCheck.components.performance.status === "needs_optimization") {
            healthCheck.recommendations.push("Consider optimizing network calls or adding caching");
        }

        if (healthCheck.components.localStorage.status === "unavailable") {
            healthCheck.recommendations.push("localStorage is not available - key persistence will not work");
        }

        if (healthCheck.components.keySystem.status === "disabled") {
            healthCheck.recommendations.push("Key system is currently disabled");
        }

        console.log("🏥 System Health Check Results:");
        console.log(`🎯 Overall Status: ${healthCheck.systemStatus.toUpperCase()}`);
        console.log(`🔥 Firebase: ${healthCheck.components.firebase.status}`);
        console.log(`💾 LocalStorage: ${healthCheck.components.localStorage.status}`);
        console.log(`🔑 Key System: ${healthCheck.components.keySystem.status}`);
        console.log(`⚡ Performance: ${healthCheck.components.performance.status} (${healthCheck.components.performance.averageTime.toFixed(2)}ms avg)`);
        console.log(`🛠️ Functionality: ${healthCheck.components.functionality.status}`);

        if (healthCheck.recommendations.length > 0) {
            console.log("💡 Recommendations:");
            healthCheck.recommendations.forEach(rec => console.log(`   • ${rec}`));
        }

    } catch (error) {
        console.error("Health check failed:", error);
        healthCheck.systemStatus = "error";
        healthCheck.error = error.message;
    }

    return healthCheck;
}

// --- Convenient Test Runner ---

/**
 * Runs all fast key authentication tests and validations
 * Can be called from browser console for manual testing
 */
window.runFastKeyAuthTests = async function () {
    console.log("🚀 Running Complete Fast Key Authentication Test Suite...");

    try {
        // Run performance tests
        const performanceResults = await testFastKeyAuthenticationPerformance();

        // Run functionality validation
        const functionalityResults = validateExistingFunctionality();

        // Run system health check
        const healthResults = await performSystemHealthCheck();

        // Generate comprehensive report
        const report = {
            timestamp: new Date().toISOString(),
            performance: performanceResults,
            functionality: functionalityResults,
            health: healthResults,
            overallStatus: "unknown"
        };

        // Determine overall status
        const performanceGood = performanceResults.summary.averageAuthTime < 1000;
        const functionalityGood = functionalityResults.allFunctionalityPreserved;
        const healthGood = healthResults.systemStatus === "healthy";

        if (performanceGood && functionalityGood && healthGood) {
            report.overallStatus = "excellent";
        } else if (performanceGood && functionalityGood) {
            report.overallStatus = "good";
        } else if (performanceGood || functionalityGood) {
            report.overallStatus = "fair";
        } else {
            report.overallStatus = "needs_attention";
        }

        console.log("📋 COMPREHENSIVE TEST REPORT:");
        console.log(`🎯 Overall Status: ${report.overallStatus.toUpperCase()}`);
        console.log(`⚡ Performance: ${performanceGood ? '✅ EXCELLENT' : '❌ NEEDS WORK'} (${performanceResults.summary.averageAuthTime.toFixed(2)}ms avg)`);
        console.log(`🛠️ Functionality: ${functionalityGood ? '✅ PRESERVED' : '❌ COMPROMISED'}`);
        console.log(`🏥 System Health: ${healthGood ? '✅ HEALTHY' : '⚠️ ' + healthResults.systemStatus.toUpperCase()}`);

        if (report.overallStatus === "excellent") {
            console.log("🎉 Fast Key Authentication system is performing excellently!");
            console.log("✨ All performance targets met, functionality preserved, system healthy");
        } else {
            console.log("💡 Areas for improvement identified - check detailed logs above");
        }

        return report;

    } catch (error) {
        console.error("❌ Test suite failed:", error);
        return { error: error.message, timestamp: new Date().toISOString() };
    }
};

// Auto-run tests in development mode (can be disabled in production)
if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
    console.log("🔧 Development mode detected - Fast Key Auth tests available via runFastKeyAuthTests()");
}

// --- End Fast Key Authentication Testing and Validation ---

// --- End Fast Key Authentication Functions ---

// --- End Firestore Key Validation Functions ---

// Add styles for version selector
const versionSelectorStyle = document.createElement("style");
versionSelectorStyle.textContent = `
                                /* Style for checkbox and label alignment */
                                input[type="checkbox"] + label {
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 8px;
                                    cursor: pointer;
                                }

                                input[type="checkbox"] {
                                    margin: 0;
                                }
                                .studyaidx-version-selector {
                                    position: absolute;
                                    top: 100%;
                                    left: 0;
                                    background: #ffffff;
                                    border-radius: 12px;
                                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                                    padding: 15px;
                                    width: 220px;
                                    display: none;
                                    z-index: 10001;
                                    opacity: 0;
                                    transform: translateY(-10px);
                                    transition: opacity 0.3s, transform 0.3s;
                                }

                                .version-option {
                                    padding: 12px 16px;
                                    margin: 6px 0;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                    display: flex;
                                    align-items: center;
                                }

                                .version-option:hover {
                                    background: rgba(0,0,0,0.05);
                                    transform: translateY(-1px);
                                }

                                .version-option.active {
                                    background: #f5f5f7;
                                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                                }

                                .version-icon {
                                    width: 24px;
                                    height: 24px;
                                    margin-right: 12px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 16px;
                                }

                                .version-label {
                                    font-size: 15px;
                                    font-weight: 500;
                                    color: #1d1d1f;
                                }

                                .version-description {
                                    font-size: 12px;
                                    color: #86868b;
                                    margin-top: 4px;
                                }

                                .logo-container {
                                    position: relative;
                                    cursor: pointer;
                                }

                                .logo-container:hover .studyaidx-version-selector {
                                    display: block;
                                    opacity: 1;
                                    transform: translateY(0);
                                }

                                /* Login Popup Styles - Enhanced with Animations */
                                @keyframes fadeIn {
                                    from { opacity: 0; }
                                    to { opacity: 1; }
                                }

                                @keyframes scaleIn {
                                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                                }

                                @keyframes blurIn {
                                    0% { backdrop-filter: blur(0px); }
                                    100% { backdrop-filter: blur(8px); }
                                }

                                @keyframes logoFloat {
                                    0% { transform: translateY(0); }
                                    50% { transform: translateY(-10px); }
                                    100% { transform: translateY(0); }
                                }

                                @keyframes buttonGlow {
                                    0% { box-shadow: 0 4px 8px rgba(0, 123, 255, 0.1); }
                                    50% { box-shadow: 0 8px 16px rgba(0, 123, 255, 0.3); }
                                    100% { box-shadow: 0 4px 8px rgba(0, 123, 255, 0.1); }
                                }

                                #loginPopupCloseBtn {
                                    position: absolute;
                                    top: 15px;
                                    right: 15px;
                                    background: none;
                                    border: none;
                                    font-size: 24px;
                                    font-weight: bold;
                                    color: #aaa;
                                    cursor: pointer;
                                    line-height: 1;
                                    padding: 0;
                                    transition: all 0.3s ease;
                                    z-index: 1;
                                }

                                #loginPopupCloseBtn:hover {
                                    color: #333;
                                    transform: rotate(90deg);
                                }

                                #loginBackdrop {
                                    position: fixed;
                                    top: 0;
                                    left: 0;
                                    width: 100%;
                                    height: 100%;
                                    background-color: rgba(0, 0, 0, 0.6);
                                    backdrop-filter: blur(0px);
                                    z-index: 10002; /* Above other elements but below popup */
                                    display: none; /* Hidden by default */
                                    opacity: 0;
                                    transition: opacity 0.5s ease;
                                    animation: blurIn 0.8s ease forwards;
                                }

                                #loginPopup {
                                    position: fixed;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%) scale(0.9);
                                    background-color: white;
                                    padding: 40px;
                                    border-radius: 24px;
                                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
                                    z-index: 10003; /* Above backdrop */
                                    display: none; /* Hidden by default */
                                    text-align: center;
                                    width: 350px;
                                    max-width: 90%;
                                    opacity: 0;
                                    overflow: hidden;
                                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                                                box-shadow 0.4s ease,
                                                opacity 0.4s ease;
                                }

                                #loginPopup.active {
                                    animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                                }

                                #loginPopup::before {
                                    content: '';
                                    position: absolute;
                                    top: -10px;
                                    left: -10px;
                                    right: -10px;
                                    bottom: -10px;
                                    background: linear-gradient(45deg, rgba(0,123,255,0.05), rgba(0,123,255,0));
                                    z-index: -1;
                                    border-radius: 24px;
                                    animation: fadeIn 1s ease forwards;
                                }

                                #loginPopup h2 {
                                    margin-top: 0;
                                    margin-bottom: 15px;
                                    font-size: 28px;
                                    color: #1d1d1f;
                                    font-weight: 600;
                                    transition: all 0.4s ease;
                                    transform: translateY(20px);
                                    opacity: 0;
                                    animation: fadeIn 0.6s ease forwards 0.2s;
                                }

                                #loginPopup p {
                                    margin-bottom: 25px;
                                    color: #555;
                                    font-size: 16px;
                                    line-height: 1.6;
                                    transition: all 0.4s ease;
                                    transform: translateY(20px);
                                    opacity: 0;
                                    animation: fadeIn 0.6s ease forwards 0.4s;
                                }

                                #loginPopup .google-signin-button {
                                    display: inline-flex;
                                    align-items: center;
                                    justify-content: center;
                                    padding: 14px 28px;
                                    border: none;
                                    border-radius: 12px;
                                    background: linear-gradient(135deg, #4285f4, #0d6efd);
                                    color: white;
                                    font-size: 16px;
                                    font-weight: 500;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    text-decoration: none;
                                    margin-bottom: 30px; /* Space before logo */
                                    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
                                    transform: translateY(20px);
                                    opacity: 0;
                                    animation: fadeIn 0.6s ease forwards 0.6s, buttonGlow 3s infinite 2s;
                                }

                                #loginPopup .google-signin-button:hover {
                                    transform: translateY(-3px);
                                    box-shadow: 0 8px 16px rgba(0, 123, 255, 0.3);
                                    background: linear-gradient(135deg, #5c9ce6, #1a7bff);
                                }

                                #loginPopup .google-signin-button:active {
                                    transform: translateY(-1px);
                                    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
                                }

                                #loginPopup .google-signin-button img {
                                    width: 22px;
                                    height: 22px;
                                    margin-right: 12px;
                                    filter: brightness(0) invert(1);
                                }

                                #loginPopup .popup-logo {
                                    display: block; /* Center the logo */
                                    width: 80px; /* Larger size */
                                    height: auto;
                                    margin: 25px auto 0; /* Add top margin and center horizontally */
                                    opacity: 0;
                                    transform: translateY(20px);
                                    animation: fadeIn 0.6s ease forwards 0.8s, logoFloat 4s ease-in-out infinite 2s;
                                    transition: all 0.4s ease;
                                }

                                /* Class to add to body when popup is active */
                                body.login-popup-active > *:not(#loginPopup):not(#loginBackdrop) {
                                filter: blur(4px);
                                transition: filter 0.5s ease;
                                }

                                #studyAidAssistantMenu {
                                    position: fixed;
                                    top: 10px; /* Add some space from the top */
                                    right: 10px; /* Add some space from the right */
                                    width: 450px;
                                    height: calc(100vh - 20px); /* Adjust height to account for top/bottom space */
                                    background: #f9f9f9; /* Slightly off-white background */
                                    color: #333;
                                    box-shadow: 0 8px 25px rgba(0,0,0,0.15); /* Refined shadow */
                                    z-index: 10000;
                                    display: flex;
                                    flex-direction: column;
                                    box-sizing: border-box;
                                    font-family: 'Poppins', sans-serif;
                                    border-radius: 12px; /* Apply rounded corners */
                                    overflow: hidden;
                                }

                                #assistantHeader {
                                    background: var(--primary-gradient);
                                    color: white;
                                    padding: 15px 20px; /* Adjust padding */
                                    font-weight: 600;
                                    font-size: 1.1rem;
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border */
                                    /* The border-radius is handled by the parent container's overflow: hidden */
                                }

                                .header-title {
                                    font-weight: 600;
                                    font-size: 16px;
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    letter-spacing: 0;
                                }

                                .header-title img {
                                    height: 24px;
                                    width: auto;
                                    border-radius: 6px;
                                    box-shadow: none;
                                }

                                .header-buttons {
                                    display: flex;
                                    align-items: center;
                                }

                                .control-buttons {
                                    display: flex;
                                    gap: 8px;
                                }

                                .control-button {
                                    background: none;
                                    border: none;
                                    color: white;
                                    font-size: 16px;
                                    cursor: pointer;
                                    width: 25px;
                                    height: 25px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    border-radius: 4px;
                                    transition: all 0.2s ease;
                                }

                                .control-button:hover {
                                    background: rgba(255, 255, 255, 0.2);
                                }

                                .control-button:active {
                                    background: rgba(255, 255, 255, 0.3);
                                    transform: scale(0.95);
                                }

                                .assistant-content {
                                    flex: 1;
                                    display: flex;
                                    overflow: hidden;
                                }

                                .sidebar {
                                    width: 60px;
                                    background: var(--secondary-gradient);
                                    height: 100%;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    padding-top: 20px;
                                    border-right: 1px solid rgba(0, 0, 0, 0.05); /* Add subtle separator */
                                }

                                .sidebar-button {
                                    width: 36px; /* Slightly smaller */
                                    height: 36px; /* Slightly smaller */
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    margin-bottom: 12px;
                                    color: white;
                                    cursor: pointer;
                                    border-radius: 8px; /* Rounded corners */
                                    transition: all 0.2s;
                                }

                                .sidebar-button:hover {
                                    background: rgba(255, 255, 255, 0.1);
                                    transform: translateY(-2px);
                                }

                                .sidebar-button.active {
                                    background: rgba(255, 255, 255, 0.2);
                                    color: white;
                                }

                                .sidebar-icon {
                                    font-size: 18px;
                                }

                                .sidebar-text {
                                    display: none;
                                }

                                .sidebar-button.ask-ai, .sidebar-button.write {
                                    display: flex;
                                }

                                .sidebar-button.flashcards, .sidebar-button.read {
                                    display: none !important;
                                }

                                .sidebar-settings {
                                    margin-top: auto;
                                    margin-bottom: 20px;
                                    width: 36px; /* Slightly smaller */
                                    height: 36px; /* Slightly smaller */
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: white;
                                    cursor: pointer;
                                    border-radius: 8px; /* Rounded corners */
                                    transition: all 0.2s;
                                }

                                .sidebar-settings:hover {
                                    background: rgba(255, 255, 255, 0.1);
                                    transform: translateY(-2px);
                                }

                                .main-content {
                                    flex: 1;
                                    display: flex;
                                    flex-direction: column;
                                    overflow-y: auto;
                                    background: #ffffff; /* Ensure clean white background */
                                }

                                /* Tab Styles */
                                .tab-content {
                                    flex: 1;
                                    display: flex;
                                    flex-direction: column;
                                    overflow: hidden; /* Prevent double scrollbars */
                                    background-color: #ffffff; /* Match main content background */
                                }

                                .tab-pane {
                                    display: none; /* Hide tabs by default */
                                    flex: 1;
                                    overflow-y: auto; /* Allow scrolling within tab */
                                    padding: 25px; /* Increase padding slightly for better spacing */
                                    flex-direction: column; /* Ensure vertical layout */
                                    box-sizing: border-box; /* Include padding in element's total width and height */
                                }

                                .tab-pane.active {
                                    display: flex; /* Show active tab using flex */
                                }

                                .welcome-section {
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    margin: 20px 0 30px;
                                    text-align: center;
                                    padding: 20px;
                                }

                                .welcome-icon {
                                    width: 60px;
                                    height: 60px;
                                    margin-bottom: 16px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                }

                                .welcome-icon img {
                                    width: 100%;
                                    height: auto;
                                    border-radius: 10px;
                                }

                                .purple-icon {
                                    fill: none;
                                    stroke: var(--primary-color);
                                    stroke-width: 2;
                                    width: 100%;
                                    height: 100%;
                                }

                                .welcome-text {
                                    font-size: 20px;
                                    font-weight: 600;
                                    color: var(--primary-color);
                                    margin-bottom: 8px;
                                    line-height: 1.3;
                                }

                                .welcome-description {
                                    font-size: 14px;
                                    color: var(--text-color);
                                    max-width: 90%;
                                    line-height: 1.5;
                                }

                                .option-cards {
                                    display: flex;
                                    flex-direction: column;
                                    gap: 12px;
                                    margin-bottom: 30px;
                                }

                                .related-buttons {
                                    display: flex;
                                    gap: 12px;
                                }

                                .option-card {
                                    background: white;
                                    border: 1px solid var(--border-color);
                                    border-radius: var(--border-radius);
                                    padding: 14px;
                                    display: flex;
                                    align-items: center;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                    box-shadow: 0 4px 6px var(--shadow-color);
                                }

                                .option-card:hover {
                                    background: #f8f9fa;
                                    transform: translateY(-2px);
                                    box-shadow: 0 5px 10px var(--shadow-color);
                                }

                                .card-icon {
                                    width: 40px;
                                    height: 40px;
                                    margin-right: 14px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 20px;
                                    color: var(--primary-color);
                                    background: #f5f5f7;
                                    border-radius: 8px;
                                }

                                .card-content {
                                    flex: 1;
                                }

                                .card-title {
                                    font-weight: 600;
                                    font-size: 15px;
                                    margin-bottom: 4px;
                                    color: var(--primary-color);
                                }

                                .card-description {
                                    font-size: 13px;
                                    color: var(--text-color);
                                    line-height: 1.4;
                                }

                                .message-input {
                                    margin-top: auto;
                                    border-top: 1px solid var(--border-color);
                                    background: white;
                                    padding: 16px;
                                }

                                .input-container {
                                    display: flex;
                                    background: #f5f5f7;
                                    border: 2px solid var(--border-color);
                                    border-radius: var(--border-radius);
                                    padding: 10px 16px;
                                    transition: all 0.3s;
                                }

                                .input-container:focus-within {
                                    border-color: var(--primary-color);
                                    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
                                }

                                .input-container textarea {
                                    flex: 1;
                                    background: none;
                                    border: none;
                                    color: var(--text-color);
                                    resize: none;
                                    min-height: 24px;
                                    max-height: 100px;
                                    outline: none;
                                    font-family: inherit;
                                    font-size: 14px;
                                    line-height: 1.5;
                                    padding-right: 10px;
                                }

                                .input-container textarea::placeholder {
                                    color: #86868b;
                                }

                                .send-button {
                                    background: var(--primary-gradient);
                                    border: none;
                                    min-width: 30px;
                                    height: 30px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                    box-shadow: 0 4px 6px var(--shadow-color);
                                }

                                .send-button:hover {
                                    transform: translateY(-2px);
                                    box-shadow: 0 5px 10px var(--shadow-color);
                                }

                                .send-icon {
                                    fill: white;
                                    width: 16px;
                                    height: 16px;
                                }

                                .input-tools {
                                    display: flex;
                                    justify-content: flex-start;
                                    align-items: center;
                                    margin-top: 10px;
                                    padding: 0 5px;
                                }

                                .tools-left {
                                    display: flex;
                                    gap: 10px;
                                }

                                .tool-button {
                                    background: transparent;
                                    border: none;
                                    display: flex;
                                    align-items: center;
                                    padding: 6px 10px;
                                    font-size: 13px;
                                    color: var(--text-color);
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    gap: 5px;
                                }

                                .tool-button:hover {
                                    color: var(--primary-color);
                                }

                                .tool-icon {
                                    font-size: 15px;
                                }

                                .tools-right {
                                    display: none;
                                }

                                /* Conversation styling */
                                .conversation-container {
                                    display: flex;
                                    flex-direction: column;
                                    gap: 12px;
                                    margin-bottom: 16px;
                                }

                                .message-bubble {
                                    max-width: 85%;
                                    padding: 12px 16px;
                                    border-radius: 18px;
                                    font-size: 14px;
                                    line-height: 1.5;
                                    position: relative;
                                }

                                .user-message {
                                    align-self: flex-end;
                                    background: #0066cc;
                                    color: white;
                                    border-bottom-right-radius: 4px;
                                }

                                .assistant-message {
                                    align-self: flex-start;
                                    background: #333;
                                    color: #ffffff;
                                    border-bottom-left-radius: 4px;
                                }

                                .message-time {
                                    font-size: 10px;
                                    color: rgba(255,255,255,0.7);
                                    margin-top: 5px;
                                    text-align: right;
                                }

                                .assistant-message .message-time {
                                    color: #cccccc;
                                }

                                .ai-typing {
                                    align-self: flex-start;
                                    background: #333;
                                    color: #cccccc;
                                    padding: 8px 14px;
                                    border-radius: 18px;
                                    font-size: 13px;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                    border-bottom-left-radius: 4px;
                                }

                                .typing-dots {
                                    display: flex;
                                    gap: 3px;
                                }

                                .typing-dot {
                                    width: 5px;
                                    height: 5px;
                                    background: #ffffff;
                                    border-radius: 50%;
                                    animation: typing-animation 1.4s infinite;
                                }

                                .typing-dot:nth-child(2) {
                                    animation-delay: 0.2s;
                                }

                                .typing-dot:nth-child(3) {
                                    animation-delay: 0.4s;
                                }

                                @keyframes typing-animation {
                                    0% { transform: translateY(0); }
                                    50% { transform: translateY(-3px); }
                                    100% { transform: translateY(0); }
                                }

                                /* Upload UI */
                                .upload-preview {
                                    margin: 16px 0;
                                    display: flex;
                                    flex-wrap: wrap;
                                    gap: 10px;
                                }

                                .upload-item {
                                    position: relative;
                                    border-radius: 8px;
                                    overflow: hidden;
                                    width: 80px;
                                    height: 80px;
                                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                }

                                .upload-item img {
                                    width: 100%;
                                    height: 100%;
                                    object-fit: cover;
                                }

                                .upload-item .upload-remove {
                                    position: absolute;
                                    top: 4px;
                                    right: 4px;
                                    background: rgba(0,0,0,0.5);
                                    color: white;
                                    width: 20px;
                                    height: 20px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 12px;
                                    cursor: pointer;
                                    z-index: 1;
                                }

                                .upload-audio {
                                    background: #f5f7ff;
                                    display: flex;
                                    align-items: center;
                                    padding: 10px;
                                    border-radius: 8px;
                                    gap: 10px;
                                    width: 100%;
                                }

                                .audio-icon {
                                    font-size: 20px;
                                    color: #4a90e2;
                                }

                                .audio-info {
                                    flex: 1;
                                    font-size: 13px;
                                    color: #555;
                                }

                                .upload-progress {
                                    height: 4px;
                                    background: #eaeaea;
                                    border-radius: 2px;
                                    overflow: hidden;
                                    margin-top: 4px;
                                }

                                .progress-bar {
                                    height: 100%;
                                    background: #4a90e2;
                                    border-radius: 2px;
                                    width: 0%;
                                    transition: width 0.3s;
                                }
                            `;
document.head.appendChild(versionSelectorStyle);

// Add CSS styles for StudyAidX Invisible detection toast and logo
const studyAidXInvisibleStyles = document.createElement("style");
studyAidXInvisibleStyles.textContent = `
    /* StudyAidX Invisible Toast Notification Styles - Black & White Glassmorphism */
    .studyaidx-invisible-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        color: rgba(255, 255, 255, 0.95);
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        max-width: 320px;
        min-width: 280px;
        opacity: 0;
        transform: translateX(100%) scale(0.9);
        transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .studyaidx-invisible-toast.show {
        opacity: 1;
        transform: translateX(0) scale(1);
    }

    /* Ultra-smooth morphing animation - only use transform for performance */
    .studyaidx-invisible-toast.morphing {
        /* Immediately set final position to avoid layout thrashing */
        top: auto !important;
        right: auto !important;
        left: 20px !important;
        bottom: 20px !important;
        width: 50px !important;
        height: 50px !important;
        max-width: 50px !important;
        min-width: 50px !important;
        padding: 0 !important;

        /* Only animate transform and border-radius for 60fps smoothness */
        animation: ultraSmoothMorph 1.0s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        animation-fill-mode: forwards;
    }

    @keyframes morphToIcon {
        0% {
            /* Starting position: top-right */
            top: 20px;
            right: 20px;
            left: auto;
            bottom: auto;
            width: auto;
            height: auto;
            max-width: 300px;
            min-width: 300px;
            padding: 15px 20px;
            border-radius: 8px;
            transform: translateX(0) translateY(0) scale(1);
            opacity: 1;
        }

        15% {
            /* Start moving and shrinking slightly */
            transform: translateX(-30px) translateY(20px) scale(0.95);
            border-radius: 10px;
            opacity: 1;
        }

        30% {
            /* Continue diagonal movement */
            top: 35%;
            right: 35%;
            transform: translateX(-60px) translateY(40px) scale(0.85);
            border-radius: 15px;
            padding: 12px 18px;
            max-width: 250px;
            min-width: 250px;
        }

        50% {
            /* Middle point - center of screen */
            top: 50%;
            right: 50%;
            left: auto;
            bottom: auto;
            transform: translateX(50%) translateY(-50%) scale(0.6);
            border-radius: 20px;
            padding: 10px 15px;
            max-width: 150px;
            min-width: 150px;
        }

        70% {
            /* Moving towards bottom-left */
            top: auto;
            right: auto;
            left: 35%;
            bottom: 35%;
            transform: translateX(-50%) translateY(50%) scale(0.4);
            border-radius: 30px;
            padding: 8px 12px;
            max-width: 80px;
            min-width: 80px;
        }

        85% {
            /* Almost at final position */
            left: 20px;
            bottom: 20px;
            transform: translateX(0) translateY(0) scale(0.3);
            border-radius: 40px;
            padding: 4px 8px;
            max-width: 60px;
            min-width: 60px;
        }

        100% {
            /* Final position: bottom-left as perfect circle */
            top: auto;
            right: auto;
            left: 20px;
            bottom: 20px;
            width: 50px;
            height: 50px;
            max-width: 50px;
            min-width: 50px;
            padding: 0;
            border-radius: 50%;
            transform: translateX(0) translateY(0) scale(1);
            opacity: 1;
        }
    }

    /* Hide text during morphing */
    .studyaidx-invisible-toast.morphing .toast-text,
    .studyaidx-invisible-toast.morphing .toast-version {
        opacity: 0;
        transition: opacity 0.3s ease-out;
    }

    /* Icon becomes visible during morphing */
    .studyaidx-invisible-toast.morphing .toast-icon {
        font-size: 24px !important;
        transition: font-size 0.6s ease-in-out;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
    }

    .studyaidx-invisible-toast .toast-icon {
        display: inline-block;
        margin-right: 8px;
        font-size: 16px;
    }

    .studyaidx-invisible-toast .toast-text {
        display: inline-block;
        vertical-align: middle;
    }

    /* StudyAidX Invisible Logo Indicator Styles */
    .studyaidx-invisible-logo {
        position: fixed !important;
        bottom: 20px !important;
        left: 20px !important;
        width: 56px;
        height: 56px;
        background: rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border-radius: 16px;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        z-index: 999999 !important;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.95);
        font-size: 20px;
        font-weight: bold;
        opacity: 1;
        transform: scale(1);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        overflow: hidden;
    }

    .studyaidx-invisible-logo::before {
        content: '🛡️';
        font-size: 24px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
        color: rgba(255, 255, 255, 0.95);
    }

    .studyaidx-invisible-logo::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        border-radius: 16px;
        z-index: -1;
        transition: all 0.3s ease;
    }

    .studyaidx-invisible-logo.show {
        opacity: 1;
        transform: scale(1);
    }

    .studyaidx-invisible-logo:hover {
        transform: scale(1.05) translateY(-2px);
        box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.15),
            0 4px 12px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    .studyaidx-invisible-logo:hover::after {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
    }

    .studyaidx-invisible-logo::before {
        content: '🛡️';
        font-size: 24px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
    }

    .studyaidx-invisible-logo::before {
        content: '🛡️';
        font-size: 24px;
    }

    /* Logo hover tooltip - Black & White Glassmorphism */
    .studyaidx-invisible-logo-tooltip {
        position: absolute;
        bottom: 70px;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        background: rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        color: rgba(255, 255, 255, 0.95);
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        pointer-events: none;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        min-width: 200px;
        text-align: center;
        z-index: 1000000;
    }

    .studyaidx-invisible-logo:hover .studyaidx-invisible-logo-tooltip {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }

    .studyaidx-invisible-logo-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        right: 20px;
        border: 5px solid transparent;
        border-top-color: rgba(40, 167, 69, 0.95);
    }

    /* Responsive design for smaller screens */
    @media (max-width: 768px) {
        .studyaidx-invisible-toast {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
            font-size: 13px;
            padding: 12px 16px;
        }

        .studyaidx-invisible-logo {
            bottom: 15px;
            right: 15px;
            width: 45px;
            height: 45px;
        }

        .studyaidx-invisible-logo::before {
            font-size: 20px;
        }

        .studyaidx-invisible-logo-tooltip {
            font-size: 11px;
            padding: 6px 10px;
            bottom: 55px;
        }
    }

    /* Animation keyframes */
    @keyframes studyaidx-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .studyaidx-invisible-logo.pulse {
        animation: studyaidx-pulse 2s infinite;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
        .studyaidx-invisible-toast {
            background: #000000;
            border: 2px solid #ffffff;
        }

        .studyaidx-invisible-logo {
            background: #000000;
            border: 2px solid #ffffff;
        }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .studyaidx-invisible-toast,
        .studyaidx-invisible-logo,
        .studyaidx-invisible-logo-tooltip {
            transition: none;
        }

        .studyaidx-invisible-logo.pulse {
            animation: none;
        }
    }
`;
document.head.appendChild(studyAidXInvisibleStyles);

// Debug function to help troubleshoot menu issues
function debugMenuState() {
    const studyAidMenu = document.getElementById("studyAidMenu");
    const quizHelperMenu = document.getElementById("quizHelperMenu");
    const reopenIcon = document.getElementById("reopenIcon");

    console.log("--- Menu Debug Info ---");
    console.log("studyAidMenu exists:", !!studyAidMenu);
    if (studyAidMenu) {
        console.log("studyAidMenu visibility:", studyAidMenu.style.visibility);
        console.log("studyAidMenu display:", studyAidMenu.style.display);
        console.log("studyAidMenu opacity:", studyAidMenu.style.opacity);
        console.log(
            "studyAidMenu has minimized class:",
            studyAidMenu.classList.contains("minimized"),
        );
    }

    console.log("quizHelperMenu exists:", !!quizHelperMenu);
    if (quizHelperMenu) {
        console.log(
            "quizHelperMenu visibility:",
            quizHelperMenu.style.visibility,
        );
        console.log("quizHelperMenu display:", quizHelperMenu.style.display);
        console.log("quizHelperMenu opacity:", quizHelperMenu.style.opacity);
        console.log(
            "quizHelperMenu has minimized class:",
            quizHelperMenu.classList.contains("minimized"),
        );
    }

    console.log("reopenIcon exists:", !!reopenIcon);
    if (reopenIcon) {
        console.log("reopenIcon display:", reopenIcon.style.display);
        console.log("reopenIcon opacity:", reopenIcon.style.opacity);
    }

    console.log(
        "menuMinimized in localStorage:",
        localStorage.getItem("menuMinimized"),
    );
}

// Add keyboard shortcut for debugging (Ctrl+Shift+D)
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "D") {
        debugMenuState();
    }
});

// Create menu with initial hidden state
const menu = document.createElement("div");
menu.id = "studyAidMenu";
menu.style.display = isMenuHidden ? "none" : "block";
document.body.appendChild(menu);

// Rest of menu creation code goes here

// Define toggleMinimize function before using it
function toggleMinimize() {
    // Check if incognito mode is active
    const isIncognito = localStorage.getItem("incognitoMode") === "true";
    if (isIncognito) {
        console.log("Incognito mode active, toggleMinimize prevented.");
        return; // Do nothing if incognito mode is on
    }

    // Support both menu IDs that appear in the codebase
    const menu =
        document.getElementById("studyAidMenu") ||
        document.getElementById("quizHelperMenu");
    const reopenIcon = document.getElementById("reopenIcon");
    const minimizeButton = document.getElementById("minimizeButton");

    // Track attempt in console for debugging
    console.log(
        "Toggle minimize called. Current state:",
        !menu.classList.contains("minimized") ? "open" : "minimized",
    );

    try {
        if (!menu.classList.contains("minimized")) {
            // MINIMIZE: When the menu is open, minimize it

            // 1. Change button to square (maximize)
            minimizeButton.innerHTML = "□";
            minimizeButton.setAttribute("aria-label", "Maximize");
            minimizeButton.setAttribute("title", "Maximize");

            // 2. Add minimized class and save state
            menu.classList.add("minimized");
            localStorage.setItem("menuMinimized", "true");

            // 3. Hide menu
            menu.style.display = "none";
            menu.style.visibility = "hidden";

            // 4. Show reopenIcon
            if (reopenIcon) {
                reopenIcon.style.display = "block";
                reopenIcon.style.opacity = "1";
            }

            // 5. Ensure style for reload
            const initialHideStyle =
                document.getElementById("initialHideStyle");
            if (!initialHideStyle) {
                const newStyle = document.createElement("style");
                newStyle.id = "initialHideStyle";
                newStyle.textContent = `
                                                #studyAidMenu, #quizHelperMenu {
                                                    opacity: 0;
                                                    visibility: hidden;
                                                    display: none;
                                                }
                                            `;
                document.head.appendChild(newStyle);
            }

            console.log("Menu minimized successfully");
        } else {
            // UNMINIMIZE: When the menu is minimized, expand it

            // 1. Change the button to a hyphen (minimize)
            minimizeButton.innerHTML = "_";
            minimizeButton.setAttribute("aria-label", "Minimize");
            minimizeButton.setAttribute("title", "Minimize");

            // 2. Hide reopenIcon
            if (reopenIcon) {
                reopenIcon.style.display = "none";
            }

            // 3. Show menu
            menu.style.display = "block";
            menu.style.visibility = "visible";
            menu.style.opacity = "1";

            // 4. Remove minimized class and save state
            menu.classList.remove("minimized");
            localStorage.setItem("menuMinimized", "false");

            // 5. Remove style if exists
            const initialHideStyle =
                document.getElementById("initialHideStyle");
            if (initialHideStyle) {
                initialHideStyle.remove();
            }

            console.log("Menu restored successfully");
        }
    } catch (error) {
        console.error("Toggle minimize error:", error);
        // Force recovery if there's an error
        forceRecoverMenu();
    }
}

// New function to force recovery of menu in case of errors
function forceRecoverMenu() {
    try {
        console.log("Attempting force recovery of menu...");
        // Try to identify the menu
        let menu = document.getElementById("studyAidMenu");
        if (!menu) {
            menu = document.getElementById("quizHelperMenu");
        }

        // If still no menu, try to create it again
        if (!menu) {
            // Function to create the StudyAidX Assistant interface
            function createStudyAidXAssistant() {
                const assistantMenu = document.createElement("div");
                assistantMenu.id = "studyAidAssistantMenu";

                // --- Modified HTML Structure with Tabs ---
                assistantMenu.innerHTML = `
                                    <div id="assistantHeader">
                                        <div class="header-title">
                                            <img src="https://studyaidx.web.app/lovable-uploads/1111a9ca-bbb6-46dd-bfbc-fcf9737a3b56.png alt="StudyAidX Logo">
                                            <span>StudyAidX Assistant</span>
                                        </div>
                                        <div class="header-buttons">
                                            <button class="upgrade-button">
                                                <span class="star-icon">⭐</span>
                                                <span>Upgrade</span>
                                            </button>
                                            <div class="control-buttons">
                                                <button class="control-button" id="assistantMinimize">_</button>
                                                <button class="control-button" id="assistantClose">×</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="assistant-content">
                                        <div class="sidebar">
                                            <div class="sidebar-button ask-ai active" data-tab="ask-ai-tab">
                                                <div class="sidebar-icon">💬</div>
                                                <div class="sidebar-text">Assistant</div>
                                            </div>
                                            <div class="sidebar-button write" data-tab="write-tab">
                                                <div class="sidebar-icon">✏️</div>
                                                <div class="sidebar-text">Write</div>
                                            </div>
                                            <!-- Add other sidebar buttons here with data-tab attribute -->
                                            <div class="sidebar-settings" data-tab="settings-tab">
                                                <span>⚙️</span>
                                            </div>
                                        </div>
                                        <div class="main-content">
                                            <div class="tab-content">
                                                <!-- Ask AI Tab -->
                                                <div class="tab-pane active" id="ask-ai-tab">
                                                    <div class="welcome-section">
                                                        <div class="welcome-icon">
                                                            <svg viewBox="0 0 24 24" class="purple-icon">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <path d="M12 16v-4m0-4h.01"></path>
                                                            </svg>
                                                        </div>
                                                        <div class="welcome-text">How can I assist you today?</div>
                                                    </div>
                                                    <div class="option-cards">
                                                        <div class="option-card">
                                                            <div class="card-icon">📝</div>
                                                            <div class="card-content">
                                                                <div class="card-title">Solve study problem</div>
                                                                <div class="card-description">Help me solve this math question and provide detailed steps</div>
                                                            </div>
                                                        </div>
                                                        <div class="option-card">
                                                            <div class="card-icon">📚</div>
                                                            <div class="card-content">
                                                                <div class="card-title">Write an essay</div>
                                                                <div class="card-description">Assist me in writing a history essay of 1000 words</div>
                                                            </div>
                                                        </div>
                                                        <div class="option-card">
                                                            <div class="card-icon">🔍</div>
                                                            <div class="card-content">
                                                                <div class="card-title">Read PDF materials</div>
                                                                <div class="card-description">Read and chat with pdf, obtain article interpretations and summaries</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="conversation-container"></div> <!-- Container for messages -->
                                                    <div class="message-input">
                                                        <div class="input-container">
                                                            <textarea placeholder="Message StudyAidX Assistant..."></textarea>
                                                            <button class="send-button">
                                                                <svg viewBox="0 0 24 24" class="send-icon">
                                                                    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"></path>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <div class="input-tools">
                                                            <div class="tools-left">
                                                                <button class="tool-button" id="uploadBtn"><span class="tool-icon">📎</span> Attach</button>
                                                            </div>
                                                            <div class="tools-right">
                                                                </div>
                                                        </div>
                                                        <div class="upload-preview"></div>
                                                    </div>
                                                </div>

                                                <!-- Write Tab -->
                                                <div class="tab-pane" id="write-tab">
                                                    <h2>Write Feature</h2>
                                                    <p>Content for the writing assistant will go here.</p>
                                                    <!-- Add Write-specific UI elements -->
                                                </div>

                                                <!-- Settings Tab -->
                                                <div class="tab-pane" id="settings-tab">
                                                    <h2>Settings</h2>
                                                    <p>Configuration options will go here.</p>
                                                    <!-- Add Settings UI elements -->
                                                </div>
                                                <!-- Add other tab panes here -->
                                            </div>
                                        </div>
                                    </div>
                                `;

                document.body.appendChild(assistantMenu);

                // --- Tab Switching Logic ---
                const sidebarButtons = assistantMenu.querySelectorAll(
                    ".sidebar-button, .sidebar-settings",
                );
                const tabPanes = assistantMenu.querySelectorAll(".tab-pane");

                function showTab(tabId) {
                    // Hide all panes
                    tabPanes.forEach((pane) => {
                        pane.classList.remove("active");
                        // pane.style.display = 'none'; // Use class instead
                    });
                    // Deactivate all buttons
                    sidebarButtons.forEach((button) => {
                        button.classList.remove("active");
                    });

                    // Show selected pane
                    const selectedPane = assistantMenu.querySelector(
                        `#${tabId}`,
                    );
                    if (selectedPane) {
                        selectedPane.classList.add("active");
                        // selectedPane.style.display = 'flex'; // Use class instead
                    }
                    // Activate selected button
                    const selectedButton = assistantMenu.querySelector(
                        `[data-tab="${tabId}"]`,
                    );
                    if (selectedButton) {
                        selectedButton.classList.add("active");
                    }
                }

                sidebarButtons.forEach((button) => {
                    button.addEventListener("click", () => {
                        const tabId = button.getAttribute("data-tab");
                        if (tabId) {
                            showTab(tabId);
                        }
                    });
                });

                // Show default tab initially
                showTab("ask-ai-tab");
                // --- End Tab Switching Logic ---

                // Add event listeners for the assistant menu buttons
                document
                    .getElementById("assistantMinimize")
                    .addEventListener("click", () => {
                        assistantMenu.style.display = "none";
                    });

                document
                    .getElementById("assistantClose")
                    .addEventListener("click", () => {
                        assistantMenu.style.display = "none";
                    });

                return assistantMenu;
            }

            // Function to toggle between versions
            function toggleVersion(version) {
                if (version === STUDYAIDX_VERSION.ASSISTANT) {
                    // Create or show the assistant interface
                    let assistantMenu = document.getElementById(
                        "studyAidAssistantMenu",
                    );
                    if (!assistantMenu) {
                        assistantMenu = createStudyAidXAssistant();
                    }
                    assistantMenu.style.display = "flex";

                    // Hide the regular menu
                    const regularMenu =
                        document.getElementById("quizHelperMenu");
                    if (regularMenu) {
                        regularMenu.style.display = "none";
                    }
                } else {
                    // Show the regular menu
                    const regularMenu =
                        document.getElementById("quizHelperMenu");
                    if (regularMenu) {
                        regularMenu.style.display = "block";
                    }

                    // Hide the assistant interface
                    const assistantMenu = document.getElementById(
                        "studyAidAssistantMenu",
                    );
                    if (assistantMenu) {
                        assistantMenu.style.display = "none";
                    }
                }

                // Save the current version to storage (cả localStorage và GM_setValue)
                localStorage.setItem("studyAidXVersion", version);
                GM_setValue("studyAidXVersion", version);
                currentVersion = version;
            }

            // Add event listeners to version selector options
            document.addEventListener("DOMContentLoaded", () => {
                const setupVersionSelector = () => {
                    const versionOptions =
                        document.querySelectorAll(".version-option");
                    if (versionOptions.length === 0) {
                        console.log(
                            "No version options found, will try again in 500ms",
                        );
                        setTimeout(setupVersionSelector, 500);
                        return;
                    }

                    versionOptions.forEach((option) => {
                        option.addEventListener("click", () => {
                            const version = option.getAttribute("data-version");
                            toggleVersion(version);

                            // Update active state in UI
                            versionOptions.forEach((opt) => {
                                opt.classList.toggle(
                                    "active",
                                    opt.getAttribute("data-version") ===
                                    version,
                                );
                            });
                        });
                    });

                    // Initialize with current version
                    toggleVersion(currentVersion);
                    console.log(
                        "Version selector initialized with:",
                        currentVersion,
                    );
                };

                // Start the setup process
                setupVersionSelector();
            });

            console.log("Menu not found, creating a new one");
            createBackupMenu();
            return;
        }

        // Force restore visibility
        menu.style.display = "block";
        menu.style.visibility = "visible";
        menu.style.opacity = "1";
        menu.classList.remove("minimized");
        localStorage.setItem("menuMinimized", "false");

        // Create or show the reopenIcon if it doesn't exist
        let reopenIcon = document.getElementById("reopenIcon");
        if (!reopenIcon) {
            reopenIcon = document.createElement("div");
            reopenIcon.id = "reopenIcon";
            reopenIcon.innerHTML = `
                                            <div class="icon">
                                                <img src="https://studyaidx.web.app/lovable-uploads/1111a9ca-bbb6-46dd-bfbc-fcf9737a3b56.png"
                                                    alt="StudyAidX" class="logo-image">
                                            </div>
                                        `;
            reopenIcon.style.cssText = `
                                            position: fixed;
                                            bottom: 30px;
                                            right: 30px;
                                            width: 50px;
                                            height: 50px;
                                            background: #ffffff;
                                            border-radius: 50%;
                                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                                            z-index: 10000;
                                            cursor: pointer;
                                            display: none;
                                            opacity: 0;
                                            transition: all 0.3s;
                                        `;

            const icon = reopenIcon.querySelector(".icon");
            if (icon) {
                icon.style.cssText = `
                                                width: 100%;
                                                height: 100%;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                            `;
            }

            const logoImage = reopenIcon.querySelector(".logo-image");
            if (logoImage) {
                logoImage.style.cssText = `
                                                width: 30px;
                                                height: 30px;
                                                border-radius: 50%;
                                            `;
            }

            document.body.appendChild(reopenIcon);

            // Add click handler to reopen the appropriate menu
            reopenIcon.addEventListener("click", () => {
                if (currentVersion === STUDYAIDX_VERSION.ASSISTANT) {
                    const assistantMenu = document.getElementById(
                        "studyAidAssistantMenu",
                    );
                    if (assistantMenu) {
                        assistantMenu.style.display = "flex";
                        reopenIcon.style.display = "none";
                    }
                } else {
                    menu.style.display = "block";
                    menu.style.visibility = "visible";
                    menu.style.opacity = "1";
                    menu.classList.remove("minimized");
                    reopenIcon.style.display = "none";
                }
                localStorage.setItem("menuMinimized", "false");
            });
        }

        // Remove any hiding styles
        const initialHideStyle = document.getElementById("initialHideStyle");
        if (initialHideStyle) {
            initialHideStyle.remove();
        }

        console.log("Force recovery completed");
    } catch (recoveryError) {
        console.error("Force recovery failed:", recoveryError);
    }
}

// Function to create a backup menu if everything fails
function createBackupMenu() {
    try {
        const backupMenu = document.createElement("div");
        backupMenu.id = "quizHelperMenu";
        backupMenu.innerHTML = `
                                        <div id="menuHeader">
                                            <span>StudyAidX Emergency Menu</span>
                                            <button id="minimizeButton" aria-label="Minimize" title="Minimize" class="menu-control-button">_</button>
                                        </div>
                                        <div id="menuContent">
                                            <p>This is an emergency recovery menu. Please refresh the page.</p>
                                            <button id="refreshPageBtn">Refresh Page</button>
                                        </div>
                                    `;
        backupMenu.style.position = "fixed";
        backupMenu.style.top = "50px";
        backupMenu.style.right = "50px";
        backupMenu.style.width = "300px";
        backupMenu.style.background = "white";
        backupMenu.style.zIndex = "10000";
        backupMenu.style.border = "1px solid #ccc";
        backupMenu.style.borderRadius = "8px";
        backupMenu.style.padding = "10px";

        document.body.appendChild(backupMenu);

        // Add event listener for the refresh button
        document
            .getElementById("refreshPageBtn")
            .addEventListener("click", () => {
                window.location.reload();
            });

        // Add event listener for the minimize button
        document
            .getElementById("minimizeButton")
            .addEventListener("click", toggleMinimize);

        console.log("Backup menu created");
    } catch (error) {
        console.error("Failed to create backup menu:", error);
    }
}

// Enhanced keyboard shortcut for minimizing menu with error handling and exclusive control
document.addEventListener(
    "keydown",
    (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "q") {
            try {
                e.preventDefault(); // Prevent any default behavior
                e.stopPropagation(); // Stop event propagation to other handlers
                e.stopImmediatePropagation(); // Stop immediate propagation to ensure exclusive handling
                console.log("Ctrl+Q hotkey detected - toggling menu");

                // Get menu and reopenIcon references directly
                const menu = document.getElementById("quizHelperMenu");
                const reopenIcon = document.getElementById("reopenIcon");

                // Toggle menu visibility based on current state
                if (menu.classList.contains("minimized")) {
                    // If minimized, restore menu
                    menu.classList.remove("minimized");
                    menu.style.display = "block";
                    menu.style.visibility = "visible";
                    menu.style.opacity = "1";
                    reopenIcon.style.display = "none";

                    // Update minimize button
                    const minimizeButton =
                        document.getElementById("minimizeButton");
                    if (minimizeButton) {
                        minimizeButton.innerHTML = "_";
                        minimizeButton.setAttribute("aria-label", "Minimize");
                        minimizeButton.setAttribute("title", "Minimize");
                    }

                    // Update local storage
                    localStorage.setItem("menuMinimized", "false");

                    // Remove the initial hide style if it exists
                    const initialHideStyle =
                        document.getElementById("initialHideStyle");
                    if (initialHideStyle) {
                        initialHideStyle.remove();
                    }
                } else {
                    // If visible, minimize menu
                    menu.classList.add("minimized");
                    menu.style.display = "none";
                    menu.style.visibility = "hidden";
                    reopenIcon.style.display = "block";
                    reopenIcon.style.opacity = "1";

                    // Update minimize button
                    const minimizeButton =
                        document.getElementById("minimizeButton");
                    if (minimizeButton) {
                        minimizeButton.innerHTML = "□";
                        minimizeButton.setAttribute("aria-label", "Phóng to");
                        minimizeButton.setAttribute("title", "Phóng to");
                    }

                    // Update local storage
                    localStorage.setItem("menuMinimized", "true");

                    // Add the initial hide style for future page loads
                    if (!document.getElementById("initialHideStyle")) {
                        const newStyle = document.createElement("style");
                        newStyle.id = "initialHideStyle";
                        newStyle.textContent = `
                                                    #quizHelperMenu {
                                                        opacity: 0;
                                                        visibility: hidden;
                                                        display: none;
                                                    }
                                                `;
                        document.head.appendChild(newStyle);
                    }
                }

                return false; // Further prevent default behavior
            } catch (error) {
                console.error("Error in Ctrl+Q handler:", error);
                forceRecoverMenu();
            }
        }
    },
    true,
); // Use capturing phase to handle event before other listeners

// Add a global error handler to ensure menu is always accessible
window.addEventListener("error", function (event) {
    if (event.error && event.error.toString().includes("menu")) {
        console.warn(
            "Caught a menu-related error, attempting recovery:",
            event.error,
        );
        forceRecoverMenu();
        return true; // Prevents the error from propagating
    }
});

// [Rest of the code remains the same...]
const firebaseScript = document.createElement("script");
firebaseScript.src =
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js";
document.head.appendChild(firebaseScript);

const firebaseAuthScript = document.createElement("script");
firebaseAuthScript.src =
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js";

const firebaseFirestoreScript = document.createElement("script");
firebaseFirestoreScript.src =
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js";

const firebaseStorageScript = document.createElement("script");
firebaseStorageScript.src =
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage-compat.js";

// Đợi Firebase load xong theo thứ tự
firebaseScript.onload = () => {
    console.log("Firebase App loaded");
    document.head.appendChild(firebaseAuthScript);

    firebaseAuthScript.onload = () => {
        console.log("Firebase Auth loaded");
        document.head.appendChild(firebaseFirestoreScript);

        firebaseFirestoreScript.onload = () => {
            console.log("Firebase Firestore loaded");
            document.head.appendChild(firebaseStorageScript);

            firebaseStorageScript.onload = () => {
                console.log("Firebase Storage loaded");
                initializeFirebase();
            };
        };
    };
};

// Integrate enhanced answer display system with existing functionality

// Helper function to detect question type
function detectQuestionType(questionElement) {
    if (!questionElement) return "unknown";

    // Check for multiple choice (radio buttons)
    if (questionElement.querySelectorAll('input[type="radio"]').length > 0) {
        return "multiple-choice-single";
    }

    // Check for multiple selection (checkboxes)
    if (questionElement.querySelectorAll('input[type="checkbox"]').length > 0) {
        return "multiple-choice-multiple";
    }

    // Check for fill-in-the-blank (text inputs)
    if (
        questionElement.querySelectorAll('input[type="text"], textarea')
            .length > 0
    ) {
        return "fill-in-the-blank";
    }

    // Check for matching (could have various implementations)
    if (
        questionElement.querySelector(".matching-container") ||
        questionElement.textContent.toLowerCase().includes("match") ||
        questionElement.querySelectorAll(".match-item, .match-pair").length > 0
    ) {
        return "matching";
    }

    // Default to text-based
    return "text-based";
}

// Function to handle answer display based on question type and format
function displayFormattedAnswer(question, answer) {
    try {
        if (!question || !answer) return false;

        const questionType = detectQuestionType(question);
        console.log("Detected question type:", questionType);

        // Use the enhanced answer display system
        displayEnhancedAnswer(question, answer);

        return true;
    } catch (error) {
        console.error("Error in displayFormattedAnswer:", error);
        return false;
    }
}

// Function to process answers for current page
function processPageAnswers(answers) {
    try {
        if (!answers || typeof answers !== "object") {
            console.error("Invalid answers format:", answers);
            return false;
        }

        // Use the enhanced answer display system for all answers
        displayEnhancedAnswers(answers);

        return true;
    } catch (error) {
        console.error("Error processing page answers:", error);
        return false;
    }
}

// Function to hook into existing answer selection methods
function hookIntoAnswerSelection() {
    // This function will be called to hook into any existing answer selection functions
    // that might be defined elsewhere in the code

    // Example of how to hook into a hypothetical selectAnswer function:
    if (
        typeof window.originalSelectAnswer === "undefined" &&
        typeof window.selectAnswer === "function"
    ) {
        // Store original function
        window.originalSelectAnswer = window.selectAnswer;

        // Replace with enhanced version
        window.selectAnswer = function (questionId, answerId) {
            // Call original function
            const result = window.originalSelectAnswer(questionId, answerId);

            // Add enhanced display
            try {
                const questionElement = document.querySelector(
                    `[data-question-id="${questionId}"]`,
                );
                if (questionElement) {
                    displayFormattedAnswer(questionElement, answerId);
                }
            } catch (error) {
                console.error("Error in enhanced selectAnswer:", error);
            }

            return result;
        };
    }

    return true;
}

// Export functions for global access
window.displayFormattedAnswer = displayFormattedAnswer;
window.processPageAnswers = processPageAnswers;
window.detectQuestionType = detectQuestionType;

// [Rest of the code remains the same...]
const loginStyle = document.createElement("style");
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
const keyStyle = document.createElement("style");
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


                                .menu-control-button {
                                    background: none;
                                    border: none;
                                    color: white;
                                    font-size: 16px;
                                    cursor: pointer;
                                    width: 25px;
                                    height: 25px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    border-radius: 4px;
                                    transition: all 0.2s ease;
                                    margin-left: 5px;
                                }

                                .menu-control-button:hover {
                                    background: rgba(255, 255, 255, 0.2);
                                }

                                .menu-control-button:active {
                                    background: rgba(255, 255, 255, 0.3);
                                    transform: scale(0.95);
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
    return date.toLocaleString("vi-VN");
}

async function showBannedUserAlert(banInfo) {
    const banDate = formatBanDate(banInfo.bannedAt);
    let message = `Tài khoản của bạn đã bị cấm sử dụng StudyAidX!\n\n`;
    message += `Thời gian bị cấm: ${banDate}\n`;
    message += `Lý do: ${banInfo.reason || "Không có lý do được cung cấp"}\n`;
    if (banInfo.message) {
        message += `Ghi chú: ${banInfo.message}\n`;
    }
    alert(message);
}

function showLoginPopup() {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "login-popup-overlay";

        const popup = document.createElement("div");
        popup.className = "login-popup";
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

        const signInBtn = popup.querySelector(".google-sign-in-btn");
        const cancelBtn = popup.querySelector(".cancel-btn");

        signInBtn.addEventListener("click", () => {
            overlay.remove();
            resolve(true);
        });

        cancelBtn.addEventListener("click", () => {
            overlay.remove();
            resolve(false);
        });

        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    });
}

function initializeFirebase() {
    console.log("Script bắt đầu chạy.");
    const firebaseConfig = {
        apiKey: "AIzaSyBv_IpAjx-riZi5yizDjKHPugKgjkHIynQ",
        authDomain: "studyaidx.firebaseapp.com",
        projectId: "studyaidx",
        storageBucket: "studyaidx.firebasestorage.app",
        messagingSenderId: "388023302639",
        appId: "1:388023302639:web:b7b46b2c7712865214de1a",
        measurementId: "G-39155JDLZX",
    };

    try {
        firebase.initializeApp(firebaseConfig);
        console.log("Script đã tải xong.");
        const db = firebase.firestore();
        setupAuthUI();

        // Initialize StudyAidX Invisible detection system
        initializeStudyAidXInvisibleDetection();
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
                formattedAnswer = formattedAnswer.replace(/[*_#]/g, "");

                // Remove any analysis sections
                if (formattedAnswer.includes("Analysis")) {
                    formattedAnswer = formattedAnswer.split("Analysis")[0];
                }

                // Remove any conclusion sections
                if (formattedAnswer.includes("Conclusion")) {
                    formattedAnswer = formattedAnswer.split("Conclusion")[0];
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
                    console.error(
                        "Both AI results must be set before comparison",
                    );
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
                return new Promise((resolve) => {
                    setTimeout(() => {
                        // Compare results and make decision
                        const comparison = this.compareResultQuality();
                        resolve({
                            acceptsAI2Result: comparison.ai2Better,
                            reason: comparison.reason,
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
                    reason:
                        ai2Score > ai1Score
                            ? "AI2 result appears more accurate"
                            : "AI1 result maintains better quality",
                };
            }

            evaluateResult(result) {
                // Implement result evaluation logic
                // This is a placeholder for actual evaluation logic
                let score = 0;
                if (result && typeof result === "object") {
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
                    if (typeof obj[key] === "object" && obj[key] !== null) {
                        score +=
                            1 + this.evaluateResultDepth(obj[key], depth + 1);
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
                const questions = document.querySelectorAll(
                    ".question-container",
                );
                questions.forEach((question) => {
                    if (!question.querySelector(".reply-button")) {
                        const replyButton = document.createElement("button");
                        replyButton.className = "reply-button";
                        replyButton.innerHTML = "Reply";
                        replyButton.dataset.questionId = question.id;
                        question.appendChild(replyButton);
                    }
                });
            }

            setupEventListeners() {
                // Listen for reply button clicks
                document.addEventListener("click", async (e) => {
                    if (e.target.classList.contains("reply-button")) {
                        const questionId = e.target.dataset.questionId;
                        const questionContainer =
                            document.getElementById(questionId);

                        if (!questionContainer.querySelector(".reply-form")) {
                            this.createReplyForm(questionContainer);
                        }
                    }
                });

                // Listen for form submissions
                document.addEventListener("submit", async (e) => {
                    if (e.target.classList.contains("reply-form")) {
                        e.preventDefault();
                        const questionId = e.target.dataset.questionId;
                        const replyContent =
                            e.target.querySelector(".reply-input").value;
                        await this.submitReply(questionId, replyContent);
                    }
                });
            }

            createReplyForm(questionContainer) {
                const form = document.createElement("form");
                form.className = "reply-form";
                form.dataset.questionId = questionContainer.id;

                const input = document.createElement("textarea");
                input.className = "reply-input";
                input.placeholder = "Type your reply here...";

                const submitButton = document.createElement("button");
                submitButton.type = "submit";
                submitButton.innerHTML = "Submit Reply";

                form.appendChild(input);
                form.appendChild(submitButton);
                questionContainer.appendChild(form);
            }

            async submitReply(questionId, content) {
                try {
                    const user = firebase.auth().currentUser;
                    if (!user) {
                        alert("Please sign in to reply to questions.");
                        return;
                    }

                    await this.db.collection("replies").add({
                        questionId: questionId,
                        content: content,
                        userId: user.uid,
                        userName: user.displayName,
                        timestamp:
                            firebase.firestore.FieldValue.serverTimestamp(),
                    });

                    // Clear form and show success message
                    const form = document.querySelector(
                        `form[data-question-id="${questionId}"]`,
                    );
                    if (form) {
                        form.querySelector(".reply-input").value = "";
                        this.showToast("Reply submitted successfully!");
                    }

                    // Refresh replies
                    await this.loadReplies(questionId);
                } catch (error) {
                    console.error("Error submitting reply:", error);
                    this.showToast("Error submitting reply. Please try again.");
                }
            }

            async loadReplies(questionId) {
                try {
                    const replies = await this.db
                        .collection("replies")
                        .where("questionId", "==", questionId)
                        .orderBy("timestamp", "desc")
                        .get();

                    const repliesContainer = document.createElement("div");
                    repliesContainer.className = "replies-container";

                    replies.forEach((reply) => {
                        const replyData = reply.data();
                        const replyElement = document.createElement("div");
                        replyElement.className = "reply";
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
                    const questionContainer =
                        document.getElementById(questionId);
                    const existingReplies =
                        questionContainer.querySelector(".replies-container");
                    if (existingReplies) {
                        existingReplies.replaceWith(repliesContainer);
                    } else {
                        questionContainer.appendChild(repliesContainer);
                    }
                } catch (error) {
                    console.error("Error loading replies:", error);
                    this.showToast("Error loading replies. Please try again.");
                }
            }

            showToast(message) {
                const toast = document.createElement("div");
                toast.className = "toast";
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
                        targetType: "quiz", // what to farm
                    },
                    autoSubmit: false,
                    incognitoMode: false,
                    features: {
                        copyPaste: false,
                        autoExtract: false,
                        autoAnswer: false,
                    },
                };
                this.config = null;
                this.initialized = false;
            }

            async initialize(userId) {
                const storedUserId = userId || localStorage.getItem("userId");
                if (!storedUserId) {
                    console.error(
                        "Cannot initialize config: No user ID provided",
                    );
                    return;
                }
                this.userId = storedUserId;
                await this.loadConfig();
                this.initialized = true;
            }

            async loadConfig() {
                try {
                    const docRef = firebase
                        .firestore()
                        .collection("userConfigs")
                        .doc(this.userId);
                    const doc = await docRef.get();

                    if (doc.exists) {
                        this.config = { ...this.defaults, ...doc.data() };
                    } else {
                        this.config = { ...this.defaults };
                        await this.saveConfig(); // Save default config for new users
                    }
                } catch (error) {
                    console.error("Error loading user config:", error);
                    this.config = { ...this.defaults };
                }
            }

            async saveConfig() {
                if (!this.initialized || !this.userId) {
                    console.error(
                        "Cannot save config: Config not initialized or no user ID",
                    );
                    return;
                }

                try {
                    const docRef = firebase
                        .firestore()
                        .collection("userConfigs")
                        .doc(this.userId);
                    await docRef.set(this.config);
                } catch (error) {
                    console.error("Error saving user config:", error);
                }
            }

            // Getters
            getFarmingConfig() {
                return this.config?.farming || this.defaults.farming;
            }

            getFeatureState(featureName) {
                return (
                    this.config?.features?.[featureName] ??
                    this.defaults.features[featureName]
                );
            }

            // Setters
            async setFarmingConfig(farmingConfig) {
                this.config.farming = {
                    ...this.config.farming,
                    ...farmingConfig,
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

        // --- Login Popup Functions with Enhanced Animations ---
        function showLoginPopup() {
            console.log("Showing login popup with animations...");
            let backdrop = document.getElementById("loginBackdrop");
            let popup = document.getElementById("loginPopup");

            if (!backdrop) {
                backdrop = document.createElement("div");
                backdrop.id = "loginBackdrop";
                document.body.appendChild(backdrop);
            }

            if (!popup) {
                popup = document.createElement("div");
                popup.id = "loginPopup";
                popup.innerHTML = `
                                                <button id="loginPopupCloseBtn" title="Close">&times;</button>
                                                <h2>Sign In Required</h2>
                                                <p>Please sign in with your Google account to continue using StudyAidX.</p>
                                                <button id="popupGoogleSignInBtn" class="google-signin-button">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="Google logo">
                                                    Sign in with Google
                                                </button>
                                                <img src="https://studyaidx.web.app/lovable-uploads/1111a9ca-bbb6-46dd-bfbc-fcf9737a3b56.png" alt="StudyAidX Logo" class="popup-logo">
                                            `; // Updated with specified logo
                document.body.appendChild(popup);

                // Add event listener only once when popup is created
                const signInBtn = document.getElementById(
                    "popupGoogleSignInBtn",
                );
                if (signInBtn) {
                    // Reset button state every time popup is shown
                    signInBtn.disabled = false;
                    signInBtn.innerHTML = `
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="Google logo">
                                                    Sign in with Google
                                                `;
                    signInBtn.removeEventListener(
                        "click",
                        signInWithGoogleAndClosePopup,
                    ); // Remove previous listener if any
                    signInBtn.addEventListener(
                        "click",
                        signInWithGoogleAndClosePopup,
                    );

                    // Add additional animation interaction
                    signInBtn.addEventListener("mouseover", () => {
                        const logo = document.querySelector(
                            "#loginPopup .popup-logo",
                        );
                        if (logo)
                            logo.style.transform =
                                "scale(1.1) translateY(-5px)";
                    });

                    signInBtn.addEventListener("mouseout", () => {
                        const logo = document.querySelector(
                            "#loginPopup .popup-logo",
                        );
                        if (logo) logo.style.transform = "";
                    });
                }

                // Add event listener for the close button
                const closeBtn = document.getElementById("loginPopupCloseBtn");
                if (closeBtn) {
                    closeBtn.addEventListener("click", () => {
                        hideLoginPopupWithAnimation();
                    });
                }
            }

            // Hide main menus with smooth transition
            const defaultMenu = document.getElementById("quizHelperMenu");
            const assistantMenu = document.getElementById(
                "studyAidAssistantMenu",
            );

            if (defaultMenu) {
                defaultMenu.style.transition =
                    "opacity 0.4s ease, transform 0.4s ease";
                defaultMenu.style.opacity = "0";
                defaultMenu.style.transform = "translateY(20px)";
                setTimeout(() => {
                    defaultMenu.style.display = "none";
                }, 400);
            }

            if (assistantMenu) {
                assistantMenu.style.transition =
                    "opacity 0.4s ease, transform 0.4s ease";
                assistantMenu.style.opacity = "0";
                assistantMenu.style.transform = "translateY(20px)";
                setTimeout(() => {
                    assistantMenu.style.display = "none";
                }, 400);
            }

            // Show backdrop with animation
            backdrop.style.display = "block";
            backdrop.style.opacity = "0";

            // Show popup with animation
            popup.style.display = "block";
            popup.style.opacity = "0";

            // Use requestAnimationFrame to ensure the transition applies
            requestAnimationFrame(() => {
                backdrop.style.opacity = "1";
                popup.classList.add("active");
            });

            document.body.classList.add("login-popup-active");
        }

        // New function to hide popup with animation
        function hideLoginPopupWithAnimation() {
            const backdrop = document.getElementById("loginBackdrop");
            const popup = document.getElementById("loginPopup");

            if (backdrop) {
                backdrop.style.opacity = "0";
                backdrop.style.backdropFilter = "blur(0px)";
            }

            if (popup) {
                popup.style.opacity = "0";
                popup.style.transform = "translate(-50%, -50%) scale(0.9)";
            }

            // Wait for animation to complete before fully hiding
            setTimeout(() => {
                hideLoginPopup();
            }, 400);
        }

        function hideLoginPopup() {
            console.log("Hiding login popup...");
            const backdrop = document.getElementById("loginBackdrop");
            const popup = document.getElementById("loginPopup");

            if (backdrop) backdrop.style.display = "none";
            if (popup) {
                popup.style.display = "none";
                popup.classList.remove("active");
            }
            document.body.classList.remove("login-popup-active");

            // Show the correct menu based on current version AFTER hiding popup with animation
            const defaultMenu = document.getElementById("quizHelperMenu");
            const assistantMenu = document.getElementById(
                "studyAidAssistantMenu",
            );

            if (currentVersion === STUDYAIDX_VERSION.DEFAULT && defaultMenu) {
                if (localStorage.getItem("menuMinimized") !== "true") {
                    defaultMenu.style.display = "block";

                    // Animate the menu appearance
                    defaultMenu.style.opacity = "0";
                    defaultMenu.style.transform = "translateY(20px)";

                    setTimeout(() => {
                        defaultMenu.style.transition =
                            "opacity 0.4s ease, transform 0.4s ease";
                        defaultMenu.style.opacity = "1";
                        defaultMenu.style.transform = "translateY(0)";
                    }, 50);
                }
            } else if (
                currentVersion === STUDYAIDX_VERSION.ASSISTANT &&
                assistantMenu
            ) {
                if (localStorage.getItem("menuMinimized") !== "true") {
                    assistantMenu.style.display = "flex";

                    // Animate the assistant menu appearance
                    assistantMenu.style.opacity = "0";
                    assistantMenu.style.transform = "translateY(20px)";

                    setTimeout(() => {
                        assistantMenu.style.transition =
                            "opacity 0.4s ease, transform 0.4s ease";
                        assistantMenu.style.opacity = "1";
                        assistantMenu.style.transform = "translateY(0)";
                    }, 50);
                }
            }
        }

        // Wrapper for sign-in logic
        async function signInWithGoogleAndClosePopup() {
            const signInBtn = document.getElementById("popupGoogleSignInBtn");
            if (signInBtn) {
                // Update button text to indicate signing in
                signInBtn.textContent = "Signing in...";
                signInBtn.disabled = true;
            }
            try {
                const user = await signInWithGoogle(); // Call original sign-in
                if (user) {
                    // User successfully signed in and is not banned
                    hideLoginPopup();
                    // updateUserInfo is called within signInWithGoogle/onAuthStateChanged
                    // Reload or re-initialize UI as needed (original code reloads)
                    // alert("Đăng nhập thành công! Tải lại trang..."); // Optional: notify user
                    // window.location.reload(); // Re-enable if needed
                } else {
                    // Sign in failed or user was banned - keep popup open
                    if (signInBtn) {
                        signInBtn.textContent = "Sign in with Google";
                        signInBtn.disabled = false;
                    }
                    // Error/ban message is shown by signInWithGoogle or showBannedUserAlert
                }
            } catch (error) {
                console.error("Popup Sign in error:", error);
                alert("Sign in failed. Please try again."); // Generic error for popup
                if (signInBtn) {
                    signInBtn.textContent = "Sign in with Google";
                    signInBtn.disabled = false;
                }
            }
        }
        // --- End Login Popup Functions ---
        const userConfig = new UserConfig();

        // Update auth state handler to initialize config
        // Update auth state handler to initialize config and manage login popup
        async function checkAuthState() {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    localStorage.setItem("userId", user.uid);
                    await userConfig.initialize(user.uid);
                    updateUserInfo(user);
                } else {
                    localStorage.removeItem("userId");
                    // Ensure menus are hidden before showing popup
                    const defaultMenu =
                        document.getElementById("quizHelperMenu");
                    const assistantMenu = document.getElementById(
                        "studyAidAssistantMenu",
                    );
                    if (defaultMenu) defaultMenu.style.display = "none";
                    if (assistantMenu) assistantMenu.style.display = "none";
                    showLoginPopup();
                }
            });
        }

        console.log("StudyAidX initialized successfully!");

        // Function to update the key display
        function updateKeyDisplay(keyType, expirationTime) {
            console.log(
                `Updating key display: Type=${keyType}, Expires=${expirationTime ? new Date(expirationTime) : "N/A"}`,
            );

            const freeKeySection = document.getElementById("freeKeySection");
            const adminKeySection = document.getElementById("adminKeySection");
            // Find or create the key status display element
            let keyStatusDisplay = document.getElementById("keyStatusDisplay");
            if (!keyStatusDisplay) {
                // Create the element if it doesn't exist and append it logically (e.g., after auth section)
                const authSection = document.querySelector(
                    ".user-authentication",
                ); // Find a suitable parent
                if (authSection) {
                    keyStatusDisplay = document.createElement("div");
                    keyStatusDisplay.id = "keyStatusDisplay";
                    authSection.parentNode.insertBefore(
                        keyStatusDisplay,
                        authSection.nextSibling,
                    );
                }
            }

            if (keyType && keyStatusDisplay) {
                // Key is active, hide input sections and show status
                if (freeKeySection) freeKeySection.style.display = "none";
                if (adminKeySection) adminKeySection.style.display = "none";

                let statusText = `Trạng thái: Key ${keyType.replace("_", " ")} đang hoạt động`; // Make type more readable
                if (expirationTime) {
                    const expiryDate = new Date(expirationTime);
                    statusText += ` (Hết hạn: ${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString()})`;
                }
                keyStatusDisplay.textContent = statusText;
                keyStatusDisplay.style.display = "block"; // Make sure status is visible
                keyStatusDisplay.style.color = "#2e7d32"; // Darker green for better readability
                keyStatusDisplay.style.marginTop = "15px";
                keyStatusDisplay.style.marginBottom = "15px";
                keyStatusDisplay.style.padding = "10px 15px";
                keyStatusDisplay.style.border = "1px solid #a5d6a7";
                keyStatusDisplay.style.borderRadius = "8px";
                keyStatusDisplay.style.backgroundColor = "#e8f5e9";
                keyStatusDisplay.style.textAlign = "center";
                keyStatusDisplay.style.fontWeight = "500";
            } else {
                // No active key, show input sections and hide status
                if (freeKeySection) freeKeySection.style.display = "block";
                if (adminKeySection) adminKeySection.style.display = "block";
                if (keyStatusDisplay) {
                    keyStatusDisplay.style.display = "none"; // Hide status display
                }
            }
        }

        // Helper function to read user key status from Firestore
        async function readUserKeyStatusFromFirestore(userId) {
            if (!userId) return null;
            const db = firebase.firestore();
            const userStatusRef = db.collection("user_key_status").doc(userId);
            try {
                const doc = await userStatusRef.get();
                if (doc.exists) {
                    let data = doc.data();
                    console.log(
                        `Successfully read key status from Firestore for user ${userId}:`,
                        data,
                    );

                    // Convert Timestamps to epoch milliseconds
                    if (data.expirationTime && data.expirationTime.toDate) {
                        data.expirationTime = data.expirationTime
                            .toDate()
                            .getTime();
                    }
                    if (data.lastChecked && data.lastChecked.toDate) {
                        data.lastChecked = data.lastChecked.toDate().getTime();
                    }

                    // Basic validation of returned data (expirationTime is now number or null)
                    if (
                        data.hasOwnProperty("keyType") &&
                        data.hasOwnProperty("expirationTime")
                    ) {
                        return data; // Return { keyType, expirationTime (number|null), activatedKeyId, lastChecked (number) }
                    }
                    console.warn(
                        `Incomplete key status data found in Firestore for user ${userId}.`,
                    );
                    return null;
                } else {
                    console.log(
                        `No key status document found in Firestore for user ${userId}.`,
                    );
                    return null;
                }
            } catch (error) {
                console.error(
                    `Error reading key status from Firestore for user ${userId}:`,
                    error,
                );
                return null; // Return null on error
            }
        }

        // Set up persistent auth state listener
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                // Set user info in localStorage immediately upon successful auth
                localStorage.setItem("userId", user.uid); // Set userId
                localStorage.setItem("userEmail", user.email); // Set userEmail
                console.log("User info set in localStorage:", {
                    userId: user.uid,
                    userEmail: user.email,
                }); // Log for confirmation

                // Check if user is banned
                try {
                    const bannedDoc = await db
                        .collection("banned_users")
                        .doc(user.email)
                        .get();
                    if (bannedDoc.exists) {
                        await firebase.auth().signOut();
                        // Clear local storage on ban before showing alert
                        localStorage.removeItem("userId");
                        localStorage.removeItem("userEmail");
                        localStorage.removeItem("activatedKeyId");
                        localStorage.removeItem("keyType");
                        localStorage.removeItem("keyExpirationTime");
                        await showBannedUserAlert(bannedDoc.data());
                        destroyMenu();
                        return;
                    }

                    // User is not banned, proceed normally
                    updateUserInfo(user); // Update UI elements

                    // --- Display Last Activated Key and Reactivate Button ---
                    const lastKeyId = localStorage.getItem("activatedKeyId");
                    const lastKeyType = localStorage.getItem("keyType");
                    let reactivateSection =
                        document.getElementById("reactivateSection");
                    const authSection = document.querySelector(
                        ".user-authentication",
                    ); // Find the auth section

                    if (!reactivateSection && authSection) {
                        reactivateSection = document.createElement("div");
                        reactivateSection.id = "reactivateSection";
                        reactivateSection.style.marginTop = "15px";
                        reactivateSection.style.padding = "10px";
                        reactivateSection.style.border = "1px solid #eee";
                        reactivateSection.style.borderRadius = "8px";
                        reactivateSection.style.fontSize = "13px";
                        authSection.parentNode.insertBefore(
                            reactivateSection,
                            authSection.nextSibling,
                        ); // Insert after auth section
                    }

                    if (reactivateSection) {
                        if (lastKeyId && lastKeyType) {
                            reactivateSection.innerHTML = `
                                                            <p style="margin-bottom: 8px; color: #555;">Key kích hoạt gần nhất:</p>
                                                            <p style="font-weight: 500; margin-bottom: 12px; word-break: break-all;">${lastKeyId} (${lastKeyType})</p>
                                                            <button id="reactivateLastKeyButton" class="studyaidx-button studyaidx-button-secondary" style="width: 100%;">Kích hoạt lại</button>
                                                        `;
                            reactivateSection.style.display = "block";

                            const reactivateButton = document.getElementById(
                                "reactivateLastKeyButton",
                            );
                            if (reactivateButton) {
                                reactivateButton.onclick = async () => {
                                    console.log(
                                        `Attempting to reactivate Key: ${lastKeyId} (Type: ${lastKeyType})`,
                                    );
                                    reactivateButton.textContent =
                                        "Đang kích hoạt...";
                                    reactivateButton.disabled = true;

                                    try {
                                        if (lastKeyType === "FREE") {
                                            const freeInput =
                                                document.getElementById(
                                                    "freeKeyInput",
                                                );
                                            if (freeInput) {
                                                freeInput.value = lastKeyId;
                                                await activateFreeKey(); // Call the activation function
                                            } else {
                                                throw new Error(
                                                    "Free key input not found.",
                                                );
                                            }
                                        } else if (lastKeyType === "PREMIUM") {
                                            const premiumInput =
                                                document.getElementById(
                                                    "premiumKeyInput",
                                                );
                                            if (premiumInput) {
                                                premiumInput.value = lastKeyId;
                                                await activatePremiumKey(); // Call the activation function
                                            } else {
                                                throw new Error(
                                                    "Premium key input not found.",
                                                );
                                            }
                                        } else {
                                            throw new Error(
                                                "Unknown last key type.",
                                            );
                                        }
                                        // If activation is successful, the updateKeyDisplay should hide the inputs/reactivate section
                                    } catch (error) {
                                        console.error(
                                            "Reactivation failed:",
                                            error,
                                        );
                                        alert(
                                            `Kích hoạt lại thất bại: ${error.message}`,
                                        );
                                        reactivateButton.textContent =
                                            "Kích hoạt lại"; // Reset button text on failure
                                        reactivateButton.disabled = false;
                                    }
                                };
                            }
                        } else {
                            reactivateSection.style.display = "none"; // Hide if no last key info
                        }
                    }
                    // --- End Display Last Activated Key ---

                    // --- Fast Key Authentication Integration with Retry Logic ---
                    console.log("Starting fast key authentication on auth state change...");
                    const fastAuthStartTime = performance.now();
                    let finalKeyStatus = null;
                    let localKeyStatus = null;

                    // Attempt fast authentication with retry mechanism
                    let fastAuthResult = null;
                    let retryCount = 0;
                    const maxRetries = 3;

                    while (retryCount < maxRetries && (!fastAuthResult || !fastAuthResult.success)) {
                        if (retryCount > 0) {
                            console.log(`🔄 Fast auth retry attempt ${retryCount}/${maxRetries}...`);
                            await new Promise(resolve => setTimeout(resolve, retryCount * 500)); // Progressive delay
                        }

                        fastAuthResult = await fastKeyAuthentication();
                        retryCount++;

                        // If successful, break out of retry loop
                        if (fastAuthResult.success) {
                            console.log(`✅ Fast auth succeeded on attempt ${retryCount}`);
                            break;
                        }

                        // If it's a non-retryable error, break
                        if (!fastAuthResult.requiresManualAuth) {
                            console.log(`❌ Fast auth failed with non-retryable error: ${fastAuthResult.errorReason}`);
                            break;
                        }

                        console.log(`⚠️ Fast auth attempt ${retryCount} failed: ${fastAuthResult.errorReason}`);
                    }

                    const fastAuthEndTime = performance.now();
                    const fastAuthDuration = fastAuthEndTime - fastAuthStartTime;

                    console.log(`Fast authentication completed in ${fastAuthDuration.toFixed(2)}ms (${retryCount} attempts)`);

                    if (fastAuthResult.success) {
                        console.log("Fast authentication successful:", fastAuthResult);

                        // Update display with fast auth results
                        updateKeyDisplay(fastAuthResult.keyType, fastAuthResult.expirationTime);

                        // Set final status from fast auth
                        finalKeyStatus = {
                            isValid: true,
                            keyType: fastAuthResult.keyType,
                            expirationTime: fastAuthResult.expirationTime,
                            activatedKeyId: localStorage.getItem("activatedKeyId")
                        };

                        console.log("Fast authentication completed successfully - skipping manual activation");

                    } else {
                        console.log(`Fast authentication failed: ${fastAuthResult.errorReason}`);

                        if (fastAuthResult.requiresManualAuth) {
                            console.log("Falling back to manual activation logic...");

                            // Fallback to existing manual activation logic
                            let localKeyStatus = await checkKeyValidity(); // Check local storage first

                            // 1. Update display immediately if local key is valid
                            if (localKeyStatus.isValid) {
                                console.log(
                                    "Local key valid, updating display tentatively:",
                                    localKeyStatus,
                                );
                                updateKeyDisplay(
                                    localKeyStatus.keyType,
                                    localKeyStatus.expirationTime,
                                );
                                // Store this as a potential final status, might be overwritten by Firestore
                                finalKeyStatus = {
                                    isValid: true,
                                    keyType: localKeyStatus.keyType,
                                    expirationTime: localKeyStatus.expirationTime,
                                    activatedKeyId:
                                        localStorage.getItem("activatedKeyId"), // Key ID from local storage
                                };

                                // --- ENHANCED MANUAL ACTIVATION FALLBACK ---
                                const storedKeyId = localStorage.getItem("activatedKeyId");
                                const storedKeyType = localStorage.getItem("keyType");

                                if (storedKeyId && storedKeyType) {
                                    console.log(`Attempting direct manual activation for ${storedKeyType} key: ${storedKeyId}`);

                                    try {
                                        // Try direct activation without UI simulation
                                        if (storedKeyType === "FREE") {
                                            const directResult = await activateFreeKeyDirect(storedKeyId, {
                                                isGlobal: true, // Assume global for fallback
                                                isUsed: false,
                                                expirationDate: { toDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // 24h from now
                                            }, user);

                                            if (directResult.success) {
                                                console.log("Direct manual Free key activation successful");
                                                finalKeyStatus = {
                                                    isValid: true,
                                                    keyType: "FREE",
                                                    expirationTime: directResult.expirationTime,
                                                    activatedKeyId: storedKeyId
                                                };
                                            } else {
                                                console.warn(`Direct manual Free key activation failed: ${directResult.reason}`);
                                            }
                                        } else if (storedKeyType === "PREMIUM") {
                                            const directResult = await activatePremiumKeyDirect(storedKeyId, {
                                                isGlobal: true, // Assume global for fallback
                                                isActivated: false,
                                                type: "30", // Assume 30-day key
                                                duration: 30
                                            }, user);

                                            if (directResult.success) {
                                                console.log("Direct manual Premium key activation successful");
                                                finalKeyStatus = {
                                                    isValid: true,
                                                    keyType: "PREMIUM",
                                                    expirationTime: directResult.expirationTime,
                                                    activatedKeyId: storedKeyId
                                                };
                                            } else {
                                                console.warn(`Direct manual Premium key activation failed: ${directResult.reason}`);
                                            }
                                        }
                                    } catch (directError) {
                                        console.error("Direct manual activation failed, key may be invalid:", directError);
                                        // Clear invalid key data if direct activation fails
                                        clearInvalidKeyData();
                                        finalKeyStatus = null;
                                    }
                                } else {
                                    console.info("No stored key data available for manual activation fallback");
                                }
                                // --- END ENHANCED MANUAL ACTIVATION FALLBACK ---
                            } else {
                                console.log("Local key invalid, clearing display.");
                                updateKeyDisplay(null, null); // Clear display if local key is invalid
                                finalKeyStatus = null;
                            }
                        } else {
                            // Fast auth failed but doesn't require manual auth (e.g., system disabled)
                            console.log("Fast auth failed without requiring manual auth - clearing display");
                            updateKeyDisplay(null, null);
                            finalKeyStatus = null;
                        }
                    }

                    // 2. Check Firestore for authoritative status
                    console.log(
                        "Checking Firestore for authoritative key status...",
                    );
                    const firestoreStatus =
                        await readUserKeyStatusFromFirestore(user.uid);
                    const now = Date.now();
                    let firestoreKeyIsValid = false;

                    if (firestoreStatus && firestoreStatus.activatedKeyId) {
                        const expiration = firestoreStatus.expirationTime; // Already a number or null
                        const localKeyId =
                            localStorage.getItem("activatedKeyId");

                        // Check if Firestore key matches local key ID AND is not expired
                        if (
                            firestoreStatus.activatedKeyId === localKeyId &&
                            (expiration === null || now < expiration)
                        ) {
                            console.log(
                                "Firestore status is valid and matches local key:",
                                firestoreStatus,
                            );
                            firestoreKeyIsValid = true;
                            // Firestore is the source of truth, update finalKeyStatus
                            finalKeyStatus = {
                                isValid: true,
                                keyType: firestoreStatus.keyType,
                                expirationTime: expiration,
                                activatedKeyId: firestoreStatus.activatedKeyId,
                            };
                        } else if (
                            firestoreStatus.activatedKeyId !== localKeyId
                        ) {
                            console.log(
                                "Firestore key ID mismatch with local storage. Local key might be newer or invalid.",
                            );
                            // Keep the localKeyStatus if it was valid, otherwise finalKeyStatus remains null/invalid
                            if (!localKeyStatus || !localKeyStatus.isValid) finalKeyStatus = null;
                        } else {
                            // expiration !== null && now >= expiration
                            console.log(
                                "Firestore status is expired. Clearing Firestore and local storage.",
                            );
                            await clearUserKeyStatusInFirestore(user.uid);
                            localStorage.removeItem("activatedKeyId");
                            localStorage.removeItem("keyType");
                            localStorage.removeItem("keyExpirationTime");
                            finalKeyStatus = null; // Mark as invalid
                        }
                    } else {
                        console.log("No valid key status found in Firestore.");
                        // If local key was valid, keep it. Otherwise, it's invalid.
                        if (!localKeyStatus || !localKeyStatus.isValid) finalKeyStatus = null;
                    }

                    // 3. Apply the final determined status (if different from initial local display)
                    // Check if final status differs from what was initially displayed based on local storage
                    const needsDisplayUpdate =
                        (!finalKeyStatus && localKeyStatus && localKeyStatus.isValid) || // Was valid locally, now invalid
                        (finalKeyStatus && localKeyStatus && !localKeyStatus.isValid) || // Was invalid locally, now valid
                        (finalKeyStatus &&
                            localKeyStatus && localKeyStatus.isValid && // Both valid, but different details
                            (finalKeyStatus.keyType !==
                                localKeyStatus.keyType ||
                                finalKeyStatus.expirationTime !==
                                localKeyStatus.expirationTime));

                    if (needsDisplayUpdate) {
                        console.log(
                            "Final key status differs from initial local check, updating display:",
                            finalKeyStatus,
                        );
                        updateKeyDisplay(
                            finalKeyStatus ? finalKeyStatus.keyType : null,
                            finalKeyStatus
                                ? finalKeyStatus.expirationTime
                                : null,
                        );
                    } else {
                        console.log(
                            "Final key status matches initial local check, no display update needed.",
                        );
                    }

                    // 4. Update local storage based on the final authoritative status
                    if (finalKeyStatus && finalKeyStatus.isValid) {
                        console.log(
                            "Updating local storage with final key status:",
                            finalKeyStatus,
                        );
                        localStorage.setItem(
                            "activatedKeyId",
                            finalKeyStatus.activatedKeyId,
                        );
                        localStorage.setItem("keyType", finalKeyStatus.keyType);
                        if (finalKeyStatus.expirationTime) {
                            localStorage.setItem(
                                "keyExpirationTime",
                                finalKeyStatus.expirationTime.toString(),
                            );
                        } else {
                            localStorage.removeItem("keyExpirationTime");
                        }
                        activeKey = finalKeyStatus.activatedKeyId;
                        keyExpirationTime = finalKeyStatus.expirationTime;
                    } else {
                        console.log(
                            "Final key status is invalid, ensuring local storage is clear.",
                        );
                        // Ensure local storage is cleared if the final status is invalid
                        localStorage.removeItem("activatedKeyId");
                        localStorage.removeItem("keyType");
                        localStorage.removeItem("keyExpirationTime");
                        activeKey = null;
                        keyExpirationTime = null;
                    }
                    // --- End Refined Key Validation Logic ---
                    // Removed redundant check based on undefined variable 'keyStatusFromFirestoreIsValid'
                    /*
                    if (!keyStatusFromFirestoreIsValid) {
                        console.log("No valid key status from Firestore, running full checkKeyValidity...");
                        const keyStatus = await checkKeyValidity(); // This now updates Firestore on its own
                        updateKeyDisplay(keyStatus.keyType, keyStatus.expirationTime);
                    }
                    */

                    if (window.authCheckInterval) {
                        clearInterval(window.authCheckInterval);
                        window.authCheckInterval = null;
                    }
                } catch (error) {
                    console.error("Error checking banned status:", error);
                    alert("Có lỗi xảy ra khi kiểm tra trạng thái tài khoản!");
                }
            } else {
                // User is signed out - clear any stored keys
                console.log("User signed out, clearing stored keys...");

                // Clear localStorage keys
                localStorage.removeItem("activatedKeyId");
                localStorage.removeItem("keyType");
                localStorage.removeItem("activeKey");
                localStorage.removeItem("keyExpirationTime");
                localStorage.removeItem("keyDuration");
                localStorage.removeItem("keyActivatedAt");

                // Reset global state
                if (typeof activeKey !== 'undefined') {
                    activeKey = null;
                }
                if (typeof keyExpirationTime !== 'undefined') {
                    keyExpirationTime = null;
                }

                // Clear UI display
                updateKeyDisplay(null, null);

                if (!window.authCheckInterval) {
                    checkAuthState();
                    window.authCheckInterval = setInterval(
                        checkAuthState,
                        10000,
                    );
                }
            }
        });
    } catch (error) {
        console.error("Firebase initialization error:", error);
        alert("Khởi tạo thất bại. Vui lòng tải lại trang!");
    }
}

// Original sign-in logic, now primarily called by signInWithGoogleAndClosePopup
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: "select_account",
    });

    try {
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;

        // Check if user is banned
        const db = firebase.firestore();
        const bannedDoc = await db
            .collection("banned_users")
            .doc(user.email)
            .get();

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
        // alert("Đăng nhập thành công!"); // Notification moved or handled by caller
        // window.location.reload(); // Reload handled by caller if needed
        return user;
    } catch (error) {
        console.error("Sign in error:", error);
        // Reset button state on error
        const signInBtn = document.getElementById("popupGoogleSignInBtn");
        if (signInBtn) {
            signInBtn.disabled = false;
            signInBtn.innerHTML = `
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="Google logo">
                                            Sign in with Google
                                        `;
        }
        // alert("Đăng nhập thất bại. Vui lòng thử lại."); // Optional: notify user
        // Don't hide popup on error, let user try again or close manually
        // hideLoginPopup();
        throw error; // Re-throw error for potential higher-level handling
    }
}

// [Rest of the code remains the same...]
function setupAuthUI() {
    const menuContent = document.getElementById("menuContent");
    if (!menuContent.querySelector("#loginSection")) {
        menuContent.insertAdjacentHTML("afterbegin", loginSection);
    }
    if (!menuContent.querySelector("#keySection")) {
        menuContent.insertAdjacentHTML("beforeend", keySection); // Thêm dòng này
    }

    // const signInBtn = document.getElementById("googleSignInBtn"); // Button is now in the popup
    // if (signInBtn) {
    //     signInBtn.addEventListener("click", signInWithGoogleAndClosePopup); // Use the wrapper
    // }
}

function updateUserInfo(user) {
    const userInfo = document.getElementById("userInfo");
    if (!userInfo) return;

    if (user) {
        localStorage.setItem("userId", user.uid);
        userInfo.innerHTML = `
                                            <img src="${user.photoURL}" alt="Profile" style="width: 30px; border-radius: 50%;">
                                            <p>Welcome, ${user.displayName}</p>
                                            <button id="signOutBtn" class="button button-secondary" title="Đăng xuất khỏi tài khoản">Sign Out</button>
                                        `;
        userInfo.classList.add("show");

        const signOutBtn = document.getElementById("signOutBtn");
        if (signOutBtn) {
            signOutBtn.addEventListener("click", () => {
                const shouldLogout = confirm(
                    "Bạn có chắc muốn đăng xuất không?",
                );
                if (shouldLogout) {
                    firebase
                        .auth()
                        .signOut()
                        .then(() => {
                            alert("Đăng xuất thành công!");
                            userInfo.classList.remove("show");
                            userInfo.innerHTML = "";
                            // destroyMenu(); // Don't destroy menu, show login popup instead
                            // Clear user-specific local storage
                            localStorage.removeItem("userId");
                            localStorage.removeItem("userEmail");
                            localStorage.removeItem("activatedKeyId");
                            localStorage.removeItem("keyType");
                            localStorage.removeItem("keyExpirationTime");
                            // Hide menus and show login popup
                            const defaultMenu =
                                document.getElementById("quizHelperMenu");
                            const assistantMenu = document.getElementById(
                                "studyAidAssistantMenu",
                            );
                            if (defaultMenu) defaultMenu.style.display = "none";
                            if (assistantMenu)
                                assistantMenu.style.display = "none";
                            showLoginPopup();
                            // setTimeout(() => location.reload(), 1000); // Don't reload immediately
                        })
                        .catch((error) => {
                            console.error("Sign out error:", error);
                            alert("Đăng xuất thất bại. Vui lòng thử lại!");
                        });
                }
            });
        }
    } else {
        userInfo.classList.remove("show");
        userInfo.innerHTML = "";
    }
}

// Update auth state handler to initialize config and manage login popup
// This specific checkAuthState seems redundant due to the onAuthStateChanged listener
/* async function checkAuthState() {
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
                alert("Bạn đã hủy đăng nhập. StudyAidX sẽ bị vô hiệu hóa!");
            }
        } catch (error) {
            if (window.authCheckInterval) {
                clearInterval(window.authCheckInterval);
                window.authCheckInterval = null;
            }
            destroyMenu();
            alert(
                "Đăng nhập bị hủy hoặc thất bại. StudyAidX sẽ bị vô hiệu hóa!",
            );
        }
    }
}*/

// Enhanced Answer Display System
class AnswerDisplaySystem {
    constructor() {
        this.answerCache = new Map(); // Cache to store processed answers
        this.styleInjected = false;
    }

    // Inject necessary styles for answer display
    injectStyles() {
        if (this.styleInjected) return;

        const answerDisplayStyle = document.createElement("style");
        answerDisplayStyle.textContent = `
                                        .studyaidx-answer-highlight {
                                            background-color: #4CAF50 !important;
                                            color: white !important;
                                            border: 2px solid #2E7D32 !important;
                                            padding: 5px !important;
                                            border-radius: 5px !important;
                                            transition: all 0.3s ease !important;
                                            box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
                                        }

                                        .studyaidx-fill-blank-highlight {
                                            border-bottom: 2px solid #4CAF50 !important;
                                            position: relative !important;
                                            padding: 0 3px !important;
                                        }

                                        .studyaidx-answer-tooltip {
                                            position: absolute !important;
                                            bottom: 100% !important;
                                            left: 50% !important;
                                            transform: translateX(-50%) !important;
                                            background-color: #333 !important;
                                            color: white !important;
                                            padding: 5px 10px !important;
                                            border-radius: 5px !important;
                                            font-size: 12px !important;
                                            white-space: nowrap !important;
                                            z-index: 1000 !important;
                                            opacity: 0 !important;
                                            transition: opacity 0.3s ease !important;
                                            pointer-events: none !important;
                                        }

                                        .studyaidx-fill-blank-highlight:hover .studyaidx-answer-tooltip {
                                            opacity: 1 !important;
                                        }

                                        .studyaidx-multiple-choice {
                                            border: 1px solid #4CAF50 !important;
                                            background-color: rgba(76, 175, 80, 0.1) !important;
                                        }

                                        .studyaidx-answer-badge {
                                            display: inline-block !important;
                                            background-color: #4CAF50 !important;
                                            color: white !important;
                                            padding: 2px 8px !important;
                                            border-radius: 12px !important;
                                            font-size: 12px !important;
                                            margin-right: 5px !important;
                                            margin-bottom: 5px !important;
                                        }

                                        .studyaidx-answer-panel {
                                            position: fixed !important;
                                            bottom: 20px !important;
                                            left: 20px !important;
                                            background-color: white !important;
                                            border-radius: 10px !important;
                                            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
                                            padding: 15px !important;
                                            z-index: 9999 !important;
                                            max-width: 300px !important;
                                            max-height: 400px !important;
                                            overflow-y: auto !important;
                                            transform: translateY(150%) !important;
                                            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                                        }

                                        .studyaidx-answer-panel.active {
                                            transform: translateY(0) !important;
                                        }

                                        .studyaidx-panel-header {
                                            display: flex !important;
                                            justify-content: space-between !important;
                                            align-items: center !important;
                                            margin-bottom: 10px !important;
                                            padding-bottom: 10px !important;
                                            border-bottom: 1px solid #eee !important;
                                        }

                                        .studyaidx-panel-title {
                                            font-weight: bold !important;
                                            font-size: 14px !important;
                                            color: #333 !important;
                                        }

                                        .studyaidx-panel-close {
                                            background: none !important;
                                            border: none !important;
                                            color: #999 !important;
                                            font-size: 18px !important;
                                            cursor: pointer !important;
                                            padding: 0 !important;
                                            width: 24px !important;
                                            height: 24px !important;
                                            display: flex !important;
                                            align-items: center !important;
                                            justify-content: center !important;
                                            border-radius: 50% !important;
                                            transition: all 0.2s !important;
                                        }

                                        .studyaidx-panel-close:hover {
                                            background-color: #f5f5f5 !important;
                                            color: #333 !important;
                                        }

                                        .studyaidx-answer-item {
                                            margin-bottom: 10px !important;
                                            padding: 8px !important;
                                            background-color: #f9f9f9 !important;
                                            border-radius: 5px !important;
                                            font-size: 13px !important;
                                        }

                                        .studyaidx-answer-question {
                                            font-weight: bold !important;
                                            margin-bottom: 5px !important;
                                            color: #333 !important;
                                        }

                                        .studyaidx-answer-text {
                                            color: #4CAF50 !important;
                                        }

                                        .studyaidx-toggle-button {
                                            position: fixed !important;
                                            bottom: 20px !important;
                                            left: 20px !important;
                                            background-color: #4CAF50 !important;
                                            color: white !important;
                                            border: none !important;
                                            border-radius: 50% !important;
                                            width: 50px !important;
                                            height: 50px !important;
                                            display: flex !important;
                                            align-items: center !important;
                                            justify-content: center !important;
                                            font-size: 20px !important;
                                            cursor: pointer !important;
                                            box-shadow: 0 4px 10px rgba(0,0,0,0.2) !important;
                                            z-index: 9998 !important;
                                            transition: all 0.3s ease !important;
                                        }

                                        .studyaidx-toggle-button:hover {
                                            transform: scale(1.1) !important;
                                            box-shadow: 0 6px 15px rgba(0,0,0,0.3) !important;
                                        }
                                    `;
        document.head.appendChild(answerDisplayStyle);
        this.styleInjected = true;
    }

    // Create the floating answer panel
    createAnswerPanel() {
        // Remove existing panel if any
        this.removeAnswerPanel();

        // Create toggle button
        const toggleButton = document.createElement("button");
        toggleButton.className = "studyaidx-toggle-button";
        toggleButton.innerHTML = "💡";
        toggleButton.title = "Show/Hide Answers";
        document.body.appendChild(toggleButton);

        // Create panel
        const panel = document.createElement("div");
        panel.className = "studyaidx-answer-panel";
        panel.innerHTML = `
                                        <div class="studyaidx-panel-header">
                                            <div class="studyaidx-panel-title">StudyAidX Answers</div>
                                            <button class="studyaidx-panel-close">×</button>
                                        </div>
                                        <div class="studyaidx-panel-content"></div>
                                    `;
        document.body.appendChild(panel);

        // Setup event listeners
        toggleButton.addEventListener("click", () => {
            panel.classList.toggle("active");
        });

        panel
            .querySelector(".studyaidx-panel-close")
            .addEventListener("click", () => {
                panel.classList.remove("active");
            });

        return panel;
    }

    // Remove the floating answer panel
    removeAnswerPanel() {
        const existingPanel = document.querySelector(".studyaidx-answer-panel");
        if (existingPanel) existingPanel.remove();

        const existingToggle = document.querySelector(
            ".studyaidx-toggle-button",
        );
        if (existingToggle) existingToggle.remove();
    }

    // Add an answer to the panel
    addAnswerToPanel(questionText, answerText) {
        const panel = document.querySelector(".studyaidx-answer-panel");
        if (!panel) return;

        const content = panel.querySelector(".studyaidx-panel-content");
        const item = document.createElement("div");
        item.className = "studyaidx-answer-item";

        // Truncate question text if too long
        const truncatedQuestion =
            questionText.length > 50
                ? questionText.substring(0, 50) + "..."
                : questionText;

        item.innerHTML = `
                                        <div class="studyaidx-answer-question">${truncatedQuestion}</div>
                                        <div class="studyaidx-answer-text">${answerText}</div>
                                    `;

        content.appendChild(item);
    }

    // Display answers for multiple choice questions
    displayMultipleChoiceAnswer(questionElement, correctAnswer) {
        try {
            if (!questionElement) return;

            // Find all options
            const options = Array.from(
                questionElement.querySelectorAll(
                    'input[type="radio"], input[type="checkbox"]',
                ),
            );
            if (options.length === 0) return;

            // Handle single or multiple correct answers
            const correctAnswers = Array.isArray(correctAnswer)
                ? correctAnswer
                : [correctAnswer];

            options.forEach((option, index) => {
                const label = option.closest("label") || option.parentElement;

                // Check if this option is correct
                const isCorrect = correctAnswers.some((answer) => {
                    // Handle different answer formats
                    if (typeof answer === "number") {
                        return index === answer;
                    } else if (typeof answer === "string") {
                        // Handle letter answers like 'A', 'B', 'C'
                        if (/^[A-Z]$/i.test(answer)) {
                            return (
                                String.fromCharCode(65 + index) ===
                                answer.toUpperCase()
                            );
                        }
                        // Handle numeric string answers
                        if (/^\d+$/.test(answer)) {
                            return index === parseInt(answer, 10) - 1;
                        }
                        // Handle text content match
                        const optionText = label.textContent.trim();
                        return optionText.includes(answer);
                    }
                    return false;
                });

                if (isCorrect) {
                    label.classList.add("studyaidx-answer-highlight");

                    // Add to answer panel
                    const questionText =
                        this.extractQuestionText(questionElement);
                    const optionText = label.textContent.trim();
                    this.addAnswerToPanel(questionText, optionText);
                }
            });
        } catch (error) {
            console.error("Error displaying multiple choice answer:", error);
        }
    }

    // Display answers for fill-in-the-blank questions
    displayFillInTheBlankAnswer(questionElement, answers) {
        try {
            if (!questionElement) return;

            // Find all input fields
            const inputs = Array.from(
                questionElement.querySelectorAll(
                    'input[type="text"], textarea',
                ),
            );
            if (inputs.length === 0) return;

            // Normalize answers to array
            const answerArray = Array.isArray(answers) ? answers : [answers];

            // Map answers to inputs (handling both single and multiple blanks)
            inputs.forEach((input, index) => {
                const answer =
                    index < answerArray.length
                        ? answerArray[index]
                        : answerArray[0];
                if (!answer) return;

                // Create a wrapper for the input
                const wrapper = document.createElement("span");
                wrapper.className = "studyaidx-fill-blank-highlight";
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);

                // Add the tooltip with answer
                const tooltip = document.createElement("span");
                tooltip.className = "studyaidx-answer-tooltip";
                tooltip.textContent = answer;
                wrapper.appendChild(tooltip);

                // Add to answer panel
                const questionText = this.extractQuestionText(questionElement);
                this.addAnswerToPanel(
                    questionText,
                    `Blank #${index + 1}: ${answer}`,
                );
            });
        } catch (error) {
            console.error("Error displaying fill-in-the-blank answer:", error);
        }
    }

    // Display matching answers
    displayMatchingAnswer(questionElement, matchPairs) {
        try {
            if (!questionElement || !matchPairs || !Array.isArray(matchPairs))
                return;

            // Create a visual representation of matches
            const matchContainer = document.createElement("div");
            matchContainer.className = "studyaidx-matching-container";
            matchContainer.style.padding = "10px";
            matchContainer.style.margin = "10px 0";
            matchContainer.style.border = "1px solid #4CAF50";
            matchContainer.style.borderRadius = "5px";

            // Display all match pairs
            matchPairs.forEach((pair) => {
                const matchItem = document.createElement("div");
                matchItem.style.margin = "5px 0";

                const leftBadge = document.createElement("span");
                leftBadge.className = "studyaidx-answer-badge";
                leftBadge.textContent = pair.left || pair[0];

                const arrow = document.createTextNode(" → ");

                const rightBadge = document.createElement("span");
                rightBadge.className = "studyaidx-answer-badge";
                rightBadge.style.backgroundColor = "#2196F3";
                rightBadge.textContent = pair.right || pair[1];

                matchItem.appendChild(leftBadge);
                matchItem.appendChild(arrow);
                matchItem.appendChild(rightBadge);

                matchContainer.appendChild(matchItem);
            });

            // Append to question or a suitable location
            const insertPoint =
                questionElement.querySelector(".question-content") ||
                questionElement;
            insertPoint.appendChild(matchContainer);

            // Add to answer panel
            const questionText = this.extractQuestionText(questionElement);
            this.addAnswerToPanel(
                questionText,
                "See matching pairs in question",
            );
        } catch (error) {
            console.error("Error displaying matching answer:", error);
        }
    }

    // Display ordered/sequence answers
    displayOrderedAnswer(questionElement, correctSequence) {
        try {
            if (
                !questionElement ||
                !correctSequence ||
                !Array.isArray(correctSequence)
            )
                return;

            // Create a visual representation of the correct sequence
            const sequenceContainer = document.createElement("div");
            sequenceContainer.className = "studyaidx-sequence-container";
            sequenceContainer.style.padding = "10px";
            sequenceContainer.style.margin = "10px 0";
            sequenceContainer.style.border = "1px solid #4CAF50";
            sequenceContainer.style.borderRadius = "5px";

            // Add sequence title
            const title = document.createElement("div");
            title.textContent = "Correct Sequence:";
            title.style.fontWeight = "bold";
            title.style.marginBottom = "8px";
            sequenceContainer.appendChild(title);

            // Display each item in the sequence
            correctSequence.forEach((item, index) => {
                const sequenceItem = document.createElement("div");
                sequenceItem.style.margin = "5px 0";
                sequenceItem.style.display = "flex";
                sequenceItem.style.alignItems = "center";

                const number = document.createElement("span");
                number.style.minWidth = "25px";
                number.style.height = "25px";
                number.style.borderRadius = "50%";
                number.style.backgroundColor = "#4CAF50";
                number.style.color = "white";
                number.style.display = "flex";
                number.style.alignItems = "center";
                number.style.justifyContent = "center";
                number.style.marginRight = "10px";
                number.textContent = (index + 1).toString();

                const text = document.createElement("span");
                text.textContent = item;

                sequenceItem.appendChild(number);
                sequenceItem.appendChild(text);

                sequenceContainer.appendChild(sequenceItem);
            });

            // Append to question or a suitable location
            const insertPoint =
                questionElement.querySelector(".question-content") ||
                questionElement;
            insertPoint.appendChild(sequenceContainer);

            // Add to answer panel
            const questionText = this.extractQuestionText(questionElement);
            this.addAnswerToPanel(
                questionText,
                "See correct sequence in question",
            );
        } catch (error) {
            console.error("Error displaying ordered answer:", error);
        }
    }

    // Extract question text from question element
    extractQuestionText(questionElement) {
        try {
            // Try different selectors to find question text
            const questionTextElement =
                questionElement.querySelector(".question-title") ||
                questionElement.querySelector(".question-text") ||
                questionElement.querySelector("h3") ||
                questionElement.querySelector("h4");

            if (questionTextElement) {
                return questionTextElement.textContent.trim();
            }

            // If no specific element found, try to extract the first paragraph
            const firstParagraph = questionElement.querySelector("p");
            if (firstParagraph) {
                return firstParagraph.textContent.trim();
            }

            // If all else fails, use the first 100 characters of the question element
            return questionElement.textContent.trim().substring(0, 100) + "...";
        } catch (error) {
            console.error("Error extracting question text:", error);
            return "Unknown Question";
        }
    }

    // Display any type of answer based on detection
    displayAnswer(questionElement, answer) {
        try {
            if (!questionElement || !answer) return;

            this.injectStyles();

            // Create answer panel if it doesn't exist
            if (!document.querySelector(".studyaidx-answer-panel")) {
                this.createAnswerPanel();
            }

            // Determine answer type and call appropriate display method
            if (Array.isArray(answer)) {
                if (
                    answer.length > 0 &&
                    typeof answer[0] === "object" &&
                    (answer[0].left || answer[0][0])
                ) {
                    // This looks like matching pairs
                    this.displayMatchingAnswer(questionElement, answer);
                } else if (
                    answer.every(
                        (item) =>
                            typeof item === "string" ||
                            typeof item === "number",
                    )
                ) {
                    // Check if it's a multiple choice with multiple answers or a sequence
                    if (
                        questionElement.querySelectorAll(
                            'input[type="checkbox"]',
                        ).length > 0
                    ) {
                        this.displayMultipleChoiceAnswer(
                            questionElement,
                            answer,
                        );
                    } else if (
                        questionElement.querySelectorAll(
                            'input[type="text"], textarea',
                        ).length > 0
                    ) {
                        this.displayFillInTheBlankAnswer(
                            questionElement,
                            answer,
                        );
                    } else {
                        this.displayOrderedAnswer(questionElement, answer);
                    }
                }
            } else if (
                typeof answer === "string" ||
                typeof answer === "number"
            ) {
                if (
                    questionElement.querySelectorAll('input[type="radio"]')
                        .length > 0
                ) {
                    this.displayMultipleChoiceAnswer(questionElement, answer);
                } else if (
                    questionElement.querySelectorAll(
                        'input[type="text"], textarea',
                    ).length > 0
                ) {
                    this.displayFillInTheBlankAnswer(questionElement, answer);
                } else {
                    // General fallback - just highlight any matching text
                    this.highlightAnswerInText(questionElement, answer);
                }
            } else if (typeof answer === "object") {
                // Handle complex answer object
                this.displayComplexAnswer(questionElement, answer);
            }
        } catch (error) {
            console.error("Error displaying answer:", error);
        }
    }

    // Highlight answer text directly in the content
    highlightAnswerInText(questionElement, answerText) {
        try {
            const textNodes = this.getTextNodes(questionElement);
            let found = false;

            textNodes.forEach((node) => {
                const text = node.nodeValue;
                const answerRegex = new RegExp(`(${answerText})`, "gi");

                if (answerRegex.test(text)) {
                    found = true;
                    const span = document.createElement("span");
                    span.innerHTML = text.replace(
                        answerRegex,
                        '<span class="studyaidx-answer-highlight">$1</span>',
                    );
                    node.parentNode.replaceChild(span, node);
                }
            });

            if (found) {
                // Add to answer panel
                const questionText = this.extractQuestionText(questionElement);
                this.addAnswerToPanel(questionText, answerText);
            }
        } catch (error) {
            console.error("Error highlighting answer in text:", error);
        }
    }

    // Get all text nodes within an element
    getTextNodes(node) {
        const textNodes = [];

        function getTextNodesRecursive(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                    getTextNodesRecursive(node.childNodes[i]);
                }
            }
        }

        getTextNodesRecursive(node);
        return textNodes;
    }

    // Handle complex answer objects
    displayComplexAnswer(questionElement, answer) {
        try {
            // Check for specific properties to determine type
            if (answer.choices) {
                this.displayMultipleChoiceAnswer(
                    questionElement,
                    answer.correct || answer.correctIndex,
                );
            } else if (answer.blanks) {
                this.displayFillInTheBlankAnswer(
                    questionElement,
                    answer.blanks,
                );
            } else if (answer.pairs) {
                this.displayMatchingAnswer(questionElement, answer.pairs);
            } else if (answer.sequence) {
                this.displayOrderedAnswer(questionElement, answer.sequence);
            } else if (answer.correct !== undefined) {
                this.displayMultipleChoiceAnswer(
                    questionElement,
                    answer.correct,
                );
            } else {
                // Generic fallback - display a JSON representation
                const questionText = this.extractQuestionText(questionElement);
                this.addAnswerToPanel(questionText, JSON.stringify(answer));
            }
        } catch (error) {
            console.error("Error displaying complex answer:", error);
        }
    }

    // Display answers for all questions on the page
    displayAllAnswers(answersData) {
        try {
            this.injectStyles();

            // Create answer panel
            this.createAnswerPanel();

            if (!answersData || typeof answersData !== "object") {
                console.error("Invalid answers data:", answersData);
                return;
            }

            // Find all questions on the page
            const questionElements = Array.from(
                document.querySelectorAll(
                    ".question, .question-container, [data-question-id]",
                ),
            );

            questionElements.forEach((questionElement, index) => {
                // Try to get question ID
                const questionId =
                    questionElement.getAttribute("data-question-id") ||
                    questionElement.id ||
                    `question-${index + 1}`;

                // Look for answer by ID or by index
                let answer = answersData[questionId];
                if (answer === undefined) {
                    // If no match by ID, try by index
                    const keys = Object.keys(answersData);
                    if (index < keys.length) {
                        answer = answersData[keys[index]];
                    }
                }

                if (answer !== undefined) {
                    this.displayAnswer(questionElement, answer);
                }
            });

            // Show the answer panel
            const panel = document.querySelector(".studyaidx-answer-panel");
            if (panel) {
                panel.classList.add("active");
            }
        } catch (error) {
            console.error("Error displaying all answers:", error);
        }
    }
}

// Initialize the enhanced answer display system
const answerDisplaySystem = new AnswerDisplaySystem();

// Function to display answers using the enhanced system
function displayEnhancedAnswers(answers) {
    answerDisplaySystem.displayAllAnswers(answers);
}

// Function to handle displaying a specific answer for a question
function displayEnhancedAnswer(questionElement, answer) {
    answerDisplaySystem.displayAnswer(questionElement, answer);
}

async function destroyMenu() {
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
        if (typeof stopFarmingCompletely === "function") {
            await stopFarmingCompletely();
        }

        // Clear tất cả timeouts
        if (window.toastTimeout) {
            clearTimeout(window.toastTimeout);
        }

        // Xóa tất cả event listeners
        const menu = document.getElementById("quizHelperMenu");
        if (menu) {
            const clone = menu.cloneNode(true);
            menu.parentNode.replaceChild(clone, menu);
            clone.parentNode.removeChild(clone);
        }

        // Xóa tất cả elements tạo bởi script
        const elementsToRemove = [
            "quizHelperMenu",
            "toast",
            "calculatorPopup",
            "extractionPopup",
            "reopenIcon",
            "customizeIcon",
            "adPopup",
            "studyaidx-answer-panel",
            "studyaidx-toggle-button",
        ];

        elementsToRemove.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });

        // Clean up enhanced answer display elements
        document
            .querySelectorAll(
                ".studyaidx-answer-highlight, .studyaidx-fill-blank-highlight, .studyaidx-matching-container, .studyaidx-sequence-container",
            )
            .forEach((el) => {
                el.remove();
            });

        // Clear localStorage liên quan
        const keysToRemove = [
            "activeKey",
            "keyExpirationTime",
            "quizHelperMenuState",
            "quizHelperDarkMode",
            "autoExtractEnabled",
            "farmRandom",
            "farmInput",
            "totalIterations",
            "farmCount",
        ];

        keysToRemove.forEach((key) => {
            localStorage.removeItem(key);
        });

        // Reset tất cả biến global
        window.activeKey = null;
        window.keyExpirationTime = null;
        // Removed duplicate farm variables - using local scope only
        window.audio = null;
    } catch (error) {
        console.error("Error in destroyMenu:", error);
    }
}

(function () {
    "use strict";

    const style = document.createElement("style");
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
                                    background: rgba(255, 255, 255, 0.15);
                                    backdrop-filter: blur(20px) saturate(180%);
                                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                                    border-radius: 20px;
                                    box-shadow:
                                        0 20px 60px rgba(0, 0, 0, 0.15),
                                        0 8px 32px rgba(0, 0, 0, 0.1),
                                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    overflow: hidden;
                                    transition: all var(--transition-speed);
                                    z-index: 10000;
                                    display: flex;
                                    flex-direction: column;
                                    max-width: 100%;
                                    box-sizing: border-box;
                                }

                                #quizHelperMenu.minimized {
                                    transform: scale(0.5) translateY(20px);
                                    opacity: 0;
                                    box-shadow: 0 0 0 rgba(0,0,0,0);
                                    pointer-events: none;
                                    visibility: hidden;
                                }

                                @media (max-width: 600px) {
                                    #quizHelperMenu.minimized {
                                        transform: scale(0.3) translateY(20px);
                                    }
                                }

                                /* Animation for menu appearance */
                                @keyframes menuAppear {
                                    from {
                                        transform: scale(0.8) translateY(10px);
                                        opacity: 0;
                                    }
                                    to {
                                        transform: scale(1) translateY(0);
                                        opacity: 1;
                                    }
                                }

                                #quizHelperMenu {
                                    animation: menuAppear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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
                                        width: 95%;
                                        left: 2.5%;
                                        right: 2.5%;
                                        top: 10px;
                                        height: auto;
                                        max-height: 90vh;
                                        overflow-y: auto;
                                    }

                                    #keyTypes {
                                        flex-direction: column;
                                    }

                                    :root {
                                        --font-size-base: 0.85rem;
                                    }

                                    #quizHelperMenu .section-title {
                                        font-size: 0.95rem;
                                        padding-bottom: 3px;
                                        margin-bottom: 8px;
                                    }

                                    #quizHelperMenu #menuHeader {
                                        font-size: 0.95rem;
                                        padding: 10px;
                                    }

                                    #quizHelperMenu #menuHeader img {
                                        width: 80px;
                                    }

                                    #welcomeScreen h1 {
                                        font-size: 1.2rem;
                                    }

                                    #welcomeScreen p {
                                        font-size: 0.75rem;
                                    }

                                    #quizHelperMenu button {
                                        padding: 8px 10px;
                                        font-size: 0.85rem;
                                        min-width: 36px;
                                        min-height: 36px;
                                        margin-right: 6px;
                                        margin-bottom: 6px;
                                    }

                                    #quizHelperMenu input[type="text"],
                                    #quizHelperMenu input[type="number"] {
                                        padding: 8px;
                                        font-size: 0.85rem;
                                    }

                                    .free-key-section, .premium-key-section {
                                        padding: 10px;
                                        margin-bottom: 10px;
                                    }

                                    #reopenIcon {
                                        bottom: 20px;
                                        right: 20px;
                                    }

                                    .logo-image {
                                        width: 40px;
                                    }

                                    .menu-control-button {
                                        width: 20px;
                                        height: 20px;
                                        font-size: 14px;
                                    }

                                    #extractionPopup {
                                        max-width: 95%;
                                        padding: 15px;
                                    }

                                    #customizeSection {
                                        width: 250px;
                                    }
                                }

                                @media (min-width: 601px) and (max-width: 1024px) {
                                    :root {
                                        --font-size-base: 0.95rem;
                                    }

                                    #quizHelperMenu {
                                        width: 80%;
                                        max-width: 450px;
                                        right: 50px;
                                    }

                                    #quizHelperMenu #menuHeader {
                                        padding: 12px;
                                    }

                                    #quizHelperMenu button {
                                        padding: 9px 12px;
                                    }
                                }

                                @media (min-width: 1025px) {
                                    #quizHelperMenu {
                                        width: 500px;
                                        right: 80px;
                                    }
                                    :root {
                                        --font-size-base: 1.05rem;
                                    }
                                }

                                /* For extra small screens */
                                @media (max-width: 360px) {
                                    #quizHelperMenu {
                                        width: 98%;
                                        left: 1%;
                                        right: 1%;
                                        top: 5px;
                                    }

                                    #quizHelperMenu #menuHeader {
                                        padding: 8px;
                                        font-size: 0.9rem;
                                    }

                                    #quizHelperMenu #menuHeader img {
                                        width: 70px;
                                    }

                                    #quizHelperMenu button {
                                        padding: 6px 8px;
                                        font-size: 0.8rem;
                                        min-width: 32px;
                                        min-height: 32px;
                                        margin-right: 4px;
                                        margin-bottom: 4px;
                                    }

                                    :root {
                                        --font-size-base: 0.8rem;
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

                                @media (max-width: 600px) {
                                    .ai-question-button {
                                        right: -28px;
                                        width: 24px;
                                        height: 24px;
                                    }

                                    .ai-chat-popup {
                                        width: 95%;
                                        height: 80vh;
                                    }

                                    .popup-header h3 {
                                        font-size: 12px;
                                    }

                                    .chat-input {
                                        font-size: 11px;
                                        padding: 8px;
                                    }

                                    .message-content {
                                        padding: 8px 10px;
                                        font-size: 11px;
                                    }
                                }

                                @media (max-width: 360px) {
                                    .ai-chat-popup {
                                        width: 98%;
                                        height: 85vh;
                                    }

                                    .chat-controls {
                                        flex-wrap: wrap;
                                    }

                                    .chat-controls button {
                                        font-size: 11px;
                                        padding: 4px 6px;
                                        margin: 2px;
                                    }
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

                                .media-upload-section {
                                    margin: 10px 0;
                                }

                                .upload-previews {
                                    margin-top: 10px;
                                }

                                .uploaded-images-preview, .uploaded-audio-preview {
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
                                    background-color: rgba(0, 0, 0, 0.8);
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    z-index: 10;
                                    border-radius: inherit;
                                    color: white;
                                    font-family: sans-serif;
                                }

                                .loader {
                                    width: 40px;
                                    aspect-ratio: 1;
                                    --c: linear-gradient(#fff 0 0);
                                    --m: radial-gradient(farthest-side,#fff 92%,#0000);
                                    background:
                                        var(--c),var(--m),
                                        var(--c),var(--m),
                                        var(--c),var(--m);
                                    background-size: 8px 15px,8px 8px;
                                    background-repeat: no-repeat;
                                    animation: l14 1s infinite alternate;
                                    margin-bottom: 15px;
                                }

                                @keyframes l14 {
                                    0%,
                                    10% {background-position: 0 0   ,0 100%,50% 0   ,50% 100%,100% 0   ,100% 100%}
                                    33% {background-position: 0 100%,0 0   ,50% 0   ,50% 100%,100% 0   ,100% 100%}
                                    66% {background-position: 0 100%,0 0   ,50% 100%,50% 0   ,100% 0   ,100% 100%}
                                    90%,
                                    100%{background-position: 0 100%,0 0   ,50% 100%,50% 0   ,100% 100%,100% 0   }
                                }

                                .loading-text {
                                    font-size: 16px;
                                    color: white;
                                    margin-top: 10px;
                                }

                                /* Reopen icon styles */
                                #reopenIcon {
                                    position: fixed;
                                    bottom: 30px;
                                    right: 30px;
                                    width: 50px;
                                    height: 50px;
                                    background: #ffffff;
                                    border-radius: 50%;
                                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                                    z-index: 10000;
                                    cursor: pointer;
                                    display: none;
                                    opacity: 0;
                                    transition: all 0.3s ease-in-out;
                                }

                                #reopenIcon.visible {
                                    display: block;
                                    opacity: 1;
                                    animation: bounceIn 0.5s ease-out;
                                }

                                @keyframes bounceIn {
                                    0% { transform: scale(0.5); opacity: 0; }
                                    50% { transform: scale(1.1); }
                                    70% { transform: scale(0.9); }
                                    100% { transform: scale(1); opacity: 1; }
                                }

                                #reopenIcon .icon {
                                    width: 100%;
                                    height: 100%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                }

                                #reopenIcon .logo-image {
                                    width: 30px;
                                    height: 30px;
                                    border-radius: 50%;
                                }
                                    `;
    document.head.appendChild(style);

    // Create style to hide menu initially based on saved state
    const initialHideStyle = document.createElement("style");
    initialHideStyle.id = "initialHideStyle";
    initialHideStyle.textContent = `
                                    #quizHelperMenu, #studyAidAssistantMenu {
                                        opacity: 0;
                                        visibility: hidden;
                                        display: none;
                                    }
                                `;

    // Add the style first to ensure menu is hidden immediately when it's created
    if (localStorage.getItem("menuMinimized") === "true") {
        document.head.appendChild(initialHideStyle);
    }

    // Create menu
    const menu = document.createElement("div");
    menu.id = "quizHelperMenu";
    menu.innerHTML = `
                                    <div id="menuHeader">
                                        <div class="logo-container">
                                            <a href="javascript:void(0);">
                                                <img src="https://studyaidx.web.app/lovable-uploads/1111a9ca-bbb6-46dd-bfbc-fcf9737a3b56.png"
                                                    alt="Logo StudyAidX"
                                                    border="0">
                                            </a>
                                            <div class="studyaidx-version-selector">
                                                <div class="version-option ${currentVersion === STUDYAIDX_VERSION.DEFAULT ? "active" : ""}" data-version="${STUDYAIDX_VERSION.DEFAULT}">
                                                    <div class="version-icon">🛠️</div>
                                                    <div class="version-text">
                                                        <div class="version-label">StudyAidX</div>
                                                        <div class="version-description">Original toolset</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button id="logoutButton" aria-label="Logout">🚪</button>
                                        <span id="remainingTime" style="display:none;">
                                            Time remaining:
                                            <span id="timeLeft">30:00</span>
                                        </span>
                                        <button id="minimizeButton" aria-label="Minimize" title="Minimize" class="menu-control-button">_</button>
                                        <span>Press CTRL + Q to hide menu</span>
                                        <div id="customizeIcon">⚙</div>
                                        <span id="versionInfo">
                                            Version:
                                            <div id="currentVersion">1.5</div>
                                        </span>
                                    </div>

                                    <div id="menuContent">
                                        <div id="keySection" class="section">
                                            <div class="free-key-section">
                                                <div class="section-title">Free Key System</div>
                                                <input type="text" id="freeKeyInput" placeholder="Enter your Free Key">
                                                <button id="activateFreeKeyButton">Activate Free Key</button>
                                                <button id="getFreeKeyButton">Get Free Key</button>
                                            </div>

                                            <div class="premium-key-section">
                                                <div class="section-title">Admin Key System</div>
                                                <input type="text" id="premiumKeyInput" placeholder="Enter your Admin Key">
                                                <button id="activatePremiumKeyButton">Activate Admin Key</button>
                                                <button id="contactButton">This key is only for Admin - cannot be purchased!</button>
                                            </div>

                                            <div id="remainingTime" style="display: none;">
                                                <div class="section-title">Time Remaining</div>
                                                <div id="timeLeft"></div>
                                            </div>
                                        </div>

                                        <div id="functionsSection" style="display: none;">
                                            <div class="section">
                                                <div class="section-title">Actions</div>
                                                <button id="extractButton" title="Extract data from current test"  >📋 Extract Data</button>
                                                <button id="calculatorButton" title="Open calculator for calculations">🧮 Calculator</button>
                                                <button id="autoAnswerButton" title="Automatically select random answers for questions">🎲 Choose Answer (Random)</button>
                                                <button id="aiAnswerButton" title="Use AI to select answers for questions">🤖 Choose Answer (AI)</button>
                                                <div class="turbo-mode">
                                                    <label class="toggle-switch" title="Enable/disable Turbo mode to increase processing speed">
                                                        <input type="checkbox" id="turboToggle">
                                                        <span class="slider round"></span>
                                                    </label>
                                                    <span>Turbo Mode</span>
                                                </div>
                                            </div>

                                            <button id="downloadImagesButton"  title="Download necessary images from test">📥 Download Images that need!</button>
                                            <div class="media-upload-section">
                                                <button id="uploadMediaButton" title="Upload images or audio for use in test">📁 Upload Images/Audio</button>
                                                <input type="file" id="mediaUploader" multiple accept="image/*,audio/*" style="display: none;">
                                                <div class="upload-previews">
                                                    <div id="uploadedImages" class="uploaded-images-preview"></div>
                                                    <div id="uploadedAudios" class="uploaded-audio-preview"></div>
                                                </div>
                                            </div>

                                            <div>
                                                <input type="checkbox" id="autoSubmitCheckbox">
                                                <label for="autoSubmitCheckbox">Auto Submit</label>
                                            </div>

                                            <div id="incognitoSection" class="section">
                                                <div class="section-title">Incognito Mode</div>
                                                <div>
                                                    <label class="toggle-switch" title="Enable/disable incognito mode to not save activity">
                                                        <input type="checkbox" id="incognitoModeToggle">
                                                        <span class="toggle-slider"></span>
                                                    </label>
                                                    <span>Enable Incognito Mode</span>
                                                </div>
                                                <button id="autoSubmitToggle" style="display: none;" title="Enable/disable auto submit">🚀 Toggle Auto-Submit</button>
                                                <button id="openLinkPopupButton" style="display: none;" title="Open popup containing useful links">🔗 Open Link Popup</button>

                                                <div style="display: none;">
                                                    <label class="toggle-switch">
                                                        <input type="checkbox" id="copyPasteToggle">
                                                        <span class="toggle-slider"></span>
                                                    </label>
                                                    <span style="display: none;">Allow Copy/Paste</span>
                                                </div>
                                            </div>

                                            <div class="section" style="display: none;">
                                                <div class="section-title">Response Code Selection</div>

                                                <input id="answersInput"
                                                    type="text"
                                                    placeholder="Enter response code, separated by semicolons">

                                                <div>
                                                    <input type="checkbox" id="autoExtractCheckbox">
                                                    <label for="autoExtractCheckbox">Auto extract data</label>
                                                </div>

                                                <button id="selectAnswersButton" title="Select answers based on input data">✅ Choose Answer (Based on Input)</button>

                                                <label for="autoSubmitCheckbox">Auto submit:</label>
                                                <input type="checkbox" id="autoSubmitCheckbox">

                                                <button id="saveAnswersButton" title="Save answer code for later use">💾 Save Code</button>

                                                <button id="loadAnswersButton" style="display:none;" title="Load previously saved answer code">📂 Load Code</button>

                                                <button id="highlightAnswersButton" style="display:none;" title="Highlight selected answers">🖍️ Highlight Answers</button>

                                                <button id="analyzeAnswersButton" style="display:none;" title="Analyze answer frequency">📊 Analyze Answers</button>
                                            </div>

                                            <div class="section" style="display:none;">
                                                <div class="section-title">Settings</div>
                                                <button id="toggleThemeButton" title="Switch between light and dark interface">🌓 Toggle Theme</button>
                                            </div>

                                            <div class="section" style="display:none;">
                                                <div class="section-title">Countdown Timer</div>

                                                <input id="timerInput"
                                                    type="number"
                                                    min="1"
                                                    max="180"
                                                    placeholder="Enter minutes">

                                                <button id="startTimerButton" title="Start countdown timer">▶️ Activate Timer</button>

                                                <div id="timerDisplay">0:00</div>
                                            </div>

                                            <div class="section" style="display: none;">
                                                <div class="section-title">Music</div>
                                                <button id="playMusicButton" title="Play background music while working">🎵 Play Music</button>
                                                <button id="pauseMusicButton" title="Pause music playback">⏸️ Pause Music</button>
                                                <div>
                                                    <input type="range" id="volumeSlider" min="0" max="1" step="0.01" value="1">
                                                    <label for="volumeSlider">Volume</label>
                                                </div>
                                                <div id="currentTrack" style="display:none;">Now playing: <span id="trackInfo"></span></div>
                                            </div>

                                            <div class="section">
                                                <div class="section-title">Farm</div>
                                                <div>
                                                    <input type="checkbox" id="farmRandom">
                                                    <label for="farmRandom">Farm Random</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" id="farmInput">
                                                    <label for="farmInput">Farm Based on Input</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" id="farmAI">
                                                    <label for="farmAI">Farm with AI</label>
                                                </div>

                                                <button id="startFarmButton" class="btn btn-primary" title="Start automatic farming process">Start Farm</button>
                                            </div>

                                            <div class="section" style="display: none;">
                                                <div class="section-title">Score Update</div>
                                                <div>
                                                    <label class="toggle-switch" title="Enable/disable automatic score updates">
                                                        <input type="checkbox" id="scoreUpdateToggle">
                                                        <span class="toggle-slider"></span>
                                                    </label>
                                                    <span>Auto update score</span>
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
                                            <div class="section-title">Customize Interface</div>
                                            <div class="customize-group">
                                                <h3>Colors</h3>
                                                <label for="colorCheckbox">Enable color function:</label>
                                                <input type="checkbox" id="colorCheckbox" checked>
                                                <div id="colorControls">
                                                    <label for="menuBackgroundColor">Background color:</label>
                                                    <input type="color" id="menuBackgroundColor">
                                                    <label for="menuTextColor">Text color:</label>
                                                    <input type="color" id="menuTextColor">
                                                    <label for="menuAccentColor">Accent color:</label>
                                                    <input type="color" id="menuAccentColor">
                                                </div>
                                            </div>
                                            <div class="customize-group">
                                                <h3>Font</h3>
                                                <label for="fontCheckbox">Enable font function:</label>
                                                <input type="checkbox" id="fontCheckbox" checked>
                                                <div id="fontControls">
                                                    <label for="menuFontFamily">Font style:</label>
                                                    <select id="menuFontFamily">
                                                        <option value="Arial, sans-serif">Arial</option>
                                                        <option value="'Times New Roman', serif">Times New Roman</option>
                                                        <option value="'Courier New', monospace">Courier New</option>
                                                        <option value="Georgia, serif">Georgia</option>
                                                        <option value="Verdana, sans-serif">Verdana</option>
                                                    </select>
                                                    <label for="menuFontSize">Font size:</label>
                                                    <input type="range" id="menuFontSize" min="12" max="24" step="1" value="16">
                                                    <span id="fontSizeValue">16px</span>
                                                </div>
                                            </div>
                                            <div class="customize-group">
                                                <h3>Background Image</h3>
                                                <label for="imageCheckbox">Enable background image:</label>
                                                <input type="checkbox" id="imageCheckbox" checked>
                                                <div id="imageControls">
                                                    <label for="menuImageBackground">Choose background:</label>
                                                    <input type="file" id="menuImageBackground" accept="image/*">
                                                    <label for="backgroundOpacity">Background opacity:</label>
                                                    <input type="range" id="backgroundOpacity" min="0" max="1" step="0.1" value="1">
                                                    <span id="opacityValue">100%</span>
                                                </div>
                                            </div>
                                            <div class="customize-group">
                                                <h3>Layout</h3>
                                                <label for="layoutCheckbox">Enable layout function:</label>
                                                <input type="checkbox" id="layoutCheckbox" checked>
                                                <div id="layoutControls">
                                                    <label for="menuLayout">Layout style:</label>
                                                    <select id="menuLayout">
                                                        <option value="default">Default</option>
                                                        <option value="compact">Compact</option>
                                                        <option value="spacious">Spacious</option>
                                                    </select>
                                                    <label for="menuBorderRadius">Border radius:</label>
                                                    <input type="range" id="menuBorderRadius" min="0" max="20" step="1" value="0">
                                                    <span id="borderRadiusValue">0px</span>
                                                </div>
                                            </div>
                                            <div id="resizeControls">
                                                <h3>Resize Section</h3>
                                                <label for="resizeCheckbox">Enable resize function:</label>
                                                <input type="checkbox" id="resizeCheckbox" checked>
                                                <div id="resizeSettings">
                                                    <label for="sectionWidth">Width:</label>
                                                    <input type="range" id="sectionWidth" min="300" max="1200" step="10" value="600">
                                                    <span id="widthValue">600px</span>
                                                    <label for="sectionHeight">Height:</label>
                                                    <input type="range" id="sectionHeight" min="300" max="1000" step="10" value="400">
                                                    <span id="heightValue">400px</span>
                                                </div>
                                            </div>
                                            <button id="applyCustomizationsButton" title="Apply all customization changes">Apply All</button>
                                            <button id="resetCustomizationsButton" title="Reset all customizations to default">Reset to Default</button>
                                        </div>

                                        <div id="incognitoInstructions" style="display:none;">
                                            <p>Keyboard shortcuts (customizable):</p>
                                            <ul>
                                                <li>Extract Data: <span id="extractShortcut">Alt + X</span></li>
                                                <li>Calculator: <span id="calculatorShortcut">Ctrl + Alt + C</span></li>
                                                <li>Choose Answer (Random): <span id="autoAnswerShortcut">Ctrl + Alt + R</span></li>
                                                <li>Choose Answer (AI): <span id="aiAnswerShortcut">Ctrl + Alt + A</span></li>
                                                <li>Download Images: <span id="downloadImagesShortcut">Ctrl + Alt + D</span></li>
                                                <li>Upload Images: <span id="uploadImagesShortcut">Ctrl + Alt + U</span></li>
                                                <li>Upload Audio: <span id="uploadAudioShortcut">Ctrl + Shift + U</span></li>
                                                <li>Auto Submit: <span id="autoSubmitShortcut">Ctrl + Alt + S</span></li>
                                                <li>Open Link Popup: <span id="openLinkPopupShortcut">Ctrl + Alt + L</span></li>
                                                <li>Allow Copy/Paste: <span id="copyPasteShortcut">Ctrl + Shift + C</span></li>
                                                <li>Choose Answer (Based on Input): <span id="selectAnswersShortcut">Ctrl + Shift + S</span></li>
                                                <li>Save Code: <span id="saveAnswersShortcut">Ctrl + Shift + M</span></li>
                                                <li>Toggle Music: <span id="toggleMusicShortcut">Ctrl + Alt + M</span></li>
                                                <li>Farm Random: <span id="farmRandomShortcut">Ctrl + Shift + R</span></li>
                                                <li>Farm Based on Input: <span id="farmInputShortcut">Ctrl + Shift + I</span></li>
                                                <li>Update Score: <span id="scoreUpdateShortcut">Ctrl + Shift + P</span></li>
                                            </ul>
                                            <p>To show menu again, press: <span id="showMenuShortcut">Ctrl + Shift + O</span></p>
                                            <p><b>Note:</b> When incognito mode is enabled, menu will be hidden until you press the shortcut to show it again.</p>
                                            <p><b>Special Note:</b> The Ctrl + Q shortcut is always reserved for the menu minimize function.</p>
                                        </div>
                                        </div>
                                        <div id="incognitoTutorial" class="popup" style="display:none;">
                                        <div class="popup-content">
                                            <h3>Incognito Mode Guide</h3>
                                            <p>You have enabled incognito mode. Here are the shortcuts:</p>
                                            <ul>
                                                <li>Extract Data: <span id="extractShortcut">Alt + X</span></li>
                                                <li>Calculator: <span id="calculatorShortcut">Ctrl + Alt + C</span></li>
                                                <li>Choose Answer (Random): <span id="autoAnswerShortcut">Ctrl + Alt + R</span></li>
                                                <li>Choose Answer (AI): <span id="aiAnswerShortcut">Ctrl + Alt + A</span></li>
                                                <li>Download Images: <span id="downloadImagesShortcut">Ctrl + Alt + D</span></li>
                                                <li>Upload Images: <span id="uploadImagesShortcut">Ctrl + Alt + U</span></li>
                                                <li>Upload Audio: <span id="uploadAudioShortcut">Ctrl + Shift + U</span></li>
                                                <li>Auto Submit: <span id="autoSubmitShortcut">Ctrl + Alt + S</span></li>
                                                <li>Open Link Popup: <span id="openLinkPopupShortcut">Ctrl + Alt + L</span></li>
                                                <li>Allow Copy/Paste: <span id="copyPasteShortcut">Ctrl + Shift + C</span></li>
                                                <li>Choose Answer (Based on Input): <span id="selectAnswersShortcut">Ctrl + Shift + S</span></li>
                                                <li>Save Code: <span id="saveAnswersShortcut">Ctrl + Shift + M</span></li>
                                                <li>Toggle Music: <span id="toggleMusicShortcut">Ctrl + Alt + M</span></li>
                                                <li>Farm Random: <span id="farmRandomShortcut">Ctrl + Shift + R</span></li>
                                                <li>Farm Based on Input: <span id="farmInputShortcut">Ctrl + Shift + I</span></li>
                                                <li>Update Score: <span id="scoreUpdateShortcut">Ctrl + Shift + P</span></li>
                                            </ul>
                                            <p>To show menu again, press: <span id="showMenuShortcut">Ctrl + Shift + O</span></p>
                                            <p><b>Special Note:</b> The Ctrl + Q shortcut is always reserved for the menu minimize function.</p>
                                            <button id="closeTutorialButton" title="Close guide and don't show again">Understood</button>
                                        </div>
                                        </div>
                                    </div>
                                    `;

    document.body.appendChild(menu);

    // Incognito Mode Logic
    const incognitoModeToggle = document.getElementById("incognitoModeToggle");
    const menuContent = document.getElementById("menuContent");

    // Load incognito mode state from localStorage
    const isIncognito = localStorage.getItem("incognitoMode") === "true";
    incognitoModeToggle.checked = isIncognito;
    updateIncognitoMode(isIncognito);

    incognitoModeToggle.addEventListener("change", () => {
        const isIncognito = incognitoModeToggle.checked;
        localStorage.setItem("incognitoMode", isIncognito);
        updateIncognitoMode(isIncognito);

        // Clear incognito alert shown state when turning off incognito mode
        if (!isIncognito) {
            localStorage.removeItem("incognitoAlertShown");
        }
    });

    function updateIncognitoMode(isIncognito, skipAlert = false) {
        // Check if incognito mode was already active
        const wasActive =
            localStorage.getItem("incognitoModeActive") === "true";

        // Save current menu position before hiding
        const menu = document.getElementById("quizHelperMenu");
        const menuPosition = {
            transform: menu.style.transform,
            top: menu.style.top,
            left: menu.style.left,
        };
        localStorage.setItem("menuPosition", JSON.stringify(menuPosition));

        if (isIncognito) {
            // Hide menu but keep position
            menuContent.style.display = "none";
            document.getElementById("menuHeader").style.display = "none";
            document.getElementById("customizeSection").style.display = "none";

            // Restore position
            const savedPosition = JSON.parse(
                localStorage.getItem("menuPosition"),
            );
            if (savedPosition) {
                menu.style.transform = savedPosition.transform;
                menu.style.top = savedPosition.top;
                menu.style.left = savedPosition.left;
            }

            // Add CSS to hide menu but keep loading state and answers when incognito mode is on
            if (!wasActive) {
                const incognitoStyle = document.createElement("style");
                incognitoStyle.id = "incognitoStyle";
                incognitoStyle.textContent = `
                                                .toast-notification {
                                                    display: none !important;
                                                }
                                                .ai-loading-state {
                                                    display: flex !important;
                                                    opacity: 1 !important;
                                                }
                                            `;
                document.head.appendChild(incognitoStyle);

                // Only show instructions if explicitly toggling incognito mode for the first time
                if (!skipAlert) {
                    const instructions = `[TÍNH NĂNG BETA] Chế độ ẩn danh đã được kích hoạt! Nếu gặp lỗi vui lòng ấn Reset All ở góc trên để quay lại bình thường.\n\n
                                                Các phím tắt:\n
                                                - Khai Thác Dữ Liệu: Ctrl + Shift + X
                                                - Máy Tính: Ctrl + Alt + C
                                                - Chọn Đáp Án (Random): Ctrl + Shift + R
                                                // ... rest of shortcuts ...
                                                Để hiển thị lại menu, ấn: Ctrl + Shift + O`;

                    alert(instructions);
                }
                localStorage.setItem("incognitoModeActive", "true");
            }

            // Always remove loading states when in incognito mode
            const loadingStates =
                document.querySelectorAll(".ai-loading-state");
            loadingStates.forEach((loadingState) => loadingState.remove());
        } else {
            // Clear the incognito mode active flag when disabled
            localStorage.removeItem("incognitoModeActive");

            // Remove incognito style
            const incognitoStyle = document.getElementById("incognitoStyle");
            if (incognitoStyle) {
                incognitoStyle.remove();
            }

            // Hiển thị menu
            menuContent.style.display = "block";
            document.getElementById("menuHeader").style.display = "flex";
            document.getElementById("customizeSection").style.display = "block";
        }
    }

    document.addEventListener("keydown", handleKeyDown);
    function handleKeyDown(event) {
        // Always skip Ctrl+Q in this handler to prevent conflict with the minimize function
        if (event.ctrlKey && event.key.toLowerCase() === "q") {
            return; // Skip handling Ctrl+Q entirely in this handler
        }

        if (incognitoModeToggle.checked) {
            // Khai Thác Dữ Liệu (Alt + X)
            if (
                event.altKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                event.key === "x"
            ) {
                event.preventDefault();
                document.getElementById("extractButton").click();
            }
            // Máy Tính (Alt + C)
            else if (
                event.altKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                event.key === "c"
            ) {
                event.preventDefault();
                document.getElementById("calculatorButton").click();
            }
            // Chọn Đáp Án Random (Alt + R)
            else if (
                event.altKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                event.key === "r"
            ) {
                event.preventDefault();
                document.getElementById("autoAnswerButton").click();
            }
            // Chọn Đáp Án AI (Alt + A)
            else if (
                event.altKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                event.key === "a"
            ) {
                event.preventDefault();
                document.getElementById("aiAnswerButton").click();
            }
            // Tải Xuống Hình Ảnh (Alt + D)
            else if (
                event.altKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                event.key === "d"
            ) {
                event.preventDefault();
                document.getElementById("downloadImagesButton").click();
            }
            // Tải Lên Media (Alt + U)
            else if (
                event.altKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                event.key === "u"
            ) {
                event.preventDefault();
                document.getElementById("uploadMediaButton").click();
            }
            // Auto Submit (Ctrl + Shift + Enter)
            else if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
                event.preventDefault();
                document.getElementById("autoSubmitCheckbox").checked =
                    !document.getElementById("autoSubmitCheckbox").checked;
            }
            // Mở Popup Liên Kết (Ctrl + Shift + L)
            else if (event.ctrlKey && event.shiftKey && event.key === "L") {
                event.preventDefault();
                document.getElementById("openLinkPopupButton").click();
            }
            // Chọn Đáp Án Dựa Vào Input (Ctrl + Alt + I)
            else if (event.ctrlKey && event.altKey && event.key === "i") {
                event.preventDefault();
                document.getElementById("selectAnswersButton").click();
            }
            // Lưu Trữ Mã (Ctrl + Shift + M)
            else if (event.ctrlKey && event.shiftKey && event.key === "M") {
                event.preventDefault();
                document.getElementById("saveAnswersButton").click();
            }
            // Bật/Tắt Nhạc (Ctrl + Shift + M)
            else if (event.ctrlKey && event.shiftKey && event.key === "M") {
                event.preventDefault();
                const playMusicButton =
                    document.getElementById("playMusicButton");
                const pauseMusicButton =
                    document.getElementById("pauseMusicButton");
                if (playMusicButton.style.display !== "none") {
                    playMusicButton.click();
                } else {
                    pauseMusicButton.click();
                }
            }
            // Farm Random (Ctrl + Alt + F)
            else if (event.ctrlKey && event.altKey && event.key === "f") {
                event.preventDefault();
                document.getElementById("farmRandom").checked =
                    !document.getElementById("farmRandom").checked;
            }
            // Farm Dựa Vào Input (Ctrl + Alt + G)
            else if (event.ctrlKey && event.altKey && event.key === "g") {
                event.preventDefault();
                document.getElementById("farmInput").checked =
                    !document.getElementById("farmInput").checked;
            }
            // Cập Nhật Điểm Số (Ctrl + Shift + P)
            else if (event.ctrlKey && event.shiftKey && event.key === "P") {
                event.preventDefault();
                document.getElementById("scoreUpdateToggle").checked =
                    !document.getElementById("scoreUpdateToggle").checked;
            }
            // Hiển thị lại menu (Ctrl + Shift + O)
            else if (event.ctrlKey && event.shiftKey && event.key === "O") {
                event.preventDefault();
                incognitoModeToggle.checked = false;
                localStorage.setItem("incognitoMode", false);
                incognitoInstructions.style.display = "none";
                menuContent.style.display = "block";
                document.getElementById("menuHeader").style.display = "flex";
                document.getElementById("customizeSection").style.display =
                    "block";
            }
        }
    }

    // Create the StudyAidX Assistant interface
    function createStudyAidXAssistant() {
        const assistantMenu = document.createElement("div");
        assistantMenu.id = "studyAidAssistantMenu";

        assistantMenu.innerHTML = `
                                    <div id="assistantHeader">
                                        <div class="header-title">
                                            <img src="https://ibb.co/Y71rW8Z5"><img src="https://i.ibb.co/XZKw4p8n/1111a9ca-bbb6-46dd-bfbc-fcf9737a3b56.png" alt="StudyAidX Logo">
                                            <span>StudyAidX Assistant</span>
                                        </div>
                                        <div class="header-buttons">
                                            <div class="control-buttons">
                                                <button class="control-button" id="assistantMinimize">_</button>
                                                <button class="control-button" id="assistantClose">×</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="assistant-content">
                                        <div class="sidebar">
                                            <div class="sidebar-button ask-ai active">
                                                <div class="sidebar-icon">💬</div>
                                                <div class="sidebar-text">StudyAidX Assistant</div>
                                            </div>
                                            <div class="sidebar-button write">
                                                <div class="sidebar-icon">✏️</div>
                                                <div class="sidebar-text">Write</div>
                                            </div>
                                            <div class="sidebar-settings">
                                                <span>⚙️</span>
                                            </div>
                                        </div>
                                        <div class="main-content">
                                            <div id="welcomeView">
                                                <div class="welcome-section">
                                                    <div class="welcome-icon">
                                                        <svg viewBox="0 0 24 24" class="purple-icon">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <path d="M12 16v-4m0-4h.01"></path>
                                                        </svg>
                                                    </div>
                                                    <div class="welcome-text">How can I assist you today?</div>
                                                    <div class="welcome-description">I can help with your studying, writing, and answer questions</div>
                                                </div>
                                                <div class="option-cards">
                                                    <div class="option-card" data-prompt="Help me solve this math problem: ">
                                                        <div class="card-icon">📝</div>
                                                        <div class="card-content">
                                                            <div class="card-title">Solve study problem</div>
                                                            <div class="card-description">Help me solve this math question and provide detailed steps</div>
                                                        </div>
                                                    </div>
                                                    <div class="option-card" data-prompt="Write an essay about ">
                                                        <div class="card-icon">📚</div>
                                                        <div class="card-content">
                                                            <div class="card-title">Write an essay</div>
                                                            <div class="card-description">Assist me in writing a well-structured essay</div>
                                                        </div>
                                                    </div>
                                                    <div class="option-card" data-prompt="Explain this concept to me: ">
                                                        <div class="card-icon">🔍</div>
                                                        <div class="card-content">
                                                            <div class="card-title">Explain a concept</div>
                                                            <div class="card-description">Get clear explanations of complex topics</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div id="chatView" style="display: none;">
                                                <div class="conversation-container"></div>
                                            </div>
                                            <div class="message-input">
                                                <div class="input-container">
                                                    <textarea placeholder="Message StudyAidX Assistant..." id="assistantInput"></textarea>
                                                    <button class="send-button" id="sendButton">
                                                        <svg viewBox="0 0 24 24" class="send-icon">
                                                            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div class="input-tools">
                                                    <div class="tools-left">
                                                        <button class="tool-button" id="attachImageButton">
                                                            <span class="tool-icon">📷</span>
                                                            <span>Add image</span>
                                                        </button>
                                                        <input type="file" id="imageUploader" accept="image/*" style="display: none;">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;

        document.body.appendChild(assistantMenu);

        setTimeout(() => {
            // Add event listeners after the DOM has been updated
            const assistantMinimize =
                document.getElementById("assistantMinimize");
            const assistantClose = document.getElementById("assistantClose");
            const sendButton = document.getElementById("sendButton");
            const assistantInput = document.getElementById("assistantInput");
            const attachImageButton =
                document.getElementById("attachImageButton");
            const imageUploader = document.getElementById("imageUploader");
            const optionCards = document.querySelectorAll(".option-card");
            const welcomeView = document.getElementById("welcomeView");
            const chatView = document.getElementById("chatView");
            const conversationContainer = document.querySelector(
                ".conversation-container",
            );

            console.log("Setting up StudyAidX Assistant event listeners", {
                sendButton: !!sendButton,
                assistantInput: !!assistantInput,
                optionCards: optionCards.length,
                welcomeView: !!welcomeView,
                chatView: !!chatView,
                conversationContainer: !!conversationContainer,
            });

            // Upload image handler
            if (attachImageButton && imageUploader) {
                attachImageButton.addEventListener("click", () => {
                    imageUploader.click();
                });

                imageUploader.addEventListener("change", (event) => {
                    if (event.target.files.length > 0) {
                        const file = event.target.files[0];
                        // Show preview or append to message
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            const imgPreview = document.createElement("div");
                            imgPreview.classList.add("upload-preview");
                            imgPreview.innerHTML = `
                                                        <div class="upload-item">
                                                            <img src="${e.target.result}" alt="Uploaded image">
                                                            <div class="upload-remove">×</div>
                                                        </div>
                                                    `;
                            const inputContainer =
                                document.querySelector(".input-container");
                            if (inputContainer) {
                                inputContainer.insertAdjacentElement(
                                    "beforebegin",
                                    imgPreview,
                                );

                                // Add remove handler
                                const removeBtn =
                                    imgPreview.querySelector(".upload-remove");
                                if (removeBtn) {
                                    removeBtn.addEventListener("click", () => {
                                        imgPreview.remove();
                                        imageUploader.value = "";
                                    });
                                }
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            // Option cards click handler
            optionCards.forEach((card) => {
                card.addEventListener("click", () => {
                    const promptTemplate = card.getAttribute("data-prompt");
                    if (assistantInput && promptTemplate) {
                        assistantInput.value = promptTemplate;
                        assistantInput.focus();
                        // Show chat view
                        if (welcomeView) welcomeView.style.display = "none";
                        if (chatView) chatView.style.display = "block";
                    }
                });
            });

            // Define functions for the chat functionality
            function addMessage(content, isUser = false) {
                if (!conversationContainer) {
                    console.error("Conversation container not found");
                    return;
                }

                const messageDiv = document.createElement("div");
                messageDiv.classList.add("message-bubble");
                messageDiv.classList.add(
                    isUser ? "user-message" : "assistant-message",
                );

                // Format message content with line breaks
                const formattedContent = content.replace(/\n/g, "<br>");

                messageDiv.innerHTML = `
                                                ${formattedContent}
                                                <div class="message-time">${new Date().toLocaleTimeString()}</div>
                                            `;

                conversationContainer.appendChild(messageDiv);
                conversationContainer.scrollTop =
                    conversationContainer.scrollHeight;

                // Show chat view if it's not already visible
                if (welcomeView) welcomeView.style.display = "none";
                if (chatView) chatView.style.display = "block";
            }

            function showTypingIndicator() {
                if (!conversationContainer) return;

                const typingDiv = document.createElement("div");
                typingDiv.classList.add("ai-typing");
                typingDiv.innerHTML = `
                                                <span>StudyAidX is thinking</span>
                                                <div class="typing-dots">
                                                    <span class="typing-dot"></span>
                                                    <span class="typing-dot"></span>
                                                    <span class="typing-dot"></span>
                                                </div>
                                            `;
                typingDiv.id = "typingIndicator";
                conversationContainer.appendChild(typingDiv);
                conversationContainer.scrollTop =
                    conversationContainer.scrollHeight;
            }

            function removeTypingIndicator() {
                const typingIndicator =
                    document.getElementById("typingIndicator");
                if (typingIndicator) {
                    typingIndicator.remove();
                }
            }

            // Simple chat history storage (in-memory)
            let chatHistory = []; // Stores { role: 'user'/'model', parts: [{ text: '...' }] }

            // Function to securely get the API key
            async function getApiKey() {
                // Prioritize localStorage, then GM_getValue
                let key = localStorage.getItem("googleApiKey");
                if (!key) {
                    key = await GM_getValue("googleApiKey", null);
                }
                // console.log("Retrieved API Key:", key ? 'Exists' : 'Not Found'); // Debugging
                return key;
            }

            // Process message with AI
            async function processWithAI(message, imageData = null) {
                try {
                    console.log(
                        "Processing with AI:",
                        message,
                        "Image Data:",
                        !!imageData,
                    );

                    const API_KEY = await getApiKey();
                    if (!API_KEY) {
                        console.error(
                            "StudyAidX: Google Generative AI API key is missing. Please configure it in the script settings or localStorage.",
                        );
                        return "AI functionality requires a valid Google Generative AI API key. Please configure it first.";
                    }

                    // Dynamically import the library
                    const { GoogleGenerativeAI } = await import(
                        "https://esm.run/@google/generative-ai"
                    );
                    const genAI = new GoogleGenerativeAI(API_KEY);

                    // Determine model based on whether image data is present
                    const modelName = imageData
                        ? "gemini-1.5-flash-latest"
                        : "gemini-1.5-flash-latest"; // Use flash for both text and vision
                    console.log(`Using model: ${modelName}`);
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                    });

                    // Start a chat session using the existing history
                    const chat = model.startChat({
                        history: chatHistory, // Use the existing chat history
                        generationConfig: {
                            maxOutputTokens: 1500, // Increased token limit
                        },
                    });

                    // Prepare content parts for the current message
                    const currentParts = [];
                    if (message) {
                        currentParts.push({ text: message });
                    }

                    // Add image if provided
                    if (imageData) {
                        try {
                            const base64Data = imageData.split(",")[1]; // Remove data URL prefix
                            const mimeType =
                                imageData.match(/data:(.*);base64,/)[1]; // Extract MIME type
                            if (!base64Data || !mimeType) {
                                throw new Error("Invalid image data format");
                            }
                            currentParts.push({
                                inlineData: {
                                    data: base64Data,
                                    mimeType: mimeType,
                                },
                            });
                            console.log(
                                `Added image with MIME type: ${mimeType}`,
                            );
                        } catch (imgError) {
                            console.error(
                                "Error processing image data:",
                                imgError,
                            );
                            return "There was an error processing the image. Please try a different image or format.";
                        }
                    }

                    if (currentParts.length === 0) {
                        console.log("No content to send to AI.");
                        return "Please provide a message or an image."; // Should ideally be caught before calling processWithAI
                    }

                    // Send the current message parts to the chat
                    console.log("Sending parts to AI:", currentParts);
                    const result = await chat.sendMessage(currentParts);
                    const response = await result.response.text();
                    console.log("AI Raw Response:", response);

                    // Update chat history
                    chatHistory.push({ role: "user", parts: currentParts });
                    chatHistory.push({
                        role: "model",
                        parts: [{ text: response }],
                    });
                    // console.log("Updated Chat History:", chatHistory); // Debugging

                    return response;
                } catch (error) {
                    console.error("AI processing error:", error);
                    let errorMessage =
                        "I'm sorry, I encountered an error processing your request. Please try again later.";
                    if (
                        error.message &&
                        error.message.includes("API key not valid")
                    ) {
                        errorMessage =
                            "The provided Google Generative AI API key is invalid or expired. Please check your key.";
                    } else if (
                        error.message &&
                        error.message.includes("quota")
                    ) {
                        errorMessage =
                            "You may have exceeded your API quota. Please check your usage limits.";
                    }
                    // Append error details if available
                    // errorMessage += ` (Details: ${error.message || 'Unknown error'})`;
                    return errorMessage;
                }
            }

            // Send message function
            async function sendMessage() {
                console.log("sendMessage function called");
                if (!assistantInput || !conversationContainer) {
                    console.error(
                        "Assistant input or conversation container not found",
                    );
                    return;
                }

                const message = assistantInput.value.trim();
                const uploadPreview = document.querySelector(".upload-preview");
                let imageData = null;

                if (uploadPreview) {
                    const img = uploadPreview.querySelector("img");
                    if (img && img.src && img.src.startsWith("data:image")) {
                        imageData = img.src;
                    }
                }

                console.log(
                    "Sending message:",
                    message,
                    "Image included:",
                    !!imageData,
                );

                if (!message && !imageData) {
                    console.log("Message and image are empty, not sending");
                    return;
                }

                // Add user message/image to conversation
                if (message) {
                    addMessage(message, true);
                }
                if (imageData) {
                    // Add image preview to chat - create a specific function if needed
                    const imgElement = document.createElement("img");
                    imgElement.src = imageData;
                    imgElement.style.maxWidth = "100%";
                    imgElement.style.maxHeight = "200px";
                    imgElement.style.borderRadius = "8px";
                    imgElement.style.marginTop = "5px";
                    addMessage(imgElement.outerHTML, true); // Add image HTML
                }

                // Clear input and remove preview
                assistantInput.value = "";
                if (uploadPreview) {
                    uploadPreview.remove();
                    imageUploader.value = ""; // Reset file input
                }

                // Show typing indicator
                showTypingIndicator();
                assistantInput.disabled = true;
                if (sendButton) sendButton.disabled = true;

                try {
                    // Process the message with AI
                    console.log("Calling processWithAI...");
                    const response = await processWithAI(message, imageData);
                    console.log(
                        "Received AI response in sendMessage:",
                        response,
                    );

                    // Remove typing indicator
                    removeTypingIndicator();

                    // Add AI response to conversation
                    addMessage(response);
                } catch (error) {
                    console.error(
                        "Error processing message in sendMessage:",
                        error,
                    );
                    removeTypingIndicator();
                    addMessage(
                        "I'm sorry, I encountered an error. Please check the console for details and try again.",
                    );
                } finally {
                    assistantInput.disabled = false;
                    if (sendButton) sendButton.disabled = false;
                    assistantInput.focus();
                }
            }

            // Handle send button click
            if (sendButton) {
                console.log("Adding click event listener to send button");
                // Remove any existing listener first to prevent duplicates if this runs multiple times
                // sendButton.removeEventListener("click", sendMessageHandler);
                // const sendMessageHandler = function (e) { ... }; // Define if needed
                sendButton.addEventListener("click", function (e) {
                    console.log("STUDYAIDX: Send button clicked!");
                    e.preventDefault();
                    sendMessage();
                });
            } else {
                console.error("Send button not found during listener setup!");
            }

            // Handle enter key press
            if (assistantInput) {
                console.log("Adding keydown event listener to assistant input");
                assistantInput.addEventListener("keydown", function (e) {
                    if (e.key === "Enter" && !e.shiftKey) {
                        console.log("Enter pressed in input");
                        e.preventDefault();
                        // Trigger button click to ensure consistent handling
                        if (sendButton) {
                            sendButton.click();
                        }
                        // sendMessage(); // Or call directly
                    }
                });
            } else {
                console.error(
                    "Assistant input not found during listener setup!",
                );
            }

            // Minimize and close handlers
            if (assistantMinimize) {
                assistantMinimize.addEventListener("click", () => {
                    assistantMenu.style.display = "none";
                    const reopenIcon = document.getElementById("reopenIcon");
                    if (reopenIcon) {
                        reopenIcon.style.display = "block";
                    }
                });
            }

            if (assistantClose) {
                assistantClose.addEventListener("click", () => {
                    assistantMenu.style.display = "none";
                    // Toggle back to default view if needed
                    localStorage.setItem(
                        "studyAidXVersion",
                        STUDYAIDX_VERSION.DEFAULT,
                    );
                    GM_setValue("studyAidXVersion", STUDYAIDX_VERSION.DEFAULT);
                    currentVersion = STUDYAIDX_VERSION.DEFAULT;

                    const regularMenu =
                        document.getElementById("quizHelperMenu");
                    if (regularMenu) {
                        regularMenu.style.display = "block";
                    }
                });
            }
        }, 100); // Add a small delay to ensure DOM elements are ready

        return assistantMenu;
    }

    // Function to toggle between versions
    function toggleVersion(version) {
        if (version === STUDYAIDX_VERSION.ASSISTANT) {
            // Create or show the assistant interface
            let assistantMenu = document.getElementById(
                "studyAidAssistantMenu",
            );
            if (!assistantMenu) {
                assistantMenu = createStudyAidXAssistant();
            }
            assistantMenu.style.display = "flex";

            // Hide the regular menu
            const regularMenu = document.getElementById("quizHelperMenu");
            if (regularMenu) {
                regularMenu.style.display = "none";
            }
        } else {
            // Show the regular menu
            const regularMenu = document.getElementById("quizHelperMenu");
            if (regularMenu) {
                regularMenu.style.display = "block";
            }

            // Hide the assistant interface
            const assistantMenu = document.getElementById(
                "studyAidAssistantMenu",
            );
            if (assistantMenu) {
                assistantMenu.style.display = "none";
            }
        }

        // Save the current version to storage (both localStorage and GM_setValue)
        localStorage.setItem("studyAidXVersion", version);
        GM_setValue("studyAidXVersion", version);
        currentVersion = version;
    }

    // Add event listener for the download images button
    document
        .getElementById("downloadImagesButton")
        .addEventListener("click", function () {
            const questions = document.querySelector("div.assessing#questions");
            if (questions) {
                const images = questions.getElementsByTagName("img");
                for (const image of images) {
                    const imageUrl = image.src;
                    if (imageUrl) {
                        window.open(imageUrl, "_blank");
                    }
                }
            }
        });

// --- Enhanced Image Processing Infrastructure ---

/**
 * ImageProcessingLogger - Comprehensive logging system for image processing
 */
class ImageProcessingLogger {
    constructor(prefix = '[ImageProcessor]') {
        this.prefix = prefix;
    }

    logProcessingStart(url, method) {
        console.log(`🔄 ${this.prefix} Starting processing: ${url} via ${method}`);
    }

    logError(error, context) {
        console.error(`❌ ${this.prefix} Error in ${context}:`, error);
    }

    logSuccess(url, processingTime, method) {
        console.log(`✅ ${this.prefix} Success: ${url} (${processingTime}ms) via ${method}`);
    }

    logFallback(originalMethod, fallbackMethod, reason) {
        console.warn(`⚠️ ${this.prefix} Fallback: ${originalMethod} → ${fallbackMethod} (${reason})`);
    }

    logValidation(url, isValid, details) {
        if (isValid) {
            console.log(`✅ ${this.prefix} Validation passed: ${url} - ${details}`);
        } else {
            console.warn(`⚠️ ${this.prefix} Validation failed: ${url} - ${details}`);
        }
    }
}

/**
 * ImageProcessor - Core image processing class with robust error handling
 */
// >> DÁN TOÀN BỘ LỚP NÀY VÀO THAY THẾ LỚP CŨ <<
class ImageProcessor {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 3;
        this.timeout = options.timeout || 10000;
        this.maxImageSize = options.maxImageSize || 5 * 1024 * 1024; // 5MB
        this.supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        this.proxyServices = [
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        this.logger = new ImageProcessingLogger();
    }

    /**
     * Main method to process multiple images concurrently
     */
    async processImages(imageUrls) {
        if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
            this.logger.logError(new Error('Invalid imageUrls parameter'), 'processImages');
            return [];
        }

        this.logger.logProcessingStart(`${imageUrls.length} images`, 'batch processing');
        const startTime = Date.now();

        try {
            const results = await Promise.allSettled(
                imageUrls.map(url => this.processSingleImage(url))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
            const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

            const processingTime = Date.now() - startTime;
            console.log(`📊 ${this.logger.prefix} Batch complete: ${successful.length}/${imageUrls.length} successful (${processingTime}ms)`);

            return results.map(r => {
                if (r.status === 'fulfilled') {
                    return r.value;
                }
                return {
                    success: false,
                    error: { type: 'processing_failed', message: r.reason?.message || 'Unknown error' },
                    originalUrl: '',
                    processingMethod: 'failed',
                    processingTime: 0,
                    fallbacksUsed: []
                };
            });
        } catch (error) {
            this.logger.logError(error, 'processImages batch');
            return [];
        }
    }

    /**
     * Process a single image with comprehensive error handling
     */
    async processSingleImage(url) {
        const startTime = Date.now();
        const result = {
            success: false,
            originalUrl: url,
            processingMethod: '',
            processingTime: 0,
            fallbacksUsed: []
        };

        try {
            this.logger.logProcessingStart(url, 'single image');

            if (!this.validateImageUrl(url)) {
                throw new Error('Invalid image URL');
            }

            let imageData = await this.tryDirectFetch(url);
            if (imageData) {
                result.processingMethod = 'direct';
            } else {
                imageData = await this.fetchImageWithCORSBypass(url);
                if (!imageData) {
                    throw new Error('All fetch methods failed');
                }
            }

            const validatedBase64 = await this.convertToValidBase64(imageData.data, imageData.mimeType);
            if (!validatedBase64) {
                throw new Error('Base64 conversion failed');
            }

            result.success = true;
            result.imageData = validatedBase64;
            result.mimeType = imageData.mimeType;
            result.processingTime = Date.now() - startTime;

            this.logger.logSuccess(url, result.processingTime, result.processingMethod);
            return result;

        } catch (error) {
            result.error = {
                type: this.categorizeError(error),
                message: error.message,
                code: error.code
            };
            result.processingTime = Date.now() - startTime;

            this.logger.logError(error, `processSingleImage: ${url}`);
            return result;
        }
    }

    /**
     * Try direct fetch with proper headers
     */
    async tryDirectFetch(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Accept': 'image/*',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const mimeType = blob.type || this.detectMimeTypeFromUrl(url);

            return {
                data: await this.blobToDataUrl(blob),
                mimeType: mimeType
            };
        } catch (error) {
            this.logger.logFallback('direct fetch', 'CORS bypass', error.message);
            return null;
        }
    }

    /**
     * Enhanced CORS bypass with Canvas authentication and retry logic
     */
    async fetchImageWithCORSBypass(url) {
        const canvasResult = await this.tryCanvasAuthentication(url);
        if (canvasResult) {
            return canvasResult;
        }

        for (let i = 0; i < this.proxyServices.length; i++) {
            const proxyService = this.proxyServices[i];
            const result = await this.retryWithBackoff(
                () => this.fetchViaProxy(url, proxyService, i + 1),
                2
            );

            if (result) {
                return result;
            }

            if (i < this.proxyServices.length - 1) {
                this.logger.logFallback(`proxy ${i + 1}`, `proxy ${i + 2}`, 'All retries failed');
            }
        }

        return null;
    }

    /**
     * Try Canvas-specific authentication methods
     */
    async tryCanvasAuthentication(url) {
        if (!this.isCanvasUrl(url)) {
            return null;
        }

        const authMethods = [
            () => this.fetchWithCanvasCredentials(url),
            () => this.fetchWithCanvasTokens(url),
            () => this.fetchWithCanvasHeaders(url)
        ];

        for (let i = 0; i < authMethods.length; i++) {
            try {
                this.logger.logProcessingStart(url, `canvas-auth-${i + 1}`);
                const result = await authMethods[i]();
                if (result) {
                    this.logger.logSuccess(url, 0, `canvas-auth-${i + 1}`);
                    return result;
                }
            } catch (error) {
                this.logger.logError(error, `canvas-auth-${i + 1}`);
                continue;
            }
        }

        return null;
    }

    /**
     * Fetch with Canvas credentials
     */
    async fetchWithCanvasCredentials(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Accept': 'image/*',
                    'Referer': window.location.href,
                    'Origin': window.location.origin,
                    'User-Agent': navigator.userAgent
                }
            });

            if (!response.ok) {
                throw new Error(`Canvas credentials fetch failed: ${response.status}`);
            }

            const blob = await response.blob();
            return {
                data: await this.blobToDataUrl(blob),
                mimeType: blob.type || this.detectMimeTypeFromUrl(url)
            };
        } catch (error) {
            throw new Error(`Canvas credentials method failed: ${error.message}`);
        }
    }

    /**
     * Fetch with Canvas authentication tokens from URL
     */
    async fetchWithCanvasTokens(url) {
        try {
            const urlObj = new URL(url);
            const authParams = new URLSearchParams();
            const authKeys = ['sf_verifier', 'download_frd', 'cb', 'fallback_ts'];
            authKeys.forEach(key => {
                if (urlObj.searchParams.has(key)) {
                    authParams.set(key, urlObj.searchParams.get(key));
                }
            });

            const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
            authParams.set('cb', Date.now().toString());
            const authenticatedUrl = `${baseUrl}?${authParams.toString()}`;

            const response = await fetch(authenticatedUrl, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Accept': 'image/*',
                    'Referer': window.location.href,
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`Canvas token fetch failed: ${response.status}`);
            }

            const blob = await response.blob();
            return {
                data: await this.blobToDataUrl(blob),
                mimeType: blob.type || this.detectMimeTypeFromUrl(url)
            };
        } catch (error) {
            throw new Error(`Canvas token method failed: ${error.message}`);
        }
    }

    /**
     * Fetch with Canvas-specific headers
     */
    async fetchWithCanvasHeaders(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Referer': window.location.href,
                    'Sec-Fetch-Dest': 'image',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': navigator.userAgent
                }
            });

            if (!response.ok) {
                throw new Error(`Canvas headers fetch failed: ${response.status}`);
            }

            const blob = await response.blob();
            return {
                data: await this.blobToDataUrl(blob),
                mimeType: blob.type || this.detectMimeTypeFromUrl(url)
            };
        } catch (error) {
            throw new Error(`Canvas headers method failed: ${error.message}`);
        }
    }

    /**
     * Fetch via proxy service with enhanced error handling
     */
    async fetchViaProxy(url, proxyService, proxyIndex) {
        const proxyUrl = proxyService + encodeURIComponent(url);

        try {
            this.logger.logProcessingStart(proxyUrl, `proxy ${proxyIndex}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(proxyUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'image/*',
                    'User-Agent': navigator.userAgent
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Proxy HTTP ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();

            if (!blob.type.startsWith('image/') && blob.size < 100) {
                throw new Error('Proxy returned invalid image data');
            }

            const result = {
                data: await this.blobToDataUrl(blob),
                mimeType: blob.type || this.detectMimeTypeFromUrl(url)
            };

            this.logger.logSuccess(url, 0, `proxy ${proxyIndex}`);
            return result;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Proxy timeout after ${this.timeout}ms`);
            }
            throw error;
        }
    }

    /**
     * Retry with exponential backoff
     */
    async retryWithBackoff(operation, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (attempt === maxRetries) {
                    this.logger.logError(error, `Final retry attempt ${attempt}`);
                    return null;
                }

                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                this.logger.logFallback(`attempt ${attempt}`, `attempt ${attempt + 1}`,
                    `${error.message} - retrying in ${delay}ms`);

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        return null;
    }

    /**
     * Check if URL is from Canvas LMS
     */
    isCanvasUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('instructure.com') ||
                   urlObj.hostname.includes('canvas-user-content.com') ||
                   urlObj.pathname.includes('/files/') ||
                   urlObj.pathname.includes('/courses/');
        } catch (error) {
            return false;
        }
    }

    /**
     * Convert image data to valid base64 with optimization and validation
     */
    async convertToValidBase64(dataUrl, mimeType) {
        try {
            if (!dataUrl || typeof dataUrl !== 'string') {
                throw new Error('Invalid data URL');
            }

            this.logger.logProcessingStart('base64 conversion', 'validation and optimization');

            let base64Data;
            let detectedMimeType = mimeType;

            if (dataUrl.startsWith('data:')) {
                const parts = dataUrl.split(',');
                if (parts.length !== 2) {
                    throw new Error('Malformed data URL');
                }

                const mimeMatch = parts[0].match(/data:([^;]+)/);
                if (mimeMatch && !detectedMimeType) {
                    detectedMimeType = mimeMatch[1];
                }

                base64Data = parts[1];
            } else {
                base64Data = dataUrl;
            }

            if (!this.validateBase64(base64Data)) {
                this.logger.logError(new Error('Invalid base64 format'), 'base64 validation');

                base64Data = this.cleanBase64(base64Data);
                if (!this.validateBase64(base64Data)) {
                    throw new Error('Base64 cleanup failed - data is corrupted');
                }
                this.logger.logSuccess('base64 cleanup', 0, 'cleaned and validated');
            }

            const validMimeType = this.validateMimeType(detectedMimeType) ? detectedMimeType : 'image/jpeg';
            this.logger.logValidation('MIME type', this.validateMimeType(detectedMimeType),
                `${detectedMimeType} → ${validMimeType}`);

            const imageSize = this.calculateBase64Size(base64Data);
            this.logger.logProcessingStart(`image size: ${this.formatBytes(imageSize)}`, 'size check');

            let optimizedBase64 = base64Data;
            if (imageSize > this.maxImageSize) {
                this.logger.logFallback('original size', 'optimized size',
                    `${this.formatBytes(imageSize)} exceeds ${this.formatBytes(this.maxImageSize)}`);

                optimizedBase64 = await this.optimizeImageSize(base64Data, validMimeType);
                if (!optimizedBase64) {
                    throw new Error('Image optimization failed');
                }

                const newSize = this.calculateBase64Size(optimizedBase64);
                this.logger.logSuccess('image optimization', 0,
                    `${this.formatBytes(imageSize)} → ${this.formatBytes(newSize)}`);
            }

            if (!this.validateForAIService(optimizedBase64)) {
                throw new Error('Base64 data failed AI service validation');
            }

            this.logger.logSuccess('base64 conversion', 0, 'validated and optimized');
            return optimizedBase64;

        } catch (error) {
            this.logger.logError(error, 'convertToValidBase64');
            return null;
        }
    }

    /**
     * Clean base64 string by removing invalid characters
     */
    cleanBase64(base64String) {
        if (!base64String) return '';
        return base64String
            .replace(/\s/g, '')
            .replace(/[^A-Za-z0-9+/=]/g, '');
    }

    /**
     * Calculate size of base64 encoded data in bytes
     */
    calculateBase64Size(base64String) {
        if (!base64String) return 0;
        const withoutPadding = base64String.replace(/=/g, '');
        return Math.floor((withoutPadding.length * 3) / 4);
    }

    /**
     * Format bytes to human readable string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Optimize image size by reducing quality/dimensions
     */
    async optimizeImageSize(base64Data, mimeType) {
        try {
            const img = new Image();
            const dataUrl = `data:${mimeType};base64,${base64Data}`;

            return new Promise((resolve) => {
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        const maxDimension = 1024;
                        let { width, height } = img;

                        if (width > maxDimension || height > maxDimension) {
                            const ratio = Math.min(maxDimension / width, maxDimension / height);
                            width = Math.floor(width * ratio);
                            height = Math.floor(height * ratio);
                        }

                        canvas.width = width;
                        canvas.height = height;

                        ctx.drawImage(img, 0, 0, width, height);

                        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        const optimizedBase64 = optimizedDataUrl.split(',')[1];

                        resolve(optimizedBase64);
                    } catch (error) {
                        this.logger.logError(error, 'canvas optimization');
                        resolve(null);
                    }
                };

                img.onerror = () => {
                    this.logger.logError(new Error('Failed to load image for optimization'), 'image load');
                    resolve(null);
                };

                img.src = dataUrl;
            });
        } catch (error) {
            this.logger.logError(error, 'optimizeImageSize');
            return null;
        }
    }

    /**
     * Validate base64 data for AI service compatibility
     */
    validateForAIService(base64String) {
        try {
            if (!base64String || typeof base64String !== 'string') {
                return false;
            }

            if (base64String.length < 100) {
                this.logger.logValidation('AI service', false, 'Base64 too short');
                return false;
            }

            const maxLength = Math.floor((this.maxImageSize * 4) / 3);
            if (base64String.length > maxLength) {
                this.logger.logValidation('AI service', false, 'Base64 too long');
                return false;
            }

            if (!this.validateBase64(base64String)) {
                this.logger.logValidation('AI service', false, 'Invalid base64 format');
                return false;
            }

            if (base64String.includes('undefined') || base64String.includes('null')) {
                this.logger.logValidation('AI service', false, 'Contains corruption markers');
                return false;
            }

            this.logger.logValidation('AI service', true, 'All checks passed');
            return true;
        } catch (error) {
            this.logger.logError(error, 'validateForAIService');
            return false;
        }
    }

    /**
     * Validate base64 string format
     */
    validateBase64(base64String) {
        try {
            if (!base64String || typeof base64String !== 'string') {
                return false;
            }

            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            if (!base64Regex.test(base64String)) {
                return false;
            }

            atob(base64String);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate MIME type
     */
    validateMimeType(mimeType) {
        return this.supportedFormats.includes(mimeType);
    }

    /**
     * Validate image URL
     */
    validateImageUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }

    /**
     * Detect MIME type from URL extension
     */
    detectMimeTypeFromUrl(url) {
        const extension = url.split('.').pop().toLowerCase();
        const mimeMap = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp'
        };
        return mimeMap[extension] || 'image/jpeg';
    }

    /**
     * Convert blob to data URL
     */
    async blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Categorize errors for better handling
     */
    categorizeError(error) {
        const message = error.message.toLowerCase();
        if (message.includes('cors') || message.includes('cross-origin')) {
            return 'cors_error';
        } else if (message.includes('network') || message.includes('fetch')) {
            return 'network_error';
        } else if (message.includes('base64') || message.includes('encoding')) {
            return 'encoding_error';
        } else if (message.includes('timeout')) {
            return 'timeout_error';
        } else {
            return 'unknown_error';
        }
    }
}

    // Create global image processor instance
    const globalImageProcessor = new ImageProcessor({
        maxRetries: 3,
        timeout: 10000,
        maxImageSize: 5 * 1024 * 1024
    });

    // Legacy function wrapper for backward compatibility



    // Store uploaded media files
    let uploadedImages = [];
    let uploadedAudios = [];

    // Initialize combined media upload functionality
    document
        .getElementById("uploadMediaButton")
        .addEventListener("click", () => {
            console.log("📁 Media upload button clicked");
            document.getElementById("mediaUploader").click();
        });

    document
        .getElementById("mediaUploader")
        .addEventListener("change", (event) => {
            const files = event.target.files;
            console.log("📁 Processing uploaded files:", files.length);

            const imagePreviewContainer =
                document.getElementById("uploadedImages");
            const audioPreviewContainer =
                document.getElementById("uploadedAudios");

            for (const file of files) {
                const reader = new FileReader();

                // Process file based on its type
                if (file.type.startsWith("image/")) {
                    // Handle image file
                    reader.onload = (e) => {
                        const imageData = e.target.result;
                        uploadedImages.push(imageData);
                        console.log(
                            "✅ Successfully processed uploaded image:",
                            file.name,
                        );

                        const imgContainer = document.createElement("div");
                        imgContainer.style.position = "relative";

                        const img = document.createElement("img");
                        img.src = imageData;
                        img.className = "uploaded-image-preview";

                        const removeButton = document.createElement("button");
                        removeButton.className = "remove-image";
                        removeButton.innerHTML = "×";
                        removeButton.onclick = () => {
                            uploadedImages = uploadedImages.filter(
                                (img) => img !== imageData,
                            );
                            imgContainer.remove();
                            console.log(
                                "🗑️ Removed uploaded image:",
                                file.name,
                            );
                        };

                        imgContainer.appendChild(img);
                        imgContainer.appendChild(removeButton);
                        imagePreviewContainer.appendChild(imgContainer);
                    };
                } else if (file.type.startsWith("audio/")) {
                    // Handle audio file
                    reader.onload = (e) => {
                        const audioData = e.target.result;
                        uploadedAudios.push({
                            data: audioData,
                            type: file.type,
                        });
                        console.log(
                            "✅ Successfully processed uploaded audio:",
                            file.name,
                        );

                        const audioContainer = document.createElement("div");
                        audioContainer.style.position = "relative";

                        const audio = document.createElement("audio");
                        audio.src = audioData;
                        audio.controls = true;
                        audio.className = "uploaded-audio-preview";

                        const removeButton = document.createElement("button");
                        removeButton.className = "remove-audio";
                        removeButton.innerHTML = "×";
                        removeButton.onclick = () => {
                            uploadedAudios = uploadedAudios.filter(
                                (audio) => audio.data !== audioData,
                            );
                            audioContainer.remove();
                            console.log(
                                "🗑️ Removed uploaded audio:",
                                file.name,
                            );
                        };

                        audioContainer.appendChild(audio);
                        audioContainer.appendChild(removeButton);
                        audioPreviewContainer.appendChild(audioContainer);
                    };
                } else {
                    console.log("⚠️ Unsupported file type:", file.type);
                    continue;
                }

                reader.readAsDataURL(file);
            }
        });
// >> DÁN TOÀN BỘ HÀM NÀY VÀO THAY THẾ HÀM CŨ <<
async function selectAnswersWithAI() {
    console.log("🤖 Starting AI answer selection process");
    let quizText = "";
    let imagesToProcess = [...uploadedImages];
    let audiosToProcess = [...uploadedAudios];
    const extractedImageUrls = [];
    const isIncognito = localStorage.getItem("incognitoMode") === "true";

    function addLoadingState(questionElement) {
        if (!isIncognito) {
            const loadingDiv = document.createElement("div");
            loadingDiv.classList.add("ai-loading-state");
            loadingDiv.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;
            questionElement.insertBefore(
                loadingDiv,
                questionElement.firstChild,
            );
        }
    }

    function removeLoadingState(questionElement) {
        if (!isIncognito) {
            const loadingDiv =
                questionElement.querySelector(".ai-loading-state");
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }
    }

    try {
        console.log("🔄 Loading Google Generative AI...");
        const { GoogleGenerativeAI } = await import(
            "https://esm.run/@google/generative-ai"
        );
        const API_KEY = "AIzaSyBdS43u9CJs2fb5Mp_coO3xsXxj6KcgSpo";
        const genAI = new GoogleGenerativeAI(API_KEY);
        console.log("✅ Google Generative AI loaded successfully");

        async function sendToAI(prompt, images, audios) {
            const preserveCommas = (text) => { return text.replace(/,/g, "{{COMMA}}"); };
            const restoreCommas = (text) => { return text.replace(/{{COMMA}}/g, ","); };
            const uniqueToken = "{{SEMICOLON_TOKEN}}";
            const preservedPrompt = prompt.replace(/;/g, uniqueToken);
            const formattedQuizText = preservedPrompt.split("\n\n").join(";\n\n").replace(new RegExp(uniqueToken, "g"), ";");
            console.log("✅ Formatted quiz text:", formattedQuizText);

            const turboMode = document.getElementById("turboToggle")?.checked || false;
            console.log("🔄 Sending data to AI...", { promptLength: prompt.length, numberOfImages: images.length, numberOfAudios: audios.length, turboMode });

            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const parts = [{ text: formattedQuizText }];

                let successfulImages = 0;
                for (let imgObject of images) {
                    if (imgObject && imgObject.imageData && imgObject.mimeType) {
                        parts.push({
                            inlineData: {
                                data: imgObject.imageData,
                                mimeType: imgObject.mimeType,
                            },
                        });
                        successfulImages++;
                        console.log(`✅ Successfully added processed image [${imgObject.mimeType}] to AI request:`, imgObject.originalUrl);
                    }
                }
                console.log(`📊 Successfully processed and added ${successfulImages} out of a potential ${images.length} images`);

                let successfulAudios = 0;
                for (let audioData of audios) {
                    if (audioData && audioData.data) {
                        try {
                            const base64AudioData = audioData.data.split(",")[1];
                            const mimeType = audioData.type;
                            parts.push({ inlineData: { data: base64AudioData, mimeType: mimeType } });
                            successfulAudios++;
                            console.log("✅ Successfully added audio to AI request");
                        } catch (err) {
                            console.warn("⚠️ Failed to process audio:", err);
                            continue;
                        }
                    }
                }
                console.log(`📊 Successfully processed ${successfulAudios} out of ${audios.length} audios`);

                console.log("🤖 Generating AI response with primary model...");
                try {
                    const result = await model.generateContent(parts);
                    const response = await result.response.text();
                    console.log("✅ Primary AI response received successfully:", response);

                    if (turboMode) {
                        console.log("🔄 Turbo Mode: Getting secondary AI response...");
                        try {
                            const ai1Response = response;
                            const fallbackGenAI = new GoogleGenerativeAI("NBA8N2GH");
                            const fallbackModel = fallbackGenAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                            const fallbackResult = await fallbackModel.generateContent(parts);
                            const ai2Response = await fallbackResult.response.text();
                            console.log("✅ Secondary AI response received:", ai2Response);
                            if (ai1Response !== ai2Response) {
                                console.log("⚠️ AI responses differ, asking AI 1 to reconsider...");
                                const reconsiderPrompt = `You previously provided this answer to a question:\n\n"${ai1Response}"\n\nAnother AI analyzed the same question and provided this different answer:\n\n"${ai2Response}"\n\nPlease reconsider your answer. If you believe the other AI's answer is more accurate, respond with ONLY "USE_AI2_RESPONSE". If you still believe your original answer is correct, respond with ONLY "USE_AI1_RESPONSE".`;
                                const reconsiderResult = await model.generateContent([{ text: reconsiderPrompt }]);
                                const reconsiderResponse = await reconsiderResult.response.text();
                                console.log("✅ AI 1 reconsideration complete:", reconsiderResponse);
                                if (reconsiderResponse.includes("USE_AI2_RESPONSE")) {
                                    console.log("✅ AI 1 decided to use AI 2 response");
                                    return ai2Response;
                                } else {
                                    console.log("✅ AI 1 decided to keep its original response");
                                    return ai1Response;
                                }
                            }
                        } catch (turboError) {
                            console.warn("⚠️ Turbo mode failed, falling back to primary response:", turboError);
                        }
                    }
                    return response;
                } catch (primaryError) {
                    console.warn("⚠️ Primary API failed, attempting fallback...", primaryError);
                    try {
                        const fallbackGenAI = new GoogleGenerativeAI("NBA8N2GH");
                        const fallbackModel = fallbackGenAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                        console.log("🤖 Generating AI response with fallback model...");
                        const fallbackResult = await fallbackModel.generateContent(parts);
                        const fallbackResponse = await fallbackResult.response.text();
                        console.log("✅ Fallback AI response received successfully:", fallbackResponse);
                        return fallbackResponse;
                    } catch (fallbackError) {
                        console.error("❌ Both APIs failed:", { primary: primaryError, fallback: fallbackError });
                        showToast("Error processing request. Please try again later.");
                        return "Error occurred while processing the request.";
                    }
                }
            } catch (error) {
                console.error("❌ Unexpected error:", error);
                showToast("An unexpected error occurred. Please try again.");
                return "Error occurred while processing the request.";
            }
        }

        console.log("🔄 Extracting quiz content...");
        const quizTitle = document.querySelector(".quiz-header h1");
        if (quizTitle) {
            const titleText = quizTitle.innerText.trim();
            if (titleText) {
                console.log("✅ Đã tìm thấy tiêu đề quiz:", titleText);
                quizText += `Tiêu đề: ${titleText}\n\n`;
            }
        } else {
            console.log("⚠️ Không tìm thấy tiêu đề quiz");
        }

        const quizInstructions = document.querySelector(
            "#quiz-instructions.user_content.enhanced",
        );
        if (quizInstructions) {
            console.log(
                "✅ Đã tìm thấy phần hướng dẫn và nội dung bài đọc",
            );
            const paragraphs = quizInstructions.querySelectorAll("p");
            paragraphs.forEach((p, index) => {
                const text = p.innerText.trim();
                if (text) {
                    console.log(
                        `📝 Đoạn văn ${index + 1}:`,
                        text.substring(0, 50) + "...",
                    );
                    quizText += `${text}\n\n`;
                }
            });
        } else {
            console.log(
                "⚠️ Không tìm thấy phần hướng dẫn và nội dung bài đọc",
            );
        }

        const questionElements = document.querySelectorAll(
            ".question, .question-container, .quiz-item",
        );
        if (questionElements.length === 0) {
            console.error("❌ No questions found");
            showToast("Failed to extract questions. Please try again.");
            return;
        }
        console.log(`📝 Found ${questionElements.length} questions`);

        showToast("Đang xử lý hình ảnh và nội dung...");

        if (!isIncognito) {
            questionElements.forEach(addLoadingState);
        }

        const findAndProcessImages = (element, context) => {
            const imageSelectors = [
                'img[src*="/files/"]',
                'img[src*="/preview"]',
                'img.question_image',
                'div.file_image_preview img'
            ];

            const images = element.querySelectorAll(imageSelectors.join(', '));
            console.log(`📸 ${context}: Found ${images.length} potential images.`);

            images.forEach((img, imgIndex) => {
                const isLikelyContent =
                    (img.naturalWidth > 50 && img.naturalHeight > 50) ||
                    img.getAttribute('data-is-content-image') === 'true' ||
                    !img.classList.contains('emojione') &&
                    !img.getAttribute('role') === 'presentation';

                if (isLikelyContent && img.src) {
                    if (!extractedImageUrls.includes(img.src)) {
                        quizText += `${context} ${imgIndex + 1}: [${img.alt || "Image"}]\n`;
                        extractedImageUrls.push(img.src);
                        console.log(`✅ Added image from ${context}:`, img.src);
                    }
                }
            });
        };

        questionElements.forEach((questionElement, index) => {
            let questionTextElement = questionElement.querySelector(".question_text, .qtext");
            if (questionTextElement) {
                let questionText = "";
                for (let node of questionTextElement.childNodes) { if (node.nodeType === Node.TEXT_NODE) { questionText += node.textContent; } else if (node.nodeType === Node.ELEMENT_NODE) { if (node.classList.contains("MJX_Assistive_MathML")) { questionText += node.textContent; } else { questionText += node.textContent; } } }
                quizText += `Câu hỏi ${index + 1}: ${questionText.trim()}\n`;
            }

            findAndProcessImages(questionElement, `Hình ảnh câu hỏi ${index + 1}`);

            const isMultipleChoice = questionElement.querySelectorAll('input[type="checkbox"]').length > 0;
            if (isMultipleChoice) {
                quizText += "Câu này có thể chọn nhiều đáp án, nhưng không phải lúc nào câu này cũng có 1 đáp án trở lên, xe xét kĩ trước khi đưa ra đáp án\n";
            }

            const answers = questionElement.querySelectorAll(".answer, .answer-text, .option, .ablock, .rightanswer");
            console.log(`📝 Found ${answers.length} answers for question ${index + 1}`);
            answers.forEach((answerElement, answerIndex) => {
                let answerText = "";
                const latexScript = answerElement.querySelector('script[type="math/tex"]');
                if (latexScript) { answerText = latexScript.textContent.trim(); } else { for (let node of answerElement.childNodes) { if (node.nodeType === Node.TEXT_NODE) { answerText += node.textContent; } else if (node.nodeType === Node.ELEMENT_NODE) { if (node.classList.contains("MJX_Assistive_MathML")) { answerText += node.textContent; } else if (node.tagName === "IMG" && node.hasAttribute("alt")) { answerText += `[${node.alt}]`; } else { answerText += node.textContent; } } } }

                findAndProcessImages(answerElement, `Hình ảnh đáp án ${index + 1}.${answerIndex + 1}`);

                if (answerText) {
                    quizText += ` ${answerText.trim()}\n`;
                }
            });
            quizText += "\n";
        });

        quizText += '\n\nĐưa đáp án cho các câu hỏi, mỗi đáp án cách nhau bằng dấu chấm phẩy (;). QUAN TRỌNG: CHỈ trả về đáp án có trong lựa chọn đáp án ,   (ví dụ: Ví dụ nếu câu hỏi có các lựa chọn có các đáp án như:\n- A\n- B\n- C\n- D\nThì đáp án mà A.I đưa ra chỉ có thể là "A", "B" , "C"  hoặc "D"\n\nCòn nếu câu hỏi có cách lựa chọn có các đáp án như :\n\nElectron (điện tử) là những hạt lớn không mang điện tích.\n\nElectron (điện tử) là những hạt nhỏ mang điện tích dương.\n\nElectron (điện tử) là những hạt nhỏ mang điện tích âm.\n\nElectron (điện tử) là những hạt nhỏ không mang điện tích.\n\nthì chỉ đưa đáp án có trong các lựa chọn đáp án , QUAN TRỌNG : KO THÊM BẤT KỲ KÍ HIỆU HAY GIẢM KÍ TỰ GÌ" ví dụ khi A.I đưa ra sai đáp án "C. Electron (điện tử) là những hạt nhỏ mang điện tích âm"\n\n ), KHÔNG được thêm bất kỳ thông tin nào khác như \'Câu hỏi X:\' hay số thứ tự. Tất cả đáp án phải nằm trên một dòng duy nhất, không xuống dòng. **Nếu đáp án là các biểu thức toán học, hãy trả về chúng dưới dạng LaTeX kèm theo ký hiệu đáp án, ví dụ: \'A. \\frac{1}{2}\'**. Đảm bảo luôn trả về đầy đủ nội dung đáp án bất kể định dạng đầu vào. Ví dụ mẫu đáp án đúng: \'A. Cả hai đáp án đúng; B. Trồng lúa lấy gạo để xuất khẩu; C. Sử dụng thuốc hóa học; D. Tăng diện tích đất trồng\'';

        console.log("🔄 Processing images with new infrastructure...");
        showToast("Đang xử lý hình ảnh...");

        const processingResults = await globalImageProcessor.processImages(extractedImageUrls);

        // >> LOGIC XỬ LÝ LỖI HOÀN THIỆN <<
        const successfulImages = [];
        processingResults.forEach(result => {
            if (result.success) {
                successfulImages.push(result);
            } else {
                // Ghi log chi tiết cho các ảnh lỗi nhưng không làm dừng tiến trình
                console.error(`❌ Failed to process image: ${result.originalUrl}`, result.error);
                quizText += `\n[LỖI HÌNH ẢNH: Không thể tải hình ảnh từ URL ${result.originalUrl}. Lý do: ${result.error.message}]`;
            }
        });

        console.log(`📊 Successfully processed ${successfulImages.length} out of ${extractedImageUrls.length} images using new infrastructure.`);

        imagesToProcess = [...imagesToProcess, ...successfulImages];

        showToast("Đang xử lý câu trả lời bằng AI...");
        console.log("🤖 Sending to AI for processing...");
        console.log("Data sent to AI:", { prompt: quizText, images: imagesToProcess.length, audios: audiosToProcess.length });

        const aiResponse = await sendToAI(quizText, imagesToProcess, audiosToProcess);
        console.log("✅ AI Response received:", aiResponse);

        const correctAnswers = aiResponse.split(";").map((answer) => { return answer.trim().replace(/\s*[;,]\s*$/, ""); }).filter((answer) => answer.length > 0);
        console.log("📊 Original AI response:", aiResponse);
        console.log("📊 Parsed answers:", correctAnswers);
        const autoSubmit = loadAutoSubmitPreference();
        selectCorrectAnswers(correctAnswers, autoSubmit);

        if (!isIncognito) {
            questionElements.forEach(removeLoadingState);
            console.log("✅ Answers selected successfully!");
            showToast("Đã chọn đáp án bằng AI!");
        }
    } catch (error) {
        if (!isIncognito) {
            const questionElements = document.querySelectorAll(".question, .question-container, .quiz-item");
            questionElements.forEach(removeLoadingState);
            console.error("❌ Main process error:", error);
            showToast("Có lỗi xảy ra. Vui lòng thử lại.");
        }
    }
}
    document
        .getElementById("aiAnswerButton")
        .addEventListener("click", selectAnswersWithAI);

    async function handleQuestionReply() {
        console.log("🤖 Bắt đầu xử lý câu trả lời.");

        // Kiểm tra xem script đã được khởi tạo chưa
        if (!window.studyAidXInitialized) {
            console.log("⚠️ Script chưa được khởi tạo đầy đủ.");
            return;
        }

        let getAnswerButton;
        let contentType = ""; // Biến để theo dõi loại nội dung: 'discussion' hoặc 'assignment'

        try {
            // Kiểm tra xem nút đã tồn tại chưa để tránh tạo nhiều nút
            if (document.querySelector(".get-answer-btn")) {
                console.log('🔔 Nút "ẤN VÔ ĐÂY ĐỂ COPY ĐÁP ÁN" đã tồn tại.');
                return;
            }

            // Tạo nút ngay lập tức và thêm vào DOM
            getAnswerButton = document.createElement("button");
            getAnswerButton.textContent = "ẤN VÔ ĐÂY ĐỂ COPY ĐÁP ÁN";
            getAnswerButton.className = "btn-success get-answer-btn";
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
            let titleSelector,
                questionSelector,
                answersSelector,
                insertionPoint;

            if (document.querySelector(".discussion-title")) {
                contentType = "discussion";
                titleSelector = ".discussion-title";
                questionSelector = ".message_wrapper .message";
                answersSelector =
                    ".message_wrapper .message.user_content.enhanced";
                insertionPoint = document.querySelector(".btn-success"); // Ưu tiên sau nút "Đã đăng ký" trong discussion
                if (!insertionPoint)
                    insertionPoint = document.querySelector(".message_wrapper"); // Nếu không có "Đã đăng ký", chèn vào cuối thảo luận
            } else if (document.querySelector(".assignment-title")) {
                contentType = "assignment";
                titleSelector = ".assignment-title";
                questionSelector = ".description.user_content.enhanced";
                answersSelector = null;
                insertionPoint = document.querySelector(".title-content"); // Chèn nút vào div có class "title-content" cho assignment
            } else {
                console.log(
                    "⚠️ Không xác định được loại nội dung (không phải discussion hoặc assignment).",
                );
                return; // Không xử lý nếu không phải hai loại trên
            }

            if (insertionPoint) {
                if (
                    contentType === "discussion" &&
                    document.querySelector(".btn-success")
                ) {
                    insertionPoint.parentNode.insertBefore(
                        getAnswerButton,
                        insertionPoint.nextSibling,
                    );
                    console.log(
                        `✅ Đã chèn nút vào ${contentType} sau nút "Đã đăng ký".`,
                    );
                } else {
                    insertionPoint.appendChild(getAnswerButton);
                    console.log(`✅ Đã chèn nút vào cuối phần ${contentType}.`);
                }
            } else {
                console.log(
                    `⚠️ Không tìm thấy vị trí chèn nút cho ${contentType}.`,
                );
                return;
            }

            console.log("🔄 Đang tải Google Generative AI...");
            const { GoogleGenerativeAI } = await import(
                "https://esm.run/@google/generative-ai"
            );
            const API_KEY = "AIzaSyBdS43u9CJs2fb5Mp_coO3xsXxj6KcgSpo"; // Replace with your actual API key
            const genAI = new GoogleGenerativeAI(API_KEY);

            async function sendToAI(prompt, focusPrompt = "") {
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash",
                });
                const parts = [{ text: `${focusPrompt}\n\n${prompt}` }];

                // Tạo 2 AI để tranh luận
                const ai1Result = await model.generateContent(parts);
                const ai1Response = await ai1Result.response.text();

                const ai2Parts = [
                    {
                        text: `${focusPrompt}\n\n${prompt}\nHãy phân tích kết quả sau và đưa ra ý kiến của bạn: ${ai1Response}`,
                    },
                ];
                const ai2Result = await model.generateContent(ai2Parts);
                const ai2Response = await ai2Result.response.text();

                // Nếu 2 AI có ý kiến khác nhau, cho họ tranh luận
                if (ai1Response !== ai2Response) {
                    const debateParts = [
                        {
                            text: `${focusPrompt}\n\n${prompt}\n\nAI 1: ${ai1Response}\n\nAI 2: ${ai2Response}\n\nHãy phân tích cả 2 ý kiến trên và đưa ra kết luận cuối cùng theo đúng format yêu cầu.`,
                        },
                    ];
                    const finalResult =
                        await model.generateContent(debateParts);
                    return await finalResult.response.text();
                }

                return ai1Response;
            }

            // Trích xuất nội dung dựa trên loại trang
            let discussionContent = "";
            if (contentType === "discussion" || contentType === "assignment") {
                // Trích xuất tiêu đề
                const titleElement = document.querySelector(titleSelector);
                const titleContent = titleElement
                    ? titleElement.innerText.trim()
                    : "";

                // Trích xuất câu hỏi
                const questionElement =
                    document.querySelector(questionSelector);
                const questionContent = questionElement
                    ? questionElement.innerText.trim()
                    : "";

                let answersContent = "";
                if (contentType === "discussion" && answersSelector) {
                    const answersElements =
                        document.querySelectorAll(answersSelector);
                    answersElements.forEach((answerElement) => {
                        answersContent +=
                            answerElement.innerText.trim() + "\n\n";
                    });
                }

                // Kiểm tra và xử lý nội dung trống
                if (!titleContent || !questionContent) {
                    console.log(
                        `⚠️ Thiếu tiêu đề hoặc nội dung câu hỏi trong phần ${contentType}.`,
                    );
                    return;
                }

                // Tạo nội dung với định dạng cải tiến
                discussionContent = `Tiêu đề: ${titleContent.replace(/\n+/g, " ").trim()}\n\nCâu hỏi: ${questionContent.replace(/\n+/g, " ").trim()}`;

                // Thêm các câu trả lời khác nếu có và làm sạch định dạng
                if (answersContent) {
                    const cleanedAnswers = answersContent
                        .split("\n\n")
                        .filter((answer) => answer.trim())
                        .map((answer) => answer.replace(/\n+/g, " ").trim())
                        .join("\n\n");
                    if (cleanedAnswers) {
                        discussionContent += `\n\nCác câu trả lời khác:\n${cleanedAnswers}`;
                    }
                }

                const customPrompt = `Vui lòng phân tích nội dung ${contentType} (bằng tiếng Việt) và tạo ra câu trả lời ngắn gọn, súc tích và thuyết phục dưới dạng HTML được định dạng tốt, có sử dụng CSS inline. Câu trả lời cần có bố cục rõ ràng, dễ đọc. Các phần văn bản của c �u trả lời cần xuất hiện (animate in) mượt mà khi người dùng cuộn trang đến và biến mất (animate out) mượt mà khi người dùng cuộn trang ra khỏi, tạo hiệu ứng hiển thị/ẩn mượt mà dựa trên cuộn trang. Hiệu ứng này cần đạt được bằng cách sử dụng CSS keyframes và thuộc tính \`animation-timeline: view;\` và \`animation-range: entry cover;\` cho hoạt ảnh dựa trên cuộn trang, không sử dụng bất kỳ Javascript tùy chỉnh nào. Hãy sử dụng CSS ví dụ được cung cấp làm hướng dẫn cho hoạt ảnh, nhưng hãy điều chỉnh khi cần thiết cho nội dung cụ thể. Sử dụng các thẻ HTML ngữ nghĩa và các style inline liên quan để định dạng tốt hơn, dễ đọc và thuyết phục hơn. Đặc biệt chú ý làm cho câu trả lời dễ đọc và dễ hiểu. Sử dụng danh sách hoặc bảng khi thích hợp. HTML phải bao gồm một hình mờ bán trong suốt (watermark) với dòng chữ "Em không sử dụng A.I" được đặt ở góc dưới cùng bên phải của nội dung. Chỉ cung cấp nội dung HTML trong thẻ <body>, không có thẻ <html>, <head> hoặc <body> bao quanh. Không bao gồm bất kỳ nhận xét mở đầu hoặc kết thúc nào như "Chúc bạn học tốt!" hoặc bất kỳ văn bản nào khác ngoài phản hồi HTML có cấu trúc. Không đính kèm HTML bằng \`\`\`html hoặc \`\`\`. Câu trả lời cần trả lời được câu hỏi. Đối với ${contentType} là thảo luận, câu trả lời cần tham khảo và giống với các câu trả lời của các bạn học sinh khác đã được cung cấp (nếu có).`;

                // Add spinner style (chỉ thêm nếu chưa có)
                if (!document.querySelector("#spinnerAnimation")) {
                    const style = document.createElement("style");
                    style.id = "spinnerAnimation";
                    style.textContent = `
                                                    @keyframes spin {
                                                        to { transform: rotate(360deg); }
                                                    }
                                                `;
                    document.head.appendChild(style);
                }

                // Enhanced loading state function
                const setLoading = (isLoading, phase = "") => {
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

                        let loadingText = "Đang khởi t�ộng AI...";
                        switch (phase) {
                            case "analyzing":
                                loadingText = "AI đang phân tích câu hỏi...";
                                break;
                            case "generating":
                                loadingText = "AI đang soạn câu trả lời...";
                                break;
                            case "formatting":
                                loadingText = "AI đang định dạng nội dung...";
                                break;
                            default:
                                loadingText = "Đang xử lý...";
                        }

                        getAnswerButton.innerHTML = spinnerHTML + loadingText;
                        getAnswerButton.style.backgroundColor = "#666666";
                    } else {
                        getAnswerButton.disabled = false;
                        getAnswerButton.innerHTML = "ẤN VÔ ĐÂY ĐỂ COPY ĐÁP ÁN";
                        getAnswerButton.style.backgroundColor = "#0B874B";
                    }
                };

                // Set initial loading state
                setLoading(true);

                // Wait for the next frame so the DOM has time to update
                await new Promise((resolve) => requestAnimationFrame(resolve));

                // Update loading state for analysis
                setLoading(true, "analyzing");
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Update loading state for generation
                setLoading(true, "generating");
                let aiResponse = await sendToAI(
                    discussionContent,
                    customPrompt,
                );

                // Remove "```html" and "```" from the AI response
                aiResponse = aiResponse
                    .replace("```html", "")
                    .replace("```", "");

                // Update loading state for formatting
                setLoading(true, "formatting");
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Reset loading state
                setLoading(false);

                // Copy AI response to clipboard on button click
                getAnswerButton.addEventListener("click", () => {
                    navigator.clipboard
                        .writeText(aiResponse)
                        .then(() => {
                            console.log(
                                `✅ AI response (Styled HTML with Sources) cho ${contentType} đã được sao chép vào clipboard!`,
                            );
                        })
                        .catch((err) => {
                            console.error("  � Không thể sao chép. Lỗi:", err);
                        });
                });
            }
        } catch (error) {
            console.error("❌ Lỗi trong quá trình xử lý:", error);
            if (getAnswerButton) {
                getAnswerButton.innerHTML = "❌ Đã xảy ra lỗi";
                getAnswerButton.style.backgroundColor = "#dc3545";
                setTimeout(() => {
                    getAnswerButton.innerHTML = "ẤN VÔ ĐÂY ĐỂ COPY ĐÁP ÁN";
                    getAnswerButton.style.backgroundColor = "#0B874B";
                    getAnswerButton.disabled = false;
                }, 2000);
            }
        }
    }

    // Function to create and add AI text link next to each question
    function addAILinksToQuestions() {
        const questionElements = document.querySelectorAll(
            ".question, .question-container, .quiz-item",
        );
        questionElements.forEach((element, index) => {
            const link = document.createElement("span");
            link.className = "ai-question-link";
            link.textContent = "Ask AI";
            link.setAttribute("data-question-index", index);
            element.appendChild(link);

            link.addEventListener("click", (e) => {
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
                console.log(
                    "📝 Using cached question analysis for question",
                    questionIndex,
                );
                const cachedAnalysis = questionAnalysisCache.get(cacheKey);
                showChatPopup(questionIndex, cachedAnalysis.prompt);
                return;
            }

            console.log("🔍 Analyzing question", questionIndex);
            const analysis = await analyzeQuestion(
                questionElement,
                questionIndex,
            );
            questionAnalysisCache.set(cacheKey, analysis);

            showChatPopup(questionIndex, analysis.prompt);
        } catch (error) {
            console.error("❌ Error analyzing question:", error);
            showToast("Failed to analyze question. Please try again.");
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
            prompt,
        };
    }

    async function extractQuestionComponents(questionElement) {
        const components = {
            text: "",
            images: [],
            options: [],
            type: detectQuestionType(questionElement),
            metadata: {},
        };

        // Extract question text with improved parsing
        const questionTextElement =
            questionElement.querySelector(".question_text");
        if (questionTextElement) {
            components.text = await parseQuestionText(questionTextElement);
        }

        // Extract and validate images
        const images = questionElement.querySelectorAll(
            'img[alt*="Screenshot"]',
        );
        components.images = Array.from(images).map((img) => ({
            src: img.src,
            alt: img.alt,
            dimensions: {
                width: img.naturalWidth,
                height: img.naturalHeight,
            },
        }));

        // Extract and categorize answer options
        const answerElements = questionElement.querySelectorAll(
            ".answer, .answer-text, .option",
        );
        components.options = await Promise.all(
            Array.from(answerElements).map(async (element, index) => {
                return {
                    index,
                    text: await parseAnswerText(element),
                    type: detectAnswerType(element),
                    images: Array.from(element.querySelectorAll("img")).map(
                        (img) => ({
                            src: img.src,
                            alt: img.alt,
                        }),
                    ),
                };
            }),
        );

        // Extract metadata
        components.metadata = {
            hasLatex: detectLatexContent(questionElement),
            hasCode: detectCodeContent(questionElement),
            complexity: assessQuestionComplexity(components),
        };

        return components;
    }

    async function parseQuestionText(element) {
        let text = "";

        // Handle LaTeX content
        const latexElements = element.querySelectorAll(
            'script[type="math/tex"]',
        );
        if (latexElements.length > 0) {
            for (const latex of latexElements) {
                text += `[LATEX]${latex.textContent}[/LATEX]`;
            }
        }

        // Handle regular text
        const textNodes = Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent.trim());

        text += textNodes.join(" ");

        return text;
    }

    async function processQuestionImages(images) {
        return new Promise((resolve, reject) => {
            imageProcessingQueue.push({
                images,
                resolve,
                reject,
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
                        if (!(await isValidImage(img.src))) {
                            console.warn("⚠️ Invalid image:", img.src);
                            return null;
                        }

                        // Process image with retries
                        for (let attempt = 0; attempt < 3; attempt++) {
                            try {
                                const base64Data = await convertImageToBase64(
                                    img.src,
                                );
                                if (base64Data) {
                                    return {
                                        ...img,
                                        base64: base64Data,
                                        processed: true,
                                    };
                                }
                            } catch (err) {
                                console.warn(
                                    `⚠️ Attempt ${attempt + 1} failed for image:`,
                                    img.src,
                                );
                                if (attempt === 2) throw err;
                            }
                        }
                    }),
                );

                resolve(processedImages.filter((img) => img !== null));
            } catch (error) {
                reject(error);
            }
        }

        isProcessingImages = false;
    }

    async function isValidImage(src) {
        try {
            const response = await fetch(src);
            const contentType = response.headers.get("content-type");
            return contentType && contentType.startsWith("image/");
        } catch {
            return false;
        }
    }

    function detectQuestionType(element) {
        if (element.querySelector("select")) return "matching";
        if (element.querySelector('input[type="checkbox"]'))
            return "multiple_select";
        if (element.querySelector('input[type="radio"]'))
            return "multiple_choice";
        if (element.querySelector('input[type="text"]')) return "fill_in_blank";
        return "unknown";
    }

    function detectAnswerType(element) {
        if (element.querySelector("img")) return "image_based";
        if (element.querySelector('script[type="math/tex"]')) return "latex";
        if (element.querySelector("code")) return "code";
        return "text";
    }

    function detectLatexContent(element) {
        return element.querySelector('script[type="math/tex"]') !== null;
    }

    function detectCodeContent(element) {
        return element.querySelector("code, pre") !== null;
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
            prompt += "Images:\n";
            processedImages.forEach((img, index) => {
                prompt += `[Image ${index + 1}]: ${img.alt}\n`;
            });
            prompt += "\n";
        }

        // Add answer options
        if (components.options.length > 0) {
            prompt += "Answer Options:\n";
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
            const existingPopup = document.querySelector(".ai-chat-popup");
            if (existingPopup) {
                existingPopup.remove();
            }

            // Create popup with enhanced UI
            const popup = createEnhancedChatPopup(questionIndex);
            document.body.appendChild(popup);

            // Initialize chat state
            chatState.activeChats.set(questionIndex, {
                messages: [],
                status: "active",
                lastActivity: Date.now(),
            });

            // Setup event listeners and load history
            setupEnhancedChatEventListeners(
                popup,
                questionIndex,
                initialQuestion,
            );
            loadChatHistoryWithRetry(questionIndex, popup);

            // Send initial question if no history exists
            if (
                !chatHistory.has(questionIndex) &&
                !localStorage.getItem(`chatHistory-${questionIndex}`)
            ) {
                sendMessageToAI(initialQuestion, questionIndex, popup);
            }

            // Add auto-save functionality
            setupAutoSave(popup, questionIndex);
        } catch (error) {
            console.error("Failed to create chat popup:", error);
            showToast("Failed to open chat. Please try again.");
        }
    }

    function createEnhancedChatPopup(questionIndex) {
        const popup = document.createElement("div");
        popup.className = "ai-chat-popup enhanced";

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

    function setupEnhancedChatEventListeners(
        popup,
        questionIndex,
        initialQuestion,
    ) {
        const elements = {
            closeBtn: popup.querySelector(".close-popup"),
            minimizeBtn: popup.querySelector(".minimize-popup"),
            sendBtn: popup.querySelector(".send-message"),
            input: popup.querySelector(".chat-input"),
            clearHistoryBtn: popup.querySelector("#clear-history"),
            uploadBtn: popup.querySelector("#upload-button"),
            fileInput: popup.querySelector("#file-upload"),
            modelSelect: popup.querySelector("#model-select"),
            exportBtn: popup.querySelector("#export-chat"),
            retryBtn: popup.querySelector(".retry-button"),
            errorContainer: popup.querySelector(".error-container"),
        };

        // Close and minimize handlers
        elements.closeBtn.addEventListener("click", () => {
            saveAndCloseChat(popup, questionIndex);
        });

        elements.minimizeBtn.addEventListener("click", () => {
            minimizeChat(popup);
        });

        // Input handling with smart features
        setupEnhancedInputHandling(
            elements.input,
            elements.sendBtn,
            async (message) => {
                await sendMessageWithRetry(message, questionIndex, popup);
            },
        );

        // Clear history with confirmation
        elements.clearHistoryBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear the chat history?")) {
                clearChatHistoryWithBackup(questionIndex, popup);
            }
        });

        // Enhanced file upload
        setupEnhancedFileUpload(
            elements.uploadBtn,
            elements.fileInput,
            questionIndex,
            popup,
        );

        // Model selection
        elements.modelSelect.addEventListener("change", () => {
            handleModelChange(elements.modelSelect.value, questionIndex);
        });

        // Export functionality
        elements.exportBtn.addEventListener("click", () => {
            exportChatHistory(questionIndex);
        });

        // Error retry handling
        elements.retryBtn.addEventListener("click", () => {
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
            sendBtn.classList.toggle("active", hasContent);
        };

        input.addEventListener("input", () => {
            updateSendButton();
            autoResizeInput(input);
        });

        input.addEventListener("compositionstart", () => {
            composing = true;
        });

        input.addEventListener("compositionend", () => {
            composing = false;
        });

        input.addEventListener("keydown", async (e) => {
            if (e.key === "Enter" && !e.shiftKey && !composing) {
                e.preventDefault();
                const message = input.value.trim();
                if (message) {
                    input.value = "";
                    updateSendButton();
                    autoResizeInput(input);
                    await onSend(message);
                }
            }
        });

        sendBtn.addEventListener("click", async () => {
            const message = input.value.trim();
            if (message) {
                input.value = "";
                updateSendButton();
                autoResizeInput(input);
                await onSend(message);
            }
        });
    }

    function autoResizeInput(input) {
        input.style.height = "auto";
        input.style.height = input.scrollHeight + "px";
    }

    async function sendMessageWithRetry(
        message,
        questionIndex,
        popup,
        retryCount = 0,
    ) {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000;

        try {
            showTypingIndicator(popup);
            const response = await sendMessageToAI(
                message,
                questionIndex,
                popup,
            );
            hideTypingIndicator(popup);
            return response;
        } catch (error) {
            hideTypingIndicator(popup);

            if (retryCount < MAX_RETRIES) {
                showToast(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise((resolve) =>
                    setTimeout(resolve, RETRY_DELAY),
                );
                return sendMessageWithRetry(
                    message,
                    questionIndex,
                    popup,
                    retryCount + 1,
                );
            } else {
                showError(
                    popup,
                    "Failed to send message after multiple attempts",
                );
                throw error;
            }
        }
    }

    function showTypingIndicator(popup) {
        const indicator = popup.querySelector(".typing-indicator");
        indicator.style.display = "flex";
    }

    function hideTypingIndicator(popup) {
        const indicator = popup.querySelector(".typing-indicator");
        indicator.style.display = "none";
    }

    function showError(popup, message) {
        const errorContainer = popup.querySelector(".error-container");
        const errorMessage = popup.querySelector(".error-message");
        errorMessage.textContent = message;
        errorContainer.style.display = "flex";
    }

    function hideError(popup) {
        const errorContainer = popup.querySelector(".error-container");
        errorContainer.style.display = "none";
    }

    function setupAutoSave(popup, questionIndex) {
        let saveTimeout;
        const SAVE_DELAY = 1000; // 1 second delay

        const autoSave = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                const messages =
                    chatState.activeChats.get(questionIndex)?.messages || [];
                saveChatHistoryToLocalStorage(questionIndex, messages);
            }, SAVE_DELAY);
        };

        // Listen for message additions
        const observer = new MutationObserver(autoSave);
        const messagesContainer = popup.querySelector(".messages-container");
        observer.observe(messagesContainer, { childList: true, subtree: true });

        // Cleanup on popup close
        popup.addEventListener("remove", () => {
            observer.disconnect();
            clearTimeout(saveTimeout);
        });
    }

    function exportChatHistory(questionIndex) {
        const history = chatHistory.get(questionIndex) || [];
        const exportData = {
            questionIndex,
            timestamp: new Date().toISOString(),
            messages: history,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-history-q${questionIndex + 1}-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function makeDraggable(element) {
        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
        const header = element.querySelector(".popup-header");

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
        totalResponseTime: 0,
    };

    async function sendMessageToAI(message, questionIndex, popup) {
        const messagesContainer = popup.querySelector(".chat-messages");
        const cacheKey = `${questionIndex}-${message}`;

        // Check cache first
        if (aiResponseCache.has(cacheKey)) {
            console.log("🎯 Cache hit for question", questionIndex);
            const cachedResponse = aiResponseCache.get(cacheKey);
            addMessageToChat("user", message, messagesContainer);
            addMessageToChat("ai", cachedResponse, messagesContainer);
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
                timestamp: Date.now(),
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
                const response = await processAIRequest(
                    message,
                    questionIndex,
                    popup,
                );
                const endTime = performance.now();

                // Update performance metrics
                performanceMetrics.totalRequests++;
                performanceMetrics.successfulRequests++;
                performanceMetrics.totalResponseTime += endTime - startTime;
                performanceMetrics.averageResponseTime =
                    performanceMetrics.totalResponseTime /
                    performanceMetrics.successfulRequests;

                resolve(response);

                // Rate limiting
                await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY));
            } catch (error) {
                performanceMetrics.failedRequests++;
                reject(error);
            }
        }

        isProcessingQueue = false;
    }

    async function processAIRequest(message, questionIndex, popup) {
        const messagesContainer = popup.querySelector(".chat-messages");
        const modelSelect = popup.querySelector("#model-select");
        const selectedModel = modelSelect.value;

        // Add user message to chat
        const userMsg = addMessageToChat("user", message, messagesContainer);
        addEditButtonToMessage(userMsg, questionIndex, popup);

        // Display thinking message
        const thinkingMsg = addMessageToChat(
            "ai",
            "AI is thinking...",
            messagesContainer,
        );

        try {
            // Load AI model with validation
            const { GoogleGenerativeAI } = await import(
                "https://esm.run/@google/generative-ai"
            );
            if (!GoogleGenerativeAI) throw new Error("Failed to load AI model");

            const API_KEY = "AIzaSyBdS43u9CJs2fb5Mp_coO3xsXxj6KcgSpo";
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: selectedModel });

            // Enhanced context processing
            const enhancedMessage = await preprocessMessage(message);
            const result = await model.generateContent(enhancedMessage);

            // Validate response
            if (!result || !result.response)
                throw new Error("Invalid AI response");

            let response = await result.response.text();

            // Confidence scoring
            const confidence = calculateConfidence(response);
            if (confidence < CONFIDENCE_THRESHOLD) {
                console.warn(
                    `Low confidence response (${confidence.toFixed(2)}) for question ${questionIndex}`,
                );
                response = await enhanceResponse(response, model);
            }

            // Remove thinking message
            thinkingMsg.remove();

            // Format and cache response
            response = formatResponse(response);
            aiResponseCache.set(`${questionIndex}-${message}`, response);

            // Add to chat
            addMessageToChat("ai", response, messagesContainer);

            // Update chat history
            const history = chatHistory.get(questionIndex) || [];
            history.push({ role: "user", content: message });
            history.push({ role: "assistant", content: response });
            chatHistory.set(questionIndex, history);
            saveChatHistoryToLocalStorage(questionIndex, history);

            return response;
        } catch (error) {
            console.error("AI Processing Error:", error);
            thinkingMsg.remove();

            // Enhanced error handling
            const errorMessage = handleAIError(error);
            addMessageToChat("error", errorMessage, messagesContainer);
            throw error;
        }
    }

    async function preprocessMessage(message) {
        // Remove unnecessary whitespace and normalize text
        message = message.trim().replace(/\s+/g, " ");

        // Extract key concepts and enhance context
        const concepts = extractKeyConcepts(message);

        // Add context markers for better AI understanding
        return `[CONTEXT] Question analysis request\n[CONCEPTS] ${concepts.join(", ")}\n[QUERY] ${message}`;
    }

    function extractKeyConcepts(message) {
        // Simple keyword extraction (can be enhanced with NLP)
        const keywords = message
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(" ")
            .filter((word) => word.length > 3);

        return [...new Set(keywords)];
    }

    function calculateConfidence(response) {
        // Implement confidence scoring based on:
        // 1. Response length and completeness
        // 2. Presence of key indicators
        // 3. Response structure

        let confidence = 1.0;

        if (response.length < 50) confidence *= 0.8;
        if (!response.includes("because")) confidence *= 0.9;
        if (response.includes("I am not sure") || response.includes("might be"))
            confidence *= 0.7;

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
        if (error.message.includes("API")) {
            return "API Error: The AI service is temporarily unavailable. Please try again in a few moments.";
        } else if (error.message.includes("timeout")) {
            return "Request timed out. The server might be busy, please try again.";
        } else if (error.message.includes("rate limit")) {
            return "Rate limit reached. Please wait a moment before making another request.";
        }
        return "An unexpected error occurred. Please try again or contact support if the issue persists.";
    }

    // Function to add message to chat display with copy button for AI responses
    function addMessageToChat(role, content, container) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `chat-message ${role}-message`;
        messageDiv.setAttribute("data-role", role);

        const messageContent = document.createElement("div");
        messageContent.className = "message-content";
        messageContent.innerHTML = content; // Use innerHTML to render formatted text

        messageDiv.appendChild(messageContent);

        if (role === "ai") {
            const copyButton = document.createElement("button");
            copyButton.className = "copy-message";
            copyButton.textContent = "Copy";
            copyButton.addEventListener("click", () => {
                navigator.clipboard.writeText(content);
                showToast("Copied to clipboard!");
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
            const messagesContainer = popup.querySelector(".chat-messages");
            history.forEach((msg) => {
                addMessageToChat(
                    msg.role === "user" ? "user" : "ai",
                    msg.content,
                    messagesContainer,
                );
            });
        }
    }

    // Function to show toast notification
    function showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) {
            const newToast = document.createElement("div");
            newToast.id = "toast";
            newToast.className = "toast-notification";
            document.body.appendChild(newToast);
        }

        const toastElement = document.getElementById("toast");
        toastElement.textContent = message;
        toastElement.classList.add("show");

        setTimeout(() => {
            toastElement.classList.remove("show");
        }, 3000);
    }

    // Function to format the response (add line breaks, etc.)
    function formatResponse(response) {
        // Add line breaks
        response = response.replace(/\n/g, "<br>");

        // You can add more formatting here if needed (e.g., bold, italics)
        // For example, to make text between asterisks bold:
        // response = response.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

        return response;
    }

    // Initialize AI links when page loads
    document.addEventListener("DOMContentLoaded", addAILinksToQuestions);

    // Function to save chat history to local storage
    function saveChatHistoryToLocalStorage(questionIndex, history) {
        localStorage.setItem(
            `chatHistory-${questionIndex}`,
            JSON.stringify(history),
        );
    }

    // Function to load chat history from local storage
    function loadChatHistoryFromLocalStorage(questionIndex, popup) {
        const history = JSON.parse(
            localStorage.getItem(`chatHistory-${questionIndex}`),
        );
        if (history) {
            chatHistory.set(questionIndex, history);
            const messagesContainer = popup.querySelector(".chat-messages");
            history.forEach((msg) => {
                const messageElement = addMessageToChat(
                    msg.role,
                    msg.content,
                    messagesContainer,
                );
                if (msg.role === "user") {
                    addEditButtonToMessage(
                        messageElement,
                        questionIndex,
                        popup,
                    );
                }
            });
        }
    }

    // Function to clear chat history
    function clearChatHistory(questionIndex, popup) {
        chatHistory.delete(questionIndex);
        localStorage.removeItem(`chatHistory-${questionIndex}`);
        const messagesContainer = popup.querySelector(".chat-messages");
        messagesContainer.innerHTML = ""; // Clear the messages in the popup
        showToast("Chat history cleared!");
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
            const messagesContainer = popup.querySelector(".chat-messages");
            addMessageToChat(
                "user",
                `Uploaded file: ${fileName}`,
                messagesContainer,
            );

            // Send message to AI (you might need a different endpoint for handling files)
            sendMessageToAI(message, questionIndex, popup);
        };

        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            showToast("Error reading file.");
        };

        // Read the file as text or data URL (consider handling different file types)
        reader.readAsDataURL(file); // Or readAsText(file) for text files
    }

    // Function to add an edit button to user messages
    function addEditButtonToMessage(messageElement, questionIndex, popup) {
        if (messageElement.getAttribute("data-role") === "user") {
            const editButton = document.createElement("button");
            editButton.className = "edit-message";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => {
                startEditingMessage(messageElement, questionIndex, popup);
            });
            messageElement.appendChild(editButton);
        }
    }

    // Function to start editing a message
    function startEditingMessage(messageElement, questionIndex, popup) {
        const originalContent =
            messageElement.querySelector(".message-content").innerHTML;
        const editInput = document.createElement("textarea");
        editInput.className = "edit-input";
        editInput.value = originalContent.replace(/<br>/g, "\n");

        messageElement.querySelector(".message-content").replaceWith(editInput);

        const saveButton = document.createElement("button");
        saveButton.className = "save-message";
        saveButton.textContent = "Save";
        messageElement.appendChild(saveButton);

        const cancelButton = document.createElement("button");
        cancelButton.className = "cancel-message";
        cancelButton.textContent = "Cancel";
        messageElement.appendChild(cancelButton);

        editInput.focus();

        saveButton.addEventListener("click", () => {
            const newContent = editInput.value;
            finishEditingMessage(
                messageElement,
                newContent,
                questionIndex,
                popup,
            );
        });

        cancelButton.addEventListener("click", () => {
            finishEditingMessage(
                messageElement,
                originalContent,
                questionIndex,
                popup,
                true,
            );
        });
    }

    // Function to finish editing a message
    function finishEditingMessage(
        messageElement,
        newContent,
        questionIndex,
        popup,
        isCancel = false,
    ) {
        const messageContent = document.createElement("div");
        messageContent.className = "message-content";
        messageContent.innerHTML = isCancel
            ? newContent
            : newContent.replace(/\n/g, "<br>");
        messageElement.querySelector(".edit-input").replaceWith(messageContent);

        messageElement
            .querySelectorAll(".save-message, .cancel-message")
            .forEach((button) => button.remove());

        if (!isCancel) {
            // Update the chat history
            const history = chatHistory.get(questionIndex);
            const messageIndex = Array.from(
                popup.querySelectorAll(".user-message"),
            ).indexOf(messageElement);

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
    let autoExtractEnabled =
        localStorage.getItem("autoExtractEnabled") === "false";

    const autoExtractCheckbox = document.getElementById("autoExtractCheckbox");
    autoExtractCheckbox.checked = autoExtractEnabled;

    autoExtractCheckbox.addEventListener("change", (e) => {
        autoExtractEnabled = e.target.checked;
        localStorage.setItem("autoExtractEnabled", autoExtractEnabled);
    });

    // Function to simulate clicking the extract button
    function simulateExtractClick() {
        const extractButton = document.getElementById("extractButton");
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
    window.addEventListener("load", handleAutoExtract);

    // Listen for navigation events (for single-page applications)
    window.addEventListener("popstate", handleAutoExtract);

    async function checkVersion() {
        try {
            const currentVersion =
                document.getElementById("currentVersion")?.textContent;

            if (!currentVersion) {
                console.log("🔥 [FIREBASE] No current version element found, skipping version check");
                return;
            }

            // Use safe Firebase call to prevent errors
            const result = await safeFirebaseCall(async (db) => {
                // Get all documents from the 'version' collection
                const versionsSnapshot = await db.collection("version").get();

                // Check if the current version exists as a document in the collection
                const versionExists = versionsSnapshot.docs.some(
                    (doc) => doc.id === currentVersion,
                );

                console.log("Current version:", currentVersion);
                console.log("Version exists in Firestore:", versionExists);

                if (!versionExists) {
                    alert(
                        `Your version (${currentVersion}) is not valid. Please update to the latest version from https://studyaidx.web.app/`,
                    );
                    destroyMenu();
                } else {
                    console.log("Version check passed:", currentVersion);
                }

                return true;
            }, null);

            if (result === null) {
                console.log("🔥 [FIREBASE] Version check skipped - Firebase not ready");
                // Don't show error or destroy menu if Firebase isn't ready
            }

        } catch (error) {
            console.log("🔥 [FIREBASE] Version check error handled:", error.message);
            // Don't show alert or destroy menu for Firebase errors
        }
    }

    function destroyMenu() {
        const menu = document.getElementById("quizHelperMenu");
        if (menu && menu.parentNode) {
            menu.parentNode.removeChild(menu);
        }
    }

    // Check version after 5 seconds
    setTimeout(checkVersion, 5000);

    // Create an improved floating button for reopening the menu
    const reopenIcon = document.createElement("div");
    reopenIcon.id = "reopenIcon";
    reopenIcon.innerHTML = `
                                    <div class="reopen-icon-inner">
                                        <img src="https://studyaidx.web.app/lovable-uploads/1111a9ca-bbb6-46dd-bfbc-fcf9737a3b56.png" alt="StudyAidX Logo" class="logo-image">
                                        <span class="tooltip">Mở StudyAidX</span>
                                    </div>
                                `;

    // Initialize reopenIcon state based on localStorage saved state
    window.addEventListener("load", function () {
        const savedState = localStorage.getItem("menuMinimized");
        if (savedState === "true") {
            const menu = document.getElementById("quizHelperMenu");
            menu.classList.add("minimized");

            // Menu is already hidden by the initial style
            // Just make the reopen icon visible
            reopenIcon.style.display = "block";
            reopenIcon.style.opacity = "1";

            const minimizeButton = document.getElementById("minimizeButton");
            if (minimizeButton) {
                minimizeButton.innerHTML = "□";
                minimizeButton.setAttribute("aria-label", "Phóng to");
                minimizeButton.setAttribute("title", "Phóng to");
            }
        } else {
            // If menu should be visible, remove the hiding style
            const initialStyle = document.getElementById("initialHideStyle");
            if (initialStyle) {
                initialStyle.remove();
            }
            // Make sure menu is visible
            const menu = document.getElementById("quizHelperMenu");
            menu.style.opacity = "1";
            menu.style.visibility = "visible";
            menu.style.display = "block";
        }
    });
    reopenIcon.style.cssText = `
                                    position: fixed;
                                    bottom: 30px;
                                    right: 30px;
                                    background: #ffffff;
                                    color: white;
                                    padding: 8px;
                                    border-radius: 12px;
                                    cursor: pointer;
                                    display: none;
                                    z-index: 10000;
                                    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                                    opacity: 0;
                                    border: 2px solid #f0f0f0;
                                `;

    // Add enhanced styles for the floating button
    const reopenStyle = document.createElement("style");
    reopenStyle.textContent = `
                                    .reopen-icon-inner {
                                        position: relative;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    }

                                    .logo-image {
                                        width: 48px;
                                        height: auto;
                                        border-radius: 8px;
                                        object-fit: contain;
                                        transition: all 0.3s ease;
                                    }

                                    .tooltip {
                                        position: absolute;
                                        background: rgba(0,0,0,0.8);
                                        color: white;
                                        padding: 8px 12px;
                                        border-radius: 8px;
                                        font-size: 14px;
                                        font-weight: 500;
                                        white-space: nowrap;
                                        right: 105%;
                                        opacity: 0;
                                        transform: translateX(10px);
                                        transition: all 0.3s ease;
                                        pointer-events: none;
                                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                                    }

                                    .tooltip:after {
                                        content: '';
                                        position: absolute;
                                        top: 50%;
                                        right: -8px;
                                        transform: translateY(-50%);
                                        border-width: 8px 0 8px 8px;
                                        border-style: solid;
                                        border-color: transparent transparent transparent rgba(0,0,0,0.8);
                                    }

                                    #reopenIcon:hover .tooltip {
                                        opacity: 1;
                                        transform: translateX(0);
                                    }

                                    #reopenIcon:hover .logo-image {
                                        transform: scale(1.05);
                                    }

                                    @keyframes floatAnimation {
                                        0% { transform: translateY(0); }
                                        50% { transform: translateY(-8px); }
                                        100% { transform: translateY(0); }
                                    }

                                    @keyframes glowPulse {
                                        0% { box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
                                        50% { box-shadow: 0 8px 24px rgba(0,123,255,0.4); }
                                        100% { box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
                                    }

                                    #reopenIcon.attention {
                                        animation: floatAnimation 2s ease-in-out infinite, glowPulse 2s alternate infinite;
                                    }
                                `;
    document.head.appendChild(reopenStyle);
    document.body.appendChild(reopenIcon);

    // Add enhanced hover and interaction effects for reopen icon
    reopenIcon.addEventListener("mouseover", () => {
        reopenIcon.style.boxShadow = "0 8px 24px rgba(0,123,255,0.4)";
        reopenIcon.style.background = "#f8f9fa";
        reopenIcon.style.transform = "translateY(-5px)";
        reopenIcon.style.borderColor = "#007bff";
    });

    reopenIcon.addEventListener("mouseout", () => {
        reopenIcon.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
        reopenIcon.style.background = "#ffffff";
        reopenIcon.style.transform = "translateY(0)";
        reopenIcon.style.borderColor = "#f0f0f0";
    });

    reopenIcon.addEventListener("mousedown", () => {
        reopenIcon.style.transform = "scale(0.95)";
    });

    reopenIcon.addEventListener("mouseup", () => {
        reopenIcon.style.transform = "scale(1)";
    });

    // Add attention animation after 10 seconds if menu is minimized
    setTimeout(() => {
        if (
            document
                .getElementById("quizHelperMenu")
                .classList.contains("minimized")
        ) {
            reopenIcon.classList.add("attention");
            setTimeout(() => {
                reopenIcon.classList.remove("attention");
            }, 5000);
        }
    }, 10000);

    function toggleMinimize() {
        const menu = document.getElementById("quizHelperMenu");
        const assistantMenu = document.getElementById("studyAidAssistantMenu");
        const reopenIcon = document.getElementById("reopenIcon");
        const minimizeButton = document.getElementById("minimizeButton");
        const assistantMinimizeButton = document.getElementById(
            "assistantMinimizeButton",
        );
        const initialHideStyle = document.getElementById("initialHideStyle");

        // Check which UI is currently active
        const activeMenu =
            currentVersion === STUDYAIDX_VERSION.DEFAULT ? menu : assistantMenu;
        const activeMinimizeButton =
            currentVersion === STUDYAIDX_VERSION.DEFAULT
                ? minimizeButton
                : assistantMinimizeButton;

        if (!activeMenu.classList.contains("minimized")) {
            // Minimize animation
            if (activeMinimizeButton) {
                activeMinimizeButton.innerHTML = "□"; // Change button icon to maximize
                activeMinimizeButton.setAttribute("aria-label", "Phóng to");
                activeMinimizeButton.setAttribute("title", "Phóng to");
            }

            // Add smooth transition
            activeMenu.style.transition =
                "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            activeMenu.classList.add("minimized");

            // Save state
            localStorage.setItem("menuMinimized", "true");

            // Show reopen icon with animation
            setTimeout(() => {
                activeMenu.style.display = "none";
                activeMenu.style.visibility = "hidden";
                reopenIcon.style.opacity = "0";
                reopenIcon.style.display = "block";
                reopenIcon.style.transform = "scale(0.8)";

                // Add the initial hide style for future page loads
                if (!initialHideStyle) {
                    const newStyle = document.createElement("style");
                    newStyle.id = "initialHideStyle";
                    newStyle.textContent = `
                                                    #quizHelperMenu, #studyAidAssistantMenu {
                                                        opacity: 0;
                                                        visibility: hidden;
                                                        display: none;
                                                    }
                                                `;
                    document.head.appendChild(newStyle);
                }

                setTimeout(() => {
                    reopenIcon.style.opacity = "1";
                    reopenIcon.style.transform = "scale(1)";
                }, 50);
            }, 350); // Wait for the transition to complete

            showToast("Menu minimized. Click the icon to reopen.");
        } else {
            // Maximize animation
            if (activeMinimizeButton) {
                activeMinimizeButton.innerHTML = "_"; // Change button icon to minimize
                activeMinimizeButton.setAttribute("aria-label", "Minimize");
                activeMinimizeButton.setAttribute("title", "Minimize");
            }

            // Hide reopen icon with animation
            reopenIcon.style.opacity = "0";
            reopenIcon.style.transform = "scale(0.8)";

            // Remove the initial hide style if it exists
            if (initialHideStyle) {
                initialHideStyle.remove();
            }

            setTimeout(() => {
                reopenIcon.style.display = "none";

                // Show the correct menu based on current version
                if (currentVersion === STUDYAIDX_VERSION.DEFAULT) {
                    menu.style.display = "block";
                    menu.style.visibility = "visible";
                    // Ensure assistant menu is hidden
                    assistantMenu.style.display = "none";
                    assistantMenu.style.visibility = "hidden";
                } else {
                    assistantMenu.style.display = "flex";
                    assistantMenu.style.visibility = "visible";
                    // Ensure default menu is hidden
                    menu.style.display = "none";
                    menu.style.visibility = "hidden";
                }

                // Trigger reflow for animation
                void activeMenu.offsetWidth;

                // Add smooth transition for open
                activeMenu.style.transition =
                    "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                activeMenu.classList.remove("minimized");

                // Save state
                localStorage.setItem("menuMinimized", "false");
            }, 200);
        }
    }

    // Event listener for the minimize button
    const minimizeButton = document.getElementById("minimizeButton");
    minimizeButton.addEventListener("click", toggleMinimize);

    // Event listener for the reopen icon
    reopenIcon.addEventListener("click", () => {
        toggleMinimize();
    });

    // Load saved minimize state
    // Create the Assistant menu
    const assistantMenu = document.createElement("div");
    assistantMenu.id = "studyAidAssistantMenu";
    assistantMenu.style.display = "none"; // Initially hidden
    assistantMenu.style.flexDirection = "column";
    assistantMenu.innerHTML = `
                                    <div id="assistantHeader">
                                        <div class="logo-container">
                                            <div class="header-title">
                                                <img src="https://studyaidx.web.app/lovable-uploads/1111a9ca-bbb6-46dd-bfbc-fcf9737a3b56.png" alt="StudyAidX Logo">
                                                <span>StudyAidX Assistant</span>
                                            </div>
                                            <div class="studyaidx-version-selector">
                                                <div class="version-option" data-version="${STUDYAIDX_VERSION.DEFAULT}">
                                                    <div class="version-icon">🛠️</div>
                                                    <div class="version-text">
                                                        <div class="version-label">StudyAidX</div>
                                                        <div class="version-description">Original toolset</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="header-buttons">
                                            <div class="control-buttons">
                                                <button class="control-button">_</button>
                                                <button id="assistantMinimizeButton" aria-label="Minimize" title="Minimize" class="control-button">×</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="assistant-content">
                                        <div class="sidebar">
                                            <div class="sidebar-button active">
                                                <div class="sidebar-icon">💬</div>
                                                <div class="sidebar-text">Chat</div>
                                            </div>
                                            <div class="sidebar-button">
                                                <div class="sidebar-icon">✏️</div>
                                                <div class="sidebar-text">Write</div>
                                            </div>
                                            <div class="sidebar-settings">
                                                <div class="sidebar-icon">⚙️</div>
                                            </div>
                                        </div>

                                        <div class="main-content">
                                            <div class="welcome-section">
                                                <div class="welcome-icon">
                                                    <img src="https://studyaidx.web.app/lovable-uploads/1111a9ca-bbb6-46dd-bfbc-fcf9737a3b56.png" alt="StudyAidX Logo">
                                                </div>
                                                <h2 class="welcome-text">StudyAidX Assistant</h2>
                                                <p class="welcome-description">Your AI study partner for school and university assignments. Ask any question or upload materials.</p>
                                            </div>

                                            <div class="option-cards">
                                                <div class="option-card" id="solve-problem">
                                                    <div class="card-icon">📝</div>
                                                    <div class="card-content">
                                                        <div class="card-title">Solve study problem</div>
                                                        <div class="card-description">Get step-by-step solutions for math, science, and other academic questions</div>
                                                    </div>
                                                </div>

                                                <div class="option-card" id="write-essay">
                                                    <div class="card-icon">📚</div>
                                                    <div class="card-content">
                                                        <div class="card-title">Write an essay</div>
                                                        <div class="card-description">Get help with essays, reports, and academic writing with proper formatting</div>
                                                    </div>
                                                </div>

                                                <div class="option-card" id="read-pdf">
                                                    <div class="card-icon">🔍</div>
                                                    <div class="card-content">
                                                        <div class="card-title">Analyze materials</div>
                                                        <div class="card-description">Upload images or documents to get interpretations and summaries</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Example conversation container that would be populated by JS -->
                                            <div class="conversation-container" style="display: none;">
                                                <!-- Messages would be added here -->
                                                <div class="ai-typing">
                                                    <span>Assistant is typing</span>
                                                    <div class="typing-dots">
                                                        <div class="typing-dot"></div>
                                                        <div class="typing-dot"></div>
                                                        <div class="typing-dot"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="message-input">
                                                <!-- File upload previews -->
                                                <div class="upload-preview" style="display: none;">
                                                    <!-- Example image preview -->
                                                    <div class="upload-item">
                                                        <img src="https://via.placeholder.com/80" alt="Uploaded image">
                                                        <div class="upload-remove">×</div>
                                                    </div>

                                                    <!-- Example audio preview -->
                                                    <div class="upload-audio">
                                                        <div class="audio-icon">🎵</div>
                                                        <div class="audio-info">
                                                            <div>recording.mp3</div>
                                                            <div class="upload-progress">
                                                                <div class="progress-bar" style="width: 70%"></div>
                                                            </div>
                                                        </div>
                                                        <div class="upload-remove">×</div>
                                                    </div>
                                                </div>

                                                <div class="input-container">
                                                    <textarea placeholder="Write your message or ask a question..." rows="1"></textarea>
                                                    <button class="send-button">
                                                        <svg viewBox="0 0 24 24" class="send-icon">
                                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div class="input-tools">
                                                    <div class="tools-left">
                                                        <button class="tool-button" id="upload-image">
                                                            <span class="tool-icon">📷</span>
                                                            <span>Image</span>
                                                        </button>
                                                        <button class="tool-button" id="upload-audio">
                                                            <span class="tool-icon">🎙️</span>
                                                            <span>Audio</span>
                                                        </button>
                                                        <input type="file" id="image-file-input" accept="image/*" style="display: none;">
                                                        <input type="file" id="audio-file-input" accept="audio/*" style="display: none;">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
    document.body.appendChild(assistantMenu);

    // Function to switch between versions
    function switchVersion(version) {
        const defaultMenu = document.getElementById("quizHelperMenu");
        const assistantMenu = document.getElementById("studyAidAssistantMenu");

        if (version === STUDYAIDX_VERSION.DEFAULT) {
            defaultMenu.style.display = "block";
            assistantMenu.style.display = "none";
        } else {
            defaultMenu.style.display = "none";
            assistantMenu.style.display = "flex";
        }

        // Save the current version preference vào cả localStorage và GM_setValue
        localStorage.setItem("studyAidXVersion", version);
        GM_setValue("studyAidXVersion", version);
        currentVersion = version;

        // Update active class in version selectors
        document.querySelectorAll(".version-option").forEach((option) => {
            if (option.dataset.version === version) {
                option.classList.add("active");
            } else {
                option.classList.remove("active");
            }
        });

        // Update reopenIcon behavior to work with current version
        const reopenIcon = document.getElementById("reopenIcon");
        if (reopenIcon && reopenIcon.style.display === "block") {
            toggleMinimize();
        }
    }

    // Immediately set up version selector click events
    // Don't wait for DOMContentLoaded since script runs after DOM is loaded
    document.querySelectorAll(".version-option").forEach((option) => {
        option.addEventListener("click", function () {
            console.log("Version option clicked:", this.dataset.version);
            switchVersion(this.dataset.version);
        });
    });

    // Add event listeners for version switching
    document.addEventListener("DOMContentLoaded", () => {
        // Initialize version based on saved preference
        switchVersion(currentVersion);

        // Setup minimize button for assistant
        const assistantMinimizeButton = document.getElementById(
            "assistantMinimizeButton",
        );
        if (assistantMinimizeButton) {
            assistantMinimizeButton.addEventListener("click", () => {
                toggleMinimize();
            });
        }

        // Make assistant menu draggable
        dragElement(document.getElementById("studyAidAssistantMenu"));

        // Initialize based on saved menu state
        const menu = document.getElementById("quizHelperMenu");
        const reopenIcon = document.getElementById("reopenIcon");
        const minimizeButton = document.getElementById("minimizeButton");
        const savedState = localStorage.getItem("menuMinimized");

        if (savedState === "true") {
            menu.classList.add("minimized");
            menu.style.display = "none";
            reopenIcon.style.display = "block";
            reopenIcon.style.opacity = "1";
            minimizeButton.innerHTML = "□";
            minimizeButton.setAttribute("aria-label", "Maximize");
            minimizeButton.setAttribute("title", "Maximize");

            // Also minimize assistant menu
            const assistantMenu = document.getElementById(
                "studyAidAssistantMenu",
            );
            assistantMenu.classList.add("minimized");
            assistantMenu.style.display = "none";
        }

        // Setup image and audio upload functionality
        setupFileUploadHandlers();
    });

    // Function to handle file uploads in the Assistant
    function setupFileUploadHandlers() {
        const uploadImageBtn = document.getElementById("upload-image");
        const uploadAudioBtn = document.getElementById("upload-audio");
        const imageFileInput = document.getElementById("image-file-input");
        const audioFileInput = document.getElementById("audio-file-input");
        const uploadPreview = document.querySelector(".upload-preview");

        if (uploadImageBtn && imageFileInput) {
            uploadImageBtn.addEventListener("click", () => {
                imageFileInput.click();
            });

            imageFileInput.addEventListener("change", (event) => {
                const files = event.target.files;
                if (files && files.length > 0) {
                    handleImageUpload(files);
                }
            });
        }

        if (uploadAudioBtn && audioFileInput) {
            uploadAudioBtn.addEventListener("click", () => {
                audioFileInput.click();
            });

            audioFileInput.addEventListener("change", (event) => {
                const files = event.target.files;
                if (files && files.length > 0) {
                    handleAudioUpload(files);
                }
            });
        }

        // Function to handle image uploads
        function handleImageUpload(files) {
            // Show the upload preview container
            if (uploadPreview) {
                uploadPreview.style.display = "flex";
            }

            Array.from(files).forEach((file) => {
                // Create preview element
                const reader = new FileReader();
                reader.onload = (e) => {
                    const uploadItem = document.createElement("div");
                    uploadItem.className = "upload-item";
                    uploadItem.innerHTML = `
                                                    <img src="${e.target.result}" alt="Uploaded image">
                                                    <div class="upload-remove">×</div>
                                                `;

                    // Add to preview
                    uploadPreview.appendChild(uploadItem);

                    // Add remove button functionality
                    const removeBtn =
                        uploadItem.querySelector(".upload-remove");
                    if (removeBtn) {
                        removeBtn.addEventListener("click", () => {
                            uploadItem.remove();
                            if (uploadPreview.children.length === 0) {
                                uploadPreview.style.display = "none";
                            }
                        });
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        // Function to handle audio uploads
        function handleAudioUpload(files) {
            // Show the upload preview container
            if (uploadPreview) {
                uploadPreview.style.display = "flex";
            }

            Array.from(files).forEach((file) => {
                // Create audio preview element
                const uploadAudio = document.createElement("div");
                uploadAudio.className = "upload-audio";
                uploadAudio.innerHTML = `
                                                <div class="audio-icon">🎵</div>
                                                <div class="audio-info">
                                                    <div>${file.name}</div>
                                                    <div class="upload-progress">
                                                        <div class="progress-bar" style="width: 100%"></div>
                                                    </div>
                                                </div>
                                                <div class="upload-remove">×</div>
                                            `;

                // Add to preview
                uploadPreview.appendChild(uploadAudio);

                // Add remove button functionality
                const removeBtn = uploadAudio.querySelector(".upload-remove");
                if (removeBtn) {
                    removeBtn.addEventListener("click", () => {
                        uploadAudio.remove();
                        if (uploadPreview.children.length === 0) {
                            uploadPreview.style.display = "none";
                        }
                    });
                }

                // Create audio element to allow playback
                const audio = document.createElement("audio");
                audio.controls = true;
                audio.style.display = "none";
                audio.src = URL.createObjectURL(file);

                // Add play/pause functionality to the audio icon
                const audioIcon = uploadAudio.querySelector(".audio-icon");
                if (audioIcon) {
                    let isPlaying = false;
                    audioIcon.style.cursor = "pointer";
                    audioIcon.addEventListener("click", () => {
                        if (isPlaying) {
                            audio.pause();
                            audioIcon.textContent = "🎵";
                            isPlaying = false;
                        } else {
                            audio.play();
                            audioIcon.textContent = "⏸️";
                            isPlaying = true;
                        }
                    });

                    // Update icon when audio ends
                    audio.addEventListener("ended", () => {
                        audioIcon.textContent = "🎵";
                        isPlaying = false;
                    });
                }

                document.body.appendChild(audio);
            });
        }
    }

    const customizeIcon = document.getElementById("customizeIcon");
    const customizeSection = document.getElementById("customizeSection");
    let isOpen = false;

    customizeIcon.addEventListener("click", () => {
        isOpen = !isOpen;
        if (isOpen) {
            customizeSection.style.top = "0";
        } else {
            customizeSection.style.top = "-100%";
        }
    });

    // Common UI improvements for smoother interaction
    const quizHelperMenu = document.getElementById("quizHelperMenu");
    const applyButton = document.getElementById("applyCustomizationsButton");
    const resetButton = document.getElementById("resetCustomizationsButton");
    const colorCheckbox = document.getElementById("colorCheckbox");
    const fontCheckbox = document.getElementById("fontCheckbox");
    const imageCheckbox = document.getElementById("imageCheckbox");
    const layoutCheckbox = document.getElementById("layoutCheckbox");
    const resizeCheckbox = document.getElementById("resizeCheckbox");

    const colorControls = document.getElementById("colorControls");
    const fontControls = document.getElementById("fontControls");
    const imageControls = document.getElementById("imageControls");
    const layoutControls = document.getElementById("layoutControls");
    const resizeSettings = document.getElementById("resizeSettings");

    const sectionWidthInput = document.getElementById("sectionWidth");
    const sectionHeightInput = document.getElementById("sectionHeight");
    const widthValueDisplay = document.getElementById("widthValue");
    const heightValueDisplay = document.getElementById("heightValue");

    // Load saved settings on page load
    document.addEventListener("DOMContentLoaded", () => {
        const savedWidth = localStorage.getItem("sectionWidth");
        const savedHeight = localStorage.getItem("sectionHeight");
        const savedColorSettings = JSON.parse(
            localStorage.getItem("colorSettings"),
        );
        const savedFontSettings = JSON.parse(
            localStorage.getItem("fontSettings"),
        );
        const savedImageSettings = JSON.parse(
            localStorage.getItem("imageSettings"),
        );
        const savedLayoutSettings = JSON.parse(
            localStorage.getItem("layoutSettings"),
        );

        if (savedWidth && savedHeight) {
            quizHelperMenu.style.width = `${savedWidth}px`;
            quizHelperMenu.style.height = `${savedHeight}px`;

            sectionWidthInput.value = savedWidth;
            sectionHeightInput.value = savedHeight;
            widthValueDisplay.textContent = `${savedWidth}px`;
            heightValueDisplay.textContent = `${savedHeight}px`;
        }

        if (savedColorSettings) {
            document.getElementById("menuBackgroundColor").value =
                savedColorSettings.backgroundColor;
            document.getElementById("menuTextColor").value =
                savedColorSettings.textColor;
            document.getElementById("menuAccentColor").value =
                savedColorSettings.accentColor;
            colorCheckbox.checked = savedColorSettings.enabled;
            applyColorSettings(savedColorSettings);
        }

        if (savedFontSettings) {
            document.getElementById("menuFontFamily").value =
                savedFontSettings.fontFamily;
            document.getElementById("menuFontSize").value =
                savedFontSettings.fontSize;
            document.getElementById("fontSizeValue").textContent =
                `${savedFontSettings.fontSize}px`;
            fontCheckbox.checked = savedFontSettings.enabled;
            applyFontSettings(savedFontSettings);
        }

        if (savedImageSettings) {
            document.getElementById("backgroundOpacity").value =
                savedImageSettings.opacity;
            document.getElementById("opacityValue").textContent =
                `${savedImageSettings.opacity * 100}%`;
            imageCheckbox.checked = savedImageSettings.enabled;
            if (savedImageSettings.backgroundImage) {
                quizHelperMenu.style.backgroundImage = `url('${savedImageSettings.backgroundImage}')`;
                quizHelperMenu.style.backgroundSize = "cover";
                quizHelperMenu.style.backgroundRepeat = "no-repeat";
            }
            applyImageSettings(savedImageSettings);
        }

        if (savedLayoutSettings) {
            document.getElementById("menuLayout").value =
                savedLayoutSettings.layout;
            document.getElementById("menuBorderRadius").value =
                savedLayoutSettings.borderRadius;
            document.getElementById("borderRadiusValue").textContent =
                `${savedLayoutSettings.borderRadius}px`;
            layoutCheckbox.checked = savedLayoutSettings.enabled;
            applyLayoutSettings(savedLayoutSettings);
        }

        updateControlsState();
    });

    // Apply customizations
    applyButton.addEventListener("click", () => {
        const colorSettings = {
            enabled: colorCheckbox.checked,
            backgroundColor: document.getElementById("menuBackgroundColor")
                .value,
            textColor: document.getElementById("menuTextColor").value,
            accentColor: document.getElementById("menuAccentColor").value,
        };

        const fontSettings = {
            enabled: fontCheckbox.checked,
            fontFamily: document.getElementById("menuFontFamily").value,
            fontSize: document.getElementById("menuFontSize").value,
        };

        const imageSettings = {
            enabled: imageCheckbox.checked,
            opacity: document.getElementById("backgroundOpacity").value,
            backgroundImage: quizHelperMenu.style.backgroundImage
                .slice(4, -1)
                .replace(/"/g, ""), // Get the current background image URL
        };

        const layoutSettings = {
            enabled: layoutCheckbox.checked,
            layout: document.getElementById("menuLayout").value,
            borderRadius: document.getElementById("menuBorderRadius").value,
        };

        const width = resizeCheckbox.checked ? sectionWidthInput.value : null;
        const height = resizeCheckbox.checked ? sectionHeightInput.value : null;

        applySettings(
            colorSettings,
            fontSettings,
            imageSettings,
            layoutSettings,
            width,
            height,
        );

        localStorage.setItem("colorSettings", JSON.stringify(colorSettings));
        localStorage.setItem("fontSettings", JSON.stringify(fontSettings));
        localStorage.setItem("imageSettings", JSON.stringify(imageSettings));
        localStorage.setItem("layoutSettings", JSON.stringify(layoutSettings));
        localStorage.setItem("sectionWidth", width);
        localStorage.setItem("sectionHeight", height);
    });

    // Reset customizations
    resetButton.addEventListener("click", () => {
        localStorage.removeItem("colorSettings");
        localStorage.removeItem("fontSettings");
        localStorage.removeItem("imageSettings");
        localStorage.removeItem("layoutSettings");
        localStorage.removeItem("sectionWidth");
        localStorage.removeItem("sectionHeight");

        document.getElementById("menuBackgroundColor").value = "#ffffff";
        document.getElementById("menuTextColor").value = "#000000";
        document.getElementById("menuAccentColor").value = "#0000ff";
        document.getElementById("menuFontFamily").value = "Arial, sans-serif";
        document.getElementById("menuFontSize").value = "16";
        document.getElementById("fontSizeValue").textContent = "16px";
        document.getElementById("menuImageBackground").value = "";
        document.getElementById("backgroundOpacity").value = "1";
        document.getElementById("opacityValue").textContent = "100%";
        document.getElementById("menuLayout").value = "default";
        document.getElementById("menuBorderRadius").value = "0";
        document.getElementById("borderRadiusValue").textContent = "0px";

        sectionWidthInput.value = "600";
        sectionHeightInput.value = "400";
        widthValueDisplay.textContent = "600px";
        heightValueDisplay.textContent = "400px";

        quizHelperMenu.style.width = "600px";
        quizHelperMenu.style.height = "400px";

        colorCheckbox.checked = true;
        fontCheckbox.checked = true;
        imageCheckbox.checked = true;
        layoutCheckbox.checked = true;
        resizeCheckbox.checked = true;

        updateControlsState();

        // Reset background image
        quizHelperMenu.style.backgroundImage = "none";

        applySettings(
            {
                enabled: true,
                backgroundColor: "#ffffff",
                textColor: "#000000",
                accentColor: "#0000ff",
            },
            { enabled: true, fontFamily: "Arial, sans-serif", fontSize: "16" },
            { enabled: true, opacity: "1", backgroundImage: "" },
            { enabled: true, layout: "default", borderRadius: "0" },
            "600",
            "400",
        );
    });

    function updateControlsState() {
        const groups = [
            { checkbox: colorCheckbox, controls: colorControls },
            { checkbox: fontCheckbox, controls: fontControls },
            { checkbox: imageCheckbox, controls: imageControls },
            { checkbox: layoutCheckbox, controls: layoutControls },
            { checkbox: resizeCheckbox, controls: resizeSettings },
        ];

        groups.forEach((group) => {
            const isEnabled = group.checkbox.checked;
            group.controls.classList.toggle("disabled", !isEnabled);
            group.controls
                .querySelectorAll("input, select")
                .forEach((input) => {
                    input.disabled = !isEnabled;
                });
        });
    }

    // Add event listeners for checkboxes
    [
        colorCheckbox,
        fontCheckbox,
        imageCheckbox,
        layoutCheckbox,
        resizeCheckbox,
    ].forEach((checkbox) => {
        checkbox.addEventListener("change", updateControlsState);
    });

    // Call updateControlsState when the page is loaded
    document.addEventListener("DOMContentLoaded", updateControlsState);

    // Update value display for width and height sliders
    sectionWidthInput.addEventListener("input", () => {
        widthValueDisplay.textContent = `${sectionWidthInput.value}px`;
    });

    sectionHeightInput.addEventListener("input", () => {
        heightValueDisplay.textContent = `${sectionHeightInput.value}px`;
    });

    // Function to apply settings
    function applySettings(
        colorSettings,
        fontSettings,
        imageSettings,
        layoutSettings,
        width,
        height,
    ) {
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
        document.querySelectorAll(".accent-color").forEach((el) => {
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
            quizHelperMenu.style.backgroundSize = "cover";
            quizHelperMenu.style.backgroundRepeat = "no-repeat";
        } else {
            quizHelperMenu.style.backgroundImage = "none";
        }
        quizHelperMenu.style.opacity = imageSettings.opacity;
    }

    function applyLayoutSettings(layoutSettings) {
        switch (layoutSettings.layout) {
            case "compact":
                quizHelperMenu.style.padding = "10px";
                break;
            case "spacious":
                quizHelperMenu.style.padding = "30px";
                break;
            default:
                quizHelperMenu.style.padding = "20px";
        }
        quizHelperMenu.style.borderRadius = `${layoutSettings.borderRadius}px`;
    }

    // Add event listener for image upload
    document
        .getElementById("menuImageBackground")
        .addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const imageDataUrl = e.target.result;
                    quizHelperMenu.style.backgroundImage = `url('${imageDataUrl}')`;
                    quizHelperMenu.style.backgroundSize = "cover";
                    quizHelperMenu.style.backgroundRepeat = "no-repeat";
                };
                reader.readAsDataURL(file);
            }
        });

    // Add event listener for the new button
    document
        .getElementById("openLinkPopupButton")
        .addEventListener("click", createLinkPopup);

    // Function to create and show the link popup
    function createLinkPopup() {
        // Create style element
        let style = document.createElement("style");
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

                                        @media (max-width: 600px) {
                                            .popup {
                                                padding: 16px;
                                                width: 95%;
                                            }

                                            .popup-title {
                                                font-size: 20px;
                                                margin-bottom: 12px;
                                            }

                                            .section-title {
                                                font-size: 16px;
                                                margin-bottom: 8px;
                                            }

                                            .button {
                                                padding: 6px 12px;
                                                font-size: 13px;
                                            }
                                        }

                                        @media (max-width: 360px) {
                                            .popup {
                                                padding: 12px;
                                                width: 98%;
                                            }

                                            .popup-title {
                                                font-size: 18px;
                                                margin-bottom: 10px;
                                            }

                                            .button-container {
                                                flex-direction: column;
                                                align-items: stretch;
                                            }

                                            .button {
                                                margin: 4px 0;
                                            }
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
        let popup = document.createElement("div");
        popup.className = "popup";

        // Pop-up title
        let title = document.createElement("h3");
        title.className = "popup-title";
        title.textContent = "Chọn liên kết để mở";
        popup.appendChild(title);

        // Create container for sections
        let sectionsContainer = document.createElement("div");
        popup.appendChild(sectionsContainer);

        // Create sections
        let sections = {
            Quiz: [
                "trước tiết",
                "pre-class",
                "before class",
                "sau tiết học",
                "post-class",
                "after class",
                "tự học",
                "self-study",
                "independent learning",
                "tiết",
                "lesson",
                "period",
                "củng cố",
                "reinforce",
                "consolidate",
                "bài tập",
                "exercise",
                "homework",
                "assignment",
                "đánh giá",
                "assessment",
                "evaluation",
                "quiz",
                "nộp bài",
                "submit",
                "turn in",
                "kiểm tra",
                "test",
                "exam",
                "y�n tập",
                "review",
                "revision",
                "luyện tập",
                "practice",
                "drill",
                "trắc nghiệm",
                "multiple choice",
                "MCQ",
                "tự luận",
                "essay",
                "open-ended",
                "câu hỏi",
                "question",
                "query",
                "bài kiểm tra",
                "test paper",
                "bài thi",
                "examination paper",
                "điểm số",
                "score",
                "grade",
                "kết quả",
                "result",
                "outcome",
                "học trực tuyến",
                "online learning",
                "e-learning",
                "video bài giảng",
                "lecture video",
                "tài liệu",
                "document",
                "material",
                "slide",
                "presentation",
                "handout",
                "tài liệu phát tay",
            ],
            "Thảo luận": [
                "thảo luận",
                "discussion",
                "debate",
                "forum",
                "diễn đàn",
                "chat",
                "trò chuyện",
                "hỏi đáp",
                "Q&A",
                "question and answer",
                "góp ý",
                "feedback",
                "comment",
                "chia sẻ",
                "share",
                "sharing",
                "trao đổi",
                "exchange",
                "interact",
                "bình luận",
                "comment",
                "remark",
                "phản hồi",
                "respond",
                "reply",
                "ý kiến",
                "opinion",
                "view",
                "tranh luận",
                "argue",
                "debate",
                "nhóm học tập",
                "study group",
                "họp nhóm",
                "group meeting",
                "seminar",
                "hội thảo",
                "workshop",
                "buổi thảo luận",
                "brainstorm",
                "động não",
                "phân tích",
                "analyze",
                "discuss",
                "đề xuất",
                "propose",
                "suggestion",
                "giải pháp",
                "solution",
                "resolve",
                "vấn đề",
                "issue",
                "problem",
            ],
        };

        // Get links with class 'for-nvda'
        let links = document.querySelectorAll("a.for-nvda");
        let filteredLinks = [];

        let excludeKeyword = "hướng dẫn";

        // Create sections and add checkbox for each matching link
        Object.entries(sections).forEach(([sectionName, keywords]) => {
            let sectionDiv = document.createElement("div");
            sectionDiv.className = "section";

            let sectionTitle = document.createElement("h4");
            sectionTitle.className = "section-title";
            sectionTitle.textContent = sectionName;
            sectionDiv.appendChild(sectionTitle);

            let linkContainer = document.createElement("div");
            linkContainer.className = "link-container";
            sectionDiv.appendChild(linkContainer);

            links.forEach((link) => {
                let textContent = link.textContent.toLowerCase();
                let ariaLabel = link.getAttribute("aria-label")
                    ? link.getAttribute("aria-label").toLowerCase()
                    : "";

                if (
                    keywords.some(
                        (keyword) =>
                            textContent.includes(keyword) ||
                            ariaLabel.includes(keyword),
                    ) &&
                    !textContent.includes(excludeKeyword) &&
                    !ariaLabel.includes(excludeKeyword)
                ) {
                    filteredLinks.push(link);

                    let label = document.createElement("label");
                    label.className = "link-label";
                    let checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.className = "link-checkbox";

                    label.appendChild(checkbox);
                    label.appendChild(
                        document.createTextNode(link.textContent),
                    );

                    linkContainer.appendChild(label);
                }
            });

            if (linkContainer.children.length > 0) {
                sectionsContainer.appendChild(sectionDiv);
            }
        });

        // Container for buttons
        let buttonContainer = document.createElement("div");
        buttonContainer.className = "button-container";
        popup.appendChild(buttonContainer);

        // "Open All" button
        let openAllBtn = document.createElement("button");
        openAllBtn.textContent = "Mở tất cả";
        openAllBtn.className = "button button-primary";
        buttonContainer.appendChild(openAllBtn);

        // "Open Selected" button
        let openSelectedBtn = document.createElement("button");
        openSelectedBtn.textContent = "Mở link đã chọn";
        openSelectedBtn.className = "button button-primary";
        buttonContainer.appendChild(openSelectedBtn);

        // "Close" button
        let closeBtn = document.createElement("button");
        closeBtn.textContent = "Đóng";
        closeBtn.className = "button button-secondary";
        buttonContainer.appendChild(closeBtn);

        // Add pop-up to body
        document.body.appendChild(popup);

        // Handle "Open All" button click
        openAllBtn.addEventListener("click", () => {
            filteredLinks.forEach((link) => {
                window.open(link.href, "_blank");
            });
        });

        // Handle "Open Selected" button click
        openSelectedBtn.addEventListener("click", () => {
            let checkboxes = sectionsContainer.querySelectorAll(
                'input[type="checkbox"]',
            );
            checkboxes.forEach((checkbox, index) => {
                if (checkbox.checked) {
                    window.open(filteredLinks[index].href, "_blank");
                }
            });
        });

        // Handle "Close" button click
        closeBtn.addEventListener("click", () => {
            popup.style.display = "none";
        });
    }

    // Create calculator popup
    const calculatorPopup = document.createElement("div");
    calculatorPopup.id = "calculatorPopup";
    calculatorPopup.style.display = "none";
    calculatorPopup.style.position = "fixed";
    calculatorPopup.style.top = "50%";
    calculatorPopup.style.left = "50%";
    calculatorPopup.style.transform = "translate(-50%, -50%)";
    calculatorPopup.style.zIndex = "9999";
    calculatorPopup.style.backgroundColor = "#ffffff";
    calculatorPopup.style.borderRadius = "20px";
    calculatorPopup.style.overflow = "hidden";
    calculatorPopup.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
    calculatorPopup.style.transition = "all 0.3s ease";

    calculatorPopup.innerHTML = `
                                    <div id="calculatorHeader" style="padding: 20px; cursor: move; background-color: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 18px; font-weight: 600; color: #333;">Calculator</span>
                                        <button id="closeCalculatorButton" style="background: none; border: none; font-size: 24px; color: #666; cursor: pointer; transition: color 0.3s ease;">×</button>
                                    </div>
                                    <iframe src="https://bietmaytinh.com/casio-online/" width="800" height="600" style="border: none;"></iframe>
                                `;

    document.body.appendChild(calculatorPopup);

    // Add hover effect to close button
    const closeButton = calculatorPopup.querySelector("#closeCalculatorButton");
    closeButton.addEventListener(
        "mouseover",
        () => (closeButton.style.color = "#ff4d4d"),
    );
    closeButton.addEventListener(
        "mouseout",
        () => (closeButton.style.color = "#666"),
    );

    // Add subtle animation when showing/hiding
    function toggleCalculator() {
        if (calculatorPopup.style.display === "none") {
            calculatorPopup.style.display = "block";
            calculatorPopup.style.opacity = "0";
            calculatorPopup.style.transform =
                "translate(-50%, -48%) scale(0.98)";
            setTimeout(() => {
                calculatorPopup.style.opacity = "1";
                calculatorPopup.style.transform =
                    "translate(-50%, -50%) scale(1)";
            }, 50);
        } else {
            calculatorPopup.style.opacity = "0";
            calculatorPopup.style.transform =
                "translate(-50%, -48%) scale(0.98)";
            setTimeout(() => {
                calculatorPopup.style.display = "none";
            }, 300);
        }
    }

    // Add event listener for calculator button
    document
        .getElementById("calculatorButton")
        .addEventListener("click", toggleCalculator);

    // Add event listener for close calculator button
    document
        .getElementById("closeCalculatorButton")
        .addEventListener("click", toggleCalculator);

    // Calculator functions
    function toggleCalculator() {
        const calculatorPopup = document.getElementById("calculatorPopup");
        calculatorPopup.style.display =
            calculatorPopup.style.display === "none" ? "block" : "none";
    }

    // Make the calculator popup draggable
    dragElement(document.getElementById("calculatorPopup"));

    function dragElement(elmnt) {
        var pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
        if (document.getElementById(elmnt.id + "Header")) {
            document.getElementById(elmnt.id + "Header").onmousedown =
                dragMouseDown;
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
            elmnt.style.top = elmnt.offsetTop - pos2 + "px";
            elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Function to update scores and totals
    function updateScoresAndTotals() {
        // Select all rows in the table body (excluding the header and footer)
        let rows = document.querySelectorAll("table tbody tr");
        // Loop through each row and update the scores
        rows.forEach((row) => {
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
            document.querySelector("tfoot tr:nth-child(1) td:nth-child(2)"), // Semester 1
            document.querySelector("tfoot tr:nth-child(2) td:nth-child(2)"), // Semester 2
            document.querySelector("tfoot tr:nth-child(3) td:nth-child(2)"), // Overall
        ];
        percentageCells.forEach((cell) => {
            if (cell) cell.innerText = "100.00%";
        });
    }

    // Function to update the "Tổng cộng" row
    function updateTotalRow() {
        let tongCongRow = document.querySelector(
            "tfoot tr:last-child td:last-child",
        );
        if (tongCongRow) {
            tongCongRow.innerText = "100.00%";
        }
    }

    // Function to save toggle state
    function saveToggleState(toggleId, isChecked) {
        localStorage.setItem(`${toggleId}State`, isChecked);
    }

    // Function to load toggle state
    function loadToggleState(toggleId) {
        return localStorage.getItem(`${toggleId}State`) === "true";
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
        toggle.addEventListener("change", function () {
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
            {
                id: "scoreUpdateToggle",
                enableFn: enableScoreUpdate,
                disableFn: disableScoreUpdate,
            },
            // Add more toggles here as needed
        ];

        toggles.forEach((toggle) => {
            const element = document.getElementById(toggle.id);
            if (element) {
                const savedState = loadToggleState(toggle.id);
                element.checked = savedState;
                if (savedState) {
                    toggle.enableFn();
                }
                handleToggleChange(
                    toggle.id,
                    toggle.enableFn,
                    toggle.disableFn,
                );
            }
        });
    }

    // Initialize everything when the DOM is fully loaded
    document.addEventListener("DOMContentLoaded", () => {
        initializeToggles();
        // Initialize Question Reply System after Firebase initialization
        const questionReplySystem = new QuestionReplySystem();
        window.questionReplySystem = questionReplySystem; // Make it globally accessible
    });
    // Add event listener for the Copy/Paste toggle
    const copyPasteToggle = document.getElementById("copyPasteToggle");

    // Function to allow copy and paste
    const allowCopyAndPaste = function (e) {
        e.stopImmediatePropagation();
        return true;
    };

    // Function to enable copy and paste
    function enableCopyPaste() {
        document.addEventListener("copy", allowCopyAndPaste, true);
        document.addEventListener("paste", allowCopyAndPaste, true);
        document.addEventListener("onpaste", allowCopyAndPaste, true);
    }

    // Function to disable copy and paste
    function disableCopyPaste() {
        document.removeEventListener("copy", allowCopyAndPaste, true);
        document.removeEventListener("paste", allowCopyAndPaste, true);
        document.removeEventListener("onpaste", allowCopyAndPaste, true);
    }

    // Load saved state from local storage
    const savedState = localStorage.getItem("copyPasteEnabled");
    if (savedState === "true") {
        copyPasteToggle.checked = true;
        enableCopyPaste();
    } else {
        copyPasteToggle.checked = false;
        disableCopyPaste();
    }

    copyPasteToggle.addEventListener("change", function () {
        if (this.checked) {
            enableCopyPaste();
            localStorage.setItem("copyPasteEnabled", "true");
            alert("Copy and Paste functionality has been enabled!");
        } else {
            disableCopyPaste();
            localStorage.setItem("copyPasteEnabled", "false");
            alert("Copy and Paste functionality has been disabled!");
        }
    });
    // Key system variables
    let activeKey = null;
    let keyExpirationTime = null;
    let validPremiumKeys = {
        permanent: [],
        monthly: [],
        biweekly: [],
        weekly: [],
    };
    let keyUsageInfo = {};
    let lastKnownKeysHash = "";
    // Thêm biến để lưu trữ key đã sử dụng
    let previousKeys = {};

    // Hàm để lưu thông tin key đã sử dụng
    function savePreviousKey(keyId, keyData, userEmail) {
        try {
            previousKeys[userEmail] = {
                keyId: keyId,
                type: keyData.type,
                expirationTime: keyData.expirationDate
                    ? keyData.expirationDate.toDate().getTime()
                    : null,
            };
            localStorage.setItem("previousKeys", JSON.stringify(previousKeys));
            console.log("Saved previous key:", previousKeys[userEmail]);
        } catch (error) {
            console.error("Error saving previous key:", error);
        }
    }

    // Hàm để load thông tin key đã sử dụng
    function loadPreviousKeys() {
        try {
            const saved = localStorage.getItem("previousKeys");
            if (saved) {
                previousKeys = JSON.parse(saved);
                console.log("Loaded previous keys:", previousKeys);
            }
        } catch (error) {
            console.error("Error loading previous keys:", error);
            previousKeys = {};
        }
    }

    // Hàm để hiển thị key đã sử dụng
    function showPreviousKeys() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const previousKey = previousKeys[user.email];
        if (!previousKey) return;

        const keySection = document.getElementById("keySection");

        // Xóa phần hiển thị key cũ nếu có
        const existingPreviousKeys = keySection.querySelector(
            ".previous-keys-section",
        );
        if (existingPreviousKeys) {
            existingPreviousKeys.remove();
        }

        const previousKeysDiv = document.createElement("div");
        previousKeysDiv.className = "previous-keys-section";

        // Tính thời gian còn lại
        const timeRemaining = previousKey.expirationTime
            ? previousKey.expirationTime - Date.now()
            : null;
        const daysRemaining = timeRemaining
            ? Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
            : null;

        previousKeysDiv.innerHTML = `
                                    <div class="section-title">Key Đã Kích Hoạt Trước Đó</div>
                                    <div class="previous-key-info">
                                    <p>Key ID: ${previousKey.keyId}</p>
                                    <p>Loại: ${previousKey.type.toUpperCase()}</p>
                                    ${daysRemaining !== null ? `<p>Còn lại: ${daysRemaining} ngày</p>` : ""}
                                    <button id="reactivateKeyBtn" class="reactivate-btn">Kích Hoạt Lại</button>
                                    </div>
                                `;

        keySection.insertBefore(previousKeysDiv, keySection.firstChild);

        // Thêm style cho phần key đã sử dụng nếu chưa có
        if (!document.getElementById("previousKeyStyles")) {
            const style = document.createElement("style");
            style.id = "previousKeyStyles";
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
        document
            .getElementById("reactivateKeyBtn")
            .addEventListener("click", async () => {
                try {
                    document.getElementById("premiumKeyInput").value =
                        previousKey.keyId;
                    await activatePremiumKey();
                } catch (error) {
                    console.error("Error reactivating key:", error);
                    alert("Có lỗi xảy ra khi kích hoạt lại key.");
                }
            });
    }

    // Hàm để tải premium keys từ GitHub và kiểm tra sự thay đổi
    async function loadPremiumKeys() {
        try {
            const db = firebase.firestore();
            const keysSnapshot = await db.collection("premium_keys").get();

            const updatedValidPremiumKeys = {
                permanent: [],
                monthly: [],
                biweekly: [],
                weekly: [],
            };

            keysSnapshot.forEach((doc) => {
                const keyData = doc.data();
                const keyId = doc.id; // Key ID là tên của document

                // Kiểm tra xem key có còn hiệu lực không
                if (
                    keyData.expirationDate &&
                    keyData.expirationDate.toDate() < new Date()
                ) {
                    return; // Bỏ qua key đã hết hạn
                }

                // Phân loại key dựa vào type
                switch (keyData.type) {
                    case "permanent":
                        updatedValidPremiumKeys.permanent.push(keyId);
                        break;
                    case "monthly":
                        updatedValidPremiumKeys.monthly.push(keyId);
                        break;
                    case "biweekly":
                        updatedValidPremiumKeys.biweekly.push(keyId);
                        break;
                    case "weekly":
                        updatedValidPremiumKeys.weekly.push(keyId);
                        break;
                }
            });

            validPremiumKeys = updatedValidPremiumKeys;
            console.log("Premium keys loaded successfully from Firebase");
        } catch (error) {
            console.error("Error loading premium keys from Firebase:", error);
        }
    }

    // Hàm để lưu thông tin sử dụng key vào localStorage
    function saveKeyUsageInfo() {
        localStorage.setItem("keyUsageInfo", JSON.stringify(keyUsageInfo));
    }

    // Hàm để tải thông tin sử dụng key từ localStorage
    function loadKeyUsageInfo() {
        const storedInfo = localStorage.getItem("keyUsageInfo");
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
            alert(
                "Hệ thống key hiện đang bị vô hiệu hóa. Vui lòng thử lại sau.",
            );
            return;
        }

        const inputKey = document.getElementById("freeKeyInput").value;
        const db = firebase.firestore();
        const user = firebase.auth().currentUser;

        if (!user) {
            alert("Vui lòng đăng nhập để sử dụng key!");
            return;
        }

        try {
            const keyRef = db.collection("free_keys").doc(inputKey);

            // Bắt lấy giá trị trả về từ transaction
            const transactionResult = await db.runTransaction(
                async (transaction) => {
                    const keyDoc = await transaction.get(keyRef);

                    if (!keyDoc.exists) {
                        throw new Error("Invalid key");
                    }

                    const keyData = keyDoc.data();

                    // Kiểm tra xem key có phải là global key không
                    if (keyData.isGlobal !== true) {
                        // Nếu không phải global key, kiểm tra xem key này có được tạo cho user này không
                        if (keyData.createdFor !== user.email) {
                            throw new Error("Wrong user");
                        }

                        // Chỉ kiểm tra sử dụng với key không phải global
                        // SỬA ĐỔI: Sử dụng keyData.usedBy thay vì keyData.user
                        if (
                            keyData.isUsed &&
                            keyData.usedBy && // Kiểm tra xem usedBy có tồn tại không
                            keyData.usedBy !== user.email
                        ) {
                            throw new Error("Key already used by another user");
                        }
                    }

                    // Thiết lập thời gian sử dụng từ thời điểm tạo key
                    const expirationTime = keyData.expirationDate
                        .toDate()
                        .getTime();

                    // Kiểm tra xem key có còn hạn sử dụng không
                    if (Date.now() > expirationTime) {
                        throw new Error("Expired key");
                    }

                    let needsTimestampFetch = false;
                    // Nếu key chưa được sử dụng hoặc được sử dụng bởi chính user này (chỉ áp dụng cho non-global)
                    if (
                        !keyData.isUsed ||
                        (keyData.isGlobal !== true &&
                            keyData.user === user.email)
                    ) {
                        const updateData = {
                            isUsed: true,
                            usedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            usedBy: user.email, // Use 'usedBy' consistently
                        };
                        // Cập nhật trạng thái sử dụng cho free_keys
                        transaction.update(keyRef, updateData);
                        needsTimestampFetch = true; // Mark that we need to fetch the server timestamp
                    }

                    // Return necessary info for post-transaction handling
                    return { keyId: inputKey, needsTimestampFetch };
                },
            );

            // --- Post-Transaction for Free Key ---
            if (!transactionResult || !transactionResult.keyId) {
                throw new Error(
                    "Transaction failed to return necessary key data.",
                );
            }

            const { keyId, needsTimestampFetch } = transactionResult;
            const freeKeyRef = db.collection("free_keys").doc(keyId); // Use correct ref
            let usedAtTimestamp = null;

            try {
                const updatedKeyDoc = await freeKeyRef.get(); // Fetch from correct ref
                if (!updatedKeyDoc.exists) {
                    throw new Error(
                        `Free key document ${keyId} not found after transaction.`,
                    );
                }
                const updatedKeyData = updatedKeyDoc.data();
                if (updatedKeyData.usedAt && updatedKeyData.usedAt.toDate) {
                    usedAtTimestamp = updatedKeyData.usedAt.toDate().getTime();
                    console.log(
                        `Fetched actual free key usedAt timestamp: ${new Date(usedAtTimestamp)}`,
                    );
                } else {
                    // Fallback to current time if fetch fails or timestamp missing (should be rare)
                    console.warn(
                        `Could not fetch usedAt timestamp for free key ${keyId}, using current time as fallback.`,
                    );
                    usedAtTimestamp = Date.now();
                }
            } catch (fetchError) {
                console.error(
                    "Failed to fetch usedAt timestamp after free key transaction:",
                    fetchError,
                );
                usedAtTimestamp = Date.now(); // Use current time as fallback on error
                alert(
                    "Lỗi khi lấy thời gian kích hoạt key miễn phí. Sử dụng thời gian hiện tại.",
                );
            }

            // Sử dụng giá trị usedAtTimestamp
            activeKey = "FREE";
            const freeKeyDurationMs = 30 * 60 * 1000; // 30 minutes in milliseconds
            keyExpirationTime = usedAtTimestamp + freeKeyDurationMs; // Calculate expiration for the timer

            localStorage.setItem("activeKey", activeKey);
            localStorage.setItem("activatedKeyId", keyId); // Store the key ID
            localStorage.setItem("keyType", "FREE"); // Store the key type
            // Store details for potential checkKeyValidity use (though it currently uses Firestore)
            localStorage.setItem(
                `freeKeyUsedAt_${keyId}`,
                usedAtTimestamp.toString(),
            );
            localStorage.setItem(
                `freeKeyDuration_${keyId}`,
                freeKeyDurationMs.toString(),
            );
            // Remove the old direct expiration time storage if it exists
            localStorage.removeItem("keyExpirationTime");

            showFunctions();
            startKeyTimer(); // Start timer with the calculated expiration
            alert(
                "Free Key đã được kích hoạt. Bạn có 30 phút để sử dụng. Một số chức năng có sẵn cho Free Key.",
            );
        } catch (error) {
            console.error("Error activating free key:", error);
            switch (error.message) {
                case "Invalid key":
                    alert("Free Key không hợp lệ.");
                    break;
                case "Expired key":
                    alert("Free Key đã hết hạn.");
                    break;
                case "Wrong user":
                    alert("Free Key này không được tạo cho tài khoản của bạn.");
                    break;
                case "Key already used by another user":
                    alert("Free Key này đã được sử dụng bởi người dùng khác.");
                    break;
                default:
                    alert(
                        "Có lỗi xảy ra khi kích hoạt key. Vui lòng thử lại sau.",
                    );
            }
        }
    }

    async function activatePremiumKey() {
        if (isKeySystemDisabled()) {
            alert(
                "Hệ thống key hiện đang bị vô hiệu hóa. Vui lòng thử lại sau.",
            );
            return;
        }

        const inputKey = document.getElementById("premiumKeyInput")?.value;
        if (!inputKey) {
            alert("Please enter a premium key");
            return;
        }
        const db = firebase.firestore();
        const user = firebase.auth().currentUser;

        if (!user) {
            alert("Bạn cần đăng nhập để kích hoạt key.");
            showLoginPopup(); // Or redirect to login
            return;
        }

        try {
            const premiumKeyRef = db.collection("premium_keys").doc(inputKey);

            await db
                .runTransaction(async (transaction) => {
                    const keyDoc = await transaction.get(premiumKeyRef);

                    if (!keyDoc.exists) {
                        throw new Error("Invalid key");
                    }

                    const keyData = keyDoc.data();
                    let activationTimestamp = null;
                    let needsTimestampFetch = false;

                    // Check activation status
                    if (keyData.isActivated === false) {
                        // Key is not activated, activate it now
                        activationTimestamp =
                            firebase.firestore.FieldValue.serverTimestamp();
                        needsTimestampFetch = true; // We need to fetch the actual timestamp later

                        // --- MODIFICATION START ---
                        const updateData = {
                            isActivated: true,
                            activatedAt: activationTimestamp,
                        };

                        // Only add activatedBy if the key is NOT global
                        if (keyData.isGlobal !== true) {
                            updateData.activatedBy = user.email; // Store who activated it
                            console.log(
                                `Key ${inputKey} activated by ${user.email} (non-global)`,
                            );
                        } else {
                            console.log(
                                `Key ${inputKey} activated (global, activatedBy skipped)`,
                            );
                        }
                        // --- MODIFICATION END ---

                        transaction.update(premiumKeyRef, updateData);
                    } else if (
                        keyData.activatedBy &&
                        keyData.activatedBy !== user.email
                    ) {
                        // Key was activated by someone else
                        throw new Error(
                            "Key already activated by another user",
                        );
                    } else {
                        // Key was already activated by this user, retrieve existing activation time
                        if (keyData.activatedAt && keyData.activatedAt.toDate) {
                            activationTimestamp = keyData.activatedAt
                                .toDate()
                                .getTime();
                        } else {
                            // Fallback or error if activatedAt is missing/invalid after activation
                            console.warn(
                                `Key ${inputKey} is activated but activatedAt timestamp is missing or invalid.`,
                            );
                            // Attempt to re-set it if missing
                            if (!keyData.activatedAt) {
                                activationTimestamp =
                                    firebase.firestore.FieldValue.serverTimestamp();
                                needsTimestampFetch = true;
                                transaction.update(premiumKeyRef, {
                                    activatedAt: activationTimestamp,
                                });
                                console.log(
                                    `Re-setting missing activatedAt for key ${inputKey}`,
                                );
                            } else {
                                // If it exists but isn't a timestamp, it's an error state
                                throw new Error(
                                    "Invalid activation timestamp format",
                                );
                            }
                        }
                    }

                    // Check if key is user-specific or global
                    const isGlobalKey = keyData.isGlobal === true;
                    if (!isGlobalKey) {
                        if (keyData.user && keyData.user !== user.email) {
                            throw new Error("Key assigned to another user");
                        } else if (!keyData.user) {
                            // Assign the key to the current user if it's not assigned
                            transaction.update(keyRef, { user: user.email });
                            console.log(
                                `Key ${inputKey} assigned to user ${user.email}`,
                            );
                        }
                    }

                    // Determine key type
                    let keyType = keyData.type
                        ? `PREMIUM_${keyData.type.toUpperCase()}`
                        : "PREMIUM_UNKNOWN";
                    if (keyData.type === "permanent") {
                        keyType = "PREMIUM_PERMANENT";
                    }

                    // Get duration
                    const durationDays = keyData.duration; // Duration in days

                    if (
                        keyType !== "PREMIUM_PERMANENT" &&
                        (typeof durationDays !== "number" || durationDays <= 0)
                    ) {
                        console.error(
                            `Key ${inputKey} has invalid or missing duration:`,
                            durationDays,
                        );
                        throw new Error(
                            "Key data is incomplete (invalid duration)",
                        );
                    }

                    // Save key info to localStorage (deferring activatedAt if server timestamp)
                    activeKey = keyType;
                    localStorage.setItem("activeKey", activeKey);
                    localStorage.setItem("activatedKeyId", inputKey); // Store the key ID itself
                    localStorage.setItem("keyType", "PREMIUM"); // Store the key type

                    if (keyType !== "PREMIUM_PERMANENT") {
                        localStorage.setItem(
                            "keyDuration",
                            durationDays.toString(),
                        );
                        if (typeof activationTimestamp === "number") {
                            // Store existing timestamp immediately
                            localStorage.setItem(
                                "keyActivatedAt",
                                activationTimestamp.toString(),
                            );
                        } else {
                            // Remove potentially stale value, will be set after transaction
                            localStorage.removeItem("keyActivatedAt");
                        }
                    } else {
                        // Clear duration/activation for permanent keys
                        localStorage.removeItem("keyDuration");
                        localStorage.removeItem("keyActivatedAt");
                    }

                    // Return necessary info for post-transaction handling
                    // Also return keyData to access isGlobal and duration after transaction
                    const keyDataForPost = keyDoc.data(); // Capture key data before returning
                    return {
                        keyType,
                        needsTimestampFetch,
                        keyData: keyDataForPost,
                        inputKey,
                    };
                })
                .then(async (result) => {
                    // --- Post-Transaction ---
                    if (!result || !result.keyData) {
                        throw new Error(
                            "Transaction failed to return necessary key data.",
                        );
                    }

                    const { keyType, needsTimestampFetch, keyData, inputKey } =
                        result;
                    let keyRef = db.collection("premium_keys").doc(inputKey);
                    if (!keyRef) {
                        keyRef = db.collection("premium_keys").doc(inputKey); // Re-establish ref if needed
                    }
                    const user = firebase.auth().currentUser; // Ensure user is available
                    if (!user) {
                        throw new Error("User not available post-transaction.");
                    }
                    const userId = user.uid; // Use UID for uniqueness
                    const isGlobal = keyData.isGlobal === true;
                    const durationDays = keyData.duration;

                    let finalActivatedAt = null; // This will hold the timestamp relevant for *this user's* expiration calculation

                    // Store key metadata needed for checkKeyValidity, regardless of global status
                    localStorage.setItem(
                        `keyDuration_${inputKey}`,
                        durationDays != null ? durationDays.toString() : "0", // Add null/undefined check
                    );
                    localStorage.setItem(
                        `isGlobal_${inputKey}`,
                        isGlobal != null ? isGlobal.toString() : "false", // Consistent null/undefined check
                    );

                    // Determine the key's original activation time (or fetch if new)
                    let keyOriginalActivationTime = null;
                    if (needsTimestampFetch) {
                        try {
                            const updatedKeyDoc = await keyRef.get();
                            const updatedKeyData = updatedKeyDoc.data();
                            if (
                                updatedKeyData.activatedAt &&
                                updatedKeyData.activatedAt.toDate
                            ) {
                                keyOriginalActivationTime =
                                    updatedKeyData.activatedAt
                                        .toDate()
                                        .getTime();
                                console.log(
                                    `Fetched actual key activatedAt timestamp: ${keyOriginalActivationTime}`,
                                );
                            } else {
                                throw new Error(
                                    "Fetched activatedAt is missing or not a Timestamp.",
                                );
                            }
                        } catch (fetchError) {
                            console.error(
                                "Failed to fetch activatedAt timestamp after transaction:",
                                fetchError,
                            );
                            // logout(); // Tạm thời vô hiệu hóa logout khi lỗi fetch timestamp
                            alert(
                                "Lỗi khi lấy thời gian kích hoạt key sau khi cập nhật. Vui lòng thử lại.",
                            );
                            return; // Stop further processing
                        }
                    } else {
                        // Key was already activated (either by this user or globally)
                        if (keyData.activatedAt && keyData.activatedAt.toDate) {
                            keyOriginalActivationTime = keyData.activatedAt
                                .toDate()
                                .getTime();
                        } else {
                            console.error(
                                `Missing activation timestamp for already active key ${inputKey}.`,
                            );
                            alert(
                                "Lỗi: Không tìm thấy thời gian kích hoạt gốc của key. Vui lòng liên hệ hỗ trợ.",
                            );
                            // logout(); // Tạm thời vô hiệu hóa logout khi thiếu timestamp gốc
                            return;
                        }
                    }

                    // Handle activation time storage and determine 'finalActivatedAt' for expiration calculation
                    if (isGlobal) {
                        const userSpecificStorageKey = `globalKeyActivation_${inputKey}_${userId}`;
                        const existingUserActivation = localStorage.getItem(
                            userSpecificStorageKey,
                        );
                        if (!existingUserActivation) {
                            // First time this user activates this global key
                            const userActivationTime = Date.now(); // Use current time for user's start
                            localStorage.setItem(
                                userSpecificStorageKey,
                                userActivationTime.toString(),
                            );
                            console.log(
                                `Stored user-specific activation for global key ${inputKey} for user ${userId}: ${new Date(userActivationTime)}`,
                            );
                            finalActivatedAt = userActivationTime; // Use this time for immediate expiration calculation
                        } else {
                            // User has activated this global key before, use their stored time
                            finalActivatedAt = parseInt(existingUserActivation);
                            console.log(
                                `Using existing user-specific activation for global key ${inputKey} for user ${userId}: ${new Date(finalActivatedAt)}`,
                            );
                        }
                    } else {
                        // Non-global key: use the key's original activation time
                        finalActivatedAt = keyOriginalActivationTime;
                        localStorage.setItem(
                            "keyActivatedAt",
                            finalActivatedAt.toString(),
                        ); // Store general activation time
                        console.log(
                            `Using key's original activation time for non-global key ${inputKey}: ${new Date(finalActivatedAt)}`,
                        );
                    }

                    // Calculate expiration and start timer
                    if (keyType !== "PREMIUM_PERMANENT") {
                        if (!finalActivatedAt) {
                            console.error(
                                "Could not determine activation time for expiration calculation.",
                            );
                            alert(
                                "Lỗi: Không xác định được thời gian kích hoạt để tính hạn dùng.",
                            );
                            // logout(); // Tạm thời vô hiệu hóa logout khi thiếu timestamp gốc
                            return;
                        }

                        if (durationDays > 0) {
                            keyExpirationTime =
                                finalActivatedAt +
                                durationDays * 24 * 60 * 60 * 1000;
                            console.log(
                                `Calculated expiration time for ${isGlobal ? "global" : "non-global"} key ${inputKey}: ${new Date(keyExpirationTime)} based on activation ${new Date(finalActivatedAt)}`,
                            );
                            startKeyTimer(); // Start timer now that we have the real expiration
                        } else {
                            console.error(
                                "Invalid duration for expiration calculation.",
                                { durationDays },
                            );
                            // logout(); // Tạm thời vô hiệu hóa logout khi lỗi fetch timestamp
                            alert("Lỗi: Thời hạn key không hợp lệ.");
                            return;
                        }
                    } else {
                        keyExpirationTime = null; // Permanent key
                        startKeyTimer(); // Still call to update UI if needed
                    }

                    // Key activation successful
                    showFunctions();
                    alert(
                        `Premium Key ${inputKey} đã được kích hoạt thành công!`,
                    );
                    showPreviousKeys(); // Update previous keys list
                })
                .catch((error) => {
                    // Handle transaction errors (including those thrown inside)
                    console.error("Error activating premium key:", error);
                    let alertMsg =
                        "Có lỗi xảy ra trong quá trình kích hoạt key.";
                    switch (error.message) {
                        case "Invalid key":
                            alertMsg =
                                "Premium Key không hợp lệ. Hãy liên hệ chúng tôi để mua Premium Key chính hãng.";
                            break;
                        // Removed "Expired key" check as expiration is now dynamic
                        case "Key assigned to another user":
                            alertMsg =
                                "Key này đã được gán cho người dùng khác.";
                            break;
                        case "Key already activated by another user":
                            alertMsg =
                                "Key này đã được kích hoạt bởi người dùng khác.";
                            break;
                        case "Invalid activation timestamp format":
                            alertMsg =
                                "Lỗi: Định dạng thời gian kích hoạt không hợp lệ.";
                            break;
                        case "Key data is incomplete (invalid duration)":
                            alertMsg =
                                "Lỗi: Dữ liệu key không đầy đủ (thời hạn không hợp lệ).";
                            break;
                        // Add other specific errors if needed
                    }
                    alert(alertMsg);
                    // logout(); // Log out on activation failure // Tạm thời vô hiệu hóa
                });
        } catch (error) {
            // Catch errors outside the transaction (e.g., network issues)
            console.error("Error setting up premium key activation:", error);
            alert("Có lỗi kết nối hoặc thiết lập khi kích hoạt key.");
            // logout(); // Tạm thời vô hiệu hóa
        }
    }

    // Note: The original catch block for 'Key already activated' might need adjustment
    // depending on whether the user should be alerted differently if the key was activated
    // by themselves vs someone else. The current logic throws specific errors for each.

    // Keep the savePreviousKey function if it's still needed for UI purposes
    function savePreviousKey(keyId, keyData, userEmail) {
        // ... (implementation remains the same if needed)
    }

    // Keep isKeySystemDisabled if needed
    function isKeySystemDisabled() {
        // ... (implementation remains the same)
        return false; // Assuming it's enabled for now
    }

    // Keep showLoginPopup if needed
    function showLoginPopup() {
        // ... (implementation remains the same)
    }

    // Keep startKeyTimer if needed
    function startKeyTimer() {
        // ... (implementation remains the same, uses global keyExpirationTime)
    }

    // Keep showFunctions if needed
    function showFunctions() {
        // ... (implementation remains the same)
    }

    // Keep logout function, it's used in error handling
    // Added showAlert parameter (default false)
    function logout(showAlert = false) {
        if (isKeySystemDisabled()) {
            alert(
                "Hệ thống key hiện đang bị vô hiệu hóa. Bạn không thể đăng xuất lúc này.",
            );
            return;
        }

        activeKey = null;
        keyExpirationTime = null;
        const storedKeyId = localStorage.getItem("activatedKeyId");
        const userId =
            localStorage.getItem("userId") || firebase.auth().currentUser?.uid;

        // Remove general items
        localStorage.removeItem("activeKey");
        localStorage.removeItem("activatedKeyId");
        localStorage.removeItem("keyActivatedAt"); // Still used for non-global premium
        localStorage.removeItem("keyDuration"); // Old premium duration, remove for safety
        localStorage.removeItem("keyExpirationTime"); // Old free key expiration, remove for safety

        // Remove key-specific items if keyId exists
        if (storedKeyId) {
            localStorage.removeItem(`isGlobal_${storedKeyId}`);
            localStorage.removeItem(`keyDuration_${storedKeyId}`);
            localStorage.removeItem(`freeKeyUsedAt_${storedKeyId}`);
            localStorage.removeItem(`freeKeyDuration_${storedKeyId}`);
            // Remove user-specific global key activation time if userId exists
            if (userId) {
                localStorage.removeItem(
                    `globalKeyActivation_${storedKeyId}_${userId}`,
                );
            }
        }
        // Also remove userId if stored separately
        localStorage.removeItem("userId");

        localStorage.removeItem("keyType"); // Ensure keyType is also cleared

        // Clear the global expiration variable
        keyExpirationTime = null;

        // Reset UI elements
        const keySection = document.getElementById("keySection");
        const functionsSection = document.getElementById("functionsSection");
        if (keySection) keySection.style.display = "block";
        if (functionsSection) functionsSection.style.display = "none";

        // Stop any running timers associated with the key
        // (Assuming startKeyTimer sets up an interval/timeout that needs clearing)
        // clearKeyTimer(); // Add a function to clear the timer if necessary

        showPreviousKeys(); // Update UI for previous keys

        if (showAlert) {
            alert("Bạn đã đăng xuất hoặc key của bạn không hợp lệ/hết hạn.");
        }
        console.log("Logout process complete.");
    }

    function showFunctions() {
        document.getElementById("keySection").style.display = "none";
        document.getElementById("functionsSection").style.display = "block";
        const buttons = document.querySelectorAll("#functionsSection button");
        const inputs = document.querySelectorAll("#functionsSection input");

        buttons.forEach((button) => {
            button.disabled = false;
            button.onclick = null;
        });

        inputs.forEach((input) => {
            input.disabled = false;
        });
    }

    function showPremiumAlert() {
        alert(
            "Tính năng này chỉ dành cho người dùng Premium. Vui lòng nâng cấp để sử dụng!",
        );
    }

    // --- Firestore Helper Functions (NEW & CORRECTED PARSING) ---
    // Helper to extract value from Firestore field object
    function extractFirestoreValue(field) {
        if (!field) return undefined;
        if ("stringValue" in field) return field.stringValue;
        if ("booleanValue" in field) return field.booleanValue;
        if ("integerValue" in field) return parseInt(field.integerValue, 10);
        if ("doubleValue" in field) return parseFloat(field.doubleValue);
        if ("timestampValue" in field)
            return new Date(field.timestampValue).getTime(); // Return epoch milliseconds
        if ("mapValue" in field && field.mapValue.fields)
            return parseFirestoreFields(field.mapValue.fields); // Recursive for maps
        if ("arrayValue" in field && field.arrayValue.values)
            return field.arrayValue.values.map(extractFirestoreValue); // Recursive for arrays
        if ("nullValue" in field) return null;
        // Add other types like geoPointValue, referenceValue if needed
        console.warn("Unsupported Firestore field type:", field);
        return undefined;
    }

    // Helper to parse the main 'fields' object
    function parseFirestoreFields(fields) {
        if (!fields) return null;
        const data = {};
        for (const key in fields) {
            data[key] = extractFirestoreValue(fields[key]);
        }
        return data;
    }

    async function getFirestoreDocument(collection, id) {
        console.log(
            `Attempting to fetch Firestore document: ${collection}/${id}`,
        );
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: "https://us-central1-studyaidx-app.cloudfunctions.net/mcpRunner", // Ensure this is your correct MCP endpoint
                    headers: {
                        "Content-Type": "application/json",
                        // Add Authorization header if needed
                    },
                    data: JSON.stringify({
                        server_name: "mcp.config.usrlocalmcp.firebase-mcp",
                        tool_name: "firestore_get_document",
                        args: JSON.stringify({ collection, id }),
                    }),
                    responseType: "json",
                    timeout: 15000, // 15 seconds timeout
                    onload: (res) => resolve(res),
                    onerror: (err) => reject(err),
                    ontimeout: () => reject(new Error("Request timed out")),
                });
            });

            console.log(`Raw MCP response for ${collection}/${id}:`, response);

            if (response.status === 200 && response.response) {
                const mcpResponse = response.response;
                if (
                    mcpResponse &&
                    mcpResponse.length > 0 &&
                    mcpResponse[0].type === "text"
                ) {
                    try {
                        const firestoreResult = JSON.parse(mcpResponse[0].text);
                        console.log(
                            `Parsed MCP response text for ${collection}/${id}:`,
                            firestoreResult,
                        );

                        // Check if the document exists based on the structure observed in toolcall history
                        // Structure: { document: { name: ..., fields: {...}, createTime: ..., updateTime: ... } }
                        // Or sometimes just { fields: {...} } if the MCP tool simplifies it.
                        // Let's assume the structure includes 'document' based on previous logs.
                        if (
                            firestoreResult &&
                            firestoreResult.document &&
                            firestoreResult.document.fields
                        ) {
                            const parsedData = parseFirestoreFields(
                                firestoreResult.document.fields,
                            );
                            console.log(
                                `Successfully fetched and parsed document ${id} from ${collection}:`,
                                parsedData,
                            );
                            return parsedData; // Return the parsed document data
                        } else if (
                            firestoreResult &&
                            Object.keys(firestoreResult).length === 0
                        ) {
                            // Handle case where the document explicitly doesn't exist (empty object response)
                            console.log(
                                `Document ${id} not found in ${collection} (empty response).`,
                            );
                            return null;
                        } else {
                            // Handle cases where the document might not exist or the structure is unexpected
                            // Check if the response indicates 'missing document' or similar if the MCP provides it
                            console.log(
                                `Document ${id} not found in ${collection} or unexpected structure in response:`,
                                firestoreResult,
                            );
                            return null; // Document not found or structure issue
                        }
                    } catch (parseError) {
                        console.error(
                            `Error parsing MCP response text for ${collection}/${id}:`,
                            parseError,
                            mcpResponse[0].text,
                        );
                        return null;
                    }
                } else {
                    console.error(
                        `Unexpected MCP response format or empty response for ${collection}/${id}:`,
                        mcpResponse,
                    );
                    return null;
                }
            } else {
                console.error(
                    `Error fetching document ${id} from ${collection}. Status: ${response.status}`,
                    response.statusText,
                    response.response,
                );
                // Check if status 404 explicitly means not found
                if (response.status === 404) {
                    console.log(
                        `Document ${id} not found in ${collection} (HTTP 404).`,
                    );
                }
                return null;
            }
        } catch (error) {
            console.error(
                `Network or script error fetching document ${id} from ${collection}:`,
                error,
            );
            return null;
        }
    }

    async function updateFirestoreDocument(collection, id, data) {
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: "https://us-central1-studyaidx-app.cloudfunctions.net/mcpRunner", // Ensure this is your correct MCP endpoint
                    headers: {
                        "Content-Type": "application/json",
                        // Add Authorization header if needed
                    },
                    data: JSON.stringify({
                        server_name: "mcp.config.usrlocalmcp.firebase-mcp",
                        tool_name: "firestore_update_document",
                        args: JSON.stringify({ collection, id, data }),
                    }),
                    responseType: "json",
                    timeout: 15000,
                    onload: (res) => resolve(res),
                    onerror: (err) => reject(err),
                    ontimeout: () => reject(new Error("Request timed out")),
                });
            });

            // Check if the MCP server indicates success (adjust based on actual response)
            if (
                response.status ===
                200 /* && check specific success indicator in response.response if available */
            ) {
                console.log(
                    `Document ${id} in ${collection} updated successfully via MCP.`,
                );
                return true;
            } else {
                console.error(
                    `Error updating document ${id} in ${collection} via MCP. Status: ${response.status}`,
                    response.statusText,
                    response.response,
                );
                return false;
            }
        } catch (error) {
            console.error(
                `Network or script error updating document ${id} in ${collection}:`,
                error,
            );
            return false;
        }
    }
    // --- End Firestore Helper Functions ---

    // --- Simplified logout --- (Starts around line 9734)
    function logout(showAlert = false) {
        // Changed default to false
        console.log(`Logging out. Alert: ${showAlert}`);
        // No need to check isKeySystemDisabled here, logout should always clear local state.

        activeKey = null;
        keyExpirationTime = null;

        // Get userId BEFORE clearing localStorage
        const userIdToClear = localStorage.getItem("userId");

        // Clear all key-related info from localStorage to prevent reuse
        localStorage.removeItem("activeKey");
        localStorage.removeItem("keyExpirationTime");
        // localStorage.removeItem("activatedKeyId"); // Keep activatedKeyId on logout
        localStorage.removeItem("keyActivatedAt"); // Old field
        // Remove other potential metadata (might need a loop or specific keys if stored dynamically)
        // Example: Find keys matching /^globalKeyActivation_/ and remove them
        Object.keys(localStorage).forEach((key) => {
            if (
                key.startsWith("globalKeyActivation_") ||
                key.startsWith("isGlobal_") ||
                key.startsWith("keyDuration_") ||
                key.startsWith("freeKey")
            ) {
                localStorage.removeItem(key);
            }
        });

        // Clear Firestore status as well
        if (userIdToClear) {
            clearUserKeyStatusInFirestore(userIdToClear).catch((error) => {
                console.error(
                    "Error clearing Firestore status during logout:",
                    error,
                );
            });
        } else {
            console.warn(
                "Could not clear Firestore status during logout: userId not found in localStorage.",
            );
        }

        // Stop UI timer if running
        clearKeyTimer(); // This should now work correctly

        // Update UI to show key input section
        const keySection = document.getElementById("keySection");
        const functionsSection = document.getElementById("functionsSection");
        if (keySection) keySection.style.display = "block";
        if (functionsSection) functionsSection.style.display = "none";

        // Update previous keys display if applicable
        showPreviousKeys();

        if (showAlert) {
            alert("Bạn đã đăng xuất hoặc key của bạn không hợp lệ/hết hạn.");
        }
        console.log("Logout process complete.");
    }
    // --- End Simplified logout ---

    function isFreeFeature(id) {
        return [
            "extractButton",
            "selectAnswersButton",
            "startTimerButton",
            "playMusicButton",
            "openGithubButton",
            "startFarmButton",
        ].includes(id);
    }

    function checkFreeKeyActivation() {
        if (window.location.href === "https://lms.vinschool.edu.vn/free-key") {
            handleFreeKeyActivation();
        }
    }

    function addSecondKeyButton() {
        if (window.location.href === "https://lms.vinschool.edu.vn/free-key2") {
            window.location.href = "http://go.megaurl.in/z3xigk";
        }
    }

    let keyTimerIntervalId = null; // Global variable for the timer interval ID

    // Function to clear the key timer interval
    function clearKeyTimer() {
        if (keyTimerIntervalId) {
            clearInterval(keyTimerIntervalId);
            keyTimerIntervalId = null;
            console.log("Key timer cleared.");
            // Optionally hide or reset the timer display element
            const remainingTimeElement =
                document.getElementById("remainingTime");
            if (remainingTimeElement) {
                remainingTimeElement.style.display = "none";
            }
            const timeLeftElement = document.getElementById("timeLeft");
            if (timeLeftElement) {
                timeLeftElement.textContent = "";
            }
        }
    }

    function startKeyTimer() {
        const remainingTimeElement = document.getElementById("remainingTime");
        const timeLeftElement = document.getElementById("timeLeft");
        remainingTimeElement.style.display = "block";

        // Clear any existing timer before starting a new one
        clearKeyTimer();

        keyTimerIntervalId = setInterval(() => {
            if (isKeySystemDisabled()) {
                clearInterval(interval);
                remainingTimeElement.style.display = "none";
                return;
            }

            // Check if the key is permanent (no expiration)
            if (keyExpirationTime === null) {
                // For permanent keys, just display 'Permanent' or similar
                if (timeLeftElement) timeLeftElement.textContent = "Permanent";
                // Don't proceed with expiration check for permanent keys
                return; // Exit the interval callback for this iteration
            }

            const now = Date.now();
            const timeRemaining = keyExpirationTime - now;

            // Add a small buffer (e.g., 500ms) to prevent immediate logout due to minor timing issues
            if (timeRemaining < -500) {
                clearKeyTimer(); // Use the global clear function
                logout(true); // Pass true to indicate logout due to expiration and show alert
            } else {
                const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                const hours = Math.floor(
                    (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
                );
                const minutes = Math.floor(
                    (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
                );
                const seconds = Math.floor(
                    (timeRemaining % (1000 * 60)) / 1000,
                );

                let timeString = "";
                if (days > 0) {
                    timeString = `${days}d ${hours}h`;
                } else if (hours > 0) {
                    timeString = `${hours}h ${minutes}m`;
                } else {
                    timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
                }

                timeLeftElement.textContent = timeString;

                if (activeKey === "FREE" && minutes === 0 && seconds === 60) {
                    alert(
                        "Còn 1 phút trước khi phiên miễn phí của bạn kết thúc.",
                    );
                }
            }
        }, 1000);
    }

    // Add event listeners
    // Thay đổi event listener cho nút getFreeKeyButton
    document
        .getElementById("getFreeKeyButton")
        .addEventListener("click", () => {
            document.getElementById("freeKeyInput").style.display = "block";
            document.getElementById("activateFreeKeyButton").style.display =
                "block";
            window.open("https://studyaidx.web.app/get-key", "_blank");
        });

    // Thêm event listener cho nút activateFreeKeyButton
    document
        .getElementById("activateFreeKeyButton")
        .addEventListener("click", activateFreeKey);
    document
        .getElementById("activatePremiumKeyButton")
        .addEventListener("click", activatePremiumKey);
    document.getElementById("logoutButton").addEventListener("click", logout);
    document.getElementById("contactButton").addEventListener("click", () => {
        window.open("https://studyaidx.web.app/get-key", "_blank");
    });

    // Check key validity and load premium keys on load
    window.addEventListener("load", () => {
        loadPremiumKeys();
        loadKeyUsageInfo();
        loadPreviousKeys(); // Thêm dòng này
        // Wrap checkKeyValidity in an async IIFE to allow await
        (async () => {
            const keyStatus = await checkKeyValidity();
            if (
                keyStatus.status === "invalid" ||
                keyStatus.status === "expired"
            ) {
                logout();
            }
        })();
        checkFreeKeyActivation();
        addSecondKeyButton();
    });

    // Kiểm tra sự thay đổi của premium keys mỗi 5 phút
    setInterval(loadPremiumKeys, 300000);

    let autoSubmitEnabled = false; // Global variable to track state (default to off)

    // Function to save the auto-submit preference to localStorage
    function saveAutoSubmitPreference(autoSubmit) {
        localStorage.setItem("autoSubmitPreference", autoSubmit);
    }

    // Function to load the auto-submit preference from localStorage
    function loadAutoSubmitPreference() {
        const savedPreference = localStorage.getItem("autoSubmitPreference");
        // Return true if saved as 'true', otherwise return false (default)
        return savedPreference === "true";
    }

    // Function to initialize the auto-submit checkbox and its event listener
    function initializeAutoSubmitCheckbox() {
        const autoSubmitCheckbox =
            document.getElementById("autoSubmitCheckbox");
        if (autoSubmitCheckbox) {
            // Load the saved preference and set the checkbox state
            const savedPreference = loadAutoSubmitPreference();
            autoSubmitCheckbox.checked = savedPreference;
            autoSubmitEnabled = savedPreference; // Update the global variable

            // Add the event listener to handle changes to the checkbox
            autoSubmitCheckbox.addEventListener("change", function () {
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
                if (mutation.type === "childList" && autoSubmitEnabled) {
                    // Try to find the submit button using a comprehensive selector
                    const submitButton = document.querySelector(
                        '.btn.submit_button.quiz_submit.btn-primary, input[type="submit"], button[type="submit"], #submitbutton, .submit-btn',
                    ); // Add more selectors if needed
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
    document.addEventListener("DOMContentLoaded", initializeAutoSubmitCheckbox);

    // Add event listeners
    let audio;
    const playMusicButton = document.getElementById("playMusicButton");
    const pauseMusicButton = document.getElementById("pauseMusicButton");
    const volumeSlider = document.getElementById("volumeSlider");
    const trackInfo = document.getElementById("trackInfo");
    const currentTrack = document.getElementById("currentTrack");

    playMusicButton.addEventListener("click", () => {
        if (!audio) {
            audio = new Audio(
                "https://ia904603.us.archive.org/4/items/official-rickroll-download-pls-dont-give-me-copyright-strike/Official%20Rickroll%20Download%20%28Pls%20don%27t%20give%20me%20copyright%20strike%29.mp3",
            );
            audio.addEventListener("loadedmetadata", () => {
                trackInfo.textContent = `:))) - ${audio.duration.toFixed(2)}s`;
                currentTrack.style.display = "block";
            });
        }
        audio.play();
    });

    pauseMusicButton.addEventListener("click", () => {
        if (audio) {
            audio.pause();
        }
    });

    volumeSlider.addEventListener("input", (e) => {
        if (audio) {
            audio.volume = e.target.value;
        }
    });

    function showMenu() {
        const menu = document.getElementById("quizHelperMenu");
        menu.style.display = "block";
        menu.style.animation = "fadeIn 0.5s ease-out";
    }

    // Show the menu after the welcome animation
    setTimeout(() => {
        menu.style.display = "block";
        menu.style.animation = "fadeIn 0.5s ease-out";
    }); // 4000ms = 3s (welcome duration) + 0.5s (fade out) + 0.5s (buffer)

    // Create extraction popup
    const popup = document.createElement("div");
    popup.id = "extractionPopup";
    popup.innerHTML = `
                                    <h2>Câu Hỏi Đã Khai Thác</h2>
                                    <div id="extractionContent"></div>
                                    <button id="copyButton">📋 Sao Chép vào Bộ Nhớ Tạm</button>
                                    <button id="closeButton">❌ Đóng</button>
                                `;
    document.body.appendChild(popup);

    // Create toast notification
    const toast = document.createElement("div");
    toast.id = "toast";
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
    const menuHeader = document.getElementById("menuHeader");

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
        menu.style.transition = "none";
        menu.style.userSelect = "none";
        menu.style.right = "auto";

        cancelAnimationFrame(animationFrameId); // Clear any running momentum animations
        velocity = { x: 0, y: 0 }; //Reset the velocity
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

        setTranslate(xOffset, yOffset, menu);

        lastTime = currentTime;
    }

    function dragEnd() {
        isDragging = false;
        menu.style.userSelect = "initial";
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

            xOffset = Math.max(
                0,
                Math.min(xOffset, viewportWidth - bounds.width),
            );
            yOffset = Math.max(
                0,
                Math.min(yOffset, viewportHeight - bounds.height),
            );

            setTranslate(xOffset, yOffset, menu);

            if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
                animationFrameId = requestAnimationFrame(momentumLoop);
            } else {
                menu.style.transition = "transform 0.3s ease-out";
            }
        }

        momentumLoop();
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    // Resize
    const resizeHandle = document.createElement("div");
    resizeHandle.id = "resizeHandle";
    menu.appendChild(resizeHandle);

    let isResizing = false;
    let initialWidth, initialHeight, initialResizeX, initialResizeY;

    resizeHandle.addEventListener("mousedown", (e) => {
        isResizing = true;
        initialWidth = menu.offsetWidth;
        initialHeight = menu.offsetHeight;
        initialResizeX = e.clientX;
        initialResizeY = e.clientY;

        e.stopPropagation();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isResizing) return;

        const newWidth = initialWidth + (e.clientX - initialResizeX);
        const newHeight = initialHeight + (e.clientY - initialResizeY);

        if (newWidth >= 300 && newHeight >= 300) {
            menu.style.width = `${newWidth}px`;
            menu.style.height = `${newHeight}px`;
        }
    });

    document.addEventListener("mouseup", () => {
        isResizing = false;
    });

    function extractQuizAnswers() {
        let quizText = "";
        const imagesToOpen = [];
        setTimeout(() => {
            console.log("🔍 Bắt đầu trích xuất nội dung quiz...");

            // Extract quiz title from quiz-header
            const quizTitle = document.querySelector(".quiz-header h1");
            if (quizTitle) {
                const titleText = quizTitle.innerText.trim();
                if (titleText) {
                    console.log("✅ Đã tìm thấy tiêu đề quiz:", titleText);
                    quizText += `Tiêu đề: ${titleText}\n\n`;
                }
            } else {
                console.log("⚠️ Không tìm thấy tiêu đề quiz");
            }

            // Extract instructions and reading content from #quiz-instructions
            const quizInstructions = document.querySelector(
                "#quiz-instructions.user_content.enhanced",
            );
            if (quizInstructions) {
                console.log(
                    "✅ Đã tìm thấy phần hướng dẫn và nội dung bài đọc",
                );
                // Get all paragraphs from instructions
                const paragraphs = quizInstructions.querySelectorAll("p");
                paragraphs.forEach((p, index) => {
                    const text = p.innerText.trim();
                    if (text) {
                        console.log(
                            `📝 Đoạn văn ${index + 1}:`,
                            text.substring(0, 50) + "...",
                        );
                        quizText += `${text}\n\n`;
                    }
                });
            } else {
                console.log(
                    "⚠️ Không tìm thấy phần hướng dẫn và nội dung bài đọc",
                );
            }

            console.log("📋 Nội dung trích xuất được:", quizText);

            const questionElements = document.querySelectorAll(
                ".question, .question-container, .quiz-item",
            );
            if (questionElements.length === 0) {
                showToast("Failed to extract questions. Please try again.");
                return;
            }
            questionElements.forEach((questionElement, index) => {
                let questionText = questionElement.querySelector(
                    ".question_text",
                )
                    ? questionElement.querySelector(".question_text").innerText
                    : "";
                quizText += `Câu hỏi ${index + 1}: ${questionText}\n`;
                // Check for images in the question and add clear identifiers
                const questionImages = questionElement.querySelectorAll(
                    'img[alt*="Screenshot"]',
                );
                if (questionImages.length > 0) {
                    quizText += `[Hình ảnh cho câu hỏi ${index + 1}]\n`;
                    questionImages.forEach((img, imgIndex) => {
                        quizText += `- Hình ${imgIndex + 1}: [${img.alt}]\n`;
                        imagesToOpen.push(img.src);
                    });
                }
                questionElement
                    .querySelectorAll(".answer, .answer-text, .option")
                    .forEach((answerElement, answerIndex) => {
                        let answerText = answerElement.innerText.trim();
                        // Check for image elements inside the answer
                        const imageElements = answerElement.querySelectorAll(
                            'img[alt*="Screenshot"]',
                        );
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
                quizText += "\n"; // Add a blank line between questions
            });
            // Add instruction to the extracted text
            const instruction =
                "\n\nĐưa đáp án cho các câu hỏi, mỗi đáp án cách nhau bằng dấu chấm phẩy (;). QUAN TRỌNG: CHỈ trả về đáp án đầy đủ bao gồm ký hiệu và nội dung đáp án (ví dụ: 'A. Giúp tạo liên kết giữa hai bảng'), KHÔNG được thêm bất kỳ thông tin nào khác như 'Câu hỏi X:' hay số th �� tự. Tất cả đáp án phải nằm trên một dòng duy nhất, không xuống dòng. **Nếu đáp án là các biểu thức toán học, hãy trả về chúng dưới dạng LaTeX kèm theo ký hiệu đáp án, ví dụ: 'A. \\frac{1}{2}'**. Ví dụ mẫu đáp án đúng: 'A. Cả hai đáp án đúng; B. Trồng lúa lấy gạo để xuất khẩu; C. Sử dụng thuốc hóa học; D. Tăng diện tích đất trồng'";
            quizText += instruction;
            // Copy to clipboard
            navigator.clipboard
                .writeText(quizText)
                .then(() => {
                    showToast(
                        "Quiz content extracted and copied to clipboard!",
                    );
                    // Open all image links in new tabs
                    imagesToOpen.forEach((imageUrl) => {
                        window.open(imageUrl, "_blank");
                    });
                })
                .catch((err) => {
                    console.error("Failed to copy text: ", err);
                    showToast("Failed to copy content. Please try again.");
                });
        }, 100);
    }

    console.log("💡 Script bắt đầu chạy."); // Kiểm tra xem script có được tải không

    // Function hiển thị đáp án với notification cảnh báo
    function displayAnswers(correctAnswersString) {
        try {
            let answersArray;

            // Xử lý dữ liệu đầu vào: chuyển chuỗi thành mảng nếu cần
            if (Array.isArray(correctAnswersString)) {
                answersArray = correctAnswersString;
            } else if (typeof correctAnswersString === "string") {
                answersArray = correctAnswersString.split(";");
            } else {
                console.error(
                    "Lỗi: Dữ liệu đáp án không đúng định dạng:",
                    correctAnswersString,
                );
                handleError(
                    new Error("Dữ liệu đáp án không hợp lệ."),
                    "Không thể hiển thị đáp án do dữ liệu không hợp lệ.",
                );
                return;
            }

            // Lấy tất cả các element câu hỏi
            const questionElements = document.querySelectorAll(
                ".question, .question-container, .quiz-item",
            );
            let answerIndex = 0;

            // Tạo notification container cảnh báo
            const notificationContainer = document.createElement("div");
            notificationContainer.className = "answer-notification";
            notificationContainer.style.backgroundColor = "#fff3cd"; // Màu vàng nhạt
            notificationContainer.style.color = "#85640a"; // Chữ nâu đậm
            notificationContainer.style.padding = "15px";
            notificationContainer.style.marginBottom = "15px";
            notificationContainer.style.border = "1px solid #ffe082"; // Viền vàng
            notificationContainer.style.borderRadius = "8px";
            notificationContainer.style.fontWeight = "bold";
            notificationContainer.style.textAlign = "center";
            notificationContainer.style.fontSize = "16px";

            const notificationText = document.createElement("span");
            notificationText.textContent =
                "LƯU Ý: Đôi khi thuật toán có thể chọn sai. Vui lòng kiểm tra kỹ đáp án hiển thị để tránh mất điểm!";
            notificationContainer.appendChild(notificationText);

            // Thêm notification vào đầu trang hoặc trước câu hỏi đầu tiên
            const quizContainer =
                document.querySelector(".quiz-container") ||
                document.querySelector(".question-container") ||
                questionElements[0]?.parentElement ||
                document.body;
            quizContainer.insertBefore(
                notificationContainer,
                questionElements[0] || quizContainer.firstChild,
            );

            // Duyệt qua từng câu hỏi và hiển thị đáp án
            questionElements.forEach((element, index) => {
                // Xóa phần hiển thị đáp án cũ nếu có
                const existingDisplay =
                    element.querySelector(".answer-display");
                if (existingDisplay) {
                    existingDisplay.remove();
                }

                // Tạo container mới cho đáp án
                const answerDisplay = document.createElement("div");
                answerDisplay.className = "answer-display";
                answerDisplay.style.marginTop = "10px";
                answerDisplay.style.padding = "15px";
                answerDisplay.style.backgroundColor = "#ffffff";
                answerDisplay.style.border = "1px solid #e0e0e0";
                answerDisplay.style.borderRadius = "8px";
                answerDisplay.style.fontSize = "15px";
                answerDisplay.style.color = "#333";
                element.style.position = "relative";

                let answerContent = document.createElement("div");

                // Xử lý từng loại câu hỏi
                if (isMatchingQuestion(element)) {
                    const pairsCount = getMatchingPairsCount(element);
                    const answersForQuestion = answersArray.slice(
                        answerIndex,
                        answerIndex + pairsCount,
                    );
                    if (answersForQuestion.length < pairsCount) {
                        answerContent.innerHTML =
                            "<div class='no-answer'>Không đủ đáp án từ AI cho câu hỏi ghép cặp.</div>";
                    } else {
                        answerContent.innerHTML = formatMatchingAnswersEnhanced(
                            answersForQuestion,
                            element,
                        );
                        answerIndex += pairsCount;
                    }
                } else if (isFillInTheBlankQuestion(element)) {
                    const blankCount =
                        element.querySelectorAll('input[type="text"]').length;
                    const answersForQuestion = answersArray.slice(
                        answerIndex,
                        answerIndex + blankCount,
                    );
                    if (answersForQuestion.length < blankCount) {
                        answerContent.innerHTML =
                            "<div class='no-answer'>Không đủ đáp án từ AI cho câu hỏi điền vào chỗ trống.</div>";
                    } else {
                        answerContent.innerHTML =
                            formatFillInBlankAnswersEnhanced(
                                answersForQuestion,
                                element,
                            );
                        answerIndex += blankCount;
                    }
                } else if (isCheckboxListQuestion(element)) {
                    if (answerIndex < answersArray.length) {
                        const answerForQuestion = answersArray[answerIndex++];
                        answerContent.innerHTML =
                            formatCheckboxListAnswersEnhanced(
                                answerForQuestion,
                            );
                    } else {
                        answerContent.innerHTML =
                            "<div class='no-answer'>Không có đáp án từ AI.</div>";
                    }
                } else {
                    // Multiple Choice Question
                    if (answerIndex < answersArray.length) {
                        const answer = answersArray[answerIndex++];
                        answerContent.innerHTML =
                            formatMultipleChoiceAnswerEnhanced(answer, element);
                    } else {
                        answerContent.innerHTML =
                            "<div class='no-answer'>Không có đáp án từ AI.</div>";
                    }
                }

                answerDisplay.appendChild(answerContent);
                element.appendChild(answerDisplay);
            });

            console.log("Đã hiển thị đáp án và notification cảnh báo!");
        } catch (error) {
            handleError(error, "Không thể hiển thị đáp án. Vui lòng thử lại.");
        }
    }

    // Function format đáp án cho câu hỏi ghép cặp
    function formatMatchingAnswersEnhanced(answers, element) {
        if (!answers || answers.length === 0)
            return "<div class='no-answer'>Không có đáp án cho câu hỏi ghép cặp.</div>";

        let html = "<div class='matching-answers'>";
        html +=
            "<div style='font-weight: bold; color: #555; margin-bottom: 8px;'>ĐÁP ÁN ĐÚNG LÀ:</div>";

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
        if (!answers || answers.length === 0)
            return "<div class='no-answer'>Không có đáp án cho câu hỏi điền vào chỗ trống.</div>";

        let html = "<div class='blank-answers'>";
        html +=
            "<div style='font-weight: bold; color: #555; margin-bottom: 8px;'>ĐÁP ÁN ĐÚNG LÀ:</div>";

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
        if (!answers || answers.trim() === "")
            return "<div class='no-answer'>Không có đáp án cho câu hỏi nhiều lựa chọn.</div>";

        let html = "<div class='checkbox-answers'>";
        html +=
            "<div style='font-weight: bold; color: #555; margin-bottom: 8px;'>CÁC ĐÁP ÁN ĐÚNG LÀ:</div>";

        const answerList = answers
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a);
        answerList.forEach((answer) => {
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
        html +=
            "<div style='font-weight: bold; color: #555; margin-bottom: 8px;'>ĐÁP ÁN ĐÚNG LÀ:</div>";
        html += `<div style='margin-bottom: 5px; padding-left: 10px; position: relative;'>
                                                <span style='position: absolute; left: 0; top: 2px;'>-</span> <span style='font-weight: 500; color: #444; margin-left: 5px;'>${answer}</span>
                                            </div>`;
        html += "</div>";
        return html;
    }

    // Function lấy văn bản xung quanh input (dùng cho câu hỏi điền vào chỗ trống)
    function getSurroundingText(input) {
        let surroundingText = "";
        let node = input.previousSibling;

        while (node && surroundingText.length < 50) {
            if (node.nodeType === 3) {
                surroundingText =
                    node.textContent.trim() + " " + surroundingText;
            }
            node = node.previousSibling;
        }

        node = input.nextSibling;
        while (node && surroundingText.length < 100) {
            if (node.nodeType === 3) {
                surroundingText += " " + node.textContent.trim();
            }
            node = node.nextSibling;
        }

        return surroundingText.trim();
    }

    // Function kiểm tra xem có phải câu hỏi ghép cặp không
    function isMatchingQuestion(element) {
        return element.classList.contains("quiz-item-matching");
    }

    // Function đếm số cặp ghép trong câu hỏi ghép cặp
    function getMatchingPairsCount(element) {
        return element.querySelectorAll("select").length;
    }

    // Function kiểm tra xem có phải câu hỏi điền vào chỗ trống không
    function isFillInTheBlankQuestion(element) {
        return element.classList.contains("quiz-item-fill-in-blank");
    }

    // Function kiểm tra xem có phải câu hỏi nhiều lựa chọn không
    function isCheckboxListQuestion(element) {
        return element.classList.contains("quiz-item-checkbox");
    }

    // Function xử lý lỗi chung
    function handleError(error, message) {
        console.error("Error:", message, error);
        alert(message);
    }

    function selectCorrectAnswers(correctAnswers, autoSubmit = false) {
        try {
            // Split answers only for multiple choice, not for rich text
            let parsedAnswers = [];
            if (typeof correctAnswers === "string") {
                // Use regex to split on semicolons that are followed by A., B., C., etc.
                parsedAnswers = correctAnswers.split(/;(?=\s*[A-D]\s*\.)/);
            } else if (Array.isArray(correctAnswers)) {
                parsedAnswers = correctAnswers;
            }

            const isIncognito =
                localStorage.getItem("incognitoMode") === "true";
            const questionElements = document.querySelectorAll(
                ".question, .question-container, .quiz-item",
            );
            let answerIndex = 0;

            // Check if we have any rich text editor questions
            const hasRichTextQuestion = Array.from(questionElements).some(
                (element) => isRichTextEditorQuestion(element),
            );

            // If we have rich text questions, don't split the answer but use it as a whole
            let richTextAnswer = hasRichTextQuestion
                ? correctAnswers.join(";")
                : "";

            questionElements.forEach((element) => {
                if (isRichTextEditorQuestion(element)) {
                    // For rich text questions, handle differently - pass the complete answer
                    console.log(
                        "🖊️ Processing rich text editor question with full answer",
                    );
                    // Skip any processing that might split the answer
                    handleRichTextEditorQuestion(element, richTextAnswer);

                    // Increment answer index after handling rich text
                    answerIndex++;
                } else if (isMatchingQuestion(element)) {
                    handleMatchingQuestionSelection(
                        element,
                        parsedAnswers.slice(answerIndex),
                    );
                    answerIndex += getMatchingPairsCount(element);
                } else if (isFillInTheBlankQuestion(element)) {
                    const blankCount = handleFillInTheBlankQuestion(
                        element,
                        parsedAnswers.slice(answerIndex),
                    );
                    answerIndex += blankCount;
                } else if (isCheckboxListQuestion(element)) {
                    const checkboxCount = handleCheckboxListQuestion(
                        element,
                        parsedAnswers.slice(answerIndex),
                    );
                    answerIndex += checkboxCount;
                } else {
                    // Standard multiple choice question
                    if (answerIndex < parsedAnswers.length) {
                        let answer = parsedAnswers[answerIndex++];

                        // Skip placeholders
                        if (answer === " ") {
                            // Skip this question
                        } else if (answer) {
                            selectMultipleChoiceAnswer(
                                element,
                                answer,
                                isIncognito,
                            );
                        }
                    }
                }
            });

            // Show UI feedback if not in incognito mode
            if (!isIncognito) {
                // Only display multiple choice answers in the standard display
                const multipleChoiceAnswers = parsedAnswers.filter(
                    (a) => a !== richTextAnswer,
                );
                displayAnswers(multipleChoiceAnswers);

                showToast("Đã chọn đáp án thành công!");
            }

            // Automatically click next if available
            clickNextQuestionButton();

            // Handle auto-submit if enabled
            if (autoSubmit) {
                const submitButton = document.querySelector(
                    '.btn.submit_button.quiz_submit.btn-primary, input[type="submit"], button[type="submit"], #submitbutton, .submit-btn',
                );
                if (submitButton) {
                    submitButton.click();
                    if (!isIncognito) {
                        showToast("Đã tự động nộp bài!");
                    }
                } else if (!isIncognito) {
                    showToast("Không tìm thấy nút nộp bài.");
                }
            }
        } catch (error) {
            console.error("Error in selectCorrectAnswers:", error);
            const isIncognito =
                localStorage.getItem("incognitoMode") === "true";
            if (!isIncognito) {
                handleError(error, "Không thể chọn đáp án. Vui lòng thử lại.");
            }
        }
    }

    function isRichTextEditorQuestion(element) {
        // Check for indicators of a rich text editor based on the screenshot

        // Check for iframe with question_input in the ID (seen in screenshot)
        if (element.querySelector('iframe[id*="question_input"]')) {
            console.log(
                "✅ Detected Rich Text Editor by question_input iframe",
            );
            return true;
        }

        // Check for TinyMCE iframe (common rich text editor)
        if (element.querySelector('iframe[id*="tinymce"]')) {
            console.log("✅ Detected Rich Text Editor by tinymce iframe");
            return true;
        }

        // Check for tox-* classes which are part of the TinyMCE 5+ UI
        if (
            element.querySelector(
                ".tox-edit-area, .tox-editor-container, .tox-tinymce",
            )
        ) {
            console.log("✅ Detected Rich Text Editor by tox-* classes");
            return true;
        }

        // Check for specific class names from the screenshot
        if (
            element.querySelector(
                ".rich-text-editor, .mce-content-body, .tox-edit-area__iframe",
            )
        ) {
            console.log("✅ Detected Rich Text Editor by class names");
            return true;
        }

        // Check for data-id attributes
        if (element.querySelector('[data-id*="question_input"]')) {
            console.log("✅ Detected Rich Text Editor by data-id");
            return true;
        }

        // Check for title attribute mentioning Rich Text
        if (element.querySelector('[title*="Rich Text"]')) {
            console.log("✅ Detected Rich Text Editor by title attribute");
            return true;
        }

        // Check for grammarly integration which often appears in rich text editors
        if (element.querySelector("grammarly-desktop-integration")) {
            console.log(
                "✅ Detected Rich Text Editor by grammarly integration",
            );
            return true;
        }

        return false;
    }

    function handleRichTextEditorQuestion(element, answer) {
        console.log(
            "🔄 Handling Rich Text Editor question with answer:",
            answer,
        );

        // Ensure we're using the complete answer text without truncating at commas
        // This is critical for rich text content that may contain commas

        // Specifically target the iframe with id="question_input_0_ifr" as seen in the image
        let iframe = element.querySelector('iframe[id*="question_input"]');

        // If not found, try more general selectors like in the original code
        if (!iframe) {
            iframe = element.querySelector(
                'iframe[id*="tinymce"], iframe[class*="tox-edit-area__iframe"]',
            );
            console.log("Using fallback iframe selector, found:", !!iframe);
        }

        if (iframe) {
            try {
                // Access the iframe's contentWindow and document
                const iframeDocument =
                    iframe.contentDocument || iframe.contentWindow.document;
                console.log("📄 Accessed iframe document:", !!iframeDocument);

                // Target the body with specific classes from the image
                const editableElement = iframeDocument.querySelector(
                    'body#tinymce, body.mce-content-body, body[id*="tinymce"], body[class*="mce-content-body"], body[class*="default-theme"]',
                );

                if (editableElement) {
                    console.log("✅ Found editable element in iframe");

                    // Set the content (using innerHTML for rich text)
                    // CRITICAL: Use the complete answer without any modifications
                    editableElement.innerHTML = answer;
                    console.log(
                        "📝 Set innerHTML content to:",
                        answer.substring(0, 50) + "...",
                    );

                    // Dispatch events to trigger any necessary updates
                    const events = ["input", "change", "keyup", "blur"];
                    events.forEach((eventType) => {
                        editableElement.dispatchEvent(
                            new Event(eventType, { bubbles: true }),
                        );
                    });

                    console.log("🔔 Dispatched all necessary events");

                    // For added reliability, also try to update via the iframe's parent element
                    const parentTextarea = element.querySelector(
                        'textarea[id*="question_input"]',
                    );
                    if (parentTextarea) {
                        parentTextarea.value = answer;
                        parentTextarea.dispatchEvent(
                            new Event("change", { bubbles: true }),
                        );
                        console.log("🔄 Also updated parent textarea");
                    }

                    // Display a notification specifically for Rich Text answers
                    const richTextNotification = document.createElement("div");
                    richTextNotification.className = "rich-text-notification";
                    richTextNotification.style.padding = "10px";
                    richTextNotification.style.margin = "10px 0";
                    richTextNotification.style.backgroundColor = "#eaf7ff";
                    richTextNotification.style.border = "1px solid #4ba3e3";
                    richTextNotification.style.borderRadius = "4px";
                    richTextNotification.innerHTML = `
                                                    <strong>Rich Text Answer Inserted:</strong>
                                                    <div class="answer-preview" style="margin-top: 5px; font-style: italic;">
                                                        ${answer.substring(0, 100)}${answer.length > 100 ? "..." : ""}
                                                    </div>
                                                `;

                    // Append the notification near the rich text editor
                    const editorContainer =
                        element.querySelector(".tox-tinymce") ||
                        element.querySelector(".tox-editor-container") ||
                        iframe.parentElement;

                    if (editorContainer && editorContainer.parentElement) {
                        editorContainer.parentElement.appendChild(
                            richTextNotification,
                        );
                    }

                    return true;
                } else {
                    console.error(
                        "❌ Could not find editable element within the iframe.",
                    );
                }
            } catch (error) {
                console.error("❌ Error accessing iframe content:", error);
            }
        } else {
            console.log(
                "⚠️ No iframe found, looking for other editable elements",
            );
        }

        // If iframe approach failed, try other methods

        // Try finding the specific structure shown in the image
        const toxEditArea = element.querySelector(".tox-edit-area");
        if (toxEditArea) {
            console.log("🔍 Found tox-edit-area element");
            const toxEditAreaIframe = toxEditArea.querySelector("iframe");
            if (toxEditAreaIframe) {
                try {
                    const iframeDoc =
                        toxEditAreaIframe.contentDocument ||
                        toxEditAreaIframe.contentWindow.document;
                    const body = iframeDoc.body;
                    if (body) {
                        body.innerHTML = answer;
                        console.log("📝 Set content via tox-edit-area iframe");
                        return true;
                    }
                } catch (error) {
                    console.error(
                        "❌ Error accessing tox-edit-area iframe:",
                        error,
                    );
                }
            }
        }

        // Try direct contenteditable element
        const editableElement = element.querySelector(
            '[contenteditable="true"], [data-id*="question_input"], .tox-edit-area__iframe',
        );

        if (editableElement) {
            console.log("✅ Found direct contenteditable element");
            editableElement.innerHTML = answer;

            // Dispatch events
            const events = ["input", "change", "keyup", "blur"];
            events.forEach((eventType) => {
                editableElement.dispatchEvent(
                    new Event(eventType, { bubbles: true }),
                );
            });

            return true;
        }

        // Last resort - try to find any textarea
        const textarea = element.querySelector("textarea");
        if (textarea) {
            console.log("✅ Found textarea as last resort");
            textarea.value = answer;
            textarea.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
        }

        console.error("❌ Could not find any usable rich text editor element.");
        return false;
    }

    function selectMultipleChoiceAnswer(element, answer, isIncognito = false) {
        const answerElements = Array.from(
            element.querySelectorAll(
                'input[type="radio"], input[type="checkbox"], .answer-choice, .mcq-option, div[role="radio"], div[role="checkbox"], label',
            ),
        );

        // Find matching answer by checking both text content and LaTeX
        const matchingAnswer = answerElements.find((a) => {
            // Get regular text content
            const textContent = a.innerText?.trim() || "";

            // Get LaTeX content if exists
            const latexElement = a.querySelector('script[type="math/tex"]');
            const latexContent = latexElement
                ? latexElement.textContent.trim()
                : "";

            // Also check MathJax rendered content
            const mathjaxElement = a.querySelector(
                ".MathJax, .MathJax_Preview",
            );
            const mathjaxContent = mathjaxElement
                ? mathjaxElement.textContent.trim()
                : "";

            // Normalize content for comparison by removing whitespace and special characters
            const normalizeContent = (str) =>
                str.replace(/[\s×·∙•]+/g, "").replace(/\^(\d+)/g, "$1");

            const normalizedText = normalizeContent(textContent);
            const normalizedLatex = normalizeContent(latexContent);
            const normalizedMathJax = normalizeContent(mathjaxContent);
            const normalizedAnswer = normalizeContent(answer);

            // Compare normalized versions
            return (
                normalizedText.includes(normalizedAnswer) ||
                normalizedLatex.includes(normalizedAnswer) ||
                normalizedMathJax.includes(normalizedAnswer) ||
                // Handle special case for superscripts
                textContent.includes(answer.replace(/\^(\d+)/g, "$1")) ||
                // Handle LaTeX expressions
                (answer.includes("\\") &&
                    (normalizedText.includes(
                        normalizedAnswer.replace(/\\/g, ""),
                    ) ||
                        normalizedLatex.includes(
                            normalizedAnswer.replace(/\\/g, ""),
                        )))
            );
        });

        if (matchingAnswer) {
            // Click the input element or the label itself
            const input =
                matchingAnswer.querySelector("input") || matchingAnswer;
            input.click();

            if (!isIncognito) {
                matchingAnswer.classList.add("selected-answer");
            }
        }
    }

    function isMatchingQuestion(element) {
        return element.querySelectorAll("select").length > 0;
    }

    function isFillInTheBlankQuestion(element) {
        return element.querySelectorAll('input[type="text"]').length > 0;
    }

    function isCheckboxListQuestion(element) {
        return element.querySelectorAll('input[type="checkbox"]').length > 0;
    }

    function getMatchingPairsCount(element) {
        return element.querySelectorAll("select").length;
    }

    function handleMatchingQuestionSelection(element, answers) {
        const selects = element.querySelectorAll("select");
        selects.forEach((select, index) => {
            if (index < answers.length) {
                const answer = answers[index].trim().toLowerCase();
                const option = Array.from(select.options).find(
                    (opt) =>
                        opt.text.trim().toLowerCase().includes(answer) ||
                        answer.includes(opt.text.trim().toLowerCase()),
                );
                if (option) {
                    select.value = option.value;
                    select.dispatchEvent(
                        new Event("change", { bubbles: true }),
                    );
                }
            }
        });
    }

    function handleFillInTheBlankQuestion(element, answers) {
        const inputs = element.querySelectorAll('input[type="text"]');
        inputs.forEach((input, index) => {
            if (index < answers.length) {
                input.value = answers[index];
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
        });
        return inputs.length; // Return the number of blanks filled
    }

    function handleCheckboxListQuestion(element, answers) {
        const checkboxes = element.querySelectorAll('input[type="checkbox"]');
        let checkedCount = 0;
        checkboxes.forEach((checkbox, index) => {
            const label =
                checkbox.closest("label") || checkbox.nextElementSibling;
            if (label) {
                const labelText = label.textContent.trim().toLowerCase();
                const shouldBeChecked = answers.some(
                    (answer) =>
                        labelText.includes(answer.toLowerCase()) ||
                        answer.toLowerCase().includes(labelText),
                );
                if (shouldBeChecked) {
                    checkbox.checked = true;
                    checkbox.dispatchEvent(
                        new Event("change", { bubbles: true }),
                    );
                    checkedCount++;
                }
            }
        });
        return checkedCount;
    }

    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    function handleError(error, message) {
        console.error(error);
        showToast(message);
    }

    // --- Các hàm format hiển thị đáp án ---
    function formatMatchingAnswers(answers) {
        if (!answers || answers.length === 0)
            return "Đáp án: Không có đáp án cho câu hỏi ghép cặp.";
        let displayText = "Đáp án:\n";
        answers.forEach((answer, index) => {
            displayText += `Câu ${index + 1}: ${answer}\n`; // Mỗi cặp trên một dòng mới, có số thứ tự câu
        });
        return displayText.trim();
    }

    function formatFillInBlankAnswers(answers) {
        if (!answers || answers.length === 0)
            return "Đáp án: Không có đáp án cho câu hỏi điền vào chỗ trống.";
        let displayText = "Đáp án:\n"; // Bắt đầu bằng "Đáp án:" và xuống dòng
        answers.forEach((answer, index) => {
            displayText += `Ô ${index + 1}: ${answer}\n`; // Mỗi đáp án trên một dòng mới, có số thứ tự ô
        });
        return displayText.trim(); // Loại bỏ khoảng trắng và dòng trống cuối cùng
    }

    function formatCheckboxListAnswers(answers) {
        if (!answers || answers.length === 0)
            return "Đáp án: Không có đáp án cho câu hỏi checkbox.";
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
    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM đã được tải.");
        // handleQuestionReply(); - function not defined in provided code
    });

    console.log("🏁 Script đã tải xong.");

    // Hàm để xóa trạng thái tải (cần được đ "�nh nghĩa dựa trên cách trang web hiển thị trạng thái tải)
    function removeLoadingState(questionElement) {
        // Ví dụ: Nếu trạng thái tải là một class trên questionElement
        questionElement.classList.remove("loading");
        // Hoặc nếu là một phần tử con cụ thể
        const loadingIndicator =
            questionElement.querySelector(".loading-indicator");
        if (loadingIndicator) {
            loadingIndicator.remove();
        }

        // Sau khi xóa loading state, kiểm tra và click nút next-question
        clickNextQuestionButton();
    }
    // New function to save auto-submit preference
    function saveAutoSubmitPreference(autoSubmit) {
        localStorage.setItem("autoSubmitPreference", autoSubmit);
    }

    // New function to load auto-submit preference
    function loadAutoSubmitPreference() {
        const savedPreference = localStorage.getItem("autoSubmitPreference");
        return savedPreference === "true";
    }

    // New function to initialize the auto-submit checkbox
    function initializeAutoSubmitCheckbox() {
        const autoSubmitCheckbox =
            document.getElementById("autoSubmitCheckbox");
        if (autoSubmitCheckbox) {
            const savedPreference = loadAutoSubmitPreference();
            autoSubmitCheckbox.checked = savedPreference;

            autoSubmitCheckbox.addEventListener("change", function () {
                saveAutoSubmitPreference(this.checked);
            });
        }
    }

    // Call this function when the page loads
    document.addEventListener("DOMContentLoaded", initializeAutoSubmitCheckbox);

    // Modify your existing code to use the new auto-submit preference
    function yourExistingFunction() {
        const correctAnswers = ["answer1", "answer2", "answer3"]; // Replace with your actual answers
        const autoSubmit = loadAutoSubmitPreference();
        selectCorrectAnswers(correctAnswers, autoSubmit);
    }

    // Event listener for the select answers button
    document
        .getElementById("selectAnswersButton")
        .addEventListener("click", function () {
            const answersInput = document.getElementById("answersInput").value;
            const correctAnswers = answersInput
                .split(";")
                .map((answer) => answer.trim());
            const autoSubmit =
                document.getElementById("autoSubmitCheckbox").checked;
            selectCorrectAnswers(correctAnswers, autoSubmit);
        });
    function autoAnswerRandom() {
        try {
            const questionElements = document.querySelectorAll(
                ".question, .question-container, .quiz-item",
            );
            questionElements.forEach((element) => {
                if (isMatchingQuestion(element)) {
                    handleMatchingQuestionRandom(element);
                } else {
                    selectRandomMultipleChoiceAnswer(element);
                }
            });
            showToast("Random answers selected for all questions!");

            // Check if auto-submit is enabled and submit if it is
            if (document.getElementById("autoSubmitCheckbox").checked) {
                submitAnswers();
            }
        } catch (error) {
            handleError(
                error,
                "Failed to select random answers. Please try again.",
            );
        }
    }

    function handleMatchingQuestionRandom(element) {
        const selects = element.querySelectorAll("select");
        selects.forEach((select) => {
            const options = Array.from(select.options).filter(
                (option) => option.value !== "",
            );
            if (options.length > 0) {
                const randomOption =
                    options[Math.floor(Math.random() * options.length)];
                select.value = randomOption.value;
                select.dispatchEvent(new Event("change", { bubbles: true }));
            }
        });
    }

    function selectRandomMultipleChoiceAnswer(element) {
        const answers = Array.from(
            element.querySelectorAll(
                'input[type="radio"], input[type="checkbox"], .answer-choice, .mcq-option',
            ),
        );
        if (answers.length > 0) {
            const randomAnswer =
                answers[Math.floor(Math.random() * answers.length)];
            randomAnswer.click();
            randomAnswer.classList.add("selected-answer");
        }
    }

    function submitAnswers() {
        const submitButton = document.querySelector(
            ".btn.submit_button.quiz_submit.btn-primary",
        );
        if (submitButton) {
            submitButton.click();
        } else {
            showToast("Submit button not found. Please submit manually.");
        }
    }
    function toggleTheme() {
        document.body.classList.toggle("dark-mode");
        const isDarkMode = document.body.classList.contains("dark-mode");
        localStorage.setItem("quizHelperDarkMode", isDarkMode);
        showToast(`${isDarkMode ? "Dark" : "Light"} mode enabled`);
    }

    // New functionality for saving and loading answers
    function saveAnswers() {
        const answers = document.getElementById("answersInput").value;
        const blob = new Blob([answers], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "quiz_answers.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Answers saved and downloaded successfully!");

        // Also save to localStorage for auto-loading
        localStorage.setItem("quizHelperAnswers", answers);
    }

    function loadAnswers() {
        const savedAnswers = localStorage.getItem("quizHelperAnswers");
        if (savedAnswers) {
            document.getElementById("answersInput").value = savedAnswers;
            showToast("Answers loaded successfully!");
        } else {
            showToast("No saved answers found.");
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
                showToast("Time's up!");
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById("timerDisplay").textContent =
            `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    // Answer highlighting
    function highlightAnswers() {
        const answers = document
            .getElementById("answersInput")
            .value.split(";")
            .map((answer) => answer.trim().toLowerCase());
        const questionElements = document.querySelectorAll(
            ".question, .question-container, .quiz-item",
        );

        questionElements.forEach((element) => {
            const answerElements = element.querySelectorAll(
                ".answer, .answer-text, .option",
            );
            answerElements.forEach((answerElement) => {
                const answerText = answerElement.innerText.trim().toLowerCase();
                if (answers.some((answer) => answerText.includes(answer))) {
                    answerElement.style.backgroundColor = "yellow";
                    answerElement.style.fontWeight = "bold";
                }
            });
        });

        showToast("Answers highlighted!");
    }

    // Answer frequency analysis
    function analyzeAnswerFrequency() {
        const questionElements = document.querySelectorAll(
            ".question, .question-container, .quiz-item",
        );
        const frequencyMap = new Map();

        questionElements.forEach((element) => {
            const selectedAnswer = element.querySelector(
                "input:checked, select option:checked",
            );
            if (selectedAnswer) {
                const answerText =
                    selectedAnswer.value || selectedAnswer.textContent.trim();
                frequencyMap.set(
                    answerText,
                    (frequencyMap.get(answerText) || 0) + 1,
                );
            }
        });

        let analysisText = "Answer Frequency Analysis:\n\n";
        for (const [answer, frequency] of frequencyMap.entries()) {
            analysisText += `${answer}: ${frequency} time(s)\n`;
        }

        const popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.backgroundColor = "white";
        popup.style.padding = "20px";
        popup.style.border = "1px solid black";
        popup.style.zIndex = "10000";
        popup.innerHTML = `<h3>Answer Frequency Analysis</h3><pre>${analysisText}</pre><button id="closeAnalysis">Close</button>`;

        document.body.appendChild(popup);

        document
            .getElementById("closeAnalysis")
            .addEventListener("click", () => {
                document.body.removeChild(popup);
            });
    }

    // Farm functionality
    let isFarming = false;
    let farmCount = 0;
    let totalIterations = 0;
    let farmAI = false; // New variable to track "Farm with AI"

    // Debug counter for farming progress
    let debugStep = 0;

    // Function to completely stop farming - placeholder that will be overridden later
    async function stopFarmingCompletely() {
        console.log("🛑 Stopping farming...");
        isFarming = false;
        farmCount = 0;
        localStorage.removeItem("farmingState");
        showToast("Farming stopped!");
    }

    function showDebugProgress(step, message) {
        debugStep = step;
        const progressMsg = `🎯 [PROGRESS ${step}/2] ${message}`;
        console.log(progressMsg);
        showToast(`Progress ${step}/2: ${message}`);
    }

    // Firebase-based farming state persistence (per user)
    async function saveFarmingState() {
        const farmingState = {
            isFarming: isFarming,
            farmCount: farmCount,
            totalIterations: totalIterations,
            farmRandom: document.getElementById("farmRandom")?.checked || false,
            farmInput: document.getElementById("farmInput")?.checked || false,
            farmAI: document.getElementById("farmAI")?.checked || false,
            inputAnswers: document.getElementById("answersInput")?.value || "",
            debugStep: debugStep,
            timestamp: Date.now(),
            url: window.location.href
        };

        const result = await safeFirebaseCall(async (db) => {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.log("🔥 [FIREBASE] No user authenticated, cannot save farming state");
                return false;
            }

            await db.collection("user_farm_config").doc(user.uid).set({
                farmingState: farmingState,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log("💾 [FIREBASE] Farming state saved to Firebase:", farmingState);
            return true;
        }, false);

        if (!result) {
            // Fallback to localStorage if Firebase fails
            localStorage.setItem("farmingState", JSON.stringify(farmingState));
            console.log("💾 [FALLBACK] Farming state saved to localStorage:", farmingState);
        }
    }

    async function loadFarmingState() {
        // Try Firebase first
        const firebaseResult = await safeFirebaseCall(async (db) => {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.log("🔥 [FIREBASE] No user authenticated, cannot load farming state");
                return null;
            }

            const doc = await db.collection("user_farm_config").doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                console.log("✅ [FIREBASE] Farming state loaded from Firebase:", data.farmingState);
                return data.farmingState;
            } else {
                console.log("❌ [FIREBASE] No farming state found in Firebase");
                return null;
            }
        }, null);

        if (firebaseResult) {
            return firebaseResult;
        }

        // Fallback to localStorage
        try {
            const stateStr = localStorage.getItem("farmingState");
            console.log("📖 [FALLBACK] Checking localStorage farmingState:", stateStr);
            if (stateStr) {
                const state = JSON.parse(stateStr);
                console.log("✅ [FALLBACK] Farming state loaded from localStorage:", state);
                return state;
            }
        } catch (error) {
            console.error("🚨 [FALLBACK] Error loading farming state from localStorage:", error);
        }

        return null;
    }

    async function clearFarmingState() {
        // Clear from Firebase
        const firebaseResult = await safeFirebaseCall(async (db) => {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.log("🔥 [FIREBASE] No user authenticated, cannot clear farming state");
                return false;
            }

            await db.collection("user_farm_config").doc(user.uid).delete();
            console.log("🗑️ [FIREBASE] Farming state cleared from Firebase");
            return true;
        }, false);

        // Also clear localStorage fallback
        localStorage.removeItem("farmingState");
        console.log("🗑️ [FALLBACK] Farming state cleared from localStorage");
    }

    // Firebase safety wrapper to prevent "firebase.firestore is not a function" errors
    function safeFirebaseCall(callback, fallback = null) {
        try {
            // Check if Firebase is available and initialized
            if (typeof firebase === 'undefined') {
                console.log("🔥 [FIREBASE] Firebase not loaded yet, skipping operation");
                return fallback;
            }

            if (!firebase.firestore) {
                console.log("🔥 [FIREBASE] Firestore not available, skipping operation");
                return fallback;
            }

            // Try to call firestore to see if it's ready
            const db = firebase.firestore();
            if (!db) {
                console.log("🔥 [FIREBASE] Firestore not initialized, skipping operation");
                return fallback;
            }

            return callback(db);
        } catch (error) {
            console.log("🔥 [FIREBASE] Firebase error caught and handled:", error.message);
            return fallback;
        }
    }

    // Safe error handling for Firebase without overriding console
    function handleFirebaseError(error) {
        const errorMessage = error.toString();
        if (errorMessage.includes('firebase.firestore is not a function') ||
            errorMessage.includes('Error checking version') ||
            errorMessage.includes('Firebase')) {
            console.log("🔥 [FIREBASE] Firebase error handled safely:", errorMessage);
            return true; // Error was handled
        }
        return false; // Let other errors through
    }

    // Wrap window.onerror to catch Firebase errors globally (safer approach)
    const originalWindowError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
        if (handleFirebaseError(message)) {
            return true; // Prevent default error handling
        }
        if (originalWindowError) {
            return originalWindowError.call(this, message, source, lineno, colno, error);
        }
        return false;
    };

    // Test function for farming state persistence (Task 1)
    function testFarmingStatePersistence() {
        console.log("=== Testing Farming State Persistence ===");

        // Test 1: Save state
        console.log("Test 1: Saving farming state...");
        isFarming = true;
        farmCount = 5;
        totalIterations = 10;
        saveFarmingState();

        // Test 2: Load state
        console.log("Test 2: Loading farming state...");
        const loadedState = loadFarmingState();
        console.log("Loaded state:", loadedState);

        // Test 3: Verify state in localStorage
        console.log("Test 3: Checking localStorage directly...");
        const rawState = localStorage.getItem("farmingState");
        console.log("Raw localStorage data:", rawState);

        // Test 4: Clear state
        console.log("Test 4: Clearing farming state...");
        clearFarmingState();
        const clearedState = loadFarmingState();
        console.log("State after clearing:", clearedState);

        console.log("=== Test Complete ===");
        return "Farming state persistence test completed. Check console for results.";
    }

    // Expose test function to global scope for easy testing
    window.testFarmingStatePersistence = testFarmingStatePersistence;

    // Task 2: Page detection and auto-resume logic
    function isQuizStartPage() {
        // Check for start button on quiz start page
        const startButton = document.querySelector(".btn.btn-primary");
        console.log("🔍 [DEBUG] isQuizStartPage - Start button found:", startButton !== null);
        if (startButton) {
            console.log("🔍 [DEBUG] Start button text:", startButton.textContent);
        }
        return startButton !== null;
    }

    function isQuizPage() {
        // Check for quiz questions or submit button
        const questions = document.querySelectorAll(".question, [class*='question']");
        const submitButton = document.querySelector(".btn.submit_button.quiz_submit.btn-primary");
        console.log("🔍 [DEBUG] isQuizPage - Questions found:", questions.length);
        console.log("🔍 [DEBUG] isQuizPage - Submit button found:", submitButton !== null);
        return questions.length > 0 || submitButton !== null;
    }

    // Continuous farming check - always runs on page load
    async function continuousFarmingCheck() {
        console.log("🔄 [CONTINUOUS] Starting continuous farming check...");

        // Always check Firebase for farming state
        const farmingState = await loadFarmingState();
        console.log("🔄 [CONTINUOUS] Firebase farming state:", farmingState);

        if (!farmingState || !farmingState.isFarming) {
            console.log("❌ [CONTINUOUS] No active farming found - script idle");
            return;
        }

        console.log("✅ [CONTINUOUS] Active farming detected!");

        // Restore variables from Firebase state
        isFarming = farmingState.isFarming;
        farmCount = farmingState.farmCount || 0;
        totalIterations = farmingState.totalIterations || Infinity;

        console.log("🔄 [CONTINUOUS] Restored - farmCount:", farmCount, "totalIterations:", totalIterations);

        // Farming runs infinitely - no iteration limit check

        // Determine step based on URL
        const currentUrl = window.location.href;
        const isQuizTakePage = currentUrl.includes('/take');

        console.log("📍 [CONTINUOUS] URL:", currentUrl);
        console.log("📍 [CONTINUOUS] Has /take:", isQuizTakePage);

        if (isQuizTakePage) {
            // Step 2: On quiz page - do quiz and submit
            console.log("🎯 [CONTINUOUS] Step 2: Executing quiz...");
            showDebugProgress(2, `Step 2: Doing quiz (${farmCount + 1}/∞)`);

            // Use new IIFE logic instead of old handleQuizPage
            console.log("🔄 [CONTINUOUS] Delegating to IIFE auto-resume logic...");
            // The IIFE will handle this automatically

        } else {
            // Step 1: On start page - click start button
            console.log("🎯 [CONTINUOUS] Step 1: Clicking start button...");
            showDebugProgress(1, `Step 1: Starting quiz (${farmCount + 1}/∞)`);

            setTimeout(() => {
                const startButton = document.querySelector(".btn.btn-primary");
                if (startButton) {
                    console.log("✅ [CONTINUOUS] Start button found, clicking...");
                    startButton.click();
                } else {
                    console.log("❓ [CONTINUOUS] Start button not found, retrying...");
                    setTimeout(() => continuousFarmingCheck(), 2000);
                }
            }, 1000);
        }
    }

    // Keep old function name for compatibility
    const checkAndResumeFarming = continuousFarmingCheck;

    // Test function for Task 2
    function testPageDetection() {
        console.log("=== Testing Page Detection (Task 2) ===");
        console.log("Is quiz start page:", isQuizStartPage());
        console.log("Is quiz page:", isQuizPage());

        console.log("Testing auto-resume...");
        checkAndResumeFarming();

        return "Page detection test completed. Check console.";
    }

    // Expose test function
    window.testPageDetection = testPageDetection;

    // Check if Tampermonkey is installed
    const isTampermonkeyInstalled = typeof GM_info !== "undefined";

    document.addEventListener("DOMContentLoaded", (event) => {
        if (!isTampermonkeyInstalled) {
            alert(
                "This script requires the Tampermonkey extension to function properly. Please install Tampermonkey before using this feature.",
            );
            return;
        }

        // Initialize StudyAidX Invisible detection system
        initializeStudyAidXInvisibleDetection();

        // Load saved selections from localStorage
        const savedFarmRandom = localStorage.getItem("farmRandom") === "true";
        const savedFarmInput = localStorage.getItem("farmInput") === "true";
        const savedFarmAI = localStorage.getItem("farmAI") === "true"; // Load "Farm with AI"
        const savedTotalIterations = localStorage.getItem("totalIterations");
        const savedFarmCount = localStorage.getItem("farmCount");

        if (savedFarmRandom || savedFarmInput || savedFarmAI) {
            // Include savedFarmAI
            document.getElementById("farmRandom").checked = savedFarmRandom;
            document.getElementById("farmInput").checked = savedFarmInput;
            document.getElementById("farmAI").checked = savedFarmAI; // Set checkbox
        }

        // Removed iterationsInput element - farming runs infinitely
        totalIterations = Infinity;

        if (savedFarmCount) {
            farmCount = parseInt(savedFarmCount);
        }

        // Add event listeners to save selections when they change
        document
            .getElementById("farmRandom")
            .addEventListener("change", (event) => {
                localStorage.setItem("farmRandom", event.target.checked);
            });
        document
            .getElementById("farmInput")
            .addEventListener("change", (event) => {
                localStorage.setItem("farmInput", event.target.checked);
            });
        document
            .getElementById("farmAI")
            .addEventListener("change", (event) => {
                // Save "Farm with AI"
                localStorage.setItem("farmAI", event.target.checked);
            });
        // Removed iterationsInput event listener - element no longer exists

        // Add event listener for visibility changes (Corrected)
        document.addEventListener("visibilitychange", async function () {
            if (!isTampermonkeyInstalled) {
                return;
            }

            if (!document.hidden && isFarming) {
                // When the page becomes visible again, wait and then continue farming
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
                if (isFarming) {
                    // Double-check isFarming after the delay
                    await farmStep(); // Now correctly awaits farmStep
                }
            }
        });

        // Task 2: Always check Firebase for farming state and auto-execute
        console.log("🚀 [PAGE LOAD] DOMContentLoaded - Using IIFE safe check instead of continuousFarmingCheck");
        // Disabled continuousFarmingCheck to avoid conflict with IIFE safeCheckFarmConfig
        // The IIFE handles auto-resume farming more safely

        // Start farming automatically after a delay to ensure page is fully loaded
        // setTimeout(startFarming, 3000); // REMOVED THIS

        // StudyAidX initialization complete notification
        console.log("🎉 StudyAidX đã tải hoàn tất! Tất cả tính năng đã sẵn sàng sử dụng.");
        console.log("✅ StudyAidX initialization completed successfully!");

        // Now run StudyAidX Invisible detection after StudyAidX is fully loaded
        setTimeout(() => {
            runStudyAidXInvisibleDetectionAfterLoad();
        }, 1000);
    });

    async function startFarming() {
        if (!isTampermonkeyInstalled) {
            alert(
                "This script requires the Tampermonkey extension to function properly. Please install Tampermonkey before using this feature.",
            );
            return;
        }

        const farmRandom = document.getElementById("farmRandom").checked;
        const farmInput = document.getElementById("farmInput").checked;
        farmAI = document.getElementById("farmAI").checked; // Get "Farm with AI" state

        if (!farmRandom && !farmInput && !farmAI) {
            // Include farmAI
            showToast("Please select at least one farming method!");
            return;
        }

        // Set farming to run infinitely - no iteration limit
        totalIterations = Infinity;
        localStorage.setItem("totalIterations", totalIterations);

        isFarming = true;

        // Reset debug counter and show start
        debugStep = 0;
        showDebugProgress(1, "Started farming - clicking start button...");

        // Save farming state to localStorage and Firebase for auto-resume
        await saveFarmingState();

        // Only create config and save to Firebase, then reload page
        // Let the farming system automatically check Firebase and continue
        console.log("🔄 Reloading page to start farming system...");
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    async function farmStep() {
        if (!isFarming) return;

        // Farming runs infinitely - no iteration limit check

        // Check if we're on the menu page or quiz page
        const primaryButton = document.querySelector(".btn.btn-primary");
        if (primaryButton) {
            // We're on the menu page, start a new quiz
            primaryButton.click();
            // Wait for 1 second before handling the quiz page
            setTimeout(async () => await performQuizFarming(), 500);
        } else {
            // We might be on the quiz page already
            await performQuizFarming();
        }
    }

    // handleQuizPage function removed - replaced by IIFE performQuizFarming logic
    // This prevents duplicate farming logic conflicts

    // Old stopFarming function removed - using stopFarmingCompletely() instead

    // Add this function to handle visibility changes
    document.addEventListener("visibilitychange", function () {
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
        console.warn(
            "This script requires the Tampermonkey extension to function properly. Please install Tampermonkey before using this feature.",
        );
    }

    // Event listeners
    document
        .getElementById("extractButton")
        .addEventListener("click", extractQuizAnswers);
    document
        .getElementById("selectAnswersButton")
        .addEventListener("click", () => {
            const answers = document.getElementById("answersInput").value;
            if (answers) {
                const answersArray = answers
                    .split(";")
                    .map((answer) => answer.trim());
                selectCorrectAnswers(answersArray);
            } else {
                showToast("Please enter answers before selecting.");
            }
        });
    document
        .getElementById("autoAnswerButton")
        .addEventListener("click", autoAnswerRandom);
    document
        .getElementById("toggleThemeButton")
        .addEventListener("click", toggleTheme);
    document
        .getElementById("minimizeButton")
        .addEventListener("click", toggleMinimize);
    document
        .getElementById("saveAnswersButton")
        .addEventListener("click", saveAnswers);
    document
        .getElementById("loadAnswersButton")
        .addEventListener("click", loadAnswers);
    document
        .getElementById("startTimerButton")
        .addEventListener("click", () => {
            const duration = parseInt(
                document.getElementById("timerInput").value,
            );
            if (duration > 0) {
                startTimer(duration);
            } else {
                showToast("Please enter a valid duration.");
            }
        });
    document
        .getElementById("highlightAnswersButton")
        .addEventListener("click", highlightAnswers);
    document
        .getElementById("analyzeAnswersButton")
        .addEventListener("click", analyzeAnswerFrequency);
    document.getElementById("startFarmButton").addEventListener("click", async () => {
        if (isFarming) {
            await stopFarmingCompletely();
        } else {
            await startFarming();
        }
    });

    const answersInput = document.getElementById("answersInput");
    answersInput.addEventListener("paste", (e) => {
        e.stopPropagation();
    });

    document.getElementById("copyButton").addEventListener("click", () => {
        const content =
            document.getElementById("extractionContent").textContent;
        const instruction =
            "\n\nĐưa đáp án cho các câu hỏi, mỗi đáp án cách nhau bằng dấu chấm phẩy (;). Chỉ ghi đúng nội dung đáp án, không thêm bất kỳ từ nào khác. Tất cả đáp án phải nằm trên một dòng duy nhất, không xuống dòng. Ví dụ: Cả hai đáp án đúng; Trồng lúa lấy gạo để xuất khẩu; Sử dụng thuốc hóa học; Cả 3 đáp án; Tăng diện tích đất trồng";
        navigator.clipboard
            .writeText(content + instruction)
            .then(() => {
                showToast("Content copied to clipboard!");
            })
            .catch((err) => {
                console.error("Failed to copy text: ", err);
                showToast("Failed to copy content. Please try again.");
            });
    });

    document.getElementById("closeButton").addEventListener("click", () => {
        document.getElementById("extractionPopup").style.display = "none";
    });

    // Function to initialize the menu state from local storage
    function initializeMenuState() {
        const menu = document.getElementById("quizHelperMenu");
        const menuState = localStorage.getItem("quizHelperMenuState");

        if (menuState === "none") {
            menu.style.display = "none";
        } else {
            menu.style.display = "block";
        }
    }

    // Function to update the menu state in local storage
    function updateMenuState(isVisible) {
        const menu = document.getElementById("quizHelperMenu");
        menu.style.display = isVisible ? "block" : "none";
        localStorage.setItem(
            "quizHelperMenuState",
            isVisible ? "block" : "none",
        );
        showToast(isVisible ? "StudyAidX opened" : "StudyAidX hidden");
    }

    // Event listener for keyboard shortcuts - Ctrl+Q functionality removed
    document.addEventListener("keydown", function (event) {
        if (event.ctrlKey && event.key.toLowerCase() === "q") {
            event.preventDefault();
            const incognitoToggle = document.getElementById(
                "incognitoModeToggle",
            );
            if (incognitoToggle) {
                incognitoToggle.checked = !incognitoToggle.checked;
                localStorage.setItem("incognitoMode", incognitoToggle.checked);
                updateIncognitoMode(incognitoToggle.checked, true); // Pass true to skip alert
            }
        }
    });

    // Initialize the menu state when the page loads
    document.addEventListener("DOMContentLoaded", initializeMenuState);
    // Initialize theme
    const savedTheme = localStorage.getItem("quizHelperDarkMode");
    if (savedTheme === "true") {
        document.body.classList.add("dark-mode");
    }

    // Accessibility improvements
    function improveAccessibility() {
        const menu = document.getElementById("quizHelperMenu");
        menu.setAttribute("role", "region");
        menu.setAttribute("aria-label", "StudyAidX Menu");

        const buttons = menu.querySelectorAll("button");
        buttons.forEach((button) => {
            if (!button.getAttribute("aria-label")) {
                button.setAttribute("aria-label", button.textContent.trim());
            }
        });

        const input = document.getElementById("answersInput");
        input.setAttribute("aria-label", "Enter correct answers");
    }

    // Call accessibility improvements
    improveAccessibility();

    // Auto-load answers when the script runs
    loadAnswers();

    // Function to automatically click the next question button
    function clickNextQuestionButton() {
        setTimeout(() => {
            const nextButton = document.querySelector(
                "button.submit_button.next-question.btn-primary",
            );
            if (nextButton) {
                console.log("Tự động click nút next-question");
                nextButton.click();
                showToast("Đã tự động chuyển sang câu hỏi tiếp theo!");
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
            formattedAnswer = formattedAnswer.replace(/[*_#]/g, "");

            // Remove any analysis sections
            if (formattedAnswer.includes("Analysis")) {
                formattedAnswer = formattedAnswer.split("Analysis")[0];
            }

            // Remove any conclusion sections
            if (formattedAnswer.includes("Conclusion")) {
                formattedAnswer = formattedAnswer.split("Conclusion")[0];
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
                console.error("Both AI results must be set before comparison");
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
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Compare results and make decision
                    const comparison = this.compareResultQuality();
                    resolve({
                        acceptsAI2Result: comparison.ai2Better,
                        reason: comparison.reason,
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
                reason:
                    ai2Score > ai1Score
                        ? "AI2 result appears more accurate"
                        : "AI1 result maintains better quality",
            };
        }

        evaluateResult(result) {
            // Implement result evaluation logic
            // This is a placeholder for actual evaluation logic
            let score = 0;
            if (result && typeof result === "object") {
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
                if (typeof obj[key] === "object" && obj[key] !== null) {
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
            const questions = document.querySelectorAll(".question-container");
            questions.forEach((question) => {
                if (!question.querySelector(".reply-button")) {
                    const replyButton = document.createElement("button");
                    replyButton.className = "reply-button";
                    replyButton.innerHTML = "Reply";
                    replyButton.dataset.questionId = question.id;
                    question.appendChild(replyButton);
                }
            });
        }

        setupEventListeners() {
            // Listen for reply button clicks
            document.addEventListener("click", async (e) => {
                if (e.target.classList.contains("reply-button")) {
                    const questionId = e.target.dataset.questionId;
                    const questionContainer =
                        document.getElementById(questionId);

                    if (!questionContainer.querySelector(".reply-form")) {
                        this.createReplyForm(questionContainer);
                    }
                }
            });

            // Listen for form submissions
            document.addEventListener("submit", async (e) => {
                if (e.target.classList.contains("reply-form")) {
                    e.preventDefault();
                    const questionId = e.target.dataset.questionId;
                    const replyContent =
                        e.target.querySelector(".reply-input").value;
                    await this.submitReply(questionId, replyContent);
                }
            });
        }

        createReplyForm(questionContainer) {
            const form = document.createElement("form");
            form.className = "reply-form";
            form.dataset.questionId = questionContainer.id;

            const input = document.createElement("textarea");
            input.className = "reply-input";
            input.placeholder = "Type your reply here...";

            const submitButton = document.createElement("button");
            submitButton.type = "submit";
            submitButton.innerHTML = "Submit Reply";

            form.appendChild(input);
            form.appendChild(submitButton);
            questionContainer.appendChild(form);
        }

        async submitReply(questionId, content) {
            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    alert("Please sign in to reply to questions.");
                    return;
                }

                await this.db.collection("replies").add({
                    questionId: questionId,
                    content: content,
                    userId: user.uid,
                    userName: user.displayName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                });

                // Clear form and show success message
                const form = document.querySelector(
                    `form[data-question-id="${questionId}"]`,
                );
                if (form) {
                    form.querySelector(".reply-input").value = "";
                    this.showToast("Reply submitted successfully!");
                }

                // Refresh replies
                await this.loadReplies(questionId);
            } catch (error) {
                console.error("Error submitting reply:", error);
                this.showToast("Error submitting reply. Please try again.");
            }
        }

        async loadReplies(questionId) {
            try {
                const replies = await this.db
                    .collection("replies")
                    .where("questionId", "==", questionId)
                    .orderBy("timestamp", "desc")
                    .get();

                const repliesContainer = document.createElement("div");
                repliesContainer.className = "replies-container";

                replies.forEach((reply) => {
                    const replyData = reply.data();
                    const replyElement = document.createElement("div");
                    replyElement.className = "reply";
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
                const existingReplies =
                    questionContainer.querySelector(".replies-container");
                if (existingReplies) {
                    existingReplies.replaceWith(repliesContainer);
                } else {
                    questionContainer.appendChild(repliesContainer);
                }
            } catch (error) {
                console.error("Error loading replies:", error);
                this.showToast("Error loading replies. Please try again.");
            }
        }

        showToast(message) {
            const toast = document.createElement("div");
            toast.className = "toast";
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
    }

    console.log("StudyAidX initialized successfully!");
})();

// SAFE FIREBASE CHECK ON EVERY PAGE LOAD
console.log("🚀 [SAFE CHECK] Script loaded - will check Firebase farm config safely...");

// Safe Firebase check that won't crash
(function () {
    console.log("🚀 [SAFE] Starting safe Firebase farm check...");

    // Flag to prevent multiple farming executions
    let farmingAlreadyTriggered = false;

    // Firebase safety wrapper to prevent "firebase.firestore is not a function" errors
    function safeFirebaseCall(callback, fallback = null) {
        try {
            // Check if Firebase is available and initialized
            if (typeof firebase === 'undefined') {
                console.log("🔥 [FIREBASE] Firebase not loaded yet, skipping operation");
                return fallback;
            }

            if (!firebase.firestore) {
                console.log("🔥 [FIREBASE] Firestore not available, skipping operation");
                return fallback;
            }

            // Try to call firestore to see if it's ready
            const db = firebase.firestore();
            if (!db) {
                console.log("🔥 [FIREBASE] Firestore not initialized, skipping operation");
                return fallback;
            }

            return callback(db);
        } catch (error) {
            console.log("🔥 [FIREBASE] Firebase error caught and handled:", error.message);
            return fallback;
        }
    }

    // Function to show toast notification
    function showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) {
            const newToast = document.createElement("div");
            newToast.id = "toast";
            newToast.className = "toast-notification";
            document.body.appendChild(newToast);
        }

        const toastElement = document.getElementById("toast");
        toastElement.textContent = message;
        toastElement.classList.add("show");

        setTimeout(() => {
            toastElement.classList.remove("show");
        }, 3000);
    }

    // Function to show stop farm button
    function showStopFarmButton() {
        // Check if button already exists
        if (document.getElementById("stopFarmButton")) {
            return; // Button already exists
        }

        console.log("🛑 [SAFE] Creating stop farm button...");

        // Create stop farm button
        const stopButton = document.createElement("button");
        stopButton.id = "stopFarmButton";
        stopButton.innerHTML = "🛑 STOP FARM";
        stopButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(45deg, #ff4444, #cc0000);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
            transition: all 0.3s ease;
            font-family: Arial, sans-serif;
        `;

        // Add hover effects
        stopButton.addEventListener("mouseenter", () => {
            stopButton.style.transform = "scale(1.05)";
            stopButton.style.boxShadow = "0 6px 16px rgba(255, 68, 68, 0.4)";
        });

        stopButton.addEventListener("mouseleave", () => {
            stopButton.style.transform = "scale(1)";
            stopButton.style.boxShadow = "0 4px 12px rgba(255, 68, 68, 0.3)";
        });

        // Add click handler
        stopButton.addEventListener("click", async () => {
            console.log("🛑 [SAFE] Stop farm button clicked!");

            // Show confirmation
            if (confirm("🛑 Are you sure you want to STOP FARMING?\\n\\nThis will:\\n• Stop all farming activities\\n• Clear all farm configurations\\n• Remove farming state from Firebase\\n\\nClick OK to confirm.")) {
                await stopFarmingCompletely();
            }
        });

        // Add button to page
        document.body.appendChild(stopButton);
        console.log("✅ [SAFE] Stop farm button created and added to page");
    }

    // Function to completely stop farming and clear all configs
    async function stopFarmingCompletely() {
        try {
            console.log("🛑 [SAFE] Starting complete farming stop process...");

            // Show loading state on button
            const stopButton = document.getElementById("stopFarmButton");
            if (stopButton) {
                stopButton.innerHTML = "⏳ STOPPING...";
                stopButton.disabled = true;
            }

            // Clear Firebase farm config
            const result = await safeFirebaseCall(async (db) => {
                const user = firebase.auth().currentUser;
                if (!user) {
                    console.log("❌ [SAFE] No user authenticated for stop farming");
                    return false;
                }

                console.log("🔥 [SAFE] Clearing farm config from Firebase...");

                // Delete the entire farm config document
                await db.collection("user_farm_config").doc(user.uid).delete();

                console.log("✅ [SAFE] Farm config cleared from Firebase");
                return true;
            }, false);

            // Clear localStorage farming data
            console.log("🗑️ [SAFE] Clearing farming data from localStorage...");
            localStorage.removeItem("farmingState");
            localStorage.removeItem("farmingAnswers");
            localStorage.removeItem("farmCount");
            localStorage.removeItem("isFarming");

            // Clear any other farming-related localStorage items
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes("farm") || key.includes("Farm"))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            console.log("✅ [SAFE] localStorage farming data cleared");

            // Remove stop farm button
            if (stopButton) {
                stopButton.remove();
            }

            // Show success message
            showToast("🛑 FARMING STOPPED SUCCESSFULLY!\\n✅ All farm configurations cleared");

            console.log("🎉 [SAFE] Farming stopped completely!");

            // Reload page after 2 seconds to ensure clean state
            setTimeout(() => {
                console.log("🔄 [SAFE] Reloading page to ensure clean state...");
                location.reload();
            }, 2000);

        } catch (error) {
            console.error("❌ [SAFE] Error stopping farming:", error);

            // Reset button state
            const stopButton = document.getElementById("stopFarmButton");
            if (stopButton) {
                stopButton.innerHTML = "🛑 STOP FARM";
                stopButton.disabled = false;
            }

            showToast("❌ Error stopping farming. Please try again.");
        }
    }

    // Function to perform quiz farming based on Firebase config
    async function performQuizFarming(firebaseConfig = null) {
        try {
            let farmingMethod = "random"; // default fallback

            // Determine farming method from Firebase config first
            if (firebaseConfig) {
                console.log("🔥 [SAFE] Using Firebase config:", firebaseConfig);

                if (firebaseConfig.farmAI === true) {
                    farmingMethod = "ai";
                } else if (firebaseConfig.farmInput === true) {
                    farmingMethod = "input";
                } else if (firebaseConfig.farmRandom === true) {
                    farmingMethod = "random";
                }
            } else {
                // Fallback to localStorage if no Firebase config
                const farmingState = JSON.parse(localStorage.getItem("farmingState") || "{}");
                farmingMethod = farmingState.method || "random";
            }

            console.log("🎯 [SAFE] Performing quiz farming with method:", farmingMethod);

            // Perform farming based on method using existing functions
            if (farmingMethod === "random") {
                console.log("🎲 [SAFE] Using existing autoAnswerRandom function...");
                if (typeof autoAnswerRandom === 'function') {
                    autoAnswerRandom();
                } else {
                    console.log("❌ [SAFE] autoAnswerRandom function not found, using fallback");
                    performRandomFarming();
                }
            } else if (farmingMethod === "input") {
                // Get answers from Firebase config first, then fallback to localStorage
                let savedAnswers = null;
                if (firebaseConfig && firebaseConfig.inputAnswers) {
                    savedAnswers = firebaseConfig.inputAnswers;
                    console.log("📝 [SAFE] Using answers from Firebase config");
                } else {
                    savedAnswers = localStorage.getItem("farmingAnswers");
                    console.log("📝 [SAFE] Using answers from localStorage");
                }

                if (savedAnswers) {
                    console.log("📝 [SAFE] Using existing selectCorrectAnswers function...");
                    const answersArray = savedAnswers.split(";").map(answer => answer.trim());
                    if (typeof selectCorrectAnswers === 'function') {
                        selectCorrectAnswers(answersArray);
                    } else {
                        console.log("❌ [SAFE] selectCorrectAnswers function not found, using fallback");
                        performInputFarming(savedAnswers);
                    }
                } else {
                    console.log("❌ [SAFE] No saved answers found for input farming, using random");
                    if (typeof autoAnswerRandom === 'function') {
                        autoAnswerRandom();
                    } else {
                        performRandomFarming();
                    }
                }
            } else if (farmingMethod === "ai") {
                console.log("🤖 [SAFE] Using existing selectAnswersWithAI function...");

                // Try multiple ways to access the AI function
                let aiFunction = null;
                if (typeof selectAnswersWithAI === 'function') {
                    aiFunction = selectAnswersWithAI;
                } else if (typeof window.selectAnswersWithAI === 'function') {
                    aiFunction = window.selectAnswersWithAI;
                } else if (window.parent && typeof window.parent.selectAnswersWithAI === 'function') {
                    aiFunction = window.parent.selectAnswersWithAI;
                }

                if (aiFunction) {
                    console.log("✅ [SAFE] AI function found, executing...");
                    try {
                        console.log("⏳ [SAFE] Starting AI processing, please wait...");
                        await aiFunction();
                        console.log("✅ [SAFE] AI function completed successfully");

                        // Wait additional time to ensure AI has finished selecting answers
                        console.log("⏳ [SAFE] Waiting for AI to finish selecting answers...");
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 more seconds

                        console.log("✅ [SAFE] AI processing complete, ready to submit");
                    } catch (error) {
                        console.error("❌ [SAFE] AI function failed:", error);
                        console.log("🔄 [SAFE] Falling back to random farming");
                        if (typeof autoAnswerRandom === 'function') {
                            autoAnswerRandom();
                        } else {
                            performRandomFarming();
                        }
                    }
                } else {
                    console.log("❌ [SAFE] selectAnswersWithAI function not accessible, trying alternative approach...");

                    // Alternative approach: Trigger AI button click
                    try {
                        const aiButton = document.getElementById("aiAnswerButton");
                        if (aiButton) {
                            console.log("✅ [SAFE] Found AI button, clicking it...");
                            aiButton.click();

                            // Wait for AI processing to complete
                            console.log("⏳ [SAFE] Waiting for AI processing via button click...");
                            await new Promise(resolve => setTimeout(resolve, 8000)); // Wait 8 seconds for AI to complete

                            console.log("✅ [SAFE] AI processing via button click completed");
                        } else {
                            console.log("❌ [SAFE] AI button not found, using random fallback");
                            if (typeof autoAnswerRandom === 'function') {
                                autoAnswerRandom();
                            } else {
                                performRandomFarming();
                            }
                        }
                    } catch (error) {
                        console.error("❌ [SAFE] AI button click failed:", error);
                        console.log("🔄 [SAFE] Falling back to random farming");
                        if (typeof autoAnswerRandom === 'function') {
                            autoAnswerRandom();
                        } else {
                            performRandomFarming();
                        }
                    }
                }
            } else {
                console.log("🎯 [SAFE] Unknown method, using random farming");
                if (typeof autoAnswerRandom === 'function') {
                    autoAnswerRandom();
                } else {
                    performRandomFarming();
                }
            }

            // Submit the quiz after selecting answers
            setTimeout(() => {
                submitQuiz();
            }, 2000);

        } catch (error) {
            console.error("❌ [SAFE] Error in performQuizFarming:", error);
            // Fallback to random farming using existing function
            if (typeof autoAnswerRandom === 'function') {
                autoAnswerRandom();
            } else {
                performRandomFarming();
            }
            setTimeout(() => {
                submitQuiz();
            }, 2000);
        }
    }

    // Random farming implementation
    function performRandomFarming() {
        console.log("🎲 [SAFE] Performing random farming...");
        const questions = document.querySelectorAll(".question");

        questions.forEach((question, index) => {
            const answers = question.querySelectorAll("input[type='radio'], input[type='checkbox']");
            if (answers.length > 0) {
                const randomIndex = Math.floor(Math.random() * answers.length);
                answers[randomIndex].checked = true;
                console.log(`✅ [SAFE] Question ${index + 1}: Selected random answer ${randomIndex + 1}`);
            }
        });
    }

    // Input-based farming implementation
    function performInputFarming(answersString) {
        console.log("📝 [SAFE] Performing input farming...");
        const answersArray = answersString.split(";").map(answer => answer.trim());
        const questions = document.querySelectorAll(".question");

        questions.forEach((question, index) => {
            if (index < answersArray.length) {
                const targetAnswer = answersArray[index];
                const answers = question.querySelectorAll("input[type='radio'], input[type='checkbox']");

                // Try to find matching answer by text content
                let found = false;
                answers.forEach((answer) => {
                    const label = answer.closest("label") || answer.parentElement;
                    if (label && label.textContent.trim().includes(targetAnswer)) {
                        answer.checked = true;
                        found = true;
                        console.log(`✅ [SAFE] Question ${index + 1}: Selected answer "${targetAnswer}"`);
                    }
                });

                if (!found) {
                    // Fallback to first answer if no match found
                    if (answers.length > 0) {
                        answers[0].checked = true;
                        console.log(`⚠️ [SAFE] Question ${index + 1}: No match found, selected first answer`);
                    }
                }
            }
        });
    }

    // AI farming implementation (simplified)
    async function performAIFarming() {
        console.log("🤖 [SAFE] Performing AI farming...");
        // This is a simplified version - in reality you'd need to call the AI service
        // For now, fallback to random farming
        performRandomFarming();
    }

    // Submit quiz function
    function submitQuiz() {
        console.log("📤 [SAFE] Attempting to submit quiz...");
        const submitButton = document.querySelector(".btn.submit_button.quiz_submit.btn-primary");

        if (submitButton) {
            console.log("✅ [SAFE] Submit button found, clicking...");
            submitButton.click();

            // Update farm count
            const currentCount = parseInt(localStorage.getItem("farmCount") || "0");
            localStorage.setItem("farmCount", (currentCount + 1).toString());

            showToast("🎯 Quiz submitted successfully!");
        } else {
            console.log("❌ [SAFE] Submit button not found");
            showToast("❌ Submit button not found");
        }
    }

    const safeCheckFarmConfig = async () => {
        console.log("🔥 [SAFE] Attempting safe Firebase check...");

        // Use existing safeFirebaseCall wrapper to prevent crashes
        const result = await safeFirebaseCall(async (db) => {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.log("❌ [SAFE] No user authenticated");
                return null;
            }

            console.log("🔥 [SAFE] User authenticated, checking farm config...");

            const doc = await db.collection("user_farm_config").doc(user.uid).get();

            if (doc.exists) {
                const data = doc.data();
                console.log("🔥 [SAFE] Farm config found:", data);

                if (data.farmingState && data.farmingState.isFarming) {
                    console.log("🎯 [SAFE] ACTIVE FARMING DETECTED!");

                    const currentUrl = window.location.href;
                    const isQuizTakePage = currentUrl.includes('/take');

                    console.log("📍 [SAFE] URL:", currentUrl);
                    console.log("📍 [SAFE] Has /take:", isQuizTakePage);

                    // Show toast and perform actual farming actions
                    if (isQuizTakePage) {
                        console.log("✅ [SAFE] Step 2: Should do quiz!");
                        showToast("🎯 FARMING ACTIVE - Step 2: Doing quiz!");

                        // Show stop farm button when farming is active
                        showStopFarmButton();

                        // Actually perform quiz farming (only once)
                        if (!farmingAlreadyTriggered) {
                            farmingAlreadyTriggered = true;
                            setTimeout(() => {
                                console.log("🎯 [SAFE] Executing Step 2: Doing quiz...");
                                performQuizFarming(data.farmingState);
                            }, 1000);
                        } else {
                            console.log("⚠️ [SAFE] Farming already triggered, skipping duplicate execution");
                        }
                    } else {
                        console.log("✅ [SAFE] Step 1: Should click start!");
                        showToast("🎯 FARMING ACTIVE - Step 1: Clicking start!");

                        // Show stop farm button when farming is active
                        showStopFarmButton();

                        // Actually click the start button
                        setTimeout(() => {
                            console.log("🎯 [SAFE] Executing Step 1: Clicking start button...");
                            const startButton = document.querySelector(".btn.btn-primary");
                            if (startButton) {
                                console.log("✅ [SAFE] Start button found, clicking...");
                                startButton.click();
                            } else {
                                console.log("❌ [SAFE] Start button not found");
                            }
                        }, 1000);
                    }

                    return true;
                } else {
                    console.log("❌ [SAFE] No active farming");
                    return false;
                }
            } else {
                console.log("❌ [SAFE] No farm config found");
                return false;
            }
        }, null);

        if (result === null) {
            console.log("🔥 [SAFE] Firebase not ready yet");
        }

        return result;
    };

    // Try checking with delays
    setTimeout(() => {
        console.log("🔄 [SAFE] First check attempt...");
        safeCheckFarmConfig();
    }, 2000);

    setTimeout(() => {
        console.log("🔄 [SAFE] Second check attempt...");
        safeCheckFarmConfig();
    }, 5000);

    setTimeout(() => {
        console.log("🔄 [SAFE] Final check attempt...");
        safeCheckFarmConfig();
    }, 10000);


    // Message types - matching extension
    const MessageTypes = {
        DEBUG: 'canvas-quiz-loader-debug',
        PING: 'canvas-quiz-loader-ping',
        PONG: 'canvas-quiz-loader-pong'
    };

    // Silent mode - no visual styling

    // Debug logging system
    let debugLogs = [];

    function addDebugLog(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message,
            data: data ? JSON.stringify(data, null, 2) : null,
            url: window.location.href
        };
        debugLogs.push(logEntry);
        console.log(`[StudyAidX Debug] ${timestamp}: ${message}`, data || '');

        // Keep only last 100 logs
        if (debugLogs.length > 100) {
            debugLogs = debugLogs.slice(-100);
        }
    }

    // Get Canvas ENV data like extension
    function getCanvasEnv() {
        return new Promise((resolve) => {
            // Try to get ENV directly
            if (window.ENV) {
                addDebugLog('Canvas ENV found directly', window.ENV);
                resolve(window.ENV);
                return;
            }

            // Listen for custom event (like extension's injectable script)
            const handleEnvEvent = (event) => {
                addDebugLog('Canvas ENV received via event', event.detail);
                window.removeEventListener('quizEnv', handleEnvEvent);
                resolve(event.detail);
            };

            window.addEventListener('quizEnv', handleEnvEvent);

            // Inject script to dispatch ENV (like extension)
            const script = document.createElement('script');
            script.textContent = 'window.dispatchEvent(new CustomEvent("quizEnv", { detail: window.ENV }));';
            document.head.appendChild(script);
            document.head.removeChild(script);

            // Fallback timeout
            setTimeout(() => {
                window.removeEventListener('quizEnv', handleEnvEvent);
                addDebugLog('Canvas ENV timeout, using fallback');
                resolve(null);
            }, 1000);
        });
    }

    // Storage key generation matching extension pattern
    function getStorageKey() {
        const url = window.location.href;
        const courseMatch = url.match(/\/courses\/(\d+)/);
        const quizMatch = url.match(/\/quizzes\/(\d+)/);

        if (courseMatch && quizMatch) {
            return `canvas_quiz_${courseMatch[1]}_${quizMatch[1]}`;
        }
        return null;
    }

    // Question parsing - comprehensive like extension
    function parseQuestions() {
        const questions = {};
        addDebugLog('Starting question parsing');

        // Find all question containers
        const questionElements = document.querySelectorAll('.question, [class*="question"]');
        addDebugLog(`Found ${questionElements.length} question elements`);

        questionElements.forEach((questionEl, index) => {
            const questionId = questionEl.id || `question_${index}`;
            const questionData = {
                id: questionId,
                type: 'unknown',
                element: questionEl
            };

            // Determine question type and extract data
            const radioInputs = questionEl.querySelectorAll('input[type="radio"]');
            const checkboxInputs = questionEl.querySelectorAll('input[type="checkbox"]');
            const textInputs = questionEl.querySelectorAll('input[type="text"], textarea');
            const selectElements = questionEl.querySelectorAll('select');

            if (radioInputs.length > 0) {
                questionData.type = 'multiple_choice_question';
                questionData.answers = Array.from(radioInputs).map(input => ({
                    id: input.value,
                    text: getAnswerText(input),
                    selected: input.checked
                }));
            } else if (checkboxInputs.length > 0) {
                questionData.type = 'multiple_answers_question';
                questionData.answers = Array.from(checkboxInputs).map(input => ({
                    id: input.value,
                    text: getAnswerText(input),
                    selected: input.checked
                }));
            } else if (textInputs.length > 0) {
                if (textInputs.length === 1) {
                    questionData.type = 'essay_question';
                    questionData.answer = textInputs[0].value;
                } else {
                    questionData.type = 'fill_in_multiple_blanks_question';
                    questionData.answers = {};
                    textInputs.forEach(input => {
                        if (input.name) {
                            questionData.answers[input.name] = input.value;
                        }
                    });
                }
            } else if (selectElements.length > 0) {
                questionData.type = 'matching_question';
                questionData.answers = Array.from(selectElements).map(select => ({
                    id: select.name,
                    value: select.value
                }));
            }

            questions[questionId] = questionData;
            addDebugLog(`Parsed question ${questionId}`, questionData);
        });

        return questions;
    }

    // Get answer text from input element
    function getAnswerText(input) {
        const label = input.closest('label') ||
            input.parentElement.querySelector('label') ||
            input.nextElementSibling;

        if (label) {
            return label.textContent.trim();
        }

        // Try to find answer text in parent elements
        let parent = input.parentElement;
        while (parent && parent !== document.body) {
            const text = parent.textContent.trim();
            if (text && text.length < 500) { // Reasonable answer length
                return text;
            }
            parent = parent.parentElement;
        }

        return input.value || 'Unknown answer';
    }

    // Save quiz data like extension
    function saveQuizData() {
        const storageKey = getStorageKey();
        if (!storageKey) {
            addDebugLog('Cannot save: no storage key');
            return;
        }

        const questions = parseQuestions();
        const hasAnswers = Object.values(questions).some(q => {
            if (q.type === 'multiple_choice_question' || q.type === 'multiple_answers_question') {
                return q.answers.some(a => a.selected);
            } else if (q.type === 'essay_question') {
                return q.answer && q.answer.trim();
            } else if (q.type === 'fill_in_multiple_blanks_question') {
                return Object.values(q.answers).some(a => a && a.trim());
            }
            return false;
        });

        if (hasAnswers) {
            GM_setValue(storageKey, JSON.stringify(questions));
            addDebugLog('Quiz data saved', { key: storageKey, questions });
            console.log('StudyAidX: Quiz answers saved successfully');
        } else {
            addDebugLog('No answers to save');
        }
    }

    // Load and apply saved answers like extension
    function loadSavedAnswers() {
        const storageKey = getStorageKey();
        if (!storageKey) {
            addDebugLog('Cannot load: no storage key');
            return;
        }

        const savedData = GM_getValue(storageKey);
        if (!savedData) {
            addDebugLog('No saved data found');
            return;
        }

        try {
            const savedQuestions = JSON.parse(savedData);
            addDebugLog('Loaded saved data', savedQuestions);

            Object.keys(savedQuestions).forEach(questionId => {
                const savedQuestion = savedQuestions[questionId];
                const currentElement = document.getElementById(questionId) ||
                    document.querySelector(`[data-question-id="${questionId}"]`);

                if (!currentElement) {
                    addDebugLog(`Question element not found: ${questionId}`);
                    return;
                }

                applyAnswerHighlighting(currentElement, savedQuestion);
            });

            console.log('StudyAidX: Previous answers loaded and highlighted');
        } catch (error) {
            addDebugLog('Error loading saved data', error);
        }
    }

    // Apply answer highlighting based on question type
    function applyAnswerHighlighting(questionElement, savedQuestion) {
        addDebugLog(`Applying highlighting for question type: ${savedQuestion.type}`);

        switch (savedQuestion.type) {
            case 'multiple_choice_question':
                highlightMultipleChoice(questionElement, savedQuestion);
                break;
            case 'multiple_answers_question':
                highlightMultipleAnswers(questionElement, savedQuestion);
                break;
            case 'essay_question':
                highlightEssayQuestion(questionElement, savedQuestion);
                break;
            case 'fill_in_multiple_blanks_question':
                highlightFillInBlanks(questionElement, savedQuestion);
                break;
            default:
                addDebugLog(`Unknown question type: ${savedQuestion.type}`);
        }
    }

    // Auto-select multiple choice questions (silent mode)
    function highlightMultipleChoice(questionElement, savedQuestion) {
        const radioInputs = questionElement.querySelectorAll('input[type="radio"]');

        radioInputs.forEach(input => {
            const savedAnswer = savedQuestion.answers.find(a => a.id === input.value);

            if (savedAnswer && savedAnswer.selected) {
                input.checked = true;
                console.log(`✅ StudyAidX: Auto-selected correct answer: ${savedAnswer.text}`);
                addDebugLog(`Auto-selected correct answer: ${savedAnswer.text}`);
            }
        });
    }

    // Auto-select multiple answers questions (silent mode)
    function highlightMultipleAnswers(questionElement, savedQuestion) {
        const checkboxInputs = questionElement.querySelectorAll('input[type="checkbox"]');

        checkboxInputs.forEach(input => {
            const savedAnswer = savedQuestion.answers.find(a => a.id === input.value);

            if (savedAnswer && savedAnswer.selected) {
                input.checked = true;
                console.log(`✅ StudyAidX: Auto-selected checkbox: ${savedAnswer.text}`);
                addDebugLog(`Auto-selected correct checkbox: ${savedAnswer.text}`);
            }
        });
    }

    // Auto-fill essay questions (silent mode)
    function highlightEssayQuestion(questionElement, savedQuestion) {
        const textInputs = questionElement.querySelectorAll('input[type="text"], textarea');

        if (textInputs.length > 0 && savedQuestion.answer) {
            textInputs[0].value = savedQuestion.answer;
            console.log(`✅ StudyAidX: Auto-filled essay question`);
            addDebugLog('Auto-filled essay question');
        }
    }

    // Auto-fill fill in the blanks questions (silent mode)
    function highlightFillInBlanks(questionElement, savedQuestion) {
        const textInputs = questionElement.querySelectorAll('input[type="text"]');

        textInputs.forEach(input => {
            const savedAnswer = savedQuestion.answers[input.name];
            if (savedAnswer) {
                input.value = savedAnswer;
                console.log(`✅ StudyAidX: Auto-filled fill-in-blank: ${input.name} = ${savedAnswer}`);
                addDebugLog(`Auto-filled fill-in-blank: ${input.name} = ${savedAnswer}`);
            }
        });
    }

    // Monitor for quiz submission
    function monitorSubmission() {
        // Monitor form submissions
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', () => {
                addDebugLog('Form submission detected');
                setTimeout(saveQuizData, 500);
            });
        });

        // Monitor submit button clicks
        const submitButtons = document.querySelectorAll(
            '#submit_quiz_button, .submit_quiz_button, [value*="Submit"], [type="submit"]'
        );

        submitButtons.forEach(button => {
            button.addEventListener('click', () => {
                addDebugLog('Submit button clicked');
                setTimeout(saveQuizData, 500);
            });
        });

        addDebugLog(`Monitoring ${forms.length} forms and ${submitButtons.length} submit buttons`);
    }

    // Message handling for debug (like extension popup)
    function handleMessage(message) {
        switch (message.type) {
            case MessageTypes.PING:
                return MessageTypes.PONG;
            case MessageTypes.DEBUG:
                return debugLogs.map(log =>
                    `[${log.timestamp}] ${log.message}${log.data ? '\n' + log.data : ''}`
                ).join('\n\n');
            default:
                return null;
        }
    }

    // Initialize the script
    async function initialize() {
        addDebugLog('StudyAidX Quiz Loader initializing');

        // Get Canvas environment data
        const env = await getCanvasEnv();
        if (env) {
            addDebugLog('Canvas environment loaded', env);
        }

        // Wait for page to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Additional wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Initialize StudyAidX Invisible detection system
        try {
            await initializeStudyAidXInvisibleDetection();
            addDebugLog('StudyAidX Invisible detection system initialized');
        } catch (error) {
            addDebugLog('StudyAidX Invisible detection initialization failed', error);
            console.error('StudyAidX Invisible detection initialization failed:', error);
        }

        // Load saved answers if this is a quiz page
        if (window.location.pathname.includes('/quizzes/') &&
            window.location.pathname.includes('/take')) {

            loadSavedAnswers();
            monitorSubmission();
            addDebugLog('Quiz page detected, answers loaded and monitoring enabled');
        }

        // Expose message handler for debugging
        window.studyAidXMessageHandler = handleMessage;

        addDebugLog('StudyAidX Quiz Loader fully initialized');
        console.log('StudyAidX Quiz Loader: Ready');
    }

    // Start initialization
    initialize().catch(error => {
        addDebugLog('Initialization error', error);
        console.error('StudyAidX initialization failed:', error);
    });
})();

// ===========================================
// STUDYAIDX ERROR HANDLING & STATUS DETECTION
// ===========================================
(function setupStudyAidXErrorHandling() {
    let extensionStatus = 'UNKNOWN';
    let statusCheckInterval = null;
    let errorDetected = false;

    // Listen for extension success signal
    window.addEventListener('studyaidx-connection-established', function (event) {
        if (event.detail && event.detail.signature === 'SAX_AS_LOADED_OK_2024') {
            extensionStatus = 'ACTIVE';
            console.log('%c✅ [User Script] Extension is ACTIVE and working!', 'color: #00ff00; font-weight: bold;');
            showExtensionStatus('ACTIVE', event.detail);
            startStatusMonitoring();
        }
    });

    // Listen for extension error signal
    window.addEventListener('studyaidx-anti-system-error', function (event) {
        if (event.detail && event.detail.signature === 'SAX_AS_ERROR_2024') {
            extensionStatus = 'ERROR';
            errorDetected = true;
            console.log('%c❌ [User Script] Extension ERROR detected!', 'color: #ff0000; font-weight: bold;');
            console.log('%c🚨 Error Details:', 'color: #ff0000; font-weight: bold;', event.detail);
            showExtensionStatus('ERROR', event.detail);
        }
    });

    // Console monitor for error signals
    const originalConsoleLog = console.log;
    console.log = function (...args) {
        // Call original first
        originalConsoleLog.apply(console, args);

        // Check for error signal
        if (args[0] && args[0].includes('❌ STUDYAIDX_ANTI_SYSTEM_ERROR ❌')) {
            extensionStatus = 'ERROR';
            errorDetected = true;
            console.log('%c💥 [User Script] Extension error detected via console!', 'color: #ff0000; font-weight: bold;');
            showExtensionStatus('ERROR', { errorType: 'CONSOLE_DETECTED', timestamp: Date.now() });
        }

        // Check for success signal
        if (args[0] && args[0].includes('🔥 STUDYAIDX_ANTI_SYSTEM_2024_LOADED 🔥')) {
            if (extensionStatus !== 'ACTIVE') {
                extensionStatus = 'ACTIVE';
                console.log('%c🔥 [User Script] Extension success detected via console!', 'color: #00ff00; font-weight: bold;');
                showExtensionStatus('ACTIVE', { timestamp: Date.now() });
                startStatusMonitoring();
            }
        }
    };

    // Periodic status monitoring
    function startStatusMonitoring() {
        // Clear any existing interval
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }

        // Check status every 60 seconds
        statusCheckInterval = setInterval(function () {
            checkExtensionHealth();
        }, 60000);

        // Initial check after 5 seconds
        setTimeout(checkExtensionHealth, 5000);
    }

    // Check extension health
    function checkExtensionHealth() {
        try {
            // Method 1: Use the status function
            if (typeof window.getStudyAidXStatus === 'function') {
                const status = window.getStudyAidXStatus();
                console.log('%c🔍 [Health Check] Extension Status:', 'color: #00aaff; font-weight: bold;', status);

                if (!status.active || status.status === 'ERROR') {
                    extensionStatus = 'ERROR';
                    showExtensionStatus('ERROR', status);
                    return;
                }

                // Check heartbeat (should be within last 2 minutes)
                if (status.lastHeartbeat && (Date.now() - status.lastHeartbeat) > 120000) {
                    extensionStatus = 'INACTIVE';
                    showExtensionStatus('INACTIVE', { reason: 'No heartbeat', lastHeartbeat: status.lastHeartbeat });
                    return;
                }

                // All good
                if (extensionStatus !== 'ACTIVE') {
                    extensionStatus = 'ACTIVE';
                    showExtensionStatus('ACTIVE', status);
                }
            }
            // Method 2: Check window objects
            else if (window.STUDYAIDX_ANTI_SYSTEM_STATUS) {
                const status = window.STUDYAIDX_ANTI_SYSTEM_STATUS;
                if (status.status === 'ERROR') {
                    extensionStatus = 'ERROR';
                    showExtensionStatus('ERROR', status);
                } else if (status.status === 'ACTIVE') {
                    extensionStatus = 'ACTIVE';
                    showExtensionStatus('ACTIVE', status);
                }
            }
            // Method 3: No extension detected
            else {
                if (extensionStatus !== 'NOT_DETECTED') {
                    extensionStatus = 'NOT_DETECTED';
                    showExtensionStatus('NOT_DETECTED', { reason: 'Extension not found' });
                }
            }
        } catch (e) {
            console.log('%c⚠️ [Health Check] Error during status check:', 'color: #ff9500; font-weight: bold;', e);
            extensionStatus = 'ERROR';
            showExtensionStatus('ERROR', { errorType: 'HEALTH_CHECK_FAILED', message: e.message });
        }
    }

    // Public API for manual status check
    window.checkStudyAidXStatus = function () {
        console.log('%c🔍 [Manual Check] Checking StudyAidX Anti System status...', 'color: #00aaff; font-weight: bold;');
        checkExtensionHealth();
        return extensionStatus;
    };

    // Initialize with a delay to let extension load
    setTimeout(function () {
        console.log('%c🚀 [User Script] StudyAidX Error Handling System initialized', 'color: #00aaff; font-weight: bold;');

        // Start monitoring if extension is already detected
        if (window.STUDYAIDX_ANTI_SYSTEM_STATUS || window.__STUDYAIDX_READY__) {
            startStatusMonitoring();
        }
    }, 2000);
})();

// ===========================================
// END OF ERROR HANDLING SYSTEM
// ===========================================
