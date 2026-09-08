const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  getDashboard,
  getProfile,
  updateProfile,
  submitSymptoms,
  getTriageStatus,
  getAppointments,
  bookAppointment,
  cancelAppointment,
  getAvailableProviders,
  getPrescriptions,
  requestRefill,
  getMedicalRecords,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getInvoices,
} = require("../controllers/patientController");

// All routes require authentication
router.use(authenticate);

// Dashboard
router.get("/dashboard", getDashboard);

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Symptoms
router.post("/symptoms", submitSymptoms);
router.get("/triage", getTriageStatus);

// Appointments
router.get("/appointments", getAppointments);
router.post("/appointments", bookAppointment);
router.put("/appointments/:id/cancel", cancelAppointment);

// Providers
router.get("/providers", getAvailableProviders);

// Prescriptions
router.get("/prescriptions", getPrescriptions);
router.post("/prescriptions/:prescriptionId/refill", requestRefill);

// Medical Records
router.get("/records", getMedicalRecords);

// Notifications
router.get("/notifications", getNotifications);
router.put("/notifications/:id/read", markNotificationAsRead);
router.put("/notifications/read-all", markAllNotificationsAsRead);

// Invoices
router.get("/invoices", getInvoices);

module.exports = router;