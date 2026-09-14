const express = require("express");
const router = express.Router();
const { signup, login, getMe, uploadProfileImage, deleteProfileImage, logout } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { uploadSingle } = require("../middleware/upload"); 
// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes
router.get("/me", authenticate, getMe);
router.post(
  "/upload-profile-image",
  authenticate,
  uploadSingle,
  uploadProfileImage
);
router.delete("/profile-image", authenticate, deleteProfileImage);
module.exports = router;


