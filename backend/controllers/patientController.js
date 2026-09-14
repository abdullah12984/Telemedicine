// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// // ============= GET PATIENT DASHBOARD =============
// const getDashboard = async (req, res) => {
//   try {
//     const userId = req.userId;

//     // Get patient profile
//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//       include: {
//         user: true,
//       },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     // Get upcoming appointments
//     const upcomingAppointments = await prisma.appointment.findMany({
//       where: {
//         patientId: patient.id,
//         status: {
//           in: ["PENDING", "CONFIRMED"],
//         },
//         appointmentDate: {
//           gte: new Date(),
//         },
//       },
//       include: {
//         provider: {
//           include: {
//             user: true,
//           },
//         },
//       },
//       orderBy: {
//         appointmentDate: "asc",
//       },
//       take: 5,
//     });

//     // Get active prescriptions count
//     const activePrescriptions = await prisma.prescription.count({
//       where: {
//         patientId: patient.id,
//         status: "ACTIVE",
//       },
//     });

//     // Get total medical records
//     const totalRecords = await prisma.medicalRecord.count({
//       where: {
//         patientId: patient.id,
//       },
//     });

//     // Get triage status
//     const triageCase = await prisma.triageCase.findFirst({
//       where: {
//         patientId: patient.id,
//         status: {
//           in: ["PENDING", "IN_PROGRESS", "ASSIGNED"],
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     // Get recent notifications
//     const notifications = await prisma.notification.findMany({
//       where: {
//         patientId: patient.id,
//         isRead: false,
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//       take: 5,
//     });

//     res.json({
//       success: true,
//       data: {
//         patient: {
//           id: patient.id,
//           firstName: patient.firstName,
//           lastName: patient.lastName,
//           email: patient.user.email,
//         },
//         stats: {
//           upcomingAppointments: upcomingAppointments.length,
//           activePrescriptions,
//           totalRecords,
//           unreadNotifications: notifications.length,
//         },
//         upcomingAppointments: upcomingAppointments.map((apt) => ({
//           id: apt.id,
//           doctor: `Dr. ${apt.provider.firstName} ${apt.provider.lastName}`,
//           specialty: apt.provider.specialty,
//           date: apt.appointmentDate,
//           time: apt.startTime,
//           status: apt.status,
//           type: apt.type,
//         })),
//         triageStatus: triageCase
//           ? {
//               status: triageCase.status,
//               priority: triageCase.severity,
//               submittedAt: triageCase.createdAt,
//             }
//           : null,
//         notifications: notifications.map((n) => ({
//           id: n.id,
//           title: n.title,
//           message: n.message,
//           type: n.type,
//           createdAt: n.createdAt,
//         })),
//       },
//     });
//   } catch (error) {
//     console.error("Dashboard error:", error);
//     res.status(500).json({
//       message: "Failed to load dashboard",
//       error: error.message,
//     });
//   }
// };

// // ============= GET PATIENT PROFILE =============
// const getProfile = async (req, res) => {
//   try {
//     const userId = req.userId;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//       include: {
//         user: {
//           select: {
//             email: true,
//             role: true,
//             profileImage: true,
//           },
//         },
//       },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     res.json({
//       success: true,
//       data: patient,
//     });
//   } catch (error) {
//     console.error("Profile error:", error);
//     res.status(500).json({
//       message: "Failed to get profile",
//       error: error.message,
//     });
//   }
// };

// // ============= UPDATE PATIENT PROFILE =============
// const updateProfile = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const {
//       firstName,
//       lastName,
//       phone,
//       address,
//       city,
//       state,
//       zipCode,
//       emergencyContact,
//       emergencyPhone,
//       bloodGroup,
//       allergies,
//       chronicConditions,
//     } = req.body;

//     const patient = await prisma.patient.update({
//       where: { userId },
//       data: {
//         firstName,
//         lastName,
//         phone,
//         address,
//         city,
//         state,
//         zipCode,
//         emergencyContact,
//         emergencyPhone,
//         bloodGroup,
//         allergies,
//         chronicConditions,
//       },
//     });

//     res.json({
//       success: true,
//       message: "Profile updated successfully",
//       data: patient,
//     });
//   } catch (error) {
//     console.error("Update profile error:", error);
//     res.status(500).json({
//       message: "Failed to update profile",
//       error: error.message,
//     });
//   }
// };

// // ============= SUBMIT SYMPTOMS FOR TRIAGE =============
// const submitSymptoms = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { symptoms, symptomDetails, severity } = req.body;

//     // Get patient
//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     // Calculate priority score
//     let priorityScore = 0;
//     let severityEnum = "MEDIUM";

//     if (severity === "mild") {
//       priorityScore = 1;
//       severityEnum = "LOW";
//     } else if (severity === "moderate") {
//       priorityScore = 2;
//       severityEnum = "MEDIUM";
//     } else if (severity === "severe") {
//       priorityScore = 3;
//       severityEnum = "HIGH";
//     } else if (severity === "urgent") {
//       priorityScore = 4;
//       severityEnum = "URGENT";
//     }

//     // Create triage case
//     const triageCase = await prisma.triageCase.create({
//       data: {
//         patientId: patient.id,
//         symptoms: symptoms || [],
//         symptomDetails: symptomDetails || "",
//         severity: severityEnum,
//         priorityScore: priorityScore,
//         status: "PENDING",
//       },
//     });
//         // ✅ Notify all nurses about new triage case submission
//     const nurses = await prisma.nurse.findMany({
//       select: { userId: true },
//     });
//     for (const nurse of nurses) {
//       await prisma.notification.create({
//         data: {
//           userId: nurse.userId,
//           patientId: patient.id,
//           title: "New Triage Case Submitted",
//           message: `${patient.firstName} ${patient.lastName} submitted symptoms for triage (${severityEnum} priority).`,
//           type: "TRIAGE_ASSIGNED",
//         },
//       });
//     }

