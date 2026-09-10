import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Calendar,
  Activity,
  ArrowRight,
  FileText,
  Loader2
} from "lucide-react";
import { getTriageStatus } from "../../services/patientService";

const TriageStatus = () => {
  const navigate = useNavigate();
  const [triageData, setTriageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTriage = async () => {
      setLoading(true);
      try {
        const response = await getTriageStatus();
        // Get the most recent triage case
        if (response.data && response.data.length > 0) {
          setTriageData(response.data[0]);
        } else {
          setTriageData(null);
        }
      } catch (error) {
        console.error('Failed to load triage:', error);
        setError(error.message || 'Failed to load triage status');
      } finally {
        setLoading(false);
      }
    };

    fetchTriage();
  }, []);

  // Helper function to get status info
  const getStatusInfo = (status) => {
    const statusMap = {
      PENDING: {
        label: "Pending Review",
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        description: "Your symptoms are waiting for triage nurse review"
      },
      IN_PROGRESS: {
        label: "In Progress",
        icon: Activity,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        description: "A triage nurse is reviewing your case"
      },
      ASSIGNED: {
        label: "Assigned to Provider",
        icon: User,
        color: "text-green-600",
        bgColor: "bg-green-100",
        description: "You've been assigned to a provider"
      },
      COMPLETED: {
        label: "Completed",
        icon: CheckCircle,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        description: "Your triage is complete"
      }
    };
    return statusMap[status] || statusMap.PENDING;
  };

  // Helper function to get priority info
  const getPriorityInfo = (priority) => {
    const priorityMap = {
      LOW: { label: "Low", color: "bg-green-100 text-green-700" },
      MEDIUM: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
      HIGH: { label: "High", color: "bg-orange-100 text-orange-700" },
      URGENT: { label: "Urgent", color: "bg-red-100 text-red-700" },
    };
    return priorityMap[priority] || priorityMap.MEDIUM;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading triage status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-3" />
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

  if (!triageData) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold">Triage Status</h2>
          <p className="text-purple-100 mt-1">Track the status of your symptom submission</p>
        </div>

        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="bg-gray-100 p-4 rounded-full inline-block mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">No Active Triage Cases</h3>
            <p className="text-gray-500 mt-2">
              You don't have any pending triage cases. 
              If you're experiencing symptoms, please submit them for review.
            </p>
            <Button 
              className="mt-4 bg-green-600 hover:bg-green-700"
              onClick={() => navigate("/dashboard/patient/symptoms")}
            >
              Submit Symptoms
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get status and priority info
  const statusInfo = getStatusInfo(triageData.status);
  const StatusIcon = statusInfo.icon;
  const priorityInfo = getPriorityInfo(triageData.severity);

  // Timeline steps
  const timelineSteps = [
    { 
      status: "Symptoms Submitted", 
      completed: true,
      time: formatDate(triageData.createdAt)
    },
    { 
      status: "Triage Review", 
      completed: triageData.status !== "PENDING",
      time: triageData.status !== "PENDING" ? formatDate(triageData.updatedAt) : "Waiting..."
    },
    { 
      status: "Provider Assignment", 
      completed: triageData.status === "ASSIGNED" || triageData.status === "COMPLETED",
      time: triageData.status === "ASSIGNED" || triageData.status === "COMPLETED" 
        ? formatDate(triageData.assignedAt || triageData.updatedAt)
        : "Waiting..."
    },
    { 
      status: "Consultation Scheduled", 
      completed: triageData.status === "COMPLETED",
      time: triageData.status === "COMPLETED" ? "Completed" : "Waiting..."
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Triage Status</h2>
            <p className="text-purple-100 mt-1">
              Track the status of your symptom submission
            </p>
          </div>
          <Badge className="bg-white text-purple-600 px-4 py-2 text-sm">
            Case #{triageData.id?.slice(0, 8) || 'N/A'}
          </Badge>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`${statusInfo.bgColor} p-3 rounded-full`}>
                <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <p className="font-semibold">{statusInfo.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority Level</p>
                <Badge className={priorityInfo.color}>
                  {priorityInfo.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-semibold text-sm">
                  {formatDate(triageData.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Details */}
      <Card>
        <CardHeader>
          <CardTitle>Case Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{statusInfo.label}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Priority</p>
              <Badge className={priorityInfo.color}>
                {priorityInfo.label}
              </Badge>
            </div>
            {triageData.nurse && (
              <div>
                <p className="text-sm text-gray-500">Nurse Assigned</p>
                <p className="font-medium">
                  {triageData.nurse.firstName} {triageData.nurse.lastName}
                </p>
              </div>
            )}
            {triageData.assignedProvider && (
              <div>
                <p className="text-sm text-gray-500">Provider Assigned</p>
                <p className="font-medium">
                  Dr. {triageData.assignedProvider.firstName} {triageData.assignedProvider.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {triageData.assignedProvider.specialty}
                </p>
              </div>
            )}
          </div>

          {/* Symptoms */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Symptoms</p>
            <div className="flex flex-wrap gap-2">
              {triageData.symptoms?.map((symptom) => (
                <Badge key={symptom} variant="outline">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>

          {/* Symptom Details */}
          {triageData.symptomDetails && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Symptom Details</p>
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                {triageData.symptomDetails}
              </div>
            </div>
          )}

          {/* Triage Notes */}
          {triageData.triageNotes && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Triage Notes</p>
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                {triageData.triageNotes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timelineSteps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <Clock className="h-5 w-5 text-white" />
                    )}
                  </div>
                  {index < timelineSteps.length - 1 && (
                    <div className={`w-0.5 h-12 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className={`font-medium ${
                    step.completed ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.status}
                  </p>
                  <p className="text-sm text-gray-500">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {(triageData.status === "ASSIGNED" || triageData.status === "COMPLETED") && (
        <div className="flex gap-4">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboard/patient/book")}
          >
            Book Appointment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/dashboard/patient/appointments")}
          >
            View Appointments
          </Button>
        </div>
      )}

      {triageData.status === "PENDING" && (
        <Card>
          <CardContent className="pt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Waiting for review</p>
                <p className="text-sm text-yellow-700">
                  A triage nurse will review your symptoms shortly. 
                  You'll receive a notification when there's an update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {triageData.status === "IN_PROGRESS" && (
        <Card>
          <CardContent className="pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Under Review</p>
                <p className="text-sm text-blue-700">
                  A triage nurse is currently reviewing your symptoms. 
                  You'll be notified once a provider is assigned.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TriageStatus;