// index.js
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // A GitHub kérésekhez
const config = require('./config');
const agent = require('./agent');

const bot = new Telegraf(config.telegramToken);
let activeModelKey = config.defaultModel;
let selectedModeKey = 'debug';
let selectedRepoName = ''; // Eltároljuk az éppen kiválasztott projekt nevét

// Segédfüggvény a GitHub felhasználónév kinyeréséhez a tokenes linkből

function getGitHubUsername() {
    const url = process.env.GITHUB_REPO_URL || '';
    // Kiszedi a felhasználónevet a sima github.com linkből is
    const match = url.match(/github\.com\/([^/]+)/);
    return match ? match[1] : '';
}

// Főmenü üzenet generálása
function getDashboardMessage() {
    const currentModelName = config.models[activeModelKey].name;
    const currentModeName = selectedModeKey === 'debug' ? '🐛 Hibakeresés' :
                            selectedModeKey === 'optimize' ? '⚡ Optimalizálás' :
                            selectedModeKey === 'search' ? '🌐 Webes Keresés' : '🎨 Tervezés';

    let projectStatus = '❌ Üres mappa (Válassz repót!)';
    const files = fs.readdirSync(agent.getProjectDir());
    if (files.length > 0) {
        projectStatus = `✅ Betöltve: [${selectedRepoName || 'Helyi projekt'}]`;
    }

    return `🎮 **AI DEVOPS CONTROL PANEL**\n\n` +
           `📁 Állapot: *${projectStatus}*\n` +
           `🧠 Aktív Modell: *${currentModelName}*\n` +
           `🛠️ Kiválasztott Mód: *${currentModeName}*\n\n` +
           `👇 Használd az alábbi gyorsgombokat a vezérléshez!`;
}

// Főmenü Gombok struktúrája
function getDashboardButtons() {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback('🌐 Repók Listázása', 'menu_list_repos'),
            Markup.button.callback('📊 Statisztika', 'menu_stats')
        ],
        [
            Markup.button.callback('🧠 Modell Váltás', 'menu_models'),
            Markup.button.callback('🛠️ Funkció Váltás', 'menu_modes')
        ],
        [
            Markup.button.callback('📁 Struktúra', 'view_structure'),
            Markup.button.callback('💡 Tervek', 'view_ideas')
        ],
        [
            Markup.button.callback('💾 Mentés (Backup)', 'do_backup'),
            Markup.button.callback('⏪ Visszaállítás', 'do_rollback')
        ],
        [
            Markup.button.callback('🚨 AZONNALI LEÁLLÍTÁS (PÁNIK)', 'panic_stop')
        ]
    ]);
}

bot.start((ctx) => {
    ctx.reply(getDashboardMessage(), { parse_mode: 'Markdown', ...getDashboardButtons() });
});


