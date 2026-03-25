// InternHub - Global Sharing Logic
// Reusable sharing modal and logic across pages

let currentSharePostId = null;
let allConnections = [];

// Initialize Share Modal if it exists on the page
document.addEventListener('DOMContentLoaded', () => {
    const shareSearchInput = document.getElementById('shareSearchInput');
    const closeShareModal = document.getElementById('closeShareModal');
    const cancelShare = document.getElementById('cancelShare');
    const shareModal = document.getElementById('shareModal');

    if (shareSearchInput) {
        shareSearchInput.addEventListener('input', (e) => {
            renderShareConnectionsList(e.target.value);
        });
    }

    [closeShareModal, cancelShare].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (shareModal) shareModal.classList.add('hidden');
                currentSharePostId = null;
            });
        }
    });

    if (shareModal) {
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                shareModal.classList.add('hidden');
                currentSharePostId = null;
            }
        });
    }
});

async function openShareModal(postId) {
    currentSharePostId = postId;
    const shareModal = document.getElementById('shareModal');
    if (!shareModal) {
        console.warn('Share modal not found on this page');
        return;
    }
    
    shareModal.classList.remove('hidden');

    const container = document.getElementById('shareConnectionsList');
    if (container) {
        container.innerHTML = '<div class="loader">Loading connections...</div>';
    }

    try {
        const currentUser = Storage.getCurrentUser();
        const connectionsResponse = await API.getConnections();
        allConnections = connectionsResponse
            .filter(c => c.status === 'accepted')
            .map(c => c.sender_id == currentUser.id ? c.receiver : c.sender);

        renderShareConnectionsList();
    } catch (error) {
        if (container) {
            container.innerHTML = '<p class="text-error">Failed to load connections</p>';
        }
    }
}

function renderShareConnectionsList(search = '') {
    const list = document.getElementById('shareConnectionsList');
    if (!list) return;

    const filtered = allConnections.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase())
    );

    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 1rem;">No connections found</p>';
        return;
    }

    list.innerHTML = filtered.map(user => `
        <div class="glass-card flex items-center justify-between" style="padding: var(--spacing-sm); margin: 0; background: var(--glass-bg-hover);">
            <div class="flex items-center gap-sm">
                <img src="${getAvatarUrl(user.avatar, user.name)}" alt="${user.name}" class="avatar avatar-sm">
                <div>
                    <div style="font-weight: 600; font-size: 0.875rem;">${user.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${user.headline || (user.type === 'student' ? 'Student' : 'Company')}</div>
                </div>
            </div>
            <button class="btn btn-primary btn-sm send-share-btn" data-user-id="${user.id}">Send</button>
        </div>
    `).join('');

    list.querySelectorAll('.send-share-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.dataset.userId;
            await handleShareToConnection(userId, btn);
        });
    });
}

async function handleShareToConnection(userId, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const shareLink = `${window.location.protocol}//${window.location.host}/dashboard.html?post=${currentSharePostId}`;
    const message = `Check out this post: ${shareLink}`;

    try {
        await API.sendMessage(userId, message);
        btn.textContent = 'Sent!';
        btn.style.background = 'var(--success)';
        btn.style.borderColor = 'var(--success)';
        
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.borderColor = '';
        }, 2000);
        
        showToast('Shared successfully!');
    } catch (error) {
        alert('Failed to share: ' + (error.message || 'Server error'));
        btn.disabled = false;
        btn.textContent = originalText;
    }
}
