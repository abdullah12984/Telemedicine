import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Loader2,
  User,
  Phone,
  Mail,
  Calendar,
  ArrowRight
} from "lucide-react";
import { getProviderPatients } from "../../services/providerService";

const ProviderPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const response = await getProviderPatients();
        setPatients(response.data || []);
        setFilteredPatients(response.data || []);
      } catch (error) {
        console.error('Failed to load patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = patients.filter(p =>
        p.firstName?.toLowerCase().includes(term) ||
        p.lastName?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Patients</h2>
            <p className="text-blue-100 mt-1">Manage all your patients</p>
          </div>
          <Badge className="bg-white/20 text-white border-0 px-4 py-2">
            {patients.length} Patients
          </Badge>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No patients found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-blue-200"
                  onClick={() => navigate(`/dashboard/provider/patients/${patient.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                        {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <Button variant="ghost" size="sm">
                          View <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                      <div className="space-y-1 mt-1">
                        {patient.email && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {patient.email}
                          </p>
                        )}
                        {patient.phone && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </p>
                        )}
                        {patient.lastVisit && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last visit: {formatDate(patient.lastVisit)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderPatients;