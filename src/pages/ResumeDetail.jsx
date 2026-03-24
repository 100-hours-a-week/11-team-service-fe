import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, FileText, ChevronRight, Loader2 } from "lucide-react";
import client from "../api/client";
import DocumentUploadModal from "../components/DocumentUploadModal";
import EvaluationProgressModal from "../components/EvaluationProgressModal";
import AiAnalysisReportModal from "../components/AiAnalysisReportModal";
import AlertModal from "../components/AlertModal";
import toast from "react-hot-toast";

const ResumeDetail = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isErrorHandled = useRef(false);

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("RESUME");

  // Evaluation Modal State
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const isRedirectingRef = useRef(false);

  // Alert State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    message: "",
    type: "info",
    onClose: null,
  });

  const fetchApplicationDetail = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await client.get(
        `/api/v1/applications/${applicationId}`,
      );
      setApplication(response.data.data);
    } catch (e) {
      console.error("Failed to fetch application detail", e);
      if (
        e.response &&
        (e.response.status === 403 || e.response.status === 404)
      ) {
        if (!isErrorHandled.current) {
          isErrorHandled.current = true;
          toast.error("접근할 수 없는 지원서입니다.", { id: "scuad-toast" });
          navigate(-1);
        }
      } else {
        if (!isErrorHandled.current) {
          isErrorHandled.current = true;
          toast.error("지원서 정보를 불러오는데 실패했습니다.", {
            id: "scuad-toast",
          });
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchEvaluationReport = async () => {
    try {
      setLoading(true);
      const response = await client.get(
        `/api/v1/applications/${applicationId}/analyses`,
      );
      if (response.status === 200 && response.data.data) {
        setAnalysisData(response.data.data);
        setShowReportModal(true);
      }
    } catch (e) {
      console.error("Failed to fetch evaluation report", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetail();
    if (searchParams.get("tab") === "report") {
      fetchEvaluationReport();
    }
  }, [applicationId, searchParams]);

  const handleOpenDocument = (doc) => {
    if (!doc || !doc.isRegistered) {
      toast.error("등록된 파일이 없습니다.");
      return;
    }
    navigate(
      `/applications/${applicationId}/documents/${doc.docType.toLowerCase()}`,
    );
  };

  const handleEditDocument = (docType) => {
    setSelectedDocType(docType);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchApplicationDetail(true);
  };

  const handleRequestAnalysis = async () => {
    if (!application) return;
    try {
      setLoading(true);
      isRedirectingRef.current = true; // 리다이렉트 중임을 표시

      await client.post(`/api/v1/applications/${applicationId}/analyses`, {
        analysis_type: "EVALUATION",
      });

      // 재분석인 경우 혹은 상세 페이지에서는 바로 목록으로 이동 (사용자 요청)
      toast.success("분석이 요청되었습니다. 잠시만 기다려주세요.");

      // 알림을 보여준 뒤 조금 있다가 모달을 닫고 목록으로 이동
      setTimeout(() => {
        setShowReportModal(false);
        navigate("/resume");
      }, 1200);
    } catch (e) {
      isRedirectingRef.current = false;
      setShowEvaluationModal(false);
      toast.error(
        e.response?.data?.message || "분석 요청 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisComplete = (data) => {
    setAnalysisData(data);
    setShowEvaluationModal(false);
    setShowReportModal(true);
  };

  const getStatusLabel = (status) => {
    if (!status) return null;
    switch (status) {
      case "ACTIVE":
        return { text: "지원완료", className: "bg-blue-50 text-blue-600" };
      case "PASSED":
        return { text: "서류합격", className: "bg-green-50 text-green-600" };
      case "REJECTED":
        return { text: "불합격", className: "bg-red-50 text-red-600" };
      default:
        return { text: status, className: "bg-gray-50 text-gray-600" };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}`;
  };

  if (loading && !application) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-200" />
        </div>
        <p className="text-gray-500 font-medium">
          지원서 정보를 불러올 수 없습니다.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2 bg-[#101827] text-white rounded-lg text-sm font-bold"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const statusLabel = getStatusLabel(application.jobStatus);

  return (
    <div className="bg-white min-h-screen pb-safe flex flex-col relative">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 border-b border-gray-100">
        <div className="flex items-center px-1 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors mr-1"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div className="flex items-center overflow-hidden">
            <h1 className="font-bold text-gray-900 text-base truncate">
              {application.companyName}
              <span className="font-normal text-gray-500 ml-2">
                {application.jobTitle}
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className="px-5 pt-3 pb-5 space-y-4">
        {/* Job Info Section */}
        <section>
          <div className="flex items-center space-x-2 mb-1">
            <span
              className={`text-[11px] font-bold px-2 py-1 rounded-md ${statusLabel?.className}`}
            >
              {statusLabel?.text}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {formatDate(application.appliedAt)}
            </span>
          </div>

          <button
            onClick={() => navigate(`/jobs/${application.jobMasterId}`)}
            className="w-full flex items-center justify-between bg-white border border-[#101827] px-4 py-3 rounded-xl group"
          >
            <span className="text-sm font-bold text-[#101827]">
              채용공고 상세보기
            </span>
            <ChevronRight className="w-4 h-4 text-[#101827]" />
          </button>
        </section>

        {/* Documents Section */}
        <section className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">나의 서류</h3>
          <div className="space-y-4">
            {application.documents.map((doc, index) => (
              <div
                key={index}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        doc.isRegistered
                          ? "bg-[#101827]/5 text-[#101827]"
                          : "bg-gray-50 text-gray-300"
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {doc.docType === "RESUME" ? "이력서" : "포트폴리오"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5 max-w-[150px] truncate">
                        {doc.isRegistered ? doc.originalFileName : "미등록"}
                      </p>
                    </div>
                  </div>

                  {doc.docType === "RESUME" && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                      필수
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenDocument(doc)}
                    disabled={!doc.isRegistered}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                      doc.isRegistered
                        ? "border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                        : "border-gray-100 text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    열기
                  </button>
                  <button
                    onClick={() => handleEditDocument(doc.docType)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    {doc.isRegistered ? "수정" : "등록"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 pb-safe z-20">
        <button
          onClick={handleRequestAnalysis}
          disabled={loading}
          className="w-full bg-[#101827] text-white font-bold text-base py-4 rounded-xl hover:bg-[#1a263d] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>분석 요청 중...</span>
            </>
          ) : (
            "AI 종합평가"
          )}
        </button>
      </div>

      <DocumentUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        applicationId={application.applicationId}
        docType={selectedDocType}
        onSuccess={handleModalSuccess}
      />

      <EvaluationProgressModal
        isOpen={showEvaluationModal}
        onClose={() => setShowEvaluationModal(false)}
        applicationId={applicationId}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <AiAnalysisReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          // 리다이렉트 중이 아닐 때만 기존 뒤로가기 로직 수행
          if (
            !isRedirectingRef.current &&
            searchParams.get("tab") === "report"
          ) {
            navigate(-1);
          } else if (!isRedirectingRef.current) {
            fetchApplicationDetail();
          }
        }}
        result={analysisData}
        onReanalyze={handleRequestAnalysis}
        zIndex={300}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          if (alertConfig.onClose) alertConfig.onClose();
          setAlertConfig((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
};

export default ResumeDetail;
