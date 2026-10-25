/// <reference path="./pumpkin-plugin-text.d.ts" />
declare module 'pumpkin:plugin/enchantments@0.1.0' {
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  /**
   * Equipment slot where an enchantment is active.
   * # Variants
   * 
   * ## `"any"`
   * 
   * ## `"main-hand"`
   * 
   * ## `"off-hand"`
   * 
   * ## `"hand"`
   * 
   * ## `"feet"`
   * 
   * ## `"legs"`
   * 
   * ## `"chest"`
   * 
   * ## `"head"`
   * 
   * ## `"armor"`
   * 
   * ## `"body"`
   * 
   * ## `"saddle"`
   */
  export type AttributeModifierSlot = 'any' | 'main-hand' | 'off-hand' | 'hand' | 'feet' | 'legs' | 'chest' | 'head' | 'armor' | 'body' | 'saddle';
  /**
   * Vanilla enchantments enum.
   * # Variants
   * 
   * ## `"aqua-affinity"`
   * 
   * ## `"bane-of-arthropods"`
   * 
   * ## `"binding-curse"`
   * 
   * ## `"blast-protection"`
   * 
   * ## `"breach"`
   * 
   * ## `"channeling"`
   * 
   * ## `"density"`
   * 
   * ## `"depth-strider"`
   * 
   * ## `"efficiency"`
   * 
   * ## `"feather-falling"`
   * 
   * ## `"fire-aspect"`
   * 
   * ## `"fire-protection"`
   * 
   * ## `"flame"`
   * 
   * ## `"fortune"`
   * 
   * ## `"frost-walker"`
   * 
   * ## `"impaling"`
   * 
   * ## `"infinity"`
   * 
   * ## `"knockback"`
   * 
   * ## `"looting"`
   * 
   * ## `"loyalty"`
   * 
   * ## `"luck-of-the-sea"`
   * 
   * ## `"lunge"`
   * 
   * ## `"lure"`
   * 
   * ## `"mending"`
   * 
   * ## `"multishot"`
   * 
   * ## `"piercing"`
   * 
   * ## `"power"`
   * 
   * ## `"projectile-protection"`
   * 
   * ## `"protection"`
   * 
   * ## `"punch"`
   * 
   * ## `"quick-charge"`
   * 
   * ## `"respiration"`
   * 
   * ## `"riptide"`
   * 
   * ## `"sharpness"`
   * 
   * ## `"silk-touch"`
   * 
   * ## `"smite"`
   * 
   * ## `"soul-speed"`
   * 
   * ## `"sweeping-edge"`
   * 
   * ## `"swift-sneak"`
   * 
   * ## `"thorns"`
   * 
   * ## `"unbreaking"`
   * 
   * ## `"vanishing-curse"`
   * 
   * ## `"wind-burst"`
   */
  export type Enchantment = 'aqua-affinity' | 'bane-of-arthropods' | 'binding-curse' | 'blast-protection' | 'breach' | 'channeling' | 'density' | 'depth-strider' | 'efficiency' | 'feather-falling' | 'fire-aspect' | 'fire-protection' | 'flame' | 'fortune' | 'frost-walker' | 'impaling' | 'infinity' | 'knockback' | 'looting' | 'loyalty' | 'luck-of-the-sea' | 'lunge' | 'lure' | 'mending' | 'multishot' | 'piercing' | 'power' | 'projectile-protection' | 'protection' | 'punch' | 'quick-charge' | 'respiration' | 'riptide' | 'sharpness' | 'silk-touch' | 'smite' | 'soul-speed' | 'sweeping-edge' | 'swift-sneak' | 'thorns' | 'unbreaking' | 'vanishing-curse' | 'wind-burst';
  /**
   * Represents a custom enchantment definition.
   */
  export interface CustomEnchantment {
    /**
     * Unique identifier for the enchantment (e.g. "my_plugin:lifesteal").
     */
    id: string,
    /**
     * Description or display name of the enchantment.
     */
    description: TextComponent,
    /**
     * Maximum level of the enchantment (e.g. 1..=10).
     */
    maxLevel: number,
    /**
     * Base anvil repair/combination cost multiplier.
     */
    anvilCost: number,
    /**
     * Tag or item pattern for supported items (e.g. "#minecraft:enchantable/weapon").
     */
    supportedItems: string,
    /**
     * Weight / rarity of the enchantment (higher = more common, default 5).
     */
    weight: number,
    /**
     * Equipment slots where this enchantment is active.
     */
    slots: Array<AttributeModifierSlot>,
    /**
     * List of exclusive/conflicting enchantment IDs.
     */
    exclusiveSet: Array<string>,
  }
  
  export class EnchantmentManager implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Registers a new custom enchantment with the server.
    */
    registerEnchantment(enchantment: CustomEnchantment): void;
    /**
    * Gets an enchantment definition by its ID.
    */
    getEnchantment(id: string): CustomEnchantment | undefined;
    /**
    * Checks if an enchantment ID is registered.
    */
    hasEnchantment(id: string): boolean;
    /**
    * Returns all registered custom enchantment IDs.
    */
    getAllEnchantmentIds(): Array<string>;
    [Symbol.dispose](): void;
  }
}
