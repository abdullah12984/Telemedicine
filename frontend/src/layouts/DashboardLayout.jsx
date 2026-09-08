import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  ClipboardList,
  Stethoscope,
  UserCog,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  FileText,
  Pill,
  Clock,
  BarChart3,
  Briefcase,
  Building2,
  HeartPulse,
  UserPlus,
  Video,
  MapPin,
  CreditCard,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState("patient"); // This would come from auth context

  // Get current user role - in real app, this would come from auth context
  // For demo, we can detect from URL or use a state
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/dashboard/admin")) {
      setUserRole("admin");
    } else if (path.includes("/dashboard/provider")) {
      setUserRole("provider");
    } else if (path.includes("/dashboard/nurse")) {
      setUserRole("nurse");
    } else if (path.includes("/dashboard/patient")) {
      setUserRole("patient");
    }
  }, [location.pathname]);

  // Navigation items based on role
  const getNavItems = () => {
    const allItems = {
      // Patient Navigation
      patient: [
        { 
          icon: Home, 
          label: "Dashboard", 
          path: "/dashboard/patient",
          active: location.pathname === "/dashboard/patient"
        },
        { 
          icon: Calendar, 
          label: "My Appointments", 
          path: "/dashboard/patient/appointments",
          active: location.pathname === "/dashboard/patient/appointments"
        },
        { 
          icon: FileText, 
          label: "Medical Records", 
          path: "/dashboard/patient/records",
          active: location.pathname === "/dashboard/patient/records"
        },
        { 
          icon: Activity, 
          label: "Triage Status", 
          path: "/dashboard/patient/triage-status",
          active: location.pathname === "/dashboard/patient/triage-status"
        },
        { 
          icon: Clock, 
          label: "Book Appointment", 
          path: "/dashboard/patient/book",
          active: location.pathname === "/dashboard/patient/book"
        },
        { 
          icon: User, 
          label: "Profile", 
          path: "/dashboard/patient/profile",
          active: location.pathname === "/dashboard/patient/profile"
        },
      ],

      // Provider/Doctor Navigation
      provider: [
        { 
          icon: Home, 
          label: "Dashboard", 
          path: "/dashboard/provider",
          active: location.pathname === "/dashboard/provider"
        },
        { 
          icon: Calendar, 
          label: "Appointments", 
          path: "/dashboard/provider/appointments",
          active: location.pathname === "/dashboard/provider/appointments"
        },
        { 
          icon: Users, 
          label: "My Patients", 
          path: "/dashboard/provider/patients",
          active: location.pathname === "/dashboard/provider/patients"
        },
        { 
          icon: Video, 
          label: "Consultations", 
          path: "/dashboard/provider/consultations",
          active: location.pathname === "/dashboard/provider/consultations"
        },
        { 
          icon: Pill, 
          label: "Prescriptions", 
          path: "/dashboard/provider/prescriptions",
          active: location.pathname === "/dashboard/provider/prescriptions"
        },
        { 
          icon: Clock, 
          label: "Availability", 
          path: "/dashboard/provider/availability",
          active: location.pathname === "/dashboard/provider/availability"
        },
        { 
          icon: UserCog, 
          label: "Profile", 
          path: "/dashboard/provider/profile",
          active: location.pathname === "/dashboard/provider/profile"
        },
      ],

      // Triage Nurse Navigation
      nurse: [
        { 
          icon: Home, 
          label: "Dashboard", 
          path: "/dashboard/nurse",
          active: location.pathname === "/dashboard/nurse"
        },
        { 
          icon: Activity, 
          label: "Triage Queue", 
          path: "/dashboard/nurse/triage",
          active: location.pathname === "/dashboard/nurse/triage"
        },
        { 
          icon: Users, 
          label: "Patients", 
          path: "/dashboard/nurse/patients",
          active: location.pathname === "/dashboard/nurse/patients"
        },
        { 
          icon: ClipboardList, 
          label: "Cases", 
          path: "/dashboard/nurse/cases",
          active: location.pathname === "/dashboard/nurse/cases"
        },
        { 
          icon: User, 
          label: "Profile", 
          path: "/dashboard/nurse/profile",
          active: location.pathname === "/dashboard/nurse/profile"
        },
      ],

      // Admin Navigation
      admin: [
        { 
          icon: Home, 
          label: "Dashboard", 
          path: "/dashboard/admin",
          active: location.pathname === "/dashboard/admin"
        },
        { 
          icon: Users, 
          label: "Users", 
          path: "/dashboard/admin/users",
          active: location.pathname === "/dashboard/admin/users"
        },
        { 
          icon: Stethoscope, 
          label: "Providers", 
          path: "/dashboard/admin/providers",
          active: location.pathname === "/dashboard/admin/providers"
        },
        { 
          icon: Calendar, 
          label: "Appointments", 
          path: "/dashboard/admin/appointments",
          active: location.pathname === "/dashboard/admin/appointments"
        },
       
        { 
          icon: BarChart3, 
          label: "Analytics", 
          path: "/dashboard/admin/analytics",
          active: location.pathname === "/dashboard/admin/analytics"
        },
        { 
          icon: Settings, 
          label: "Settings", 
          path: "/dashboard/admin/settings",
          active: location.pathname === "/dashboard/admin/settings"
        },
      ],
    };

    return allItems[userRole] || allItems.patient;
  };

  const navItems = getNavItems();

  // Get user initials for avatar
  const getUserInitials = () => {
    switch(userRole) {
      case "patient": return "JD";
      case "provider": return "DR";
      case "nurse": return "NS";
      case "admin": return "AD";
      default: return "US";
    }
  };

  const getRoleDisplay = () => {
    switch(userRole) {
      case "patient": return "Patient";
      case "provider": return "Provider/Doctor";
      case "nurse": return "Triage Nurse";
      case "admin": return "Administrator";
      default: return "User";
    }
  };

  const getRoleColor = () => {
    switch(userRole) {
      case "patient": return "bg-blue-600";
      case "provider": return "bg-green-600";
      case "nurse": return "bg-purple-600";
      case "admin": return "bg-gray-800";
      default: return "bg-gray-600";
    }
  };

  const handleLogout = () => {
    navigate("/login");
  };

  // Get the current page title
  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.active);
    return currentItem ? currentItem.label : "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 transition-all duration-300 fixed h-full z-30 shadow-sm`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getRoleColor()}`}>
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <span className="text-xl font-bold text-gray-800">TeleMed</span>
                <span className={`block text-xs ${getRoleColor().replace('bg-', 'text-')}`}>
                  {getRoleDisplay()}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* User Info - shows only when sidebar is open */}
        {sidebarOpen && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className={getRoleColor() + " text-white"}>
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">John Doe</p>
                <p className="text-xs text-gray-500">{getRoleDisplay()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={item.active ? "default" : "ghost"}
              className={`w-full justify-start gap-3 ${
                sidebarOpen ? "" : "px-2"
              } ${item.active ? getRoleColor().replace('bg-', '') : ""}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className={`h-5 w-5 ${item.active ? "text-white" : ""}`} />
              {sidebarOpen && item.label}
              {sidebarOpen && item.active && (
                <span className="ml-auto h-2 w-2 rounded-full bg-white" />
              )}
            </Button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              {getRoleDisplay()} Portal
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                3
              </Badge>
            </Button>

            {/* Role Badge */}
            <Badge className={getRoleColor() + " text-white hidden md:flex px-3 py-1"}>
              {getRoleDisplay()}
            </Badge>

            {/* User Menu */}
            <DropdownMenu>
  <DropdownMenuTrigger
    render={
      <Button
        variant="ghost"
        className="relative h-10 w-10 rounded-full"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback className={getRoleColor() + " text-white"}>
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
      </Button>
    }
  />

  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium">John Doe</p>
        <p className="text-xs text-gray-500">
          {getRoleDisplay()}
        </p>
      </div>
    </DropdownMenuLabel>

    <DropdownMenuSeparator />

    <DropdownMenuItem
      onClick={() => navigate(`/dashboard/${userRole}/profile`)}
    >
      <User className="mr-2 h-4 w-4" />
      Profile
    </DropdownMenuItem>

    <DropdownMenuItem>
      <Settings className="mr-2 h-4 w-4" />
      Settings
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    <DropdownMenuItem
      className="text-red-600"
      onClick={handleLogout}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;