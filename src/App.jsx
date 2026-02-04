import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#101827",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "600",
              borderRadius: "12px",
              padding: "14px 20px",
              textAlign: "center",
              wordBreak: "keep-all",
              textWrap: "balance",
            },
            error: {
              icon: null,
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
