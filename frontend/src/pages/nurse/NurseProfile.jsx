import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Mail,
  Phone,
  Edit,
  Save,
  X,
  Loader2,
  Camera,
  CheckCircle,
  AlertCircle,
  Briefcase
} from "lucide-react";
import { getNurseProfile, updateNurseProfile } from "../../services/nurseService";
import { uploadProfileImage } from "../../services/authService";

const NurseProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    employeeId: "",
    department: "",
    profileImage: null,
  });
  const [originalProfile, setOriginalProfile] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await getNurseProfile();
        const data = response.data;
        setProfile({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.user?.email || "",
          employeeId: data.employeeId || "",
          department: data.department || "",
          profileImage: data.user?.profileImage || null,
        });
        setOriginalProfile({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.user?.email || "",
          employeeId: data.employeeId || "",
          department: data.department || "",
          profileImage: data.user?.profileImage || null,
        });
      } catch (error) {
        setError(error.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const response = await uploadProfileImage(file);
      if (response.data?.profileImage) {
        setProfile({ ...profile, profileImage: response.data.profileImage });
        setSuccess("Profile image updated successfully!");
      }
    } catch (error) {
      setError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updateData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        employeeId: profile.employeeId,
        department: profile.department,
      };
      await updateNurseProfile(updateData);
      setOriginalProfile({ ...profile });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile({ ...originalProfile });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const getInitials = () => {
    return `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`;
  };

  const getFullName = () => {
    return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Nurse';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white/20">
                <AvatarImage 
                  src={profile.profileImage ? `http://localhost:5000${profile.profileImage}` : undefined} 
                  alt={getFullName()}
                />
                <AvatarFallback className="text-2xl bg-white/20 text-white">
                  {getInitials() || <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label 
                  htmlFor="profile-image-upload" 
                  className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-lg cursor-pointer hover:bg-gray-100 transition"
                >
                  <Camera className="h-4 w-4 text-purple-600" />
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{getFullName()}</h2>
              <p className="text-purple-100 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {profile.department || 'Department not set'}
              </p>
              <p className="text-purple-100 flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                {profile.email}
              </p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0 px-4 py-2">
            Nurse
          </Badge>
        </div>
      </div>

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

      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </>
        ) : (
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input
                name="employeeId"
                value={profile.employeeId}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Input
              name="department"
              value={profile.department}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g., Emergency, Cardiology, etc."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NurseProfile;