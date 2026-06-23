import React, { useState } from 'react';
import { GameState, Release, Song, Album, Video } from '../types';
import { ArrowLeft, Search, MoreVertical, Bell, ShoppingBag, Plus, Home, MonitorPlay, User as UserIcon, PlaySquare, Music, ChevronDown, Disc, Upload, Compass, Loader2, ThumbsUp, ThumbsDown, Share2, Download, MessageSquare } from 'lucide-react';
import { RECORD_LABELS } from '../recordLabels';
import { NPC_ARTISTS } from '../constants';
import { ARTIST_PICS } from '../artistPics';
import { ARTIST_IMAGES } from '../artistImages';

interface YouTubeViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
}

const itunesThumbnailCache: Record<string, string> = {};

function VideoThumbnail({ title, artist, defaultImage, className }: { title: string, artist: string, defaultImage?: string, className?: string }) {
  const cacheKey = `${title}-${artist}`;
  const [img, setImg] = useState<string | undefined>(itunesThumbnailCache[cacheKey] || defaultImage);

  React.useEffect(() => {
     if (itunesThumbnailCache[cacheKey] || !NPC_ARTISTS.some(n => n.name === artist)) return;
     let active = true;
     const fetchItunes = async () => {
         try {
             // Remove (feat. ...) from title for better search results
             const cleanTitle = title.replace(/\s*\(feat\..*\)/i, '').replace(/\s*\(with\s+.*\)/i, '').trim();
             const searchTerm = encodeURIComponent(artist + " " + cleanTitle);
             let res = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=musicVideo&limit=5`);
             let data = await res.json();
             
             if (!data.results || data.results.length === 0) {
                 res = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=5`);
                 data = await res.json();
             }

             if (data.results && data.results.length > 0) {
                 const artistMatch = data.results.filter((r: any) => r.artistName.toLowerCase().includes(artist.toLowerCase()) || artist.toLowerCase().includes(r.artistName.toLowerCase()));
                 const bestMatch = artistMatch.find((r: any) => {
                     const t = (r.trackName || '').toLowerCase();
                     const c = cleanTitle.toLowerCase();
                     return t.includes(c) || c.includes(t);
                 });
                 if (bestMatch) {
                     // Replace with 16:9 high quality crop (cc = crop center) to avoid white borders or circles
                     let hq = bestMatch.artworkUrl100?.replace('100x100bb.jpg', '800x450cc.jpg').replace('100x100bb', '800x450cc');
                     if (hq && active) {
                         itunesThumbnailCache[cacheKey] = hq;
                         setImg(hq);
                     }
                 } else {
                     itunesThumbnailCache[cacheKey] = defaultImage || '';
                     if (active) setImg(defaultImage);
                 }
             } else {
                 itunesThumbnailCache[cacheKey] = defaultImage || '';
                 if (active) setImg(defaultImage);
             }
         } catch (e) {
             // Ignore error
         }
     };
     fetchItunes();
     return () => { active = false; };
  }, [title, artist, defaultImage, cacheKey]);

  return img ? <img src={img} className={className} /> : null;
}

