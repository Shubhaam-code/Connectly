import React from 'react';
import { FiHeart, FiUsers, FiBookmark, FiMessageCircle, FiEye, FiGrid } from 'react-icons/fi';

function CreatorInsights({ likes = 0, impressions = 0, visitors = 0, saves = 0, loading = false, posts = [] }) {
  // Metrics array matching the dashboard cards
  const metrics = [
    {
      id: 'likes',
      label: 'Likes',
      value: likes,
      icon: FiHeart,
      gradient: 'from-pink-500/10 to-rose-500/10',
      iconColor: 'text-pink-500'
    },
    {
      id: 'views',
      label: 'Views',
      value: impressions,
      icon: FiEye,
      gradient: 'from-blue-500/10 to-indigo-500/10',
      iconColor: 'text-blue-500'
    },
    {
      id: 'saves',
      label: 'Saves',
      value: saves,
      icon: FiBookmark,
      gradient: 'from-yellow-500/10 to-orange-500/10',
      iconColor: 'text-yellow-500'
    },
    {
      id: 'visitors',
      label: 'Visitors',
      value: visitors,
      icon: FiUsers,
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-500'
    }
  ];

  // Sort and fetch top performing posts
  const topPosts = [...posts]
    .sort((a, b) => {
      const aEng = (a.likes?.length || 0) + (a.comments?.length || 0);
      const bEng = (b.likes?.length || 0) + (b.comments?.length || 0);
      return bEng - aEng;
    })
    .slice(0, 3);

  return (
    <div className="w-full space-y-6 font-sans select-none animate-fade-in text-[var(--text)]">
      
      {/* 4 Cards Row: Audience Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between min-h-[120px] transition-all hover:-translate-y-1 hover:shadow-lg hover:border-purple-500/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {item.label}
                </span>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center`}>
                  <Icon size={14} className={item.iconColor} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--text)] tracking-tight">
                  {loading ? (
                    <span className="inline-block w-12 h-6 bg-[var(--text-secondary)]/10 animate-pulse rounded" />
                  ) : (
                    item.value.toLocaleString()
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Performing Posts Card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1">Top Performing Posts</h4>
          <p className="text-[10px] text-[var(--text-muted)] mb-4">Ranked by engagement</p>
        </div>

        <div className="space-y-3.5 flex-1 flex flex-col justify-center">
          {topPosts.length > 0 ? (
            topPosts.map((post, i) => {
              const caption = post.caption || '';
              const cleanTitle = caption.split('\n')[0] || 'Creative post';
              
              return (
                <div key={post._id || i} className="flex items-center gap-3.5 pb-3.5 border-b border-[var(--border)] last:border-b-0 last:pb-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex-shrink-0 flex items-center justify-center text-purple-400 font-bold overflow-hidden border border-[var(--border)]">
                    {post.media ? (
                      <img src={post.media} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FiGrid size={16} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold truncate text-[var(--text)]">{cleanTitle}</p>
                    <p className="text-[9px] text-[var(--text-secondary)] capitalize">{post.category || 'Code'}</p>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)] font-bold">
                    <span className="flex items-center gap-1">
                      <FiHeart size={12} className="text-pink-500/80" />
                      {post.likes?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMessageCircle size={12} className="text-purple-400" />
                      {post.comments?.length || 0}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-[var(--text-secondary)] space-y-2">
              <FiGrid size={24} className="opacity-45 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">No posts found</span>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}

export default CreatorInsights;
