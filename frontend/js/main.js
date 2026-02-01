// ==================== 投稿一覧ページ用 JavaScript ====================

// フィルター状態を管理
let currentFilters = {
    country: [],
    type: [],
    industry: []
};

const API_BASE = 'http://127.0.0.1:8000';
const AUTH_STORAGE_KEY = 'overseasJobAuthToken';
let currentUserId = null;
let currentUserNickname = null;
let allPostsCache = [];
let currentSort = 'latest';
const likeStatusMap = new Map();

const COUNTRY_VALUE_MAP = {
    usa: 'アメリカ合衆国',
    singapore: 'シンガポール',
    uk: 'イギリス',
    canada: 'カナダ',
    australia: 'オーストラリア',
    germany: 'ドイツ',
    france: 'フランス'
};

const TYPE_VALUE_MAP = {
    housing: '住居',
    job: '職業',
    visa: 'ビザ',
    cost: '生活コスト',
    culture: '文化',
    education: '教育'
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

// ==================== 初期化 ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 投稿一覧ページ起動');
    
    // 認証状態を反映
    updateSettingsButton();
    
    // ログイン中ユーザー情報を取得
    await loadCurrentUser();
    
    // フィルター状態を読み込み
    loadFiltersFromStorage();
    
    // フィルター状態を表示
    displayFilterStatus();
    
    // 投稿データを読み込んで表示（バックエンド担当が実装）
    loadPosts();  //←有効化done
    
    // イベントリスナー設定
    setupEventListeners();
    
    console.log('✅ 初期化完了');
});

async function loadCurrentUser() {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) {
        currentUserId = null;
        currentUserNickname = null;
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error('Failed to load user');
        }
        const data = await response.json();
        currentUserId = data.id;
        currentUserNickname = data.nickname || null;
    } catch (error) {
        currentUserId = null;
        currentUserNickname = null;
    }
}

// ==================== 認証 UI ====================
function updateSettingsButton() {
    const settingsButton = document.getElementById('settings-button');
    if (!settingsButton) return;

    const token = localStorage.getItem('overseasJobAuthToken');
    if (token) {
        settingsButton.textContent = '設定';
        settingsButton.onclick = () => (location.href = 'settings.html');
    } else {
        settingsButton.textContent = 'ログイン';
        settingsButton.onclick = () => (location.href = 'login.html');
    }
}

// ==================== イベントリスナー設定 ====================
function setupEventListeners() {
    // FABボタン（新規投稿）
    const fabButton = document.getElementById('new-post-btn');
    if (fabButton) {
        fabButton.addEventListener('click', function() {
            console.log('📝 新規投稿ボタンがクリックされました');
            openPostModal();
        });
    }
    
    // ソート変更
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }

    setupPostModal();
}

// ==================== 新規投稿モーダル ====================
function setupPostModal() {
    const modal = document.getElementById('post-modal');
    const closeButton = document.getElementById('post-modal-close');
    const cancelButton = document.getElementById('post-cancel');
    const form = document.getElementById('post-form');

    if (closeButton) {
        closeButton.addEventListener('click', closePostModal);
    }
    if (cancelButton) {
        cancelButton.addEventListener('click', closePostModal);
    }
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closePostModal();
            }
        });
    }
    if (form) {
        form.addEventListener('submit', handlePostSubmit);
    }
}

function openPostModal() {
    const modal = document.getElementById('post-modal');
    if (modal) {
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closePostModal() {
    const modal = document.getElementById('post-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}

async function handlePostSubmit(event) {
    event.preventDefault();

    const titleInput = document.getElementById('post-title');
    const typeSelect = document.getElementById('post-knowledge-type');
    const contentInput = document.getElementById('post-content');

    const title = titleInput ? titleInput.value.trim() : '';
    const knowledgeType = typeSelect ? typeSelect.value : '';
    const content = contentInput ? contentInput.value.trim() : '';

    if (!title || !knowledgeType || !content) {
        alert('すべての項目を入力してください。');
        return;
    }

    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) {
        alert('ログインしてください。');
        location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                knowledge_type: knowledgeType,
                title,
                content
            })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const detail = data.detail || '投稿に失敗しました。';
            throw new Error(detail);
        }

        if (titleInput) titleInput.value = '';
        if (typeSelect) typeSelect.value = '';
        if (contentInput) contentInput.value = '';

        closePostModal();
        loadPosts();
    } catch (error) {
        alert(error.message || '投稿に失敗しました。');
    }
}

