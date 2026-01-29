

const ScoreCheckModal = ({ isOpen, onClose, onGoToUpload }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-[20px] w-full max-w-[320px] overflow-hidden shadow-2xl relative animate-scale-in">

                <div className="p-8 pb-6 text-center">
                    <h2 className="text-lg font-extrabold text-gray-900 mb-2">
                        자신의 이력을<br />업로드 하세요!
                    </h2>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        자신의 이력을 업로드를 해야<br />이용할 수 있는 서비스 입니다.
                    </p>
                </div>

                <div className="p-6 pt-2 flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl text-sm hover:bg-gray-200 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={onGoToUpload}
                        className="flex-1 bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black transition-colors shadow-lg shadow-gray-200"
                    >
                        제출
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScoreCheckModal;
