import { GameState, GrammysNominee, GrammysCategoryResult, AwardCategory } from './types';
import { NPC_ARTISTS } from './constants';
import { ARTIST_DISCOGRAPHY } from './artistDiscography';

export function generateNominees(gameState: GameState, year: number): GrammysCategoryResult[] {
  const previousYear = year - 1;
  
  // Filter player releases from previous year
  const playerReleases = gameState.releases.filter(r => {
    if (!r.releaseDate || r.status !== 'Published') return false;
    return new Date(r.releaseDate).getFullYear() === previousYear;
  });

  const playerSingles = playerReleases.filter(r => r.type === 'Single');
  const playerAlbums = playerReleases.filter(r => r.type === 'Album');

  const pName = gameState.artist?.name || '';
  const availableNpcs = NPC_ARTISTS.filter(n => n.name.toLowerCase() !== pName.toLowerCase());
  
  const npcReleases = gameState.releases.filter(r => {
    if (!r.releaseDate || r.status !== 'Published' || !(r as any).isNPCRelease) return false;
    return new Date(r.releaseDate).getFullYear() === previousYear;
  });
  
  const npcSingles = npcReleases.filter(r => r.type === 'Single').map(r => ({ ...r, artist: (r as any).artistId, points: (r.streams.total || 100) * 1.5 }));
  const npcAlbums = npcReleases.filter(r => ['Album', 'EP', 'Deluxe Album', 'Single Pack'].includes(r.type)).map(r => ({ ...r, artist: (r as any).artistId, points: (r.streams.total || 100) * 0.8 }));


  const categories: AwardCategory[] = [
    'Artist of the Year',
    'Song of the Year',
    'Album of the Year',
    'Record of the Year',
    'Best Pop Solo Performance',
    'Best Pop Duo/Group Performance',
    'Best Pop Album',
    'Best K-Pop Performance',
    'Best Rap Song',
    'Best Rap Album',
    'Best Country Song',
    'Best Country Album'
  ];

  const submissions = gameState.grammys?.submissions || [];

  const getSubmittedWork = (catName: AwardCategory, type: 'Single' | 'Album' | 'Artist') => {
    const sub = submissions.find(s => s.category === catName);
    if (!sub) return null;
    if (type === 'Artist' && sub.workId === 'artist') {
       return { id: gameState.artist?.name || 'Player', title: undefined, artist: gameState.artist?.name || 'Player', isPlayer: true, type: 'Artist' as const };
    }
    const release = playerReleases.find(r => r?.id === sub.workId && (type === 'Single' ? r.type === 'Single' : r.type === 'Album'));
    if (release) {
       const artistName = (release as any).isNPCCollab ? `${(release as any).collaborator} & ${gameState.artist?.name || 'Player'}` : ((release.type === 'Single' && (release as any).collaborator) ? `${gameState.artist?.name || 'Player'} & ${(release as any).collaborator}` : gameState.artist?.name || 'Player');
       return { id: release.id, title: release.title, artist: artistName, isPlayer: true, type, coverImage: release.coverImage, clipQuery: sub.clipQuery };
    }
    return null;
  };

  const results: GrammysCategoryResult[] = categories.map(category => {
    let pool: GrammysNominee[] = [];

    switch (category) {
      case 'Artist of the Year': {
        const pSub = getSubmittedWork('Artist of the Year', 'Artist');
        if (pSub) pool.push(pSub);
        availableNpcs.slice(0, 15).forEach(npc => {
           pool.push({ id: npc.name, artist: npc.name, isPlayer: false, type: 'Artist' });
        });
        break;
      }
      case 'Song of the Year':
      case 'Record of the Year': {
        const pSub = getSubmittedWork(category, 'Single');
        if (pSub) pool.push(pSub);
        npcSingles.forEach(s => pool.push({ id: s.id, title: s.title, artist: s.artist, isPlayer: false, type: 'Single', coverImage: s.coverImage }));
        break;
      }
      case 'Album of the Year': {
        const pSub = getSubmittedWork('Album of the Year', 'Album');
        if (pSub) pool.push(pSub);
        npcAlbums.forEach(a => pool.push({ id: a.id, title: a.title, artist: a.artist, isPlayer: false, type: 'Album', coverImage: a.coverImage }));
        break;
      }
      case 'Best Pop Solo Performance': {
        const pSub = getSubmittedWork('Best Pop Solo Performance', 'Single');
        if (pSub) pool.push(pSub);
        npcSingles.filter(s => {
           const song: any = s;
           const isCollab = !!song.collaborator || !!song.featuredArtistCost || !!song.isNPCCollab || /feat\./i.test(s.title || '') || /&/.test(song.artist || '');
           const npc = NPC_ARTISTS.find(n => n.name === s.artist);
           return npc?.type === 'Pop' && !isCollab;
        }).forEach(s => pool.push({ id: s.id, title: s.title, artist: s.artist, isPlayer: false, type: 'Single', coverImage: s.coverImage }));
        break;
      }
      case 'Best Pop Duo/Group Performance': {
        const pSub = getSubmittedWork('Best Pop Duo/Group Performance', 'Single');
        if (pSub) pool.push(pSub);
        npcSingles.filter(s => {
           const song: any = s;
           const isCollab = !!song.collaborator || !!song.featuredArtistCost || !!song.isNPCCollab || /feat\./i.test(s.title || '') || /&/.test(song.artist || '');
           const npc = NPC_ARTISTS.find(n => n.name === s.artist);
           return npc?.type === 'Pop' && isCollab;
        }).forEach(s => {
           pool.push({ id: s.id, title: s.title, artist: s.artist, isPlayer: false, type: 'Single', coverImage: s.coverImage });
        });
        break;
      }
      case 'Best K-Pop Performance': {
        const pSub = getSubmittedWork('Best K-Pop Performance', 'Single');
        if (pSub) pool.push(pSub);
        npcSingles.filter(s => {
           const npc = NPC_ARTISTS.find(n => n.name === s.artist);
           return npc?.type === 'Kpop';
        }).forEach(s => pool.push({ id: s.id, title: s.title, artist: s.artist, isPlayer: false, type: 'Single', coverImage: s.coverImage }));
        break;
      }
      case 'Best Rap Song': {
        const pSub = getSubmittedWork('Best Rap Song', 'Single');
        if (pSub) pool.push(pSub);
        npcSingles.filter(s => {
           const npc = NPC_ARTISTS.find(n => n.name === s.artist);
           return npc?.type === 'Rap';
        }).forEach(s => pool.push({ id: s.id, title: s.title, artist: s.artist, isPlayer: false, type: 'Single', coverImage: s.coverImage }));
        break;
      }
      case 'Best Country Song': {
        const pSub = getSubmittedWork('Best Country Song', 'Single');
        if (pSub) pool.push(pSub);
        npcSingles.filter(s => {
           const npc = NPC_ARTISTS.find(n => n.name === s.artist);
           return npc?.type === 'Country';
        }).forEach(s => pool.push({ id: s.id, title: s.title, artist: s.artist, isPlayer: false, type: 'Single', coverImage: s.coverImage }));
        break;
      }
      case 'Best Pop Album': {
        const pSub = getSubmittedWork('Best Pop Album', 'Album');
        if (pSub) pool.push(pSub);
        npcAlbums.filter(a => {
           const npc = NPC_ARTISTS.find(n => n.name === a.artist);
           return npc?.type === 'Pop' || npc?.type === 'Kpop';
        }).forEach(a => pool.push({ id: a.id, title: a.title, artist: a.artist, isPlayer: false, type: 'Album', coverImage: a.coverImage }));
        break;
      }
      case 'Best Rap Album': {
        const pSub = getSubmittedWork('Best Rap Album', 'Album');
        if (pSub) pool.push(pSub);
        npcAlbums.filter(a => {
           const npc = NPC_ARTISTS.find(n => n.name === a.artist);
           return npc?.type === 'Rap';
        }).forEach(a => pool.push({ id: a.id, title: a.title, artist: a.artist, isPlayer: false, type: 'Album', coverImage: a.coverImage }));
        break;
      }
      case 'Best Country Album': {
        const pSub = getSubmittedWork('Best Country Album', 'Album');
        if (pSub) pool.push(pSub);
        npcAlbums.filter(a => {
           const npc = NPC_ARTISTS.find(n => n.name === a.artist);
           return npc?.type === 'Country';
        }).forEach(a => pool.push({ id: a.id, title: a.title, artist: a.artist, isPlayer: false, type: 'Album', coverImage: a.coverImage }));
        break;
      }
    }

    // Rank the pool and take top 5, but limit Player to exactly 1
    // Valuation function - strict
    const getValuation = (nom: GrammysNominee) => {
       if (nom.isPlayer) {
          const release = gameState.releases.find(r => r?.id === nom.id);
          if (nom.type === 'Artist') {
             return gameState.stats.streams / 500000 + (gameState.artist?.level || 0) * 15;
          }
          if (release) {
             const streams = typeof release.streams === 'number' ? release.streams : (release.streams as any).total;
             const quality = (release as any).qualityModifier || 5;
             return (streams / 200000) + Math.pow(quality, 1.8) * 8; // high quality > sheer streams
          }
       } else {
          const npc = NPC_ARTISTS.find(n => n.name === nom.artist);
          const base = npc?.basePoints || 100000;
          if (nom.type === 'Artist') return base / 1000;
          const npcItem = [...npcSingles, ...npcAlbums].find(i => i?.id === nom.id);
          const points = npcItem?.points || 100000;
          // Random quality for NPCs [7-11]
          const quality = 7 + ((nom.id.charCodeAt(nom.id.length - 1) + nom.id.charCodeAt(0)) % 5); 
          return (points / 1500) + Math.pow(quality, 1.8) * 6.5; // match player scale roughly but favor npcs more to tighten
       }
       return 0;
    };

    let scoredPool = pool.map(p => ({ ...p, score: getValuation(p) }));
    
    // Enforce 1 max nomination per artist per category
    scoredPool.sort((a, b) => b.score - a.score);
    const seenArtists = new Set<string>();
    scoredPool = scoredPool.filter(p => {
       const key = p.isPlayer ? ('PLAYER_' + p.artist) : p.artist;
       if (seenArtists.has(key)) return false;
       seenArtists.add(key);
       return true;
    });

    // Pad with fallback if not enough 
    if (scoredPool.length < 5) {
       const needed = 5 - scoredPool.length;
       const categoryTypes: Record<string, string> = {
           'Best Pop Solo Performance': 'Pop',
           'Best Pop Duo/Group Performance': 'Pop',
           'Best K-Pop Performance': 'Kpop',
           'Best Rap Song': 'Rap',
           'Best Rap Album': 'Rap',
           'Best Country Song': 'Country',
           'Best Country Album': 'Country',
           'Best Pop Album': 'Pop'
       };
       const targetType = categoryTypes[category];
       let fallbackNpcs = availableNpcs.filter(n => targetType ? n.type === targetType : true);
       if (fallbackNpcs.length === 0) fallbackNpcs = availableNpcs; // Ultimate fallback
       
       // Shuffle fallbacks based on year to look different each year
       fallbackNpcs = [...fallbackNpcs].sort((a, b) => {
           const hashA = (a.name.charCodeAt(0) * a.name.charCodeAt(a.name.length - 1) + previousYear * 17) % 100;
           const hashB = (b.name.charCodeAt(0) * b.name.charCodeAt(b.name.length - 1) + previousYear * 17) % 100;
           return hashA - hashB;
       });

       let fallbackIndex = 0;
       while (scoredPool.length < 5 && fallbackIndex < fallbackNpcs.length) {
           const npc = fallbackNpcs[fallbackIndex];
           const key = npc.name;
           if (!seenArtists.has(key)) {
               seenArtists.add(key);
               const fakeId = `fake-${category}-${previousYear}-${fallbackIndex}`;
               const type = category.includes('Album') ? 'Album' : category.includes('Artist') ? 'Artist' : 'Single';
               
               let genTitle = type === 'Artist' ? npc.name : `${npc.name} Hit ${previousYear}`;
               
               if (type !== 'Artist') {
                   const genericSongs = ["Midnight", "Hold On", "Never Let Go", "City Lights", "Sunset", "Echoes", "Fading Away", "Better Days", "Lost In You", "Runaway", "Silent Whisper", "Dreams", "Euphoria", "Chasing Stars", "Nostalgia", "Desire", "Breathe", "Awake", "Gravity", "Illusions"];
                   const genericAlbums = ["The Journey", "Evolution", "Midnight Sessions", "Echoes of Time", "Horizons", "Rebirth", "Golden Hour", "Neon Lights", "Into the Wild", "Silent Storm", "Unplugged", "Daydreams", "Nocturne", "Vibrations", "The Aftermath", "Ascension", "Odyssey", "Mirage", "Prism", "Legacy"];
                   
                   const titleHash = (npc.name.charCodeAt(0) * 17 + previousYear * 31 + fallbackIndex) % 20;
                   if (type === 'Album') genTitle = genericAlbums[titleHash];
                   else genTitle = genericSongs[titleHash];
               }
               
               let genArtist = npc.name;
               let coverImage: string | undefined = undefined;
               
               const disco = ARTIST_DISCOGRAPHY[npc.name];
               if (disco) {
                  if (type === 'Album' && disco.albums && disco.albums.length > 0) {
                     const randIdx = (previousYear * 37 + fallbackIndex) % disco.albums.length;
                     const album = disco.albums[randIdx];
                     genTitle = album.title;
                     coverImage = album.cover;
                  } else if (type === 'Single' && disco.tracks && disco.tracks.length > 0) {
                     const randIdx = (previousYear * 37 + fallbackIndex) % disco.tracks.length;
                     const track = disco.tracks[randIdx];
                     genTitle = track.title;
                     coverImage = track.cover;
                  }
               }
               
               if (category === 'Best Pop Duo/Group Performance') {
                   const partnerOffset = (fallbackIndex + 1) % fallbackNpcs.length;
                   const partner = fallbackNpcs[partnerOffset];
                   genArtist = `${npc.name} & ${partner.name}`;
               }

               scoredPool.push({
                   id: fakeId,
                   artist: genArtist,
                   title: genTitle,
                   isPlayer: false,
                   type: type as any,
                   score: Math.random() * 20 + 20,
                   coverImage
               });
           }
           fallbackIndex++;
       }
    }

    const nominees = scoredPool
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ score, ...rest }: any) => rest);

    return {
      category,
      nominees,
      winnerId: null
    };
  });

  return results;
}

