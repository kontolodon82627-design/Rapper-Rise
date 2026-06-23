import React, { useState, useMemo } from 'react';
import { GameState, Album, Song } from '../types';
import { Heart, MessageCircle, Repeat2, Share, BadgeCheck, MoreHorizontal, ArrowLeft, Search, Home, Mail, User, Settings, Plus } from 'lucide-react';
import { computeCharts } from '../chartUtils';
import { ARTIST_IMAGES } from '../artistImages';
import { GrammySvg } from './GrammySvg';
import { AlbumTrackerMedia, ChartPredictionMedia, SpotifyMilestoneCard, DebutTrackerMedia, OfficialChartMedia, PlatformMilestoneCard } from './TweetMedia';

interface XViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose?: () => void;
}

const CHART_DATA_AVATAR = (
  <div className="w-full h-full bg-black flex items-center justify-center p-0.5 border border-gray-800">
     <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
       <rect width="100" height="100" fill="#000" rx="50"/>
       <g fill="#fff" transform="rotate(-30 50 50)">
         <rect x="15" y="25" width="70" height="12"/>
         <rect x="15" y="45" width="50" height="12"/>
         <rect x="15" y="65" width="60" height="12"/>
       </g>
     </svg>
  </div>
);

const TOTC_AVATAR = (
  <div className="w-full h-full rounded-full bg-[#1A1E24] flex items-center justify-center overflow-hidden">
    <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
      <path d="M28 85 L28 40 L15 40 L35 15 L55 40 L42 40 L42 85 Z" fill="#60a5fa"/>
      <path d="M58 15 L58 60 L45 60 L65 85 L85 60 L72 60 L72 15 Z" fill="#f472b6"/>
    </svg>
  </div>
);

const GRAMMYS_AVATAR = (
  <div className="w-full h-full bg-[#E5B869] flex items-center justify-center p-0.5 border border-[#C59B4B]">
    <GrammySvg className="w-[85%] h-[85%]" fill="#111" />
  </div>
);

const POP_CRAVE_AVATAR = (
  <div className="w-full h-full bg-[#18181b] flex items-center justify-center border border-gray-800">
     <svg viewBox="0 0 120 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
       <rect width="120" height="120" fill="#18181b" />
       <text x="60" y="58" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontStyle="italic" fontSize="42" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" letterSpacing="-1">
         POP
       </text>
       <rect x="20" y="80" width="80" height="24" fill="#ff2a5f" rx="4" />
       <text x="60" y="93" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="14" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" letterSpacing="3">
         CRAVE
       </text>
       <circle cx="95" cy="30" r="6" fill="#1da1f2" />
     </svg>
  </div>
);

const getPlatformTweetText = (
   title: string, 
   artist: string, 
   type: string, 
   platform: string, 
   metricVal: number, 
   rank: number, 
   seed: number
) => {
    const isYoutube = platform === 'YouTube';
    const streamWord = isYoutube ? 'views' : 'streams';
    const streamingWord = isYoutube ? 'watching' : 'streaming';
    
    const isAlbum = type === 'Album' || type === 'EP';
    const trackCount = isAlbum ? (Math.floor(Math.abs(Math.sin(seed)*10)) + 6 + '') : '';
    
    const countStr = metricVal.toLocaleString();
    let listenersStr = (metricVal * (3 + (seed % 3))).toLocaleString();

    const playlists = ['Today\'s Top Hits', 'RapCaviar', 'Viva Latino', 'New Music Friday', 'Pop Rising', 'Viral 50'];
    const playlist = playlists[seed % playlists.length];
    
    const regions = ['the US', 'the UK', 'Global', 'Latin America', 'Asia', 'Europe'];
    const region = regions[(seed * 2) % regions.length];
    
    const safeRank = rank > 0 ? rank : (seed % 50) + 1;
    const top10Rank = safeRank <= 10 ? safeRank : (seed % 10) + 1;
    
    const templates = [
        `New music just dropped.\n"${title}" by ${artist} is out now on ${platform}.`, // 1
        `${artist} is back.\nStream "${title}" now on ${platform}.`, // 2
        `A new era begins.\n"${title}" by ${artist} is now available.`, // 3
        `"${title}" by ${artist} debuts at #${safeRank} on ${platform} Global.`, // 4
        `${artist} reaches ${listenersStr} monthly listeners on ${platform}.`, // 5
        `"${title}" just passed ${countStr} ${streamWord}.\nCongratulations, ${artist}.`, // 6
        `Added to ${playlist}:\n"${title}" by ${artist}.`, // 7
        `${artist} is rising fast with "${title}".\nKeep ${streamingWord}.`, // 8
        `Your next favorite track is here.\nListen to "${title}" by ${artist}.`, // 9
        `${artist} drops "${title}"${isAlbum ? ` with ${trackCount} tracks` : ''}.\n${isYoutube ? 'Watch' : 'Stream'} the full project now.`, // 10
        `"${title}" by ${artist} is gaining momentum in ${region}.`, // 11
        `Top 10 alert.\n${artist} reaches #${top10Rank} with "${title}".`, // 12
        `${artist} has new music on the way.\nPre-save "${title}" now on ${platform}.`, // 13
        `The wait is over.\n"${title}" by ${artist} is ${isYoutube ? 'available' : 'streaming'} now.`, // 14
        `${artist} enters the ${platform} chart for the first time with "${title}".`, // 15
        `Fans can't stop playing "${title}".\n${artist} is having a moment.`, // 16
        `"${title}" by ${artist} has been added to your playlist rotation.`, // 17
        `New release from ${artist}.\nPress play on "${title}".`, // 18
        `${artist} hits a new career peak on ${platform}.`, // 19
        `${platform} update:\n${artist} — "${title}"\nPosition: #${safeRank}\n${streamWord.charAt(0).toUpperCase() + streamWord.slice(1)}: ${countStr}`, // 20
        `${artist} just dropped a new track.\n${isYoutube ? 'Watch' : 'Stream'} "${title}" now on ${platform}.`, // 21
        `"${title}" by ${artist} is starting to climb the charts.`, // 22
        `A fresh sound from ${artist} has arrived.\nListen now on ${platform}.`, // 23
        `${artist} is making noise with "${title}".`, // 24
        `"${title}" by ${artist} is out now.\nWhich track are you playing first?`, // 25
        `${artist} enters a new chapter with "${title}".`, // 26
        `"${title}" is now one of ${artist}'s top songs on ${platform}.`, // 27
        `New playlist addition:\n${artist} — "${title}"`, // 28
        `${artist} is gaining new listeners after releasing "${title}".`, // 29
        `"${title}" by ${artist} reaches a new daily ${streamingWord} peak.`, // 30
        `${artist} is back on your playlist with "${title}".`, // 31
        `${isYoutube ? 'Watch' : 'Stream'} "${title}" by ${artist} and add it to your favorites.`, // 32
        `"${title}" by ${artist} is rising in ${region}.`, // 33
        `${artist} has officially entered the ${platform} Top Artists chart.`, // 34
        `"${title}" just became ${artist}'s biggest release yet.`, // 35
        `New music Friday starts with ${artist}.\n"${title}" is out now.`, // 36
        `${artist}'s new release is gaining traction worldwide.`, // 37
        `"${title}" by ${artist} is now trending on ${platform}.`, // 38
        `${artist} reaches a new ${platform} milestone today.`, // 39
        `The replay button is working overtime.\n"${title}" by ${artist} is here.`, // 40
        `${artist} drops "${title}" and starts a brand-new era.`, // 41
        `"${title}" by ${artist} debuts with ${countStr} ${streamWord} in its first day.`, // 42
        `${artist} is one to watch.\nStart with "${title}".`, // 43
        `"${title}" has been added to ${playlist}.\n${isYoutube ? 'Watch' : 'Stream'} it now.`, // 44
        `${artist}'s fans showed up.\n"${title}" is climbing fast.`, // 45
        `New peak unlocked:\n${artist} reaches #${safeRank} on ${platform}.`, // 46
        `"${title}" by ${artist} is becoming a fan favorite.`, // 47
        `${artist} is taking over playlists with "${title}".`, // 48
        `${platform} update: ${artist} is rising in ${region}.`, // 49
        `${artist}'s "${title}" is officially on repeat.` // 50
    ];

    return templates[seed % templates.length];
};

const getPopCraveTweetText = (
   title: string, 
   artist: string, 
   type: string, 
   metricVal: number, 
   rank: number, 
   seed: number
) => {
    const isAlbum = type === 'Album' || type === 'EP';
    const releaseWord = isAlbum ? 'album' : 'single';
    
    const countStr = metricVal.toLocaleString();
    let listenersStr = (metricVal * (3 + (seed % 3))).toLocaleString();

    const playlists = ['Today\'s Top Hits', 'RapCaviar', 'Viva Latino', 'New Music Friday', 'Pop Rising'];
    const playlist = playlists[seed % playlists.length];
    
    const countries = ['US', 'UK', 'Global', 'Brazil', 'Philippines'];
    const country = countries[(seed * 2) % countries.length];
    
    const safeRank = rank > 0 ? rank : (seed % 50) + 1;
    const top10Rank = safeRank <= 10 ? safeRank : (seed % 10) + 1;
    const topNum = [5, 10, 20, 50][seed % 4];

    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7 + (seed % 14));
    const dateStr = upcomingDate.toLocaleDateString('en-US', {month: 'long', day: 'numeric'});

    const features = ['Drake', 'Taylor Swift', 'Ariana Grande', 'The Weeknd', 'Bad Bunny', 'Dua Lipa', 'Post Malone'];
    const ft1 = features[seed % features.length];
    const ft2 = features[(seed + 3) % features.length];
    
    const templates = [
        `${artist} has released their new ${releaseWord} "${title}."`, // 1
        `${artist} announces new ${releaseWord} "${title}," out ${dateStr}.`, // 2
        `${artist}'s "${title}" debuts at #${safeRank} on the Global Spotify chart.`, // 3
        `${artist} has reached ${listenersStr} monthly listeners on Spotify.`, // 4
        `${artist} teases a new era on social media.`, // 5
        `${artist}'s new ${releaseWord} "${title}" is now available on all streaming platforms.`, // 6
        `${artist} earns their biggest streaming day ever with "${title}."`, // 7
        `${artist}'s "${title}" has surpassed ${countStr} streams on Spotify.`, // 8
        `${artist} is reportedly preparing to release new music soon.`, // 9
        `${artist} reveals the official cover art for "${title}."`, // 10
        `${artist}'s "${title}" enters the Top ${topNum} on Spotify Global.`, // 11
        `${artist} announces the tracklist for their upcoming project "${title}."`, // 12
        `${artist} drops the official music video for "${title}."`, // 13
        `${artist}'s "${title}" is gaining momentum across streaming platforms.`, // 14
        `${artist} has been added to Spotify's ${playlist} playlist with "${title}."`, // 15
        `${artist} scores a new peak on Spotify with "${title}" at #${safeRank}.`, // 16
        `${artist} begins a new era with the release of "${title}."`, // 17
        `${artist}'s "${title}" debuts with ${countStr} first-day streams on Spotify.`, // 18
        `${artist} shares a teaser for their upcoming release "${title}."`, // 19
        `${artist} is trending following the release of "${title}."`, // 20
        `${artist}'s "${title}" becomes their fastest song to reach ${countStr} streams.`, // 21
        `${artist} announces their comeback with "${title}," releasing on ${dateStr}.`, // 22
        `${artist} earns a new career milestone on Spotify.`, // 23
        `${artist}'s "${title}" rises to #${safeRank} on the ${country} Spotify chart.`, // 24
        `${artist} has officially released their debut ${releaseWord} "${title}."`, // 25
        `${artist}'s new project "${title}" features ${ft1}, ${ft2}, and more.`, // 26
        `${artist} fans are celebrating after "${title}" reaches a new peak.`, // 27
        `${artist} announces pre-save for their upcoming release "${title}."`, // 28
        `${artist}'s "${title}" becomes one of the biggest new releases of the week.`, // 29
        `${artist} enters the Top Artists chart at #${top10Rank} following the release of "${title}."` // 30
    ];

    return templates[seed % templates.length];
};

const SPECIAL_ACCOUNTS: Record<string, any> = {
  '@chartdata': { name: 'chart data', verified: 'blue', avatar: CHART_DATA_AVATAR, followers: 2345000, banner: <div className="w-full h-full bg-black border-y border-gray-800" /> },
  '@talkofthecharts': { name: 'Talk of the Charts', verified: 'gold', avatar: TOTC_AVATAR, followers: 450000, banner: <div className="w-full h-full bg-[#1A1E24]" /> },
  '@PopCrave': { name: 'Pop Crave', verified: 'gold', avatar: POP_CRAVE_AVATAR, followers: 1600000, banner: <div className="w-full h-full bg-gray-200" /> },
  '@RecordingAcad': { name: 'Recording Academy / GRAMMYs', verified: 'gold', avatar: GRAMMYS_AVATAR, followers: 5200000, banner: <div className="w-full h-full bg-gradient-to-r from-[#E5B869] to-[#C59B4B]" /> },
  '@Spotify': {
     name: 'Spotify',
     verified: 'gold',
     followers: 24500000,
     avatar: (
       <div className="w-full h-full bg-[#1DB954] flex items-center justify-center p-1">
         <svg viewBox="0 0 24 24" fill="white" className="w-[80%] h-[80%]">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 14.4c-.2.3-.5.4-.8.2-2.2-1.3-4.9-1.6-8.1-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.5-.8 6.6-.4 9.1 1.1.2.1.3.5.2.8zm1.2-2.7c-.2.4-.6.5-1 .3-2.5-1.5-6.3-2-8.6-1.1-.4.2-.9-.1-1-.5s.1-.9.5-1c2.8-1 7.1-.4 10 1.4.3.1.4.6.1.9zm.1-2.9c-3-1.8-7.9-2-10.8-1.1-.5.2-1.1-.1-1.3-.6-.2-.5.1-1.1.6-1.3 3.4-1 8.9-.7 12.4 1.3.5.3.6.9.3 1.4-.2.4-.8.6-1.2.3z"/>
         </svg>
       </div>
     ),
     banner: <div className="w-full h-full bg-[#1DB954]" />
  },
  '@AppleMusic': {
     name: 'Apple Music',
     verified: 'gold',
     followers: 18200000,
     avatar: (
       <div className="w-full h-full bg-white flex items-center justify-center p-0.5 border border-gray-200">
         <svg viewBox="0 0 24 24" fill="#fa243c" className="w-[80%] h-[80%]">
           <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.1 11.2c-.3 1.3-1.4 2.2-2.7 2.2s-2.4-.9-2.7-2.1c-.1-.3 0-.6.1-.9L10.3 8c.2-.7.8-1.2 1.5-1.2h.5c.7 0 1.3.5 1.4 1.1l1.5 4.5c.2.3.2.6.1.8z" />
         </svg>
       </div>
     ),
     banner: <div className="w-full h-full bg-gradient-to-r from-[#fa243c] to-[#ff4760]" />
  },
  '@AmazonMusic': {
     name: 'Amazon Music',
     verified: 'gold',
     followers: 6500000,
     avatar: (
       <div className="w-full h-full bg-black flex items-center justify-center p-0.5">
         <span className="text-[#00A8E1] font-black text-xl">am</span>
       </div>
     ),
     banner: <div className="w-full h-full bg-gradient-to-r from-black to-[#00A8E1]" />
  },
  '@YouTubeMusic': {
     name: 'YouTube Music',
     verified: 'gold',
     followers: 8900000,
     avatar: (
       <div className="w-full h-full bg-black flex items-center justify-center p-1">
         <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[70%] h-[70%]">
            <circle cx="12" cy="12" r="10" stroke="#FF0000" />
            <polygon points="10 8 16 12 10 16 10 8" fill="#FF0000" stroke="#FF0000" />
         </svg>
       </div>
     ),
     banner: <div className="w-full h-full bg-black" />
  },
  '@YouTube': {
     name: 'YouTube',
     verified: 'gold',
     followers: 79000000,
     avatar: (
       <div className="w-full h-full bg-white flex items-center justify-center p-0.5">
         <svg viewBox="0 0 24 24" fill="#FF0000" className="w-[90%] h-[90%]">
           <path d="M21.58 6.42A2.8 2.8 0 0 0 19.62 4.5C17.88 4 12 4 12 4s-5.88 0-7.62.5C2.64 4.96 1.16 6.44 1.16 8.35a29.88 29.88 0 0 0 0 7.3c0 1.91 1.48 3.39 3.22 3.85C6.12 20 12 20 12 20s5.88 0 7.62-.5c1.74-.46 3.22-1.94 3.22-3.85a30.2 30.2 0 0 0 .74-7.23zM9.54 15.54V8.46L15.82 12l-6.28 3.54z"/>
         </svg>
       </div>
     ),
     banner: <div className="w-full h-full bg-gradient-to-r from-[#FF0000] to-[#CC0000]" />
  }
};

const VerifiedBadge = ({ type, className = "w-[15px] h-[15px]" }: { type: 'blue' | 'gold' | 'none', className?: string }) => {
  if (type === 'none') return null;
  const color = type === 'gold' ? 'text-[#F9A01B]' : 'text-[#1D9BF0]';
  return (
    <svg viewBox="0 0 24 24" aria-label="Verified account" role="img" className={`${className} ${color} fill-current`}>
      <g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.756 2.76 1.9 3.44-.136.42-.204.86-.204 1.32 0 2.21 1.71 3.998 3.918 3.998.47 0 .92-.084 1.336-.25.52 1.334 1.815 2.25 3.337 2.25s2.816-.916 3.337-2.25c.416.166.866.25 1.336.25 2.21 0 3.918-1.792 3.918-4 0-.46-.067-.9-.204-1.32 1.144-.68 1.9-1.98 1.9-3.44zm-12.306 4.7l-3.36-3.36 1.06-1.06 2.3 2.3 5.44-5.44 1.06 1.06-6.5 6.5z"></path></g>
    </svg>
  );
};

