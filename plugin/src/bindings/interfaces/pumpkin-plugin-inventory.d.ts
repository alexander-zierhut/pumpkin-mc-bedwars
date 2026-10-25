/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-item-stack.d.ts" />
declare module 'pumpkin:plugin/inventory@0.1.0' {
  export type ItemStack = import('pumpkin:plugin/item-stack@0.1.0').ItemStack;
  export type Hand = import('pumpkin:plugin/common@0.1.0').Hand;
  
  export class Inventory implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Returns the number of slots in this inventory.
    */
    getSize(): number;
    /**
    * Returns true if all slots in this inventory are empty.
    */
    isEmpty(): boolean;
    /**
    * Returns the item in the specified slot index, or none if empty.
    */
    getItem(slot: number): ItemStack | undefined;
    /**
    * Sets the item in the specified slot index.
    */
    setItem(slot: number, item: ItemStack | undefined): void;
    /**
    * Removes and returns the item in the specified slot index.
    */
    removeItem(slot: number): ItemStack | undefined;
    /**
    * Clears all items from this inventory.
    */
    clear(): void;
    /**
    * Returns all items in this inventory as a list of slots.
    */
    getAllItems(): Array<ItemStack | undefined>;
    /**
    * Sets all items in this inventory from a list.
    */
    setAllItems(items: Array<ItemStack | undefined>): void;
    /**
    * Counts the total number of items with the given ID in this inventory.
    */
    countItem(itemId: string): number;
    /**
    * Checks if the inventory contains at least one item with the given ID.
    */
    containsItem(itemId: string): boolean;
    [Symbol.dispose](): void;
  }
  
  export class PlayerInventory implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Returns the generic 36-slot inventory handle (hotbar + main storage).
    */
    asInventory(): Inventory;
    /**
    * Returns the item currently held in the specified hand.
    */
    getItemInHand(hand: Hand): ItemStack | undefined;
    /**
    * Sets the item in the specified hand.
    */
    setItemInHand(hand: Hand, item: ItemStack | undefined): void;
    /**
    * Returns the currently selected hotbar slot index (0-8).
    */
    getSelectedSlot(): number;
    /**
    * Sets the currently selected hotbar slot index (0-8).
    */
    setSelectedSlot(slot: number): void;
    /**
    * Armor slot accessors
    */
    getHelmet(): ItemStack | undefined;
    setHelmet(item: ItemStack | undefined): void;
    getChestplate(): ItemStack | undefined;
    setChestplate(item: ItemStack | undefined): void;
    getLeggings(): ItemStack | undefined;
    setLeggings(item: ItemStack | undefined): void;
    getBoots(): ItemStack | undefined;
    setBoots(item: ItemStack | undefined): void;
    getOffHand(): ItemStack | undefined;
    setOffHand(item: ItemStack | undefined): void;
    /**
    * Clears all armor slots.
    */
    clearArmor(): void;
    /**
    * Clears the 36 main inventory slots.
    */
    clearMain(): void;
    /**
    * Clears all slots (main inventory, armor, offhand).
    */
    clearAll(): void;
    [Symbol.dispose](): void;
  }
}
