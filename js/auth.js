// InternHub - Authentication
// Handles login, signup, and form validation

document.addEventListener('DOMContentLoaded', () => {
    initAuthPage();
});

function initAuthPage() {
    // Check if user is already logged in
    const currentUser = Storage.getCurrentUser();
    if (currentUser) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Tab switching
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    const tabLinks = document.querySelectorAll('.auth-tab-link');

    function switchTab(tabName) {
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        forms.forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}Form`);
        });
        // Clear all errors when switching tabs
        document.querySelectorAll('.form-error').forEach(e => e.classList.remove('visible'));
        document.querySelectorAll('.form-input').forEach(i => i.classList.remove('input-error', 'input-success'));
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(link.dataset.tab);
        });
    });

    // Account type selection
    const accountTypeOptions = document.querySelectorAll('.account-type-option');
    const accountTypeInput = document.getElementById('accountType');

    accountTypeOptions.forEach(option => {
        option.addEventListener('click', () => {
            accountTypeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            accountTypeInput.value = option.dataset.type;
        });
    });

    // Password toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.dataset.target;
            const input = document.getElementById(targetId);
            if (input.type === 'password') {
                input.type = 'text';
                toggle.textContent = '🙈';
            } else {
                input.type = 'password';
                toggle.textContent = '👁️';
            }
        });
    });

    // ---- Real-time validation listeners ----

    // Login
    const loginEmailEl = document.getElementById('loginEmail');
    const loginPasswordEl = document.getElementById('loginPassword');

    loginEmailEl?.addEventListener('blur', () => {
        validateEmailField(loginEmailEl, 'loginEmailError', 'Please enter a valid email address');
    });
    loginEmailEl?.addEventListener('input', () => {
        if (loginEmailEl.value.trim()) clearFieldError(loginEmailEl, 'loginEmailError');
    });

    loginPasswordEl?.addEventListener('blur', () => {
        validatePasswordField(loginPasswordEl, 'loginPasswordError');
    });
    loginPasswordEl?.addEventListener('input', () => {
        if (loginPasswordEl.value) clearFieldError(loginPasswordEl, 'loginPasswordError');
    });

    // Signup
    const signupNameEl = document.getElementById('signupName');
    const signupEmailEl = document.getElementById('signupEmail');
    const signupPasswordEl = document.getElementById('signupPassword');
    const signupConfirmEl = document.getElementById('signupConfirmPassword');

    signupNameEl?.addEventListener('blur', () => {
        if (signupNameEl.value.trim().length < 2) {
            showFieldError(signupNameEl, 'signupNameError', 'Name must be at least 2 characters');
        } else {
            clearFieldError(signupNameEl, 'signupNameError');
        }
    });
    signupNameEl?.addEventListener('input', () => {
        if (signupNameEl.value.trim().length >= 2) clearFieldError(signupNameEl, 'signupNameError');
    });

    signupEmailEl?.addEventListener('blur', () => {
        validateEmailField(signupEmailEl, 'signupEmailError', 'Please enter a valid email address');
    });
    signupEmailEl?.addEventListener('input', () => {
        if (signupEmailEl.value.trim()) clearFieldError(signupEmailEl, 'signupEmailError');
    });

    signupPasswordEl?.addEventListener('input', () => {
        updatePasswordStrength(signupPasswordEl.value);
        if (signupConfirmEl?.value) {
            // Re-validate confirm on password change
            if (signupPasswordEl.value === signupConfirmEl.value) {
                clearFieldError(signupConfirmEl, 'signupConfirmPasswordError');
            } else {
                showFieldError(signupConfirmEl, 'signupConfirmPasswordError', 'Passwords do not match');
            }
        }
    });
    signupPasswordEl?.addEventListener('blur', () => {
        validatePasswordField(signupPasswordEl, 'signupPasswordError');
    });

    signupConfirmEl?.addEventListener('input', () => {
        if (signupPasswordEl?.value === signupConfirmEl.value) {
            clearFieldError(signupConfirmEl, 'signupConfirmPasswordError');
        }
    });
    signupConfirmEl?.addEventListener('blur', () => {
        if (signupConfirmEl.value && signupPasswordEl?.value !== signupConfirmEl.value) {
            showFieldError(signupConfirmEl, 'signupConfirmPasswordError', 'Passwords do not match');
        } else if (signupConfirmEl.value) {
            clearFieldError(signupConfirmEl, 'signupConfirmPasswordError');
        }
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);

    // Signup form
    const signupForm = document.getElementById('signupForm');
    signupForm.addEventListener('submit', handleSignup);
}

// ---- Validation helpers ----

function isValidEmail(email) {
    // RFC 5322 simplified regex
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    return re.test(email.trim());
}

function isValidPassword(password) {
    return password.length >= 8;
}

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { level: 'weak', label: 'Weak', color: '#f5576c' };
    if (score <= 4) return { level: 'fair', label: 'Fair', color: '#f7971e' };
    if (score <= 5) return { level: 'good', label: 'Good', color: '#56ab2f' };
    return { level: 'strong', label: 'Strong', color: '#00b09b' };
}

function updatePasswordStrength(password) {
    let indicator = document.getElementById('passwordStrengthBar');
    let label = document.getElementById('passwordStrengthLabel');

    if (!indicator) return;

    if (!password) {
        indicator.style.width = '0%';
        if (label) label.textContent = '';
        return;
    }

    const strength = getPasswordStrength(password);
    const widthMap = { weak: '25%', fair: '55%', good: '80%', strong: '100%' };

    indicator.style.width = widthMap[strength.level];
    indicator.style.background = strength.color;
    if (label) {
        label.textContent = strength.label;
        label.style.color = strength.color;
    }
}

function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        if (message) errorElement.textContent = message;
        errorElement.classList.add('visible');
    }
}

function hideError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.classList.remove('visible');
    }
}

function showFieldError(inputEl, errorId, message) {
    inputEl.classList.add('input-error');
    inputEl.classList.remove('input-success');
    showError(errorId, message);
}

function clearFieldError(inputEl, errorId) {
    inputEl.classList.remove('input-error');
    inputEl.classList.add('input-success');
    hideError(errorId);
}

function validateEmailField(inputEl, errorId, message) {
    if (!inputEl.value.trim() || !isValidEmail(inputEl.value)) {
        showFieldError(inputEl, errorId, message);
        return false;
    } else {
        clearFieldError(inputEl, errorId);
        return true;
    }
}

function validatePasswordField(inputEl, errorId) {
    if (!isValidPassword(inputEl.value)) {
        showFieldError(inputEl, errorId, 'Password must be at least 8 characters');
        return false;
    } else {
        clearFieldError(inputEl, errorId);
        return true;
    }
}

// ---- Handle Login ----
function handleLogin(e) {
    e.preventDefault();

    const emailEl = document.getElementById('loginEmail');
    const passwordEl = document.getElementById('loginPassword');

    const email = emailEl.value.trim();
    const password = passwordEl.value;

    // Reset errors
    hideError('loginEmailError');
    hideError('loginPasswordError');
    emailEl.classList.remove('input-error', 'input-success');
    passwordEl.classList.remove('input-error', 'input-success');

    let hasError = false;

    // Validate email
    if (!isValidEmail(email)) {
        showFieldError(emailEl, 'loginEmailError', 'Please enter a valid email address');
        hasError = true;
    }

    // Validate password
    if (!isValidPassword(password)) {
        showFieldError(passwordEl, 'loginPasswordError', 'Password must be at least 8 characters');
        hasError = true;
    }

    if (hasError) return;

    // Check if user exists
    const user = Storage.getUserByEmail(email);

    if (user) {
        // Check password match (stored as plain text in this demo)
        if (user.password && user.password !== password) {
            showFieldError(passwordEl, 'loginPasswordError', 'Incorrect password');
            return;
        }

        Storage.setCurrentUser(user);

        // Add animation before redirect
        const authCard = document.querySelector('.auth-card');
        authCard.style.animation = 'fadeOut 0.5s ease-out';

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    } else {
        showFieldError(emailEl, 'loginEmailError', 'No account found with this email');
    }
}

// ---- Handle Signup ----
function handleSignup(e) {
    e.preventDefault();

    const nameEl = document.getElementById('signupName');
    const emailEl = document.getElementById('signupEmail');
    const passwordEl = document.getElementById('signupPassword');
    const confirmEl = document.getElementById('signupConfirmPassword');
    const accountTypeInput = document.getElementById('accountType');
    const agreeTerms = document.getElementById('agreeTerms').checked;

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const confirmPassword = confirmEl.value;
    const accountType = accountTypeInput.value;

    // Reset all errors
    ['signupNameError', 'signupEmailError', 'signupPasswordError', 'signupConfirmPasswordError'].forEach(hideError);
    [nameEl, emailEl, passwordEl, confirmEl].forEach(el => el.classList.remove('input-error', 'input-success'));

    let hasError = false;

    // Validate name
    if (name.length < 2) {
        showFieldError(nameEl, 'signupNameError', 'Name must be at least 2 characters');
        hasError = true;
    } else {
        clearFieldError(nameEl, 'signupNameError');
    }

    // Validate email
    if (!isValidEmail(email)) {
        showFieldError(emailEl, 'signupEmailError', 'Please enter a valid email address (e.g. you@example.com)');
        hasError = true;
    } else {
        // Check if email already exists
        const existingUser = Storage.getUserByEmail(email);
        if (existingUser) {
            showFieldError(emailEl, 'signupEmailError', 'An account with this email already exists');
            hasError = true;
        } else {
            clearFieldError(emailEl, 'signupEmailError');
        }
    }

    // Validate password
    if (!isValidPassword(password)) {
        showFieldError(passwordEl, 'signupPasswordError', 'Password must be at least 8 characters');
        hasError = true;
    } else {
        clearFieldError(passwordEl, 'signupPasswordError');
    }

    // Validate password match
    if (password !== confirmPassword) {
        showFieldError(confirmEl, 'signupConfirmPasswordError', 'Passwords do not match');
        hasError = true;
    } else if (confirmPassword) {
        clearFieldError(confirmEl, 'signupConfirmPasswordError');
    }

    // Check terms agreement
    if (!agreeTerms) {
        alert('Please agree to the Terms & Conditions');
        hasError = true;
    }

    if (hasError) return;

    // Create new user
    const newUser = {
        id: `user-${Date.now()}`,
        name: name,
        email: email,
        password: password, // stored for demo validation
        type: accountType,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        headline: accountType === 'student' ? 'Student' : 'Company',
        bio: '',
        skills: accountType === 'student' ? [] : undefined,
        industry: accountType === 'company' ? '' : undefined,
        experience: accountType === 'student' ? [] : undefined,
        education: accountType === 'student' ? [] : undefined,
        location: '',
        connections: [],
        followers: [],
        following: [],
        profileCompletion: 25,
        createdAt: new Date().toISOString()
    };

    // Save user
    Storage.addUser(newUser);
    Storage.setCurrentUser(newUser);

    // Create demo connection requests for new users
    Storage.createDemoConnectionRequests(newUser.id);

    // Add animation before redirect
    const authCard = document.querySelector('.auth-card');
    authCard.style.animation = 'fadeOut 0.5s ease-out';

    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 500);
}

// Add fadeOut animation + input state styles
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.9); }
  }
  .form-input.input-error {
    border-color: #f5576c !important;
    box-shadow: 0 0 0 3px rgba(245, 87, 108, 0.15);
  }
  .form-input.input-success {
    border-color: #56ab2f !important;
    box-shadow: 0 0 0 3px rgba(86, 171, 47, 0.12);
  }
  .password-strength-wrap {
    margin-top: 0.5rem;
  }
  .password-strength-track {
    height: 4px;
    background: var(--glass-border, rgba(255,255,255,0.1));
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 4px;
  }
  #passwordStrengthBar {
    height: 100%;
    width: 0%;
    border-radius: 2px;
    transition: width 0.4s ease, background 0.4s ease;
  }
  #passwordStrengthLabel {
    font-size: 0.75rem;
    font-weight: 600;
  }
`;
document.head.appendChild(style);
