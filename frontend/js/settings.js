// ==================== 設定画面用 JavaScript ====================

const AUTH_STORAGE_KEY = 'overseasJobAuthToken';
const API_BASE = 'http://127.0.0.1:8000';

const COUNTRY_VALUE_MAP = {
    usa: 'アメリカ合衆国',
    singapore: 'シンガポール',
    uk: 'イギリス',
    canada: 'カナダ',
    australia: 'オーストラリア',
    germany: 'ドイツ',
    france: 'フランス'
};

const INDUSTRY_VALUE_MAP = {
    it: 'IT・エンジニア',
    finance: '金融',
    consulting: 'コンサル',
    marketing: 'マーケティング',
    medical: '医療',
    education: '教育業',
    manufacturing: '製造業'
};

// 見たいフィルター状態（複数選択）
const viewFilters = {
    country: new Set(),
    type: new Set(),
    industry: new Set()
};

// 投稿デフォルト設定（単一選択）
const postDefaults = {
    country: '',
    type: '',
    industry: ''
};

// ==================== 初期化 ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 設定画面起動');

    if (!ensureLoggedIn()) {
        return;
    }
    
    // 保存された設定を読み込み
    loadSettingsFromStorage();

    // バックからプロフィール情報を取得して反映
    hydrateProfileFromServer();
    
    // イベントリスナーを設定
    setupViewFilterListeners();
    setupPostDefaultListeners();
    setupActionButtons();
    
    // カウント表示を更新
    updateViewFilterCount();
    updatePostDefaultsStatus();
    
    console.log('✅ 初期化完了');
});

// ==================== 認証ガード ====================
function ensureLoggedIn() {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) {
        location.href = 'login.html';
        return false;
    }
    return true;
}

// ==================== プロフィール反映 ====================
async function hydrateProfileFromServer() {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        const nicknameInput = document.getElementById('nickname-input');
        if (nicknameInput && data.nickname) {
            nicknameInput.value = data.nickname;
        }
    } catch (error) {
        // 失敗時は無視（入力はユーザーが手動で行える）
    }
}

// ==================== 見たいフィルター用イベントリスナー ====================
function setupViewFilterListeners() {
    // すべてのタグボタンにクリックイベントを設定
    const viewTags = document.querySelectorAll('#view-country-tags .tag, #view-type-tags .tag, #view-industry-tags .tag');
    
    viewTags.forEach(tag => {
        tag.addEventListener('click', handleViewFilterClick);
    });
    
    console.log('📌 見たいフィルターのイベントリスナー設定完了');
}

// 見たいフィルターのタグクリック処理
function handleViewFilterClick(event) {
    const tag = event.currentTarget;
    const filterType = tag.dataset.filter;
    const value = tag.dataset.value;
    
    // 選択状態をトグル
    if (tag.classList.contains('selected')) {
        // 選択解除
        tag.classList.remove('selected');
        viewFilters[filterType].delete(value);
        console.log(`❌ 解除: ${filterType} - ${value}`);
    } else {
        // 選択
        tag.classList.add('selected');
        viewFilters[filterType].add(value);
        console.log(`✅ 選択: ${filterType} - ${value}`);
    }
    
    // 自動保存
    saveSettingsToStorage();
    
    // カウント更新
    updateViewFilterCount();
    
    // プニプニアニメーション
    tag.style.transform = 'scale(0.95)';
    setTimeout(() => {
        tag.style.transform = '';
    }, 100);
}

// ==================== 投稿デフォルト用イベントリスナー ====================
function setupPostDefaultListeners() {
    // ラジオボタンの変更イベント
    const countryRadios = document.querySelectorAll('input[name="post-country"]');
    const typeRadios = document.querySelectorAll('input[name="post-type"]');
    const industryRadios = document.querySelectorAll('input[name="post-industry"]');
    
    countryRadios.forEach(radio => {
        radio.addEventListener('change', () => handlePostDefaultChange('country', radio.value));
    });
    
    typeRadios.forEach(radio => {
        radio.addEventListener('change', () => handlePostDefaultChange('type', radio.value));
    });
    
    industryRadios.forEach(radio => {
        radio.addEventListener('change', () => handlePostDefaultChange('industry', radio.value));
    });
    
    console.log('📌 投稿デフォルトのイベントリスナー設定完了');
}

