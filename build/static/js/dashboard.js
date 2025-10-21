class DashboardManager {
    constructor() {
        this.currentView = 'dashboard';
        this.userData = null;
        this.tenantData = null;
        this.utils = window.schoolUtils;
    }

    async initialize() {
        console.log('🚀 Initializing Dashboard Manager...');
        if (!this.utils || !this.utils.isAuthenticated()) {
            console.log('❌ Not authenticated or utils not loaded, redirecting to login');
            this.utils?.showAlert('Please log in first!', 'warning');
            this.utils?.redirectToLogin();
            return;
        }
        await this.loadUserData();
        this.setupUI();
        await this.loadDashboardData();
        this.setupEventListeners();
        console.log('✅ Dashboard Manager initialized successfully');
        // Debug DOM state
        console.log('addClassContent exists:', !!document.getElementById('addClassContent'));
    }

    async loadUserData() {
        try {
            const userDataRaw = localStorage.getItem('userData');
            const tenantDataRaw = localStorage.getItem('tenantData');
            this.userData = userDataRaw ? JSON.parse(userDataRaw) : null;
            this.tenantData = tenantDataRaw ? JSON.parse(tenantDataRaw) : null;
            if (!this.userData) {
                throw new Error('No user data found');
            }
            console.log('👤 User data loaded:', {
                userType: this.userData.user_type,
                tenant: this.tenantData?.school_name
            });
            this.updateUserInterface();
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            this.utils.showAlert('Failed to load user data', 'error');
            this.utils.logout();
        }
    }

    updateUserInterface() {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = this.userData.username || this.userData.email || 'User';
        }
        if (this.utils.isSuperAdmin()) {
            this.setupSuperAdminDashboard();
        } else {
            this.setupSchoolDashboard();
        }
    }

    setupSuperAdminDashboard() {
        const sidebarMenu = document.getElementById('sidebarMenu');
        if (!sidebarMenu) return;
        sidebarMenu.innerHTML = `
            <li class="nav-item">
                <a class="nav-link active" href="#" data-view="dashboard">
                    <i class="fas fa-tachometer-alt me-2"></i>
                    Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-view="schools">
                    <i class="fas fa-school me-2"></i>
                    Schools
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-view="billing">
                    <i class="fas fa-file-invoice-dollar me-2"></i>
                    Billing
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-view="settings">
                    <i class="fas fa-cog me-2"></i>
                    Settings
                </a>
            </li>
        `;
    }

    setupSchoolDashboard() {
        const sidebarMenu = document.getElementById('sidebarMenu');
        if (!sidebarMenu) return;
        const schoolName = this.tenantData?.school_name || 'My School';
        const dashboardTitle = document.getElementById('dashboardTitle');
        if (dashboardTitle) {
            dashboardTitle.textContent = `${schoolName} Dashboard`;
        }
        sidebarMenu.innerHTML = `
            <li class="nav-item">
                <a class="nav-link active" href="#" data-view="dashboard">
                    <i class="fas fa-tachometer-alt me-2"></i>
                    Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-view="students">
                    <i class="fas fa-users me-2"></i>
                    Students
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-view="teachers">
                    <i class="fas fa-chalkboard-teacher me-2"></i>
                    Teachers
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-view="classes">
                    <i class="fas fa-book me-2"></i>
                    Classes
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-view="settings">
                    <i class="fas fa-cog me-2"></i>
                    Settings
                </a>
            </li>
        `;
    }

    showView(viewName, title = '') {
        console.log(`🔄 Switching to view: ${viewName}`);
        // Hide all top-level views
        document.querySelectorAll('#contentContainer > div').forEach(div => {
            div.classList.add('d-none');
            console.log(`Hiding element: ${div.id}`);
        });

        if (viewName === 'addClass') {
            const classesContent = document.getElementById('classesContent');
            const addClassContent = document.getElementById('addClassContent');
            if (!addClassContent) {
                console.warn('⚠️ Content element not found: addClassContent');
                this.utils.showAlert('Add Class form not found. Please check the HTML structure.', 'error');
                return;
            }
            if (classesContent) {
                classesContent.classList.remove('d-none');
                console.log('Showing classesContent');
            }
            addClassContent.classList.remove('d-none');
            console.log('Showing addClassContent');
            const form = addClassContent.querySelector('#addClassForm');
            const cardBody = addClassContent.querySelector('.card-body');
            console.log('addClassContent element:', addClassContent);
            console.log('addClassContent classes:', addClassContent.classList);
            console.log('addClassContent computed style:', window.getComputedStyle(addClassContent));
            console.log('Form element:', form);
            console.log('Card body element:', cardBody);
            console.log('Card body computed style:', cardBody ? window.getComputedStyle(cardBody) : 'Not found');
            if (!addClassContent.classList.contains('d-none')) {
                console.log('addClassContent is visible');
            } else {
                console.warn('addClassContent is still hidden');
            }
        } else {
            const contentElement = document.getElementById(`${viewName}Content`);
            if (contentElement) {
                contentElement.classList.remove('d-none');
                console.log(`Showing element: ${viewName}Content`);
            } else {
                console.warn(`⚠️ Content element not found: ${viewName}Content`);
                this.utils.showAlert(`View "${viewName}" not found. Please check the HTML structure.`, 'error');
            }
        }

        const dashboardHeader = document.getElementById('dashboardHeader');
        const pageHeader = document.getElementById('pageHeader');
        if (dashboardHeader && pageHeader) {
            if (viewName === 'dashboard') {
                dashboardHeader.classList.remove('d-none');
                pageHeader.classList.add('d-none');
            } else {
                dashboardHeader.classList.add('d-none');
                pageHeader.classList.remove('d-none');
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) {
                    pageTitle.textContent = title || this.getViewTitle(viewName);
                }
            }
        }
        this.currentView = viewName;
        this.updateActiveNavLink(viewName);
        if (viewName === 'addClass') {
            this.loadTeachersForClassForm();
        } else {
            this.loadViewData(viewName);
        }
    }

    getViewTitle(viewName) {
        const titles = {
            'students': 'Student Management',
            'teachers': 'Teacher Management',
            'classes': 'Class Management',
            'settings': 'Settings',
            'addStudent': 'Add New Student',
            'addTeacher': 'Add New Teacher',
            'addClass': 'Add New Class'
        };
        return titles[viewName] || viewName;
    }

    updateActiveNavLink(activeView) {
        document.querySelectorAll('#sidebarMenu .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`#sidebarMenu .nav-link[data-view="${activeView}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async loadViewData(viewName) {
        const loaders = {
            'dashboard': () => this.loadDashboardData(),
            'students': () => this.loadStudents(),
            'teachers': () => this.loadTeachers(),
            'classes': () => this.loadClasses(),
            'settings': () => this.loadUserProfile()
        };
        if (loaders[viewName]) {
            await loaders[viewName]();
        }
    }

    async loadDashboardData() {
        try {
            this.utils.showLoading(true);
            const endpoint = this.utils.isSuperAdmin() ? '/api/super-admin/dashboard/' : '/api/dashboard/';
            const response = await this.utils.apiGet(endpoint);
            if (!response || !response.data) {
                throw new Error('Invalid or empty dashboard response');
            }
            console.log('Full API response:', response.data);
            this.displayDashboardData(response.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.utils.showAlert('Failed to load dashboard data: ' + error.message, 'error');
        } finally {
            this.utils.showLoading(false);
        }
    }

    async loadStudents() {
        try {
            this.utils.showLoading(true);
            const response = await this.utils.apiGet('/api/dashboard/students/');
            if (!response || !response.data) {
                throw new Error('Empty response from students API');
            }
            this.displayStudents(response.data);
        } catch (error) {
            console.error('Error loading students:', error);
            const studentsList = document.getElementById('studentsList');
            if (studentsList) {
                const errorMessage = error.response?.status === 404 
                    ? `Students data not found. Please check if the API endpoint is correct.`
                    : error.response?.data?.error || error.message || 'Failed to load students';
                studentsList.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${errorMessage}
                    </div>
                `;
            }
        } finally {
            this.utils.showLoading(false);
        }
    }

    async loadTeachers() {
        try {
            this.utils.showLoading(true);
            const response = await this.utils.apiGet('/api/dashboard/teachers/');
            if (!response || !response.data) {
                throw new Error('Empty response from teachers API');
            }
            this.displayTeachers(response.data);
        } catch (error) {
            console.error('Error loading teachers:', error);
            const teachersList = document.getElementById('teachersList');
            if (teachersList) {
                const errorMessage = error.response?.status === 404 
                    ? `Teachers data not found. Please check if the API endpoint is correct.`
                    : error.response?.data?.error || error.message || 'Failed to load teachers';
                teachersList.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${errorMessage}
                    </div>
                `;
            }
        } finally {
            this.utils.showLoading(false);
        }
    }

    async loadClasses() {
        try {
            this.utils.showLoading(true);
            const response = await this.utils.apiGet('/api/dashboard/classes/');
            if (!response || !response.data) {
                throw new Error('Empty response from classes API');
            }
            this.displayClasses(response.data);
        } catch (error) {
            console.error('Error loading classes:', error);
            const classesList = document.getElementById('classesList');
            if (classesList) {
                const errorMessage = error.response?.status === 404 
                    ? `Classes data not found. Please check if the API endpoint is correct.`
                    : error.response?.data?.error || error.message || 'Failed to load classes';
                classesList.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${errorMessage}
                    </div>
                `;
            }
        } finally {
            this.utils.showLoading(false);
        }
    }

    async loadUserProfile() {
        try {
            document.getElementById('profileFirstName').value = this.userData.first_name || '';
            document.getElementById('profileLastName').value = this.userData.last_name || '';
            document.getElementById('profileEmail').value = this.userData.email || '';
        } catch (error) {
            console.error('Error loading profile:', error);
            this.utils.showAlert('Failed to load profile data', 'error');
        }
    }

    displayDashboardData(data) {
        if (!data) {
            console.error('No data received for dashboard');
            this.utils.showAlert('No dashboard data available', 'error');
            return;
        }
        this.displayStats(data.stats || data);
        if (data.recent_students) {
            this.displayRecentActivity(data.recent_students);
        } else if (data.recent_activity) {
            this.displayRecentActivity(data.recent_activity);
        }
    }

    displayStats(stats) {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer || !stats) {
            console.warn('Stats container or stats data missing');
            statsContainer.innerHTML = '<p class="text-muted text-center">No statistics available</p>';
            return;
        }
        const statCards = this.utils.isSuperAdmin() ? [
            { key: 'total_schools', label: 'Total Schools', icon: 'fa-school', color: 'primary' },
            { key: 'active_schools', label: 'Active Schools', icon: 'fa-check-circle', color: 'success' },
            { key: 'total_users', label: 'Total Users', icon: 'fa-users', color: 'info' },
            { key: 'revenue', label: 'Monthly Revenue', icon: 'fa-dollar-sign', color: 'warning' }
        ] : [
            { key: 'total_students', label: 'Total Students', icon: 'fa-users', color: 'primary' },
            { key: 'total_teachers', label: 'Total Teachers', icon: 'fa-chalkboard-teacher', color: 'success' },
            { key: 'total_classes', label: 'Total Classes', icon: 'fa-book', color: 'info' },
            { key: 'active_courses', label: 'Active Courses', icon: 'fa-graduation-cap', color: 'warning' }
        ];
        statsContainer.innerHTML = statCards.map(stat => `
            <div class="col-md-3 mb-4">
                <div class="card stat-card h-100 border-0 shadow-sm">
                    <div class="card-body text-center p-4">
                        <div class="icon-container bg-${stat.color} bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                            <i class="fas ${stat.icon} text-${stat.color} fs-4"></i>
                        </div>
                        <h3 class="text-${stat.color} mb-2 fw-bold">${stats[stat.key] || 0}</h3>
                        <p class="text-muted mb-0 small fw-medium">${stat.label}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayRecentActivity(activities) {
        const recentActivity = document.getElementById('recentActivity');
        if (!recentActivity) return;
        if (!activities || activities.length === 0) {
            recentActivity.innerHTML = '<p class="text-muted text-center py-4">No recent activity</p>';
            return;
        }
        recentActivity.innerHTML = activities.map(activity => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-3">
                <div class="d-flex align-items-center">
                    <div class="avatar-placeholder bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                        <i class="fas fa-user text-white"></i>
                    </div>
                    <div>
                        <strong>${activity.first_name} ${activity.last_name}</strong>
                        <br><small class="text-muted">${activity.email}</small>
                    </div>
                </div>
                <small class="text-muted">${this.utils.formatDate(activity.enrollment_date || activity.created_at)}</small>
            </div>
        `).join('');
    }

    displayStudents(students) {
        const studentsList = document.getElementById('studentsList');
        if (!studentsList) return;
        if (!students || students.length === 0) {
            studentsList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Students Found</h5>
                    <p class="text-muted">Get started by adding your first student</p>
                    <button class="btn btn-primary" id="addStudentBtn">
                        <i class="fas fa-plus me-2"></i>Add Student
                    </button>
                </div>
            `;
            return;
        }
        studentsList.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>Student List</h5>
                <button class="btn btn-primary" id="addStudentBtn">
                    <i class="fas fa-plus me-2"></i>Add Student
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Enrollment Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(student => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar-placeholder bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                                            <i class="fas fa-user text-white small"></i>
                                        </div>
                                        ${student.first_name} ${student.last_name}
                                    </div>
                                </td>
                                <td>${student.email}</td>
                                <td>${student.phone || '<span class="text-muted">N/A</span>'}</td>
                                <td>${this.utils.formatDate(student.enrollment_date)}</td>
                                <td>
                                    <span class="badge ${student.is_active ? 'bg-success' : 'bg-secondary'}">
                                        ${student.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="dashboardManager.editStudent(${student.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="dashboardManager.deleteStudent(${student.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    displayTeachers(teachers) {
        const teachersList = document.getElementById('teachersList');
        if (!teachersList) return;
        if (!teachers || teachers.length === 0) {
            teachersList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-chalkboard-teacher fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Teachers Found</h5>
                    <p class="text-muted">Get started by adding your first teacher</p>
                    <button class="btn btn-primary" id="addTeacherBtn">
                        <i class="fas fa-plus me-2"></i>Add Teacher
                    </button>
                </div>
            `;
            return;
        }
        teachersList.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>Teacher List</h5>
                <button class="btn btn-primary" id="addTeacherBtn">
                    <i class="fas fa-plus me-2"></i>Add Teacher
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Subject</th>
                            <th>Phone</th>
                            <th>Hire Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teachers.map(teacher => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar-placeholder bg-success rounded-circle me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                                            <i class="fas fa-user-tie text-white small"></i>
                                        </div>
                                        ${teacher.first_name} ${teacher.last_name}
                                    </div>
                                </td>
                                <td>${teacher.email}</td>
                                <td>${teacher.subject || '<span class="text-muted">N/A</span>'}</td>
                                <td>${teacher.phone || '<span class="text-muted">N/A</span>'}</td>
                                <td>${this.utils.formatDate(teacher.hire_date)}</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="dashboardManager.editTeacher(${teacher.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="dashboardManager.deleteTeacher(${teacher.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    displayClasses(classes) {
        const classesList = document.getElementById('classesList');
        if (!classesList) return;
        if (!classes || classes.length === 0) {
            classesList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-book fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Classes Found</h5>
                    <p class="text-muted">Get started by creating your first class</p>
                    <button class="btn btn-primary" id="addClassBtn">
                        <i class="fas fa-plus me-2"></i>Add Class
                    </button>
                </div>
            `;
            return;
        }
        classesList.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>Class List</h5>
                <button class="btn btn-primary" id="addClassBtn">
                    <i class="fas fa-plus me-2"></i>Add Class
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Class Name</th>
                            <th>Class Code</th>
                            <th>Teacher</th>
                            <th>Student Count</th>
                            <th>Capacity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${classes.map(classItem => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar-placeholder bg-info rounded-circle me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                                            <i class="fas fa-book text-white small"></i>
                                        </div>
                                        ${classItem.name}
                                    </div>
                                </td>
                                <td><code>${classItem.code}</code></td>
                                <td>${classItem.teacher_name || 'Not Assigned'}</td>
                                <td>
                                    <span class="badge ${classItem.student_count >= classItem.capacity ? 'bg-warning' : 'bg-success'}">
                                        ${classItem.student_count || 0} / ${classItem.capacity}
                                    </span>
                                </td>
                                <td>${classItem.capacity}</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="dashboardManager.editClass(${classItem.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="dashboardManager.viewClass(${classItem.id})">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="dashboardManager.deleteClass(${classItem.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    showAddStudentForm() {
        this.showView('addStudent', 'Add New Student');
        const form = document.getElementById('addStudentForm');
        if (form) form.reset();
    }

    showAddTeacherForm() {
        this.showView('addTeacher', 'Add New Teacher');
        const form = document.getElementById('addTeacherForm');
        if (form) form.reset();
    }

    showAddClassForm() {
        this.showView('addClass', 'Add New Class');
        const form = document.getElementById('addClassForm');
        if (form) {
            form.reset();
            console.log('Resetting addClassForm');
        } else {
            console.warn('addClassForm not found');
        }
        this.loadTeachersForClassForm();
    }

    showClasses() {
        const addClassContent = document.getElementById('addClassContent');
        if (addClassContent) {
            addClassContent.classList.add('d-none');
            console.log('Hiding addClassContent for showClasses');
        }
        this.showView('classes', 'Class Management');
    }

    async handleAddStudent(e) {
        e.preventDefault();
        const formData = {
            first_name: document.getElementById('studentFirstName').value,
            last_name: document.getElementById('studentLastName').value,
            email: document.getElementById('studentEmail').value,
            phone: document.getElementById('studentPhone').value,
            date_of_birth: document.getElementById('studentDob').value,
            gender: document.getElementById('studentGender').value,
            address: document.getElementById('studentAddress').value
        };
        const validation = this.utils.validateForm(formData, ['first_name', 'last_name', 'email', 'date_of_birth', 'gender']);
        if (!validation.isValid) {
            this.utils.showAlert(validation.message, 'error');
            return;
        }
        try {
            this.utils.showLoading(true);
            const response = await this.utils.apiPost('/api/dashboard/students/', formData);
            this.utils.showAlert('Student registered successfully!', 'success');
            if (response.data.credentials) {
                this.showCredentials(response.data.credentials, 'student');
            }
            this.showStudents();
            await this.loadStudents();
        } catch (error) {
            console.error('Error adding student:', error);
            this.utils.showAlert(error.response?.data?.error || 'Failed to add student', 'error');
        } finally {
            this.utils.showLoading(false);
        }
    }

    async handleAddTeacher(e) {
        e.preventDefault();
        const formData = {
            first_name: document.getElementById('teacherFirstName').value,
            last_name: document.getElementById('teacherLastName').value,
            email: document.getElementById('teacherEmail').value,
            phone: document.getElementById('teacherPhone').value,
            subject: document.getElementById('teacherSubject').value,
            hire_date: document.getElementById('teacherHireDate').value || new Date().toISOString().split('T')[0],
            salary: document.getElementById('teacherSalary').value || null
        };
        const validation = this.utils.validateForm(formData, ['first_name', 'last_name', 'email', 'subject']);
        if (!validation.isValid) {
            this.utils.showAlert(validation.message, 'error');
            return;
        }
        try {
            this.utils.showLoading(true);
            const response = await this.utils.apiPost('/api/dashboard/teachers/', formData);
            this.utils.showAlert('Teacher registered successfully!', 'success');
            if (response.data.credentials) {
                this.showCredentials(response.data.credentials, 'teacher');
            }
            this.showTeachers();
            await this.loadTeachers();
        } catch (error) {
            console.error('Error adding teacher:', error);
            this.utils.showAlert(error.response?.data?.error || 'Failed to add teacher', 'error');
        } finally {
            this.utils.showLoading(false);
        }
    }

    async handleAddClass(e) {
        e.preventDefault();
        const form = e.target;
        const formData = {
            name: form.querySelector('#className').value.trim(),
            code: form.querySelector('#classCode').value.trim(),
            teacher: form.querySelector('#classTeacher').value,
            capacity: parseInt(form.querySelector('#classCapacity').value) || 30
        };

        const validation = this.utils.validateForm(formData, ['name', 'code', 'capacity']);
        if (!validation.isValid) {
            this.utils.showAlert(validation.message, 'error');
            return;
        }

        if (formData.teacher) {
            formData.teacher = parseInt(formData.teacher);
        } else {
            delete formData.teacher;
        }

        try {
            this.utils.showLoading(true);
            const response = await this.utils.apiPost('/api/dashboard/classes/', formData);
            this.utils.showAlert('Class created successfully!', 'success');
            form.reset();
            this.showClasses();
            await this.loadClasses();
        } catch (error) {
            console.error('Error adding class:', error);
            this.utils.showAlert(error.response?.data?.error || 'Failed to add class', 'error');
        } finally {
            this.utils.showLoading(false);
        }
    }

    showCredentials(credentials, userType) {
        const message = `
            <h6><i class="fas fa-user-check me-2"></i>${this.utils.capitalizeFirst(userType)} Registered Successfully!</h6>
            <div class="mt-3 p-3 bg-light rounded">
                <p class="mb-2"><strong>Username:</strong> <code>${credentials.username}</code></p>
                <p class="mb-0"><strong>Password:</strong> <code>${credentials.password}</code></p>
            </div>
            <p class="mt-2 small text-muted">
                <i class="fas fa-shield-alt me-1"></i>
                Please share these credentials securely with the ${userType}.
            </p>
        `;
        this.utils.showAlert(message, 'success', 15000);
    }

    setupEventListeners() {
        const studentForm = document.getElementById('addStudentForm');
        if (studentForm) {
            studentForm.addEventListener('submit', (e) => this.handleAddStudent(e));
        }
        const teacherForm = document.getElementById('addTeacherForm');
        if (teacherForm) {
            teacherForm.addEventListener('submit', (e) => this.handleAddTeacher(e));
        }
        const classForm = document.getElementById('addClassForm');
        if (classForm) {
            classForm.addEventListener('submit', (e) => this.handleAddClass(e));
        }
        const navDashboardLink = document.getElementById('navDashboardLink');
        if (navDashboardLink) {
            navDashboardLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView('dashboard');
            });
        }
        const settingsLink = document.getElementById('settingsLink');
        if (settingsLink) {
            settingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView('settings');
            });
        }
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    this.utils.logout();
                }
            });
        }
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (this.currentView === 'dashboard') {
                    this.loadDashboardData();
                } else {
                    this.loadViewData(this.currentView);
                }
            });
        }
        const backToDashboardBtn = document.getElementById('backToDashboardBtn');
        if (backToDashboardBtn) {
            backToDashboardBtn.addEventListener('click', () => this.showView('dashboard'));
        }
        const addStudentBtn = document.querySelectorAll('#addStudentBtn');
        addStudentBtn.forEach(btn => {
            btn.addEventListener('click', () => this.showAddStudentForm());
        });
        const cancelAddStudentBtn = document.getElementById('cancelAddStudentBtn');
        if (cancelAddStudentBtn) {
            cancelAddStudentBtn.addEventListener('click', () => this.showStudents());
        }
        const addTeacherBtn = document.querySelectorAll('#addTeacherBtn');
        addTeacherBtn.forEach(btn => {
            btn.addEventListener('click', () => this.showAddTeacherForm());
        });
        const cancelAddTeacherBtn = document.getElementById('cancelAddTeacherBtn');
        if (cancelAddTeacherBtn) {
            cancelAddTeacherBtn.addEventListener('click', () => this.showTeachers());
        }
        const addClassBtn = document.querySelectorAll('#addClassBtn');
        addClassBtn.forEach(btn => {
            btn.addEventListener('click', () => this.showAddClassForm());
        });
        const cancelAddClassBtn = document.getElementById('cancelAddClassBtn');
        if (cancelAddClassBtn) {
            cancelAddClassBtn.addEventListener('click', () => this.showClasses());
        }
        document.querySelectorAll('#sidebarMenu .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                if (view) {
                    if (view === 'schools') this.showSchools();
                    else if (view === 'billing') this.showBilling();
                    else this.showView(view);
                }
            });
        });
    }

    setupUI() {
        this.utils.showLoading(false);
    }

    editStudent(id) {
        this.utils.showAlert('Edit student functionality coming soon!', 'info');
    }

    deleteStudent(id) {
        if (confirm('Are you sure you want to delete this student?')) {
            this.utils.showAlert('Delete student functionality coming soon!', 'info');
        }
    }

    editTeacher(id) {
        this.utils.showAlert('Edit teacher functionality coming soon!', 'info');
    }

    deleteTeacher(id) {
        if (confirm('Are you sure you want to delete this teacher?')) {
            this.utils.showAlert('Delete teacher functionality coming soon!', 'info');
        }
    }

    editClass(id) {
        this.utils.showAlert('Edit class functionality coming soon!', 'info');
    }

    deleteClass(id) {
        if (confirm('Are you sure you want to delete this class?')) {
            this.utils.showAlert('Delete class functionality coming soon!', 'info');
        }
    }

    showSchools() {
        this.utils.showAlert('School management coming soon!', 'info');
    }

    showBilling() {
        this.utils.showAlert('Billing management coming soon!', 'info');
    }

    viewClass(id) {
        this.utils.showAlert('View class functionality coming soon!', 'info');
    }

    async loadTeachersForClassForm() {
        try {
            this.utils.showLoading(true);
            const response = await this.utils.apiGet('/api/dashboard/teachers/');
            const teacherSelect = document.getElementById('classTeacher');
            if (teacherSelect) {
                teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
                if (response.data && response.data.length > 0) {
                    response.data.forEach(teacher => {
                        const option = document.createElement('option');
                        option.value = teacher.id;
                        option.textContent = `${teacher.first_name} ${teacher.last_name} (${teacher.subject || 'N/A'})`;
                        teacherSelect.appendChild(option);
                    });
                    console.log('Teacher dropdown populated with:', response.data);
                } else {
                    console.log('No teachers found for dropdown');
                }
            } else {
                console.warn('Teacher select element not found');
            }
        } catch (error) {
            console.error('Error loading teachers for class form:', error);
            this.utils.showAlert('Failed to load teachers for class form', 'error');
        } finally {
            this.utils.showLoading(false);
        }
    }

    showStudents() {
        this.showView('students');
    }

    showTeachers() {
        this.showView('teachers');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
    window.dashboardManager.initialize();
});