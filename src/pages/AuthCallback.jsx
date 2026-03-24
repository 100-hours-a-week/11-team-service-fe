import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      if (error === "WITHDRAWN_USER") {
        toast.error("탈퇴한 계정입니다.", { id: "scuad-toast" });
      } else {
        toast.error("로그인에 실패했습니다. 다시 시도해주세요.", {
          id: "scuad-toast",
        });
      }
      navigate("/login");
      return;
    }

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