//     res.status(201).json({
//       success: true,
//       message: "Symptoms submitted successfully",
//       data: {
//         triageId: triageCase.id,
//         status: triageCase.status,
//         priority: triageCase.severity,
//       },
//     });
//   } catch (error) {
//     console.error("Submit symptoms error:", error);
//     res.status(500).json({
//       message: "Failed to submit symptoms",
//       error: error.message,
//     });
//   }
// };

// // ============= GET TRIAGE STATUS =============
// const getTriageStatus = async (req, res) => {
//   try {
//     const userId = req.userId;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//         const triageCases = await prisma.triageCase.findMany({
//       where: {
//         patientId: patient.id,
//       },
//       include: {
//         nurse: {
//           select: {
//             firstName: true,
//             lastName: true,
//           },
//         },
//         assignedProvider: {
//           select: {
//             firstName: true,
//             lastName: true,
//             specialty: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     // ✅ Auto-complete triage case if patient already completed consultation/appointment
//     for (const tc of triageCases) {
//       if (tc.status !== "COMPLETED") {
//         const completedAppointment = await prisma.appointment.findFirst({
//           where: {
//             patientId: patient.id,
//             status: "COMPLETED",
//           },
//         });
//         if (completedAppointment) {
//           await prisma.triageCase.update({
//             where: { id: tc.id },
//             data: {
//               status: "COMPLETED",
//               completedAt: completedAppointment.updatedAt || new Date(),
//             },
//           });
//           tc.status = "COMPLETED";
//         }
//       }
//     }

//     res.json({
//       success: true,
//       data: triageCases,
//     });
//   } catch (error) {
//     console.error("Triage status error:", error);
//     res.status(500).json({
//       message: "Failed to get triage status",
//       error: error.message,
//     });
//   }
// };

// // ============= GET PATIENT APPOINTMENTS =============
// const getAppointments = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { status } = req.query;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     const whereClause = {
//       patientId: patient.id,
//     };

//     if (status) {
//       whereClause.status = status.toUpperCase();
//     }

//     const appointments = await prisma.appointment.findMany({
//       where: whereClause,
//       include: {
//         provider: {
//           include: {
//             user: true,
//           },
//         },
//       },
//       orderBy: {
//         appointmentDate: "desc",
//       },
//     });

//     res.json({
//       success: true,
//       data: appointments.map((apt) => ({
//         id: apt.id,
//         provider: `Dr. ${apt.provider.firstName} ${apt.provider.lastName}`,
//         specialty: apt.provider.specialty,
//         date: apt.appointmentDate,
//         time: apt.startTime,
//         status: apt.status,
//         type: apt.type,
//         location: apt.type === "VIRTUAL" ? "Virtual Consultation" : "In-Person",
//         reason: apt.reason,
//       })),
//     });
//   } catch (error) {
//     console.error("Appointments error:", error);
//     res.status(500).json({
//       message: "Failed to get appointments",
//       error: error.message,
//     });
//   }
// };

// // ============= BOOK APPOINTMENT =============
// // ============= BOOK APPOINTMENT =============
// const bookAppointment = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { providerId, appointmentDate, startTime, endTime, reason, type } = req.body;

//     console.log("📅 Booking appointment:", { providerId, appointmentDate, startTime });

//     // ✅ Validate required fields
//     if (!providerId || !appointmentDate || !startTime) {
//       return res.status(400).json({
//         message: "Provider ID, date, and start time are required",
//       });
//     }

//     // Get patient
//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     // Check if provider exists
//     const provider = await prisma.provider.findUnique({
//       where: { id: providerId },
//     });

//     if (!provider) {
//       return res.status(404).json({ message: "Provider not found" });
//     }

//     // ✅ Parse date properly
//     const parsedDate = new Date(appointmentDate);
//     if (isNaN(parsedDate.getTime())) {
//       return res.status(400).json({
//         message: "Invalid appointment date format",
//       });
//     }

//     const dayOfWeek = parsedDate.getDay();

//     // ✅ Normalize time
//     const normalizedStartTime = startTime;
//     const normalizedEndTime = endTime || `${parseInt(startTime) + 30}:00`;

//     // ✅ CHECK 1: Provider availability
//     const availability = await prisma.providerAvailability.findFirst({
//       where: {
//         providerId,
//         dayOfWeek,
//         isAvailable: true,
//         startTime: {
//           lte: normalizedStartTime,
//         },
//         endTime: {
//           gte: normalizedEndTime,
//         },
//       },
//     });

//     if (!availability) {
//       console.log("❌ No availability found for:", { providerId, dayOfWeek, startTime: normalizedStartTime });
//       return res.status(400).json({
//         message: "Provider is not available at this time. Please check their schedule.",
//       });
//     }

//     // ✅ CHECK 2: Double booking
//     const existingAppointment = await prisma.appointment.findFirst({
//       where: {
//         providerId,
//         appointmentDate: parsedDate,
//         startTime: normalizedStartTime,
//         status: {
//           notIn: ["CANCELLED"],
//         },
//       },
//     });

