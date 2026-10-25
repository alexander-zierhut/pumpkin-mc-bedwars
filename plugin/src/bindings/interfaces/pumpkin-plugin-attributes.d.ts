declare module 'pumpkin:plugin/attributes@0.1.0' {
  /**
   * # Variants
   * 
   * ## `"air-drag-modifier"`
   * 
   * ## `"armor"`
   * 
   * ## `"armor-toughness"`
   * 
   * ## `"attack-damage"`
   * 
   * ## `"attack-knockback"`
   * 
   * ## `"attack-speed"`
   * 
   * ## `"below-name-distance"`
   * 
   * ## `"block-break-speed"`
   * 
   * ## `"block-interaction-range"`
   * 
   * ## `"bounciness"`
   * 
   * ## `"burning-time"`
   * 
   * ## `"camera-distance"`
   * 
   * ## `"explosion-knockback-resistance"`
   * 
   * ## `"entity-interaction-range"`
   * 
   * ## `"fall-damage-multiplier"`
   * 
   * ## `"flying-speed"`
   * 
   * ## `"follow-range"`
   * 
   * ## `"friction-modifier"`
   * 
   * ## `"gravity"`
   * 
   * ## `"jump-strength"`
   * 
   * ## `"knockback-resistance"`
   * 
   * ## `"luck"`
   * 
   * ## `"max-absorption"`
   * 
   * ## `"max-health"`
   * 
   * ## `"mining-efficiency"`
   * 
   * ## `"movement-efficiency"`
   * 
   * ## `"movement-speed"`
   * 
   * ## `"name-tag-distance"`
   * 
   * ## `"oxygen-bonus"`
   * 
   * ## `"safe-fall-distance"`
   * 
   * ## `"scale"`
   * 
   * ## `"sneaking-speed"`
   * 
   * ## `"spawn-reinforcements"`
   * 
   * ## `"step-height"`
   * 
   * ## `"submerged-mining-speed"`
   * 
   * ## `"sweeping-damage-ratio"`
   * 
   * ## `"tempt-range"`
   * 
   * ## `"water-movement-efficiency"`
   * 
   * ## `"waypoint-transmit-range"`
   * 
   * ## `"waypoint-receive-range"`
   */
  export type Attribute = 'air-drag-modifier' | 'armor' | 'armor-toughness' | 'attack-damage' | 'attack-knockback' | 'attack-speed' | 'below-name-distance' | 'block-break-speed' | 'block-interaction-range' | 'bounciness' | 'burning-time' | 'camera-distance' | 'explosion-knockback-resistance' | 'entity-interaction-range' | 'fall-damage-multiplier' | 'flying-speed' | 'follow-range' | 'friction-modifier' | 'gravity' | 'jump-strength' | 'knockback-resistance' | 'luck' | 'max-absorption' | 'max-health' | 'mining-efficiency' | 'movement-efficiency' | 'movement-speed' | 'name-tag-distance' | 'oxygen-bonus' | 'safe-fall-distance' | 'scale' | 'sneaking-speed' | 'spawn-reinforcements' | 'step-height' | 'submerged-mining-speed' | 'sweeping-damage-ratio' | 'tempt-range' | 'water-movement-efficiency' | 'waypoint-transmit-range' | 'waypoint-receive-range';
  /**
   * # Variants
   * 
   * ## `"add"`
   * 
   * ## `"multiply-base"`
   * 
   * ## `"multiply-total"`
   */
  export type ModifierOperation = 'add' | 'multiply-base' | 'multiply-total';
  export interface AttributeModifier {
    id: string,
    amount: number,
    operation: ModifierOperation,
  }
}
