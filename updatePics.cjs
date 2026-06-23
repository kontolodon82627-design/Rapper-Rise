import fs from "fs";
async function run() {
  const t = fs.readFileSync("src/constants.ts", "utf8");
  let match = t.match(/export const NPC_ARTISTS = \[([\s\S]*?)\];/);
  if(!match) return;
  const arr = match[1].split("\n").filter(l => l.includes("{ name:")).map(l => {
    let nameMatch = l.match(/name: '([^']+)'/);
    return nameMatch ? nameMatch[1] : null;
  }).filter(Boolean);
  
  let imgText = fs.readFileSync("src/artistImages.ts", "utf8");
  const missing = [];
  for (const name of arr) {
    if (!imgText.includes(`"${name}":`) && !imgText.includes(`'${name}':`)) {
      missing.push(name);
    }
  }
  
  console.log("Missing:", missing.length);
  
  let appendText = "";
  for (let i = 0; i < missing.length; i++) {
    const name = missing[i];
    console.log("Fetching", name);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=musicArtist&limit=1`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        let artistLink = data.results[0].artistLinkUrl;
        if (artistLink) {
            // Need to get an image somehow? iTunes artist search doesn't return an image usually.
            // Let's use album image as artist pic.
            const albRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=album&limit=1`);
            const albData = await albRes.json();
            if (albData.results && albData.results.length > 0) {
                const cover = albData.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
                appendText += `  "${name}": ${JSON.stringify(cover)},\n`;
            } else {
                appendText += `  "${name}": "https://i.pravatar.cc/300?u=${encodeURIComponent(name)}",\n`;
            }
        }
      } else {
        appendText += `  "${name}": "https://i.pravatar.cc/300?u=${encodeURIComponent(name)}",\n`;
      }
    } catch(e) { console.error("Error", name, e.message); }
  }
  
  if (appendText) {
     const lastBrace = imgText.lastIndexOf("}");
     imgText = imgText.substring(0, lastBrace - 1) + ",\n" + appendText + "};\n";
     fs.writeFileSync("src/artistImages.ts", imgText);
     console.log("Updated images!");
  }
}
run();
