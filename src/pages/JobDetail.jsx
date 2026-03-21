import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import client from "../api/client";
import UserMenu from "../components/UserMenu";
import {
  ChevronLeft,
  Share2,
  Building,
  Briefcase,
  Calendar,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
        const data = response.data.data;
        console.log("[JobDetail] Received Data:", data);
        setJob(data);
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
      <div className="sticky top-0 bg-white border-b border-gray-100 pt-safe z-10">
        <div className="h-14 flex items-center justify-center px-4 relative mt-2">
          <div className="absolute left-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
          </div>
          <h1 className="font-bold text-gray-900 text-lg truncate px-2">
            {job?.companyName || "채용공고 상세"}
          </h1>
          <div className="absolute right-4">
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 1. AI Summary Card - Flagship Bento Box (Highlighted) */}
        <section className="bg-indigo-50/40 rounded-[24px] p-8 border border-indigo-100/50 shadow-sm animate-fade-in-up">
          <div className="mb-6">
            <span className="text-[12px] font-bold text-indigo-900 uppercase tracking-wider">
              AI 공고 요약
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
                  <ul className="list-disc ml-5 space-y-2 mb-4" {...props} />
                ),
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
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
              {job.aiSummary?.replace(/\. +(?=[^0-9])/g, ".\n\n") ||
                "AI 요약 정보가 없습니다."}
            </ReactMarkdown>
          </div>
        </section>

        {/* 2. Basic Info Grid */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up delay-100">
          {/* Company Name */}
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-h-[90px]">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              기업명
            </div>
            <div className="text-[16px] font-semibold text-gray-900 break-words leading-tight">
              {job.companyName || "-"}
            </div>
          </div>

          {/* Job Title */}
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-h-[90px]">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              직무명
            </div>
            <div className="text-[16px] font-semibold text-gray-900 break-words leading-tight">
              {job.jobTitle || "-"}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-h-[90px]">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              모집상태
            </div>
            <div
              className={`text-[15px] font-bold ${!isClosed ? "text-indigo-500" : "text-gray-400"}`}
            >
              {!isClosed ? "모집중" : "마감"}
            </div>
          </div>

          {/* Period */}
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-h-[90px]">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              모집기간
            </div>
            <div className="text-[14px] font-semibold text-gray-600">
              {startDate && endDate ? `${startDate} ~ ${endDate}` : "-"}
            </div>
          </div>
        </div>

        {/* 3. Main Tasks & Tech Stack - Larger Bento Boxes */}
        <div className="grid grid-cols-1 gap-4 animate-fade-in-up delay-200">
          {/* Main Tasks */}
          <section className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm">
            <div className="text-[12px] font-bold text-gray-800 uppercase tracking-wider mb-6">
              주요 업무
            </div>
            <div className="space-y-5">
              {job.mainTasks && job.mainTasks.length > 0 ? (
                job.mainTasks.map((task, index) => (
                  <div key={index} className="flex gap-4 items-start group">
                    <div className="mt-[10px] w-1 h-1 rounded-full bg-gray-300 group-hover:bg-indigo-400 transition-colors shrink-0" />
                    <span className="text-[15px] font-medium text-gray-700 leading-relaxed">
                      {task}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">정보가 없습니다.</p>
              )}
            </div>
          </section>

          {/* Tech Stack */}
          <section className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm">
            <div className="text-[12px] font-bold text-gray-800 uppercase tracking-wider mb-6">
              필요 기술 스택
            </div>
            <div className="flex flex-wrap gap-2.5">
              {job.skills && job.skills.length > 0 ? (
                job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-white hover:border-gray-200 transition-all cursor-default"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">정보가 없습니다.</p>
              )}
            </div>
          </section>
        </div>

        {/* 3. External Link Button (moved to bottom) */}
        <div className="pt-8 pb-32">
          <a
            href={job.sourceUrl || "#"}
            onClick={(e) => {
              if (!job.sourceUrl) {
                e.preventDefault();
                toast.error("원본 링크를 찾을 수 없습니다.");
              }
            }}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center bg-gray-900 text-white font-bold h-14 rounded-full text-sm hover:translate-y-[-2px] hover:shadow-lg transition-all active:scale-[0.98]"
          >
            공고 원본 확인하기
          </a>
        </div>
      </div>

      {/* Custom Modals */}
      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        jobPostingId={job.jobMasterId}
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
