// ==================== ユーザーページ用 JavaScript ====================

const API_BASE = 'http://127.0.0.1:8000';
const AUTH_STORAGE_KEY = 'overseasJobAuthToken';
let currentUserId = null;
const likeStatusMap = new Map();

function getUserIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('user_id');
    return value ? Number(value) : null;
}

document.addEventListener('DOMContentLoaded', function() {
    const userId = getUserIdFromQuery();
    if (!userId) {
        renderNoUser();
        return;
    }
    loadCurrentUser()
        .then(() => loadUserPosts(userId))
        .catch(() => loadUserPosts(userId));
});

function renderNoUser() {
    const list = document.getElementById('user-posts-list');
    if (list) list.innerHTML = '';
    const noPosts = document.getElementById('user-no-posts');
    if (noPosts) noPosts.style.display = 'block';
}

function loadUserPosts(userId) {
    fetch(`${API_BASE}/api/posts`)
        .then(response => response.json())
        .then(allPosts => {
            const posts = Array.isArray(allPosts)
                ? allPosts.filter(p => p.author_id === userId)
                : [];
            if (localStorage.getItem(AUTH_STORAGE_KEY)) {
                loadLikeStatuses(posts)
                    .then(() => {
                        renderUserHeader(posts);
                        renderUserPosts(posts);
                    })
                    .catch(() => {
                        renderUserHeader(posts);
                        renderUserPosts(posts);
                    });
            } else {
                renderUserHeader(posts);
                renderUserPosts(posts);
            }
        })
        .catch(() => {
            renderNoUser();
        });
}

async function loadCurrentUser() {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) {
        currentUserId = null;
        return;
    }

    const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
        currentUserId = null;
        return;
    }
    const data = await response.json();
    currentUserId = data.id;
}

function renderUserHeader(posts) {
    const nameEl = document.getElementById('user-name');
    const defaultsEl = document.getElementById('user-defaults');

    if (!posts.length) {
        if (nameEl) nameEl.textContent = 'ユーザー';
        return;
    }

    const first = posts[0];
    if (nameEl) nameEl.textContent = first.author_nickname || '匿名';

    const country = first.country_region || '未設定';
    const industry = first.industry_job || '未設定';
    if (defaultsEl) {
        defaultsEl.innerHTML = `
            <span class="meta-tag meta-country">🌏 ${country}</span>
            <span class="meta-tag meta-industry">💼 ${industry}</span>
        `;
    }
}

function renderUserPosts(posts) {
    const list = document.getElementById('user-posts-list');
    const noPosts = document.getElementById('user-no-posts');
    if (!list || !noPosts) return;

    if (!posts.length) {
        list.innerHTML = '';
        noPosts.style.display = 'block';
        return;
    }

    noPosts.style.display = 'none';
    list.innerHTML = '';
    posts.forEach(post => {
        const card = createPostCard(post);
        list.appendChild(card);
    });
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
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
                event.preventDefault();
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
        if (typeof data.liked === 'boolean') {
            likeStatusMap.set(postIdNum, data.liked);
        }
        if (buttonEl) {
            const liked = likeStatusMap.get(postIdNum) === true;
            buttonEl.classList.toggle('liked', liked);
            const count = typeof data.likes_count === 'number' ? data.likes_count : 0;
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
        const userId = getUserIdFromQuery();
        if (userId) {
            loadUserPosts(userId);
        }
    } catch (error) {
        alert(error.message || '削除に失敗しました。');
    }
}
