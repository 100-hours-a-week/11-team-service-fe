import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SCORE_ITEMS = [
  { key: "jobFitScore", label: "직무 적합도" },
  { key: "experienceClarityScore", label: "경력 및 성과 명확성" },
  { key: "readabilityScore", label: "가독성 및 신뢰도" },
];

const ResumeAnalysisReport = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-6 pb-4">
      {/* AI 종합 분석 */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="bg-[#101827] px-5 py-3.5 flex items-center">
          <span className="text-xs font-semibold text-white tracking-widest uppercase">
            AI 종합 분석
          </span>
        </div>
        <div className="bg-white px-5 py-5">
          <div className="text-sm text-gray-700 leading-[1.9] markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.aiAnalysisReport || "분석 결과가 없습니다."}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* 세부 평가 */}
      <div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-widest px-1 mb-3">
          세부 평가
        </p>
        <div className="space-y-3">
          {SCORE_ITEMS.map(({ key, label }) => (
            <div
              key={key}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-4 rounded-full bg-[#101827] inline-block shrink-0" />
                <span className="text-xs font-bold text-[#101827]">
                  {label}
                </span>
              </div>
              <div className="text-sm text-gray-600 leading-6 pl-3 markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {data[key] || "평가 내용이 없습니다."}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysisReport;
