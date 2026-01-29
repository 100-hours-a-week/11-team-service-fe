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

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

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
        <button className="p-2 -mr-2">
          <Share2 className="w-5 h-5 text-gray-900" />
        </button>
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

        {/* 3. AI Summary */}
        <section className="mb-24">
          <div className="mb-2 text-sm font-bold text-gray-900">
            AI공고 요약
          </div>
          <div className="bg-gray-200 rounded-xl p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[150px]">
            {job.aiSummary || "AI 요약 정보가 없습니다."}
          </div>
        </section>
      </div>

      {/* Bottom Apply Button (Fixed) - Only for Open Jobs */}
      {!isClosed && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-10 z-[100]">
          <button
            onClick={() => setShowApplyModal(true)}
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black transition-colors shadow-lg"
          >
            지원하기
          </button>
        </div>
      )}

      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        jobPostingId={id}
        jobTitle={job.jobTitle}
      />
    </div>
  );
};

export default JobDetail;
