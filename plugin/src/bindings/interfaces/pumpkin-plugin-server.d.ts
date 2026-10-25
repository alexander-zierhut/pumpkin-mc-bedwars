/// <reference path="./pumpkin-plugin-advancement.d.ts" />
/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-datapack.d.ts" />
/// <reference path="./pumpkin-plugin-enchantments.d.ts" />
/// <reference path="./pumpkin-plugin-permission.d.ts" />
/// <reference path="./pumpkin-plugin-player.d.ts" />
/// <reference path="./pumpkin-plugin-recipe.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
/// <reference path="./pumpkin-plugin-uuid.d.ts" />
/// <reference path="./pumpkin-plugin-world.d.ts" />
declare module 'pumpkin:plugin/server@0.1.0' {
  export type Player = import('pumpkin:plugin/player@0.1.0').Player;
  export type BanPlayerOptions = import('pumpkin:plugin/player@0.1.0').BanPlayerOptions;
  export type BanIpOptions = import('pumpkin:plugin/player@0.1.0').BanIpOptions;
  export type ServerLink = import('pumpkin:plugin/player@0.1.0').ServerLink;
  export type KnownServerLink = import('pumpkin:plugin/player@0.1.0').KnownServerLink;
  export type ServerLinkLabel = import('pumpkin:plugin/player@0.1.0').ServerLinkLabel;
  export type GameMode = import('pumpkin:plugin/common@0.1.0').GameMode;
  export type World = import('pumpkin:plugin/world@0.1.0').World;
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type Uuid = import('pumpkin:plugin/uuid@0.1.0').Uuid;
  export type RecipeManager = import('pumpkin:plugin/recipe@0.1.0').RecipeManager;
  export type EnchantmentManager = import('pumpkin:plugin/enchantments@0.1.0').EnchantmentManager;
  export type CustomEnchantment = import('pumpkin:plugin/enchantments@0.1.0').CustomEnchantment;
  export type PermissionLevel = import('pumpkin:plugin/permission@0.1.0').PermissionLevel;
  export type AdvancementInfo = import('pumpkin:plugin/advancement@0.1.0').AdvancementInfo;
  export type DatapackManager = import('pumpkin:plugin/datapack@0.1.0').DatapackManager;
  export type DatapackInfo = import('pumpkin:plugin/datapack@0.1.0').DatapackInfo;
  /**
   * Represents an operator entry in the ops configuration.
   */
  export interface OpEntry {
    uuid: Uuid,
    name: string,
    level: PermissionLevel,
    bypassesPlayerLimit: boolean,
  }
  /**
   * Represents a banned player entry in the ban list.
   */
  export interface BannedPlayerEntry {
    uuid: Uuid,
    name: string,
    created: string,
    source: string,
    expires?: string,
    reason: string,
  }
  /**
   * Represents a banned IP entry in the IP ban list.
   */
  export interface BannedIpEntry {
    ip: string,
    created: string,
    source: string,
    expires?: string,
    reason: string,
  }
  /**
   * Represents a player entry in the server whitelist.
   */
  export interface WhitelistEntry {
    uuid: Uuid,
    name: string,
  }
  /**
   * Represents the difficulty setting of a Minecraft server.
   * # Variants
   * 
   * ## `"peaceful"`
   * 
   * Hostile mobs do not spawn. Players regain health automatically.
   * ## `"easy"`
   * 
   * Hostile mobs deal less damage.
   * ## `"normal"`
   * 
   * Standard Minecraft difficulty.
   * ## `"hard"`
   * 
   * Hostile mobs deal more damage.
   */
  export type Difficulty = 'peaceful' | 'easy' | 'normal' | 'hard';
  /**
   * Represents the three main Minecraft dimensions.
   * # Variants
   * 
   * ## `"overworld"`
   * 
   * ## `"nether"`
   * 
   * ## `"end"`
   */
  export type Dimension = 'overworld' | 'nether' | 'end';
  export interface SysInfo {
    cpuCount?: number,
    totalMemory?: bigint,
    usedMemory?: bigint,
    osName?: string,
    osVersion?: string,
    pumpkinVersion: string,
  }
  export type CommandSender = CommandSenderConsole | CommandSenderPlayer;
  export interface CommandSenderConsole {
    tag: 'console',
  }
  export interface CommandSenderPlayer {
    tag: 'player',
    val: Player,
  }
  
