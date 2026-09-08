const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============= GET NURSE DASHBOARD =============
const getDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    // Get nurse profile
    const nurse = await prisma.nurse.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found",
      });
    }

    // Get triage queue stats
    const waitingPatients = await prisma.triageCase.count({
      where: {
        status: "PENDING",
      },
    });

    const inProgress = await prisma.triageCase.count({
      where: {
        status: "IN_PROGRESS",
      },
    });

    const assigned = await prisma.triageCase.count({
      where: {
        status: "ASSIGNED",
      },
    });

    // Get high priority cases
    const highPriority = await prisma.triageCase.count({
      where: {
        severity: {
          in: ["HIGH", "URGENT"],
        },
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    });

    // Get average wait time (simple calculation)
    // In real scenario, calculate from createdAt to now
    const pendingCases = await prisma.triageCase.findMany({
      where: {
        status: "PENDING",
      },
      select: {
        createdAt: true,
      },
    });

    let avgWaitTime = 0;
    if (pendingCases.length > 0) {
      const now = new Date();
      let totalMinutes = 0;
      pendingCases.forEach((c) => {
        const diff = (now - new Date(c.createdAt)) / (1000 * 60);
        totalMinutes += diff;
      });
      avgWaitTime = Math.round(totalMinutes / pendingCases.length);
    }

    // Get recent triage cases (last 5)
    const recentCases = await prisma.triageCase.findMany({
      where: {
        nurseId: nurse.id,
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        assignedProvider: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        nurse: {
          id: nurse.id,
          firstName: nurse.firstName,
          lastName: nurse.lastName,
          department: nurse.department,
          email: nurse.user.email,
        },
        stats: {
          waitingPatients,
          inProgress,
          assigned,
          highPriority,
          avgWaitTime: avgWaitTime || 0,
        },
        recentCases: recentCases.map((c) => ({
          id: c.id,
          patientName: `${c.patient.firstName} ${c.patient.lastName}`,
          severity: c.severity,
          status: c.status,
          assignedTo: c.assignedProvider
            ? `Dr. ${c.assignedProvider.firstName} ${c.assignedProvider.lastName}`
            : null,
          createdAt: c.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
      error: error.message,
    });
  }
};

// ============= GET TRIAGE QUEUE =============
const getTriageQueue = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const nurse = await prisma.nurse.findUnique({
      where: { userId },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found",
      });
    }

    const whereClause = {};

    if (status && status !== "all") {
      whereClause.status = status.toUpperCase();
    }

    const triageCases = await prisma.triageCase.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
          },
        },
        nurse: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        assignedProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
      orderBy: [
        {
          severity: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    // Calculate wait time for each case
    const now = new Date();
    const casesWithWaitTime = triageCases.map((c) => {
      const waitTime = Math.floor((now - new Date(c.createdAt)) / (1000 * 60));
      return {
        ...c,
        waitTime: waitTime || 0,
      };
    });

    res.json({
      success: true,
      data: casesWithWaitTime,
    });
  } catch (error) {
    console.error("Get triage queue error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get triage queue",
      error: error.message,
    });
  }
};

// ============= GET TRIAGE CASE DETAILS =============
const getTriageCaseDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const { caseId } = req.params;

    const nurse = await prisma.nurse.findUnique({
      where: { userId },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found",
      });
    }

    const triageCase = await prisma.triageCase.findUnique({
      where: { id: caseId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        nurse: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        assignedProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        // ✅ FIX: consultations (plural) not consultation (singular)
        consultations: {
          include: {
            appointment: true,
          },
        },
      },
    });

    if (!triageCase) {
      return res.status(404).json({
        success: false,
        message: "Triage case not found",
      });
    }

    res.json({
      success: true,
      data: triageCase,
    });
  } catch (error) {
    console.error("Get triage case details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get triage case details",
      error: error.message,
    });
  }
};

// ============= UPDATE TRIAGE CASE PRIORITY =============
const updatePriority = async (req, res) => {
  try {
    const userId = req.userId;
    const { caseId } = req.params;
    const { severity, priorityScore } = req.body;

    const nurse = await prisma.nurse.findUnique({
      where: { userId },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found",
      });
    }

    const triageCase = await prisma.triageCase.findFirst({
      where: {
        id: caseId,
      },
    });

    if (!triageCase) {
      return res.status(404).json({
        success: false,
        message: "Triage case not found",
      });
    }

    const updatedCase = await prisma.triageCase.update({
      where: { id: caseId },
      data: {
        severity: severity || triageCase.severity,
        priorityScore: priorityScore || triageCase.priorityScore,
        nurseId: nurse.id,
        status: "IN_PROGRESS",
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Priority updated successfully",
      data: updatedCase,
    });
  } catch (error) {
    console.error("Update priority error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update priority",
      error: error.message,
    });
  }
};

