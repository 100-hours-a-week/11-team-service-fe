import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Loader2 } from "lucide-react";
import { getMyChatRooms } from "../api/chatApi";

const GOAL_LABEL = {
  DOCUMENT: "서류",
  INTERVIEW: "면접",
};

// TODO: API 개발 완료 후 SHOW_COMING_SOON을 false로 변경
const SHOW_COMING_SOON = true;

const MyChatRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);

  const fetchRooms = useCallback(async (nextCursor = null) => {
    try {
      setLoading(true);
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
    }
  }, []);

  useEffect(() => {
    // TODO: API 개발 완료 후 주석 해제
    if (!SHOW_COMING_SOON) {
      fetchRooms();
    }
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

  // 준비중 화면
  if (SHOW_COMING_SOON) {
    return (
      <div className="bg-white min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
          <div className="flex items-center justify-between px-4 h-14">
            <h1 className="font-bold text-gray-900 text-lg">채팅방</h1>
          </div>
        </div>

        {/* Content - 준비중 */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              서비스 준비중입니다
            </h3>
            <p className="text-gray-400 text-sm">
              빠른 시일 내에 찾아뵙겠습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-bold text-gray-900 text-lg">채팅방</h1>
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
                className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                {/* Room Icon */}
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-gray-500" />
                </div>

                {/* Room Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="font-bold text-gray-900 text-sm truncate">
                        {room.roomName}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {GOAL_LABEL[room.roomGoal] || room.roomGoal}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(room.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">
                      {room.lastMessagePreview || "메시지가 없습니다"}
                    </p>
                    {room.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {room.unreadCount > 99 ? "99+" : room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {/* Load More */}
            {hasNext && (
              <button
                onClick={() => fetchRooms(cursor)}
                className="w-full py-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                더 보기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyChatRooms;
