import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Activity,
  Settings,
  BarChart3,
  Loader2,
  UserPlus,
  Stethoscope,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { getAdminDashboard } from "../../services/adminService";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    admin: { firstName: "", lastName: "", email: "" },
    stats: {
      totalUsers: 0,
      totalPatients: 0,
      totalProviders: 0,
      totalNurses: 0,
      todayConsultations: 0,
      totalAppointments: 0,
      pendingAppointments: 0,
      confirmedAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      noShowRate: 0,
    },
    recentUsers: [],
    recentAppointments: [],
    providerUtilization: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await getAdminDashboard();
        setDashboardData(response.data);
      } catch (error) {
        setError(error.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      CONFIRMED: { label: "Confirmed", className: "bg-green-100 text-green-700" },
      COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700" },
      CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    };
    return statusMap[status] || statusMap.PENDING;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-3" />
        <p className="text-red-600">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Welcome, {dashboardData.admin?.firstName || "Admin"}!
            </h2>
            <p className="text-gray-300 mt-1">System overview and analytics</p>
          </div>
          <Badge className="bg-white/20 text-white border-0 px-4 py-2">
            <Activity className="h-4 w-4 mr-1" />
            System Online
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/dashboard/admin/users")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.stats?.totalUsers || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/dashboard/admin/appointments")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Consultations</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.stats?.todayConsultations || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/dashboard/admin/appointments")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Appointments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.stats?.totalAppointments || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">No-show Rate</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboardData.stats?.noShowRate || 0}%
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {dashboardData.stats?.pendingAppointments || 0}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">
            {dashboardData.stats?.confirmedAppointments || 0}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-blue-600">
            {dashboardData.stats?.completedAppointments || 0}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">
            {dashboardData.stats?.cancelledAppointments || 0}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Recent Users
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/admin/users")}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentUsers?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No users yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Recent Appointments
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/admin/appointments")}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentAppointments?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No appointments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentAppointments.map((appointment) => {
                  const status = getStatusBadge(appointment.status);
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{appointment.patient}</p>
                        <p className="text-sm text-gray-500">
                          {appointment.provider} • {formatDate(appointment.date)}
                        </p>
                      </div>
                      <Badge className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          className="h-24 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate("/dashboard/admin/users")}
        >
          <Users className="h-6 w-6" />
          <span>Manage Users</span>
        </Button>
        <Button
          className="h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => navigate("/dashboard/admin/providers")}
        >
          <Stethoscope className="h-6 w-6" />
          <span>Providers</span>
        </Button>
        <Button
          className="h-24 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700"
          onClick={() => navigate("/dashboard/admin/appointments")}
        >
          <Calendar className="h-6 w-6" />
          <span>Appointments</span>
        </Button>
        <Button
          className="h-24 flex flex-col gap-2 bg-orange-600 hover:bg-orange-700"
          onClick={() => navigate("/dashboard/admin/settings")}
        >
          <Settings className="h-6 w-6" />
          <span>Settings</span>
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;