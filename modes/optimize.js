// modes/optimize.js
module.exports = {
    name: "⚡ Optimalizálás (Speed & Clean)",
    getSystemPrompt: (userPrompt) => {
        return `Feladat: Refaktoráld és optimalizáld a megadott kódot.
        Utasítás: ${userPrompt}
        
        KÖTELEZŐ EXTRA LÉPÉS: Ha változtatod a függvények neveit, paramétereit vagy újakat hozol létre, kötelezően frissítsd a 'PROJEKT_STRUKTURA.md' fájlt, pontosan vezetve a függvény feladatát és a meghívások helyét!`;
    }
};
