import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Loader2,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { getAvailability, updateAvailability } from "../../services/providerService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const days = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const ProviderAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const response = await getAvailability();
        setAvailability(response.data || []);
      } catch (error) {
        setError(error.message || 'Failed to load availability');
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  // When adding new slot, ensure time format is "HH:MM"
const handleAddSlot = (day) => {
  const newSlot = {
    dayOfWeek: day,
    startTime: "09:00",  // ✅ Always 2-digit format
    endTime: "17:00",    // ✅ Always 2-digit format
    slotDuration: 30,   
    isAvailable: true,
    isRecurring: true,
    id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  setAvailability([...availability, newSlot]);
};

  const handleRemoveSlot = (index) => {
    const updated = [...availability];
    updated.splice(index, 1);
    setAvailability(updated);
  };

  const handleSlotChange = (index, field, value) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const dataToSave = availability.map(({ id, ...rest }) => rest);
      await updateAvailability(dataToSave);
      setSuccess("Availability updated successfully!");
    } catch (error) {
      setError(error.message || 'Failed to update availability');
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
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Availability</h2>
            <p className="text-orange-100 mt-1">Manage your working hours</p>
          </div>
          <Button
            className="bg-white text-orange-600 hover:bg-orange-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Weekly Schedule</span>
            <Badge variant="outline">
              {availability.length} slots
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {days.map((day) => {
            const daySlots = availability.filter(s => s.dayOfWeek === day.value);
            return (
              <div key={day.value} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{day.label}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSlot(day.value)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Slot
                  </Button>
                </div>
                {daySlots.length === 0 ? (
                  <div className="text-sm text-gray-400 bg-gray-50 p-3 rounded-lg text-center">
                    No slots added for {day.label}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot, index) => {
  const globalIndex = availability.indexOf(slot);
  return (
    <div
      key={slot.id}
      className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg"
    >
      <Input
        type="time"
        value={slot.startTime}
        onChange={(e) => handleSlotChange(globalIndex, "startTime", e.target.value)}
        className="w-33"
      />
      <span className="text-gray-400">to</span>
      <Input
        type="time"
        value={slot.endTime}
        onChange={(e) => handleSlotChange(globalIndex, "endTime", e.target.value)}
        className="w-33"
      />

      {/* ✅ Slot Duration Input */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-gray-500 whitespace-nowrap">Slot:</Label>
        <Select
          value={String(slot.slotDuration || 30)}
          onValueChange={(val) =>
            handleSlotChange(globalIndex, "slotDuration", parseInt(val))
          }
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 min</SelectItem>
            <SelectItem value="20">20 min</SelectItem>
            <SelectItem value="30">30 min</SelectItem>
            <SelectItem value="45">45 min</SelectItem>
            <SelectItem value="60">60 min</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 ml-2">
        <Switch
          checked={slot.isAvailable}
          onCheckedChange={(checked) =>
            handleSlotChange(globalIndex, "isAvailable", checked)
          }
        />
        <Label className="text-sm">
          {slot.isAvailable ? "Available" : "Unavailable"}
        </Label>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="text-red-500 hover:text-red-700 ml-auto"
        onClick={() => handleRemoveSlot(globalIndex)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
})}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderAvailability;