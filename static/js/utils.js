// ✅ Make sure axios is defined globally (for plain HTML use)
if (typeof axios === "undefined") {
    console.error("❌ Axios is not loaded. Please include it before utils.js");
}

/**
 * Global school utilities for API interaction and common helpers.
 * Automatically switches between public and tenant domains.
 */

/**
 * Global school utilities for API interaction and common helpers.
 * Simplified for separate frontend/backend architecture.
 */
window.schoolUtils = {
    // ==================== SIMPLE API BASE ====================
    getAPI_BASE() {
        // 🚨 ALWAYS use Django backend - no domain switching needed
        return "http://127.0.0.1:8000";
    },

    // ==================== REMOVE DOMAIN MANAGEMENT ====================
    // Delete all these methods:
    // - isTenantDomain()
    // - shouldRedirectToTenant() 
    // - redirectToTenantDomain()
    // - ensureTenantDomain()

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
        window.location.href = "/login.html"; // Stay on frontend domain
    },

    clearAuthData() {
        ["authToken", "userData", "tenantData"].forEach(k => localStorage.removeItem(k));
    },

    redirectToLogin() {
        window.location.href = "/login.html";
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

        // 🚨 Tenant schema is handled by backend - no need for X-Tenant-Schema header
        // Your backend already knows the tenant from the user's association

        return headers;
    },

    async apiGet(endpoint) {
        try {
            const apiBase = this.getAPI_BASE();
            const url = `${apiBase}${endpoint}`;
            
            console.log(`🌐 API GET: ${url}`);
            const res = await axios.get(url, {
                headers: this.getAuthHeaders(),
                timeout: 10000,
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
            
            console.log(`🌐 API POST: ${url}`);
            const res = await axios.post(url, data, {
                headers: this.getAuthHeaders(),
                timeout: 10000,
            });
            console.log("✅ POST", endpoint, res.data);
            return res;
        } catch (err) {
            console.error("❌ POST Failed:", endpoint, err.response || err);
            this.handleApiError(err);
            throw err;
        }
    },

    // ==================== SIMPLIFIED ERROR HANDLER ====================
    handleApiError(error) {
        const status = error.response?.status;
        const data = error.response?.data;
        let message = error.message || "An unexpected error occurred.";

        if (typeof data === "string") {
            message = data;
        } else if (data?.detail) {
            message = data.detail;
        } else if (data?.message) {
            message = data.message;
        } else if (data?.error) {
            message = data.error;
        } else if (data?.non_field_errors) {
            message = data.non_field_errors.join(", ");
        }

        console.error("❌ API Error:", { status, message, url: error.config?.url });
        
        if (status === 401) {
            this.showAlert("Session expired. Please login again.", "error");
            this.clearAuthData();
            setTimeout(() => this.redirectToLogin(), 2000);
        } else if (status === 403) {
            this.showAlert("You don't have permission to perform this action.", "error");
        } else if (status === 404) {
            this.showAlert("Resource not found. Please check if you're accessing the correct school.", "error");
        } else if (status >= 500) {
            this.showAlert("Server error. Please try again later.", "error");
        } else {
            this.showAlert(message, "error");
        }
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
    console.log("🎯 schoolUtils initialized - Multi-tenant ready!");
}


// ✅ Initialize interceptors once Axios is confirmed loaded
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
    console.log("🎯 schoolUtils initialized with domain switching");
}