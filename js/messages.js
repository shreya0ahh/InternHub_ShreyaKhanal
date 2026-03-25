// InternHub - Messaging Logic

let currentChatId = null;
let chatRefreshInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initMessages();
});

async function initMessages() {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('user');

    await loadConversations(userIdFromUrl);

    // Send message handlers
    const sendBtn = document.getElementById('sendMessageBtn');
    const input = document.getElementById('messageInput');

    if (sendBtn && input) {
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

async function loadConversations(openUserId = null) {
    const list = document.getElementById('conversationsList');
    if (!list) return;

    try {
        const conversations = await API.getConversations();

        if (conversations.length === 0 && !openUserId) {
            list.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: var(--spacing-lg);">Connect with people to start messaging!</p>';
            return;
        }

        list.innerHTML = conversations.map(user => {
            const avatarSrc = getAvatarUrl(user.avatar, user.name);
            return `
                <div class="message-item ${currentChatId == user.id ? 'active' : ''}" data-user-id="${user.id}">
                    <div class="message-avatar-wrapper">
                        <img src="${avatarSrc}" alt="${user.name}" class="avatar">
                        <div class="message-online-indicator"></div>
                    </div>
                    <div class="message-content">
                    <div class="message-header">
                        <div class="message-name">${user.name}</div>
                        <div class="message-time">${user.last_message ? getTimeAgo(user.last_message.created_at) : ''}</div>
                    </div>
                    <div class="message-preview">${user.last_message ? truncate(user.last_message.content, 30) : 'Click to start chatting...'}</div>
                </div>
            </div>
        `;
        }).join('');

        document.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                openChat(userId);
            });
        });

        // If user ID provided in URL and not in list, we might need to fetch them
        if (openUserId && !conversations.some(c => c.id == openUserId)) {
            try {
                const user = await API.getProfile(openUserId);
                const tempItem = document.createElement('div');
                tempItem.className = `message-item active`;
                tempItem.dataset.userId = user.id;
                tempItem.innerHTML = `
                    <div class="message-avatar-wrapper">
                        <img src="${getAvatarUrl(user.avatar, user.name)}" alt="${user.name}" class="avatar">
                        <div class="message-online-indicator"></div>
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <div class="message-name">${user.name}</div>
                            <div class="message-time">New</div>
                        </div>
                        <div class="message-preview">Send a message to start chatting...</div>
                    </div>
                `;
                list.prepend(tempItem);
                tempItem.addEventListener('click', () => openChat(user.id));
                openChat(user.id);
            } catch (err) {
                console.error('Failed to load user for new chat:', err);
            }
        } else if (openUserId) {
            openChat(openUserId);
        }

    } catch (error) {
        console.error('Failed to load conversations:', error);
    }
}

async function openChat(userId) {
    if (chatRefreshInterval) clearInterval(chatRefreshInterval);

    currentChatId = userId;

    // Highlight active item
    document.querySelectorAll('.message-item').forEach(item => {
        item.classList.toggle('active', item.dataset.userId == userId);
    });

    try {
        // Fetch user info for header
        const user = await API.getProfile(userId);
        const avatarSrc = getAvatarUrl(user.avatar, user.name);

        document.getElementById('chatName').textContent = user.name;
        document.getElementById('chatAvatar').src = avatarSrc;
        document.getElementById('chatStatus').textContent = user.type === 'company' ? 'Company' : 'Student';

        const messages = await API.getMessages(userId);

        // Mark as read
        await API.markMessagesRead(userId);

        renderMessages(messages);

        // Start polling for new messages (simple implementation)
        let lastMessageCount = messages.length;
        chatRefreshInterval = setInterval(async () => {
            if (currentChatId !== userId) {
                clearInterval(chatRefreshInterval);
                return;
            }

            try {
                const updatedMessages = await API.getMessages(userId);
                if (updatedMessages.length > lastMessageCount) {
                    lastMessageCount = updatedMessages.length;
                    renderMessages(updatedMessages);
                    // Centralized badge update will handle the rest, or call if critical
                    if (typeof updateNotificationBadges === 'function') {
                        updateNotificationBadges();
                    }
                }
            } catch (err) {
                console.warn('Chat poll failed:', err);
            }
        }, 3000); // 3 seconds is enough for "live" feel without overwhelming

    } catch (error) {
        console.error('Failed to open chat:', error);
    }
}

function renderMessages(messages) {
    const container = document.getElementById('chatMessages');
    const currentUser = Storage.getCurrentUser();

    if (messages.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">Start of your conversation</div>';
        return;
    }

    container.innerHTML = messages.map(msg => `
        <div class="chat-message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}">
            <div class="chat-message-bubble">
                <div class="chat-message-text">${msg.content}</div>
                <div class="chat-message-meta">${msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'} ${msg.sender_id === currentUser.id ? (msg.read_status ? '✓✓' : '✓') : ''}</div>
            </div>
        </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content || !currentChatId) return;

    try {
        const msg = await API.sendMessage(currentChatId, content);
        input.value = '';

        // Refresh messages immediately
        const messages = await API.getMessages(currentChatId);
        renderMessages(messages);

        // Refresh conversation list preview
        loadConversations();

    } catch (error) {
        alert('Failed to send message');
    }
}

function truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
