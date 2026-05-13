// modes/docs.js
module.exports = {
    name: "📝 Dokumentáció & Kommentelés",
    getSystemPrompt: (userPrompt) => {
        return `Feladat: A kód olvashatóságának és dokumentációjának javítása.
        Utasítás: ${userPrompt}
        
        MŰKÖDÉSI SZABÁLY: Helyezz el professzionális kommenteket a forráskódban (pl. Doxygen stílusban C-hez, vagy JSDoc-ot JS-hez) a függvények felett (paraméterek, visszatérési értékek leírása). Emellett hozz létre vagy frissíts egy részletes 'README.md' fájlt a projekt mappájában, ami leírja a program használatát és fordítását.`;
    }
};
