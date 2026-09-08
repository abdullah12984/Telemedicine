import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Loader2,
  FileText,
  Pill,
  Stethoscope,
  Clock
} from "lucide-react";
import { getPatientDetails } from "../../services/providerService";
const ProviderPatientDetails = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchPatientDetails = async () => {
      setLoading(true);
      try {
        const response = await getPatientDetails(patientId);
        setPatientData(response.data);
      } catch (error) {
        setError(error.message || 'Failed to load patient details');
      } finally {
        setLoading(false);
      }
    };
    fetchPatientDetails();
  }, [patientId]);
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (error || !patientData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Patient not found'}</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }
  const { patient, consultations } = patientData;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Patient Details</h2>
          <p className="text-gray-500">View and manage patient information</p>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-3xl">
                {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">
                {patient.firstName} {patient.lastName}
              </h3>
              <div className="grid md:grid-cols-2 gap-2 mt-2">
                {patient.email && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {patient.email}
                  </p>
                )}
                {patient.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {patient.phone}
                  </p>
                )}
                {patient.dateOfBirth && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    DOB: {formatDate(patient.dateOfBirth)}
                  </p>
                )}
                {patient.gender && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Gender: {patient.gender}
                  </p>
                )}
              </div>
              {patient.address && (
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {patient.address}, {patient.city}, {patient.state} {patient.zipCode}
                </p>
              )}
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Stethoscope className="h-4 w-4 mr-2" />
              New Consultation
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            {patient.bloodGroup && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Blood Group</p>
                <p className="text-xl font-bold text-red-600">{patient.bloodGroup}</p>
              </div>
            )}
            {patient.allergies && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Allergies</p>
                <p className="text-sm font-medium text-orange-600">{patient.allergies}</p>
              </div>
            )}
            {patient.chronicConditions && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Chronic Conditions</p>
                <p className="text-sm font-medium text-blue-600">{patient.chronicConditions}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Consultations</p>
              <p className="text-xl font-bold text-green-600">{consultations?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="consultations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consultations">
            <Stethoscope className="h-4 w-4 mr-2" />
            Consultations
          </TabsTrigger>
          <TabsTrigger value="prescriptions">
            <Pill className="h-4 w-4 mr-2" />
            Prescriptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultations">
          <Card>
            <CardContent className="pt-6">
              {consultations?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No consultations yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {formatDate(consultation.consultationDate)}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {consultation.duration || 'N/A'} min
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {consultation.appointment?.status || 'Completed'}
                        </Badge>
                      </div>
                      {consultation.diagnosis && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">Diagnosis:</span> {consultation.diagnosis}
                        </p>
                      )}
                      {consultation.visitNotes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Notes:</span> {consultation.visitNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Prescriptions will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default ProviderPatientDetails;