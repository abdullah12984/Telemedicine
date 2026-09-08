import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Stethoscope,
  Pill,
  FileText,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  Heart,
  Activity,
  ClipboardList,
  History,
  AlertTriangle,
  Droplet,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getPatientDetails } from "../../services/providerService";

const ProviderConsultationDetails = () => {
  const navigate = useNavigate();
  const { consultationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consultation, setConsultation] = useState(null);
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Mock consultation data
        const consultationData = {
          id: consultationId,
          patientId: "patient-123",
          patient: {
            id: "patient-123",
            firstName: "Mominah",
            lastName: "Ejaz",
            email: "mominah@example.com",
            phone: "+9231652222",
            dateOfBirth: "1995-06-15",
            gender: "FEMALE",
            bloodGroup: "O+",
            allergies: "Penicillin, Dust",
            chronicConditions: "None",
          },
          consultationDate: new Date(),
          duration: 30,
          diagnosis: "Viral Infection",
          diagnosisCodes: ["J06.9"],
          visitNotes: "Patient presents with fever and cough. Prescribed rest and medication.",
          appointment: { status: "COMPLETED" },
          prescriptions: [
            { id: "1", medication: "Paracetamol", dosage: "500mg", frequency: "Three times daily", status: "ACTIVE" },
            { id: "2", medication: "Vitamin C", dosage: "1000mg", frequency: "Once daily", status: "ACTIVE" },
          ],
          symptoms: ["Fever (102°F)", "Cough", "Fatigue", "Body aches"],
          symptomsDetails: "Patient has had fever for 3 days, persistent cough with phlegm, feeling very weak.",
        };
        setConsultation(consultationData);

        // Mock medical history
        const historyData = {
          medicalHistory: [
            { 
              id: "1", 
              condition: "Viral Infection", 
              diagnosisDate: "2025-12-15", 
              treatment: "Rest and fluids", 
              notes: "Recovered within 5 days" 
            },
            { 
              id: "2", 
              condition: "Seasonal Allergies", 
              diagnosisDate: "2025-09-10", 
              treatment: "Antihistamines", 
              notes: "Seasonal" 
            },
          ],
          consultations: [
            {
              id: "c1",
              date: "2025-12-15",
              diagnosis: "Viral Infection",
              notes: "Prescribed Paracetamol"
            },
            {
              id: "c2",
              date: "2025-09-10",
              diagnosis: "Allergic Rhinitis",
              notes: "Prescribed Antihistamines"
            }
          ]
        };
        setPatientData(historyData);
      } catch (error) {
        setError(error.message || "Failed to load consultation details");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [consultationId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-3" />
        <p className="text-red-600">{error || "Consultation not found"}</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const patient = consultation.patient;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Consultation Details</h2>
          <p className="text-gray-500">View complete consultation information</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700 px-4 py-2">
          ID: #{consultation.id?.slice(0, 8)}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Stethoscope className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="symptoms">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Symptoms
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Medical History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold">{patient?.firstName} {patient?.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{patient?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-semibold">{patient?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-semibold">{patient?.dateOfBirth ? formatDate(patient.dateOfBirth) : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-semibold">{patient?.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Blood Group</p>
                  <Badge className="bg-red-100 text-red-700">
                    <Droplet className="h-3 w-3 mr-1" />
                    {patient?.bloodGroup || "N/A"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Allergies</p>
                  <p className="font-semibold text-red-600">{patient?.allergies || "None"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Chronic Conditions</p>
                  <p className="font-semibold">{patient?.chronicConditions || "None"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consultation Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-purple-600" />
                Consultation Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold">{formatDate(consultation.consultationDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-semibold">{formatTime(consultation.consultationDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold">{consultation.duration || 30} minutes</p>
                </div>
              </div>
              {consultation.diagnosis && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Diagnosis</p>
                  <p className="font-semibold text-lg">{consultation.diagnosis}</p>
                  {consultation.diagnosisCodes && (
                    <p className="text-sm text-gray-500 mt-1">ICD-10: {consultation.diagnosisCodes.join(", ")}</p>
                  )}
                </div>
              )}
              {consultation.visitNotes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Visit Notes</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{consultation.visitNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescriptions */}
          {consultation.prescriptions?.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-green-600" />
                  Prescriptions ({consultation.prescriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {consultation.prescriptions.map((prescription) => (
                    <div key={prescription.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{prescription.medication}</p>
                        <p className="text-sm text-gray-500">{prescription.dosage} - {prescription.frequency}</p>
                      </div>
                      <Badge className={prescription.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {prescription.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Symptoms Tab */}
        <TabsContent value="symptoms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Patient Symptoms
              </CardTitle>
            </CardHeader>
            <CardContent>
              {consultation.symptoms && consultation.symptoms.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {consultation.symptoms.map((symptom, index) => (
                      <Badge key={index} className="bg-orange-100 text-orange-700 text-sm py-1.5 px-3">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                  {consultation.symptomsDetails && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Detailed Description</p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-1">
                        <p className="text-gray-700">{consultation.symptomsDetails}</p>
                      </div>
                    </div>
                  )}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">💡 Note:</span> These symptoms were reported by the patient during the triage process.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No symptoms recorded for this consultation</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="history">
          <div className="space-y-6">
            {/* Medical History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Medical History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientData?.medicalHistory && patientData.medicalHistory.length > 0 ? (
                  <div className="space-y-4">
                    {patientData.medicalHistory.map((record, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{record.condition}</h4>
                          <Badge variant="outline">{formatDate(record.diagnosisDate)}</Badge>
                        </div>
                        {record.treatment && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Treatment:</span> {record.treatment}
                          </p>
                        )}
                        {record.notes && (
                          <p className="text-sm text-gray-500 mt-1">{record.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No medical history found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Previous Consultations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-purple-600" />
                  Previous Consultations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientData?.consultations && patientData.consultations.length > 0 ? (
                  <div className="space-y-3">
                    {patientData.consultations.map((consult, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{consult.diagnosis}</p>
                          <p className="text-sm text-gray-500">{formatDate(consult.date)}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {consult.notes || "No notes"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No previous consultations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {consultation.appointment?.status !== "COMPLETED" && (
          <Button className="bg-green-600 hover:bg-green-700">
            <Stethoscope className="h-4 w-4 mr-2" />
            Start Consultation
          </Button>
        )}
        {consultation.appointment?.status === "COMPLETED" && (
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => navigate(`/dashboard/provider/create-prescription/${consultation.id}`)}
          >
            <Pill className="h-4 w-4 mr-2" />
            Create Prescription
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProviderConsultationDetails;