import { useState, useEffect } from "react";
import { X, FileText, Download, Loader2, Crown } from "lucide-react";
import {
  getMemberProfile,
  getMemberResume,
  getMemberPortfolio,
} from "../../api/chatApi";

const MemberProfileModal = ({ chatRoomId, member, myUserId, onClose, onCompare }) => {
  const [profile, setProfile] = useState(null);
  const [activeDoc, setActiveDoc] = useState("resume");
  const [resume, setResume] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profileRes = await getMemberProfile(
          chatRoomId,
          member.chatRoomMemberId,
        );
        setProfile(profileRes.data.data);
      } catch (e) {
        console.error("Failed to fetch member profile:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chatRoomId, member.chatRoomMemberId]);

  const fetchDoc = async (type) => {
    const setter = type === "resume" ? setResume : setPortfolio;
    const fetcher = type === "resume" ? getMemberResume : getMemberPortfolio;
    const current = type === "resume" ? resume : portfolio;
    if (current) return;

    try {
      const res = await fetcher(chatRoomId, member.chatRoomMemberId);
      setter(res.data.data);
    } catch (e) {
      const code = e.response?.data?.code;
      if (code === "DOCUMENT_NOT_FOUND") {
        setter({ notFound: true });
      } else {
        console.error(`Failed to fetch ${type}:`, e);
        setter({ error: true });
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveDoc(tab);
    fetchDoc(tab);
  };

  const renderDocView = () => {
    const doc = activeDoc === "resume" ? resume : portfolio;
    const label = activeDoc === "resume" ? "이력서" : "포트폴리오";

    if (!doc) {
      return (
        <button
          onClick={() => fetchDoc(activeDoc)}
          className="w-full py-8 text-sm text-gray-400 hover:text-gray-600"
        >
          {label} 불러오기
        </button>
      );
    }
    if (doc.notFound) {
      return (
        <p className="text-sm text-gray-400 py-8 text-center">
          제출된 {label}가 없습니다
        </p>
      );
    }
    if (doc.error) {
      return (
        <p className="text-sm text-gray-400 py-8 text-center">
          {label}를 불러올 수 없습니다
        </p>
      );
    }

    return (
      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl"
      >
        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {doc.fileName}
          </p>
          <p className="text-xs text-gray-400">
            {doc.fileSize
              ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)}MB`
              : ""}
          </p>
        </div>
        <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </a>
    );
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[480px] bg-white rounded-t-3xl animate-slide-up max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">멤버 프로필</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                {member.profileImageUrl && (
                  <img
                    src={member.profileImageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {member.nickname}
                  </h3>
                  {member.role === "HOST" && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {member.role === "HOST" ? "방장" : "멤버"}
                </p>
                {profile?.score !== undefined && (
                  <p className="text-sm font-bold text-gray-700 mt-1">
                    AI 점수: {profile.score}점
                  </p>
                )}
              </div>
            </div>

            {/* Document Tabs */}
            <div className="flex border-b border-gray-100">
              {["resume", "portfolio"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                    activeDoc === tab
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  {tab === "resume" ? "이력서" : "포트폴리오"}
                </button>
              ))}
            </div>

            {renderDocView()}

            {/* Compare Button */}
            {member.userId != null &&
              String(member.userId) !== String(myUserId) && (
                <button
                  onClick={() => onCompare?.(member)}
                  className="w-full py-4 bg-[#101827] text-white font-bold rounded-2xl text-sm"
                >
                  나와 비교분석
                </button>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberProfileModal;