//     if (existingAppointment) {
//       return res.status(400).json({
//         message: "Provider already has an appointment at this exact time",
//       });
//     }

//     // ✅ CHECK 3: Overlapping appointments
//     const overlappingAppointment = await prisma.appointment.findFirst({
//       where: {
//         providerId,
//         appointmentDate: parsedDate,
//         status: {
//           notIn: ["CANCELLED"],
//         },
//         OR: [
//           {
//             startTime: {
//               lte: normalizedStartTime,
//             },
//             endTime: {
//               gt: normalizedStartTime,
//             },
//           },
//           {
//             startTime: {
//               lt: normalizedEndTime,
//             },
//             endTime: {
//               gte: normalizedEndTime,
//             },
//           },
//           {
//             startTime: {
//               gte: normalizedStartTime,
//             },
//             endTime: {
//               lte: normalizedEndTime,
//             },
//           },
//         ],
//       },
//     });

//     if (overlappingAppointment) {
//       return res.status(400).json({
//         message: "Provider has an overlapping appointment at this time",
//       });
//     }

//     // ✅ Create appointment
//        // ✅ Create appointment AND linked consultation record
//     const appointment = await prisma.appointment.create({
//       data: {
//         patientId: patient.id,
//         providerId,
//         appointmentDate: parsedDate,
//         startTime: normalizedStartTime,
//         endTime: normalizedEndTime,
//         reason: reason || "",
//         type: type || "VIRTUAL",
//         status: "PENDING",
//         consultation: {
//           create: {
//             providerId,
//             patientId: patient.id,
//             consultationDate: parsedDate,
//           },
//         },
//       },
//       include: {
//         consultation: true,
//       },
//     });

//     // ✅ Create notifications
//     await prisma.notification.create({
//       data: {
//         userId: provider.userId,
//         title: "New Appointment Booked",
//         message: `New appointment booked with ${patient.firstName} ${patient.lastName} on ${parsedDate.toLocaleDateString()} at ${normalizedStartTime}`,
//         type: "APPOINTMENT_BOOKED",
//       },
//     });

//     await prisma.notification.create({
//       data: {
//         userId: patient.userId,
//         patientId: patient.id,
//         title: "Appointment Booked",
//         message: `Your appointment with Dr. ${provider.firstName} ${provider.lastName} has been booked for ${parsedDate.toLocaleDateString()} at ${normalizedStartTime}`,
//         type: "APPOINTMENT_BOOKED",
//       },
//     });
//         // ✅ Notify all nurses that an appointment has been scheduled
//     const allNurses = await prisma.nurse.findMany({
//       select: { userId: true },
//     });
//     for (const n of allNurses) {
//       await prisma.notification.create({
//         data: {
//           userId: n.userId,
//           patientId: patient.id,
//           title: "Appointment Booked",
//           message: `${patient.firstName} ${patient.lastName} booked an appointment with Dr. ${provider.firstName} ${provider.lastName} on ${parsedDate.toLocaleDateString()} at ${normalizedStartTime}.`,
//           type: "APPOINTMENT_BOOKED",
//         },
//       });
//     }

//     res.status(201).json({
//       success: true,
//       message: "Appointment booked successfully",
//       data: appointment,
//     });
//   } catch (error) {
//     console.error("Book appointment error:", error);
    
//     if (error.code === 'P2002') {
//       return res.status(400).json({
//         message: "This time slot is already booked. Please select another time.",
//       });
//     }
    
//     res.status(500).json({
//       message: "Failed to book appointment",
//       error: error.message,
//     });
//   }
// };
// // ============= CANCEL APPOINTMENT =============
// const cancelAppointment = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { id } = req.params;
//     const { reason } = req.body;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     const appointment = await prisma.appointment.update({
//       where: {
//         id,
//         patientId: patient.id,
//       },
//       data: {
//         status: "CANCELLED",
//         cancellationReason: reason || "Cancelled by patient",
//         cancelledAt: new Date(),
//       },
//     });

//     res.json({
//       success: true,
//       message: "Appointment cancelled successfully",
//       data: appointment,
//     });
//   } catch (error) {
//     console.error("Cancel appointment error:", error);
//     res.status(500).json({
//       message: "Failed to cancel appointment",
//       error: error.message,
//     });
//   }
// };

// // ============= GET AVAILABLE PROVIDERS =============
// // ============= GET AVAILABLE PROVIDERS =============
// const getAvailableProviders = async (req, res) => {
//   try {
//     const { specialty, date } = req.query;

//     const whereClause = {};

//     if (specialty && specialty !== "all") {
//       whereClause.specialty = specialty;
//     }

//     const providers = await prisma.provider.findMany({
//       where: whereClause,
//       include: {
//         user: {
//           select: {
//             email: true,
//             profileImage: true,
//           },
//         },
//         availability: {
//           where: {
//             isAvailable: true,
//           },
//         },
//       },
//     });

//     // ✅ Format response with safe access
//     const formattedProviders = providers.map((p) => {
//       // ✅ Safe access for permittedRegions
//       let location = "N/A";
//       if (p.permittedRegions && Array.isArray(p.permittedRegions) && p.permittedRegions.length > 0) {
//         location = p.permittedRegions[0];
//       }

//       // Get unique times from availability
//       const times = p.availability.map((a) => a.startTime);
//       const uniqueTimes = [...new Set(times)];

//       // ✅ Sort times
//       uniqueTimes.sort();

