import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Pill, FileText, Stethoscope, Loader2 } from "lucide-react";
import { getPatientDashboard } from "../../services/patientService"; // <-- Import from patientService

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    patient: { firstName: '', lastName: '' },
    stats: { upcomingAppointments: 0, activePrescriptions: 0, totalRecords: 0 },
    upcomingAppointments: [],
    triageStatus: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Using patientService
        const response = await getPatientDashboard();
        setDashboardData(response.data);
      } catch (error) {
        setError(error.message || 'Failed to load dashboard');
        if (error.message === 'Unauthorized') {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold">
          Welcome back, {dashboardData.patient?.firstName || 'Patient'}!
        </h2>
        <p className="text-blue-100 mt-1">Your health is our priority</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upcoming Appointments</p>
                <p className="text-2xl font-bold">
                  {dashboardData.stats?.upcomingAppointments || 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Prescriptions</p>
                <p className="text-2xl font-bold">
                  {dashboardData.stats?.activePrescriptions || 0}
                </p>
              </div>
              <Pill className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Medical Records</p>
                <p className="text-2xl font-bold">
                  {dashboardData.stats?.totalRecords || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Triage Status</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.triageStatus?.status || 'None'}
                </p>
              </div>
              <User className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.upcomingAppointments?.length > 0 ? (
              dashboardData.upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{appointment.doctor}</p>
                      <p className="text-sm text-gray-600">{appointment.specialty}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      appointment.status === "CONFIRMED" 
                        ? "bg-green-100 text-green-700" 
                        : appointment.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {appointment.status}
                    </span>
                    <Button variant="outline" size="sm">Join</Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming appointments</p>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => navigate("/dashboard/patient/appointments")}
          >
            View All Appointments
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          className="h-24 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate("/dashboard/patient/book")}
        >
          <Calendar className="h-6 w-6" />
          <span>Book Appointment</span>
        </Button>
        <Button 
          className="h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => navigate("/dashboard/patient/symptoms")}
        >
          <Stethoscope className="h-6 w-6" />
          <span>Submit Symptoms</span>
        </Button>
        <Button 
          className="h-24 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700"
          onClick={() => navigate("/dashboard/patient/prescriptions")}
        >
          <Pill className="h-6 w-6" />
          <span>View Prescriptions</span>
        </Button>
        <Button 
          className="h-24 flex flex-col gap-2 bg-orange-600 hover:bg-orange-700"
          onClick={() => navigate("/dashboard/patient/profile")}
        >
          <User className="h-6 w-6" />
          <span>View Profile</span>
        </Button>
      </div>
    </div>
  );
};

export default PatientDashboard;