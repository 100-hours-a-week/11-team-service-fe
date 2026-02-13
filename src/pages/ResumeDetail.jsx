import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  FileText,
  ExternalLink,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import client from "../api/client";
import DocumentUploadModal from "../components/DocumentUploadModal";
import EvaluationProgressModal from "../components/EvaluationProgressModal";
import AiAnalysisReportModal from "../components/AiAnalysisReportModal";

const ResumeDetail = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("RESUME");

  // Evaluation Modal State
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  // Background Polling State
  const [isPolling, setIsPolling] = useState(false);
  const pollingTimerRef = useRef(null);

  const fetchApplicationDetail = async () => {
    try {
      setLoading(true);
      const response = await client.get(
        `/api/v1/applications/${applicationId}`,
      );
      setApplication(response.data.data);
    } catch (e) {
      console.error("Failed to fetch application detail", e);
      // If forbidden or not found, go back
      if (
        e.response &&
        (e.response.status === 403 || e.response.status === 404)
      ) {
        alert("접근할 수 없는 지원서입니다.");
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetail();
  }, [applicationId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, []);

  const handleOpenDocument = (doc) => {
    if (!doc || !doc.isRegistered) {
      alert("등록된 파일이 없습니다.");
      return;
    }
    // Navigate to DocumentViewer page
    navigate(
      `/applications/${applicationId}/documents/${doc.docType.toLowerCase()}`,
    );
  };

  const handleEditDocument = (docType) => {
    setSelectedDocType(docType);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Refresh data after upload
    fetchApplicationDetail();
  };

  const checkAnalysisStatus = async () => {
    if (!applicationId) return;

    try {
      const response = await client.get(
        `/api/v1/applications/${applicationId}/analyses`,
      );

      if (response.status === 200 && response.data.data) {
        console.log("[DEBUG] Analysis complete, showing result modal");
        setIsPolling(false);
        setShowEvaluationModal(false);
        setAnalysisData(response.data.data);
        setShowReportModal(true);
      } else if (response.status === 202) {
        console.log("[DEBUG] Analysis in progress, polling again...");
        pollingTimerRef.current = setTimeout(checkAnalysisStatus, 3000);
      }
    } catch (e) {
      if (e.response?.status === 202) {
        pollingTimerRef.current = setTimeout(checkAnalysisStatus, 3000);
      } else {
        console.error("[DEBUG] Polling error", e);
        setIsPolling(false);
      }
    }
  };

  const handleRequestAnalysis = async () => {
    if (!application) return;

    try {
      setLoading(true);
      console.log("[DEBUG] Requesting analysis...");
      // First, request the analysis
      await client.post(`/api/v1/applications/${applicationId}/analyses`, {
        analysis_type: "EVALUATION",
      });
      console.log("Analysis request successful");
      console.log("[DEBUG] Analysis request successful, showing modal");

      // Only show modal after successful request
      setShowEvaluationModal(true);
      setIsPolling(true);
      pollingTimerRef.current = setTimeout(checkAnalysisStatus, 3000);
      console.log("[DEBUG] setShowEvaluationModal(true) called");
    } catch (e) {
      console.error("[DEBUG] Analysis request failed", e);
      setShowEvaluationModal(false);
      if (e.response && e.response.data && e.response.data.message) {
        alert(e.response.data.message);
      } else {
        alert("분석 요청 중 오류가 발생했습니다.");
      }
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
      <>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>

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
            fetchApplicationDetail();
          }}
          result={analysisData}
        />
      </>
    );
  }

  if (!application) {
    return (
      <>
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
            fetchApplicationDetail();
          }}
          result={analysisData}
        />
      </>
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${doc.isRegistered ? "bg-[#101827]/5 text-[#101827]" : "bg-gray-50 text-gray-300"}`}
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

                  {/* Status Badge */}
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
      />

      <AiAnalysisReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          fetchApplicationDetail();
        }}
        result={analysisData}
      />
    </div>
  );
};

export default ResumeDetail;
