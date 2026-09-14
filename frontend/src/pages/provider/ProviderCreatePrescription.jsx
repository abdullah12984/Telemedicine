import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Loader2,
  Pill,
  Calendar,
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPrescription, getConsultationDetails } from "../../services/providerService";

const ProviderCreatePrescription = () => {
  const navigate = useNavigate();
  const { consultationId } = useParams();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [patientInfo, setPatientInfo] = useState({
    name: "Loading...",
    email: "",
    phone: "",
  });
  const [formData, setFormData] = useState({
    medication: "",
    dosage: "",
    frequency: "Once daily",
    quantity: "",
    refills: "",
    instructions: "",
    validUntil: "",
  });

  const frequencies = [
    "Once daily",
    "Twice daily",
    "Three times daily",
    "Four times daily",
    "Every 6 hours",
    "Every 8 hours",
    "Every 12 hours",
    "As needed",
    "Before meals",
    "After meals",
  ];

   // Fetch REAL patient info from consultation
  useEffect(() => {
    const fetchConsultation = async () => {
      if (!consultationId) return;
      try {
        setLoading(true);
        const response = await getConsultationDetails(consultationId);
        if (response.success && response.data) {
          const cons = response.data;
          const patient = cons.patient;
          setPatientInfo({
            name: `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient",
            email: patient?.user?.email || "Not available",
            phone: patient?.phone || "Not available",
          });
        }
      } catch (err) {
        console.error("Failed to load patient info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultation();
  }, [consultationId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.medication || !formData.dosage || !formData.frequency || !formData.quantity) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Use the consultationId from URL params
      const response = await createPrescription(consultationId, {
        medication: formData.medication,
        dosage: formData.dosage,
        frequency: formData.frequency,
        quantity: parseInt(formData.quantity),
        refills: formData.refills ? parseInt(formData.refills) : 0,
        instructions: formData.instructions || "",
        validUntil: formData.validUntil || undefined,
      });

      if (response.success) {
        setSuccess("✅ Prescription created successfully! Patient has been notified.");
        setFormData({
          medication: "",
          dosage: "",
          frequency: "Once daily",
          quantity: "",
          refills: "",
          instructions: "",
          validUntil: "",
        });
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/dashboard/provider/prescriptions");
        }, 2500);
      }
    } catch (error) {
      setError(error.message || "Failed to create prescription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Create Prescription</h2>
          <p className="text-gray-500">Add a new prescription for your patient</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill className="h-6 w-6 text-green-600" />
          <span className="text-sm font-medium text-green-600">New Prescription</span>
        </div>
      </div>

      {/* Patient Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold">{patientInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{patientInfo.email || "Not available"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-semibold">{patientInfo.phone || "Not available"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Prescription Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-green-600" />
            Prescription Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Medication */}
            <div className="space-y-2">
              <Label htmlFor="medication">Medication Name *</Label>
              <Input
                id="medication"
                name="medication"
                placeholder="e.g., Lisinopril, Amoxicillin"
                value={formData.medication}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Dosage */}
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  name="dosage"
                  placeholder="e.g., 10mg, 500mg"
                  value={formData.dosage}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => handleSelectChange("frequency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-gray-500">Number of tablets/capsules</p>
              </div>

              {/* Refills */}
              <div className="space-y-2">
                <Label htmlFor="refills">Refills</Label>
                <Input
                  id="refills"
                  name="refills"
                  type="number"
                  placeholder="e.g., 2"
                  value={formData.refills}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500">Number of refills allowed</p>
              </div>
            </div>

            {/* Valid Until */}
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                name="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500">
                Leave blank for 90 days from today
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                name="instructions"
                placeholder="e.g., Take with food, Do not stop suddenly, etc."
                value={formData.instructions}
                onChange={handleChange}
                className="min-h-[80px]"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Prescription...
                  </>
                ) : (
                  <>
                    <Pill className="mr-2 h-4 w-4" />
                    Create Prescription
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-semibold">💡 Tips:</p>
        <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
          <li>Always include clear instructions for the patient</li>
          <li>Specify the exact dosage and frequency</li>
          <li>Set appropriate refill limits</li>
          <li>The prescription will be sent to the patient automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default ProviderCreatePrescription;