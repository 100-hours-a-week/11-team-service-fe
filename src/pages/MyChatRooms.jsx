import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Loader2,
  Crown,
  Users,
  ChevronLeft,
} from "lucide-react";
import { getMyChatRooms } from "../api/chatApi";
import UserMenu from "../components/UserMenu";

const GOAL_LABEL = {
  DOCUMENT: "서류",
  INTERVIEW: "면접",
};

const MyChatRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);

  const fetchRooms = useCallback(async (nextCursor = null) => {
    try {
      if (nextCursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const params = { size: 20 };
      if (nextCursor) params.cursor = nextCursor;
      const response = await getMyChatRooms(params);
      const data = response.data.data;
      if (nextCursor) {
        setRooms((prev) => [...prev, ...(data.chatRooms || [])]);
      } else {
        setRooms(data.chatRooms || []);
      }
      setCursor(data.pagination?.nextCursor || null);
      setHasNext(data.pagination?.hasNext || false);
    } catch (e) {
      console.error("Failed to fetch my chat rooms:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  const isClosed = (room) => room.status === "CLOSED";

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header Section: Zero-Jump Structure */}
      <div className="bg-white sticky top-0 z-20 border-b border-gray-100 pb-2 pt-safe">
        {/* Title Row */}
        <div className="relative flex items-center justify-between h-14 px-4 mt-2">
          {/* Left: Back Button (Matched w-10) */}
          <div className="w-10 flex-shrink-0">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
          </div>

          <h1 className="font-bold text-gray-900 text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
            채팅방
          </h1>

          {/* Right: Menu + Placeholder (w-10) to match Bell icon space */}
          <div className="flex items-center gap-1 flex-shrink-0 h-10">
            <div className="w-10 flex-shrink-0" />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && rooms.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              참여중인 채팅방이 없습니다
            </h3>
            <p className="text-gray-400 text-sm">
              채용공고에서 채팅방에 입장해보세요
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rooms.map((room) => (
              <button
                key={room.chatRoomId}
                onClick={() => navigate(`/chat/${room.chatRoomId}`)}
                className={`w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left ${isClosed(room) ? "opacity-50" : ""}`}
              >
                {/* Room Icon */}
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-gray-500" />
                </div>

                {/* Room Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-gray-900 text-sm truncate">
                        {room.roomName}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {GOAL_LABEL[room.roomGoal] || room.roomGoal}
                      </span>
                      {room.myRole === "HOST" && (
                        <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      )}
                      <span className="flex items-center gap-0.5 text-xs text-gray-400 flex-shrink-0">
                        <Users className="w-3 h-3" />
                        {room.currentParticipants}/{room.maxParticipants}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(room.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">
                      {isClosed(room)
                        ? "종료된 채팅방"
                        : room.lastMessagePreview || "메시지가 없습니다"}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {/* Load More */}
            {hasNext && (
              <button
                onClick={() => fetchRooms(cursor)}
                disabled={loadingMore}
                className="w-full py-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "더 보기"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyChatRooms;