bot.action('menu_list_repos', async (ctx) => {
    ctx.answerCbQuery();
    
    const username = getGitHubUsername();
    const githubToken = process.env.GITHUB_TOKEN; // Külön környezeti változóból olvassuk

    if (!username || !githubToken) {
        return ctx.reply('❌ Hiányzik a GITHUB_REPO_URL vagy a GITHUB_TOKEN a beállításokból!');
    }

    ctx.reply(`🔍 Kapcsolódás a GitHubhoz... [${username}] repóinak lekérése...`);

    try {
        const response = await axios.get(`github.com{username}/repos`, {
            headers: { 
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Node-Telegraf-Bot'
            },
            params: { per_page: 15, sort: 'updated' }
        });

        if (response.data.length === 0) {
            return ctx.reply('ℹ️ Nem találtam egyetlen repót sem ebben a GitHub fiókban.');
        }

        const repoButtons = response.data.map(repo => {
            return [Markup.button.callback(`📁 ${repo.name} (${repo.private ? '🔒' : '🌐'})`, `clone_repo:${repo.name}`)];
        });
        
        repoButtons.push([Markup.button.callback('⬅️ Vissza a főmenübe', 'back_to_main')]);
        ctx.reply('📂 **Válaszd ki a projektet, amin az AI dolgozzon:**', Markup.inlineKeyboard(repoButtons));

    } catch (error) {
        console.error("GitHub API hiba:", error.message);
        ctx.reply('❌ Sikertelen lekérés. Ellenőrizd a beállításokat!');
    }
});

 
bot.action(/^clone_repo:(.+)$/, async (ctx) => {
    ctx.answerCbQuery();
    const repoName = ctx.match[1];
    selectedRepoName = repoName;

    const username = getGitHubUsername();
    const githubToken = process.env.GITHUB_TOKEN;

    // Tiszta, szabványos URL a klónozáshoz
    const targetCloneUrl = `https://${username}:${githubToken}@github.com{username}/${repoName}.git`;

    ctx.reply(`🚀 Kiválasztva: [${repoName}]. Törlöm az előző projektet és letöltöm az újat...`);

    const projectDir = agent.getProjectDir();
    if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
    }
    fs.mkdirSync(projectDir);

    const { exec } = require('child_process');
    exec(`git clone ${targetCloneUrl} ${projectDir}`, (err, stdout, stderr) => {
        if (err) {
            console.error("Clone Error:", err);
            return ctx.reply('❌ Hiba történt a letöltés során. Próbáld újra!');
        }
        ctx.reply(`✅ A(z) **${repoName}** projekt sikeresen letöltve az ágensbe!`, {
            parse_mode: 'Markdown',
            ...getDashboardButtons()
        });
    });
});

// --- A MEGLÉVŐ TOVÁBBI MENÜPONTOK (Változatlanul) ---
bot.action('menu_models', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText('🧠 **Válassz egy AI Nyelvi Modellt:**', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('Llama 3.3', 'set_model_llama'), Markup.button.callback('Qwen Coder', 'set_model_qwen')],
            [Markup.button.callback('Gemini Flash', 'set_model_gemini')],
            [Markup.button.callback('⬅️ Vissza a főmenübe', 'back_to_main')]
        ])
    });
});

Object.keys(config.models).forEach(key => {
    bot.action(`set_model_${key}`, (ctx) => { activeModelKey = key; ctx.answerCbQuery(); ctx.editMessageText(getDashboardMessage(), { parse_mode: 'Markdown', ...getDashboardButtons() }); });
});

