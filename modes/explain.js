// modes/explain.js
module.exports = {
    name: "🧠 Kód-Magyarázat & Oktatás",
    getSystemPrompt: (userPrompt) => {
        return `A te feladatod az, hogy elmagyarázd a projekt forráskódját és logikáját érthető módon. 
        Elemezd a megadott fájlt, függvényt vagy sorokat. Írd le lépésről lépésre, hogyan fut le a kód, milyen algoritmust használ, és mi a változók szerepe.
        FONTOS: Ne módosíts semmilyen fájlt, csak magyarázz!
        Feladat: ${userPrompt}`;
    }
};
