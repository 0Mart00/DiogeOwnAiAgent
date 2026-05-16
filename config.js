// config.js
if (!process.env.TELEGRAM_TOKEN || !process.env.OPENROUTER_KEY) {
    console.error("❌ HIBA: Hiányzó Secrets (TELEGRAM_TOKEN vagy OPENROUTER_KEY)!");
    process.exit(1);
}

module.exports = {
    telegramToken: process.env.TELEGRAM_TOKEN,
    openrouterKey: process.env.OPENROUTER_KEY,
    adminId: Number(process.env.ADMIN_TELEGRAM_ID) || 0,
    githubToken: process.env.GITHUB_TOKEN || '',
    models: {
        llama: {
            id: "meta-llama/llama-3.3-70b-instruct:free",
            name: "Llama 3.3 70B"
        },
        qwen: {
            id: "qwen/qwen-2.5-coder-32b-instruct:free",
            name: "Qwen 2.5 Coder 32B"
        },
        gemini: {
            id: "google/gemini-2.5-flash:free",
            name: "Gemini 2.5 Flash"
        }
    },
    defaultModel: "llama"
};
