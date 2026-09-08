// frontend/src/services/patientService.js

import apiCall from './api';

// ============= PATIENT APIs =============

// Get Dashboard
export const getPatientDashboard = async () => {
  return apiCall('/patient/dashboard');
};

// Get Profile
export const getPatientProfile = async () => {
  return apiCall('/patient/profile');
};

// Update Profile
export const updatePatientProfile = async (profileData) => {
  return apiCall('/patient/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// Submit Symptoms
export const submitSymptoms = async (symptomData) => {
  return apiCall('/patient/symptoms', {
    method: 'POST',
    body: JSON.stringify(symptomData),
  });
};

// Get Triage Status
export const getTriageStatus = async () => {
  return apiCall('/patient/triage');
};

// Get Appointments
export const getAppointments = async (status = '') => {
  const query = status ? `?status=${status}` : '';
  return apiCall(`/patient/appointments${query}`);
};

// Book Appointment
export const bookAppointment = async (appointmentData) => {
  return apiCall('/patient/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });
};

// Cancel Appointment
export const cancelAppointment = async (appointmentId, reason) => {
  return apiCall(`/patient/appointments/${appointmentId}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
};

// Get Available Providers
export const getAvailableProviders = async (specialty = 'all') => {
  return apiCall(`/patient/providers?specialty=${specialty}`);
};

// Get Prescriptions
export const getPrescriptions = async (status = '') => {
  const query = status ? `?status=${status}` : '';
  return apiCall(`/patient/prescriptions${query}`);
};

// Request Refill
export const requestRefill = async (prescriptionId) => {
  return apiCall(`/patient/prescriptions/${prescriptionId}/refill`, {
    method: 'POST',
  });
};

// Get Medical Records
export const getMedicalRecords = async (type = '') => {
  const query = type ? `?type=${type}` : '';
  return apiCall(`/patient/records${query}`);
};

// Get Notifications
export const getNotifications = async (unread = false) => {
  const query = unread ? '?unread=true' : '';
  return apiCall(`/patient/notifications${query}`);
};

// Mark Notification as Read
export const markNotificationAsRead = async (notificationId) => {
  return apiCall(`/patient/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
};

// Mark All Notifications as Read
export const markAllNotificationsAsRead = async () => {
  return apiCall('/patient/notifications/read-all', {
    method: 'PUT',
  });
};

// Get Invoices
export const getInvoices = async (status = '') => {
  const query = status ? `?status=${status}` : '';
  return apiCall(`/patient/invoices${query}`);
};


