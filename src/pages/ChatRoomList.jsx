import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import { ChevronLeft, Bell, Search, Filter, Lock } from "lucide-react";
import ScoreCheckModal from "../components/ScoreCheckModal";

const ChatRoomList = () => {
  const { id } = useParams(); // Job Posting ID
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState("LIST"); // LIST | SCORE
  const [rooms, setRooms] = useState([]); // Mock rooms for now
  const [jobInfo, setJobInfo] = useState({ title: "", company: "" });
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [myScore, setMyScore] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);

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
      setJobInfo({ title: "토스(프론트엔드)", company: "Toss" });
    };
    fetchJobInfo();
    setRooms(MOCK_ROOMS);
  }, [id]);

  // Check My Score API
  const checkMyScore = async () => {
    if (myScore !== null) return myScore; // already fetched

    try {
      setLoadingScore(true);
      const response = await client.get(
        `/api/v1/job-postings/${id}/my-application`,
      );
      const data = response.data.data;

      // data can be null (no application) or have score
      if (!data || !data.overallScore) {
        setMyScore(0); // No score
        return 0;
      } else {
        setMyScore(data.overallScore);
        return data.overallScore;
      }
    } catch (error) {
      console.error("Failed to check score:", error);
      // If 404/Null, means no score
      setMyScore(0);
      return 0;
    } finally {
      setLoadingScore(false);
    }
  };

  const handleEnterRequest = async (room) => {
    // 1. Check Score
    const score = await checkMyScore();

    if (score === 0) {
      // No Score -> Show Modal
      setShowScoreModal(true);
      return;
    }

    // 2. Check Cutline
    if (score < room.cutline) {
      alert(
        `입장 조건을 충족하지 못했습니다. (내 점수: ${score}점 / 컷라인: ${room.cutline}점)`,
      );
      return;
    }

    // 3. Success -> Join (Mock)
    if (window.confirm(`${room.title} 채팅방에 입장하시겠습니까?`)) {
      alert("입장 신청이 완료되었습니다.");
      // navigate(`/chat/${room.id}`); // In real app
    }
  };

  return (
    <div className="bg-white min-h-screen pb-safe">
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
            onClick={() => setActiveTab("SCORE")}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors
                            ${activeTab === "SCORE" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"}`}
          >
            내 점수
          </button>
        </div>
      </div>

      {/* List Content */}
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
                                        ${
                                          isClosed
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-white border border-red-500 text-red-500 hover:bg-red-50"
                                        }`}
                >
                  {isClosed ? "마감" : "입장 신청"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Check Modal */}
      <ScoreCheckModal
        isOpen={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        onGoToUpload={() => {
          setShowScoreModal(false);
          // Navigate to Job Detail to open upload modal, or open upload modal directly if we were on that page.
          // Since Chat List is a new page, maybe we redirect to JobDetail with a state?
          // User said "Button click -> Go to Resume Upload Page".
          // I'll redirect to JobDetail for now.
          navigate(`/jobs/${id}`);
        }}
      />
    </div>
  );
};

export default ChatRoomList;
