import { useEffect, useState } from 'react';

interface HeartRateDisplayProps {
  bpm?: number;
}

export function HeartRateDisplay({ bpm = 75 }: HeartRateDisplayProps) {
  const [beat, setBeat] = useState(false);

  // 心跳动画
  useEffect(() => {
    const interval = (60 / bpm) * 1000; // 根据BPM计算间隔
    const timer = setInterval(() => {
      setBeat(true);
      setTimeout(() => setBeat(false), 150);
    }, interval);

    return () => clearInterval(timer);
  }, [bpm]);

  return (
    <div className="flex items-center gap-3 bg-horror-dark px-4 py-2 rounded horror-border">
      <span
        className={`text-2xl transition-transform duration-150 ${
          beat ? 'scale-125' : 'scale-100'
        }`}
      >
        💓
      </span>
      <div className="flex flex-col">
        <span className="text-horror-red text-xl font-bold horror-glow">
          {bpm} BPM
        </span>
        <span className="text-xs text-horror-gray">Heart Rate</span>
      </div>
    </div>
  );
}
