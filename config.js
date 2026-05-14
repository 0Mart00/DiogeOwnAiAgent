// config.js
if (!process.env.TELEGRAM_TOKEN || !process.env.OPENROUTER_KEY || !process.env.ADMIN_TELEGRAM_ID) {
    console.error("❌ HIBA: Hiányzó Docker környezeti változók (TELEGRAM_TOKEN, OPENROUTER_KEY vagy ADMIN_TELEGRAM_ID)!");
    process.exit(1);
}

module.exports = {
    telegramToken: process.env.TELEGRAM_TOKEN,
    openrouterKey: process.env.OPENROUTER_KEY,
    adminId: Number(process.env.ADMIN_TELEGRAM_ID), // Beemeljük az admin ID-t is ide
    models: {
        llama: {
            id: "meta-llama/llama-3.3-70b-instruct:free",
            name: "Llama 3.3 70B",
            description: "🔥 Általános csúcsmodell. Kiváló kreatív feladatokra, bonyolult logikai tervezésre és általános kódolásra."
        },
        qwen: {
            id: "qwen/qwen-2.5-coder-32b-instruct:free",
            name: "Qwen 2.5 Coder 32B",
            description: "💻 Kifejezetten programozásra kiképzett modell. Hibakeresésben, kód optimalizálásban és refaktorálásban ez a legerősebb."
        },
        gemini: {
            id: "google/gemini-2.5-flash:free",
            name: "Gemini 2.5 Flash",
            description: "🌐 Rendkívül gyors modell. Az OpenRouter-en keresztül képes élő webes keresésekre, friss dokumentációk felkutatására."
        }
    },
    defaultModel: "llama"
};
