import apiCall from './api';

// ============= ADMIN APIs =============

// Get Dashboard
export const getAdminDashboard = async () => {
  return apiCall('/admin/dashboard');
};

// Get Users
export const getAdminUsers = async (role = 'all', search = '') => {
  let query = `?role=${role}`;
  if (search) query += `&search=${search}`;
  return apiCall(`/admin/users${query}`);
};

// Update User Status
export const updateUserStatus = async (userId, isActive) => {
  return apiCall(`/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });
};

// Delete User
export const deleteUser = async (userId) => {
  return apiCall(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
};

// Get Providers
export const getAdminProviders = async () => {
  return apiCall('/admin/providers');
};

// Get All Appointments
export const getAdminAppointments = async (status = 'all', date = '') => {
  let query = `?status=${status}`;
  if (date) query += `&date=${date}`;
  return apiCall(`/admin/appointments${query}`);
};

// Update Appointment Status
export const updateAdminAppointmentStatus = async (appointmentId, status) => {
  return apiCall(`/admin/appointments/${appointmentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

// Get Settings
export const getAdminSettings = async () => {
  return apiCall('/admin/settings');
};

// Update Settings
export const updateAdminSettings = async (settings) => {
  return apiCall('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
};