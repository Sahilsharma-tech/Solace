// Chatbot functionality
let currentSessionId = null;
let isTyping = false;

// Initialize chatbot
async function initChatbot() {
    await checkAuth();
    await createNewSession();
    loadUserPoints();
}

// Create new chat session
async function createNewSession() {
    try {
        const data = await fetchAPI('/api/chatbot/session', {
            method: 'POST'
        });

        if (data.success) {
            currentSessionId = data.sessionId;
            clearChat();
            showNotification('New chat session started!', 'success');
        }
    } catch (error) {
        showNotification('Failed to create session', 'error');
    }
}

// Start new chat
async function startNewChat() {
    if (confirm('Start a new chat? Your current conversation will be saved.')) {
        await createNewSession();
    }
}

// Clear chat UI
function clearChat() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = `
        <div class="flex items-center justify-center h-full text-gray-400">
            <div class="text-center">
                <div class="text-6xl mb-4">💬</div>
                <p class="text-xl">Start a conversation with your AI companion</p>
                <p class="text-sm mt-2">Share your thoughts, feelings, or just say hello!</p>
            </div>
        </div>
    `;
}

// Handle chat form submission
document.getElementById('chat-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || isTyping) return;
    
    // Clear input
    input.value = '';
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Show typing indicator
    showTypingIndicator();
    isTyping = true;
    
    try {
        const data = await fetchAPI('/api/chatbot/message', {
            method: 'POST',
            body: JSON.stringify({
                sessionId: currentSessionId,
                message: message
            })
        });
        
        // Remove typing indicator
        removeTypingIndicator();
        isTyping = false;
        
        if (data.success) {
            // Add AI response
            addMessageToChat('assistant', data.response);
            
            // Show intervention if triggered
            if (data.intervention) {
                showIntervention(data.intervention);
            }

            // Award points for chat activity
            awardPoints('chat_session');
        }
    } catch (error) {
        removeTypingIndicator();
        isTyping = false;
        showNotification('Failed to send message', 'error');
    }
});

// Add message to chat
function addMessageToChat(role, content) {
    const chatMessages = document.getElementById('chat-messages');
    
    // Remove placeholder if exists
    if (chatMessages.querySelector('.text-gray-400')) {
        chatMessages.innerHTML = '';
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`;
    
    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl max-w-xl shadow-lg">
                <p class="whitespace-pre-wrap">${escapeHtml(content)}</p>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="flex items-start space-x-3 max-w-xl">
                <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white"></i>
                </div>
                <div class="bg-white px-6 py-3 rounded-2xl shadow-lg">
                    <p class="whitespace-pre-wrap text-gray-800">${escapeHtml(content)}</p>
                </div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'flex justify-start mb-4';
    typingDiv.innerHTML = `
        <div class="flex items-center space-x-2 bg-white px-6 py-3 rounded-2xl shadow-lg">
            <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    document.getElementById('typing-indicator')?.remove();
}

// Show intervention
function showIntervention(intervention) {
    const alert = document.getElementById('intervention-alert');
    const title = document.getElementById('intervention-title');
    const content = document.getElementById('intervention-content');
    
    title.textContent = intervention.name;
    
    if (typeof intervention.content === 'object' && intervention.content.steps) {
        content.innerHTML = intervention.content.steps.map((step, i) => 
            `<div class="mb-1">${i + 1}. ${step}</div>`
        ).join('');
    } else {
        content.textContent = intervention.content;
    }
    
    alert.classList.remove('hidden');
    
    // Auto-hide after 30 seconds
    setTimeout(() => {
        alert.classList.add('hidden');
    }, 30000);
}

// Close intervention
function closeIntervention() {
    document.getElementById('intervention-alert').classList.add('hidden');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
if (window.location.pathname.includes('chatbot.html')) {
    initChatbot();
}
