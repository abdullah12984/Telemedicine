const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");
// ============= SIGNUP =============
const signup = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      role, 
      firstName, 
      lastName, 
      phone, 
      dateOfBirth, 
      gender,
      // Provider specific
      specialty,
      licenseNumber,
      licenseState,
      experienceYears,
      permittedRegions,
      // Nurse specific
      employeeId,
      department
    } = req.body;

    if (role && role.toUpperCase() === "ADMIN") {
      return res.status(403).json({
        message: "Admin accounts cannot be created through signup. Please contact system administrator.",
      });
    }

    // ✅ CHECK 2: Reserved admin email block karein
    if (email === "Admin112233@gmail.com") {
      return res.status(403).json({
        message: "This email is reserved for administrator. Please use a different email.",
      });
    }

    // ✅ Check required fields (ye pehle se hai)
    if (!email || !password || !role || !firstName || !lastName) {
      return res.status(400).json({
        message: "Email, password, role, firstName and lastName are required",
      });
    }

    // Check required fields
    if (!email || !password || !role || !firstName || !lastName) {
      return res.status(400).json({
        message: "Email, password, role, firstName and lastName are required",
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role-specific profile
    let user;
    let profile;

    // Start transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role.toUpperCase(),
        },
      });

      // Create role-specific profile
      let newProfile;
      switch (role.toUpperCase()) {
        case "PATIENT":
          newProfile = await prisma.patient.create({
            data: {
              userId: newUser.id,
              firstName,
              lastName,
              phone: phone || "",
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
              gender: gender || "OTHER",
            },
          });
          break;

        case "PROVIDER":
          newProfile = await prisma.provider.create({
            data: {
              userId: newUser.id,
              firstName,
              lastName,
              specialty: specialty || "",
              licenseNumber: licenseNumber || "",
              licenseState: licenseState || "",
              experienceYears: experienceYears ? parseInt(experienceYears) : 0,
              permittedRegions: permittedRegions || [],
            },
          });
          break;

        case "NURSE":
          newProfile = await prisma.nurse.create({
            data: {
              userId: newUser.id,
              firstName,
              lastName,
              employeeId: employeeId || `NURSE-${Date.now()}`,
              department: department || "",
            },
          });
          break;

        case "ADMIN":
          newProfile = await prisma.admin.create({
            data: {
              userId: newUser.id,
              firstName,
              lastName,
              permissions: ["ALL"],
            },
          });
          break;

        default:
          throw new Error("Invalid role. Must be PATIENT, PROVIDER, NURSE, or ADMIN");
      }

      return { user: newUser, profile: newProfile };
    });

    user = result.user;
    profile = result.profile;

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          ...profile
        }
      },
    });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ============= LOGIN =============
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // ✅ CHECK: Agar admin email hai toh direct login
    if (email === "Admin112233@gmail.com") {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Get profile
        let profile = null;
        if (user.role === "ADMIN") {
          profile = await prisma.admin.findUnique({
            where: { userId: user.id },
          });
        }

        // Generate token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE || "7d" }
        );

        return res.json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: profile || undefined,
          },
        });
      }
    }

    // ✅ NORMAL LOGIN: Password check for other users
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Get profile
    let profile = null;
    switch (user.role) {
      case "PATIENT":
        profile = await prisma.patient.findUnique({ where: { userId: user.id } });
        break;
      case "PROVIDER":
        profile = await prisma.provider.findUnique({ where: { userId: user.id } });
        break;
      case "NURSE":
        profile = await prisma.nurse.findUnique({ where: { userId: user.id } });
        break;
      case "ADMIN":
        profile = await prisma.admin.findUnique({ where: { userId: user.id } });
        break;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: profile || undefined,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ============= GET CURRENT USER =============
const getMe = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Get role-specific profile
    let profile = null;
    switch (user.role) {
      case "PATIENT":
        profile = await prisma.patient.findUnique({
          where: { userId: user.id },
        });
        break;
      case "PROVIDER":
        profile = await prisma.provider.findUnique({
          where: { userId: user.id },
        });
        break;
      case "NURSE":
        profile = await prisma.nurse.findUnique({
          where: { userId: user.id },
        });
        break;
      case "ADMIN":
        profile = await prisma.admin.findUnique({
          where: { userId: user.id },
        });
        break;
    }

    res.json({
      message: "User found",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: profile || undefined,
      },
    });

  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ============= LOGOUT (Client side) =============
const logout = async (req, res) => {
  // JWT is stateless, so logout is handled on client side
  res.json({
    message: "Logout successful",
  });
};


// ============= UPLOAD PROFILE IMAGE =============
const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const imageUrl = `/uploads/profile/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: imageUrl,
      },
    });

    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        profileImage: imageUrl,
      },
    });
  } catch (error) {
    console.error("Upload Profile Image Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============= DELETE PROFILE IMAGE =============
const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete file from filesystem
    if (user.profileImage) {
      const filePath = path.join(__dirname, "..", "..", user.profileImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: null,
      },
    });

    res.json({
      success: true,
      message: "Profile image deleted successfully",
    });
  } catch (error) {
    console.error("Delete Profile Image Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  logout,
  uploadProfileImage,
  deleteProfileImage,
};