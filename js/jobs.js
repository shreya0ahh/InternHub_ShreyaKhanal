// InternHub - Jobs Management

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('jobsContainer')) {
    initJobs();
  }
});

let currentJobId = null;

function initJobs() {
  const currentUser = Storage.getCurrentUser();
  if (!currentUser) { window.location.href = 'index.html'; return; }

  if (currentUser.type === 'company') {
    // Show company panel and update heading
    document.getElementById('createJobSection').classList.remove('hidden');
    const titleEl = document.getElementById('jobsPageTitle');
    if (titleEl) titleEl.textContent = '📋 Your Job Listings';

    document.getElementById('postJobBtn')?.addEventListener('click', showPostJobModal);
    document.getElementById('submitPostJob')?.addEventListener('click', handlePostJob);
    document.getElementById('closePostJobModal')?.addEventListener('click', hidePostJobModal);
    document.getElementById('cancelPostJob')?.addEventListener('click', hidePostJobModal);
  }

  // Filters
  document.getElementById('jobTypeFilter')?.addEventListener('change', loadJobs);
  document.getElementById('experienceFilter')?.addEventListener('change', loadJobs);
  document.getElementById('locationFilter')?.addEventListener('input', debounce(loadJobs, 500));

  // Application modal for students only
  if (currentUser.type === 'student') {
    document.getElementById('closeApplyModal')?.addEventListener('click', hideApplyModal);
    document.getElementById('cancelApply')?.addEventListener('click', hideApplyModal);
    document.getElementById('submitApplication')?.addEventListener('click', handleApply);
  }

  // Applicants modal (company) close
  document.getElementById('closeApplicantsModal')?.addEventListener('click', hideApplicantsModal);
  document.getElementById('closeApplicantsBtn')?.addEventListener('click', hideApplicantsModal);

  // CV viewer modal close
  document.getElementById('closeCvModal')?.addEventListener('click', hideCvModal);

  // Job details modal close
  document.getElementById('closeJobDetailsModal')?.addEventListener('click', hideJobDetailsModal);

  loadJobs();
}

// ─── Load & Render Jobs ───────────────────────────────────────────────────────

