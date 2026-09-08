const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  getDashboard,
  getProfile,
  updateProfile,
  getAppointments,
  updateAppointmentStatus,
  getPatients,
  getPatientDetails,
  getConsultations,
  startConsultation,
  completeConsultation,
  createPrescription,
  getProviderPrescriptions,
  updatePrescriptionStatus,
  getAvailability,
  updateAvailability,
  getRefillRequests,
  processRefillRequest,
} = require("../controllers/providerController");

// All routes require authentication
router.use(authenticate);

// Dashboard
router.get("/dashboard", getDashboard);

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Appointments
router.get("/appointments", getAppointments);
router.put("/appointments/:id/status", updateAppointmentStatus);

// Patients
router.get("/patients", getPatients);
router.get("/patients/:patientId", getPatientDetails);

// Consultations
router.get("/consultations", getConsultations);
router.post("/consultations/:appointmentId/start", startConsultation);
router.put("/consultations/:consultationId/complete", completeConsultation);

// Prescriptions
router.post("/consultations/:consultationId/prescriptions", createPrescription);
router.get("/prescriptions", getProviderPrescriptions);
router.put("/prescriptions/:id/status", updatePrescriptionStatus);

// Availability
router.get("/availability", getAvailability);
router.put("/availability", updateAvailability);

// Refill Requests
router.get("/refills", getRefillRequests);
router.put("/refills/:id/process", processRefillRequest);

module.exports = router;