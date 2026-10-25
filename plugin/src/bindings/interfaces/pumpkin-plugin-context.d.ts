/// <reference path="./pumpkin-plugin-command.d.ts" />
/// <reference path="./pumpkin-plugin-event.d.ts" />
/// <reference path="./pumpkin-plugin-permission.d.ts" />
/// <reference path="./pumpkin-plugin-server.d.ts" />
declare module 'pumpkin:plugin/context@0.1.0' {
  export type Server = import('pumpkin:plugin/server@0.1.0').Server;
  export type EventType = import('pumpkin:plugin/event@0.1.0').EventType;
  export type EventPriority = import('pumpkin:plugin/event@0.1.0').EventPriority;
  export type Command = import('pumpkin:plugin/command@0.1.0').Command;
  export type Permission = import('pumpkin:plugin/permission@0.1.0').Permission;
  /**
   * Verified marketplace metadata for signed plugins.
   */
  export interface MarketplaceMetadata {
    /**
     * The marketplace base URL where this plugin is registered.
     */
    marketplaceUrl: string,
    /**
     * The unique plugin ID on the marketplace.
     */
    pluginId: bigint,
    /**
     * The canonical plugin name.
     */
    pluginName: string,
    /**
     * The semver version string of the plugin.
     */
    version: string,
    /**
     * Developer ID.
     */
    devId: bigint,
    /**
     * Developer display name or username.
     */
    devName: string,
    /**
     * Whether this is a paid marketplace plugin.
     */
    isPaid: boolean,
    /**
     * The buyer / licensee user ID (0 for free/open-source).
     */
    userId: bigint,
    /**
     * Unique license key issued to the buyer, if paid.
     */
    licenseKey?: string,
    /**
     * ISO-8601 timestamp of when this binary/license was issued.
     */
    issuedAt: string,
  }
  
  export class Context implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Registers a handler for a specific event.
    * 
    * * `handler-id`: Unique ID for the event handler.
    * * `event-type`: The type of event to listen for.
    * * `event-priority`: When this handler should be called relative to others.
    * * `blocking`: Whether the event should wait for this handler to finish.
    */
    registerEvent(handlerId: number, eventType: EventType, eventPriority: EventPriority, blocking: boolean): void;
    /**
    * Registers a new command.
    * 
    * * `command`: The command definition.
    * * `permission`: The required permission node to execute this command.
    */
    registerCommand(command: Command, permission: string): void;
    /**
    * Registers a permission node with the server.
    */
    registerPermission(permission: Permission): void;
    /**
    * Returns the path to the plugin's private data folder.
    */
    getDataFolder(): string;
    /**
    * Returns the global server instance.
    */
    getServer(): Server;
    /**
    * Returns verified marketplace metadata if this plugin binary is signed, or none if unsigned.
    */
    getMarketplaceMetadata(): MarketplaceMetadata | undefined;
    [Symbol.dispose](): void;
  }
}
