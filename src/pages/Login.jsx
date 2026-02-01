import { MessageCircle } from "lucide-react";

const Login = () => {
  const handleLogin = () => {
    // Redirect to Backend Login Endpoint
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/kakao/login`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SCUAD</h1>
        <p className="text-gray-600">
          Smart Career Update & Analysis Dashboard
        </p>
      </div>

      <div className="w-full max-w-sm">
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <MessageCircle className="w-6 h-6 fill-[#3C1E1E] stroke-none" />
          <span>카카오로 3초만에 시작하기</span>
        </button>
        <p className="mt-4 text-center text-sm text-gray-500">
          간편하게 로그인하고 당신의 커리어를 관리하세요.
        </p>
      </div>
    </div>
  );
};

export default Login;
