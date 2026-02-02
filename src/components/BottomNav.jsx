import { Link, useLocation } from "react-router-dom";
import { MessageSquare, FileText, MessageCircle, User } from "lucide-react";
import clsx from "clsx";

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: "커뮤니티", path: "/", icon: MessageSquare },
    { name: "이력관리", path: "/resume", icon: FileText },
    { name: "채팅방", path: "/chat", icon: MessageCircle },
    { name: "마이페이지", path: "/mypage", icon: User },
  ];

  const shouldHide =
    location.pathname.startsWith("/analysis") ||
    location.pathname.startsWith("/jobs") ||
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
            <Link
              key={item.path}
              to={item.path}
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
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
