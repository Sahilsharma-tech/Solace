
async function initMusic() {
    await checkAuth();
    loadUserPoints();
    loadCurrentMood();
}

async function loadCurrentMood() {
    try {
        const data = await fetchAPI('/api/music/recommendations');
        
        if (data.success) {
            document.getElementById('current-mood').textContent = formatMoodName(data.mood);
            displayPlaylists(data.playlists);
        }
    } catch (error) {
        console.error('Failed to load music recommendations:', error);
        document.getElementById('current-mood').textContent = 'Not set';
        displayFallbackPlaylists();
    }
}

async function loadMoodMusic(mood) {
    try {
        const data = await fetchAPI(`/api/music/recommendations/${mood}`);
        
        if (data.success) {
            document.getElementById('current-mood').textContent = formatMoodName(data.mood);
            displayPlaylists(data.playlists);
            showNotification(`Showing playlists for ${formatMoodName(mood)}`, 'success');
            
            awardPoints('music_listen');
        }
    } catch (error) {
        console.error('Failed to load mood music:', error);
        showNotification('Failed to load playlists', 'error');
    }
}

function displayPlaylists(playlists) {
    const container = document.getElementById('playlist-container');
    
    if (!playlists || playlists.length === 0) {
        displayFallbackPlaylists();
        return;
    }
    
    container.innerHTML = playlists.slice(0, 6).map(playlist => `
        <div class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 cursor-pointer">
            ${playlist.image ? `
                <img src="${playlist.image}" alt="${playlist.name}" class="w-full h-48 object-cover">
            ` : `
                <div class="w-full h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <i class="fas fa-music text-6xl text-white"></i>
                </div>
            `}
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-2">${playlist.name}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${playlist.description || 'Curated playlist for your mood'}</p>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-500">
                        <i class="fas fa-list mr-1"></i>${playlist.tracksTotal || '-'} tracks
                    </span>
                    <a href="${playlist.url}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition font-semibold text-sm">
                        <i class="fab fa-spotify mr-1"></i>Open
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

function displayFallbackPlaylists() {
    const fallbackPlaylists = [
        {
            name: '🧘 Peaceful Meditation',
            description: 'Calm your mind with soothing instrumental music',
            url: 'https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u',
            tracksTotal: 50
        },
        {
            name: '🌅 Chill Vibes',
            description: 'Relaxing music for any mood',
            url: 'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6',
            tracksTotal: 100
        },
        {
            name: '✨ Positive Energy',
            description: 'Uplifting tracks to boost your mood',
            url: 'https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0',
            tracksTotal: 75
        },
        {
            name: '☕ Study & Focus',
            description: 'Instrumental beats for concentration',
            url: 'https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6',
            tracksTotal: 120
        },
        {
            name: '🌙 Sleep Sounds',
            description: 'Gentle sounds for restful sleep',
            url: 'https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp',
            tracksTotal: 60
        },
        {
            name: '💪 Motivation',
            description: 'Energizing music to keep you going',
            url: 'https://open.spotify.com/playlist/37i9dQZF1DXdxcBWuJkbcy',
            tracksTotal: 80
        }
    ];
    
    displayPlaylists(fallbackPlaylists);
}

function formatMoodName(mood) {
    return mood.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

if (window.location.pathname.includes('music.html')) {
    initMusic();
}
