import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Stethoscope,
  Search,
  Loader2,
  Star,
  AlertCircle,
  Eye,
  Award,
  MapPin,
  DollarSign,
  Users,
  Mail,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAdminProviders } from "../../services/adminService";

const AdminProviders = () => {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Dialog state
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const response = await getAdminProviders();
        setProviders(response.data || []);
        setFilteredProviders(response.data || []);
      } catch (error) {
        setError(error.message || "Failed to load providers");
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = providers.filter(
        (p) =>
          p.firstName?.toLowerCase().includes(term) ||
          p.lastName?.toLowerCase().includes(term) ||
          p.specialty?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term)
      );
      setFilteredProviders(filtered);
    } else {
      setFilteredProviders(providers);
    }
  }, [searchTerm, providers]);

  // ✅ Open dialog with provider details
  const handleViewProvider = (provider) => {
    setSelectedProvider(provider);
    setShowDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Provider Management</h2>
            <p className="text-green-100 mt-1">Manage all healthcare providers</p>
          </div>
          <Badge className="bg-white/20 text-white border-0 px-4 py-2">
            {providers.length} Providers
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, specialty, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No providers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">
                        Dr. {provider.firstName} {provider.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{provider.specialty}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {provider.licenseNumber}
                      </TableCell>
                      <TableCell>{provider.email}</TableCell>
                      <TableCell className="text-center">
                        {provider.totalPatients || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{provider.rating || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            provider.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {provider.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* ✅ Opens dialog instead of navigating */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProvider(provider)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Provider Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Provider Details</DialogTitle>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-green-100 text-green-600 text-2xl">
                    {selectedProvider.firstName?.charAt(0)}
                    {selectedProvider.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    Dr. {selectedProvider.firstName} {selectedProvider.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Stethoscope className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600">
                      {selectedProvider.specialty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedProvider.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">
                        {selectedProvider.rating || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{selectedProvider.totalPatients || 0} patients</span>
                    </div>
                  </div>
                </div>
                <Badge
                  className={
                    selectedProvider.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {selectedProvider.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* License Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-600" />
                      License Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">License Number:</span>
                      <span className="font-medium">
                        {selectedProvider.licenseNumber || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">License State:</span>
                      <span className="font-medium">
                        {selectedProvider.licenseState || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Experience:</span>
                      <span className="font-medium">
                        {selectedProvider.experienceYears || 0} years
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Fee & Regions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Consultation Fee:</span>
                      <span className="font-medium">
                        ${selectedProvider.consultationFee || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Permitted Regions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedProvider.permittedRegions || []).length > 0 ? (
                          selectedProvider.permittedRegions.map((region) => (
                            <Badge key={region} variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {region}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProviders;