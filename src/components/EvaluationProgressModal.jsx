import { useEffect, useRef, useState } from "react";
import { Clock, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const EvaluationProgressModal = ({
  isOpen,
  onClose,
  applicationId,
  onAnalysisComplete,
}) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("REQUESTED"); // REQUESTED | PROGRESS | FAILED | SUCCESS
  const [errorDetails, setErrorDetails] = useState("");
  const pollTimerRef = useRef(null);

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
      setStatus("REQUESTED");
      setErrorDetails("");
      // First check might be "Requested" -> "Progress" transition
      // But practically we can start polling immediately.
      // Let's show "REQUESTED" for a brief moment or until first 202 response?
      // User said: "분석요청이면... 요청했습니다. 분석중이면... 진행중입니다."

      // We can simulate transition or rely on API.
      // Assuming 'applicationId' existing means request IS sent.
      // So immediate state is PROGRESS basically.
      // But to satisfy "Requested" text, we can show it for first cycle.

      setStatus("PROGRESS");
      // Actually user distinguishes "Requesting" (API call to start) vs "In Progress" (Polling).
      // Since this modal opens AFTER apply (which triggers start), we are in PROGRESS.
      // But maybe user wants to see "Requested" -> "Progress"?
      // Let's stick to "PROGRESS" as default for polling, but maybe "REQUESTED" if we were passing a "loading" prop?
      // The user says "분석요청하고 비동기잖아. 그래서 분석요청중이면 모달로 분석을 요청했습니다."
      // Maybe they mean the initial POST call?
      // ApplyModal handles the POST call. ApplyModal says "성공적으로 제출되었습니다".
      // Then this modal opens?

      // Let's implement the polling logic.
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

  // 종합평가만 폴링 - 완료 즉시 결과 표시
  const checkAnalysisStatus = async () => {
    if (!applicationId) return;

    try {
      const response = await client.get(
        `/api/v1/applications/${applicationId}/analyses`,
      );

      if (response.status === 200 && response.data.data) {
        // 종합평가 완료 → 바로 결과 표시 (이력서/포트폴리오는 DocumentViewer에서 별도 폴링)
        setStatus("SUCCESS");
        onAnalysisComplete(response.data.data);
      } else if (response.status === 202) {
        setStatus("PROGRESS");
        pollTimerRef.current = setTimeout(checkAnalysisStatus, 3000);
      }
    } catch (err) {
      if (err.response?.status === 202) {
        setStatus("PROGRESS");
        pollTimerRef.current = setTimeout(checkAnalysisStatus, 3000);
      } else {
        console.error("Polling error:", err);
        setStatus("FAILED");
        setErrorDetails(err.response?.data?.message || "");
      }
    }
  };

  if (!isOpen) return null;

  const currentConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PROGRESS;

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
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
              onClose();
              if (status === "FAILED") {
                // Stay or Navigate?
              }
            }}
            className="w-full bg-[#101827] text-white font-bold py-4 rounded-2xl text-sm hover:bg-[#1a263d] transition-all active:scale-[0.98]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationProgressModal;
