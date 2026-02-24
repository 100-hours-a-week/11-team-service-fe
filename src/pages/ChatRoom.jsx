import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  Users,
  Loader2,
  MoreVertical,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getChatRoomDetail,
  getMembers,
  leaveChatRoom,
  closeChatRoom,
  getMemberResume,
  getMemberPortfolio,
} from "../api/chatApi";
import useChatMessages from "../hooks/useChatMessages";
import ChatBubble from "../components/chat/ChatBubble";
import DateSeparator from "../components/chat/DateSeparator";
import ChatInput from "../components/chat/ChatInput";
import MemberDrawer from "../components/chat/MemberDrawer";
import MemberProfileModal from "../components/chat/MemberProfileModal";
import ComparisonModal from "../components/chat/ComparisonModal";
import RoomSettingsDrawer from "../components/chat/RoomSettingsDrawer";
import MemberActionSheet from "../components/chat/MemberActionSheet";

const getDateKey = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR");
};

const isSameGroup = (a, b) => {
  if (!a || !b) return false;
  if (a.senderId !== b.senderId) return false;
  if (a.messageType === "SYSTEM" || b.messageType === "SYSTEM") return false;
  const aTime = new Date(a.createdAt);
  const bTime = new Date(b.createdAt);
  return (
    aTime.getHours() === bTime.getHours() &&
    aTime.getMinutes() === bTime.getMinutes()
  );
};

const ChatRoom = () => {
  const { chatRoomId } = useParams();
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  const [roomDetail, setRoomDetail] = useState(null);
  const [members, setMembers] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);

  // UI state
  const [showMemberDrawer, setShowMemberDrawer] = useState(false);
  const [showMemberProfile, setShowMemberProfile] = useState(null);
  const [showComparison, setShowComparison] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [actionSheetMember, setActionSheetMember] = useState(null);

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
          toast.error("채팅방에 접근할 수 없습니다.");
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

  const isMe = (senderId) =>
    user?.userId != null && String(user.userId) === String(senderId);
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

  const handleLeaveRoom = async () => {
    const msg = isHost
      ? "방장이 나가면 채팅방이 종료됩니다. 나가시겠습니까?"
      : "채팅방을 나가시겠습니까?";
    if (!confirm(msg)) return;

    try {
      await leaveChatRoom(chatRoomId);
      navigate(-1);
    } catch (e) {
      console.error("Failed to leave:", e);
      toast.error(e.response?.data?.message || "나가기에 실패했습니다.");
    }
  };

  const handleCloseRoom = async () => {
    if (!confirm("채팅방을 종료하시겠습니까? 이 작업은 되돌릴 수 없습니다."))
      return;

    try {
      await closeChatRoom(chatRoomId);
      navigate(-1);
    } catch (e) {
      console.error("Failed to close room:", e);
      const code = e.response?.data?.code;
      if (code === "CHAT_ROOM_NOT_FOUND") {
        toast.error("이미 종료된 채팅방입니다.");
        navigate(-1);
      } else if (code === "CHAT_ROOM_HOST_ONLY") {
        toast.error("방장만 채팅방을 종료할 수 있습니다.");
      } else {
        toast.error("채팅방 종료에 실패했습니다.");
      }
    }
  };

  const handleProfileClick = (message) => {
    const member = members.find((m) => m.userId === message.senderId) || {
      userId: message.senderId,
      nickname: message.senderNickname,
      profileImageUrl: message.senderProfileImageUrl || null,
    };
    setActionSheetMember(member);
  };

  const openMemberDocument = async (member, type) => {
    if (!member.chatRoomMemberId) {
      toast.error("멤버 정보를 찾을 수 없습니다.");
      return;
    }
    const fetcher = type === "resume" ? getMemberResume : getMemberPortfolio;
    const label = type === "resume" ? "이력서" : "포트폴리오";
    try {
      const res = await fetcher(chatRoomId, member.chatRoomMemberId);
      window.open(res.data.data.fileUrl, "_blank");
    } catch (e) {
      const code = e.response?.data?.code;
      if (code === "DOCUMENT_NOT_FOUND") {
        toast(`제출된 ${label}가 없습니다.`);
      } else if (code === "CHAT_MEMBER_NOT_FOUND") {
        toast.error("멤버 정보를 찾을 수 없습니다.");
      } else {
        toast.error(`${label}를 불러오지 못했습니다.`);
      }
    }
  };

  const handleActionSheetAction = (actionKey, member) => {
    switch (actionKey) {
      case "resume":
        openMemberDocument(member, "resume");
        break;
      case "portfolio":
        openMemberDocument(member, "portfolio");
        break;
      case "comparison":
        setShowComparison(member);
        break;
      case "kick":
        handleKickAction(member);
        break;
    }
  };

  const handleKickAction = async (member) => {
    if (!confirm(`${member.nickname}님을 강제 퇴장시키시겠습니까?`)) return;
    try {
      const { kickMember } = await import("../api/chatApi");
      await kickMember(chatRoomId, member.chatRoomMemberId);
      setMembers((prev) =>
        prev.filter((m) => m.chatRoomMemberId !== member.chatRoomMemberId),
      );
    } catch (err) {
      console.error("Failed to kick member:", err);
      toast.error(err.response?.data?.message || "강제 퇴장에 실패했습니다.");
    }
  };

  const handleKickMember = (memberId) => {
    setMembers((prev) => prev.filter((m) => m.chatRoomMemberId !== memberId));
  };

  if (loadingRoom || loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex justify-center h-screen bg-gray-100">
      <div className="w-full max-w-[480px] bg-white flex flex-col h-full shadow-xl">
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
            <div className="relative">
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="p-2 text-gray-600"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-[199]"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-[200] overflow-hidden">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleLeaveRoom();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      채팅방 나가기
                    </button>
                    {isHost && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleCloseRoom();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                      >
                        채팅방 종료하기
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        setShowDropdown(false);
                        navigate("/", { replace: true });
                        await handleLogout();
                        toast("로그아웃되었습니다");
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </>
              )}
            </div>
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
                !prev ||
                getDateKey(prev.createdAt) !== getDateKey(msg.createdAt);
              const showSender =
                msg.messageType !== "SYSTEM" &&
                !isMe(msg.senderId) &&
                !isSameGroup(prev, msg);
              const showTime =
                msg.messageType !== "SYSTEM" && !isSameGroup(msg, next);

              return (
                <div key={msg.messageId}>
                  {showDate && <DateSeparator date={msg.createdAt} />}
                  <ChatBubble
                    message={msg}
                    isMe={isMe(msg.senderId)}
                    showSender={showSender}
                    showTime={showTime}
                    onProfileClick={handleProfileClick}
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
            myUserId={user?.userId}
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

        {/* Member Action Sheet */}
        <MemberActionSheet
          isOpen={!!actionSheetMember}
          onClose={() => setActionSheetMember(null)}
          member={actionSheetMember}
          myUserId={user?.userId}
          isHost={isHost}
          onAction={handleActionSheetAction}
        />
      </div>
    </div>
  );
};

export default ChatRoom;
