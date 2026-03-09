let selectedMoodData = null;
let moodChart = null;

async function initMoodTracker() {
    await checkAuth();
    loadMoodHistory();
    loadMoodStats();
    loadUserPoints();
}

function selectMood(mood, score) {
    selectedMoodData = { mood, moodScore: score };
    
    document.getElementById('selected-mood').value = mood;
    document.getElementById('mood-score').value = score;
    
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('border-purple-500', 'bg-purple-50');
    });
    
    event.target.closest('.mood-btn').classList.add('border-purple-500', 'bg-purple-50');
    
    document.getElementById('mood-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('mood-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedMoodData) {
        showNotification('Please select a mood first!', 'error');
        return;
    }
    
    const notes = document.getElementById('mood-notes').value.trim();
    const activities = Array.from(document.querySelectorAll('input[name="activities"]:checked'))
        .map(cb => cb.value);
    
    try {
        const data = await fetchAPI('/api/mood/log', {
            method: 'POST',
            body: JSON.stringify({
                mood: selectedMoodData.mood,
                moodScore: selectedMoodData.moodScore,
                notes,
                activities
            })
        });
        
        if (data.success) {
            showNotification('Mood logged successfully!', 'success');
            
            if (data.suggestion) {
                showSuggestion(data.suggestion);
            }
            
            if (data.intervention) {
                showNotification(`💙 ${data.intervention.name}: ${data.intervention.description}`, 'info');
            }
            
            document.getElementById('mood-form').reset();
            selectedMoodData = null;
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.classList.remove('border-purple-500', 'bg-purple-50');
            });
            
            loadMoodHistory();
            loadMoodStats();
            
            awardPoints('mood_log');
        }
    } catch (error) {
        showNotification('Failed to log mood', 'error');
    }
});

function showSuggestion(suggestion) {
    const suggestionDiv = document.getElementById('ai-suggestion');
    const suggestionText = document.getElementById('suggestion-text');
    
    suggestionText.textContent = suggestion;
    suggestionDiv.classList.remove('hidden');
    
    suggestionDiv.scrollIntoView({ behavior: 'smooth' });
}

async function loadMoodHistory() {
    try {
        const data = await fetchAPI('/api/mood/history?days=7');
        
        if (data.success && data.moods.length > 0) {
            displayMoodChart(data.moods);
        }
    } catch (error) {
        console.error('Failed to load mood history:', error);
    }
}

function displayMoodChart(moods) {
    const ctx = document.getElementById('mood-history-chart')?.getContext('2d');
    if (!ctx) return;
    
    if (moodChart) {
        moodChart.destroy();
    }
    
    const sortedMoods = moods.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const labels = sortedMoods.map(m => new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const scores = sortedMoods.map(m => m.moodScore);
    
    moodChart= new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mood Score',
                data: scores,
                borderColor: 'rgb(236, 72, 153)',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2
                    }
                }
            }
        }
    });
}

async function loadMoodStats() {
    try {
        const data = await fetchAPI('/api/mood/stats?days=7');
        
        if (data.success) {
            const stats = data.stats;
            
            document.getElementById('avg-mood').textContent = stats.averageScore || '-';
            document.getElementById('total-entries').textContent = stats.totalEntries || '0';
            
            if (stats.moodDistribution) {
                const entries = Object.entries(stats.moodDistribution);
                if (entries.length > 0) {
                    const mostCommon = entries.reduce((a, b) => a[1] > b[1] ? a : b);
                    document.getElementById('common-mood').textContent = formatMoodName(mostCommon[0]);
                }
            }
        }
    } catch (error) {
        console.error('Failed to load mood stats:', error);
    }
}

function formatMoodName(mood) {
    return mood.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

if (window.location.pathname.includes('mood-tracker.html')) {
    initMoodTracker();
}
