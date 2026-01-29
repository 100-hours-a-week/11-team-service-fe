import { useState, useRef } from 'react';
import client from '../api/client';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ApplyModal = ({ isOpen, onClose, jobPostingId, jobTitle }) => {
    if (!isOpen) return null;

    const [resume, setResume] = useState(null);
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [helperText, setHelperText] = useState(''); // For file size warning

    const resumeInputRef = useRef(null);
    const portfolioInputRef = useRef(null);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        setHelperText('');

        // 1. Check Format (PDF only)
        if (file.type !== 'application/pdf') {
            setError('PDF 형식으로 업로드해주세요.');
            return;
        }

        // 2. Check Size (10MB)
        if (file.size > MAX_FILE_SIZE) {
            setHelperText('파일의 용량이 10MB를 초과했습니다. 10MB 이하의 파일을 등록해 주세요.');
            return;
        }

        if (type === 'RESUME') {
            setResume(file);
        } else {
            setPortfolio(file);
        }
    };

    const handleSubmit = async () => {
        if (!resume) return;

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('jobPostingId', jobPostingId);
        formData.append('resume', resume);
        if (portfolio) {
            formData.append('portfolio', portfolio);
        }

        try {
            await client.post('/api/v1/applications', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('지원서가 성공적으로 제출되었습니다.');
            onClose();
        } catch (err) {
            console.error(err);
            setError('업로드에 실패하였습니다');
        } finally {
            setLoading(false);
        }
    };

    // Helper to trigger hidden input
    const triggerFileArgs = (ref) => {
        ref.current.click();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-scale-in">

                {/* Header (Optional based on design, trying to match clean modal) */}
                <div className="p-6 pb-2">
                    <h2 className="text-lg font-bold text-gray-900">지원하기</h2>
                    <p className="text-xs text-gray-500 mt-1">{jobTitle}</p>
                </div>

                <div className="p-6 pt-4 space-y-6">
                    {/* Resume Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-gray-900">이력서 <span className="text-red-500">*</span></label>
                            {resume && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-sm text-gray-500 truncate border border-gray-100">
                                {resume ? resume.name : 'PDF 파일을 선택해주세요'}
                            </div>
                            <button
                                onClick={() => triggerFileArgs(resumeInputRef)}
                                className="bg-white border border-gray-300 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                            >
                                파일
                            </button>
                            <input
                                type="file"
                                ref={resumeInputRef}
                                onChange={(e) => handleFileChange(e, 'RESUME')}
                                accept="application/pdf"
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Portfolio Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-gray-900">포트폴리오</label>
                            {portfolio && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-sm text-gray-500 truncate border border-gray-100">
                                {portfolio ? portfolio.name : '선택 사항'}
                            </div>
                            <button
                                onClick={() => triggerFileArgs(portfolioInputRef)}
                                className="bg-white border border-gray-300 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                            >
                                파일
                            </button>
                            <input
                                type="file"
                                ref={portfolioInputRef}
                                onChange={(e) => handleFileChange(e, 'PORTFOLIO')}
                                accept="application/pdf"
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Helper Text / Error Message */}
                    <div className="min-h-[20px]">
                        {helperText && (
                            <p className="text-red-500 text-xs flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {helperText}
                            </p>
                        )}
                        {error && (
                            <p className="text-red-500 text-xs flex items-center font-bold">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 pt-0 flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-300 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!resume || !!error || loading}
                        className={`flex-1 font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center
                            ${!resume || !!error || loading
                                ? 'bg-gray-300 text-white cursor-not-allowed'
                                : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200'}`}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : '제출'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplyModal;
