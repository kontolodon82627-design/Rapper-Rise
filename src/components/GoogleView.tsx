import React, { useState, useMemo } from 'react';
import { GameState, NewsArticle } from '../types';
import { Search, ChevronDown, Check, X, AlignJustify, Music2, Share2, MoreVertical, ArrowLeft } from 'lucide-react';
import { ARTIST_IMAGES } from '../artistImages';
import { RadioChart } from './RadioChart';

import { PitchforkView } from './PitchforkView';

interface GoogleViewProps {
  gameState: GameState;
  onClose: () => void;
}

export function GoogleView({ gameState, onClose }: GoogleViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'google' | 'spotify' | 'spotify_detail' | 'radio' | 'search_results' | 'news' | 'pitchfork'>('google');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [isDailyDetail, setIsDailyDetail] = useState<boolean>(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
       setView('search_results');
    }
  };

  if (view === 'search_results') {
     return <SearchResults query={searchQuery} gameState={gameState} onBack={() => setView('google')} onSelect={(v) => setView(v as any)} />;
  }

  if (view === 'news' && selectedNews) {
     return <NewsDetailView news={selectedNews} onBack={() => setView('google')} />;
  }

  if (view === 'pitchfork') {
     return <PitchforkView gameState={gameState} onBack={() => setView('google')} />;
  }

  if (view === 'spotify') {
    return <SpotifyCharts gameState={gameState} onBack={() => setView('google')} onSelect={(item, isDaily) => { setSelectedItem(item); setIsDailyDetail(isDaily); setView('spotify_detail'); }} />;
  }
  
  if (view === 'spotify_detail') {
    return <SpotifyDetail item={selectedItem} isDaily={isDailyDetail} gameState={gameState} onBack={() => setView('spotify')} />;
  }

  if (view === 'radio') {
    return <RadioChart gameState={gameState} onBack={() => setView('google')} />;
  }

  return (
    <div className="flex flex-col items-center w-full h-full bg-white text-black relative font-sans overflow-y-auto pb-20">
       <div className="flex justify-end items-center w-full px-4 sm:px-6 py-4 gap-4 text-sm font-medium z-10 sticky top-0 bg-white/90 backdrop-blur-sm">
          <a href="#" className="hover:underline text-gray-700 hidden sm:block">Gmail</a>
          <a href="#" className="hover:underline text-gray-700 hidden sm:block">Images</a>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
            <AlignJustify className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer ml-2">
             {gameState.artist?.name ? gameState.artist.name[0] : 'U'}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors ml-2 bg-gray-50 border border-gray-200">
             <X className="w-5 h-5"/>
          </button>
       </div>

       <div className="flex flex-col items-center w-full max-w-3xl px-4 mt-8 sm:mt-16">
         <div className="text-[5rem] sm:text-[6rem] leading-none mb-6 font-medium tracking-tight select-none" style={{fontFamily: 'Product Sans, Arial, sans-serif'}}>
            <span style={{color: '#4285F4'}}>G</span>
            <span style={{color: '#EA4335'}}>o</span>
            <span style={{color: '#FBBC05'}}>o</span>
            <span style={{color: '#4285F4'}}>g</span>
            <span style={{color: '#34A853'}}>l</span>
            <span style={{color: '#EA4335'}} className="inline-block -rotate-2">e</span>
         </div>
         
         <form onSubmit={handleSearch} className="w-full relative flex items-center group mb-8 max-w-2xl">
            <Search className="w-5 h-5 absolute left-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" strokeWidth={2} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-full py-3 sm:py-3.5 pl-14 pr-12 shadow-sm hover:shadow-md focus:shadow-md focus:outline-none transition-shadow text-base bg-white"
            />
         </form>
         
         <div className="flex gap-3 mb-16">
            <button type="button" onClick={handleSearch} className="bg-[#f8f9fa] border border-[#f8f9fa] hover:border-gray-200 hover:text-gray-900 border-opacity-0 hover:border-opacity-100 text-sm px-4 py-2 text-[#3c4043] rounded transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500">
               Google Search
            </button>
            <button type="button" onClick={handleSearch} className="bg-[#f8f9fa] border border-[#f8f9fa] hover:border-gray-200 hover:text-gray-900 border-opacity-0 hover:border-opacity-100 text-sm px-4 py-2 text-[#3c4043] rounded transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500">
               I'm Feeling Lucky
            </button>
         </div>

         {/* Discover News Feed */}
         <div className="w-full max-w-3xl flex flex-col gap-3 text-left px-2 sm:px-0">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-xl font-medium text-gray-800">Discover</h3>
               <button className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-full"><ChevronDown className="w-5 h-5"/></button>
            </div>
            
            <div className="flex items-start gap-4 border border-gray-200 rounded-2xl p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setView('radio')}>
               <div className="flex-1 flex flex-col justify-between">
                  <h4 className="font-semibold text-lg leading-snug mb-2 text-gray-900 line-clamp-3">US Radio Top 50: Official Airplay Charts updated</h4>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="w-4 h-4 bg-red-600 rounded-sm inline-block"></span>
                     <p className="text-xs font-medium text-gray-500">RadioTracker US <span className="mx-1">•</span> Just now</p>
                  </div>
               </div>
               <div className="w-20 h-20 sm:w-28 sm:h-28 bg-red-50 rounded-xl shrink-0 flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
                 <span className="text-4xl sm:text-5xl">📻</span>
               </div>
            </div>

            <div className="flex items-start gap-4 border border-gray-200 rounded-2xl p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSearchQuery('chart')}>
               <div className="flex-1 flex flex-col justify-between">
                  <h4 className="font-semibold text-lg leading-snug mb-2 text-gray-900 line-clamp-3">Spotify announces new global charts criteria focusing on organic reach</h4>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="w-4 h-4 bg-green-600 rounded-sm inline-block"></span>
                     <p className="text-xs font-medium text-gray-500">Music Industry Weekly <span className="mx-1">•</span> 2h</p>
                  </div>
               </div>
               <div className="w-20 h-20 sm:w-28 sm:h-28 bg-green-50 rounded-xl shrink-0 flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
                 <span className="text-4xl sm:text-5xl">📈</span>
               </div>
            </div>

            <div className="flex items-start gap-4 border border-gray-200 rounded-2xl p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setView('pitchfork')}>
               <div className="flex-1 flex flex-col justify-between">
                  <h4 className="font-semibold text-lg leading-snug mb-2 text-gray-900 line-clamp-3">New Music Friday: This week's most anticipated releases</h4>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="w-4 h-4 bg-[#ff3530] rounded-sm inline-block"></span>
                     <p className="text-xs font-medium text-gray-500">Pitchfork <span className="mx-1">•</span> 4h</p>
                  </div>
               </div>
               <div className="w-20 h-20 sm:w-28 sm:h-28 bg-[#1a1a1a] rounded-xl shrink-0 flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden text-[#ff3530] font-serif font-black italic text-4xl sm:text-5xl">
                 P
               </div>
            </div>

            {gameState.news?.map((article) => {
               const timeAgo = Math.max(0, Math.floor((new Date(gameState.time.startDate).getTime() + gameState.time.daysPassed * 86400000 - new Date(article.dateStr).getTime()) / 86400000));
               let timeText = timeAgo === 0 ? 'Today' : `${timeAgo}d`;
               
               let tagColor = 'bg-blue-600';
               if (article.type === 'scandal') tagColor = 'bg-red-600';
               else if (article.type === 'achievement') tagColor = 'bg-yellow-500';

               return (
                 <div key={article.id} className="flex items-start gap-4 border border-gray-200 rounded-2xl p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedNews(article); setView('news'); }}>
                    <div className="flex-1 flex flex-col justify-between">
                       <h4 className="font-semibold text-lg leading-snug mb-2 text-gray-900 line-clamp-3">{article.title}</h4>
                       <div className="flex items-center gap-2 mt-2">
                          <span className={`w-4 h-4 ${tagColor} rounded-sm inline-block`}></span>
                          <p className="text-xs font-medium text-gray-500">Music News <span className="mx-1">•</span> {timeText}</p>
                       </div>
                    </div>
                    {article.imageUrl && (
                       <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl shrink-0 flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
                         <img src={article.imageUrl} className="w-full h-full object-cover" alt="" />
                       </div>
                    )}
                 </div>
               );
            })}

         </div>
       </div>
    </div>
  );
}

