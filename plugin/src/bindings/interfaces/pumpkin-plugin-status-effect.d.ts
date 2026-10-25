declare module 'pumpkin:plugin/status-effect@0.1.0' {
  /**
   * # Variants
   * 
   * ## `"speed"`
   * 
   * ## `"slowness"`
   * 
   * ## `"haste"`
   * 
   * ## `"mining-fatigue"`
   * 
   * ## `"strength"`
   * 
   * ## `"instant-health"`
   * 
   * ## `"instant-damage"`
   * 
   * ## `"jump-boost"`
   * 
   * ## `"nausea"`
   * 
   * ## `"regeneration"`
   * 
   * ## `"resistance"`
   * 
   * ## `"fire-resistance"`
   * 
   * ## `"water-breathing"`
   * 
   * ## `"invisibility"`
   * 
   * ## `"blindness"`
   * 
   * ## `"night-vision"`
   * 
   * ## `"hunger"`
   * 
   * ## `"weakness"`
   * 
   * ## `"poison"`
   * 
   * ## `"wither"`
   * 
   * ## `"health-boost"`
   * 
   * ## `"absorption"`
   * 
   * ## `"saturation"`
   * 
   * ## `"glowing"`
   * 
   * ## `"levitation"`
   * 
   * ## `"luck"`
   * 
   * ## `"unluck"`
   * 
   * ## `"slow-falling"`
   * 
   * ## `"conduit-power"`
   * 
   * ## `"dolphins-grace"`
   * 
   * ## `"bad-omen"`
   * 
   * ## `"hero-of-the-village"`
   * 
   * ## `"darkness"`
   * 
   * ## `"trial-omen"`
   * 
   * ## `"raid-omen"`
   * 
   * ## `"wind-charged"`
   * 
   * ## `"weaving"`
   * 
   * ## `"oozing"`
   * 
   * ## `"infested"`
   */
  export type StatusEffectType = 'speed' | 'slowness' | 'haste' | 'mining-fatigue' | 'strength' | 'instant-health' | 'instant-damage' | 'jump-boost' | 'nausea' | 'regeneration' | 'resistance' | 'fire-resistance' | 'water-breathing' | 'invisibility' | 'blindness' | 'night-vision' | 'hunger' | 'weakness' | 'poison' | 'wither' | 'health-boost' | 'absorption' | 'saturation' | 'glowing' | 'levitation' | 'luck' | 'unluck' | 'slow-falling' | 'conduit-power' | 'dolphins-grace' | 'bad-omen' | 'hero-of-the-village' | 'darkness' | 'trial-omen' | 'raid-omen' | 'wind-charged' | 'weaving' | 'oozing' | 'infested';
  export interface StatusEffectInstance {
    effectType: StatusEffectType,
    duration: number,
    amplifier: number,
    ambient: boolean,
    showParticles: boolean,
    showIcon: boolean,
  }
}
