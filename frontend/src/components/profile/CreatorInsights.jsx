import React from 'react';
import { FiHeart, FiTrendingUp, FiUsers, FiBookmark, FiBarChart2 } from 'react-icons/fi';

function CreatorInsights({ likes = 0, impressions = 0, visitors = 0, saves = 0, loading = false, weeklyGrowth = "+0" }) {
  const metrics = [
    {
      id: 'likes',
      label: 'Likes',
      value: likes,
      icon: FiHeart,
      gradient: 'from-pink-500 to-rose-500',
      iconColor: 'text-pink-400'
    },
    {
      id: 'impressions',
      label: 'Impressions',
      value: impressions,
      icon: FiTrendingUp,
      gradient: 'from-blue-500 to-indigo-500',
      iconColor: 'text-blue-400'
    },
    {
      id: 'visitors',
      label: 'Visitors',
      value: visitors,
      icon: FiUsers,
      gradient: 'from-green-500 to-emerald-500',
      iconColor: 'text-green-400'
    },
    {
      id: 'saves',
      label: 'Saves',
      value: saves,
      icon: FiBookmark,
      gradient: 'from-yellow-500 to-orange-500',
      iconColor: 'text-yellow-400'
    }
  ];

  return (
    <div className="w-full flex flex-col font-sans select-none animate-fade-in">
      {/* Title & Badge */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2 tracking-tight">
          <FiBarChart2 className="text-[var(--primary)] text-base" />
          <span>Creator Insights</span>
        </h3>
        <span className="text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/15 px-2.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(34,197,94,0.05)] uppercase tracking-wider">
          {weeklyGrowth} this week
        </span>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-[var(--card)]/65 backdrop-blur-xl border border-white/5 rounded-[18px] p-4 shadow-lg shadow-black/10 hover:scale-[1.03] hover:border-[var(--primary)]/20 transition-all duration-300 flex flex-col justify-between min-h-[115px] group"
            >
              {/* Card Header: Label and Gradient Icon Wrapper */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wider">
                  {item.label}
                </span>
                <div className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${item.gradient} bg-opacity-10 flex items-center justify-center shadow-inner`}>
                  <Icon size={14} className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
                </div>
              </div>

              {/* Card Content: Value */}
              <div className="mt-2.5">
                <span className="text-2xl font-black text-white tracking-tight bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text">
                  {loading ? (
                    <span className="inline-block w-8 h-5 bg-white/10 animate-pulse rounded" />
                  ) : (
                    item.value.toLocaleString()
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CreatorInsights;
