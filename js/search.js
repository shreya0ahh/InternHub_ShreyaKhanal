// InternHub - Search Functionality

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('searchInput')) {
    initSearch();
  }
});

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const locationFilter = document.getElementById('locationFilterSearch');
  const typeFilter = document.getElementById('typeFilter');

  // Get query from URL
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  if (query) {
    searchInput.value = query;
    performSearch();
  }

  // Real-time search
  searchInput.addEventListener('input', debounce(performSearch, 300));
  locationFilter.addEventListener('input', debounce(performSearch, 300));
  typeFilter.addEventListener('change', performSearch);
}

async function performSearch() {
  const query = document.getElementById('searchInput').value.trim();
  const locationFilter = document.getElementById('locationFilterSearch').value.trim();
  const typeFilter = document.getElementById('typeFilter').value;

  const resultsContainer = document.getElementById('searchResults');

  if (!query && !locationFilter && !typeFilter) {
    resultsContainer.innerHTML = `
            <div class="glass-card text-center">
                <p style="color: var(--text-tertiary);">Enter a search term or apply filters</p>
            </div>
        `;
    return;
  }

  resultsContainer.innerHTML = '<div class="loader">Searching...</div>';

  try {
    const filters = {};
    if (query) filters.q = query;
    if (locationFilter) filters.location = locationFilter;
    if (typeFilter) filters.type = typeFilter;

    if (query && query.startsWith('#')) {
      resultsContainer.innerHTML = `<div class="glass-card" style="margin-bottom: var(--spacing-sm);">Searching for posts with hashtag: <strong>${query}</strong></div>` + resultsContainer.innerHTML;
    }

    const [users, posts] = await Promise.all([
      API.searchUsers(filters),
      query ? API.searchPosts(query) : Promise.resolve([])
    ]);

    if (users.length === 0 && posts.length === 0) {
      resultsContainer.innerHTML = `
                <div class="glass-card text-center">
                    <h3>No results found</h3>
                    <p style="color: var(--text-tertiary);">Try different keywords or filters</p>
                </div>
            `;
      return;
    }

    resultsContainer.innerHTML = `
            <div class="glass-card" style="margin-bottom: var(--spacing-sm); padding: var(--spacing-sm) var(--spacing-md);">
                <strong>${users.length + posts.length}</strong> result${(users.length + posts.length) !== 1 ? 's' : ''} for "${query.startsWith('%23') ? query.replace('%23', '#') : query}"
            </div>
            
            ${users.length > 0 ? `
                <div style="margin-bottom: var(--spacing-md);">
                    <h3 style="margin-bottom: var(--spacing-sm); padding-left: var(--spacing-sm);">People</h3>
                    ${users.map(user => `
                        <div class="glass-card flex gap-md items-center animate-fade-in-up" style="margin-bottom: var(--spacing-md);">
                            <a href="profile.html?user=${user.id}">
                                <img src="${getAvatarUrl(user.avatar, user.name)}" alt="${user.name}" class="avatar">
                            </a>
                            <div style="flex: 1;">
                                <a href="profile.html?user=${user.id}" style="text-decoration: none; color: inherit;">
                                    <h4 style="margin: 0;">${highlightText(user.name, query)}</h4>
                                </a>
                                <div style="color: var(--text-secondary); font-size: 0.875rem;">${highlightText(user.headline || (user.type === 'student' ? 'Student' : 'Company'), query)}</div>
                                <div style="color: var(--text-tertiary); font-size: 0.75rem;">${highlightText(user.location || '', query)}</div>
                            </div>
                            <a href="profile.html?user=${user.id}" class="btn btn-primary btn-sm">View Profile</a>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${posts.length > 0 ? `
                <div>
                    <h3 style="margin-bottom: var(--spacing-sm); padding-left: var(--spacing-sm);">Posts</h3>
                    ${posts.map(post => `
                        <div class="glass-card animate-fade-in-up" style="margin-bottom: var(--spacing-md);">
                            <div class="flex gap-sm items-center" style="margin-bottom: var(--spacing-sm);">
                                <img src="${getAvatarUrl(post.user.avatar, post.user.name)}" alt="${post.user.name}" class="avatar avatar-sm">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.875rem;">${post.user.name}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">${new Date(post.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div style="margin-bottom: var(--spacing-sm);">${highlightText(formatSearchPostContent(post.content), query)}</div>
                            ${post.image_path ? `<img src="${window.API_HOST_URL || 'http://127.0.0.1:8000'}/storage/${post.image_path}" alt="Post image" style="width: 100%; border-radius: var(--radius-md); margin-bottom: var(--spacing-sm);">` : ''}
                            <div class="flex gap-md" style="font-size: 0.875rem; color: var(--text-tertiary);">
                                <span>${post.likes_count || 0} likes</span>
                                <span>${post.comments_count || 0} comments</span>
                                <button class="btn btn-ghost btn-sm share-post-btn" data-post-id="${post.id}" style="padding: 0; color: var(--accent);">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Share
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;

    // Attach share event listeners
    resultsContainer.querySelectorAll('.share-post-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        if (typeof openShareModal === 'function') {
          openShareModal(postId);
        }
      });
    });
  } catch (error) {
    resultsContainer.innerHTML = '<p class="text-error">Search failed. Please try again.</p>';
  }
}

function highlightText(text, query) {
  if (!query) return text;
  // Handle hashtag search highlight
  const displayQuery = query.startsWith('%23') ? query.replace('%23', '#') : query;
  // Escape special characters for regex
  const escapedQuery = displayQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark style="background: var(--accent); color: white; padding: 0 0.25rem; border-radius: 0.25rem;">$1</mark>');
}

// Helper to format post content in search results (hashtags clickable)
function formatSearchPostContent(content) {
  if (!content) return '';
  let escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Hashtags
  escaped = escaped.replace(/#(\w+)/g, (match, tag) => {
    return `<a href="search.html?q=${encodeURIComponent('#' + tag)}" style="color: var(--accent); font-weight: 500;">#${tag}</a>`;
  });
  
  return escaped;
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function connectOrView(userId, userType) {
  window.location.href = `profile.html?user=${userId}`;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
