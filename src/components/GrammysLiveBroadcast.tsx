import React, { useState, useEffect, useRef } from 'react';
import { GameState, GrammysCategoryResult, GrammysNominee } from '../types';
import { Play, CheckCircle2, User, Disc, Music, Loader2 } from 'lucide-react';
import { GrammySvg } from './GrammySvg';
import { motion, AnimatePresence } from 'motion/react';
import { ARTIST_IMAGES } from '../artistImages';

interface Props {
  gameState: GameState;
  onClose: () => void;
}

export function GrammysLiveBroadcast({ gameState, onClose }: Props) {
  const grammys = gameState.grammys;
  const categories = grammys?.results || [];
  
  const [catIndex, setCatIndex] = useState(0);
  const [phase, setPhase] = useState<'welcome' | 'intro' | 'nominees' | 'winner_announce' | 'winner' | 'outro'>('welcome');
  const [nomineeIndex, setNomineeIndex] = useState(0);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [isLoadingClip, setIsLoadingClip] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const currentCat = categories[catIndex];

  const speak = (text: string) => {
      if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-US';
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
      }
  };

  const fetchClip = async (nom: GrammysNominee, category: string) => {
     setIsLoadingClip(true);
     setClipUrl(null);
     
     const defaultVideoUrl = "https://video-ssl.itunes.apple.com/itunes-assets/Video125/v4/65/5a/41/655a4164-a607-84c6-639d-7109284b5519/mzvf_4913311826235829792.1920w.h264lc.U.p.m4v";

     if (nom.isPlayer) {
         const playerVideos = gameState.videos || [];
         let hasVideo = false;
         if (nom.type === 'Single') {
             hasVideo = playerVideos.some(v => v.songId === nom.id);
         } else if (nom.type === 'Album') {
             const album = gameState.releases.find(r => r.id === nom.id);
             if (album && (album as any).trackIds) {
                 hasVideo = playerVideos.some(v => (album as any).trackIds.includes(v.songId));
             }
         } else if (nom.type === 'Artist') {
             hasVideo = playerVideos.length > 0;
         }
         
         if (hasVideo) {
             setClipUrl(defaultVideoUrl);
         } else {
             setClipUrl(null);
         }
         setIsLoadingClip(false);
         return;
     }

     const primaryArtist = nom.artist ? nom.artist.split(' & ')[0].split(' feat. ')[0] : '';
     let query = '';
     if (nom.type === 'Artist' || category.includes('Artist')) {
        query = primaryArtist;
     } else {
        query = `${primaryArtist} ${nom.title || ''}`.trim();
     }

     try {
         const cleanTitle = query.replace(/\s*\(feat\..*\)/i, '').replace(/\s*\(with\s+.*\)/i, '').trim();
         const searchTerm = encodeURIComponent(cleanTitle);
         let res = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=musicVideo&limit=5`);
         let data = await res.json();
         let url = "";

         if (data.results && data.results.length > 0) {
            url = data.results[0].previewUrl;
         }

         if (!url) {
            res = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=5`);
            data = await res.json();
            if (data.results && data.results.length > 0) url = data.results[0].previewUrl;
         }
         
         if (url) {
            setClipUrl(url);
         } else {
            setClipUrl(defaultVideoUrl);
         }
     } catch (e) {
         setClipUrl(defaultVideoUrl);
     }
     setIsLoadingClip(false);
  };

  const handleNext = () => {
    if (phase === 'welcome') {
      setPhase('intro');
    } else if (phase === 'intro') {
      setPhase('nominees');
    } else if (phase === 'nominees') {
      if (nomineeIndex < currentCat!.nominees.length - 1) {
        setNomineeIndex(n => n + 1);
      } else {
        setPhase('winner_announce');
      }
    } else if (phase === 'winner_announce') {
      setPhase('winner');
    } else if (phase === 'winner') {
      if (catIndex < categories.length - 1) {
         setPhase('intro');
         setCatIndex(c => c + 1);
         setNomineeIndex(0);
      } else {
         setPhase('outro');
      }
    }
  };

  useEffect(() => {
     let timer: ReturnType<typeof setTimeout>;
     if (phase === 'welcome') {
        speak(`Welcome to the ${grammys?.year} Grammys!`);
        timer = setTimeout(handleNext, 4000);
     } else if (phase === 'nominees' && currentCat) {
        const nom = currentCat.nominees[nomineeIndex];
        if (nom) {
           fetchClip(nom, currentCat.category);
           
           if (currentCat.category.includes('Artist') || nom.type === 'Artist') {
               speak(`${nom.artist}, for ${currentCat.category}`);
           } else {
               speak(`${nom.artist}, ${nom.title}`);
           }
           
           timer = setTimeout(handleNext, 7000);
        }
     } else if (phase === 'winner_announce' && currentCat) {
        speak(`And the Grammy goes to...`);
        setClipUrl(null); // Clear clip so it's silent while announcing
        timer = setTimeout(handleNext, 3000);
     } else if (phase === 'winner' && currentCat) {
        const winner = currentCat.nominees.find(n => n.id === currentCat.winnerId);
        if (winner) {
           speak(`${winner.type === 'Artist' ? winner.artist : winner.title}`);
           fetchClip(winner, currentCat.category);
        }
        timer = setTimeout(handleNext, 12000);
     } else if (phase === 'intro') {
        speak(`And the nominees for, ${currentCat?.category}, are...`);
        timer = setTimeout(handleNext, 4000);
     } else if (phase === 'outro') {
        speak(`Thank you for watching the ${grammys?.year} Grammys.`);
     }
     return () => clearTimeout(timer);
  }, [phase, nomineeIndex, catIndex, currentCat]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel();
      }
    }
  }, []);

  if (!currentCat && phase !== 'outro') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden font-sans" onClick={handleNext}>
      {/* Background layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#111] via-black to-[#050505] opacity-90"></div>
      
      {/* Clip Background / Audio */}
      {clipUrl && (
         <video 
           ref={videoRef}
           src={clipUrl} 
           autoPlay 
           muted
           loop={phase === 'winner'} 
           className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl pointer-events-none" 
         />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 w-full max-w-4xl mx-auto">
         <AnimatePresence mode="wait">
            {phase === 'welcome' && (
               <motion.div 
                 key="welcome"
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 1.1 }}
                 className="text-center"
               >
                  <GrammySvg className="w-32 h-32 text-yellow-500 mx-auto mb-8 drop-shadow-2xl" />
                  <h1 className="text-6xl md:text-8xl font-serif text-[#FFF8DC] tracking-widest uppercase font-bold drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">The Grammys</h1>
                  <h2 className="text-2xl md:text-3xl text-yellow-500 uppercase tracking-[0.5em] mt-6 font-bold">Welcome to the {grammys?.year} Ceremony</h2>
               </motion.div>
            )}

            {phase === 'intro' && (
               <motion.div 
                 key="intro"
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, y: -50 }}
                 className="text-center"
               >
                  <GrammySvg className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
                  <h4 className="text-yellow-500 uppercase tracking-widest text-sm font-bold mb-2">Next Category</h4>
                  <h1 className="text-5xl font-black text-white px-4 leading-tight">{currentCat?.category}</h1>
               </motion.div>
            )}

            {phase === 'nominees' && currentCat && (
               <motion.div 
                 key={`nom-${nomineeIndex}`}
                 initial={{ opacity: 0, x: 100 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -100 }}
                 className="flex flex-col items-center text-center w-full"
               >
                  <h4 className="text-yellow-500 uppercase tracking-[0.3em] text-xs font-bold mb-12 animate-pulse">And the nominees are...</h4>
                  
                  {currentCat.nominees[nomineeIndex] && (() => {
                     const nom = currentCat.nominees[nomineeIndex];
                     const release = gameState.releases.find(r => r?.id === nom?.id);
                     const fallbackImage = ARTIST_IMAGES[nom.artist as string] || `https://i.pravatar.cc/400?u=${encodeURIComponent(nom.artist)}`;
                     const coverImage = nom.type === 'Artist' ? (nom.isPlayer ? gameState.artist?.image : fallbackImage) : (release?.coverImage || nom.coverImage || fallbackImage);

                     return (
                        <div className="flex flex-col items-center w-full max-w-4xl px-4">
                           <div className="w-full max-w-xl aspect-video shadow-[0_0_80px_rgba(234,179,8,0.2)] rounded-2xl overflow-hidden mb-4 border-2 border-[#B8860B] relative bg-black shrink-0">
                              {coverImage ? (
                                 <img src={coverImage || undefined} className="absolute inset-0 w-full h-full object-cover z-0" />
                              ) : (
                                 <div className="absolute inset-0 w-full h-full bg-slate-900 flex items-center justify-center z-0">
                                    <Music className="w-16 h-16 text-white/30" />
                                 </div>
                              )}
                              {clipUrl && (
                                 <video src={clipUrl} autoPlay muted={false} className={`absolute inset-0 w-full h-full object-cover z-10 ${clipUrl?.includes('.m4a') || clipUrl?.includes('audio') ? 'opacity-0' : ''}`} />
                              )}
                              {isLoadingClip && (
                                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                                 </div>
                              )}
                           </div>
                           <h2 className="text-3xl md:text-4xl font-serif tracking-widest text-[#FFF8DC] mb-1 uppercase leading-tight drop-shadow-lg text-center line-clamp-1">{nom.type === 'Artist' ? nom.artist : nom.title}</h2>
                           {nom.type !== 'Artist' && <h3 className="text-lg md:text-xl text-white/70 font-sans tracking-[0.2em] uppercase text-center line-clamp-1">{nom.artist}</h3>}
                        </div>
                     );
                  })()}
               </motion.div>
            )}

            {phase === 'winner_announce' && currentCat && (
               <motion.div 
                 key="winner_announce"
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 1.1 }}
                 className="text-center"
               >
                  <GrammySvg className="w-24 h-24 text-yellow-500 mx-auto mb-6 animate-pulse drop-shadow-lg" />
                  <h1 className="text-4xl md:text-6xl font-serif text-[#FFF8DC] tracking-widest uppercase font-bold drop-shadow-2xl">And the Grammy goes to...</h1>
               </motion.div>
            )}

            {phase === 'winner' && currentCat && (() => {
               const winner = currentCat.nominees.find(n => n.id === currentCat.winnerId);
               if (!winner) return null;
               
               const release = gameState.releases.find(r => r?.id === winner?.id);
               const fallbackImage = ARTIST_IMAGES[winner.artist as string] || `https://i.pravatar.cc/400?u=${encodeURIComponent(winner.artist)}`;
               const coverImage = winner.type === 'Artist' ? (winner.isPlayer ? gameState.artist?.image : fallbackImage) : (release?.coverImage || winner.coverImage || fallbackImage);

               return (
                  <motion.div 
                    key="winner"
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="flex flex-col items-center text-center w-full max-w-5xl"
                  >
                     <h4 className="text-yellow-500 uppercase tracking-[0.4em] text-sm font-bold mb-6 drop-shadow-lg">Winner</h4>
                     
                     <div className="w-full max-w-2xl aspect-video shadow-[0_0_150px_rgba(234,179,8,0.5)] rounded-2xl overflow-hidden mb-4 border-4 border-[#FFD700] relative bg-black shrink-0">
                        {coverImage ? (
                           <img src={coverImage || undefined} className="absolute inset-0 w-full h-full object-cover z-0" />
                        ) : (
                           <div className="absolute inset-0 w-full h-full bg-slate-900 flex items-center justify-center z-0">
                              <GrammySvg className="w-24 h-24 text-yellow-500" />
                           </div>
                        )}
                        {clipUrl && (
                           <video src={clipUrl} autoPlay muted={false} loop className={`absolute inset-0 w-full h-full object-cover z-10 ${clipUrl?.includes('.m4a') || clipUrl?.includes('audio') ? 'opacity-0' : ''}`} />
                        )}
                     </div>
                     <h2 className="text-4xl md:text-5xl font-serif tracking-widest text-[#FFF8DC] mb-1 uppercase leading-tight drop-shadow-2xl text-center line-clamp-1">{winner.type === 'Artist' ? winner.artist : winner.title}</h2>
                     {winner.type !== 'Artist' && <h3 className="text-xl md:text-2xl text-yellow-500 font-sans font-bold tracking-[0.3em] uppercase drop-shadow-md text-center line-clamp-1">{winner.artist}</h3>}
                  </motion.div>
               );
            })()}

            {phase === 'outro' && (
               <motion.div 
                 key="outro"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="text-center"
               >
                  <GrammySvg className="w-32 h-32 text-yellow-500 mx-auto mb-8" />
                  <h1 className="text-5xl font-black text-white mb-4">The {grammys?.year} Grammys</h1>
                  <h2 className="text-xl text-white/50 uppercase tracking-widest mb-12">Broadcast Concluded</h2>
                  <button 
                    onClick={onClose}
                    className="bg-white text-black px-12 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-yellow-500 hover:text-black transition-colors"
                  >
                     Return to Dashboard
                  </button>
               </motion.div>
            )}
         </AnimatePresence>

         <button 
           onClick={(e) => { e.stopPropagation(); onClose(); }}
           className="absolute top-6 right-6 text-white/50 hover:text-white uppercase tracking-widest text-xs font-bold border border-white/20 px-4 py-2 rounded-full"
         >
            Skip Broadcast
         </button>
         
         {phase !== 'outro' && (
            <div className="absolute bottom-6 text-white/20 uppercase tracking-widest text-xs font-bold pointer-events-none">
               Click anywhere to advance
            </div>
         )}
      </div>
    </div>
  );
}
