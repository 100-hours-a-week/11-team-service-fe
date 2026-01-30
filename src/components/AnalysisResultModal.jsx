import { useNavigate } from "react-router-dom";

const AnalysisResultModal = ({ isOpen, onClose, data, onGoToScore }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[340px] overflow-hidden shadow-2xl relative animate-scale-in">
        <div className="p-8 pb-6 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🎉</span>
          </div>

          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            AI 분석 완료!
          </h2>

          <div className="my-6">
            <span className="text-sm font-bold text-gray-500 mb-2 block">
              내 서류 점수
            </span>
            <div className="relative inline-block">
              <span className="text-5xl font-black text-gray-900 tracking-tighter leading-none">
                {data.overallScore || 0}
              </span>
              <span className="text-lg text-gray-400 font-bold ml-1">/100</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 font-medium break-keep leading-snug">
            {data.oneLineReview || "한 줄 평가는 분석 후 제공됩니다."}
          </div>
        </div>

        <div className="p-6 pt-2 space-y-3">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl text-sm hover:bg-gray-200 transition-all active:scale-[0.98]"
          >
            닫기
          </button>
          <button
            onClick={onGoToScore}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl text-sm hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
          >
            상세 리포트 확인하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultModal;
