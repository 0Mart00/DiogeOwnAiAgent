// modes/commit.js
module.exports = {
    name: "📦 Git Commit & Push",
    getSystemPrompt: (userPrompt) => {
        return `Feladat: Git verziókövetés kezelése.
        Utasítás: ${userPrompt}
        
        MŰKÖDÉSI SZABÁLY: Használd a git eszközöket. Nézd meg a változásokat (git status, git diff). Készíts egy professzionális, angol nyelvű, a 'Conventional Commits' szabványnak megfelelő commit üzenetet (pl. 'feat: add login feature' vagy 'fix: resolve memory leak'). 
        Add hozzá a fájlokat (git add), commitolj, és ha a felhasználó kérte, küldd fel a távoli repóba (git push).`;
    }
};
