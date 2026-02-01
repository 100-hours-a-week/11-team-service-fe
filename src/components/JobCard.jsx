import { useNavigate } from "react-router-dom";

const JobCard = ({ job }) => {
  const navigate = useNavigate();

  // Mapping data
  const company = job.companyName || "회사명";
  const title = job.jobTitle || "직무";
  const status = job.status || "OPEN"; // OPEN, CLOSED
  const startDate = job.startDate
    ? job.startDate.replaceAll("-", ".")
    : "2026.01.01";
  const endDate = job.endDate ? job.endDate.replaceAll("-", ".") : "2026.12.31";
  const groupCount = job.currentGroupCount || 0;

  const isClosed = status !== "OPEN";

  const handleClick = () => {
    navigate(`/jobs/${job.jobMasterId || job.id}`);
  };

  return (
    <div
      onClick={handleClick}
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
          style={{ width: `${calculateProgress(startDate, endDate)}%` }}
        ></div>
      </div>

      {/* Date Range */}
      <div className="flex justify-end text-xs text-gray-400 mb-5 font-medium tracking-tight">
        {startDate} ~ {endDate}
      </div>

      {/* Footer: Group Count and Detail Link */}
      <div className="flex justify-between items-center border-t border-gray-50 pt-4">
        <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-xs font-bold text-gray-700">
            현재 모임 {groupCount}개
          </span>
        </div>
        <div className="flex items-center text-xs font-bold text-gray-400">
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
  const startDate = new Date(start.replaceAll(".", "-"));
  const endDate = new Date(end.replaceAll(".", "-"));

  if (today < startDate) return 0;
  if (today > endDate) return 100;

  const totalDuration = endDate - startDate;
  const elapsed = today - startDate;

  // Guard against zero duration
  if (totalDuration <= 0) return 100;

  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
};

export default JobCard;
