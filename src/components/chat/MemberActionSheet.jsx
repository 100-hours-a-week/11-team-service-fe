import { FileText, Briefcase, BarChart2, UserMinus } from "lucide-react";
import toast from "react-hot-toast";

// TODO: API 개발 완료 후 false로 변경
const COMING_SOON_ACTIONS = ["resume", "portfolio", "comparison"];

const MemberActionSheet = ({ isOpen, onClose, member, onAction }) => {
  if (!isOpen || !member) return null;

  const actions = [
    {
      key: "resume",
      label: "이력서 보기",
      icon: FileText,
      color: "text-gray-700",
    },
    {
      key: "portfolio",
      label: "포트폴리오 보기",
      icon: Briefcase,
      color: "text-gray-700",
    },
    {
      key: "comparison",
      label: "나와의 비교 결과 보기",
      icon: BarChart2,
      color: "text-gray-700",
    },
    {
      key: "kick",
      label: "강제 퇴장",
      icon: UserMinus,
      color: "text-red-500",
    },
  ];

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[480px] bg-white rounded-t-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-2">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-900">{member.nickname}</p>
        </div>

        {/* Actions */}
        <div className="pb-safe">
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={() => {
                if (COMING_SOON_ACTIONS.includes(action.key)) {
                  toast("준비중인 기능입니다");
                  onClose();
                  return;
                }
                onAction(action.key, member);
                onClose();
              }}
              className="w-full flex items-center space-x-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className={`text-sm font-medium ${action.color}`}>
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Cancel */}
        <div className="border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-4 text-sm font-medium text-gray-400 hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberActionSheet;
