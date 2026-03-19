import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import toast, { Toaster } from "react-hot-toast";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const handleGlobalClick = () => {
      // 화면의 어느 곳이든 클릭하면 모든 토스트 강제 종료
      toast.dismiss();
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleGlobalClick, {
        capture: true,
      });
    };
  }, []);
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          containerStyle={{
            top: 16,
          }}
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#111827",
              fontSize: "14px",
              fontWeight: "700",
              borderRadius: "20px",
              padding: "16px 24px",
              textAlign: "center",
              wordBreak: "keep-all",
              textWrap: "balance",
              boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            },
            success: {
              iconTheme: {
                primary: "#101827",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#101827",
                secondary: "#fff",
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
