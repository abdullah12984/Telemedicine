import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Users,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Search,
  Filter,
  Eye,
  ArrowRight} from "lucide-react";
import { getTriageQueue } from "../../services/nurseService";

const NurseTriageQueue = () => {
  const navigate = useNavigate();
  const [triageCases, setTriageCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTriageQueue = async () => {
      setLoading(true);
      try {
        const response = await getTriageQueue(statusFilter);
        setTriageCases(response.data || []);
        setFilteredCases(response.data || []);
      } catch (error) {
        setError(error.message || 'Failed to load triage queue');
      } finally {
        setLoading(false);
      }
    };
    fetchTriageQueue();
  }, [statusFilter]);

  useEffect(() => {
    let result = triageCases;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.patient?.firstName?.toLowerCase().includes(term) ||
        c.patient?.lastName?.toLowerCase().includes(term) ||
        c.symptomDetails?.toLowerCase().includes(term)
      );
    }
    setFilteredCases(result);
  }, [searchTerm, triageCases]);

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

  const getPriorityIcon = (priority) => {
    const icons = {
      LOW: <Activity className="h-4 w-4" />,
      MEDIUM: <Clock className="h-4 w-4" />,
      HIGH: <AlertCircle className="h-4 w-4" />,
      URGENT: <AlertCircle className="h-4 w-4" />,
    };
    return icons[priority] || icons.MEDIUM;
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
            <h2 className="text-2xl font-bold">Triage Queue</h2>
            <p className="text-purple-100 mt-1">Manage patient triage cases</p>
          </div>
          <Badge className="bg-white/20 text-white border-0 px-4 py-2">
            {filteredCases.length} Cases
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by patient name or symptoms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
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
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No triage cases found</p>
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
                        {getPriorityIcon(case_.severity)}
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
                          <Badge variant="outline" className="text-xs">
                            Score: {case_.priorityScore || 0}
                          </Badge>
                        </div>
                        {case_.symptomDetails && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {case_.symptomDetails}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Submitted: {new Date(case_.createdAt).toLocaleString()}
                          </span>
                          {case_.waitTime > 0 && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="h-4 w-4" />
                              Waiting: {case_.waitTime} min
                            </span>
                          )}
                          {case_.assignedProvider && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <User className="h-4 w-4" />
                              Dr. {case_.assignedProvider.firstName} {case_.assignedProvider.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/dashboard/nurse/triage/${case_.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                      {case_.status === "PENDING" && (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => navigate(`/dashboard/nurse/triage/${case_.id}`)}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Process
                        </Button>
                      )}
                    </div>
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

export default NurseTriageQueue;