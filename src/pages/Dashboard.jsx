import { useState, useEffect, useRef, useCallback } from "react";
import client from "../api/client";
import JobCard from "../components/JobCard";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, showAuthModal } = useAuth();

  // State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false); // Filter state: 모집중

  // Pagination State
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();
  const lastJobElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchJobs(cursor);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, cursor],
  );

  // Initial load
  useEffect(() => {
    // Reset and fetch
    setJobs([]);
    setCursor(null);
    setHasMore(true);
    fetchJobs(null, true);
  }, [onlyOpen]); // Refetch when filter changes (keyword search usually requires a submit button or debounce, but let's debounce later if needed)

  // Search handler
  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setJobs([]);
      setCursor(null);
      setHasMore(true);
      fetchJobs(null, true);
    }
  };

  // Handle keyword change and auto-reset when cleared
  const handleKeywordChange = (e) => {
    const newKeyword = e.target.value;
    setKeyword(newKeyword);

    // If user clears the search, automatically reset to show all jobs
    if (newKeyword === "") {
      setJobs([]);
      setCursor(null);
      setHasMore(true);
      fetchJobs(null, true, ""); // Pass empty string directly
    }
  };

  const fetchJobs = async (
    currentCursor,
    isReset = false,
    searchKeyword = null,
  ) => {
    try {
      setLoading(true);

      const params = {
        size: 20,
        cursor: currentCursor,
        keyword: searchKeyword !== null ? searchKeyword : keyword, // Use passed keyword or state
        status: onlyOpen ? "OPEN" : null, // Send 'OPEN' or nothing
      };

      const response = await client.get("/api/v1/job-postings", { params });
      const dataObj = response.data.data;
      const content = dataObj?.items || [];
      const nextCursor = dataObj?.next_cursor;
      const isLast = dataObj?.last;

      // [FIX] Deduplication & Infinite Loop Prevention
      setJobs((prev) => {
        const currentIds = new Set(prev.map((j) => j.id));
        const newItems = content.filter((item) => !currentIds.has(item.id));

        // If duplicates exist or empty, stop
        if (content.length > 0 && newItems.length === 0) {
          setHasMore(false);
        } else {
          setHasMore(!isLast);
        }

        if (content.length === 0) {
          setHasMore(false);
        }

        return isReset ? content : [...prev, ...newItems];
      });

      setCursor(nextCursor);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header Section */}
      <div className="bg-white px-5 pt-8 pb-4 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3.5 bg-gray-50 border border-transparent focus:border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all font-medium"
            placeholder="기업명 또는 직무명 검색"
            value={keyword}
            onChange={handleKeywordChange}
            onKeyDown={handleSearch}
          />
        </div>

        {/* Filter and Register Button Area */}
        <div className="flex justify-between items-center">
          {/* Status Filter */}
          <button
            onClick={() => setOnlyOpen(!onlyOpen)}
            className="flex items-center space-x-2 active:scale-95 transition-transform"
          >
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${onlyOpen ? "bg-[#101827] border-[#101827]" : "border-gray-300"}`}
            >
              {onlyOpen && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
            <span
              className={`text-sm font-bold ${onlyOpen ? "text-gray-900" : "text-gray-500"}`}
            >
              모집중
            </span>
          </button>

          {/* Register Button */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                showAuthModal();
                return;
              }
              navigate("/analysis");
            }}
            className="bg-[#101827] hover:bg-[#1a263d] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            공고 등록
          </button>
          {/* Note: In the design, "공고 등록" is a button on the right. */}
        </div>
      </div>

      {/* Job List */}
      <div className="px-5 py-4 space-y-1">
        {jobs.map((job, index) => {
          if (jobs.length === index + 1) {
            return (
              <div
                ref={lastJobElementRef}
                key={job.jobMasterId || job.id || index}
              >
                <JobCard job={job} />
              </div>
            );
          } else {
            return (
              <JobCard key={job.jobMasterId || job.id || index} job={job} />
            );
          }
        })}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
