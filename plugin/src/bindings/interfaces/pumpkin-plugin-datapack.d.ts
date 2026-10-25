declare module 'pumpkin:plugin/datapack@0.1.0' {
  /**
   * Information about a discovered or loaded datapack.
   */
  export interface DatapackInfo {
    id: string,
    name: string,
    description: string,
    packFormat: number,
    isEnabled: boolean,
    recipeCount: number,
    functionCount: number,
  }
  /**
   * Position options for enabling a datapack relative to other packs.
   */
  export type EnablePosition = EnablePositionFirst | EnablePositionLast | EnablePositionBefore | EnablePositionAfter;
  export interface EnablePositionFirst {
    tag: 'first',
  }
  export interface EnablePositionLast {
    tag: 'last',
  }
  export interface EnablePositionBefore {
    tag: 'before',
    val: string,
  }
  export interface EnablePositionAfter {
    tag: 'after',
    val: string,
  }
  
  export class DatapackManager implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Returns all known datapacks (both enabled and available/disabled).
    */
    listAllPacks(): Array<DatapackInfo>;
    /**
    * Returns only currently enabled datapacks.
    */
    listEnabledPacks(): Array<DatapackInfo>;
    /**
    * Returns available (disabled) datapacks.
    */
    listAvailablePacks(): Array<DatapackInfo>;
    /**
    * Retrieves details about a specific datapack by name or ID.
    */
    getPack(name: string): DatapackInfo | undefined;
    /**
    * Checks if a datapack is currently enabled.
    */
    isEnabled(name: string): boolean;
    /**
    * Enables a datapack with a specific priority position.
    */
    enablePack(name: string, position: EnablePosition): void;
    /**
    * Disables an enabled datapack.
    */
    disablePack(name: string): void;
    /**
    * Reloads all enabled datapacks, recipes, and function tags,
    * synchronizes recipes with online players, and triggers `#minecraft:load`.
    */
    reload(): void;
    /**
    * Executes a datapack function or function tag (e.g. "namespace:fn" or "#namespace:tag").
    * Returns the number of commands executed.
    */
    executeFunction(name: string): number;
    [Symbol.dispose](): void;
  }
}
