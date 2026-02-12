import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const UserMenu = () => {
  const { isAuthenticated, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isAuthenticated) return null;

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setIsOpen(false);

    // 먼저 공개 페이지로 이동하여 ProtectedRoute의 auth 모달 방지
    navigate("/", { replace: true });

    try {
      await handleLogout();
    } catch (error) {
      // handleLogout already cleans up client state
    }

    toast("로그아웃되었습니다");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 -mr-2 text-gray-600 active:scale-[0.95] transition-transform"
        aria-label="메뉴"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[199]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-[200] overflow-hidden animate-scale-in">
            <button
              onClick={onLogout}
              disabled={loggingOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">로그아웃</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
