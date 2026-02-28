// InternHub - App Initialization
// Main application logic and routing

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Check authentication
    const currentUser = Storage.getCurrentUser();

    // Redirect to login if not authenticated (except on index.html)
    if (!currentUser && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
        return;
    }

    if (currentUser) {
        initNavigation();
        initGlobalSearch();
    }
}

function initNavigation() {
    const currentUser = Storage.getCurrentUser();

    // Set user avatar in navbar
    const navAvatar = document.getElementById('navAvatar');
    if (navAvatar) {
        navAvatar.src = currentUser.avatar;
    }

    // Profile dropdown toggle
    const profileDropdown = document.getElementById('profileDropdown');
    const profileMenu = document.getElementById('profileMenu');

    if (profileDropdown && profileMenu) {
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            profileMenu.classList.add('hidden');
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // Nav item clicks
    const homeNav = document.getElementById('homeNav');
    if (homeNav) {
        homeNav.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    const connectionsNav = document.getElementById('connectionsNav');
    if (connectionsNav) {
        connectionsNav.addEventListener('click', () => {
            window.location.href = 'connections.html';
        });
    }

    const messagesNav = document.getElementById('messagesNav');
    if (messagesNav) {
        messagesNav.addEventListener('click', () => {
            window.location.href = 'messages.html';
        });
    }

    const notificationsNav = document.getElementById('notificationsNav');
    const notificationsDropdown = document.getElementById('notificationsDropdown');

    if (notificationsNav && notificationsDropdown) {
        notificationsNav.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsDropdown.classList.toggle('hidden');

            if (!notificationsDropdown.classList.contains('hidden')) {
                loadNotifications();
            }
        });

        document.addEventListener('click', (e) => {
            if (!notificationsDropdown.contains(e.target)) {
                notificationsDropdown.classList.add('hidden');
            }
        });
    }

    // Update notification badges
    updateNotificationBadges();
}

function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });

        searchInput.addEventListener('focus', () => {
            // Could show search suggestions here
        });
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        Storage.logout();
        window.location.href = 'index.html';
    }
}

function updateNotificationBadges() {
    const notifications = Storage.get(Storage.KEYS.NOTIFICATIONS) || [];
    const unreadNotifications = notifications.filter(n => !n.read);

    const notificationsBadge = document.getElementById('notificationsBadge');
    if (notificationsBadge) {
        if (unreadNotifications.length > 0) {
            notificationsBadge.textContent = unreadNotifications.length > 9 ? '9+' : unreadNotifications.length;
            notificationsBadge.classList.remove('hidden');
        } else {
            notificationsBadge.classList.add('hidden');
        }
    }

    // Update connections badge
    const currentUser = Storage.getCurrentUser();
    if (currentUser) {
        const connections = Storage.get(Storage.KEYS.CONNECTIONS) || [];
        const pendingRequests = connections.filter(c =>
            c.receiverId === currentUser.id && c.status === 'pending'
        );

        const connectionsBadge = document.getElementById('connectionsBadge');
        if (connectionsBadge) {
            if (pendingRequests.length > 0) {
                connectionsBadge.textContent = pendingRequests.length > 9 ? '9+' : pendingRequests.length;
                connectionsBadge.classList.remove('hidden');
            } else {
                connectionsBadge.classList.add('hidden');
            }
        }
    }

    // Update messages badge (mock - would be based on unread messages)
    const messagesBadge = document.getElementById('messagesBadge');
    if (messagesBadge) {
        // For now, hide it
        messagesBadge.classList.add('hidden');
    }
}

function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    const notifications = Storage.get(Storage.KEYS.NOTIFICATIONS) || [];
    const currentUser = Storage.getCurrentUser();

    // Filter notifications for current user
    const userNotifications = notifications
        .filter(n => n.userId === currentUser.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);

    if (userNotifications.length === 0) {
        notificationsList.innerHTML = `
      <div style="padding: var(--spacing-lg); text-align: center; color: var(--text-tertiary);">
        No notifications yet
      </div>
    `;
        return;
    }

    notificationsList.innerHTML = userNotifications.map(notification => {
        const timeAgo = getTimeAgo(notification.timestamp);
        return `
      <div class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
        <div class="notification-content">
          <div class="notification-text">${notification.message}</div>
          <div class="notification-time">${timeAgo}</div>
        </div>
      </div>
    `;
    }).join('');

    // Add click handlers
    notificationsList.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const notificationId = item.dataset.id;
            markNotificationAsRead(notificationId);
            // Could navigate to relevant content here
        });
    });
}

function markNotificationAsRead(notificationId) {
    const notifications = Storage.get(Storage.KEYS.NOTIFICATIONS) || [];
    const notification = notifications.find(n => n.id === notificationId);

    if (notification && !notification.read) {
        notification.read = true;
        Storage.set(Storage.KEYS.NOTIFICATIONS, notifications);
        updateNotificationBadges();
    }
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return past.toLocaleDateString();
}

// Make functions available globally
window.getTimeAgo = getTimeAgo;
window.updateNotificationBadges = updateNotificationBadges;
