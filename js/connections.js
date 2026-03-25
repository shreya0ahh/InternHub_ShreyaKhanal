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
    document.querySelectorAll('.network-section').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeSection = document.getElementById(`${tabName}Section`);

    if (activeTab) activeTab.classList.add('active');
    if (activeSection) {
        activeSection.classList.add('active');
        activeSection.classList.remove('hidden');
    }

    switch (tabName) {
        case 'suggestions': loadSuggestions(); break;
        case 'connections': loadConnections(); break;
        case 'requests': loadRequests(); break;
    }
}

async function loadSuggestions() {
    const container = document.getElementById('suggestionsSection');
    container.innerHTML = '<div class="loader">Loading suggestions...</div>';

    try {
        const suggestions = await API.getSuggestions();

        if (suggestions.length === 0) {
            container.innerHTML = '<div class="glass-card text-center"><p style="color: var(--text-tertiary);">No suggestions available</p></div>';
            return;
        }

        container.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--spacing-md);">` +
            suggestions.map(user => `
          <div class="glass-card">
            <div class="text-center">
              <a href="profile.html?user=${user.id}">
                <img src="${getAvatarUrl(user.avatar, user.name)}" alt="${user.name}" class="avatar avatar-xl" style="margin-bottom: var(--spacing-sm);">
              </a>
              <a href="profile.html?user=${user.id}" style="text-decoration: none; color: inherit;">
                <h4>${user.name}</h4>
              </a>
              <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: var(--spacing-md);">${user.headline || (user.type === 'student' ? 'Student' : 'Company')}</p>
              ${user.skills ? `<div class="flex flex-wrap gap-xs justify-center mb-md">${user.skills.slice(0, 3).map(s => `<span class="badge badge-glass">${s}</span>`).join('')}</div>` : ''}
              <button class="btn btn-primary connect-btn" data-user-id="${user.id}" style="width: 100%;">Connect</button>
            </div>
          </div>
        `).join('') + `</div>`;

        document.querySelectorAll('.connect-btn').forEach(btn => {
            btn.addEventListener('click', () => sendConnectionRequest(btn.dataset.userId));
        });
    } catch (error) {
        container.innerHTML = '<p class="text-error">Failed to load suggestions</p>';
    }
}

async function loadConnections() {
    const container = document.getElementById('connectionsSection');
    container.innerHTML = '<div class="loader">Loading connections...</div>';

    try {
        const allConnections = await API.getConnections();
        const currentUser = Storage.getCurrentUser();

        const accepted = allConnections.filter(c => c.status === 'accepted');

        if (accepted.length === 0) {
            container.innerHTML = '<div class="glass-card text-center"><p style="color: var(--text-tertiary);">No connections yet</p></div>';
            return;
        }

        container.innerHTML = accepted.map(c => {
            const user = c.sender_id == currentUser.id ? c.receiver : c.sender;
            const avatarSrc = getAvatarUrl(user.avatar, user.name);

            return `
                <div class="glass-card flex gap-md items-center" style="margin-bottom: var(--spacing-sm);">
                    <a href="profile.html?user=${user.id}">
                        <img src="${avatarSrc}" alt="${user.name}" class="avatar avatar-lg">
                    </a>
                    <div style="flex: 1;">
                        <a href="profile.html?user=${user.id}" style="text-decoration: none; color: inherit;">
                            <h4>${user.name}</h4>
                        </a>
                        <p style="color: var(--text-secondary); font-size: 0.875rem;">${user.headline || (user.type === 'student' ? 'Student' : 'Company')}</p>
                    </div>
                    <div class="flex gap-sm">
                        <button class="btn btn-ghost message-btn" data-user-id="${user.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Message</button>
                        <a href="profile.html?user=${user.id}" class="btn btn-ghost"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> View Profile</a>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.message-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = `messages.html?user=${btn.dataset.userId}`;
            });
        });
    } catch (error) {
        container.innerHTML = '<p class="text-error">Failed to load connections</p>';
    }
}

async function loadRequests() {
    const container = document.getElementById('requestsSection');
    container.innerHTML = '<div class="loader">Loading requests...</div>';

    try {
        const allConnections = await API.getConnections();
        const currentUser = Storage.getCurrentUser();

        const requests = allConnections.filter(c => c.receiver_id == currentUser.id && c.status === 'pending');

        if (requests.length === 0) {
            container.innerHTML = '<div class="glass-card text-center"><p style="color: var(--text-tertiary);">No pending requests</p></div>';
            return;
        }

        container.innerHTML = requests.map(connection => {
            const user = connection.sender;
            const avatarSrc = getAvatarUrl(user.avatar, user.name);

            return `
                <div class="glass-card flex gap-md items-center" style="margin-bottom: var(--spacing-sm);">
                    <img src="${avatarSrc}" alt="${user.name}" class="avatar avatar-lg">
                    <div style="flex: 1;">
                        <h4>${user.name}</h4>
                        <p style="color: var(--text-secondary); font-size: 0.875rem;">${user.headline || ''}</p>
                    </div>
                    <div class="flex gap-sm">
                        <button class="btn btn-primary accept-btn" data-connection-id="${connection.id}">Accept</button>
                        <button class="btn btn-ghost reject-btn" data-connection-id="${connection.id}">Decline</button>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', () => handleRequest(btn.dataset.connectionId, 'accepted'));
        });
        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => handleRequest(btn.dataset.connectionId, 'rejected'));
        });
    } catch (error) {
        container.innerHTML = '<p class="text-error">Failed to load requests</p>';
    }
}

async function sendConnectionRequest(userId) {
    try {
        await API.sendConnectionRequest(userId);
        showToast('Connection request sent!');
        loadSuggestions();
    } catch (error) {
        alert('Failed to send request: ' + (error.message || 'Server error'));
    }
}

async function handleRequest(connectionId, status) {
    try {
        await API.updateConnectionStatus(connectionId, status);
        showToast(status === 'accepted' ? 'Connection accepted!' : 'Request declined');
        loadRequests();
        if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
    } catch (error) {
        alert('Update failed: ' + (error.message || 'Server error'));
    }
}
