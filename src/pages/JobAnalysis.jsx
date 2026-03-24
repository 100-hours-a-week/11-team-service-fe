import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import client from "../api/client";
import { ChevronLeft, Bell, Sparkles } from "lucide-react";
import UserMenu from "../components/UserMenu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const JobAnalysis = () => {
  const navigate = useNavigate();

  // State
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null); // Analysis Result
  const [loading, setLoading] = useState(false); // Analysis Loading
  const [confirmLoading, setConfirmLoading] = useState(false); // Save Loading
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const jobMasterIdParam = searchParams.get("jobMasterId");

  const isConfirmedRef = useRef(false);
  const resultRef = useRef(null);

  // Sync resultRef for cleanup
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  // Initial load if jobMasterId is provided (from notification)
  useEffect(() => {
    if (jobMasterIdParam) {
      const fetchResult = async () => {
        setLoading(true);
        try {
          const response = await client.get(
            `/api/v1/job-postings/${jobMasterIdParam}`,
          );
          const data = response.data.data;

          // If already confirmed (registered), redirect to detail page immediately
          if (data.registrationStatus === "CONFIRMED") {
            navigate(`/jobs/${jobMasterIdParam}`, { replace: true });
            return;
          }

          // Map jobStatus to status for compatibility with the component's rendering logic
          const mappedData = {
            ...data,
            status: data.jobStatus || data.status,
          };
          setResult(mappedData);
          if (data.sourceUrl) setUrl(data.sourceUrl);
        } catch (err) {
          console.error("Failed to fetch job posting result:", err);
          if (err.response?.status === 404) {
            toast.error("만료된 분석 결과입니다. 다시 등록해 주세요.", {
              id: "job-analysis-error",
            });
          } else {
            toast.error("정보를 불러오는데 실패했습니다.", {
              id: "job-analysis-error",
            });
          }
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    }
  }, [jobMasterIdParam]);

  // Cleanup on unmount: If not confirmed and result exists, delete draft
  useEffect(() => {
    return () => {
      // Check if we have a draft and it wasn't confirmed
      if (
        resultRef.current &&
        resultRef.current.jobMasterId &&
        !isConfirmedRef.current
      ) {
        // Use fetch with keepalive to ensure request completes after unload
        const token = localStorage.getItem("accessToken");
        const url = `${import.meta.env.VITE_API_BASE_URL || "/api"}/api/v1/job-postings/${resultRef.current.jobMasterId}`;

        fetch(url, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          keepalive: true,
        }).catch((e) => console.error("Auto-delete draft failed", e));
      }
    };
  }, []);

  // --- Actions ---

  // 1. Analyze / Register Click (Step 2)
  const handleAnalyze = async () => {
    // Validation
    if (!validateUrl(url)) {
      setError("올바른 URL 형식을 입력해주세요.");
      return;
    }
    setError("");
    setResult(null); // Clear previous result
    setLoading(true);

    try {
      // Normalize URL before sending to backend
      const normalizedUrl = normalizeUrl(url);

      // POST to analyze (checks duplicate internally at backend or just extracts)
      // As per prompt: "ai를 통해 중복판별 기능 작동"
      const response = await client.post("/api/v1/job-postings", {
        url: normalizedUrl,
      });
      const data = response.data.data;

      if (data.isExisting || data.existing) {
        toast.error("이미 등록된 공고입니다.", { id: "job-analysis-error" });
        // Redirect to existing job detail after a short delay so toast is visible
        setTimeout(() => {
          navigate(`/jobs/${data.jobMasterId}`, { replace: true });
        }, 1500);
        return;
      }

      if (data.isProcessing) {
        toast.success(
          data.isAlreadyProcessing
            ? "이미 분석이 진행 중입니다. 완료 시 알림을 드릴게요!"
            : "분석 시작! 완료 시 알림으로 알려드릴게요.",
          {
            id: "job-analysis-processing",
            duration: 4000,
          },
        );
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 3000);
        return;
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "정보를 불러오는데 실패했습니다.",
        { id: "job-analysis-error" },
      );
    } finally {
      setLoading(false);
    }
  };

  // Normalize URL by adding https:// if missing
  const normalizeUrl = (input) => {
    let normalized = input.trim();
    // If no protocol, add https://
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = "https://" + normalized;
    }
    return normalized;
  };

  const validateUrl = (input) => {
    if (!input || !input.trim()) return false;

    // Normalize first
    const normalized = normalizeUrl(input);

    // Check for valid domain pattern (must have at least one dot)
    // Example: saramin.co.kr, www.saramin.co.kr, https://saramin.co.kr
    if (!normalized.match(/^https?:\/\/[^\s]+\.[^\s]+/)) return false;

    // No spaces allowed
    if (normalized.includes(" ")) return false;

    return true;
  };

  // 2. Final Register (Confirm) (Step 5)
  const handleRegister = async () => {
    // Debug check
    if (!result) {
      toast.error("Internal Error: Result is missing");
      return;
    }
    if (!result.jobPostingId) {
      toast.error(
        "Internal Error: JobPosting ID is missing in result: " +
          JSON.stringify(result),
      );
      return;
    }

    setConfirmLoading(true);
    try {
      await client.patch(`/api/v1/job-postings/${result.jobMasterId}`, {
        registrationStatus: "CONFIRMED",
      });
      isConfirmedRef.current = true; // Mark as confirmed to prevent auto-delete
      navigate(`/jobs/${result.jobMasterId}`, { replace: true });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        toast.error("이미 등록된 공고입니다.", { id: "job-analysis-error" });
        setTimeout(() => {
          navigate(`/jobs/${result.jobPostingId}`, { replace: true });
        }, 1500);
      } else {
        toast.error(
          err.response?.data?.message || "등록 저장에 실패했습니다.",
          { id: "job-analysis-error" },
        );
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  // 3. Cancel Actions
  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    // AI 분석 후 생성된 Draft 상태의 공고가 있다면 삭제
    if (result && result.jobMasterId) {
      try {
        await client.delete(`/api/v1/job-postings/${result.jobMasterId}`);
      } catch (e) {
        console.error("Draft 삭제 실패:", e);
      }
    }
    navigate(-1);
  };

  const handleBackClick = () => {
    if (result) {
      setShowCancelModal(true);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-safe relative flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white px-4 h-14 flex items-center justify-between z-10">
        <button onClick={handleBackClick} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg truncate px-2">
          {result ? result.companyName : "공고 등록"}
        </h1>
        <div className="w-10 flex justify-end">
          <UserMenu />
        </div>
      </div>

      <div className="p-5 flex-1 relative">
        {/* 1. URL Input Section (Step 1) - Only shown if no result */}
        {!result && (
          <>
            {/* 안내 문구 */}
            <div className="mb-4 flex justify-center">
              <p className="text-sm font-extrabold text-[#101827]">
                현재는 원티드 링크만 등록 가능해요
              </p>
            </div>

            <div className="relative">
              <div
                className={`bg-white/80 backdrop-blur-md rounded-[20px] p-1 flex items-center pr-2 border border-gray-100 shadow-sm focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.08)] focus-within:border-gray-200 transition-all duration-300 ${error ? "border-red-500" : ""}`}
              >
                <input
                  type="text"
                  placeholder={url ? "" : "채용공고 링크를 입력하세요"}
                  className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-sm px-4 py-3.5 text-gray-900 placeholder-gray-400"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (validateUrl(e.target.value)) setError("");
                  }}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!url || !validateUrl(url) || loading}
                  className={`text-xs font-bold px-5 py-2.5 rounded-[12px] whitespace-nowrap transition-all flex-shrink-0 active:scale-95
                                    ${
                                      !url || !validateUrl(url) || loading
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-[#101827] text-white hover:bg-black shadow-sm"
                                    }`}
                >
                  {loading ? "분석중" : "분석 시작"}
                </button>
              </div>
            </div>

            {/* Error Message Inline */}
            {error && (
              <p className="text-red-500 text-xs mt-1.5 ml-1">{error}</p>
            )}
          </>
        )}

        {/* 2. Analysis Result (Step 3) - Only shown after analysis */}
        {result && (
          <div className="max-w-2xl mx-auto mt-8 pb-32 animate-fade-in-up">
            {/* Bento Grid Wrapper */}
            <div className="space-y-6">
              {/* AI Summary Card - Flagship Bento Box (Highlighted) */}
              <section className="bg-indigo-50/40 rounded-[24px] p-8 border border-indigo-100/50 shadow-sm">
                <div className="mb-6">
                  <span className="text-[12px] font-bold text-indigo-900 uppercase tracking-wider">
                    AI 공고 분석 결과
                  </span>
                </div>
                <div className="text-[15px] text-gray-900 leading-[1.8] font-medium whitespace-pre-wrap">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="mb-4 last:mb-0" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="text-indigo-700 font-bold underline decoration-indigo-200 decoration-2 underline-offset-4"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="list-disc ml-5 space-y-2 mb-4"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="pl-1" {...props} />
                      ),
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-lg font-bold mb-4 text-indigo-950"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-base font-bold mb-3 text-indigo-900"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {result.aiSummary?.replace(/\. +(?=[^0-9])/g, ".\n\n") ||
                      "AI 요약 정보가 없습니다."}
                  </ReactMarkdown>
                </div>
              </section>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-h-[90px]">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    기업명
                  </div>
                  <div className="text-[16px] font-semibold text-gray-900 break-words leading-tight">
                    {result.companyName || "-"}
                  </div>
                </div>

                {/* Job Title */}
                <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-h-[90px]">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    직무명
                  </div>
                  <div className="text-[16px] font-semibold text-gray-900 break-words leading-tight">
                    {result.jobTitle || "-"}
                  </div>
                </div>

                {/* Status */}
                <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-h-[90px]">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    모집상태
                  </div>
                  <div className="text-[15px] font-bold text-indigo-500">
                    {result.status === "OPEN" ? "모집중" : "마감"}
                  </div>
                </div>

                {/* Period */}
                <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-h-[90px]">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    모집기간
                  </div>
                  <div className="text-[14px] font-semibold text-gray-600">
                    {result.startDate && result.endDate
                      ? `${result.startDate.replaceAll("-", ".")} ~ ${result.endDate.replaceAll("-", ".")}`
                      : "-"}
                  </div>
                </div>
              </div>

              {/* Main Tasks & Skills - Larger Bento Boxes */}
              <div className="grid grid-cols-1 gap-4">
                {/* Main Tasks */}
                <section className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm">
                  <div className="text-[12px] font-bold text-gray-800 uppercase tracking-wider mb-6">
                    주요 업무
                  </div>
                  <div className="space-y-5">
                    {result.mainTasks && result.mainTasks.length > 0 ? (
                      result.mainTasks.map((task, index) => (
                        <div
                          key={index}
                          className="flex gap-4 items-start group"
                        >
                          <div className="mt-[10px] w-1 h-1 rounded-full bg-gray-300 group-hover:bg-indigo-400 transition-colors shrink-0" />
                          <span className="text-[15px] font-medium text-gray-700 leading-relaxed">
                            {task}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        정보가 없습니다.
                      </p>
                    )}
                  </div>
                </section>

                {/* Tech Stack */}
                <section className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm">
                  <div className="text-[12px] font-bold text-gray-800 uppercase tracking-wider mb-6">
                    필요 기술 스택
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {result.skills && result.skills.length > 0 ? (
                      result.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-white hover:border-gray-200 transition-all cursor-default"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        정보가 없습니다.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Action Buttons (Fixed, only when result exists) */}
      {result && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 p-4 pb-8 flex space-x-3 z-[100]">
          <button
            onClick={handleCancelClick}
            className="flex-1 bg-[#F3F4F6] text-[#101827] font-bold py-3.5 rounded-xl text-sm hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleRegister}
            disabled={confirmLoading}
            className={`flex-1 font-bold py-3.5 rounded-xl text-sm transition-colors text-white bg-[#101827] hover:bg-[#1a263d]`}
          >
            {confirmLoading ? "저장중" : "확인"}
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[300px] p-6 text-center shadow-xl animate-scale-in">
            <p className="text-gray-800 mb-6 font-semibold whitespace-pre-wrap text-sm leading-relaxed">
              작성 중인 내용이 저장되지 않습니다.
              <br />
              취소하시겠습니까?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm"
              >
                취소
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 bg-[#101827] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#1a263d] transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobAnalysis;