//       return {
//         id: p.id,
//         name: `Dr. ${p.firstName} ${p.lastName}`,
//         specialty: p.specialty || "General",
//         location: location,
//         rating: p.rating || 4.5,
//         experience: p.experienceYears || 5,
//         consultationFee: p.consultationFee || 0,
//         image: p.user?.profileImage || null,
//         times: uniqueTimes,
//         availableTimes: p.availability.map((a) => ({
//           day: a.dayOfWeek,
//           start: a.startTime,
//           end: a.endTime,
//         })),
//         hasAvailability: p.availability.length > 0,
//       };
//     });

//     // ✅ Filter providers with availability
//     const availableProviders = formattedProviders.filter(p => p.hasAvailability);

//     res.json({
//       success: true,
//       data: availableProviders,
//     });
//   } catch (error) {
//     console.error("Get providers error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to get providers",
//       error: error.message,
//     });
//   }
// };

// // ============= GET PRESCRIPTIONS =============
// const getPrescriptions = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { status } = req.query;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     const whereClause = {
//       patientId: patient.id,
//     };

//     if (status) {
//       whereClause.status = status.toUpperCase();
//     }

//     const prescriptions = await prisma.prescription.findMany({
//       where: whereClause,
//       include: {
//         provider: {
//           select: {
//             firstName: true,
//             lastName: true,
//             specialty: true,
//           },
//         },
//         consultation: {
//           select: {
//             consultationDate: true,
//           },
//         },
//       },
//       orderBy: {
//         prescribedDate: "desc",
//       },
//     });

//     res.json({
//       success: true,
//       data: prescriptions,
//     });
//   } catch (error) {
//     console.error("Get prescriptions error:", error);
//     res.status(500).json({
//       message: "Failed to get prescriptions",
//       error: error.message,
//     });
//   }
// };

// // ============= REQUEST PRESCRIPTION REFILL =============
// const requestRefill = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { prescriptionId } = req.params;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     // Check if prescription exists and belongs to patient
//     const prescription = await prisma.prescription.findFirst({
//       where: {
//         id: prescriptionId,
//         patientId: patient.id,
//         status: "ACTIVE",
//       },
//     });

//     if (!prescription) {
//       return res.status(404).json({
//         message: "Prescription not found or not active",
//       });
//     }

//     if (prescription.refillsLeft <= 0) {
//       return res.status(400).json({
//         message: "No refills left for this prescription",
//       });
//     }

//     // Create refill request
//     const refillRequest = await prisma.refillRequest.create({
//       data: {
//         prescriptionId: prescription.id,
//         patientId: patient.id,
//         status: "PENDING",
//       },
//     });

//     res.status(201).json({
//       success: true,
//       message: "Refill request submitted successfully",
//       data: refillRequest,
//     });
//   } catch (error) {
//     console.error("Request refill error:", error);
//     res.status(500).json({
//       message: "Failed to request refill",
//       error: error.message,
//     });
//   }
// };

// // ============= GET MEDICAL RECORDS =============
// const getMedicalRecords = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { type } = req.query;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     const whereClause = {
//       patientId: patient.id,
//     };

//     if (type) {
//       whereClause.recordType = type;
//     }

//     const records = await prisma.medicalRecord.findMany({
//       where: whereClause,
//       orderBy: {
//         date: "desc",
//       },
//     });

//     res.json({
//       success: true,
//       data: records,
//     });
//   } catch (error) {
//     console.error("Get medical records error:", error);
//     res.status(500).json({
//       message: "Failed to get medical records",
//       error: error.message,
//     });
//   }
// };

// // ============= GET NOTIFICATIONS =============
// const getNotifications = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { unread } = req.query;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     const whereClause = {
//       patientId: patient.id,
//     };

//     if (unread === "true") {
//       whereClause.isRead = false;
//     }