// ==================== フィルター読み込み ====================
function loadFiltersFromStorage() {
    const saved = localStorage.getItem('overseasJobSettings');
    
    if (!saved) {
        console.log('📭 保存されたフィルターなし');
        return;
    }
    
    try {
        const data = JSON.parse(saved);
        
        // 新しい形式: viewFilters を使用
        if (data.viewFilters) {
            currentFilters = {
                country: data.viewFilters.country || [],
                type: data.viewFilters.type || [],
                industry: data.viewFilters.industry || []
            };
        }
        
        console.log('📬 フィルター状態を復元:', currentFilters);
    } catch (error) {
        console.error('❌ フィルター読み込みエラー:', error);
    }
}

// ==================== フィルター状態表示 ====================
function displayFilterStatus() {
    const messageElement = document.getElementById('filter-status-message');
    const activeFiltersContainer = document.getElementById('active-filters');
    
    const totalFilters = currentFilters.country.length + 
                        currentFilters.type.length + 
                        currentFilters.industry.length;
    
    if (totalFilters === 0) {
        // フィルターなし
        if (messageElement) {
            messageElement.textContent = 'すべての投稿を表示中';
        }
        if (activeFiltersContainer) {
            activeFiltersContainer.innerHTML = '';
        }
        console.log('🔓 フィルターなし - すべて表示');
    } else {
        // フィルターあり
        if (messageElement) {
            messageElement.textContent = `${totalFilters}件のフィルターで絞り込み中`;
        }
        
        // 選択中のフィルタータグを表示
        if (activeFiltersContainer) {
            displayActiveFilterTags(activeFiltersContainer);
        }
        console.log(`🔒 ${totalFilters}件のフィルターで絞り込み`);
    }
}

// ==================== 選択中フィルタータグ表示 ====================
function displayActiveFilterTags(container) {
    container.innerHTML = '';
    
    // 国・地域のラベルマッピング
    const countryLabels = {
        'usa': '🇺🇸 アメリカ',
        'singapore': '🇸🇬 シンガポール',
        'uk': '🇬🇧 イギリス',
        'canada': '🇨🇦 カナダ',
        'australia': '🇦🇺 オーストラリア',
        'germany': '🇩🇪 ドイツ',
        'france': '🇫🇷 フランス',
        
    };
    
    // 知見の種類のラベルマッピング
    const typeLabels = {
        'housing': '🏠 住居',
        'job': '💼 職業',
        'visa': '📋 ビザ',
        'cost': '💰 生活コスト',
        'culture': '🎭 文化',
        'education': '🎓 教育'
    };
    
    // 業界・職種のラベルマッピング
    const industryLabels = {
        'it': '💻 IT・エンジニア',
        'finance': '💹 金融',
        'consulting': '📊 コンサル',
        'marketing': '📱 マーケティング',
        'medical': '⚕️ 医療',
        'education': '👨‍🏫 教育業',
        'manufacturing': '🏭 製造業',
        
    };
    
    // 国・地域タグ
    currentFilters.country.forEach(value => {
        const tag = document.createElement('span');
        tag.className = 'active-filter-tag';
        tag.textContent = countryLabels[value] || value;
        container.appendChild(tag);
    });
    
    // 知見の種類タグ
    currentFilters.type.forEach(value => {
        const tag = document.createElement('span');
        tag.className = 'active-filter-tag';
        tag.textContent = typeLabels[value] || value;
        container.appendChild(tag);
    });
    
    // 業界・職種タグ
    currentFilters.industry.forEach(value => {
        const tag = document.createElement('span');
        tag.className = 'active-filter-tag';
        tag.textContent = industryLabels[value] || value;
        container.appendChild(tag);
    });
}

