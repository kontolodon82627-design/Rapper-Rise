import React from 'react';
import { GameState, Release } from '../types';
import { X, Music, Disc, Globe2, Music2, Apple, PlaySquare, Headphones, Lock } from 'lucide-react';
import { RECORD_LABELS } from '../recordLabels';

interface ReleaseStatsPopupProps {
  release: Release;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose: () => void;
}

export function ReleaseStatsPopup({ release, gameState, setGameState, onClose }: ReleaseStatsPopupProps) {
  // Streams Breakdown
  const streams = typeof release.streams === 'number' 
     ? { total: release.streams, spotify: release.streams * 0.4, appleMusic: release.streams * 0.25, amazonMusic: release.streams * 0.25, youtubeMusic: release.streams * 0.1 }
     : release.streams;

  // Base Market Sizes (Audience distribution)
  const BASE_MARKET = {
    america: 0.50,
    europe: 0.35,
    latinAmerica: 0.15
  };

  // Combine Player Popularity with Base Market
  const rawAm = BASE_MARKET.america * (1 + ((gameState.popularity.america || 0) / 100));
  const rawEu = BASE_MARKET.europe * (1 + ((gameState.popularity.europe || 0) / 100));
  const rawLa = BASE_MARKET.latinAmerica * (1 + ((gameState.popularity.latinAmerica || 0) / 100));

  const totalRaw = rawAm + rawEu + rawLa;
  
  const amPerc = rawAm / totalRaw;
  const euPerc = rawEu / totalRaw;
  const laPerc = rawLa / totalRaw;

  const totalSales = release.sales?.total || 0;
  const amSales = Math.floor(totalSales * amPerc);
  const euSales = Math.floor(totalSales * euPerc);
  const laSales = Math.floor(totalSales * laPerc);

  const totalStreams = streams.total || 0;
  const amStreams = Math.floor(totalStreams * amPerc);
  const euStreams = Math.floor(totalStreams * euPerc);
  const laStreams = Math.floor(totalStreams * laPerc);

  // Peak Chart Estimator (Using debut streams to estimate peak week)
  const peakWeeklyStreams = (release.debutStreams || release.lastDailyStreams?.total || 0) * 7;
  // Let's estimate peak week's sales (about 25% of total, since most sales are in 1st week)
  const peakSales = (release.sales?.total || 0) * 0.25; 
  const peakRadio = (release.radioPlays || 0) * 0.15; 
  
  // Predict points matching the ChartsView formula
  const estPoints = release.type === 'Single' 
      ? (peakWeeklyStreams / 250) + (peakSales * 1.5) + (peakRadio / 500)
      : (peakWeeklyStreams / 350) + (peakSales * 2) + (peakRadio / 1000);

  const amPoints = estPoints * amPerc * 1.2;
  const laPoints = estPoints * laPerc * 1.1;
  const euPoints = estPoints * euPerc * 1.1;
  const globalPoints = estPoints;

  // Determine Peak placement roughly based on NPC generation ranges
  let hot100Peak = '>100';
  if (amPoints > 350000) hot100Peak = '1';
  else if (amPoints > 250000) hot100Peak = 'Top 5';
  else if (amPoints > 180000) hot100Peak = 'Top 10';
  else if (amPoints > 70000) hot100Peak = 'Top 40';
  else if (amPoints > 20000) hot100Peak = 'Top 100';

  let globalPeak = '>200';
  if (globalPoints > 550000) globalPeak = '1';
  else if (globalPoints > 400000) globalPeak = 'Top 5';
  else if (globalPoints > 250000) globalPeak = 'Top 10';
  else if (globalPoints > 100000) globalPeak = 'Top 40';
  else if (globalPoints > 30000) globalPeak = 'Top 200';

  let latinPeak = '>100';
  if (laPoints > 250000) latinPeak = '1';
  else if (laPoints > 150000) latinPeak = 'Top 5';
  else if (laPoints > 80000) latinPeak = 'Top 10';
  else if (laPoints > 20000) latinPeak = 'Top 100';

  let euroPeak = '>100';
  if (euPoints > 280000) euroPeak = '1';
  else if (euPoints > 180000) euroPeak = 'Top 5';
  else if (euPoints > 90000) euroPeak = 'Top 10';
  else if (euPoints > 20000) euroPeak = 'Top 100';

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(Math.floor(num));
  };
  
  const getGlowColor = (trend?: string) => {
    if (!trend) return 'rgba(255,255,255,0.1)';
    if (trend.includes('Mega Hit')) return 'rgba(168,85,247,0.3)';
    if (trend.includes('Hit') && !trend.includes('Non-Hit')) return 'rgba(59,130,246,0.3)';
    if (trend === 'Flop') return 'rgba(239,68,68,0.3)';
    return 'rgba(255,255,255,0.1)';
  }

  const getBorderColor = (trend?: string) => {
    if (!trend) return 'border-white/10';
    if (trend.includes('Mega Hit')) return 'border-purple-500/30';
    if (trend.includes('Hit') && !trend.includes('Non-Hit')) return 'border-blue-500/30';
    if (trend === 'Flop') return 'border-red-500/30';
    return 'border-white/10';
  }

  const glowColor = getGlowColor(release.trend);

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6 overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[150%] h-[150%] opacity-20 transition-all duration-1000 ease-out blur-[180px] mix-blend-screen"
          style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 50%)` }}
        />
        {/* Abstract Soundwave Pattern similar to AlbumCardView */}
        <svg className="absolute -left-[10%] -bottom-[20%] w-[900px] h-[900px] opacity-[0.03] text-white animate-spin-slow pointer-events-none" style={{ animationDuration: '90s' }} viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.2" fill="none" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="0.1" fill="none" strokeDasharray="1 3" />
            <circle cx="50" cy="50" r="26" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
            <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="0.3" fill="none" />
        </svg>
      </div>

      <div className={`bg-[#0f0f13] border-0 sm:border rounded-none sm:rounded-[2.5rem] w-full max-w-4xl relative z-10 overflow-hidden flex flex-col sm:max-h-[95vh] max-h-[100vh] shadow-2xl ${getBorderColor(release.trend)}`}>
        {/* Header Action */}
        <div className="flex justify-end p-4 sm:p-6 pb-0 relative z-20 shrink-0">
          <button onClick={onClose} className="p-3 bg-black/40 backdrop-blur-xl hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-gray-400 hover:text-white shadow-xl hover:scale-105 active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-4 sm:px-12 sm:pb-12 overflow-y-auto hide-scrollbar relative z-10">
          
          {/* Hero Section */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 pb-8 sm:pb-12 items-center sm:items-end">
             <div className="relative group shrink-0 w-40 h-40 sm:w-56 sm:h-56 mx-auto sm:mx-0">
                {/* Vinyl Record Shadow Effect */}
               <div className="absolute inset-0 bg-black rounded-full scale-[1.03] translate-x-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] opacity-60 transition-transform duration-700 group-hover:translate-x-6 group-hover:rotate-12" style={{ backgroundImage: 'radial-gradient(circle at center, #222 0%, #000 70%)'}}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                     <div className="w-1/3 h-1/3 rounded-full border-[0.5px] border-white/20"></div>
                  </div>
               </div>
               
               <div className="relative z-10 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/10 bg-white/5 flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02]">
                  {release.coverImage ? (
                    <img src={release.coverImage} className="w-full h-full object-cover" alt="Release Cover" />
                  ) : (
                    <Music className="w-16 h-16 text-white/20" />
                  )}
                  <div className="absolute inset-0 z-10 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] mix-blend-overlay pointer-events-none" />
               </div>
             </div>

             <div className="flex flex-col justify-end w-full flex-1 min-w-0 text-center sm:text-left mt-4 sm:mt-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] mb-2 sm:mb-3 opacity-70 text-white">
                   <Music className="w-3.5 h-3.5" />
                   Release Statistics
                </div>
                
                <h1 className="text-3xl sm:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 leading-[0.9] mb-4 pb-1 break-words">
                  {release.title}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                   <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10">
                     {release.type}
                   </span>
                   {release.trend && (
                     <span className={`text-[10px] sm:text-xs uppercase tracking-widest font-black px-3 py-1.5 rounded-lg border ${
                        release.trend.includes('Mega Hit') ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]' :
                        release.trend.includes('Hit') && !release.trend.includes('Non-Hit') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' :
                        release.trend === 'Flop' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                        'bg-white/5 text-white/50 border-white/10'
                     }`}>
                        {release.trend}
                     </span>
                   )}
                </div>
             </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8 sm:mb-12" />

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
             <div className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 p-5 sm:p-6 rounded-[2rem] hover:border-white/20 transition-colors group">
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Headphones className="w-3.5 h-3.5 text-blue-400" /> Total Streams
                 </div>
                 <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
                   {formatNumber(totalStreams)}
                 </div>
             </div>
             
             <div className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 p-5 sm:p-6 rounded-[2rem] hover:border-white/20 transition-colors group">
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Disc className="w-3.5 h-3.5 text-green-400" /> Pure Sales
                 </div>
                 <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
                   {formatNumber(totalSales)}
                 </div>
             </div>
          </div>

           {/* Platforms */}
           <section className="mb-10">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-white/40 mb-4 px-2">Streaming Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 <div className="bg-[#1db954]/5 border border-[#1db954]/20 p-4 rounded-3xl flex flex-col items-center justify-center text-center hover:bg-[#1db954]/10 transition-colors h-28">
                    <div className="w-5 h-5 mb-2 bg-[#1db954] rounded-full flex items-center justify-center pt-[1px] pl-[0.5px] shadow-[0_0_10px_rgba(29,185,84,0.3)]"><div className="flex flex-col gap-[2px] items-center"><div className="w-3 h-[1.5px] bg-black rounded-full transform -rotate-12"></div><div className="w-2.5 h-[1px] bg-black rounded-full transform -rotate-12"></div></div></div>
                    <span className="text-sm sm:text-lg font-black text-[#1db954] tabular-nums leading-none tracking-tight mb-1">{formatNumber(streams.spotify)}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#1db954]/60">Spotify</span>
                 </div>
                 <div className="bg-[#fa243c]/5 border border-[#fa243c]/20 p-4 rounded-3xl flex flex-col items-center justify-center text-center hover:bg-[#fa243c]/10 transition-colors h-28">
                    <div className="w-5 h-5 mb-2 bg-gradient-to-br from-pink-500 to-red-600 rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.3)]"><Music2 className="w-3.5 h-3.5 text-white" /></div>
                    <span className="text-sm sm:text-lg font-black text-[#fa243c] tabular-nums leading-none tracking-tight mb-1">{formatNumber(streams.appleMusic || 0)}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#fa243c]/60">Apple Music</span>
                 </div>
                 <div className="bg-[#00a8e1]/5 border border-[#00a8e1]/20 p-4 rounded-3xl flex flex-col items-center justify-center text-center hover:bg-[#00a8e1]/10 transition-colors h-28">
                    <div className="w-5 h-5 mb-2 bg-[#00A8E1] rounded-sm flex items-center justify-center shadow-[0_0_10px_rgba(0,168,225,0.3)] overflow-hidden"><span className="text-[12px] font-black leading-none text-white italic">a</span></div>
                    <span className="text-sm sm:text-lg font-black text-[#00a8e1] tabular-nums leading-none tracking-tight mb-1">{formatNumber(streams.amazonMusic || 0)}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#00a8e1]/60">Amazon</span>
                 </div>
                 <div className="bg-[#ff0000]/5 border border-[#ff0000]/20 p-4 rounded-3xl flex flex-col items-center justify-center text-center hover:bg-[#ff0000]/10 transition-colors h-28">
                    <div className="w-5 h-5 mb-2 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.3)]"><div className="w-0 h-0 border-t-[2.5px] border-t-transparent border-l-[5px] border-l-white border-b-[2.5px] border-b-transparent ml-0.5"></div></div>
                    <span className="text-sm sm:text-lg font-black text-[#ff0000] tabular-nums leading-none tracking-tight mb-1">{formatNumber((streams as any).youtubeMusic || 0)}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#ff0000]/60">YouTube</span>
                 </div>
              </div>
           </section>

           {/* Regional Breakdown Grid */}
           <section className="mb-10">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-white/40 mb-4 px-2">Regional Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 <div className="bg-white/[0.03] border border-white/5 p-5 rounded-3xl space-y-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2">
                       <Globe2 className="w-4 h-4 text-blue-400" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Americas</span>
                       <span className="ml-auto text-xs font-mono font-bold text-gray-400 bg-black/40 px-2 py-0.5 rounded-md">{(amPerc * 100).toFixed(1)}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/20 p-3 rounded-2xl">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1">Streams</span>
                             <span className="font-mono text-sm sm:text-base font-black text-white tabular-nums">{formatNumber(amStreams)}</span>
                        </div>
                        <div className="bg-black/20 p-3 rounded-2xl">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1">Pure Sales</span>
                             <span className="font-mono text-sm sm:text-base font-black text-blue-400 tabular-nums">{formatNumber(amSales)}</span>
                        </div>
                    </div>
                 </div>

                 <div className="bg-white/[0.03] border border-white/5 p-5 rounded-3xl space-y-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2">
                       <Globe2 className="w-4 h-4 text-emerald-400" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Europe</span>
                       <span className="ml-auto text-xs font-mono font-bold text-gray-400 bg-black/40 px-2 py-0.5 rounded-md">{(euPerc * 100).toFixed(1)}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/20 p-3 rounded-2xl">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1">Streams</span>
                             <span className="font-mono text-sm sm:text-base font-black text-white tabular-nums">{formatNumber(euStreams)}</span>
                        </div>
                        <div className="bg-black/20 p-3 rounded-2xl">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1">Pure Sales</span>
                             <span className="font-mono text-sm sm:text-base font-black text-emerald-400 tabular-nums">{formatNumber(euSales)}</span>
                        </div>
                    </div>
                 </div>

                 <div className="bg-white/[0.03] border border-white/5 p-5 rounded-3xl space-y-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2">
                       <Globe2 className="w-4 h-4 text-orange-400" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Latin America</span>
                       <span className="ml-auto text-xs font-mono font-bold text-gray-400 bg-black/40 px-2 py-0.5 rounded-md">{(laPerc * 100).toFixed(1)}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/20 p-3 rounded-2xl">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1">Streams</span>
                             <span className="font-mono text-sm sm:text-base font-black text-white tabular-nums">{formatNumber(laStreams)}</span>
                        </div>
                        <div className="bg-black/20 p-3 rounded-2xl">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1">Pure Sales</span>
                             <span className="font-mono text-sm sm:text-base font-black text-orange-400 tabular-nums">{formatNumber(laSales)}</span>
                        </div>
                    </div>
                 </div>
              </div>
           </section>

           {/* Estimated Peak Charts Horizontal */}
           <section className="mb-10">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-white/40 mb-4 px-2">Estimated Chart Peaks</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                 <div className="bg-gradient-to-b from-blue-900/30 to-blue-900/10 border border-blue-500/20 py-5 rounded-3xl">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-blue-400/60 block mb-1">BB Hot 100</span>
                    <span className="font-black text-2xl sm:text-3xl tracking-tighter text-blue-400">#{hot100Peak}</span>
                 </div>
                 <div className="bg-gradient-to-b from-purple-900/30 to-purple-900/10 border border-purple-500/20 py-5 rounded-3xl">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-purple-400/60 block mb-1">Global 200</span>
                    <span className="font-black text-2xl sm:text-3xl tracking-tighter text-purple-400">#{globalPeak}</span>
                 </div>
                 <div className="bg-gradient-to-b from-orange-900/30 to-orange-900/10 border border-orange-500/20 py-5 rounded-3xl">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-400/60 block mb-1">Latin</span>
                    <span className="font-black text-2xl sm:text-3xl tracking-tighter text-orange-400">#{hot100Peak === '1' ? '1' : 'Top 10'}</span>
                 </div>
                 <div className="bg-gradient-to-b from-emerald-900/30 to-emerald-900/10 border border-emerald-500/20 py-5 rounded-3xl">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-400/60 block mb-1">Europe</span>
                    <span className="font-black text-2xl sm:text-3xl tracking-tighter text-emerald-400">#{hot100Peak === '1' ? '1' : 'Top 10'}</span>
                 </div>
              </div>
           </section>

           {/* Master Ownership Block at the Bottom */}
           <section>
              <div className="bg-white/5 border border-white/10 p-5 sm:p-8 rounded-[2rem] flex flex-col md:flex-row gap-6 md:items-center">
                 <div className="w-16 h-16 rounded-3xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                    <Lock className="w-8 h-8 text-white/30" />
                 </div>
                 <div className="flex-1">
                    {release.masterOwner ? (() => {
                        const label = RECORD_LABELS.find(l => l.id === release.masterOwner);
                        const isCurrentlySigned = gameState.artist?.labelContract?.labelId === label?.id;
                        const buybackPrice = (totalStreams * 0.1) + (totalSales * 0.5) + 50000;
                        return (
                            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                               <div>
                                 <div className="text-sm font-black uppercase tracking-widest text-red-400 mb-1">Owned by {label?.name || release.masterOwner}</div>
                                 <p className="text-xs text-gray-400 max-w-lg leading-relaxed">Because this was released under {label?.name}, they own the master recordings and take their cut from all generated revenue.</p>
                                 {isCurrentlySigned && (
                                     <div className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest mt-3 bg-red-900/20 px-3 py-1.5 rounded-lg inline-block">Masters locked (Active Contract)</div>
                                 )}
                               </div>
                               {!isCurrentlySigned && (
                                   <button 
                                      onClick={() => {
                                          if (gameState.stats.money < buybackPrice) return window.alert("Not enough money to buy back the masters!");
                                          if (window.confirm(`Are you sure you want to buy back the masters for $${formatNumber(buybackPrice)}? You will receive 100% of future royalties.`)) {
                                             setGameState(prev => {
                                                 if (!prev) return prev;
                                                 return {
                                                     ...prev,
                                                     stats: {
                                                         ...prev.stats,
                                                         money: prev.stats.money - buybackPrice
                                                     },
                                                     releases: prev.releases.map(r => r.id === release.id ? { ...r, masterOwner: undefined } : r)
                                                 };
                                             });
                                             window.alert("You purchased the masters! It is now 100% yours.");
                                             onClose();
                                          }
                                      }}
                                      className="w-full md:w-auto px-6 py-4 bg-white hover:bg-gray-200 rounded-2xl text-black font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-center flex flex-col justify-center gap-0.5"
                                   >
                                       <span>Buy Masters</span><span className="opacity-60 text-[10px]">${formatNumber(buybackPrice)}</span>
                                   </button>
                               )}
                            </div>
                        )
                    })() : (
                        <div>
                           <div className="text-sm font-black uppercase tracking-widest text-[#1db954] mb-1">100% Independent</div>
                           <p className="text-xs text-gray-400 max-w-lg leading-relaxed">You completely own the masters to this release. You receive 100% of the royalties generated across all platforms.</p>
                        </div>
                    )}
                 </div>
              </div>
           </section>

        </div>
      </div>
    </div>
  );
}
