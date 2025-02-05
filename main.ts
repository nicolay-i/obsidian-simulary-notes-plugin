import { App, Plugin, WorkspaceLeaf, ItemView, TFile, Setting, PluginSettingTab } from "obsidian";

const VIEW_TYPE_SIMILAR = "similar-notes-view";

interface WordFrequency {
    word: string;
    count: number;
    frequency: number;
    isIgnored: boolean;
}

interface Localization {
    viewTitle: string;
    settingsTitle: string;
    excludedFoldersName: string;
    excludedFoldersDesc: string;
    minNoteLengthName: string;
    minNoteLengthDesc: string;
    searchingNotes: string;
    noSimilarNotes: string;
    errorSearching: string;
    commandName: string;
    errorCreatingPanel: string;
    pluginLoaded: string;
    pluginUnloaded: string;
    simularyText: string;
    wordFrequencyTitle: string;
    skipWord: string;
    useWord: string;
    frequencyText: string;
    noWords: string;
    ignoredWordsName: string;
    ignoredWordsDesc: string;
}

const locales: { [key: string]: Localization } = {
    en: {
        viewTitle: "Similar Notes",
        settingsTitle: "Similar Notes Search Settings",
        excludedFoldersName: "Excluded Folders",
        excludedFoldersDesc: "Specify folders (comma-separated) to exclude from search",
        minNoteLengthName: "Minimum Note Length",
        minNoteLengthDesc: "Minimum number of characters in a note to include it in search",
        searchingNotes: "Searching for similar notes...",
        noSimilarNotes: "No similar notes found",
        errorSearching: "Error searching for similar notes",
        commandName: "Find similar notes",
        errorCreatingPanel: "Failed to create panel",
        pluginLoaded: "Plugin loaded!",
        pluginUnloaded: "Plugin unloaded!",
        simularyText: "Similarity: {{value}}%",
        wordFrequencyTitle: "Word Frequency",
        skipWord: "Skip",
        useWord: "Use",
        frequencyText: "Frequency: {{value}}",
        noWords: "No words found",
        ignoredWordsName: "Ignored Words",
        ignoredWordsDesc: "List of words to exclude from frequency analysis (comma-separated)"
    },
    de: {
        viewTitle: "Ähnliche Notizen",
        settingsTitle: "Einstellungen für ähnliche Notizen",
        excludedFoldersName: "Ausgeschlossene Ordner",
        excludedFoldersDesc: "Geben Sie durch Kommas getrennte Ordner an, die von der Suche ausgeschlossen werden sollen",
        minNoteLengthName: "Minimale Notizlänge",
        minNoteLengthDesc: "Minimale Anzahl von Zeichen in einer Notiz, um sie in die Suche einzubeziehen",
        searchingNotes: "Suche nach ähnlichen Notizen...",
        noSimilarNotes: "Keine ähnlichen Notizen gefunden",
        errorSearching: "Fehler bei der Suche nach ähnlichen Notizen",
        commandName: "Ähnliche Notizen finden",
        errorCreatingPanel: "Panel konnte nicht erstellt werden",
        pluginLoaded: "Plugin geladen!",
        pluginUnloaded: "Plugin entladen!",
        simularyText: "Ähnlichkeit: {{value}}%",
        wordFrequencyTitle: "Worthäufigkeit",
        skipWord: "Überspringen",
        useWord: "Verwenden",
        frequencyText: "Häufigkeit: {{value}}",
        noWords: "Keine Wörter gefunden",
        ignoredWordsName: "Ignorierte Wörter",
        ignoredWordsDesc: "Liste der Wörter, die von der Häufigkeitsanalyse ausgeschlossen werden sollen (durch Komma getrennt)"
    },
    fr: {
        viewTitle: "Notes similaires",
        settingsTitle: "Paramètres de recherche de notes similaires",
        excludedFoldersName: "Dossiers exclus",
        excludedFoldersDesc: "Spécifiez les dossiers (séparés par des virgules) à exclure de la recherche",
        minNoteLengthName: "Longueur minimale de la note",
        minNoteLengthDesc: "Nombre minimum de caractères dans une note pour l'inclure dans la recherche",
        searchingNotes: "Recherche de notes similaires...",
        noSimilarNotes: "Aucune note similaire trouvée",
        errorSearching: "Erreur lors de la recherche de notes similaires",
        commandName: "Trouver des notes similaires",
        errorCreatingPanel: "Impossible de créer le panneau",
        pluginLoaded: "Plugin chargé !",
        pluginUnloaded: "Plugin déchargé !",
        simularyText: "Similarité: {{value}}%",
        wordFrequencyTitle: "Fréquence des mots",
        skipWord: "Ignorer",
        useWord: "Utiliser",
        frequencyText: "Fréquence: {{value}}",
        noWords: "Aucun mot trouvé",
        ignoredWordsName: "Mots ignorés",
        ignoredWordsDesc: "Liste des mots à exclure de l'analyse de fréquence (séparés par des virgules)"
    },
    ru: {
        viewTitle: "Похожие заметки",
        settingsTitle: "Настройки поиска похожих заметок",
        excludedFoldersName: "Исключенные папки",
        excludedFoldersDesc: "Укажите папки через запятую, в которых не нужно искать похожие заметки",
        minNoteLengthName: "Минимальная длина заметки",
        minNoteLengthDesc: "Минимальное количество символов в заметке для её учёта в поиске",
        searchingNotes: "Поиск похожих заметок...",
        noSimilarNotes: "Похожих заметок не найдено",
        errorSearching: "Произошла ошибка при поиске похожих заметок",
        commandName: "Найти похожие заметки",
        errorCreatingPanel: "Не удалось создать панель",
        pluginLoaded: "Плагин загружен!",
        pluginUnloaded: "Плагин выгружен!",
        simularyText: "Схожесть: {{value}}%",
        wordFrequencyTitle: "Частотность слов",
        skipWord: "Пропускать",
        useWord: "Использовать",
        frequencyText: "Частота: {{value}}",
        noWords: "Слов не найдено",
        ignoredWordsName: "Игнорируемые слова",
        ignoredWordsDesc: "Список слов для исключения из частотности (через запятую)"
    },
};

