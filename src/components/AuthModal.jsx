import { AlertCircle } from "lucide-react";

const AuthModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onClose();
    // Force navigation to ensure redirect works reliably
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[320px] overflow-hidden shadow-2xl relative animate-scale-in">
        <div className="p-8 pb-6 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <AlertCircle className="w-8 h-8 text-[#101827]" />
          </div>

          <h2 className="text-xl font-extrabold text-[#101827] mb-3">알림</h2>

          <p className="text-gray-500 text-sm font-medium leading-relaxed whitespace-pre-wrap">
            {message || "로그인이 필요합니다."}
          </p>
        </div>

        <div className="p-6 pt-2">
          <button
            onClick={handleConfirm}
            className="w-full bg-[#101827] text-white font-bold py-4 rounded-2xl text-sm hover:bg-[#1a263d] transition-all active:scale-[0.98]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
