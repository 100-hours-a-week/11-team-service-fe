import client from "./client";

export const getNotifications = async () => {
  const response = await client.get("/api/v1/notifications");
  return response.data.data;
};

export const getUnreadCount = async () => {
  const response = await client.get("/api/v1/notifications/unread-count");
  return response.data.data;
};

export const markAsRead = async (notificationId) => {
  const response = await client.patch(
    `/api/v1/notifications/${notificationId}/read`,
  );
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await client.patch("/api/v1/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await client.delete(
    `/api/v1/notifications/${notificationId}`,
  );
  return response.data;
};
