import MessageFilePreview from "./MessageFilePreview";

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ChatBubble = ({
  message,
  isMe,
  showSender,
  showTime,
  onProfileClick,
}) => {
  // System message
  if (message.messageType === "SYSTEM") {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  if (isMe) {
    return (
      <div className="flex justify-end px-4 mb-1">
        <div className="flex items-end space-x-1 max-w-[75%]">
          {showTime && (
            <span className="text-[10px] text-gray-400 mb-1 flex-shrink-0">
              {formatTime(message.createdAt)}
            </span>
          )}
          <div className="bg-[#101827] text-white rounded-2xl rounded-tr-md px-3.5 py-2.5">
            {message.messageType === "FILE" ? (
              <MessageFilePreview file={message.file} isMe />
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex px-4 mb-1">
      <div className="max-w-[75%]">
        {showSender && (
          <button
            type="button"
            onClick={() => onProfileClick?.(message)}
            className="flex items-center space-x-2 mb-1"
          >
            <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />
            <span className="text-xs font-bold text-gray-700">
              {message.senderNickname}
            </span>
          </button>
        )}
        <div
          className={`flex items-end space-x-1 ${showSender ? "ml-8" : "ml-8"}`}
        >
          <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-md px-3.5 py-2.5">
            {message.messageType === "FILE" ? (
              <MessageFilePreview file={message.file} isMe={false} />
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </p>
            )}
          </div>
          {showTime && (
            <span className="text-[10px] text-gray-400 mb-1 flex-shrink-0">
              {formatTime(message.createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
