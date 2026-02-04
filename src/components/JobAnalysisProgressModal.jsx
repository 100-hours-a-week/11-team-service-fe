import React from "react";
import { Loader2, Wand2, Sparkles, Star } from "lucide-react";

const JobAnalysisProgressModal = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-white z-[999] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="flex flex-col items-center mb-16">
        {/* Advanced 3D-Style AI Icon Composition */}
        <div className="relative mb-14 drop-shadow-[0_20px_50px_rgba(16,24,39,0.15)]">
          {/* Layered Decorative Background Clips */}
          <div className="absolute -inset-6 bg-gradient-to-b from-gray-50 to-white rounded-[40px] rotate-6 scale-95 border border-gray-100/50" />
          <div className="absolute -inset-3 bg-white rounded-[36px] -rotate-3 border border-gray-100 shadow-sm" />

          {/* Main Icon Container with 3D Depth Effect */}
          <div className="relative w-32 h-32 bg-white rounded-[32px] flex items-center justify-center border-b-4 border-r-4 border-gray-200/50 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.8),inset_2px_2px_6px_rgba(16,24,39,0.05),8px_8px_20px_rgba(16,24,39,0.08)] transform hover:scale-105 transition-transform duration-500 overflow-hidden">
            {/* Inner Glossy Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#101827]/[0.02] to-transparent pointer-events-none" />

            {/* Core Icon: Wand with Floating Animation */}
            <div className="animate-bounce-subtle">
              <Wand2
                className="w-16 h-16 text-[#101827]"
                style={{ strokeWidth: 1.25 }}
              />
            </div>

            {/* Floating Star Elements for 3D Depth */}
            <div className="absolute top-4 left-4 animate-pulse delay-75">
              <Star className="w-5 h-5 text-gray-300 fill-gray-100" />
            </div>
            <div className="absolute bottom-5 right-5 animate-pulse delay-500">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          {/* External Rotating Progress Ring */}
          <div className="absolute -inset-5">
            <Loader2
              className="w-42 h-42 text-gray-100 animate-spin"
              style={{ strokeWidth: 0.75, animationDuration: "3s" }}
            />
          </div>
          <div className="absolute -inset-5 rotate-180">
            <Loader2
              className="w-42 h-42 text-[#101827]/[0.05] animate-spin"
              style={{ strokeWidth: 1.5, animationDuration: "5s" }}
            />
          </div>
        </div>

        {/* Premium Messaging */}
        <div className="space-y-4 max-w-[300px]">
          <h3 className="text-[28px] font-black text-gray-900 tracking-tight leading-[1.2]">
            AI가 공고를
            <br />
            분석하고 있어요
          </h3>
          <p className="text-gray-400 text-sm font-bold leading-relaxed px-6 opacity-80">
            잠시만 기다려 주세요!
            <br />
            핵심 정보를 정리하고 있습니다.
          </p>
        </div>
      </div>

      {/* Progress Indicator: Modern Minimal Bar */}
      <div className="w-full max-w-[180px] h-1.5 bg-gray-50 rounded-full overflow-hidden relative border border-gray-100/50">
        <div className="absolute top-0 bottom-0 bg-[#101827] rounded-full animate-progress" />
      </div>
    </div>
  );
};

export default JobAnalysisProgressModal;
