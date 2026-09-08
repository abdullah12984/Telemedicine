import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Video,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  Phone,
  MapPin,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAppointments, cancelAppointment } from "../../services/patientService";

const MyAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const response = await getAppointments();
        setAppointments(response.data || []);
        setFilteredAppointments(response.data || []);
      } catch (error) {
        setError(error.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  // Filter appointments based on tab
  useEffect(() => {
    let result = appointments;
    
    if (activeTab === "upcoming") {
      result = result.filter(
        (apt) => apt.status === "PENDING" || apt.status === "CONFIRMED"
      );
    } else if (activeTab === "past") {
      result = result.filter(
        (apt) => apt.status === "COMPLETED" || apt.status === "CANCELLED"
      );
    }
    
    setFilteredAppointments(result);
  }, [appointments, activeTab]);

  const getStatusBadge = (status) => {
    const statusMap = {
      CONFIRMED: { label: "Confirmed", className: "bg-green-100 text-green-700", icon: CheckCircle },
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700", icon: Clock },
      COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700", icon: CheckCircle },
      CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700", icon: X },
    };
    return statusMap[status] || statusMap.PENDING;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    setCancellingId(appointmentId);
    try {
      await cancelAppointment(appointmentId, "Cancelled by patient");
      // Refresh appointments
      const response = await getAppointments();
      setAppointments(response.data || []);
      alert("✅ Appointment cancelled successfully");
    } catch (error) {
      alert(error.message || "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Appointments</h2>
            <p className="text-blue-100 mt-1">Manage all your healthcare appointments</p>
          </div>
          <Button
            className="bg-white text-blue-600 hover:bg-blue-50"
            onClick={() => navigate("/dashboard/patient/book")}
          >
            + New Appointment
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming" className="relative">
                Upcoming
                {appointments.filter(
                  (a) => a.status === "PENDING" || a.status === "CONFIRMED"
                ).length > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-700 border-0">
                    {appointments.filter(
                      (a) => a.status === "PENDING" || a.status === "CONFIRMED"
                    ).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No {activeTab} appointments found</p>
              {activeTab === "upcoming" && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/dashboard/patient/book")}
                >
                  Book Your First Appointment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const status = getStatusBadge(appointment.status);
                const StatusIcon = status.icon;

                return (
                  <div
                    key={appointment.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Stethoscope className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">
                            {appointment.provider}
                          </h3>
                          <Badge className={status.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {appointment.specialty}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(appointment.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointment.time}
                          </span>
                          <span className="flex items-center gap-1">
                            {appointment.type === "VIRTUAL" ? (
                              <Video className="h-4 w-4 text-blue-500" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                            {appointment.location}
                          </span>
                        </div>
                        {appointment.reason && (
                          <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">Reason:</span>{" "}
                            {appointment.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                      {(appointment.status === "CONFIRMED" ||
                        appointment.status === "PENDING") && (
                        <>
                          {appointment.type === "VIRTUAL" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                navigate(
                                  `/dashboard/patient/consultation/${appointment.id}`
                                )
                              }
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Join Now
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() =>
                              navigate("/dashboard/patient/book", {
                                state: { appointment },
                              })
                            }
                          >
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={cancellingId === appointment.id}
                          >
                            {cancellingId === appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Cancel"
                            )}
                          </Button>
                        </>
                      )}
                      {appointment.status === "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/dashboard/patient/consultation/${appointment.id}/details`
                            )
                          }
                        >
                          View Details
                        </Button>
                      )}
                      {appointment.status === "CANCELLED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="text-gray-400"
                        >
                          Cancelled
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">
            {appointments.filter((a) => a.status === "CONFIRMED").length}
          </p>
          <p className="text-sm text-gray-600">Confirmed</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {appointments.filter((a) => a.status === "PENDING").length}
          </p>
          <p className="text-sm text-gray-600">Pending</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">
            {appointments.filter((a) => a.status === "COMPLETED").length}
          </p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">
            {appointments.filter((a) => a.status === "CANCELLED").length}
          </p>
          <p className="text-sm text-gray-600">Cancelled</p>
        </div>
      </div>
    </div>
  );
};

export default MyAppointments;