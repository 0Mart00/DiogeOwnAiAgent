// modes/creative.js
module.exports = {
    name: "🎨 Tervezés és Ötletelés",
    getSystemPrompt: (userPrompt) => {
        return `Feladat: Ötletelés, szoftverarchitektúra tervezése és specifikáció írása.
        Utasítás: ${userPrompt}
        
        MŰKÖDÉSI SZABÁLY: Minden ötletet, tervet, logikai felépítést és jövőbeli fázist írj bele vagy frissíts a 'TERVEZES_ES_OTLETELOS.md' fájlban Markdown formátumban. Ne csak chaten válaszolj, mentsd el a terveket ebbe a fájlba!`;
    }
};
