declare module '@toast-ui/editor' {
    export class Editor {
        constructor(options: any);
        getMarkdown(): string;
        setMarkdown(markdown: string, cursor?: boolean): void;
        insertText(text: string): void;
        changeMode(mode: string): void;
        off(eventName: string): void;
        remove(): void;
        static factory(options: any): Editor;
    }
    export default Editor;
    export interface EditorOptions {
        el: HTMLElement;
        initialValue?: string;
        previewStyle?: string;
        height?: string;
        initialEditType?: string;
        useCommandShortcut?: boolean;
        usageStatistics?: boolean;
        toolbarItems?: any[][];
        plugins?: any[];
        events?: { [key: string]: Function };
    }
}

declare module '@toast-ui/editor-plugin-color-syntax';
declare module '@toast-ui/editor-plugin-table-merged-cell';
declare module '@toast-ui/editor-plugin-code-syntax-highlight';
declare module '@toast-ui/editor-plugin-chart';
declare module '@toast-ui/editor-plugin-uml';
