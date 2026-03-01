// InternHub - Feed Management
// Handles post creation, rendering, and interactions

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('feedContainer')) {
        initFeed();
    }
});

function initFeed() {
    const currentUser = Storage.getCurrentUser();

    // Set avatars
    const createPostAvatar = document.getElementById('createPostAvatar');
    const modalPostAvatar = document.getElementById('modalPostAvatar');
    const modalPostName = document.getElementById('modalPostName');

    if (createPostAvatar) createPostAvatar.src = currentUser.avatar;
    if (modalPostAvatar) modalPostAvatar.src = currentUser.avatar;
    if (modalPostName) modalPostName.textContent = currentUser.name;

    // Create post modal
    const postInputTrigger = document.getElementById('postInputTrigger');
    const createPostModal = document.getElementById('createPostModal');
    const closeCreatePostModal = document.getElementById('closeCreatePostModal');
    const cancelPost = document.getElementById('cancelPost');

    // Ensure modal is hidden on page load
    if (createPostModal) {
        createPostModal.classList.add('hidden');
    }

    if (postInputTrigger && createPostModal) {
        postInputTrigger.addEventListener('click', () => {
            createPostModal.classList.remove('hidden');
        });
    }

    [closeCreatePostModal, cancelPost].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (createPostModal) {
                    createPostModal.classList.add('hidden');
                }
                clearPostForm();
            });
        }
    });

    // Close modal on outside click
    if (createPostModal) {
        createPostModal.addEventListener('click', (e) => {
            if (e.target === createPostModal) {
                createPostModal.classList.add('hidden');
                clearPostForm();
            }
        });
    }

    // Photo upload
    const addPhotoBtn = document.getElementById('addPhotoBtn');
    const modalAddPhotoBtn = document.getElementById('modalAddPhotoBtn');
    const postImageInput = document.getElementById('postImageInput');
    const postImagePreview = document.getElementById('postImagePreview');
    const postImagePreviewImg = document.getElementById('postImagePreviewImg');
    const removePostImage = document.getElementById('removePostImage');

    [addPhotoBtn, modalAddPhotoBtn].forEach(btn => {
        if (btn && postImageInput) {
            btn.addEventListener('click', () => {
                postImageInput.click();
                if (createPostModal) createPostModal.classList.remove('hidden');
            });
        }
    });

    if (postImageInput) {
        postImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    postImagePreviewImg.src = e.target.result;
                    postImagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removePostImage) {
        removePostImage.addEventListener('click', () => {
            postImageInput.value = '';
            postImagePreview.classList.add('hidden');
            postImagePreviewImg.src = '';
        });
    }

    // Submit post
    const submitPost = document.getElementById('submitPost');
    if (submitPost) {
        submitPost.addEventListener('click', handleCreatePost);
    }

    // Load feed
    loadFeed();
}

function clearPostForm() {
    const postContent = document.getElementById('postContent');
    const postImageInput = document.getElementById('postImageInput');
    const postImagePreview = document.getElementById('postImagePreview');

    if (postContent) postContent.value = '';
    if (postImageInput) postImageInput.value = '';
    if (postImagePreview) postImagePreview.classList.add('hidden');
}

function handleCreatePost() {
    const currentUser = Storage.getCurrentUser();
    const postContent = document.getElementById('postContent').value.trim();
    const postImageInput = document.getElementById('postImageInput');
    const postImagePreviewImg = document.getElementById('postImagePreviewImg');

    if (!postContent && !postImageInput.files[0]) {
        alert('Please write something or add an image');
        return;
    }

    const post = {
        id: `post-${Date.now()}`,
        authorId: currentUser.id,
        content: postContent,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: [],
        shares: 0,
        image: postImageInput.files[0] ? postImagePreviewImg.src : null
    };

    // Save post
    const posts = Storage.get(Storage.KEYS.POSTS) || [];
    posts.unshift(post);
    Storage.set(Storage.KEYS.POSTS, posts);

    // Close modal and clear form
    const createPostModal = document.getElementById('createPostModal');
    if (createPostModal) createPostModal.classList.add('hidden');
    clearPostForm();

    // Reload feed
    loadFeed();
}

