import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Login from "../pages/Login";
import AuthCallback from "../pages/AuthCallback";
import Dashboard from "../pages/Dashboard";
import JobDetail from "../pages/JobDetail";
import JobAnalysis from "../pages/JobAnalysis";
import ChatRoomList from "../pages/ChatRoomList";
import MyChatRooms from "../pages/MyChatRooms";
import ChatRoom from "../pages/ChatRoom";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, showAuthModal } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      showAuthModal("로그인이 필요합니다.");
    }
  }, [loading, isAuthenticated, showAuthModal]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="login" element={<Login />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route
          path="jobs/:id/chat"
          element={
            <ProtectedRoute>
              <ChatRoomList />
            </ProtectedRoute>
          }
        />
        <Route
          path="analysis"
          element={
            <ProtectedRoute>
              <JobAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="resume"
          element={
            <ProtectedRoute>
              <div className="p-8 text-center text-gray-500">
                이력관리 페이지 (준비 중)
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="chat"
          element={
            <ProtectedRoute>
              <MyChatRooms />
            </ProtectedRoute>
          }
        />
         <Route
          path="chat/:chatRoomId"
          element={
            <ProtectedRoute>
              <ChatRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="mypage"
          element={
            <ProtectedRoute>
              <div className="p-8 text-center text-gray-500">
                마이페이지 (준비 중)
              </div>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