export function pickWinner(categoryResult: GrammysCategoryResult, gameState: GameState): string {
  // Winner selection based on tight performance + quality logic
  const nominees = categoryResult.nominees;
  
  const getNomineeFinalScore = (nom: GrammysNominee) => {
     let score = 0;
     if (nom.isPlayer) {
        const release = gameState.releases.find(r => r?.id === nom.id);
        if (nom.type === 'Artist') {
           score = (gameState.stats.streams / 5000000) + (gameState.artist?.level || 0) * 12;
        } else if (release) {
           const streams = typeof release.streams === 'number' ? release.streams : (release.streams as any).total;
           const quality = (release as any).qualityModifier || 5;
           // Quality provides exponential benefits, but require massive streams or perfect quality
           score = (streams / 500000) + Math.pow(quality, 2.0) * 3;
        }
     } else {
        const npc = NPC_ARTISTS.find(n => n.name === nom.artist);
        const base = npc?.basePoints || 100000;
        if (nom.type === 'Artist') {
           score = (base / 3500); // NPCs have slightly boosted base scores
        } else {
           const points = base * 2.0; // Assume NPCs performed quite well
           const quality = 8 + (nom.id.charCodeAt(0) % 4); // 8 to 11
           score = (points / 15000) + Math.pow(quality, 2.1) * 3;
        }
     }
     
     // Add a bit of "jury randomness", make it sway a lot 
     // (so even mega hits can sometimes lose to highly praised jury darlings)
     const juryRandom = (Math.random() * 60) - 10;
     return score + juryRandom;
  };

  if (!nominees || nominees.length === 0) return '';

  const scored = nominees.map(nom => ({
    id: nom.id,
    finalScore: getNomineeFinalScore(nom)
  }));

  const winner = scored.sort((a, b) => b.finalScore - a.finalScore)[0];
  return winner?.id || '';
}
