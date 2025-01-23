import { App, Plugin, WorkspaceLeaf, ItemView, TFile, Setting, PluginSettingTab } from "obsidian";

const VIEW_TYPE_SIMILAR = "similar-notes-view";

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
    },
};

interface PluginSettings {
    excludedFolders: string[];
    minNoteLength: number;
}

const DEFAULT_SETTINGS: PluginSettings = {
    excludedFolders: ['Files'],
    minNoteLength: 10
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
    plugin: MyPlugin;
    contentEl!: HTMLElement;
    container: HTMLDivElement;
    loadingEl!: HTMLElement;

    constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
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
        
        containerEl.createEl("h4", { text: this.plugin.getLocale().viewTitle });
        this.contentEl = containerEl.createDiv({
            cls: "similar-notes-content"
        });

        this.loadingEl = containerEl.createDiv({
            cls: "similar-notes-loading",
            text: this.plugin.getLocale().searchingNotes
        });
        this.loadingEl.hide();
    }

    async onClose() {
        this.contentEl.empty();
    }

    showLoading() {
        this.loadingEl.show();
        this.contentEl.hide();
    }

    hideLoading() {
        this.loadingEl.hide();
        this.contentEl.show();
    }

    async updateView(similarities: Array<{document: string, similarity: number}>) {
        if (!this.contentEl) return;
        
        this.contentEl.empty();
        
        if (similarities.length === 0) {
            this.contentEl.createEl("div", {
                cls: "similar-notes-empty",
                text: this.plugin.getLocale().noSimilarNotes
            });
            return;
        }
        
        for (const item of similarities.slice(0, 20)) {
            const row = this.contentEl.createEl("div", { cls: "similar-note-row" });
            
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
}

export default class MyPlugin extends Plugin {
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
            }
        });

        const currentFile = this.app.workspace.getActiveFile();
        if (currentFile) {
            const content = await this.app.vault.read(currentFile);
            await this.activateView();
            await this.findNotes(content);
        }
    }

    async activateView() {
        try {
            const { workspace } = this.app;
            
            let leaf = workspace.getLeavesOfType(VIEW_TYPE_SIMILAR)[0];

            if (!leaf) {
                const rightSidebar = workspace.rightSplit;
                
                if (rightSidebar && rightSidebar.collapsed) {
                    rightSidebar.expand();
                }

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
            console.error("Ошибка при поиске похожих заметок:", error);
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
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
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
    }
}