interface PluginSettings {
    excludedFolders: string[];
    minNoteLength: number;
    ignoredWords: string[];
}

const DEFAULT_SETTINGS: PluginSettings = {
    excludedFolders: ['Files'],
    minNoteLength: 10,
    ignoredWords: []
};

function calculateTF(documents: string[]) {
    const tf: { [key: string]: { count: number; docs: Set<string>, tf: number } } = {};
    for (const doc of documents) {
        const words = doc.split(/\W+/);
        const totalWords = words.length;

        for (const word of words) {
            const wordLower = word.toLowerCase();
            if (!tf[wordLower]) {
                tf[wordLower] = { count: 0, docs: new Set(), tf: 0 };
            }
            tf[wordLower].count++;
            tf[wordLower].docs?.add(doc);
        }
        // Normalize TF
        for (const word in tf) {
            tf[word].tf = tf[word].count / totalWords;
        }
    }
    return tf;
}

function calculateIDF(tf: any, totalDocs: number    ) {
    const idf: { [key: string]: number } = {};
    for (const word in tf) {
        idf[word] = Math.log(totalDocs / tf[word].docs.size);
    }
    return idf;
}

function calculateTFIDF(tf: any, idf: any) {
    const tfidf: { [key: string]: number } = {};
    for (const word in tf) {
        tfidf[word] = tf[word].tf * idf[word];
    }
    return tfidf;
}

