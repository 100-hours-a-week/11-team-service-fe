/**
 * Premium Logo Component for SCUAD (Wordmark Only)
 * Concept: "Typographic Brand"
 * Symbol: None
 * Focus: Pure typography
 */
const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-2xl font-black tracking-tighter text-[#101827] font-sans">
        SCUAD
      </span>
    </div>
  );
};

export default Logo;
