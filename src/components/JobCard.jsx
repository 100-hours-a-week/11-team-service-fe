import { useNavigate } from 'react-router-dom';

const JobCard = ({ job }) => {
    const navigate = useNavigate();

    // Mapping data
    const company = job.companyName || '회사명';
    const title = job.jobTitle || '직무';
    const status = job.status || 'OPEN'; // OPEN, CLOSED
    const startDate = job.startDate ? job.startDate.replaceAll('-', '.') : '2025.01.01';
    const endDate = job.endDate ? job.endDate.replaceAll('-', '.') : '2025.12.31';
    const groupCount = job.currentGroupCount || 0;

    const isClosed = status !== 'OPEN';

    const handleClick = () => {
        navigate(`/jobs/${job.jobMasterId || job.id}`);
    };

    return (
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-transform relative">
            {/* Header: Company, Title, Status */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xl font-bold text-gray-900">{company}</span>
                        <span className="text-sm text-gray-500 font-medium">{title}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-lg font-bold ${isClosed ? 'text-gray-400' : 'text-gray-900'}`}>
                        {isClosed ? '마감' : '진행'}
                    </span>
                </div>
            </div>

            {/* Progress Bar Visual (Mock) */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div
                    className={`h-full rounded-full ${isClosed ? 'bg-gray-400' : 'bg-black'}`}
                    style={{ width: '40%' }} // Fixed width for design as per image mock
                ></div>
            </div>

            {/* Date Range */}
            <div className="flex justify-end text-xs text-gray-400 mb-4 font-medium">
                {startDate} ~ {endDate}
            </div>

            {/* Footer: Group Count and Detail Link */}
            <div className="flex justify-between items-end">
                <div className="bg-gray-50 px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-bold text-gray-800">현재 모임 {groupCount}개</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                    className="text-sm font-semibold text-gray-900 hover:opacity-70"
                >
                    상세보기
                </button>
            </div>

            {/* Click area coverage */}
            <div className="absolute inset-0 z-0" onClick={handleClick}></div>
            <div className="relative z-10 pointer-events-none"></div>
            {/* Note: The button needs pointer-events-auto if z-index is used, but simple onclick propagation stop works */}
        </div>
    );
};

export default JobCard;