// 投稿デフォルトの変更処理
function handlePostDefaultChange(filterType, value) {
    postDefaults[filterType] = value;
    console.log(`🔘 投稿デフォルト変更: ${filterType} = ${value || '未設定'}`);
    
    // 自動保存
    saveSettingsToStorage();
    
    // ステータス更新
    updatePostDefaultsStatus();
}

// ==================== アクションボタン ====================
function setupActionButtons() {
    // 表示フィルターリセット
    const resetViewButton = document.getElementById('reset-view-filters');
    if (resetViewButton) {
        resetViewButton.addEventListener('click', resetViewFilters);
    }
    
    // 投稿デフォルトリセット
    const resetPostButton = document.getElementById('reset-post-defaults');
    if (resetPostButton) {
        resetPostButton.addEventListener('click', resetPostDefaults);
    }
    
    // 保存ボタン
    const saveButton = document.getElementById('save-settings');
    if (saveButton) {
        saveButton.addEventListener('click', saveAndRedirect);
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    location.href = 'login.html';
}

// 表示フィルターをリセット
function resetViewFilters() {
    console.log('🔄 表示フィルターをリセット');
    
    viewFilters.country.clear();
    viewFilters.type.clear();
    viewFilters.industry.clear();
    
    // UIから選択を解除
    const allViewTags = document.querySelectorAll('#view-country-tags .tag, #view-type-tags .tag, #view-industry-tags .tag');
    allViewTags.forEach(tag => tag.classList.remove('selected'));
    
    // 保存
    saveSettingsToStorage();
    updateViewFilterCount();
    
    // フィードバック
    const resetButton = document.getElementById('reset-view-filters');
    resetButton.textContent = 'リセット完了！';
    setTimeout(() => {
        resetButton.textContent = '表示フィルターをリセット';
    }, 1500);
}

// 投稿デフォルトをリセット
function resetPostDefaults() {
    console.log('🔄 投稿デフォルトをリセット');
    
    postDefaults.country = '';
    postDefaults.type = '';
    postDefaults.industry = '';
    
    // ラジオボタンの選択を解除
    document.querySelectorAll('input[name="post-country"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="post-type"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="post-industry"]').forEach(r => r.checked = false);
    
    // 保存
    saveSettingsToStorage();
    updatePostDefaultsStatus();
    
    // フィードバック
    const resetButton = document.getElementById('reset-post-defaults');
    resetButton.textContent = 'リセット完了！';
    setTimeout(() => {
        resetButton.textContent = 'デフォルト設定をリセット';
    }, 1500);
}

// 保存して投稿一覧へ
async function saveAndRedirect() {
    console.log('💾 設定を保存して投稿一覧へ');

    const nicknameInput = document.getElementById('nickname-input');
    const nickname = nicknameInput ? nicknameInput.value.trim() : '';
    const token = localStorage.getItem('overseasJobAuthToken');

    if (!token) {
        alert('ログインしてください。');
        return;
    }

    const countryRegion = COUNTRY_VALUE_MAP[postDefaults.country];
    const industryJob = INDUSTRY_VALUE_MAP[postDefaults.industry];

    if (!countryRegion || !industryJob) {
        alert('プロフィールの「国・地域」と「業界・職種」を設定してください。');
        return;
    }

    const payload = {
        country_region: countryRegion,
        industry_job: industryJob
    };

    if (nickname) {
        payload.nickname = nickname;
    }

    try {
        const res = await fetch(`${API_BASE}/api/users/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error('プロフィールの保存に失敗しました');
        }

        // ローカルにも保存（任意）
        const saved = localStorage.getItem('overseasJobSettings');
        const data = saved ? JSON.parse(saved) : {};
        if (nickname) {
            data.nickname = nickname;
        }
        localStorage.setItem('overseasJobSettings', JSON.stringify(data));
    } catch (e) {
        alert(e.message || '保存に失敗しました');
        return;
    }

    const saveButton = document.getElementById('save-settings');
    saveButton.textContent = '✓ 保存しました！';
    saveButton.style.background = '#4caf50';

    setTimeout(() => {
        location.href = 'index.html';
    }, 500);
}

// ==================== localStorage 管理 ====================

// 設定を保存
function saveSettingsToStorage() {
    const storageData = {
        viewFilters: {
            country: Array.from(viewFilters.country),
            type: Array.from(viewFilters.type),
            industry: Array.from(viewFilters.industry)
        },
        postDefaults: {
            country: postDefaults.country,
            type: postDefaults.type,
            industry: postDefaults.industry
        },
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('overseasJobSettings', JSON.stringify(storageData));
    console.log('💾 設定を保存:', storageData);
}

// 設定を読み込み
function loadSettingsFromStorage() {
    const saved = localStorage.getItem('overseasJobSettings');
    
    if (!saved) {
        console.log('📭 保存された設定なし');
        return;
    }
    
    try {
        const data = JSON.parse(saved);
        
        // 見たいフィルターを復元
        if (data.viewFilters) {
            viewFilters.country = new Set(data.viewFilters.country || []);
            viewFilters.type = new Set(data.viewFilters.type || []);
            viewFilters.industry = new Set(data.viewFilters.industry || []);
            restoreViewFilterSelections();
        }
        
        // 投稿デフォルトを復元
        if (data.postDefaults) {
            postDefaults.country = data.postDefaults.country || '';
            postDefaults.type = data.postDefaults.type || '';
            postDefaults.industry = data.postDefaults.industry || '';
            restorePostDefaultSelections();
        }
        
        console.log('📬 設定を復元:', data);
    } catch (error) {
        console.error('❌ 設定読み込みエラー:', error);
        localStorage.removeItem('overseasJobSettings');
    }
}

// 見たいフィルターの選択状態をUIに反映
function restoreViewFilterSelections() {
    viewFilters.country.forEach(value => {
        const tag = document.querySelector(`#view-country-tags [data-value="${value}"]`);
        if (tag) tag.classList.add('selected');
    });
    
    viewFilters.type.forEach(value => {
        const tag = document.querySelector(`#view-type-tags [data-value="${value}"]`);
        if (tag) tag.classList.add('selected');
    });
    
    viewFilters.industry.forEach(value => {
        const tag = document.querySelector(`#view-industry-tags [data-value="${value}"]`);
        if (tag) tag.classList.add('selected');
    });
}

// 投稿デフォルトの選択状態をUIに反映
function restorePostDefaultSelections() {
    if (postDefaults.country) {
        const radio = document.querySelector(`input[name="post-country"][value="${postDefaults.country}"]`);
        if (radio) radio.checked = true;
    }
    
    if (postDefaults.type) {
        const radio = document.querySelector(`input[name="post-type"][value="${postDefaults.type}"]`);
        if (radio) radio.checked = true;
    }
    
    if (postDefaults.industry) {
        const radio = document.querySelector(`input[name="post-industry"][value="${postDefaults.industry}"]`);
        if (radio) radio.checked = true;
    }
}

// ==================== UI更新 ====================

// 見たいフィルターのカウント表示
function updateViewFilterCount() {
    const total = viewFilters.country.size + 
                  viewFilters.type.size + 
                  viewFilters.industry.size;
    
    const countElement = document.getElementById('view-filter-count');
    if (countElement) {
        countElement.textContent = `選択中: ${total}件`;
        
        if (total > 0) {
            countElement.style.color = '#667eea';
            countElement.style.fontWeight = '700';
        } else {
            countElement.style.color = '#888';
            countElement.style.fontWeight = '600';
        }
    }
}

// 投稿デフォルトのステータス表示
function updatePostDefaultsStatus() {
    const statusElement = document.getElementById('post-defaults-status');
    if (!statusElement) return;
    
    const setCount = [postDefaults.country, postDefaults.type, postDefaults.industry]
        .filter(v => v !== '').length;
    
    if (setCount === 0) {
        statusElement.textContent = '未設定';
        statusElement.style.color = '#888';
    } else if (setCount === 3) {
        statusElement.textContent = '✓ すべて設定済み';
        statusElement.style.color = '#4caf50';
        statusElement.style.fontWeight = '700';
    } else {
        statusElement.textContent = `${setCount}/3 項目設定済み`;
        statusElement.style.color = '#ff9800';
        statusElement.style.fontWeight = '700';
    }
}

// ==================== エクスポート ====================
window.getViewFilters = function() {
    return {
        country: Array.from(viewFilters.country),
        type: Array.from(viewFilters.type),
        industry: Array.from(viewFilters.industry)
    };
};

window.getPostDefaults = function() {
    return { ...postDefaults };
};

console.log('🎉 settings.js 読み込み完了');
