/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-inventory.d.ts" />
/// <reference path="./pumpkin-plugin-item-stack.d.ts" />
/// <reference path="./pumpkin-plugin-screens.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
declare module 'pumpkin:plugin/gui@0.1.0' {
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type ClickType = import('pumpkin:plugin/common@0.1.0').ClickType;
  export type ItemStack = import('pumpkin:plugin/item-stack@0.1.0').ItemStack;
  export type Screen = import('pumpkin:plugin/screens@0.1.0').Screen;
  export type Inventory = import('pumpkin:plugin/inventory@0.1.0').Inventory;
  
  export class Gui implements Disposable {
    constructor(type: Screen, title: TextComponent)
    /**
    * Returns the underlying inventory handle for this GUI.
    */
    getInventory(): Inventory;
    setItem(slot: number, item: ItemStack): void;
    getItem(slot: number): ItemStack | undefined;
    /**
    * Returns the type of this GUI.
    */
    getType(): Screen;
    /**
    * Returns the title of this GUI.
    */
    getTitle(): TextComponent;
    /**
    * Returns the number of slots in this GUI.
    */
    getSize(): number;
    /**
    * Returns a new handle to a GUI showing the same inventory (same title and settings).
    * `open-gui` consumes its handle, so a shared GUI (e.g. a team chest) is opened via shares.
    */
    share(): Gui;
    /**
    * Clears all items from the GUI.
    */
    clearItems(): void;
    /**
    * Sets whether players can grab items out of the inventory.
    */
    setAllowGrabItems(allow: boolean): void;
    /**
    * Returns whether players can grab items out of the inventory.
    */
    getAllowGrabItems(): boolean;
    /**
    * Sets whether players can put items into the inventory from their own.
    */
    setAllowPutItems(allow: boolean): void;
    /**
    * Returns whether players can put items into the inventory from their own.
    */
    getAllowPutItems(): boolean;
    [Symbol.dispose](): void;
  }
}
