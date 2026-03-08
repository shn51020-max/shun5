/**
 * Attendance Tracker v2 - Core Logic
 */

// --- GAS API Endpoint ---
// デプロイ後に発行されたウェブアプリURLに書き換えてください。
const API_URL = '';

// --- Configuration ---
const STORAGE_KEYS = {
    userName: 'attendance_v2_user_name'
};

// --- State Management ---
const state = {
    isSubmitting: false
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Restore Saved Name
    const savedName = localStorage.getItem(STORAGE_KEYS.userName);
    if (savedName) {
        document.getElementById('user-name').value = savedName;
    }

    // Set Listeners
    document.getElementById('btn-in').addEventListener('click', () => triggerAction('clockIn'));
    document.getElementById('btn-out').addEventListener('click', () => triggerAction('clockOut'));
    document.getElementById('btn-complete').addEventListener('click', () => triggerAction('complete'));
}

/**
 * Handle 打刻 / 報告 Actions
 */
async function triggerAction(action) {
    if (state.isSubmitting) return;

    const userName = document.getElementById('user-name').value.trim();
    const userId = document.getElementById('user-id').value;

    if (!userName) {
        notify('氏名を入力してください。', 'error');
        focusInput('user-name');
        return;
    }

    // Save Name for next time
    localStorage.setItem(STORAGE_KEYS.userName, userName);

    if (!API_URL) {
        notify('API_URL が未設定です。GASをデプロイしてください。', 'error');
        return;
    }

    try {
        state.isSubmitting = true;
        updateButtonStatus(true);
        notify('リクエスト送信中...', 'pending');

        const payload = {
            action,
            userId,
            userName,
            appUrl: window.location.origin + window.location.pathname,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            mode: 'no-cors' // No-cors is standard for simple GAS POST
        });

        // Since no-cors doesn't give body access, we assume success if no error is thrown
        // and provides a nice delay for UX if we want, but GAS is usually fast.
        notify('完了しました！LINEを確認してください。', 'success');
        vibrateSuccess();

    } catch (error) {
        console.error('API Error:', error);
        notify('エラーが発生しました。時間を置いて再試行してください。', 'error');
    } finally {
        state.isSubmitting = false;
        updateButtonStatus(false);
    }
}

/**
 * UI Helpers
 */
function notify(msg, type) {
    const box = document.getElementById('status-display');
    box.textContent = msg;
    box.style.opacity = 1;
    box.classList.remove('success', 'error', 'pending');

    if (type === 'success') {
        box.style.background = 'rgba(16, 185, 129, 0.1)';
        box.style.color = '#10b981';
    } else if (type === 'error') {
        box.style.background = 'rgba(244, 63, 94, 0.1)';
        box.style.color = '#f43f5e';
    } else {
        box.style.background = 'rgba(255, 255, 255, 0.05)';
        box.style.color = '#94a3b8';
    }

    if (type !== 'pending') {
        setTimeout(() => {
            box.style.opacity = 0;
        }, 5000);
    }
}

function updateButtonStatus(disabled) {
    const btns = document.querySelectorAll('button');
    btns.forEach(b => b.disabled = disabled);
}

function focusInput(id) {
    document.getElementById(id).focus();
}

function vibrateSuccess() {
    if ("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
}