function loadJobs() {
  const jobs = Storage.get(Storage.KEYS.JOBS) || [];
  const currentUser = Storage.getCurrentUser();
  const savedJobs = Storage.get(Storage.KEYS.SAVED_JOBS) || [];
  const applications = Storage.get(Storage.KEYS.APPLICATIONS) || [];

  const typeFilter = document.getElementById('jobTypeFilter')?.value || '';
  const expFilter = document.getElementById('experienceFilter')?.value || '';
  const locationFilter = document.getElementById('locationFilter')?.value.toLowerCase() || '';

  let filteredJobs = jobs.filter(job => {
    const matchesType = !typeFilter || job.type === typeFilter;
    const matchesExp = !expFilter || job.experienceLevel === expFilter;
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter);
    return matchesType && matchesExp && matchesLocation;
  });

  // For company: only show THEIR jobs; for student: show all jobs
  if (currentUser.type === 'company') {
    filteredJobs = filteredJobs.filter(job => job.companyId === currentUser.id);
  }

  const jobsContainer = document.getElementById('jobsContainer');

  if (filteredJobs.length === 0) {
    jobsContainer.innerHTML = currentUser.type === 'company'
      ? `<div class="glass-card text-center">
                 <h3>No jobs posted yet</h3>
                 <p style="color: var(--text-secondary);">Click "Post a Job" to create your first listing.</p>
               </div>`
      : `<div class="glass-card text-center">
                 <h3>No jobs found</h3>
                 <p style="color: var(--text-secondary);">Try adjusting your filters</p>
               </div>`;
    return;
  }

  jobsContainer.innerHTML = filteredJobs.map(job => {
    const isSaved = savedJobs.some(s => s.userId === currentUser.id && s.jobId === job.id);
    const hasApplied = applications.some(a => a.userId === currentUser.id && a.jobId === job.id);
    const timeAgo = getTimeAgo(job.postedDate);
    const jobApplications = applications.filter(a => a.jobId === job.id);
    const isOwner = currentUser.type === 'company' && job.companyId === currentUser.id;

    return `
        <div class="job-card animate-fade-in-up">
          <div class="job-header">
            <img src="${job.companyLogo}" alt="${job.companyName}" class="job-logo">
            <div class="job-info">
              <h3 class="job-title">${job.title}</h3>
              <p class="job-company">${job.companyName}</p>
              <div class="job-meta">
                <span class="job-meta-item">📍 ${job.location}</span>
                <span class="job-meta-item">💼 ${job.type}</span>
                <span class="job-meta-item">📊 ${job.experienceLevel}</span>
                <span class="job-meta-item">💰 ${job.salary}</span>
              </div>
            </div>
            ${currentUser.type === 'student' ? `
              <button class="btn btn-ghost save-job-btn" data-job-id="${job.id}" title="${isSaved ? 'Unsave' : 'Save'}">
                ${isSaved ? '❤️' : '🤍'}
              </button>` : ''}
          </div>

          <p class="job-description">${job.description}</p>

          <div style="margin-bottom: var(--spacing-sm);">
            <strong style="color: var(--text-primary);">Required Skills:</strong>
            <div class="flex flex-wrap gap-xs mt-xs">
              ${job.skills.map(skill => `<span class="badge badge-glass">${skill}</span>`).join('')}
            </div>
          </div>

          <div style="color: var(--text-tertiary); font-size: 0.875rem; margin-bottom: var(--spacing-md);">
            ${isOwner
        ? `<strong style="color: var(--accent);">${jobApplications.length} application${jobApplications.length !== 1 ? 's' : ''} received</strong> • `
        : `${job.applicants} applicants • `}
            Posted ${timeAgo}
          </div>

          <div class="job-actions">
            ${currentUser.type === 'student' ? `
              <button class="btn ${hasApplied ? 'btn-ghost' : 'btn-primary'} apply-job-btn"
                      data-job-id="${job.id}"
                      ${hasApplied ? 'disabled' : ''}>
                ${hasApplied ? '✓ Applied' : 'Apply Now'}
              </button>` : ''}

            ${isOwner ? `
              <button class="btn btn-primary view-applicants-btn" data-job-id="${job.id}">
                👥 View ${jobApplications.length} Applicant${jobApplications.length !== 1 ? 's' : ''}
              </button>` : ''}

            <button class="btn btn-outline view-details-btn" data-job-id="${job.id}">View Details</button>
          </div>
        </div>
        `;
  }).join('');

  // Attach listeners
  if (currentUser.type === 'student') {
    document.querySelectorAll('.apply-job-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => showApplyModal(btn.dataset.jobId));
    });
    document.querySelectorAll('.save-job-btn').forEach(btn => {
      btn.addEventListener('click', () => toggleSaveJob(btn.dataset.jobId));
    });
  }

  if (currentUser.type === 'company') {
    document.querySelectorAll('.view-applicants-btn').forEach(btn => {
      btn.addEventListener('click', () => showApplicantsModal(btn.dataset.jobId));
    });
  }

  // View Details (both)
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', () => showJobDetailsModal(btn.dataset.jobId));
  });
}

// ─── Job Details Modal ────────────────────────────────────────────────────────

