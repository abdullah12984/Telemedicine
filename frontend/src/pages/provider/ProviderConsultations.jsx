import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Stethoscope,
  Loader2,
  Calendar,
  Clock,
  User,
  FileText,
  Pill,
  Eye,
  AlertCircle,
  CheckCircle,
  Video,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getProviderConsultations } from "../../services/providerService";

const ProviderConsultations = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchConsultations = async () => {
      setLoading(true);
      try {
        const response = await getProviderConsultations();
        setConsultations(response.data || []);
        setFilteredConsultations(response.data || []);
      } catch (error) {
        setError(error.message || "Failed to load consultations");
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, []);

  // Filter consultations based on tab
  useEffect(() => {
    let result = consultations;
    if (activeTab === "pending") {
      result = result.filter(c => c.appointment?.status === "PENDING" || c.appointment?.status === "CONFIRMED");
    } else if (activeTab === "completed") {
      result = result.filter(c => c.appointment?.status === "COMPLETED");
    }
    setFilteredConsultations(result);
  }, [consultations, activeTab]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      CONFIRMED: { label: "Confirmed", className: "bg-green-100 text-green-700" },
      COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700" },
      CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    };
    return statusMap[status] || statusMap.PENDING;
  };

  const handleViewDetails = (consultationId) => {
    navigate(`/dashboard/provider/consultation/${consultationId}/details`);
  };

  const handleCreatePrescription = (consultationId) => {
    navigate(`/dashboard/provider/create-prescription/${consultationId}`);
  };

  const handleStartConsultation = (consultationId) => {
    navigate(`/dashboard/provider/consultation/${consultationId}`);
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
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Consultations</h2>
            <p className="text-purple-100 mt-1">View all your consultations</p>
          </div>
          <Badge className="bg-white/20 text-white border-0 px-4 py-2">
            {consultations.length} Total
          </Badge>
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {consultations.filter(c => c.appointment?.status === "PENDING" || c.appointment?.status === "CONFIRMED").length > 0 && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-700 border-0">
                {consultations.filter(c => c.appointment?.status === "PENDING" || c.appointment?.status === "CONFIRMED").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {consultations.filter(c => c.appointment?.status === "COMPLETED").length > 0 && (
              <Badge className="ml-2 bg-blue-100 text-blue-700 border-0">
                {consultations.filter(c => c.appointment?.status === "COMPLETED").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="pt-6">
              {filteredConsultations.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No consultations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredConsultations.map((consultation) => {
                    const status = getStatusBadge(consultation.appointment?.status);
                    const isCompleted = consultation.appointment?.status === "COMPLETED";
                    const isPending = consultation.appointment?.status === "PENDING" || consultation.appointment?.status === "CONFIRMED";

                    return (
                      <div
                        key={consultation.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-purple-200"
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="bg-purple-100 p-3 rounded-full">
                              <Stethoscope className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">
                                  {consultation.patient?.firstName} {consultation.patient?.lastName}
                                </h3>
                                <Badge className={status.className}>
                                  {status.label}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(consultation.consultationDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatTime(consultation.consultationDate)}
                                </span>
                                {consultation.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Duration: {consultation.duration} min
                                  </span>
                                )}
                                {consultation.patient?.phone && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {consultation.patient.phone}
                                  </span>
                                )}
                              </div>
                              {consultation.diagnosis && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Diagnosis:</span> {consultation.diagnosis}
                                </p>
                              )}
                              {consultation.prescriptions?.length > 0 && (
                                <div className="flex items-center gap-1 text-sm text-purple-600">
                                  <Pill className="h-4 w-4" />
                                  {consultation.prescriptions.length} prescription(s)
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4 md:mt-0 flex-wrap">
                            {/* View Details Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(consultation.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>

                            {/* Start Consultation Button - Only for pending */}
                            {isPending && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleStartConsultation(consultation.id)}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Start Consultation
                              </Button>
                            )}

                            {/* ✅ Create Prescription Button - Only for completed consultations */}
                            {isCompleted && (
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => handleCreatePrescription(consultation.id)}
                              >
                                <Pill className="h-4 w-4 mr-1" />
                                Create Prescription
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {consultations.length}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {consultations.filter(c => c.appointment?.status === "PENDING" || c.appointment?.status === "CONFIRMED").length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {consultations.filter(c => c.appointment?.status === "COMPLETED").length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {consultations.reduce((sum, c) => sum + (c.prescriptions?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total Prescriptions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ); 
};

export default ProviderConsultations;