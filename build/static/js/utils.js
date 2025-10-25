// ✅ Make sure axios is defined globally (for plain HTML use)
if (typeof axios === "undefined") {
    console.error("❌ Axios is not loaded. Please include it before utils.js");
}

/**
 * Global school utilities for API interaction and common helpers.
 * Automatically switches between local and production backend.
 */
window.schoolUtils = {
    // ==================== BASE CONFIG ====================
    API_BASE:
        // ✅ Runtime detection first
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "http://127.0.0.1:8000"
            : (window.location.origin.includes("vercel.app") ||
               window.location.origin.includes("yourdomain.com"))
                ? "https://schoolmanagement-production-1246.up.railway.app"
                : (typeof process !== "undefined" &&
                   process.env &&
                   process.env.NEXT_PUBLIC_API_URL)
                    ? process.env.NEXT_PUBLIC_API_URL
                    : "https://schoolmanagement-production-1246.up.railway.app",

    initializeAxiosInterceptors() {
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
        try {
            // Optional: Add logout API call
        } catch (error) {
            console.warn('Error during logout:', error);
        }
        this.clearAuthData();
        window.location.href = "/login.html";
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

    getTenantId() {
        try {
            const tenantData = JSON.parse(localStorage.getItem("tenantData"));
            return tenantData?.id || tenantData?.tenant_id || null;
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
    getAuthHeaders(endpoint = '') {
        const headers = {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        };
        const token = this.getToken();
        if (token) headers["Authorization"] = `Token ${token}`;

        if (endpoint !== '/api/auth/login/') {
            try {
                const tenantRaw = localStorage.getItem("tenantData");
                if (tenantRaw) {
                    const tenant = JSON.parse(tenantRaw);
                    if (tenant?.schema_name) {
                        headers["X-Tenant-Schema"] = tenant.schema_name;
                    } else {
                        console.warn("⚠️ No schema_name in tenantData:", tenant);
                    }
                } else {
                    console.warn("⚠️ No tenantData in localStorage");
                }
            } catch (e) {
                console.warn("⚠️ Failed to parse tenantData:", e);
            }
        }

        console.log("🔐 Sending headers for", endpoint, ":", headers);
        return headers;
    },

    async apiGet(endpoint) {
        try {
            const res = await axios.get(`${this.API_BASE}${endpoint}`, {
                headers: this.getAuthHeaders(endpoint),
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
            const res = await axios.post(`${this.API_BASE}${endpoint}`, data, {
                headers: this.getAuthHeaders(endpoint),
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

    async apiPut(endpoint, data) {
        try {
            const res = await axios.put(`${this.API_BASE}${endpoint}`, data, {
                headers: this.getAuthHeaders(endpoint),
                timeout: 10000,
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
            const res = await axios.delete(`${this.API_BASE}${endpoint}`, {
                headers: this.getAuthHeaders(endpoint),
                timeout: 10000,
            });
            console.log("✅ DELETE", endpoint, res.data);
            return res;
        } catch (err) {
            console.error("❌ DELETE Failed:", endpoint, err.response || err);
            this.handleApiError(err);
            throw err;
        }
    },

    // ==================== ERROR HANDLER ====================
    handleApiError(error) {
        const status = error.response?.status;
        const data = error.response?.data;
        let message = error.message || "An unexpected error occurred.";

        if (typeof data === "string" && data.includes('<!DOCTYPE html>')) {
            message = `Resource not found at ${error.config?.url || 'unknown endpoint'}`;
        } else if (typeof data === "string") {
            message = data;
        } else if (data?.detail) {
            message = data.detail;
        } else if (data?.message) {
            message = data.message;
        } else if (data?.non_field_errors) {
            message = data.non_field_errors.join(", ");
        }

        console.error("❌ API Error:", { status, data, message, url: error.config?.url });
        if (status === 401) {
            this.showAlert("Session expired. Please login again.", "error");
            this.clearAuthData();
            setTimeout(() => this.redirectToLogin(), 2000);
        } else if (status === 403) {
            this.showAlert("You don’t have permission to perform this action.", "error");
        } else if (status === 404) {
            this.showAlert(`Requested resource not found: ${error.config?.url || 'unknown'}`, "error");
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

// ✅ Initialize interceptors once Axios is confirmed loaded
if (typeof axios !== "undefined") {
    window.schoolUtils.initializeAxiosInterceptors();
    console.log("🎯 schoolUtils initialized and globally available");
}
