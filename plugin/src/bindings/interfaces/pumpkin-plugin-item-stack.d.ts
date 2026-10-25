/// <reference path="./pumpkin-plugin-attributes.d.ts" />
/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-data-components.d.ts" />
/// <reference path="./pumpkin-plugin-enchantments.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
declare module 'pumpkin:plugin/item-stack@0.1.0' {
  export type Attribute = import('pumpkin:plugin/attributes@0.1.0').Attribute;
  export type AttributeModifier = import('pumpkin:plugin/attributes@0.1.0').AttributeModifier;
  export type DataComponent = import('pumpkin:plugin/data-components@0.1.0').DataComponent;
  export type AttributeModifierSlot = import('pumpkin:plugin/enchantments@0.1.0').AttributeModifierSlot;
  export type Enchantment = import('pumpkin:plugin/enchantments@0.1.0').Enchantment;
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type NbtEntry = import('pumpkin:plugin/common@0.1.0').NbtEntry;
  export type NbtTree = import('pumpkin:plugin/common@0.1.0').NbtTree;
  export type NbtTag = import('pumpkin:plugin/common@0.1.0').NbtTag;
  /**
   * Represents an enchantment and its level.
   */
  export interface EnchantmentValue {
    enchantment: Enchantment,
    level: number,
  }
  /**
   * Represents a custom enchantment and its level on an item stack.
   */
  export interface CustomEnchantmentValue {
    enchantmentId: string,
    level: number,
  }
  /**
   * Represents an attribute modifier applied to an item stack for a specific slot.
   */
  export interface ItemAttributeModifier {
    attribute: Attribute,
    modifier: AttributeModifier,
    slot: AttributeModifierSlot,
  }
  /**
   * Represents a data component and its serialized value.
   */
  export interface DataComponentValue {
    component: DataComponent,
    /**
     * The serialized value of the component.
     */
    value: Uint8Array,
  }
  
  export class ItemStack implements Disposable {
    constructor(registryKey: string, count: number)
    /**
    * Returns the unique registry key of the item (e.g., "minecraft:diamond").
    */
    getRegistryKey(): string;
    /**
    * Returns the number of items in the stack.
    */
    getCount(): number;
    /**
    * Sets the number of items in the stack.
    */
    setCount(count: number): void;
    /**
    * Returns the maximum number of items that can be in this stack.
    */
    getMaxCount(): number;
    /**
    * Returns all enchantments on this item stack.
    */
    getEnchantments(): Array<EnchantmentValue>;
    /**
    * Adds an enchantment to this item stack.
    */
    addEnchantment(enchantment: Enchantment, level: number): void;
    /**
    * Removes an enchantment from this item stack.
    */
    removeEnchantment(enchantment: Enchantment): void;
    /**
    * Returns all custom enchantments on this item stack.
    */
    getCustomEnchantments(): Array<CustomEnchantmentValue>;
    /**
    * Adds a custom enchantment to this item stack.
    */
    addCustomEnchantment(enchantmentId: string, level: number): void;
    /**
    * Removes a custom enchantment from this item stack.
    */
    removeCustomEnchantment(enchantmentId: string): void;
    /**
    * Returns the level of a custom enchantment on this item stack, if present.
    */
    getCustomEnchantmentLevel(enchantmentId: string): number | undefined;
    /**
    * Returns whether this item stack has a specific custom enchantment.
    */
    hasCustomEnchantment(enchantmentId: string): boolean;
    /**
    * Returns all attribute modifiers on this item stack.
    */
    getAttributeModifiers(): Array<ItemAttributeModifier>;
    /**
    * Adds an attribute modifier to this item stack.
    */
    addAttributeModifier(modifier: ItemAttributeModifier): void;
    /**
    * Removes all attribute modifiers for a specific attribute from this item stack.
    */
    removeAttributeModifiers(attribute: Attribute): void;
    /**
    * Clears all custom attribute modifiers from this item stack.
    */
    clearAttributeModifiers(): void;
    /**
    * Returns the lore of this item stack.
    */
    getLore(): Array<TextComponent>;
    /**
    * Sets the lore of this item stack.
    */
    setLore(lore: Array<TextComponent>): void;
    /**
    * Adds a line to the lore of this item stack.
    */
    addLore(line: TextComponent): void;
    /**
    * Returns the custom name of this item stack, if set.
    */
    getCustomName(): TextComponent | undefined;
    /**
    * Sets the custom name of this item stack.
    */
    setCustomName(name: TextComponent | undefined): void;
    /**
    * Sets a namespaced custom data value on this item stack.
    */
    setCustomData(namespace: string, key: string, value: NbtTree): void;
    /**
    * Returns a namespaced custom data value from this item stack, if set.
    */
    getCustomData(namespace: string, key: string): NbtTree | undefined;
    /**
    * Removes a namespaced custom data value from this item stack.
    */
    removeCustomData(namespace: string, key: string): void;
    /**
    * Returns whether this item stack has a namespaced custom data value.
    */
    hasCustomData(namespace: string, key: string): boolean;
    /**
    * Returns all data components on this item stack.
    */
    getComponents(): Array<DataComponentValue>;
    /**
    * Sets a data component on this item stack.
    */
    setComponent(component: DataComponent, value: Uint8Array): void;
    /**
    * Removes a data component from this item stack.
    */
    removeComponent(component: DataComponent): void;
    [Symbol.dispose](): void;
  }
}
