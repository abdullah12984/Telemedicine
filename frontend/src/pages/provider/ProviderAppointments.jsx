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
  Calendar,
  Clock,
  User,
  Stethoscope,
  Loader2,
  Search,
  Filter,
  Video,
  CheckCircle,
  XCircle
} from "lucide-react";
import { getProviderAppointments, updateAppointmentStatus } from "../../services/providerService";

const ProviderAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const response = await getProviderAppointments();
        setAppointments(response.data || []);
        setFilteredAppointments(response.data || []);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  useEffect(() => {
    let result = appointments;

    if (statusFilter !== "all") {
      result = result.filter(apt => apt.status === statusFilter.toUpperCase());
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(apt =>
        apt.patient?.firstName?.toLowerCase().includes(term) ||
        apt.patient?.lastName?.toLowerCase().includes(term)
      );
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      result = result.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredAppointments(result);
  }, [appointments, statusFilter, searchTerm, dateFilter]);

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      CONFIRMED: { label: "Confirmed", className: "bg-green-100 text-green-700" },
      COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700" },
      CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    };
    return statusMap[status] || statusMap.PENDING;
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdatingId(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      const response = await getProviderAppointments();
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Appointments</h2>
            <p className="text-green-100 mt-1">Manage all your appointments</p>
          </div>
          <Badge className="bg-white/20 text-white border-0 px-4 py-2">
            {filteredAppointments.length} Appointments
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by patient name..."
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
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
              {dateFilter && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setDateFilter("")}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const status = getStatusBadge(appointment.status);
                return (
                  <div
                    key={appointment.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-green-100 p-3 rounded-full">
                        <User className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </h3>
                          <Badge className={status.className}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(appointment.appointmentDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointment.startTime} - {appointment.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Stethoscope className="h-4 w-4" />
                            {appointment.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                      {(appointment.status === "CONFIRMED" || appointment.status === "PENDING") && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => navigate(`/dashboard/provider/consultation/${appointment.id}`)}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(appointment.id, "COMPLETED")}
                            disabled={updatingId === appointment.id}
                          >
                            {updatingId === appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Complete
                          </Button>
                        </>
                      )}
                      {appointment.status === "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderAppointments;