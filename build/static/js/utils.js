// utils.js
// ✅ Make sure axios is defined globally (for plain HTML use)
if (typeof axios === "undefined") {
    console.error("❌ Axios is not loaded. Please include it before utils.js");
}

/**
 * Global school utilities for API interaction and common helpers.
 * Automatically switches between development and production backend.
 */
window.schoolUtils = {
    // ==================== DYNAMIC API BASE ====================
    getAPI_BASE() {
        // ✅ Auto-detect environment and use appropriate backend
        const currentHost = window.location.hostname;
        const currentOrigin = window.location.origin;
        
        console.log('🌐 Environment detection:', {
            hostname: currentHost,
            origin: currentOrigin,
            protocol: window.location.protocol
        });

        // Production environment detection
        const isProduction = 
            currentOrigin.includes('vercel.app') ||
            currentOrigin.includes('netlify.app') || 
            currentOrigin.includes('github.io') ||
            currentOrigin.includes('yourdomain.com') || // Add your production domain
            currentHost !== 'localhost' && currentHost !== '127.0.0.1';

        if (isProduction) {
            console.log('🚀 Production mode: Using Railway backend');
            return "https://schoolmanagement-production-1246.up.railway.app";
        } else {
            console.log('🔧 Development mode: Using local backend');
            return "http://127.0.0.1:8000";
        }
    },

    // Add this to your utils.js after the getAPI_BASE method:

    // ==================== BACKWARD COMPATIBILITY ====================
    get API_BASE() {
        return this.getAPI_BASE();
    },

    // ==================== ENVIRONMENT DETECTION ====================
    isDevelopment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || hostname === '127.0.0.1';
    },

    isProduction() {
        return !this.isDevelopment();
    },

    getEnvironment() {
        return this.isDevelopment() ? 'development' : 'production';
    },

    // ==================== AUTH HELPERS ====================
    getToken() {
        return localStorage.getItem("authToken");
    },

    isAuthenticated() {
        const token = this.getToken();
        const userData = localStorage.getItem("userData");
        if (!token || !userData || token.length < 20) return false;
        try {
            JSON.parse(userData);
            return true;
        } catch {
            return false;
        }
    },

    logout() {
        this.clearAuthData();
        // Smart redirect based on environment
        const loginUrl = this.isDevelopment() 
            ? "/login.html" 
            : window.location.origin + "/login.html";
        window.location.href = loginUrl;
    },

    clearAuthData() {
        ["authToken", "userData", "tenantData"].forEach(k => localStorage.removeItem(k));
    },

    redirectToLogin() {
        const loginUrl = this.isDevelopment() 
            ? "/login.html" 
            : window.location.origin + "/login.html";
        window.location.href = loginUrl;
    },

    getUserType() {
        try {
            const userData = JSON.parse(localStorage.getItem("userData"));
            return userData?.user_type || userData?.role || null;
        } catch {
            return null;
        }
    },

    getTenantData() {
        try {
            return JSON.parse(localStorage.getItem("tenantData") || "null");
        } catch {
            return null;
        }
    },

    isSuperAdmin() {
        return this.getUserType() === "super_admin";
    },

    isSchoolAdmin() {
        return this.getUserType() === "school_admin";
    },

    // ==================== VALIDATION HELPERS ====================
    validateEmail(email) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    },

    validatePhone(phone) {
        if (!phone) return true;
        return /^\+?1?\d{9,15}$/.test(phone);
    },

    validateRequired(value) {
        if (value === null || value === undefined || value === '') return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (typeof value === 'number') return !isNaN(value);
        return !!value;
    },

    validateForm(formData, requiredFields = []) {
        for (const field of requiredFields) {
            if (!this.validateRequired(formData[field])) {
                const name = field.replace(/_/g, " ");
                return { isValid: false, message: `${this.capitalizeFirst(name)} is required` };
            }
        }
        if (formData.email && !this.validateEmail(formData.email))
            return { isValid: false, message: "Please enter a valid email address" };
        if (formData.phone && !this.validatePhone(formData.phone))
            return { isValid: false, message: "Please enter a valid phone number" };
        return { isValid: true, message: "All validations passed" };
    },

    capitalizeFirst(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
    },

    // ==================== UI HELPERS ====================
    showAlert(message, type = "info", duration = 5000) {
        const oldAlert = document.querySelector(".global-alert");
        if (oldAlert) oldAlert.remove();
        const alertType = {
            success: "alert-success",
            error: "alert-danger",
            warning: "alert-warning",
            info: "alert-info",
        }[type] || "alert-info";

        const icons = {
            success: "check-circle",
            error: "exclamation-triangle",
            warning: "exclamation-circle",
            info: "info-circle",
        };

        const html = `
            <div class="alert ${alertType} alert-dismissible fade show global-alert" role="alert" 
                style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                <div class="d-flex align-items-center">
                    <i class="fas fa-${icons[type] || "info-circle"} me-2"></i>
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>`;
        document.body.insertAdjacentHTML("beforeend", html);
        if (duration > 0)
            setTimeout(() => {
                const alert = document.querySelector(".global-alert");
                if (alert) alert.remove();
            }, duration);
    },

    showLoading(show = true) {
        let overlay = document.getElementById("loadingOverlay");
        if (!overlay) {
            const html = `
                <div id="loadingOverlay" class="loading-overlay" 
                     style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                     background: rgba(0,0,0,0.5); color: white;
                     z-index: 9999; display: none; justify-content: center; align-items: center;
                     flex-direction: column;">
                    <div class="spinner-border text-light" role="status"></div>
                    <p class="mt-3">Loading...</p>
                </div>`;
            document.body.insertAdjacentHTML("beforeend", html);
            overlay = document.getElementById("loadingOverlay");
        }
        overlay.style.display = show ? "flex" : "none";
    },

    // ==================== API HELPERS ====================
    getAuthHeaders() {
        const headers = {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        };
        const token = this.getToken();
        if (token) headers["Authorization"] = `Token ${token}`;

        return headers;
    },

    async apiGet(endpoint) {
        try {
            const apiBase = this.getAPI_BASE();
            const url = `${apiBase}${endpoint}`;
            
            console.log(`🌐 [${this.getEnvironment().toUpperCase()}] API GET: ${url}`);
            const res = await axios.get(url, {
                headers: this.getAuthHeaders(),
                timeout: 15000, // Increased timeout for production
            });
            console.log("✅ GET", endpoint, res.data);
            return res;
        } catch (err) {
            console.error("❌ GET Failed:", endpoint, err.response || err);
            this.handleApiError(err);
            throw err;
        }
    },

    async apiPost(endpoint, data) {
        try {
            const apiBase = this.getAPI_BASE();
            const url = `${apiBase}${endpoint}`;
            
            console.log(`🌐 [${this.getEnvironment().toUpperCase()}] API POST: ${url}`);
            const res = await axios.post(url, data, {
                headers: this.getAuthHeaders(),
                timeout: 15000,
            });
            console.log("✅ POST", endpoint, res.data);
            return res;
        } catch (err) {
            console.error("❌ POST Failed:", endpoint, err.response || err);
            this.handleApiError(err);
            throw err;
        }
    },

    async apiPut(endpoint, data) {
        try {
            const apiBase = this.getAPI_BASE();
            const url = `${apiBase}${endpoint}`;
            
            const res = await axios.put(url, data, {
                headers: this.getAuthHeaders(),
                timeout: 15000,
            });
            console.log("✅ PUT", endpoint, res.data);
            return res;
        } catch (err) {
            console.error("❌ PUT Failed:", endpoint, err.response || err);
            this.handleApiError(err);
            throw err;
        }
    },

    async apiDelete(endpoint) {
        try {
            const apiBase = this.getAPI_BASE();
            const url = `${apiBase}${endpoint}`;
            
            const res = await axios.delete(url, {
                headers: this.getAuthHeaders(),
                timeout: 15000,
            });
            console.log("✅ DELETE", endpoint, res.data);
            return res;
        } catch (err) {
            console.error("❌ DELETE Failed:", endpoint, err.response || err);
            this.handleApiError(err);
            throw err;
        }
    },

    // ==================== ENVIRONMENT-AWARE ERROR HANDLER ====================
    handleApiError(error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const environment = this.getEnvironment();
        let message = "An unexpected error occurred.";

        // Environment-specific messaging
        if (environment === 'development' && status === 404) {
            message = "Backend resource not found. Make sure your Django server is running on localhost:8000";
        } else if (environment === 'production' && status === 404) {
            message = "Service temporarily unavailable. Please try again later.";
        } else if (typeof data === "string") {
            message = data;
        } else if (data?.detail) {
            message = data.detail;
        } else if (data?.message) {
            message = data.message;
        } else if (data?.error) {
            message = data.error;
        } else if (data?.non_field_errors) {
            message = data.non_field_errors.join(", ");
        } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
            message = environment === 'development' 
                ? "Cannot connect to backend. Make sure Django server is running on localhost:8000"
                : "Cannot connect to server. Please check your internet connection.";
        }

        console.error(`❌ [${environment.toUpperCase()}] API Error:`, { 
            status, 
            message, 
            url: error.config?.url,
            error: error.message 
        });
        
        if (status === 401) {
            this.showAlert("Session expired. Please login again.", "error");
            this.clearAuthData();
            setTimeout(() => this.redirectToLogin(), 2000);
        } else if (status === 403) {
            this.showAlert("You don't have permission to perform this action.", "error");
        } else if (status >= 500) {
            this.showAlert("Server error. Please try again later.", "error");
        } else {
            this.showAlert(message, "error");
        }
    },

    // ==================== DEBUG HELPERS ====================
    debugEnvironment() {
        console.group('🔧 Environment Debug Info');
        console.log('🌐 Frontend URL:', window.location.href);
        console.log('🚀 Backend API Base:', this.getAPI_BASE());
        console.log('🏷️ Environment:', this.getEnvironment());
        console.log('🔑 Authenticated:', this.isAuthenticated());
        console.log('👤 User Type:', this.getUserType());
        console.log('🏫 Tenant Data:', this.getTenantData());
        console.groupEnd();
    },

    testBackendConnection() {
        console.log('🔍 Testing backend connection...');
        this.apiGet('/health/')
            .then(response => {
                console.log('✅ Backend connection successful:', response.data);
            })
            .catch(error => {
                console.error('❌ Backend connection failed:', error.message);
            });
    },

    // ==================== DATE HELPERS ====================
    formatDate(dateStr) {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    },

    formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return "N/A";
        return new Date(dateTimeStr).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    },
};

// ✅ Initialize interceptors
if (typeof axios !== "undefined") {
    window.schoolUtils.initializeAxiosInterceptors = function() {
        axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    this.showAlert("Session expired. Please login again.", "error");
                    this.clearAuthData();
                    setTimeout(() => this.redirectToLogin(), 2000);
                }
                return Promise.reject(error);
            }
        );
    };
    
    window.schoolUtils.initializeAxiosInterceptors();
    
    // Auto-detect and log environment on load
    setTimeout(() => {
        const environment = window.schoolUtils.getEnvironment();
        const apiBase = window.schoolUtils.getAPI_BASE();
        console.log(`🎯 schoolUtils initialized - Environment: ${environment}, API: ${apiBase}`);
        
        // Optional: Test backend connection on load
        // window.schoolUtils.testBackendConnection();
    }, 100);
}