function showJobDetailsModal(jobId) {
  const jobs = Storage.get(Storage.KEYS.JOBS) || [];
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  const currentUser = Storage.getCurrentUser();
  const applications = Storage.get(Storage.KEYS.APPLICATIONS) || [];
  const hasApplied = applications.some(a => a.jobId === jobId && a.userId === currentUser.id);

  document.getElementById('detailsJobTitle').textContent = job.title;
  document.getElementById('detailsCompanyLogo').src = job.companyLogo;
  document.getElementById('detailsCompanyName').textContent = job.companyName;
  document.getElementById('detailsJobMeta').textContent = `📍 ${job.location} • ${job.type} • ${job.experienceLevel}`;
  document.getElementById('detailsJobDescription').textContent = job.description;

  const skillsDiv = document.getElementById('detailsJobSkills');
  skillsDiv.innerHTML = job.skills.map(skill => `<span class="badge badge-glass" style="margin-right: 4px; margin-bottom: 4px;">${skill}</span>`).join('');

  const salaryObj = document.getElementById('detailsSalarySection');
  if (job.salary) {
    document.getElementById('detailsJobSalary').textContent = job.salary;
    salaryObj.style.display = 'block';
  } else {
    salaryObj.style.display = 'none';
  }

  const footer = document.getElementById('detailsModalFooter');
  if (currentUser.type === 'student') {
    footer.innerHTML = `
      <button class="btn ${hasApplied ? 'btn-ghost' : 'btn-primary'}" 
              id="detailsApplyBtn"
              ${hasApplied ? 'disabled' : ''}>
        ${hasApplied ? '✓ Applied' : 'Apply Now'}
      </button>
    `;

    if (!hasApplied) {
      document.getElementById('detailsApplyBtn').addEventListener('click', () => {
        hideJobDetailsModal();
        showApplyModal(jobId);
      });
    }
  } else {
    footer.innerHTML = '<button class="btn btn-ghost" id="detailsCloseFooterBtn">Close</button>';
    document.getElementById('detailsCloseFooterBtn').addEventListener('click', hideJobDetailsModal);
  }

  document.getElementById('jobDetailsModal').classList.remove('hidden');
}

function hideJobDetailsModal() {
  document.getElementById('jobDetailsModal').classList.add('hidden');
}

// ─── Post Job Modal (Company) ─────────────────────────────────────────────────

function showPostJobModal() {
  document.getElementById('postJobModal').classList.remove('hidden');
  document.getElementById('postJobForm')?.reset();
}

function hidePostJobModal() {
  document.getElementById('postJobModal').classList.add('hidden');
}

function handlePostJob() {
  const currentUser = Storage.getCurrentUser();

  const title = document.getElementById('jobTitle').value.trim();
  const location = document.getElementById('jobLocation').value.trim();
  const type = document.getElementById('jobType').value;
  const experienceLevel = document.getElementById('jobExperience').value;
  const salary = document.getElementById('jobSalary').value.trim();
  const description = document.getElementById('jobDescription').value.trim();
  const skillsRaw = document.getElementById('jobSkills').value.trim();

  // Basic validation
  if (!title || !location || !type || !experienceLevel || !description) {
    alert('Please fill in all required fields.');
    return;
  }

  const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  const newJob = {
    id: `job-${Date.now()}`,
    companyId: currentUser.id,
    companyName: currentUser.name,
    companyLogo: currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`,
    title,
    location,
    type,
    experienceLevel,
    salary: salary || 'Negotiable',
    description,
    skills,
    requirements: [],
    responsibilities: [],
    postedDate: new Date().toISOString(),
    applicants: 0
  };

  const jobs = Storage.get(Storage.KEYS.JOBS) || [];
  jobs.unshift(newJob); // newest first
  Storage.set(Storage.KEYS.JOBS, jobs);

  hidePostJobModal();
  loadJobs();
  showToast('🎉 Job posted successfully!');
}

// ─── Apply Modal (Student) ────────────────────────────────────────────────────

function showApplyModal(jobId) {
  currentJobId = jobId;
  const jobs = Storage.get(Storage.KEYS.JOBS) || [];
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  document.getElementById('applyJobTitle').textContent = job.title;
  document.getElementById('applyCompanyName').textContent = job.companyName;
  document.getElementById('applyModal').classList.remove('hidden');
}

function hideApplyModal() {
  document.getElementById('applyModal').classList.add('hidden');
  const cvEl = document.getElementById('cvUpload');
  const clEl = document.getElementById('coverLetter');
  if (cvEl) cvEl.value = '';
  if (clEl) clEl.value = '';
  currentJobId = null;
}

function handleApply() {
  const currentUser = Storage.getCurrentUser();
  const cvFile = document.getElementById('cvUpload').files[0];
  const coverLetter = document.getElementById('coverLetter').value;

  if (!cvFile) {
    alert('Please upload your CV/Resume');
    return;
  }
  if (cvFile.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const application = {
      id: `app-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userHeadline: currentUser.headline || 'Student',
      jobId: currentJobId,
      cvData: e.target.result,
      cvFileName: cvFile.name,
      cvType: cvFile.type,
      coverLetter,
      appliedDate: new Date().toISOString(),
      status: 'submitted'
    };

    const applications = Storage.get(Storage.KEYS.APPLICATIONS) || [];
    applications.push(application);
    Storage.set(Storage.KEYS.APPLICATIONS, applications);

    hideApplyModal();
    showToast('✅ Application submitted successfully!');
    loadJobs();
  };
  reader.readAsDataURL(cvFile);
}