//     const notifications = await prisma.notification.findMany({
//       where: whereClause,
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     res.json({
//       success: true,
//       data: notifications,
//     });
//   } catch (error) {
//     console.error("Get notifications error:", error);
//     res.status(500).json({
//       message: "Failed to get notifications",
//       error: error.message,
//     });
//   }
// };

// // ============= MARK NOTIFICATION AS READ =============
// const markNotificationAsRead = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { id } = req.params;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     const notification = await prisma.notification.update({
//       where: {
//         id,
//         patientId: patient.id,
//       },
//       data: {
//         isRead: true,
//         readAt: new Date(),
//       },
//     });

//     res.json({
//       success: true,
//       message: "Notification marked as read",
//       data: notification,
//     });
//   } catch (error) {
//     console.error("Mark notification error:", error);
//     res.status(500).json({
//       message: "Failed to mark notification",
//       error: error.message,
//     });
//   }
// };

// // ============= MARK ALL NOTIFICATIONS AS READ =============
// const markAllNotificationsAsRead = async (req, res) => {
//   try {
//     const userId = req.userId;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     await prisma.notification.updateMany({
//       where: {
//         patientId: patient.id,
//         isRead: false,
//       },
//       data: {
//         isRead: true,
//         readAt: new Date(),
//       },
//     });

//     res.json({
//       success: true,
//       message: "All notifications marked as read",
//     });
//   } catch (error) {
//     console.error("Mark all notifications error:", error);
//     res.status(500).json({
//       message: "Failed to mark all notifications",
//       error: error.message,
//     });
//   }
// };

// // ============= GET INVOICES =============
// const getInvoices = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { status } = req.query;

//     const patient = await prisma.patient.findUnique({
//       where: { userId },
//     });

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     const whereClause = {
//       patientId: patient.id,
//     };

//     if (status) {
//       whereClause.paymentStatus = status.toUpperCase();
//     }

//     const invoices = await prisma.invoice.findMany({
//       where: whereClause,
//       include: {
//         consultation: {
//           select: {
//             consultationDate: true,
//             provider: {
//               select: {
//                 firstName: true,
//                 lastName: true,
//               },
//             },
//           },
//         },
//         payment: true,
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     res.json({
//       success: true,
//       data: invoices,
//     });
//   } catch (error) {
//     console.error("Get invoices error:", error);
//     res.status(500).json({
//       message: "Failed to get invoices",
//       error: error.message,
//     });
//   }
// };



// // ============= HELPER: Generate Time Slots =============
// const generateTimeSlots = (startTime, endTime, durationMinutes) => {
//   const slots = [];
//   const [startH, startM] = startTime.split(":").map(Number);
//   const [endH, endM] = endTime.split(":").map(Number);

//   let current = startH * 60 + startM;
//   const end = endH * 60 + endM;

//   while (current + durationMinutes <= end) {
//     const slotStartH = Math.floor(current / 60);
//     const slotStartM = current % 60;
//     const slotEndTotal = current + durationMinutes;
//     const slotEndH = Math.floor(slotEndTotal / 60);
//     const slotEndM = slotEndTotal % 60;

//     slots.push({
//       start: `${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}`,
//       end: `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}`,
//     });

//     current = slotEndTotal;
//   }

//   return slots;
// };

// // yah add kia meay 

// // ============= GET PROVIDER SLOTS FOR A DATE =============
// const getProviderSlots = async (req, res) => {
//   try {
//     const { providerId } = req.params;
//     const { date } = req.query;

//     if (!providerId || !date) {
//       return res.status(400).json({
//         message: "Provider ID and date are required",
//       });
//     }

//     // Parse date
//     const parsedDate = new Date(date);
//     if (isNaN(parsedDate.getTime())) {
//       return res.status(400).json({ message: "Invalid date format" });
//     }

//     const dayOfWeek = parsedDate.getDay();

//     // Get provider's availability for this day
//     const availability = await prisma.providerAvailability.findMany({
//       where: {
//         providerId,
//         dayOfWeek,
//         isAvailable: true,
//       },
//     });

//     if (availability.length === 0) {
//       return res.json({
//         success: true,
//         data: [],
//         message: "No availability on this day",
//       });
//     }

//     // ✅ Generate slots from availability
//     let allSlots = [];
//     for (const avail of availability) {
//       const slots = generateTimeSlots(
//         avail.startTime,
//         avail.endTime,
//         avail.slotDuration || 30
//       );
//       allSlots.push(...slots);
//     }

//     // ✅ Remove duplicates (by start time)
//     const uniqueSlots = [];
//     const seen = new Set();
//     for (const slot of allSlots) {
//       if (!seen.has(slot.start)) {
//         seen.add(slot.start);
//         uniqueSlots.push(slot);
//       }
//     }

//     // ✅ Sort by start time
//     uniqueSlots.sort((a, b) => a.start.localeCompare(b.start));

//     // ✅ Get existing appointments for this date (exclude cancelled)
//     const appointments = await prisma.appointment.findMany({
//       where: {
//         providerId,
//         appointmentDate: parsedDate,
//         status: {
//           notIn: ["CANCELLED"],
//         },
//       },
//       select: {
//         startTime: true,
//         status: true,
//       },
//     });

//     const bookedTimes = new Map(
//       appointments.map((a) => [a.startTime, a.status])
//     );

//     // ✅ Attach status to each slot
//     const slotsWithStatus = uniqueSlots.map((slot) => ({
//       time: slot.start,
//       endTime: slot.end,
//       status: bookedTimes.has(slot.start) ? "booked" : "available",
//     }));

//     res.json({
//       success: true,
//       data: slotsWithStatus,
//     });
//   } catch (error) {
//     console.error("Get provider slots error:", error);
//     res.status(500).json({
//       message: "Failed to get slots",
//       error: error.message,
//     });
//   }
// };

// module.exports = {
//   getDashboard,
//   getProfile,
//   updateProfile,
//   submitSymptoms,
//   getTriageStatus,
//   getAppointments,
//   bookAppointment,
//   cancelAppointment,
//   getAvailableProviders,
//   getPrescriptions,
//   requestRefill,
//   getMedicalRecords,
//   getNotifications,
//   markNotificationAsRead,
//   markAllNotificationsAsRead,
//   getInvoices,
//   getProviderSlots,
// };







































const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============= GET PATIENT DASHBOARD =============
const getDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    // Get patient profile
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Get upcoming appointments
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        appointmentDate: {
          gte: new Date(),
        },
      },
      include: {
        provider: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        appointmentDate: "asc",
      },
      take: 5,
    });

    // Get active prescriptions count
    const activePrescriptions = await prisma.prescription.count({
      where: {
        patientId: patient.id,
        status: "ACTIVE",
      },
    });

    // Get total medical records
    const totalRecords = await prisma.medicalRecord.count({
      where: {
        patientId: patient.id,
      },
    });

    // Get triage status
    const triageCase = await prisma.triageCase.findFirst({
      where: {
        patientId: patient.id,
        status: {
          in: ["PENDING", "IN_PROGRESS", "ASSIGNED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get recent notifications
    const notifications = await prisma.notification.findMany({
      where: {
        patientId: patient.id,
        isRead: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.user.email,
        },
        stats: {
          upcomingAppointments: upcomingAppointments.length,
          activePrescriptions,
          totalRecords,
          unreadNotifications: notifications.length,
        },
        upcomingAppointments: upcomingAppointments.map((apt) => ({
          id: apt.id,
          doctor: `Dr. ${apt.provider.firstName} ${apt.provider.lastName}`,
          specialty: apt.provider.specialty,
          date: apt.appointmentDate,
          time: apt.startTime,
          status: apt.status,
          type: apt.type,
        })),
        triageStatus: triageCase
          ? {
              status: triageCase.status,
              priority: triageCase.severity,
              submittedAt: triageCase.createdAt,
            }
          : null,
        notifications: notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          createdAt: n.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      message: "Failed to load dashboard",
      error: error.message,
    });
  }
};

// ============= GET PATIENT PROFILE =============
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const patient = await prisma.patient.findUnique({
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

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      message: "Failed to get profile",
      error: error.message,
    });
  }
};

// ============= UPDATE PATIENT PROFILE =============
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      firstName,
      lastName,
      phone,
      address,
      city,
      state,
      zipCode,
      emergencyContact,
      emergencyPhone,
      bloodGroup,
      allergies,
      chronicConditions,
    } = req.body;

    const patient = await prisma.patient.update({
      where: { userId },
      data: {
        firstName,
        lastName,
        phone,
        address,
        city,
        state,
        zipCode,
        emergencyContact,
        emergencyPhone,
        bloodGroup,
        allergies,
        chronicConditions,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// ============= SUBMIT SYMPTOMS FOR TRIAGE =============
const submitSymptoms = async (req, res) => {
  try {
    const userId = req.userId;
    const { symptoms, symptomDetails, severity } = req.body;

    // Get patient
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Calculate priority score
    let priorityScore = 0;
    let severityEnum = "MEDIUM";

    if (severity === "mild") {
      priorityScore = 1;
      severityEnum = "LOW";
    } else if (severity === "moderate") {
      priorityScore = 2;
      severityEnum = "MEDIUM";
    } else if (severity === "severe") {
      priorityScore = 3;
      severityEnum = "HIGH";
    } else if (severity === "urgent") {
      priorityScore = 4;
      severityEnum = "URGENT";
    }

    // Create triage case
    const triageCase = await prisma.triageCase.create({
      data: {
        patientId: patient.id,
        symptoms: symptoms || [],
        symptomDetails: symptomDetails || "",
        severity: severityEnum,
        priorityScore: priorityScore,
        status: "PENDING",
      },
    });
        // ✅ Notify all nurses about new triage case submission
    const nurses = await prisma.nurse.findMany({
      select: { userId: true },
    });
    for (const nurse of nurses) {
      await prisma.notification.create({
        data: {
          userId: nurse.userId,
          patientId: patient.id,
          title: "New Triage Case Submitted",
          message: `${patient.firstName} ${patient.lastName} submitted symptoms for triage (${severityEnum} priority).`,
          type: "TRIAGE_ASSIGNED",
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Symptoms submitted successfully",
      data: {
        triageId: triageCase.id,
        status: triageCase.status,
        priority: triageCase.severity,
      },
    });
  } catch (error) {
    console.error("Submit symptoms error:", error);
    res.status(500).json({
      message: "Failed to submit symptoms",
      error: error.message,
    });
  }
};

// ============= GET TRIAGE STATUS =============
const getTriageStatus = async (req, res) => {
  try {
    const userId = req.userId;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

        const triageCases = await prisma.triageCase.findMany({
      where: {
        patientId: patient.id,
      },
      include: {
        nurse: {
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
    });

    // ✅ Auto-complete triage case if patient already completed consultation/appointment
    

    res.json({
      success: true,
      data: triageCases,
    });
  } catch (error) {
    console.error("Triage status error:", error);
    res.status(500).json({
      message: "Failed to get triage status",
      error: error.message,
    });
  }
};

// ============= GET PATIENT APPOINTMENTS =============
const getAppointments = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const whereClause = {
      patientId: patient.id,
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        provider: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        appointmentDate: "desc",
      },
    });

    res.json({
      success: true,
      data: appointments.map((apt) => ({
        id: apt.id,
        provider: `Dr. ${apt.provider.firstName} ${apt.provider.lastName}`,
        specialty: apt.provider.specialty,
        date: apt.appointmentDate,
        time: apt.startTime,
        status: apt.status,
        type: apt.type,
        location: apt.type === "VIRTUAL" ? "Virtual Consultation" : "In-Person",
        reason: apt.reason,
      })),
    });
  } catch (error) {
    console.error("Appointments error:", error);
    res.status(500).json({
      message: "Failed to get appointments",
      error: error.message,
    });
  }
};

// ============= BOOK APPOINTMENT =============
// ============= BOOK APPOINTMENT =============
const bookAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { providerId, appointmentDate, startTime, endTime, reason, type } = req.body;

    console.log("📅 Booking appointment:", { providerId, appointmentDate, startTime });

    // ✅ Validate required fields
    if (!providerId || !appointmentDate || !startTime) {
      return res.status(400).json({
        message: "Provider ID, date, and start time are required",
      });
    }

    // Get patient
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    // ✅ Parse date properly
    const parsedDate = new Date(appointmentDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid appointment date format",
      });
    }

    const dayOfWeek = parsedDate.getDay();

    // ✅ Normalize time
    const normalizedStartTime = startTime;
    const normalizedEndTime = endTime || `${parseInt(startTime) + 30}:00`;

    // ✅ CHECK 1: Provider availability
    const availability = await prisma.providerAvailability.findFirst({
      where: {
        providerId,
        dayOfWeek,
        isAvailable: true,
        startTime: {
          lte: normalizedStartTime,
        },
        endTime: {
          gte: normalizedEndTime,
        },
      },
    });

    if (!availability) {
      console.log("❌ No availability found for:", { providerId, dayOfWeek, startTime: normalizedStartTime });
      return res.status(400).json({
        message: "Provider is not available at this time. Please check their schedule.",
      });
    }

    // ✅ CHECK 2: Double booking
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        providerId,
        appointmentDate: parsedDate,
        startTime: normalizedStartTime,
        status: {
          notIn: ["CANCELLED"],
        },
      },
    });

    if (existingAppointment) {
      return res.status(400).json({
        message: "Provider already has an appointment at this exact time",
      });
    }

    // ✅ CHECK 3: Overlapping appointments
    const overlappingAppointment = await prisma.appointment.findFirst({
      where: {
        providerId,
        appointmentDate: parsedDate,
        status: {
          notIn: ["CANCELLED"],
        },
        OR: [
          {
            startTime: {
              lte: normalizedStartTime,
            },
            endTime: {
              gt: normalizedStartTime,
            },
          },
          {
            startTime: {
              lt: normalizedEndTime,
            },
            endTime: {
              gte: normalizedEndTime,
            },
          },
          {
            startTime: {
              gte: normalizedStartTime,
            },
            endTime: {
              lte: normalizedEndTime,
            },
          },
        ],
      },
    });

    if (overlappingAppointment) {
      return res.status(400).json({
        message: "Provider has an overlapping appointment at this time",
      });
    }

    // ✅ Create appointment
       // ✅ Create appointment AND linked consultation record
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        providerId,
        appointmentDate: parsedDate,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        reason: reason || "",
        type: type || "VIRTUAL",
        status: "PENDING",
        consultation: {
          create: {
            providerId,
            patientId: patient.id,
            consultationDate: parsedDate,
          },
        },
      },
      include: {
        consultation: true,
      },
    });

    // ✅ Create notifications
    await prisma.notification.create({
      data: {
        userId: provider.userId,
        title: "New Appointment Booked",
        message: `New appointment booked with ${patient.firstName} ${patient.lastName} on ${parsedDate.toLocaleDateString()} at ${normalizedStartTime}`,
        type: "APPOINTMENT_BOOKED",
      },
    });

    await prisma.notification.create({
      data: {
        userId: patient.userId,
        patientId: patient.id,
        title: "Appointment Booked",
        message: `Your appointment with Dr. ${provider.firstName} ${provider.lastName} has been booked for ${parsedDate.toLocaleDateString()} at ${normalizedStartTime}`,
        type: "APPOINTMENT_BOOKED",
      },
    });
        // ✅ Notify all nurses that an appointment has been scheduled
    const allNurses = await prisma.nurse.findMany({
      select: { userId: true },
    });
    for (const n of allNurses) {
      await prisma.notification.create({
        data: {
          userId: n.userId,
          patientId: patient.id,
          title: "Appointment Booked",
          message: `${patient.firstName} ${patient.lastName} booked an appointment with Dr. ${provider.firstName} ${provider.lastName} on ${parsedDate.toLocaleDateString()} at ${normalizedStartTime}.`,
          type: "APPOINTMENT_BOOKED",
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        message: "This time slot is already booked. Please select another time.",
      });
    }
    
    res.status(500).json({
      message: "Failed to book appointment",
      error: error.message,
    });
  }
};
// ============= CANCEL APPOINTMENT =============
const cancelAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const appointment = await prisma.appointment.update({
      where: {
        id,
        patientId: patient.id,
      },
      data: {
        status: "CANCELLED",
        cancellationReason: reason || "Cancelled by patient",
        cancelledAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({
      message: "Failed to cancel appointment",
      error: error.message,
    });
  }
};

// ============= GET AVAILABLE PROVIDERS =============
// ============= GET AVAILABLE PROVIDERS =============
const getAvailableProviders = async (req, res) => {
  try {
    const { specialty, date } = req.query;

    const whereClause = {};

    if (specialty && specialty !== "all") {
      whereClause.specialty = specialty;
    }

    const providers = await prisma.provider.findMany({
      where: whereClause,
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

    // ✅ Format response with safe access
    const formattedProviders = providers.map((p) => {
      // ✅ Safe access for permittedRegions
      let location = "N/A";
      if (p.permittedRegions && Array.isArray(p.permittedRegions) && p.permittedRegions.length > 0) {
        location = p.permittedRegions[0];
      }

      // Get unique times from availability
      const times = p.availability.map((a) => a.startTime);
      const uniqueTimes = [...new Set(times)];

      // ✅ Sort times
      uniqueTimes.sort();

      return {
        id: p.id,
        name: `Dr. ${p.firstName} ${p.lastName}`,
        specialty: p.specialty || "General",
        location: location,
        rating: p.rating || 4.5,
        experience: p.experienceYears || 5,
        consultationFee: p.consultationFee || 0,
        image: p.user?.profileImage || null,
        times: uniqueTimes,
        availableTimes: p.availability.map((a) => ({
          day: a.dayOfWeek,
          start: a.startTime,
          end: a.endTime,
        })),
        hasAvailability: p.availability.length > 0,
      };
    });

    // ✅ Filter providers with availability
    const availableProviders = formattedProviders.filter(p => p.hasAvailability);

    res.json({
      success: true,
      data: availableProviders,
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

// ============= GET PRESCRIPTIONS =============
const getPrescriptions = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const whereClause = {
      patientId: patient.id,
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        provider: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        consultation: {
          select: {
            consultationDate: true,
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
    console.error("Get prescriptions error:", error);
    res.status(500).json({
      message: "Failed to get prescriptions",
      error: error.message,
    });
  }
};

// ============= REQUEST PRESCRIPTION REFILL =============
const requestRefill = async (req, res) => {
  try {
    const userId = req.userId;
    const { prescriptionId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if prescription exists and belongs to patient
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        patientId: patient.id,
        status: "ACTIVE",
      },
    });

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found or not active",
      });
    }

    if (prescription.refillsLeft <= 0) {
      return res.status(400).json({
        message: "No refills left for this prescription",
      });
    }

    // Create refill request
    const refillRequest = await prisma.refillRequest.create({
      data: {
        prescriptionId: prescription.id,
        patientId: patient.id,
        status: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      message: "Refill request submitted successfully",
      data: refillRequest,
    });
  } catch (error) {
    console.error("Request refill error:", error);
    res.status(500).json({
      message: "Failed to request refill",
      error: error.message,
    });
  }
};

// ============= GET MEDICAL RECORDS =============
const getMedicalRecords = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.query;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const whereClause = {
      patientId: patient.id,
    };

    if (type) {
      whereClause.recordType = type;
    }

    const records = await prisma.medicalRecord.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
    });

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("Get medical records error:", error);
    res.status(500).json({
      message: "Failed to get medical records",
      error: error.message,
    });
  }
};

