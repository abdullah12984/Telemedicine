import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  CheckCircle,
  Clock,
  FileText,
  Pill,
  Calendar,
  User,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../services/notificationService";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      console.error("Notification fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type) => {
    const icons = {
      APPOINTMENT_BOOKED: <Calendar className="h-4 w-4 text-blue-500" />,
      APPOINTMENT_REMINDER: <Clock className="h-4 w-4 text-yellow-500" />,
      PRESCRIPTION_READY: <Pill className="h-4 w-4 text-green-500" />,
      PRESCRIPTION_REFILL: <Pill className="h-4 w-4 text-orange-500" />,
      TRIAGE_ASSIGNED: <FileText className="h-4 w-4 text-indigo-500" />,
      CONSULTATION_COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
    };
    return icons[type] || <Bell className="h-4 w-4 text-gray-500" />;
  };

  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
     <DropdownMenuTrigger
  render={
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-xs">
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  }
/>

      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
      <DropdownMenuGroup>
  <DropdownMenuLabel className="flex items-center justify-between">
    <span>Notifications</span>
    {unreadCount > 0 && (
      <Button variant="ghost" size="sm" className="text-xs text-blue-600" onClick={handleMarkAllAsRead}>
        <CheckCheck className="h-3 w-3 mr-1" />
        Mark all read
      </Button>
    )}
  </DropdownMenuLabel>
</DropdownMenuGroup>

        <DropdownMenuSeparator />

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex items-start gap-3 p-3 cursor-pointer ${
                !n.isRead ? "bg-blue-50" : ""
              }`}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
            >
              <div className="mt-1">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? "font-semibold" : ""}`}>
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
              )}
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-sm text-blue-600"
          onClick={() => {
            setOpen(false);
            navigate("/dashboard/notifications");
          }}
        >
          View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;