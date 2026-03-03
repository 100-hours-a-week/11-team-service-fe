const SCORE_ITEMS = [
  { key: "problemSolvingScore", label: "문제 해결 능력" },
  { key: "contributionClarityScore", label: "기여도 및 역할 명확성" },
  { key: "technicalDepthScore", label: "기술 깊이 및 실무성" },
];

const PortfolioAnalysisReport = ({ data }) => {
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
          <p className="text-sm text-gray-700 leading-[1.9] whitespace-pre-wrap">
            {data.aiAnalysisReport || "분석 결과가 없습니다."}
          </p>
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
              <p className="text-sm text-gray-600 leading-6 pl-3">
                {data[key] || "평가 내용이 없습니다."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalysisReport;
