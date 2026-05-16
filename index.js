const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');
const agent = require('./agent');

const modes = {
    audit: require('./modes/audit'),
    commit: require('./modes/commit'),
    creative: require('./modes/creative'),
    debug: require('./modes/debug'),
    docs: require('./modes/docs'),
    explain: require('./modes/explain'),
    optimize: require('./modes/optimize'),
    search: require('./modes/search'),
    stats: require('./modes/stats'),
    test: require('./modes/test')
};

const bot = new Telegraf(config.telegramToken);

let activeModelKey = config.defaultModel;
let selectedModeKey = 'debug';
let selectedRepoName = '';

function getGitHubCredentials() {
    const url = process.env.GITHUB_REPO_URL || '';
    const token = process.env.GITHUB_TOKEN || '';
    const match = url.match(/github\.com\/([^/]+)/);
    const username = match ? match[1] : '';
    return (username && token) ? { username, token } : null;
}

function getDashboardMessage() {
    const currentModelName = config.models[activeModelKey]?.name || 'Nincs';
    const modeIcons = {
        audit: '🛡️ Audit', commit: '📝 Commit', creative: '🎨 Creative',
        debug: '🐛 Debug', docs: '📚 Docs', explain: '💡 Explain',
        optimize: '⚡ Optimize', search: '🌐 Search', stats: '📊 Stats', test: '🧪 Test'
    };
    const currentModeName = modeIcons[selectedModeKey] || selectedModeKey;

    let projectStatus = '❌ Üres';
    try {
        const pDir = agent.getProjectDir();
        if (fs.existsSync(pDir) && fs.readdirSync(pDir).length > 0) {
            projectStatus = `✅ [${selectedRepoName || 'Aktív Projekt'}]`;
        }
    } catch (e) {}

    return `🎮 **AI DEVOPS CONTROL PANEL**\n\n` +
           `📁 Projekt: *${projectStatus}*\n` +
           `🧠 Modell: *${currentModelName}*\n` +
           `🛠️ Aktív Mód: *${currentModeName}*\n\n` +
           `Írj parancsot a chatbe, vagy válassz funkciót:`;
}

function getDashboardButtons() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🌐 Repók Listázása', 'menu_list_repos'), Markup.button.callback('📊 Statisztika', 'run_stats')],
        [Markup.button.callback('🧠 Modell Váltás', 'menu_models'), Markup.button.callback('🛠️ Funkció Váltás', 'menu_modes')],
        [Markup.button.callback('🛡️ Audit', 'run_audit'), Markup.button.callback('🧪 Teszt', 'run_test')],
        [Markup.button.callback('💾 Mentés', 'do_backup'), Markup.button.callback('⏪ Vissza', 'do_rollback')],
        [Markup.button.callback('🚨 PÁNIK STOP', 'panic_stop')]
    ]);
}

bot.use((ctx, next) => {
    if (ctx.from && ctx.from.id !== config.adminId) return ctx.reply("❌ Nincs jogosultságod.");
    return next();
});

bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;
    
    const text = ctx.message.text.toLowerCase();
    
    // Ha az ágens éppen vár egy y/n válaszra
    if (agent.isBusy()) {
        if (text === 'y' || text === 'yes') {
            agent.approveAction();
            return ctx.reply("✅ Jóváhagyva.");
        }
        if (text === 'n' || text === 'no') {
            agent.denyAction();
            return ctx.reply("❌ Elutasítva.");
        }
        return ctx.reply("⚠️ Az ágens dolgozik! Csak 'y' vagy 'n' választ fogadok el a folyamatban lévő művelethez.");
    }

    ctx.reply(`⚙️ AI indítás [${selectedModeKey}] módban...`);

    agent.runTaskWithModeAndModel(
        ctx.message.text,
        modes[selectedModeKey],
        config.models[activeModelKey].id,
        (out) => ctx.reply(out),
        () => ctx.reply("❓ Jóváhagyás szükséges (y/n)?"),
        (code) => ctx.reply(`🏁 Befejezve. Exit code: ${code}`)
    );
});

bot.start(ctx => ctx.reply(getDashboardMessage(), { parse_mode: 'Markdown', ...getDashboardButtons() }));

bot.action('back_to_main', ctx => {
    ctx.answerCbQuery();
    ctx.editMessageText(getDashboardMessage(), { parse_mode: 'Markdown', ...getDashboardButtons() });
});

bot.action('menu_list_repos', async (ctx) => {
    ctx.answerCbQuery();
    const creds = getGitHubCredentials();
    if (!creds) return ctx.reply('❌ GITHUB_TOKEN/URL hiányzik!');

    try {
        const res = await axios.get(`https://api.github.com/users/${creds.username}/repos`, {
            headers: { 'Authorization': `token ${creds.token}`, 'User-Agent': 'Node-Bot' }
        });
        const repoButtons = res.data.map(repo => [Markup.button.callback(`📁 ${repo.name}`, `clone_repo:${repo.name}`)]);
        repoButtons.push([Markup.button.callback('⬅️ Vissza', 'back_to_main')]);
        ctx.reply('📂 **Válaszd ki:**', Markup.inlineKeyboard(repoButtons));
    } catch (e) { ctx.reply(`❌ API Hiba: ${e.message}`); }
});

bot.action(/^clone_repo:(.+)$/, async (ctx) => {
    ctx.answerCbQuery();
    const repoName = ctx.match[1];
    selectedRepoName = repoName;
    const creds = getGitHubCredentials();
    const url = `https://${creds.username}:${creds.token}@github.com/${creds.username}/${repoName}.git`;

    ctx.reply(`🚀 [${repoName}] klónozása...`);
    const pDir = agent.getProjectDir();
    if (fs.existsSync(pDir)) fs.rmSync(pDir, { recursive: true, force: true });
    fs.mkdirSync(pDir, { recursive: true });

    const { exec } = require('child_process');
    exec(`git clone ${url} ${pDir}`, (err) => {
        if (err) return ctx.reply('❌ Hiba.');
        ctx.reply(`✅ **${repoName}** betöltve!`, getDashboardButtons());
    });
});

bot.action('menu_modes', ctx => {
    const keys = Object.keys(modes);
    const buttons = [];
    for (let i = 0; i < keys.length; i += 2) {
        buttons.push([
            Markup.button.callback(keys[i], `set_mode_${keys[i]}`),
            keys[i+1] ? Markup.button.callback(keys[i+1], `set_mode_${keys[i+1]}`) : null
        ].filter(Boolean));
    }
    buttons.push([Markup.button.callback('⬅️ Vissza', 'back_to_main')]);
    ctx.editMessageText('🛠️ **Mód választás:**', Markup.inlineKeyboard(buttons));
});

Object.keys(modes).forEach(key => {
    bot.action(`set_mode_${key}`, ctx => {
        selectedModeKey = key;
        ctx.answerCbQuery();
        ctx.editMessageText(getDashboardMessage(), { parse_mode: 'Markdown', ...getDashboardButtons() });
    });
});

bot.action('menu_models', ctx => {
    const buttons = Object.keys(config.models).map(key => [Markup.button.callback(config.models[key].name, `set_model_${key}`)]);
    buttons.push([Markup.button.callback('⬅️ Vissza', 'back_to_main')]);
    ctx.editMessageText('🧠 **Modell választás:**', Markup.inlineKeyboard(buttons));
});

Object.keys(config.models).forEach(key => {
    bot.action(`set_model_${key}`, ctx => {
        activeModelKey = key;
        ctx.answerCbQuery();
        ctx.editMessageText(getDashboardMessage(), { parse_mode: 'Markdown', ...getDashboardButtons() });
    });
});

bot.action('run_stats', ctx => agent.runTaskWithModeAndModel("Stats", modes.stats, config.models[activeModelKey].id, o => ctx.reply(o), () => {}, c => ctx.reply(`Kész: ${c}`)));
bot.action('run_audit', ctx => agent.runTaskWithModeAndModel("Audit", modes.audit, config.models[activeModelKey].id, o => ctx.reply(o), () => {}, c => ctx.reply(`Kész: ${c}`)));
bot.action('run_test', ctx => agent.runTaskWithModeAndModel("Test", modes.test, config.models[activeModelKey].id, o => ctx.reply(o), () => {}, c => ctx.reply(`Kész: ${c}`)));
bot.action('do_backup', ctx => { ctx.reply(`💾 Mentés: ${agent.createBackup()}`); ctx.answerCbQuery(); });
bot.action('do_rollback', ctx => { ctx.reply(agent.rollbackToLatest() ? "⏪ Visszaállítva!" : "❌ Nincs mentés."); ctx.answerCbQuery(); });
bot.action('panic_stop', ctx => { agent.stopTask(); ctx.reply('🚨 LEÁLLÍTVA'); });

bot.launch();
console.log("🚀 Bot Online");
