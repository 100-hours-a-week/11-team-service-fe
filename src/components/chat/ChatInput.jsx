import { useState, useRef } from "react";
import { Paperclip, SendHorizontal, X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 500;
const ACCEPTED_TYPES = "image/*,application/pdf,.docx,.xlsx";

const ChatInput = ({ onSendText, onSendFile, disabled }) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 96) + "px"; // max 4 lines
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (sending || disabled) return;

    if (selectedFile) {
      try {
        setSending(true);
        await onSendFile(selectedFile);
        setSelectedFile(null);
      } catch (e) {
        console.error("File send failed:", e);
      } finally {
        setSending(false);
      }
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_TEXT_LENGTH) {
      toast.error(`메시지는 ${MAX_TEXT_LENGTH}자 이하로 입력해주세요.`);
      return;
    }

    try {
      setSending(true);
      await onSendText(trimmed);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (e) {
      console.error("Message send failed:", e);
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("파일 크기는 10MB 이하여야 합니다.");
      return;
    }
    setSelectedFile(file);
    e.target.value = "";
  };

  const canSend = !disabled && !sending && (text.trim() || selectedFile);

  return (
    <div className="border-t border-gray-100 bg-white">
      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 pt-3 flex items-center space-x-2">
          <div className="flex-1 flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
            <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate">
              {selectedFile.name}
            </span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2 px-4 py-3 pb-safe">
        <button
          onClick={() => {
            // TODO: API 개발 완료 후 파일 전송 기능 활성화
            // fileInputRef.current?.click();
            toast("준비중인 기능입니다");
          }}
          disabled={disabled}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileSelect}
          className="hidden"
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedFile ? "파일을 전송합니다" : "메시지를 입력하세요"
          }
          disabled={disabled || selectedFile}
          rows={1}
          className="flex-1 resize-none bg-gray-100 rounded-2xl px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none disabled:opacity-50 max-h-24"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="p-2 text-white bg-[#101827] rounded-full disabled:opacity-30 flex-shrink-0 transition-opacity"
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
