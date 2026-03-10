import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Loader2 } from "lucide-react";
import client from "../api/client";
import UserMenu from "../components/UserMenu";

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [keyword]);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const response = await client.get("/api/v1/applications/me", {
          params: { keyword: debouncedKeyword || undefined },
        });
        setApplications(response.data.data);
      } catch (e) {
        console.error("Failed to fetch applications", e);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [debouncedKeyword]);

  const handleCardClick = (app) => {
    navigate(`/applications/${app.id}`);
  };

  const getStatusLabel = (status) => {
    if (!status) return null; // Remove default status display
    switch (status) {
      case "ACTIVE":
        return {
          text: "지원완료",
          className: "bg-blue-50 text-blue-600 border-blue-100",
        };
      case "PASSED":
        return {
          text: "서류합격",
          className: "bg-green-50 text-green-600 border-green-100",
        };
      case "REJECTED":
        return {
          text: "불합격",
          className: "bg-red-50 text-red-600 border-red-100",
        };
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(
      date.getDate(),
    ).padStart(2, "0")}`;
  };

  return (
    <div className="bg-white min-h-screen pb-safe flex flex-col relative">
      {/* Header Section: Zero-Jump Structure */}
      <div className="bg-white sticky top-0 z-20 border-b border-gray-100 pb-5 pt-safe">
        {/* Title Row */}
        <div className="relative flex items-center justify-between h-14 px-4 mt-2">
          {/* Left: Back Button (Matched w-10) */}
          <div className="w-10 flex-shrink-0">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
          </div>

          <h1 className="font-bold text-gray-900 text-lg tracking-tight absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
            이력 관리
          </h1>

          {/* Right: Menu + Placeholder (w-10) to match Bell icon space */}
          <div className="flex items-center gap-1 flex-shrink-0 h-10">
            <div className="w-10 flex-shrink-0" />
            <UserMenu />
          </div>
        </div>

        {/* Search Bar: Unified Pixel-Perfect Alignment */}
        <div className="px-5 mt-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent focus:border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-50 transition-all font-medium"
              placeholder="기업명 또는 직무명 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
            <p className="text-gray-400 text-sm font-medium">불러오는 중...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold mb-1">
              {debouncedKeyword
                ? "검색 결과가 없습니다"
                : "지원 내역이 없습니다"}
            </h3>
            <p className="text-gray-400 text-sm">
              {debouncedKeyword
                ? "다른 검색어로 다시 시도해보세요."
                : "채용공고에서 마음에 드는 직무에 지원해보세요!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const statusInfo = getStatusLabel(app.status);
              return (
                <div
                  key={app.id}
                  onClick={() => handleCardClick(app)}
                  className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 active:scale-[0.98] hover:shadow-lg transition-all cursor-pointer group hover:border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col pr-4">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1.5 group-hover:text-[#101827] transition-colors">
                        {app.companyName}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium line-clamp-1">
                        {app.jobTitle}
                      </p>
                    </div>
                    {statusInfo && (
                      <span
                        className={`shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-full border ${statusInfo.className}`}
                      >
                        {statusInfo.text}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end pt-4 border-t border-gray-50">
                    <span className="text-xs text-gray-500 font-medium tracking-tight">
                      {formatDate(app.appliedAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
