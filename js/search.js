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

function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const locationFilter = document.getElementById('locationFilterSearch').value.toLowerCase().trim();
    const typeFilter = document.getElementById('typeFilter').value;

    const users = Storage.get(Storage.KEYS.USERS) || [];
    const currentUser = Storage.getCurrentUser();

    if (!query && !locationFilter && !typeFilter) {
        document.getElementById('searchResults').innerHTML = `
      <div class="glass-card text-center">
        <p style="color: var(--text-tertiary);">Enter a search term or apply filters</p>
      </div>
    `;
        return;
    }

    // Filter users
    const results = users.filter(user => {
        if (user.id === currentUser.id) return false;

        const matchesQuery = !query ||
            user.name.toLowerCase().includes(query) ||
            (user.headline && user.headline.toLowerCase().includes(query)) ||
            (user.bio && user.bio.toLowerCase().includes(query)) ||
            (user.skills && user.skills.some(s => s.toLowerCase().includes(query))) ||
            (user.industry && user.industry.toLowerCase().includes(query));

        const matchesLocation = !locationFilter ||
            (user.location && user.location.toLowerCase().includes(locationFilter));

        const matchesType = !typeFilter || user.type === typeFilter;

        return matchesQuery && matchesLocation && matchesType;
    });

    const resultsContainer = document.getElementById('searchResults');

    if (results.length === 0) {
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
      <strong>${results.length}</strong> result${results.length !== 1 ? 's' : ''} found
    </div>
  ` + results.map(user => `
    <div class="glass-card flex gap-md items-center animate-fade-in-up" style="margin-bottom: var(--spacing-md);">
      <img src="${user.avatar}" alt="${user.name}" class="avatar avatar-xl">
      <div style="flex: 1;">
        <h3 style="margin-bottom: 0.25rem;">${highlightText(user.name, query)}</h3>
        <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${user.headline || ''}</p>
        ${user.location ? `<p style="font-size: 0.875rem; color: var(--text-tertiary);">📍 ${user.location}</p>` : ''}
        ${user.skills ? `
          <div class="flex flex-wrap gap-xs mt-sm">
            ${user.skills.slice(0, 5).map(skill =>
        `<span class="badge badge-glass">${highlightText(skill, query)}</span>`
    ).join('')}
          </div>
        ` : ''}
        ${user.bio ? `<p style="margin-top: var(--spacing-sm); color: var(--text-secondary); font-size: 0.875rem;">${truncate(user.bio, 100)}</p>` : ''}
      </div>
      <div>
        <button class="btn btn-primary" onclick="connectOrView('${user.id}')">
          ${user.type === 'company' ? 'View' : 'Connect'}
        </button>
      </div>
    </div>
  `).join('');
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--accent); color: white; padding: 0 0.25rem; border-radius: 0.25rem;">$1</mark>');
}

function truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function connectOrView(userId) {
    const user = Storage.getUserById(userId);
    if (user.type === 'company') {
        alert(`Viewing ${user.name} profile...`);
    } else {
        window.location.href = 'connections.html';
    }
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
