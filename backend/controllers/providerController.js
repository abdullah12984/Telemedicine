const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============= GET PROVIDER DASHBOARD =============
const getDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    // Get provider profile
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!provider) {
      return res.status(404).json({ 
        success: false,
        message: "Provider not found" 
      });
    }

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        providerId: provider.id,
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // ✅ FIX 1: Get total patients count using findMany with distinct
    const completedPatients = await prisma.appointment.findMany({
      where: {
        providerId: provider.id,
        status: "COMPLETED",
      },
      select: {
        patientId: true,
      },
      distinct: ["patientId"],
    });
    const totalPatients = completedPatients.length;

    // Get pending prescriptions
    const pendingPrescriptions = await prisma.prescription.count({
      where: {
        providerId: provider.id,
        status: "ACTIVE",
      },
    });

    // Get total consultation time for today
    const totalConsultationTime = todayAppointments.reduce((total, apt) => {
      const start = parseInt(apt.startTime.split(":")[0]);
      const end = parseInt(apt.endTime.split(":")[0]);
      return total + (end - start);
    }, 0);

    // Get upcoming appointments (next 5)
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        providerId: provider.id,
        appointmentDate: {
          gte: new Date(),
        },
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        appointmentDate: "asc",
      },
      take: 5,
    });

    // ✅ FIX 2: Get recent patients using findMany with distinct
    const recentAppointments = await prisma.appointment.findMany({
      where: {
        providerId: provider.id,
        status: "COMPLETED",
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10, // Take more to ensure we get 5 distinct
    });

    // ✅ FIX 3: Manually filter distinct patients for recent
    const seenPatients = new Set();
    const recentPatients = [];
    for (const apt of recentAppointments) {
      if (!seenPatients.has(apt.patient.id) && recentPatients.length < 5) {
        seenPatients.add(apt.patient.id);
        recentPatients.push({
          id: apt.patient.id,
          name: `${apt.patient.firstName} ${apt.patient.lastName}`,
          lastVisit: apt.updatedAt,
        });
      }
    }

    res.json({
      success: true,
      data: {
        provider: {
          id: provider.id,
          firstName: provider.firstName,
          lastName: provider.lastName,
          specialty: provider.specialty,
          email: provider.user.email,
        },
        stats: {
          todayAppointments: todayAppointments.length,
          totalPatients: totalPatients || 0,
          pendingPrescriptions: pendingPrescriptions || 0,
          consultationTime: totalConsultationTime || 0,
        },
        todayAppointments: todayAppointments.map((apt) => ({
          id: apt.id,
          patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
          time: apt.startTime,
          status: apt.status,
          type: apt.type,
        })),
        upcomingAppointments: upcomingAppointments.map((apt) => ({
          id: apt.id,
          patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
          date: apt.appointmentDate,
          time: apt.startTime,
          status: apt.status,
          type: apt.type,
        })),
        recentPatients: recentPatients,
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

// ============= GET PROVIDER PROFILE =============
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            profileImage: true,
          },
        },
        availability: true,
      },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      message: "Failed to get profile",
      error: error.message,
    });
  }
};

// ============= UPDATE PROVIDER PROFILE =============
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      firstName,
      lastName,
      specialty,
      licenseNumber,
      licenseState,
      experienceYears,
      bio,
      consultationFee,
      permittedRegions,
    } = req.body;

    const provider = await prisma.provider.update({
      where: { userId },
      data: {
        firstName,
        lastName,
        specialty,
        licenseNumber,
        licenseState,
        experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
        bio,
        consultationFee: consultationFee ? parseFloat(consultationFee) : undefined,
        permittedRegions: permittedRegions || [],
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: provider,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// ============= GET PROVIDER APPOINTMENTS =============
const getAppointments = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, date } = req.query;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const whereClause = {
      providerId: provider.id,
    };

    if (status) {
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
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        consultation: {
          select: {
            id: true,
            diagnosis: true,
            visitNotes: true,
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
      message: "Failed to get appointments",
      error: error.message,
    });
  }
};

// ============= UPDATE APPOINTMENT STATUS =============
const updateAppointmentStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        providerId: provider.id,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        notes: notes || appointment.notes,
      },
    });

    // If appointment is completed, create consultation if not exists
    if (status.toUpperCase() === "COMPLETED") {
      const existingConsultation = await prisma.consultation.findUnique({
        where: { appointmentId: id },
      });

      if (!existingConsultation) {
        await prisma.consultation.create({
          data: {
            appointmentId: id,
            providerId: provider.id,
            patientId: appointment.patientId,
            consultationDate: new Date(),
          },
        });
      }
    }

    res.json({
      success: true,
      message: "Appointment status updated",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({
      message: "Failed to update appointment",
      error: error.message,
    });
  }
};

