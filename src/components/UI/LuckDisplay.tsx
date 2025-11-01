interface LuckDisplayProps {
  luck: number;
}

export function LuckDisplay({ luck }: LuckDisplayProps) {
  // 根据运气值决定颜色
  const getColor = () => {
    if (luck > 70) return 'text-green-400';
    if (luck > 40) return 'text-yellow-400';
    return 'text-horror-red';
  };

  const getBgColor = () => {
    if (luck > 70) return 'bg-green-400';
    if (luck > 40) return 'bg-yellow-400';
    return 'bg-horror-red';
  };

  return (
    <div className="bg-horror-dark px-4 py-2 rounded horror-border">
      <div className="text-xs text-horror-gray mb-1">Luck</div>
      <div className="flex items-center gap-2">
        <span className="text-xl">🍀</span>
        <div className="w-24 h-4 bg-gray-800 rounded overflow-hidden">
          <div
            className={`h-full ${getBgColor()} transition-all duration-300`}
            style={{ width: `${luck}%` }}
          />
        </div>
        <span className={`text-sm font-bold ${getColor()}`}>{luck}</span>
      </div>
    </div>
  );
}
