import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, Stethoscope, FileText, Loader2 } from "lucide-react";
import { getProviderDashboard } from "../../services/providerService";

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: { todayAppointments: 0, totalPatients: 0, pendingPrescriptions: 0, consultationTime: 0 },
    todayAppointments: [],
  });
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("Dr. Smith");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getProviderDashboard();
        if (response.success) {
          setDashboardData(response.data);
          setDoctorName(`Dr. ${response.data.provider?.lastName || 'Smith'}`);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold">Welcome, {doctorName}!</h2>
        <p className="text-green-100 mt-1">
          {dashboardData.stats?.todayAppointments > 0
            ? `You have ${dashboardData.stats.todayAppointments} patients waiting for consultation`
            : 'No appointments scheduled for today'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/provider/appointments")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Appointments</p>
                <p className="text-2xl font-bold">{dashboardData.stats?.todayAppointments || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/provider/patients")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Patients</p>
                <p className="text-2xl font-bold">{dashboardData.stats?.totalPatients || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/provider/prescriptions")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Prescriptions</p>
                <p className="text-2xl font-bold">{dashboardData.stats?.pendingPrescriptions || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/provider/availability")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Consultation Time</p>
                <p className="text-2xl font-bold">{dashboardData.stats?.consultationTime || 0} hrs</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.todayAppointments?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No appointments scheduled for today</p>
              </div>
            ) : (
              dashboardData.todayAppointments.map((appointment, index) => (
                <div key={appointment.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Stethoscope className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{appointment.patientName}</p>
                      <p className="text-sm text-gray-600">{appointment.time}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(`/dashboard/provider/consultation/${appointment.id}`)}
                  >
                    Start Consultation
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderDashboard;