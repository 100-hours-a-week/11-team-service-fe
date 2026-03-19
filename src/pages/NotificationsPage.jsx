import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2, ChevronLeft } from "lucide-react";
import UserMenu from "../components/UserMenu";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../api/notificationApi";
import strftime from "strftime";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { setUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await getNotifications();
      const notificationsList = data || [];
      setNotifications(notificationsList);

      // Sync global unread count with the fresh data
      const unread = notificationsList.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("알림 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification) => {
    // 1. Mark as read if unread
    if (!notification.isRead) {
      await handleMarkAsRead(notification.notificationId);
    }

    // 2. Determine path based on type and refId
    const { type, refId } = notification;
    if (!refId) {
      toast.error("관련 정보를 찾을 수 없습니다.");
      return;
    }

    switch (type) {
      case "AI_EVAL_COMPLETE":
        navigate(`/applications/${refId}?tab=report`);
        break;
      case "RESUME_COMPLETE":
        navigate(`/applications/${refId}/documents/resume?tab=report`);
        break;
      case "PORTFOLIO_COMPLETE":
        navigate(`/applications/${refId}/documents/portfolio?tab=report`);
        break;
      case "JOB_POSTING_COMPLETE":
        navigate(`/analysis?jobMasterId=${refId}`);
        break;
      default:
        toast.error("알 수 없는 알림 유형입니다.");
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("읽음 처리 실패:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("모든 알림을 읽음 처리했습니다.", { id: "scuad-toast" });
    } catch (error) {
      console.error("전체 읽음 처리 실패:", error);
      toast.error("전체 읽음 처리에 실패했습니다.", { id: "scuad-toast" });
    }
  };

  const handleDelete = async (id) => {
    try {
      const notificationToDelete = notifications.find(
        (n) => n.notificationId === id,
      );
      await deleteNotification(id);
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.notificationId !== id));
      toast.success("알림이 삭제되었습니다.", { id: "scuad-toast" });
    } catch (error) {
      console.error("알림 삭제 실패:", error);
      toast.error("알림 삭제에 실패했습니다.", { id: "scuad-toast" });
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return strftime("%m월 %d일 %H:%M", date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center flex-col min-h-screen bg-white">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="bg-white min-h-screen flex flex-col pb-24">
      {/* Header: unified absolute centralized layout */}
      <div className="sticky top-0 bg-white z-20 border-b border-gray-100 pt-safe">
        <div className="h-14 flex items-center justify-center px-4 relative mt-2">
          <div className="absolute left-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="font-bold text-gray-900 text-lg">알림</h1>
            {unreadCount > 0 && (
              <span className="bg-red-50 text-red-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="absolute right-4 flex items-center gap-3">
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className={`flex items-center gap-1.5 text-xs transition-colors font-medium active:scale-95 ${
                  unreadCount > 0
                    ? "text-gray-500 hover:text-[#101827]"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                disabled={unreadCount === 0}
              >
                <Check className="w-3.5 h-3.5" />
                모두 읽음
              </button>
            )}
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              새로운 알림이 없습니다
            </h3>
            <p className="text-gray-400 text-sm">
              소식이 도착하면 알려드릴게요
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {notifications.map((notification) => (
              <div
                key={notification.notificationId}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 py-4 transition-colors relative cursor-pointer ${notification.isRead ? "bg-white" : "bg-[#101827]/[0.03]"}`}
              >
                <div className="flex gap-3">
                  {/* Unread Indicator dot */}
                  <div
                    className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${notification.isRead ? "bg-transparent" : "bg-red-500"}`}
                  />

                  <div className="flex-1 min-w-0 pr-10">
                    <p
                      className={`text-sm mb-1 truncate ${notification.isRead ? "text-gray-500 font-medium" : "text-[#101827] font-bold"}`}
                    >
                      {notification.title}
                    </p>
                    <p
                      className={`text-sm mb-2 line-clamp-2 leading-snug ${notification.isRead ? "text-gray-400" : "text-gray-700"}`}
                    >
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Delete Button: Always visible, simple trash icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.notificationId);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 p-2 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
