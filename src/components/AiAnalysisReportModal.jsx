import {
  ChevronLeft,
  Check,
  Star,
  Quote,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Award,
  Users,
  FileText,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AiAnalysisReportModal = ({
  isOpen,
  onClose,
  result,
  onEditResume,
  onEditPortfolio,
  onReanalyze,
  zIndex = 300,
}) => {
  if (!isOpen || !result) return null;

  const totalScore = result.overallScore || result.totalScore || 0;
  const detailedFeedback =
    result.feedbackDetail || result.detailedFeedback || result.aiSummary || "";
  const competencies = result.comparisonScores || result.competencyScores || [];

  const scoreIcons = {
    "직무 적합성": <Target className="w-4 h-4 text-[#101827]" />,
    "문화 적합성": <Users className="w-4 h-4 text-[#101827]" />,
    "성장 가능성": <TrendingUp className="w-4 h-4 text-[#101827]" />,
    "문제 해결 능력": <Zap className="w-4 h-4 text-[#101827]" />,
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-center animate-fade-in"
      style={{ zIndex }}
    >
      <div className="w-full max-w-[480px] h-full bg-white flex flex-col relative overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-4 h-14 flex items-center shadow-sm shrink-0">
          <button onClick={onClose} className="p-2 -ml-2 mr-2">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h2 className="font-bold text-gray-900 text-lg">AI 분석 리포트</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-10 space-y-6">
          {onReanalyze && (
            <div className="pt-2">
              <button
                onClick={onReanalyze}
                className="w-full py-4 bg-[#101827] text-white font-bold rounded-2xl text-[14px] hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                분석 재요청
              </button>
            </div>
          )}

          {/* Total Score - Clean White Design */}
          <div className="py-2 text-center">
            <div className="text-[11px] font-black text-gray-400 mb-1 uppercase tracking-widest">
              AI 종합 점수
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-7xl font-[900] text-[#101827] tracking-tighter drop-shadow-sm">
                {totalScore}
              </span>
              <span className="text-xl text-gray-300 font-black">/ 100</span>
            </div>
          </div>

          <div className="bg-indigo-50/30 rounded-2xl p-6 border border-indigo-100/30 text-center">
            <p className="text-[15px] font-bold text-gray-950 leading-relaxed">
              &quot;
              {result.oneLineReview?.replace(/^"|"$/g, "") ||
                "평가 준비 중입니다."}
              &quot;
            </p>
          </div>

          {/* Competency Scores */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 px-1 border-l-4 border-[#101827] ml-1 pl-2 font-black">
              역량 진단 현황
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {competencies.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2">
                      {scoreIcons[item.name]}
                      <span className="text-[13px] font-extrabold text-gray-700">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-black text-gray-900">
                      {item.score}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#101827] rounded-full"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 px-1 border-l-4 border-[#101827] ml-1 pl-2 font-black">
              상세 분석 코멘트
            </h4>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="text-[14px] text-gray-700 markdown-content leading-relaxed whitespace-pre-wrap font-medium">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {detailedFeedback}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 shrink-0 bg-white border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-[#101827] text-white font-black py-4 rounded-xl text-[15px] hover:bg-black transition-all active:scale-[0.98]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAnalysisReportModal;
