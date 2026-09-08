import apiCall from './api';

// ============= NURSE APIs =============

// Get Dashboard
export const getNurseDashboard = async () => {
  return apiCall('/nurse/dashboard');
};

// Get Triage Queue
export const getTriageQueue = async (status = 'all') => {
  return apiCall(`/nurse/triage?status=${status}`);
};

// Get Triage Case Details
export const getTriageCaseDetails = async (caseId) => {
  return apiCall(`/nurse/triage/${caseId}`);
};

// Update Priority
export const updateTriagePriority = async (caseId, data) => {
  return apiCall(`/nurse/triage/${caseId}/priority`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Assign Provider
export const assignProviderToCase = async (caseId, data) => {
  return apiCall(`/nurse/triage/${caseId}/assign`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Get Available Providers
export const getAvailableProvidersForNurse = async () => {
  return apiCall('/nurse/providers');
};

// Complete Triage
export const completeTriageCase = async (caseId, data) => {
  return apiCall(`/nurse/triage/${caseId}/complete`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Get Nurse Patients
export const getNursePatients = async (search = '') => {
  const query = search ? `?search=${search}` : '';
  return apiCall(`/nurse/patients${query}`);
};

// Get Nurse Cases
export const getNurseCases = async (status = 'all') => {
  const query = status ? `?status=${status}` : '';
  return apiCall(`/nurse/cases${query}`);
};

// Get Nurse Profile
export const getNurseProfile = async () => {
  return apiCall('/nurse/profile');
};

// Update Nurse Profile
export const updateNurseProfile = async (profileData) => {
  return apiCall('/nurse/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};