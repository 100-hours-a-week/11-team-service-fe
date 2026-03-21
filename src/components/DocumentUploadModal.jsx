import { useRef, useState, useEffect } from "react";
import client from "../api/client";
import { AlertCircle, CheckCircle, Upload, X } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DocumentUploadModal = ({
  isOpen,
  onClose,
  applicationId,
  docType = "RESUME", // RESUME or PORTFOLIO
  onSuccess,
  successTitle = "업로드 완료!",
  successMessage,
  zIndex = 200,
}) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const docTypeName = docType === "RESUME" ? "이력서" : "포트폴리오";

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");

    if (selectedFile.type !== "application/pdf") {
      setError("PDF 형식으로 업로드해주세요.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("파일 용량이 10MB를 초과했습니다.");
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("doc_type", docType);
      formData.append("file", file);

      await client.post(
        `/api/v1/applications/${applicationId}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err?.response?.data?.message || "업로드에 실패하였습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      style={{ zIndex }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-scale-in">
        {/* Close Button */}
        {!success && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {success ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 animate-bounce-subtle">
              <CheckCircle className="w-8 h-8 text-[#101827]" />
            </div>
            <h2 className="text-xl font-bold text-[#101827] mb-2">
              {successTitle}
            </h2>
            <p className="text-gray-500 text-sm">
              {successMessage || `${docTypeName}가 성공적으로 등록되었습니다.`}
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {docTypeName} {file ? "업로드" : "수정"}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* File Select Area */}
              <div
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  file
                    ? "border-[#101827] bg-gray-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />

                {file ? (
                  <>
                    <div className="w-10 h-10 bg-gray-100 text-[#101827] rounded-full flex items-center justify-center mb-3">
                      <FileTextIcon />
                    </div>
                    <p className="text-sm font-bold text-gray-900 text-center break-all line-clamp-1 px-4">
                      {file.name}
                    </p>
                    <p className="text-xs text-[#101827] font-bold mt-1">
                      클릭하여 변경
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      파일 선택하기
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF 형식 (10MB 이하)
                    </p>
                  </>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center text-red-500 text-xs font-medium bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl text-sm hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!file || loading}
                  className={`flex-1 font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center ${
                    !file || loading
                      ? "bg-gray-300 text-white cursor-not-allowed"
                      : "bg-[#101827] text-white hover:bg-[#1a263d]"
                  }`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    "저장하기"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Simple icon logic
const FileTextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </svg>
);

export default DocumentUploadModal;
