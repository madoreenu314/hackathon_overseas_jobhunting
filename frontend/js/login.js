// ==================== ログイン画面用 JavaScript ====================

const API_BASE = 'http://127.0.0.1:8000';
const AUTH_STORAGE_KEY = 'overseasJobAuthToken';

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 ログイン画面起動');

    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const logoutButton = document.getElementById('logout-button');
    const toSettingsButton = document.getElementById('to-settings-button');

    if (loginButton) loginButton.addEventListener('click', () => handleAuth('login'));
    if (registerButton) registerButton.addEventListener('click', () => handleAuth('register'));
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (toSettingsButton) {
        toSettingsButton.addEventListener('click', () => (location.href = 'settings.html'));
    }

    refreshAuthStatus();
});

async function handleAuth(mode) {
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
        setAuthMessage('メールアドレスとパスワードを入力してください。', 'error');
        return;
    }

    setAuthButtonsDisabled(true);
    setAuthMessage('処理中...', 'info');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const detail = data.detail || '認証に失敗しました。';
            throw new Error(detail);
        }

        if (!data.access_token) {
            throw new Error('トークンが取得できませんでした。');
        }

        saveAuthToken(data.access_token);
        await refreshAuthStatus();
        setAuthMessage(mode === 'login' ? 'ログインしました。' : '登録しました。', 'success');

        if (passwordInput) passwordInput.value = '';
    } catch (error) {
        setAuthMessage(error.message || '認証に失敗しました。', 'error');
    } finally {
        setAuthButtonsDisabled(false);
    }
}

function handleLogout() {
    clearAuthToken();
    updateAuthUI(false);
    setAuthMessage('ログアウトしました。', 'info');
}

async function refreshAuthStatus() {
    const token = loadAuthToken();
    if (!token) {
        updateAuthUI(false);
        return;
    }

    try {
        const me = await fetchCurrentUser(token);
        updateAuthUI(true, me);
    } catch (error) {
        clearAuthToken();
        updateAuthUI(false);
        setAuthMessage('ログイン情報が無効になりました。再ログインしてください。', 'error');
    }
}

async function fetchCurrentUser(token) {
    const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました。');
    }

    return response.json();
}

function updateAuthUI(isLoggedIn, user) {
    const statusEl = document.getElementById('auth-status');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const logoutButton = document.getElementById('logout-button');
    const toSettingsButton = document.getElementById('to-settings-button');

    if (statusEl) {
        statusEl.textContent = isLoggedIn
            ? `ログイン中: ${user && user.email ? user.email : 'ユーザー'}`
            : '未ログイン';
    }

    if (loginButton) loginButton.disabled = isLoggedIn;// ? 'none' : 'inline-flex'; //ログインしたらログインボタンと新規登録ボタンは隠す
    if (registerButton) registerButton.disabled = isLoggedIn;// ? 'none' : 'inline-flex';
    if (logoutButton) logoutButton.style.display = isLoggedIn ? 'inline-flex' : 'none';
    if (toSettingsButton) toSettingsButton.style.display = isLoggedIn ? 'inline-flex' : 'none';
}

function setAuthButtonsDisabled(disabled) {
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const logoutButton = document.getElementById('logout-button');

    if (loginButton) loginButton.disabled = disabled;
    if (registerButton) registerButton.disabled = disabled;
    if (logoutButton) logoutButton.disabled = disabled;
}

function setAuthMessage(message, type) {
    const messageEl = document.getElementById('auth-message');
    if (!messageEl) return;

    messageEl.textContent = message || '';

    if (type === 'success') {
        messageEl.style.color = '#2f855a';
    } else if (type === 'error') {
        messageEl.style.color = '#e53e3e';
    } else {
        messageEl.style.color = '#888';
    }
}

function saveAuthToken(token) {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
}

function loadAuthToken() {
    return localStorage.getItem(AUTH_STORAGE_KEY);
}

function clearAuthToken() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}
