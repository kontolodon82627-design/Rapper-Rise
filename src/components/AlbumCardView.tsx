import React, { useState } from 'react';
import { GameState, Album, Song } from '../types';
import { X, PlayCircle, BarChart3, TrendingUp, TrendingDown, Minus, Disc, Headphones, Radio } from 'lucide-react';

interface AlbumCardViewProps {
  album: Album;
  gameState: GameState;
  onClose: () => void;
  onReleaseDeluxe?: () => void;
}

type Platform = 'spotify' | 'appleMusic' | 'amazonMusic' | 'youtubeMusic' | 'total';

export function AlbumCardView({ album, gameState, onClose, onReleaseDeluxe }: AlbumCardViewProps) {
  const [platform, setPlatform] = useState<Platform>('spotify');

  // Helper to calculate streams
  const getDaily = (r: Song | Album) => {
     if (platform === 'total') return r.lastDailyStreams?.total || 0;
     const total = r.lastDailyStreams?.total || 0;
     // Replicate splits from App.tsx
     const sp = Math.floor(total * 0.45);
     const ap = Math.floor(total * 0.25);
     const am = Math.floor(total * 0.25);
     const yt = total - sp - ap - am;
     
     if (platform === 'spotify') return sp;
     if (platform === 'appleMusic') return ap;
     if (platform === 'amazonMusic') return am;
     if (platform === 'youtubeMusic') return yt;
     return 0;
  };

  const getTotal = (r: Song | Album) => {
     if (platform === 'total') return r.streams.total;
     return r.streams[platform] || 0;
  };

  // Find all tracks
  const tracks: Song[] = [];
  album.trackIds.forEach(id => {
     const t = gameState.releases.find(rel => rel?.id === id);
     if (t && t.type === 'Single') tracks.push(t as Song);
  });

  const currentDate = new Date(gameState.time.startDate);
  currentDate.setDate(currentDate.getDate() + gameState.time.daysPassed);

  const getDayLabel = () => {
     const daysSinceRelease = album.releaseDate ? Math.max(0, Math.floor((currentDate.getTime() - new Date(album.releaseDate).getTime()) / (1000 * 3600 * 24))) : 0;
     if (daysSinceRelease === 0) return 'DEBUT DAY';
     return `DAY ${daysSinceRelease + 1}`;
  };

  // Compute album daily and total manually by summing tracks to ensure accuracy
  const albumDaily = tracks.reduce((sum, t) => sum + getDaily(t), 0);
  const albumTotal = tracks.reduce((sum, t) => sum + getTotal(t), 0);
  
  // Fake change % based on daily streams for immersive feeling
  const getChangeInfo = (id: string, daily: number) => {
     if (daily === 0) return { changeNum: 0, percent: 0 };
     let h = 0;
     for (let i = 0; i < id.length; i++) {
        h = Math.imul(31, h) + id.charCodeAt(i) | 0;
     }
     const currentDay = Math.floor(currentDate.getTime() / (1000 * 3600 * 24));
     const seed = Math.abs(h + currentDay);
     const changePercent = (seed % 30) - 15;
     
     const daysSinceRelease = album.releaseDate ? Math.max(0, Math.floor((currentDate.getTime() - new Date(album.releaseDate).getTime()) / (1000 * 3600 * 24))) : 0;
     if (daysSinceRelease === 0) {
        return { changeNum: daily, percent: null };
     }
     
     const percentDec = changePercent / 100;
     const previousDayEstimate = daily / (1 + percentDec);
     const changeNum = Math.floor(daily - previousDayEstimate);
     
     return { changeNum, percent: changePercent };
  };

  const albumChangeInfo = getChangeInfo(album.id, albumDaily);

  const formatNumber = (n: number) => n.toLocaleString();

  const PlatformIcon = ({ type }: { type: Platform }) => {
    switch (type) {
      case 'spotify': return <div className="w-4 h-4 bg-[#1db954] rounded-full flex items-center justify-center pt-[1px] pl-[0.5px] shadow-[0_0_10px_rgba(29,185,84,0.3)]"><div className="flex flex-col gap-[2px] items-center"><div className="w-2.5 h-[1.5px] bg-black rounded-full transform -rotate-12"></div><div className="w-2 h-[1px] bg-black rounded-full transform -rotate-12"></div></div></div>;
      case 'appleMusic': return <div className="w-4 h-4 bg-gradient-to-br from-pink-500 to-red-600 rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.3)]"><PlayCircle className="w-3 h-3 text-white fill-white" /></div>;
      case 'amazonMusic': return <div className="w-4 h-4 bg-[#00A8E1] rounded-sm flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(0,168,225,0.3)]"><span className="text-[10px] font-black text-white italic">a</span></div>;
      case 'youtubeMusic': return <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.3)]"><div className="w-0 h-0 border-t-[2px] border-t-transparent border-l-[4px] border-l-white border-b-[2px] border-b-transparent ml-0.5"></div></div>;
      case 'total': return <Radio className="w-4 h-4 text-white" />;
      default: return null;
    }
  };

  const platformColors: Record<Platform, string> = {
    spotify: '#1db954',
    appleMusic: '#fa243c',
    amazonMusic: '#00a8e1',
    youtubeMusic: '#ff0000',
    total: '#ffffff'
  };

  const currentColor = platformColors[platform];

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6 overflow-hidden">
      <div className="absolute inset-0 max-w-6xl mx-auto flex flex-col bg-[#0f0f13] rounded-none sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-0 sm:border border-white/5" style={{ maxHeight: '95vh' }}>
        
        {/* Immersive Dynamic Background with SVGs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-none sm:rounded-[2.5rem]">
          <div 
            className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[180%] h-[100%] opacity-[0.15] transition-all duration-[2000ms] ease-out blur-[160px]"
            style={{ background: `radial-gradient(ellipse at top, ${currentColor} 0%, transparent 60%)` }}
          />
          {/* Abstract Soundwave / Grooves */}
          <svg className="absolute -right-[15%] -top-[10%] w-[800px] h-[800px] opacity-[0.04] text-white animate-spin-slow pointer-events-none" style={{ animationDuration: '60s' }} viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.2" fill="none" strokeDasharray="2 1" />
              <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="0.4" fill="none" />
              <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.1" fill="none" strokeDasharray="1 1" />
              <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <circle cx="50" cy="50" r="24" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
              <circle cx="50" cy="50" r="16" stroke="currentColor" strokeWidth="0.3" fill="none" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0f13]/80 to-[#0f0f13] pointer-events-none" />
        </div>

        {/* Header Actions */}
        <div className="flex justify-between items-center p-4 sm:p-6 shrink-0 relative z-10">
           <div className="flex bg-black/40 backdrop-blur-xl rounded-2xl p-1 gap-1 border border-white/10 shadow-xl">
             {(['spotify', 'appleMusic', 'amazonMusic', 'youtubeMusic', 'total'] as Platform[]).map(p => (
               <button
                 key={p}
                 onClick={() => setPlatform(p)}
                 className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${platform === p ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
               >
                 <PlatformIcon type={p} />
                 <span className="hidden lg:inline">{p === 'appleMusic' ? 'Apple' : p === 'youtubeMusic' ? 'YouTube' : p === 'amazonMusic' ? 'Amazon' : p}</span>
               </button>
             ))}
           </div>
           <button onClick={onClose} className="p-3 bg-black/40 backdrop-blur-xl hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-gray-400 hover:text-white shadow-xl hover:scale-105 active:scale-95">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto hide-scrollbar font-sans text-gray-200 relative z-10 px-4 sm:px-12">
          
          {/* Hero Section */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 py-6 sm:py-10 shrink-0 items-center sm:items-end">
             <div className="relative group shrink-0 w-56 h-56 sm:w-72 sm:h-72">
               {/* Decorative subtle shadow mimicking a record peeking out */}
               <div className="absolute inset-0 bg-black rounded-full scale-[1.03] translate-x-3 shadow-[0_0_40px_rgba(0,0,0,0.8)] opacity-50 transition-transform duration-700 group-hover:translate-x-8 group-hover:rotate-12" style={{ backgroundImage: 'radial-gradient(circle at center, #222 0%, #000 70%)'}}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                     <div className="w-1/3 h-1/3 rounded-full border-[0.5px] border-white/20"></div>
                  </div>
               </div>
               
               <img src={album.coverImage || undefined} className="relative z-10 w-full h-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl sm:rounded-2xl border border-white/10 scale-100 transition-transform duration-700 group-hover:scale-[1.02]" alt="Album Cover" />
               <div className="absolute inset-0 z-10 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] rounded-xl sm:rounded-2xl mix-blend-overlay pointer-events-none" />
             </div>
             
             <div className="flex flex-col justify-end w-full text-center sm:text-left flex-1 min-w-0 pb-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] mb-3 opacity-60 text-white">
                   <Headphones className="w-3.5 h-3.5" />
                   {album.type} Analytics
                </div>
                
                <h1 className="text-4xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-[0.85] mb-4 pb-2 truncate">
                  {album.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start mb-6">
                  <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white/90">
                    {(() => {
                        const r = album as any;
                        if (r.isNPCCollab) return `${r.collaborator} & ${gameState.artist?.name || 'You'}`;
                        if (r.type === 'Single' && r.collaborator) return `${gameState.artist?.name || 'You'} & ${r.collaborator}`;
                        return gameState.artist?.name || 'You';
                     })()}
                  </h2>
                  {album.trend && (
                     <span className={`text-[10px] sm:text-xs uppercase tracking-widest font-black px-3 py-1.5 rounded-lg border ${
                        album.trend.includes('Mega Hit') ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]' :
                        album.trend.includes('Hit') && !album.trend.includes('Non-Hit') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' :
                        album.trend === 'Flop' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                        'bg-white/5 text-white/60 border-white/10'
                     }`}>
                        {album.trend}
                     </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-3 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <span className="text-gray-300 bg-white/5 px-2.5 py-1 rounded-md">{album.releaseDate ? new Date(album.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}</span>
                  <span className="text-white bg-white/10 px-2.5 py-1 rounded-md">{getDayLabel()}</span>
                  <span className="text-gray-400">{tracks.length} Tracks</span>

                  {album.type !== 'Deluxe Album' && onReleaseDeluxe && album.status === 'Published' && (
                    <button onClick={onReleaseDeluxe} className="ml-0 sm:ml-auto bg-white hover:bg-gray-200 text-black px-5 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 font-black tracking-widest uppercase text-[10px] hover:scale-105 active:scale-95">
                       <Disc className="w-3.5 h-3.5" /> Release Deluxe
                    </button>
                  )}
                </div>
             </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6 sm:my-10" />

          {/* Stats Highlight Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
             <div className="flex-1 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 p-6 rounded-[2rem] flex items-center justify-between group hover:border-white/20 transition-colors">
                <div>
                  <div className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                     <TrendingUp className="w-3.5 h-3.5 text-[#1db954]" /> Daily Streams
                  </div>
                  <div className="text-4xl sm:text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">
                    {formatNumber(albumDaily)}
                  </div>
                </div>
                
                <div className={`px-4 py-3 rounded-2xl min-w-[100px] text-center font-black text-lg flex flex-col items-center justify-center transition-all ${albumChangeInfo.percent !== null ? (albumChangeInfo.percent > 0 ? 'bg-[#1db954]/10 text-[#1db954] border border-[#1db954]/20' : albumChangeInfo.percent < 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white/5 text-gray-400 border border-white/10') : 'bg-[#1db954]/10 text-[#1db954] border border-[#1db954]/20'}`}>
                   {albumChangeInfo.percent !== null ? (
                     <div className="flex items-center gap-1.5">
                       {albumChangeInfo.percent > 0 ? <TrendingUp className="w-5 h-5" /> : albumChangeInfo.percent < 0 ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                       <span>{Math.abs(albumChangeInfo.percent).toFixed(1)}%</span>
                     </div>
                   ) : (
                     <span className="tracking-widest uppercase text-xs">DEBUT</span>
                   )}
                </div>
             </div>
             
             <div className="flex-1 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 p-6 rounded-[2rem] flex flex-col justify-center group hover:border-white/20 transition-colors">
                 <div className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Total Streams
                 </div>
                 <div className="text-4xl sm:text-6xl font-black text-gray-300 tracking-tighter tabular-nums drop-shadow-lg">
                   {formatNumber(albumTotal)}
                 </div>
             </div>
          </div>

          {/* Tracks Table */}
          <div className="pb-12">
             <div className="w-full text-left bg-black/20 backdrop-blur-md rounded-[2rem] border border-white/5 p-4 sm:p-8">
                {/* Header */}
                <div className="grid grid-cols-12 border-b border-white/10 text-[9px] sm:text-[10px] font-black tracking-[0.25em] text-gray-500 pb-4 mb-4 uppercase">
                   <div className="col-span-1 text-center">#</div>
                   <div className="col-span-4 sm:col-span-5 px-2">Title</div>
                   <div className="col-span-3 sm:col-span-2 text-right">Daily</div>
                   <div className="col-span-2 sm:col-span-2 text-right">Trend</div>
                   <div className="col-span-2 sm:col-span-2 text-right">Total</div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                   {tracks.map((track, idx) => {
                      const daily = getDaily(track);
                      const total = getTotal(track);
                      const cInfo = getChangeInfo(track.id, daily);
                      
                      return (
                        <div key={track.id} className="grid grid-cols-12 py-3 sm:py-4 items-center hover:bg-white/[0.04] transition-colors rounded-2xl px-1 sm:px-4 group cursor-default">
                           <div className="col-span-1 text-center text-gray-600 text-xs font-bold group-hover:text-white transition-colors">{idx + 1}</div>
                           <div className="col-span-4 sm:col-span-5 px-2 truncate">
                              <div className="text-gray-200 font-bold tracking-tight sm:text-lg group-hover:text-white truncate">{track.title}</div>
                              {(track as any).isLeadSingle && <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-blue-400 font-black mt-0.5">Lead</span>}
                           </div>
                           <div className="col-span-3 sm:col-span-2 text-right font-mono font-bold text-gray-300 sm:text-lg tabular-nums">
                              {formatNumber(daily)}
                           </div>
                           <div className={`col-span-2 sm:col-span-2 text-right flex flex-col items-end font-mono text-[10px] sm:text-sm font-black tabular-nums ${cInfo.percent !== null ? (cInfo.percent > 0 ? 'text-[#1db954]' : cInfo.percent < 0 ? 'text-red-500' : 'text-gray-500') : 'text-[#1db954]'}`}>
                              {cInfo.percent !== null ? (
                                <div className="flex items-center gap-0.5 sm:gap-1 bg-black/20 px-2 py-0.5 rounded-md">
                                  {cInfo.percent > 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-[#1db954]/50" /> : cInfo.percent < 0 ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500/50" /> : <Minus className="w-3 h-3 sm:w-4 sm:h-4" />}
                                  {Math.abs(cInfo.percent).toFixed(1)}%
                                </div>
                              ) : (
                                <span className="bg-[#1db954]/10 text-[#1db954] px-2 py-0.5 rounded-md">NEW</span>
                              )}
                           </div>
                           <div className="col-span-2 sm:col-span-2 text-right font-mono font-bold text-gray-500 tabular-nums text-[10px] sm:text-sm">
                              {formatNumber(total)}
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
