import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const JobCard = ({ job }) => {
  const navigate = useNavigate();
  const { isAuthenticated, showAuthModal } = useAuth();

  // Mapping data
  const company = job.companyName || "회사명";
  const title = job.jobTitle || "직무";
  const status = job.status || "OPEN"; // OPEN, CLOSED
  const startDate = job.startDate ? job.startDate.replaceAll("-", ".") : null;
  const endDate = job.endDate ? job.endDate.replaceAll("-", ".") : null;
  const groupCount = job.currentGroupCount || 0;

  // If dates are missing, treat as "Always Recruiting" (Open)
  const isAlwaysOpen = !startDate && !endDate;
  const isClosed = !isAlwaysOpen && job.status !== "OPEN";

  const handleCardClick = () => {
    if (!isAuthenticated) {
      showAuthModal("로그인이 필요합니다.");
      return;
    }
    // Navigate to chatroom list for this job
    navigate(`/jobs/${job.jobMasterId || job.id}/chat`);
  };

  const handleDetailClick = (e) => {
    // Prevent card click event
    e.stopPropagation();
    // Navigate to job detail page
    navigate(`/jobs/${job.jobMasterId || job.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-[20px] p-6 mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-lg transition-all active:scale-[0.99] relative cursor-pointer"
    >
      {/* Header: Company, Title, Status */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex flex-col gap-1 pr-4">
          <span className="text-lg font-bold text-gray-900 leading-tight">
            {company}
          </span>
          <span className="text-sm text-gray-500 font-medium line-clamp-1">
            {title}
          </span>
          {/* Skills Tags (Up to 4) */}
          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {job.skills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[11px] font-semibold border border-gray-200 rounded text-center whitespace-nowrap"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 4 && (
                <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[11px] font-medium border border-gray-100 rounded text-center whitespace-nowrap">
                  +{job.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0">
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full border
            ${
              isClosed
                ? "bg-gray-100 text-gray-400 border-gray-200"
                : "bg-[#101827] text-white border-[#101827]"
            }`}
          >
            {isClosed ? "마감" : "진행중"}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isClosed ? "bg-gray-300" : "bg-[#101827]"}`}
          style={{
            width: isAlwaysOpen
              ? "100%"
              : `${calculateProgress(startDate, endDate)}%`,
          }}
        ></div>
      </div>

      {/* Date Range */}
      <div className="flex justify-end text-xs text-gray-500 mb-5 font-medium tracking-tight">
        {isAlwaysOpen ? (
          "상시모집"
        ) : (
          <>
            {startDate ? startDate : ""} ~ {endDate ? endDate : ""}
          </>
        )}
      </div>

      {/* Footer: Group Count and Detail Link */}
      <div className="flex justify-between items-center border-t border-gray-50 pt-4">
        <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
          <span
            className={`w-1.5 h-1.5 rounded-full ${groupCount > 0 ? "bg-[#101827]" : "bg-gray-300"}`}
          ></span>
          <span className="text-xs font-bold text-gray-700">
            현재 모임 {groupCount}개
          </span>
        </div>
        <div
          onClick={handleDetailClick}
          className="flex items-center text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors"
        >
          상세보기 <span className="ml-1">→</span>
        </div>
      </div>
    </div>
  );
};

// Helper for progress calculation
const calculateProgress = (start, end) => {
  if (!start || !end) return 0;
  const today = new Date(); // Or consistent mock date if needed
  const startDate = new Date(start.replaceAll(".", "/"));
  const endDate = new Date(end.replaceAll(".", "/"));

  if (today < startDate) return 0;
  if (today > endDate) return 100;

  const totalDuration = endDate - startDate;
  const elapsed = today - startDate;

  // Guard against zero duration
  if (totalDuration <= 0) return 100;

  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
};

export default JobCard;
