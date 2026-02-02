import { useState, useEffect } from "react";
import { X, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { getMemberComparison } from "../../api/chatApi";

const ComparisonModal = ({ chatRoomId, member, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getMemberComparison(
          chatRoomId,
          member.chatRoomMemberId,
        );
        setData(res.data.data);
      } catch (e) {
        console.error("Failed to fetch comparison:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [chatRoomId, member.chatRoomMemberId]);

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[480px] bg-white rounded-t-3xl animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 z-10">
          <h2 className="text-lg font-bold text-gray-900">비교 분석</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : !data ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">비교 분석 결과를 불러올 수 없습니다</p>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Score Comparison */}
            <div className="flex items-center justify-center space-x-6">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">나</p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {data.myScore ?? "-"}
                </p>
              </div>
              <span className="text-gray-300 text-2xl font-light">vs</span>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">
                  {member.nickname}
                </p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {data.targetScore ?? "-"}
                </p>
              </div>
            </div>

            {/* Strengths */}
            {data.strengths?.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <h3 className="text-sm font-bold text-gray-900">
                    내가 강한 점
                  </h3>
                </div>
                <div className="space-y-2">
                  {data.strengths.map((s, i) => (
                    <div
                      key={i}
                      className="bg-green-50 border border-green-100 rounded-xl px-4 py-3"
                    >
                      <p className="text-sm text-green-800">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {data.weaknesses?.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-bold text-gray-900">
                    보완이 필요한 점
                  </h3>
                </div>
                <div className="space-y-2">
                  {data.weaknesses.map((w, i) => (
                    <div
                      key={i}
                      className="bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                    >
                      <p className="text-sm text-red-800">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {data.summary && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  종합 의견
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {data.summary}
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
        )}
      </div>
    </div>
  );
};

export default ComparisonModal;