// ─── Applicants Modal (Company) ───────────────────────────────────────────────

function showApplicantsModal(jobId) {
  const jobs = Storage.get(Storage.KEYS.JOBS) || [];
  const applications = Storage.get(Storage.KEYS.APPLICATIONS) || [];
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  document.getElementById('applicantsJobTitle').textContent = job.title;

  const jobApplications = applications.filter(a => a.jobId === jobId);
  const listEl = document.getElementById('applicantsList');

  if (jobApplications.length === 0) {
    listEl.innerHTML = `
          <div style="text-align:center; padding: var(--spacing-xl); color: var(--text-secondary);">
            <div style="font-size:3rem; margin-bottom:1rem;">📭</div>
            <p>No applications yet for this position.</p>
          </div>`;
  } else {
    listEl.innerHTML = jobApplications.map(app => {
      const appliedDate = new Date(app.appliedDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      const statusColor = { submitted: '#667eea', reviewed: '#f7971e', shortlisted: '#56ab2f', rejected: '#f5576c' };
      const color = statusColor[app.status] || '#667eea';
      const users = Storage.get(Storage.KEYS.USERS) || [];
      const applicantUser = users.find(u => u.id === app.userId) || {};

      return `
            <div class="applicant-card" data-app-id="${app.id}">
              <div class="applicant-info">
                <img src="${app.userAvatar || applicantUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}"
                     alt="${app.userName || applicantUser.name || 'Applicant'}"
                     class="avatar avatar-md">
                <div class="applicant-details">
                  <strong>${app.userName || applicantUser.name || 'Unknown'}</strong>
                  <p style="color: var(--text-secondary); font-size:0.875rem; margin:0;">${app.userHeadline || applicantUser.headline || 'Student'}</p>
                  <p style="color: var(--text-tertiary); font-size:0.8rem; margin:0;">Applied: ${appliedDate}</p>
                </div>
              </div>
              <div class="applicant-actions">
                <span class="badge" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40; text-transform: capitalize;">
                  ${app.status}
                </span>
                <button class="btn btn-outline btn-sm view-cv-btn"
                        data-app-id="${app.id}"
                        data-cv="${encodeURIComponent(app.cvData)}"
                        data-filename="${app.cvFileName}"
                        data-cvtype="${app.cvType || ''}">
                  📄 View CV
                </button>
                <select class="form-select status-select" data-app-id="${app.id}" style="max-width:140px; padding:0.3rem 0.5rem; font-size:0.8rem;">
                  <option value="submitted" ${app.status === 'submitted' ? 'selected' : ''}>Submitted</option>
                  <option value="reviewed" ${app.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                  <option value="shortlisted" ${app.status === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
                  <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
              </div>
            </div>`;
    }).join('');

    // View CV buttons
    listEl.querySelectorAll('.view-cv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showCvModal(decodeURIComponent(btn.dataset.cv), btn.dataset.filename, btn.dataset.cvtype);
      });
    });

    // Status change
    listEl.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', () => updateApplicationStatus(sel.dataset.appId, sel.value));
    });
  }

  document.getElementById('applicantsModal').classList.remove('hidden');
}

function hideApplicantsModal() {
  document.getElementById('applicantsModal').classList.add('hidden');
}

