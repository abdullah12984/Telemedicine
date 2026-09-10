import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import MyAppointments from "./pages/patient/MyAppointments";
import SubmitSymptoms from "./pages/patient/SubmitSymptoms";
import TriageStatus from "./pages/patient/TriageStatus";
import PatientProfile from "./pages/patient/PatientProfile";
import MedicalRecords from "./pages/patient/MedicalRecords";
import Prescriptions from "./pages/patient/Prescriptions";
import PatientConsultationRoom from "./pages/patient/PatientConsultationRoom";
// Provider Pages
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProviderAppointments from "./pages/provider/ProviderAppointments";
import ProviderPatients from "./pages/provider/ProviderPatients";
import ProviderPatientDetails from "./pages/provider/ProviderPatientDetails";
import ProviderConsultations from "./pages/provider/ProviderConsultations";
import ProviderPrescriptions from "./pages/provider/ProviderPrescriptions";
import ProviderAvailability from "./pages/provider/ProviderAvailability";
import ProviderProfile from "./pages/provider/ProviderProfile";
import ProviderCreatePrescription from "./pages/provider/ProviderCreatePrescription";
import ProviderConsultationDetails from "./pages/provider/ProviderConsultationDetails";
import ProviderConsultationRoom from "./pages/provider/ProviderConsultationRoom";
// Nurse Pages
import NurseDashboard from "./pages/nurse/NurseDashboard";
import NurseTriageQueue from "./pages/nurse/NurseTriageQueue";
import NurseTriageDetails from "./pages/nurse/NurseTriageDetails";
import NursePatients from "./pages/nurse/NursePatients";
import NurseCases from "./pages/nurse/NurseCases";
import NurseProfile from "./pages/nurse/NurseProfile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAnalytics from "./pages/admin/AdminAnalytics";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Route>

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/patient" />} />
          
          {/* Patient Routes */}
          <Route path="patient" element={<PatientDashboard />} />
          <Route path="patient/book" element={<BookAppointment />} />
          <Route path="patient/appointments" element={<MyAppointments />} />
          <Route path="patient/symptoms" element={<SubmitSymptoms />} />
          <Route path="patient/triage-status" element={<TriageStatus />} />
          <Route path="patient/profile" element={<PatientProfile />} />
          <Route path="patient/records" element={<MedicalRecords />} />
          <Route path="patient/prescriptions" element={<Prescriptions />} />
          <Route
  path="patient/consultation/:consultationId"
  element={<PatientConsultationRoom />}
/>
          {/* Provider Routes */}
          <Route path="provider" element={<ProviderDashboard />} />
          <Route path="provider/appointments" element={<ProviderAppointments />} />
          <Route path="provider/patients" element={<ProviderPatients />} />
          <Route path="provider/patients/:patientId" element={<ProviderPatientDetails />} />
          <Route path="provider/consultations" element={<ProviderConsultations />} />
          <Route path="provider/prescriptions" element={<ProviderPrescriptions />} />
          <Route path="provider/availability" element={<ProviderAvailability />} />
          <Route path="provider/profile" element={<ProviderProfile />} />
          <Route path="provider/create-prescription/:consultationId" element={<ProviderCreatePrescription />} />
          <Route path="provider/consultation/:consultationId/details" element={<ProviderConsultationDetails />} />
          <Route path="provider/consultation/:consultationId" element={<ProviderConsultationRoom />} />
          {/* Nurse Routes */}
           <Route path="nurse" element={<NurseDashboard />} />
          <Route path="nurse/triage" element={<NurseTriageQueue />} />
          <Route path="nurse/triage/:caseId" element={<NurseTriageDetails />} />
          <Route path="nurse/patients" element={<NursePatients />} />
          <Route path="nurse/cases" element={<NurseCases />} />
          <Route path="nurse/profile" element={<NurseProfile />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={<AdminDashboard />} />
<Route path="admin/users" element={<AdminUsers />} />
<Route path="admin/providers" element={<AdminProviders />} />
<Route path="admin/appointments" element={<AdminAppointments />} />
<Route path="admin/settings" element={<AdminSettings />} />
<Route path="admin/analytics" element={<AdminAnalytics />} />


        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
