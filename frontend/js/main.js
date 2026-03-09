let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

const API_BASE = window.location.origin;
async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, mergedOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function checkAuth() {
    if (authToken && currentUser) {
        const authButtons = document.getElementById('auth-buttons');
        if (authButtons) {
            authButtons.innerHTML = `
                <button onclick="window.location.href='/pages/dashboard.html'" class="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition">
                    Go to Dashboard
                </button>
            `;
        }

        loadUserPoints();
        return currentUser;
    } else {
        if (window.location.pathname.includes('/pages/')) {
            window.location.href = '/index.html';
        }
        return null;
    }
}

async function authenticateWithBackend(user) {
    return user;
}

async function loadUserPoints() {
    const pointsElement = document.getElementById('points-count');
    if (!pointsElement) return;

    try {
        const data = await fetchAPI('/api/gamification/stats');
        if (data.success) {
            pointsElement.textContent = data.gamification.points;
        }
    } catch (error) {
        console.error('Failed to load points:', error);
    }
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Welcome back!', 'success');
            setTimeout(() => {
                window.location.href = '/pages/dashboard.html';
            }, 1000);
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification(error.message || 'Login failed', 'error');
    }
});

document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const displayName = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const age = document.getElementById('signup-age').value;

    try {
        const response = await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, displayName, age: parseInt(age) })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Account created successfully!', 'success');
            setTimeout(() => {
                window.location.href = '/pages/dashboard.html';
            }, 1000);
        } else {
            showNotification(data.error || 'Signup failed', 'error');
        }
    } catch (error) {
        showNotification(error.message || 'Signup failed', 'error');
    }
});

async function logout() {
    try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        authToken = null;
        currentUser = null;
        showNotification('Logged out successfully', 'success');
        window.location.href = '/index.html';
    } catch (error) {
        showNotification('Logout failed', 'error');
    }
}

function showLoginModal() {
    closeModal('signup-modal');
    document.getElementById('login-modal').classList.remove('hidden');
}

function showSignupModal() {
    closeModal('login-modal');
    document.getElementById('signup-modal').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
}

function scrollToFeatures() {
    document.getElementById('features-preview')?.scrollIntoView({ behavior: 'smooth' });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    } text-white font-semibold`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('translate-x-full', 'opacity-0'), 3000);
    setTimeout(() => notification.remove(), 3500);
}

async function awardPoints(activityType) {
    try {
        const data = await fetchAPI('/api/gamification/activity', {
            method: 'POST',
            body: JSON.stringify({ activityType })
        });

        if (data.success && data.leveledUp) {
            showNotification(`🎉 Level Up! You're now level ${data.level}!`, 'success');
        }

        loadUserPoints();
    } catch (error) {
        console.error('Failed to award points:', error);
    }
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

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
