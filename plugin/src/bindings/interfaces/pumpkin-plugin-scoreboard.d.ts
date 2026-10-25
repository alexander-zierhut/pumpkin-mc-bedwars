/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
declare module 'pumpkin:plugin/scoreboard@0.1.0' {
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type NamedColor = import('pumpkin:plugin/common@0.1.0').NamedColor;
  /**
   * # Variants
   * 
   * ## `"integer"`
   * 
   * ## `"hearts"`
   */
  export type RenderType = 'integer' | 'hearts';
  export type NumberFormat = NumberFormatBlank | NumberFormatFixed;
  export interface NumberFormatBlank {
    tag: 'blank',
  }
  export interface NumberFormatFixed {
    tag: 'fixed',
    val: TextComponent,
  }
  /**
   * # Variants
   * 
   * ## `"player-list"`
   * 
   * ## `"sidebar"`
   * 
   * ## `"below-name"`
   * 
   * ## `"sidebar-team-black"`
   * 
   * ## `"sidebar-team-dark-blue"`
   * 
   * ## `"sidebar-team-dark-green"`
   * 
   * ## `"sidebar-team-dark-aqua"`
   * 
   * ## `"sidebar-team-dark-red"`
   * 
   * ## `"sidebar-team-dark-purple"`
   * 
   * ## `"sidebar-team-gold"`
   * 
   * ## `"sidebar-team-gray"`
   * 
   * ## `"sidebar-team-dark-gray"`
   * 
   * ## `"sidebar-team-blue"`
   * 
   * ## `"sidebar-team-green"`
   * 
   * ## `"sidebar-team-aqua"`
   * 
   * ## `"sidebar-team-red"`
   * 
   * ## `"sidebar-team-light-purple"`
   * 
   * ## `"sidebar-team-yellow"`
   * 
   * ## `"sidebar-team-white"`
   */
  export type DisplaySlot = 'player-list' | 'sidebar' | 'below-name' | 'sidebar-team-black' | 'sidebar-team-dark-blue' | 'sidebar-team-dark-green' | 'sidebar-team-dark-aqua' | 'sidebar-team-dark-red' | 'sidebar-team-dark-purple' | 'sidebar-team-gold' | 'sidebar-team-gray' | 'sidebar-team-dark-gray' | 'sidebar-team-blue' | 'sidebar-team-green' | 'sidebar-team-aqua' | 'sidebar-team-red' | 'sidebar-team-light-purple' | 'sidebar-team-yellow' | 'sidebar-team-white';
  /**
   * # Variants
   * 
   * ## `"always"`
   * 
   * ## `"never"`
   * 
   * ## `"hide-for-other-teams"`
   * 
   * ## `"hide-for-own-team"`
   */
  export type NametagVisibility = 'always' | 'never' | 'hide-for-other-teams' | 'hide-for-own-team';
  /**
   * # Variants
   * 
   * ## `"always"`
   * 
   * ## `"never"`
   * 
   * ## `"push-other-teams"`
   * 
   * ## `"push-own-team"`
   */
  export type CollisionRule = 'always' | 'never' | 'push-other-teams' | 'push-own-team';
  export interface TeamSettings {
    displayName: TextComponent,
    friendlyFire: boolean,
    seeFriendlyInvisibles: boolean,
    nametagVisibility: NametagVisibility,
    collisionRule: CollisionRule,
    color: NamedColor,
    prefix: TextComponent,
    suffix: TextComponent,
  }
  /**
   * # Variants
   * 
   * ## `"ascending"`
   * 
   * ## `"descending"`
   */
  export type BedrockSortOrder = 'ascending' | 'descending';
  /**
   * # Variants
   * 
   * ## `"player-list"`
   * 
   * ## `"sidebar"`
   * 
   * ## `"below-name"`
   */
  export type BedrockDisplaySlot = 'player-list' | 'sidebar' | 'below-name';
  
  export class BedrockScoreboard implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    addObjective(name: string, displayName: string, sortOrder: BedrockSortOrder): void;
    updateObjective(name: string, displayName: string, sortOrder: BedrockSortOrder): void;
    removeObjective(name: string): void;
    setDisplaySlot(slot: BedrockDisplaySlot, objectiveName: string): void;
    clearDisplaySlot(slot: BedrockDisplaySlot): void;
    updateScore(entityName: string, objectiveName: string, value: number): void;
    addScore(entityName: string, objectiveName: string, delta: number): number;
    removeScore(entityName: string, objectiveName: string): void;
    resetEntityScores(entityName: string): void;
    [Symbol.dispose](): void;
  }
  
  export class Scoreboard implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    addObjective(name: string, displayName: TextComponent, renderType: RenderType, numberFormat: NumberFormat | undefined): void;
    updateObjective(name: string, displayName: TextComponent, renderType: RenderType, numberFormat: NumberFormat | undefined): void;
    removeObjective(name: string): void;
    setDisplaySlot(slot: DisplaySlot, objectiveName: string): void;
    clearDisplaySlot(slot: DisplaySlot): void;
    updateScore(entityName: string, objectiveName: string, value: number, numberFormat: NumberFormat | undefined): void;
    addScore(entityName: string, objectiveName: string, delta: number): number;
    removeScore(entityName: string, objectiveName: string): void;
    resetEntityScores(entityName: string): void;
    createTeam(name: string, settings: TeamSettings): void;
    removeTeam(name: string): void;
    updateTeam(name: string, settings: TeamSettings): void;
    addPlayerToTeam(teamName: string, playerName: string): void;
    removePlayerFromTeam(teamName: string, playerName: string): void;
    clearTeamPlayers(teamName: string): void;
    getTeams(): Array<string>;
    getTeam(name: string): TeamSettings | undefined;
    getTeamPlayers(teamName: string): Array<string>;
    getPlayerTeam(playerName: string): string | undefined;
    [Symbol.dispose](): void;
  }
}
