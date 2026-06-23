import { GameState, NewsArticle } from './types';
import { ARTIST_IMAGES } from './artistImages';

const SCANDAL_TEMPLATES = [
    "Shocking! {artist} caught making controversial statement about the industry.",
    "{artist}'s leaked private photos cause major uproar online.",
    "Did {artist} really throw shade at a fellow pop star? Fans decode the tweets.",
    "Rumors circulating that {artist} is breaking contract with label.",
    "{artist} seen leaving a club at 4 AM looking terrible. Is a crisis looming?",
];

const GENERAL_TEMPLATES = [
    "Spotify announces new changes to the Global Top 50 algorithms.",
    "Grammy board introduces new 'Best Alternative Pop' category.",
    "{artist} announces mysterious countdown on website.",
    "The 90s are back! How {artist} is leading the retro revival.",
    "Music sales see an unexpected boom this quarter.",
    "Is physical media dead? New report shows vinyl sales rising.",
];

const ACHIEVEMENT_TEMPLATES = [
    "{artist} shatters Spotify streaming records within 24 hours of release.",
    "Incredible! {artist} achieves Diamond certification for their latest hit.",
    "{artist} sweeps the Billboard Music Awards with 5 wins.",
    "Industry completely stunned by {artist}'s surprise mega-hit.",
];

export function generateDailyNews(gameState: GameState, dateObj: Date, currentDateStr: string): NewsArticle | null {
    // Determine if we should generate news today (e.g. 30% chance every day)
    const rand = Math.random();
    if (rand > 0.4) return null; // 40% chance of news

    let type: NewsArticle['type'] = 'general';
    let title = '';
    let body = '';
    let imageUrl = '';
    let artistName = '';

    const allArtists = Object.keys(gameState.npcStats || {});
    const pName = gameState.artist?.name || 'Artist';
    if (gameState.artist?.name) allArtists.push(pName);

    const randomArtist = allArtists[Math.floor(Math.random() * allArtists.length)] || 'A Pop Star';

    const randType = Math.random();
    if (randType < 0.2) {
        type = 'scandal';
        title = SCANDAL_TEMPLATES[Math.floor(Math.random() * SCANDAL_TEMPLATES.length)].replace(/\{artist\}/g, randomArtist);
        body = `In what seems to be the biggest news of the week, reports are surfacing about ${randomArtist}. Sources close to the situation say the PR team is scrambling to get a handle on the narrative. Fans are taking to social media, heavily dividing the internet. Will this affect their upcoming releases? Only time will tell.`;
        imageUrl = randomArtist === pName ? gameState.artist?.image : (ARTIST_IMAGES[randomArtist] || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=800&q=80');
    } else if (randType < 0.35) {
        type = 'achievement';
        title = ACHIEVEMENT_TEMPLATES[Math.floor(Math.random() * ACHIEVEMENT_TEMPLATES.length)].replace(/\{artist\}/g, randomArtist);
        body = `History has been made today. ${randomArtist} just reached a milestone very few artists ever achieve. Music critics and fans alike are praising the dedication and the profound impact this will have on the music industry.`;
        imageUrl = randomArtist === pName ? gameState.artist?.image : (ARTIST_IMAGES[randomArtist] || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80');
    } else {
        type = 'general';
        title = GENERAL_TEMPLATES[Math.floor(Math.random() * GENERAL_TEMPLATES.length)].replace(/\{artist\}/g, randomArtist);
        body = `The music landscape is constantly shifting, and today is no different. With this new development, analysts believe we might see a long-term shift in how music is consumed and marketed. Stay tuned for deeper coverage on how artists plan to navigate this change.`;
        if (title.includes(randomArtist) && ((ARTIST_IMAGES as any)[randomArtist] || randomArtist === pName)) {
           imageUrl = randomArtist === pName ? gameState.artist?.image : (ARTIST_IMAGES[randomArtist]);
        } else {
           const genericImages = [
               'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
               'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
               'https://images.unsplash.com/photo-1493225457124-a1a2a5f5cb46?w=800&q=80'
           ];
           imageUrl = genericImages[Math.floor(Math.random() * genericImages.length)];
        }
    }

    return {
        id: `news_${Date.now()}_${Math.random()}`,
        dateStr: currentDateStr,
        title,
        body,
        imageUrl,
        type,
        artistName: randomArtist
    };
}
