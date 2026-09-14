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
  FileText,
  Download,
  Eye,
  Calendar,
  Stethoscope,
  Pill,
  FileCheck,
  Loader2,
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
import { getMedicalRecords } from "../../services/patientService";

const MedicalRecords = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const response = await getMedicalRecords();
        setRecords(response.data || []);
        setFilteredRecords(response.data || []);
      } catch (error) {
        console.error('Failed to load records:', error);
        setError(error.message || 'Failed to load medical records');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // Filter records based on search, type, and tab
  useEffect(() => {
    let result = records;

    // Filter by tab (all, visit_notes, prescriptions, lab_results, diagnoses)
    if (activeTab !== "all") {
      result = result.filter(record => record.recordType === activeTab);
    }

    // Filter by type dropdown
    if (filterType !== "all") {
      result = result.filter(record => record.recordType === filterType);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(record =>
        record.title?.toLowerCase().includes(term) ||
        record.description?.toLowerCase().includes(term) ||
        record.providerName?.toLowerCase().includes(term)
      );
    }

    setFilteredRecords(result);
  }, [records, activeTab, filterType, searchTerm]);

  // Get record type icon
  const getTypeIcon = (type) => {
    const icons = {
      visit_note: FileText,
      prescription: Pill,
      lab_result: FileCheck,
      diagnosis: Stethoscope,
    };
    const Icon = icons[type] || FileText;
    return Icon;
  };

  // Get record type label
  const getTypeLabel = (type) => {
    const labels = {
      visit_note: "Visit Note",
      prescription: "Prescription",
      lab_result: "Lab Result",
      diagnosis: "Diagnosis",
    };
    return labels[type] || type;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-700",
      completed: "bg-blue-100 text-blue-700",
      pending: "bg-yellow-100 text-yellow-700",
      cancelled: "bg-red-100 text-red-700",
      expired: "bg-gray-100 text-gray-700",
    };
    return colors[status] || colors.completed;
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

  // Handle view record
  const handleViewRecord = (recordId) => {
    navigate(`/dashboard/patient/records/${recordId}`);
  };

  // Handle download record
  const handleDownloadRecord = (record) => {
    // In a real app, this would download the actual file
    // For now, just show an alert
    alert(`Downloading: ${record.title}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading medical records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-red-500 mb-3" />
        <p className="text-red-600">{error}</p>
        <Button 
          className="mt-4" 
          onClick={() => window.location.reload()}
        >
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
            <h2 className="text-2xl font-bold">Medical Records</h2>
            <p className="text-purple-100 mt-1">
              View and manage your health records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white text-purple-600 px-4 py-2">
              {records.length} Records
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search records by title, description, or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="visit_note">Visit Notes</SelectItem>
                  <SelectItem value="prescription">Prescriptions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 ">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="visit_note">Visit Notes</TabsTrigger>
          <TabsTrigger value="prescription">Prescriptions</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Records List */}
      <Card>
        <CardContent className="pt-6">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">
                {searchTerm || filterType !== "all" 
                  ? "No records match your search criteria" 
                  : "No medical records found"}
              </p>
              {(searchTerm || filterType !== "all") && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("all");
                    setActiveTab("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => {
                const Icon = getTypeIcon(record.recordType);
                return (
                  <div
                    key={record.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all hover:border-purple-200"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <Icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {record.title || 'Untitled Record'}
                          </h3>
                          <Badge className="bg-purple-100 text-purple-700">
                            {getTypeLabel(record.recordType)}
                          </Badge>
                          {record.status && (
                            <Badge className={getStatusColor(record.status)}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          )}
                        </div>
                        {record.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {record.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(record.date || record.createdAt)}
                          </span>
                          {record.providerName && (
                            <span className="flex items-center gap-1">
                              <Stethoscope className="h-4 w-4" />
                              {record.providerName}
                            </span>
                          )}
                          {record.attachments && record.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <FileCheck className="h-4 w-4" />
                              {record.attachments.length} attachment(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewRecord(record.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {record.attachments && record.attachments.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadRecord(record)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
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

      {/* Stats Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{records.length}</p>
              <p className="text-sm text-gray-500">Total Records</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {records.filter(r => r.recordType === 'visit_note').length}
              </p>
              <p className="text-sm text-gray-500">Visit Notes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {records.filter(r => r.recordType === 'prescription').length}
              </p>
              <p className="text-sm text-gray-500">Prescriptions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {records.filter(r => r.recordType === 'lab_result').length}
              </p>
              <p className="text-sm text-gray-500">Lab Results</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalRecords;