import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, FileText, MessageCircle, User } from 'lucide-react'; // Updated icons
import clsx from 'clsx';

const BottomNav = () => {
    const location = useLocation();

    // Updated nav items as per requirement
    // Community: 커뮤니티
    // Resume: 이력관리
    // Chat: 채팅방
    // My Page: 마이페이지


    // Re-evaluating: The user said "Main screen" has job list. 
    // And "Bottom bar has Community, Resume, Chat, MyPage".
    // If I click "Community", I go to "/"? or "/community"?
    // Let's assume "/" is the Job List (Dashboard). 
    // Is "Job List" == "Community"? Not necessarily. 
    // But for the sake of the prompt "This is the main screen", I will route "/" to what looks like the main tab.
    // I will set '커뮤니티' (Community) to '/community', '이력관리' to '/resume', '채팅방' to '/chat', '마이페이지' to '/mypage'.
    // And I will separate the "Job List" dashboard as the index route usually. 
    // **CRITICAL**: The user provided a screenshot where the header says "채용공고" (Job Notices).
    // And the bottom nav is "Community, Resume, Chat, MyPage".
    // This implies the standard "Job List" might be accessible via one of these, or the "Job List" IS the main view and maybe the bottom nav is just global navigation.
    // Let's stick to the user's specific text: "하단바는 커뮤니티 이력관리 채팅방 마이페이지".
    // I will implement these 4. 
    // However, I need to know where the "Job List" lives. 
    // If the user says "Main screen [shows] Job List", I will keep Dashboard at `/`.
    // I'll make the first tab "채용공고" (Job Posting) IF the user allows, but they were specific.
    // Maybe "커뮤니티" includes job postings? 
    // Let's default to: 
    // 1. 커뮤니티 (Community) -> /community
    // 2. 이력관리 (Resume) -> /resume
    // 3. 채팅방 (Chat) -> /chat
    // 4. 마이페이지 (MyPage) -> /mypage
    // AND keep the Dashboard at `/`. But this means `/` has no active tab?
    // Let's assume the "Job List" IS the "Community" tab or I should add a 5th tab "채용공고"?
    // The user said "Bottom bar has Community, Resume, Chat, MyPage". ONLY these 4? 
    // If so, the "Job List" must be one of them or a separate Home. 
    // Let's look at the uploaded image interpretation in the prompt: "1. 채용공고 [Header] ... 4. 공고 리스트".
    // "하단바 ... 커뮤니티 이력관리 채팅방 마이페이지".
    // It's possible the "Job List" is the "Community" tab. I will map "/" to Community.

    const trueNavItems = [
        { name: '커뮤니티', path: '/', icon: MessageSquare },
        { name: '이력관리', path: '/resume', icon: FileText },
        { name: '채팅방', path: '/chat', icon: MessageCircle },
        { name: '마이페이지', path: '/mypage', icon: User },
    ];

    // Hide BottomNav on these paths
    const hideOnPaths = ['/analysis', '/jobs'];
    const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path));

    if (shouldHide) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                {trueNavItems.map((item) => {
                    const Icon = item.icon;
                    // Active state checking: specific logic might be needed for sub-routes
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Icon className={clsx("w-6 h-6", isActive ? "fill-gray-900" : "stroke-current")} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