function loadFeed() {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) return;

    const posts = Storage.get(Storage.KEYS.POSTS) || [];
    const users = Storage.get(Storage.KEYS.USERS) || [];
    const currentUser = Storage.getCurrentUser();

    if (posts.length === 0) {
        feedContainer.innerHTML = `
      <div class="glass-card text-center" style="padding: var(--spacing-xl);">
        <h3>No posts yet</h3>
        <p style="color: var(--text-secondary); margin-top: var(--spacing-sm);">
          Be the first to share something with your network!
        </p>
      </div>
    `;
        return;
    }

    feedContainer.innerHTML = posts.map(post => {
        const author = users.find(u => u.id === post.authorId);
        if (!author) return '';

        const isLiked = post.likes.includes(currentUser.id);
        const timeAgo = getTimeAgo(post.timestamp);
        const isAuthor = post.authorId === currentUser.id;

        return `
      <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <img src="${author.avatar}" alt="${author.name}" class="avatar">
          <div class="post-author-info">
            <div class="post-author-name">${author.name}</div>
            <div class="post-author-headline">${author.headline || 'InternHub Member'}</div>
            <div class="post-timestamp">${timeAgo}</div>
          </div>
          ${isAuthor ? `
            <button class="btn btn-ghost delete-post-btn" data-post-id="${post.id}" style="margin-left: auto; padding: 0.5rem; color: var(--danger);">
              🗑️ Delete
            </button>
          ` : `
            <button class="btn btn-ghost" style="margin-left: auto; padding: 0.5rem;">⋯</button>
          `}
        </div>
        
        ${post.content ? `<div class="post-content">${formatPostContent(post.content)}</div>` : ''}
        
        ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
        
        <div style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-sm); padding: 0 var(--spacing-sm); color: var(--text-tertiary); font-size: 0.875rem;">
          <span>${post.likes.length} ${post.likes.length === 1 ? 'like' : 'likes'}</span>
          <span>${post.comments.length} ${post.comments.length === 1 ? 'comment' : 'comments'}</span>
          <span>${post.shares} ${post.shares === 1 ? 'share' : 'shares'}</span>
        </div>
        
        <div class="post-actions">
          <button class="post-action-btn like-btn ${isLiked ? 'active' : ''}" data-post-id="${post.id}">
            ${isLiked ? '❤️' : '🤍'} Like
          </button>
          <button class="post-action-btn comment-btn" data-post-id="${post.id}">
            💬 Comment
          </button>
          <button class="post-action-btn share-btn" data-post-id="${post.id}">
            🔄 Share
          </button>
        </div>
        
        <!-- Comments Section -->
        <div class="comments-section hidden" data-post-id="${post.id}" style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--glass-border);">
          ${post.comments.map(comment => {
            const commentAuthor = users.find(u => u.id === comment.authorId);
            if (!commentAuthor) return '';
            return `
              <div style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
                <img src="${commentAuthor.avatar}" alt="${commentAuthor.name}" class="avatar avatar-sm">
                <div style="flex: 1; background: var(--glass-bg); padding: var(--spacing-sm); border-radius: var(--radius-md);">
                  <div style="font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem;">${commentAuthor.name}</div>
                  <div style="color: var(--text-secondary); font-size: 0.875rem;">${comment.content}</div>
                  <div style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 0.25rem;">${getTimeAgo(comment.timestamp)}</div>
                </div>
              </div>
            `;
        }).join('')}
          
          <div style="display: flex; gap: var(--spacing-sm);">
            <img src="${currentUser.avatar}" alt="You" class="avatar avatar-sm">
            <input 
              type="text" 
              class="form-input comment-input" 
              placeholder="Write a comment..."
              style="flex: 1;"
              data-post-id="${post.id}"
            >
            <button class="btn btn-primary submit-comment-btn" data-post-id="${post.id}">Post</button>
          </div>
        </div>
      </div>
    `;
    }).join('');

    // Add event listeners
    attachPostEventListeners();
}

