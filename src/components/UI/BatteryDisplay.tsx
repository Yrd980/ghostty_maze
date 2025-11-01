interface BatteryDisplayProps {
  percentage: number;
  isOn: boolean;
}

export function BatteryDisplay({ percentage, isOn }: BatteryDisplayProps) {
  // 根据电量决定颜色
  const getColor = () => {
    if (percentage > 60) return 'text-green-400';
    if (percentage > 30) return 'text-yellow-400';
    return 'text-horror-red';
  };

  const getBgColor = () => {
    if (percentage > 60) return 'bg-green-400';
    if (percentage > 30) return 'bg-yellow-400';
    return 'bg-horror-red';
  };

  return (
    <div className="flex items-center gap-3 bg-horror-dark px-4 py-2 rounded horror-border">
      <div className="text-xl">{isOn ? '🔦' : '🔦'}</div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${getColor()}`}>
            {percentage.toFixed(0)}%
          </span>
          {isOn && (
            <span className="text-xs text-horror-red horror-glow">ON</span>
          )}
          {!isOn && percentage > 0 && (
            <span className="text-xs text-horror-gray">OFF</span>
          )}
        </div>
        <div className="w-24 h-2 bg-gray-800 rounded overflow-hidden mt-1">
          <div
            className={`h-full ${getBgColor()} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