function SpotifyCharts({ gameState, onBack, onSelect }: { gameState: GameState, onBack: () => void, onSelect: (item: any, isDaily: boolean) => void }) {
  const [chartView, setChartView] = useState<'home' | 'list'>('home');
  const [currentChartType, setCurrentChartType] = useState<'weekly_songs' | 'daily_songs' | 'weekly_albums' | 'daily_artists'>('weekly_songs');

  const currentDateObj = new Date(gameState.time.startDate);
  currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed);
  const formattedDaily = currentDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  const chartData = useMemo(() => {
    const allPublished = gameState.releases.filter(r => r.status === 'Published' && r.releaseDate);
    
    const combinedData = allPublished.map(r => {
      const isNPC = !!(r as any).isNPCRelease;
      const rArtist = isNPC ? (r as any).artistId : gameState.artist?.name;

      let daysSinceRelease = 1;
      if (r.releaseDate) {
         daysSinceRelease = Math.max(1, Math.floor((currentDateObj.getTime() - new Date(r.releaseDate).getTime()) / (1000 * 3600 * 24)));
      }
      
      let dailySpotify = r.lastDailyStreams?.spotify || 0;
      if (dailySpotify === 0 && (r.streams?.spotify || 0) > 0) {
          dailySpotify = Math.floor(r.streams!.spotify / daysSinceRelease);
      }
      
      return {
        ...r,
        isPlayer: !isNPC,
        artist: rArtist || 'Unknown',
        totalStreams: r.streams?.spotify || 0,
        weeklyStreams: dailySpotify * 7,
        dailyStreams: dailySpotify,
        coverImage: r.coverImage || ARTIST_IMAGES[rArtist as string] || `https://i.pravatar.cc/200?u=${encodeURIComponent(rArtist || '')}`,
      };
    });
    
    const allSongs = combinedData.filter(s => s.type === 'Single');
    const allAlbums = combinedData.filter(s => ['Album', 'EP', 'Deluxe Album', 'Single Pack'].includes(s.type));

    const weeklySongs = [...allSongs].sort((a,b) => b.weeklyStreams - a.weeklyStreams).slice(0, 100);
    const dailySongs = [...allSongs].sort((a,b) => b.dailyStreams - a.dailyStreams).slice(0, 100);
    const weeklyAlbums = [...allAlbums].sort((a,b) => b.weeklyStreams - a.weeklyStreams).slice(0, 100);

    const artistMapDaily: Record<string, number> = {};
    const imgMap: Record<string, string> = {};
    const addArtistDaily = (name: string, pts: number, img?: string) => {
      artistMapDaily[name] = (artistMapDaily[name] || 0) + pts;
      if (img && !imgMap[name]) imgMap[name] = img;
    };
    
    allSongs.forEach(r => addArtistDaily(r.artist, r.dailyStreams, r.coverImage));
    allAlbums.forEach(r => addArtistDaily(r.artist, r.dailyStreams, r.coverImage));

    const dailyArtists = Object.entries(artistMapDaily)
        .map(([name, pts]) => {
           let finalImage = ARTIST_IMAGES[name];
           const playerName = gameState.artist?.name || 'Player';
           if (name === playerName || name === 'You') {
              finalImage = gameState.artist?.image || undefined;
           }
           if (!finalImage) finalImage = imgMap[name]; // fallback to song cover if missing artist image
           return { title: name, artist: name, type: 'Artist', isPlayer: name === playerName || name === 'You', dailyStreams: pts, weeklyStreams: pts * 7, coverImage: finalImage };
        })
        .sort((a,b) => b.dailyStreams - a.dailyStreams)
        .slice(0, 100);

    return { weeklySongs, dailySongs, weeklyAlbums, dailyArtists };
  }, [gameState]);

  const handleOpenList = (type: 'weekly_songs' | 'daily_songs' | 'weekly_albums' | 'daily_artists') => {
    setCurrentChartType(type);
    setChartView('list');
  };

  if (chartView === 'list') {
     return <SpotifyList 
        type={currentChartType} 
        data={chartData} 
        formattedDaily={formattedDaily} 
        onBack={() => setChartView('home')} 
        onSelect={onSelect} 
        gameState={gameState}
        currentDateObj={currentDateObj} 
     />;
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#121212] text-white overflow-hidden font-sans">
       <div className="sticky top-0 bg-[#000000] z-50 px-4 py-3 flex items-center border-b border-white/10 justify-between">
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
             <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
               <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1DB954]">
                  <div className="flex flex-col gap-[3px] items-center pb-0.5 pl-0.5">
                     <div className="w-4 h-1 bg-black rounded-full bg-opacity-90 transform -rotate-6"></div>
                     <div className="w-3.5 h-[3px] bg-black rounded-full bg-opacity-80 transform -rotate-6 ml-0.5"></div>
                     <div className="w-2.5 h-[2px] bg-black rounded-full bg-opacity-70 transform -rotate-6 ml-1"></div>
                  </div>
               </div>
               Charts
             </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#282828] border border-white/10 flex items-center justify-center text-xs font-bold overflow-hidden shadow-sm">
             {gameState.artist?.name ? gameState.artist.name[0] : 'U'}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar">
         <div className="p-4 border-b border-white/5">
           <button className="flex items-center justify-between w-full border border-white/20 rounded-md py-2.5 px-4 text-sm font-bold hover:bg-white/5 transition-colors">
              Global
              <ChevronDown className="w-4 h-4 text-white/70" />
           </button>
         </div>

         <div className="flex px-4 py-3 border-b border-white/5 bg-[#181818]/50">
            <span className="font-bold border-b-2 border-[#1DB954] pb-2 text-sm px-2 text-white">Flagship</span>
            <span className="font-bold text-gray-400 pb-2 text-sm px-4">City</span>
            <span className="font-bold text-gray-400 pb-2 text-sm px-4">Local</span>
         </div>

         <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gradient-to-b from-[#121212] to-black pb-24">
            
            {/* Weekly Top Songs Global */}
            <div className="bg-gradient-to-br from-[#6b359f] to-[#3b1560] text-white p-6 rounded-xl flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-lg border border-white/5" style={{aspectRatio: '1', minHeight: '320px'}} onClick={() => handleOpenList('weekly_songs')}>
               <div className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.1] mb-4 drop-shadow-sm">Weekly Top Songs<br/><span className="text-white/80">Global</span></div>
               <div className="mt-auto flex items-end gap-3 cursor-pointer hover:opacity-80 transition-opacity bg-black/20 p-3 rounded-lg backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onSelect(chartData.weeklySongs[0], false); }}>
                 <div className="w-20 h-20 bg-black/40 shadow-xl shrink-0 overflow-hidden rounded shadow-black/50">
                    <ChartCoverImage item={chartData.weeklySongs[0]} />
                 </div>
                 <div className="flex flex-col min-w-0 pb-1">
                    <span className="bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm w-max uppercase mb-1.5 tracking-tight">#1 THIS WEEK</span>
                    <span className="font-bold text-lg truncate leading-tight text-white">{chartData.weeklySongs[0]?.title || 'Unknown'}</span>
                    <span className="text-sm font-medium text-white/70 truncate">{chartData.weeklySongs[0]?.artist || 'Unknown'}</span>
                 </div>
               </div>
            </div>

            {/* Daily Top Songs Global */}
            <div className="bg-gradient-to-br from-[#d6c7b3] to-[#a39480] text-[#4a3419] p-6 rounded-xl flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-lg border border-black/5" style={{aspectRatio: '1', minHeight: '320px'}} onClick={() => handleOpenList('daily_songs')}>
               <div className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.1] mb-4 drop-shadow-sm">Daily Top Songs<br/><span className="opacity-80">Global</span></div>
               <div className="mt-auto flex items-end gap-3 cursor-pointer hover:opacity-80 transition-opacity bg-white/30 p-3 rounded-lg backdrop-blur-sm shadow-sm" onClick={(e) => { e.stopPropagation(); onSelect(chartData.dailySongs[0], true); }}>
                 <div className="w-20 h-20 bg-black/10 shadow-xl shrink-0 overflow-hidden relative rounded shadow-black/20">
                    <ChartCoverImage item={chartData.dailySongs[0]} />
                    {!chartData.dailySongs[0]?.coverImage && <div className="absolute bottom-0 w-full bg-[#1DB954] text-white text-[10px] font-black text-center py-1 uppercase truncate px-1">NEW</div>}
                 </div>
                 <div className="flex flex-col min-w-0 pb-1">
                    <span className="bg-[#4a3419] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm w-max uppercase mb-1.5 tracking-tight">#1 {formattedDaily}</span>
                    <span className="font-bold text-lg truncate leading-tight">{chartData.dailySongs[0]?.title || 'Unknown'}</span>
                    <span className="text-sm font-medium opacity-80 truncate">{chartData.dailySongs[0]?.artist || 'Unknown'}</span>
                 </div>
               </div>
            </div>

            {/* Weekly Top Albums Global */}
            <div className="bg-gradient-to-br from-[#0f6c4c] to-[#063323] text-white p-6 rounded-xl flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-lg border border-white/5" style={{aspectRatio: '1', minHeight: '320px'}} onClick={() => handleOpenList('weekly_albums')}>
               <div className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.1] mb-4 drop-shadow-sm">Weekly Top Albums<br/><span className="text-white/80">Global</span></div>
               <div className="mt-auto flex items-end gap-3 cursor-pointer hover:opacity-80 transition-opacity bg-black/20 p-3 rounded-lg backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onSelect(chartData.weeklyAlbums[0], false); }}>
                 <div className="w-24 h-24 bg-black/20 shadow-xl shrink-0 overflow-hidden relative">
                    <ChartCoverImage item={chartData.weeklyAlbums[0]} />
                 </div>
                 <div className="flex flex-col min-w-0 pb-1">
                    <span className="bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm w-max uppercase mb-1 tracking-tight">#1 THIS WEEK</span>
                    <span className="font-bold text-lg sm:text-xl truncate leading-tight">{chartData.weeklyAlbums[0]?.title || 'Unknown'}</span>
                    <span className="text-sm font-medium opacity-90 truncate">{chartData.weeklyAlbums[0]?.artist || 'Unknown'}</span>
                 </div>
               </div>
            </div>

            {/* Daily Top Artists Global */}
            <div className="bg-[#f2ece4] text-[#2c52c6] p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:opacity-95 transition-opacity" style={{aspectRatio: '1', maxHeight: '400px'}} onClick={() => handleOpenList('daily_artists')}>
               <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-4 w-[70%]">Daily Top Artists<br/><span className="opacity-90">Global</span></div>
               <div className="mt-auto flex items-end gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); onSelect(chartData.dailyArtists[0], true); }}>
                 <div className="w-24 h-24 bg-[#2c52c6] shadow-xl shrink-0 overflow-hidden rounded-md relative flex items-center justify-center text-white">
                    {chartData.dailyArtists[0]?.coverImage ? <img src={chartData.dailyArtists[0].coverImage || undefined} className="w-full h-full object-cover" /> : <span className="text-3xl font-black">{chartData.dailyArtists[0]?.title?.substring(0, 2).toUpperCase() || 'A'}</span>}
                 </div>
                 <div className="flex flex-col min-w-0 pb-1">
                    <span className="bg-[#2c52c6] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm w-max uppercase mb-1 tracking-tight">#1 {formattedDaily}</span>
                    <span className="font-bold text-lg sm:text-xl text-[#2c52c6] truncate leading-tight">{chartData.dailyArtists[0]?.title || 'Unknown'}</span>
                 </div>
               </div>
            </div>

         </div>
       </div>
    </div>
  );
}

