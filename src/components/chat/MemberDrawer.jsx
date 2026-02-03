import { X, Crown, UserMinus } from "lucide-react";
import clsx from "clsx";
import { kickMember } from "../../api/chatApi";

const MemberDrawer = ({
  isOpen,
  onClose,
  members,
  isHost,
  chatRoomId,
  onMemberClick,
  onKickMember,
  myUserId,
}) => {
  if (!isOpen) return null;

  const handleKick = async (e, member) => {
    e.stopPropagation();
    if (!confirm(`${member.nickname}님을 강제 퇴장시키시겠습니까?`)) return;

    try {
      await kickMember(chatRoomId, member.chatRoomMemberId);
      onKickMember?.(member.chatRoomMemberId);
    } catch (err) {
      console.error("Failed to kick member:", err);
      alert(err.response?.data?.message || "강제 퇴장에 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-[300]">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-[280px] max-w-[80vw] bg-white shadow-xl animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            멤버{" "}
            <span className="text-gray-400 font-normal">{members.length}</span>
          </h2>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto">
          {members.map((member) => {
            const isMeFlag = member.userId === myUserId;
            return (
              <button
                key={member.chatRoomMemberId}
                onClick={() => !isMeFlag && onMemberClick?.(member)}
                className={clsx(
                  "w-full flex items-center justify-between px-4 py-3 transition-colors text-left",
                  !isMeFlag && "hover:bg-gray-50 active:bg-gray-100",
                )}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {member.profileImageUrl && (
                      <img
                        src={member.profileImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {member.nickname}
                      </span>
                      {member.role === "HOST" && (
                        <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                      )}
                      {isMeFlag && (
                        <span className="text-xs text-gray-400">(나)</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {member.role === "HOST" ? "방장" : "멤버"}
                    </span>
                  </div>
                </div>
                {isHost && !isMeFlag && member.role !== "HOST" && (
                  <button
                    onClick={(e) => handleKick(e, member)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MemberDrawer;
