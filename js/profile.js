// InternHub - Profile Management

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('profileAvatar')) {
    initProfile();
  }
});

function initProfile() {
  const currentUser = Storage.getCurrentUser();
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
  loadProfileData();

  // Ensure edit modal is hidden on page load
  const editModal = document.getElementById('editProfileModal');
  if (editModal) {
    editModal.classList.add('hidden');
  }

  // Avatar and Cover upload
  const editAvatarBtn = document.getElementById('editAvatarBtn');
  const avatarInput = document.getElementById('avatarInput');
  const editCoverBtn = document.getElementById('editCoverBtn');
  const coverInput = document.getElementById('coverInput');

  if (editAvatarBtn && avatarInput) {
    editAvatarBtn.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', handleAvatarUpload);
  }

  if (editCoverBtn && coverInput) {
    editCoverBtn.addEventListener('click', () => coverInput.click());
    coverInput.addEventListener('change', handleCoverUpload);
  }

  // Edit buttons
  document.getElementById('editProfileBtn')?.addEventListener('click', () => showEditModal('bio'));
  document.getElementById('editAboutBtn')?.addEventListener('click', () => showEditModal('bio'));
  document.getElementById('addSkillBtn')?.addEventListener('click', () => showEditModal('skill'));
  document.getElementById('addExperienceBtn')?.addEventListener('click', () => showEditModal('experience'));
  document.getElementById('addEducationBtn')?.addEventListener('click', () => showEditModal('education'));
  document.getElementById('addProjectBtn')?.addEventListener('click', () => showEditModal('project'));

  // Modal close handlers
  const closeEditModal = document.getElementById('closeEditModal');
  const cancelEdit = document.getElementById('cancelEdit');

  if (closeEditModal) {
    closeEditModal.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideEditModal();
    });
  }

  if (cancelEdit) {
    cancelEdit.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideEditModal();
    });
  }

  document.getElementById('saveEdit')?.addEventListener('click', handleSaveEdit);

  // Close modal on outside click
  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        hideEditModal();
      }
    });
  }
}

async function loadProfileData() {
  const urlParams = new URLSearchParams(window.location.search);
  const userIdFromUrl = urlParams.get('user');
  const currentUser = Storage.getCurrentUser();

  let userToRender = null;

  try {
    // Optimization: If viewing own profile and currentUser data is already available, use it.
    // Otherwise, fetch from API.
    const isOwnProfile = !userIdFromUrl || userIdFromUrl == currentUser.id;
    if (isOwnProfile && currentUser && currentUser.id) { // Check if currentUser is valid and has an ID
      userToRender = await API.getProfile(currentUser.id); // Still fetch to ensure data is fresh
      Storage.setCurrentUser(userToRender); // Update storage with fresh data
    } else {
      userToRender = await API.getProfile(userIdFromUrl);
    }

    // Hide all first
    document.querySelectorAll('.edit-btn, #editProfileBtn, #editAvatarBtn, #editCoverBtn, #editAboutBtn, .add-btn, #addSkillBtn, #addExperienceBtn, #addEducationBtn, #addProjectBtn, #connectBtn, #messageBtn').forEach(el => {
      if (el) el.style.display = 'none';
    });

    if (isOwnProfile) {
      document.querySelectorAll('.edit-btn, #editProfileBtn, #editAvatarBtn, #editCoverBtn, #editAboutBtn, .add-btn, #addSkillBtn, #addExperienceBtn, #addEducationBtn, #addProjectBtn').forEach(el => {
        if (el) el.style.display = 'block';
      });
    } else {
      // Viewing someone else: check connection status
      const msgBtn = document.getElementById('messageBtn');
      const connectBtn = document.getElementById('connectBtn');
      const editBtn = document.getElementById('editProfileBtn');

      if (editBtn) editBtn.style.display = 'none';

      // Fetch connections to check status with this specific user
      const connections = await API.getConnections();
      const connection = connections.find(c => c.sender_id == userToRender.id || c.receiver_id == userToRender.id);

      if (connection) {
        if (connection.status === 'accepted') {
          if (msgBtn) {
            msgBtn.style.display = 'block';
            msgBtn.classList.remove('hidden');
            msgBtn.onclick = () => window.location.href = `messages.html?user=${userToRender.id}`;
          }
          if (connectBtn) {
            connectBtn.style.display = 'block';
            connectBtn.classList.remove('hidden');
            connectBtn.textContent = 'Connected';
            connectBtn.disabled = true;
            connectBtn.classList.add('btn-ghost');
          }
        } else if (connection.status === 'pending') {
          if (connectBtn) {
            connectBtn.style.display = 'block';
            connectBtn.classList.remove('hidden');
            
            if (connection.sender_id == currentUser.id) {
                connectBtn.textContent = 'Cancel Request';
                connectBtn.disabled = false;
                connectBtn.onclick = async () => {
                    if (confirm('Are you sure you want to cancel this request?')) {
                        try {
                            await API.cancelConnectionRequest(connection.id);
                            showToast('Request cancelled');
                            loadProfileData();
                        } catch (err) {
                            alert('Failed to cancel request');
                        }
                    }
                };
            } else {
                connectBtn.textContent = 'Accept Request';
                connectBtn.onclick = async () => {
                    try {
                        await API.updateConnectionStatus(connection.id, 'accepted');
                        showToast('Connection accepted!');
                        loadProfileData();
                    } catch (err) {
                        alert('Failed to accept connection');
                    }
                };
            }
          }
        }
      } else {
        if (connectBtn) {
          connectBtn.style.display = 'block';
          connectBtn.classList.remove('hidden');
          connectBtn.textContent = 'Connect';
          connectBtn.disabled = false;
          connectBtn.onclick = async () => {
            try {
              await API.sendConnectionRequest(userToRender.id);
              showToast('Request sent!');
              loadProfileData(); // Reload to show "Requested" status
            } catch (err) {
              alert('Failed to send request');
            }
          };
        }
      }
    }

    renderProfile(userToRender);
  } catch (error) {
    console.error('Failed to load profile:', error);
    showToast('Failed to load profile data');
  }
}

