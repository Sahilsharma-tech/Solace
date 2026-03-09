// Wellness & Yoga functionality
let breathingInterval = null;
let timerInterval = null;
let breathingExercise = null;
let currentRound = 0;
let totalRounds = 4;
let isPaused = false;

// Initialize wellness page
async function initWellness() {
    await checkAuth();
    loadUserPoints();
}

// Start breathing exercise
async function startBreathing(type) {
    currentRound = 0;
    isPaused = false;
    
    const exercises = {
        '478': {
            name: '4-7-8 Breathing',
            phases: [
                { name: 'Breathe In', duration: 4, scale: 1.5 },
                { name: 'Hold', duration: 7, scale: 1.5 },
                { name: 'Breathe Out', duration: 8, scale: 1 }
            ]
        },
        'box': {
            name: 'Box Breathing',
            phases: [
                { name: 'Breathe In', duration: 4, scale: 1.5 },
                { name: 'Hold', duration: 4, scale: 1.5 },
                { name: 'Breathe Out', duration: 4, scale: 1 },
                { name: 'Hold', duration: 4, scale: 1 }
            ]
        },
        'belly': {
            name: 'Deep Belly Breathing',
            phases: [
                { name: 'Breathe In Deeply', duration: 5, scale: 1.6 },
                { name: 'Breathe Out Slowly', duration: 5, scale: 1 }
            ]
        }
    };
    
    breathingExercise = exercises[type];
    
    // Show breathing session
    document.getElementById('breathing-session').classList.remove('hidden');
    document.getElementById('exercise-name').textContent = breathingExercise.name;
    
    // Start exercise
    runBreathingCycle();
}

// Run breathing cycle
async function runBreathingCycle() {
    if (isPaused) return;
    
    for (const phase of breathingExercise.phases) {
        if (isPaused) break;
        
        await executePhase(phase);
    }
    
    if (!isPaused) {
        currentRound++;
        document.getElementById('rounds-completed').textContent = currentRound;
        
        if (currentRound < totalRounds) {
            setTimeout(() => runBreathingCycle(), 1000);
        } else {
            completeBreathing();
        }
    }
}

// Execute single phase
function executePhase(phase) {
    return new Promise((resolve) => {
        const circle = document.getElementById('breathing-circle');
        const countEl = document.getElementById('breath-count');
        const phaseEl = document.getElementById('breath-phase');
        
        phaseEl.textContent = phase.name;
        
        // Animate circle
        if (phase.scale > 1) {
            circle.style.transform = `scale(${phase.scale})`;
        } else {
            circle.style.transform = 'scale(1)';
        }
        
        let timeLeft = phase.duration;
        countEl.textContent = timeLeft;
        
        const countdown = setInterval(() => {
            if (isPaused) {
                clearInterval(countdown);
                resolve();
                return;
            }
            
            timeLeft--;
            countEl.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(countdown);
                resolve();
            }
        }, 1000);
    });
}

// Pause breathing
function pauseBreathing() {
    isPaused = !isPaused;
    const button = event.target;
    
    if (isPaused) {
        button.innerHTML = '<i class="fas fa-play mr-2"></i>Resume';
    } else {
        button.innerHTML = '<i class="fas fa-pause mr-2"></i>Pause';
        runBreathingCycle();
    }
}

// Stop breathing
function stopBreathing() {
    isPaused = true;
    document.getElementById('breathing-session').classList.add('hidden');
    document.getElementById('breathing-circle').style.transform = 'scale(1)';
    
    if (currentRound > 0) {
        showNotification(`Great job! You completed ${currentRound} rounds.`, 'success');
        awardPoints('breathing_exercise');
    }
}

// Complete breathing exercise
function completeBreathing() {
    showNotification('🎉 Breathing exercise complete! Well done!', 'success');
    awardPoints('breathing_exercise');
    
    setTimeout(() => {
        stopBreathing();
    }, 2000);
}

// Start meditation timer
function startTimer(minutes) {
    document.getElementById('timer-modal').classList.remove('hidden');
    
    let totalSeconds = minutes * 60;
    const display = document.getElementById('timer-display');
    
    function updateDisplay() {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateDisplay();
    
    timerInterval = setInterval(() => {
        totalSeconds--;
        updateDisplay();
        
        if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            completeTimer();
        }
    }, 1000);
}

// Pause timer
function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        event.target.innerHTML = '<i class="fas fa-play mr-2"></i>Resume';
    } else {
        const display = document.getElementById('timer-display');
        const [mins, secs] = display.textContent.split(':').map(Number);
        const totalSeconds = (mins * 60) + secs;
        startTimer(totalSeconds / 60);
        event.target.innerHTML = '<i class="fas fa-pause mr-2"></i>Pause';
    }
}

// Stop timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    document.getElementById('timer-modal').classList.add('hidden');
}

// Complete timer
function completeTimer() {
    showNotification('🧘 Meditation complete! You did great!', 'success');
    awardPoints('yoga_session');
    
    // Play completion sound (optional)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwF');
    audio.play().catch(() => {});
    
    setTimeout(() => {
        stopTimer();
    }, 3000);
}

// Initialize on page load
if (window.location.pathname.includes('yoga.html')) {
    initWellness();
}
