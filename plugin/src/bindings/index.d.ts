/// <reference path="./interfaces/pumpkin-plugin-advancement.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-attributes.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-bedrock-packets.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-biomes.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-block-entity.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-boss-bar.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-command.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-common.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-context.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-damage-types.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-data-components.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-datapack.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-display.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-enchantments.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-entity-statuses.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-entity-types.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-entity.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-event.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-forms.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-game-events.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-game-rules.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-gui.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-i18n.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-inventory.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-ipc.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-item-stack.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-java-dialogs.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-java-packets.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-logging.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-metadata.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-particles.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-permission.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-player.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-potions.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-recipe.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-scheduler.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-scoreboard.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-screens.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-server.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-sounds.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-statistics.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-status-effect.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-text.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-uuid.d.ts" />
/// <reference path="./interfaces/pumpkin-plugin-world.d.ts" />
declare module 'pumpkin:plugin/plugin@0.1.0' {
  export type Context = import('pumpkin:plugin/context@0.1.0').Context;
  export type Event = import('pumpkin:plugin/event@0.1.0').Event;
  export type ServerInstance = import('pumpkin:plugin/server@0.1.0').Server;
  export type CommandSender = import('pumpkin:plugin/command@0.1.0').CommandSender;
  export type ConsumedArgs = import('pumpkin:plugin/command@0.1.0').ConsumedArgs;
  export type CommandError = import('pumpkin:plugin/command@0.1.0').CommandError;
  export type CommandSuggestions = import('pumpkin:plugin/command@0.1.0').CommandSuggestions;
  export type SuggestionRequest = import('pumpkin:plugin/command@0.1.0').SuggestionRequest;
  export type Entity = import('pumpkin:plugin/world@0.1.0').Entity;
  export type ChunkBuffer = import('pumpkin:plugin/world@0.1.0').ChunkBuffer;
  export type GenerationPhase = import('pumpkin:plugin/world@0.1.0').GenerationPhase;
  export type PluginId = import('pumpkin:plugin/ipc@0.1.0').PluginId;
  export type IpcMessage = import('pumpkin:plugin/ipc@0.1.0').IpcMessage;
  export type * as PumpkinPluginAdvancement010 from 'pumpkin:plugin/advancement@0.1.0'; // import pumpkin:plugin/advancement@0.1.0
  export type * as PumpkinPluginAttributes010 from 'pumpkin:plugin/attributes@0.1.0'; // import pumpkin:plugin/attributes@0.1.0
  export type * as PumpkinPluginBedrockPackets010 from 'pumpkin:plugin/bedrock-packets@0.1.0'; // import pumpkin:plugin/bedrock-packets@0.1.0
  export type * as PumpkinPluginBiomes010 from 'pumpkin:plugin/biomes@0.1.0'; // import pumpkin:plugin/biomes@0.1.0
  export type * as PumpkinPluginBlockEntity010 from 'pumpkin:plugin/block-entity@0.1.0'; // import pumpkin:plugin/block-entity@0.1.0
  export type * as PumpkinPluginBossBar010 from 'pumpkin:plugin/boss-bar@0.1.0'; // import pumpkin:plugin/boss-bar@0.1.0
  export type * as PumpkinPluginCommand010 from 'pumpkin:plugin/command@0.1.0'; // import pumpkin:plugin/command@0.1.0
  export type * as PumpkinPluginCommon010 from 'pumpkin:plugin/common@0.1.0'; // import pumpkin:plugin/common@0.1.0
  export type * as PumpkinPluginContext010 from 'pumpkin:plugin/context@0.1.0'; // import pumpkin:plugin/context@0.1.0
  export type * as PumpkinPluginDamageTypes010 from 'pumpkin:plugin/damage-types@0.1.0'; // import pumpkin:plugin/damage-types@0.1.0
  export type * as PumpkinPluginDataComponents010 from 'pumpkin:plugin/data-components@0.1.0'; // import pumpkin:plugin/data-components@0.1.0
  export type * as PumpkinPluginDatapack010 from 'pumpkin:plugin/datapack@0.1.0'; // import pumpkin:plugin/datapack@0.1.0
  export type * as PumpkinPluginDisplay010 from 'pumpkin:plugin/display@0.1.0'; // import pumpkin:plugin/display@0.1.0
  export type * as PumpkinPluginEnchantments010 from 'pumpkin:plugin/enchantments@0.1.0'; // import pumpkin:plugin/enchantments@0.1.0
  export type * as PumpkinPluginEntityStatuses010 from 'pumpkin:plugin/entity-statuses@0.1.0'; // import pumpkin:plugin/entity-statuses@0.1.0
  export type * as PumpkinPluginEntityTypes010 from 'pumpkin:plugin/entity-types@0.1.0'; // import pumpkin:plugin/entity-types@0.1.0
  export type * as PumpkinPluginEntity010 from 'pumpkin:plugin/entity@0.1.0'; // import pumpkin:plugin/entity@0.1.0
  export type * as PumpkinPluginEvent010 from 'pumpkin:plugin/event@0.1.0'; // import pumpkin:plugin/event@0.1.0
  export type * as PumpkinPluginForms010 from 'pumpkin:plugin/forms@0.1.0'; // import pumpkin:plugin/forms@0.1.0
  export type * as PumpkinPluginGameEvents010 from 'pumpkin:plugin/game-events@0.1.0'; // import pumpkin:plugin/game-events@0.1.0
  export type * as PumpkinPluginGameRules010 from 'pumpkin:plugin/game-rules@0.1.0'; // import pumpkin:plugin/game-rules@0.1.0
  export type * as PumpkinPluginGui010 from 'pumpkin:plugin/gui@0.1.0'; // import pumpkin:plugin/gui@0.1.0
  export type * as PumpkinPluginI18n010 from 'pumpkin:plugin/i18n@0.1.0'; // import pumpkin:plugin/i18n@0.1.0
  export type * as PumpkinPluginInventory010 from 'pumpkin:plugin/inventory@0.1.0'; // import pumpkin:plugin/inventory@0.1.0
  export type * as PumpkinPluginIpc010 from 'pumpkin:plugin/ipc@0.1.0'; // import pumpkin:plugin/ipc@0.1.0
  export type * as PumpkinPluginItemStack010 from 'pumpkin:plugin/item-stack@0.1.0'; // import pumpkin:plugin/item-stack@0.1.0
  export type * as PumpkinPluginJavaDialogs010 from 'pumpkin:plugin/java-dialogs@0.1.0'; // import pumpkin:plugin/java-dialogs@0.1.0
  export type * as PumpkinPluginJavaPackets010 from 'pumpkin:plugin/java-packets@0.1.0'; // import pumpkin:plugin/java-packets@0.1.0
  export type * as PumpkinPluginLogging010 from 'pumpkin:plugin/logging@0.1.0'; // import pumpkin:plugin/logging@0.1.0
  export type * as PumpkinPluginParticles010 from 'pumpkin:plugin/particles@0.1.0'; // import pumpkin:plugin/particles@0.1.0
  export type * as PumpkinPluginPermission010 from 'pumpkin:plugin/permission@0.1.0'; // import pumpkin:plugin/permission@0.1.0
  export type * as PumpkinPluginPlayer010 from 'pumpkin:plugin/player@0.1.0'; // import pumpkin:plugin/player@0.1.0
  export type * as PumpkinPluginPotions010 from 'pumpkin:plugin/potions@0.1.0'; // import pumpkin:plugin/potions@0.1.0
  export type * as PumpkinPluginRecipe010 from 'pumpkin:plugin/recipe@0.1.0'; // import pumpkin:plugin/recipe@0.1.0
  export type * as PumpkinPluginScheduler010 from 'pumpkin:plugin/scheduler@0.1.0'; // import pumpkin:plugin/scheduler@0.1.0
  export type * as PumpkinPluginScoreboard010 from 'pumpkin:plugin/scoreboard@0.1.0'; // import pumpkin:plugin/scoreboard@0.1.0
  export type * as PumpkinPluginScreens010 from 'pumpkin:plugin/screens@0.1.0'; // import pumpkin:plugin/screens@0.1.0
  export type * as PumpkinPluginServer010 from 'pumpkin:plugin/server@0.1.0'; // import pumpkin:plugin/server@0.1.0
  export type * as PumpkinPluginSounds010 from 'pumpkin:plugin/sounds@0.1.0'; // import pumpkin:plugin/sounds@0.1.0
  export type * as PumpkinPluginStatistics010 from 'pumpkin:plugin/statistics@0.1.0'; // import pumpkin:plugin/statistics@0.1.0
  export type * as PumpkinPluginStatusEffect010 from 'pumpkin:plugin/status-effect@0.1.0'; // import pumpkin:plugin/status-effect@0.1.0
  export type * as PumpkinPluginText010 from 'pumpkin:plugin/text@0.1.0'; // import pumpkin:plugin/text@0.1.0
  export type * as PumpkinPluginUuid010 from 'pumpkin:plugin/uuid@0.1.0'; // import pumpkin:plugin/uuid@0.1.0
  export type * as PumpkinPluginWorld010 from 'pumpkin:plugin/world@0.1.0'; // import pumpkin:plugin/world@0.1.0
  export * as metadata from 'pumpkin:plugin/metadata@0.1.0'; // export pumpkin:plugin/metadata@0.1.0
  /**
  * --- Plugin-provided exports ---
  * Called by the host once to initialize the plugin.
  * Internal use only; plugins should use the `register_plugin!` macro.
  */
  export function initPlugin(): void;
  /**
  * Called when the plugin is being loaded.
  * Use this to register commands, events, and perform initial setup.
  */
  export function onLoad(context: Context): void;
  /**
  * Called when the plugin is being unloaded.
  * Use this to save data and clean up resources.
  */
  export function onUnload(context: Context): void;
  /**
  * Dispatches an event to the plugin for handling.
  */
  export function handleEvent(eventId: number, server: ServerInstance, event: Event): Event;
  /**
  * Dispatches a command execution to the plugin.
  */
  export function handleCommand(commandId: number, sender: CommandSender, server: ServerInstance, args: ConsumedArgs): number;
  /**
  * Dispatches a command suggestion request to the plugin.
  */
  export function handleCommandSuggestion(handlerId: number, sender: CommandSender, server: ServerInstance, request: SuggestionRequest): CommandSuggestions;
  /**
  * Dispatches a scheduled task execution to the plugin.
  */
  export function handleTask(handlerId: number, server: ServerInstance): void;
  /**
  * Processes an incoming message from another plugin if possible, and returns (a possibly empty) response.
  */
  export function handleIpcMessage(sender: PluginId, message: IpcMessage): IpcMessage;
  export function handleAiGoalCanStart(goalId: number, server: ServerInstance, entity: Entity): boolean;
  export function handleAiGoalShouldContinue(goalId: number, server: ServerInstance, entity: Entity): boolean;
  export function handleAiGoalStart(goalId: number, server: ServerInstance, entity: Entity): void;
  export function handleAiGoalTick(goalId: number, server: ServerInstance, entity: Entity): void;
  export function handleAiGoalStop(goalId: number, server: ServerInstance, entity: Entity): void;
  /**
  * Dispatches a chunk generation phase to the plugin.
  */
  export function handleGeneratePhase(generatorId: number, phase: GenerationPhase, chunk: ChunkBuffer): void;
  export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
}