function renderProfile(user) {
  // Basic info
  document.getElementById('profileAvatar').src = getAvatarUrl(user.avatar, user.name);
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileHeadline').textContent = user.headline || 'Add a headline';
  document.getElementById('profileLocation').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${user.location || 'Add location'}`;
  document.getElementById('profileBio').textContent = user.bio || 'No bio added yet';

  // Cover photo
  const coverEl = document.getElementById('profileCover');
  if (user.cover) {
    coverEl.src = user.cover.startsWith('http') ? user.cover : `http://127.0.0.1:8000${user.cover}`;
    coverEl.style.display = 'block';
  } else {
    coverEl.style.display = 'none';
  }

  // Dynamic Details Hub
  const detailsGrid = document.getElementById('profileDetailsGrid');
  let detailsHTML = '';

  if (user.type === 'company') {
    if (user.website) detailsHTML += `<div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> <a href="${user.website}" target="_blank">${user.website.replace(/^https?:\/\//, '')}</a></div>`;
    if (user.industry) detailsHTML += `<div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><rect x="2" y="10" width="20" height="12" rx="2"></rect><path d="M7 10V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5"></path><line x1="10" y1="14" x2="10" y2="14.01"></line><line x1="14" y1="14" x2="14" y2="14.01"></line><line x1="10" y1="18" x2="10" y2="18.01"></line><line x1="14" y1="18" x2="14" y2="18.01"></line></svg> ${user.industry}</div>`;
    if (user.company_size) detailsHTML += `<div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> ${user.company_size} employees</div>`;
  } else {
    if (user.portfolio) detailsHTML += `<div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> <a href="${user.portfolio}" target="_blank">Portfolio</a></div>`;
    if (user.github) detailsHTML += `<div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg> <a href="${user.github}" target="_blank">GitHub</a></div>`;
  }

  detailsGrid.innerHTML = detailsHTML;

  // Stats
  document.getElementById('connectionsCount').textContent = user.connections_count || 0;
  document.getElementById('postsCount').textContent = user.posts_count || 0;

  const jobsCountEl = document.getElementById('jobsCount');
  const jobsStatItem = document.getElementById('jobsStatItem');
  if (jobsCountEl && jobsStatItem) {
    jobsCountEl.textContent = user.jobs_count || 0;
    jobsStatItem.style.display = user.type === 'company' ? 'flex' : 'none';
  }

  // Completion
  const completion = user.profile_completion || 0;
  document.getElementById('completionPercentage').textContent = `${completion}%`;
  document.getElementById('completionProgress').style.width = `${completion}%`;

  // Sections visibility based on user type
  const isStudent = user.type === 'student';
  const projectsSection = document.getElementById('projectsSection');
  const skillsSection = document.getElementById('skillsSection');
  const experienceSection = document.getElementById('experienceSection');
  const educationSection = document.getElementById('educationSection');

  if (projectsSection) projectsSection.style.display = isStudent ? 'block' : 'none';
  if (skillsSection) skillsSection.style.display = isStudent ? 'block' : 'none';
  if (experienceSection) experienceSection.style.display = isStudent ? 'block' : 'none';
  if (educationSection) educationSection.style.display = isStudent ? 'block' : 'none';

  // Skills
  if (isStudent) {
    const skillsList = document.getElementById('skillsList');
    if (skillsList) {
      if (user.skills && user.skills.length > 0) {
        skillsList.innerHTML = user.skills.map(skill =>
          `<span class="badge badge-primary">${skill}</span>`
        ).join('');
      } else {
        skillsList.innerHTML = '<p style="color: var(--text-tertiary);">No skills added yet</p>';
      }
    }
  }

  // Experience
  if (user.type === 'student') {
    const experienceList = document.getElementById('experienceList');
    if (experienceList) {
      if (user.experience && user.experience.length > 0) {
        experienceList.innerHTML = user.experience.map(exp => `
          <div style="padding: var(--spacing-md) 0; border-bottom: 1px solid var(--glass-border);">
            <h4>${exp.title}</h4>
            <p style="color: var(--text-secondary);">${exp.company}</p>
            <p style="font-size: 0.875rem; color: var(--text-tertiary);">
              ${exp.startDate} - ${exp.endDate || 'Present'} • ${exp.location}
            </p>
            <p style="margin-top: var(--spacing-xs);">${exp.description}</p>
          </div>
        `).join('');
      } else {
        experienceList.innerHTML = '<p style="color: var(--text-tertiary);">No experience added yet</p>';
      }
    }
  }

  // Education
  if (user.type === 'student') {
    const educationList = document.getElementById('educationList');
    if (educationList) {
      if (user.education && user.education.length > 0) {
        educationList.innerHTML = user.education.map(edu => `
          <div style="padding: var(--spacing-md) 0; border-bottom: 1px solid var(--glass-border);">
            <h4>${edu.school}</h4>
            <p style="color: var(--text-secondary);">${edu.degree}</p>
            <p style="font-size: 0.875rem; color: var(--text-tertiary);">
              ${edu.startDate} - ${edu.endDate || 'Present'}
            </p>
            <p style="margin-top: var(--spacing-xs);">${edu.description}</p>
          </div>
        `).join('');
      } else {
        educationList.innerHTML = '<p style="color: var(--text-tertiary);">No education added yet</p>';
      }
    }
  }

  // Projects
  if (user.type === 'student') {
    const projectList = document.getElementById('projectList');
    if (projectList) {
      if (user.projects && user.projects.length > 0) {
        projectList.innerHTML = user.projects.map((proj, index) => `
          <div style="padding: var(--spacing-md) 0; border-bottom: 1px solid var(--glass-border); position: relative;">
            <h4 style="display: flex; align-items: center; gap: 10px;">
                ${proj.title}
                ${proj.link ? `<a href="${proj.link}" target="_blank" style="color: var(--accent);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>` : ''}
            </h4>
            <div style="margin: 0.5rem 0; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${proj.technologies ? proj.technologies.split(',').map(tech => `<span class="badge badge-ghost" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">${tech.trim()}</span>`).join('') : ''}
            </div>
            <p style="color: var(--text-secondary); margin-top: var(--spacing-xs);">${proj.description}</p>
            ${!userIdFromUrl || userIdFromUrl == currentUser.id ? `
                <button class="btn btn-ghost btn-sm delete-project-btn" onclick="deleteProject(${index})" style="position: absolute; top: 0.5rem; right: 0; color: var(--danger);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            ` : ''}
          </div>
        `).join('');
      } else {
        projectList.innerHTML = '<p style="color: var(--text-tertiary);">No projects added yet</p>';
      }
    }
  }
}

async function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      showToast('Uploading avatar...');
      await API.uploadAvatar(formData);
      loadProfileData();
      showToast('✅ Avatar updated!');
    } catch (error) {
      alert('Upload failed: ' + (error.message || 'Server error'));
    }
  }
}

async function handleCoverUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('cover', file);
    try {
      showToast('Uploading cover photo...');
      await API.uploadCover(formData);
      loadProfileData();
      showToast('✅ Cover photo updated!');
    } catch (error) {
      alert('Upload failed: ' + (error.message || 'Server error'));
    }
  }
}

let currentEditType = null;

function showEditModal(type) {
  currentEditType = type;
  const modal = document.getElementById('editProfileModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalFormContent = document.getElementById('modalFormContent');
  const currentUser = Storage.getCurrentUser();

  let formHTML = '';

  switch (type) {
    case 'bio':
      modalTitle.textContent = 'Edit Profile Details';

      let extraFields = '';
      if (currentUser.type === 'company') {
        extraFields = `
          <div class="form-group">
            <label class="form-label">Website</label>
            <input type="url" class="form-input" id="websiteInput" value="${currentUser.website || ''}" placeholder="https://yourcompany.com">
          </div>
          <div class="flex gap-sm">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Industry</label>
              <input type="text" class="form-input" id="industryInput" value="${currentUser.industry || ''}" placeholder="e.g., Software, Finance">
            </div>
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Company Size</label>
              <select class="form-select" id="sizeInput">
                <option value="" ${!currentUser.companySize ? 'selected' : ''}>Select size...</option>
                <option value="1-10" ${currentUser.companySize === '1-10' ? 'selected' : ''}>1-10</option>
                <option value="11-50" ${currentUser.companySize === '11-50' ? 'selected' : ''}>11-50</option>
                <option value="51-200" ${currentUser.companySize === '51-200' ? 'selected' : ''}>51-200</option>
                <option value="201-500" ${currentUser.companySize === '201-500' ? 'selected' : ''}>201-500</option>
                <option value="500+" ${currentUser.companySize === '500+' ? 'selected' : ''}>500+</option>
              </select>
            </div>
          </div>
        `;
      } else {
        extraFields = `
          <div class="flex gap-sm">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Portfolio URL</label>
              <input type="url" class="form-input" id="portfolioInput" value="${currentUser.portfolio || ''}" placeholder="https://yourportfolio.com">
            </div>
            <div class="form-group" style="flex: 1;">
              <label class="form-label">GitHub URL</label>
              <input type="url" class="form-input" id="githubInput" value="${currentUser.github || ''}" placeholder="https://github.com/username">
            </div>
          </div>
        `;
      }

      formHTML = `
        <div class="form-group">
          <label class="form-label">Headline</label>
          <input type="text" class="form-input" id="headlineInput" value="${currentUser.headline || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Location</label>
          <input type="text" class="form-input" id="locationInput" value="${currentUser.location || ''}">
        </div>
        ${extraFields}
        <div class="form-group">
          <label class="form-label">About</label>
          <textarea class="form-textarea" id="bioInput" style="min-height: 120px;">${currentUser.bio || ''}</textarea>
        </div>
      `;
      break;

    case 'skill':
      modalTitle.textContent = 'Add Skill';
      formHTML = `
        <div class="form-group">
          <label class="form-label">Skill Name</label>
          <input type="text" class="form-input" id="skillInput" placeholder="e.g., JavaScript, Python, Marketing">
        </div>
      `;
      break;

    case 'experience':
      modalTitle.textContent = 'Add Experience';
      formHTML = `
        <div class="form-group">
          <label class="form-label">Title</label>
          <input type="text" class="form-input" id="expTitle" placeholder="e.g., Software Engineer Intern">
        </div>
        <div class="form-group">
          <label class="form-label">Company</label>
          <input type="text" class="form-input" id="expCompany" placeholder="Company name">
        </div>
        <div class="form-group">
          <label class="form-label">Location</label>
          <input type="text" class="form-input" id="expLocation" placeholder="e.g., Remote, New York, NY">
        </div>
        <div class="flex gap-sm">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Start Date</label>
            <input type="month" class="form-input" id="expStartDate">
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">End Date</label>
            <input type="month" class="form-input" id="expEndDate">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="expDescription" placeholder="Describe your role and achievements"></textarea>
        </div>
      `;
      break;

    case 'education':
      modalTitle.textContent = 'Add Education';
      formHTML = `
        <div class="form-group">
          <label class="form-label">School</label>
          <input type="text" class="form-input" id="eduSchool" placeholder="University name">
        </div>
        <div class="form-group">
          <label class="form-label">Degree</label>
          <input type="text" class="form-input" id="eduDegree" placeholder="e.g., Bachelor of Science in Computer Science">
        </div>
        <div class="flex gap-sm">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Start Year</label>
            <input type="number" class="form-input" id="eduStartDate" placeholder="2020">
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">End Year</label>
            <input type="number" class="form-input" id="eduEndDate" placeholder="2024">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="eduDescription" placeholder="GPA, achievements, activities"></textarea>
        </div>
      `;
      break;

    case 'project':
      modalTitle.textContent = 'Add Project';
      formHTML = `
        <div class="form-group">
          <label class="form-label">Project Title</label>
          <input type="text" class="form-input" id="projTitle" placeholder="e.g., E-commerce App">
        </div>
        <div class="form-group">
          <label class="form-label">Project Link (optional)</label>
          <input type="url" class="form-input" id="projLink" placeholder="https://github.com/... or https://demo.com">
        </div>
        <div class="form-group">
          <label class="form-label">Technologies Used</label>
          <input type="text" class="form-input" id="projTech" placeholder="e.g., React, Node.js, MongoDB (comma separated)">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="projDescription" style="min-height: 100px;" placeholder="What did you build? What were your contributions?"></textarea>
        </div>
      `;
      break;
  }

  modalFormContent.innerHTML = formHTML;
  modal.classList.remove('hidden');
}

function hideEditModal() {
  document.getElementById('editProfileModal').classList.add('hidden');
  currentEditType = null;
}

async function handleSaveEdit() {
  const currentUser = Storage.getCurrentUser();
  const updates = {
    name: currentUser.name // Keep name as it's required by backend validator
  };

  switch (currentEditType) {
    case 'bio':
      updates.bio = document.getElementById('bioInput').value;
      updates.headline = document.getElementById('headlineInput').value;
      updates.location = document.getElementById('locationInput').value;

      if (currentUser.type === 'company') {
        updates.industry = document.getElementById('industryInput').value;
        updates.website = document.getElementById('websiteInput').value;
        updates.company_size = document.getElementById('sizeInput').value;
      } else {
        updates.portfolio = document.getElementById('portfolioInput').value;
        updates.github = document.getElementById('githubInput').value;
      }
      break;

    case 'skill':
      const skill = document.getElementById('skillInput').value.trim();
      if (skill) {
        const skills = currentUser.skills || [];
        if (!skills.includes(skill)) {
          updates.skills = [...skills, skill];
        }
      }
      break;

    case 'experience':
      const exp = {
        title: document.getElementById('expTitle').value,
        company: document.getElementById('expCompany').value,
        location: document.getElementById('expLocation').value,
        startDate: document.getElementById('expStartDate').value,
        endDate: document.getElementById('expEndDate').value,
        description: document.getElementById('expDescription').value
      };
      updates.experience = [...(currentUser.experience || []), exp];
      break;

    case 'education':
      const edu = {
        school: document.getElementById('eduSchool').value,
        degree: document.getElementById('eduDegree').value,
        startDate: document.getElementById('eduStartDate').value,
        endDate: document.getElementById('eduEndDate').value,
        description: document.getElementById('eduDescription').value
      };
      updates.education = [...(currentUser.education || []), edu];
      break;

    case 'project':
      const proj = {
        title: document.getElementById('projTitle').value.trim(),
        link: document.getElementById('projLink').value.trim(),
        technologies: document.getElementById('projTech').value.trim(),
        description: document.getElementById('projDescription').value.trim()
      };
      if (!proj.title) {
        alert('Project title is required');
        return;
      }
      updates.projects = [...(currentUser.projects || []), proj];
      break;
  }

  try {
    showToast('Saving changes...');
    await API.updateProfile(updates);
    hideEditModal();
    loadProfileData();
    showToast('✅ Profile updated!');
  } catch (error) {
    alert('Save failed: ' + (error.message || 'Server error'));
  }
}

async function deleteProject(index) {
  if (confirm('Are you sure you want to delete this project?')) {
    const currentUser = Storage.getCurrentUser();
    const projects = [...(currentUser.projects || [])];
    projects.splice(index, 1);

    try {
      showToast('Deleting project...');
      await API.updateProfile({ 
        name: currentUser.name,
        projects: projects 
      });
      loadProfileData();
      showToast('✅ Project deleted');
    } catch (error) {
      alert('Delete failed: ' + (error.message || 'Server error'));
    }
  }
}

window.deleteProject = deleteProject;


