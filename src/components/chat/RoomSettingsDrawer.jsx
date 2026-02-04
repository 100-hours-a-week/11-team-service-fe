import { useState } from "react";
import { X, LogOut, Trash2, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { leaveChatRoom, closeChatRoom } from "../../api/chatApi";

const GOAL_LABEL = {
  DOCUMENT: "서류 준비",
  INTERVIEW: "면접 준비",
};

const RoomSettingsDrawer = ({
  isOpen,
  onClose,
  chatRoomId,
  roomDetail,
  isHost,
  onRoomClosed,
  onLeft,
}) => {
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleLeave = async () => {
    const msg = isHost
      ? "방장이 나가면 채팅방이 종료됩니다. 나가시겠습니까?"
      : "채팅방을 나가시겠습니까?";
    if (!confirm(msg)) return;

    try {
      setProcessing(true);
      await leaveChatRoom(chatRoomId);
      onLeft?.();
    } catch (e) {
      console.error("Failed to leave:", e);
      toast.error(e.response?.data?.message || "나가기에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = async () => {
    if (!confirm("채팅방을 종료하시겠습니까? 이 작업은 되돌릴 수 없습니다."))
      return;

    try {
      setProcessing(true);
      await closeChatRoom(chatRoomId);
      onRoomClosed?.();
    } catch (e) {
      console.error("Failed to close room:", e);
      toast.error(e.response?.data?.message || "채팅방 종료에 실패했습니다.");
    } finally {
      setProcessing(false);
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
          <h2 className="font-bold text-gray-900">채팅방 설정</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Room Info */}
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2">
            {roomDetail?.roomName}
          </h3>
          <div className="space-y-1 text-xs text-gray-500">
            <p>
              목표: {GOAL_LABEL[roomDetail?.roomGoal] || roomDetail?.roomGoal}
            </p>
            <p>커트라인: {roomDetail?.cutlineScore}점</p>
            <p>
              인원: {roomDetail?.currentParticipants}/
              {roomDetail?.maxParticipants}명
            </p>
            {roomDetail?.preferredConditions && (
              <p>우대: {roomDetail.preferredConditions}</p>
            )}
            <p>
              상태:{" "}
              <span
                className={
                  roomDetail?.status === "ACTIVE"
                    ? "text-green-500"
                    : "text-gray-400"
                }
              >
                {roomDetail?.status === "ACTIVE" ? "활성" : "종료"}
              </span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-1" />
        <div className="p-4 space-y-2 border-t border-gray-100">
          <button
            onClick={handleLeave}
            disabled={processing}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">
              {isHost ? "나가기 (채팅방 종료)" : "채팅방 나가기"}
            </span>
          </button>
          {isHost && (
            <button
              onClick={handleClose}
              disabled={processing}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-sm font-medium">채팅방 종료</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomSettingsDrawer;
