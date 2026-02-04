import { useNavigate, useLocation, Link } from "react-router-dom";
import { MessageSquare, FileText, MessageCircle, User } from "lucide-react"; // Updated icons
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, showAuthModal } = useAuth();

  const navItems = [
    { name: "커뮤니티", path: "/", icon: MessageSquare },
    { name: "이력관리", path: "/resume", icon: FileText },
    { name: "채팅방", path: "/chat", icon: MessageCircle },
    { name: "마이페이지", path: "/mypage", icon: User },
  ];

  // Hide BottomNav on these paths
  const hideOnPaths = ["/analysis", "/jobs", "/login"];
  const shouldHide =
    hideOnPaths.some((path) => location.pathname.startsWith(path)) ||
    /^\/chat\/\d+/.test(location.pathname);

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={(e) => {
                const isPublicPath = item.path === "/";
                if (!isPublicPath && !isAuthenticated) {
                  e.preventDefault();
                  showAuthModal("로그인이 필요합니다.");
                  return;
                }
                navigate(item.path);
              }}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full",
                isActive
                  ? "text-[#101827] font-bold"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <Icon
                className={clsx(
                  "w-6 h-6",
                  isActive ? "fill-[#101827]" : "stroke-current",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
