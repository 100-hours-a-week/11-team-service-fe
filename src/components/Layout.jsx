import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import AuthModal from "./AuthModal";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
  const { authModalConfig, closeAuthModal } = useAuth();

  return (
    <div className="flex justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-[480px] bg-white flex flex-col relative shadow-xl min-h-screen pb-16">
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
        <BottomNav />
      </div>

      <AuthModal
        isOpen={authModalConfig.isOpen}
        message={authModalConfig.message}
        onClose={closeAuthModal}
      />
    </div>
  );
};

export default Layout;
