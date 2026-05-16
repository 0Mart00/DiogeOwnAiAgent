const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config');

let claudeProcess = null;
let pendingResolve = null;

// Szigorúan elkülönített munkakönyvtár a célprojektnek (amit elemezni fogunk)
const PROJECT_DIR = path.join(__dirname, 'project');

// Biztosítjuk, hogy a projekt mappa létezzen
if (!fs.existsSync(PROJECT_DIR)) {
    fs.mkdirSync(PROJECT_DIR, { recursive: true });
}

/**
 * AI feladat futtatása a helyi Claude Code motorral
 */
function runTaskWithModeAndModel(userPrompt, modeModule, modelId, onOutput, onApprovalRequired, onClose) {
    if (claudeProcess) return false;

    const finalPrompt = modeModule.getSystemPrompt(userPrompt);
    
    // Itt nem fix fájlt hívunk, hanem a Python modult indítjuk el
    console.log(`AI Motor indítása modulként...`);

    claudeProcess = spawn('python3', ['-m', 'cli', finalPrompt], {
        cwd: path.join(__dirname, 'free-claude-code'), // A modul mappájából indítjuk
        env: {
            ...process.env,
            OPENROUTER_API_KEY: config.openrouterKey,
            FCC_MODEL: modelId,
            GITHUB_TOKEN: process.env.GITHUB_TOKEN,
            PYTHONPATH: path.join(__dirname, 'free-claude-code') // Beállítjuk, hogy lássa a core/ és providers/ mappákat
        }
    });
    claudeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        onOutput(output);
        
        // Interaktív megerősítés figyelése (ha az AI módosítani akar valamit)
        if (output.includes('?') || output.toLowerCase().includes('y/n') || output.includes('Do you want to')) {
            onApprovalRequired();
            pendingResolve = true;
        }
    });

    claudeProcess.stderr.on('data', (data) => { 
        const errStr = data.toString();
        console.error(`PYTHON ERROR: ${errStr}`);
        onOutput(`⚠️ Rendszerüzenet: ${errStr.substring(0, 300)}`);
    });

    claudeProcess.on('close', (code) => {
        onClose(code);
        claudeProcess = null;
        pendingResolve = null;
    });

    return true;
}

/**
 * Biztonsági mentés készítése a /project mappáról
 */
function createBackup() {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupPath = path.join(backupDir, `backup-${timestamp}`);
    
    try {
        if (fs.existsSync(PROJECT_DIR)) {
            fs.cpSync(PROJECT_DIR, currentBackupPath, { recursive: true });
            return `backup-${timestamp}`;
        }
        return null;
    } catch (err) {
        console.error("Backup hiba:", err);
        return null;
    }
}

/**
 * Visszaállítás a legutóbbi mentésre
 */
function rollbackToLatest() {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) return false;
    
    const backups = fs.readdirSync(backupDir).filter(f => f.startsWith('backup-')).sort();
    if (backups.length === 0) return false;
    
    const latestBackup = path.join(backupDir, backups[backups.length - 1]);
    
    try {
        fs.rmSync(PROJECT_DIR, { recursive: true, force: true });
        fs.cpSync(latestBackup, PROJECT_DIR, { recursive: true });
        // Töröljük a felhasznált mentést, hogy ne halmozódjon
        fs.rmSync(latestBackup, { recursive: true, force: true });
        return true;
    } catch (err) {
        console.error("Rollback hiba:", err);
        return false;
    }
}

module.exports = {
    runTaskWithModeAndModel,
    createBackup,
    rollbackToLatest,
    getProjectDir: () => PROJECT_DIR,
    stopTask: () => {
        if (claudeProcess) { 
            claudeProcess.kill('SIGKILL'); 
            claudeProcess = null; 
            pendingResolve = null;
            return true; 
        }
        return false;
    },
    approveAction: () => { 
        if (pendingResolve && claudeProcess) { 
            claudeProcess.stdin.write('y\n'); 
            pendingResolve = null; 
        } 
    },
    denyAction: () => { 
        if (pendingResolve && claudeProcess) { 
            claudeProcess.stdin.write('n\n'); 
            pendingResolve = null; 
        } 
    },
    isBusy: () => claudeProcess !== null
};
