import { useNavigate } from "react-router-dom";
import ScoreReport from "./ScoreReport";

const AnalysisResultModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="absolute inset-0 bg-white z-[300] overflow-y-auto animate-slide-up pb-safe">
      <ScoreReport data={data} onClose={onClose} />
    </div>
  );
};

export default AnalysisResultModal;
