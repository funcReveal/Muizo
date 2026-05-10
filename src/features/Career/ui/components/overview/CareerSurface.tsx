import React from "react";

interface CareerSurfaceProps {
  children: React.ReactNode;
  className?: string;
}

export const careerSurfaceClass =
  "relative overflow-hidden rounded-[24px] border border-cyan-100/12 bg-[linear-gradient(180deg,rgba(8,15,28,0.94),rgba(2,6,23,0.985))] p-4 shadow-[0_18px_42px_-34px_rgba(34,211,238,0.52),inset_0_1px_0_rgba(255,255,255,0.045)]";

export const careerMiniCardClass =
  "rounded-[16px] border border-white/8 bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]";

const CareerSurface: React.FC<CareerSurfaceProps> = ({
  children,
  className = "",
}) => {
  return (
    <section className={`${careerSurfaceClass} ${className}`}>
      {children}
    </section>
  );
};

export default CareerSurface;
