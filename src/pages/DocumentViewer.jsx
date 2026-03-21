import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2, Clock, AlertCircle } from "lucide-react";
import client from "../api/client";
import PDFViewer from "../components/PDFViewer";
import ResumeAnalysisReport from "../components/ResumeAnalysisReport";
import PortfolioAnalysisReport from "../components/PortfolioAnalysisReport";
import AlertModal from "../components/AlertModal";
import DocumentUploadModal from "../components/DocumentUploadModal";
import EvaluationProgressModal from "../components/EvaluationProgressModal";
import { Sparkles, FileEdit, FileText } from "lucide-react";
import toast from "react-hot-toast";

const DocumentViewer = () => {
  const { applicationId, docType } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "detail" ? "detail" : "report",
  ); // "report" | "detail"
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentInfo, setDocumentInfo] = useState(null);

  // Report state
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFetched, setReportFetched] = useState(false);
  const pollingRef = useRef(null);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showEvaluationProgress, setShowEvaluationProgress] = useState(false);

  // Alert State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    message: "",
    type: "info",
    onClose: null,
  });

  useEffect(() => {
    fetchDocumentUrl();

    if (activeTab === "report" && !reportFetched && !reportLoading) {
      setReportLoading(true);
      fetchReport();
    }

    // SSE 이벤트 리스너 등록
    const handleSseNotification = (event) => {
      const { type, refId } = event.detail;

      // 내 지원서(applicationId)에 대한 분석 완료 확인
      const isRelevant =
        Number(refId) === Number(applicationId) &&
        (type === "RESUME_COMPLETE" ||
          type === "PORTFOLIO_COMPLETE" ||
          type === "AI_EVAL_COMPLETE");

      if (isRelevant) {
        console.log("SSE: Analysis completion detected, refreshing...");
        fetchReport();
      }
    };

    window.addEventListener("scuad-notification", handleSseNotification);

    return () => {
      window.removeEventListener("scuad-notification", handleSseNotification);
    };
  }, [applicationId, docType, activeTab, reportFetched, reportLoading]);

  const fetchDocumentUrl = async () => {
    try {
      setLoading(true);
      const appResponse = await client.get(
        `/api/v1/applications/${applicationId}`,
      );
      const application = appResponse.data.data;

      const doc = application.documents.find(
        (d) => d.docType.toLowerCase() === docType.toLowerCase(),
      );

      if (!doc || !doc.isRegistered) {
        setAlertConfig({
          isOpen: true,
          message: "등록된 파일이 없습니다.",
          type: "info",
          onClose: () => navigate(-1),
        });
        return;
      }

      setDocumentInfo(doc);

      const urlResponse = await client.get(
        `/api/v1/files/${doc.fileUrl}/download-url`,
      );
      const downloadUrl = urlResponse.data.data.downloadUrl;
      setPdfUrl(downloadUrl);
    } catch (e) {
      console.error("Failed to fetch document", e);
      setAlertConfig({
        isOpen: true,
        message: "파일을 불러오는데 실패했습니다.",
        type: "error",
        onClose: () => navigate(-1),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    const endpoint =
      docType.toLowerCase() === "resume"
        ? `/api/v1/applications/${applicationId}/analyses/resume`
        : `/api/v1/applications/${applicationId}/analyses/portfolio`;

    try {
      const response = await client.get(endpoint);
      if (response.status === 200 && response.data.data) {
        setReportData(response.data.data);
        setReportLoading(false);
        setReportFetched(true);
      }
    } catch (e) {
      if (e.response?.status === 202) {
        // 첫 분석 시 데이터 없음 -> 로딩 유지
        setReportLoading(true);
      } else {
        setReportLoading(false);
        setReportFetched(true);
      }
    }
  };

  // 분석 중일 때 폴링 폴백 제거 (사용자 요청)

  const handleRequestAnalysis = async () => {
    try {
      setLoading(true);
      await client.post(`/api/v1/applications/${applicationId}/analyses`, {
        analysis_type:
          docType.toUpperCase() === "RESUME" ? "RESUME" : "PORTFOLIO",
      });

      // 만약 이미 데이터가 있다면(재분석이라면) 블로킹 모달을 띄우지 않고
      // 즉시 목록으로 이동 (사용자 요청)
      if (reportData) {
        toast.success("분석이 요청되었습니다. 잠시만 기다려주세요.");
        setTimeout(() => navigate("/resume"), 1200);
      } else {
        setShowEvaluationProgress(true);
      }
    } catch (e) {
      toast.error(
        e.response?.data?.message || "분석 요청 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisComplete = (data) => {
    setShowEvaluationProgress(false);
    setReportData(data);
    setReportFetched(true);
    setActiveTab("report");
    toast.success("분석이 완료되었습니다!");
  };

  const handleReportTabClick = () => {
    setActiveTab("report");
    if (!reportFetched && !reportLoading) {
      setReportLoading(true);
      fetchReport();
    }
  };

  const getDocumentTitle = () => {
    if (!documentInfo) return "";
    return documentInfo.docType === "RESUME" ? "이력서" : "포트폴리오";
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 border-b border-gray-100">
        <div className="flex items-center px-1 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors mr-1"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-bold text-gray-900 text-base">
            {getDocumentTitle()}
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={handleReportTabClick}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              activeTab === "report"
                ? "text-[#101827] border-b-2 border-[#101827]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            리포트
          </button>
          <button
            onClick={() => setActiveTab("detail")}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              activeTab === "detail"
                ? "text-[#101827] border-b-2 border-[#101827]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            상세보기
          </button>
        </div>

        {/* 상단 퀵 액션 바 (추가됨) */}
        {!loading && (
          <div className="px-5 py-3 flex items-center justify-end">
            {activeTab === "report" ? (
              <button
                onClick={handleRequestAnalysis}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101827] text-white rounded-lg text-xs font-bold hover:bg-black active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>분석 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-300" />
                    <span>분석 재요청</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm"
              >
                <FileEdit className="w-3 h-3 text-gray-400" />
                파일 수정
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {/* 상세보기 */}
        {activeTab === "detail" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : (
              <PDFViewer
                fileUrl={pdfUrl}
                fileName={documentInfo?.originalFileName}
              />
            )}
          </>
        )}

        {/* 리포트 */}
        {activeTab === "report" && (
          <div className="px-5 py-5 pb-10">
            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                <div className="w-[84px] h-[84px] border-[6px] border-[#F3F6FF] border-t-[#3B82F6] rounded-full animate-spin mb-8" />

                <h2 className="text-[22px] font-extrabold text-[#111827] mb-3 tracking-tight">
                  AI가 서류를 분석하고 있어요
                </h2>

                <p className="text-[#6B7280] text-[15px] font-medium">
                  잠시만 기다려 주세요!
                </p>
              </div>
            ) : reportData ? (
              <div className="p-5 space-y-8">
                {/* 탭 전환에 따른 레포트 렌더링 */}

                {docType.toLowerCase() === "resume" ? (
                  <ResumeAnalysisReport data={reportData} />
                ) : (
                  <PortfolioAnalysisReport data={reportData} />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
                <p className="text-sm font-bold text-gray-500">
                  분석 결과가 없습니다.
                </p>
                <p className="text-xs text-gray-400">
                  분석이 완료되면 결과가 여기에 표시됩니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          if (alertConfig.onClose) alertConfig.onClose();
          setAlertConfig((prev) => ({ ...prev, isOpen: false }));
        }}
      />

      <DocumentUploadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        applicationId={applicationId}
        docType={docType.toUpperCase()}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchDocumentUrl();
        }}
      />

      <EvaluationProgressModal
        isOpen={showEvaluationProgress}
        onClose={() => setShowEvaluationProgress(false)}
        applicationId={applicationId}
        onAnalysisComplete={handleAnalysisComplete}
        analysisType={docType.toUpperCase()}
      />
    </div>
  );
};

export default DocumentViewer;
