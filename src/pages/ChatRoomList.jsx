import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import { ChevronLeft, Bell, Search, Filter, Loader2 } from "lucide-react";
import ScoreCheckModal from "../components/ScoreCheckModal";
import ApplyModal from "../components/ApplyModal";
import EvaluationProgressModal from "../components/EvaluationProgressModal";

import JoinConfirmModal from "../components/JoinConfirmModal";
import AnalysisResultModal from "../components/AnalysisResultModal";

const ChatRoomList = () => {
  const { id } = useParams(); // Job Posting ID
  const navigate = useNavigate();

  // State
  // State
  const [activeTab, setActiveTab] = useState("LIST"); // LIST | SCORE
  const [rooms, setRooms] = useState([]); // Mock rooms for now
  const [jobInfo, setJobInfo] = useState({ title: "", company: "" });
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [myScore, setMyScore] = useState(null);
  const [analysisData, setAnalysisData] = useState(null); // Full Analysis Result
  const [hasApplied, setHasApplied] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showJoinConfirmModal, setShowJoinConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Mock Rooms Data
  const MOCK_ROOMS = [
    {
      id: 1,
      title: "토스 1차 서류 합격 목표",
      goal: "서류",
      current: 2,
      max: 5,
      host: "suhoSin",
      cutline: 60,
      condition: "무관",
    },
    {
      id: 2,
      title: "프론트엔드 면접 대비방",
      goal: "면접",
      current: 5,
      max: 5,
      host: "devLee",
      cutline: 70,
      condition: "CS 지식",
    },
    {
      id: 3,
      title: "자소서 피드백 하실 분",
      goal: "서류",
      current: 1,
      max: 4,
      host: "junior",
      cutline: 50,
      condition: "무관",
    },
  ];

  useEffect(() => {
    // Fetch Job Info (Mock or minimal fetch)
    const fetchJobInfo = async () => {
      // In real app, fetch job details here. For now mock title
      setJobInfo({ title: "정보 불러오는 중...", company: "" });
      try {
        const response = await client.get(`/api/v1/job-postings/${id}`);
        const data = response.data.data;
        setJobInfo({ title: data.jobTitle, company: data.companyName });
      } catch (e) {
        console.error("Job info fetch error", e);
        setJobInfo({ title: "채용공고", company: "-" });
      }
    };
    fetchJobInfo();
    setRooms(MOCK_ROOMS);
    checkMyScore(); // Initial check
  }, [id]);

  // Polling Effect
  useEffect(() => {
    let intervalId;
    if (isEvaluating) {
      intervalId = setInterval(() => {
        checkMyScore(true);
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [isEvaluating]);

  // Check My Score API
  const checkMyScore = async (force = false) => {
    if (!force && myScore !== null && !isEvaluating)
      return { score: myScore, applied: hasApplied, isEvaluating: false };

    try {
      setLoadingScore(true);
      const response = await client.get(
        `/api/v1/job-postings/${id}/my-application`,
      );

      // Axios success block handles 2xx statuses
      if (response.status === 202) {
        setMyScore(0);
        setAnalysisData(null);
        setHasApplied(true);
        setIsEvaluating(true);
        return { score: 0, applied: true, isEvaluating: true };
      }

      const data = response.data.data;

      if (!data) {
        setMyScore(null);
        setAnalysisData(null);
        setHasApplied(false);
        setIsEvaluating(false);
        return { score: null, applied: false, isEvaluating: false };
      } else {
        setMyScore(data.overallScore || 0);
        setAnalysisData(data); // Store full data
        setHasApplied(true);
        setIsEvaluating(false);
        // Analysis Just Completed!
        if (isEvaluating) {
          setShowEvaluationModal(false);
          setShowResultModal(true);
        }
        return {
          score: data.overallScore || 0,
          applied: true,
          isEvaluating: false,
        };
      }
    } catch (error) {
      // Handle the "AI is evaluating" state (202 Accepted) if axios is configured to throw on non-200
      if (error.response && error.response.status === 202) {
        setMyScore(0);
        setAnalysisData(null);
        setIsEvaluating(true);
        setHasApplied(true);
        return { score: 0, applied: true, isEvaluating: true };
      }

      console.error("Failed to check score:", error);
      // 에러가 나더라도 이미 지원한 상태라면 상태를 유지함
      if (hasApplied) {
        return {
          score: myScore || 0,
          applied: true,
          isEvaluating: isEvaluating,
        };
      }

      setMyScore(null);
      setAnalysisData(null);
      setHasApplied(false);
      setIsEvaluating(false);
      // If error (not 202), stop evaluating
      if (isEvaluating) {
        setShowEvaluationModal(false);
        // Optional: Show error in modal?
      }

      return { score: null, applied: false, isEvaluating: false };
    } finally {
      setLoadingScore(false);
    }
  };

  const handleEnterRequest = async (room) => {
    const {
      score,
      applied,
      isEvaluating: evaluatingNow,
    } = await checkMyScore();

    if (!applied) {
      setShowScoreModal(true);
      return;
    }

    if (evaluatingNow) {
      setShowEvaluationModal(true);
      return;
    }

    if (score < room.cutline) {
      alert(
        `입장 조건을 충족하지 못했습니다. (내 점수: ${score}점 / 컷라인: ${room.cutline}점)`,
      );
      return;
    }

    setSelectedRoom(room);
    setShowJoinConfirmModal(true);
  };

  const handleConfirmJoin = async () => {
    if (!selectedRoom) return;

    try {
      await client.post(`/api/v1/chat-rooms/${selectedRoom.id}/members`);
      alert("입장 신청이 완료되었습니다.");
      setShowJoinConfirmModal(false);
      setSelectedRoom(null);
    } catch (err) {
      console.error("Failed to join chat room:", err);
      alert(err.response?.data?.message || "입장 신청에 실패했습니다.");
      // Optional: Close modal on error too if needed
      if (err.response?.status !== 401) {
        // Example condition
        setShowJoinConfirmModal(false);
      }
    }
  };

  const handleUploadSuccess = () => {
    setIsEvaluating(true);
    setHasApplied(true);
    setActiveTab("SCORE");
  };

  return (
    <div className="bg-white min-h-screen pb-safe flex flex-col">
      {/* Header (Top Bar) */}
      <div className="sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-bold text-gray-900 text-lg truncate max-w-[200px]">
              {jobInfo.title}
            </h1>
          </div>
          <div className="flex items-center space-x-1">
            <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg whitespace-nowrap">
              채팅방 생성
            </button>
            <button className="p-2 -mr-2 text-gray-400">
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-900">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("LIST")}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors
              ${activeTab === "LIST" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"}`}
          >
            목록
          </button>
          <button
            onClick={() => {
              setActiveTab("SCORE");
              checkMyScore(true); // Refresh when clicking tab
            }}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors
              ${activeTab === "SCORE" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"}`}
          >
            내 점수
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "LIST" ? (
          /* List Content */
          <div className="p-5 space-y-4">
            {rooms.map((room) => {
              const isClosed = room.current >= room.max;
              return (
                <div
                  key={room.id}
                  className="border border-gray-200 rounded-2xl p-5 shadow-sm bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">
                      {room.goal}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1 truncate">
                    {room.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4 font-medium">
                    <span
                      className={
                        isClosed
                          ? "text-red-500 font-bold"
                          : "text-gray-900 font-bold"
                      }
                    >
                      {room.current}/{room.max}
                    </span>
                    <span>•</span>
                    <span className="bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold border border-red-100">
                      {room.cutline}점 이상 {room.condition}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-gray-200" />
                      <span className="text-xs text-gray-600 font-medium">
                        {room.host}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEnterRequest(room)}
                      disabled={isClosed}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors
                        ${isClosed ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border border-red-500 text-red-500 hover:bg-red-50"}`}
                    >
                      {isClosed ? "마감" : "입장 신청"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Score Tab Content */
          <div className="flex flex-col min-h-full bg-gray-50/50">
            {loadingScore ? (
              <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
                <div className="space-y-4 animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto" />
                  <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
                </div>
              </div>
            ) : isEvaluating ? (
              <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
                <div className="space-y-6 animate-fade-in text-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-gray-100 rounded-full mx-auto" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2">
                      <Loader2
                        className="w-20 h-20 text-blue-500 animate-spin"
                        style={{ strokeWidth: 1.5 }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-gray-900">
                      AI가 서류를 분석하고 있어요
                    </h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                      <br />
                      잠시만 기다려 주세요!
                    </p>
                  </div>
                </div>
              </div>
            ) : hasApplied && analysisData ? (
              <div className="p-6 pb-24 space-y-6 animate-fade-in">
                {/* Score Header */}
                <div className="flex flex-col items-center mt-2 mb-4">
                  <span className="text-sm font-bold text-gray-500 mb-2">
                    종합 점수
                  </span>
                  <div className="relative">
                    <span className="text-6xl font-black text-gray-900 tracking-tighter leading-none">
                      {analysisData.overallScore || 0}
                    </span>
                    <span className="text-xl text-gray-400 font-bold ml-1">
                      /100
                    </span>
                  </div>
                </div>

                {/* One Line Review */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <p className="text-gray-800 font-bold text-sm break-keep leading-snug text-center">
                    {analysisData.oneLineReview ||
                      "한 줄 평가는 분석 후 제공됩니다."}
                  </p>
                </div>

                {/* Competency Scores */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">
                    역량 분석
                  </h4>
                  {(analysisData.comparisonScores || []).map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-bold text-gray-700">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-400 font-bold">
                          {item.score}/100
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!analysisData.comparisonScores ||
                    analysisData.comparisonScores.length === 0) && (
                    <div className="text-center text-gray-400 text-xs py-2">
                      상세 역량 점수가 없습니다.
                    </div>
                  )}
                </div>

                {/* Detailed Feedback */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">
                    상세 피드백
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap text-justify">
                    {analysisData.feedbackDetail ||
                      analysisData.aiSummary ||
                      "상세 피드백이 없습니다."}
                  </p>
                </div>

                {/* Refresh Button */}
                <div className="text-center pt-2">
                  <button
                    onClick={() => checkMyScore(true)}
                    className="text-xs text-gray-400 underline hover:text-gray-600"
                  >
                    결과 다시 불러오기
                  </button>
                </div>
              </div>
            ) : (
              /* No Application State */
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-gray-100">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      제출된 이력서가 없습니다
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed max-w-[200px] mx-auto">
                      이력서를 업로드하시면 AI가 분석하여 <br />내 점수를 계산해
                      드립니다.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl text-base shadow-lg hover:bg-black transition-all active:scale-[0.98]"
                  >
                    이력서 업로드
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ScoreCheckModal
        isOpen={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        onGoToUpload={() => {
          setShowScoreModal(false);
          setShowApplyModal(true);
        }}
      />

      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        jobPostingId={id}
        jobTitle={jobInfo.title}
        onSuccess={handleUploadSuccess}
      />

      <EvaluationProgressModal
        isOpen={showEvaluationModal}
        applicationId={hasApplied ? "me" : null} // Assuming we can pass 'me' or we need actual ID. But wait, EvaluationProgressModal takes applicationId to poll.
        // In checkMyScore, we don't return ID. The modal uses applicationId to poll /api/v1/applications/{id}/analyses.
        // Current implementation of checkMyScore fetches /job-postings/{id}/my-application.
        // It seems EvaluationProgressModal logic might need adjustment or we use current logic.
        // Wait, EvaluationProgressModal polls `/api/v1/applications/${applicationId}/analyses`.
        // But we are in `ChatRoomList`. `id` is jobPostingId.
        // `checkMyScore` polls inside `ChatRoomList` too! (lines 81-92).
        // It seems we have DUPLICATE polling?
        // `ChatRoomList` polls using `checkMyScore` (line 85).
        // `EvaluationProgressModal` also polls if `applicationId` is passed?
        // But in `ChatRoomList`, `showEvaluationModal` is just a UI blocker?
        // Actually line 463 in original file: `<EvaluationProgressModal isOpen={showEvaluationModal} ... />`
        // It didn't pass `applicationId`. properties were missing in original file view?
        // Let's check Step 325 view... no effectively it wasn't passing appId.
        // So EvaluationProgressModal wasn't polling?
        // Ah, `EvaluationProgressModal` in Step 268/315 DOES check `if (isOpen && applicationId)`.
        // If appId is missing, it does nothing?
        // But `ChatRoomList` has its own polling `useEffect` (lines 81-92) that calls `checkMyScore`.

        // So `ChatRoomList` detects completion via `checkMyScore`.
        // `checkMyScore` updates `myScore` and `analysisData`.
        // When `isEvaluating` becomes false (analysis done), `ChatRoomList` re-renders.
        // But we need to catch the *transition* from evaluating to done to show the modal.

        // Let's modify `checkMyScore` to show modal when done.

        onClose={() => {
          setShowEvaluationModal(false);
          // Removed setActiveTab("SCORE")
        }}
      />

      <JoinConfirmModal
        isOpen={showJoinConfirmModal}
        onClose={() => {
          setShowJoinConfirmModal(false);
          setSelectedRoom(null);
        }}
        onConfirm={handleConfirmJoin}
        roomTitle={selectedRoom?.title}
      />

      <AnalysisResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        data={analysisData}
        onGoToScore={() => {
          setShowResultModal(false);
          setActiveTab("SCORE");
        }}
      />
    </div>
  );
};

export default ChatRoomList;
