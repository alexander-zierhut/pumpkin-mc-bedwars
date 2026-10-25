/// <reference path="./pumpkin-plugin-player.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
declare module 'pumpkin:plugin/boss-bar@0.1.0' {
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type Player = import('pumpkin:plugin/player@0.1.0').Player;
  /**
   * Represents the color of a boss bar.
   * # Variants
   * 
   * ## `"pink"`
   * 
   * ## `"blue"`
   * 
   * ## `"red"`
   * 
   * ## `"green"`
   * 
   * ## `"yellow"`
   * 
   * ## `"purple"`
   * 
   * ## `"white"`
   */
  export type BossBarColor = 'pink' | 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'white';
  /**
   * Represents the notches/divisions of a boss bar.
   * # Variants
   * 
   * ## `"no-division"`
   * 
   * ## `"notches-6"`
   * 
   * ## `"notches-10"`
   * 
   * ## `"notches-12"`
   * 
   * ## `"notches-20"`
   */
  export type BossBarDivision = 'no-division' | 'notches-6' | 'notches-10' | 'notches-12' | 'notches-20';
  /**
   * Metadata flags that can be toggled on a boss bar.
   */
  export interface BossBarMetadata {
    /**
     * Darkens the sky for players who see the boss bar.
     */
    darkenSky: boolean,
    /**
     * If true, the bar is considered a "dragon bar" (used for Ender Dragon).
     */
    dragonBar: boolean,
    /**
     * If true, fog is created around the players who see the boss bar.
     */
    createFog: boolean,
  }
  
  export class BossBar implements Disposable {
    /**
    * Creates a new boss bar.
    */
    constructor(title: TextComponent, color: BossBarColor, division: BossBarDivision)
    /**
    * Returns the title of this boss bar.
    */
    getTitle(): TextComponent;
    /**
    * Sets the title of this boss bar.
    */
    setTitle(title: TextComponent): void;
    /**
    * Returns the health (0.0 to 1.0) of this boss bar.
    */
    getHealth(): number;
    /**
    * Sets the health (0.0 to 1.0) of this boss bar.
    */
    setHealth(health: number): void;
    /**
    * Returns the color of this boss bar.
    */
    getColor(): BossBarColor;
    /**
    * Sets the color of this boss bar.
    */
    setColor(color: BossBarColor): void;
    /**
    * Returns the division of this boss bar.
    */
    getDivision(): BossBarDivision;
    /**
    * Sets the division of this boss bar.
    */
    setDivision(division: BossBarDivision): void;
    /**
    * Returns the currently active metadata on this boss bar.
    */
    getMetadata(): BossBarMetadata;
    /**
    * Updates the metadata on this boss bar.
    */
    setMetadata(metadata: BossBarMetadata): void;
    /**
    * Adds a player to this boss bar, making it visible to them.
    */
    addPlayer(player: Player): void;
    /**
    * Removes a player from this boss bar, hiding it from them.
    */
    removePlayer(player: Player): void;
    /**
    * Returns a list of all players currently seeing this boss bar.
    */
    getPlayers(): Array<Player>;
    /**
    * Removes this boss bar from all players and cleans it up.
    */
    removeAll(): void;
    [Symbol.dispose](): void;
  }
}
