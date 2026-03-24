import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

/**
 * AlertModal - A premium custom alert modal to replace browser alert().
 *
 * @param {boolean} isOpen - Whether the modal is open.
 * @param {string} title - The title of the alert.
 * @param {string} message - The message body.
 * @param {string} type - The type of alert: 'error' | 'success' | 'info'.
 * @param {function} onClose - Function to call when closing or confirming.
 * @param {string} confirmText - Text for the confirm button.
 */
const AlertModal = ({
  isOpen,
  onClose,
  title = "알림",
  message,
  type = "info",
  confirmText = "확인",
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "error":
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
          bg: "bg-red-50",
        };
      case "success":
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          bg: "bg-green-50",
        };
      default:
        return {
          icon: <Info className="w-8 h-8 text-[#101827]" />,
          bg: "bg-gray-50",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[320px] overflow-hidden shadow-2xl relative animate-scale-in">
        <div className="p-8 pb-6 text-center">
          <div
            className={`w-16 h-16 ${styles.bg} rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm`}
          >
            {styles.icon}
          </div>

          <h2 className="text-xl font-extrabold text-[#101827] mb-3">
            {title}
          </h2>

          <p className="text-gray-500 text-sm font-medium leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        <div className="p-6 pt-2">
          <button
            onClick={onClose}
            className="w-full bg-[#101827] text-white font-bold py-4 rounded-2xl text-sm hover:bg-[#1a263d] transition-all active:scale-[0.98]"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
