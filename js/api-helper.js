/**
 * API Helper Functions
 * 
 * This file provides helper functions for making API calls to the backend.
 * Include this file in your HTML pages to easily interact with the API.
 * 
 * Usage example:
 * <script src="../js/api-helper.js"></script>
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Get stored token from localStorage
function getToken() {
  return localStorage.getItem('authToken');
}

// Store token in localStorage
function setToken(token) {
  localStorage.setItem('authToken', token);
}

// Remove token from localStorage (logout)
function removeToken() {
  localStorage.removeItem('authToken');
}

// Make API request with authentication
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentication functions
const authAPI = {
  async register(userData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  async login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      setToken(data.token);
    }
    
    return data;
  },
  
  async getProfile() {
    return apiRequest('/auth/me');
  },
  
  async updateProfile(updates) {
    return apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  
  logout() {
    removeToken();
    window.location.href = '../auth/loginPage.html';
  }
};

// Resource functions
const resourceAPI = {
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/resources?${queryParams}` : '/resources';
    return apiRequest(endpoint);
  },
  
  async getById(id) {
    return apiRequest(`/resources/${id}`);
  },
  
  async getAvailability(id) {
    return apiRequest(`/resources/${id}/availability`);
  }
};

// Booking functions
const bookingAPI = {
  async create(bookingData) {
    return apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  },
  
  async getMyBookings(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/bookings/my-bookings?${queryParams}` : '/bookings/my-bookings';
    return apiRequest(endpoint);
  },
  
  async getById(id) {
    return apiRequest(`/bookings/${id}`);
  },
  
  async update(id, updates) {
    return apiRequest(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  
  async cancel(id) {
    return apiRequest(`/bookings/${id}`, {
      method: 'DELETE'
    });
  },
  
  async getAvailability(resourceId, date) {
    return apiRequest(`/bookings/availability/${resourceId}?date=${date}`);
  }
};

// Admin functions (require admin role)
const adminAPI = {
  async getAllBookings(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/admin/bookings?${queryParams}` : '/admin/bookings';
    return apiRequest(endpoint);
  },
  
  async approveBooking(id) {
    return apiRequest(`/admin/bookings/${id}/approve`, {
      method: 'PUT'
    });
  },
  
  async rejectBooking(id, reason) {
    return apiRequest(`/admin/bookings/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },
  
  async blockResource(id, isBlocked) {
    return apiRequest(`/admin/resources/${id}/block`, {
      method: 'PUT',
      body: JSON.stringify({ is_blocked: isBlocked })
    });
  },
  
  async getReports(dateFrom, dateTo) {
    const filters = {};
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/admin/reports?${queryParams}` : '/admin/reports';
    return apiRequest(endpoint);
  },
  
  async createResource(resourceData) {
    return apiRequest('/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData)
    });
  },
  
  async updateResource(id, updates) {
    return apiRequest(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  
  async deleteResource(id) {
    return apiRequest(`/resources/${id}`, {
      method: 'DELETE'
    });
  }
};

// Example usage in HTML:
/*
<script src="../js/api-helper.js"></script>
<script>
  // Login example
  async function handleLogin() {
    try {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const result = await authAPI.login(email, password);
      alert('Login successful!');
      window.location.href = '../student/myProfile.html';
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  }
  
  // Load resources example
  async function loadResources() {
    try {
      const resources = await resourceAPI.getAll({ type: 'room' });
      console.log(resources);
      // Display resources in your HTML
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  }
</script>
*/

