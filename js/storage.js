// InternHub - Storage Management
// Handles localStorage operations and mock data generation

const Storage = {
  // Keys
  KEYS: {
    USER: 'internhub_user',
    USERS: 'internhub_users',
    POSTS: 'internhub_posts',
    CONNECTIONS: 'internhub_connections',
    MESSAGES: 'internhub_messages',
    JOBS: 'internhub_jobs',
    APPLICATIONS: 'internhub_applications',
    NOTIFICATIONS: 'internhub_notifications',
    SAVED_JOBS: 'internhub_saved_jobs'
  },

  // Get item from localStorage
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting from storage:', error);
      return null;
    }
  },

  // Set item in localStorage
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting in storage:', error);
      return false;
    }
  },

  // Remove item from localStorage
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from storage:', error);
      return false;
    }
  },

  // Clear all storage
  clear() {
    localStorage.clear();
  },

  // Initialize with mock data if empty
  initialize() {
    if (!this.get(this.KEYS.USERS)) {
      this.set(this.KEYS.USERS, this.generateMockUsers());
    }
    if (!this.get(this.KEYS.POSTS)) {
      this.set(this.KEYS.POSTS, this.generateMockPosts());
    }
    if (!this.get(this.KEYS.JOBS)) {
      this.set(this.KEYS.JOBS, this.generateMockJobs());
    }
    if (!this.get(this.KEYS.CONNECTIONS)) {
      this.set(this.KEYS.CONNECTIONS, this.generateMockConnections());
    }
  },

  // Generate mock connections
  generateMockConnections() {
    return [
      // Accepted connection between mock users
      {
        id: 'conn-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: 'accepted',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  },

  // Create demo connection requests for a new user
  createDemoConnectionRequests(userId) {
    const connections = this.get(this.KEYS.CONNECTIONS) || [];
    const users = this.get(this.KEYS.USERS) || [];

    // Get mock users (not companies, not self)
    const mockStudents = users.filter(u => u.type === 'student' && u.id !== userId && u.id.startsWith('user-'));

    // Check if user already has connections
    const hasExistingConnections = connections.some(c =>
      c.senderId === userId || c.receiverId === userId
    );

    // If new user with no connections, create some pending requests
    if (!hasExistingConnections && mockStudents.length > 0) {
      // Send 1-2 connection requests to the new user
      const numRequests = Math.min(2, mockStudents.length);
      for (let i = 0; i < numRequests; i++) {
        connections.push({
          id: `conn-demo-${Date.now()}-${i}`,
          senderId: mockStudents[i].id,
          receiverId: userId,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }
      this.set(this.KEYS.CONNECTIONS, connections);
    }
  },

  // Generate mock users
  generateMockUsers() {
    return [
      {
        id: 'user-1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        type: 'student',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        headline: 'Computer Science Student | Web Development Enthusiast',
        bio: 'Passionate about creating innovative web solutions and learning new technologies.',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
        experience: [
          {
            id: 'exp-1',
            title: 'Web Development Intern',
            company: 'Tech Innovations Inc.',
            location: 'Remote',
            startDate: '2023-06',
            endDate: '2023-09',
            description: 'Developed responsive web applications using React and Node.js'
          }
        ],
        education: [
          {
            id: 'edu-1',
            school: 'University of Technology',
            degree: 'Bachelor of Science in Computer Science',
            startDate: '2021',
            endDate: '2025',
            description: 'GPA: 3.8/4.0'
          }
        ],
        location: 'San Francisco, CA',
        connections: [],
        followers: [],
        following: [],
        profileCompletion: 75
      },
      {
        id: 'user-2',
        name: 'Michael Chen',
        email: 'michael.chen@example.com',
        type: 'student',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
        headline: 'Data Science Student | Machine Learning Explorer',
        bio: 'Exploring the world of AI and machine learning. Always eager to learn and collaborate.',
        skills: ['Python', 'TensorFlow', 'Data Analysis', 'SQL', 'R'],
        experience: [],
        education: [
          {
            id: 'edu-2',
            school: 'State University',
            degree: 'BS in Data Science',
            startDate: '2022',
            endDate: '2026',
            description: 'Focus on Machine Learning and Statistics'
          }
        ],
        location: 'Boston, MA',
        connections: [],
        followers: [],
        following: [],
        profileCompletion: 60
      },
      {
        id: 'company-1',
        name: 'TechCorp Solutions',
        email: 'hr@techcorp.com',
        type: 'company',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=TechCorp',
        headline: 'Leading Tech Company | Innovation Driven',
        bio: 'We are a cutting-edge technology company focused on delivering innovative solutions.',
        industry: 'Technology',
        size: '500-1000 employees',
        website: 'https://techcorp.example.com',
        location: 'Seattle, WA',
        connections: [],
        followers: [],
        following: [],
        profileCompletion: 90
      },
      {
        id: 'company-2',
        name: 'StartupHub Inc',
        email: 'careers@startuphub.com',
        type: 'company',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=StartupHub',
        headline: 'Fast-growing Startup | Join the Revolution',
        bio: 'Building the future of work with innovative products and services.',
        industry: 'Software',
        size: '50-200 employees',
        website: 'https://startuphub.example.com',
        location: 'Austin, TX',
        connections: [],
        followers: [],
        following: [],
        profileCompletion: 85
      }
    ];
  },

  // Generate mock posts
  generateMockPosts() {
    return [
      {
        id: 'post-1',
        authorId: 'user-1',
        content: 'Just completed my web development internship! 🎉 Learned so much about React and Node.js. Looking forward to applying these skills in future projects. #WebDevelopment #Internship',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes: ['user-2'],
        comments: [
          {
            id: 'comment-1',
            authorId: 'user-2',
            content: 'Congratulations! That sounds amazing!',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
          }
        ],
        shares: 0,
        image: null
      },
      {
        id: 'post-2',
        authorId: 'company-1',
        content: 'We are hiring! Looking for talented interns to join our engineering team. Check out our latest opportunities. #Hiring #Internship #TechJobs',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        likes: ['user-1', 'user-2'],
        comments: [],
        shares: 2,
        image: null
      }
    ];
  },

  // Generate mock jobs
  generateMockJobs() {
    return [
      {
        id: 'job-1',
        companyId: 'company-1',
        companyName: 'TechCorp Solutions',
        companyLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=TechCorp',
        title: 'Frontend Developer Intern',
        location: 'Remote',
        type: 'Internship',
        experienceLevel: 'Entry Level',
        description: 'We are looking for a passionate frontend developer intern to join our team. You will work on exciting projects using React, TypeScript, and modern web technologies.',
        requirements: [
          'Currently pursuing a degree in Computer Science or related field',
          'Strong knowledge of HTML, CSS, and JavaScript',
          'Familiarity with React or similar frameworks',
          'Good communication skills'
        ],
        responsibilities: [
          'Develop and maintain web applications',
          'Collaborate with design and backend teams',
          'Write clean, maintainable code',
          'Participate in code reviews'
        ],
        skills: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'],
        postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        applicants: 15,
        salary: '$20-25/hour'
      },
      {
        id: 'job-2',
        companyId: 'company-2',
        companyName: 'StartupHub Inc',
        companyLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=StartupHub',
        title: 'Data Science Intern',
        location: 'Austin, TX',
        type: 'Internship',
        experienceLevel: 'Entry Level',
        description: 'Join our data science team to work on cutting-edge machine learning projects. This is a great opportunity to apply your knowledge and learn from experienced professionals.',
        requirements: [
          'Pursuing a degree in Data Science, Statistics, or related field',
          'Knowledge of Python and data analysis libraries',
          'Understanding of machine learning concepts',
          'Strong analytical skills'
        ],
        responsibilities: [
          'Analyze large datasets',
          'Build and train machine learning models',
          'Create data visualizations',
          'Present findings to stakeholders'
        ],
        skills: ['Python', 'Machine Learning', 'SQL', 'Data Analysis', 'TensorFlow'],
        postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        applicants: 28,
        salary: '$22-28/hour'
      },
      {
        id: 'job-3',
        companyId: 'company-1',
        companyName: 'TechCorp Solutions',
        companyLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=TechCorp',
        title: 'UI/UX Design Intern',
        location: 'Seattle, WA',
        type: 'Internship',
        experienceLevel: 'Entry Level',
        description: 'We are seeking a creative UI/UX design intern to help create beautiful and user-friendly interfaces for our products.',
        requirements: [
          'Portfolio demonstrating design skills',
          'Proficiency in Figma or Adobe XD',
          'Understanding of design principles',
          'Good communication skills'
        ],
        responsibilities: [
          'Create wireframes and mockups',
          'Conduct user research',
          'Design user interfaces',
          'Collaborate with developers'
        ],
        skills: ['Figma', 'Adobe XD', 'UI Design', 'UX Research', 'Prototyping'],
        postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        applicants: 22,
        salary: '$18-24/hour'
      }
    ];
  },

  // User management
  addUser(user) {
    const users = this.get(this.KEYS.USERS) || [];
    users.push(user);
    this.set(this.KEYS.USERS, users);
  },

  getUserByEmail(email) {
    const users = this.get(this.KEYS.USERS) || [];
    return users.find(user => user.email === email);
  },

  getUserById(id) {
    const users = this.get(this.KEYS.USERS) || [];
    return users.find(user => user.id === id);
  },

  updateUser(userId, updates) {
    const users = this.get(this.KEYS.USERS) || [];
    const index = users.findIndex(user => user.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      this.set(this.KEYS.USERS, users);
      return users[index];
    }
    return null;
  },

  // Current user
  getCurrentUser() {
    return this.get(this.KEYS.USER);
  },

  setCurrentUser(user) {
    this.set(this.KEYS.USER, user);
  },

  logout() {
    this.remove(this.KEYS.USER);
  }
};

// Initialize storage on load
Storage.initialize();

// Make Storage available globally
window.Storage = Storage;