// ============= GET NOTIFICATIONS =============
const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { unread } = req.query;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const whereClause = {
      patientId: patient.id,
    };

    if (unread === "true") {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      message: "Failed to get notifications",
      error: error.message,
    });
  }
};

// ============= MARK NOTIFICATION AS READ =============
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const notification = await prisma.notification.update({
      where: {
        id,
        patientId: patient.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Mark notification error:", error);
    res.status(500).json({
      message: "Failed to mark notification",
      error: error.message,
    });
  }
};

// ============= MARK ALL NOTIFICATIONS AS READ =============
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await prisma.notification.updateMany({
      where: {
        patientId: patient.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications error:", error);
    res.status(500).json({
      message: "Failed to mark all notifications",
      error: error.message,
    });
  }
};

// ============= GET INVOICES =============
const getInvoices = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const whereClause = {
      patientId: patient.id,
    };

    if (status) {
      whereClause.paymentStatus = status.toUpperCase();
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        consultation: {
          select: {
            consultationDate: true,
            provider: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({
      message: "Failed to get invoices",
      error: error.message,
    });
  }
};



// ============= HELPER: Generate Time Slots =============
const generateTimeSlots = (startTime, endTime, durationMinutes) => {
  const slots = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + durationMinutes <= end) {
    const slotStartH = Math.floor(current / 60);
    const slotStartM = current % 60;
    const slotEndTotal = current + durationMinutes;
    const slotEndH = Math.floor(slotEndTotal / 60);
    const slotEndM = slotEndTotal % 60;

    slots.push({
      start: `${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}`,
      end: `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}`,
    });

    current = slotEndTotal;
  }

  return slots;
};

// yah add kia meay 

// ============= GET PROVIDER SLOTS FOR A DATE =============
const getProviderSlots = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { date } = req.query;

    if (!providerId || !date) {
      return res.status(400).json({
        message: "Provider ID and date are required",
      });
    }

    // Parse date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const dayOfWeek = parsedDate.getDay();

    // Get provider's availability for this day
    const availability = await prisma.providerAvailability.findMany({
      where: {
        providerId,
        dayOfWeek,
        isAvailable: true,
      },
    });

    if (availability.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No availability on this day",
      });
    }

    // ✅ Generate slots from availability
    let allSlots = [];
    for (const avail of availability) {
      const slots = generateTimeSlots(
        avail.startTime,
        avail.endTime,
        avail.slotDuration || 30
      );
      allSlots.push(...slots);
    }

    // ✅ Remove duplicates (by start time)
    const uniqueSlots = [];
    const seen = new Set();
    for (const slot of allSlots) {
      if (!seen.has(slot.start)) {
        seen.add(slot.start);
        uniqueSlots.push(slot);
      }
    }

    // ✅ Sort by start time
    uniqueSlots.sort((a, b) => a.start.localeCompare(b.start));

    // ✅ Get existing appointments for this date (exclude cancelled)
    const appointments = await prisma.appointment.findMany({
      where: {
        providerId,
        appointmentDate: parsedDate,
        status: {
          notIn: ["CANCELLED"],
        },
      },
      select: {
        startTime: true,
        status: true,
      },
    });

    const bookedTimes = new Map(
      appointments.map((a) => [a.startTime, a.status])
    );

    // ✅ Attach status to each slot
    const slotsWithStatus = uniqueSlots.map((slot) => ({
      time: slot.start,
      endTime: slot.end,
      status: bookedTimes.has(slot.start) ? "booked" : "available",
    }));

    res.json({
      success: true,
      data: slotsWithStatus,
    });
  } catch (error) {
    console.error("Get provider slots error:", error);
    res.status(500).json({
      message: "Failed to get slots",
      error: error.message,
    });
  }
};

module.exports = {
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
  getProviderSlots,
};