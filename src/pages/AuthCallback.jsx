import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    // refreshToken은 HttpOnly 쿠키로 자동 저장됨

    if (accessToken) {
      login(accessToken);
      // URL 히스토리에서 토큰 제거
      window.history.replaceState({}, document.title, "/auth/callback");
      navigate("/");
    } else {
      console.error("Login failed: Token not found in URL");
      navigate("/login");
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default AuthCallback;
