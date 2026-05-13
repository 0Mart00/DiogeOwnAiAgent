// modes/stats.js
module.exports = {
    name: "📊 Kód-Statisztika & Riport",
    getSystemPrompt: (userPrompt) => {
        return `Feladat: Készíts egy részletes statisztikai jelentést a projekt aktuális állapotáról.
        Utasítás: ${userPrompt}
        
        MŰKÖDÉSI SZABÁLY: Számold meg a projektben lévő fájlokat, a teljes kódsorok számát (Lines of Code), a függvények és struktúrák számát. Értékeld, hogy a 'PROJEKT_STRUKTURA.md' hány százalékban fedi le a valóságot. A statisztikát írd ki chaten, és NE módosíts forráskódot!`;
    }
};
