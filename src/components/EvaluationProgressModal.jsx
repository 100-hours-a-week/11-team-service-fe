import { X, Clock, AlertCircle } from "lucide-react";

const EvaluationProgressModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-[24px] w-full max-w-[340px] overflow-hidden shadow-2xl relative animate-scale-in">
                <div className="p-8 pb-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-8 h-8 text-blue-500 animate-pulse" />
                    </div>

                    <h2 className="text-xl font-extrabold text-gray-900 mb-3">
                        AI 평가 진행 중
                    </h2>

                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                        방금 제출하신 지원서를 AI가 분석하고 있습니다.<br />
                        분석이 완료되면 결과를 확인할 수 있습니다.
                    </p>

                    <div className="mt-6 bg-gray-50 rounded-xl p-4 flex items-start space-x-3 text-left">
                        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-gray-500 leading-tight">
                            AI 분석은 보통 1~2분 정도 소요됩니다. 완료되면 '내 점수' 탭에서 점수를 확인할 수 있으며, 입장 신청이 가능해집니다.
                        </p>
                    </div>
                </div>

                <div className="p-6 pt-2">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl text-sm hover:bg-black transition-all shadow-lg shadow-blue-100/50 active:scale-[0.98]"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvaluationProgressModal;
