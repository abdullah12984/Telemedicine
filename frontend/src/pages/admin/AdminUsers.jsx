import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Loader2,
  User,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  AlertCircle,
  CheckCircle,
  Eye,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdminUsers, updateUserStatus, deleteUser } from "../../services/adminService";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await getAdminUsers(roleFilter, searchTerm);
        setUsers(response.data || []);
        setFilteredUsers(response.data || []);
      } catch (error) {
        setError(error.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [roleFilter, searchTerm]);

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: "bg-red-100 text-red-700",
      PROVIDER: "bg-green-100 text-green-700",
      NURSE: "bg-purple-100 text-purple-700",
      PATIENT: "bg-blue-100 text-blue-700",
    };
    return colors[role] || colors.PATIENT;
  };

  const getRoleIcon = (role) => {
    const icons = {
      ADMIN: <Shield className="h-4 w-4" />,
      PROVIDER: <User className="h-4 w-4" />,
      NURSE: <User className="h-4 w-4" />,
      PATIENT: <User className="h-4 w-4" />,
    };
    return icons[role] || icons.PATIENT;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      await updateUserStatus(userId, !currentStatus);
      setSuccess(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
      const response = await getAdminUsers(roleFilter, searchTerm);
      setUsers(response.data || []);
      setFilteredUsers(response.data || []);
    } catch (error) {
      setError(error.message || "Failed to update user status");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
  if (!selectedUser) return;
  setProcessing(true);
  setError("");
  try {
    console.log("Deleting user:", selectedUser.id); // Debug
    await deleteUser(selectedUser.id);
    setSuccess("User deleted successfully");
    setShowDeleteDialog(false);
    setSelectedUser(null);
    
    // Refresh users list
    const response = await getAdminUsers(roleFilter, searchTerm);
    setUsers(response.data || []);
    setFilteredUsers(response.data || []);
  } catch (error) {
    console.error("Delete error:", error);
    setError(error.message || "Failed to delete user");
  } finally {
    setProcessing(false);
  }
};
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-blue-100 mt-1">Manage all users in the system</p>
          </div>
          <Badge className="bg-white/20 text-white border-0 px-4 py-2">
            {users.length} Users
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
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="provider">Provider</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.profile?.name || "N/A"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={
                              user.isActive
                                ? "text-red-600 border-red-200 hover:bg-red-50"
                                : "text-green-600 border-green-200 hover:bg-green-50"
                            }
                            onClick={() => handleStatusToggle(user.id, user.isActive)}
                            disabled={processing || user.role === "ADMIN"}
                            title={
                              user.role === "ADMIN"
                                ? "Cannot change admin status"
                                : user.isActive
                                ? "Deactivate user"
                                : "Activate user"
                            }
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          {user.role !== "ADMIN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                              disabled={processing}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
              {selectedUser && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedUser.profile?.name || "User"}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <Badge className="mt-1">{selectedUser.role}</Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;