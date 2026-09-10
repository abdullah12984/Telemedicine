import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pill,
  Loader2,
  Calendar,
  User,
  Stethoscope,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getProviderPrescriptions, updatePrescriptionStatus } from "../../services/providerService";

const ProviderPrescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const response = await getProviderPrescriptions();
        setPrescriptions(response.data || []);
        setFilteredPrescriptions(response.data || []);
      } catch (error) {
        setError(error.message || "Failed to load prescriptions");
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    let result = prescriptions;
    if (activeTab === "active") {
      result = result.filter(p => p.status === "ACTIVE");
    } else if (activeTab === "completed") {
      result = result.filter(p => p.status === "COMPLETED");
    } else if (activeTab === "expired") {
      result = result.filter(p => p.status === "EXPIRED" || p.status === "CANCELLED");
    }
    setFilteredPrescriptions(result);
  }, [prescriptions, activeTab]);

  const getStatusBadge = (status) => {
    const statusMap = {
      ACTIVE: { label: "Active", className: "bg-green-100 text-green-700" },
      COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700" },
      EXPIRED: { label: "Expired", className: "bg-red-100 text-red-700" },
      CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-700" },
    };
    return statusMap[status] || statusMap.ACTIVE;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleStatusUpdate = async (prescriptionId, newStatus) => {
    setUpdatingId(prescriptionId);
    setError("");
    setSuccess("");
    try {
      await updatePrescriptionStatus(prescriptionId, newStatus);
      setSuccess(`Prescription ${newStatus.toLowerCase()} successfully`);
      const response = await getProviderPrescriptions();
      setPrescriptions(response.data || []);
    } catch (error) {
      setError(error.message || "Failed to update prescription");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreatePrescription = (consultationId) => {
    navigate(`/dashboard/provider/create-prescription/${consultationId}`);
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
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Prescriptions</h2>
            <p className="text-purple-100 mt-1">Manage all your prescriptions</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-0 px-4 py-2">
              {prescriptions.filter(p => p.status === "ACTIVE").length} Active
            </Badge>
            <Button
              className="bg-white text-purple-600 hover:bg-purple-50"
              size="sm"
              onClick={() => navigate("/dashboard/provider/consultations")}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Prescription
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="pt-6">
              {filteredPrescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <Pill className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No {activeTab} prescriptions</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/dashboard/provider/consultations")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Prescription
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPrescriptions.map((prescription) => {
                    const status = getStatusBadge(prescription.status);
                    return (
                      <div
                        key={prescription.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="bg-purple-100 p-3 rounded-full">
                              <Pill className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">
                                  {prescription.medication}
                                </h3>
                                <Badge className={status.className}>
                                  {status.label}
                                </Badge>
                                {prescription.refillRequests?.length > 0 && (
                                  <Badge className="bg-yellow-100 text-yellow-700">
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Refill Requested
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {prescription.dosage} - {prescription.frequency}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {prescription.patient?.firstName}{" "}
                                  {prescription.patient?.lastName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(prescription.prescribedDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="h-4 w-4" />
                                  {prescription.refillsLeft} refills left
                                </span>
                              </div>
                              {prescription.instructions && (
                                <p className="text-sm text-gray-500 mt-1">
                                  <span className="font-medium">
                                    Instructions:
                                  </span>{" "}
                                  {prescription.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4 md:mt-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(
                                  `/dashboard/provider/prescriptions/${prescription.id}`
                                )
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {prescription.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() =>
                                  handleStatusUpdate(prescription.id, "COMPLETED")
                                }
                                disabled={updatingId === prescription.id}
                              >
                                {updatingId === prescription.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                )}
                                Complete
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
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {prescriptions.filter(p => p.status === "ACTIVE").length}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {prescriptions.filter(p => p.status === "COMPLETED").length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {prescriptions.filter(p => p.status === "EXPIRED").length}
              </p>
              <p className="text-sm text-gray-600">Expired</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {prescriptions.reduce((sum, p) => sum + (p.refillsLeft || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total Refills Available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ✅ CORRECT EXPORT
export default ProviderPrescriptions;