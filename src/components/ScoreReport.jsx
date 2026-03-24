import {
  ChevronLeft,
  Quote,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Award,
  Users,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ScoreReport = ({ data, onRetry, onClose }) => {
  if (!data) return null;

  const scoreIcons = {
    "직무 적합성": <Target className="w-4 h-4 text-[#101827]" />,
    "문화 적합성": <Users className="w-4 h-4 text-[#101827]" />,
    "성장 가능성": <TrendingUp className="w-4 h-4 text-[#101827]" />,
    "문제 해결 능력": <Zap className="w-4 h-4 text-[#101827]" />,
  };

  return (
    <div className="bg-white min-h-full flex flex-col animate-fade-in pb-10">
      {/* Header */}
      {onClose && (
        <div className="sticky top-0 bg-white z-30 border-b border-gray-100 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onClose} className="p-2 -ml-2 mr-2">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h2 className="font-bold text-gray-900 text-lg">
              AI 역량 분석 리포트
            </h2>
          </div>
        </div>
      )}

      <div className="p-5 space-y-6">
        {/* Total Score */}
        {/* Total Score - Clean White Design */}
        <div className="py-6 text-center">
          <div className="text-lg font-black text-[#101827] mb-2 uppercase tracking-widest">
            종합 점수
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-7xl font-black text-[#101827] tracking-tighter">
              {data.overallScore || 0}
            </span>
            <span className="text-xl text-gray-300 font-bold">/ 100</span>
          </div>
        </div>

        {/* One Line Review - Indigo Box Restored */}
        <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50 text-center">
          <p className="text-[15px] font-bold text-gray-900 leading-relaxed">
            {data.oneLineReview?.replace(/^"|"$/g, "") || "평가 준비 중입니다."}
          </p>
        </div>

        {/* Competency Scores */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-900 px-1 border-l-4 border-[#101827] ml-1 pl-2">
            세부 역량 평가
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {(data.comparisonScores || []).map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
              >
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2">
                    {scoreIcons[item.name]}
                    <span className="text-[13px] font-bold text-gray-700">
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
          <h4 className="text-sm font-bold text-gray-900 px-1 border-l-4 border-[#101827] ml-1 pl-2">
            심층 분석 및 제언
          </h4>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="text-[14px] text-gray-700 markdown-content leading-relaxed whitespace-pre-wrap">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data.feedbackDetail ||
                  data.aiSummary ||
                  "상세 내용이 없습니다."}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full bg-[#101827] text-white font-bold py-4 rounded-xl text-sm"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreReport;
