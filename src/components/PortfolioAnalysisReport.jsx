import { Zap, Target, Sparkles, Award } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SCORE_ITEMS = [
  { key: "problemSolvingScore", label: "문제 해결 능력", icon: <Zap className="w-4 h-4 text-[#101827]" /> },
  { key: "contributionClarityScore", label: "기여도 및 역할 명확성", icon: <Target className="w-4 h-4 text-[#101827]" /> },
  { key: "technicalDepthScore", label: "기술 깊이 및 실무성", icon: <Sparkles className="w-4 h-4 text-[#101827]" /> },
];

const PortfolioAnalysisReport = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-10 pb-12 antialiased">
      {/* AI 종합 분석 */}
      <div className="space-y-5">
        <div className="px-1 ml-1 border-l-[6px] border-[#101827] pl-3">
          <h4 className="text-[16px] font-black text-[#101827] uppercase tracking-tighter leading-none">
            AI 종합 분석 리포트
          </h4>
        </div>
        <div className="bg-indigo-50/50 rounded-2xl p-7 border border-indigo-100/50 shadow-sm shadow-indigo-100/20">
          <div className="text-[15px] text-gray-800 leading-[1.85] markdown-content font-medium">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.aiAnalysisReport || "분석 결과가 없습니다."}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* 세부 평가 */}
      <div className="space-y-5">
        <div className="px-1 ml-1 border-l-[6px] border-[#101827] pl-3">
          <h4 className="text-[16px] font-black text-[#101827] uppercase tracking-tighter leading-none">
            세부 역량 평가
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-5">
          {SCORE_ITEMS.map(({ key, label, icon }) => (
            <div
              key={key}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
                {icon}
                <span className="text-[13px] font-bold text-[#101827]">
                  {label}
                </span>
              </div>
              <div className="px-7 py-6">
                <div className="text-[14px] text-gray-700 leading-relaxed markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {data[key] || "평가 내용이 없습니다."}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalysisReport;
