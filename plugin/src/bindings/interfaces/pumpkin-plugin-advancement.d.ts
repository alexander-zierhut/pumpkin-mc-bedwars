/// <reference path="./pumpkin-plugin-text.d.ts" />
declare module 'pumpkin:plugin/advancement@0.1.0' {
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  /**
   * Frame type for an advancement.
   * # Variants
   * 
   * ## `"task"`
   * 
   * ## `"challenge"`
   * 
   * ## `"goal"`
   */
  export type FrameType = 'task' | 'challenge' | 'goal';
  /**
   * Display information for an advancement.
   */
  export interface AdvancementDisplay {
    title: TextComponent,
    description: TextComponent,
    frame: FrameType,
    showToast: boolean,
    hidden: boolean,
    announceToChat: boolean,
    background?: string,
    x: number,
    y: number,
  }
  /**
   * Detailed information about an advancement.
   */
  export interface AdvancementInfo {
    id: string,
    parentId?: string,
    criteria: Array<string>,
    display?: AdvancementDisplay,
  }
  /**
   * Represents progress of an advancement for a player.
   */
  export interface AdvancementProgress {
    advancementId: string,
    done: boolean,
    awardedCriteria: Array<string>,
    remainingCriteria: Array<string>,
  }
}
