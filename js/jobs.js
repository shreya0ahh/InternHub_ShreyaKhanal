// InternHub - Jobs Management

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('jobsContainer')) {
    initJobs();
  }
});

let currentJobId = null;
let allJobs = [];
let allApplications = [];

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

async function loadJobs() {
  const typeFilter = document.getElementById('jobTypeFilter')?.value || '';
  const expFilter = document.getElementById('experienceFilter')?.value || '';
  const locationFilter = document.getElementById('locationFilter')?.value.toLowerCase() || '';

  const filters = {
    type: typeFilter,
    experience_level: expFilter,
    location: locationFilter
  };

  const currentUser = Storage.getCurrentUser();
  if (currentUser.type === 'company') {
    filters.my_jobs = true;
  }

  const jobsContainer = document.getElementById('jobsContainer');
  if (jobsContainer.children.length === 0) {
    jobsContainer.innerHTML = '<div class="loader">Loading jobs...</div>';
  }

  try {
    const jobs = await API.getJobs(filters);
    allJobs = jobs; // Cache for other functions

    // Applications might be fetched separately or included in jobs for company
    let applications = [];
    if (currentUser.type === 'company') {
      applications = await API.getAllApplicants(); // Fix: call the correct method
      allApplications = applications;
    } else {
      applications = await API.getApplications(); // Get user's applications
      allApplications = applications;
    }

    const savedJobs = Storage.get(Storage.KEYS.SAVED_JOBS) || [];

    if (jobs.length === 0) {
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

    jobsContainer.innerHTML = jobs.map(job => {
      const isSaved = savedJobs.some(s => s.userId === currentUser.id && s.jobId === job.id);
      const hasApplied = applications.some(a => a.user_id === currentUser.id && a.job_id === job.id);
      const timeAgo = getTimeAgo(job.posted_date);
      const jobApplicationsCount = job.applications_count || 0;
      const isOwner = currentUser.id === job.user_id;

      return `
          <div class="job-card animate-fade-in-up">
            <div class="job-header">
              <a href="profile.html?user=${job.user_id}">
                <img src="${getAvatarUrl(job.company_logo, job.company_name)}" alt="${job.company_name}" class="job-logo">
              </a>
              <div class="job-info">
                <h3 class="job-title">${job.title}</h3>
                <div class="flex items-center gap-sm">
                  <a href="profile.html?user=${job.user_id}" style="text-decoration: none; color: inherit;">
                    <p class="job-company">${job.company_name}</p>
                  </a>
                  ${!job.is_active ? '<span class="badge badge-danger">CLOSED</span>' : ''}
                </div>
                <div class="job-meta">
                  <span class="job-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${job.location}</span>
                  <span class="job-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> ${job.type}</span>
                  <span class="job-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> ${job.experience_level}</span>
                  <span class="job-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> ${job.salary || 'Negotiable'}</span>
                </div>
              </div>
              ${currentUser.type === 'student' ? `
                <button class="btn btn-ghost save-job-btn" data-job-id="${job.id}" title="${isSaved ? 'Unsave' : 'Save'}">
                  ${isSaved ? 
                    `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>` : 
                    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`}
                </button>` : ''}
            </div>

            <p class="job-description">${job.description}</p>

            <div style="margin-bottom: var(--spacing-sm);">
              <strong style="color: var(--text-primary);">Required Skills:</strong>
              <div class="flex flex-wrap gap-xs mt-xs">
                ${job.skills ? job.skills.map(skill => `<span class="badge badge-glass">${skill}</span>`).join('') : ''}
              </div>
            </div>

            <div style="color: var(--text-tertiary); font-size: 0.875rem; margin-bottom: var(--spacing-md);">
              ${isOwner
          ? `<strong style="color: var(--accent);">${jobApplicationsCount} application${jobApplicationsCount !== 1 ? 's' : ''} received</strong> • `
          : `${job.applications_count || 0} applicants • `}
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
                  👥 View ${jobApplicationsCount} Applicant${jobApplicationsCount !== 1 ? 's' : ''}
                </button>
                <button class="btn ${job.is_active ? 'btn-outline' : 'btn-ghost'} toggle-status-btn" data-job-id="${job.id}">
                  ${job.is_active ? '🚫 Mark as Full' : '✅ Reopen Job'}
                </button>
                <button class="btn btn-danger delete-job-btn" data-job-id="${job.id}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px; color: var(--danger);"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Delete
                </button>
                ` : ''}

              <button class="btn btn-outline view-details-btn" data-job-id="${job.id}">View Details</button>
            </div>
          </div>
          `;
    }).join('');

    // Attach listeners
    attachJobListeners(currentUser);
  } catch (error) {
    jobsContainer.innerHTML = `<div class="glass-card text-center"><p style="color: #f5576c;">Error loading jobs: ${error.message || 'Check your connection'}</p></div>`;
  }
}

function attachJobListeners(currentUser) {
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
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
      btn.addEventListener('click', () => handleToggleJobStatus(btn.dataset.jobId));
    });
    document.querySelectorAll('.delete-job-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteJob(btn.dataset.jobId));
    });
  }

  // View Details (both)
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', () => showJobDetailsModal(btn.dataset.jobId));
  });
}