function updateApplicationStatus(appId, newStatus) {
  const applications = Storage.get(Storage.KEYS.APPLICATIONS) || [];
  const idx = applications.findIndex(a => a.id === appId);
  if (idx === -1) return;

  const app = applications[idx];
  const prevStatus = app.status;
  app.status = newStatus;
  Storage.set(Storage.KEYS.APPLICATIONS, applications);

  // Send notification to the student if status meaningfully changed
  const notifiableStatuses = ['reviewed', 'shortlisted', 'rejected'];
  if (newStatus !== prevStatus && notifiableStatuses.includes(newStatus)) {
    const emojiMap = {
      reviewed: '👀',
      shortlisted: '🌟',
      rejected: '❌'
    };
    const messageMap = {
      reviewed: 'Your application has been reviewed.',
      shortlisted: 'Great news! You have been shortlisted.',
      rejected: 'Your application was not selected this time.'
    };

    // Look up the job title
    const jobs = Storage.get(Storage.KEYS.JOBS) || [];
    const job = jobs.find(j => j.id === app.jobId);
    const jobTitle = job ? job.title : 'a job';
    const companyName = job ? job.companyName : 'A company';

    const notification = {
      id: `notif-${Date.now()}`,
      userId: app.userId,                // targets the student
      type: 'application_status',
      message: `${emojiMap[newStatus]} ${companyName}: ${messageMap[newStatus]} (${jobTitle})`,
      jobId: app.jobId,
      appId: app.id,
      status: newStatus,
      read: false,
      timestamp: new Date().toISOString()
    };

    const notifications = Storage.get(Storage.KEYS.NOTIFICATIONS) || [];
    notifications.unshift(notification);   // newest first
    Storage.set(Storage.KEYS.NOTIFICATIONS, notifications);
  }

  showToast('Status updated!');
}

// ─── CV Viewer Modal ──────────────────────────────────────────────────────────

function showCvModal(cvData, fileName, cvType) {
  const modal = document.getElementById('cvViewerModal');
  const title = document.getElementById('cvFileName');
  const container = document.getElementById('cvViewerContainer');

  title.textContent = fileName || 'CV / Resume';

  // Detect file type
  const isPdf = cvType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');
  const isImage = cvType?.startsWith('image/') || /\.(png|jpg|jpeg|gif)$/i.test(fileName);

  if (isPdf) {
    container.innerHTML = `<iframe src="${cvData}" style="width:100%; height:70vh; border:none; border-radius:8px;"></iframe>`;
  } else if (isImage) {
    container.innerHTML = `<img src="${cvData}" style="width:100%; max-height:70vh; object-fit:contain; border-radius:8px;" alt="CV">`;
  } else {
    // For .doc/.docx - offer download
    container.innerHTML = `
          <div style="text-align:center; padding: var(--spacing-xl);">
            <div style="font-size:4rem; margin-bottom:1rem;">📄</div>
            <p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">
              This file format (${fileName}) cannot be previewed directly in the browser.
            </p>
            <a href="${cvData}" download="${fileName}" class="btn btn-primary">⬇️ Download CV</a>
          </div>`;
  }

  modal.classList.remove('hidden');
}

function hideCvModal() {
  document.getElementById('cvViewerModal').classList.add('hidden');
  document.getElementById('cvViewerContainer').innerHTML = '';
}

// ─── Save Job (Student) ───────────────────────────────────────────────────────

function toggleSaveJob(jobId) {
  const currentUser = Storage.getCurrentUser();
  const savedJobs = Storage.get(Storage.KEYS.SAVED_JOBS) || [];
  const existingIndex = savedJobs.findIndex(s => s.userId === currentUser.id && s.jobId === jobId);

  if (existingIndex > -1) {
    savedJobs.splice(existingIndex, 1);
    showToast('Job removed from saved');
  } else {
    savedJobs.push({
      id: `saved-${Date.now()}`,
      userId: currentUser.id,
      jobId,
      savedDate: new Date().toISOString()
    });
    showToast('❤️ Job saved!');
  }

  Storage.set(Storage.KEYS.SAVED_JOBS, savedJobs);
  loadJobs();
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// getTimeAgo is provided globally by app.js (window.getTimeAgo)
// Fallback in case jobs.js is loaded before app.js finishes
if (typeof getTimeAgo === 'undefined') {
  window.getTimeAgo = function (dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`; // Corrected from original, was 2592000
    return date.toLocaleDateString();
  };
}

function showToast(message) {
  let toast = document.getElementById('jobToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'jobToast';
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