// ============= ASSIGN PROVIDER TO CASE =============
// ============= ASSIGN PROVIDER =============
const assignProvider = async (req, res) => {
  try {
    const userId = req.userId;
    const { caseId } = req.params;
    const { providerId, triageNotes } = req.body;

    const nurse = await prisma.nurse.findUnique({
      where: { userId },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found",
      });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // ✅ FIX: Include patient with user
    const triageCase = await prisma.triageCase.findFirst({
      where: {
        id: caseId,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        assignedProvider: true,
        nurse: true,
      },
    });

    if (!triageCase) {
      return res.status(404).json({
        success: false,
        message: "Triage case not found",
      });
    }

    // ✅ CHECK: Patient exists
    if (!triageCase.patient || !triageCase.patient.user) {
      return res.status(404).json({
        success: false,
        message: "Patient not found for this triage case",
      });
    }

    const updatedCase = await prisma.triageCase.update({
      where: { id: caseId },
      data: {
        assignedProviderId: providerId,
        triageNotes: triageNotes || triageCase.triageNotes,
        status: "ASSIGNED",
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        assignedProvider: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // ✅ FIXED: Safely access user id
    await prisma.notification.create({
      data: {
        userId: triageCase.patient.user.id,
        patientId: triageCase.patientId,
        title: "Provider Assigned",
        message: `Dr. ${provider.firstName} ${provider.lastName} has been assigned to your case. You will be contacted shortly.`,
        type: "TRIAGE_ASSIGNED",
      },
    });

    res.json({
      success: true,
      message: "Provider assigned successfully",
      data: updatedCase,
    });
  } catch (error) {
    console.error("Assign provider error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign provider",
      error: error.message,
    });
  }
};

// ============= GET AVAILABLE PROVIDERS =============
const getAvailableProviders = async (req, res) => {
  try {
    const userId = req.userId;

    const nurse = await prisma.nurse.findUnique({
      where: { userId },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found",
      });
    }

    // ✅ FIX: Get all providers with their availability
    const providers = await prisma.provider.findMany({
      where: {
        user: {
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            profileImage: true,
          },
        },
        availability: {
          where: {
            isAvailable: true,
          },
        },
      },
    });

    // ✅ FIX: Handle case where availability might be empty
    const availableProviders = providers.map((p) => ({
      id: p.id,
      name: `Dr. ${p.firstName} ${p.lastName}`,
      specialty: p.specialty || "General",
      rating: p.rating || 0,
      experience: p.experienceYears || 0,
      consultationFee: p.consultationFee || 0,
      image: p.user?.profileImage || null,
      available: p.availability && p.availability.length > 0,
    }));

    res.json({
      success: true,
      data: availableProviders,
    });
  } catch (error) {
    console.error("Get available providers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get available providers",
      error: error.message,
    });
  }
};

// ============= COMPLETE TRIAGE CASE =============
const completeTriage = async (req, res) => {
  try {
    const userId = req.userId;
    const { caseId } = req.params;
    const { triageNotes } = req.body;

    const nurse = await prisma.nurse.findUnique({
      where: { userId },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found",
      });
    }

    const triageCase = await prisma.triageCase.findFirst({
      where: {
        id: caseId,
        nurseId: nurse.id,
      },
    });

    if (!triageCase) {
      return res.status(404).json({
        success: false,
        message: "Triage case not found or not assigned to you",
      });
    }

    const updatedCase = await prisma.triageCase.update({
      where: { id: caseId },
      data: {
        status: "COMPLETED",
        triageNotes: triageNotes || triageCase.triageNotes,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Triage case completed successfully",
      data: updatedCase,
    });
  } catch (error) {
    console.error("Complete triage error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete triage",
      error: error.message,
    });
  }
};

// ============= GET NURSE PATIENTS =============
const getNursePatients = async (req, res) => {
  try {
    const userId = req.userId;
    const { search } = req.query;

    const nurse = await prisma.nurse.findUnique({
      where: { userId },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found",
      });
    }

    // Get all patients who have triage cases handled by this nurse
    const triageCases = await prisma.triageCase.findMany({
      where: {
        nurseId: nurse.id,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      distinct: ["patientId"],
      orderBy: {
        createdAt: "desc",
      },
    });

    let patients = triageCases.map((tc) => ({
      id: tc.patient.id,
      firstName: tc.patient.firstName,
      lastName: tc.patient.lastName,
      email: tc.patient.user.email,
      phone: tc.patient.phone,
      lastTriage: tc.createdAt,
      triageCount: 0,
    }));

    // Count triage cases per patient
    for (const patient of patients) {
      const count = await prisma.triageCase.count({
        where: {
          patientId: patient.id,
          nurseId: nurse.id,
        },
      });
      patient.triageCount = count;
    }

    // Filter by search
    if (search) {
      const term = search.toLowerCase();
      patients = patients.filter(
        (p) =>
          p.firstName?.toLowerCase().includes(term) ||
          p.lastName?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term)
      );
    }

    res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error("Get nurse patients error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get patients",
      error: error.message,
    });
  }
};

// ============= GET NURSE CASES =============
const getNurseCases = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const nurse = await prisma.nurse.findUnique({
      where: { userId },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found",
      });
    }

    const whereClause = {
      nurseId: nurse.id,
    };

    if (status && status !== "all") {
      whereClause.status = status.toUpperCase();
    }

    const cases = await prisma.triageCase.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        assignedProvider: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: cases,
    });
  } catch (error) {
    console.error("Get nurse cases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cases",
      error: error.message,
    });
  }
};

// ============= GET NURSE PROFILE =============
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const nurse = await prisma.nurse.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found",
      });
    }

    res.json({
      success: true,
      data: nurse,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message,
    });
  }
};

// ============= UPDATE NURSE PROFILE =============
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { firstName, lastName, department, employeeId } = req.body;

    const nurse = await prisma.nurse.update({
      where: { userId },
      data: {
        firstName,
        lastName,
        department,
        employeeId,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: nurse,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

module.exports = {
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
};