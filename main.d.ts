import { Plugin, WorkspaceLeaf, ItemView } from "obsidian";
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
interface PluginSettings {
    excludedFolders: string[];
    minNoteLength: number;
}
declare class SimilarNotesView extends ItemView {
    plugin: MyPlugin;
    contentEl: HTMLElement;
    container: HTMLDivElement;
    loadingEl: HTMLElement;
    constructor(leaf: WorkspaceLeaf, plugin: MyPlugin);
    getViewType(): string;
    getDisplayText(): string;
    onOpen(): Promise<void>;
    onClose(): Promise<void>;
    showLoading(): void;
    hideLoading(): void;
    updateView(similarities: Array<{
        document: string;
        similarity: number;
    }>): Promise<void>;
}
export default class MyPlugin extends Plugin {
    view: SimilarNotesView;
    settings: PluginSettings;
    getLocale(): Localization;
    onload(): Promise<void>;
    activateView(): Promise<WorkspaceLeaf>;
    getCurrentFileContent(): Promise<string>;
    findNotes(content: string): Promise<void>;
    onunload(): Promise<void>;
    loadSettings(): Promise<void>;
    saveSettings(): Promise<void>;
}
export {};
