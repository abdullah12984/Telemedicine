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
  ClipboardList,
  Loader2,
  User,
  Calendar,
  Clock,
  Activity,
  Eye
} from "lucide-react";
import { getNurseCases } from "../../services/nurseService";

const NurseCases = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const response = await getNurseCases(statusFilter);
        setCases(response.data || []);
        setFilteredCases(response.data || []);
      } catch (error) {
        console.error('Failed to load cases:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [statusFilter]);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Cases</h2>
            <p className="text-purple-100 mt-1">All triage cases handled by you</p>
          </div>
          <Badge className="bg-white/20 text-white border-0 px-4 py-2">
            {filteredCases.length} Cases
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No cases found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCases.map((case_) => (
                <div
                  key={case_.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-purple-200"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-full ${getPriorityColor(case_.severity)}`}>
                        <Activity className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            {case_.patient?.firstName} {case_.patient?.lastName}
                          </h3>
                          <Badge className={getPriorityColor(case_.severity)}>
                            {case_.severity}
                          </Badge>
                          <Badge className={getStatusColor(case_.status)}>
                            {case_.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(case_.createdAt)}
                          </span>
                          {case_.assignedProvider && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <User className="h-4 w-4" />
                              Dr. {case_.assignedProvider.firstName} {case_.assignedProvider.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/nurse/triage/${case_.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NurseCases;