// ==================== 投稿フィルタリング（バックエンドと連携） ====================
function filterPosts(posts) {
    // フィルターが設定されていない場合はすべて表示
    if (currentFilters.country.length === 0 && 
        currentFilters.type.length === 0 && 
        currentFilters.industry.length === 0) {
        return posts;
    }

    const selectedCountries = currentFilters.country
        .map(value => COUNTRY_VALUE_MAP[value])
        .filter(Boolean);
    const selectedTypes = currentFilters.type
        .map(value => TYPE_VALUE_MAP[value])
        .filter(Boolean);
    const selectedIndustries = currentFilters.industry
        .map(value => INDUSTRY_VALUE_MAP[value])
        .filter(Boolean);
    
    // フィルター条件に合う投稿のみ返す
    return posts.filter(post => {
        const matchCountry = selectedCountries.length === 0 || 
                           selectedCountries.includes(post.country_region);
        const matchType = selectedTypes.length === 0 || 
                         selectedTypes.includes(post.knowledge_type);
        const matchIndustry = selectedIndustries.length === 0 || 
                             selectedIndustries.includes(post.industry_job);
        
        // すべての条件に合致する投稿のみ
        return matchCountry && matchType && matchIndustry;
    });
}

// ==================== 投稿表示（バックエンド担当が実装予定） ====================

function loadPosts() {
    // バックエンドが作成する posts.json からデータを読み込む
    fetch(`${API_BASE}/api/posts`) // ←FastAPI
        .then(response => response.json())
        .then(allPosts => {
            allPostsCache = Array.isArray(allPosts) ? allPosts : [];
            if (localStorage.getItem(AUTH_STORAGE_KEY)) {
                loadLikeStatuses(allPostsCache)
                    .then(applyFiltersAndSort)
                    .catch(() => applyFiltersAndSort());
            } else {
                applyFiltersAndSort();
            }
        })
        .catch(error => {
            console.error('投稿読み込みエラー:', error);
        });
}

function applyFiltersAndSort() {
    const filteredPosts = filterPosts(allPostsCache);
    const sortedPosts = sortPosts(filteredPosts, currentSort);
    displayPosts(sortedPosts);
}

function sortPosts(posts, sortType) {
    const copied = posts.slice();
    if (sortType === 'oldest') {
        copied.sort((a, b) => getPostTime(a) - getPostTime(b));
    } else if (sortType === 'latest') {
        copied.sort((a, b) => getPostTime(b) - getPostTime(a));
    } else if (sortType === 'popular') {
        copied.sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
    }
    return copied;
}

function getPostTime(post) {
    if (post.created_at) {
        const ts = Date.parse(post.created_at);
        if (!Number.isNaN(ts)) return ts;
    }
    return typeof post.id === 'number' ? post.id : 0;
}

