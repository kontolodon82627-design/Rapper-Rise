import React, { useMemo } from 'react';
import { GameState, Song } from '../types';
import { Sparkles, RadioReceiver, ArrowUp, ArrowDown, ArrowRight, Music2, Star } from 'lucide-react';
import { ARTIST_IMAGES } from '../artistImages';

export function RadioChart({ gameState, onBack }: { gameState: GameState, onBack: () => void }) {
  const currentDateObj = new Date(gameState.time.startDate);
  currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed);
  
  const chartData = useMemo(() => {
     const publishedSongs = gameState.releases.filter(r => r.status === 'Published' && r.type === 'Single') as Song[];
     
     const songsWithRadio = publishedSongs.map(r => {
        const isNPC = !!(r as any).isNPCRelease;
        const rArtist = isNPC ? (r as any).artistId : (gameState.artist?.name || 'Player');
        
        let daysSinceRelease = 1;
        if (r.releaseDate) {
           daysSinceRelease = Math.max(1, Math.floor((currentDateObj.getTime() - new Date(r.releaseDate).getTime()) / (1000 * 3600 * 24)));
        }

        // Extrapolate current week's partial data to a full 7 days
        let daysIntoWeek = gameState.time.daysPassed % 7;
        if (daysIntoWeek === 0) daysIntoWeek = 7;
        let weeklySpins = ((r.currentWeekRadio ?? 0) / daysIntoWeek) * 7;
        
        // Use last week spins if better representation (e.g. tracking week just restarted)
        if (daysIntoWeek < 2 && r.lastWeekRadio) {
           weeklySpins = r.lastWeekRadio;
        }

        const currentSpins = Math.floor(weeklySpins);
        const lastSpins = r.lastWeekRadio || Math.floor(weeklySpins * 0.8);
        const peakSpins = Math.floor(Math.max(weeklySpins, (r.radioPlays || 0) / Math.max(1, daysSinceRelease / 7)));
        const weeksOnChart = Math.max(1, Math.floor(daysSinceRelease / 7));

        const movement = currentSpins > lastSpins ? Math.floor(Math.random() * 5 + 1) : (currentSpins < lastSpins ? -Math.floor(Math.random() * 3 + 1) : 0);

        return {
           ...r,
           isPlayer: !isNPC,
           artist: rArtist,
           weeklySpins: currentSpins,
           peakSpins,
           lastPos: '-', // Would normally be last week's rank
           peakPos: '-', // Would normally be peak rank
           movement,
           isNew: weeksOnChart <= 1,
           isReEntry: false,
           weeksOnChart,
           coverImage: r.coverImage || ARTIST_IMAGES[rArtist as string] || `https://i.pravatar.cc/200?u=${encodeURIComponent(rArtist)}`
        };
     });
     
     const top50 = songsWithRadio
        .filter(s => s.weeklySpins > 10)
        .sort((a, b) => b.weeklySpins - a.weeklySpins)
        .slice(0, 50);
        
     // Infer positions
     top50.forEach((item, index) => {
        const currentRank = index + 1;
        item.lastPos = item.isNew ? '-' : String(Math.max(1, currentRank + item.movement));
        item.peakPos = String(Math.min(currentRank, parseInt(item.lastPos === '-' ? '100' : item.lastPos)));
     });

     return top50;
  }, [gameState]);

  return (
    <div className="flex flex-col h-full bg-[#f2f0eb] text-black font-sans selection:bg-black/10 overflow-hidden relative">
      {/* Header Area */}
      <div className="bg-white shrink-0 border-b border-gray-300 relative z-10">
         <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={onBack} className="p-2 -ml-2 text-black hover:bg-black/5 rounded-full transition-colors flex items-center justify-center font-bold tracking-tight">
                  <span className="mr-1">←</span> Back
               </button>
            </div>
            <div className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
               RADIO<span className="text-[#cc2b2b]">SONGS</span>
            </div>
            <div className="w-10"></div>
         </div>
      </div>
      
      {/* Banner */}
      <div className="w-full bg-[#cc2b2b] text-white shrink-0 shadow-sm relative z-10">
         <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
               <div className="inline-flex py-1 px-2 border-2 border-white text-[10px] font-black uppercase tracking-widest mb-3 leading-none">
                  OFFICIAL AIRPLAY
               </div>
               <h1 className="text-5xl md:text-7xl tracking-tighter font-black leading-none mb-2" style={{ fontFamily: 'Impact, sans-serif' }}>
                  RADIO SONGS
               </h1>
               <p className="text-white/80 font-bold uppercase tracking-widest text-[10px]">THE WEEK'S MOST POPULAR SONGS ON TERRESTRIAL AND SATELLITE RADIO.</p>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/50 text-left md:text-right">
               WEEK OF<br/><span className="text-white text-sm">{currentDateObj.toLocaleDateString()}</span>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-20 relative z-0">
          <div className="w-full flex flex-col max-w-5xl mx-auto">
             
             {/* Desktop Column Header */}
             {chartData.length > 0 && (
                <div className="hidden md:flex items-center px-4 py-2 border-b-4 border-black text-[10px] font-black tracking-widest uppercase text-gray-500 sticky top-0 bg-[#f2f0eb] z-20">
                   <div className="w-16 md:w-24 text-center shrink-0">THIS<br/>WEEK</div>
                   <div className="flex-1">AWARD</div>
                   <div className="w-24 text-center shrink-0 text-black">SPINS<br/>(WK)</div>
                   <div className="w-24 text-center shrink-0 ml-6 text-black">AUDIENCE<br/>IMPRESSIONS</div>
                   <div className="w-14 text-center shrink-0 ml-6 text-black">WEEKS<br/>ON CHART</div>
                </div>
             )}

             {chartData.length === 0 && (
                 <div className="text-center p-12 text-gray-400 font-bold uppercase tracking-widest text-sm">No data available yet. Release more music.</div>
             )}

             {chartData.map((item, index) => {
                const isPlayer = item.isPlayer;
                const isFirst = index === 0;
                const label = isPlayer ? 'INDEPENDENT' : (item?.id?.length % 2 === 0 ? 'REPUBLIC' : 'ISLAND');

                return (
                  <div key={`${item?.id}-${index}`} className="flex items-stretch bg-white w-full pr-4 py-3 relative group border-b border-gray-300">
                     <div className="w-16 md:w-24 shrink-0 flex flex-col items-center justify-center relative">
                        {isFirst ? (
                             <span className="text-5xl md:text-6xl font-black tracking-tighter text-[#cc2b2b]" style={{ fontFamily: 'Impact, sans-serif' }}>{index + 1}</span>
                        ) : (
                             <span className="text-3xl md:text-4xl font-black mb-1 tracking-tighter text-black" style={{ fontFamily: 'Impact, sans-serif' }}>{index + 1}</span>
                        )}
                        
                        <div className="mt-1 flex items-center justify-center h-5">
                           {item.isNew && !item.isReEntry ? (
                               <span className="bg-[#cc2b2b] text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-widest rounded-sm">NEW</span>
                           ) : item.movement > 0 ? (
                               <div className="flex items-center gap-0.5 text-gray-500">
                                  <ArrowUp className="w-4 h-4" strokeWidth={3} />
                                  <span className="text-[10px] font-bold">{item.movement}</span>
                               </div>
                           ) : item.movement < 0 ? (
                               <div className="flex items-center gap-0.5 text-gray-500">
                                  <ArrowDown className="w-4 h-4" strokeWidth={3} />
                                  <span className="text-[10px] font-bold">{Math.abs(item.movement)}</span>
                               </div>
                           ) : (
                               <ArrowRight className="w-4 h-4 text-gray-300" strokeWidth={3} />
                           )}
                        </div>
                     </div>

                     {/* Image */}
                     <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 bg-[#f4f4f4] flex items-center justify-center overflow-hidden mr-4 md:mr-6 shadow-sm border border-black/5 self-center">
                        {item.coverImage ? (
                           <img src={item.coverImage || undefined} className="w-full h-full object-cover" alt="" />
                        ) : (
                           <div className="w-full h-full bg-[#f4f4f4] flex items-center justify-center">
                               <Music2 className="w-8 h-8 text-black/20" strokeWidth={1} />
                           </div>
                        )}
                     </div>

                     {/* Title and Artist Info */}
                     <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
                        <h3 className={`font-black text-lg md:text-xl truncate leading-tight text-black mb-0.5 tracking-tight ${isFirst ? 'md:text-2xl' : ''}`}>{item.title}</h3>
                        <p className="font-medium text-gray-500 text-sm truncate tracking-tight mb-0.5">{item.artist}</p>
                        <p className="font-bold text-gray-400 text-[9px] truncate uppercase tracking-widest">{label}</p>
                        
                        {/* Mobile stats */}
                        <div className="flex md:hidden mt-3">
                            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 tracking-wider">
                               <span>LW <span className="text-black ml-0.5 text-xs">{item.lastPos}</span></span>
                               <span>PK <span className="text-black ml-0.5 text-xs">{item.peakPos}</span></span>
                               <span>WKS <span className="text-black ml-0.5 text-xs">{item.weeksOnChart}</span></span>
                            </div>
                        </div>
                     </div>
                     
                     {/* Desktop Data Columns */}
                     <div className="hidden md:flex items-center">
                        <div className="flex items-center font-bold text-xl tracking-tighter text-black">
                           <div className="w-24 text-center flex flex-col justify-center items-center">
                              <span className="text-black w-full text-lg">{item.weeklySpins.toLocaleString()}</span>
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Spins</span>
                           </div>
                           <div className="w-24 text-center ml-6 flex flex-col justify-center items-center">
                              <span className="text-gray-400 w-full text-lg">{(item.weeklySpins * 4500).toLocaleString()}</span>
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Impressions</span>
                           </div>
                           <div className="w-14 text-center ml-6 flex justify-center items-center">
                              <span className="text-gray-400 w-full">{item.weeksOnChart}</span>
                           </div>
                        </div>
                        
                        {/* Action button */}
                        <div className="flex items-center justify-end w-12 ml-4">
                           {isPlayer && (
                              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-black hover:bg-gray-800 transition-colors">
                                 <Star className="w-4 h-4 text-white fill-white" strokeWidth={0} />
                              </button>
                           )}
                        </div>
                     </div>
                  </div>
                );
             })}
          </div>
      </div>
    </div>
  );
}