function attachPostEventListeners() {
    const currentUser = Storage.getCurrentUser();

    // Like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            toggleLike(postId);
        });
    });

    // Comment buttons
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            const commentsSection = document.querySelector(`.comments-section[data-post-id="${postId}"]`);
            if (commentsSection) {
                commentsSection.classList.toggle('hidden');
            }
        });
    });

    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            sharePost(postId);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            deletePost(postId);
        });
    });

    // Comment inputs
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const postId = input.dataset.postId;
                const content = input.value.trim();
                if (content) {
                    addComment(postId, content);
                }
            }
        });
    });

    // Submit comment buttons
    document.querySelectorAll('.submit-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
            const content = input.value.trim();
            if (content) {
                addComment(postId, content);
            }
        });
    });
}

function toggleLike(postId) {
    const currentUser = Storage.getCurrentUser();
    const posts = Storage.get(Storage.KEYS.POSTS) || [];
    const post = posts.find(p => p.id === postId);

    if (!post) return;

    const likeIndex = post.likes.indexOf(currentUser.id);
    if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1);
    } else {
        post.likes.push(currentUser.id);

        // Create notification for post author
        if (post.authorId !== currentUser.id) {
            createNotification(post.authorId, `${currentUser.name} liked your post`, 'like');
        }
    }

    Storage.set(Storage.KEYS.POSTS, posts);
    loadFeed();
}

function addComment(postId, content) {
    const currentUser = Storage.getCurrentUser();
    const posts = Storage.get(Storage.KEYS.POSTS) || [];
    const post = posts.find(p => p.id === postId);

    if (!post) return;

    const comment = {
        id: `comment-${Date.now()}`,
        authorId: currentUser.id,
        content: content,
        timestamp: new Date().toISOString()
    };

    post.comments.push(comment);
    Storage.set(Storage.KEYS.POSTS, posts);

    // Create notification for post author
    if (post.authorId !== currentUser.id) {
        createNotification(post.authorId, `${currentUser.name} commented on your post`, 'comment');
    }

    loadFeed();
}

function sharePost(postId) {
    const currentUser = Storage.getCurrentUser();
    const posts = Storage.get(Storage.KEYS.POSTS) || [];
    const post = posts.find(p => p.id === postId);

    if (!post) return;

    post.shares++;
    Storage.set(Storage.KEYS.POSTS, posts);

    // Create notification for post author
    if (post.authorId !== currentUser.id) {
        createNotification(post.authorId, `${currentUser.name} shared your post`, 'share');
    }

    loadFeed();
    alert('Post shared!');
}

function formatPostContent(content) {
    // Format hashtags
    content = content.replace(/#(\w+)/g, '<a href="search.html?q=%23$1" style="color: var(--accent);">#$1</a>');

    // Format mentions
    content = content.replace(/@(\w+)/g, '<a href="#" style="color: var(--accent);">@$1</a>');

    // Format line breaks
    content = content.replace(/\n/g, '<br>');

    return content;
}

function createNotification(userId, message, type) {
    const notifications = Storage.get(Storage.KEYS.NOTIFICATIONS) || [];

    const notification = {
        id: `notification-${Date.now()}`,
        userId: userId,
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        read: false
    };

    notifications.push(notification);
    Storage.set(Storage.KEYS.NOTIFICATIONS, notifications);

    // Update badge if on same page
    if (typeof updateNotificationBadges === 'function') {
        updateNotificationBadges();
    }
}

function deletePost(postId) {
    const currentUser = Storage.getCurrentUser();
    const posts = Storage.get(Storage.KEYS.POSTS) || [];
    const post = posts.find(p => p.id === postId);

    if (!post) return;

    // Check if user is the author
    if (post.authorId !== currentUser.id) {
        alert('You can only delete your own posts');
        return;
    }

    // Confirm deletion
    if (confirm('Are you sure you want to delete this post?')) {
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex > -1) {
            posts.splice(postIndex, 1);
            Storage.set(Storage.KEYS.POSTS, posts);
            loadFeed();
        }
    }
}
