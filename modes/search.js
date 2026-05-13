// modes/search.js
module.exports = {
    name: "🌐 Webes Keresés & Dokumentáció",
    getSystemPrompt: (userPrompt) => `Használd az internetes keresőt. Keresd meg a legújabb API dokumentációkat vagy megoldásokat, és az eredmények alapján frissítsd a kódot.\nFeladat: ${userPrompt}`
};
