import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Loader2,
  Sparkles,
  FileText,
  Zap,
  ChevronRight,
} from "lucide-react";
import client from "../api/client";
import UserMenu from "../components/UserMenu";
import DocumentUploadModal from "../components/DocumentUploadModal";
import EvaluationProgressModal from "../components/EvaluationProgressModal";
import AiAnalysisReportModal from "../components/AiAnalysisReportModal";
import toast from "react-hot-toast";

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("RESUME");
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] =
    useState("EVALUATION");
  const [triggerAnalysisAfterUpload, setTriggerAnalysisAfterUpload] =
    useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [keyword]);

  const fetchApplications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await client.get("/api/v1/applications/me", {
        params: { keyword: debouncedKeyword || undefined },
      });
      setApplications(response.data.data);
    } catch (e) {
      console.error("Failed to fetch applications", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [debouncedKeyword]);

  // Background SSE Listener for Automatic Refresh
  useEffect(() => {
    const handleSseNotification = async (event) => {
      const { type, refId } = event.detail;
      const appId = Number(refId);

      // AI 분석 완료 이벤트 감지
      if (
        type === "AI_EVAL_COMPLETE" ||
        type === "RESUME_COMPLETE" ||
        type === "PORTFOLIO_COMPLETE"
      ) {
        // 1. 지원 목록 무소음 갱신 (점수 배지 등)
        fetchApplications(true);

        // 2. 만약 현재 리포트 모달이 열려있고, 해당 지원서에 대한 분석이라면 리포트 데이터도 갱신
        if (
          showReportModal &&
          selectedApp &&
          Number(selectedApp.id) === appId
        ) {
          try {
            const response = await client.get(
              `/api/v1/applications/${appId}/analyses`,
            );
            if (response.status === 200 && response.data.data) {
              setAnalysisData(response.data.data);
            }
          } catch (e) {
            console.error("Failed to auto-refresh analysis data", e);
          }
        }
      }
    };

    window.addEventListener("scuad-notification", handleSseNotification);
    return () => {
      window.removeEventListener("scuad-notification", handleSseNotification);
    };
  }, [showReportModal, selectedApp]);

  // 분석 중일 때 폴링 폴백 제거 (사용자 요청)

  const handleCardClick = async (app) => {
    // 종합 분석 리포트 데이터 가져오기 및 모달 열기
    try {
      setSelectedApp(app);
      setIsReportLoading(true); // Use a separate loading state for report fetching
      const response = await client.get(
        `/api/v1/applications/${app.id}/analyses`,
      );
      if (response.status === 200 && response.data.data) {
        setAnalysisData(response.data.data);
        setShowReportModal(true);
      }
    } catch (e) {
      console.error("Failed to fetch analysis result", e);
      toast.error("분석 결과를 불러올 수 없습니다. 먼저 분석을 요청해주세요.");
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleRequestAnalysis = async (app, type = "EVALUATION") => {
    try {
      setSelectedApp(app);
      setSelectedAnalysisType(type);
      setLoading(true);

      // 모달 즉시 닫기 및 목록 상태 낙관적 업데이트
      setShowReportModal(false);
      setApplications((prev) =>
        prev.map((item) =>
          item.id === app.id ? { ...item, isProcessing: true } : item,
        ),
      );

      await client.post(`/api/v1/applications/${app.id}/analyses`, {
        analysis_type: type,
      });

      // 이미 분석 결과가 있는 경우(재분석) 블로킹 모달 생략
      if (app.overallScore !== null) {
        toast.success("분석이 요청되었습니다. 잠시만 기다려주세요.");
      } else {
        setShowEvaluationModal(true);
      }
    } catch (e) {
      // 오류 시 분석 중 상태 롤백
      setApplications((prev) =>
        prev.map((item) =>
          item.id === app.id ? { ...item, isProcessing: false } : item,
        ),
      );
      toast.error(
        e.response?.data?.message || "분석 요청 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (app, type) => {
    // [프론트엔드 연결 강제화]
    // 백엔드 데이터(isRegistered 등)가 develop 서버에서 일시적으로 늦게 반영되더라도
    // 사용자가 리포트 버튼을 눌렀다면 무조건 해당 리포트 페이지로 이동시킵니다.
    if (type === "RESUME" || type === "PORTFOLIO") {
      const targetPath = `/applications/${app.id}/documents/${type.toLowerCase()}?tab=report`;
      console.log(`[Navigation] Force moving to: ${targetPath}`);
      navigate(targetPath);
    } else if (type === "EDIT_RESUME") {
      setSelectedApp(app);
      setSelectedDocType("RESUME");
      setIsUploadModalOpen(true);
    } else if (type === "EDIT_PORTFOLIO") {
      setSelectedApp(app);
      setSelectedDocType("PORTFOLIO");
      setIsUploadModalOpen(true);
    } else if (type === "RE_ANALYZE_ALL") {
      handleRequestAnalysis(app, "EVALUATION");
    } else if (type === "RE_ANALYZE_RESUME") {
      handleRequestAnalysis(app, "RESUME");
    } else if (type === "RE_ANALYZE_PORTFOLIO") {
      handleRequestAnalysis(app, "PORTFOLIO");
    }
  };

  const handleAnalysisComplete = (data) => {
    setAnalysisData(data);
    setShowEvaluationModal(false);
    setShowReportModal(true);
    fetchApplications(true); // 배경에서 목록 갱신 (점수 반영)
  };

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    fetchApplications(true);

    // 분석 트리거 예약이 있는 경우 자동 실행
    if (triggerAnalysisAfterUpload && selectedApp) {
      handleRequestAnalysis(selectedApp, selectedDocType);
      setTriggerAnalysisAfterUpload(false);
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return null; // Remove default status display
    switch (status) {
      case "ACTIVE":
        return {
          text: "지원완료",
          className: "bg-blue-50 text-blue-600 border-blue-100",
        };
      case "PASSED":
        return {
          text: "서류합격",
          className: "bg-green-50 text-green-600 border-green-100",
        };
      case "REJECTED":
        return {
          text: "불합격",
          className: "bg-red-50 text-red-600 border-red-100",
        };
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(
      date.getDate(),
    ).padStart(2, "0")}`;
  };

  return (
    <div className="bg-white min-h-screen pb-safe flex flex-col relative">
      {/* Header Section: Zero-Jump Structure */}
      <div className="bg-white sticky top-0 z-20 border-b border-gray-100 pb-5 pt-safe">
        {/* Title Row */}
        <div className="relative flex items-center justify-between h-14 px-4 mt-2">
          {/* Left: Back Button (Matched w-10) */}
          <div className="w-10 flex-shrink-0">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
          </div>

          <h1 className="font-bold text-gray-900 text-lg tracking-tight absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
            이력 관리
          </h1>

          {/* Right: Menu + Placeholder (w-10) to match Bell icon space */}
          <div className="flex items-center gap-1 flex-shrink-0 h-10">
            <div className="w-10 flex-shrink-0" />
            <UserMenu />
          </div>
          <UserMenu />
        </div>

        {/* Search Bar: Unified Pixel-Perfect Alignment */}
        <div className="px-5 mt-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-md border border-gray-100 rounded-[20px] text-sm placeholder-gray-400 focus:outline-none focus:shadow-[0_12px_40px_rgba(0,0,0,0.08)] focus:border-gray-200 transition-all font-medium"
              placeholder="기업명 또는 직무명 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content Area - 첫 번째 카드와 헤더 사이의 여백(pt-6) 추가 */}
      <div className="flex-1 px-5 pt-6 pb-24 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
            <p className="text-gray-400 text-sm font-medium">불러오는 중...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold mb-1">
              {debouncedKeyword
                ? "검색 결과가 없습니다"
                : "지원 내역이 없습니다"}
            </h3>
            <p className="text-gray-400 text-sm">
              {debouncedKeyword
                ? "다른 검색어로 다시 시도해보세요."
                : "채용공고에서 마음에 드는 직무에 지원해보세요!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const statusInfo = getStatusLabel(app.status);
              return (
                <div
                  key={app.id}
                  onClick={() => handleCardClick(app)}
                  className="bg-white rounded-[24px] p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col transition-all cursor-pointer group hover:shadow-lg hover:border-gray-200 active:scale-[0.99]"
                >
                  {/* 상단: 상태 배지 + 점수 + 기본 정보 */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2.5">
                        {statusInfo && (
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-md border ${statusInfo.className}`}
                          >
                            {statusInfo.text}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
                          {formatDate(app.appliedAt)}
                        </span>
                      </div>
                      <h3 className="text-[19px] font-bold text-gray-950 leading-tight mb-1.5 transition-colors">
                        {app.companyName}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">
                        {app.jobTitle}
                      </p>
                    </div>

                    {/* 점수 표시 부분 - 눈에 띄게 */}
                    {app.isProcessing ? (
                      <div className="flex items-center justify-center bg-blue-50/80 backdrop-blur-sm animate-pulse rounded-2xl px-5 h-[72px] border border-blue-200/50 shadow-[0_4px_12px_rgba(59,130,246,0.08)] transition-all duration-500">
                        <div className="flex flex-col items-center gap-1.5">
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          <span className="text-[10px] font-bold text-blue-600 tracking-tight">
                            분석 중...
                          </span>
                        </div>
                      </div>
                    ) : app.overallScore > 0 ||
                      app.resumeAnalyzed ||
                      app.portfolioAnalyzed ? (
                      <div className="flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-2xl px-5 h-[72px] border border-white shadow-[0_8px_20px_rgba(0,0,0,0.03),inset_0_-2px_6px_rgba(16,24,39,0.02),inset_0_2px_6px_rgba(255,255,255,0.8)]">
                        <div className="flex items-baseline">
                          <span className="text-3xl font-[900] text-[#101827] tracking-tighter drop-shadow-sm">
                            {app.overallScore || "-"}
                          </span>
                          <span className="text-[14px] font-black text-[#101827]/30 ml-1.5 transition-colors">
                            점
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center bg-gray-50/50 rounded-2xl w-[72px] h-[72px] border border-gray-100 border-dashed transition-all">
                        <span className="text-[11px] font-bold text-gray-400">
                          분석전
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mb-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(app, "RESUME");
                      }}
                      className="py-3 bg-white border border-gray-100 rounded-xl text-[13px] font-bold text-gray-700 active:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      이력서 리포트
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(app, "PORTFOLIO");
                      }}
                      className="py-3 bg-white border border-gray-100 rounded-xl text-[13px] font-bold text-gray-700 active:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-gray-400" />
                      포폴 리포트
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedApp && (
        <>
          {/* Document Upload Modal */}
          <DocumentUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            applicationId={selectedApp?.id}
            docType={selectedDocType}
            onSuccess={handleUploadSuccess}
            successTitle={
              triggerAnalysisAfterUpload ? "분석 요청 완료" : "수정 완료"
            }
            successMessage={
              triggerAnalysisAfterUpload
                ? "포트폴리오 분석이 요청되었습니다."
                : `${selectedDocType === "RESUME" ? "이력서" : "포트폴리오"}가 성공적으로 수정되었습니다.`
            }
            zIndex={400} // Added zIndex prop
          />
          <EvaluationProgressModal
            isOpen={showEvaluationModal}
            onClose={() => setShowEvaluationModal(false)}
            applicationId={selectedApp.id}
            onAnalysisComplete={handleAnalysisComplete}
            analysisType={selectedAnalysisType}
            zIndex={500} // Added zIndex prop
          />
        </>
      )}

      <AiAnalysisReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        result={analysisData}
        onReanalyze={() => handleRequestAnalysis(selectedApp, "EVALUATION")}
        zIndex={300} // Added zIndex prop
      />

      {/* 리포트 로딩 오버레이 - 전체 리스트를 가리지 않고 모달 로딩 느낌으로 */}
      {isReportLoading && (
        <div className="fixed inset-0 z-[300] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-bold text-gray-900">
              AI 리포트를 분석 중입니다...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
