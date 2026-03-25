// InternHub - Feed Management
// Handles post creation, rendering, and interactions

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('feedContainer')) {
        initFeed();
    }
});

let allPosts = [];

function initFeed() {
    const currentUser = Storage.getCurrentUser();

    // Set avatars
    const createPostAvatar = document.getElementById('createPostAvatar');
    const modalPostAvatar = document.getElementById('modalPostAvatar');
    const modalPostName = document.getElementById('modalPostName');

    if (createPostAvatar) createPostAvatar.src = getAvatarUrl(currentUser.avatar, currentUser.name);
    if (modalPostAvatar) modalPostAvatar.src = getAvatarUrl(currentUser.avatar, currentUser.name);
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

async function handleCreatePost() {
    const postContent = document.getElementById('postContent').value.trim();
    const postImageInput = document.getElementById('postImageInput');

    if (!postContent && !postImageInput.files[0]) {
        alert('Please write something or add an image');
        return;
    }

    const formData = new FormData();
    formData.append('content', postContent);
    if (postImageInput.files[0]) {
        formData.append('image', postImageInput.files[0]);
    }

    try {
        await API.postUpdate(formData);

        // Close modal and clear form
        const createPostModal = document.getElementById('createPostModal');
        if (createPostModal) createPostModal.classList.add('hidden');
        clearPostForm();

        // Reload feed
        loadFeed();
        showToast('Post shared!');
    } catch (error) {
        alert('Failed to share post: ' + (error.message || 'Server error'));
    }
}

async function loadFeed() {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) return;

    if (feedContainer.children.length === 0) {
        feedContainer.innerHTML = '<div class="loader">Loading feed...</div>';
    }

    try {
        const posts = await API.getFeed();
        allPosts = posts; // Cache for other functions
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

        feedContainer.innerHTML = posts.map(post => renderPostHTML(post, currentUser)).join('');

        attachPostEventListeners();
    } catch (error) {
        feedContainer.innerHTML = `<p style="color: #f5576c; text-align: center; padding: 2rem;">Error loading feed: ${error.message || 'Server error'}</p>`;
    }
}

function attachPostEventListeners(container = document) {
    const currentUser = Storage.getCurrentUser();

    // Like buttons
    container.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            toggleLike(postId);
        });
    });

    // Comment buttons
    container.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            const commentsSection = document.querySelector(`.comments-section[data-post-id="${postId}"]`);
            if (commentsSection) {
                commentsSection.classList.toggle('hidden');
            }
        });
    });

    // Share buttons
    container.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            openShareModal(postId);
        });
    });

    // Delete buttons
    container.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            deletePost(postId);
        });
    });

    // Comment inputs
    container.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const postId = input.dataset.postId;
                const content = input.value.trim();
                if (content) {
                    addComment(postId, content);
                    input.value = '';
                }
            }
        });
    });

    // Submit comment buttons
    container.querySelectorAll('.submit-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.dataset.postId;
            const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
            const content = input.value.trim();
            if (content) {
                addComment(postId, content);
                input.value = '';
            }
        });
    });

    // Delete comment buttons
    container.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const commentId = btn.dataset.commentId;
            deleteComment(commentId);
        });
    });

    // Reply buttons
    container.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const commentId = btn.dataset.commentId;
            const replyInputContainer = document.querySelector(`.reply-input-container[data-comment-id="${commentId}"]`);
            if (replyInputContainer) {
                replyInputContainer.classList.toggle('hidden');
                if (!replyInputContainer.classList.contains('hidden')) {
                    replyInputContainer.querySelector('input').focus();
                }
            }
        });
    });

    // Comment like buttons
    container.querySelectorAll('.comment-like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const commentId = btn.dataset.commentId;
            toggleCommentLike(commentId);
        });
    });

    // Submit reply buttons
    container.querySelectorAll('.submit-reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const commentId = btn.dataset.commentId;
            const postId = btn.dataset.postId;
            const input = document.querySelector(`.reply-input-field[data-comment-id="${commentId}"]`);
            const content = input.value.trim();
            if (content) {
                addComment(postId, content, commentId);
            }
        });
    });

    // Reply input enter key
    container.querySelectorAll('.reply-input-field').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const commentId = input.dataset.commentId;
                const postId = input.dataset.postId;
                const content = input.value.trim();
                if (content) {
                    addComment(postId, content, commentId);
                }
            }
        });
    });
}

async function toggleLike(postId) {
    try {
        await API.likePost(postId);
        await updatePostUI(postId);
    } catch (error) {
        console.error('Like error:', error);
    }
}

