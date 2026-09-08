import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, saveAuthData } from "../../services/authService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Stethoscope, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: "patient", label: "Patient" },
    { value: "provider", label: "Provider/Doctor" },
    { value: "nurse", label: "Triage Nurse" },
    { value: "admin", label: "Admin" },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.role) {
      setError("Please fill in all fields and select a role");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // ✅ Sirf email aur password bhej rahe hain
      const response = await login({
        email: formData.email,
        password: formData.password
      });

      // ✅ Backend se aaya role
      const userRole = response.user.role.toLowerCase();
      const selectedRole = formData.role;

      // ✅ SPECIAL: Admin bypass - role verification skip
      if (formData.email === "Admin112233@gmail.com" && userRole === "admin") {
        saveAuthData(response.token, response.user);
        navigate("/dashboard/admin");
        setLoading(false);
        return;
      }

      // ✅ NORMAL: Role verify for other users
      if (userRole !== selectedRole) {
        setError(
          `This account is registered as "${response.user.role}". Please select the correct role.`
        );
        setLoading(false);
        return;
      }

      // ✅ Save token and user data
      saveAuthData(response.token, response.user);

      // ✅ Redirect based on role
      switch (userRole) {
        case "patient":
          navigate("/dashboard/patient");
          break;
        case "provider":
          navigate("/dashboard/provider");
          break;
        case "nurse":
          navigate("/dashboard/nurse");
          break;
        case "admin":
          navigate("/dashboard/admin");
          break;
        default:
          setError("Invalid role");
      }
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to access your telemedicine dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="doctor@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Login As</Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                Select the role you registered with
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 border-t pt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Register here
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            Admin: Admin112233@gmail.com | Any password
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;