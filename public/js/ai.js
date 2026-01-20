


let currentModel = 'llama-3.1-8b';
let conversationHistory = [];
let storageReady = false;


const hasWindowStorage = typeof window !== 'undefined' && window.storage;


async function loadSavedModel() {
    try {
        let savedModel = null;
        
        if (hasWindowStorage) {
      
            const result = await window.storage.get('saturn-ai-model');
            savedModel = result?.value;
        } else {
       
            savedModel = localStorage.getItem('saturn-ai-model');
        }
        
        if (savedModel) {
            currentModel = savedModel;
            console.log('✅ Loaded saved model:', currentModel);
            return true;
        } else {
            console.log('ℹ️ No saved model found, using default:', currentModel);
            return false;
        }
    } catch (error) {
        console.log('⚠️ Storage error, using default model:', error);
        return false;
    }
}


async function saveModel(model) {
    try {
        if (hasWindowStorage) {
   
            await window.storage.set('saturn-ai-model', model);
        } else {
       
            localStorage.setItem('saturn-ai-model', model);
        }
        console.log('✅ Model saved successfully:', model);
        return true;
    } catch (error) {
        console.error('❌ Failed to save model:', error);
        return false;
    }
}


document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Saturn AI initializing...');
    
 
    await loadSavedModel();
    
   
    const dropdown = document.getElementById('model-dropdown');
    dropdown.value = currentModel;
    
    storageReady = true;
    console.log('✅ Saturn AI initialized with model:', currentModel);
});


const modelDropdown = document.getElementById('model-dropdown');
modelDropdown.addEventListener('change', async function() {
    const newModel = this.value;
    console.log('🔄 Switching from', currentModel, 'to', newModel);
    
    currentModel = newModel;
    
  
    const saved = await saveModel(currentModel);
    
    if (saved) {
        console.log('✅ Model switched and saved:', currentModel);
    } else {
        console.log('⚠️ Model switched but not saved:', currentModel);
    }
});


document.getElementById('clear-chat-btn').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear the chat?')) {
        conversationHistory = [];
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="welcome-screen" id="welcome-screen">
                <h2>Welcome to Saturn AI</h2>
                <p>Your intelligent assistant powered by advanced AI models</p>
                <div class="suggestion-cards">
                    <div class="suggestion-card" onclick="useSuggestion('Explain quantum computing in simple terms')">
                        <div class="suggestion-card-header">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                            <h3>Explain</h3>
                        </div>
                        <p>Quantum computing in simple terms</p>
                    </div>
                    <div class="suggestion-card" onclick="useSuggestion('Write a Python function to sort an array')">
                        <div class="suggestion-card-header">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                            </svg>
                            <h3>Code</h3>
                        </div>
                        <p>Python sorting function</p>
                    </div>
                    <div class="suggestion-card" onclick="useSuggestion('Give me creative writing prompts')">
                        <div class="suggestion-card-header">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                            <h3>Create</h3>
                        </div>
                        <p>Creative writing prompts</p>
                    </div>
                    <div class="suggestion-card" onclick="useSuggestion('What are the latest AI trends?')">
                        <div class="suggestion-card-header">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <h3>Research</h3>
                        </div>
                        <p>Latest AI trends</p>
                    </div>
                </div>
            </div>
            <div class="typing-indicator" id="typing-indicator">
                <div class="message-avatar">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                </div>
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
    }
});


const chatInput = document.getElementById('chat-input');
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});


chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});


document.getElementById('send-btn').addEventListener('click', sendMessage);


function useSuggestion(text) {
    chatInput.value = text;
    sendMessage();
}


function addMessage(content, isUser) {
    const messagesContainer = document.getElementById('chat-messages');
    const welcomeScreen = document.getElementById('welcome-screen');
    
    if (welcomeScreen) {
        welcomeScreen.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (isUser) {
        avatar.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>`;
    } else {
        avatar.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>`;
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = formatMessage(content);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    messagesContainer.insertBefore(messageDiv, document.getElementById('typing-indicator'));
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


function formatMessage(text) {

    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    return text.replace(/\n/g, '<br>');
}


function showTyping(show) {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.classList.toggle('active', show);
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


async function callGroqAPI(messages) {
    const modelName = API_CONFIG.groq.models[currentModel] || API_CONFIG.groq.models['llama-3.1-8b'];
    
    console.log('Calling Groq API with model:', modelName);
    
    const response = await fetch(API_CONFIG.groq.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_CONFIG.groq.key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: modelName,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}


async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    

    addMessage(message, true);
    conversationHistory.push({ role: 'user', content: message });
    
    input.value = '';
    input.style.height = 'auto';
    

    showTyping(true);
    
    try {
        let aiResponse;
        
        console.log('Current model:', currentModel);
        
    
        aiResponse = await callGroqAPI(conversationHistory);
        
        showTyping(false);
        addMessage(aiResponse, false);
        conversationHistory.push({ role: 'assistant', content: aiResponse });
        
    } catch (error) {
        showTyping(false);
        console.error('API Error:', error);
        addMessage(`❌ Error: ${error.message}\n\nPlease check:\n1. Your API key is correctly set in config.js\n2. You have available credits/quota\n3. Your internet connection\n4. The model is available`, false);
    }
}