  export class BanManager implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Checks if a player UUID is currently banned.
    */
    isPlayerBanned(id: Uuid): boolean;
    /**
    * Retrieves the ban entry for a player UUID, if banned.
    */
    getPlayerBan(id: Uuid): BannedPlayerEntry | undefined;
    /**
    * Bans a player by name and UUID with the specified options (works for online and offline players).
    */
    banPlayer(name: string, id: Uuid, options: BanPlayerOptions): void;
    /**
    * Removes a player ban by UUID. Returns true if the player was banned.
    */
    unbanPlayer(id: Uuid): boolean;
    /**
    * Returns all currently active player bans.
    */
    listPlayerBans(): Array<BannedPlayerEntry>;
    /**
    * Checks if an IP address is currently banned.
    */
    isIpBanned(ip: string): boolean;
    /**
    * Retrieves the ban entry for an IP address, if banned.
    */
    getIpBan(ip: string): BannedIpEntry | undefined;
    /**
    * Bans an IP address with the specified options.
    */
    banIp(ip: string, options: BanIpOptions): void;
    /**
    * Removes an IP ban. Returns true if the IP was banned.
    */
    unbanIp(ip: string): boolean;
    /**
    * Returns all currently active IP bans.
    */
    listIpBans(): Array<BannedIpEntry>;
    [Symbol.dispose](): void;
  }
  
  export class OpManager implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Checks if a player UUID is currently an operator.
    */
    isOp(id: Uuid): boolean;
    /**
    * Retrieves the operator entry for a player UUID, if present.
    */
    getOp(id: Uuid): OpEntry | undefined;
    /**
    * Gets the effective permission level for a player UUID (returns zero if not op).
    */
    getPermissionLevel(id: Uuid): PermissionLevel;
    /**
    * Grants operator status to a player (online or offline) with the specified level and bypass setting.
    */
    opPlayer(name: string, id: Uuid, level: PermissionLevel, bypassesPlayerLimit: boolean): void;
    /**
    * Revokes operator status from a player (online or offline). Returns true if the player was previously op.
    */
    deopPlayer(id: Uuid): boolean;
    /**
    * Returns a list of all operator entries on the server.
    */
    listOps(): Array<OpEntry>;
    [Symbol.dispose](): void;
  }
  
  export class Server implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Returns system information (CPU, Memory, OS).
    * Fields are returned only if the plugin has the corresponding permissions.
    */
    getSysInfo(): SysInfo;
    /**
    * Returns the current difficulty level of the server.
    */
    getDifficulty(): Difficulty;
    /**
    * Returns the total number of players currently connected to the server.
    */
    getPlayerCount(): number;
    /**
    * Returns the rolling average Milliseconds Per Tick (MSPT).
    * A value below 50.0 is required for a stable 20 TPS.
    */
    getMspt(): number;
    /**
    * Returns the effective Ticks Per Second (TPS).
    * Ideal value is 20.0.
    */
    getTps(): number;
    /**
    * Returns a list of all online players across all worlds.
    */
    getAllPlayers(): Array<Player>;
    /**
    * Searches for a player by their exact name.
    */
    getPlayerByName(name: string): Player | undefined;
    /**
    * Searches for a player by their UUID string.
    */
    getPlayerByUuid(id: Uuid): Player | undefined;
    /**
    * Returns a list of all worlds on this server.
    */
    getAllWorlds(): Array<World>;
    /**
    * Gets a world by its dimension name (e.g., "minecraft:overworld") or custom world name (e.g., "world", "arena_1").
    */
    getWorldByName(name: string): World | undefined;
    /**
    * Checks if a world exists by name or dimension.
    */
    hasWorld(name: string): boolean;
    executeCommand(command: string, sender: CommandSender): void;
    /**
    * Runs a command with console permissions and returns the lines it printed.
    */
    runCommand(command: string): Array<string>;
    /**
    * Creates or loads a world by its name and dimension.
    * If a world with the given name already exists, it will be returned.
    */
    createWorld(name: string, dimension: Dimension): World;
    /**
    * Unloads and saves a world by its name or dimension.
    * Returns an error if the world cannot be found, is the primary/default world, or still has players inside.
    */
    unloadWorld(name: string): void;
    /**
    * Saves all players, player advancements, and loaded worlds to disk.
    */
    saveAll(): void;
    /**
    * Returns a list of all online players in a specific world.
    */
    getPlayersInWorld(worldRef: World): Array<Player>;
    /**
    * Returns the number of online players in a specific world.
    */
    getPlayerCountInWorld(worldRef: World): number;
    /**
    * Broadcasts a system chat message to all players.
    */
    broadcast(message: string): void;
    /**
    * Deletes a signed chat message from all players' chat windows using its 256-byte signature.
    */
    deleteMessageBySignature(signature: Uint8Array): void;
    /**
    * Deletes a signed chat message from all players' chat windows using its signature cache ID.
    */
    deleteMessageById(signatureId: number): void;
    /**
    * Broadcasts a tab list header and footer to all players.
    */
    broadcastTabListHeaderFooter(header: TextComponent, footer: TextComponent): void;
    /**
    * Returns the maximum number of players allowed on the server.
    */
    getMaxPlayers(): number;
    /**
    * Returns whether the server is in hardcore mode.
    */
    isHardcore(): boolean;
    /**
    * Returns whether the server is in online mode (authenticates with Mojang).
    */
    isOnlineMode(): boolean;
    /**
    * Returns the server's Message of the Day (MOTD).
    */
    getMotd(): string;
    /**
    * Returns whether the server has a whitelist enabled.
    */
    hasWhitelist(): boolean;
    /**
    * Returns whether the server allows the Nether dimension.
    */
    getAllowNether(): boolean;
    /**
    * Returns whether the server allows the End dimension.
    */
    getAllowEnd(): boolean;
    /**
    * Returns the server's maximum view distance.
    */
    getViewDistance(): number;
    /**
    * Returns the server's maximum simulation distance.
    */
    getSimulationDistance(): number;
    /**
    * Returns the server's default gamemode.
    */
    getDefaultGamemode(): GameMode;
    /**
    * Returns the recipe manager to register custom recipes.
    */
    getRecipeManager(): RecipeManager;
    /**
    * Returns the operator manager to query or modify server operators.
    */
    getOpManager(): OpManager;
    /**
    * Returns the global ban manager for querying and modifying player and IP bans.
    */
    getBanManager(): BanManager;
    /**
    * Returns the global whitelist manager for querying and modifying the server whitelist.
    */
    getWhitelistManager(): WhitelistManager;
    /**
    * Returns detailed information about an advancement by its ID (e.g., "minecraft:story/mine_stone" or "story/mine_stone").
    */
    getAdvancement(id: string): AdvancementInfo | undefined;
    /**
    * Returns a list of all registered advancement IDs on the server.
    */
    getAllAdvancementIds(): Array<string>;
    /**
    * Returns the global enchantment manager for registering and querying custom enchantments.
    */
    getEnchantmentManager(): EnchantmentManager;
    /**
    * Returns information about an enchantment by its ID (vanilla or custom).
    */
    getEnchantment(id: string): CustomEnchantment | undefined;
    /**
    * Returns a list of all registered enchantment IDs (custom and vanilla) on the server.
    */
    getAllEnchantmentIds(): Array<string>;
    /**
    * Returns the global datapack manager for inspecting, enabling, disabling, and reloading datapacks.
    */
    getDatapackManager(): DatapackManager;
    /**
    * Broadcasts custom server links to all connected players (displayed in the client Esc pause menu in 1.21+).
    */
    setServerLinks(links: Array<ServerLink>): void;
    [Symbol.dispose](): void;
  }
  
  export class WhitelistManager implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Returns whether the whitelist is currently enabled.
    */
    isEnabled(): boolean;
    /**
    * Enables or disables the server whitelist. If enabled and enforce-whitelist is set, kicks non-whitelisted players.
    */
    setEnabled(enabled: boolean): void;
    /**
    * Checks if a player UUID is on the whitelist.
    */
    isWhitelisted(id: Uuid): boolean;
    /**
    * Adds a player to the whitelist (online or offline). Returns true if newly added.
    */
    addPlayer(name: string, id: Uuid): boolean;
    /**
    * Removes a player from the whitelist. Returns true if the player was on the whitelist.
    */
    removePlayer(id: Uuid): boolean;
    /**
    * Returns all whitelisted player entries.
    */
    listEntries(): Array<WhitelistEntry>;
    [Symbol.dispose](): void;
  }
}
