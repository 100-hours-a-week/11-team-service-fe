import { useEffect, useRef, useState } from "react";
import { Clock, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const EvaluationProgressModal = ({
  isOpen,
  onClose,
  applicationId,
  onAnalysisComplete,
  analysisType = "EVALUATION", // EVALUATION | RESUME | PORTFOLIO
  zIndex = 300,
}) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("REQUESTED"); // REQUESTED | PROGRESS | FAILED | SUCCESS
  const [errorDetails, setErrorDetails] = useState("");

  // Status Texts
  const STATUS_CONFIG = {
    REQUESTED: {
      title: "분석을 요청했습니다",
      desc: "AI에게 서류 분석을 요청하고 있습니다.",
      icon: <Clock className="w-8 h-8 text-blue-500 animate-pulse" />,
      bg: "bg-blue-50",
    },
    PROGRESS: {
      title: "분석 진행 중입니다",
      desc: "잠시만 기다려주세요...\nAI가 서류를 꼼꼼히 분석하고 있습니다.",
      icon: <Clock className="w-8 h-8 text-blue-500 animate-spin" />,
      bg: "bg-blue-50",
    },
    FAILED: {
      title: "분석에 실패했습니다",
      desc: "일시적인 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.",
      icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
      bg: "bg-red-50",
    },
    SUCCESS: {
      title: "분석 완료!",
      desc: "분석이 성공적으로 완료되었습니다.",
      icon: <CheckCircle className="w-8 h-8 text-[#101827]" />,
      bg: "bg-[#F3F4F6]",
    },
  };

  useEffect(() => {
    if (isOpen && applicationId) {
      setStatus("PROGRESS");
      setErrorDetails("");

      // SSE 이벤트 리스너 등록
      const handleSseNotification = (event) => {
        const { type, refId } = event.detail;

        // 내 지원서(applicationId)에 대한 AI 평가가 완료되었는지 확인
        if (
          type === "AI_EVAL_COMPLETE" &&
          Number(refId) === Number(applicationId)
        ) {
          // 최신 결과를 가져오기 위해 서버 재조회 (이미 완료된 상태이므로 즉시 반환될 것)
          fetchFinalResult();
        }
      };

      window.addEventListener("scuad-notification", handleSseNotification);

      // 초기 상태 확인 (이미 완료되었을 수도 있음)
      fetchFinalResult();

      return () => {
        window.removeEventListener("scuad-notification", handleSseNotification);
      };
    }
  }, [isOpen, applicationId]);

  const fetchFinalResult = async () => {
    if (!applicationId) return;
    try {
      const typePath =
        analysisType === "EVALUATION" ? "" : `/${analysisType.toLowerCase()}`;
      const response = await client.get(
        `/api/v1/applications/${applicationId}/analyses${typePath}`,
      );

      if (response.status === 200 && response.data.data) {
        setStatus("SUCCESS");
        onAnalysisComplete(response.data.data);
      } else if (response.status === 202) {
        setStatus("PROGRESS");
      }
    } catch (err) {
      if (err.response?.status === 202) {
        setStatus("PROGRESS");
      } else if (err.response?.status !== 202) {
        console.error("Fetch status error:", err);
        // Do not fail immediately, wait for SSE
      }
    }
  };

  if (!isOpen) return null;

  const currentConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PROGRESS;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      style={{ zIndex }}
    >
      <div className="bg-white rounded-[24px] w-full max-w-[340px] overflow-hidden shadow-2xl relative animate-scale-in">
        <div className="p-8 pb-6 text-center">
          <div
            className={`w-16 h-16 ${currentConfig.bg} rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            {currentConfig.icon}
          </div>

          <h2 className="text-xl font-extrabold text-gray-900 mb-3">
            {currentConfig.title}
          </h2>

          <p className="text-gray-500 text-sm font-medium leading-relaxed whitespace-pre-wrap">
            {currentConfig.desc}
            {errorDetails && (
              <span className="block mt-2 text-xs text-red-400">
                {errorDetails}
              </span>
            )}
          </p>

          {status === "PROGRESS" && (
            <div className="mt-6 bg-gray-50 rounded-xl p-4 flex items-start space-x-3 text-left">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-500 leading-tight">
                AI 분석은 보통 1~2분 정도 소요됩니다.
                <br />
                완료되면 결과 리포트가 표시됩니다.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 pt-2">
          <button
            onClick={() => {
              if (status === "SUCCESS") {
                navigate(`/applications/${applicationId}`);
              }
              onClose();
            }}
            className="w-full bg-[#101827] text-white font-bold py-4 rounded-2xl text-sm hover:bg-[#1a263d] transition-all active:scale-[0.98]"
          >
            {status === "SUCCESS" ? "결과 보기" : "닫기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationProgressModal;
