import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Camera, Pencil, X, User } from "lucide-react";
import toast from "react-hot-toast";
import UserMenu from "../components/UserMenu";
import { useAuth } from "../context/AuthContext";
import {
  getUserMe,
  uploadProfileImage,
  updateUserMe,
  deleteUserMe,
} from "../api/userApi";

const MyPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const fileInputRef = useRef(null);

  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Nickname editing
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  // Image uploading
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Withdrawal modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserMe();
        setUserData(data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        const status = error.response?.status;
        if (status === 403) {
          logout();
          navigate("/", { replace: true });
        } else if (status === 404) {
          toast.error("사용자 정보를 찾을 수 없습니다.", { id: "scuad-toast" });
          navigate(-1);
        } else {
          toast.error("사용자 정보를 불러오지 못했습니다.", {
            id: "scuad-toast",
          });
          navigate(-1);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate, logout]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.", { id: "scuad-toast" });
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadingImage(true);

    try {
      const uploadData = await uploadProfileImage(file);
      const updatedUser = await updateUserMe({
        profileImageFileId: uploadData.fileId,
      });
      setUserData(updatedUser);
      setPreviewUrl(null);
      toast.success("프로필 이미지가 변경되었습니다.", { id: "scuad-toast" });
    } catch (error) {
      console.error("Image upload failed:", error);
      setPreviewUrl(null);
      const code = error.response?.data?.code;
      if (code === "INVALID_FILE_TYPE") {
        toast.error("이미지 파일만 업로드 가능합니다.", { id: "scuad-toast" });
      } else {
        toast.error("이미지 업로드에 실패했습니다.", { id: "scuad-toast" });
      }
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleStartEditNickname = () => {
    setNicknameInput(userData?.nickname || "");
    setEditingNickname(true);
  };

  const handleCancelNickname = () => {
    setEditingNickname(false);
    setNicknameInput("");
  };

  const handleSaveNickname = async () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      toast.error("닉네임을 입력해주세요.", { id: "scuad-toast" });
      return;
    }
    if (trimmed.length > 30) {
      toast.error("닉네임은 30자 이내로 입력해주세요.", { id: "scuad-toast" });
      return;
    }
    if (trimmed === userData?.nickname) {
      setEditingNickname(false);
      return;
    }

    setSavingNickname(true);
    try {
      const updatedUser = await updateUserMe({ nickname: trimmed });
      setUserData(updatedUser);
      setEditingNickname(false);
      toast.success("닉네임이 변경되었습니다.", { id: "scuad-toast" });
    } catch (error) {
      const status = error.response?.status;
      if (status === 409) {
        toast.error("이미 사용 중인 닉네임입니다.", { id: "scuad-toast" });
      } else if (status === 400) {
        toast.error("올바른 닉네임을 입력해주세요.", { id: "scuad-toast" });
      } else {
        toast.error("닉네임 변경에 실패했습니다.", { id: "scuad-toast" });
      }
    } finally {
      setSavingNickname(false);
    }
  };

  const handleWithdraw = async () => {
    const trimmed = withdrawReason.trim();
    if (!trimmed) {
      toast.error("탈퇴 사유를 입력해주세요.", { id: "scuad-toast" });
      return;
    }
    if (trimmed.length > 1000) {
      toast.error("탈퇴 사유는 1000자 이내로 입력해주세요.", {
        id: "scuad-toast",
      });
      return;
    }

    setWithdrawing(true);
    try {
      await deleteUserMe(trimmed);
      logout();
      navigate("/", { replace: true });
      toast("탈퇴가 완료되었습니다.", { id: "scuad-toast" });
    } catch (error) {
      const status = error.response?.status;
      if (status === 403) {
        toast.error("이미 탈퇴 처리된 계정입니다.", { id: "scuad-toast" });
        logout();
        navigate("/", { replace: true });
      } else {
        toast.error("회원 탈퇴에 실패했습니다. 다시 시도해주세요.", {
          id: "scuad-toast",
        });
      }
    } finally {
      setWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center flex-col min-h-screen bg-white">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const avatarUrl = previewUrl || userData?.profileImageUrl;

  return (
    <div className="bg-white min-h-screen flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 border-b border-gray-100 pt-safe">
        <div className="h-14 flex items-center justify-center px-4 relative mt-2">
          <div className="absolute left-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
          </div>
          <h1 className="font-bold text-gray-900 text-lg">마이페이지</h1>
          <div className="absolute right-4">
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Image Section */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <button
            onClick={handleImageClick}
            disabled={uploadingImage}
            className="relative active:scale-95 transition-transform"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="프로필 이미지"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-300" />
              )}
            </div>
            {uploadingImage ? (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#101827] rounded-full flex items-center justify-center border-2 border-white">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            {userData?.nickname}
          </h2>
          {userData?.email && (
            <p className="mt-1 text-sm text-gray-400">{userData.email}</p>
          )}
        </div>

        {/* Info Section */}
        <div className="px-4 space-y-3">
          {/* Nickname Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-400">닉네임</span>
              {!editingNickname && (
                <button
                  onClick={handleStartEditNickname}
                  className="p-1 -mr-1 text-gray-400 hover:text-gray-700 active:scale-95 transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>

            {editingNickname ? (
              <div>
                <input
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNickname();
                    if (e.key === "Escape") handleCancelNickname();
                  }}
                  maxLength={30}
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
                  placeholder="닉네임 (1~30자)"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleCancelNickname}
                    disabled={savingNickname}
                    className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 font-medium active:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveNickname}
                    disabled={savingNickname}
                    className="flex-1 py-2 rounded-xl bg-[#101827] text-sm text-white font-medium active:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {savingNickname ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      </span>
                    ) : (
                      "저장"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-900 font-semibold">
                {userData?.nickname}
              </p>
            )}
          </div>

          {/* Email Card */}
          {userData?.email && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-medium text-gray-400 mb-1">이메일</p>
              <p className="text-gray-900 font-semibold">{userData.email}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                카카오 계정 이메일은 변경할 수 없습니다
              </p>
            </div>
          )}
        </div>

        {/* Withdraw Section */}
        <div className="px-4 mt-8 pb-4">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full text-center text-sm text-gray-400 hover:text-red-500 transition-colors font-medium py-2"
          >
            회원 탈퇴
          </button>
        </div>
      </div>

      {/* Withdrawal Bottom Sheet Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !withdrawing && setShowWithdrawModal(false)}
          />
          <div className="relative w-full max-w-[480px] bg-white rounded-t-3xl p-6 pb-safe">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">회원 탈퇴</h3>
              <button
                onClick={() => !withdrawing && setShowWithdrawModal(false)}
                disabled={withdrawing}
                className="p-1 text-gray-400 active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4">
              <p className="text-sm text-red-600 font-semibold mb-1">
                탈퇴 전 꼭 확인해주세요
              </p>
              <ul className="text-xs text-red-500 space-y-0.5 leading-relaxed list-disc list-inside">
                <li>탈퇴 후 계정 정보 및 활동 내역은 복구할 수 없습니다.</li>
                <li>동일한 카카오 계정으로 재로그인이 불가능합니다.</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              탈퇴 사유를 남겨주시면 서비스 개선에 참고하겠습니다.
            </p>
            <textarea
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder="탈퇴 사유를 입력해주세요 (최대 1000자)"
              maxLength={1000}
              rows={4}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent placeholder-gray-400"
            />
            <p className="text-right text-[11px] text-gray-400 mt-1 mb-4">
              {withdrawReason.length} / 1000
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm text-gray-500 font-semibold active:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawReason.trim()}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 text-sm text-white font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
              >
                {withdrawing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    처리 중...
                  </span>
                ) : (
                  "탈퇴하기"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
