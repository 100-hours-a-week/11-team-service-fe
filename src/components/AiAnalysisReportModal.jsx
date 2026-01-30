import { X, Check, Star } from "lucide-react";

const AiAnalysisReportModal = ({ isOpen, onClose, result }) => {
  if (!isOpen || !result) return null;

  // Backend Response Mapping:
  // overallScore -> totalScore
  // comparisonScores -> competencies
  // oneLineReview -> oneLineReview
  // feedbackDetail -> detailedFeedback

  const totalScore = result.overallScore || result.totalScore || 0;
  // If API returns feedbackDetail as string, use it.
  const detailedFeedback =
    result.feedbackDetail || result.detailedFeedback || result.aiSummary || "";

  // Mock competency scores if not provided, or ensure structure
  const competencies = result.comparisonScores ||
    result.competencyScores || [
      { name: "직무 적합성", score: 0 },
      { name: "기술 역량", score: 0 },
      { name: "실무 경험", score: 0 },
      { name: "성장 가능성", score: 0 },
    ];

  return (
    <div className="fixed inset-0 z-[300] flex justify-center items-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Main Modal Container: simplified to match Layout.jsx exactly but using 100dvh for mobile safety */}
      <div className="w-full max-w-[480px] h-full md:h-[100dvh] bg-white flex flex-col relative shadow-2xl z-10">
        {/* Header / Score Section (Fixed at top) */}
        <div className="p-6 pb-2 text-center shrink-0 bg-white z-10">
          <div className="flex flex-col items-center mb-6 mt-4">
            <span className="text-sm font-bold text-gray-500 mb-2">
              종합 점수
            </span>
            <div className="relative">
              <span className="text-6xl font-black text-gray-900 tracking-tighter leading-none">
                {totalScore}
              </span>
              <span className="text-xl text-gray-400 font-bold ml-1">/100</span>
            </div>
          </div>

          {/* One line review */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-2">
            <p className="text-gray-800 font-bold text-sm break-keep leading-snug">
              {result.oneLineReview || "한 줄 평가는 분석 후 제공됩니다."}
            </p>
          </div>
        </div>

        {/* Scrollable Content (Flex-1 fills remaining space) */}
        <div className="px-6 flex-1 overflow-y-auto min-h-0 custom-scrollbar pb-6 space-y-6">
          {/* Competency Scores */}
          <div className="space-y-4 pt-2">
            {competencies.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-gray-700">
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-400 font-bold">
                    {item.score}/100
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Feedback */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap text-justify">
              {detailedFeedback}
            </p>
          </div>
        </div>

        {/* Footer (Fixed at bottom) */}
        <div className="p-5 pb-8 pb-safe shrink-0 bg-white border-t border-gray-100/50">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl text-base hover:bg-black transition-all active:scale-[0.98]"
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAnalysisReportModal;