function SpotifyList({ type, data, formattedDaily, onBack, onSelect, gameState, currentDateObj }: any) {
  const getListData = () => {
     switch(type) {
        case 'weekly_songs': return { list: data.weeklySongs, title: 'Weekly Top Songs Global', subtitle: 'Your weekly update of the most played tracks right now.', isDaily: false };
        case 'daily_songs': return { list: data.dailySongs, title: 'Daily Top Songs Global', subtitle: 'Your daily update of the most played tracks right now.', isDaily: true };
        case 'weekly_albums': return { list: data.weeklyAlbums, title: 'Weekly Top Albums Global', subtitle: 'Your weekly update of the most played albums right now.', isDaily: false };
        case 'daily_artists': return { list: data.dailyArtists, title: 'Daily Top Artists Global', subtitle: 'Your daily update of the most listened artists right now.', isDaily: true };
        default: return { list: [], title: 'Chart', subtitle: '', isDaily: false };
     }
  };

  const { list, title, subtitle, isDaily } = getListData();

  return (
    <div className="flex flex-col w-full h-full bg-[#121212] text-white overflow-hidden font-sans selection:bg-[#1DB954]/30">
       <div className="sticky top-0 bg-[#000000] z-50 px-4 py-3 flex items-center border-b border-white/5 justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1 font-bold text-white/70 hover:text-white">
                <ChevronDown className="w-5 h-5 rotate-90" />
             </button>
             <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#1DB954]">
                  <div className="flex flex-col gap-[2px] items-center pb-0.5 pl-0.5">
                     <div className="w-3 h-[2px] bg-black rounded-full bg-opacity-90 transform -rotate-6"></div>
                     <div className="w-2.5 h-[1.5px] bg-black rounded-full bg-opacity-80 transform -rotate-6 ml-0.5"></div>
                     <div className="w-2 h-[1px] bg-black rounded-full bg-opacity-70 transform -rotate-6 ml-1"></div>
                  </div>
               </div>
                Spotify Charts
             </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto pb-10 bg-gradient-to-b from-[#181818] to-[#121212]">
          <div className="p-6 md:p-8">
             <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-3 drop-shadow-sm">{title}</h1>
             <p className="text-white/60 mb-8 font-medium">{subtitle}</p>

             <div className="flex gap-3 mb-2">
                 <button className="border border-white/20 bg-transparent hover:border-white/50 rounded-full px-5 py-1.5 text-sm font-bold flex items-center gap-2 transition-colors">
                    {isDaily ? 'Daily' : 'Weekly'}
                    <ChevronDown className="w-4 h-4" />
                 </button>
                 <button className="border border-white/20 bg-transparent hover:border-white/50 rounded-full px-5 py-1.5 text-sm font-bold flex items-center gap-2 transition-colors">
                    {isDaily ? formattedDaily : 'This Week'}
                    <ChevronDown className="w-4 h-4" />
                 </button>
             </div>
          </div>

          <div className="w-full text-left bg-gradient-to-t from-black/20 to-transparent">
             <div className="px-6 py-2 border-b border-white/5 flex items-center text-[10px] font-bold text-white/40 uppercase tracking-widest sticky top-0 bg-[#121212] z-10 backdrop-blur-md bg-opacity-90">
                <div className="w-16">#</div>
                <div className="flex-1">{type === 'daily_artists' ? 'Artist' : 'Title'}</div>
                <div className="w-20 text-center hidden md:block" title="Time on Chart">Streak</div>
                <div className="w-24 text-right pr-4 hidden sm:flex items-center justify-end"><Music2 className="w-3 h-3 mr-1"/> Streams</div>
             </div>
             
             <div className="flex flex-col">
                {list.map((item: any, index: number) => {
                   const streamsText = Math.floor(isDaily ? item.dailyStreams : item.weeklyStreams).toLocaleString();

                   const hash = item.title ? String(item.title).split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) : 0;
                   let daysSinceRelease = 1;
                   if (item.releaseDate) {
                       daysSinceRelease = Math.max(0, Math.floor((currentDateObj.getTime() - new Date(item.releaseDate).getTime()) / (1000 * 3600 * 24)));
                   } else {
                       const pseudoAgeDays = (hash % 300) + 10; // 10 to 310 days old
                       daysSinceRelease = Math.max(1, gameState.time.daysPassed + pseudoAgeDays); 
                   }

                   const isNew = isDaily ? daysSinceRelease <= 1 : daysSinceRelease <= 7;
                   let changeElement = null;
                   let fakePrevPos = index + 1;

                   if (isNew) {
                       changeElement = <div className="text-blue-400 text-[9px] font-bold uppercase tracking-widest mt-1">NEW</div>;
                   } else if (daysSinceRelease > (isDaily ? 1 : 7) && daysSinceRelease < (isDaily ? 3 : 14) && hash % 15 === 0) {
                       changeElement = <div className="text-purple-400 text-[9px] font-bold uppercase tracking-widest mt-1">RE</div>;
                   }

                   if (!changeElement) {
                       if (item.isPlayer && (item.dailyStreams || 0) > (item.lastDailyStreams?.spotify || 0) && isDaily && item.lastDailyStreams) {
                           fakePrevPos = (index + 1) + Math.floor(Math.random() * 5 + 1); // it rose
                       } else {
                           const wobble = Math.floor((hash + daysSinceRelease) % 5);
                           if (wobble === 0) {
                                fakePrevPos = index + 1;
                           } else if (wobble > 2) {
                                fakePrevPos = (index + 1) + (wobble - 1);
                           } else {
                                fakePrevPos = Math.max(1, (index + 1) - wobble);
                           }
                       }
                       
                       if (fakePrevPos > index + 1) {
                           const changeNum = fakePrevPos - (index + 1);
                           changeElement = <div className="flex items-center text-[#1DB954] text-[10px] font-bold mt-0.5"><span className="text-[12px] leading-none">↑</span> {changeNum}</div>;
                       } else if (fakePrevPos < index + 1) {
                           const changeNum = (index + 1) - fakePrevPos;
                           changeElement = <div className="flex items-center text-red-500 text-[10px] font-bold mt-0.5"><span className="text-[12px] leading-none">↓</span> {changeNum}</div>;
                       } else {
                           changeElement = <div className="text-white/30 text-lg leading-none mt-0.5">-</div>;
                       }
                   }

                   return (
                      <div key={index} className="flex items-center px-6 py-2.5 hover:bg-white/5 cursor-pointer transition-colors border-b border-transparent group" onClick={() => {
                          const detailItem = {
                              ...item, 
                              currentPos: index + 1, 
                              prevPos: isNew ? 'N/A' : fakePrevPos, 
                              isNew, 
                              daysSinceRelease, weeksOnChart: Math.max(1, Math.floor(daysSinceRelease / 7))
                          };
                          onSelect(detailItem, isDaily);
                      }}>
                         <div className="w-16 flex flex-col items-center justify-center shrink-0">
                            <span className="font-bold text-lg">{index + 1}</span>
                            {changeElement}
                         </div>
                         
                         <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                            <div className={`w-12 h-12 bg-gray-200 shrink-0 shadow-sm ${type === 'daily_artists' ? 'rounded-full overflow-hidden' : ''}`}>
                               <ChartCoverImage item={item} />
                            </div>
                            <div className="flex flex-col min-w-0">
                               <span className="font-bold text-base truncate">{item.title}</span>
                               {item.type !== 'Artist' && (
                                   <span className="text-sm text-gray-500 truncate">{item.artist}</span>
                               )}
                            </div>
                         </div>

                         <div className="w-20 text-center text-xs text-gray-500 font-medium hidden md:block uppercase tracking-wider">
                            {isNew ? '-' : (isDaily ? `${daysSinceRelease} Day${daysSinceRelease !== 1 ? 's' : ''}` : `${Math.floor(daysSinceRelease / 7)} Wk${Math.floor(daysSinceRelease / 7) !== 1 ? 's' : ''}`)}
                         </div>

                         <div className="w-24 text-right text-sm text-gray-500 pr-4 hidden sm:block">
                            {streamsText}
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>
       </div>
    </div>
  );
}

function ChartCoverImage({ item }: { item: any }) {
   if (item?.coverImage) {
      return <img src={item.coverImage || undefined} className="w-full h-full object-cover" />;
   }
   
   // Generate fallback cover
   const isArtist = item?.type === 'Artist';
   const hash = item?.title ? String(item.title).split('').reduce((a: number,b: string) => a + b.charCodeAt(0), 0) : 0;
   const hue = hash % 360;
   const initials = item?.title ? String(item.title).substring(0, 2).toUpperCase() : 'NA';
   
   return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center font-black text-white p-1 text-center leading-none"
        style={{
           background: `linear-gradient(135deg, hsl(${hue}, 60%, 50%), hsl(${(hue + 40)%360}, 60%, 30%))`,
           fontSize: isArtist ? '20px' : '10px'
        }}
      >
        {isArtist ? initials : <div className="truncate w-full">{item?.artist || 'Unknown'}</div>}
      </div>
   );
}


function SpotifyDetail({ item, isDaily, gameState, onBack }: { item: any, isDaily: boolean, gameState: GameState, onBack: () => void }) {
  if (!item) return <div className="h-full bg-white text-black p-4"><button onClick={onBack}>Back</button></div>;

  const pointsText = Math.floor(isDaily ? item.dailyStreams : item.weeklyStreams).toLocaleString();
  const streamLabel = isDaily ? "Daily Streams" : "Weekly Streams";

  // Compute a generated first entry date for NPCs based on current date minus some hash
  const hash = item?.title ? String(item.title).split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) : 0;
  
  let entryDateStr = 'N/A';
  let releaseDateStr = 'N/A';
  if (item.releaseDate) {
      entryDateStr = new Date(item.releaseDate).toLocaleDateString();
      releaseDateStr = new Date(item.releaseDate).toLocaleDateString();
  } else {
      const pseudoAgeDays = (hash % 300) + 10;
      const releaseDateObj = new Date(gameState.time.startDate);
      releaseDateObj.setDate(releaseDateObj.getDate() + gameState.time.daysPassed - pseudoAgeDays);
      releaseDateStr = releaseDateObj.toLocaleDateString();
      
      const entryDateObj = new Date(releaseDateObj);
      entryDateObj.setDate(entryDateObj.getDate() + (hash % 10) + 1); // entered chart 1 to 10 days after release
      entryDateStr = entryDateObj.toLocaleDateString();
  }
  
  let daysSinceRelease = item.daysSinceRelease;
  if (daysSinceRelease === undefined) {
       daysSinceRelease = 1;
       if (item.releaseDate) {
           const currentDateObj = new Date(gameState.time.startDate);
           currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed);
           daysSinceRelease = Math.max(0, Math.floor((currentDateObj.getTime() - new Date(item.releaseDate).getTime()) / (1000 * 3600 * 24)));
       } else {
           const pseudoAgeDays = (hash % 300) + 10;
           daysSinceRelease = Math.max(1, gameState.time.daysPassed + pseudoAgeDays);
       }
  }
  
  const isNew = item.isNew !== undefined ? item.isNew : (isDaily ? daysSinceRelease <= 1 : daysSinceRelease <= 7);
  const weeksOnChart = item.weeksOnChart !== undefined ? item.weeksOnChart : Math.max(1, Math.floor(daysSinceRelease / 7));

  const currentPos = item.currentPos || 1;
  const pseudoPeak = Math.min(currentPos, (hash % currentPos) + 1);
  const prevPos = item.prevPos || (isNew ? 'N/A' : currentPos + (hash % 10));

  const streak = isNew ? 1 : (isDaily ? daysSinceRelease : weeksOnChart);
  const totalChartTime = isDaily ? streak : weeksOnChart + (hash % Math.max(1, weeksOnChart));

  return (
    <div className="flex flex-col w-full h-full bg-[#121212] text-white overflow-hidden font-sans selection:bg-[#1DB954]/30">
       <div className="sticky top-0 bg-[#000000] z-50 px-4 py-3 flex items-center border-b border-white/5 justify-between shadow-sm">
          <div className="flex items-center gap-3 w-full">
             <button onClick={onBack} className="p-2 -ml-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5"/></button>
             <div className="flex items-center gap-2 font-bold text-lg tracking-tight flex-1">
                Chart Details
             </div>
             <div className="w-8 h-8 rounded-full bg-[#282828] overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold shadow-sm border border-white/10">
               {gameState.artist?.name ? gameState.artist.name[0] : 'U'}
             </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8 max-w-2xl mx-auto w-full">
          <div className="flex items-start gap-6 mb-10">
             <div className="w-32 h-32 bg-[#282828] shrink-0 shadow-2xl shadow-black/50 overflow-hidden relative">
                 <ChartCoverImage item={item} />
                 <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
             </div>
             <div className="flex flex-col justify-end h-32 py-1">
                <span className="text-xs font-bold tracking-widest text-[#1DB954] uppercase mb-2">Track Details</span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight mb-1 drop-shadow-sm line-clamp-2">{item.title}</h1>
                <h2 className="text-white/70 font-medium text-lg leading-tight">{item.artist}</h2>
             </div>
          </div>

          <div className="flex flex-col divide-y divide-white/5 bg-[#181818] p-6 rounded-xl border border-white/5 shadow-lg">
             <DetailRow label="Producers" value={item.isPlayer ? "Player Studio" : "Various"} />
             <DetailRow label="Songwriters" value={item.artist} />
             <DetailRow label="Source" value="Indie" />
             <DetailRow label="Peak" value={pseudoPeak} />
             <DetailRow label={isDaily ? "Prev Day" : "Prev Week"} value={prevPos} />
             <DetailRow label="Streak" value={streak} />
             <DetailRow label={streamLabel} value={pointsText} isHighlight={true} />
             <DetailRow label="Release Date" value={releaseDateStr} />
             <DetailRow label="First entry date" value={entryDateStr} />
             <DetailRow label="First entry position" value={(hash % 90) + 10} />
             <DetailRow label={isDaily ? "Total days on chart" : "Total weeks on chart"} value={totalChartTime} />
          </div>
       </div>
    </div>
  );
}

function DetailRow({ label, value, isHighlight }: { label: string, value: string | number, isHighlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-4 ${isHighlight ? 'text-[#1DB954]' : ''}`}>
       <span className="font-bold border-b-transparent text-sm w-1/3 text-white/50">{label}</span>
       <span className={`text-base font-medium w-2/3 text-right sm:text-left ${isHighlight ? 'text-[#1DB954]' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function SearchResults({ query, gameState, onBack, onSelect }: { query: string, gameState: GameState, onBack: () => void, onSelect: (v: any) => void }) {
  const [localQuery, setLocalQuery] = useState(query);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const isSpotifyQ = query.toLowerCase().includes('spotify') || query.toLowerCase().includes('chart') || query.toLowerCase().includes('top');
  const isRadioQ = query.toLowerCase().includes('radio') || query.toLowerCase().includes('airplay') || query.toLowerCase().includes('spin');
  const isPitchforkQ = query.toLowerCase().includes('pitchfork') || query.toLowerCase().includes('review');

  return (
    <div className="flex flex-col w-full h-full bg-white text-black overflow-hidden font-sans">
       <div className="flex flex-col border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center w-full px-4 sm:px-6 py-4 gap-4">
             <div className="text-2xl font-sans font-medium tracking-tighter cursor-pointer shrink-0" style={{color: '#4285F4'}} onClick={onBack}>
                <span style={{color: '#4285F4'}}>G</span>
                <span style={{color: '#EA4335'}}>o</span>
                <span style={{color: '#FBBC05'}}>o</span>
                <span style={{color: '#4285F4'}}>g</span>
                <span style={{color: '#34A853'}}>l</span>
                <span style={{color: '#EA4335'}}>e</span>
             </div>
             
             <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative flex items-center group">
                <input 
                  type="text" 
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  className="w-full border border-transparent shadow-sm bg-white ring-1 ring-gray-200 rounded-full py-2.5 sm:py-3 pl-5 pr-12 hover:ring-gray-300 hover:shadow-md focus:shadow-md focus:outline-none focus:ring-transparent transition-all text-sm sm:text-base"
                />
                <button type="submit" className="absolute right-4 text-gray-500 hover:text-blue-500">
                   <Search className="w-5 h-5" strokeWidth={2} />
                </button>
             </form>
             
             <div className="hidden sm:flex items-center gap-4 ml-auto">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block">
                  <AlignJustify className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer ml-2">
                   {gameState.artist?.name ? gameState.artist.name[0] : 'U'}
                </div>
             </div>
             <button onClick={onBack} className="p-2 md:hidden hover:bg-gray-100 rounded-full text-gray-500 transition-colors bg-gray-50 border border-gray-200">
                <X className="w-5 h-5"/>
             </button>
          </div>
          
          <div className="flex items-center gap-6 px-4 sm:px-44 text-sm font-medium text-gray-600 pb-2 overflow-x-auto hide-scrollbar">
             <div className="text-blue-600 border-b-2 border-blue-600 pb-2 px-1 whitespace-nowrap">All</div>
             <div className="hover:text-gray-900 pb-2 px-1 cursor-pointer whitespace-nowrap hidden sm:block">Images</div>
             <div className="hover:text-gray-900 pb-2 px-1 cursor-pointer whitespace-nowrap hidden sm:block">News</div>
             <div className="hover:text-gray-900 pb-2 px-1 cursor-pointer whitespace-nowrap hidden sm:block">Videos</div>
             <div className="hover:text-gray-900 pb-2 px-1 cursor-pointer whitespace-nowrap">Shopping</div>
             <div className="hover:text-gray-900 pb-2 px-1 cursor-pointer whitespace-nowrap">More</div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-3xl px-4 sm:px-44 py-4 md:py-6 flex flex-col gap-8">
             <div className="text-sm text-gray-500 font-medium">
                About {Math.floor(Math.random() * 900 + 100)},000,000 results (0.{Math.floor(Math.random() * 50 + 20)} seconds) 
             </div>

             {/* Search Results */}
             {isRadioQ || (!isSpotifyQ && !isRadioQ && !isPitchforkQ) ? (
                 <div className="flex flex-col gap-1 max-w-2xl group cursor-pointer" onClick={() => onSelect('radio')}>
                    <div className="flex items-center gap-3 mb-1">
                       <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">📻</div>
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 leading-tight">RadioTracker Hub</span>
                          <span className="text-xs text-gray-600 leading-tight">https://www.radiotracker.com › charts</span>
                       </div>
                    </div>
                    <h3 className="text-xl text-[#1a0dab] group-hover:underline">US Radio Top 50 Chart | Official Airplay</h3>
                    <p className="text-sm text-[#4d5156] leading-relaxed mt-1 line-clamp-2">
                       Check out this week's most played songs on US terrestrial and digital radio. Updated weekly. Real-time airplay analytics for the music industry.
                    </p>
                 </div>
             ) : null}

             {isSpotifyQ || (!isSpotifyQ && !isRadioQ && !isPitchforkQ) ? (
                 <div className="flex flex-col gap-1 max-w-2xl group cursor-pointer" onClick={() => onSelect('spotify')}>
                    <div className="flex items-center gap-3 mb-1">
                       <div className="w-8 h-8 rounded-full bg-[#1DB954] text-white flex items-center justify-center -rotate-6">
                           <div className="flex flex-col gap-[2px] items-center pb-0.5 xl pl-0.5">
                              <div className="w-3.5 h-[2px] bg-white rounded-full bg-opacity-90 transform -rotate-6"></div>
                              <div className="w-2.5 h-[1.5px] bg-white rounded-full bg-opacity-80 transform -rotate-6 ml-0.5"></div>
                              <div className="w-2 h-[1px] bg-white rounded-full bg-opacity-70 transform -rotate-6 ml-1"></div>
                           </div>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 leading-tight">Spotify Charts</span>
                          <span className="text-xs text-gray-600 leading-tight">https://charts.spotify.com › home</span>
                       </div>
                    </div>
                    <h3 className="text-xl text-[#1a0dab] group-hover:underline">Spotify Charts - Top Global Songs</h3>
                    <p className="text-sm text-[#4d5156] leading-relaxed mt-1 line-clamp-2">
                       See what's trending globally right now. Track the most streamed songs and albums updating daily on Spotify.
                    </p>
                 </div>
             ) : null}

             {isPitchforkQ || (!isSpotifyQ && !isRadioQ && !isPitchforkQ) ? (
                 <div className="flex flex-col gap-1 max-w-2xl group cursor-pointer" onClick={() => onSelect('pitchfork')}>
                    <div className="flex items-center gap-3 mb-1">
                       <div className="w-8 h-8 rounded-full bg-black text-[#ff3530] flex items-center justify-center font-serif font-black italic shadow-sm border border-gray-200">
                          P
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 leading-tight">Pitchfork</span>
                          <span className="text-xs text-gray-600 leading-tight">https://pitchfork.com</span>
                       </div>
                    </div>
                    <h3 className="text-xl text-[#1a0dab] group-hover:underline">Pitchfork | The Most Trusted Voice in Music</h3>
                    <p className="text-sm text-[#4d5156] leading-relaxed mt-1 line-clamp-2">
                       Music reviews, ratings, news and more. Read the latest record reviews and track analyses from our critics and readers.
                    </p>
                 </div>
             ) : null}

             <div className="flex flex-col gap-1 max-w-2xl group cursor-pointer">
                <div className="flex items-center gap-3 mb-1">
                   <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">🎸</div>
                   <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 leading-tight">The Sounds Weekly</span>
                      <span className="text-xs text-gray-600 leading-tight">https://www.thesoundsweekly.news</span>
                   </div>
                </div>
                <h3 className="text-xl text-[#1a0dab] group-hover:underline">Industry Insights: Trends in global {query}</h3>
                <p className="text-sm text-[#4d5156] leading-relaxed mt-1 line-clamp-2">
                   Analyzing the latest updates to tracking and discovering new trends. From major labels to independent phenomenons sweeping {query || 'the charts'}.
                </p>
             </div>
             
             {/* People also ask */}
             <div className="w-full max-w-2xl border border-gray-200 rounded-lg overflow-hidden mt-2 mb-4">
                 <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
                    <span className="text-lg font-medium text-gray-800">People also ask</span>
                 </div>
                 <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <span className="text-sm text-gray-700">What is the most streamed song in 24 hours?</span>
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                 </div>
                 <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <span className="text-sm text-gray-700">How do music charts work?</span>
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                 </div>
                 <div className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <span className="text-sm text-gray-700">How to get on the top 50?</span>
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                 </div>
             </div>

          </div>
       </div>
    </div>
  );
}

function NewsDetailView({ news, onBack }: { news: NewsArticle, onBack: () => void }) {
  const dateObj = new Date(news.dateStr);
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col w-full h-full bg-white text-black overflow-hidden font-sans">
       <div className="flex items-center w-full px-4 sm:px-6 py-4 gap-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
             <ArrowLeft className="w-5 h-5"/>
          </button>
          <div className="text-xl font-sans font-medium tracking-tighter" style={{color: '#4285F4'}}>
             <span style={{color: '#4285F4'}}>G</span>
             <span style={{color: '#EA4335'}}>o</span>
             <span style={{color: '#FBBC05'}}>o</span>
             <span style={{color: '#4285F4'}}>g</span>
             <span style={{color: '#34A853'}}>l</span>
             <span style={{color: '#EA4335'}}>e</span>
             <span className="text-gray-600 ml-2 font-normal">News</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
             <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"><Share2 className="w-5 h-5"/></button>
             <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"><MoreVertical className="w-5 h-5"/></button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto px-4 md:px-0">
          <div className="max-w-3xl mx-auto py-6 sm:py-10 flex flex-col">
             {news.imageUrl && (
                 <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden mb-6 sm:mb-8 bg-gray-100 relative">
                     <img src={news.imageUrl} alt="" className="w-full h-full object-cover" />
                 </div>
             )}
             <div className="flex items-center gap-2 mb-4">
                 <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                     {news.type}
                 </span>
                 <span className="text-gray-500 text-sm font-medium">{formattedDate}</span>
             </div>
             
             <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-tight mb-6">
                 {news.title}
             </h1>
             
             {news.artistName && (
                <div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                       {news.imageUrl ? <img src={news.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{news.artistName[0]}</div>}
                    </div>
                    <div>
                       <p className="text-sm font-bold text-gray-900 leading-tight">By Entertainment Staff</p>
                       <p className="text-xs text-gray-500">Related: {news.artistName}</p>
                    </div>
                </div>
             )}

             <div className="prose prose-lg text-gray-800 max-w-none leading-relaxed pb-20">
                 <p className="whitespace-pre-wrap">{news.body}</p>
             </div>
          </div>
       </div>
    </div>
  );
}