function cosineSimilarity(vecA: any, vecB: any) {
    const dotProduct = Object.keys(vecA).reduce((sum: number, key: string) => sum + (vecA[key] || 0) * (vecB[key] || 0), 0);
    const magnitudeA = Math.sqrt(Object.keys(vecA).reduce((sum, key) => sum + (vecA[key] || 0) ** 2, 0));
    const magnitudeB = Math.sqrt(Object.keys(vecB).reduce((sum, key) => sum + (vecB[key] || 0) ** 2, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

class SimilarNotesView extends ItemView {
    plugin: SimularNotesPlugin;
    contentEl!: HTMLElement;
    container: HTMLDivElement;
    loadingEl!: HTMLElement;
    tabsContainer!: HTMLElement;
    similarContent!: HTMLElement;
    wordFrequencyContent!: HTMLElement;
    activeTab: 'similar' | 'frequency' = 'similar';
    wordFrequencies: WordFrequency[] = [];

    constructor(leaf: WorkspaceLeaf, plugin: SimularNotesPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.container = this.containerEl.createDiv({
            cls: "similar-notes-container"
        });
    }

    getViewType(): string {
        return VIEW_TYPE_SIMILAR;
    }

    getDisplayText(): string {
        return this.plugin.getLocale().viewTitle;
    }

    async onOpen() {
        const { containerEl } = this;
        containerEl.empty();
        
        // Create a container for tabs
        this.tabsContainer = containerEl.createDiv({ cls: "similar-notes-tabs" });
        
        // Create tabs
        const similarTab = this.tabsContainer.createDiv({
            cls: `similar-notes-tab ${this.activeTab === 'similar' ? 'active' : ''}`,
            text: this.plugin.getLocale().viewTitle
        });
        
        const frequencyTab = this.tabsContainer.createDiv({
            cls: `similar-notes-tab ${this.activeTab === 'frequency' ? 'active' : ''}`,
            text: this.plugin.getLocale().wordFrequencyTitle
        });

        // Add click handlers
        similarTab.addEventListener('click', () => this.switchTab('similar'));
        frequencyTab.addEventListener('click', () => this.switchTab('frequency'));

        // Create containers for content
        this.similarContent = containerEl.createDiv({
            cls: `similar-notes-content ${this.activeTab === 'similar' ? 'active' : ''}`
        });

        this.wordFrequencyContent = containerEl.createDiv({
            cls: `word-frequency-content ${this.activeTab === 'frequency' ? 'active' : ''}`
        });

        this.loadingEl = containerEl.createDiv({
            cls: "similar-notes-loading",
            text: this.plugin.getLocale().searchingNotes
        });
        this.loadingEl.hide();

        // Initialize content for both tabs
        if (this.activeTab === 'similar') {
            const currentFile = this.plugin.app.workspace.getActiveFile();
            if (currentFile) {
                const content = await this.plugin.app.vault.read(currentFile);
                await this.plugin.findNotes(content);
            }
        } else {
            await this.updateWordFrequencies();
        }
    }

    switchTab(tab: 'similar' | 'frequency') {
        this.activeTab = tab;
        
        // Update tab classes
        const tabs = this.tabsContainer.querySelectorAll('.similar-notes-tab');
        tabs.forEach((t: HTMLElement) => {
            t.classList.toggle('active', 
                t.textContent === (tab === 'similar' ? this.plugin.getLocale().viewTitle : this.plugin.getLocale().wordFrequencyTitle)
            );
        });

        // Show the appropriate content
        this.similarContent.classList.toggle('active', tab === 'similar');
        this.wordFrequencyContent.classList.toggle('active', tab === 'frequency');

        // Update content of the active tab
        if (tab === 'similar') {
            this.plugin.getCurrentFileContent().then(content => {
                if (content) {
                    this.plugin.findNotes(content);
                }
            });
        } else {
            this.updateWordFrequencies();
        }
    }

    async onClose() {
        this.contentEl.empty();
    }

    showLoading() {
        this.loadingEl.show();
        if (this.activeTab === 'similar') {
            this.similarContent.hide();
        } else {
            this.wordFrequencyContent.hide();
        }
    }

    hideLoading() {
        this.loadingEl.hide();
        if (this.activeTab === 'similar') {
            this.similarContent.show();
        } else {
            this.wordFrequencyContent.show();
        }
    }

    async updateView(similarities: Array<{document: string, similarity: number}>) {
        if (!this.similarContent) return;
        
        this.similarContent.empty();
        
        if (similarities.length === 0) {
            this.similarContent.createEl("div", {
                cls: "similar-notes-empty",
                text: this.plugin.getLocale().noSimilarNotes
            });
            return;
        }
        
        for (const item of similarities.slice(0, 20)) {
            const row = this.similarContent.createEl("div", { cls: "similar-note-row" });
            
            const link = row.createEl("a", {
                text: item.document,
                cls: "similar-note-link"
            });
            
            link.addEventListener("click", async (e) => {
                e.preventDefault();
                const file = this.plugin.app.vault.getAbstractFileByPath(item.document);
                if (file instanceof TFile) {
                    await this.plugin.app.workspace.getLeaf('tab').openFile(file);
                }
            });
            
            row.createEl("span", {
                text: this.plugin.getLocale().simularyText.replace("{{value}}", (item.similarity * 100).toFixed(2)),
                cls: "similar-note-similarity"
            });
        }
    }

    async updateWordFrequencies() {
        this.showLoading();
        
        try {
            const notes = this.plugin.app.vault.getFiles();
            const filteredNotes = notes.filter((e) => 
                e.name.endsWith(".md") && 
                !this.plugin.settings.excludedFolders.some(folder => e.path.startsWith(folder))
            );

            const wordCounts: { [key: string]: number } = {};
            let totalWords = 0;

            for (const note of filteredNotes) {
                const content = await this.plugin.app.vault.read(note);
                const words = content.split(/\W+/)
                    .filter(word => word.length > 0);
                
                for (const word of words) {
                    const wordLower = word.toLowerCase();
                    wordCounts[wordLower] = (wordCounts[wordLower] || 0) + 1;
                    totalWords++;
                }
            }

            this.wordFrequencies = Object.entries(wordCounts)
                .map(([word, count]) => ({
                    word,
                    count,
                    frequency: count / totalWords,
                    isIgnored: this.plugin.settings.ignoredWords.includes(word)
                }))
                .sort((a, b) => b.count - a.count);

            this.updateWordFrequencyView();
        } catch (error) {
            console.error("Error updating word frequencies:", error);
            this.wordFrequencyContent.empty();
            this.wordFrequencyContent.createEl("div", {
                cls: "word-frequency-error",
                text: this.plugin.getLocale().errorSearching
            });
        } finally {
            this.hideLoading();
        }
    }

    updateWordFrequencyView() {
        this.wordFrequencyContent.empty();

        if (this.wordFrequencies.length === 0) {
            this.wordFrequencyContent.createEl("div", {
                cls: "word-frequency-empty",
                text: this.plugin.getLocale().noWords
            });
            return;
        }

        const list = this.wordFrequencyContent.createEl("div", { cls: "word-frequency-list" });

        // Sort by frequency, ignored words remain in the list
        const sortedFrequencies = [...this.wordFrequencies].sort((a, b) => b.frequency - a.frequency);

        for (const item of sortedFrequencies) {
            const row = list.createEl("div", { 
                cls: `word-frequency-row ${item.isIgnored ? 'ignored' : ''}`
            });
            
            row.createEl("span", {
                text: item.word,
                cls: "word-frequency-word"
            });

            row.createEl("span", {
                text: this.plugin.getLocale().frequencyText.replace("{{value}}", (item.frequency * 100).toFixed(4) + "%"),
                cls: "word-frequency-count"
            });

            const button = row.createEl("button", {
                text: item.isIgnored ? this.plugin.getLocale().useWord : this.plugin.getLocale().skipWord,
                cls: `word-frequency-button ${item.isIgnored ? "ignored" : ""}`
            });

            button.addEventListener("click", async () => {
                if (item.isIgnored) {
                    this.plugin.settings.ignoredWords = this.plugin.settings.ignoredWords.filter(w => w !== item.word);
                } else {
                    this.plugin.settings.ignoredWords.push(item.word);
                }
                await this.plugin.saveSettings();
                item.isIgnored = !item.isIgnored;
                
                // Update only the button and row status
                button.textContent = item.isIgnored ? this.plugin.getLocale().useWord : this.plugin.getLocale().skipWord;
                button.classList.toggle("ignored", item.isIgnored);
                row.classList.toggle("ignored", item.isIgnored);
            });
        }
    }
}

export default class SimularNotesPlugin extends Plugin {
    view!: SimilarNotesView;
    settings!: PluginSettings;

    getLocale(): Localization {
        const lang = window.localStorage.getItem('language') || "en";
        const baseLang = lang.split('-')[0].toLowerCase();
        return locales[baseLang] || locales.en;
    }

    async onload() {
        await this.loadSettings();
        
        console.log(this.getLocale().pluginLoaded);
        
        this.addSettingTab(new SimilarNotesSettingTab(this.app, this));
        
        this.registerView(
            VIEW_TYPE_SIMILAR,
            (leaf) => (this.view = new SimilarNotesView(leaf, this))
        );

        this.registerEvent(
            this.app.workspace.on('file-open', async (file) => {
                if (file && this.view) {
                    const content = await this.app.vault.read(file);
                    await this.findNotes(content);
                    if (this.view.activeTab === 'frequency') {
                        await this.view.updateWordFrequencies();
                    }
                }
            })
        );

        this.addCommand({
            id: "find-notes",
            name: this.getLocale().commandName,
            callback: async () => {
                const content = await this.getCurrentFileContent();
                await this.activateView();
                await this.findNotes(content);
            },
        });

        this.app.workspace.onLayoutReady(async () => {
            await this.activateView();
            const currentFile = this.app.workspace.getActiveFile();
            if (currentFile) {
                const content = await this.app.vault.read(currentFile);
                await this.findNotes(content);
                if (this.view.activeTab === 'frequency') {
                    await this.view.updateWordFrequencies();
                }
            }
        });
    }

    async activateView() {
        try {
            const { workspace } = this.app;
            const rightSidebar = workspace.rightSplit;
            
            if (rightSidebar && rightSidebar.collapsed) {
                rightSidebar.expand();
            }

            let leaf = workspace.getLeavesOfType(VIEW_TYPE_SIMILAR)[0];
            if (!leaf) {
                const newLeaf = workspace.getRightLeaf(false);
                if (!newLeaf) {
                    throw new Error(this.getLocale().errorCreatingPanel);
                }
                leaf = newLeaf;
                await leaf.setViewState({
                    type: VIEW_TYPE_SIMILAR,
                    active: true
                });
            }

            workspace.revealLeaf(leaf);
            return leaf;
        } catch (error) {
            console.error(this.getLocale().errorCreatingPanel, error);
            throw error;
        }
    }

    async getCurrentFileContent() {
        const currentFile = this.app.workspace.getActiveFile();
        if (!currentFile) {
            return "";
        }
        const content = await this.app.vault.read(currentFile);
        return content;
    }

    async findNotes(content: string) {
        if (!this.view) return;

        this.view.showLoading();
        
        try {
        const notes = this.app.vault.getFiles();
            const filteredNotes = notes.filter((e) => 
                e.name.endsWith(".md") && 
                !this.settings.excludedFolders.some(folder => e.path.startsWith(folder))
            );

        const texts: string[] = [content];

        for (const note of filteredNotes) {
            const file = this.app.vault.getFileByPath(note.path);
            if (!file) {
                continue;
            }
            const noteContent = await this.app.vault.read(file);

                if (noteContent.length >= this.settings.minNoteLength) {
                texts.push(`${note.path}\n${noteContent}`);
            }
        }

        const documents = texts;

        const tf = calculateTF(documents);
        const idf = calculateIDF(tf, documents.length);
        const tfidfDocs = documents.map(doc => calculateTFIDF(calculateTF([doc]), idf));
        const targetTFIDF = calculateTFIDF(calculateTF([content]), idf);
        
        const similarities = tfidfDocs.map((tfidfDoc, index) => ({
            document: filteredNotes[index]?.path ?? index,
            similarity: cosineSimilarity(tfidfDoc, targetTFIDF)
        }));

            const sortedSimilarities = similarities
                .filter((e) => e.similarity < 1)
                .sort((a, b) => b.similarity - a.similarity);

            this.view.updateView(sortedSimilarities);
        } catch (error) {
            console.error("Error searching for similar notes:", error);
            this.view.contentEl.empty();
            this.view.contentEl.createEl("div", {
                cls: "similar-notes-error",
                text: this.getLocale().errorSearching
            });
        } finally {
            this.view.hideLoading();
        }
    }

    async onunload() {
        console.log(this.getLocale().pluginUnloaded);
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_SIMILAR);
        for (const leaf of leaves) {
            await leaf.detach();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SimilarNotesSettingTab extends PluginSettingTab {
    plugin: SimularNotesPlugin;

    constructor(app: App, plugin: SimularNotesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        const locale = this.plugin.getLocale();
        
        containerEl.empty();

        containerEl.createEl('h2', { text: locale.settingsTitle });

        new Setting(containerEl)
            .setName(locale.excludedFoldersName)
            .setDesc(locale.excludedFoldersDesc)
            .addText(text => text
                .setPlaceholder('Files, Archive, Templates')
                .setValue(this.plugin.settings.excludedFolders.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.excludedFolders = value
                        .split(',')
                        .map(folder => folder.trim())
                        .filter(folder => folder.length > 0);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(locale.minNoteLengthName)
            .setDesc(locale.minNoteLengthDesc)
            .addText(text => text
                .setPlaceholder('10')
                .setValue(String(this.plugin.settings.minNoteLength))
                .onChange(async (value) => {
                    const numValue = Number(value);
                    if (!isNaN(numValue) && numValue > 0) {
                        this.plugin.settings.minNoteLength = numValue;
                        await this.plugin.saveSettings();
                    }
                }));

        // New field for ignored words
        new Setting(containerEl)
            .setName(locale.ignoredWordsName)
            .setDesc(locale.ignoredWordsDesc)
            .addTextArea(text => text
                .setPlaceholder("the, a, an, in, on, at")
                .setValue(this.plugin.settings.ignoredWords.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.ignoredWords = value
                        .split(',')
                        .map(word => word.trim().toLowerCase())
                        .filter(word => word.length > 0);
                    await this.plugin.saveSettings();
                    
                    // Update frequency, if the corresponding tab is open
                    const view = this.plugin.view;
                    if (view && view.activeTab === 'frequency') {
                        await view.updateWordFrequencies();
                    }
                }));
    }
}

