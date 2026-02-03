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

  const startDate = job.startDate ? job.startDate.replaceAll("-", ".") : null;
  const endDate = job.endDate ? job.endDate.replaceAll("-", ".") : null;

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
          {/* Row 1: Company & Job Title */}
          <div className="flex flex-col">
            <div className="mb-2 text-xs font-bold text-gray-900">기업명</div>
            <div className="bg-[#F9FAFB] rounded-xl px-4 py-3.5 text-sm font-bold text-gray-900 border border-gray-100 flex-1 flex items-center min-h-[52px]">
              <span className="w-full break-keep">{job.companyName}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="mb-2 text-xs font-bold text-gray-900">직무명</div>
            <div className="bg-[#F9FAFB] rounded-xl px-4 py-3.5 text-sm font-bold text-gray-900 border border-gray-100 flex-1 flex items-center min-h-[52px]">
              <span className="w-full break-keep">{job.jobTitle}</span>
            </div>
          </div>

          {/* Row 2: Status & Period */}
          <div className="flex flex-col">
            <div className="mb-2 text-xs font-bold text-gray-900">모집상태</div>
            <div
              className={`rounded-xl px-4 py-3.5 text-sm font-bold border flex-1 flex items-center justify-center min-h-[52px]
                            ${!isClosed ? "bg-[#F9FAFB] text-gray-900 border-gray-100" : "bg-gray-100 text-gray-400 border-gray-200"}`}
            >
              {!isClosed ? "모집중" : "마감"}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="mb-2 text-xs font-bold text-gray-900">
              모집 기간
            </div>
            <div className="bg-[#F9FAFB] rounded-xl px-3 py-3.5 text-[11px] font-bold text-gray-900 border border-gray-100 flex-1 flex items-center justify-center min-h-[52px] text-center">
              {startDate && endDate ? `${startDate} ~ ${endDate}` : "-"}
            </div>
          </div>

          {/* Row 3: Main Tasks & Tech Stack */}
          <div className="col-span-1 flex flex-col">
            <div className="mb-2 text-xs font-bold text-gray-900">
              주요 업무
            </div>
            <div className="bg-[#F9FAFB] rounded-xl px-4 py-4 text-sm font-medium text-gray-900 border border-gray-100 leading-relaxed flex-1 flex items-start break-words">
              {job.mainTasks && job.mainTasks.length > 0
                ? job.mainTasks.join(", ")
                : "-"}
            </div>
          </div>
          <div className="col-span-1 flex flex-col">
            <div className="mb-2 text-xs font-bold text-gray-900">
              필요기술스택
            </div>
            <div className="bg-[#F9FAFB] rounded-xl px-4 py-4 text-sm font-medium text-gray-900 border border-gray-100 leading-relaxed flex-1 flex items-start break-words">
              {job.skills && job.skills.length > 0
                ? job.skills.join(", ")
                : "-"}
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
              className="inline-block bg-[#101827] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#1a263d] transition-colors"
            >
              공고 바로가기
            </a>
          </div>
        )}

        {/* 3. AI Summary */}
        <section className="mb-28 mt-8">
          <div className="mb-2 text-xs font-bold text-gray-900">
            AI공고 요약
          </div>
          <div className="bg-[#F9FAFB] rounded-xl p-6 text-sm text-gray-700 leading-loose whitespace-pre-wrap min-h-[150px] break-words border border-gray-100">
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
