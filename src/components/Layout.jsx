import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
