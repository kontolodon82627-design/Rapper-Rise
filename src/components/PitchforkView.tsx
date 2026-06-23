import React, { useState, useMemo } from 'react';
import { GameState, Release } from '../types';
import { ArrowLeft, Search, Star, MessageSquare, Menu, X, ChevronRight } from 'lucide-react';
import { ARTIST_IMAGES } from '../artistImages';

// Simple deterministic random
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

interface PitchforkViewProps {
  gameState: GameState;
  onBack: () => void;
}

export function PitchforkView({ gameState, onBack }: PitchforkViewProps) {
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [activeTab, setActiveTab] = useState<'news' | 'reviews' | 'profile'>('news');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileArtistName, setProfileArtistName] = useState<string>(gameState.artist?.name || 'Artist');

  const allArtists = useMemo(() => {
    const artists: string[] = [];
    if (gameState.artist?.name) artists.push(gameState.artist.name);
    if (gameState.npcStats) {
       artists.push(...Object.keys(gameState.npcStats));
    }
    return Array.from(new Set(artists));
  }, [gameState]);

  const searchResults = useMemo(() => {
     if (!searchQuery.trim()) return [];
     const q = searchQuery.toLowerCase();
     return allArtists.filter(a => a.toLowerCase().includes(q));
  }, [allArtists, searchQuery]);

  const reviews = useMemo(() => {
    const allPublished = gameState.releases.filter(r => r.status === 'Published' && !(r as any).isBSide);

    
    return allPublished.map((r) => {
      const isNPC = !!(r as any).isNPCRelease;
      const rArtist = isNPC ? (r as any).artistId : gameState.artist?.name;
      
      const seed = hashString(r.id || r.title);
      
      let baseScore = 6.0;
      if (!isNPC && gameState.artist) {
         const { songwriting, production, vocals } = gameState.skills;
         const skillSum = (songwriting * 0.4 + production * 0.4 + vocals * 0.2);
         // Harsher Pitchfork formula: 100 skill sum = 8.0 base, 0 skill sum = 2.0 base
         baseScore = 2.0 + (skillSum / 100) * 6.0;
      } else if (isNPC && gameState.npcStats && gameState.npcStats[rArtist]) {
         const { songwriting, production, vocals } = gameState.npcStats[rArtist].skills;
         const skillSum = (songwriting * 0.4 + production * 0.4 + vocals * 0.2);
         baseScore = 2.0 + (skillSum / 100) * 6.0;
      } else {
         baseScore = 4.0 + seededRandom(seed) * 4; // fallback 4.0 to 8.0
      }
      
      // Pitchfork randomness (they can be harsh or surprisingly generous) +/- 1.5
      const pfVariance = (seededRandom(seed + 1) * 3) - 1.5; 
      let pfScore = Math.max(0.1, Math.min(10.0, baseScore + pfVariance));
      
      // Bonus for being 'indie' or BNM (score > 8.0)
      if (pfScore > 8.0 && seededRandom(seed + 2) > 0.8) pfScore += 0.5; // BNM bump
      pfScore = Math.min(10.0, pfScore);

      // Reader score (fans) usually rate higher
      const readerVariance = (seededRandom(seed + 3) * 2); // 0 to 2.0
      let readerScore = Math.max(0.1, Math.min(10.0, baseScore + readerVariance));

      let _populatedTracks: any[] = [];
      if ((r as any).type !== 'Single' && (r as any).trackIds) {
          _populatedTracks = (r as any).trackIds.map((id: string) => gameState.releases.find(t => t.id === id)).filter(Boolean);
      } else if ((r as any).tracks) {
          _populatedTracks = (r as any).tracks;
      }

      return {
        ...r,
        isPlayer: !isNPC,
        artist: rArtist || 'Unknown',
        coverImage: r.coverImage || ARTIST_IMAGES[rArtist as string] || `https://i.pravatar.cc/200?u=${encodeURIComponent(rArtist || '')}`,
        pfScore: Number(pfScore.toFixed(1)),
        readerScore: Number(readerScore.toFixed(1)),
        isBNM: pfScore >= 8.2 && seededRandom(seed + 4) > 0.3,
        pfAuthor: ["Ian Cohen", "Jillian Mapes", "Jeremy D. Larson", "Alphonse Pierre", "Mano Sundaresan"][Math.floor(seededRandom(seed + 5) * 5)],
        pfSnippet: generateSnippet(r.title, pfScore, seed),
        _populatedTracks
      };
    }).sort((a, b) => {
         // Sort by release date descending
         if (!a.releaseDate) return 1;
         if (!b.releaseDate) return -1;
         return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    });
  }, [gameState]);

  const displayedReviews = useMemo(() => {
    if (activeTab === 'profile') return reviews.filter(r => r.artist === profileArtistName);
    return reviews;
  }, [reviews, activeTab, profileArtistName]);

  const latestBNM = activeTab === 'reviews' ? displayedReviews.find(r => r.isBNM) : null;
  const otherReviews = activeTab === 'reviews' ? displayedReviews.filter(r => r.id !== latestBNM?.id) : displayedReviews;

  if (selectedRelease) {
      return <PitchforkReviewDetail item={reviews.find(r => r.id === selectedRelease.id) || selectedRelease as any} onBack={() => setSelectedRelease(null)} />;
  }

  return (
    <div className="flex flex-col w-full h-full bg-white text-[#1a1a1a] overflow-x-hidden overflow-y-auto font-serif selection:bg-[#ff3530] selection:text-white relative">
      {/* Header */}
      <div className="sticky top-0 bg-white z-50 border-b border-gray-200">
         <div className="px-4 py-3 flex items-center justify-between relative">
            <div className="flex items-center gap-4">
               <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 -ml-2 text-gray-800 hover:text-black transition-colors">
                  {menuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
               </button>
            </div>
            
            <div className="text-2xl font-bold tracking-tighter absolute left-1/2 -translate-x-1/2 z-10 cursor-pointer" onClick={() => {setActiveTab('news'); setMenuOpen(false); setSelectedRelease(null)}}>
               Pitchfork
            </div>
            
            <div className="flex items-center gap-2">
               <button onClick={() => { setIsSearching(!isSearching); setMenuOpen(false); }} className="p-2 -mr-2 text-gray-400 hover:text-black transition-colors"><Search className="w-5 h-5"/></button>
               <button onClick={onBack} className="p-2 text-gray-400 hover:text-[#ff3530] transition-colors ml-2 hidden sm:block"><span className="text-xs font-sans font-bold uppercase tracking-widest">Exit</span></button>
            </div>
         </div>
         
         {isSearching && (
           <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50 p-4">
              <div className="flex items-center gap-2 mb-4">
                 <input 
                   autoFocus
                   type="text" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder="Search artists..."
                   className="w-full bg-gray-100 border-none outline-none font-sans text-sm p-3 focus:ring-2 focus:ring-[#ff3530]"
                 />
                 <button onClick={() => {setIsSearching(false); setSearchQuery('');}} className="p-2 text-gray-400 hover:text-black">
                    <X className="w-5 h-5"/>
                 </button>
              </div>
              {
                searchQuery.trim() !== '' && (
                   <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {searchResults.length > 0 ? searchResults.map(artist => (
                         <button 
                           key={artist}
                           onClick={() => {
                              setProfileArtistName(artist);
                              setActiveTab('profile');
                              setIsSearching(false);
                              setSearchQuery('');
                           }}
                           className="text-left py-2 px-2 font-sans font-bold hover:bg-gray-50 hover:text-[#ff3530] text-sm tracking-wide transition-colors"
                         >
                            {artist}
                         </button>
                      )) : (
                         <div className="text-gray-400 font-serif italic text-sm py-2 px-2">No artists found.</div>
                      )}
                   </div>
                )
              }
           </div>
         )}

         {menuOpen ? (
           <div className="absolute top-full left-0 w-full md:w-80 bg-white border-r border-b border-gray-200 shadow-2xl z-40 flex flex-col p-6 font-sans font-bold uppercase tracking-widest text-sm space-y-6 min-h-[50vh]">
               <button className={`text-left flex items-center justify-between hover:text-[#ff3530] transition-colors pb-4 border-b border-gray-100 ${activeTab === 'news' ? 'text-[#ff3530]' : 'text-gray-900'}`} onClick={() => { setActiveTab('news'); setMenuOpen(false); setSelectedRelease(null); }}>
                  News
                  <ChevronRight className="w-4 h-4 text-gray-300"/>
               </button>
               <button className={`text-left flex items-center justify-between hover:text-[#ff3530] transition-colors pb-4 border-b border-gray-100 ${activeTab === 'reviews' ? 'text-[#ff3530]' : 'text-gray-900'}`} onClick={() => { setActiveTab('reviews'); setMenuOpen(false); setSelectedRelease(null); }}>
                  Reviews
                  <ChevronRight className="w-4 h-4 text-gray-300"/>
               </button>
               <button className={`text-left flex items-center justify-between hover:text-[#ff3530] transition-colors pb-4 border-b border-gray-100 ${activeTab === 'profile' && profileArtistName === gameState.artist?.name ? 'text-[#ff3530]' : 'text-gray-900'}`} onClick={() => { setActiveTab('profile'); setProfileArtistName(gameState.artist?.name || 'Artist'); setMenuOpen(false); setSelectedRelease(null); }}>
                  {gameState.artist?.name || 'Artist'} Profile
                  <ChevronRight className="w-4 h-4 text-gray-300"/>
               </button>
               <button onClick={onBack} className="text-left text-gray-400 hover:text-[#ff3530] transition-colors pt-4 flex items-center justify-between sm:hidden">
                  Close Site <ChevronRight className="w-4 h-4 text-gray-200"/>
               </button>
           </div>
         ) : (
            <div className="flex items-center gap-6 px-4 py-3 text-xs font-sans font-bold uppercase tracking-widest text-gray-500 overflow-x-auto hide-scrollbar border-t border-gray-100">
               <span className={`cursor-pointer shrink-0 ${activeTab === 'news' ? 'text-[#ff3530]' : 'hover:text-black'}`} onClick={() => setActiveTab('news')}>News</span>
               <span className={`cursor-pointer shrink-0 ${activeTab === 'reviews' ? 'text-[#ff3530]' : 'hover:text-black'}`} onClick={() => setActiveTab('reviews')}>Reviews</span>
               <span className={`cursor-pointer shrink-0 ${activeTab === 'profile' && profileArtistName === gameState.artist?.name ? 'text-[#ff3530]' : 'hover:text-black'}`} onClick={() => { setActiveTab('profile'); setProfileArtistName(gameState.artist?.name || 'Artist'); }}>Player Profile</span>
            </div>
         )}
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto border-x border-gray-100 pb-20">
         {activeTab === 'news' && (
            <div className="p-6">
               <h2 className="text-2xl font-bold font-sans uppercase tracking-tight mb-8 border-b-4 border-black pb-2 inline-block">Latest News</h2>
               <div className="flex flex-col gap-8">
                  {reviews.slice(0, 10).map((r, i) => (
                     <div key={i} className="flex gap-4 group cursor-pointer" onClick={() => setSelectedRelease(r)}>
                        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-gray-100 overflow-hidden hidden sm:block border border-gray-200">
                           <img src={r.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt=""/>
                        </div>
                        <div className="flex-1">
                           <div className="text-[#ff3530] text-[10px] font-sans font-bold uppercase tracking-widest mb-2">MUSIC NEWS</div>
                           <h3 className="text-xl sm:text-2xl font-bold leading-tight group-hover:text-[#ff3530] transition-colors mb-2">
                              {r.isBNM ? `${r.artist} secures Best New Music with '${r.title}'` : `Critics react to ${r.artist}'s latest release '${r.title}'`}
                           </h3>
                           <p className="text-sm font-sans text-gray-500 mt-2 line-clamp-2">
                              {r.pfSnippet}
                           </p>
                           <div className="text-xs text-gray-400 font-sans mt-3 uppercase tracking-widest font-bold">
                              By {r.pfAuthor}
                           </div>
                        </div>
                     </div>
                  ))}
                  {reviews.length === 0 && (
                     <p className="text-gray-500 font-serif italic">No news to report yet. The music world is quiet...</p>
                  )}
               </div>
            </div>
         )}

         {activeTab === 'profile' && (
            <div className="flex flex-col items-center justify-center p-12 border-b border-gray-100 mb-8 bg-gray-50 relative overflow-hidden group">
               <div className="absolute inset-0 bg-[#ff3530]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
               <div className="w-32 h-32 rounded-full overflow-hidden mb-6 filter grayscale contrast-125 border-4 border-white shadow-xl relative z-10 transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:contrast-100">
                 <img src={ARTIST_IMAGES[profileArtistName] || (profileArtistName === gameState.artist?.name ? gameState.artist?.image : '') || `https://i.pravatar.cc/300?u=${encodeURIComponent(profileArtistName || '')}`} className="w-full h-full object-cover" alt="" />
               </div>
               <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-center uppercase font-sans relative z-10">
                 {profileArtistName}
               </h1>
               <div className="w-12 h-1 bg-[#ff3530] mb-4 relative z-10"></div>
               <p className="text-xs font-sans font-medium text-gray-500 uppercase tracking-widest text-center max-w-lg relative z-10">
                 Pitchfork Reviews • Complete Discography
               </p>
               {otherReviews.length === 0 && (
                   <p className="mt-8 text-gray-500 font-serif italic text-lg">No acclaimed releases found yet.</p>
               )}
            </div>
         )}

         {latestBNM && activeTab === 'reviews' && (
            <div className="w-full border-b border-gray-200 cursor-pointer group" onClick={() => setSelectedRelease(latestBNM)}>
               <div className="w-full aspect-square md:aspect-[21/9] bg-gray-100 relative overflow-hidden">
                   <img src={latestBNM.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 blur-[2px] opacity-20" alt=""/>
                   <img src={latestBNM.coverImage || undefined} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-auto shadow-2xl group-hover:scale-105 transition-transform duration-700" alt=""/>
                   <div className="absolute top-4 left-4 bg-[#ff3530] text-white text-[10px] sm:text-xs font-sans font-bold uppercase tracking-widest px-2 py-1 shadow-md">
                      Best New Music
                   </div>
               </div>
               <div className="p-6 md:p-10 text-center flex flex-col items-center">
                  <span className="text-sm font-sans font-bold text-gray-500 uppercase tracking-widest mb-4">Review</span>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 group-hover:text-[#ff3530] transition-colors">{latestBNM.artist}</h2>
                  <h3 className="text-2xl md:text-4xl italic text-gray-600 mb-6 font-serif">"{latestBNM.title}"</h3>
                  <p className="max-w-2xl text-gray-600 font-serif leading-relaxed mb-6 md:text-lg">
                     {latestBNM.pfSnippet}
                  </p>
                  <p className="text-xs font-sans font-bold text-gray-400 uppercase tracking-widest">By {latestBNM.pfAuthor}</p>
               </div>
            </div>
         )}

         {(activeTab === 'reviews' || activeTab === 'profile') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 p-6">
               {otherReviews.map((review, i) => (
                  <div key={i} className="flex flex-col cursor-pointer group" onClick={() => setSelectedRelease(review)}>
                     <div className="w-full aspect-square bg-gray-100 relative overflow-hidden mb-4 border border-gray-200">
                        <img src={review.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt=""/>
                        {review.isBNM && (
                           <div className="absolute top-2 left-2 bg-[#ff3530] text-white text-[9px] font-sans font-bold uppercase tracking-widest px-1.5 py-0.5 shadow-md">
                              BNM
                           </div>
                        )}
                     </div>
                     <div className="text-[10px] font-sans font-bold text-[#ff3530] uppercase tracking-widest mb-2 border-b-2 border-[#ff3530] pb-1 w-max">
                        {review.type} Review
                     </div>
                     <h4 className="font-bold text-xl leading-tight group-hover:text-[#ff3530] transition-colors line-clamp-1">{review.artist}</h4>
                     <h5 className="italic text-gray-600 text-lg mb-3 line-clamp-2 leading-tight">"{review.title}"</h5>
                     <p className="text-gray-500 text-sm font-sans font-medium uppercase tracking-wider mt-auto">
                        By {review.pfAuthor}
                     </p>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}

function PitchforkReviewDetail({ item, onBack }: { item: any, onBack: () => void }) {
  const seed = hashString(item.id || item.title);
  
  // Track-by-track reviews
  const trackReviews = useMemo(() => {
     if (item.type === 'Single') return [];
     
     let tracksToUse: any[] = [];
     if (item.trackIds && Array.isArray(item.trackIds)) {
         tracksToUse = item.trackIds.reduce((acc: any[], id: string) => {
             // Let's assume gameState is accessible somehow. Wait, gameState is NOT passed to PitchforkReviewDetail.
             const song = item._populatedTracks?.find((t: any) => t.id === id); // We will attach _populatedTracks in the parent component
             if (song) acc.push(song);
             return acc;
         }, []);
     } else if (item.tracks && Array.isArray(item.tracks)) {
         tracksToUse = item.tracks; 
     }

     return tracksToUse.map((t: any, i: number) => {
         const tSeed = seed + i * 100;
         // Track score varies slightly around album score (+/- 1.2)
         const trkScore = Math.max(0.0, Math.min(10.0, item.pfScore + ((seededRandom(tSeed) * 2.4) - 1.2)));
         const rdrScore = Math.max(0.0, Math.min(10.0, item.readerScore + ((seededRandom(tSeed + 2) * 2.4) - 1.2)));
         
         let textPool = [];
         if (trkScore >= 8.5) {
            textPool = [
               `An absolute standout. It anchors the core themes of the project perfectly.`,
               `A masterclass in modern ${(Array.isArray(item.genre) ? item.genre : [item.genre])[0]?.toLowerCase() || 'pop'}.`,
               `A gorgeous, sprawling arrangement that demands repeated listening.`,
               `Easily one of the most arresting vocal performances in their catalogue.`
            ];
         } else if (trkScore >= 6.5) {
            textPool = [
               `A surprisingly tight groove drives this track.`,
               `Enjoyable, though it doesn't push any boundaries.`,
               `Solid and reliable, serving its purpose on the tracklist well.`,
               `Slightly meandering, but conceptually necessary.`
            ];
         } else if (trkScore >= 4.5) {
            textPool = [
               `Lyrically poignant, though the instrumental leaves something to be desired.`,
               `Feels somewhat like filler, lacking the punch of the leading singles.`,
               `It tries for anthemic, but lands somewhere closer to forgettable.`
            ];
         } else {
            textPool = [
               `Easily the most skip-able moment on the tracklist.`,
               `A confusing stylistic pivot that simply doesn't pay off.`,
               `Overproduced and lacking emotional resonance.`
            ];
         }

         return {
            title: t.title,
            score: Number(trkScore.toFixed(1)),
            readerScore: Number(rdrScore.toFixed(1)),
            text: textPool[Math.floor(seededRandom(tSeed + 1) * textPool.length)]
         };
     });
  }, [item, seed]);

  return (
    <div className="flex flex-col w-full h-full bg-[#fdfdfd] text-[#1a1a1a] overflow-hidden font-serif selection:bg-[#ff3530] selection:text-white">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
         <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-sans text-xs font-bold uppercase tracking-widest">
               <ArrowLeft className="w-4 h-4"/> Back
            </button>
            <div className="text-xl font-bold tracking-tighter">
               Pitchfork
            </div>
            <div className="w-10"></div> {/* Spacer */}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
         <div className="max-w-3xl mx-auto w-full pt-10 pb-20 px-4 md:px-8 border-x border-gray-100 bg-white min-h-full shadow-[0_0_50px_rgba(0,0,0,0.02)]">
             
            {/* Review Intro */}
            <div className="flex flex-col md:flex-row gap-8 mb-12 items-center md:items-start">
               <div className="w-64 h-64 shrink-0 shadow-lg border border-gray-200 relative">
                  <img src={item.coverImage || undefined} className="w-full h-full object-cover" alt="" />
                  {item.isBNM && (
                      <div className="absolute top-2 left-2 bg-[#ff3530] text-white text-[10px] font-sans font-bold uppercase tracking-widest px-2 py-1 shadow-md">
                         BNM
                      </div>
                  )}
               </div>
               
               <div className="flex flex-col flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                      <div className="text-[10px] font-sans font-bold text-[#ff3530] uppercase tracking-widest border-b-2 border-[#ff3530] pb-1 w-max">
                         {item.type} Review
                      </div>
                      <div className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest">
                         {Array.isArray(item.genre) ? item.genre.join(', ') : item.genre}
                      </div>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 leading-tight">{item.artist}</h1>
                  <h2 className="text-3xl md:text-4xl italic text-gray-600 mb-8 font-serif leading-tight">"{item.title}"</h2>
                  
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-y border-gray-200 py-6">
                     {/* Pitchfork Score */}
                     <div className="flex flex-col items-center">
                        {item.isBNM ? (
                           <div className="relative flex flex-col items-center mb-2">
                              {/* Red Upward Arrows for BNM */}
                              <svg width="48" height="16" viewBox="0 0 48 16" className="mb-2 fill-[#ff3530] mt-1">
                                 <path d="M24 0 L30 8 L26 8 L26 16 L22 16 L22 8 L18 8 Z" />
                                 <polygon points="12,6 18,14 6,14" />
                                 <polygon points="36,6 42,14 30,14" />
                              </svg>
                              <div className="w-[84px] h-[84px] rounded-full border-[7px] border-[#ff3530] flex items-center justify-center bg-white z-10">
                                 <span className="text-[38px] font-bold tracking-tight text-[#ff3530] leading-none">{item.pfScore}</span>
                              </div>
                           </div>
                        ) : (
                           <div className="w-20 h-20 rounded-full border-[3px] border-[#1a1a1a] flex items-center justify-center mb-2 shadow-sm bg-white">
                              <span className="text-3xl font-bold tracking-tighter" style={{color: item.pfScore >= 8.0 ? '#ff3530' : '#1a1a1a'}}>{item.pfScore}</span>
                           </div>
                        )}
                        <span className="text-[12px] font-sans text-gray-800">Pitchfork score</span>
                     </div>
                     
                     {/* Reader Score */}
                     <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center mb-2 bg-[#f9f9f9]">
                           <span className="text-2xl font-bold tracking-tighter text-gray-700">{item.readerScore}</span>
                        </div>
                        <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest">Reader Score</span>
                     </div>
                  </div>
                  
                  <div className="mt-6 text-xs font-sans font-bold text-gray-900 uppercase tracking-widest">
                     By <span className="text-[#ff3530] underline decoration-1 underline-offset-4">{item.pfAuthor}</span>
                  </div>
                  <div className="mt-2 text-xs font-sans text-gray-400">
                     Published {item.releaseDate ? new Date(item.releaseDate).toLocaleDateString() : 'Recently'}
                  </div>
               </div>
            </div>

            {/* Subheading / Verdict */}
            <h3 className="text-xl md:text-2xl leading-relaxed text-[#1a1a1a] font-normal italic mb-12 border-l-4 border-[#ff3530] pl-6 py-2">
               {item.pfSnippet}
            </h3>

            {/* The Review Content (Generated) */}
            <div className="prose prose-lg pt-4 md:prose-xl prose-p:leading-loose prose-p:text-gray-800 prose-a:text-[#ff3530] max-w-none">
               {item.pfScore >= 7.5 ? (
                  <>
                     <p>
                        When evaluating the cultural footprint of contemporary ${(Array.isArray(item.genre) ? item.genre : [item.genre])[0]?.toLowerCase() || 'music'}, it becomes nearly impossible to ignore the gravitational pull of releases like <em>"{item.title}"</em>. The project doesn't merely exist within the streaming ecosystem; it actively interrogates it, demanding attention through sheer force of will and meticulous curation.
                     </p>
                     <p>
                        From the moment the needle drops—or, more accurately, the DSP caches the opening waveform—the artist's intent is crystallized. There is a palpable tension here, a push-and-pull between commercial viability and raw, unvarnished expression. Production choices feel deliberate, sometimes to the point of claustrophobia, but ultimately resolving into moments of stunning clarity.
                     </p>
                  </>
               ) : item.pfScore >= 5.0 ? (
                  <>
                     <p>
                        There is a palpable sense of transition on <em>"{item.title}"</em>. The project exists in a middle ground, neither completely successful in its ambitions nor entirely devoid of merit.
                     </p>
                     <p>
                        Production choices are competent but occasionally safe, reflecting an artist still navigating the expectations of their audience versus their own creative instincts in the sphere of contemporary ${(Array.isArray(item.genre) ? item.genre : [item.genre])[0]?.toLowerCase() || 'music'}.
                     </p>
                  </>
               ) : (
                  <>
                     <p>
                        It is often difficult to parse the intentions behind a release like <em>"{item.title}"</em>. The project feels disjointed, struggling to find a cohesive identity within an increasingly crowded musical landscape of ${(Array.isArray(item.genre) ? item.genre : [item.genre])[0]?.toLowerCase() || 'music'}.
                     </p>
                     <p>
                        From the clunky production choices to the meandering lyrical themes, there is a pervasive sense of missed opportunities. The artist seems trapped in a cycle of half-baked ideas that fail to resonate.
                     </p>
                  </>
               )}
               
               {['Album', 'EP'].includes(item.type) && trackReviews.length > 0 && (
                  <div className="my-14 border border-gray-200 bg-white p-6 shadow-sm">
                     <h4 className="text-lg font-sans font-bold uppercase tracking-widest mt-0 mb-6 flex items-center gap-2">
                         <span className="bg-[#1a1a1a] text-white px-2 py-1 rounded-sm text-xs">Track-by-Track</span> 
                         Analysis
                     </h4>
                     <ul className="list-none pl-0 m-0 space-y-6">
                        {trackReviews.map((tr: any, idx: number) => (
                           <li key={idx} className="flex flex-col sm:flex-row gap-4 sm:gap-6 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                              <div className="sm:w-32 shrink-0 flex items-center justify-start sm:justify-start gap-4">
                                 <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-[#ff3530] bg-[#fff] shadow-sm">{tr.score}</span>
                                    <span className="text-[8px] font-sans font-bold text-gray-400 uppercase tracking-widest mt-1 text-center">PF<br/>Score</span>
                                 </div>
                                 <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold w-12 h-12 rounded-full border border-gray-300 border-dashed flex items-center justify-center text-gray-700 bg-[#f9f9f9] shadow-sm">{tr.readerScore}</span>
                                    <span className="text-[8px] font-sans font-bold text-gray-400 uppercase tracking-widest mt-1 text-center">Reader<br/>Score</span>
                                 </div>
                              </div>
                              <div className="flex-1 mt-2 sm:mt-0">
                                 <h5 className="font-bold text-lg mb-1 mt-0">
                                    <span className="text-gray-400 font-sans text-xs mr-2">{idx + 1}.</span> 
                                    {tr.title}
                                 </h5>
                                 <p className="text-base m-0 text-gray-600 leading-normal">{tr.text}</p>
                              </div>
                           </li>
                        ))}
                     </ul>
                  </div>
               )}

               <p>
                  As the runtime draws to a close, what lingers isn't just the melodic earworms or the rhythmic syncopation, but the audacious scope of the ambition. Whether it fully achieves that ambition is up to the listener, but the attempt alone warrants serious consideration. It's a snapshot of an artist either approaching their zenith or bravely pivoting toward something radically new.
               </p>
            </div>

            {/* Reader Reviews Section */}
            <div className="mt-20 pt-16 border-t-[8px] border-[#1a1a1a]">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold tracking-tight uppercase font-sans">Reader Reviews</h3>
                  <div className="flex items-center gap-2">
                     <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                        <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                        <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                     </div>
                     <span className="text-xs font-sans font-bold text-gray-500 ml-2">{Math.floor(seededRandom(seed + 10) * 5000 + 100)} Ratings</span>
                  </div>
               </div>

               <div className="flex flex-col gap-6">
                  {/* Generated Reader Comments */}
                  {[...Array(3)].map((_, idx) => {
                      const rSeed = seed + 20 + idx;
                      const rScore = Math.max(1, Math.min(10, Math.round(item.readerScore + ((seededRandom(rSeed) * 4) - 2))));
                      const rName = ["MusicNerd99", "VinylJunkie", "PopStan101", "indiekid", "soundscapes"][Math.floor(seededRandom(rSeed + 1) * 5)];
                      const rComment = [
                          "Literally haven't stopped listening since it dropped. The production is flawless.",
                          "It's decent, but I feel like they played it a bit too safe this time around.",
                          "Masterpiece. No skips. AOTY contender for sure.",
                          "A few good tracks but the rest is just filler to boost streaming numbers.",
                          "Grows on you with every listen. The details in the mixing are insane.",
                      ][Math.floor(seededRandom(rSeed + 2) * 5)];

                      return (
                         <div key={idx} className="bg-[#f5f5f5] p-6 rounded-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3 border-b border-gray-300 pb-3">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center font-bold font-sans text-xs">{rName.substring(0, 2).toUpperCase()}</div>
                                  <span className="font-sans font-bold text-sm">{rName}</span>
                               </div>
                               <div className="flex items-center gap-1 font-bold font-sans text-[#ff3530]">
                                  {rScore} / 10
                               </div>
                            </div>
                            <p className="font-sans text-sm text-gray-700 leading-relaxed m-0">{rComment}</p>
                         </div>
                      );
                  })}
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}

function generateSnippet(title: string, score: number, seed: number) {
   const isGood = score >= 8.0;
   const isMid = score >= 6.0 && score < 8.0;

   if (isGood) {
      const texts = [
         `A sprawling, uncompromising triumph that solidifies their place in the upper echelon of modern music.`,
         `Sharp, cohesive, and relentlessly inventive. It is a thrilling pivot that pays off entirely.`,
         `A masterwork of emotional resonance and pristine production values that demands your full attention.`,
         `Bold, imaginative, and expertly executed. This is the sound of an artist operating at the absolute peak of their powers.`,
         `An audacious step forward that rewrites the rulebook while remaining incredibly accessible and instantly iconic.`,
         `It’s rare to hear a project so fully formed; an exquisite and deeply moving experience from start to finish.`,
         `A stunning testament to their artistic vision, layering complex thematic ideas beneath pristine pop sensibilities.`,
         `Every track is a revelation. A dense, rewarding listen that immediately demands a place in the modern canon.`,
         `Effortlessly cool and impossibly tight, proving once again why they remain one of the most vital voices today.`,
         `A dazzling collection of anthems that perfectly captures the cultural zeitgeist with shocking precision.`,
         `Radiant and unflinching—it is an album of astonishing maturity, marrying raw lyricism with lush sonics.`,
         `A defining moment in their discography, achieving a perfect synthesis of their past experiments and future potential.`,
         `Generous, expansive, and deeply human; it is a masterclass in how to craft an impactful, timeless record.`,
         `Gorgeously rendered and flawlessly paced, delivering emotional wallops and earworm hooks in equal measure.`,
         `An unequivocal masterpiece that will undoubtedly influence a generation of artists to come.`
      ];
      return texts[Math.floor(seededRandom(seed) * texts.length)];
   } else if (isMid) {
      const texts = [
         `While it has flashes of brilliance, the project struggles to maintain momentum across its runtime.`,
         `A pleasant but ultimately safe release that relies heavily on established formulas.`,
         `Sonically competent, though it lacks the sharp conceptual focus of their best work.`,
         `There are moments of genuine inspiration here, but they are too often buried under unnecessary production choices.`,
         `A transitional record that hints at greatness but settles for a comfortable, middle-of-the-road approach.`,
         `An uneven collection that charms and frustrates in equal measure; a few undeniable hits surrounded by filler.`,
         `It hits all the expected marks without ever truly transcending its genre constraints.`,
         `Competently executed, yet it missing the spark that made their previous efforts so captivating.`,
         `A serviceable addition to their catalog, though it's unlikely to win over any new converts.`,
         `The ideas are definitely present, but the execution often feels rushed or slightly unfocused.`,
         `A mixed bag: when it works, it soars, but there are far too many lulls to call it a complete success.`,
         `Pleasingly familiar, but lacking the risk-taking ingenuity we've come to expect from them.`,
         `It mostly coasts on the artist's natural charisma, offering little in the way of structural or sonic innovation.`,
         `An enjoyable, breezy listen that unfortunately evaporates from memory almost immediately after it finishes.`,
         `It delivers exactly what you'd expect—no more, no less—leaving a lingering desire for something bolder.`
      ];
      return texts[Math.floor(seededRandom(seed) * texts.length)];
   } else {
      const texts = [
         `A frustratingly derivative attempt that fails to capture what made them interesting in the first place.`,
         `Buried under overproduction and weak lyricism, this is a distinct step backward.`,
         `A meandering collection of half-baked ideas searching for a cohesive identity.`,
         `A glaring misfire that mistakes hollow posturing for genuine artistic depth.`,
         `Uninspired, repetitive, and plagued by baffling choices that alienate the listener entirely.`,
         `A creatively bankrupt release that feels more like a contractual obligation than an artistic statement.`,
         `The magic is entirely gone, replaced by cynical trend-chasing and remarkably bland compositions.`,
         `A tedious, exhausting listen that reveals an artist completely disconnected from their own strengths.`,
         `Clunky, awkward, and surprisingly amateurish; it is a project that never justifies its own existence.`,
         `A lifeless imitation of current trends that manages to feel dated before the first track even finishes.`,
         `It aims for profound but lands squarely in the realm of the forgettable and the obnoxious.`,
         `Woefully undercooked. It is difficult to understand how this was approved for release in its current state.`,
         `An outright disaster that abandons every redeeming quality the artist previously possessed.`,
         `Sluggish and entirely devoid of charm, resulting in a remarkably dull listening experience.`,
         `A jarringly messy collection of tracks that fundamentally miscalculates what audiences want.`
      ];
      return texts[Math.floor(seededRandom(seed) * texts.length)];
   }
}
