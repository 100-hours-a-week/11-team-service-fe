import { useEffect, useRef, useState } from "react";
import { Clock, AlertCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const EvaluationProgressModal = ({
  isOpen,
  onClose,
  applicationId,
  onAnalysisComplete,
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen && applicationId) {
      setError(null);
      checkAnalysisStatus();
    }

    return () => {
      stopPolling();
    };
  }, [isOpen, applicationId]);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const checkAnalysisStatus = async () => {
    if (!applicationId) return;

    try {
      const response = await client.get(
        `/api/v1/applications/${applicationId}/analyses`,
      );

      // If success (200), it means analysis is ready
      if (response.status === 200 && response.data.data) {
        onAnalysisComplete(response.data.data);
      } else {
        // Explicitly handle 202 if it returns as success (some configs do this)
        if (response.status === 202) {
          pollTimerRef.current = setTimeout(checkAnalysisStatus, 3000);
        }
      }
    } catch (err) {
      // 202 might be thrown as an error depending on axios config
      if (err.response?.status === 202) {
        // Analysis in progress, retry in 3 seconds
        pollTimerRef.current = setTimeout(checkAnalysisStatus, 3000);
      } else {
        // Real error
        console.error("Polling error:", err);
        setError(
          "분석 중 오류가 발생했습니다. 잠시 후 '내 점수'에서 확인해주세요.",
        );
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[340px] overflow-hidden shadow-2xl relative animate-scale-in">
        <div className="p-8 pb-6 text-center">
          {error ? (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">
                오류 발생
              </h2>
              <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
                {error}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>

              <h2 className="text-xl font-extrabold text-gray-900 mb-3">
                AI 평가 진행 중
              </h2>

              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                방금 제출하신 지원서를 AI가 분석하고 있습니다.
                <br />
              </p>

              <div className="mt-6 bg-gray-50 rounded-xl p-4 flex items-start space-x-3 text-left">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-tight">
                  AI 분석은 보통 1~2분 정도 소요됩니다. 완료되면 자동으로 결과
                  리포트가 표시됩니다.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-6 pt-2">
          <button
            onClick={() => {
              onClose();
              navigate("/chat");
            }}
            className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl text-sm hover:bg-gray-200 transition-all active:scale-[0.98]"
          >
            닫기 {error ? "" : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationProgressModal;
