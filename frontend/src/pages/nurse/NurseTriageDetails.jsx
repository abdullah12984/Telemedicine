import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Loader2,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  Users
} from "lucide-react";
import {
  getTriageCaseDetails,
  updateTriagePriority,
  assignProviderToCase,
  getAvailableProvidersForNurse,
  completeTriageCase
} from "../../services/nurseService";

const NurseTriageDetails = () => {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [triageNotes, setTriageNotes] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [caseResponse, providersResponse] = await Promise.all([
          getTriageCaseDetails(caseId),
          getAvailableProvidersForNurse()
        ]);
        setCaseData(caseResponse.data);
        setSelectedPriority(caseResponse.data.severity || "");
        setTriageNotes(caseResponse.data.triageNotes || "");
        setProviders(providersResponse.data || []);
      } catch (error) {
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [caseId]);

  const handleUpdatePriority = async () => {
    setProcessing(true);
    try {
      await updateTriagePriority(caseId, {
        severity: selectedPriority,
        priorityScore: selectedPriority === "URGENT" ? 4 : 
                      selectedPriority === "HIGH" ? 3 :
                      selectedPriority === "MEDIUM" ? 2 : 1
      });
      const response = await getTriageCaseDetails(caseId);
      setCaseData(response.data);
      alert('Priority updated successfully!');
    } catch (error) {
      setError(error.message || 'Failed to update priority');
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignProvider = async () => {
    if (!selectedProvider) {
      alert('Please select a provider');
      return;
    }
    setProcessing(true);
    try {
      await assignProviderToCase(caseId, {
        providerId: selectedProvider,
        triageNotes: triageNotes
      });
      const response = await getTriageCaseDetails(caseId);
      setCaseData(response.data);
      alert('Provider assigned successfully!');
    } catch (error) {
      setError(error.message || 'Failed to assign provider');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteTriage = async () => {
    if (!window.confirm('Are you sure you want to complete this triage case?')) {
      return;
    }
    setProcessing(true);
    try {
      await completeTriageCase(caseId, { triageNotes });
      const response = await getTriageCaseDetails(caseId);
      setCaseData(response.data);
      alert('Triage case completed successfully!');
    } catch (error) {
      setError(error.message || 'Failed to complete triage');
    } finally {
      setProcessing(false);
    }
  };

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

  if (error || !caseData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-3" />
        <p className="text-red-600">{error || 'Case not found'}</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const patient = caseData.patient;
  const assignedProvider = caseData.assignedProvider;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Triage Case Review</h2>
          <p className="text-gray-500">Review and manage patient triage</p>
        </div>
        <div className="flex gap-2">
          <Badge className={getPriorityColor(caseData.severity)}>
            {caseData.severity}
          </Badge>
          <Badge className={getStatusColor(caseData.status)}>
            {caseData.status}
          </Badge>
        </div>
      </div>

      {/* Patient Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold">{patient?.firstName} {patient?.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{patient?.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-semibold">{patient?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-semibold">
                {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptoms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Symptoms & Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Reported Symptoms</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {caseData.symptoms?.map((symptom, index) => (
                  <Badge key={index} variant="outline">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Symptom Details</p>
              <p className="text-gray-700 mt-1">{caseData.symptomDetails}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Submitted</p>
              <p className="text-gray-700 mt-1">
                {new Date(caseData.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Triage Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Triage Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Priority */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Priority Level</p>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleUpdatePriority}
              disabled={processing || caseData.status === "COMPLETED"}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Update Priority
            </Button>
          </div>

          {/* Assign Provider */}
          {caseData.status !== "COMPLETED" && (
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Assign Provider</p>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - {p.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAssignProvider}
                disabled={processing || caseData.status === "COMPLETED"}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Assign
              </Button>
            </div>
          )}

          {/* Triage Notes */}
          <div>
            <p className="text-sm font-medium mb-2">Triage Notes</p>
            <Textarea
              value={triageNotes}
              onChange={(e) => setTriageNotes(e.target.value)}
              placeholder="Add triage notes..."
              className="min-h-[100px]"
              disabled={caseData.status === "COMPLETED"}
            />
          </div>

          {/* Complete Button */}
          {caseData.status !== "COMPLETED" && (
            <Button 
              onClick={handleCompleteTriage}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Triage
            </Button>
          )}

          {caseData.status === "COMPLETED" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
              <CheckCircle className="h-5 w-5 inline mr-2" />
              This triage case has been completed
              {caseData.completedAt && (
                <span className="block text-sm mt-1">
                  Completed on: {new Date(caseData.completedAt).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Provider Info */}
      {assignedProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
              Assigned Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold">Dr. {assignedProvider.firstName} {assignedProvider.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Specialty</p>
                <p className="font-semibold">{assignedProvider.specialty}</p>
              </div>
            </div>
            {caseData.assignedAt && (
              <p className="text-sm text-gray-500 mt-2">
                Assigned on: {new Date(caseData.assignedAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NurseTriageDetails;