bot.action('menu_modes', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText('🛠️ **Válassz egy aktív funkciót:**', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🐛 Debug', 'set_mode_debug'), Markup.button.callback('⚡ Optimize', 'set_mode_optimize')],
            [Markup.button.callback('🌐 Search', 'set_mode_search'), Markup.button.callback('🎨 Creative', 'set_mode_creative')],
            [Markup.button.callback('⬅️ Vissza a főmenübe', 'back_to_main')]
        ])
    });
});
// 🌐 1. GITHUB REPÓK KILISTÁZÁSA ÉS VÁLASZTÁSA (JAVÍTOTT VERZIÓ)
bot.action('menu_list_repos', async (ctx) => {
    ctx.answerCbQuery();
    
    const creds = getGitHubCredentials();
    
    if (!creds) {
        return ctx.reply('❌ Nem található érvényes felhasználónév és ghp_ token a GITHUB_REPO_URL-ben!');
    }

    ctx.reply(`🔍 Kapcsolódás a GitHubhoz... [${creds.username}] repóinak lekérése...`);

    try {
        // FIX: A hivatalos GitHub API végpontot hívjuk meg az autentikált felhasználóhoz
        const response = await axios.get('https://api.github.com/user/repos', {
            headers: { 
                'Authorization': `token ${creds.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Node-Telegraf-Bot' // A GitHub API megköveteli a User-Agent fejlécet!
            },
            params: { 
                per_page: 15, 
                sort: 'updated',
                type: 'all' // Így a saját és iskolai/szervezeti repók is megjelennek
            }
        });

        if (!response.data || response.data.length === 0) {
            return ctx.reply('ℹ️ Nem találtam egyetlen repót sem ebben a GitHub fiókban.');
        }

        // Gombok generálása a repókból
        const repoButtons = response.data.map(repo => {
            return [Markup.button.callback(`📁 ${repo.name} ${repo.private ? '🔒' : '🌐'}`, `clone_repo:${repo.name}`)];
        });
        
        repoButtons.push([Markup.button.callback('⬅️ Vissza a főmenübe', 'back_to_main')]);

        ctx.reply('📂 **Válaszd ki a projektet, amin az AI dolgozzon:**', Markup.inlineKeyboard(repoButtons));

    } catch (error) {
        console.error("GitHub API hiba részletei:", error.response ? error.response.data : error.message);
        ctx.reply('❌ Sikertelen lekérés. Ellenőrizd a ghp_ tokened érvényességét a GitHub-on!');
    }
});

['debug', 'optimize', 'search', 'creative'].forEach(key => {
    bot.action(`set_mode_${key}`, (ctx) => { selectedModeKey = key; ctx.answerCbQuery(); ctx.editMessageText(getDashboardMessage(), { parse_mode: 'Markdown', ...getDashboardButtons() }); });
});

bot.action('back_to_main', (ctx) => { ctx.answerCbQuery(); ctx.editMessageText(getDashboardMessage(), { parse_mode: 'Markdown', ...getDashboardButtons() }); });

bot.action('view_structure', (ctx) => { ctx.answerCbQuery(); const p = path.join(agent.getProjectDir(), 'PROJEKT_STRUKTURA.md'); ctx.reply(fs.existsSync(p) ? `📁 **Struktúra:**\n\n${fs.readFileSync(p, 'utf8').substring(0, 3500)}` : '⚠️ Még nincs struktúra.'); });
bot.action('view_ideas', (ctx) => { ctx.answerCbQuery(); const p = path.join(agent.getProjectDir(), 'TERVEZES_ES_OTLETELOS.md'); ctx.reply(fs.existsSync(p) ? `💡 **Tervek:**\n\n${fs.readFileSync(p, 'utf8').substring(0, 3500)}` : '⚠️ Még nincsenek tervek.'); });
bot.action('do_backup', (ctx) => { const name = agent.createBackup(); ctx.answerCbQuery(name ? 'Kész!' : 'Hiba!'); if (name) ctx.reply(`✅ Mentés: \`${name}\``); });
bot.action('do_rollback', (ctx) => { const success = agent.rollbackToLatest(); ctx.answerCbQuery(success ? 'Visszaállítva!' : 'Nincs mentés!'); if (success) ctx.reply('⏪ Sikeres visszaállítás.'); });
bot.action('panic_stop', (ctx) => { const stopped = agent.stopTask(); ctx.answerCbQuery(stopped ? 'AI Leállítva!' : 'Nem fut semmi.'); });

bot.on('text', (ctx) => {
    const prompt = ctx.message.text.trim();
    if (prompt.startsWith('/')) return;
    if (agent.isBusy()) return ctx.reply('❌ Foglalt!');
    if (['debug', 'optimize'].includes(selectedModeKey)) agent.createBackup();

    const modeModule = require(`./modes/${selectedModeKey}`);
    const modelData = config.models[activeModelKey];

    ctx.reply(`🚀 **AI Indítás...**\n⚙️ Mód: *${modeModule.name}*\n🧠 Modell: *${modelData.name}*`, { parse_mode: 'Markdown' });

    agent.runTaskWithModeAndModel(prompt, modeModule, modelData.id,
        (output) => { if (output.trim().length > 0) ctx.reply(`🧠 [AI]:\n${output}`); },
        () => { ctx.reply(`⚠️ JÓVÁHAGYÁS!`, Markup.inlineKeyboard([Markup.button.callback('✅ Mehet', 'approve'), Markup.button.callback('❌ Stop', 'deny')])); },
        (code) => { ctx.reply(`🏁 Kész.`); }
    );
});

bot.action('approve', (ctx) => { ctx.answerCbQuery(); ctx.editMessageText('✅.'); agent.approveAction(); });
bot.action('deny', (ctx) => { ctx.answerCbQuery(); ctx.editMessageText('❌.'); agent.denyAction(); });

bot.launch().then(() => console.log('🚀 Repó-Választós Dashboard Bot elindult!'));

