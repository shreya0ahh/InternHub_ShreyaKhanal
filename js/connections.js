// InternHub - Connections Management

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.network-tab')) {
        initConnections();
    }
});

function initConnections() {
    // Tab switching
    document.querySelectorAll('.network-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });

    // Load initial tab
    loadSuggestions();
}

function switchTab(tabName) {
    document.querySelectorAll('.network-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.network-section').forEach(s => s.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Section`).classList.add('active');

    switch (tabName) {
        case 'suggestions': loadSuggestions(); break;
        case 'connections': loadConnections(); break;
        case 'requests': loadRequests(); break;
    }
}

function loadSuggestions() {
    const currentUser = Storage.getCurrentUser();
    const users = Storage.get(Storage.KEYS.USERS) || [];
    const connections = Storage.get(Storage.KEYS.CONNECTIONS) || [];

    // Get connected user IDs
    const connectedIds = connections
        .filter(c => (c.senderId === currentUser.id || c.receiverId === currentUser.id) && c.status === 'accepted')
        .map(c => c.senderId === currentUser.id ? c.receiverId : c.senderId);

    // Get pending request IDs
    const pendingIds = connections
        .filter(c => c.senderId === currentUser.id && c.status === 'pending')
        .map(c => c.receiverId);

    // Filter suggestions (not self, not connected, not pending)
    const suggestions = users.filter(u =>
        u.id !== currentUser.id &&
        !connectedIds.includes(u.id) &&
        !pendingIds.includes(u.id)
    );

    const container = document.getElementById('suggestionsSection');

    if (suggestions.length === 0) {
        container.innerHTML = '<div class="glass-card text-center"><p style="color: var(--text-tertiary);">No suggestions available</p></div>';
        return;
    }

    container.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--spacing-md);">` +
        suggestions.map(user => `
      <div class="glass-card">
        <div class="text-center">
          <img src="${user.avatar}" alt="${user.name}" class="avatar avatar-xl" style="margin-bottom: var(--spacing-sm);">
          <h4>${user.name}</h4>
          <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: var(--spacing-md);">${user.headline || ''}</p>
          ${user.skills ? `<div class="flex flex-wrap gap-xs justify-center mb-md">${user.skills.slice(0, 3).map(s => `<span class="badge badge-glass">${s}</span>`).join('')}</div>` : ''}
          <button class="btn btn-primary connect-btn" data-user-id="${user.id}" style="width: 100%;">Connect</button>
        </div>
      </div>
    `).join('') + `</div>`;

    document.querySelectorAll('.connect-btn').forEach(btn => {
        btn.addEventListener('click', () => sendConnectionRequest(btn.dataset.userId));
    });
}

function loadConnections() {
    const currentUser = Storage.getCurrentUser();
    const users = Storage.get(Storage.KEYS.USERS) || [];
    const connections = Storage.get(Storage.KEYS.CONNECTIONS) || [];

    const myConnections = connections
        .filter(c => (c.senderId === currentUser.id || c.receiverId === currentUser.id) && c.status === 'accepted')
        .map(c => {
            const userId = c.senderId === currentUser.id ? c.receiverId : c.senderId;
            return users.find(u => u.id === userId);
        })
        .filter(u => u);

    const container = document.getElementById('connectionsSection');

    if (myConnections.length === 0) {
        container.innerHTML = '<div class="glass-card text-center"><p style="color: var(--text-tertiary);">No connections yet</p></div>';
        return;
    }

    container.innerHTML = myConnections.map(user => `
    <div class="glass-card flex gap-md items-center" style="margin-bottom: var(--spacing-sm);">
      <img src="${user.avatar}" alt="${user.name}" class="avatar avatar-lg">
      <div style="flex: 1;">
        <h4>${user.name}</h4>
        <p style="color: var(--text-secondary); font-size: 0.875rem;">${user.headline || ''}</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-ghost message-btn" data-user-id="${user.id}">💬 Message</button>
        <button class="btn btn-ghost">👁️ View Profile</button>
      </div>
    </div>
  `).join('');

    document.querySelectorAll('.message-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = `messages.html?user=${btn.dataset.userId}`;
        });
    });
}

function loadRequests() {
    const currentUser = Storage.getCurrentUser();
    const users = Storage.get(Storage.KEYS.USERS) || [];
    const connections = Storage.get(Storage.KEYS.CONNECTIONS) || [];

    const requests = connections
        .filter(c => c.receiverId === currentUser.id && c.status === 'pending')
        .map(c => ({
            connection: c,
            user: users.find(u => u.id === c.senderId)
        }))
        .filter(r => r.user);

    const container = document.getElementById('requestsSection');

    if (requests.length === 0) {
        container.innerHTML = '<div class="glass-card text-center"><p style="color: var(--text-tertiary);">No pending requests</p></div>';
        return;
    }

    container.innerHTML = requests.map(({ connection, user }) => `
    <div class="glass-card flex gap-md items-center" style="margin-bottom: var(--spacing-sm);">
      <img src="${user.avatar}" alt="${user.name}" class="avatar avatar-lg">
      <div style="flex: 1;">
        <h4>${user.name}</h4>
        <p style="color: var(--text-secondary); font-size: 0.875rem;">${user.headline || ''}</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-primary accept-btn" data-connection-id="${connection.id}">Accept</button>
        <button class="btn btn-ghost reject-btn" data-connection-id="${connection.id}">Decline</button>
      </div>
    </div>
  `).join('');

    document.querySelectorAll('.accept-btn').forEach(btn => {
        btn.addEventListener('click', () => handleRequest(btn.dataset.connectionId, 'accepted'));
    });
    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => handleRequest(btn.dataset.connectionId, 'rejected'));
    });
}

function sendConnectionRequest(userId) {
    const currentUser = Storage.getCurrentUser();
    const connections = Storage.get(Storage.KEYS.CONNECTIONS) || [];

    const newConnection = {
        id: `conn-${Date.now()}`,
        senderId: currentUser.id,
        receiverId: userId,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    connections.push(newConnection);
    Storage.set(Storage.KEYS.CONNECTIONS, connections);

    // Create notification
    const targetUser = Storage.getUserById(userId);
    const notifications = Storage.get(Storage.KEYS.NOTIFICATIONS) || [];
    notifications.push({
        id: `notif-${Date.now()}`,
        userId: userId,
        message: `${currentUser.name} sent you a connection request`,
        type: 'connection_request',
        timestamp: new Date().toISOString(),
        read: false
    });
    Storage.set(Storage.KEYS.NOTIFICATIONS, notifications);

    alert('Connection request sent!');
    loadSuggestions();
}

function handleRequest(connectionId, status) {
    const connections = Storage.get(Storage.KEYS.CONNECTIONS) || [];
    const connection = connections.find(c => c.id === connectionId);

    if (connection) {
        connection.status = status;
        Storage.set(Storage.KEYS.CONNECTIONS, connections);

        // Create notification for sender
        if (status === 'accepted') {
            const currentUser = Storage.getCurrentUser();
            const notifications = Storage.get(Storage.KEYS.NOTIFICATIONS) || [];
            notifications.push({
                id: `notif-${Date.now()}`,
                userId: connection.senderId,
                message: `${currentUser.name} accepted your connection request`,
                type: 'connection_accepted',
                timestamp: new Date().toISOString(),
                read: false
            });
            Storage.set(Storage.KEYS.NOTIFICATIONS, notifications);
        }

        loadRequests();
        if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
    }
}
