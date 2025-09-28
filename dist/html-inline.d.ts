interface InlineOptions {
    ignoreScripts?: boolean;
    ignoreImages?: boolean;
    ignoreLinks?: boolean;
    ignoreStyles?: boolean;
}
export declare function inlineHtml(filePath: string, options?: InlineOptions): Promise<string>;
export {};
