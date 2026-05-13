// index.js
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const agent = require('./agent');

// Az összes modul dinamikus beolvasása
const modes = {
    debug: require('./modes/debug'),
    optimize: require('./modes/optimize'),
    search: require('./modes/search'),
    creative: require('./modes/creative'),
    test: require('./modes/test'),
    commit: require('./modes/commit'),
    audit: require('./modes/audit'),
    explain: require('./modes/explain'),
    docs: require('./modes/docs'),
    stats: require('./modes/stats')
};

const bot = new Telegraf(config.telegramToken);
let activeModelKey = config.defaultModel;

// 🔒 JOGOSULTSÁG ELLENŐRZÉS: Csak te vezérelheted!
const ADMIN_ID = Number(process.env.ADMIN_TELEGRAM_ID) || 0;

bot.use(async (ctx, next) => {
    if (ctx.from && ctx.from.id !== ADMIN_ID && ADMIN_ID !== 0) {
        return ctx.reply(`⛔ Hozzáférés megtagadva! A te ID-d (${ctx.from.id}) nincs felhatalmazva.`);
    }
    await next();
});

bot.start((ctx) => {
    ctx.reply(`🤖 **AI DevOps Ultimate Asszisztens**\n\n` +
              `Aktuális modell: 🧠 ${config.models[activeModelKey].name}\n` +
              `Projekt mappa: 📁 \`/project\`\n\n` +
              `📋 **Dokumentáció & Info:**\n` +
              `📁 /structure - Projekt felépítés\n` +
              `💡 /ideas - Mentett tervek\n` +
              `ℹ️ /info - Modellek leírása\n\n` +
              `🛡️ **Biztonság & Mentés:**\n` +
              `💾 /backup - Manuális biztonsági mentés\n` +
              `⏪ /rollback - Visszaállás az utolsó mentésre\n` +
              `🛡️ /audit - Biztonsági vizsgálat\n\n` +
              `🛠️ **Fejlesztési parancsok:**\n` +
              `🧠 /explain [kód] - Elmagyarázza a kódot\n` +
              `📝 /docs [feladat] - Automata kommentek és README\n` +
              `📊 /stats - Projekt méret statisztika\n` +
              `🧪 /test, 📦 /commit, 🐛 /debug, ⚡ /optimize\n\n` +
              `🚨 /stop - Azonnali leállítás`);
});

// 💾 MANUÁLIS MENTÉS PARANCS
bot.command('backup', (ctx) => {
    const backupName = agent.createBackup();
    if (backupName) ctx.reply(`✅ Biztonsági mentés sikeresen elkészítve: \`${backupName}\``, { parse_mode: 'Markdown' });
    else ctx.reply('❌ Sikertelen mentés.');
});

// ⏪ VISSZAÁLLÍTÁS PARANCS
bot.command('rollback', (ctx) => {
    const success = agent.rollbackToLatest();
    if (success) ctx.reply('⏪ SIKER! A projekt sikeresen visszaállítva a legutóbbi működő mentésre. Az elrontott verzió törölve.');
    else ctx.reply('❌ Nincs elérhető mentés a backups/ mappában, vagy hiba történt.');
});

// Fájl olvasók igazítása az új elszeparált mappához
bot.command('structure', (ctx) => {
    const p = path.join(agent.getProjectDir(), 'PROJEKT_STRUKTURA.md');
    ctx.reply(fs.existsSync(p) ? fs.readFileSync(p, 'utf8').substring(0, 3500) : 'Még nincs struktúra fájl.');
});
bot.command('ideas', (ctx) => {
    const p = path.join(agent.getProjectDir(), 'TERVEZES_ES_OTLETELOS.md');
    ctx.reply(fs.existsSync(p) ? fs.readFileSync(p, 'utf8').substring(0, 3500) : 'Még nincsenek tervek.');
});

// Központi indító
function handleModeCommand(ctx, modeKey) {
    const prompt = ctx.message.text.replace(`/${modeKey}`, '').trim();
    if (!prompt && ['stats'].indexOf(modeKey) === -1) return ctx.reply(`Kérlek írd le a feladatot!`);
    
    if (agent.isBusy()) return ctx.reply('❌ Az ágens jelenleg foglalt!');

    // BIZTONSÁGI AUTOMATIZÁCIÓ: Kódmódosító parancsok előtt automatikusan mentünk!
    if (['debug', 'optimize', 'docs'].includes(modeKey)) {
        agent.createBackup();
    }

    const selectedMode = modes[modeKey];
    const modelData = config.models[activeModelKey];

    ctx.reply(`🚀 Indítás: ${selectedMode.name}\n🧠 Modell: ${modelData.name}`);

    agent.runTaskWithModeAndModel(
        prompt,
        selectedMode,
        modelData.id,
        (output) => { if (output.trim().length > 0) ctx.reply(`🧠 [AI]:\n${output}`); },
        () => {
            ctx.reply(`⚠️ JÓVÁHAGYÁS! Mehet a művelet?`, 
                Markup.inlineKeyboard([
                    Markup.button.callback('✅ Mehet', 'approve'),
                    Markup.button.callback('❌ Stop', 'deny')
                ])
            );
        },
        (code) => { ctx.reply(`🏁 ${selectedMode.name} befejeződött.`); }
    );
}

// Parancsok rákötése
Object.keys(modes).forEach(key => {
    bot.command(key, (ctx) => handleModeCommand(ctx, key));
});

bot.command('stop', (ctx) => { if (agent.stopTask()) ctx.reply('🚨 LEÁLLÍTVA!'); else ctx.reply('Nem fut semmi.'); });
bot.command('model', (ctx) => {
    const target = ctx.message.text.replace('/model', '').trim().toLowerCase();
    if (config.models[target]) { activeModelKey = target; ctx.reply(`✅ Modell: *${config.models[activeModelKey].name}*`, { parse_mode: 'Markdown' }); }
    else ctx.reply('llama | qwen | gemini');
});

bot.action('approve', (ctx) => { ctx.answerCbQuery(); ctx.editMessageText('✅.'); agent.approveAction(); });
bot.action('deny', (ctx) => { ctx.answerCbQuery(); ctx.editMessageText('❌.'); agent.denyAction(); });

bot.launch().then(() => console.log('🚀 Ultimate AI Asszisztens elindult!'));
