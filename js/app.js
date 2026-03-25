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
    if (navAvatar && currentUser) {
        navAvatar.src = getAvatarUrl(currentUser.avatar, currentUser.name);
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
    // Only call once on load, centralized
    if (Storage.getCurrentUser()) {
        updateNotificationBadges();
        startNotificationPolling();
    }
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

async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await API.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        Storage.logout();
        window.location.href = 'index.html';
    }
}

let isUpdatingBadges = false;
let lastBadgeUpdate = 0;

async function updateNotificationBadges() {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser || isUpdatingBadges) return;

    // Rate limit: 2 seconds between updates unless forced
    const now = Date.now();
    if (now - lastBadgeUpdate < 2000) return;

    isUpdatingBadges = true;
    lastBadgeUpdate = now;
    try {
        const notifications = await API.getNotifications();
        const unreadNotifications = notifications.filter(n => !n.read_status);

        const notificationsBadge = document.getElementById('notificationsBadge');
        if (notificationsBadge) {
            if (unreadNotifications.length > 0) {
                notificationsBadge.textContent = unreadNotifications.length > 9 ? '9+' : unreadNotifications.length;
                notificationsBadge.classList.remove('hidden');
            } else {
                notificationsBadge.classList.add('hidden');
            }
        }

        const allConnections = await API.getConnections();
        const pendingRequests = allConnections.filter(c =>
            c.receiver_id == currentUser.id && c.status === 'pending'
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

        const unreadMsgs = await API.getUnreadMessageCount();
        const messagesBadge = document.getElementById('messagesBadge');
        if (messagesBadge) {
            if (unreadMsgs.count > 0) {
                messagesBadge.textContent = unreadMsgs.count > 9 ? '9+' : unreadMsgs.count;
                messagesBadge.classList.remove('hidden');
            } else {
                messagesBadge.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Failed to update badges:', error);
    } finally {
        isUpdatingBadges = false;
    }
}

function startNotificationPolling() {
    // Poll for notifications every 30 seconds
    setInterval(() => {
        if (Storage.getCurrentUser()) {
            updateNotificationBadges();
        }
    }, 30000);
}

async function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    notificationsList.innerHTML = '<div style="padding: 1rem; text-align: center;">Loading...</div>';

    try {
        const notifications = await API.getNotifications();

        if (notifications.length === 0) {
            notificationsList.innerHTML = `
                <div style="padding: var(--spacing-lg); text-align: center; color: var(--text-tertiary);">
                    No notifications yet
                </div>
            `;
            return;
        }

        notificationsList.innerHTML = notifications.map(n => {
            const timeAgo = getTimeAgo(n.created_at);
            let icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
            if (n.type === 'new_application') icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
            if (n.type === 'application_status') icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M18 8a3 3 0 0 1-3 3H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M19.8 8.2l2.8-2.8M18.8 12.4l2.8 2.8M21 12h3M3 12H0M3.5 15.5L.7 18.3M3.5 8.5L.7 5.7"></path></svg>`;
            if (n.type === 'message') icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
            if (n.type === 'new_vacancy') icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.71-2.12.71-2.12s-1.28 0-2.12-.71z"></path><path d="M15 9l-9 9"></path><path d="M13 15l8-8"></path><path d="M9 11l8-8"></path><path d="M22 2l-3 3"></path><path d="M11 13l-3 3"></path><circle cx="12" cy="12" r="9"></circle></svg>`;

            return `
                <div class="notification-item ${n.read_at ? '' : 'unread'}" data-id="${n.id}">
                    <div class="notification-icon">${icon}</div>
                    <div class="notification-content">
                        <div class="notification-text">${n.message || (n.data && n.data.message) || 'New notification'}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');

        notificationsList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.dataset.id;
                const n = notifications.find(x => x.id == id);
                await markNotificationAsRead(id);

                if (n.type === 'new_application' || n.type === 'application_status') {
                    window.location.href = 'jobs.html';
                } else if (n.type === 'message') {
                    window.location.href = `messages.html?user=${n.data?.sender_id || ''}`;
                }
            });
        });
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationsList.innerHTML = '<div style="padding: 1rem; color: var(--danger);">Error loading notifications</div>';
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        await API.markNotificationRead(notificationId);
        updateNotificationBadges();
        // Refresh the list if open
        const notificationsDropdown = document.getElementById('notificationsDropdown');
        if (notificationsDropdown && !notificationsDropdown.classList.contains('hidden')) {
            loadNotifications();
        }
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
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

/**
 * Centralized function to resolve avatar URLs.
 * Automatically filters out legacy cartoon avatars and provides initials fallback.
 */
function getAvatarUrl(avatar, name) {
    const initialsUrl = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(name || 'User');
    
    // If no avatar or it's the legacy cartoon style, use initials
    if (!avatar || avatar.includes('avataaars')) {
        return initialsUrl;
    }

    // Handle relative paths from the backend
    if (!avatar.startsWith('http')) {
        const host = window.API_HOST_URL || 'http://127.0.0.1:8000';
        return `${host}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
    }

    return avatar;
}

function showToast(message) {
    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.style.cssText = `
            position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
            background: var(--glass-bg, rgba(30,30,60,0.95));
            backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
            color: var(--text-primary, #fff);
            padding: 0.75rem 1.5rem;
            border-radius: 2rem;
            font-weight: 600;
            font-size: 0.9rem;
            z-index: 9999;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            transition: opacity 0.3s, transform 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
    }, 2800);
}

// Make functions available globally
window.getTimeAgo = getTimeAgo;
window.updateNotificationBadges = updateNotificationBadges;
window.showToast = showToast;
window.getAvatarUrl = getAvatarUrl;
