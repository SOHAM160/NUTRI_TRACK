const StatCard = ({ icon: Icon, label, value, unit, color = 'orange', trend }) => {
  const colorMap = {
    orange: { icon: 'text-brand-orange-500', glow: 'shadow-[0_0_15px_rgba(234,88,12,0.15)]' },
    blue: { icon: 'text-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]' },
    green: { icon: 'text-green-500', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]' },
    red: { icon: 'text-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]' },
    purple: { icon: 'text-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
  };

  const colors = colorMap[color] || colorMap.orange;

  return (
    <div className={`card p-6 flex flex-col justify-between h-full hover:border-[#333] transition-colors ${colors.glow}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-dark-surface border border-dark-border flex items-center justify-center">
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-sm font-normal text-gray-500 ml-1.5">{unit}</span>}
        </p>
        <p className="text-sm font-medium text-gray-400 mt-2">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
