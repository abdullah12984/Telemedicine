const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============= GET ADMIN DASHBOARD =============
const getDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    const admin = await prisma.admin.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Get stats
    const totalUsers = await prisma.user.count();
    const totalPatients = await prisma.patient.count();
    const totalProviders = await prisma.provider.count();
    const totalNurses = await prisma.nurse.count();

    // Today's consultations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayConsultations = await prisma.consultation.count({
      where: {
        consultationDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Total appointments
    const totalAppointments = await prisma.appointment.count();

    // Appointments by status
    const pendingAppointments = await prisma.appointment.count({
      where: { status: "PENDING" },
    });
    const confirmedAppointments = await prisma.appointment.count({
      where: { status: "CONFIRMED" },
    });
    const completedAppointments = await prisma.appointment.count({
      where: { status: "COMPLETED" },
    });
    const cancelledAppointments = await prisma.appointment.count({
      where: { status: "CANCELLED" },
    });

    // No-show rate
    const totalCompleted = await prisma.appointment.count({
      where: { status: "COMPLETED" },
    });
    const totalCancelled = await prisma.appointment.count({
      where: { status: "CANCELLED" },
    });
    const totalAppts = await prisma.appointment.count();

    let noShowRate = 0;
    if (totalAppts > 0) {
      noShowRate = Math.round((totalCancelled / totalAppts) * 100);
    }

    // Recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        patient: true,
        provider: true,
        nurse: true,
        admin: true,
      },
    });

    // Recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Provider utilization
    const providersWithAppointments = await prisma.provider.findMany({
      include: {
        appointments: {
          where: {
            status: "COMPLETED",
          },
        },
      },
    });

    const providerUtilization = providersWithAppointments.map((p) => ({
      name: `Dr. ${p.firstName} ${p.lastName}`,
      appointments: p.appointments.length,
    }));

    res.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.user.email,
        },
        stats: {
          totalUsers,
          totalPatients,
          totalProviders,
          totalNurses,
          todayConsultations,
          totalAppointments,
          pendingAppointments,
          confirmedAppointments,
          completedAppointments,
          cancelledAppointments,
          noShowRate,
        },
        recentUsers: recentUsers.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          name: u.patient
            ? `${u.patient.firstName} ${u.patient.lastName}`
            : u.provider
            ? `Dr. ${u.provider.firstName} ${u.provider.lastName}`
            : u.nurse
            ? `${u.nurse.firstName} ${u.nurse.lastName}`
            : u.admin
            ? `${u.admin.firstName} ${u.admin.lastName}`
            : "Unknown",
          createdAt: u.createdAt,
        })),
        recentAppointments: recentAppointments.map((a) => ({
          id: a.id,
          patient: `${a.patient.firstName} ${a.patient.lastName}`,
          provider: `Dr. ${a.provider.firstName} ${a.provider.lastName}`,
          date: a.appointmentDate,
          time: a.startTime,
          status: a.status,
        })),
        providerUtilization: providerUtilization,
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

// ============= GET ALL USERS =============
const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    const whereClause = {};

    if (role && role !== "all") {
      whereClause.role = role.toUpperCase();
    }

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        patient: true,
        provider: true,
        nurse: true,
        admin: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      profile: u.patient
        ? { name: `${u.patient.firstName} ${u.patient.lastName}`, type: "patient" }
        : u.provider
        ? { name: `Dr. ${u.provider.firstName} ${u.provider.lastName}`, type: "provider" }
        : u.nurse
        ? { name: `${u.nurse.firstName} ${u.nurse.lastName}`, type: "nurse" }
        : u.admin
        ? { name: `${u.admin.firstName} ${u.admin.lastName}`, type: "admin" }
        : null,
    }));

    res.json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message,
    });
  }
};

// ============= UPDATE USER STATUS =============
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: user,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

// ============= DELETE USER =============
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin user",
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// ============= GET ALL PROVIDERS =============
const getProviders = async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
        appointments: {
          where: {
            status: "COMPLETED",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedProviders = providers.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      specialty: p.specialty,
      licenseNumber: p.licenseNumber,
      email: p.user.email,
      isActive: p.user.isActive,
      totalPatients: p.appointments.length,
      rating: p.rating || 0,
    }));

    res.json({
      success: true,
      data: formattedProviders,
    });
  } catch (error) {
    console.error("Get providers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get providers",
      error: error.message,
    });
  }
};

// ============= GET ALL APPOINTMENTS =============
const getAllAppointments = async (req, res) => {
  try {
    const { status, date } = req.query;

    const whereClause = {};

    if (status && status !== "all") {
      whereClause.status = status.toUpperCase();
    }

    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(filterDate);
      nextDate.setDate(nextDate.getDate() + 1);
      whereClause.appointmentDate = {
        gte: filterDate,
        lt: nextDate,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
      orderBy: {
        appointmentDate: "desc",
      },
    });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get appointments",
      error: error.message,
    });
  }
};

// ============= UPDATE APPOINTMENT STATUS =============
const updateAdminAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });

    res.json({
      success: true,
      message: "Appointment status updated successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
      error: error.message,
    });
  }
};

// ============= GET SYSTEM SETTINGS =============
const getSettings = async (req, res) => {
  try {
    // Return default settings (can be stored in database later)
    const settings = {
      triageRules: {
        mild: { priority: "LOW", description: "Mild symptoms - Low priority" },
        moderate: { priority: "MEDIUM", description: "Moderate symptoms - Medium priority" },
        severe: { priority: "HIGH", description: "Severe symptoms - High priority" },
        urgent: { priority: "URGENT", description: "Urgent symptoms - Immediate attention" },
      },
      cancellationPolicy: {
        gracePeriod: 24, // hours
        cancellationFee: 10, // percentage
        noShowFee: 25, // percentage
      },
      appointmentSettings: {
        defaultDuration: 30, // minutes
        maxAdvanceBooking: 30, // days
        minAdvanceBooking: 2, // hours
      },
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get settings",
      error: error.message,
    });
  }
};

// ============= UPDATE SYSTEM SETTINGS =============
const updateSettings = async (req, res) => {
  try {
    const settings = req.body;

    // In real app, save to database
    // For now, just return success

    res.json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  updateUserStatus,
  deleteUser,
  getProviders,
  getAllAppointments,
  updateAdminAppointmentStatus,
  getSettings,
  updateSettings,
};