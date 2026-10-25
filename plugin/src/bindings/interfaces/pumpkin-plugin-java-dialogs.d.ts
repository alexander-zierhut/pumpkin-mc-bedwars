/// <reference path="./pumpkin-plugin-item-stack.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
declare module 'pumpkin:plugin/java-dialogs@0.1.0' {
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type ItemStack = import('pumpkin:plugin/item-stack@0.1.0').ItemStack;
  /**
   * Represents the layout and button configuration of a dialog.
   * # Variants
   * 
   * ## `"notice"`
   * 
   * A simple dialog with a single "OK" button.
   * ## `"confirmation"`
   * 
   * A dialog with "Yes" and "No" buttons.
   * ## `"multi-action"`
   * 
   * A scrollable list of custom buttons.
   * ## `"dialog-list"`
   * 
   * A list of buttons that open other registered dialogs.
   * ## `"server-links"`
   * 
   * A dedicated menu for displaying server-related links.
   */
  export type DialogType = 'notice' | 'confirmation' | 'multi-action' | 'dialog-list' | 'server-links';
  /**
   * Represents an element in the main content area of a dialog.
   */
  export type DialogBody = DialogBodyPlainMessage | DialogBodyItem;
  /**
   * A simple text message.
   */
  export interface DialogBodyPlainMessage {
    tag: 'plain-message',
    val: TextComponent,
  }
  /**
   * A visual item display.
   */
  export interface DialogBodyItem {
    tag: 'item',
    val: ItemStack,
  }
  /**
   * A checkbox input control.
   */
  export interface DialogInputBool {
    label: TextComponent,
    defaultValue: boolean,
  }
  /**
   * A text field input control.
   */
  export interface DialogInputText {
    label: TextComponent,
    placeholder: TextComponent,
    defaultValue: string,
  }
  /**
   * A numerical range slider input control.
   */
  export interface DialogInputNumberRange {
    label: TextComponent,
    minValue: number,
    maxValue: number,
    initialValue: number,
    step: number,
    labelFormat?: string,
  }
  /**
   * A multiple-choice selection input control.
   */
  export interface DialogInputSingleOption {
    label: TextComponent,
    options: Array<TextComponent>,
    initialIndex: number,
  }
  /**
   * Represents an interactive input control in a dialog.
   */
  export type DialogInput = DialogInputBool | DialogInputText | DialogInputNumberRange | DialogInputSingleOption;
  /**
   * A checkbox for true/false states.
   */
  export interface DialogInputBool {
    tag: 'bool',
    val: DialogInputBool,
  }
  /**
   * A simple string input field.
   */
  export interface DialogInputText {
    tag: 'text',
    val: DialogInputText,
  }
  /**
   * A slider for numerical input within a range.
   */
  export interface DialogInputNumberRange {
    tag: 'number-range',
    val: DialogInputNumberRange,
  }
  /**
   * A multiple-choice selection button.
   */
  export interface DialogInputSingleOption {
    tag: 'single-option',
    val: DialogInputSingleOption,
  }
  /**
   * Defines what happens after a dialog is closed.
   * # Variants
   * 
   * ## `"peek"`
   * 
   * Returns the player to the previous screen (e.g., keeping an inventory open).
   * ## `"pop"`
   * 
   * Closes all open screens.
   */
  export type AfterAction = 'peek' | 'pop';
  /**
   * Represents a custom server-side action.
   */
  export interface CustomClickAction {
    /**
     * A unique identifier for the action (sent back to the server).
     */
    id: string,
    /**
     * Optional binary data to send with the action.
     */
    payload?: Uint8Array,
  }
  /**
   * Represents an action triggered by a button click.
   */
  export type Action = ActionOpenUrl | ActionCustomClick;
  /**
   * Opens an external URL.
   */
  export interface ActionOpenUrl {
    tag: 'open-url',
    val: string,
  }
  /**
   * Triggers a custom server-side callback with an ID and optional payload.
   */
  export interface ActionCustomClick {
    tag: 'custom-click',
    val: CustomClickAction,
  }
  /**
   * Represents a clickable button in a dialog.
   */
  export interface ActionButton {
    text: TextComponent,
    tooltip?: TextComponent,
    width?: number,
    action: Action,
  }
  /**
   * Built-in link types recognized by the Java Edition client.
   * # Variants
   * 
   * ## `"bug-report"`
   * 
   * ## `"community-guidelines"`
   * 
   * ## `"support"`
   * 
   * ## `"status"`
   * 
   * ## `"feedback"`
   * 
   * ## `"community"`
   * 
   * ## `"website"`
   * 
   * ## `"forums"`
   * 
   * ## `"news"`
   * 
   * ## `"announcements"`
   */
  export type LinkType = 'bug-report' | 'community-guidelines' | 'support' | 'status' | 'feedback' | 'community' | 'website' | 'forums' | 'news' | 'announcements';
  /**
   * The label for a link, which can be a built-in type or custom text.
   */
  export type LinkLabel = LinkLabelBuiltIn | LinkLabelCustom;
  /**
   * A built-in link type with a predefined icon/label.
   */
  export interface LinkLabelBuiltIn {
    tag: 'built-in',
    val: LinkType,
  }
  /**
   * A custom text component label.
   */
  export interface LinkLabelCustom {
    tag: 'custom',
    val: TextComponent,
  }
  /**
   * Represents a link displayed in a Java Edition dialog.
   */
  export interface Link {
    /**
     * The label to display for the link.
     */
    label: LinkLabel,
    /**
     * The URL the link points to.
     */
    url: string,
  }
  /**
   * Represents a dialog shown to a Java Edition player.
   */
  export interface Dialog {
    /**
     * The main title of the dialog.
     */
    title: TextComponent,
    /**
     * The layout type of the dialog.
     */
    type: DialogType,
    /**
     * A list of body elements to display in the main area.
     */
    body: Array<DialogBody>,
    /**
     * A list of interactive input controls.
     */
    inputs: Array<DialogInput>,
    /**
     * A list of clickable buttons (for multi-action and other types).
     */
    buttons: Array<ActionButton>,
    /**
     * A list of links (primarily for server-links type).
     */
    links: Array<Link>,
    /**
     * What to do after the dialog is closed.
     */
    afterAction?: AfterAction,
    /**
     * Whether the player can exit the dialog using the Esc key.
     */
    canCloseWithEscape: boolean,
    /**
     * The text shown on buttons that link to/open this dialog.
     */
    externalTitle?: TextComponent,
  }
}
