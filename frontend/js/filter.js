// ==================== フィルター管理システム ====================

// フィルター状態を管理するオブジェクト
const filterState = {
    country: new Set(),
    type: new Set(),
    industry: new Set()
};

// ==================== 初期化 ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 アプリケーション起動');
    
    // ローカルストレージから前回の選択状態を復元
    loadFiltersFromStorage();
    
    // イベントリスナーを設定
    setupEventListeners();
    
    // フィルターカウントを更新
    updateFilterCount();
    
    console.log('✅ 初期化完了');
});

// ==================== イベントリスナー設定 ====================
function setupEventListeners() {
    // すべてのタグボタンにクリックイベントを設定
    const allTags = document.querySelectorAll('.tag');
    allTags.forEach(tag => {
        tag.addEventListener('click', handleTagClick);
    });
    
    // リセットボタン
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', resetAllFilters);
    }
    
    // ソート選択（将来の実装用）
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }
    
    console.log('📌 イベントリスナー設定完了');
}

// ==================== タグクリック処理 ====================
function handleTagClick(event) {
    const tag = event.currentTarget;
    const filterType = tag.dataset.filter;  // 'country', 'type', 'industry'
    const value = tag.dataset.value;         // 'usa', 'housing', 'it' など
    
    // 選択状態をトグル
    if (tag.classList.contains('selected')) {
        // 選択解除
        tag.classList.remove('selected');
        filterState[filterType].delete(value);
        console.log(`❌ 解除: ${filterType} - ${value}`);
    } else {
        // 選択
        tag.classList.add('selected');
        filterState[filterType].add(value);
        console.log(`✅ 選択: ${filterType} - ${value}`);
    }
    
    // ローカルストレージに保存
    saveFiltersToStorage();
    
    // フィルターカウント更新
    updateFilterCount();
    
    // 投稿をフィルタリング（明日実装予定）
    // filterPosts();
    
    // 視覚フィードバック（アニメーション）
    tag.style.transform = 'scale(0.95)';
    setTimeout(() => {
        tag.style.transform = '';
    }, 100);
}

// ==================== ローカルストレージ管理 ====================

// フィルター状態を保存
function saveFiltersToStorage() {
    const storageData = {
        country: Array.from(filterState.country),
        type: Array.from(filterState.type),
        industry: Array.from(filterState.industry),
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('overseasJobFilters', JSON.stringify(storageData));
    console.log('💾 フィルター状態を保存:', storageData);
}

// フィルター状態を読み込み
function loadFiltersFromStorage() {
    const saved = localStorage.getItem('overseasJobFilters');
    
    if (!saved) {
        console.log('📭 保存されたフィルターなし');
        return;
    }
    
    try {
        const data = JSON.parse(saved);
        
        // Setに復元
        filterState.country = new Set(data.country || []);
        filterState.type = new Set(data.type || []);
        filterState.industry = new Set(data.industry || []);
        
        // UIに反映
        restoreTagSelections();
        
        console.log('📬 フィルター状態を復元:', data);
    } catch (error) {
        console.error('❌ フィルター読み込みエラー:', error);
        localStorage.removeItem('overseasJobFilters');
    }
}

// タグの選択状態をUIに反映
function restoreTagSelections() {
    // 国・地域
    filterState.country.forEach(value => {
        const tag = document.querySelector(`[data-filter="country"][data-value="${value}"]`);
        if (tag) tag.classList.add('selected');
    });
    
    // 知見の種類
    filterState.type.forEach(value => {
        const tag = document.querySelector(`[data-filter="type"][data-value="${value}"]`);
        if (tag) tag.classList.add('selected');
    });
    
    // 業界・職種
    filterState.industry.forEach(value => {
        const tag = document.querySelector(`[data-filter="industry"][data-value="${value}"]`);
        if (tag) tag.classList.add('selected');
    });
}

// ==================== フィルターカウント表示 ====================
function updateFilterCount() {
    const total = filterState.country.size + 
                  filterState.type.size + 
                  filterState.industry.size;
    
    const countElement = document.getElementById('filter-count');
    if (countElement) {
        countElement.textContent = `選択中: ${total}件`;
        
        // カウントに応じて色を変える
        if (total > 0) {
            countElement.style.color = '#667eea';
            countElement.style.fontWeight = '700';
        } else {
            countElement.style.color = '#888';
            countElement.style.fontWeight = '600';
        }
    }
    
    console.log(`📊 選択中のフィルター: ${total}件`);
}

// ==================== フィルターリセット ====================
function resetAllFilters() {
    console.log('🔄 フィルターをリセット');
    
    // すべての選択を解除
    filterState.country.clear();
    filterState.type.clear();
    filterState.industry.clear();
    
    // UIからselectedクラスを削除
    const allSelectedTags = document.querySelectorAll('.tag.selected');
    allSelectedTags.forEach(tag => {
        tag.classList.remove('selected');
    });
    
    // ローカルストレージをクリア
    localStorage.removeItem('overseasJobFilters');
    
    // カウント更新
    updateFilterCount();
    
    // 視覚フィードバック
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.textContent = 'リセット完了！';
        setTimeout(() => {
            resetButton.textContent = 'フィルターをリセット';
        }, 1500);
    }
    
    console.log('✅ リセット完了');
}

// ==================== ソート変更処理（将来の実装用） ====================
function handleSortChange(event) {
    const sortType = event.target.value;
    console.log(`🔀 ソート変更: ${sortType}`);
    
    // 実装予定：
    // - latest: 新着順
    // - popular: 人気順（いいね数）
    // - oldest: 古い順
}

// ==================== フィルター取得（他のファイルから使用可能） ====================

// 現在のフィルター状態を取得
function getCurrentFilters() {
    return {
        country: Array.from(filterState.country),
        type: Array.from(filterState.type),
        industry: Array.from(filterState.industry)
    };
}

// フィルターが選択されているか確認
function hasActiveFilters() {
    return filterState.country.size > 0 || 
           filterState.type.size > 0 || 
           filterState.industry.size > 0;
}

// ==================== デバッグ用ヘルパー ====================

// コンソールに現在の状態を表示
function debugFilters() {
    console.log('==================== フィルター状態 ====================');
    console.log('国・地域:', Array.from(filterState.country));
    console.log('知見の種類:', Array.from(filterState.type));
    console.log('業界・職種:', Array.from(filterState.industry));
    console.log('合計:', filterState.country.size + filterState.type.size + filterState.industry.size);
    console.log('======================================================');
}

// ブラウザのコンソールから使えるようにグローバルに公開
window.debugFilters = debugFilters;
window.getCurrentFilters = getCurrentFilters;

// ==================== 保存ボタン（設定画面用）====================
document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save-filters');
    
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            console.log('💾 設定を保存して投稿一覧へ');
            
            // 視覚フィードバック
            saveButton.textContent = '✓ 保存しました！';
            saveButton.style.background = '#4caf50';
            
            setTimeout(() => {
                location.href = 'index.html';
            }, 500);
        });
    }
});

console.log('🎉 filter.js 読み込み完了');
