const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  getDashboard,
  getTriageQueue,
  getTriageCaseDetails,
  updatePriority,
  assignProvider,
  getAvailableProviders,
  completeTriage,
  getNursePatients,
  getNurseCases,
  getProfile,
  updateProfile,
} = require("../controllers/nurseController");

// All routes require authentication
router.use(authenticate);

// Dashboard
router.get("/dashboard", getDashboard);

// Triage Queue
router.get("/triage", getTriageQueue);
router.get("/triage/:caseId", getTriageCaseDetails);
router.put("/triage/:caseId/priority", updatePriority);
router.put("/triage/:caseId/assign", assignProvider);
router.put("/triage/:caseId/complete", completeTriage);

// Providers
router.get("/providers", getAvailableProviders);

// Patients
router.get("/patients", getNursePatients);

// Cases
router.get("/cases", getNurseCases);

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

module.exports = router;