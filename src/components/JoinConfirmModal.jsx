import { useRef } from "react";

const JoinConfirmModal = ({ isOpen, onClose, onConfirm, roomTitle }) => {
  const modalRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white rounded-[24px] w-full max-w-[320px] overflow-hidden shadow-2xl relative animate-scale-in"
      >
        <div className="p-8 pb-6 text-center">
          <h2 className="text-xl font-extrabold text-gray-900 mb-3 leading-snug">
            입장을 신청하시겠습니까?
          </h2>
          <p className="text-gray-500 text-sm font-medium leading-relaxed">
            {roomTitle && (
              <span className="block font-bold text-gray-800 mb-1">
                "{roomTitle}"
              </span>
            )}
            채팅방 운영자에게 입장 신청을 보냅니다.
          </p>
        </div>

        <div className="p-6 pt-2 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl text-sm hover:bg-gray-200 transition-all active:scale-[0.98]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gray-900 text-white font-bold py-4 rounded-2xl text-sm hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinConfirmModal;