// ============= GET PROVIDER PATIENTS =============
const getPatients = async (req, res) => {
  try {
    const userId = req.userId;
    const { search } = req.query;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    // Get all patients who had appointments with this provider
    const appointments = await prisma.appointment.findMany({
      where: {
        providerId: provider.id,
        status: {
          in: ["COMPLETED", "CONFIRMED"],
        },
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
    });

    let patients = appointments.map((apt) => ({
      id: apt.patient.id,
      firstName: apt.patient.firstName,
      lastName: apt.patient.lastName,
      email: apt.patient.user.email,
      phone: apt.patient.phone,
      lastVisit: apt.appointmentDate,
    }));

    // Filter by search
    if (search) {
      const term = search.toLowerCase();
      patients = patients.filter(
        (p) =>
          p.firstName.toLowerCase().includes(term) ||
          p.lastName.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term)
      );
    }

    res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({
      message: "Failed to get patients",
      error: error.message,
    });
  }
};

// ============= GET PATIENT DETAILS =============
const getPatientDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const { patientId } = req.params;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    // Get patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        medicalRecords: {
          orderBy: {
            date: "desc",
          },
        },
        prescriptions: {
          where: {
            providerId: provider.id,
          },
          orderBy: {
            prescribedDate: "desc",
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Get consultation history
    const consultations = await prisma.consultation.findMany({
      where: {
        patientId: patient.id,
        providerId: provider.id,
      },
      include: {
        appointment: true,
        prescriptions: true,
      },
      orderBy: {
        consultationDate: "desc",
      },
    });

    res.json({
      success: true,
      data: {
        patient,
        consultations,
      },
    });
  } catch (error) {
    console.error("Get patient details error:", error);
    res.status(500).json({
      message: "Failed to get patient details",
      error: error.message,
    });
  }
};

// ============= GET PROVIDER CONSULTATIONS =============
const getConsultations = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const whereClause = {
      providerId: provider.id,
    };

    const consultations = await prisma.consultation.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            appointmentDate: true,
            startTime: true,
            status: true,
          },
        },
        prescriptions: {
          select: {
            id: true,
            medication: true,
            status: true,
          },
        },
        invoice: {
          select: {
            id: true,
            totalAmount: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: {
        consultationDate: "desc",
      },
    });

    res.json({
      success: true,
      data: consultations,
    });
  } catch (error) {
    console.error("Get consultations error:", error);
    res.status(500).json({
      message: "Failed to get consultations",
      error: error.message,
    });
  }
};

// ============= START CONSULTATION =============
const startConsultation = async (req, res) => {
  try {
    const userId = req.userId;
    const { appointmentId } = req.params;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    // Check if consultation already exists
    const existingConsultation = await prisma.consultation.findUnique({
      where: { appointmentId },
    });

    if (existingConsultation) {
      return res.json({
        success: true,
        message: "Consultation already started",
        data: existingConsultation,
      });
    }

    // Get appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        providerId: provider.id,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Create consultation
    const consultation = await prisma.consultation.create({
      data: {
        appointmentId: appointment.id,
        providerId: provider.id,
        patientId: appointment.patientId,
        consultationDate: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Consultation started",
      data: consultation,
    });
  } catch (error) {
    console.error("Start consultation error:", error);
    res.status(500).json({
      message: "Failed to start consultation",
      error: error.message,
    });
  }
};

// ============= COMPLETE CONSULTATION =============
const completeConsultation = async (req, res) => {
  try {
    const userId = req.userId;
    const { consultationId } = req.params;
    const { diagnosis, diagnosisCodes, visitNotes, duration } = req.body;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        providerId: provider.id,
      },
      include: {
        appointment: true,
      },
    });

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Update consultation
    const updatedConsultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        diagnosis: diagnosis || consultation.diagnosis,
        diagnosisCodes: diagnosisCodes || consultation.diagnosisCodes,
        visitNotes: visitNotes || consultation.visitNotes,
        duration: duration ? parseInt(duration) : consultation.duration,
      },
    });

    // Update appointment status
    await prisma.appointment.update({
      where: { id: consultation.appointmentId },
      data: {
        status: "COMPLETED",
      },
    });

    // Create medical record
    if (diagnosis || visitNotes) {
      await prisma.medicalRecord.create({
        data: {
          patientId: consultation.patientId,
          recordType: "visit_note",
          title: `Consultation - ${new Date().toLocaleDateString()}`,
          description: visitNotes || diagnosis || "Consultation completed",
          date: new Date(),
          providerId: provider.id,
          providerName: `${provider.firstName} ${provider.lastName}`,
        },
      });
    }

    res.json({
      success: true,
      message: "Consultation completed successfully",
      data: updatedConsultation,
    });
  } catch (error) {
    console.error("Complete consultation error:", error);
    res.status(500).json({
      message: "Failed to complete consultation",
      error: error.message,
    });
  }
};

