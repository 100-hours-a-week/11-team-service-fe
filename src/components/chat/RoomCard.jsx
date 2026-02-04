import clsx from "clsx";

const GOAL_LABEL = {
  DOCUMENT: "서류",
  INTERVIEW: "면접",
};

const RoomCard = ({ room, onJoin, onEnter }) => {
  const isFull = room.currentParticipants >= room.maxParticipants;
  const isAlreadyJoined = room.joinStatus === "ALREADY_JOINED";
  const isScoreNotMet = room.joinStatus === "SCORE_NOT_MET";

  const handleClick = () => {
    if (isAlreadyJoined && onEnter) {
      onEnter(room);
    } else if (onJoin) {
      onJoin(room);
    }
  };

  const getButtonProps = () => {
    if (isAlreadyJoined) {
      return {
        label: "입장",
        disabled: false,
        className: "bg-[#101827] text-white",
      };
    }
    if (isFull) {
      return {
        label: "마감",
        disabled: true,
        className: "bg-gray-100 text-gray-400 cursor-not-allowed",
      };
    }
    if (isScoreNotMet) {
      return {
        label: "점수 미달",
        disabled: true,
        className: "bg-gray-100 text-gray-400 cursor-not-allowed",
      };
    }
    return {
      label: "입장 신청",
      disabled: false,
      className: "bg-[#101827] text-white hover:bg-[#1a263d]",
    };
  };

  const btn = getButtonProps();

  return (
    <div className="border border-gray-200 rounded-2xl p-5 shadow-sm bg-white">
      <div className="flex items-start justify-between mb-3">
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">
          {GOAL_LABEL[room.roomGoal] || room.roomGoal}
        </span>
        {room.status === "CLOSED" && (
          <span className="text-xs text-gray-400 font-medium">종료됨</span>
        )}
      </div>
      <h3 className="font-bold text-gray-900 text-base mb-1 truncate">
        {room.roomName}
      </h3>
      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4 font-medium">
        <span
          className={clsx(
            "font-bold",
            isFull ? "text-red-500" : "text-gray-900",
          )}
        >
          {room.currentParticipants}/{room.maxParticipants}
        </span>
        <span>•</span>
        <span className="bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold border border-red-100">
          {room.cutlineScore}점 이상
          {room.preferredConditions ? ` ${room.preferredConditions}` : ""}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-gray-200" />
          <span className="text-xs text-gray-600 font-medium">
            {room.hostNickname}
          </span>
        </div>
        {room.status !== "CLOSED" && (
          <button
            onClick={handleClick}
            disabled={btn.disabled}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-bold transition-colors",
              btn.className,
            )}
          >
            {btn.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomCard;
