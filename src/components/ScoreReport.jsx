import { ChevronLeft } from "lucide-react";

const ScoreReport = ({ data, onRetry, onClose }) => {
  if (!data) return null;

  return (
    <div className="bg-white min-h-full flex flex-col animate-fade-in relative">
      {/* Optional Header for Modal Mode */}
      {onClose && (
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <button onClick={onClose} className="p-2 -ml-2 mr-2">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h2 className="font-bold text-gray-900 text-lg">AI 분석 리포트</h2>
          </div>
        </div>
      )}

      <div className="p-6 pb-8 space-y-8">
        {/* Score Header */}
        <div className="flex flex-col items-center mt-6 mb-8">
          <span className="text-base font-bold text-gray-500 mb-3 block">
            종합 점수
          </span>
          <div className="relative flex items-end">
            <span className="text-7xl font-black text-[#101827] tracking-tighter leading-none">
              {data.overallScore || 0}
            </span>
            <span className="text-2xl text-gray-300 font-bold mb-2 ml-2">
              /100
            </span>
          </div>
        </div>

        {/* One Line Review - Clean Box Style */}
        <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 flex justify-center text-center">
          <p className="text-lg font-bold text-gray-900 leading-relaxed break-keep">
            "{data.oneLineReview || "한 줄 평가는 분석 후 제공됩니다."}"
          </p>
        </div>

        {/* Competency Scores */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-lg font-bold text-gray-900">역량 분석</h4>
            <span className="text-xs font-medium text-gray-400">
              항목별 세부 점수
            </span>
          </div>

          <div className="bg-[#F9FAFB] rounded-2xl border border-gray-100 p-5 space-y-5">
            {(data.comparisonScores || []).map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-sm font-extrabold text-[#101827]">
                    {item.score}
                    <span className="text-gray-300 text-xs font-normal ml-0.5">
                      /100
                    </span>
                  </span>
                </div>
                <div className="h-3 w-full bg-white rounded-full overflow-hidden ring-1 ring-gray-200">
                  <div
                    className="h-full bg-[#101827] rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${item.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {(!data.comparisonScores || data.comparisonScores.length === 0) && (
              <div className="text-center text-gray-400 text-sm py-4">
                상세 역량 점수가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-gray-900 px-1">상세 피드백</h4>
          <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100">
            <p className="text-sm text-gray-700 leading-7 whitespace-pre-wrap text-justify font-medium">
              {data.feedbackDetail ||
                data.aiSummary ||
                "상세 피드백이 없습니다."}
            </p>
          </div>
        </div>

        {/* Retry Button Removed as requested */}

        {/* Close Button for Modal Mode */}
        {onClose && (
          <div className="pt-6">
            <button
              onClick={onClose}
              className="w-full bg-[#101827] text-white font-bold py-5 rounded-2xl text-[15px] hover:bg-[#1a263d] transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreReport;
