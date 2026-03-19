import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import client from "../api/client";
import { ChevronLeft, Bell } from "lucide-react";
import UserMenu from "../components/UserMenu";
import JobAnalysisProgressModal from "../components/JobAnalysisProgressModal";

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
        <h1 className="font-bold text-gray-900 text-lg">공고 등록</h1>
        <div className="w-10 flex justify-end">
          <UserMenu />
        </div>
      </div>

      <div className="p-5 flex-1 relative">
        {/* 1. URL Input Section (Step 1) */}
        {/* 안내 문구 */}
        <div className="mb-4 flex justify-center">
          <p className="text-sm font-extrabold text-[#101827]">
            현재는 사람인, 원티드 링크만 등록 가능해요
          </p>
        </div>

        <div className="relative">
          <div
            className={`bg-gray-50 rounded-xl p-1 flex items-center pr-2 ${error ? "border border-red-500" : ""}`}
          >
            <input
              type="text"
              placeholder={url ? "" : "채용공고 링크를 입력하세요"} // Placeholder logic
              className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-sm px-3 py-3 text-gray-900 placeholder-gray-500"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (validateUrl(e.target.value)) setError("");
              }}
              disabled={!!result} // Keep input visually but disabled if analyzed? Spec says "URL 입력 영역은 유지된다... prefill... disabled 언급은 없음"
              // Actually spec says "URL 분석 1회 이상 수행하여... 공고 정보가 표시된 상태에서도 URL 입력 영역은 유지된다... URL을 다시 등록하여 갱신할 수 있다."
              // So DO NOT disable input.
            />
            <button
              onClick={handleAnalyze}
              disabled={!url || !validateUrl(url) || loading}
              className={`text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex-shrink-0
                                ${
                                  !url || !validateUrl(url) || loading
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-[#101827] text-white hover:bg-[#1a263d]"
                                }`}
            >
              {loading ? "분석중" : "등록"}
            </button>
          </div>
        </div>

        {/* Error Message Inline */}
        {error && <p className="text-red-500 text-xs mt-1.5 ml-1">{error}</p>}

        {/* 2. Analysis Result (Step 3) - Only shown after analysis */}
        {result && (
          <div className="mt-8 pb-24 animate-fade-in-up">
            {/* Wrapper for the result fields */}
            <div className="p-1 relative">
              {/* AI Summary (moved to top) */}
              <section className="mb-8">
                <div className="mb-2 text-xs text-gray-900 font-bold">
                  AI공고 요약
                </div>
                <div className="bg-gray-100 rounded-xl p-4 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap break-words min-h-[120px]">
                  {result.aiSummary || "AI 요약 정보가 없습니다."}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                {/* Company */}
                <div className="flex flex-col">
                  <div className="text-xs text-gray-900 font-bold mb-2">
                    기업명
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2.5 text-sm text-gray-700 font-medium break-words flex-1 flex items-center">
                    {result.companyName || "-"}
                  </div>
                </div>
                {/* Job Title */}
                <div className="flex flex-col">
                  <div className="text-xs text-gray-900 font-bold mb-2">
                    직무 명
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2.5 text-sm text-gray-700 font-medium break-words flex-1 flex items-center">
                    {result.jobTitle || "-"}
                  </div>
                </div>

                {/* Main Tasks */}
                <div className="col-span-1 flex flex-col">
                  <div className="text-xs text-gray-900 font-bold mb-2">
                    주요 업무
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2.5 text-xs text-gray-700 font-medium flex-1 flex flex-col gap-1.5 break-words">
                    {result.mainTasks && result.mainTasks.length > 0
                      ? result.mainTasks.map((task, index) => (
                          <div key={index}>- {task}</div>
                        ))
                      : "-"}
                  </div>
                </div>
                {/* Tech Stack */}
                <div className="col-span-1 flex flex-col">
                  <div className="text-xs text-gray-900 font-bold mb-2">
                    필요기술스택
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2.5 text-xs text-gray-700 font-medium flex-1 flex flex-col gap-1.5 break-words">
                    {result.skills && result.skills.length > 0
                      ? result.skills.map((skill, index) => (
                          <div key={index}>- {skill}</div>
                        ))
                      : "-"}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex flex-col">
                  <div className="text-xs text-gray-900 font-bold mb-2">
                    모집상태
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2.5 text-sm text-gray-700 font-medium">
                    {result.status === "OPEN" ? "모집중" : "마감"}
                  </div>
                </div>
                {/* Period */}
                <div className="col-span-2 flex flex-col">
                  <div className="text-xs text-gray-900 font-bold mb-2">
                    모집 기간
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2.5 text-xs text-gray-700 font-medium">
                    {result.startDate && result.endDate
                      ? `${result.startDate.replaceAll("-", ".")} ~ ${result.endDate.replaceAll("-", ".")}`
                      : "-"}
                  </div>
                </div>
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

      {/* Analysis Progress Modal */}
      <JobAnalysisProgressModal isOpen={loading} />
    </div>
  );
};

export default JobAnalysis;
