import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Users, Loader2, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getChatRoomDetail, getMembers } from "../api/chatApi";
import useChatMessages from "../hooks/useChatMessages";
import ChatBubble from "../components/chat/ChatBubble";
import DateSeparator from "../components/chat/DateSeparator";
import ChatInput from "../components/chat/ChatInput";
import MemberDrawer from "../components/chat/MemberDrawer";
import MemberProfileModal from "../components/chat/MemberProfileModal";
import ComparisonModal from "../components/chat/ComparisonModal";
import RoomSettingsDrawer from "../components/chat/RoomSettingsDrawer";

const getDateKey = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR");
};

const isSameGroup = (a, b) => {
  if (!a || !b) return false;
  if (a.senderId !== b.senderId) return false;
  if (a.messageType === "SYSTEM" || b.messageType === "SYSTEM") return false;
  const aTime = new Date(a.sentAt);
  const bTime = new Date(b.sentAt);
  return (
    aTime.getHours() === bTime.getHours() &&
    aTime.getMinutes() === bTime.getMinutes()
  );
};

const ChatRoom = () => {
  const { chatRoomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roomDetail, setRoomDetail] = useState(null);
  const [members, setMembers] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);

  // UI state
  const [showMemberDrawer, setShowMemberDrawer] = useState(false);
  const [showMemberProfile, setShowMemberProfile] = useState(null);
  const [showComparison, setShowComparison] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);

  const { messages, loading, sending, sendTextMessage, sendFileMessage } =
    useChatMessages(chatRoomId);

  // Fetch room detail and members
  useEffect(() => {
    if (!chatRoomId) return;

    const fetchRoom = async () => {
      try {
        setLoadingRoom(true);
        const [roomRes, membersRes] = await Promise.all([
          getChatRoomDetail(chatRoomId),
          getMembers(chatRoomId),
        ]);
        setRoomDetail(roomRes.data.data);
        const memberList = membersRes.data.data.members || [];
        setMembers(memberList);

        if (user?.userId) {
          const me = memberList.find((m) => m.userId === user.userId);
          setMyMembership(me || null);
        }
      } catch (e) {
        console.error("Failed to fetch room detail:", e);
        if (e.response?.status === 403 || e.response?.status === 404) {
          alert("채팅방에 접근할 수 없습니다.");
          navigate(-1);
        }
      } finally {
        setLoadingRoom(false);
      }
    };
    fetchRoom();
  }, [chatRoomId, user?.userId, navigate]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = messageContainerRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [loading]);

  const isMe = (senderId) => user?.userId === senderId;
  const isHost = myMembership?.role === "HOST";
  const isClosed = roomDetail?.status === "CLOSED";

  const handleMemberClick = (member) => {
    setShowMemberDrawer(false);
    setShowMemberProfile(member);
  };

  const handleComparisonClick = (member) => {
    setShowMemberProfile(null);
    setShowComparison(member);
  };

  const handleRoomClosed = () => {
    setShowSettings(false);
    navigate(-1);
  };

  const handleKickMember = (memberId) => {
    setMembers((prev) =>
      prev.filter((m) => m.chatRoomMemberId !== memberId),
    );
  };

  if (loadingRoom || loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center min-w-0">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 text-base truncate">
              {roomDetail?.roomName}
            </h1>
            <p className="text-xs text-gray-400">
              {members.length}/{roomDetail?.maxParticipants}명
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowMemberDrawer(true)}
            className="p-2 text-gray-600"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-600"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white py-2"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">
              아직 메시지가 없습니다. 첫 메시지를 보내보세요!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const showDate =
              !prev || getDateKey(prev.sentAt) !== getDateKey(msg.sentAt);
            const showSender =
              msg.messageType !== "SYSTEM" &&
              !isMe(msg.senderId) &&
              !isSameGroup(prev, msg);
            const showTime =
              msg.messageType !== "SYSTEM" && !isSameGroup(msg, next);

            return (
              <div key={msg.messageId}>
                {showDate && <DateSeparator date={msg.sentAt} />}
                <ChatBubble
                  message={msg}
                  isMe={isMe(msg.senderId)}
                  showSender={showSender}
                  showTime={showTime}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isClosed ? (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 text-center">
          <p className="text-sm text-gray-400">종료된 채팅방입니다</p>
        </div>
      ) : (
        <ChatInput
          onSendText={sendTextMessage}
          onSendFile={sendFileMessage}
          disabled={sending}
        />
      )}

      {/* Member Drawer */}
      <MemberDrawer
        isOpen={showMemberDrawer}
        onClose={() => setShowMemberDrawer(false)}
        members={members}
        isHost={isHost}
        chatRoomId={chatRoomId}
        onMemberClick={handleMemberClick}
        onKickMember={handleKickMember}
        myUserId={user?.userId}
      />

      {/* Member Profile Modal */}
      {showMemberProfile && (
        <MemberProfileModal
          chatRoomId={chatRoomId}
          member={showMemberProfile}
          onClose={() => setShowMemberProfile(null)}
          onCompare={handleComparisonClick}
        />
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <ComparisonModal
          chatRoomId={chatRoomId}
          member={showComparison}
          onClose={() => setShowComparison(null)}
        />
      )}

      {/* Settings Drawer */}
      <RoomSettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        chatRoomId={chatRoomId}
        roomDetail={roomDetail}
        isHost={isHost}
        onRoomClosed={handleRoomClosed}
        onLeft={handleRoomClosed}
      />
    </div>
  );
};

export default ChatRoom;
