// Gamification & Profile functionality

// Initialize profile page
async function initProfile() {
    await checkAuth();
    loadUserProfile();
    loadLeaderboard();
}

// Load user profile
async function loadUserProfile() {
    try {
        // Load gamification stats
        const gamificationData = await fetchAPI('/api/gamification/stats');
        
        if (gamificationData.success) {
            const { gamification } = gamificationData;
            
            // Update profile stats
            document.getElementById('profile-level').textContent = gamification.level;
            document.getElementById('profile-points').textContent = gamification.points;
            document.getElementById('profile-streak').textContent = gamification.streak.current;
            document.getElementById('points-count').textContent = gamification.points;
            
            // Update streak info
            document.getElementById('current-streak').textContent = `${gamification.streak.current} days`;
            document.getElementById('longest-streak').textContent = `${gamification.streak.longest} days`;
            
            // Update level progress
            const currentLevelPoints = (gamification.level - 1) * 100;
            const progressInLevel = gamification.points - currentLevelPoints;
            const progressPercent = (progressInLevel / 100) * 100;
            
            document.getElementById('level-progress-bar').style.width = `${progressPercent}%`;
            document.getElementById('next-level').textContent = gamification.level + 1;
            document.getElementById('points-to-next').textContent = `${progressInLevel} / 100 points`;
            
            // Display badges
            displayBadges(gamification.badges);
        }
        
        // Load user info
        if (currentUser) {
            document.getElementById('profile-name').textContent = currentUser.displayName || 'User';
            document.getElementById('profile-email').textContent = currentUser.email || '';
            
            const memberSince = new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
            document.getElementById('member-since').textContent = memberSince;
        }
        
        // Load activity stats (mock for now - you can implement API endpoints for these)
        loadActivityStats();
        
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// Display badges
function displayBadges(badges) {
    const container = document.getElementById('badges-container');
    
    if (!badges || badges.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 md:col-span-4 text-center p-12 bg-gray-100 rounded-2xl">
                <div class="text-6xl mb-4">🎯</div>
                <p class="text-xl text-gray-600">Start your journey to unlock badges!</p>
                <p class="text-gray-500 mt-2">Complete activities to earn achievements</p>
            </div>
        `;
        return;
    }
    
    // Get all possible badges
    const allBadges = [
        { key: 'first_chat', name: 'First Chat', description: 'Started wellness journey', icon: '💬', locked: true },
        { key: 'mood_tracker', name: 'Mood Tracker', description: 'Logged first mood', icon: '😊', locked: true },
        { key: 'week_streak', name: 'Week Warrior', description: '7-day streak', icon: '🔥', locked: true },
        { key: 'community_member', name: 'Community Member', description: 'First community post', icon: '👥', locked: true },
        { key: 'mindful_master', name: 'Mindful Master', description: '10 breathing exercises', icon: '🧘', locked: true },
        { key: 'music_lover', name: 'Music Lover', description: 'Explored 5 playlists', icon: '🎵', locked: true },
        { key: 'hundred_points', name: 'Century Club', description: 'Earned 100 points', icon: '💯', locked: true },
        { key: 'consistent', name: 'Consistent', description: '30-day streak', icon: '⭐', locked: true }
    ];
    
    // Mark earned badges
    badges.forEach(earned => {
        const badge = allBadges.find(b => b.name === earned.name);
        if (badge) {
            badge.locked = false;
            badge.earnedAt = earned.earnedAt;
        }
    });
    
    container.innerHTML = allBadges.map(badge => {
        if (badge.locked) {
            return `
                <div class="text-center p-6 bg-gray-100 rounded-2xl">
                    <div class="text-5xl mb-3 opacity-30">🔒</div>
                    <p class="font-semibold text-gray-500">${badge.name}</p>
                    <p class="text-sm text-gray-400">${badge.description}</p>
                </div>
            `;
        } else {
            return `
                <div class="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl hover:shadow-lg transition">
                    <div class="text-5xl mb-3">${badge.icon}</div>
                    <p class="font-semibold text-purple-600">${badge.name}</p>
                    <p class="text-sm text-gray-600">${badge.description}</p>
                    ${badge.earnedAt ? `<p class="text-xs text-gray-500 mt-2">Earned ${formatDate(badge.earnedAt)}</p>` : ''}
                </div>
            `;
        }
    }).join('');
}

// Load activity stats (mock implementation)
async function loadActivityStats() {
    // In a real implementation, you'd fetch these from API endpoints
    // For now, using mock data
    document.getElementById('chat-count').textContent = Math.floor(Math.random() * 20);
    document.getElementById('mood-count').textContent = Math.floor(Math.random() * 30);
    document.getElementById('post-count').textContent = Math.floor(Math.random() * 10);
    document.getElementById('wellness-count').textContent = Math.floor(Math.random() * 15);
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        const data = await fetchAPI('/api/gamification/leaderboard');
        
        if (data.success) {
            displayLeaderboard(data.leaderboard);
        }
    } catch (error) {
        console.error('Failed to load leaderboard:', error);
    }
}

// Display leaderboard
function displayLeaderboard(leaderboard) {
    const container = document.getElementById('leaderboard-container');
    
    if (!leaderboard || leaderboard.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No leaderboard data yet</p>';
        return;
    }
    
    container.innerHTML = leaderboard.map((user, index) => {
        let rankColor = 'bg-gray-200 text-gray-700';
        let rankIcon = '';
        
        if (index === 0) {
            rankColor = 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white';
            rankIcon = '🥇';
        } else if (index === 1) {
            rankColor = 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
            rankIcon = '🥈';
        } else if (index === 2) {
            rankColor = 'bg-gradient-to-r from-orange-400 to-amber-600 text-white';
            rankIcon = '🥉';
        }
        
        return `
            <div class="flex items-center justify-between bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 ${rankColor} rounded-full flex items-center justify-center font-bold text-lg">
                        ${rankIcon || user.rank}
                    </div>
                    <div>
                        <p class="font-bold text-gray-800">${user.displayName}</p>
                        <p class="text-sm text-gray-600">Level ${user.level} • ${user.badgeCount} badges</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-purple-600">${user.points}</p>
                    <p class="text-sm text-gray-600">points</p>
                </div>
            </div>
        `;
    }).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    
    return date.toLocaleDateString();
}

// Initialize on page load
if (window.location.pathname.includes('profile.html')) {
    initProfile();
}
