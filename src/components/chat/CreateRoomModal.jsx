import { useState, useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { createChatRoom } from "../../api/chatApi";

const CreateRoomModal = ({
  isOpen,
  onClose,
  jobMasterId,
  myScore,
  onSuccess,
}) => {
  const baseScore = myScore ?? 0;
  const scoreMin = Math.max(0, baseScore - 10);
  const scoreMax = Math.min(100, baseScore + 10);

  const [roomName, setRoomName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [roomGoal, setRoomGoal] = useState("DOCUMENT");
  const [cutlineScore, setCutlineScore] = useState(baseScore);
  const [preferredConditions, setPreferredConditions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 모달이 열릴 때마다 커트라인 점수를 내 점수로 초기화
  useEffect(() => {
    if (isOpen) {
      setCutlineScore(baseScore);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!roomName.trim()) {
      setError("채팅방 이름을 입력해주세요.");
      return;
    }
    if (roomName.trim().length < 2 || roomName.trim().length > 50) {
      setError("채팅방 이름은 2~50자로 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const response = await createChatRoom(jobMasterId, {
        roomName: roomName.trim(),
        maxParticipants,
        roomGoal,
        cutlineScore,
        preferredConditions: preferredConditions.trim() || undefined,
      });
      onSuccess?.(response.data.data);
      handleClose();
    } catch (err) {
      console.error("Failed to create chat room:", err);
      setError(err.response?.data?.message || "채팅방 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRoomName("");
    setMaxParticipants(5);
    setRoomGoal("DOCUMENT");
    setCutlineScore(baseScore);
    setPreferredConditions("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-[480px] bg-white rounded-t-3xl animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">채팅방 생성</h2>
          <button onClick={handleClose} className="p-1">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 방 이름 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              채팅방 이름
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="예: 백엔드 서류 준비 스터디"
              maxLength={50}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
            />
          </div>

          {/* 목표 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              목표
            </label>
            <div className="flex space-x-2">
              {[
                { value: "DOCUMENT", label: "서류 준비" },
                { value: "INTERVIEW", label: "면접 준비" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRoomGoal(opt.value)}
                  className={clsx(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-colors border",
                    roomGoal === opt.value
                      ? "bg-[#101827] text-white border-[#101827]"
                      : "bg-white text-gray-500 border-gray-200",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 최대 인원 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              최대 인원
            </label>
            <div className="flex space-x-2">
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxParticipants(n)}
                  className={clsx(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-colors border",
                    maxParticipants === n
                      ? "bg-[#101827] text-white border-[#101827]"
                      : "bg-white text-gray-500 border-gray-200",
                  )}
                >
                  {n}명
                </button>
              ))}
            </div>
          </div>

          {/* 커트라인 점수 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              커트라인 점수
              <span className="text-gray-400 font-normal ml-2">
                {cutlineScore}점
              </span>
            </label>
            <input
              type="range"
              min={scoreMin}
              max={scoreMax}
              step={1}
              value={cutlineScore}
              onChange={(e) => setCutlineScore(Number(e.target.value))}
              className="w-full accent-[#101827]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{scoreMin}점</span>
              <span>{scoreMax}점</span>
            </div>
          </div>

          {/* 우대 조건 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              우대 조건
              <span className="text-gray-400 font-normal ml-1">(선택)</span>
            </label>
            <input
              type="text"
              value={preferredConditions}
              onChange={(e) => setPreferredConditions(e.target.value)}
              placeholder="예: AWS 경험자 우대"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
            />
          </div>

          {/* Error */}
          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          {/* Buttons */}
          <div className="flex space-x-3 pt-2 pb-safe">
            <button
              onClick={handleClose}
              className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl text-sm"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-4 bg-[#101827] text-white font-bold rounded-2xl text-sm disabled:opacity-50"
            >
              {submitting ? "생성 중..." : "생성"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
