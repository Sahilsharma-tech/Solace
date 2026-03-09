let currentFilter = 'all';
let currentPostId = null;

async function initCommunity() {
    await checkAuth();
    loadUserPoints();
    loadPosts();
}

async function loadPosts(category = 'all') {
    try {
        const endpoint = category === 'all' 
            ? '/api/community/posts?limit=20'
            : `/api/community/posts?category=${category}&limit=20`;
            
        const data = await fetchAPI(endpoint);
        
        if (data.success) {
            displayPosts(data.posts);
        }
    } catch (error) {
        console.error('Failed to load posts:', error);
        showNotification('Failed to load community posts', 'error');
    }
}

function displayPosts(posts) {
    const container = document.getElementById('posts-container');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl p-12 text-center shadow-lg">
                <div class="text-6xl mb-4">📭</div>
                <p class="text-xl text-gray-600">No posts yet in this category</p>
                <p class="text-gray-500 mt-2">Be the first to share!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer" onclick="openPostDetail('${post._id}')">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <span class="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold">
                        ${formatMoodName(post.category)}
                    </span>
                </div>
                <span class="text-sm text-gray-500">${formatDate(post.createdAt)}</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">${escapeHtml(post.title)}</h3>
            <p class="text-gray-700 mb-4 line-clamp-3">${escapeHtml(post.content)}</p>
            <div class="flex items-center justify-between text-sm text-gray-600">
                <div class="flex items-center space-x-4">
                    <span class="font-semibold text-purple-600">${post.anonymousName}</span>
                    <span><i class="fas fa-heart text-pink-500 mr-1"></i>${post.likes}</span>
                    <span><i class="fas fa-comment text-cyan-500 mr-1"></i>${post.comments.length}</span>
                </div>
                <button onclick="event.stopPropagation(); openPostDetail('${post._id}')" class="text-purple-600 hover:text-purple-700 font-semibold">
                    Read more <i class="fas fa-arrow-right ml-1"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function filterPosts(category) {
    currentFilter = category;
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-purple-500', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    event.target.classList.remove('bg-gray-200', 'text-gray-700');
    event.target.classList.add('active', 'bg-purple-500', 'text-white');
    
    loadPosts(category);
}

function showNewPostModal() {
    document.getElementById('new-post-modal').classList.remove('hidden');
}

function closeNewPostModal() {
    document.getElementById('new-post-modal').classList.add('hidden');
    document.getElementById('new-post-form').reset();
}

document.getElementById('new-post-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('post-title').value.trim();
    const category = document.getElementById('post-category').value;
    const content = document.getElementById('post-content').value.trim();
    
    try {
        const data = await fetchAPI('/api/community/posts', {
            method: 'POST',
            body: JSON.stringify({ title, category, content })
        });
        
        if (data.success) {
            showNotification('Post shared successfully!', 'success');
            closeNewPostModal();
            loadPosts(currentFilter);
            
            awardPoints('community_post');
        }
    } catch (error) {
        showNotification('Failed to create post', 'error');
    }
});

async function openPostDetail(postId) {
    currentPostId = postId;
    
    try {
        const data = await fetchAPI(`/api/community/posts/${postId}`);
        
        if (data.success) {
            displayPostDetail(data.post);
            document.getElementById('post-detail-modal').classList.remove('hidden');
        }
    } catch (error) {
        showNotification('Failed to load post', 'error');
    }
}

function displayPostDetail(post) {
    document.getElementById('detail-title').textContent = post.title;
    document.getElementById('detail-author').textContent = post.anonymousName;
    document.getElementById('detail-date').textContent = formatDate(post.createdAt);
    document.getElementById('detail-content').textContent = post.content;
    document.getElementById('like-count').textContent = post.likes;
    document.getElementById('comment-count').textContent = `${post.comments.length} Comments`;
    
    const commentsList = document.getElementById('comments-list');
    if (post.comments.length === 0) {
        commentsList.innerHTML = '<p class="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>';
    } else {
        commentsList.innerHTML = post.comments.map(comment => `
            <div class="bg-gray-50 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-semibold text-purple-600">${comment.anonymousName}</span>
                    <span class="text-sm text-gray-500">${formatDate(comment.createdAt)}</span>
                </div>
                <p class="text-gray-700">${escapeHtml(comment.content)}</p>
            </div>
        `).join('');
    }
}

function closePostDetail() {
    document.getElementById('post-detail-modal').classList.add('hidden');
    currentPostId = null;
}

async function likePost() {
    if (!currentPostId) return;
    
    try {
        const data = await fetchAPI(`/api/community/posts/${currentPostId}/like`, {
            method: 'POST'
        });
        
        if (data.success) {
            document.getElementById('like-count').textContent = data.likes;
            const button = document.getElementById('like-button');
            button.classList.toggle('opacity-75');
        }
    } catch (error) {
        showNotification('Failed to like post', 'error');
    }
}

document.getElementById('comment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const content = document.getElementById('comment-input').value.trim();
    
    if (!content || !currentPostId) return;
    
    try {
        const data = await fetchAPI(`/api/community/posts/${currentPostId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        
        if (data.success) {
            showNotification('Comment added!', 'success');
            document.getElementById('comment-input').value = '';
            
            openPostDetail(currentPostId);
            
            awardPoints('community_comment');
        }
    } catch (error) {
        showNotification('Failed to add comment', 'error');
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMoodName(mood) {
    return mood.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

if (window.location.pathname.includes('community.html')) {
    initCommunity();
}
