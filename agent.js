// agent.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config');

let claudeProcess = null;
let pendingResolve = null;

// Szigorúan elkülönített munkakönyvtár a fejlesztett projektnek
const PROJECT_DIR = path.join(__dirname, 'project');

// Gondoskodunk róla, hogy a projekt mappa létezzen
if (!fs.existsSync(PROJECT_DIR)) {
    fs.mkdirSync(PROJECT_DIR);
}

function runTaskWithModeAndModel(userPrompt, modeModule, modelId, onOutput, onApprovalRequired, onClose) {
    if (claudeProcess) return false;

    // Itt, a függvényen belül győződünk meg róla, hogy a prompt összeáll és létezik
    const finalPrompt = modeModule.getSystemPrompt(userPrompt);

    claudeProcess = spawn('python3', [path.join(__dirname, 'free-claude-code/main.py'), finalPrompt], {
        cwd: PROJECT_DIR, // Korlátozás a project/ mappára
        env: {
            ...process.env,
            OPENROUTER_API_KEY: config.openrouterKey,
            FCC_MODEL: modelId
        }
    });

    claudeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        onOutput(output);

        if (output.includes('?') || output.toLowerCase().includes('y/n') || output.includes('Do you want to')) {
            onApprovalRequired();
            return new Promise((resolve) => { pendingResolve = resolve; });
        }
    });

    claudeProcess.stderr.on('data', (data) => { console.error(`Hiba: ${data}`); });

    claudeProcess.on('close', (code) => {
        onClose(code);
        claudeProcess = null;
        pendingResolve = null;
    });

    return true;
}

function createBackup() {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupPath = path.join(backupDir, `backup-${timestamp}`);
    
    try {
        if (fs.existsSync(PROJECT_DIR)) {
            fs.cpSync(PROJECT_DIR, currentBackupPath, { recursive: true });
            return `backup-${timestamp}`;
        }
        return null;
    } catch (err) {
        console.error("Mentési hiba:", err);
        return null;
    }
}

function rollbackToLatest() {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) return false;

    const backups = fs.readdirSync(backupDir).filter(f => f.startsWith('backup-')).sort();
    if (backups.length === 0) return false;

    const latestBackup = path.join(backupDir, backups[backups.length - 1]);

    try {
        fs.rmSync(PROJECT_DIR, { recursive: true, force: true });
        fs.cpSync(latestBackup, PROJECT_DIR, { recursive: true });
        fs.rmSync(latestBackup, { recursive: true, force: true });
        return true;
    } catch (err) {
        console.error("Visszaállítási hiba:", err);
        return false;
    }
}

module.exports = {
    runTaskWithModeAndModel,
    createBackup,
    rollbackToLatest,
    getProjectDir: () => PROJECT_DIR,
    stopTask: () => {
        if (claudeProcess) { claudeProcess.kill('SIGKILL'); claudeProcess = null; pendingResolve = null; return true; }
        return false;
    },
    approveAction: () => { if (pendingResolve && claudeProcess) { claudeProcess.stdin.write('y\n'); pendingResolve(); pendingResolve = null; } },
    denyAction: () => { if (pendingResolve && claudeProcess) { claudeProcess.stdin.write('n\n'); pendingResolve(); pendingResolve = null; } },
    isBusy: () => claudeProcess !== null
};

