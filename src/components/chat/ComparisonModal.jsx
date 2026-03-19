import { useState, useEffect, useRef } from "react";
import { X, Loader2, TrendingUp, TrendingDown, Brain } from "lucide-react";
import toast from "react-hot-toast";
import { postMemberComparison, getMemberComparison } from "../../api/chatApi";

const ComparisonModal = ({ chatRoomId, member, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollTimerRef = useRef(null);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const pollComparison = async () => {
    try {
      const res = await getMemberComparison(chatRoomId, member.chatRoomMemberId);
      setData(res.data.data);
      setLoading(false);
    } catch (e) {
      const code = e.response?.data?.code;
      if (code === "COMPARISON_RESULT_NOT_FOUND") {
        pollTimerRef.current = setTimeout(pollComparison, 3000);
      } else if (code === "AI_SERVICE_ERROR") {
        toast.error("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", { id: "scuad-toast" });
        onClose();
      } else if (code === "CHAT_MEMBER_NOT_FOUND") {
        toast.error("멤버 정보를 찾을 수 없습니다.", { id: "scuad-toast" });
        onClose();
      } else {
        toast.error("비교 결과를 불러오지 못했습니다.", { id: "scuad-toast" });
        onClose();
      }
    }
  };

  useEffect(() => {
    const requestComparison = async () => {
      try {
        await postMemberComparison(chatRoomId, member.chatRoomMemberId);
      } catch (e) {
        // 이미 처리 중인 경우(202 외 응답)에도 폴링 진행
      }
      pollComparison();
    };
    requestComparison();

    return () => stopPolling();
  }, [chatRoomId, member.chatRoomMemberId]);

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative w-full max-w-[480px] bg-white rounded-t-3xl animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">AI 비교 분석</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              나 vs {member.nickname}
            </p>
          </div>
          {!loading && (
            <button onClick={onClose} className="p-1">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 px-5">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
              <Brain className="w-8 h-8 text-gray-400 animate-pulse" />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-bold text-gray-900">
                AI가 분석 중입니다
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                최초 분석 시 수십 초가 걸릴 수 있습니다{"\n"}
                잠시만 기다려 주세요
              </p>
            </div>
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : data ? (
          <div className="p-5 space-y-6 pb-8">
            {/* Metrics */}
            {data.comparisonMetrics?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">항목별 비교</h3>
                {data.comparisonMetrics.map((metric, i) => (
                  <div key={i} className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-700">
                      {metric.name}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-gray-500 w-5 flex-shrink-0">
                          나
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-[#101827] rounded-full transition-all duration-700"
                            style={{ width: `${metric.myScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-900 w-6 text-right">
                          {metric.myScore}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-gray-400 w-5 flex-shrink-0">
                          상대
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gray-400 rounded-full transition-all duration-700"
                            style={{ width: `${metric.competitorScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-6 text-right">
                          {metric.competitorScore}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center space-x-4 pt-1">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-2 rounded-full bg-[#101827]" />
                    <span className="text-[10px] text-gray-500">나</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-2 rounded-full bg-gray-400" />
                    <span className="text-[10px] text-gray-500">
                      {member.nickname}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Strengths */}
            {data.strengthsReport && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-green-900">
                    내가 강한 점
                  </h3>
                </div>
                <p className="text-sm text-green-800 leading-relaxed">
                  {data.strengthsReport}
                </p>
              </div>
            )}

            {/* Weaknesses */}
            {data.weaknessesReport && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-orange-900">
                    보완이 필요한 점
                  </h3>
                </div>
                <p className="text-sm text-orange-800 leading-relaxed">
                  {data.weaknessesReport}
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl text-sm"
            >
              닫기
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ComparisonModal;
