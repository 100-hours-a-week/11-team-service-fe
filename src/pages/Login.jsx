import { MessageCircle } from "lucide-react";

const Login = () => {
  const handleLogin = () => {
    // Redirect to Backend Login Endpoint
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/kakao/login`;
  };

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center bg-white px-8 animate-fade-in">
      <div className="w-full flex flex-col items-center justify-center max-w-[340px]">
        {/* Logo/Brand Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-[#101827] mb-4 tracking-tighter">
            SCUAD
          </h1>
          <p className="text-gray-400 text-sm font-bold leading-relaxed">
            Smart Career Update <br /> Analysis Dashboard
          </p>
        </div>

        {/* Action Section */}
        <div className="w-full space-y-6 text-center">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-bold py-5 px-6 rounded-2xl transition-all shadow-md active:scale-[0.98]"
          >
            <MessageCircle className="w-7 h-7 fill-[#3C1E1E] stroke-none" />
            <span className="text-[17px]">카카오로 3초만에 시작하기</span>
          </button>

          <p className="text-gray-400 text-sm font-semibold leading-relaxed">
            간편하게 로그인하고
            <br />
            당신의 커리어를 관리하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
