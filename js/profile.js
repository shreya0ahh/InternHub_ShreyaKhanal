// InternHub - Profile Management

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('profileAvatar')) {
    initProfile();
  }
});

function initProfile() {
  const currentUser = Storage.getCurrentUser();
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
  document.getElementById('addSkillBtn')?.addEventListener('click', () => showEditModal('skill'));
  document.getElementById('addExperienceBtn')?.addEventListener('click', () => showEditModal('experience'));
  document.getElementById('addEducationBtn')?.addEventListener('click', () => showEditModal('education'));

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

function loadProfileData() {
  const currentUser = Storage.getCurrentUser();

  // Basic info
  document.getElementById('profileAvatar').src = currentUser.avatar;
  document.getElementById('profileName').textContent = currentUser.name;
  document.getElementById('profileHeadline').textContent = currentUser.headline || 'Add a headline';
  document.getElementById('profileLocation').textContent = `📍 ${currentUser.location || 'Add location'}`;
  document.getElementById('profileBio').textContent = currentUser.bio || 'No bio added yet';

  // Cover photo
  const coverEl = document.getElementById('profileCover');
  if (currentUser.cover) {
    coverEl.src = currentUser.cover;
    coverEl.style.display = 'block';
  } else {
    coverEl.style.display = 'none';
  }

  // Dynamic Details Hub
  const detailsGrid = document.getElementById('profileDetailsGrid');
  let detailsHTML = '';

  if (currentUser.type === 'company') {
    if (currentUser.website) detailsHTML += `<div>🌐 <a href="${currentUser.website}" target="_blank">${currentUser.website.replace(/^https?:\/\//, '')}</a></div>`;
    if (currentUser.industry) detailsHTML += `<div>🏢 ${currentUser.industry}</div>`;
    if (currentUser.companySize) detailsHTML += `<div>👥 ${currentUser.companySize} employees</div>`;
  } else {
    if (currentUser.portfolio) detailsHTML += `<div>🔗 <a href="${currentUser.portfolio}" target="_blank">Portfolio</a></div>`;
    if (currentUser.github) detailsHTML += `<div>💻 <a href="${currentUser.github}" target="_blank">GitHub</a></div>`;
  }

  detailsGrid.innerHTML = detailsHTML;

  // Stats
  const posts = Storage.get(Storage.KEYS.POSTS) || [];
  const userPosts = posts.filter(p => p.authorId === currentUser.id);
  document.getElementById('connectionsCount').textContent = currentUser.connections?.length || 0;
  document.getElementById('followersCount').textContent = currentUser.followers?.length || 0;
  document.getElementById('postsCount').textContent = userPosts.length;

  // Completion
  const completion = calculateProfileCompletion(currentUser);
  document.getElementById('completionPercentage').textContent = `${completion}%`;
  document.getElementById('completionProgress').style.width = `${completion}%`;

  // Skills
  if (currentUser.type === 'student' && currentUser.skills) {
    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = currentUser.skills.map(skill =>
      `<span class="badge badge-primary">${skill}</span>`
    ).join('');
  } else {
    document.getElementById('skillsSection')?.remove();
  }

  // Experience
  if (currentUser.type === 'student' && currentUser.experience) {
    const experienceList = document.getElementById('experienceList');
    experienceList.innerHTML = currentUser.experience.map(exp => `
      <div style="padding: var(--spacing-md) 0; border-bottom: 1px solid var(--glass-border);">
        <h4>${exp.title}</h4>
        <p style="color: var(--text-secondary);">${exp.company}</p>
        <p style="font-size: 0.875rem; color: var(--text-tertiary);">
          ${exp.startDate} - ${exp.endDate || 'Present'} • ${exp.location}
        </p>
        <p style="margin-top: var(--spacing-xs);">${exp.description}</p>
      </div>
    `).join('') || '<p style="color: var(--text-tertiary);">No experience added yet</p>';
  } else {
    document.getElementById('experienceSection')?.remove();
  }

  // Education
  if (currentUser.type === 'student' && currentUser.education) {
    const educationList = document.getElementById('educationList');
    educationList.innerHTML = currentUser.education.map(edu => `
      <div style="padding: var(--spacing-md) 0; border-bottom: 1px solid var(--glass-border);">
        <h4>${edu.school}</h4>
        <p style="color: var(--text-secondary);">${edu.degree}</p>
        <p style="font-size: 0.875rem; color: var(--text-tertiary);">
          ${edu.startDate} - ${edu.endDate || 'Present'}
        </p>
        <p style="margin-top: var(--spacing-xs);">${edu.description}</p>
      </div>
    `).join('') || '<p style="color: var(--text-tertiary);">No education added yet</p>';
  } else {
    document.getElementById('educationSection')?.remove();
  }
}

function calculateProfileCompletion(user) {
  let completion = 25; // Base for having an account

  if (user.headline && user.headline !== 'Student' && user.headline !== 'Company') completion += 15;
  if (user.bio) completion += 15;
  if (user.location) completion += 10;

  if (user.type === 'student') {
    if (user.skills && user.skills.length > 0) completion += 15;
    if (user.experience && user.experience.length > 0) completion += 10;
    if (user.education && user.education.length > 0) completion += 10;
  }

  return Math.min(completion, 100);
}

function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const currentUser = Storage.getCurrentUser();
      currentUser.avatar = e.target.result;
      Storage.setCurrentUser(currentUser);
      Storage.updateUser(currentUser.id, { avatar: e.target.result });
      loadProfileData();
    };
    reader.readAsDataURL(file);
  }
}

function handleCoverUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const currentUser = Storage.getCurrentUser();
      currentUser.cover = e.target.result;
      Storage.setCurrentUser(currentUser);
      Storage.updateUser(currentUser.id, { cover: e.target.result });
      loadProfileData();
    };
    reader.readAsDataURL(file);
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
  }

  modalFormContent.innerHTML = formHTML;
  modal.classList.remove('hidden');
}

function hideEditModal() {
  document.getElementById('editProfileModal').classList.add('hidden');
  currentEditType = null;
}

function handleSaveEdit() {
  const currentUser = Storage.getCurrentUser();

  switch (currentEditType) {
    case 'bio':
      const bio = document.getElementById('bioInput').value;
      const headline = document.getElementById('headlineInput').value;
      const location = document.getElementById('locationInput').value;

      const updates = { bio, headline, location };

      if (currentUser.type === 'company') {
        updates.website = document.getElementById('websiteInput').value;
        updates.industry = document.getElementById('industryInput').value;
        updates.companySize = document.getElementById('sizeInput').value;

        currentUser.website = updates.website;
        currentUser.industry = updates.industry;
        currentUser.companySize = updates.companySize;
      } else {
        updates.portfolio = document.getElementById('portfolioInput').value;
        updates.github = document.getElementById('githubInput').value;

        currentUser.portfolio = updates.portfolio;
        currentUser.github = updates.github;
      }

      Storage.updateUser(currentUser.id, updates);
      currentUser.bio = bio;
      currentUser.headline = headline;
      currentUser.location = location;
      break;

    case 'skill':
      const skill = document.getElementById('skillInput').value.trim();
      if (skill && !currentUser.skills.includes(skill)) {
        currentUser.skills.push(skill);
        Storage.updateUser(currentUser.id, { skills: currentUser.skills });
      }
      break;

    case 'experience':
      const experience = {
        id: `exp-${Date.now()}`,
        title: document.getElementById('expTitle').value,
        company: document.getElementById('expCompany').value,
        location: document.getElementById('expLocation').value,
        startDate: document.getElementById('expStartDate').value,
        endDate: document.getElementById('expEndDate').value,
        description: document.getElementById('expDescription').value
      };
      if (!currentUser.experience) currentUser.experience = [];
      currentUser.experience.push(experience);
      Storage.updateUser(currentUser.id, { experience: currentUser.experience });
      break;

    case 'education':
      const education = {
        id: `edu-${Date.now()}`,
        school: document.getElementById('eduSchool').value,
        degree: document.getElementById('eduDegree').value,
        startDate: document.getElementById('eduStartDate').value,
        endDate: document.getElementById('eduEndDate').value,
        description: document.getElementById('eduDescription').value
      };
      if (!currentUser.education) currentUser.education = [];
      currentUser.education.push(education);
      Storage.updateUser(currentUser.id, { education: currentUser.education });
      break;
  }

  Storage.setCurrentUser(currentUser);
  hideEditModal();
  loadProfileData();
}