async function toggleCommentLike(commentId) {
    try {
        await API.likeComment(commentId);
        // We update the entire post UI for simplicity, or we could target the comment
        const commentPreview = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentPreview) {
            const postCard = commentPreview.closest('.post-card');
            if (postCard) {
                await updatePostUI(postCard.dataset.postId);
            }
        }
    } catch (error) {
        console.error('Comment like error:', error);
    }
}

async function addComment(postId, content, parentId = null) {
    try {
        await API.commentOnPost(postId, content, parentId);
        await updatePostUI(postId, true); // keepOpen = true
    } catch (error) {
        alert('Failed to add comment: ' + (error.message || 'Server error'));
    }
}

async function updatePostUI(postId, keepCommentsOpen = false) {
    try {
        const post = await API.getPost(postId);
        const currentUser = Storage.getCurrentUser();
        const postElement = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        
        if (postElement) {
            const isCommentsHidden = postElement.querySelector('.comments-section').classList.contains('hidden');
            
            // Re-render only this post HTML
            postElement.outerHTML = renderPostHTML(post, currentUser);
            
            // Restore comments visibility if needed
            const newPostElement = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            if (newPostElement) {
                const newCommentsSection = newPostElement.querySelector('.comments-section');
                if (keepCommentsOpen || !isCommentsHidden) {
                    newCommentsSection.classList.remove('hidden');
                }
                
                // Re-bind listeners for this specific post
                attachPostEventListeners(newPostElement);
            }
        }
    } catch (error) {
        console.error('Failed to update post UI:', error);
    }
}

async function sharePost(postId) {
    openShareModal(postId);
}

function formatPostContent(content) {
    if (!content) return '';

    // Escape HTML to prevent XSS
    let escaped = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Format line breaks
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
}

function createNotification(userId, message, type) {
    // Note: createNotification is removed as it was a legacy localStorage function.
    // Backend now handles notifications via Laravel.
}

async function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        try {
            await API.deletePost(postId);
            showToast('Post deleted');
            loadFeed();
        } catch (error) {
            alert('Failed to delete post: ' + (error.message || 'Server error'));
        }
    }
}

async function deleteComment(commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        try {
            // Find post ID before deleting
            const commentPreview = document.querySelector(`[data-comment-id="${commentId}"]`);
            let postId = null;
            if (commentPreview) {
                const postCard = commentPreview.closest('.post-card');
                if (postCard) postId = postCard.dataset.postId;
            }

            await API.deleteComment(commentId);
            showToast('Comment deleted');
            
            if (postId) {
                await updatePostUI(postId, true);
            } else {
                loadFeed();
            }
        } catch (error) {
            alert('Failed to delete comment: ' + (error.message || 'Server error'));
        }
    }
}

function renderPostHTML(post, currentUser) {
    if (!post || !post.user) return '';
    const author = post.user;
    const isLiked = post.likes && post.likes.length > 0;
    const timeAgo = window.getTimeAgo ? window.getTimeAgo(post.created_at) : 'recently';
    const isAuthor = currentUser && post.user_id === currentUser.id;
    const commentsHTML = (post.comments || []).map(comment => renderComment(comment, currentUser)).join('');

    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <a href="profile.html?user=${author.id}">
                    <img src="${window.getAvatarUrl ? window.getAvatarUrl(author.avatar, author.name) : ''}" alt="${author.name}" class="avatar">
                </a>
                <div class="post-author-info">
                    <a href="profile.html?user=${author.id}" style="text-decoration: none; color: inherit;">
                        <div class="post-author-name">${author.name}</div>
                    </a>
                    <div class="post-author-headline">${author.headline || (author.type === 'student' ? 'Student' : 'Company')}</div>
                    <div class="post-timestamp">${timeAgo}</div>
                </div>
                ${isAuthor ? `
                    <button class="btn btn-ghost delete-post-btn" data-post-id="${post.id}" style="margin-left: auto; padding: 0.5rem; color: var(--danger); z-index: 2; position: relative; font-size: 0.875rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Delete
                    </button>
                ` : `
                    <button class="btn btn-ghost" style="margin-left: auto; padding: 0.5rem; z-index: 2; position: relative;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                    </button>
                `}
            </div>
            
            ${post.content ? `<div class="post-content">${formatPostContent(post.content)}</div>` : ''}
            
            ${post.image_path ? `<img src="${window.API_HOST_URL || 'http://127.0.0.1:8000'}/storage/${post.image_path}" alt="Post image" class="post-image">` : ''}
            
            <div style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-sm); padding: 0 var(--spacing-sm); color: var(--text-tertiary); font-size: 0.875rem;">
                <span class="likes-count">${post.likes_count || 0} ${post.likes_count === 1 ? 'like' : 'likes'}</span>
                <span class="comments-count">${post.comments_count || 0} ${post.comments_count === 1 ? 'comment' : 'comments'}</span>
            </div>
            
            <div class="post-actions">
                <button class="post-action-btn like-btn ${isLiked ? 'active' : ''}" data-post-id="${post.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                    <span>Like</span>
                </button>
                <button class="post-action-btn comment-btn" data-post-id="${post.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span>Comment</span>
                </button>
                <button class="post-action-btn share-btn" data-post-id="${post.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    <span>Share</span>
                </button>
            </div>
            
            <!-- Comments Section -->
            <div class="comments-section hidden" data-post-id="${post.id}" style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--glass-border);">
                <div class="comments-list" data-post-id="${post.id}">
                    ${commentsHTML}
                </div>
                
                <div style="display: flex; gap: var(--spacing-sm);">
                    <img src="${window.getAvatarUrl ? window.getAvatarUrl(currentUser.avatar, currentUser.name) : ''}" alt="You" class="avatar avatar-sm">
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
}

