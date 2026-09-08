const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  getDashboard,
  getUsers,
  updateUserStatus,
  deleteUser,
  getProviders,
  getAllAppointments,
  updateAdminAppointmentStatus,
  getSettings,
  updateSettings,
} = require("../controllers/adminController");

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize("ADMIN"));

// Dashboard
router.get("/dashboard", getDashboard);

// Users
router.get("/users", getUsers);
router.put("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

// Providers
router.get("/providers", getProviders);

// Appointments
router.get("/appointments", getAllAppointments);
router.put("/appointments/:id/status", updateAdminAppointmentStatus);

// Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

module.exports = router;