import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle,
  Clock,
  FileText,
  Pill,
  Calendar,
  Loader2,
  CheckCheck,
  ArrowLeft,
} from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleMarkRead = async (id) => {
    await markNotificationAsRead(id);
    fetchAll();
  };

  const handleMarkAll = async () => {
    await markAllNotificationsAsRead();
    fetchAll();
  };

  const getIcon = (type) => {
    const icons = {
      APPOINTMENT_BOOKED: <Calendar className="h-5 w-5 text-blue-500" />,
      APPOINTMENT_REMINDER: <Clock className="h-5 w-5 text-yellow-500" />,
      PRESCRIPTION_READY: <Pill className="h-5 w-5 text-green-500" />,
      TRIAGE_ASSIGNED: <FileText className="h-5 w-5 text-indigo-500" />,
    };
    return icons[type] || <Bell className="h-5 w-5 text-gray-500" />;
  };

  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
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
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-gray-500">Stay updated with your activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAll}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Notifications</span>
            <Badge variant="outline">{unreadCount} unread</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg ${
                    !n.isRead ? "bg-blue-50 border-blue-200" : ""
                  }`}
                >
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className={!n.isRead ? "font-semibold" : ""}>{n.title}</p>
                      <span className="text-xs text-gray-400">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 mt-2 h-6"
                        onClick={() => handleMarkRead(n.id)}
                      >
                        Mark as read
                      </Button>
                    )}
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

export default NotificationsPage;