function renderComment(comment, currentUser, isReply = false) {
    const isLiked = comment.likes && comment.likes.length > 0;
    return `
        <div class="comment-item ${isReply ? 'reply-item' : ''}" style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); ${isReply ? 'margin-left: 2.5rem; border-left: 2px solid var(--glass-border); padding-left: 0.75rem;' : ''} position: relative;">
            <img src="${window.getAvatarUrl ? window.getAvatarUrl(comment.user.avatar, comment.user.name) : ''}" alt="${comment.user.name}" class="avatar ${isReply ? 'avatar-xs' : 'avatar-sm'}" style="${isReply ? 'width: 24px; height: 24px;' : ''}">
            <div style="flex: 1; background: var(--glass-bg); padding: var(--spacing-sm); border-radius: var(--radius-md); position: relative;">
                <div style="font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem;">${comment.user.name}</div>
                <div style="color: var(--text-secondary); font-size: 0.875rem;">${comment.content}</div>
                <div style="display: flex; gap: var(--spacing-md); align-items: center; margin-top: 0.25rem;">
                    <div style="color: var(--text-tertiary); font-size: 0.75rem;">${window.getTimeAgo ? window.getTimeAgo(comment.created_at) : 'recently'}</div>
                    <button class="btn btn-ghost btn-sm comment-like-btn ${isLiked ? 'active' : ''}" data-comment-id="${comment.id}" style="padding: 0; font-size: 0.75rem; color: ${isLiked ? 'var(--accent)' : 'var(--text-tertiary)'}; display: flex; align-items: center; gap: 4px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                        ${comment.likes_count || 0}
                    </button>
                    ${!isReply ? `<button class="btn btn-ghost btn-sm reply-btn" data-comment-id="${comment.id}" style="padding: 0; font-size: 0.75rem; color: var(--accent);">Reply</button>` : ''}
                </div>
                
                ${comment.user_id === currentUser.id ? `
                    <button class="delete-comment-btn" data-comment-id="${comment.id}" style="position: absolute; top: 0.5rem; right: 0.5rem; color: var(--danger); background: none; border: none; cursor: pointer; padding: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                ` : ''}
            </div>
        </div>
        
        ${!isReply && comment.replies && comment.replies.length > 0 ? `
            <div class="replies-container">
                ${comment.replies.map(reply => renderComment(reply, currentUser, true)).join('')}
            </div>
        ` : ''}

        ${!isReply ? `
            <div class="reply-input-container hidden" data-comment-id="${comment.id}" style="margin-left: 2.5rem; margin-bottom: var(--spacing-md); display: flex; gap: var(--spacing-sm); align-items: center;">
                <img src="${window.getAvatarUrl ? window.getAvatarUrl(currentUser.avatar, currentUser.name) : ''}" alt="You" class="avatar avatar-xs" style="width: 24px; height: 24px;">
                <input 
                    type="text" 
                    class="form-input reply-input-field" 
                    placeholder="Write a reply..."
                    style="flex: 1; font-size: 0.875rem; padding: 0.4rem 0.75rem;"
                    data-comment-id="${comment.id}"
                    data-post-id="${comment.post_id}"
                >
                <button class="btn btn-primary btn-sm submit-reply-btn" data-comment-id="${comment.id}" data-post-id="${comment.post_id}">Reply</button>
            </div>
        ` : ''}
    `;
}
