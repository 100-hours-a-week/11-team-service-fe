import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FileText, User } from "lucide-react";
import UserMenu from "../components/UserMenu";
import Layout from "../components/Layout";
import Login from "../pages/Login";
import AuthCallback from "../pages/AuthCallback";
import Dashboard from "../pages/Dashboard";
import JobDetail from "../pages/JobDetail";
import JobAnalysis from "../pages/JobAnalysis";
import ChatRoomList from "../pages/ChatRoomList";
import MyChatRooms from "../pages/MyChatRooms";
import ChatRoom from "../pages/ChatRoom";
import MyApplications from "../pages/MyApplications";
import ResumeDetail from "../pages/ResumeDetail";
import DocumentViewer from "../pages/DocumentViewer";
import NotFound from "../pages/NotFound";

// 준비중 페이지 공통 컴포넌트
const ComingSoon = ({ title, icon: Icon }) => (
  <div className="bg-white min-h-screen flex flex-col">
    <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="font-bold text-gray-900 text-lg">{title}</h1>
        <UserMenu />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          서비스 준비중입니다
        </h3>
        <p className="text-gray-400 text-sm">빠른 시일 내에 찾아뵙겠습니다</p>
      </div>
    </div>
  </div>
);

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
              <MyApplications />
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
          path="applications/:applicationId"
          element={
            <ProtectedRoute>
              <ResumeDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="applications/:applicationId/documents/:docType"
          element={
            <ProtectedRoute>
              <DocumentViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="mypage"
          element={
            <ProtectedRoute>
              <ComingSoon title="마이페이지" icon={User} />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="chat/:chatRoomId"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />

      {/* Fallback - 정의되지 않은 경로는 404 페이지로 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
