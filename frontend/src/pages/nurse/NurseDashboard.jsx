import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Clock, ClipboardList, AlertCircle, Loader2, User, Calendar, ArrowRight } from "lucide-react";
import { getNurseDashboard } from "../../services/nurseService";

const NurseDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    nurse: { firstName: '', lastName: '', department: '' },
    stats: { waitingPatients: 0, inProgress: 0, assigned: 0, highPriority: 0, avgWaitTime: 0 },
    recentCases: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await getNurseDashboard();
        setDashboardData(response.data);
      } catch (error) {
        setError(error.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-green-100 text-green-700",
      MEDIUM: "bg-yellow-100 text-yellow-700",
      HIGH: "bg-orange-100 text-orange-700",
      URGENT: "bg-red-100 text-red-700",
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      ASSIGNED: "bg-purple-100 text-purple-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    return colors[status] || colors.PENDING;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Welcome, {dashboardData.nurse?.firstName || 'Nurse'}!
            </h2>
            <p className="text-purple-100 mt-1">
              {dashboardData.stats?.waitingPatients > 0
                ? `${dashboardData.stats.waitingPatients} patients waiting in triage queue`
                : 'No patients waiting in triage queue'}
            </p>
            {dashboardData.nurse?.department && (
              <p className="text-purple-100 text-sm mt-1">
                Department: {dashboardData.nurse.department}
              </p>
            )}
          </div>
          <Badge className="bg-white/20 text-white border-0 px-4 py-2">
            <Activity className="h-4 w-4 mr-1" />
            On Duty
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/dashboard/nurse/triage")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Waiting Patients</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.stats?.waitingPatients || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.stats?.inProgress || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Wait Time</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData.stats?.avgWaitTime || 0} min
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboardData.stats?.highPriority || 0}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Triage Cases</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/dashboard/nurse/triage")}
            >
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.recentCases?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent triage cases</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentCases.map((case_) => (
                <div
                  key={case_.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-purple-200"
                  onClick={() => navigate(`/dashboard/nurse/triage/${case_.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${getPriorityColor(case_.severity)}`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{case_.patientName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge className={getPriorityColor(case_.severity)}>
                          {case_.severity}
                        </Badge>
                        <Badge className={getStatusColor(case_.status)}>
                          {case_.status}
                        </Badge>
                        {case_.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {case_.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          className="h-24 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700"
          onClick={() => navigate("/dashboard/nurse/triage")}
        >
          <Activity className="h-6 w-6" />
          <span>Triage Queue</span>
        </Button>
        <Button 
          className="h-24 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate("/dashboard/nurse/patients")}
        >
          <Users className="h-6 w-6" />
          <span>Patients</span>
        </Button>
        <Button 
          className="h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => navigate("/dashboard/nurse/cases")}
        >
          <ClipboardList className="h-6 w-6" />
          <span>My Cases</span>
        </Button>
        <Button 
          className="h-24 flex flex-col gap-2 bg-orange-600 hover:bg-orange-700"
          onClick={() => navigate("/dashboard/nurse/profile")}
        >
          <User className="h-6 w-6" />
          <span>Profile</span>
        </Button>
      </div>
    </div>
  );
};

export default NurseDashboard;