// ─── Job Details Modal ────────────────────────────────────────────────────────

function showJobDetailsModal(jobId) {
  const job = allJobs.find(j => j.id == jobId);
  if (!job) return;

  const currentUser = Storage.getCurrentUser();
  const hasApplied = allApplications.some(a => a.job_id == jobId);

  document.getElementById('detailsJobTitle').textContent = job.title;
  document.getElementById('detailsCompanyLogo').src = getAvatarUrl(job.company_logo, job.company_name);
  document.getElementById('detailsCompanyName').textContent = job.company_name;
  document.getElementById('detailsJobMeta').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${job.location} • ${job.type} • ${job.experience_level}`;
  const appCount = job.applications_count || 0;
  document.getElementById('detailsApplicantsCount').textContent = `${appCount} applicant${appCount !== 1 ? 's' : ''} applied`;
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

async function handleDeleteJob(jobId) {
  if (!confirm('Are you sure you want to delete this job listing? This action cannot be undone.')) return;

  try {
    await API.deleteJob(jobId);
    showToast('Job deleted successfully');
    loadJobs();
  } catch (error) {
    alert('Failed to delete job: ' + (error.message || 'Server error'));
  }
}

async function handleToggleJobStatus(jobId) {
  try {
    const response = await API.toggleJobStatus(jobId);
    showToast(response.is_active ? '✅ Job is now active' : '🚫 Job marked as full/closed');
    loadJobs();
  } catch (error) {
    alert('Failed to update job status: ' + (error.message || 'Server error'));
  }
}
async function handlePostJob() {
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

  try {
    const newJob = await API.postJob({
      title,
      location,
      type,
      experience_level: experienceLevel,
      salary,
      description,
      skills
    });

    hidePostJobModal();
    loadJobs();
    showToast('🎉 Job posted successfully!');
  } catch (error) {
    alert('Failed to post job: ' + (error.message || 'Server error'));
  }
}

// ─── Apply Modal (Student) ────────────────────────────────────────────────────

function showApplyModal(jobId) {
  currentJobId = jobId;
  const job = allJobs.find(j => j.id == jobId);
  if (!job) return;

  document.getElementById('applyJobTitle').textContent = job.title;
  document.getElementById('applyCompanyName').textContent = job.companyName;
  document.getElementById('applyModal').classList.remove('hidden');
}

function hideApplyModal() {
  document.getElementById('applyModal').classList.add('hidden');
  const cvEl = document.getElementById('cvUpload');
  const clFileUploadEl = document.getElementById('coverLetterUpload');
  const clEl = document.getElementById('coverLetter');
  if (cvEl) cvEl.value = '';
  if (clFileUploadEl) clFileUploadEl.value = '';
  if (clEl) clEl.value = '';
  currentJobId = null;
}

async function handleApply() {
  const cvFile = document.getElementById('cvUpload').files[0];
  const clFile = document.getElementById('coverLetterUpload').files[0];
  const coverLetter = document.getElementById('coverLetter').value;

  if (!cvFile) {
    alert('Please upload your CV/Resume');
    return;
  }
  if (cvFile.size > 5 * 1024 * 1024 || (clFile && clFile.size > 5 * 1024 * 1024)) {
    alert('File size must be less than 5MB');
    return;
  }

  const formData = new FormData();
  formData.append('cv_file', cvFile);
  if (clFile) formData.append('cover_letter_file', clFile);
  formData.append('cover_letter', coverLetter);

  try {
    await API.applyForJob(currentJobId, formData);
    hideApplyModal();
    showToast('✅ Application submitted successfully!');
    loadJobs();
  } catch (error) {
    alert('Failed to submit application: ' + (error.message || 'Server error'));
  }
}

// ─── Applicants Modal (Company) ───────────────────────────────────────────────

async function showApplicantsModal(jobId) {
  const job = allJobs.find(j => j.id == jobId);
  if (!job) return;

  document.getElementById('applicantsJobTitle').textContent = job.title;
  const listEl = document.getElementById('applicantsList');
  listEl.innerHTML = '<div style="text-align:center; padding: 2rem;">Loading applicants...</div>';
  document.getElementById('applicantsModal').classList.remove('hidden');

  try {
    const jobApplications = await API.getApplicants(jobId);

    if (jobApplications.length === 0) {
      listEl.innerHTML = `
          <div style="text-align:center; padding: var(--spacing-xl); color: var(--text-secondary);">
            <div style="font-size:3rem; margin-bottom:1rem;">📭</div>
            <p>No applications yet for this position.</p>
          </div>`;
    } else {
      listEl.innerHTML = jobApplications.map(app => {
        const appliedDate = new Date(app.created_at || app.applied_date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
        const statusColor = { submitted: '#667eea', reviewed: '#f7971e', shortlisted: '#56ab2f', rejected: '#f5576c', preferred: '#9b59b6', waitlisted: '#e67e22' };
        const color = statusColor[app.status] || '#667eea';

        return `
            <div class="applicant-card" data-app-id="${app.id}">
              <div class="applicant-info">
                <a href="profile.html?user=${app.user.id}">
                  <img src="${getAvatarUrl(app.user.avatar, app.user.name)}"
                       alt="${app.user.name}"
                       class="avatar avatar-md">
                </a>
                <div class="applicant-details">
                  <a href="profile.html?user=${app.user.id}" style="text-decoration: none; color: inherit;">
                    <strong>${app.user.name}</strong>
                  </a>
                  <p style="color: var(--text-secondary); font-size:0.875rem; margin:0;">${app.user.headline || 'Student'}</p>
                  <p style="color: var(--text-tertiary); font-size:0.8rem; margin:0;">Applied: ${appliedDate}</p>
                </div>
              </div>
              <div class="applicant-actions">
                <span class="badge" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40; text-transform: capitalize;">
                  ${app.status}
                </span>
                <button class="btn btn-ghost btn-sm message-student-btn" data-user-id="${app.user.id}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Message
                </button>
                <a href="${window.API_HOST_URL || 'http://127.0.0.1:8000'}/storage/${app.cv_path}" target="_blank" class="btn btn-outline btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> CV
                </a>
                ${app.cover_letter_path ? `
                <a href="${window.API_HOST_URL || 'http://127.0.0.1:8000'}/storage/${app.cover_letter_path}" target="_blank" class="btn btn-outline btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Cover Letter
                </a>` : ''}
                <select class="form-select status-select" data-app-id="${app.id}" style="max-width:140px; padding:0.3rem 0.5rem; font-size:0.8rem;">
                  <option value="submitted" ${app.status === 'submitted' ? 'selected' : ''}>Submitted</option>
                  <option value="reviewed" ${app.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                  <option value="shortlisted" ${app.status === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
                  <option value="preferred" ${app.status === 'preferred' ? 'selected' : ''}>Preferred</option>
                  <option value="waitlisted" ${app.status === 'waitlisted' ? 'selected' : ''}>Waitlisted</option>
                  <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
              </div>
            </div>`;
      }).join('');

      // Attach status change listeners
      listEl.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', (e) => updateApplicationStatus(e.target.dataset.appId, e.target.value, jobId));
      });

      // Attach message buttons
      listEl.querySelectorAll('.message-student-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          window.location.href = `messages.html?user=${btn.dataset.userId}`;
        });
      });
    }
  } catch (error) {
    console.error('Error fetching applicants:', error);
    listEl.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--danger);">Error loading applicants</div>';
  }
}

function hideApplicantsModal() {
  document.getElementById('applicantsModal').classList.add('hidden');
}

async function updateApplicationStatus(appId, newStatus, jobId) {
  try {
    await API.updateApplicationStatus(appId, newStatus);
    showToast('Status updated successfully!');
    showApplicantsModal(jobId); // Refresh modal
    loadJobs(); // Refresh dashboard behind
  } catch (error) {
    alert('Failed to update status: ' + (error.message || 'Server error'));
  }
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
            <div style="font-size:4rem; margin-bottom:1rem;"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-tertiary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
            <p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">
              This file format (${fileName}) cannot be previewed directly in the browser.
            </p>
            <a href="${cvData}" download="${fileName}" class="btn btn-primary"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download CV</a>
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
    showToast('Job saved!');
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

