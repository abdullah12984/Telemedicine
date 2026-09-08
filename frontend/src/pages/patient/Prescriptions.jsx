import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Pill,
  Calendar,
  Clock,
  Stethoscope,
  RefreshCw,
  Eye,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPrescriptions, requestRefill } from "../../services/patientService";

const Prescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [refillingId, setRefillingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMedication, setFilterMedication] = useState("all");

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getPrescriptions();
        setPrescriptions(response.data || []);
      } catch (error) {
        console.error('Failed to load prescriptions:', error);
        setError(error.message || 'Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  // Filter prescriptions based on active tab, search, and medication filter
  useEffect(() => {
    let result = prescriptions;
    
    // Filter by tab
    if (activeTab === "active") {
      result = result.filter(p => p.status === "ACTIVE");
    } else if (activeTab === "completed") {
      result = result.filter(p => p.status === "COMPLETED");
    } else if (activeTab === "expired") {
      result = result.filter(p => p.status === "EXPIRED" || p.status === "CANCELLED");
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.medication?.toLowerCase().includes(term) ||
        p.dosage?.toLowerCase().includes(term) ||
        p.provider?.firstName?.toLowerCase().includes(term) ||
        p.provider?.lastName?.toLowerCase().includes(term)
      );
    }

    // Filter by medication type (if implemented)
    if (filterMedication !== "all") {
      // This would filter by medication category if you have that data
    }
    
    setFilteredPrescriptions(result);
  }, [prescriptions, activeTab, searchTerm, filterMedication]);

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      ACTIVE: { label: "Active", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
      COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle },
      EXPIRED: { label: "Expired", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
      CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-700 border-gray-200", icon: XCircle },
    };
    return statusMap[status] || statusMap.ACTIVE;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle refill request
  const handleRefillRequest = async (prescriptionId) => {
    setRefillingId(prescriptionId);
    setError("");
    setSuccess("");
    
    try {
      await requestRefill(prescriptionId);
      setSuccess("Refill request submitted successfully!");
      
      // Refresh prescriptions
      const response = await getPrescriptions();
      setPrescriptions(response.data || []);
    } catch (error) {
      setError(error.message || 'Failed to request refill. Please try again.');
    } finally {
      setRefillingId(null);
    }
  };

  // Handle view details
  const handleViewDetails = (prescriptionId) => {
    navigate(`/dashboard/patient/prescriptions/${prescriptionId}`);
  };

  // Get unique medications for filter
  const getUniqueMedications = () => {
    const meds = prescriptions.map(p => p.medication).filter(Boolean);
    return [...new Set(meds)];
  };

  // Get counts for tabs
  const getTabCount = (status) => {
    if (status === "active") {
      return prescriptions.filter(p => p.status === "ACTIVE").length;
    } else if (status === "completed") {
      return prescriptions.filter(p => p.status === "COMPLETED").length;
    } else if (status === "expired") {
      return prescriptions.filter(p => p.status === "EXPIRED" || p.status === "CANCELLED").length;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">My Prescriptions</h2>
            <p className="text-green-100 mt-1">View and manage your medications</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-white/20 text-white border-0 px-4 py-2">
              <Pill className="h-4 w-4 mr-1" />
              {prescriptions.filter(p => p.status === "ACTIVE").length} Active
            </Badge>
            <Badge className="bg-white/10 text-white border-0 px-4 py-2">
              {prescriptions.length} Total
            </Badge>
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

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by medication, dosage, or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterMedication} onValueChange={setFilterMedication}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Medications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Medications</SelectItem>
                  {getUniqueMedications().map((med) => (
                    <SelectItem key={med} value={med}>{med}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="relative">
            Active
            {getTabCount("active") > 0 && (
              <Badge className="ml-2 bg-green-100 text-green-700 border-0">
                {getTabCount("active")}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {getTabCount("completed") > 0 && (
              <Badge className="ml-2 bg-blue-100 text-blue-700 border-0">
                {getTabCount("completed")}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired
            {getTabCount("expired") > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-700 border-0">
                {getTabCount("expired")}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="pt-6">
              {filteredPrescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <Pill className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No {activeTab} prescriptions found</p>
                  {activeTab === "active" && (
                    <p className="text-sm text-gray-400 mt-1">
                      Your active prescriptions will appear here
                    </p>
                  )}
                  {(searchTerm || filterMedication !== "all") && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterMedication("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPrescriptions.map((prescription) => {
                    const status = getStatusBadge(prescription.status);
                    const StatusIcon = status.icon;
                    
                    return (
                      <div
                        key={prescription.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-green-200"
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="bg-green-100 p-3 rounded-full">
                              <Pill className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {prescription.medication}
                                </h3>
                                <Badge className={status.className}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status.label}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600">
                                {prescription.dosage} - {prescription.frequency}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Stethoscope className="h-4 w-4" />
                                  {prescription.provider?.firstName} {prescription.provider?.lastName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(prescription.prescribedDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="h-4 w-4" />
                                  {prescription.refillsLeft} refills left
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Valid until: {formatDate(prescription.validUntil)}
                                </span>
                              </div>

                              {prescription.instructions && (
                                <p className="text-sm text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                                  <span className="font-medium">Instructions:</span> {prescription.instructions}
                                </p>
                              )}

                              {prescription.quantity && (
                                <p className="text-sm text-gray-500">
                                  <span className="font-medium">Quantity:</span> {prescription.quantity} tablets
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4 md:mt-0">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(prescription.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            
                            {prescription.status === "ACTIVE" && prescription.refillsLeft > 0 && (
                              <Button 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleRefillRequest(prescription.id)}
                                disabled={refillingId === prescription.id}
                              >
                                {refillingId === prescription.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Requesting...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Request Refill
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {prescription.status === "ACTIVE" && prescription.refillsLeft === 0 && (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                No Refills Left
                              </Badge>
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
                {prescriptions.filter(p => p.status === "EXPIRED" || p.status === "CANCELLED").length}
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

      {/* Refill History / Recent Activity */}
      {prescriptions.some(p => p.refillRequests?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Recent Refill Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prescriptions
                .filter(p => p.refillRequests?.length > 0)
                .slice(0, 3)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{p.medication}</p>
                      <p className="text-sm text-gray-500">
                        Last refill: {formatDateTime(p.refillRequests?.[0]?.createdAt)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {p.refillRequests?.[0]?.status || "PENDING"}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action */}
      <div className="flex justify-end">
        <Button 
          variant="outline"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={() => navigate("/dashboard/patient/symptoms")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Need a New Prescription?
        </Button>
      </div>
    </div>
  );
};

export default Prescriptions;