function displayPosts(posts) {
    const postsContainer = document.getElementById('posts-list');
    const noPostsElement = document.getElementById('no-posts');
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '';
        noPostsElement.style.display = 'block';
        return;
    }
    
    noPostsElement.style.display = 'none';
    postsContainer.innerHTML = '';
    
    posts.forEach(post => {
        const postCard = createPostCard(post);
        postsContainer.appendChild(postCard);
    });
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    const authorName = post.author_nickname || '匿名';
    const isOwnPost = currentUserId !== null && post.author_id === currentUserId;
    if (isOwnPost) {
        card.classList.add('post-card-own');
    }
    const createdAtText = formatPostDate(post.created_at);
    const dateHtml = createdAtText ? `<span class="post-date">${createdAtText}</span>` : '';
    const isLiked = likeStatusMap.get(post.id) === true;
    card.innerHTML = `
        <div class="post-header-row">
            <div class="post-author-line">
                <span class="post-author-name">${authorName}</span>
                ${dateHtml}
            </div>
             ${isOwnPost ? '<button type="button" class="btn btn-reset btn-sm post-delete" data-post-id="' + post.id + '">削除</button>' : ''}
        </div>
        <h3 class="post-title">${post.title}</h3>
        <p class="post-content">${post.content}</p>
        <div class="post-meta">
            <span class="meta-tag meta-country">🌏 ${post.country_region}</span>
            <span class="meta-tag meta-industry">💼 ${post.industry_job}</span>
            <span class="meta-tag meta-type">📋 ${post.knowledge_type}</span>
        </div>
        <div class="post-footer">
            <div class="post-stats">
                <button type="button" class="btn btn-reset btn-sm like-button ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                    ❤️ ${post.likes_count ?? 0}
                </button>
            </div>
        </div>
    `;

    if (isOwnPost) {
        const deleteButton = card.querySelector('.post-delete');
        if (deleteButton) {
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                const postId = deleteButton.getAttribute('data-post-id');
                handleDeletePost(postId);
            });
        }
    }

    const likeButton = card.querySelector('.like-button');
    if (likeButton) {
        likeButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const postId = likeButton.getAttribute('data-post-id');
            handleLikePost(postId, likeButton);
        });
    }
    return card;
}

function formatPostDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

async function handleDeletePost(postId) {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) {
        alert('ログインしてください。');
        location.href = 'login.html';
        return;
    }

    const confirmed = window.confirm('この投稿を削除しますか？');
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const detail = data.detail || '削除に失敗しました。';
            throw new Error(detail);
        }
        loadPosts();
    } catch (error) {
        alert(error.message || '削除に失敗しました。');
    }
}

async function handleLikePost(postId, buttonEl) {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) {
        alert('ログインしてください。');
        location.href = 'login.html';
        return;
    }

    try {
        const currentlyLiked = likeStatusMap.get(Number(postId)) === true;
        const method = currentlyLiked ? 'DELETE' : 'POST';
        const response = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
            method,
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const detail = data.detail || 'いいねに失敗しました。';
            throw new Error(detail);
        }
        const postIdNum = Number(postId);
        if (typeof data.likes_count === 'number') {
            const target = allPostsCache.find(p => p.id === postIdNum);
            if (target) target.likes_count = data.likes_count;
        }
        if (typeof data.liked === 'boolean') {
            likeStatusMap.set(postIdNum, data.liked);
        }

        if (buttonEl) {
            const liked = likeStatusMap.get(postIdNum) === true;
            buttonEl.classList.toggle('liked', liked);
            const count = typeof data.likes_count === 'number'
                ? data.likes_count
                : (allPostsCache.find(p => p.id === postIdNum)?.likes_count ?? 0);
            buttonEl.textContent = `❤️ ${count}`;
        }
    } catch (error) {
        alert(error.message || 'いいねに失敗しました。');
    }
}

async function loadLikeStatuses(posts) {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) return;

    const requests = posts.map(async (post) => {
        try {
            const response = await fetch(`${API_BASE}/api/posts/${post.id}/like`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) return;
            const data = await response.json();
            if (typeof data.liked === 'boolean') {
                likeStatusMap.set(post.id, data.liked);
            }
            if (typeof data.likes_count === 'number') {
                post.likes_count = data.likes_count;
            }
        } catch (error) {
            // ignore per-post failures
        }
    });

    await Promise.all(requests);
}


// ==================== ソート変更 ====================
function handleSortChange(event) {
    const sortType = event.target.value;
    console.log(`🔀 ソート変更: ${sortType}`);
    
    currentSort = sortType;
    applyFiltersAndSort();
}

// ==================== エクスポート（グローバル） ====================
window.getCurrentFilters = function() {
    return currentFilters;
};

window.filterPosts = filterPosts;

console.log('🎉 main.js 読み込み完了');
