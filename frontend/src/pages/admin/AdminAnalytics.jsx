import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Users,
  Calendar,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  Download,
  Eye,
  Stethoscope,
  UserCheck,
  UserX,
  DollarSign,
  PieChart,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAdminDashboard } from "../../services/adminService";

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("week");
  const [data, setData] = useState({
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
    recentAppointments: [],
    providerUtilization: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getAdminDashboard();
        setData(response.data);
      } catch (error) {
        setError(error.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // Calculate percentages
  const totalAppts = data.stats?.totalAppointments || 1;
  const pendingPercent = Math.round(((data.stats?.pendingAppointments || 0) / totalAppts) * 100);
  const confirmedPercent = Math.round(((data.stats?.confirmedAppointments || 0) / totalAppts) * 100);
  const completedPercent = Math.round(((data.stats?.completedAppointments || 0) / totalAppts) * 100);
  const cancelledPercent = Math.round(((data.stats?.cancelledAppointments || 0) / totalAppts) * 100);

  // Role distribution
  const totalUsers = data.stats?.totalUsers || 1;
  const patientPercent = Math.round(((data.stats?.totalPatients || 0) / totalUsers) * 100);
  const providerPercent = Math.round(((data.stats?.totalProviders || 0) / totalUsers) * 100);
  const nursePercent = Math.round(((data.stats?.totalNurses || 0) / totalUsers) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            <p className="text-blue-100 mt-1">System insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36 bg-white/10 text-white border-white/20">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.stats?.totalUsers || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Appointments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.stats?.totalAppointments || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>+8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Consultations</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.stats?.todayConsultations || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
              <TrendingDown className="h-4 w-4" />
              <span>-3% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">No-Show Rate</p>
                <p className="text-2xl font-bold text-red-600">
                  {data.stats?.noShowRate || 0}%
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
              <TrendingDown className="h-4 w-4" />
              <span>-2% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Status Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Appointment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pending</span>
                  <span>{data.stats?.pendingAppointments || 0} ({pendingPercent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${pendingPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Confirmed</span>
                  <span>{data.stats?.confirmedAppointments || 0} ({confirmedPercent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${confirmedPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Completed</span>
                  <span>{data.stats?.completedAppointments || 0} ({completedPercent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${completedPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Cancelled</span>
                  <span>{data.stats?.cancelledAppointments || 0} ({cancelledPercent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${cancelledPercent}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Patients</span>
                  <span>{data.stats?.totalPatients || 0} ({patientPercent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${patientPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Providers</span>
                  <span>{data.stats?.totalProviders || 0} ({providerPercent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${providerPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Nurses</span>
                  <span>{data.stats?.totalNurses || 0} ({nursePercent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${nursePercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Admins</span>
                  <span>1</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `1%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
              Provider Utilization
            </span>
            <Badge variant="outline">
              {data.providerUtilization?.length || 0} Providers
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.providerUtilization?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No provider data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.providerUtilization?.map((provider, index) => {
                const maxAppointments = Math.max(
                  ...(data.providerUtilization?.map(p => p.appointments) || [1])
                );
                const percentage = Math.round((provider.appointments / maxAppointments) * 100);
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{provider.name}</span>
                      <span>{provider.appointments} patients</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
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
              View All <Eye className="h-4 w-4 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentAppointments?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentAppointments?.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{appointment.patient}</p>
                    <p className="text-sm text-gray-500">
                      {appointment.provider} • {new Date(appointment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    className={
                      appointment.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : appointment.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : appointment.status === "COMPLETED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;