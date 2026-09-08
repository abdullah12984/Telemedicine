// frontend/src/services/authService.js

import apiCall from './api';

// ============= AUTH APIs =============

// Signup - All fields are sent correctly
export const signup = async (userData) => {
  // userData should contain:
  // email, password, role, firstName, lastName, phone, dateOfBirth, gender
  return apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// Login
export const login = async (credentials) => {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

// Get Current User
export const getMe = async () => {
  return apiCall('/auth/me');
};

// Upload Profile Image
export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('profileImage', file);
  
  return apiCall('/auth/upload-profile-image', {
    method: 'POST',
    body: formData,
  });
};

// Delete Profile Image
export const deleteProfileImage = async () => {
  return apiCall('/auth/profile-image', {
    method: 'DELETE',
  });
};

// Logout
export const logout = async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return apiCall('/auth/logout', {
    method: 'POST',
  });
};

// Save token and user
export const saveAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Get user from localStorage
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Clear auth data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};