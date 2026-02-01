import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import {
  ChevronLeft,
  Share2,
  Building,
  Briefcase,
  Calendar,
  CheckCircle,
} from "lucide-react";
import ApplyModal from "../components/ApplyModal";
import EvaluationProgressModal from "../components/EvaluationProgressModal";
import AiAnalysisReportModal from "../components/AiAnalysisReportModal";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await client.get(`/api/v1/job-postings/${id}`);
        setJob(response.data.data);
      } catch (error) {
        console.error("Failed to fetch detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading)
    return (
      <div className="p-4 flex justify-center pt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  if (!job)
    return (
      <div className="p-4 text-center pt-20">공고를 찾을 수 없습니다.</div>
    );

  const startDate = job.startDate
    ? job.startDate.replaceAll("-", ".")
    : "YYYY.MM.DD";
  const endDate = job.endDate ? job.endDate.replaceAll("-", ".") : "YYYY.MM.DD";

  const isClosed = job.jobStatus !== "OPEN";

  return (
    <div className="bg-white min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">채용공고 상세</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-5">
        {/* 1. Basic Info Grid */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
          {/* Enterprise */}
          <div>
            <div className="text-xs text-gray-500 mb-1">기업명</div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-bold text-gray-900">
              {job.companyName}
            </div>
          </div>
          {/* Job Title */}
          <div>
            <div className="text-xs text-gray-500 mb-1">직무명</div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 truncate">
              {job.jobTitle}
            </div>
          </div>

          {/* Main Tasks */}
          <div className="col-span-1">
            <div className="text-xs text-gray-500 mb-1">주요 업무</div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 h-full flex items-center">
              {/* Assuming mainTasks is list, showing summary or first item for compactness as per wireframe, or comma joined */}
              <span className="line-clamp-2">
                {job.mainTasks && job.mainTasks.length > 0
                  ? job.mainTasks.join(", ")
                  : "-"}
              </span>
            </div>
          </div>
          {/* Tech Stack */}
          <div className="col-span-1">
            <div className="text-xs text-gray-500 mb-1">필요기술스택</div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 h-full flex items-center">
              <span className="line-clamp-2">
                {job.skills && job.skills.length > 0
                  ? job.skills.join(", ")
                  : "-"}
              </span>
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="text-xs text-gray-500 mb-1">모집상태</div>
            <div
              className={`rounded-lg px-3 py-2 text-sm font-bold inline-block
                            ${!isClosed ? "bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-400"}`}
            >
              {!isClosed ? "모집중" : "마감"}
            </div>
          </div>
          {/* Period */}
          <div>
            <div className="text-xs text-gray-500 mb-1">모집 기간</div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-gray-900 flex items-center h-full">
              {startDate}~{endDate}
            </div>
          </div>
        </div>

        {/* 2. External Link Button */}
        {job.sourceUrl && (
          <div className="mb-8 text-right">
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl text-sm hover:bg-gray-300 transition-colors"
            >
              공고 바로가기
            </a>
          </div>
        )}

        {/* --- [TEMP] Preview Button for AI Analysis Modal --- */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setAnalysisResult({
                totalScore: 78,
                oneLineReview:
                  "기술 경험은 충분하나 현장 트러블슈팅 경험이 부족함",
                competencyScores: [
                  { name: "기술 역량", score: 80 },
                  { name: "직무 적합성", score: 85 },
                  { name: "실무 경험", score: 70 },
                  { name: "성장 가능성", score: 90 },
                ],
                detailedFeedback:
                  "해당 지원자는 기술 역량 부분에서 클라우드 관련 경험이...\n해당 지원자는 기술 역량 부분에서 클라우드 관련 경험이...\n해당 지원자는 기술 역량 부분에서 클라우드 관련 경험이...\n해당 지원자는 기술 역량 부분에서 클라우드 관련 경험이...",
              });
              setIsReportModalOpen(true);
            }}
            className="text-xs text-gray-400 underline"
          >
            [테스트용] AI 분석 리포트 미리보기
          </button>
        </div>

        {/* 3. AI Summary */}
        <section className="mb-24">
          <div className="mb-2 text-sm font-bold text-gray-900">
            AI공고 요약
          </div>
          <div className="bg-gray-200 rounded-xl p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[150px] break-all">
            {job.aiSummary || "AI 요약 정보가 없습니다."}
          </div>
        </section>
      </div>

      {/* Custom Modals */}
      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        jobPostingId={job.id}
        jobTitle={job.jobTitle}
        onSuccess={(appId) => {
          setIsApplyModalOpen(false);
          setApplicationId(appId);
          setIsProgressModalOpen(true);
        }}
      />

      <EvaluationProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        applicationId={applicationId}
        onAnalysisComplete={(data) => {
          setIsProgressModalOpen(false);
          setAnalysisResult(data);
          setIsReportModalOpen(true);
        }}
      />

      <AiAnalysisReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        result={analysisResult}
      />
    </div>
  );
};

export default JobDetail;
