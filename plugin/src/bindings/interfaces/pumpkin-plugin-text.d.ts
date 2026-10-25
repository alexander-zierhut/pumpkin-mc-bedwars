/// <reference path="./pumpkin-plugin-common.d.ts" />
declare module 'pumpkin:plugin/text@0.1.0' {
  export type NamedColor = import('pumpkin:plugin/common@0.1.0').NamedColor;
  export type RgbColor = import('pumpkin:plugin/common@0.1.0').RgbColor;
  export type ArgbColor = import('pumpkin:plugin/common@0.1.0').ArgbColor;
  
  export class TextComponent implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Creates a plain text component.
    */
    static text(plain: string): TextComponent;
    /**
    * Creates a translation component.
    */
    static translate(key: string, with_: Array<TextComponent>): TextComponent;
    /**
    * Creates a translation component with a Bedrock-specific fallback key.
    */
    static translateCross(javaKey: string, bedrockKey: string, with_: Array<TextComponent>): TextComponent;
    /**
    * Creates an entity names / selector text component.
    */
    static entityNames(selector: string, separator: string | undefined): TextComponent;
    /**
    * Creates a keybind text component (e.g., "key.jump").
    */
    static keybind(keybind: string): TextComponent;
    /**
    * Creates a custom translation component.
    */
    static custom(namespace: string, key: string, locale: string, with_: Array<TextComponent>): TextComponent;
    /**
    * Parses a legacy Minecraft formatted string (using section signs '§' by default) into a text component.
    */
    static fromLegacyString(input: string): TextComponent;
    /**
    * Parses a legacy formatted string using a custom color code symbol (e.g. '&' or '§').
    */
    static fromLegacyStringWithCode(input: string, codeSymbol: string): TextComponent;
    /**
    * Parses a standard Minecraft JSON text component.
    */
    static fromJson(json: string): TextComponent;
    /**
    * Serializes the text component to JSON format.
    */
    toJson(): string;
    addChild(child: TextComponent): void;
    addText(text: string): void;
    getText(): string;
    encode(): Uint8Array;
    toPrettyConsole(): string;
    /**
    * Style
    */
    colorNamed(color: NamedColor): void;
    colorRgb(color: RgbColor): void;
    gradientNamed(colors: Array<NamedColor>): void;
    gradient(colors: Array<RgbColor>): void;
    rainbow(): void;
    bold(value: boolean): void;
    italic(value: boolean): void;
    underlined(value: boolean): void;
    strikethrough(value: boolean): void;
    obfuscated(value: boolean): void;
    /**
    * Text inserted into chat when shift-clicked
    */
    insertion(text: string): void;
    font(font: string): void;
    shadowColor(color: ArgbColor): void;
    /**
    * Click events
    */
    clickOpenUrl(url: string): void;
    clickOpenFile(path: string): void;
    clickRunCommand(command: string): void;
    clickSuggestCommand(command: string): void;
    clickChangePage(page: number): void;
    clickCopyToClipboard(text: string): void;
    /**
    * Hover events
    */
    hoverShowText(text: TextComponent): void;
    /**
    * Item data as SNBT string
    */
    hoverShowItem(item: string): void;
    hoverShowEntity(entityType: string, id: string, name: TextComponent | undefined): void;
    [Symbol.dispose](): void;
  }
}
