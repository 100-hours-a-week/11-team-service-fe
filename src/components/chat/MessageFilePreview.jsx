import { FileText, Download } from "lucide-react";

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const MessageFilePreview = ({ file, isMe }) => {
  if (!file) return null;

  const isImage = file.contentType?.startsWith("image/");
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const downloadUrl = file.fileUrl?.startsWith("http")
    ? file.fileUrl
    : `${baseUrl}${file.fileUrl}`;

  if (isImage) {
    return (
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={downloadUrl}
          alt={file.fileName}
          className="max-w-full max-h-[200px] rounded-lg object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={downloadUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center space-x-3 p-3 rounded-lg ${
        isMe ? "bg-white/10" : "bg-white"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isMe ? "bg-white/20" : "bg-gray-100"
        }`}
      >
        <FileText
          className={`w-5 h-5 ${isMe ? "text-white" : "text-gray-500"}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isMe ? "text-white" : "text-gray-900"
          }`}
        >
          {file.fileName}
        </p>
        <p className={`text-xs ${isMe ? "text-white/60" : "text-gray-400"}`}>
          {formatFileSize(file.fileSize)}
        </p>
      </div>
      <Download
        className={`w-4 h-4 flex-shrink-0 ${
          isMe ? "text-white/60" : "text-gray-400"
        }`}
      />
    </a>
  );
};

export default MessageFilePreview;
