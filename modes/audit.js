// modes/audit.js
module.exports = {
    name: "🛡️ Biztonsági Audit",
    getSystemPrompt: (userPrompt) => {
        return `Feladat: Biztonsági sebezhetőségek és kódminőségi hibák felkutatása.
        Utasítás: ${userPrompt}
        
        MŰKÖDÉSI SZABÁLY: Tüzetesen vizsgáld át a projekt összes forrásfájlját. Keresd a következőket: SQL injection, titkosítatlan jelszavak/kulcsok, memóriaszivárgások, buffer overflow, vagy elavult függőségek.
        Minden találatot dokumentálj egy 'BIZTONSAGI_JELENTES.md' fájlban! A jelentés tartalmazza a hiba helyét (fájl, sor), a kockázat szintjét (High/Medium/Low) és a javítási javaslatot.`;
    }
};