const Tweet = ({ tweet, onProfileClick }: { key?: React.Key, tweet: any, onProfileClick: (handle: string) => void }) => (
  <div className="flex gap-3 px-4 py-3 border-b border-gray-800 hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => onProfileClick(tweet.author.handle)}>
    <div className="w-10 h-10 rounded-full bg-gray-700 flex shrink-0 items-center justify-center font-bold text-lg text-white overflow-hidden">
      {tweet.author.avatar}
    </div>
    <div className="flex flex-col flex-1 pb-1">
      <div className="flex items-center gap-1.5 text-[15px]">
        <span className="font-bold text-white hover:underline">{tweet.author.name}</span>
        <VerifiedBadge type={tweet.author.verified} />
        <span className="text-gray-500">{tweet.author.handle}</span>
        <span className="text-gray-500">·</span>
        <span className="text-gray-500 hover:underline">{tweet.time}</span>
        <button className="ml-auto text-gray-500 hover:text-[#1D9BF0] rounded-full p-1.5 hover:bg-[#1D9BF0]/10 transition-colors">
           <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <div className="text-[15px] text-white mt-0.5 whitespace-pre-wrap leading-tight">
        {tweet.content}
      </div>
      {tweet.mediaUrl && (
         <div className="mt-3 rounded-2xl border border-gray-800 overflow-hidden">
            <img src={tweet.mediaUrl || undefined} className="w-full max-h-[400px] object-cover" />
         </div>
      )}
      {tweet.media && (
         <div className="mt-3 rounded-2xl border border-gray-800 overflow-hidden">
            {tweet.media}
         </div>
      )}
      <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
        <button className="flex items-center gap-2 hover:text-[#1D9BF0] transition-colors group">
           <div className="p-2 rounded-full group-hover:bg-[#1D9BF0]/10 -ml-2">
             <MessageCircle className="w-4 h-4" />
           </div>
           <span className="text-[13px]">{tweet.replies.toLocaleString()}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-[#00BA7C] transition-colors group">
           <div className="p-2 rounded-full group-hover:bg-[#00BA7C]/10 -ml-2">
             <Repeat2 className="w-4 h-4" />
           </div>
           <span className="text-[13px]">{tweet.retweets.toLocaleString()}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-[#F91880] transition-colors group">
           <div className="p-2 rounded-full group-hover:bg-[#F91880]/10 -ml-2">
             <Heart className="w-4 h-4" />
           </div>
           <span className="text-[13px]">{tweet.likes.toLocaleString()}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-[#1D9BF0] transition-colors group">
           <div className="p-2 rounded-full group-hover:bg-[#1D9BF0]/10 -ml-2">
             <Share className="w-4 h-4" />
           </div>
        </button>
      </div>
    </div>
  </div>
);


export function XView({ gameState, setGameState, onClose }: XViewProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'trends' | 'messages' | 'profile'>('feed');
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState(gameState.artist?.socialProfile?.bio || "Musician. Stream my new music now!");
  const [newTweetContent, setNewTweetContent] = useState('');
  const [newTweetImage, setNewTweetImage] = useState<string | null>(null);

  const handlePostTweet = () => {
    if (!newTweetContent.trim() && !newTweetImage) return;
    setGameState(prev => {
      if (!prev || !prev.artist) return prev;
      
      const newCustomTweet = {
        id: `custom_${Date.now()}`,
        content: newTweetContent,
        date: prev.time.daysPassed,
        likes: Math.floor(Math.random() * 50) + 5,
        retweets: Math.floor(Math.random() * 10),
        replies: Math.floor(Math.random() * 5),
        mediaUrl: newTweetImage || undefined
      };

      return {
        ...prev,
        artist: {
          ...prev.artist,
          socialProfile: {
            bio: prev.artist.socialProfile?.bio || "",
            bannerUrl: prev.artist.socialProfile?.bannerUrl || "",
            customTweets: [newCustomTweet, ...(prev.artist.socialProfile?.customTweets || [])]
          }
        }
      };
    });
    setNewTweetContent('');
    setNewTweetImage(null);
  };

  const handleSaveProfile = () => {
    setGameState(prev => {
      if (!prev || !prev.artist) return prev;
      return {
        ...prev,
        artist: {
          ...prev.artist,
          socialProfile: {
            bio: editBio,
          }
        }
      };
    });
    setIsEditingProfile(false);
  };

  const playerHandle = `@${gameState.artist?.name.replace(/\s+/g, '').toLowerCase() || 'player'}`;
  const playerName = gameState.artist?.name || 'Player';

  const globalPopularity = gameState.popularity.america + gameState.popularity.europe + gameState.popularity.latinAmerica;
  const followerCount = gameState.stats.socialFollowers || Math.floor((gameState.stats.streams || 0) * 0.05 + globalPopularity * 100);

  const isPlayerVerified = followerCount > 100000;
  const playerVerifiedType = isPlayerVerified ? 'gold' : 'none';

  // Generate some deterministic tweets
  const tweets = useMemo(() => {
    const generatedTweets = [];
    
    const currentDate = new Date(gameState.time.startDate);
    currentDate.setDate(currentDate.getDate() + gameState.time.daysPassed);
    
    // Recent release reaction
    const latestRelease = gameState.releases.filter(r => !(r as any).isNPCRelease && r.status === 'Published').pop();
    if (latestRelease) {
      const isGood = (latestRelease as any).qualityModifier ? (latestRelease as any).qualityModifier > 1 : true;
      generatedTweets.push({
        id: '1',
        author: { name: 'Music Fan 🎧', handle: '@stanacc_01', verified: 'none', avatar: 'M' },
        content: isGood 
          ? `Wait, ${latestRelease.title} by ${playerHandle} is actually a bop?? It's been on repeat all day 🔥`
          : `I'm sorry but ${latestRelease.title} is kinda mid :/ expected more from ${playerHandle}`,
        likes: Math.floor(followerCount * 0.01 * (isGood ? 1.5 : 0.5)),
        retweets: Math.floor(followerCount * 0.005 * (isGood ? 1.2 : 0.3)),
        replies: Math.floor(followerCount * 0.001),
        time: '2h',
        isPlayer: false
      });

      const releaseDateTime = latestRelease.releaseDate ? new Date(latestRelease.releaseDate).getTime() : new Date(gameState.time.startDate).getTime();
      const daysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - releaseDateTime) / (1000 * 3600 * 24)));
      const dailyAvgGlobal = latestRelease.lastDailyStreams?.total || Math.floor(((latestRelease.streams?.total || 0) || 0) / Math.max(1, daysSinceRelease));
      const dailyAvgSpotify = latestRelease.lastDailyStreams?.spotify || Math.floor(((latestRelease.streams?.spotify || 0) || 0) / Math.max(1, daysSinceRelease));

      // Debut Streams & Sales Tweet
      if (latestRelease.debutStreams && daysSinceRelease <= 2) {
         const dS = latestRelease.debutStreams;
         const spotStr = Math.floor(dS * 0.45);
         const appleStr = Math.floor(dS * 0.25);
         const amzStr = Math.floor(dS * 0.15);
         const ytStr = dS - spotStr - appleStr - amzStr;

         const totPop = (gameState.popularity.america + gameState.popularity.latinAmerica + gameState.popularity.europe) || 1;
         const usaSales = Math.floor((latestRelease.sales?.total || 0) * (gameState.popularity.america / totPop));
         const latamSales = Math.floor((latestRelease.sales?.total || 0) * (gameState.popularity.latinAmerica / totPop));
         const euroSales = Math.floor((latestRelease.sales?.total || 0) * (gameState.popularity.europe / totPop));

         const tweetText = `${playerName} - ${latestRelease.title} (${latestRelease.type})
         
Debut On Spotify: ${spotStr.toLocaleString()}
Apple Music: ${appleStr.toLocaleString()}
Amazon Music: ${amzStr.toLocaleString()}
YouTube Music: ${ytStr.toLocaleString()}

And Earned ${dS.toLocaleString()} Global Streams!

Sold in each region:
🇺🇸 US: ${usaSales.toLocaleString()}
🌎 Latin America: ${latamSales.toLocaleString()}
🇪🇺 Europe: ${euroSales.toLocaleString()}`;

         generatedTweets.push({
            id: '1.25',
            author: { name: 'chart data', handle: '@chartdata', verified: 'gold', avatar: CHART_DATA_AVATAR },
            content: tweetText,
            media: latestRelease.coverImage ? <div className="bg-black flex justify-center mt-2 rounded-[1rem] overflow-hidden"><img src={latestRelease.coverImage || undefined} className="w-full max-w-[400px] h-auto border border-gray-800" /></div> : undefined,
            likes: Math.min(999000, Math.floor(latestRelease.debutStreams / 50)),
            retweets: Math.min(100000, Math.floor(latestRelease.debutStreams / 200)),
            replies: Math.floor(followerCount * 0.002) + 20,
            time: '3h',
            isPlayer: false
         });
      } else if (latestRelease.streams?.total > 1000) {
         generatedTweets.push({
            id: '1.5',
            author: { name: 'Pop Crave', handle: '@PopCrave', verified: 'gold', avatar: POP_CRAVE_AVATAR },
            content: getPopCraveTweetText(latestRelease.title, playerHandle, latestRelease.type, latestRelease.streams?.total || 0, 0, gameState.time.daysPassed),
            media: latestRelease.coverImage ? <div className="bg-black flex justify-center mt-2 rounded-[1rem] overflow-hidden"><img src={latestRelease.coverImage || undefined} className="w-full max-w-[400px] h-auto border border-gray-800" /></div> : undefined,
            likes: Math.floor(followerCount * 0.05) + 500,
            retweets: Math.floor(followerCount * 0.01) + 120,
            replies: Math.floor(followerCount * 0.002) + 20,
            time: '3h',
            isPlayer: false
         });
      }
      
      // Milestone Tweet for Player
      if (gameState.time.daysPassed % 2 === 0) {
          const platformsArr = ['Spotify', 'AppleMusic', 'AmazonMusic', 'YouTubeMusic', 'YouTube'];
          const stringSeed = latestRelease.id + gameState.time.daysPassed.toString();
          let seed = 0; for(let i = 0; i < stringSeed.length; i++) seed += stringSeed.charCodeAt(i);
          const rndPlatform = platformsArr[seed % platformsArr.length];
          const specialAccObj = SPECIAL_ACCOUNTS[`@${rndPlatform}`] || SPECIAL_ACCOUNTS['@Spotify'];
          
          const totalStr = latestRelease.streams?.total || 0;
          const isHuge = totalStr > 100000;
          const milestoneFormats = [
              { subtitle: `Biggest debut ${latestRelease.type.toLowerCase()} of ${new Date(gameState.time.startDate).getFullYear()} on ${rndPlatform}`, detail: "NEW RECORD", metricLabel: `FIRST DAY STREAMS` },
              { subtitle: `Currently charting at #1 on ${rndPlatform} Global`, detail: `Top ${latestRelease.type}`, metricLabel: `DAILY STREAMS` },
              { subtitle: `Fastest ${latestRelease.type.toLowerCase()} to reach ${totalStr > 100000000 ? '100M' : '10M'} streams this year`, detail: "ON PACE TO BREAK RECORDS", metricLabel: `TOTAL STREAMS` }
          ];
          const rndFormat = milestoneFormats[(seed * 2) % milestoneFormats.length];

          let playerMetricVal = 0;
          let relatedVideo = null;
          if (rndPlatform === 'Spotify') playerMetricVal = latestRelease.lastDailyStreams?.spotify || playerMetricVal;
          else if (rndPlatform === 'AppleMusic') playerMetricVal = latestRelease.lastDailyStreams?.appleMusic || playerMetricVal;
          else if (rndPlatform === 'AmazonMusic') playerMetricVal = latestRelease.lastDailyStreams?.amazonMusic || playerMetricVal;
          else if (rndPlatform === 'YouTubeMusic') playerMetricVal = latestRelease.lastDailyStreams?.youtubeMusic || playerMetricVal;
          
          if (rndPlatform === 'YouTube' && gameState.videos) {
              relatedVideo = gameState.videos.filter(v => v.type === 'MusicVideo' && v.songId === latestRelease.id).pop();
              if (relatedVideo) {
                 playerMetricVal = relatedVideo.lastDailyViews || relatedVideo.views || Math.floor((latestRelease.lastDailyStreams?.youtubeMusic || 0) * 1.5);
              }
          }
          if (playerMetricVal === 0 && rndPlatform === 'YouTube') {
              playerMetricVal = latestRelease.lastDailyStreams?.youtubeMusic || 0;
          }
          if (playerMetricVal === 0) {
              playerMetricVal = Math.floor(dailyAvgSpotify * (0.2 + (Math.random() * 0.3))); // Fallback
          }

          const postType = seed % 3; // variety here too

          let mediaContent: any = null;
          let contentText = getPlatformTweetText(
              latestRelease.title, 
              playerName, 
              latestRelease.type, 
              rndPlatform, 
              playerMetricVal, 
              (seed % 50) + 1, 
              seed
          );
          
          const finalTypeLabel = (rndPlatform === 'YouTube' && relatedVideo) ? 'MUSIC VIDEO' : latestRelease.type.toUpperCase();
          const finalMetricLabel = (rndPlatform === 'YouTube') ? 'DAILY VIEWS' : rndFormat.metricLabel;
          const finalCover = (rndPlatform === 'YouTube' && relatedVideo && relatedVideo.thumbnail) ? relatedVideo.thumbnail : latestRelease.coverImage;

          if (postType === 0) {
              mediaContent = <PlatformMilestoneCard 
                  platform={rndPlatform}
                  albumCover={finalCover} 
                  typeLabel={finalTypeLabel}
                  dateLabel={new Date(currentDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                  title={latestRelease.title}
                  artist={playerName}
                  subtitle={isHuge ? rndFormat.subtitle : `Surging on ${rndPlatform} charts`}
                  detail={isHuge ? rndFormat.detail : `Trending`}
                  metricValue={playerMetricVal.toLocaleString()}
                  changePercent="+7.96%"
                  metricLabel={finalMetricLabel}
             />;
          } else if (postType === 1) {
              mediaContent = finalCover ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-800 aspect-square w-[75%] max-w-[350px] mx-auto mt-2">
                      <img src={finalCover} className="w-full h-full object-cover" />
                  </div>
              ) : null;
          } else {
              mediaContent = gameState.artist?.image ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-800 aspect-[16/9] w-[90%] max-w-[450px] mx-auto mt-2">
                      <img src={gameState.artist.image} className="w-full h-full object-cover" />
                  </div>
              ) : null;
          }

          generatedTweets.push({
             id: 'player_platform_milestone',
             author: { name: specialAccObj.name, handle: `@${rndPlatform}`, verified: 'gold', avatar: specialAccObj.avatar },
             content: contentText,
             media: mediaContent,
             likes: Math.floor(followerCount * 0.03) + 200,
             retweets: Math.floor(followerCount * 0.01) + 40,
             replies: 15,
             time: '3h',
             isPlayer: false
          });
      }
      
      // Album Tracker Tweet
      if (latestRelease.type === 'Album') {
         generatedTweets.push({
            id: '1.8',
            author: { name: 'Spotify Daily Data', handle: '@spotifydata', verified: 'gold', avatar: 'S' },
            content: `Tracker for "${latestRelease.title}" by ${playerName} on Spotify:`,
            media: <AlbumTrackerMedia album={latestRelease} playerName={playerName} currentDate={currentDate} tracks={gameState.releases.filter(r => !(r as any).isNPCRelease && (latestRelease as Album).trackIds.includes(r.id)) as Song[]} />,
            likes: Math.floor(followerCount * 0.02) + 200,
            retweets: Math.floor(followerCount * 0.008) + 50,
            replies: 10,
            time: '4h',
            isPlayer: false
         });
      }

      // Spotify Counter style text tweet
      if (latestRelease.type === 'Single' && gameState.time.daysPassed > 3) {
         let counterText = `"${latestRelease.title}" — Spotify Counter\n\n`;
         let total = latestRelease.streams?.spotify || 0;
         const dailyAvg = dailyAvgSpotify || Math.floor(total / Math.max(1, gameState.time.daysPassed));
         for (let i = 4; i >= 0; i--) {
            const date = new Date(gameState.time.startDate);
            date.setDate(date.getDate() + gameState.time.daysPassed - i);
            const val = dailyAvg + Math.floor(Math.random() * dailyAvg * 0.1);
            counterText += `${date.toLocaleDateString(undefined, {month:'2-digit', day:'2-digit'})} — ${val.toLocaleString()}\n`;
         }
         counterText += `\nTotal: ${total.toLocaleString()}`;
         
         generatedTweets.push({
            id: '1.9',
            author: { name: 'spotify counter', handle: '@spotify_counter', verified: 'blue', avatar: 'S' },
            content: counterText,
            likes: Math.floor(followerCount * 0.01) + 80,
            retweets: Math.floor(followerCount * 0.005) + 20,
            replies: 5,
            time: '5h',
            isPlayer: false
         });
      }
    }

    const { charts } = computeCharts(gameState);

    const weekProgress = gameState.time.daysPassed % 7;
    let predictionStage = 'Early';
    if (weekProgress >= 5) predictionStage = 'Final';
    else if (weekProgress >= 3) predictionStage = 'Midweek';

    let tweetTime = '12h';
    if (predictionStage === 'Final') tweetTime = '2h';
    else if (predictionStage === 'Early') tweetTime = '1d';

    const hot100Songs = charts.RegionAmerica.slice(0, 10);
    const global200Songs = charts.Global200Single.slice(0, 10);
    const billboard200 = charts.Global200Album.slice(0, 10);

    const hashStr = (str: string) => { let h = 0; for(let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0; return Math.abs(h); };
    const noiseFactor = predictionStage === 'Early' ? 0.25 : predictionStage === 'Midweek' ? 0.10 : 0;
    
    const predictedBaseList = [...charts.RegionAmerica].map(song => {
       const basePointsForUSA = song.regionalPoints?.america || song.computedTotal || 0;
       const noiseSeed = hashStr((song.id || '') + String(gameState.time.daysPassed)) % 100;
       const noiseMult = 1 + ((noiseSeed - 50) / 100) * noiseFactor;
       return { ...song, computedTotal: Math.max(1, basePointsForUSA * noiseMult) };
    });
    predictedBaseList.sort((a, b) => b.computedTotal - a.computedTotal);
    
    // Recalculate movement based on predicted positions
    const predictedHot100Songs = predictedBaseList.slice(0, 10).map((song, idx) => {
        let newMovement = 0;
        if (song.lastPos && song.lastPos !== 'NEW') {
             newMovement = song.lastPos - (idx + 1);
        }
        return { ...song, movement: newMovement };
    });

    // Prediction Tweet
    if (weekProgress < 5) {
       generatedTweets.push({
         id: 'totc_prediction',
         author: { name: 'Talk of the Charts', handle: '@talkofthecharts', verified: 'gold', avatar: TOTC_AVATAR },
         content: `${predictionStage} Billboard Hot 100 predictions`,
         media: <ChartPredictionMedia songs={predictedHot100Songs} playerName={playerName} stage={predictionStage as any} />,
         likes: 24500,
         retweets: 8200,
         replies: 1250,
         time: tweetTime,
         isPlayer: false
       });
    }
    
    // Official charts
    if (weekProgress >= 5) {
       generatedTweets.push({
         id: 'totc_bb200',
         author: { name: 'Talk of the Charts', handle: '@talkofthecharts', verified: 'gold', avatar: TOTC_AVATAR },
         content: `This week's Billboard 200 top 10`,
         media: <OfficialChartMedia songs={billboard200} playerName={playerName} chartName="Billboard 200" currentDate={currentDate} />,
         likes: 54400,
         retweets: 12200,
         replies: 1850,
         time: '13h',
         isPlayer: false
       });
       
       generatedTweets.push({
         id: 'totc_hot100',
         author: { name: 'Talk of the Charts', handle: '@talkofthecharts', verified: 'gold', avatar: TOTC_AVATAR },
         content: `This week's Billboard Hot 100 top 10`,
         media: <OfficialChartMedia songs={hot100Songs} playerName={playerName} chartName="Billboard Hot 100" currentDate={currentDate} />,
         likes: 45400,
         retweets: 9200,
         replies: 2850,
         time: '13h',
         isPlayer: false
       });
       
       generatedTweets.push({
         id: 'totc_global200',
         author: { name: 'Talk of the Charts', handle: '@talkofthecharts', verified: 'gold', avatar: TOTC_AVATAR },
         content: `This week's Billboard Global 200 top 10`,
         media: <OfficialChartMedia songs={global200Songs} playerName={playerName} chartName="Billboard Global 200" currentDate={currentDate} />,
         likes: 31400,
         retweets: 6200,
         replies: 1350,
         time: '10h',
         isPlayer: false
       });
    }

    const generatePopCraveNPC = (song: any, seedMultiplier: number, timeAgo: string) => {
        const stringSeed = "pop" + song.artist + song.title + gameState.time.daysPassed.toString() + seedMultiplier.toString();
        let seed = 0; for(let i = 0; i < stringSeed.length; i++) seed += stringSeed.charCodeAt(i);
        
        let baseMetric = Math.max(1000000, Math.min(15000000, (song.computedTotal || 150) * 100));
        baseMetric = Math.floor(baseMetric * (1 + (seed%20)*0.01));

        const contentText = getPopCraveTweetText(
            song.title,
            song.artist,
            song.type,
            baseMetric,
            (seed % 100) + 1,
            seed
        );

         generatedTweets.push({
          id: `npc_popcrave_${song.title}_${seedMultiplier}`,
          author: { name: 'Pop Crave', handle: '@PopCrave', verified: 'gold', avatar: POP_CRAVE_AVATAR },
          content: contentText,
          media: song.coverImage ? (
                <div className="rounded-2xl overflow-hidden border border-gray-800 aspect-square w-[75%] max-w-[350px] mx-auto mt-2">
                    <img src={song.coverImage} className="w-full h-full object-cover" />
                </div>
            ) : undefined,
          likes: 55000 + (seed % 100) * 1000,
          retweets: 12000 + (seed % 100) * 200,
          replies: 1100,
          time: timeAgo,
          isPlayer: false
        });
    };

    // Occasional NPC Platform Milestones
    const generateMilestone = (song: any, seedMultiplier: number, timeAgo: string) => {
        const platformsArr = ['Spotify', 'AppleMusic', 'AmazonMusic', 'YouTubeMusic', 'YouTube'];
        const stringSeed = song.artist + song.title + gameState.time.daysPassed.toString() + seedMultiplier.toString();
        let seed = 0; for(let i = 0; i < stringSeed.length; i++) seed += stringSeed.charCodeAt(i);
        const rndPlatform = platformsArr[seed % platformsArr.length];
        const specialAccObj = SPECIAL_ACCOUNTS[`@${rndPlatform}`] || SPECIAL_ACCOUNTS['@Spotify'];
        
        const isYouTube = rndPlatform === 'YouTube';
        const finalTypeLabel = isYouTube ? 'MUSIC VIDEO' : 'SINGLE';
        const replaceStreamStr = (str: string) => isYouTube ? str.replace(/stream/i, 'view').replace(/STREAM/g, 'VIEW') : str;

        const npcFormats = [
           { subtitle: replaceStreamStr(`Continues to dominate ${rndPlatform} Global charts`), detail: `Top Song`, metricLabel: replaceStreamStr(`DAILY STREAMS`), changePercent: "+2.1%" },
           { subtitle: replaceStreamStr(`Biggest song of the month on ${rndPlatform}`), detail: "UNSTOPPABLE", metricLabel: replaceStreamStr(`PEAK STREAMS`), changePercent: "+14.3%" },
           { subtitle: `Reaches #1 on ${rndPlatform} Trending`, detail: "CHART TOPPER", metricLabel: `DAILY PLAYS`, changePercent: "+5.5%" },
           { subtitle: replaceStreamStr(`Trending Top 10 on ${rndPlatform} today!`), detail: "VIRAL HIT", metricLabel: `UPDATE`, changePercent: "+1.2%" },
           { subtitle: replaceStreamStr(`Most streamed track this week on ${rndPlatform}`), detail: "FAN FAVORITE", metricLabel: replaceStreamStr(`WEEKLY STREAMS`), changePercent: "+8.9%" }
        ];
        const rndFormat = npcFormats[(seed * 3) % npcFormats.length];
        
        const npcImgUrl = ARTIST_IMAGES[song.artist] || `https://i.pravatar.cc/200?u=${encodeURIComponent(song.artist)}`;
        let baseMetric = Math.max(1000000, Math.min(15000000, (song.computedTotal || 150) * 100));
        baseMetric = Math.floor(baseMetric * (1 + (seed%20)*0.01));
        
        const postType = seed % 3; // 0: Card, 1: Text + Cover, 2: Text + Artist Pic
        
        let mediaContent: any = null;
        let contentText = getPlatformTweetText(
            song.title,
            song.artist,
            song.type,
            rndPlatform,
            baseMetric,
            (seed % 100) + 1,
            seed
        );

        if (postType === 0) {
            mediaContent = <PlatformMilestoneCard 
               platform={rndPlatform}
               albumCover={song.coverImage || npcImgUrl} 
               typeLabel={finalTypeLabel}
               dateLabel={new Date(currentDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
               title={song.title}
               artist={song.artist}
               subtitle={rndFormat.subtitle}
               detail={rndFormat.detail}
               metricValue={baseMetric.toLocaleString()}
               metricLabel={rndFormat.metricLabel}
               changePercent={rndFormat.changePercent}
            />;
        } else if (postType === 1) {
            mediaContent = song.coverImage ? (
                <div className="rounded-2xl overflow-hidden border border-gray-800 aspect-square w-[75%] max-w-[350px] mx-auto mt-2">
                    <img src={song.coverImage} className="w-full h-full object-cover" />
                </div>
            ) : null;
        } else {
            mediaContent = (
                <div className="rounded-2xl overflow-hidden border border-gray-800 aspect-[16/9] w-[90%] max-w-[450px] mx-auto mt-2">
                    <img src={npcImgUrl} className="w-full h-full object-cover" />
                </div>
            );
        }
        
        generatedTweets.push({
          id: `npc_platform_milestone_${song.title}_${seedMultiplier}`,
          author: { name: specialAccObj.name, handle: `@${rndPlatform}`, verified: 'gold', avatar: specialAccObj.avatar },
          content: contentText,
          media: mediaContent,
          likes: 85000 + (seed % 100) * 1000,
          retweets: 15000 + (seed % 100) * 200,
          replies: 1500,
          time: timeAgo,
          isPlayer: false
       });
    };

    // Every day, give updates on a couple random Top 100 songs from NPCs
    if (charts.RegionAmerica.length > 0) {
        const topNPCs = charts.RegionAmerica.filter((s: any) => s && s.artist !== playerName);
        
        // 20-25 NPC platform tweets per day
        const seedStr = gameState.time.daysPassed.toString() + "npc_milestones";
        let daySeed = 0; for(let i=0; i<seedStr.length;i++) daySeed += seedStr.charCodeAt(i);
        
        const numTweets = Math.min(topNPCs.length, (daySeed % 5) + 21); // 21 to 25
        
        for (let i = 0; i < numTweets; i++) {
           if (topNPCs.length > 0) {
               const idx = (daySeed + (i*13)) % topNPCs.length;
               const song = topNPCs[idx];
               if (song) {
                   const timeAgo = `${Math.max(1, (i % 24))}h`;
                   if ((daySeed + i) % 3 === 0) {
                      generatePopCraveNPC(song, i, timeAgo);
                   } else {
                      generateMilestone(song, i, timeAgo);
                   }
               }
           }
        }
    }

    // Debuts and milestones
     let potentialCertTweets: any[] = [];
    gameState.releases.filter(r => !(r as any).isNPCRelease && r.status === 'Published').forEach((release, i) => {
       const releaseDateTime = release.releaseDate ? new Date(release.releaseDate).getTime() : new Date(gameState.time.startDate).getTime();
       const daysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - releaseDateTime) / (1000 * 3600 * 24)));
       const isAlbum = release.type === 'Album';
       const chartName = isAlbum ? 'Billboard 200' : 'Billboard Hot 100';
       const chartList = isAlbum ? charts.Global200Album : charts.RegionAmerica;
       
       const rankData = chartList.find(c => c?.id === release.id);
       const rank = rankData ? chartList.indexOf(rankData) + 1 : null;
       
       if (daysSinceRelease > 0 && daysSinceRelease <= 14 && rank && rank <= 100) {
          generatedTweets.push({
            id: `debut_${release.id}`,
            author: { name: 'chart data', handle: '@chartdata', verified: 'gold', avatar: CHART_DATA_AVATAR },
            content: `${playerName}'s "${release.title}" debuts at #${rank} on the ${chartName}.`,
            media: release.coverImage ? <div className="bg-black flex justify-center"><img src={release.coverImage || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div> : undefined,
            likes: Math.floor(Math.random() * 50000) + 20000,
            retweets: Math.floor(Math.random() * 10000) + 5000,
            replies: Math.floor(Math.random() * 2000) + 500,
            time: '1d',
            isPlayer: false
          });
       }
       
       // Certification
       const sales = release.sales?.total || 0;
       let cert = null;
       if (sales >= 10000000) cert = 'Diamond';
       else if (sales >= 1000000) cert = `${Math.floor(sales / 1000000)}x Platinum`;
       else if (sales >= 500000) cert = 'Gold';
       else if (sales >= 200000) cert = 'Silver';

       if (cert) {
         potentialCertTweets.push({
           id: `cert_${release.id}`,
           author: { name: 'chart data', handle: '@chartdata', verified: 'gold', avatar: CHART_DATA_AVATAR },
           content: `${playerName}'s "${release.title}" is now certified ${cert} in the US for selling over ${sales.toLocaleString()} units!`,
           media: release.coverImage ? <div className="bg-black flex justify-center"><img src={release.coverImage || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div> : undefined,
           likes: Math.floor(followerCount * 0.05) + 10000,
           retweets: Math.floor(followerCount * 0.01) + 2000,
           replies: 1000 + Math.floor(Math.random() * 500),
           time: '3d',
           isPlayer: false
         });
       }
    });

    if (potentialCertTweets.length > 0) {
      const numToPick = Math.min(potentialCertTweets.length, Math.floor(Math.random() * 2) + 2); // 2 or 3
      const shuffled = [...potentialCertTweets].sort(() => 0.5 - Math.random());
      generatedTweets.push(...shuffled.slice(0, numToPick));
    }

    // Monthly Streams
    if (gameState.time.daysPassed > 30) {
        const estimatedMonthly = Math.floor(gameState.stats.streams * (30 / Math.max(1, gameState.time.daysPassed)));
        generatedTweets.push({
            id: `monthly_streams`,
            author: { name: 'chart data', handle: '@chartdata', verified: 'gold', avatar: CHART_DATA_AVATAR },
            content: `${playerName} earned ${estimatedMonthly.toLocaleString()} streams this month on all platforms.`,
            media: gameState.artist?.image ? <div className="bg-black flex justify-center"><img src={gameState.artist.image || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div> : undefined,
            likes: Math.floor(Math.random() * 30000) + 15000,
            retweets: Math.floor(Math.random() * 5000) + 2000,
            replies: Math.floor(Math.random() * 1000) + 300,
            time: '5h',
            isPlayer: false
        });
    }

    // Grammys
    if (gameState.grammys && gameState.grammys.results && gameState.grammys.results.length > 0) {
      const isNomStage = gameState.grammys.stage === 'Nominations';
      const isWinStage = gameState.grammys.stage === 'Ceremony' || gameState.grammys.stage === 'Results';
      const prestigiousCategories = ['Artist of the Year', 'Album of the Year', 'Song of the Year', 'Record of the Year'];

      if (isNomStage) {
         gameState.grammys.results.forEach((result, idx) => {
            const playerNom = result.nominees.find(n => n.isPlayer);
            if (playerNom || prestigiousCategories.includes(result.category)) {
               const nomineesList = result.nominees.map((n:any) => `• ${n.title ? `"${n.title}" by ${n.artist}` : n.artist}`).join('\n');
               let mediaContent = undefined;
               
               if (playerNom) {
                   if (playerNom.type !== 'Artist') {
                     const release = gameState.releases.find(r => r?.id === playerNom.id);
                     if (release?.coverImage) {
                       mediaContent = <div className="bg-black flex justify-center"><img src={release.coverImage || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div>;
                     }
                   } else if (gameState.artist?.image) {
                     mediaContent = <div className="bg-black flex justify-center"><img src={gameState.artist?.image || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div>;
                   }
               }

               generatedTweets.push({
                  id: `grammys_nom_${gameState.grammys?.year}_${idx}`,
                  author: { name: 'Recording Academy / GRAMMYs', handle: '@RecordingAcad', verified: 'gold', avatar: GRAMMYS_AVATAR },
                  content: `${result.category} Nominations are:\n\n${nomineesList}\n\nCongrats to all the nominees! ✨ #GRAMMYs`,
                  media: mediaContent,
                  likes: 154000 + (idx * 10000),
                  retweets: 42000,
                  replies: 12500,
                  time: '1h',
                  isPlayer: false
               });
            }
         });
      }
      
      if (isWinStage) {
         gameState.grammys.results.forEach((result, idx) => {
            if (result.winnerId) {
               const winner = result.nominees.find(n => n?.id === result.winnerId);
               if (winner && (winner.isPlayer || prestigiousCategories.includes(result.category))) {
                  let mediaContent = undefined;
                  
                  if (winner.isPlayer) {
                      if (winner.type !== 'Artist') {
                        const release = gameState.releases.find(r => r?.id === winner.id);
                        if (release?.coverImage) {
                          mediaContent = <div className="bg-black flex justify-center"><img src={release.coverImage || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div>;
                        }
                      } else if (gameState.artist?.image) {
                        mediaContent = <div className="bg-black flex justify-center"><img src={gameState.artist?.image || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div>;
                      }
                  } else {
                      if (winner.coverImage) {
                          mediaContent = <div className="bg-black flex justify-center"><img src={winner.coverImage || undefined} className="w-full max-w-[400px] h-auto shadow-xl border border-gray-800" /></div>;
                      }
                  }

                  generatedTweets.push({
                     id: `grammys_win_${gameState.grammys?.year}_${idx}`,
                     author: { name: 'Recording Academy / GRAMMYs', handle: '@RecordingAcad', verified: 'gold', avatar: GRAMMYS_AVATAR },
                     content: `${winner.title ? `"${winner.title}" by ${winner.artist}` : winner.artist} has won ${result.category}! 🏆\n\nCongratulations! #GRAMMYs`,
                     media: mediaContent,
                     likes: 354000 + (idx * 20000),
                     retweets: 92000,
                     replies: 22500,
                     time: '2h',
                     isPlayer: false
                  });
               }
            }
         });
      }
    }

    // Tour Fan
    const activeTour = gameState.tours?.find(t => t.status !== 'Completed');
    if (activeTour) {
      generatedTweets.push({
        id: '2.1',
        author: { name: 'Concert Updates', handle: '@TourAlerts', verified: 'blue', avatar: 'C' },
        content: `Fans are going crazy for the ${activeTour.name}! The setlist is insane. Are you attending any dates? 🎤🎟️`,
        likes: Math.floor(followerCount * 0.015) + 300,
        retweets: Math.floor(followerCount * 0.005) + 50,
        replies: 45,
        time: '4h',
        isPlayer: false
      });
      generatedTweets.push({
        id: '2.2',
        author: { name: 'emily ♡', handle: '@emily_stans', verified: 'none', avatar: 'E' },
        content: `I JUST SURVIVED THE WAR FOR ${playerHandle.toUpperCase()} TICKETS 😭😭 SEE YOU IN THE FRONT ROW!`,
        likes: Math.floor(followerCount * 0.002) + 20,
        retweets: Math.floor(followerCount * 0.001) + 2,
        replies: 5,
        time: '5h',
        isPlayer: false
      });
    }

    // Merch Fan
    if (gameState.merch && gameState.merch.length > 0) {
      const topMerch = gameState.merch.reduce((prev, current) => (prev.sold > current.sold) ? prev : current);
      if (topMerch.sold > 100) {
        generatedTweets.push({
          id: '2.3',
          author: { name: 'Merch Drops', handle: '@MerchWatcher', verified: 'blue', avatar: 'M' },
          content: `${playerName}'s ${topMerch.name} is selling out incredibly fast. Did you manage to grab one before they're gone? 👕🔥`,
          likes: Math.floor(followerCount * 0.008) + 100,
          retweets: Math.floor(followerCount * 0.002) + 15,
          replies: 10,
          time: '7h',
          isPlayer: false
        });
        generatedTweets.push({
          id: '2.4',
          author: { name: 'alex', handle: '@alex__music', verified: 'none', avatar: 'A' },
          content: `my ${topMerch.name} just arrived and the quality is actually so good wow ${playerHandle}`,
          likes: 34,
          retweets: 2,
          replies: 1,
          time: '6h',
          isPlayer: false
        });
      }
    }

    // Gig / Live Performance
    const recentGigs = gameState.gigs?.filter(g => g.completed);
    if (recentGigs && recentGigs.length > 0) {
      const lastGig = recentGigs[recentGigs.length - 1];
      generatedTweets.push({
        id: '2.5',
        author: { name: 'local live music', handle: '@locallive', verified: 'none', avatar: 'L' },
        content: `saw ${playerName} perform at ${lastGig.name} in ${lastGig.region}... honestly incredible stage presence. totally worth it.`,
        likes: 120,
        retweets: 15,
        replies: 4,
        time: '18h',
        isPlayer: false
      });
    }

    // Regional Popularity Praise
    if (gameState.popularity.latinAmerica > 40) {
      generatedTweets.push({
        id: '2.6',
        author: { name: 'Brazil Updates 🇧🇷', handle: '@BrazilStans', verified: 'blue', avatar: 'B' },
        content: `COME TO BRAZIL 🇧🇷🇧🇷 LATAM LOVES YOU ${playerHandle.toUpperCase()}!!`,
        likes: Math.floor(followerCount * 0.02) + 500,
        retweets: Math.floor(followerCount * 0.005) + 100,
        replies: 30,
        time: '9h',
        isPlayer: false
      });
    }
    
    if (gameState.popularity.europe > 50) {
      generatedTweets.push({
        id: '2.7',
        author: { name: 'UK Charts', handle: '@UKChartsLive', verified: 'none', avatar: 'U' },
        content: `${playerName} is dominating the airwaves across Europe right now. A true global smash.`,
        likes: 3400,
        retweets: 540,
        replies: 22,
        time: '11h',
        isPlayer: false
      });
    }

    // Random fan
    const randomFanMessages = [
      `thinking about ${playerName}... they need to drop the album right now 😭`,
      `if ${playerHandle} has a million fans, I am one of them. if they have one fan, it's me.`,
      `listening to ${playerName} making me feel like i'm floating rn ✨`,
      `how does ${playerHandle} never miss?? literally every song is a bop`
    ];
    generatedTweets.push({
      id: '3',
      author: { name: 'Sarah', handle: '@sarahlovesmusic', verified: 'blue', avatar: 'S' },
      content: randomFanMessages[Math.floor(gameState.time.daysPassed % randomFanMessages.length)],
      likes: Math.floor(followerCount * 0.005) + 12,
      retweets: 5,
      replies: 2,
      time: '6h',
      isPlayer: false
    });

    // Random Hater
    const haterMessages = [
      `who even listens to ${playerHandle} unironically? industry plant confirmed.`,
      `overrated... people hype up ${playerName} for absolutely nothing.`,
      `flop era incoming for ${playerHandle} 🥱`,
      `${playerName}'s discography is literally all skips.`
    ];
    generatedTweets.push({
      id: '4',
      author: { name: 'hater #1', handle: '@dailyhater', verified: 'none', avatar: 'H' },
      content: haterMessages[Math.floor((gameState.time.daysPassed + 1) % haterMessages.length)],
      likes: Math.floor(followerCount * 0.002) + 40,
      retweets: 10,
      replies: 89,
      time: '8h',
      isPlayer: false
    });

    // Player's latest tweet
    generatedTweets.push({
      id: '5',
      author: { name: playerName, handle: playerHandle, verified: playerVerifiedType, avatar: gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0] },
      content: latestRelease ? `thank u for streaming ${latestRelease.title} 🖤` : `working on something special for u guys...`,
      likes: Math.floor(followerCount * 0.02) + 1000,
      retweets: Math.floor(followerCount * 0.008) + 200,
      replies: Math.floor(followerCount * 0.005) + 50,
      time: '1d',
      isPlayer: true
    });

    if (gameState.artist?.socialProfile?.customTweets) {
      const customTweets = gameState.artist.socialProfile.customTweets.map(ct => {
         const daysAgo = gameState.time.daysPassed - ct.date;
         let timeStr = 'Just now';
         if (daysAgo === 0) timeStr = 'Today';
         else if (daysAgo === 1) timeStr = '1d';
         else if (daysAgo > 1) timeStr = `${daysAgo}d`;
         
         return {
            id: ct.id,
            author: { name: playerName, handle: playerHandle, verified: playerVerifiedType, avatar: gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0] },
            content: ct.content,
            likes: ct.likes,
            retweets: ct.retweets,
            replies: ct.replies,
            time: timeStr,
            isPlayer: true
         };
      });
      generatedTweets.unshift(...customTweets);
    }

    return generatedTweets.sort((a,b) => {
       const aNum = parseFloat(a.id);
       const bNum = parseFloat(b.id);
       if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
       return 0; // keep custom tweets at top
    });
  }, [gameState, followerCount, playerHandle, playerName, playerVerifiedType]);

  const forYouTweets = tweets;

  const navigateToProfile = (handle: string) => {
    if (handle === playerHandle) {
      setViewingProfile('player');
      setActiveTab('profile');
    } else {
      setViewingProfile(handle);
    }
  };

  const renderProfile = (handle: string) => {
     const specialAcc = SPECIAL_ACCOUNTS[handle];
     const isPlayerProfile = handle === 'player' || handle === playerHandle;
     
     let profileName = handle.substring(1);
     let profileFollowers = Math.floor(Math.random() * 5000000);
     let profileVerifiedType: 'blue' | 'gold' | 'none' = 'blue';
     let npcImage: string | undefined = undefined;

     if (isPlayerProfile) {
         profileName = playerName;
         profileFollowers = followerCount;
         profileVerifiedType = playerVerifiedType as any;
     } else if (specialAcc) {
         profileName = specialAcc.name;
         profileFollowers = specialAcc.followers;
         profileVerifiedType = specialAcc.verified;
     } else {
         // Potential NPC handle match
         const npcObj = Object.keys(ARTIST_IMAGES).find(a => `@${a.replace(/\s+/g,'')}`.toLowerCase() === handle.toLowerCase());
         if (npcObj) {
            profileName = npcObj;
            let seed = 0;
            for(let i = 0; i < profileName.length; i++) seed += profileName.charCodeAt(i);
            profileFollowers = 5000000 + (seed * 150000) % 20000000;
            profileVerifiedType = 'gold'; 
         }
         npcImage = ARTIST_IMAGES[profileName] || `https://i.pravatar.cc/200?u=${encodeURIComponent(profileName)}`;
     }

     const currentHandle = isPlayerProfile ? playerHandle : handle;
     const profileTweetsList = tweets.filter(t => t.author.handle === currentHandle);

     return (
       <div className="flex h-full bg-black text-white font-sans w-[100vw] lg:w-full lg:max-w-[600px] flex-col mx-auto border-x border-gray-800 pb-[60px] lg:pb-0 relative">
          <div className="flex items-center gap-6 px-4 py-2 sticky top-0 bg-black/60 backdrop-blur-md z-20 border-b border-gray-800">
             <button onClick={() => {
                if (viewingProfile) setViewingProfile(null);
             }} className="p-2 hover:bg-gray-900 rounded-full transition-colors backdrop-blur-md lg:hidden">
                <ArrowLeft className="w-5 h-5 text-white" />
             </button>
             <button onClick={() => {
                if (viewingProfile) setViewingProfile(null);
             }} className="hidden lg:block p-2 hover:bg-gray-900 rounded-full transition-colors backdrop-blur-md">
                <ArrowLeft className="w-5 h-5 text-white" />
             </button>
             <div className="flex flex-col">
                <span className="text-xl font-bold leading-tight flex items-center gap-1">
                   {profileName} <VerifiedBadge type={profileVerifiedType} className="w-5 h-5" />
                </span>
                <span className="text-[13px] text-gray-500 leading-tight">{profileTweetsList.length} posts</span>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar">
             <div className="relative">
                <div className="h-32 lg:h-48 bg-gradient-to-r from-gray-800 to-gray-600 w-full relative">
                   {isPlayerProfile && gameState.artist?.image && (
                      <div className="absolute inset-0 bg-cover bg-center blur-sm opacity-50" style={{ backgroundImage: `url(${gameState.artist.image})` }}></div>
                   )}
                   {specialAcc && specialAcc.banner && (
                      <div className="absolute inset-0 z-0">
                          {specialAcc.banner}
                      </div>
                   )}
                   {!isPlayerProfile && !specialAcc && npcImage && (
                      <div className="absolute inset-0 bg-cover bg-center blur-sm opacity-60" style={{ backgroundImage: `url(${npcImage})` }}></div>
                   )}
                </div>
                <div className="px-4 pb-4 pt-3 relative">
                   <div className="flex justify-between items-start absolute -top-12 left-4 right-4">
                      <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-black flex items-center justify-center text-4xl font-bold overflow-hidden z-10">
                         {(isPlayerProfile && gameState.artist?.image) ? (
                            <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" alt="Profile" />
                         ) : specialAcc && specialAcc.avatar ? (
                            specialAcc.avatar
                         ) : !isPlayerProfile && !specialAcc && npcImage ? (
                            <img src={npcImage} className="w-full h-full object-cover" alt="NPC Profile" />
                         ) : (
                            profileName[0]
                         )}
                      </div>
                      {!isPlayerProfile && (
                        <button className="mt-14 px-4 py-1.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                           Follow
                        </button>
                      )}
                      {isPlayerProfile && (
                        <button onClick={() => setIsEditingProfile(true)} className="mt-14 px-4 py-1.5 bg-transparent border border-gray-600 text-white font-bold rounded-full hover:bg-gray-900 transition-colors">
                           Edit profile
                        </button>
                      )}
                   </div>
                   <div className="mt-16">
                      <span className="text-xl font-black block flex items-center gap-1">
                         {profileName} <VerifiedBadge type={profileVerifiedType} className="w-5 h-5" />
                      </span>
                      <span className="text-[15px] text-gray-500 block">{currentHandle}</span>
                   </div>
                   <div className="mt-3 text-[15px] whitespace-pre-wrap">
                      {isPlayerProfile ? (gameState.artist?.socialProfile?.bio || "Musician. Stream my new music now!") : "Official account."}
                   </div>
                   <div className="flex gap-4 mt-3 text-[14px]">
                      <span className="text-gray-500"><span className="text-white font-bold">0</span> Following</span>
                      <span className="text-gray-500"><span className="text-white font-bold">{profileFollowers.toLocaleString()}</span> Followers</span>
                   </div>
                </div>
             </div>
             <div className="flex border-b border-gray-800">
                <button className="flex-1 hover:bg-gray-900 transition-colors relative">
                   <div className="py-4 text-[15px] font-bold text-white inline-block">
                      Posts
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1 bg-[#1D9BF0] rounded-full"></div>
                   </div>
                </button>
                <button className="flex-1 hover:bg-gray-900 transition-colors text-gray-500 font-medium text-[15px]">Replies</button>
                <button className="flex-1 hover:bg-gray-900 transition-colors text-gray-500 font-medium text-[15px]">Media</button>
             </div>

             <div className="flex flex-col">
                {profileTweetsList.length === 0 && (
                   <div className="py-12 text-center text-gray-500 text-[15px]">
                      No posts yet.
                   </div>
                )}
                {profileTweetsList.map(t => <Tweet key={t.id} tweet={t} onProfileClick={navigateToProfile} />)}
             </div>
          </div>
       </div>
     );
  };

  const renderMessages = () => {
      const msgs = [
          { name: "Spotify Updates", handle: "@spotify", msg: "Your new track is making waves! Check out the numbers.", time: "2h", avatar: "S" },
          { name: "Talk of the Charts", handle: "@talkofthecharts", msg: "Prediction: You might reach the top 10 this week.", time: "5h", avatar: "T" },
          { name: "Super Fan", handle: "@fanacc_x", msg: "PLEASE DROP THE ALBUM OR I WILL LITERALLY CRY", time: "1d", avatar: "S" },
          { name: "Management", handle: "@mgmt_team", msg: "Don't forget the interview tomorrow. Details enclosed.", time: "1d", avatar: "M" }
      ];

      return (
      <div className="flex flex-col w-[100vw] lg:w-full lg:max-w-[600px] border-x border-gray-800 mx-auto pb-[60px] lg:pb-0 h-full relative">
         <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 p-4 border-b border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="lg:hidden w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold overflow-hidden" onClick={() => setViewingProfile('player')}>
                  {gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0]}
               </div>
               <h2 className="text-xl font-bold border-l-2 lg:border-l-0 pl-3 lg:pl-0 border-gray-700">Messages</h2>
            </div>
            <div className="flex gap-2">
               <button className="text-white hover:bg-gray-900 rounded-full p-2 transition-colors"><Settings className="w-5 h-5" /></button>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto hide-scrollbar">
             {msgs.map((m, i) => (
                <div key={i} className="p-4 flex flex-col gap-1 border-b border-gray-800 hover:bg-white/[0.03] cursor-pointer">
                   <div className="flex justify-between items-start">
                       <div className="flex gap-3 items-center">
                           <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center font-bold flex-shrink-0 text-white">{m.avatar}</div>
                           <div className="flex flex-col overflow-hidden">
                               <div className="flex items-center gap-1.5"><span className="font-bold truncate">{m.name}</span> <span className="text-gray-500 text-[14px] truncate">{m.handle}</span> <span className="text-gray-500 text-[14px] shrink-0">· {m.time}</span></div>
                               <span className="text-gray-400 text-[14px] leading-snug truncate mt-0.5">{m.msg}</span>
                           </div>
                       </div>
                   </div>
                </div>
             ))}
         </div>
         <button className="absolute bottom-20 lg:bottom-6 right-6 w-14 h-14 bg-[#1D9BF0] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1a8cd8] transition-colors">
             <Mail className="w-6 h-6 fill-white" />
         </button>
      </div>
      );
  };

  const renderTrends = () => {
    // Generate dynamic trends
    const dynamicTrends: any[] = [];
    const seed = gameState.time.daysPassed;
    const rnd = (max: number, offset = 0) => Math.floor(Math.abs(Math.sin(seed + offset) * 10000)) % max;
    
    // Player's basic trend based on followers
    dynamicTrends.push({ genre: "Music · Trending", title: playerName, posts: `${Math.floor(followerCount * 0.4 + rnd(10000)).toLocaleString()}` });

    // Chart Trends
    const weekProgress = gameState.time.daysPassed % 7;
    if (weekProgress < 5) {
       dynamicTrends.push({ genre: "Charts · Trending", title: "Hot 100 Predictions", posts: `${15 + rnd(20)}.${rnd(9)}K` });
    } else {
       dynamicTrends.push({ genre: "Charts · Trending", title: "Billboard Hot 100", posts: `${30 + rnd(40)}.${rnd(9)}K` });
       dynamicTrends.push({ genre: "Charts · Trending", title: "Billboard 200", posts: `${20 + rnd(30)}.${rnd(9)}K` });
    }

    // Grammys
    if (gameState.grammys && gameState.grammys.results && gameState.grammys.results.length > 0 && gameState.time.daysPassed % 365 > 300) {
       if (gameState.grammys.stage === 'Nominations') {
          dynamicTrends.push({ genre: "Music · Trending", title: "#GRAMMYs Nominations", posts: `${500 + rnd(500)}K` });
       } else if (gameState.grammys.stage === 'Ceremony' || gameState.grammys.stage === 'Results') {
          dynamicTrends.push({ genre: "Music · Trending", title: "#GRAMMYs", posts: `${1 + rnd(3)}.${rnd(9)}M` });
          // Find a big winner if any
          let popWinner = gameState.grammys.results.find(r => r.category === 'Artist of the Year' || r.category === 'Album of the Year');
          if (popWinner && popWinner.winnerId) {
              const winnerNom = popWinner.nominees.find(n => n.id === popWinner.winnerId);
              if (winnerNom) {
                  dynamicTrends.push({ genre: "Pop · Trending", title: `${winnerNom.artist} won`, posts: `${100 + rnd(400)}K` });
              }
          }
       }
    }

    // Releases
    const latestRelease = gameState.releases.filter(r => !(r as any).isNPCRelease && r.status === 'Published').pop();
    if (latestRelease) {
        const currentDate = new Date(gameState.time.startDate);
        currentDate.setDate(currentDate.getDate() + gameState.time.daysPassed);
        const releaseDateTime = latestRelease.releaseDate ? new Date(latestRelease.releaseDate).getTime() : new Date(gameState.time.startDate).getTime();
        const daysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - releaseDateTime) / (1000 * 3600 * 24)));
        
        if (daysSinceRelease <= 4) {
            dynamicTrends.push({ genre: "Music · Trending", title: latestRelease.title, posts: `${50 + rnd(100)}K` });
        }
    }

    // Top artists and stan wars
    const { charts } = computeCharts(gameState);
    if (charts.RegionAmerica && charts.RegionAmerica.length > 0) {
       const topNPCs = charts.RegionAmerica.slice(0, 10).map(c => {
           let a = c.artist || '';
           if (a.includes(' & ')) a = a.split(' & ')[0];
           if (a.includes(' feat. ')) a = a.split(' feat. ')[0];
           return a;
       }).filter((a, i, self) => self.indexOf(a) === i && a !== playerName);
       if (topNPCs.length >= 2) {
           const topNPC1 = topNPCs[rnd(Math.min(5, topNPCs.length), 5)]; 
           const topNPC2 = topNPCs[rnd(Math.min(5, topNPCs.length), 15)]; 
           
           if (topNPC1) {
               dynamicTrends.push({ genre: "Pop · Trending", title: topNPC1, posts: `${10 + rnd(50)}.${rnd(9)}K` });
               // occasionally generate drama
               if (rnd(10, 25) > 5) {
                   const dramas = ["flop", "industry plant", "vocals", "payola", "overrated"];
                   dynamicTrends.push({ genre: "Stan Twitter · Trending", title: `${topNPC1} ${dramas[rnd(dramas.length, 30)]}`, posts: `${5 + rnd(20)}.${rnd(9)}K` });
               }
           }
           if (topNPC2 && topNPC1 !== topNPC2 && rnd(10, 35) > 4) {
               dynamicTrends.push({ genre: "Pop Culture · Trending", title: `${topNPC1} vs ${topNPC2}`, posts: `${15 + rnd(50)}K` });
           }
       }
    }

    // Live Tours
    const activeTour = gameState.tours?.find(t => t.status !== 'Completed');
    if (activeTour) {
       dynamicTrends.push({ genre: "Live Events · Trending", title: activeTour.name, posts: `${30 + rnd(40)}K` });
       if (rnd(10, 45) > 5) {
           dynamicTrends.push({ genre: "Music · Trending", title: `${playerName} Tour Tickets`, posts: `${1 + rnd(5)}.${rnd(9)}M` });
       }
    }

    // New Music Friday
    if (weekProgress === 5) {
       dynamicTrends.push({ genre: "Music · Trending", title: "New Music Friday", posts: `${80 + rnd(40)}K` });
       dynamicTrends.push({ genre: "Music · Trending", title: "Spotify", posts: `${200 + rnd(300)}K` });
    }
    
    // Assorted Pop keywords & Viral sounds
    const popKeywords = ["#Spotify", "Apple Music", "Sales", "Streams", "Debut", "Album", "Single", "VMA", "Billboard", "Global 200"];
    const viralKeywords = ["TikTok Dance", "Viral Sound", "AOTY", "SOTY", "Main Pop Girl", "Local", "Stans"];
    
    dynamicTrends.push({ genre: "Trending", title: popKeywords[rnd(popKeywords.length, 50)], posts: `${20 + rnd(80)}K` });
    dynamicTrends.push({ genre: "Entertainment · Trending", title: viralKeywords[rnd(viralKeywords.length, 60)], posts: `${10 + rnd(50)}.${rnd(9)}K` });
    dynamicTrends.push({ genre: "Trending", title: popKeywords[rnd(popKeywords.length, 70)], posts: `${5 + rnd(25)}K` });

    // Occasionally player drama
    if (followerCount > 1000000 && rnd(10, 80) > 7) {
        const playerDramas = ["is over", "apologize", "vocals", "outcharting", "ended"];
        dynamicTrends.push({ genre: "Stan Twitter · Trending", title: `${playerName} ${playerDramas[rnd(playerDramas.length, 90)]}`, posts: `${10 + rnd(40)}K` });
    }

    // Deduplicate and randomize order somewhat based on seed
    const sortSeed = (str: string) => { let h = 0; for(let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0; return Math.abs(h); };
    const uniqueTrends = Array.from(new Map(dynamicTrends.map(item => [item.title, item])).values());
    uniqueTrends.sort((a, b) => {
        return (sortSeed(b.title + seed) % 100) - (sortSeed(a.title + seed) % 100);
    });

    const finalTrends = uniqueTrends.slice(0, 10);

    const allAccounts: {handle: string, name: string, isSpecial?: boolean, avatar?: any, verified?: string}[] = [];
    allAccounts.push({ handle: playerHandle, name: playerName, isSpecial: true, avatar: gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0], verified: playerVerifiedType });
    Object.keys(SPECIAL_ACCOUNTS).forEach(key => {
        allAccounts.push({ handle: key, name: SPECIAL_ACCOUNTS[key].name, isSpecial: true, avatar: SPECIAL_ACCOUNTS[key].avatar, verified: SPECIAL_ACCOUNTS[key].verified });
    });
    const uniqueNPCs = Object.keys(ARTIST_IMAGES).filter(a => a !== playerName);
    uniqueNPCs.forEach(npc => {
        const npcImgUrl = ARTIST_IMAGES[npc] || `https://i.pravatar.cc/200?u=${encodeURIComponent(npc)}`;
        allAccounts.push({ 
           handle: `@${npc.replace(/\s+/g,'')}`, 
           name: npc, 
           isSpecial: false,
           avatar: <img src={npcImgUrl} className="w-full h-full object-cover" alt={npc} />,
           verified: 'gold'
        });
    });

    const searchResults = searchQuery.trim() ? allAccounts.filter(acc => 
       acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       acc.handle.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

    return (
      <div className="flex flex-col w-[100vw] lg:w-full lg:max-w-[600px] border-x border-gray-800 mx-auto pb-[60px] lg:pb-0 h-full relative">
         <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 p-3 pt-4 px-4 border-b border-gray-800 flex items-center gap-4">
            <div className="lg:hidden w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold overflow-hidden flex-shrink-0" onClick={() => setViewingProfile('player')}>
               {gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0]}
            </div>
            <div className="relative flex-1">
               <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
               <input type="text" placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-900 border border-transparent outline-none rounded-full py-2 pl-12 pr-4 text-white text-[15px] focus:bg-black focus:border-[#1D9BF0] transition-colors" />
            </div>
            <button className="text-white hover:bg-gray-900 rounded-full p-2 transition-colors lg:hidden"><Settings className="w-5 h-5" /></button>
         </div>
         <div className="flex-1 overflow-y-auto hide-scrollbar">
             {searchQuery.trim() ? (
                <>
                   {searchResults.length === 0 ? (
                       <div className="p-8 text-center text-gray-500">No results found for "{searchQuery}"</div>
                   ) : (
                       searchResults.map((acc, idx) => (
                           <div key={idx} onClick={() => { setSearchQuery(''); setViewingProfile(acc.handle); }} className="p-4 border-b border-gray-800 hover:bg-white/[0.03] cursor-pointer flex items-center justify-between transition-colors">
                               <div className="flex items-center gap-3">
                                   <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                                      {acc.avatar !== undefined ? acc.avatar : acc.name[0]}
                                   </div>
                                   <div className="flex flex-col">
                                       <span className="font-bold flex items-center gap-1">
                                          {acc.name} 
                                          {(acc.verified || acc.isSpecial === false) && <VerifiedBadge type={(acc.verified as any) || 'blue'} />}
                                       </span>
                                       <span className="text-[15px] text-gray-500">{acc.handle}</span>
                                   </div>
                               </div>
                           </div>
                       ))
                   )}
                </>
             ) : (
                <>
                   <div className="p-4 border-b border-gray-800">
                      <h2 className="text-xl font-black">Trends for you</h2>
                   </div>
                   {finalTrends.map((trend, idx) => (
                       <div key={idx} className="p-4 border-b border-gray-800 hover:bg-white/[0.03] cursor-pointer flex justify-between items-start transition-colors">
                           <div className="flex flex-col">
                              <span className="text-[13px] text-gray-500 mb-0.5">{trend.genre}</span>
                              <span className="font-bold text-[15px]">{trend.title}</span>
                              <span className="text-[13px] text-gray-500 mt-1">{trend.posts} posts</span>
                           </div>
                           <button className="text-gray-500 hover:text-[#1D9BF0] rounded-full p-2 hover:bg-[#1D9BF0]/10 transition-colors -mr-2">
                              <MoreHorizontal className="w-4 h-4" />
                           </button>
                       </div>
                   ))}
                </>
             )}
         </div>
      </div>
    );
  };

  const renderFeed = () => {
    return (
      <div className="flex flex-col w-[100vw] lg:w-full lg:max-w-[600px] border-x border-gray-800 mx-auto pb-[60px] lg:pb-0 h-full relative">
         <div className="sticky top-0 bg-black/60 backdrop-blur-md z-10 border-b border-gray-800">
           <div className="flex lg:hidden items-center justify-between p-3">
               <div className="w-10">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold overflow-hidden" onClick={() => setViewingProfile('player')}>
                     {gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0]}
                  </div>
               </div>
               <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 fill-white"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
               <div className="w-10 flex justify-end">
                  <button onClick={onClose} className="p-2 -mr-2 hover:bg-gray-900 rounded-full transition-colors text-gray-200">
                     <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
               </div>
           </div>
           <div className="flex h-[53px]">
              <button 
                onClick={() => setActiveTab('feed')}
                className="flex-1 flex justify-center hover:bg-white/[0.03] transition-colors cursor-pointer relative"
              >
                 <div className={`flex items-center h-full px-2 font-bold text-[15px] ${activeTab === 'feed' ? 'text-white' : 'text-gray-500 font-medium'}`}>
                   For you
                   {activeTab === 'feed' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1D9BF0] rounded-full"></div>}
                 </div>
              </button>
              <button 
                className="flex-1 flex justify-center hover:bg-white/[0.03] transition-colors cursor-pointer relative"
              >
                 <div className="flex items-center h-full px-2 text-gray-500 font-medium text-[15px]">
                   Following
                 </div>
              </button>
           </div>
         </div>

         {/* Composer */}
         <div className="hidden sm:flex gap-3 p-4 border-b border-gray-800">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex shrink-0 items-center justify-center font-bold text-lg cursor-pointer overflow-hidden" onClick={() => setViewingProfile('player')}>
               {gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0]}
            </div>
            <div className="flex-1 flex flex-col pt-1.5">
               <input 
                  type="text" 
                  placeholder="What is happening?!" 
                  className="bg-transparent border-none outline-none text-xl placeholder:text-gray-500 mb-4 text-white" 
                  value={newTweetContent}
                  onChange={(e) => setNewTweetContent(e.target.value)}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter') handlePostTweet();
                  }}
               />
               {newTweetImage && (
                  <div className="relative mb-4">
                     <img src={newTweetImage || undefined} className="w-full max-h-[300px] object-cover rounded-2xl border border-gray-800" />
                     <button onClick={() => setNewTweetImage(null)} className="absolute top-2 right-2 bg-black/60 p-2 rounded-full hover:bg-black/80 transition-colors">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></svg>
                     </button>
                  </div>
               )}
               <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                  <div className="flex gap-4 text-[#1D9BF0]">
                     <label className="hover:bg-[#1D9BF0]/10 p-2 -m-2 rounded-full transition-colors cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                try {
                                   const { compressImage } = await import('../imageUtils');
                                   const compressed = await compressImage(file, 400, 400, 0.7);
                                   setNewTweetImage(compressed);
                                } catch(err) {
                                    console.error(err);
                                }
                            }
                        }} />
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[20px] h-[20px] fill-current"><g><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></g></svg>
                     </label>
                  </div>
                  <button 
                    onClick={handlePostTweet}
                    disabled={!newTweetContent.trim() && !newTweetImage}
                    className="bg-[#1D9BF0] hover:bg-[#1a8cd8] text-white font-bold py-1.5 px-4 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     Post
                  </button>
               </div>
            </div>
         </div>

         {/* Mobile Post floating button */}
         <button className="sm:hidden fixed bottom-[76px] right-4 w-14 h-14 bg-[#1D9BF0] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1a8cd8] transition-colors z-40">
             <Plus className="w-6 h-6 fill-white" />
         </button>

         {/* Actual Feed List */}
         <div className="flex-1 overflow-y-auto hide-scrollbar">
           {forYouTweets.map(tweet => (
             <Tweet key={tweet.id} tweet={tweet} onProfileClick={navigateToProfile} />
           ))}
         </div>
      </div>
    );
  };

  let activeContent;
  if (viewingProfile) {
     activeContent = renderProfile(viewingProfile);
  } else if (activeTab === 'profile') {
     activeContent = renderProfile(playerHandle);
  } else if (activeTab === 'messages') {
     activeContent = renderMessages();
  } else if (activeTab === 'trends') {
     activeContent = renderTrends();
  } else {
     activeContent = renderFeed();
  }

  return (
    <div className="flex h-full bg-black text-white font-sans w-full justify-center overflow-hidden relative">
        {/* LEFT NAV (Desktop) */}
        <div className="hidden lg:flex flex-col w-[275px] pt-4 px-4 gap-4 items-end pr-8 shrink-0">
            <div className="w-full max-w-[200px]">
               <svg viewBox="0 0 24 24" aria-hidden="true" className="w-8 h-8 fill-white ml-3 mb-6 cursor-pointer"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
               <div className="flex flex-col gap-2 relative h-[calc(100vh-100px)]">
                   <button onClick={() => { setActiveTab('feed'); setViewingProfile(null); }} className={`flex items-center gap-4 p-3 rounded-full text-xl transition-colors w-max hover:bg-gray-900 ${activeTab === 'feed' && !viewingProfile ? 'font-bold text-white' : 'font-normal text-gray-200'}`}>
                     <Home className={`w-7 h-7 ${activeTab === 'feed' && !viewingProfile ? 'fill-current' : ''}`} /> Home
                   </button>
                   <button onClick={() => { setActiveTab('trends'); setViewingProfile(null); }} className={`flex items-center gap-4 p-3 rounded-full text-xl transition-colors w-max hover:bg-gray-900 ${activeTab === 'trends' && !viewingProfile ? 'font-bold text-white' : 'font-normal text-gray-200'}`}>
                     <Search className={`w-7 h-7 ${activeTab === 'trends' && !viewingProfile ? 'stroke-[3]' : ''}`} /> Explore
                   </button>
                   <button onClick={() => { setActiveTab('messages'); setViewingProfile(null); }} className={`flex items-center gap-4 p-3 rounded-full text-xl transition-colors w-max hover:bg-gray-900 ${activeTab === 'messages' && !viewingProfile ? 'font-bold text-white' : 'font-normal text-gray-200'}`}>
                     <Mail className={`w-7 h-7 ${activeTab === 'messages' && !viewingProfile ? 'fill-current' : ''}`} /> Messages
                   </button>
                   <button onClick={() => { setActiveTab('profile'); setViewingProfile(playerHandle); }} className={`flex items-center gap-4 p-3 rounded-full text-xl transition-colors w-max hover:bg-gray-900 ${activeTab === 'profile' || viewingProfile === playerHandle ? 'font-bold text-white' : 'font-normal text-gray-200'}`}>
                     <User className={`w-7 h-7 ${activeTab === 'profile' || viewingProfile === playerHandle ? 'fill-current' : ''}`} /> Profile
                   </button>
                   <button onClick={onClose} className="flex items-center gap-4 p-3 mt-4 rounded-full text-xl font-normal text-gray-400 hover:text-white transition-colors w-max hover:bg-gray-900">
                     <ArrowLeft className="w-7 h-7" /> Back to Game
                   </button>

                   <button className="w-[90%] bg-[#1D9BF0] hover:bg-[#1a8cd8] text-white font-bold py-3 px-8 rounded-full transition-colors text-lg mt-4 shadow-md">
                      Post
                   </button>
                   
                   {/* User bottom profile */}
                   <div className="absolute bottom-6 left-0 flex items-center gap-3 p-3 hover:bg-gray-900 rounded-full cursor-pointer w-[250px] mt-4 z-10 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex shrink-0 items-center justify-center font-bold text-lg overflow-hidden">
                         {gameState.artist?.image ? <img src={gameState.artist.image || undefined} className="w-full h-full object-cover" /> : playerName[0]}
                      </div>
                      <div className="flex flex-col truncate">
                         <span className="font-bold text-[15px] leading-tight flex items-center truncate">{playerName}</span>
                         <span className="text-gray-500 text-[15px] truncate">{playerHandle}</span>
                      </div>
                      <MoreHorizontal className="w-5 h-5 ml-auto text-gray-400 shrink-0" />
                   </div>
               </div>
            </div>
        </div>

        {/* MAIN VIEW */}
        <div className="flex-1 lg:max-w-[1000px] flex w-full">
           {activeContent}
        
           {/* RIGHT SIDEBAR (Desktop) */}
           <div className="hidden lg:flex flex-col w-[350px] pl-8 pt-4 shrink-0">
               {activeTab !== 'trends' && (
               <div className="bg-[#16181c] rounded-2xl p-4 mb-4">
                   <h2 className="text-xl font-extrabold mb-4">What's happening</h2>
                   <div className="flex flex-col pb-2 gap-5">
                      <div>
                          <div className="text-[13px] text-gray-500 flex justify-between"><span>Music · Trending</span> <span>...</span></div>
                          <div className="font-bold">{playerName}</div>
                          <div className="text-[13px] text-gray-500">{Math.floor(followerCount * 0.4).toLocaleString()} posts</div>
                      </div>
                      <div>
                          <div className="text-[13px] text-gray-500 flex justify-between"><span>Charts · Trending</span> <span>...</span></div>
                          <div className="font-bold">Hot 100 Predictions</div>
                          <div className="text-[13px] text-gray-500">24.5K posts</div>
                      </div>
                      <div>
                          <div className="text-[13px] text-gray-500 flex justify-between"><span>Pop · Trending</span> <span>...</span></div>
                          <div className="font-bold">Top 10</div>
                          <div className="text-[13px] text-gray-500">18.2K posts</div>
                      </div>
                   </div>
               </div>
               )}
               <div className="text-[13px] text-gray-500 px-4">
                   Terms of Service Privacy Policy Cookie Policy Accessibility Ads info More © 2026 X Corp.
               </div>
           </div>
        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-black border-t border-gray-800 flex justify-around items-center z-[100]">
           <button onClick={() => { setActiveTab('feed'); setViewingProfile(null); }} className="p-3">
              <Home className={`w-7 h-7 ${activeTab === 'feed' && !viewingProfile ? 'fill-current text-white' : 'text-gray-500 hover:text-gray-300 transition-colors'}`} />
           </button>
           <button onClick={() => { setActiveTab('trends'); setViewingProfile(null); }} className="p-3">
              <Search className={`w-7 h-7 ${activeTab === 'trends' && !viewingProfile ? 'stroke-[3] text-white' : 'text-gray-500 hover:text-gray-300 transition-colors'}`} />
           </button>
           <button onClick={() => { setActiveTab('messages'); setViewingProfile(null); }} className="p-3">
              <Mail className={`w-7 h-7 ${activeTab === 'messages' && !viewingProfile ? 'fill-current text-white' : 'text-gray-500 hover:text-gray-300 transition-colors'}`} />
           </button>
           <button onClick={() => { setActiveTab('profile'); setViewingProfile(playerHandle); }} className="p-3">
              <User className={`w-7 h-7 ${activeTab === 'profile' || viewingProfile === playerHandle ? 'fill-current text-white' : 'text-gray-500 hover:text-gray-300 transition-colors'}`} />
           </button>
        </div>

        {isEditingProfile && (
           <div className="fixed inset-0 bg-white/10 flex items-center justify-center z-[110] p-4">
              <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
                 <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-6">
                       <button onClick={() => setIsEditingProfile(false)} className="hover:bg-gray-900 p-2 -ml-2 rounded-full transition-colors">
                          <ArrowLeft className="w-5 h-5" />
                       </button>
                       <span className="text-xl font-bold">Edit profile</span>
                    </div>
                    <button onClick={handleSaveProfile} className="bg-white text-black font-bold px-4 py-1.5 rounded-full hover:bg-gray-200">
                       Save
                    </button>
                 </div>
                 <div className="p-4 flex flex-col gap-4">
                    <div>
                       <label className="text-sm text-gray-400 block mb-1">Bio</label>
                       <textarea 
                          value={editBio} 
                          onChange={(e) => setEditBio(e.target.value)} 
                          className="w-full bg-transparent border border-gray-700 rounded p-3 text-white h-24 focus:outline-none focus:border-[#1D9BF0]" 
                       ></textarea>
                    </div>
                 </div>
              </div>
           </div>
        )}
    </div>
  );
}