export function YouTubeView({ gameState, setGameState, onClose }: YouTubeViewProps) {
  const [appTab, setAppTab] = useState<'home' | 'explore' | 'profile'>('home');
  const [viewArtist, setViewArtist] = useState<string | null>(null); // null = player, string = npc name
  const [activeProfileTab, setActiveProfileTab] = useState<'video' | 'releases'>('video');
  const [videoSort, setVideoSort] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTrackId, setUploadTrackId] = useState('');
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [topSearchQuery, setTopSearchQuery] = useState('');
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [playingVideoDetails, setPlayingVideoDetails] = useState<any>(null);
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(false);
  const [uploadBudget, setUploadBudget] = useState(10000);
  const [uploadThumbnail, setUploadThumbnail] = useState('');
  
  const getImg = (name: string) => {
      if (name === 'Recording Academy / GRAMMYs') {
          return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23111111' /%3E%3Cg transform='translate(15, -10)'%3E%3Cpolygon points='60,150 140,150 155,175 45,175' fill='%23D4AF37' /%3E%3Crect x='70' y='135' width='60' height='15' fill='%23D4AF37' /%3E%3Cpath d='M 100,135 Q 150,110 130,70' fill='none' stroke='%23D4AF37' stroke-width='8' stroke-linecap='round'/%3E%3Cellipse cx='80' cy='80' rx='45' ry='30' fill='%23D4AF37' transform='rotate(-30 80 80)' /%3E%3Cellipse cx='80' cy='80' rx='35' ry='20' fill='%23111111' transform='rotate(-30 80 80)' /%3E%3C/g%3E%3C/svg%3E";
      }
      return name === gameState.artist?.name ? (gameState.artist.image || undefined) : (ARTIST_PICS[name] || ARTIST_IMAGES[name] || undefined);
  };

  // Player releases
  const eligibleReleases = gameState.releases.filter(r => !(r as any).isNPCRelease && (r.status === 'Published' || r.status === 'Scheduled'));
  const publishedReleases = gameState.releases.filter(r => !(r as any).isNPCRelease && r.status === 'Published' && !(r.type === 'Single' && (r as Song).isBSide));
  
  // NPC releases
  const npcPublishedReleases = gameState.releases.filter(r => (r as any).isNPCRelease && r.status === 'Published' && !(r.type === 'Single' && (r as Song).isBSide));

  const playerSongs = gameState.releases.filter(r => r.type === 'Single' && !(r as any).isNPCRelease) as Song[];

  const currentDateObj = new Date(gameState.time.startDate);
  currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed);

  const npcVideos: Video[] = gameState.releases
    .filter(r => (r as any).isNPCRelease && r.status === 'Published' && r.type === 'Single' && !(r as any).isBSide)
    .map(r => {
        const hash = (r.title.charCodeAt(0) || 0) + (r.title.charCodeAt(r.title.length - 1) || 0) + r.title.length;
        const mvMultiplier = 0.5 + ((hash % 20) / 10);
        const daysSincePublished = Math.max(1, Math.floor((currentDateObj.getTime() - new Date(r.releaseDate || gameState.time.startDate).getTime()) / (1000 * 3600 * 24)));
        const totalAudio = r.streams?.youtubeMusic || 100000;
        const avgDailyAudio = totalAudio / daysSincePublished;
        const mvIntegral = avgDailyAudio * 2.5 * (daysSincePublished + 14);
        const views = Math.floor(mvIntegral * mvMultiplier);
        return {
            id: `vid_npc_${r.id}`,
            songId: r.id,
            title: `${(r as any).artistId} - ${r.title} (Official Music Video)`,
            type: 'MusicVideo',
            publishDate: r.releaseDate || gameState.time.startDate,
            views: views || 0,
            budget: 0,
            thumbnail: r.coverImage
        } as Video;
    });

  const playerVideos = gameState.videos || [];
  
  const prestigiousCategories = ['Artist of the Year', 'Album of the Year', 'Song of the Year', 'Record of the Year'];
  const grammyVideos: any[] = [];
  
  (gameState.grammys?.history || []).forEach(yearHistory => {
     prestigiousCategories.forEach(cat => {
         const wonNom = yearHistory.nominations.find(n => n.category === cat && n.won);
         if (wonNom) {
             const nominee = wonNom.nominee;
             const npc = NPC_ARTISTS.find(n => n.name === nominee.artist);
             let baseViewsNum = 500000;
             if (nominee.isPlayer && gameState.popularity) {
                 const totalPop = ((gameState.popularity.america || 0) + (gameState.popularity.europe || 0) + (gameState.popularity.latinAmerica || 0)) / 3;
                 baseViewsNum = 500000 + Math.floor(totalPop * 90000); // Max ~9.5M
             } else if (npc) {
                 const estimatedPop = Math.min(100, npc.basePoints / 150);
                 baseViewsNum = 500000 + Math.floor(estimatedPop * 90000); // Max ~9.5M
             }
             
             const yearDiff = new Date(gameState.time.startDate).getFullYear() + Math.floor(gameState.time.daysPassed / 365) - yearHistory.year;
             const daysAgo = Math.max(1, yearDiff * 365 + 30);
             
             const totalViews = Math.floor(baseViewsNum + (Math.log10(daysAgo + 1) * baseViewsNum * 0.15));
             const dailyViews = Math.floor((baseViewsNum * 0.05) / Math.pow(daysAgo, 0.6));

             const title = `${nominee.artist} Wins ${cat} | ${yearHistory.year} GRAMMYs`;
             const songId = `grammy_${yearHistory.year}_${cat.replace(/\s+/g,'_')}`;
             
             const artistImgSrc = getImg(nominee.artist) || '';
             let artistImgSvg = '';
             if (artistImgSrc) {
                artistImgSvg = `<image href='${artistImgSrc}' x='20' y='140' width='60' height='60' preserveAspectRatio='xMidYMid slice' clip-path='url(#circleclip)' />`;
             }
             
             let coverImgSrc = nominee.coverImage || '';
             let coverImgSvg = '';
             if (coverImgSrc) {
                coverImgSvg = `<image href='${coverImgSrc}' x='320' y='140' width='60' height='60' preserveAspectRatio='xMidYMid slice' />`;
             }
             
             const safeArtist = (nominee.artist || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
             const safeCat = (cat || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
             const safeWork = (nominee.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
             
             const rawSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'><defs><clipPath id='circleclip'><circle cx='50' cy='170' r='30' /></clipPath></defs><rect width='400' height='225' fill='#111111' /><text x='200' y='60' font-family='sans-serif' font-weight='bold' font-size='20' fill='#D4AF37' text-anchor='middle'>${safeCat}</text><text x='200' y='100' font-family='sans-serif' font-weight='bold' font-size='24' fill='#FFFFFF' text-anchor='middle'>${safeArtist}</text><text x='200' y='130' font-family='sans-serif' font-size='16' fill='#AAAAAA' text-anchor='middle'>${safeWork}</text>${artistImgSvg}${coverImgSvg}</svg>`;
             
             grammyVideos.push({
                 id: songId,
                 songId: songId,
                 title: title,
                 views: totalViews,
                 budget: 0,
                 thumbnail: `data:image/svg+xml,${encodeURIComponent(rawSvg)}`,
                 artistId: 'Recording Academy / GRAMMYs',
                 publishDate: new Date(new Date(gameState.time.startDate).getTime() + (daysAgo * 86400000)).toISOString(),
                 lastDailyViews: dailyViews
             });
         }
     });
  });

  const allVideos = [...playerVideos, ...npcVideos, ...grammyVideos];

  // Combine properly
  const getArtistStr = (r: any) => {
      const pName = gameState.artist?.name || 'You';
      if (!r) return pName;
      if ((r as any).isNPCRelease) return (r as any).artistId || pName;
      if (r.isNPCCollab) return `${r.collaborator} & ${pName}`;
      if (r.type === 'Single' && r.collaborator) return `${pName} & ${r.collaborator}`;
      return pName;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { compressImage } = await import('../imageUtils');
        const compressed = await compressImage(file, 400, 400, 0.7);
        setUploadThumbnail(compressed);
      } catch (err) {
        console.error("Compression err", err);
      }
    }
  };

  const handleUpload = () => {
    if (!uploadTrackId) return;
    const song = playerSongs.find(s => s?.id === uploadTrackId);
    if (!song) return;
    
    let cost = uploadBudget;
    const labelId = gameState.artist?.labelContract?.labelId;
    const currentLabel = RECORD_LABELS.find(l => l.id === labelId);
    if (currentLabel?.benefits.freeMusicVideo) {
        cost = 0;
    }

    if (gameState.stats.money < cost) {
      alert("Not enough money!");
      return;
    }

    const currentDate = new Date(gameState.time.startDate);
    currentDate.setDate(currentDate.getDate() + gameState.time.daysPassed);

    let pubDate = currentDate.toISOString();
    if (song.status === 'Scheduled' && song.releaseDate) {
        pubDate = song.releaseDate; // matches scheduled song date
    }

    const newVideo: Video = {
      id: `vid_${Date.now()}`,
      songId: song.id,
      title: `${getArtistStr(song)} - ${song.title} (Official Music Video)`,
      type: 'MusicVideo',
      publishDate: pubDate,
      views: 0,
      budget: uploadBudget,
      thumbnail: uploadThumbnail || song.coverImage
    };

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          money: prev.stats.money - cost
        },
        videos: [...(prev.videos || []), newVideo]
      };
    });

    setShowUploadModal(false);
    setUploadTrackId('');
    setUploadBudget(10000);
    setUploadThumbnail('');
    setActiveProfileTab('video');
    setAppTab('profile');
    setViewArtist(null);
  };

  const formatViews = (views: number) => {
     if (views >= 1000000000) {
        return (views / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'B';
     } else if (views >= 1000000) {
        return (views / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M';
     } else if (views >= 1000) {
        return (views / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 }) + 'K';
     }
     return views.toLocaleString('en-US');
  };

  const getSubscribers = (artistName: string | null) => {
     if (!artistName || artistName === gameState.artist?.name) {
        if (gameState.stats.youtubeSubscribers !== undefined) return gameState.stats.youtubeSubscribers;
        const totalPop = (gameState.popularity.america + gameState.popularity.europe + gameState.popularity.latinAmerica) / 3;
        return Math.floor(gameState.stats.streams * 0.05 + totalPop * 10000);
     } else if (artistName === 'Recording Academy / GRAMMYs') {
        return 5000000;
     } else {
        const npc = NPC_ARTISTS.find(n => n.name === artistName);
        if (!npc) return Math.floor((artistName.charCodeAt(0) || 10) * 80000); // fallback
        return Math.floor(npc.basePoints * 650 + (npc.name.charCodeAt(0) * 40000));
     }
  };
  
  const timeAgo = (dateStr: string) => {
     if (!dateStr) return "";
     const publishDate = new Date(dateStr);
     const currentDate = new Date(gameState.time.startDate);
     currentDate.setDate(currentDate.getDate() + gameState.time.daysPassed);
     
     const diffTime = currentDate.getTime() - publishDate.getTime();
     if (diffTime < 0) {
        const daysUntil = Math.ceil(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
        return `Premieres in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
     }
     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
     
     if (diffDays === 0) return "Today";
     if (diffDays === 1) return "1 day ago";
     if (diffDays < 7) return `${diffDays} days ago`;
     if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
     if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
     return `${Math.floor(diffDays / 365)} years ago`;
  };

  const currentArtistName = viewArtist || gameState.artist?.name || 'You';
  const currentArtistImage = getImg(currentArtistName);
  const currentSubs = formatViews(getSubscribers(viewArtist));
  
  const currentPublishedReleases = viewArtist ? npcPublishedReleases.filter(r => (r as any).artistId === viewArtist) : publishedReleases;
  let currentVideos: any[] = [];
  if (viewArtist === 'Recording Academy / GRAMMYs') {
      currentVideos = grammyVideos.filter(v => v.artistId === 'Recording Academy / GRAMMYs');
  } else if (viewArtist) {
      currentVideos = [
          ...npcVideos.filter(v => gameState.releases.find(s => s.id === v.songId && (s as any).artistId === viewArtist)),
          ...grammyVideos.filter(v => v.artistId === viewArtist)
      ];
  } else {
      const playerName = gameState.artist?.name || 'Player';
      currentVideos = [
          ...playerVideos,
          ...grammyVideos.filter(v => v.artistId === playerName)
      ];
  }

  const playVideo = async (title: string, artistName: string) => {
      setIsLoadingPlayer(true);
      try {
          const cleanTitle = title.replace(/\s*\(feat\..*\)/i, '').replace(/\s*\(with\s+.*\)/i, '').replace(/\[.*\]/g, '').replace(/\(.*\)/g, '').trim();
          let searchArtist = artistName;
          if (artistName === 'Recording Academy / GRAMMYs') {
              searchArtist = title.split('-')[0].trim();
          }

          const searchTerm = encodeURIComponent(searchArtist + " " + cleanTitle);
          let res = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=musicVideo&limit=5`);
          let data = await res.json();
          let url = "";

          if (data.results && data.results.length > 0) {
              const artistMatch = data.results.filter((r: any) => r.artistName.toLowerCase().includes(searchArtist.toLowerCase()) || searchArtist.toLowerCase().includes(r.artistName.toLowerCase()));
              const bestMatch = artistMatch.find((r: any) => {
                  const t = (r.trackName || '').toLowerCase();
                  const c = cleanTitle.toLowerCase();
                  return t.includes(c) || c.includes(t);
              }) || artistMatch[0] || data.results[0];
              
              if (bestMatch && bestMatch.previewUrl) url = bestMatch.previewUrl;
          }

          if (!url) {
              res = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=5`);
              data = await res.json();
              if (data.results && data.results.length > 0) url = data.results[0].previewUrl;
          }

          if (url) {
              setPlayingVideoUrl(url);
          } else {
              setPlayingVideoUrl(""); // No fallback
          }
      } catch {
          setPlayingVideoUrl("");
      }
      setIsLoadingPlayer(false);
  }

  const handleVideoClick = (id: string, sId: string, artistName?: string, videoTitle?: string) => {
     if (videoTitle && artistName) {
         const videoObj = allVideos.find(v => v.id === id);
         const song = gameState.releases.find(r => r.id === sId);
         setPlayingVideoDetails({
             id,
             songId: sId,
             title: videoTitle,
             artistName,
             views: videoObj ? videoObj.views : (song ? ((song as any).streams?.youtubeMusic || 500000) : 500000),
             publishDate: videoObj ? videoObj.publishDate : (song ? song.releaseDate : new Date().toISOString()),
             thumbnail: videoObj?.thumbnail || song?.coverImage || undefined
         });
     }
  };

  const getDailyViews = (v: Video & { lastDailyViews?: number }) => {
      if (v.lastDailyViews !== undefined) return v.lastDailyViews;
      // Fallback
      const song = gameState.releases.find(r => r.id === v.songId);
      return song?.lastDailyStreams?.youtubeMusic || Math.floor(v.views * 0.05); // Estimate if not found
  };

  const topVideosByDaily = [...allVideos].sort((a,b) => getDailyViews(b) - getDailyViews(a)).slice(0, 50);

  const grammyAccount = { name: 'Recording Academy / GRAMMYs', basePoints: 500000, type: 'Pop' as any };
  const allSearchNpcs = [...NPC_ARTISTS.filter(n => !gameState.artist?.name || n.name.toLowerCase() !== gameState.artist.name.toLowerCase()), grammyAccount];
  const matchedNpcs = allSearchNpcs.filter(a => a.name.toLowerCase().includes(topSearchQuery.toLowerCase()));

  return (
    <div className="w-[400px] h-full bg-[#0f0f0f] text-white flex flex-col relative font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-[#0f0f0f] z-10 sticky top-0">
        <button onClick={onClose} className="p-2 hover:bg-white/10 text-white rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 text-white rounded-full transition-colors flex items-center gap-2 font-bold text-lg">
             YouTube
          </button>
        </div>
        <div className="flex items-center gap-2">
          {appTab === 'explore' ? null : (
            <button onClick={() => setAppTab('explore')} className="p-2 hover:bg-white/10 text-white rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 hover:bg-white/10 text-white rounded-full transition-colors">
             <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
         {appTab === 'home' && (
            <div className="flex flex-col p-4 bg-[#0f0f0f]">
               <h2 className="text-xl font-bold mb-4 px-1">Beranda</h2>
               <div className="flex flex-col gap-6">
                  {[...allVideos].sort((a,b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).map(v => {
                     const song = gameState.releases.find(r => r.id === v.songId);
                     const aName = (v as any).artistId || (song as any)?.artistId || gameState.artist?.name || 'You';
                     return (
                        <div key={v.id} className="flex flex-col cursor-pointer" onClick={() => handleVideoClick(v.id, v.songId, aName, v.title)}>
                           <div className="w-full aspect-video bg-zinc-800 relative mb-3 overflow-hidden rounded-xl">
                              <VideoThumbnail title={song?.title || v.title} artist={aName} defaultImage={v.thumbnail} className="w-full h-full object-cover" />
                              <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[11px] font-medium font-mono text-white flex items-center">
                                 <Music className="w-3 h-3 mr-1" /> 3:45
                              </div>
                           </div>
                           <div className="flex gap-3 px-1">
                              <img src={getImg(aName)} className="w-10 h-10 rounded-full object-cover shrink-0" />
                              <div className="flex flex-col">
                                 <h3 className="text-[15px] font-medium line-clamp-2 leading-tight text-white mb-1">{v.title}</h3>
                                 <p className="text-[13px] text-white/60">{aName} • {formatViews(v.views)} views • {timeAgo(v.publishDate)}</p>
                              </div>
                           </div>
                        </div>
                     )
                  })}
                  {allVideos.length === 0 && <p className="text-white/50 text-center py-10 mt-10">No videos exist yet.</p>}
               </div>
            </div>
         )}

         {appTab === 'explore' && (
            <div className="flex flex-col bg-[#0f0f0f]">
               <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-white/10 p-4">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                     <input 
                        type="text" 
                        value={topSearchQuery}
                        onChange={e => setTopSearchQuery(e.target.value)}
                        placeholder="Search artists or hit videos..." 
                        className="w-full bg-[#212121] text-white pl-10 pr-4 py-2.5 rounded-full outline-none focus:bg-[#272727] transition-colors"
                     />
                  </div>
               </div>

               {topSearchQuery && (
                  <div className="p-4 border-b border-white/10">
                     <h3 className="font-bold text-white mb-3">Artists</h3>
                     <div className="flex flex-col">
                        {matchedNpcs.slice(0, 5).map(npc => (
                           <div key={npc.name} onClick={() => { setViewArtist(npc.name); setAppTab('profile'); setTopSearchQuery(''); }} className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                              <img src={getImg(npc.name)} className="w-12 h-12 rounded-full object-cover" />
                              <div className="flex flex-col">
                                 <span className="font-medium text-white">{npc.name}</span>
                                 <span className="text-sm text-white/60">Artist</span>
                              </div>
                           </div>
                        ))}
                        {gameState.artist?.name.toLowerCase().includes(topSearchQuery.toLowerCase()) && (
                           <div onClick={() => { setViewArtist(null); setAppTab('profile'); setTopSearchQuery(''); }} className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                              <img src={getImg(gameState.artist?.name)} className="w-12 h-12 rounded-full object-cover" />
                              <div className="flex flex-col">
                                 <span className="font-medium text-white">{gameState.artist?.name}</span>
                                 <span className="text-sm text-white/60">Artist</span>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               <div className="p-4 pt-6">
                  <h2 className="text-xl font-bold mb-4 px-1 flex items-center">
                     <MonitorPlay className="w-6 h-6 mr-2 text-red-500" />
                     Top 50 Music Video
                  </h2>
                  <p className="text-white/50 text-xs px-1 mb-6 uppercase tracking-widest font-bold">Based on daily views</p>
                  
                  <div className="flex flex-col">
                     {topVideosByDaily.map((v, i) => {
                        const song = gameState.releases.find(r => r.id === v.songId);
                        const aName = (v as any).artistId || (song as any)?.artistId || gameState.artist?.name || 'You';
                        return (
                           <div key={v.id} className="flex gap-4 p-2 mb-2 items-center cursor-pointer hover:bg-white/5 rounded-lg transition-colors" onClick={() => handleVideoClick(v.id, v.songId, aName, v.title)}>
                              <div className="text-xl font-bold text-white/40 w-6 text-center">{i + 1}</div>
                              <div className="w-32 aspect-video bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                                 <VideoThumbnail title={song?.title || v.title} artist={aName} defaultImage={v.thumbnail} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col flex-1">
                                 <h3 className="text-[14px] font-medium line-clamp-2 leading-tight text-white mb-[3px] group-hover:text-blue-400 transition-colors">{v.title}</h3>
                                 <p className="text-[12px] text-white/60">{aName}</p>
                                 <p className="text-[12px] text-white/40">{formatViews(getDailyViews(v))} daily views</p>
                              </div>
                           </div>
                        )
                     })}
                     {topVideosByDaily.length === 0 && <p className="text-white/50">No music videos available.</p>}
                  </div>
               </div>
            </div>
         )}

         {appTab === 'profile' && (
            <div className="flex flex-col pb-6">
               {/* Banner */}
               <div className="w-full h-32 md:h-40 bg-zinc-800">
                  {viewArtist === 'Recording Academy / GRAMMYs' ? (
                     <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Crect width='800' height='200' fill='%23111111' /%3E%3Cg transform='translate(100, 25) scale(0.75)'%3E%3Cpolygon points='60,150 140,150 155,175 45,175' fill='%23D4AF37' /%3E%3Crect x='70' y='135' width='60' height='15' fill='%23D4AF37' /%3E%3Cpath d='M 100,135 Q 150,110 130,70' fill='none' stroke='%23D4AF37' stroke-width='8' stroke-linecap='round'/%3E%3Cellipse cx='80' cy='80' rx='45' ry='30' fill='%23D4AF37' transform='rotate(-30 80 80)' /%3E%3Cellipse cx='80' cy='80' rx='35' ry='20' fill='%23111111' transform='rotate(-30 80 80)' /%3E%3C/g%3E%3Ctext x='250' y='90' font-family='sans-serif' font-size='20' fill='%23FFFFFF' letter-spacing='4'%3ERECORDING ACADEMY%3C/text%3E%3Ctext x='250' y='135' font-family='sans-serif' font-weight='bold' font-size='48' fill='%23FFFFFF'%3EGRAMMY AWARDS%3C/text%3E%3C/svg%3E" alt="Banner" className="w-full h-full object-cover" />
                  ) : !viewArtist && gameState.artist?.socialProfile?.bannerUrl ? (
                     <img src={gameState.artist.socialProfile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : currentArtistImage ? (
                     <div className="w-full h-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center blur-md opacity-50 transform scale-110" style={{ backgroundImage: `url(${currentArtistImage})` }}></div>
                     </div>
                  ) : null}
               </div>

               {/* Profile Info */}
               <div className="px-4 mt-3 flex flex-col items-start text-left">
                  <div className="flex items-center gap-4 mb-3">
                     <div className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                        {currentArtistImage ? <img src={currentArtistImage} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-5 w-10 h-10 text-zinc-600" />}
                     </div>
                     
                     <div className="flex flex-col">
                        <h1 className="text-2xl font-bold flex items-center gap-1.5">
                           {currentArtistName}
                           <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-zinc-400"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>
                        </h1>
                        <p className="text-white/60 text-[13px] mt-0.5 tracking-wide">@{currentArtistName.replace(/\s+/g, '')}</p>
                        <p className="text-white/60 text-[13px] mt-0.5">{currentSubs} subscriber • {currentVideos.length + currentPublishedReleases.length} video</p>
                     </div>
                  </div>
                  
                  <p className="text-white/80 text-[13px] leading-snug line-clamp-2 w-full mt-1">
                     {!viewArtist && gameState.artist?.socialProfile?.bio ? gameState.artist.socialProfile.bio : `Welcome to the official YouTube channel for ${currentArtistName}.`}
                  </p>
                  
                  <div className="flex w-full gap-2 mt-4">
                     <button className="flex-1 bg-[#272727] hover:bg-[#3f3f3f] py-2 rounded-full font-medium text-[13px] flex items-center justify-center gap-2 transition-colors">
                        <Bell className="w-4 h-4" /> Subscribe
                     </button>
                  </div>
               </div>

               {/* Tabs Navigation */}
               <div className="sticky top-0 z-20 bg-[#0f0f0f]">
                  <div className="flex border-b border-white/10 mt-4 overflow-x-auto hide-scrollbar px-4">
                     <button 
                        onClick={() => setActiveProfileTab('video')}
                        className={`py-3 mr-6 font-medium text-[14px] shrink-0 border-b-2 transition-colors ${activeProfileTab === 'video' ? 'text-white border-white' : 'text-white/60 border-transparent hover:text-white/80'}`}
                     >
                        Videos
                     </button>
                     <button 
                        onClick={() => { setActiveProfileTab('releases'); setSelectedReleaseId(null); }}
                        className={`py-3 mr-6 font-medium text-[14px] shrink-0 border-b-2 transition-colors ${activeProfileTab === 'releases' ? 'text-white border-white' : 'text-white/60 border-transparent hover:text-white/80'}`}
                     >
                        Releases
                     </button>
                  </div>
               </div>

               {/* Content Area */}
               <div className="p-0">
                  {activeProfileTab === 'video' && (
                     <div className="flex flex-col">
                        <div className="flex gap-2 p-3">
                           <button 
                              onClick={() => setVideoSort('latest')}
                              className={`px-3 py-1 font-medium text-[13px] rounded-lg transition-colors ${videoSort === 'latest' ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>
                              Latest
                           </button>
                           <button 
                              onClick={() => setVideoSort('popular')}
                              className={`px-3 py-1 font-medium text-[13px] rounded-lg transition-colors ${videoSort === 'popular' ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>
                              Popular
                           </button>
                           <button 
                              onClick={() => setVideoSort('oldest')}
                              className={`px-3 py-1 font-medium text-[13px] rounded-lg transition-colors ${videoSort === 'oldest' ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>
                              Oldest
                           </button>
                        </div>
                        
                        {currentVideos.length === 0 ? (
                           <div className="flex flex-col items-center justify-center py-16 text-white/40">
                              <MonitorPlay className="w-16 h-16 mb-4 opacity-50" />
                              <p>No videos uploaded yet.</p>
                           </div>
                        ) : (
                           <div className="flex flex-col">
                              {[...currentVideos].sort((a, b) => {
                                 if (videoSort === 'popular') return b.views - a.views;
                                 if (videoSort === 'oldest') return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
                                 return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
                              }).map(video => {
                                 const song = gameState.releases.find(s => s.id === video.songId);
                                 const artistName = (video as any).artistId || (song as any)?.artistId || gameState.artist?.name || 'You';
                                 return (
                                    <div key={video.id} className="flex gap-3 p-3 cursor-pointer hover:bg-white/5 rounded-lg transition-colors" onClick={() => handleVideoClick(video.id, video.songId, artistName, video.title)}>
                                       <div className="w-40 aspect-video bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                                          <VideoThumbnail title={song?.title || video.title} artist={artistName} defaultImage={video.thumbnail || song?.coverImage} className="w-full h-full object-cover" />
                                          <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-medium font-mono text-white flex items-center">
                                             <Music className="w-3 h-3 mr-1" /> 3:45
                                          </div>
                                       </div>
                                       <div className="flex flex-col flex-1">
                                          <h3 className="text-[14px] font-medium line-clamp-2 leading-tight text-white mb-[3px]">{video.title}</h3>
                                          <p className="text-[12px] text-white/60">{formatViews(video.views)} views • {timeAgo(video.publishDate)}</p>
                                       </div>
                                       <button className="p-1 h-fit text-white/60">
                                          <MoreVertical className="w-4 h-4" />
                                       </button>
                                    </div>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                  )}

                  {activeProfileTab === 'releases' && !selectedReleaseId && (
                     <div className="flex flex-col pt-3">
                        {[...currentPublishedReleases].reverse().map(release => (
                           <div key={release.id} onClick={() => setSelectedReleaseId(release.id)} className="flex gap-4 p-3 items-center cursor-pointer hover:bg-white/5 transition-colors">
                              <div className="w-32 h-32 bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                                 {release.coverImage ? <img src={release.coverImage} className="w-full h-full object-cover" /> : null}
                                 <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[11px] font-medium font-mono text-white flex items-center">
                                    <Music className="w-3 h-3 mr-1" /> 
                                    {release.type === 'Album' ? (release as Album).trackIds.length : 1}
                                 </div>
                              </div>
                              <div className="flex flex-col flex-1">
                                 <h3 className="text-base font-medium line-clamp-2 leading-tight text-white mb-1">{release.title}</h3>
                                 <p className="text-sm text-white/60">{getArtistStr(release)} • {release.type}</p>
                              </div>
                              <button className="p-2 text-white/60">
                                 <MoreVertical className="w-5 h-5" />
                              </button>
                           </div>
                        ))}
                        {currentPublishedReleases.length === 0 && (
                           <div className="flex flex-col items-center justify-center py-16 text-white/40">
                              <Disc className="w-16 h-16 mb-4 opacity-50" />
                              <p>No releases yet.</p>
                           </div>
                        )}
                     </div>
                  )}

                  {activeProfileTab === 'releases' && selectedReleaseId && (() => {
                     const release = currentPublishedReleases.find(r => r.id === selectedReleaseId);
                     if (!release) return null;
                     
                     let releaseTracks: Song[] = [];
                     let totalViews = 0;
                     if (release.type === 'Album') {
                        const album = release as Album;
                        releaseTracks = album.trackIds.map(tid => gameState.releases.find(s => s.id === tid)).filter(Boolean) as Song[];
                     } else {
                        releaseTracks = [release as Song];
                     }

                     totalViews = releaseTracks.reduce((acc, t) => acc + (t.streams.youtubeMusic || Math.floor(t.streams.spotify * 0.3) || 500000), 0);

                     return (
                        <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                           <div className="p-6 pb-2 relative overflow-hidden flex flex-col items-center">
                              <div className="absolute inset-0 z-0">
                                 {release.coverImage && <div className="w-full h-full bg-cover bg-center opacity-30 blur-2xl transform scale-110" style={{ backgroundImage: `url(${release.coverImage})` }}></div>}
                                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f0f0f]"></div>
                              </div>
                              
                              <button onClick={() => setSelectedReleaseId(null)} className="absolute top-4 left-4 p-2 z-10 text-white/80 hover:text-white bg-black/40 rounded-full">
                                 <ArrowLeft className="w-5 h-5" />
                              </button>

                              <div className="w-48 h-48 bg-zinc-800 shadow-2xl relative z-10 rounded mb-6">
                                 {release.coverImage && <img src={release.coverImage} className="w-full h-full object-cover rounded" />}
                              </div>
                              <h2 className="text-2xl font-bold text-center z-10 relative mb-1">{release.title}</h2>
                              <p className="text-sm font-medium text-white/60 z-10 relative">Playlist • {releaseTracks.length} video • {formatViews(totalViews)} views</p>
                              
                              <div className="flex items-center gap-3 w-full mt-6 z-10 relative">
                                 <button className="flex-1 bg-white hover:bg-gray-200 text-black py-2.5 rounded-full font-bold flex items-center justify-center gap-2 transition-colors">
                                    <PlaySquare className="w-5 h-5 fill-current" /> Play all
                                 </button>
                                 <button className="w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
                                    <Plus className="w-5 h-5" />
                                 </button>
                              </div>
                           </div>

                           <div className="flex flex-col mt-4">
                              {releaseTracks.map((track) => {
                                 const trackViews = track.streams.youtubeMusic || Math.floor(track.streams.spotify * 0.3) || Math.floor((track as any).totalStreams * 0.3) || 500000;
                                 const artistName = getArtistStr(release);
                                 const videoTitle = `${artistName} - ${track.title} (Official Audio)`;
                                 return (
                                    <div key={track.id} className="flex gap-4 p-3 px-4 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleVideoClick(track.id, track.id, artistName, videoTitle)}>
                                       <div className="w-32 aspect-video bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                                          {release.coverImage ? <img src={release.coverImage} className="w-full h-full object-cover" /> : null}
                                          <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-medium font-mono text-white flex items-center">
                                             <Music className="w-3 h-3 mr-1" /> 3:20
                                          </div>
                                       </div>
                                       <div className="flex flex-col flex-1 justify-center">
                                          <h3 className="text-[14px] font-medium line-clamp-2 leading-tight text-white mb-[3px] group-hover:text-blue-400 transition-colors">{getArtistStr(release)} - {track.title} (Official Audio)</h3>
                                          <p className="text-[12px] text-white/60">{formatViews(trackViews)} views • {timeAgo(release.releaseDate || "")}</p>
                                       </div>
                                       <button className="p-2 h-fit text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <MoreVertical className="w-5 h-5" />
                                       </button>
                                    </div>
                                 );
                              })}
                           </div>
                           <div className="h-6"></div>
                        </div>
                     );
                  })()}
               </div>
            </div>
         )}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 py-2 z-20 pb-4">
         <button onClick={() => setAppTab('home')} className={`flex flex-col items-center gap-1 transition-colors px-4 py-1 ${appTab==='home'?'text-white':'text-white/40 hover:text-white/80'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[10px]">Home</span>
         </button>
         <button onClick={() => { setTopSearchQuery(''); setAppTab('explore'); }} className={`flex flex-col items-center gap-1 transition-colors px-4 py-1 ${appTab==='explore'?'text-white':'text-white/40 hover:text-white/80'}`}>
            <Compass className="w-6 h-6" />
            <span className="text-[10px]">Explore</span>
         </button>
         <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
         >
            <Plus className="w-6 h-6" />
         </button>
         <button onClick={() => { setViewArtist(null); setAppTab('profile'); }} className={`flex flex-col items-center gap-1 transition-colors px-4 py-1 ${appTab==='profile' && !viewArtist ?'text-white':'text-white/40 hover:text-white/80'}`}>
            <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${appTab==='profile' && !viewArtist ? 'border-white' : 'border-transparent'}`}>
               <img src={getImg(gameState.artist?.name)} className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px]">You</span>
         </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
         <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#212121] rounded-2xl w-full max-w-md p-6">
               <h2 className="text-xl font-bold mb-4">Upload Music Video</h2>
               
               <div className="mb-4">
                  <label className="block text-sm font-medium text-white/60 mb-2">Select Track</label>
                  <input
                     type="text"
                     placeholder="Search songs..."
                     value={songSearchQuery}
                     onChange={(e) => setSongSearchQuery(e.target.value)}
                     className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-4 py-2 mb-2 text-white outline-none focus:border-white transition-colors"
                  />
                  <select 
                     value={uploadTrackId} 
                     onChange={(e) => setUploadTrackId(e.target.value)}
                     className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-4 py-3 text-white appearance-none outline-none focus:border-white transition-colors"
                  >
                     <option value="" disabled>Select a song...</option>
                     {playerSongs.filter(s => s.title.toLowerCase().includes(songSearchQuery.toLowerCase())).map(song => (
                        <option key={song.id} value={song.id}>{song.title}</option>
                     ))}
                  </select>
               </div>

               {uploadTrackId && (
                  <div className="mb-4">
                     <label className="block text-sm font-medium text-white/60 mb-2">Auto-Generated Title</label>
                     <div className="bg-[#0f0f0f] p-3 rounded-lg border border-white/10 text-white/80 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {getArtistStr(playerSongs.find(s => s?.id === uploadTrackId))} - {playerSongs.find(s => s?.id === uploadTrackId)?.title} (Official Music Video)
                     </div>
                  </div>
               )}

               <div className="mb-6">
                  <label className="block text-sm font-medium text-white/60 mb-2">Thumbnail (Optional)</label>
                  {!uploadThumbnail ? (
                     <label className="w-full aspect-video rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 bg-[#0f0f0f] flex flex-col items-center justify-center cursor-pointer transition-colors">
                        <Upload className="w-6 h-6 text-white/40 mb-2" />
                        <span className="text-sm font-medium text-white/60">Upload Image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                  ) : (
                     <div className="w-full aspect-video rounded bg-black overflow-hidden relative group">
                        <img src={uploadThumbnail} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <label className="bg-[#212121] text-white px-4 py-2 rounded-lg font-medium text-sm cursor-pointer hover:bg-[#3f3f3f] transition-colors">
                              Change Thumbnail
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                           </label>
                        </div>
                     </div>
                  )}
               </div>

               <div className="mb-6">
                  <label className="block text-sm font-medium text-white/60 mb-2">MV Budget ($)</label>
                  <div className="flex items-center gap-4">
                     <input 
                        type="range" 
                        min="5000" 
                        max="1000000" 
                        step="5000"
                        value={uploadBudget} 
                        onChange={(e) => setUploadBudget(Number(e.target.value))}
                        className="flex-1 accent-white"
                     />
                     <span className="font-mono bg-[#0f0f0f] px-3 py-1 rounded text-white min-w-[100px] text-right text-xs pt-2">
                        {RECORD_LABELS.find(l => l.id === gameState.artist?.labelContract?.labelId)?.benefits.freeMusicVideo ? <span className="text-green-400 font-bold whitespace-nowrap">FREE</span> : `$${uploadBudget.toLocaleString()}`}
                     </span>
                  </div>
                  <p className="text-xs text-white/40 mt-2">Higher budget increases potential views and chart performance.</p>
               </div>

               <div className="flex gap-3">
                  <button 
                     onClick={() => setShowUploadModal(false)}
                     className="flex-1 py-3 font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={handleUpload}
                     disabled={!uploadTrackId}
                     className="flex-1 py-3 font-bold text-black bg-[#3ea6ff] hover:bg-[#65b8ff] disabled:opacity-50 disabled:bg-white/20 disabled:text-white/40 rounded-xl transition-colors"
                  >
                     Upload
                  </button>
               </div>
            </div>
         </div>
      )}

      {(playingVideoUrl || playingVideoDetails) && (
          <div className="fixed inset-0 z-[400] bg-[#0f0f0f] flex flex-col pt-safe animate-in fade-in zoom-in-95 duration-200">
              <div className="w-full aspect-video bg-black shrink-0 relative z-[105] group">
                 <button className="absolute top-4 left-4 z-[110] bg-black/50 p-2 md:p-3 rounded-full text-white hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100 duration-300" onClick={() => { setPlayingVideoUrl(null); setPlayingVideoDetails(null); }}>
                     <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                 </button>
                 {playingVideoDetails?.thumbnail ? (
                    <img src={playingVideoDetails.thumbnail} className="w-full h-full object-cover" />
                 ) : playingVideoUrl ? (
                    <video src={playingVideoUrl} autoPlay controls className="w-full h-full" />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                       <MonitorPlay className="w-16 h-16 text-white/20 mb-4" />
                       <h3 className="text-xl font-bold text-white mb-2">Video Not Available</h3>
                       <p className="text-white/60">An official video preview could not be found for this track.</p>
                    </div>
                 )}
              </div>
              <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 w-full">
                 {playingVideoDetails && (
                    <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto w-full pt-4 md:pt-5 pb-8">
                       <div className="flex-1 min-w-0">
                          <h2 className="text-lg md:text-xl font-bold text-white line-clamp-2 md:mb-1">{playingVideoDetails.title}</h2>
                       <p className="text-sm text-white/50 mb-3 md:mb-4">{formatViews(playingVideoDetails.views)} views • {timeAgo(playingVideoDetails.publishDate)}</p>
                       
                       {/* Creator & Actions Row */}
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 w-full mb-4 md:mb-5">
                          {/* Channel info */}
                          <div className="flex items-center gap-3">
                             <img src={getImg(playingVideoDetails.artistName)} className="w-[42px] h-[42px] md:w-[48px] md:h-[48px] rounded-full object-cover" />
                             <div className="flex flex-col items-start min-w-0 pr-2">
                                <h3 className="font-bold text-white text-[15px] md:text-base leading-tight truncate px-1 flex items-center">{playingVideoDetails.artistName} <span className="ml-1 inline-flex p-0.5 bg-zinc-700/50 rounded-full"><svg viewBox="0 0 24 24" className="w-3 h-3 fill-current text-white"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg></span></h3>
                                <p className="text-xs text-white/60 px-1">{formatViews(getSubscribers(playingVideoDetails.artistName))} subs</p>
                             </div>
                             <button className="bg-white text-black font-medium text-[13px] md:text-sm px-4 py-1.5 md:py-2 md:px-5 rounded-full ml-1 md:ml-3 shrink-0">Subscribe</button>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar shrink-0 pb-1 md:pb-0">
                              <div className="flex items-center bg-white/10 rounded-full">
                                  <button className="flex items-center gap-2 px-4 py-1.5 md:py-2 hover:bg-white/10 rounded-l-full border-r border-white/20 transition-colors">
                                      <ThumbsUp className="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" /> <span className="text-[13px] md:text-sm font-medium">{formatViews(Math.floor(playingVideoDetails.views * 0.018))}</span>
                                  </button>
                                  <button className="px-4 py-1.5 md:py-2 hover:bg-white/10 rounded-r-full transition-colors">
                                      <ThumbsDown className="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" />
                                  </button>
                              </div>
                              <button className="flex items-center gap-2 px-4 py-1.5 md:py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors shrink-0">
                                  <Share2 className="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" /> <span className="text-[13px] md:text-sm font-medium">Share</span>
                              </button>
                              <button className="flex items-center gap-2 px-4 py-1.5 md:py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors shrink-0">
                                  <Download className="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" /> <span className="text-[13px] md:text-sm font-medium">Download</span>
                              </button>
                              <button className="flex items-center gap-2 px-4 py-1.5 md:py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors shrink-0 md:hidden">
                                  <Plus className="w-[18px] h-[18px]" /> <span className="text-[13px] font-medium">Save</span>
                              </button>
                          </div>
                       </div>
                       
                       {/* Description Block */}
                       <div className="bg-white/10 hover:bg-white/[0.15] cursor-pointer transition-colors rounded-xl p-3 md:p-4 mb-5">
                          <div className="flex flex-wrap gap-2 text-[13px] md:text-sm text-white font-medium mb-1">
                              <span>{formatViews(playingVideoDetails.views)} views</span>
                              <span>{timeAgo(playingVideoDetails.publishDate)}</span>
                              <span className="text-blue-400">#musicvideo #official</span>
                          </div>
                          <p className="text-[13px] md:text-sm text-white/80 line-clamp-3">Provided to YouTube by {RECORD_LABELS.find(l => l.id === gameState.artist?.labelContract?.labelId)?.name || 'Independent Distrib.'}. Music video by {playingVideoDetails.artistName} performing {playingVideoDetails.title}. © {new Date().getFullYear()} {playingVideoDetails.artistName} under exclusive license.</p>
                       </div>
                       
                       {/* Comments Section */}
                       <div className="mb-8">
                          <div className="flex items-center justify-between mb-4">
                             <h4 className="font-bold md:text-lg flex items-center gap-2">Comments <span className="text-white/50 text-sm font-normal">{formatViews(Math.floor(playingVideoDetails.views * 0.002))}</span></h4>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 md:p-4 flex gap-3 cursor-text">
                              <img src={getImg(gameState.artist?.name || '')} className="w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-full object-cover shrink-0" />
                              <div className="text-[13px] md:text-sm text-white/50 pt-1.5 md:pt-2">Add a comment...</div>
                          </div>
                          <div className="mt-4 flex flex-col gap-5">
                             <div className="flex gap-3 pl-1">
                                <div className="w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                   <UserIcon className="w-5 h-5 text-white/40" />
                                </div>
                                <div>
                                   <h5 className="text-[11px] md:text-[13px] text-white/60 font-medium mb-0.5">@musicfan99 • 2 days ago</h5>
                                   <p className="text-[13px] md:text-[14px] text-white mb-2">this song never gets old, literal chills every time 🔥</p>
                                   <div className="flex items-center gap-4 text-white/60">
                                      <div className="flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="text-[11px] md:text-xs">{formatViews(Math.floor(playingVideoDetails.views * 0.0008))}</span></div>
                                      <ThumbsDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                      <button className="text-[11px] md:text-xs font-medium pl-1">Reply</button>
                                   </div>
                                </div>
                             </div>
                             
                             <div className="flex gap-3 pl-1">
                                <div className="w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-full bg-purple-900 flex items-center justify-center shrink-0">
                                   <UserIcon className="w-5 h-5 text-purple-200" />
                                </div>
                                <div>
                                   <h5 className="text-[11px] md:text-[13px] text-white/60 font-medium mb-0.5">@theofficialcharts • 4 days ago</h5>
                                   <p className="text-[13px] md:text-[14px] text-white mb-2">Deserves to be #1 on Billboard! The production is insane 📈</p>
                                   <div className="flex items-center gap-4 text-white/60">
                                      <div className="flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="text-[11px] md:text-xs">{formatViews(Math.floor(playingVideoDetails.views * 0.0005))}</span></div>
                                      <ThumbsDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                      <button className="text-[11px] md:text-xs font-medium pl-1">Reply</button>
                                   </div>
                                </div>
                             </div>

                             <div className="flex gap-3 pl-1">
                                <div className="w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-full bg-blue-900 flex items-center justify-center shrink-0">
                                   <UserIcon className="w-5 h-5 text-blue-200" />
                                </div>
                                <div>
                                   <h5 className="text-[11px] md:text-[13px] text-white/60 font-medium mb-0.5">@popculturenow • 1 week ago</h5>
                                   <p className="text-[13px] md:text-[14px] text-white mb-2">Who else is replaying this masterpiece? 🙋‍♀️ 🙋‍♂️</p>
                                   <div className="flex items-center gap-4 text-white/60">
                                      <div className="flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="text-[11px] md:text-xs">{formatViews(Math.floor(playingVideoDetails.views * 0.0003))}</span></div>
                                      <ThumbsDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                      <button className="text-[11px] md:text-xs font-medium pl-1">Reply</button>
                                   </div>
                                </div>
                             </div>
                             
                             <div className="flex gap-3 pl-1">
                                <div className="w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-full bg-emerald-900 flex items-center justify-center shrink-0">
                                   <UserIcon className="w-5 h-5 text-emerald-200" />
                                </div>
                                <div>
                                   <h5 className="text-[11px] md:text-[13px] text-white/60 font-medium mb-0.5">@stanaccount123 • 1 month ago</h5>
                                   <p className="text-[13px] md:text-[14px] text-white mb-2">The vocals, the visual, EVERYTHING! My jaw dropped! {playingVideoDetails.artistName} owns the industry! 👑</p>
                                   <div className="flex items-center gap-4 text-white/60">
                                      <div className="flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="text-[11px] md:text-xs">{formatViews(Math.floor(playingVideoDetails.views * 0.0002))}</span></div>
                                      <ThumbsDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                      <button className="text-[11px] md:text-xs font-medium pl-1">Reply</button>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                       </div>
                       
                       {/* Recommended Videos (Sidebar on Desktop) */}
                       <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0">
                          <h4 className="font-bold md:text-lg flex items-center gap-2 mb-4 lg:hidden">Up next</h4>
                          <div className="flex flex-col gap-3">
                             {topVideosByDaily.filter(v => v.id !== playingVideoDetails?.id).slice(0, 15).map(v => {
                                const song = gameState.releases.find(r => r.id === v.songId);
                                const aName = (v as any).artistId || (song as any)?.artistId || gameState.artist?.name || 'You';
                                return (
                                    <div key={`rec_${v.id}`} className="flex gap-2 cursor-pointer group" onClick={() => handleVideoClick(v.id, v.songId, aName, v.title)}>
                                        <div className="w-40 aspect-video bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                                           <VideoThumbnail title={song?.title || v.title} artist={aName} defaultImage={v.thumbnail} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                                           <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-medium font-mono text-white flex items-center">
                                               <Music className="w-3 h-3 mr-1" /> 3:45
                                           </div>
                                        </div>
                                        <div className="flex flex-col py-0.5 pr-2 flex-1">
                                           <h3 className="text-[14px] font-medium line-clamp-2 leading-tight text-white mb-1 group-hover:text-blue-400 transition-colors">{v.title}</h3>
                                           <p className="text-[12px] text-white/60 mb-0.5 line-clamp-1">{aName}</p>
                                           <p className="text-[12px] text-white/60">{formatViews(v.views)} views • {timeAgo(v.publishDate)}</p>
                                        </div>
                                    </div>
                                )
                             })}
                          </div>
                       </div>
                       
                    </div>
                 )}
              </div>
          </div>
      )}
      {isLoadingPlayer && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-md animate-in fade-in duration-200">
             <div className="flex flex-col items-center">
                 <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
                 <p className="text-white font-medium tracking-wider text-sm">Loading Clip...</p>
             </div>
          </div>
      )}
    </div>
  );
}
