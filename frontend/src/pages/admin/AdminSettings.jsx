import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  Activity,
  Shield,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAdminSettings, updateAdminSettings } from "../../services/adminService";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState({
    triageRules: {
      mild: { priority: "LOW", description: "Mild symptoms - Low priority" },
      moderate: { priority: "MEDIUM", description: "Moderate symptoms - Medium priority" },
      severe: { priority: "HIGH", description: "Severe symptoms - High priority" },
      urgent: { priority: "URGENT", description: "Urgent symptoms - Immediate attention" },
    },
    cancellationPolicy: {
      gracePeriod: 24,
      cancellationFee: 10,
      noShowFee: 25,
    },
    appointmentSettings: {
      defaultDuration: 30,
      maxAdvanceBooking: 30,
      minAdvanceBooking: 2,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await getAdminSettings();
        setSettings(response.data);
      } catch (error) {
        setError(error.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setError("");
    setSuccess("");
  };

  const handleNestedChange = (section, subSection, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...prev[section][subSection],
          [field]: value,
        },
      },
    }));
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateAdminSettings(settings);
      setSuccess("Settings updated successfully!");
    } catch (error) {
      setError(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Settings</h2>
            <p className="text-orange-100 mt-1">Configure system-wide settings</p>
          </div>
          <Button
            className="bg-white text-orange-600 hover:bg-orange-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
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

      {/* Settings Tabs */}
      <Tabs defaultValue="triage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="triage">
            <Activity className="h-4 w-4 mr-2" />
            Triage Rules
          </TabsTrigger>
          <TabsTrigger value="cancellation">
            <Clock className="h-4 w-4 mr-2" />
            Cancellation Policy
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Appointments
          </TabsTrigger>
        </TabsList>

        {/* Triage Rules Tab */}
        <TabsContent value="triage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Triage Priority Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(settings.triageRules).map(([key, rule]) => (
                  <div key={key} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium capitalize">{key}</Label>
                      <Badge
                        className={
                          rule.priority === "URGENT"
                            ? "bg-red-100 text-red-700"
                            : rule.priority === "HIGH"
                            ? "bg-orange-100 text-orange-700"
                            : rule.priority === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }
                      >
                        {rule.priority}
                      </Badge>
                    </div>
                    <Input
                      value={rule.description}
                      onChange={(e) =>
                        handleNestedChange("triageRules", key, "description", e.target.value)
                      }
                      className="mt-1"
                    />
                    <Select
                      value={rule.priority}
                      onValueChange={(value) =>
                        handleNestedChange("triageRules", key, "priority", value)
                      }
                    >
                      <SelectTrigger className="mt-2">
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cancellation Policy Tab */}
        <TabsContent value="cancellation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-600" />
                Cancellation & No-Show Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grace Period (hours)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={settings.cancellationPolicy.gracePeriod}
                      onChange={(e) =>
                        handleChange("cancellationPolicy", "gracePeriod", parseInt(e.target.value) || 0)
                      }
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Time before appointment to cancel without fee
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Cancellation Fee (%)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={settings.cancellationPolicy.cancellationFee}
                      onChange={(e) =>
                        handleChange("cancellationPolicy", "cancellationFee", parseInt(e.target.value) || 0)
                      }
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Percentage of consultation fee charged for cancellation
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>No-Show Fee (%)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    value={settings.cancellationPolicy.noShowFee}
                    onChange={(e) =>
                      handleChange("cancellationPolicy", "noShowFee", parseInt(e.target.value) || 0)
                    }
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Percentage of consultation fee charged for no-show
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                Appointment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Default Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.appointmentSettings.defaultDuration}
                    onChange={(e) =>
                      handleChange("appointmentSettings", "defaultDuration", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Advance Booking (days)</Label>
                  <Input
                    type="number"
                    value={settings.appointmentSettings.maxAdvanceBooking}
                    onChange={(e) =>
                      handleChange("appointmentSettings", "maxAdvanceBooking", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Advance Booking (hours)</Label>
                  <Input
                    type="number"
                    value={settings.appointmentSettings.minAdvanceBooking}
                    onChange={(e) =>
                      handleChange("appointmentSettings", "minAdvanceBooking", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;