// ============= CREATE PRESCRIPTION =============
const createPrescription = async (req, res) => {
  try {
    const userId = req.userId;
    const { consultationId } = req.params;
    const {
      medication,
      dosage,
      frequency,
      quantity,
      refills,
      instructions,
      validUntil,
    } = req.body;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        providerId: provider.id,
      },
    });

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Validate prescription
    if (!medication || !dosage || !frequency || !quantity) {
      return res.status(400).json({
        message: "Medication, dosage, frequency, and quantity are required",
      });
    }

    // Create prescription
    const prescription = await prisma.prescription.create({
      data: {
        consultationId: consultation.id,
        patientId: consultation.patientId,
        providerId: provider.id,
        medication,
        dosage,
        frequency,
        quantity: parseInt(quantity),
        refills: refills ? parseInt(refills) : 0,
        refillsLeft: refills ? parseInt(refills) : 0,
        instructions: instructions || "",
        status: "ACTIVE",
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    // Create medical record
    await prisma.medicalRecord.create({
      data: {
        patientId: consultation.patientId,
        recordType: "prescription",
        title: `Prescription: ${medication}`,
        description: `${dosage} - ${frequency} (${quantity} tablets)`,
        date: new Date(),
        providerId: provider.id,
        providerName: `${provider.firstName} ${provider.lastName}`,
      },
    });

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: prescription,
    });
  } catch (error) {
    console.error("Create prescription error:", error);
    res.status(500).json({
      message: "Failed to create prescription",
      error: error.message,
    });
  }
};

// ============= GET PROVIDER PRESCRIPTIONS =============
const getProviderPrescriptions = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const whereClause = {
      providerId: provider.id,
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        consultation: {
          select: {
            consultationDate: true,
          },
        },
        refillRequests: {
          where: {
            status: "PENDING",
          },
        },
      },
      orderBy: {
        prescribedDate: "desc",
      },
    });

    res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    console.error("Get provider prescriptions error:", error);
    res.status(500).json({
      message: "Failed to get prescriptions",
      error: error.message,
    });
  }
};

// ============= UPDATE PRESCRIPTION STATUS =============
const updatePrescriptionStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const prescription = await prisma.prescription.findFirst({
      where: {
        id,
        providerId: provider.id,
      },
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const updatedPrescription = await prisma.prescription.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
      },
    });

    res.json({
      success: true,
      message: "Prescription status updated",
      data: updatedPrescription,
    });
  } catch (error) {
    console.error("Update prescription error:", error);
    res.status(500).json({
      message: "Failed to update prescription",
      error: error.message,
    });
  }
};

// ============= GET AVAILABILITY =============
const getAvailability = async (req, res) => {
  try {
    const userId = req.userId;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    const availability = await prisma.providerAvailability.findMany({
      where: {
        providerId: provider.id,
      },
      orderBy: [
        {
          dayOfWeek: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    });

    // ✅ Format availability for frontend
    const formattedAvailability = availability.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      isAvailable: a.isAvailable,
      isRecurring: a.isRecurring,
      dayName: getDayName(a.dayOfWeek),
    }));

    res.json({
      success: true,
      data: formattedAvailability,
    });
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get availability",
      error: error.message,
    });
  }
};

// Helper function
const getDayName = (day) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[day] || "Unknown";
};

// ============= UPDATE AVAILABILITY =============
const updateAvailability = async (req, res) => {
  try {
    const userId = req.userId;
    const { availability } = req.body;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    // Delete existing availability
    await prisma.providerAvailability.deleteMany({
      where: {
        providerId: provider.id,
      },
    });

    // Create new availability
    const created = [];
    for (const slot of availability) {
      const newSlot = await prisma.providerAvailability.create({
        data: {
          providerId: provider.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : true,
          isRecurring: slot.isRecurring !== undefined ? slot.isRecurring : true,
        },
      });
      created.push(newSlot);
    }

    res.json({
      success: true,
      message: "Availability updated successfully",
      data: created,
    });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({
      message: "Failed to update availability",
      error: error.message,
    });
  }
};

// ============= GET PENDING REFILL REQUESTS =============
const getRefillRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const refillRequests = await prisma.refillRequest.findMany({
      where: {
        prescription: {
          providerId: provider.id,
        },
        status: "PENDING",
      },
      include: {
        prescription: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        requestDate: "asc",
      },
    });

    res.json({
      success: true,
      data: refillRequests,
    });
  } catch (error) {
    console.error("Get refill requests error:", error);
    res.status(500).json({
      message: "Failed to get refill requests",
      error: error.message,
    });
  }
};

// ============= PROCESS REFILL REQUEST =============
const processRefillRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const refillRequest = await prisma.refillRequest.findFirst({
      where: {
        id,
        prescription: {
          providerId: provider.id,
        },
      },
      include: {
        prescription: true,
      },
    });

    if (!refillRequest) {
      return res.status(404).json({ message: "Refill request not found" });
    }

    // Update refill request
    const updated = await prisma.refillRequest.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
      },
    });

    // If approved, update prescription refills
    if (status.toUpperCase() === "APPROVED") {
      await prisma.prescription.update({
        where: { id: refillRequest.prescriptionId },
        data: {
          refillsLeft: {
            increment: 1,
          },
        },
      });
    }

    res.json({
      success: true,
      message: `Refill request ${status.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("Process refill request error:", error);
    res.status(500).json({
      message: "Failed to process refill request",
      error: error.message,
    });
  }
};

module.exports = {
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
};