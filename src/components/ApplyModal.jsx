import { useState, useRef } from "react";
import client from "../api/client";
import { X, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ApplyModal = ({ isOpen, onClose, jobPostingId, jobTitle, onSuccess }) => {
  const [resume, setResume] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [helperText, setHelperText] = useState(""); // For file size warning
  const [success, setSuccess] = useState(false);

  const resumeInputRef = useRef(null);
  const portfolioInputRef = useRef(null);

  // Early return AFTER hooks
  if (!isOpen) return null;

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setHelperText("");

    // 1. Check Format (PDF only)
    if (file.type !== "application/pdf") {
      setError("PDF 형식으로 업로드해주세요.");
      return;
    }

    // 2. Check Size (10MB)
    if (file.size > MAX_FILE_SIZE) {
      setHelperText(
        "파일의 용량이 10MB를 초과했습니다. 10MB 이하의 파일을 등록해 주세요.",
      );
      return;
    }

    if (type === "RESUME") {
      setResume(file);
    } else {
      setPortfolio(file);
    }
  };

  const handleSubmit = async () => {
    if (!resume) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("jobPostingId", jobPostingId);
    formData.append("resume", resume);
    if (portfolio) {
      formData.append("portfolio", portfolio);
    }

    try {
      await client.post("/api/v1/applications", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // alert("지원서가 성공적으로 제출되었습니다."); // Removed
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || "업로드에 실패하였습니다";
      setError(errorMessage);
      setLoading(false);

      // 만약 이미 지원한 경우라면 부모 상태를 갱신하여 AI 평가 중임을 보여줌
      if (err.response?.status === 409 && onSuccess) {
        onSuccess();
      }
    }
  };

  // Helper to trigger hidden input
  const triggerFileArgs = (ref) => {
    ref.current.click();
  };

  // Reset state when closing (if needed, but component unmounts usually or strictly controlled)
  // But here we rely on parent to unmount or we should reset 'success' if we reuse the modal.
  // Assuming simple modal usage.

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-scale-in">
        {success ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              제출 완료!
            </h2>
            <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-[200px]">
              지원서가 성공적으로 제출되었습니다. <br />
              이제 AI 평가가 시작됩니다.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl text-sm hover:bg-black transition-all shadow-lg shadow-green-100 mt-8 active:scale-[0.98]"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-2">
              <h2 className="text-lg font-bold text-gray-900">지원하기</h2>
              <p className="text-xs text-gray-500 mt-1">{jobTitle}</p>
            </div>

            <div className="p-6 pt-4 space-y-6">
              {/* Resume Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-900">
                    이력서 <span className="text-red-500">*</span>
                  </label>
                  {resume && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-sm text-gray-500 truncate border border-gray-100">
                    {resume ? resume.name : "PDF 파일을 선택해주세요"}
                  </div>
                  <button
                    onClick={() => triggerFileArgs(resumeInputRef)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    파일
                  </button>
                  <input
                    type="file"
                    ref={resumeInputRef}
                    onChange={(e) => handleFileChange(e, "RESUME")}
                    accept="application/pdf"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Portfolio Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-900">
                    포트폴리오
                  </label>
                  {portfolio && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-sm text-gray-500 truncate border border-gray-100">
                    {portfolio ? portfolio.name : "선택 사항"}
                  </div>
                  <button
                    onClick={() => triggerFileArgs(portfolioInputRef)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    파일
                  </button>
                  <input
                    type="file"
                    ref={portfolioInputRef}
                    onChange={(e) => handleFileChange(e, "PORTFOLIO")}
                    accept="application/pdf"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Helper Text / Error Message */}
              <div className="min-h-[20px]">
                {helperText && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {helperText}
                  </p>
                )}
                {error && (
                  <p className="text-red-500 text-xs flex items-center font-bold">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {error}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 pt-0 flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!resume || !!error || loading}
                className={`flex-1 font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center
                                ${
                                  !resume || !!error || loading
                                    ? "bg-gray-300 text-white cursor-not-allowed"
                                    : "bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200"
                                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  "제출"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ApplyModal;
