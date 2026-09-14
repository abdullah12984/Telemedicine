import apiCall from "./api";

export const getNotifications = async (unread = false) => {
  const query = unread ? "?unread=true" : "";
  return apiCall(`/notifications${query}`);
};

export const markNotificationAsRead = async (id) => {
  return apiCall(`/notifications/${id}/read`, { method: "PUT" });
};

export const markAllNotificationsAsRead = async () => {
  return apiCall("/notifications/read-all", { method: "PUT" });
};