import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Heart,
  Brain,
  Bone,
  Stethoscope,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitSymptoms } from "../../services/patientService"; // <-- Import from patientService

const SubmitSymptoms = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [formData, setFormData] = useState({
    symptomDetails: "",
    severity: "",
    duration: "",
    onset: "",
    triggers: "",
    medications: "",
    otherInfo: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const symptomCategories = [
    {
      name: "General",
      icon: Activity,
      symptoms: ["Fatigue", "Fever", "Chills", "Night Sweats", "Weight Loss", "Weight Gain"]
    },
    {
      name: "Cardiovascular",
      icon: Heart,
      symptoms: ["Chest Pain", "Palpitations", "Shortness of Breath", "Swelling in Legs", "High Blood Pressure"]
    },
    {
      name: "Neurological",
      icon: Brain,
      symptoms: ["Headache", "Dizziness", "Numbness", "Tingling", "Seizures", "Memory Loss"]
    },
    {
      name: "Respiratory",
      icon: Activity,
      symptoms: ["Cough", "Wheezing", "Chest Congestion", "Sore Throat", "Runny Nose", "Sinus Pain"]
    },
    {
      name: "Musculoskeletal",
      icon: Bone,
      symptoms: ["Joint Pain", "Muscle Aches", "Back Pain", "Stiffness", "Swelling"]
    },
    {
      name: "Digestive",
      icon: Stethoscope,
      symptoms: ["Nausea", "Vomiting", "Abdominal Pain", "Diarrhea", "Constipation", "Heartburn"]
    },
  ];

  const severityOptions = [
    { value: "mild", label: "Mild - Does not interfere with daily activities" },
    { value: "moderate", label: "Moderate - Some interference with daily activities" },
    { value: "severe", label: "Severe - Significant interference, unable to perform normal activities" },
  ];

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);
    try {
      const symptomData = {
        symptoms: selectedSymptoms,
        symptomDetails: formData.symptomDetails,
        severity: formData.severity,
      };

      // Using patientService
      await submitSymptoms(symptomData);
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/dashboard/patient/triage-status");
      }, 2000);
    } catch (error) {
      alert(error.message || 'Failed to submit symptoms. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ... Rest of the JSX (same as before, with loading states)

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Submit Symptoms</h2>
            <p className="text-green-100 mt-1">
              Tell us about your symptoms and we'll connect you with the right care
            </p>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-lg">
            <span className="font-semibold">Step {step} of 3</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Your Symptoms</h3>
                <p className="text-sm text-gray-500">Select all symptoms you are currently experiencing</p>
              </div>

              {symptomCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.name} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium">{category.name}</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {category.symptoms.map((symptom) => (
                        <div
                          key={symptom}
                          className={`
                            flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all
                            ${selectedSymptoms.includes(symptom) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                          onClick={() => handleSymptomToggle(symptom)}
                        >
                          <Checkbox
                            checked={selectedSymptoms.includes(symptom)}
                            onCheckedChange={() => handleSymptomToggle(symptom)}
                          />
                          <span className="text-sm">{symptom}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  {selectedSymptoms.length} symptoms selected
                </div>
                <Button 
                  onClick={() => setStep(2)}
                  disabled={selectedSymptoms.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Symptom Details</h3>
                <p className="text-sm text-gray-500">Help us understand your symptoms better</p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Selected Symptoms:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map((symptom) => (
                      <Badge key={symptom} variant="secondary">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Describe your symptoms in detail</Label>
                  <Textarea
                    name="symptomDetails"
                    placeholder="Please describe your symptoms in detail..."
                    value={formData.symptomDetails}
                    onChange={handleChange}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => handleSelectChange("severity", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {severityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setStep(3)}
                >
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                <p className="text-sm text-gray-500">Help us provide better care</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Triggers</Label>
                  <Input
                    name="triggers"
                    placeholder="What triggers your symptoms?"
                    value={formData.triggers}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Current Medications</Label>
                  <Input
                    name="medications"
                    placeholder="List any medications you are currently taking"
                    value={formData.medications}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Information</Label>
                  <Textarea
                    name="otherInfo"
                    placeholder="Any other information you think is relevant..."
                    value={formData.otherInfo}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Symptoms
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Tip:</span> Be as detailed as possible when describing your symptoms. 
          This helps our triage team provide the best care recommendation.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SubmitSymptoms;