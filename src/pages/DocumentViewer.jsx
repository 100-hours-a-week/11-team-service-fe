import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import client from "../api/client";
import PDFViewer from "../components/PDFViewer";

const DocumentViewer = () => {
  const { applicationId, docType } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("detail"); // "detail" | "report"
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentInfo, setDocumentInfo] = useState(null);

  useEffect(() => {
    fetchDocumentUrl();
  }, [applicationId, docType]);

  const fetchDocumentUrl = async () => {
    try {
      setLoading(true);
      // Fetch application details to get the document
      const appResponse = await client.get(
        `/api/v1/applications/${applicationId}`,
      );
      const application = appResponse.data.data;

      // Find the requested document
      const doc = application.documents.find(
        (d) => d.docType.toLowerCase() === docType.toLowerCase(),
      );

      if (!doc || !doc.isRegistered) {
        alert("등록된 파일이 없습니다.");
        navigate(-1);
        return;
      }

      setDocumentInfo(doc);

      // Get download URL
      const urlResponse = await client.get(
        `/api/v1/files/${doc.fileUrl}/download-url`,
      );
      const downloadUrl = urlResponse.data.data.downloadUrl;
      setPdfUrl(downloadUrl);
    } catch (e) {
      console.error("Failed to fetch document", e);
      alert("파일을 불러오는데 실패했습니다.");
      navigate(-1);
    } finally {
      setLoading(false);
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
            onClick={() => setActiveTab("detail")}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              activeTab === "detail"
                ? "text-[#101827] border-b-2 border-[#101827]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            상세보기
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              activeTab === "report"
                ? "text-[#101827] border-b-2 border-[#101827]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            리포트
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === "detail" && (
              <div className="h-full">
                <PDFViewer
                  fileUrl={pdfUrl}
                  fileName={documentInfo?.originalFileName}
                />
              </div>
            )}
            {activeTab === "report" && (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <p className="text-gray-400 text-sm">
                  리포트 기능은 준비 중입니다.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
