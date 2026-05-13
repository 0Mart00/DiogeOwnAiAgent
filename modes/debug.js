// modes/debug.js
module.exports = {
    name: "🐛 Hibakeresés (Kizárólag C nyelven)",
    getSystemPrompt: (userPrompt) => {
        return `SZIGORÚ UTASÍTÁS: Te egy kizárólag C nyelvre (ANSI C, C11) szakosodott robot vagy. 
        Minden fájlt, amit létrehozol vagy módosítasz, kizárólag .c vagy .h kiterjesztésű lehet! 
        Ha a feladat más nyelvre vonatkozik, utasítsd vissza.
        
        Feladat: ${userPrompt}`;
    }
};
