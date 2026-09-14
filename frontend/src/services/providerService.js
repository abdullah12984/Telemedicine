import apiCall from './api';

// ============= PROVIDER APIs =============

// Get Dashboard
export const getProviderDashboard = async () => {
  return apiCall('/provider/dashboard');
};

// Get Profile
export const getProviderProfile = async () => {
  return apiCall('/provider/profile');
};

// Update Profile
export const updateProviderProfile = async (profileData) => {
  return apiCall('/provider/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// Get Appointments
export const getProviderAppointments = async (status = '', date = '') => {
  let query = '';
  if (status) query += `?status=${status}`;
  if (date) query += `${query ? '&' : '?'}date=${date}`;
  return apiCall(`/provider/appointments${query}`);
};

// Update Appointment Status
export const updateAppointmentStatus = async (appointmentId, status, notes = '') => {
  return apiCall(`/provider/appointments/${appointmentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes }),
  });
};

// Get Patients
export const getProviderPatients = async (search = '') => {
  const query = search ? `?search=${search}` : '';
  return apiCall(`/provider/patients${query}`);
};

// Get Patient Details
export const getPatientDetails = async (patientId) => {
  return apiCall(`/provider/patients/${patientId}`);
};

// Get Consultations
export const getProviderConsultations = async () => {
  return apiCall('/provider/consultations');
};

// Start Consultation
export const startConsultation = async (appointmentId) => {
  return apiCall(`/provider/consultations/${appointmentId}/start`, {
    method: 'POST',
  });
};

// Complete Consultation
export const completeConsultation = async (consultationId, data) => {
  return apiCall(`/provider/consultations/${consultationId}/complete`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Create Prescription
export const createPrescription = async (consultationId, prescriptionData) => {
  return apiCall(`/provider/consultations/${consultationId}/prescriptions`, {
    method: 'POST',
    body: JSON.stringify(prescriptionData),
  });
};

// Get Provider Prescriptions
export const getProviderPrescriptions = async (status = '') => {
  const query = status ? `?status=${status}` : '';
  return apiCall(`/provider/prescriptions${query}`);
};

// Update Prescription Status
export const updatePrescriptionStatus = async (prescriptionId, status) => {
  return apiCall(`/provider/prescriptions/${prescriptionId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

// Get Availability
export const getAvailability = async () => {
  return apiCall('/provider/availability');
};

// Update Availability
export const updateAvailability = async (availability) => {
  return apiCall('/provider/availability', {
    method: 'PUT',
    body: JSON.stringify({ availability }),
  });
};

// Get Refill Requests
export const getRefillRequests = async () => {
  return apiCall('/provider/refills');
};

// Process Refill Request
export const processRefillRequest = async (requestId, status) => {
  return apiCall(`/provider/refills/${requestId}/process`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const getConsultationDetails = async (consultationId) => {
  return apiCall(`/provider/consultations/${consultationId}`);
};