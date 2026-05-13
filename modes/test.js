// modes/test.js
module.exports = {
    name: "🧪 Auto-Tesztelés & Javítás",
    getSystemPrompt: (userPrompt) => {
        return `Feladat: Futtasd le a projekt tesztjeit vagy fordítsd le a kódot a terminálban (pl. npm test, pytest, gcc, python futtatás).
        Utasítás: ${userPrompt}
        
        MŰKÖDÉSI SZABÁLY: Ha a tesztek vagy a fordítás hibát (Error/Fail) dob, NE állj meg! Értelmezd a hibaüzenetet, javítsd ki a forráskódot, majd futtasd le a teszteket újra. Addig ismételd, amíg minden teszt sikeresen (zölden) le nem fut! Ha végeztél, frissítsd a 'PROJEKT_STRUKTURA.md' fájlt is.`;
    }
};
