import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import { getChatRoomsForJob } from "../api/chatApi";
import {
  ChevronLeft,
  Bell,
  Search,
  Filter,
  Loader2,
  FileText,
} from "lucide-react";
import ScoreCheckModal from "../components/ScoreCheckModal";
import ApplyModal from "../components/ApplyModal";
import EvaluationProgressModal from "../components/EvaluationProgressModal";
import JoinConfirmModal from "../components/JoinConfirmModal";
import AnalysisResultModal from "../components/AnalysisResultModal";
import ScoreReport from "../components/ScoreReport";
import RoomCard from "../components/chat/RoomCard";
import CreateRoomModal from "../components/chat/CreateRoomModal";

const ChatRoomList = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("LIST");
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [jobInfo, setJobInfo] = useState({ title: "", company: "" });
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myScore, setMyScore] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showJoinConfirmModal, setShowJoinConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentApplicationId, setCurrentApplicationId] = useState(null);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await getChatRoomsForJob(id, { size: 20 });
      const data = response.data.data;
      setRooms(data.chatRooms || []);
      if (data.myScore !== undefined && data.myScore !== null) {
        setMyScore(data.myScore);
        setHasApplied(true);
      }
    } catch (e) {
      console.error("Failed to fetch chat rooms:", e);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    const fetchJobInfo = async () => {
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
    fetchRooms();
    checkMyScore();
  }, [id]);

  useEffect(() => {
    let intervalId;
    if (isEvaluating) {
      intervalId = setInterval(() => {
        checkMyScore(true);
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [isEvaluating]);

  const checkMyScore = async (force = false) => {
    if (!force && myScore !== null && !isEvaluating)
      return { score: myScore, applied: hasApplied, isEvaluating: false };

    try {
      setLoadingScore(true);
      const response = await client.get(
        `/api/v1/job-postings/${id}/my-application`,
      );

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
        setAnalysisData(data);
        if (data.jobApplicationId) {
          setCurrentApplicationId(data.jobApplicationId);
        }
        setHasApplied(true);
        setIsEvaluating(false);
        if (isEvaluating) {
          setShowResultModal(true);
        }
        return {
          score: data.overallScore || 0,
          applied: true,
          isEvaluating: false,
        };
      }
    } catch (error) {
      if (error.response && error.response.status === 202) {
        setMyScore(0);
        setAnalysisData(null);
        setIsEvaluating(true);
        setHasApplied(true);
        return { score: 0, applied: true, isEvaluating: true };
      }

      console.error("Failed to check score:", error);
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
      return { score: null, applied: false, isEvaluating: false };
    } finally {
      setLoadingScore(false);
    }
  };

  const handleJoinRequest = async (room) => {
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
      if (!currentApplicationId) {
        alert("AI 분석이 진행 중입니다. 잠시만 기다려주세요.");
        return;
      }
      setShowEvaluationModal(true);
      return;
    }

    if (score < room.cutlineScore) {
      alert(
        `입장 조건을 충족하지 못했습니다. (내 점수: ${score}점 / 컷라인: ${room.cutlineScore}점)`,
      );
      return;
    }

    setSelectedRoom(room);
    setShowJoinConfirmModal(true);
  };

  const handleEnterRoom = (room) => {
    navigate(`/chat/${room.chatRoomId}`);
  };

  const handleConfirmJoin = async () => {
    if (!selectedRoom) return;

    try {
      await client.post(
        `/api/v1/chat-rooms/${selectedRoom.chatRoomId}/members`,
      );
      setShowJoinConfirmModal(false);
      setSelectedRoom(null);
      navigate(`/chat/${selectedRoom.chatRoomId}`);
    } catch (err) {
      console.error("Failed to join chat room:", err);
      const code = err.response?.data?.code;
      if (code === "CHAT_ROOM_ALREADY_JOINED") {
        setShowJoinConfirmModal(false);
        navigate(`/chat/${selectedRoom.chatRoomId}`);
        return;
      }
      alert(err.response?.data?.message || "입장 신청에 실패했습니다.");
      if (err.response?.status !== 401) {
        setShowJoinConfirmModal(false);
      }
    }
  };

  const handleUploadSuccess = (appId) => {
    setIsEvaluating(true);
    setHasApplied(true);
    setCurrentApplicationId(appId);
    checkMyScore(true);
  };

  const handleRoomCreated = () => {
    fetchRooms();
  };

  return (
    <div className="bg-white min-h-screen pb-safe flex flex-col">
      {/* Header */}
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg whitespace-nowrap"
            >
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
              checkMyScore(true);
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
          <div className="p-5 space-y-4">
            {loadingRooms ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                <p className="text-gray-400 text-sm mb-4">
                  아직 채팅방이 없습니다
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-[#101827] text-white font-bold rounded-2xl text-sm"
                >
                  첫 채팅방 만들기
                </button>
              </div>
            ) : (
              rooms.map((room) => (
                <RoomCard
                  key={room.chatRoomId}
                  room={room}
                  onJoin={handleJoinRequest}
                  onEnter={handleEnterRoom}
                />
              ))
            )}
          </div>
        ) : (
          /* Score Tab Content */
          <div className="flex flex-col min-h-full bg-white">
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
              <ScoreReport
                data={analysisData}
                onRetry={() => checkMyScore(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-gray-100">
                    <FileText className="w-8 h-8 text-gray-300" />
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
                    className="px-8 py-4 bg-[#101827] text-white font-bold rounded-2xl text-base shadow-lg hover:bg-[#1a263d] transition-all active:scale-[0.98]"
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
        applicationId={currentApplicationId}
        onAnalysisComplete={(data) => {
          setAnalysisData(data);
          setShowEvaluationModal(false);
          setShowResultModal(true);
          setMyScore(data.overallScore || 0);
          setIsEvaluating(false);
        }}
        onClose={() => {
          setShowEvaluationModal(false);
        }}
      />

      <JoinConfirmModal
        isOpen={showJoinConfirmModal}
        onClose={() => {
          setShowJoinConfirmModal(false);
          setSelectedRoom(null);
        }}
        onConfirm={handleConfirmJoin}
        roomTitle={selectedRoom?.roomName}
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

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        jobMasterId={id}
        onSuccess={handleRoomCreated}
      />
    </div>
  );
};

export default ChatRoomList;
