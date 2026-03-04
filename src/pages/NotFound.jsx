import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl font-bold text-gray-300">?</span>
      </div>
      <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-3">
        페이지를 찾을 수 없습니다
      </h2>
      <p className="text-gray-400 text-sm mb-8">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
};

export default NotFound;
