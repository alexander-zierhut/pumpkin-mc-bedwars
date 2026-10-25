/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-uuid.d.ts" />
declare module 'pumpkin:plugin/bedrock-packets@0.1.0' {
  export type Uuid = import('pumpkin:plugin/uuid@0.1.0').Uuid;
  export type NbtTree = import('pumpkin:plugin/common@0.1.0').NbtTree;
  /**
   * Specific entity event action or visual effect.
   * # Variants
   * 
   * ## `"none"`
   * 
   * ## `"jump"`
   * 
   * ## `"hurt"`
   * 
   * ## `"death"`
   * 
   * ## `"start-attacking"`
   * 
   * ## `"stop-attacking"`
   * 
   * ## `"taming-failed"`
   * 
   * ## `"taming-succeeded"`
   * 
   * ## `"shake-wetness"`
   * 
   * ## `"eat-grass"`
   * 
   * ## `"fishhook-bubble"`
   * 
   * ## `"fishhook-fish-pos"`
   * 
   * ## `"fishhook-hook-time"`
   * 
   * ## `"fishhook-tease"`
   * 
   * ## `"squid-fleeing"`
   * 
   * ## `"zombie-converting"`
   * 
   * ## `"play-ambient"`
   * 
   * ## `"spawn-alive"`
   * 
   * ## `"start-offer-flower"`
   * 
   * ## `"stop-offer-flower"`
   * 
   * ## `"love-hearts"`
   * 
   * ## `"villager-angry"`
   * 
   * ## `"villager-happy"`
   * 
   * ## `"witch-hat-magic"`
   * 
   * ## `"fireworks-explode"`
   * 
   * ## `"in-love-hearts"`
   * 
   * ## `"silverfish-merge-animation"`
   * 
   * ## `"guardian-attack-sound"`
   * 
   * ## `"drink-potion"`
   * 
   * ## `"throw-potion"`
   * 
   * ## `"prime-tnt-cart"`
   * 
   * ## `"prime-creeper"`
   * 
   * ## `"air-supply"`
   * 
   * ## `"deprecated-add-player-levels"`
   * 
   * ## `"guardian-mining-fatigue"`
   * 
   * ## `"agent-swing-arm"`
   * 
   * ## `"dragon-start-death-anim"`
   * 
   * ## `"ground-dust"`
   * 
   * ## `"shake"`
   * 
   * ## `"feed"`
   * 
   * ## `"baby-age"`
   * 
   * ## `"instant-death"`
   * 
   * ## `"notify-trade"`
   * 
   * ## `"leash-destroyed"`
   * 
   * ## `"caravan-updated"`
   * 
   * ## `"talisman-activate"`
   * 
   * ## `"deprecated-update-structure-feature"`
   * 
   * ## `"player-spawned-mob"`
   * 
   * ## `"puke"`
   * 
   * ## `"update-stack-size"`
   * 
   * ## `"start-swimming"`
   * 
   * ## `"balloon-pop"`
   * 
   * ## `"treasure-hunt"`
   * 
   * ## `"summon-agent"`
   * 
   * ## `"finished-charging-item"`
   * 
   * ## `"actor-grow-up"`
   * 
   * ## `"vibration-detected"`
   * 
   * ## `"drink-milk"`
   * 
   * ## `"shake-wetness-stop"`
   * 
   * ## `"kinetic-damage-dealt"`
   * 
   * ## `"hurt-without-receiving-damage"`
   */
  export type ActorEventId = 'none' | 'jump' | 'hurt' | 'death' | 'start-attacking' | 'stop-attacking' | 'taming-failed' | 'taming-succeeded' | 'shake-wetness' | 'eat-grass' | 'fishhook-bubble' | 'fishhook-fish-pos' | 'fishhook-hook-time' | 'fishhook-tease' | 'squid-fleeing' | 'zombie-converting' | 'play-ambient' | 'spawn-alive' | 'start-offer-flower' | 'stop-offer-flower' | 'love-hearts' | 'villager-angry' | 'villager-happy' | 'witch-hat-magic' | 'fireworks-explode' | 'in-love-hearts' | 'silverfish-merge-animation' | 'guardian-attack-sound' | 'drink-potion' | 'throw-potion' | 'prime-tnt-cart' | 'prime-creeper' | 'air-supply' | 'deprecated-add-player-levels' | 'guardian-mining-fatigue' | 'agent-swing-arm' | 'dragon-start-death-anim' | 'ground-dust' | 'shake' | 'feed' | 'baby-age' | 'instant-death' | 'notify-trade' | 'leash-destroyed' | 'caravan-updated' | 'talisman-activate' | 'deprecated-update-structure-feature' | 'player-spawned-mob' | 'puke' | 'update-stack-size' | 'start-swimming' | 'balloon-pop' | 'treasure-hunt' | 'summon-agent' | 'finished-charging-item' | 'actor-grow-up' | 'vibration-detected' | 'drink-milk' | 'shake-wetness-stop' | 'kinetic-damage-dealt' | 'hurt-without-receiving-damage';
  /**
   * Transmits actor-specific animations, sounds, and state changes (such as hurt, taming, or eating).
   */
  export interface SActorEvent {
    /**
     * Runtime entity ID of the actor experiencing the event.
     */
    targetRuntimeId: bigint,
    /**
     * Identifier of the specific actor event.
     */
    eventId: ActorEventId,
    /**
     * Event-specific integer payload data (e.g. particle color or sound data).
     */
    data: number,
    /**
     * Optional position where the event should be centered.
     */
    fireAtPosition?: [number, number, number],
  }
  /**
   * Animation action performed on an actor.
   * # Variants
   * 
   * ## `"no-action"`
   * 
   * ## `"swing-arm"`
   * 
   * Arm swinging animation.
   * ## `"wake-up"`
   * 
   * Waking up from bed animation.
   * ## `"critical-hit"`
   * 
   * Critical hit particle burst.
   * ## `"magic-critical-hit"`
   * 
   * Magic critical hit sparkle burst.
   */
  export type AnimateAction = 'no-action' | 'swing-arm' | 'wake-up' | 'critical-hit' | 'magic-critical-hit';
  /**
   * Cause or trigger for an arm swing action.
   * # Variants
   * 
   * ## `"none"`
   * 
   * ## `"build"`
   * 
   * ## `"mine"`
   * 
   * ## `"interact"`
   * 
   * ## `"attack"`
   * 
   * ## `"use-item"`
   * 
   * ## `"throw-item"`
   * 
   * ## `"drop-item"`
   * 
   * ## `"event"`
   */
  export type ActorSwingSource = 'none' | 'build' | 'mine' | 'interact' | 'attack' | 'use-item' | 'throw-item' | 'drop-item' | 'event';
  /**
   * Plays animations (arm swing, critical strike particles, waking up) on an actor.
   */
  export interface SAnimate {
    /**
     * Type of animation to display.
     */
    action: AnimateAction,
    /**
     * Runtime entity ID of the target actor.
     */
    targetActorRuntimeId: bigint,
    /**
     * Floating point payload (used for rowing animation angles).
     */
    data: number,
    /**
     * Source context that triggered an arm swing.
     */
    swingSource?: ActorSwingSource,
  }
  /**
   * Sent by the client when picking a targeted block (middle-click / pick block action).
   */
  export interface SBlockPickRequest {
    /**
     * World position coordinates of the targeted block.
     */
    position: [number, number, number],
    /**
     * Whether block entity data / NBT should be copied into the picked item stack.
     */
    withData: boolean,
    /**
     * Maximum hotbar slots available for placing the picked item.
     */
    maxSlots: number,
  }
  /**
   * Sent by the client to report cache hits and misses for chunk blobs requested by the server.
   */
  export interface SClientCacheBlobStatus {
    /**
     * Hashes of chunk blobs not found in the client cache, which the server must send.
     */
    missHashes: BigInt64Array,
    /**
     * Hashes of chunk blobs successfully retrieved from the client cache.
     */
    hitHashes: BigInt64Array,
  }
  /**
   * Sent by the client during login to inform the server whether client-side chunk blob caching is supported.
   */
  export interface SClientCacheStatus {
    /**
     * True if the client supports caching sub-chunk blobs by hash.
     */
    isCacheSupported: boolean,
  }
  /**
   * Metadata describing the origin and sender of an executed command.
   */
  export interface CommandOriginData {
    /**
     * Origin type string (e.g. `player`, `command_block`, `server`).
     */
    rType: string,
    /**
     * UUID uniquely identifying the sender instance.
     */
    uuid: Uuid,
    /**
     * Request identifier string for correlating command outputs.
     */
    requestId: string,
    /**
     * Entity unique ID of the player executing the command, if applicable.
     */
    playerId: bigint,
  }
  /**
   * Sent by the client to request server-side execution of a slash command.
   */
  export interface SCommandRequest {
    /**
     * Raw command line string (with leading slash).
     */
    command: string,
    /**
     * Origin context information identifying the command sender.
     */
    origin: CommandOriginData,
    /**
     * Whether the command originates from an internal engine subsystem.
     */
    isInternal: boolean,
    /**
     * Protocol command syntax version string.
     */
    version: string,
  }
  /**
   * Sent by either client or server to close an open container inventory window.
   */
  export interface SContainerClose {
    /**
     * Window ID of the container being closed.
     */
    containerId: number,
    /**
     * Bedrock container type identifier.
     */
    containerType: number,
    /**
     * True if the close was initiated by the server rather than the player.
     */
    serverInitiatedClose: boolean,
  }
  /**
   * Transmits player emote animations to the server and broadcasts them to nearby players.
   */
  export interface SEmote {
    /**
     * Runtime entity ID of the emoting player.
     */
    actorRuntimeId: bigint,
    /**
     * UUID identifier string of the emote piece being performed.
     */
    emoteId: string,
    /**
     * Duration of the emote animation in ticks.
     */
    emoteLengthTicks: number,
    /**
     * Xbox Live User ID of the player.
     */
    xuid: string,
    /**
     * Platform ID string of the player.
     */
    platformId: string,
    /**
     * Bitflags modifying emote playback behavior (e.g. mute chat).
     */
    flags: number,
  }
  /**
   * Sent by the client to provide the server with a list of all emotes unlocked and equipped by the player.
   */
  export interface SEmoteList {
    /**
     * Runtime entity ID of the player sending their emote inventory.
     */
    runtimeId: bigint,
    /**
     * List of emote piece UUIDs unlocked by the player.
     */
    emotePieceIds: Array<Uuid>,
  }
  /**
   * Action type performed in an entity interaction.
   * # Variants
   * 
   * ## `"invalid"`
   * 
   * ## `"stop-riding"`
   * 
   * Stop riding a vehicle entity.
   * ## `"interact-update"`
   * 
   * Continuous interaction position update.
   * ## `"npc-open"`
   * 
   * Open NPC dialog interface.
   * ## `"open-inventory"`
   * 
   * Open entity inventory (e.g. horse or llama).
   */
  export type Action = 'invalid' | 'stop-riding' | 'interact-update' | 'npc-open' | 'open-inventory';
  /**
   * Sent by the client when interacting with an entity (mounting, NPC dialogue, opening inventory).
   */
  export interface SInteract {
    /**
     * Type of interaction performed.
     */
    action: Action,
    /**
     * Runtime entity ID of the target entity.
     */
    targetRuntimeId: bigint,
    /**
     * Interaction hit position vector, present for mouse/touch interactions.
     */
    position?: [number, number, number],
  }
  export type InventoryActionSource = InventoryActionSourceContainer | InventoryActionSourceWorld | InventoryActionSourceCreative | InventoryActionSourceTodo | InventoryActionSourceUnknown;
  export interface InventoryActionSourceContainer {
    tag: 'container',
  }
  export interface InventoryActionSourceWorld {
    tag: 'world',
  }
  export interface InventoryActionSourceCreative {
    tag: 'creative',
  }
  export interface InventoryActionSourceTodo {
    tag: 'todo',
  }
  export interface InventoryActionSourceUnknown {
    tag: 'unknown',
    val: number,
  }
  export interface LegacySetItemSlot {
    containerId: number,
    slots: Uint8Array,
  }
  /**
   * # Variants
   * 
   * ## `"mainhand"`
   * 
   * ## `"offhand"`
   */
  export type HandSlot = 'mainhand' | 'offhand';
  export interface StackRequestItem {
    identifier?: string,
    metadataValue: number,
    count: number,
    blockRuntimeId: number,
    extraData: Uint8Array,
  }
  export interface ItemStackRequestActionCreate {
    resultIndex: number,
  }
  export interface ItemStackRequestActionBeaconPayment {
    primaryEffectId: number,
    secondaryEffectId: number,
  }
  export interface ItemStackRequestActionMineBlock {
    hotbarSlot: number,
    predictedDurability: number,
    stackId: number,
  }
  export interface ItemStackRequestActionCraftRecipe {
    recipeId: number,
    repetitions: number,
  }
  export interface ItemStackRequestActionCraftRecipeAuto {
    recipeId: number,
    repetitions: number,
  }
  export interface ItemStackRequestActionCraftCreative {
    creativeItemId: number,
    repetitions: number,
  }
  export interface ItemStackRequestActionOptional {
    recipeId: number,
    filterStringIndex: number,
  }
  export interface ItemStackRequestActionGrindstone {
    recipeId: number,
    repairCost: number,
    repetitions: number,
  }
  export interface ItemStackRequestActionLoom {
    patternId: string,
    repetitions: number,
  }
  export interface ItemStackRequestActionCraftResultsDeprecated {
    resultItems: Array<StackRequestItem>,
    timesCrafted: number,
  }
  /**
   * Type of loading screen transition event.
   * # Variants
   * 
   * ## `"start-loading-screen"`
   * 
   * Client has started displaying a loading screen.
   * ## `"end-loading-screen"`
   * 
   * Client has dismissed the loading screen and resumed rendering.
   */
  export type LoadingScreenPacketType = 'start-loading-screen' | 'end-loading-screen';
  /**
   * Sent by the client to update the server on client-side loading screen transitions.
   */
  export interface SLoadingScreen {
    loadingScreenPacketType: LoadingScreenPacketType,
    loadingScreenId?: number,
  }
  /**
   * Sent by the client to initiate the login handshake, containing authentication tokens and device information.
   */
  export interface SLogin {
    /**
     * Protocol version spoken by the connecting client.
     */
    protocolVersion: number,
    /**
     * Chain of JSON Web Tokens containing identity and Xbox Live authentication claims.
     */
    jwt: Uint8Array,
    /**
     * Raw client data JWT carrying skin parameters, device details, and locale settings.
     */
    rawToken: Uint8Array,
  }
  export interface SkinAnimation {
    frames: number,
    image: string,
    imageHeight: number,
    imageWidth: number,
    animationType: number,
    animationExpression: number,
  }
  export interface PersonaPiece {
    isDefault: boolean,
    packId: string,
    pieceId: string,
    pieceType: string,
    productId: string,
  }
  export interface PersonaPieceTintColour {
    colours: Array<string>,
    pieceType: string,
  }
  export interface ClientData {
    clientRandomId: bigint,
    deviceOs: number,
    deviceId: string,
    gameVersion: string,
    languageCode: string,
    currentInputMode: number,
    defaultInputMode: number,
    uiProfile: number,
    serverAddress: string,
    deviceModel: string,
    guiScale: number,
    clientIsEditorCapable: boolean,
    clientEditorConnectionIntent: number,
    maxViewDistance: number,
    memoryTier: number,
    platformType: number,
    graphicsMode: number,
    compatibleWithClientSideChunkGen: boolean,
    platformOfflineId: string,
    platformOnlineId: string,
    platformUserId: string,
    selfSignedId: string,
    playFabId: string,
    thirdPartyName: string,
    thirdPartyNameOnly: boolean,
    skinId: string,
    skinData: string,
    skinImageHeight: number,
    skinImageWidth: number,
    skinColour: string,
    armSize: string,
    personaSkin: boolean,
    premiumSkin: boolean,
    trustedSkin: boolean,
    overrideSkin: boolean,
    capeData: string,
    capeId: string,
    capeImageHeight: number,
    capeImageWidth: number,
    capeOnClassicSkin: boolean,
    skinGeometry: string,
    skinGeometryVersion: string,
    skinResourcePatch: string,
    animatedImageData: Array<SkinAnimation>,
    skinAnimationData: string,
    personaPieces: Array<PersonaPiece>,
    pieceTintColours: Array<PersonaPieceTintColour>,
  }
  /**
   * Sent by the client in response to a server-sent modal form dialog.
   */
  export interface SModalFormResponse {
    /**
     * Form ID corresponding to the request sent by the server.
     */
    formId: number,
    /**
     * JSON encoded form response data (inputs, selected buttons), or None if cancelled.
     */
    jsonResponse?: string,
    /**
     * Optional cancellation reason code if the form was dismissed without submission.
     */
    formCancelReason?: number,
  }
  /**
   * Sent by the client to report malformed or unexpected packets received from the server.
   */
  export interface SPacketViolationWarning {
    /**
     * Violation category (e.g. unknown packet or malformed payload).
     */
    violationType: number,
    /**
     * Severity level of the violation (warning vs fatal).
     */
    violationSeverity: number,
    /**
     * Packet ID that triggered the violation.
     */
    violationPacketId: number,
    /**
     * Diagnostic description of the violation context.
     */
    violationContext: string,
  }
  /**
   * Category of action performed by a player.
   * # Variants
   * 
   * ## `"unknown"`
   * 
   * ## `"start-destroy-block"`
   * 
   * ## `"abort-destroy-block"`
   * 
   * ## `"stop-destroy-block"`
   * 
   * ## `"get-updated-block"`
   * 
   * ## `"drop-item"`
   * 
   * Seems to be not used, or atleast not send by client
   * ## `"start-sleeping"`
   * 
   * ## `"stop-sleeping"`
   * 
   * ## `"respawn"`
   * 
   * ## `"start-jump"`
   * 
   * ## `"start-sprinting"`
   * 
   * ## `"stop-sprinting"`
   * 
   * ## `"start-sneaking"`
   * 
   * ## `"stop-sneaking"`
   * 
   * ## `"creative-destroy-block"`
   * 
   * ## `"change-dimension-ack"`
   * 
   * ## `"start-gliding"`
   * 
   * ## `"stop-gliding"`
   * 
   * ## `"deny-destroy-block"`
   * 
   * ## `"crack-block"`
   * 
   * ## `"change-skin"`
   * 
   * ## `"updated-enchanting-seed"`
   * 
   * ## `"start-swimming"`
   * 
   * ## `"stop-swimming"`
   * 
   * ## `"start-spin-attack"`
   * 
   * ## `"stop-spin-attack"`
   * 
   * ## `"interact-with-block"`
   * 
   * ## `"predict-destroy-block"`
   * 
   * ## `"continue-destroy-block"`
   * 
   * ## `"start-item-use-on"`
   * 
   * ## `"stop-item-use-on"`
   * 
   * ## `"handled-teleport"`
   * 
   * ## `"missed-swing"`
   * 
   * ## `"start-crawling"`
   * 
   * ## `"stop-crawling"`
   * 
   * ## `"start-flying"`
   * 
   * ## `"stop-flying"`
   * 
   * ## `"client-ack-server-data"`
   * 
   * ## `"start-using-item"`
   * 
   * ## `"internal-update"`
   * 
   * ## `"count"`
   */
  export type PlayerActionType = 'unknown' | 'start-destroy-block' | 'abort-destroy-block' | 'stop-destroy-block' | 'get-updated-block' | 'drop-item' | 'start-sleeping' | 'stop-sleeping' | 'respawn' | 'start-jump' | 'start-sprinting' | 'stop-sprinting' | 'start-sneaking' | 'stop-sneaking' | 'creative-destroy-block' | 'change-dimension-ack' | 'start-gliding' | 'stop-gliding' | 'deny-destroy-block' | 'crack-block' | 'change-skin' | 'updated-enchanting-seed' | 'start-swimming' | 'stop-swimming' | 'start-spin-attack' | 'stop-spin-attack' | 'interact-with-block' | 'predict-destroy-block' | 'continue-destroy-block' | 'start-item-use-on' | 'stop-item-use-on' | 'handled-teleport' | 'missed-swing' | 'start-crawling' | 'stop-crawling' | 'start-flying' | 'stop-flying' | 'client-ack-server-data' | 'start-using-item' | 'internal-update' | 'count';
  /**
   * Sent by the client when performing player actions such as mining, sprinting, sneaking, or dimensions changes.
   */
  export interface SPlayerAction {
    /**
     * Runtime entity ID of the executing player.
     */
    playerRuntimeId: bigint,
    /**
     * Specific action type triggered.
     */
    action: PlayerActionType,
    /**
     * Coordinates of the target block involved in the action, or zero if none.
     */
    blockPosition: [number, number, number],
    /**
     * Result block position (e.g. adjacent position where a block would be placed).
     */
    resultPos: [number, number, number],
    /**
     * Face of the block targeted by the action.
     */
    face: number,
  }
  /**
   * A block action (e.g. start/stop breaking) executed within a player input tick.
   */
  export interface PlayerBlockAction {
    /**
     * Action category performed on the block.
     */
    action: PlayerActionType,
    /**
     * Targeted block coordinates.
     */
    blockPos: [number, number, number],
    /**
     * Face of the block targeted.
     */
    face: number,
  }
  /**
   * Primary physical input peripheral used by the client.
   * # Variants
   * 
   * ## `"mouse"`
   * 
   * Standard desktop mouse and keyboard.
   * ## `"touch"`
   * 
   * Mobile touchscreen controls.
   * ## `"game-pad"`
   * 
   * Console gamepad or controller.
   * ## `"motion-controller"`
   * 
   * Motion controller (VR / AR).
   */
  export type InputMode = 'mouse' | 'touch' | 'game-pad' | 'motion-controller';
  /**
   * Client rendering / gameplay mode.
   * # Variants
   * 
   * ## `"normal"`
   * 
   * Standard full-screen desktop or mobile play.
   * ## `"teaser"`
   * 
   * ## `"screen"`
   * 
   * ## `"exit-level"`
   * 
   * ## `"num-modes"`
   */
  export type PlayMode = 'normal' | 'teaser' | 'screen' | 'exit-level' | 'num-modes';
  /**
   * Client control interaction model style.
   * # Variants
   * 
   * ## `"touch"`
   * 
   * Touch drag and tap interaction.
   * ## `"crosshair"`
   * 
   * Centered crosshair interaction.
   * ## `"classic"`
   * 
   * Classic D-pad and tap controls.
   */
  export type InteractionModel = 'touch' | 'crosshair' | 'classic';
  /**
   * # Variants
   * 
   * ## `"ascend"`
   * 
   * ## `"descend"`
   * 
   * ## `"north-jump"`
   * 
   * ## `"jump-down"`
   * 
   * ## `"sprint-down"`
   * 
   * ## `"change-height"`
   * 
   * ## `"jumping"`
   * 
   * ## `"auto-jumping-in-water"`
   * 
   * ## `"sneaking"`
   * 
   * ## `"sneak-down"`
   * 
   * ## `"up"`
   * 
   * ## `"down"`
   * 
   * ## `"left"`
   * 
   * ## `"right"`
   * 
   * ## `"up-left"`
   * 
   * ## `"up-right"`
   * 
   * ## `"want-up"`
   * 
   * ## `"want-down"`
   * 
   * ## `"want-down-slow"`
   * 
   * ## `"want-up-slow"`
   * 
   * ## `"sprinting"`
   * 
   * ## `"ascend-block"`
   * 
   * ## `"descend-block"`
   * 
   * ## `"sneak-toggle-down"`
   * 
   * ## `"persist-sneak"`
   * 
   * ## `"start-sprinting"`
   * 
   * ## `"stop-sprinting"`
   * 
   * ## `"start-sneaking"`
   * 
   * ## `"stop-sneaking"`
   * 
   * ## `"start-swimming"`
   * 
   * ## `"stop-swimming"`
   * 
   * ## `"start-jumping"`
   * 
   * ## `"start-gliding"`
   * 
   * ## `"stop-gliding"`
   * 
   * ## `"perform-item-interaction"`
   * 
   * ## `"perform-block-actions"`
   * 
   * ## `"perform-item-stack-request"`
   * 
   * ## `"handled-teleport"`
   * 
   * ## `"emoting"`
   * 
   * ## `"missed-swing"`
   * 
   * ## `"start-crawling"`
   * 
   * ## `"stop-crawling"`
   * 
   * ## `"start-flying"`
   * 
   * ## `"stop-flying"`
   * 
   * ## `"client-ack-server-data"`
   * 
   * ## `"client-predicted-vehicle"`
   * 
   * ## `"paddling-left"`
   * 
   * ## `"paddling-right"`
   * 
   * ## `"block-breaking-delay-enabled"`
   * 
   * ## `"horizontal-collision"`
   * 
   * ## `"vertical-collision"`
   * 
   * ## `"down-left"`
   * 
   * ## `"down-right"`
   * 
   * ## `"start-using-item"`
   * 
   * ## `"camera-relative-movement-enabled"`
   * 
   * ## `"rot-controlled-by-move-direction"`
   * 
   * ## `"start-spin-attack"`
   * 
   * ## `"stop-spin-attack"`
   * 
   * ## `"is-hotbar-touch-only"`
   * 
   * ## `"jump-released-raw"`
   * 
   * ## `"jump-pressed-raw"`
   * 
   * ## `"jump-current-raw"`
   * 
   * ## `"sneak-released-raw"`
   * 
   * ## `"sneak-pressed-raw"`
   * 
   * ## `"sneak-current-raw"`
   * 
   * ## `"internal-update"`
   */
  export type InputData = 'ascend' | 'descend' | 'north-jump' | 'jump-down' | 'sprint-down' | 'change-height' | 'jumping' | 'auto-jumping-in-water' | 'sneaking' | 'sneak-down' | 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'want-up' | 'want-down' | 'want-down-slow' | 'want-up-slow' | 'sprinting' | 'ascend-block' | 'descend-block' | 'sneak-toggle-down' | 'persist-sneak' | 'start-sprinting' | 'stop-sprinting' | 'start-sneaking' | 'stop-sneaking' | 'start-swimming' | 'stop-swimming' | 'start-jumping' | 'start-gliding' | 'stop-gliding' | 'perform-item-interaction' | 'perform-block-actions' | 'perform-item-stack-request' | 'handled-teleport' | 'emoting' | 'missed-swing' | 'start-crawling' | 'stop-crawling' | 'start-flying' | 'stop-flying' | 'client-ack-server-data' | 'client-predicted-vehicle' | 'paddling-left' | 'paddling-right' | 'block-breaking-delay-enabled' | 'horizontal-collision' | 'vertical-collision' | 'down-left' | 'down-right' | 'start-using-item' | 'camera-relative-movement-enabled' | 'rot-controlled-by-move-direction' | 'start-spin-attack' | 'stop-spin-attack' | 'is-hotbar-touch-only' | 'jump-released-raw' | 'jump-pressed-raw' | 'jump-current-raw' | 'sneak-released-raw' | 'sneak-pressed-raw' | 'sneak-current-raw' | 'internal-update';
  /**
   * Sent by the Bedrock client when the player changes their active hotbar slot.
   */
  export interface SPlayerHotbar {
    /**
     * Zero-based slot index selected in the hotbar.
     */
    selectedSlot: number,
    /**
     * Container identifier (usually player inventory).
     */
    containerId: number,
    /**
     * Whether the server should select this slot immediately.
     */
    shouldSelectSlot: boolean,
  }
  /**
   * Typed value payload for an ability toggle request.
   */
  export type AbilityValue = AbilityValueBool | AbilityValueFloat;
  /**
   * Boolean flag value (e.g. enabling or disabling flight).
   */
  export interface AbilityValueBool {
    tag: 'bool',
    val: boolean,
  }
  /**
   * Floating point value (e.g. fly speed modification).
   */
  export interface AbilityValueFloat {
    tag: 'float',
    val: number,
  }
  /**
   * Sent by the client to request permission to modify a player ability (such as flying).
   */
  export interface SRequestAbility {
    /**
     * Identifier of the requested ability.
     */
    ability: number,
    /**
     * Requested ability state or value.
     */
    value: AbilityValue,
  }
  /**
   * Sent by the client to request a specific chunk render distance from the server.
   */
  export interface SRequestChunkRadius {
    /**
     * Requested chunk render radius in chunks.
     */
    chunkRadius: number,
    /**
     * Upper limit of chunk render radius requested by the client settings.
     */
    maxChunkRadius: number,
  }
  /**
   * Sent by the client to query network settings (such as compression algorithms and thresholds) from the server.
   */
  export interface SRequestNetworkSettings {
    /**
     * Network protocol version supported by the connecting client.
     * If unsupported by the server, the connection will be rejected.
     */
    clientNetworkVersion: number,
  }
  /**
   * Sent by the client during resource pack negotiation to acknowledge packs or request downloads.
   */
  export interface SResourcePackClientResponse {
    /**
     * Pack response status (e.g. refused, send packs, have all packs, or completed).
     */
    response: number,
    /**
     * Number of packs requested for download.
     */
    downloadSize: number,
    /**
     * Array of pack identifiers (`UUID_Version`) the client needs to download.
     */
    packIds: Array<string>,
  }
  /**
   * Lifecycle stage for player respawning.
   * # Variants
   * 
   * ## `"searching-for-spawn"`
   * 
   * Server is searching for a valid spawn position point.
   * ## `"ready-to-spawn"`
   * 
   * Server indicates client is ready to spawn at target coordinates.
   * ## `"client-ready-to-spawn"`
   * 
   * Client confirms it has loaded the surrounding world and is ready to spawn.
   */
  export type RespawnState = 'searching-for-spawn' | 'ready-to-spawn' | 'client-ready-to-spawn';
  /**
   * Bidirectional packet managing player respawning and client spawn readiness.
   */
  export interface SRespawn {
    /**
     * World coordinates where the player is to respawn.
     */
    position: [number, number, number],
    /**
     * Stage of the respawn lifecycle.
     */
    state: RespawnState,
    /**
     * Runtime entity ID of the respawning player.
     */
    playerRuntimeId: bigint,
  }
  /**
   * Sent by the client after receiving PlayStatus(PlayerSpawn) to signal that world initialization is complete.
   */
  export interface SSetLocalPlayerAsInitialized {
    /**
     * Runtime entity ID assigned to the player in `StartGame`.
     */
    playerId: bigint,
  }
  /**
   * Sent by the client to sync inventory UI layout options and selected crafting tabs.
   */
  export interface SSetPlayerInventoryOptions {
    /**
     * Selected left inventory category tab.
     */
    leftInventoryTab: number,
    /**
     * Selected right inventory category tab.
     */
    rightInventoryTab: number,
    /**
     * Whether recipe filtering (craftable only) is toggled on.
     */
    filtering: boolean,
    /**
     * Layout style of the inventory grid.
     */
    layoutInv: number,
    /**
     * Layout style of the crafting section.
     */
    layoutCraft: number,
  }
  /**
   * Formatting type and destination UI layer for Bedrock text packets.
   * # Variants
   * 
   * ## `"raw"`
   * 
   * Unformatted raw text message.
   * ## `"chat"`
   * 
   * Standard player chat message.
   * ## `"translation"`
   * 
   * Translatable localization key with arguments.
   * ## `"popup"`
   * 
   * Brief popup message displayed above the action bar.
   * ## `"jukebox-popup"`
   * 
   * Jukebox disc track notification popup.
   * ## `"tip"`
   * 
   * Small tip text displayed above the hotbar.
   * ## `"system"`
   * 
   * Server system notification message.
   * ## `"whisper"`
   * 
   * Private whisper message directed to a specific player.
   * ## `"announcement"`
   * 
   * Global server announcement message.
   * ## `"json-whisper"`
   * 
   * Formatted JSON whisper message.
   * ## `"json"`
   * 
   * Formatted raw JSON message.
   * ## `"json-announcement"`
   * 
   * Formatted JSON announcement.
   */
  export type TextPacketType = 'raw' | 'chat' | 'translation' | 'popup' | 'jukebox-popup' | 'tip' | 'system' | 'whisper' | 'announcement' | 'json-whisper' | 'json' | 'json-announcement';
  /**
   * Transmits in-game chat messages, system alerts, popups, and raw JSON text between client and server.
   */
  export interface SText {
    /**
     * Whether translation is requested for localization strings in the message.
     */
    needsTranslation: boolean,
    /**
     * Formatting category and presentation target of the text.
     */
    rType: TextPacketType,
    /**
     * Sender username (included in chat, whisper, and announcement packets).
     */
    sourceName: string,
    /**
     * Primary text content or translation key.
     */
    message: string,
    /**
     * Localization substitution arguments for translation or popup texts.
     */
    parameters: Array<string>,
    /**
     * Sender Xbox Live User ID (XUID).
     */
    xuid: string,
    /**
     * Platform-specific chat identifier (e.g. Nintendo Switch chat isolation).
     */
    platformChatId: string,
    /**
     * Optional profanity-filtered message for clients with filtering enabled.
     */
    filteredMessage?: string,
  }
  /**
   * Synchronized numeric entity attribute with min, current, and max bounds.
   */
  export interface SyncedAttribute {
    /**
     * Identifier string for the attribute (e.g. `minecraft:health`).
     */
    attributeName: string,
    /**
     * Minimum allowed attribute value.
     */
    minValue: number,
    /**
     * Current active attribute value.
     */
    currentValue: number,
    /**
     * Maximum allowed attribute value.
     */
    maxValue: number,
  }
  /**
   * A fixed command enum and its allowed option indices.
   */
  export interface EnumData {
    /**
     * Name of the enumeration.
     */
    name: string,
    /**
     * Indices of valid values pointing into `enum_values`.
     */
    values: Int32Array,
  }
  /**
   * Relationship between a chained subcommand value and argument flags.
   */
  export interface ChainedSubcommandRelationship {
    /**
     * Index into the `ChainedSubcommandValues` flat list.
     */
    index: number,
    /**
     * Argument type flags (basic types only, no `ARG_FLAG`_* modifiers).
     */
    value: number,
  }
  /**
   * Represents a subcommand that can chain commands, e.g. `/execute`.
   */
  export interface ChainedSubcommandData {
    /**
     * Name of the chained subcommand.
     */
    name: string,
    /**
     * Value and type relationships for this subcommand.
     */
    subcommandValues: Array<ChainedSubcommandRelationship>,
  }
  /**
   * An individual parameter definition within a command overload.
   */
  export interface ParamData {
    /**
     * Parameter name shown in command hints.
     */
    name: string,
    /**
     * Encodes type flags (`ARG_FLAG_VALID` | `ARG_FLAG_ENUM` | index, or raw type).
     */
    parseSymbol: number,
    /**
     * Whether this parameter is optional.
     */
    isOptional: boolean,
    /**
     * Parameter option byte bitflags.
     */
    options: number,
  }
  /**
   * An overload variant describing a sequence of expected arguments.
   */
  export interface OverloadData {
    /**
     * Whether this overload is part of a chained command invocation.
     */
    isChaining: boolean,
    /**
     * Parameter specifications comprising this overload.
     */
    parameterData: Array<ParamData>,
  }
  /**
   * A dynamic command enumeration whose choices can update without resending all commands.
   */
  export interface SoftEnumData {
    /**
     * Name of the dynamic enumeration.
     */
    enumName: string,
    /**
     * Available options within the enumeration.
     */
    enumOptions: Array<string>,
  }
  /**
   * Restricts specific enum values based on constraints.
   */
  export interface ConstrainedValueData {
    /**
     * Symbol of the enum value being constrained.
     */
    enumValueSymbol: number,
    /**
     * Symbol of the enum containing the value.
     */
    enumSymbol: number,
    /**
     * Indices of constraints applied.
     */
    constraintIndices: Uint8Array,
  }
  /**
   * Synchronizes the complete block-actor data for a block position.
   */
  export interface CBlockActorData {
    /**
     * World coordinates of the block entity being updated.
     */
    blockPosition: [number, number, number],
    /**
     * Network NBT compound containing all properties and state of the block entity.
     */
    actorDataTags: NbtTree,
  }
  /**
   * Updates a client-side block animation, such as a chest lid opening or closing.
   */
  export interface CBlockEvent {
    /**
     * World coordinates of the block undergoing the event.
     */
    blockPosition: [number, number, number],
    /**
     * Type identifier of the block action being executed.
     */
    eventType: number,
    /**
     * Type-specific integer parameter (e.g. 1 to open a chest lid, 0 to close it).
     */
    eventValue: number,
  }
  /**
   * Sent by the server to make a specific 'boss event' occur in the world.
   * 
   * Packet ID: `74`
   */
  export interface CBossEvent {
    /**
     * The unique ID of the boss entity that the boss event sent involves.
     */
    bossEntityId: bigint,
    /**
     * The type of the event (one of `BOSS_EVENT_*`).
     */
    eventType: number,
    /**
     * The title shown above the boss bar.
     */
    title: string,
    /**
     * Filtered version of `title` with profanity removed.
     */
    filteredTitle: string,
    /**
     * The percentage of health shown in the boss bar (0.0 - 1.0).
     */
    healthPercentage: number,
    /**
     * The colour of the boss bar (one of `BOSS_EVENT_COLOUR_*`).
     */
    color: number,
    /**
     * The overlay of the boss bar (one of `BOSS_EVENT_OVERLAY_*`).
     */
    overlay: number,
  }
  /**
   * Transitions the player to a different dimension with a loading screen.
   */
  export interface CChangeDimension {
    /**
     * Target dimension identifier (0: Overworld, 1: Nether, 2: The End).
     * 
     * Must differ from the player's current dimension to prevent an infinite loading screen.
     */
    dimensionId: number,
    /**
     * Coordinates where the player spawns in the destination dimension.
     */
    position: [number, number, number],
    /**
     * Whether this dimension change was triggered by player respawn after death.
     */
    respawn: boolean,
    /**
     * Optional identifier for the loading screen session.
     */
    loadingScreenId?: number,
  }
  /**
   * Sent by the server in response to [`SRequestChunkRadius`](crate::bedrock::server::request_chunk_radius::SRequestChunkRadius) to confirm the approved chunk render distance.
   */
  export interface CChunkRadiusUpdated {
    /**
     * Approved chunk radius (in chunks) that the server will send to the client.
     */
    chunkRadius: number,
  }
  /**
   * Payload data for a requested chunk blob that was missing from the client cache.
   */
  export interface MissingBlobData {
    /**
     * 64-bit hash identifier of the blob.
     */
    blobId: bigint,
    /**
     * Raw serialized byte payload of the chunk blob.
     */
    blobData: Uint8Array,
  }
  /**
   * Sent by the server in response to [`SClientCacheBlobStatus`](crate::bedrock::server::client_cache_blob_status::SClientCacheBlobStatus) with requested chunk blobs.
   */
  export interface CClientCacheMissResponse {
    /**
     * Array of blob byte payloads corresponding to missed blob hashes.
     */
    missingBlobs: Array<MissingBlobData>,
  }
  /**
   * Operating system or client platform identifier reported by the client.
   * # Variants
   * 
   * ## `"unknown"`
   * 
   * ## `"google"`
   * 
   * ## `"ios"`
   * 
   * ## `"osx"`
   * 
   * ## `"amazon"`
   * 
   * ## `"gear-vr"`
   * 
   * ## `"uwp"`
   * 
   * ## `"win32"`
   * 
   * ## `"dedicated"`
   * 
   * ## `"tv-os"`
   * 
   * ## `"sony"`
   * 
   * ## `"nintendo"`
   * 
   * ## `"xbox"`
   * 
   * ## `"windows-phone"`
   * 
   * ## `"linux"`
   */
  export type BuildPlatform = 'unknown' | 'google' | 'ios' | 'osx' | 'amazon' | 'gear-vr' | 'uwp' | 'win32' | 'dedicated' | 'tv-os' | 'sony' | 'nintendo' | 'xbox' | 'windows-phone' | 'linux';
  /**
   * Game mode identifier used in Bedrock protocol packets.
   * # Variants
   * 
   * ## `"unknown"`
   * 
   * ## `"survival"`
   * 
   * ## `"creative"`
   * 
   * ## `"adventure"`
   * 
   * ## `"default"`
   * 
   * ## `"spectator"`
   */
  export type GameType = 'unknown' | 'survival' | 'creative' | 'adventure' | 'default' | 'spectator';
  /**
   * Player permission level representing their world access rights.
   * # Variants
   * 
   * ## `"visitor"`
   * 
   * ## `"member"`
   * 
   * ## `"operator"`
   * 
   * ## `"custom"`
   */
  export type PlayerPermissionLevel = 'visitor' | 'member' | 'operator' | 'custom';
  /**
   * Command permission level determining allowed command execution scope.
   * # Variants
   * 
   * ## `"any"`
   * 
   * ## `"game-directors"`
   * 
   * ## `"admin"`
   * 
   * ## `"host"`
   * 
   * ## `"owner"`
   * 
   * ## `"internal"`
   */
  export type CommandPermissionLevel = 'any' | 'game-directors' | 'admin' | 'host' | 'owner' | 'internal';
  /**
   * Metadata, permissions, aliases, and argument overloads for a single registered command.
   */
  export interface CommandData {
    /**
     * Canonical command name (without leading slash).
     */
    name: string,
    /**
     * Human-readable description displayed in command help.
     */
    description: string,
    /**
     * Command behavior flags.
     */
    flags: number,
    /**
     * Minimum permission level required to execute the command.
     */
    permissionLevel: CommandPermissionLevel,
    /**
     * Index into enum table defining aliases for this command (-1 if none).
     */
    aliasEnum: number,
    /**
     * Indices of chained subcommands referenced by this command.
     */
    commandDataChainedSubcommandIndexes: Int32Array,
    /**
     * Overload variants specifying acceptable argument sequences.
     */
    overloads: Array<OverloadData>,
  }
  /**
   * Advertises available console and chat commands, arguments, overloads, and auto-completion structures.
   */
  export interface CAvailableCommands {
    /**
     * Global table of all unique string arguments and options referenced by command enums.
     */
    enumValues: Array<string>,
    /**
     * Subcommand names supporting chained execution (e.g. `/execute`).
     */
    chainedSubcommandValues: Array<string>,
    /**
     * Suffix strings appended to command parameters.
     */
    postFixes: Array<string>,
    /**
     * Fixed enumeration definitions mapping enum names to indices in `enum_values`.
     */
    enumData: Array<EnumData>,
    /**
     * Chained subcommand definitions and argument relationships.
     */
    chainedSubcommandData: Array<ChainedSubcommandData>,
    /**
     * Command specifications and overloads registered for the player.
     */
    commands: Array<CommandData>,
    /**
     * Dynamic enumerations that can be updated at runtime without resending all commands.
     */
    softEnums: Array<SoftEnumData>,
    /**
     * Value constraints and restrictions applied to specific enum options.
     */
    constraints: Array<ConstrainedValueData>,
  }
  /**
   * A single ability layer defining movement speeds and allowed action bitflags.
   */
  export interface SerializedAbilitiesDataSerializedLayer {
    /**
     * Layer type index (such as base, spectator, or creative).
     */
    serializedLayer: number,
    /**
     * Bitmask of abilities configured for this layer.
     */
    abilitiesSet: number,
    /**
     * Current boolean values for the configured abilities bitmask.
     */
    abilityValue: number,
    /**
     * Flying speed multiplier.
     */
    flySpeed: number,
    /**
     * Vertical flying speed multiplier.
     */
    verticalFlySpeed: number,
    /**
     * Walking speed multiplier.
     */
    walkSpeed: number,
  }
  /**
   * Serialized abilities data containing permissions and ability bitmasks for a player.
   */
  export interface SerializedAbilitiesData {
    /**
     * Unique entity ID of the target player.
     */
    targetPlayerRawId: bigint,
    /**
     * Permission level shown in the player list.
     */
    playerPermissions: PlayerPermissionLevel,
    /**
     * Level determining what command categories the player can invoke.
     */
    commandPermissions: CommandPermissionLevel,
    /**
     * Ability layers specifying capabilities (flight, invulnerability, etc.).
     */
    layers: Array<SerializedAbilitiesDataSerializedLayer>,
  }
  /**
   * Describes an attachment link between two entities, such as a player riding a vehicle.
   */
  export interface ActorLink {
    /**
     * Unique entity ID of the vehicle / entity being ridden.
     */
    riddenUniqueId: bigint,
    /**
     * Unique entity ID of the passenger / rider.
     */
    riderUniqueId: bigint,
    /**
     * Type of link (e.g. 0 for passenger, 1 for vehicle).
     */
    linkType: number,
    /**
     * Whether the link takes effect immediately without smooth transition.
     */
    immediate: boolean,
    /**
     * Whether the link was initiated by the passenger entity.
     */
    riderInitiated: boolean,
    /**
     * Rotational velocity applied to the vehicle.
     */
    vehicleAngularVelocity: number,
  }
  /**
   * Sent by the server to open an inventory container screen (chest, furnace, anvil) on the client.
   */
  export interface CContainerOpen {
    /**
     * Window ID assigned to the opened container session.
     */
    containerId: number,
    /**
     * Container inventory type (chest, hopper, dispenser, etc.).
     */
    containerType: number,
    /**
     * Block coordinates of the container block entity in world space.
     */
    position: [number, number, number],
    /**
     * Entity ID if the container belongs to an entity (e.g. horse or donkey chest).
     */
    targetEntityId: bigint,
  }
  /**
   * Sent by the server to correct the client's predicted movement under server authoritative movement.
   */
  export interface CCorrectPlayerMovePrediction {
    /**
     * Prediction mode type (e.g. player movement vs vehicle movement).
     */
    predictionType: number,
    /**
     * Corrected world position coordinates.
     */
    pos: [number, number, number],
    /**
     * Positional delta velocity vector.
     */
    posDelta: [number, number, number],
    /**
     * Pitch and yaw rotation angles.
     */
    rotation: [number, number],
    /**
     * Angular velocity of the vehicle if riding one.
     */
    vehicleAngularVelocity?: number,
    /**
     * Whether the player was resting on solid ground.
     */
    onGround: boolean,
    /**
     * Tick number on which the prediction error occurred.
     */
    tick: bigint,
  }
  export interface RecipeItemDescriptorItem {
    identifier: string,
    metadataValue: number,
  }
  export type RecipeItemDescriptor = RecipeItemDescriptorEmpty | RecipeItemDescriptorItem | RecipeItemDescriptorTag;
  export interface RecipeItemDescriptorEmpty {
    tag: 'empty',
  }
  export interface RecipeItemDescriptorItem {
    tag: 'item',
    val: RecipeItemDescriptorItem,
  }
  export interface RecipeItemDescriptorTag {
    tag: 'tag',
    val: string,
  }
  export interface ItemDescriptorCount {
    descriptor: RecipeItemDescriptor,
    count: number,
  }
  export interface RecipeUnlockRequirement {
    context: number,
  }
  /**
   * # Variants
   * 
   * ## `"all"`
   * 
   * ## `"construction"`
   * 
   * ## `"nature"`
   * 
   * ## `"equipment"`
   * 
   * ## `"items"`
   * 
   * ## `"item-command-only"`
   * 
   * ## `"undefined"`
   */
  export type CreativeCategory = 'all' | 'construction' | 'nature' | 'equipment' | 'items' | 'item-command-only' | 'undefined';
  /**
   * Sent by the server to cleanly disconnect a client with an optional error code and kick message.
   */
  export interface CDisconnect {
    /**
     * Disconnect reason code determining the message shown on the client disconnect screen.
     */
    reason: number,
    /**
     * Whether to skip showing the disconnect message dialog and return directly to the main menu.
     */
    skipMessage: boolean,
    /**
     * Disconnect explanation message displayed to the user.
     */
    message: string,
    /**
     * Profanity-filtered variant of the disconnect message.
     */
    filteredMessage: string,
  }
  /**
   * # Variants
   * 
   * ## `"null"`
   */
  export type RuleValue = 'null';
  /**
   * An individual gamerule entry with its identifier, edit permission, and typed value.
   */
  export interface GameRule {
    /**
     * Name of the gamerule in lowercase (e.g. `showcoordinates`).
     */
    ruleName: string,
    /**
     * Whether players with operator permissions can edit this gamerule in-game.
     */
    ruleCanBeModified: boolean,
    /**
     * Value associated with the gamerule.
     */
    ruleValue: RuleValue,
  }
  /**
   * Sent by the server to update gamerules on the client (e.g. `showcoordinates` or `dodaylightcycle`).
   */
  export interface CGamerulesChanged {
    /**
     * List of game rules being updated.
     */
    ruleData: Array<GameRule>,
  }
  /**
   * Registration data for a single item type in the network item registry.
   */
  export interface ItemData {
    /**
     * String identifier for the item (e.g. `minecraft:diamond_sword`).
     */
    itemName: string,
    /**
     * Numerical runtime ID of the item.
     */
    itemId: number,
    /**
     * Whether the item uses data-driven components.
     */
    isComponentBased: boolean,
    /**
     * Format version of the item schema.
     */
    itemVersion: number,
    /**
     * Pre-serialized Bedrock NBT compound representing the item components.
     */
    componentData: Uint8Array,
  }
  /**
   * Sent by the server to register custom and vanilla item identifiers with their component definitions.
   */
  export interface CItemRegistry {
    /**
     * List of registered item definitions and their component NBT data.
     */
    items: Array<ItemData>,
  }
  /**
   * Slot update information resulting from an approved item stack request.
   */
  export interface ItemStackResponseSlotInfo {
    /**
     * Slot index requested by the client.
     */
    requestedSlot: number,
    /**
     * Destination slot index allocated by the server.
     */
    slot: number,
    /**
     * Item count in the slot.
     */
    amount: number,
    /**
     * Unique network stack ID assigned to the slot's item stack.
     */
    itemStackNetId: number,
    /**
     * Custom display name assigned to the item.
     */
    customName: string,
    /**
     * Filtered custom display name.
     */
    filteredCustomName: string,
    /**
     * Durability correction delta.
     */
    durabilityCorrection: number,
  }
  /**
   * Broadcasts visual or auditory level-wide events, such as particles or block breaking.
   */
  export interface CLevelEvent {
    /**
     * Identifier corresponding to the specific level event action.
     */
    eventId: number,
    /**
     * World coordinates where the event originates or particle effect is centered.
     */
    position: [number, number, number],
    /**
     * Type-specific auxiliary parameter associated with the event (e.g. block runtime ID).
     */
    data: number,
  }
  /**
   * Identifiers for common level-wide events and particle effects.
   * # Variants
   * 
   * ## `"particles-destroy-block"`
   * 
   * Emits block break particles at the target position.
   * ## `"block-start-break"`
   * 
   * Initiates a block cracking animation.
   * ## `"block-stop-break"`
   * 
   * Cancels or completes a block cracking animation.
   * ## `"block-update-break"`
   * 
   * Advances the crack stage of a block cracking animation.
   */
  export type LevelEvent = 'particles-destroy-block' | 'block-start-break' | 'block-stop-break' | 'block-update-break';
  /**
   * Plays a sound effect at a designated world position or associated with an actor.
   */
  export interface CLevelSoundEvent {
    /**
     * Canonical identifier string for the sound event.
     */
    soundEvent: string,
    /**
     * World coordinates where the sound source is located.
     */
    position: [number, number, number],
    /**
     * Auxiliary integer parameter used by specific sound effects.
     */
    data: number,
    /**
     * Identifier of the entity generating the sound (e.g. `minecraft:skeleton`).
     */
    actorIdentifier: string,
    /**
     * Whether the sound pitch/variant should reflect a juvenile mob variant.
     */
    isBaby: boolean,
    /**
     * Whether the sound plays globally at full volume without spatial falloff.
     */
    isGlobal: boolean,
    /**
     * Unique identifier of the entity emitting the sound.
     */
    actorUniqueId: bigint,
    /**
     * Optional explicit override position where the event should trigger.
     */
    fireAtPosition?: [number, number, number],
  }
  /**
   * Sent by the server to add, modify, or remove potion/status effects on an entity.
   */
  export interface CMobEffect {
    /**
     * Runtime entity ID of the target actor.
     */
    targetRuntimeId: bigint,
    /**
     * Effect action event (Add, Modify, or Remove).
     */
    eventId: number,
    /**
     * Status effect type identifier.
     */
    effectId: number,
    /**
     * Amplifier/potency level of the effect (e.g. 0 for Speed I, 1 for Speed II).
     */
    effectAmplifier: number,
    /**
     * Whether swirl particles should be displayed around the entity.
     */
    showParticles: boolean,
    /**
     * Duration of the effect in ticks.
     */
    effectDurationTicks: number,
    /**
     * Simulation tick number for server authoritative syncing.
     */
    tick: bigint,
    /**
     * Whether the effect is ambient (e.g. from a beacon).
     */
    ambient: boolean,
  }
  /**
   * Requests the client to open a server-defined UI form (modal dialog, list menu, or custom form).
   */
  export interface CModalFormRequest {
    /**
     * Unique identifier assigned by the server to distinguish responses when the form is submitted.
     */
    formId: number,
    /**
     * JSON-encoded definition describing the layout, controls, and contents of the form window.
     */
    formUiJson: string,
  }
  /**
   * Sent by the server to update an entity's absolute position and rotation angles.
   */
  export interface CMoveActorAbsolute {
    /**
     * Runtime entity ID of the moving actor.
     */
    actorRuntimeId: bigint,
    /**
     * Bitflags indicating on-ground status, teleportation, or forced movement.
     */
    header: number,
    /**
     * Absolute world position coordinates.
     */
    position: [number, number, number],
    /**
     * Pitch angle encoded as an 8-bit rotation value (`angle * 256 / 360`).
     */
    rotationX: number,
    /**
     * Yaw angle encoded as an 8-bit rotation value.
     */
    rotationY: number,
    /**
     * Head yaw angle encoded as an 8-bit rotation value.
     */
    rotationYHead: number,
  }
  /**
   * Bandwidth-optimized delta movement packet for updating an entity's position and rotation.
   */
  export interface CMoveActorDelta {
    /**
     * Runtime entity ID of the moving actor.
     */
    entityRuntimeId: bigint,
    /**
     * Bitmask specifying which coordinates, angles, and flags are present in the payload.
     */
    flags: number,
    /**
     * Delta or absolute X coordinate.
     */
    x: number,
    /**
     * Delta or absolute Y coordinate.
     */
    y: number,
    /**
     * Delta or absolute Z coordinate.
     */
    z: number,
    /**
     * Pitch angle encoded as an 8-bit rotation value.
     */
    pitch: number,
    /**
     * Yaw angle encoded as an 8-bit rotation value.
     */
    yaw: number,
    /**
     * Head yaw angle encoded as an 8-bit rotation value.
     */
    headYaw: number,
    /**
     * Server world simulation tick number.
     */
    tick: bigint,
  }
  /**
   * Sent by the server to update a player's movement, teleport, or view angle.
   */
  export interface CMovePlayer {
    /**
     * Runtime entity ID of the player being moved.
     */
    playerRuntimeId: bigint,
    /**
     * Absolute position coordinates in world space.
     */
    position: [number, number, number],
    /**
     * Pitch angle in degrees.
     */
    pitch: number,
    /**
     * Yaw angle in degrees.
     */
    yaw: number,
    /**
     * Horizontal head yaw rotation angle in degrees.
     */
    headYaw: number,
    /**
     * Movement mode (normal, reset, teleport, or rotation).
     */
    mode: number,
    /**
     * Whether the player is resting on the ground.
     */
    onGround: boolean,
    /**
     * Runtime entity ID of the vehicle the player is riding, or zero.
     */
    ridingRuntimeId: bigint,
    /**
     * Cause of the teleportation (present when mode is `MODE_TELEPORT`).
     */
    teleportCause: number,
    /**
     * Entity type that triggered the teleportation.
     */
    teleportSourceEntityType: number,
    /**
     * World simulation tick number.
     */
    tick: bigint,
  }
  /**
   * Sent by the server to update the center anchor position and radius around which chunks remain loaded on the client.
   */
  export interface CNetworkChunkPublisherUpdate {
    /**
     * Center block position of the loaded area.
     */
    posForView: [number, number, number],
    /**
     * Radius around the view position (measured in blocks, typically chunk radius * 16).
     */
    newRadius: number,
    /**
     * List of chunk coordinates saved in the client's cache.
     */
    serverBuildChunkList: Array<[number, number]>,
  }
  /**
   * Sent by the server in response to [`SRequestNetworkSettings`](crate::bedrock::server::request_network_settings::SRequestNetworkSettings) to configure packet compression and client throttling.
   */
  export interface CNetworkSettings {
    /**
     * Byte size threshold above which packet payloads are compressed. If zero, packets are uncompressed.
     */
    compressionThreshold: number,
    /**
     * The compression algorithm to use (`0` = Deflate/ZLib, `1` = Snappy, `0xffff` = None).
     */
    compressionAlgorithm: number,
    /**
     * Whether the client should throttle player ticking when player count exceeds threshold.
     */
    clientThrottleEnabled: boolean,
    /**
     * Player count limit before the client activates throttling.
     */
    clientThrottleThreshold: number,
    /**
     * Fraction of players ticked per frame when throttling is engaged.
     */
    clientThrottleScalar: number,
  }
  /**
   * Sent by the server to inform the client of login results, version compatibility, or player spawn readiness.
   * # Variants
   * 
   * ## `"login-success"`
   * 
   * Authentication and login succeeded; client proceeds to resource pack handshake.
   * ## `"outdated-client"`
   * 
   * Client protocol version is older than required by the server.
   * ## `"outdated-server"`
   * 
   * Server protocol version is older than the client version.
   * ## `"player-spawn"`
   * 
   * Server is ready for the player to spawn into the world.
   * ## `"invalid-tenant"`
   * 
   * Client tenant ID is invalid.
   * ## `"edition-mismatch-edu-to-vanilla"`
   * 
   * Educational edition client attempting to join a vanilla server.
   * ## `"edition-mismatch-vanilla-to-edu"`
   * 
   * Vanilla client attempting to join an educational server.
   * ## `"server-full-sub-client"`
   * 
   * Server is full for local split-screen sub-clients.
   * ## `"editor-mismatch-editor-to-vanilla"`
   * 
   * Editor mode client attempting to join a vanilla world.
   * ## `"editor-mismatch-vanilla-to-editor"`
   * 
   * Vanilla client attempting to join an editor world.
   */
  export type CPlayStatus = 'login-success' | 'outdated-client' | 'outdated-server' | 'player-spawn' | 'invalid-tenant' | 'edition-mismatch-edu-to-vanilla' | 'edition-mismatch-vanilla-to-edu' | 'server-full-sub-client' | 'editor-mismatch-editor-to-vanilla' | 'editor-mismatch-vanilla-to-editor';
  /**
   * Sent by the server to update the active selected hotbar slot of the player.
   */
  export interface CPlayerHotbar {
    /**
     * Zero-based slot index selected in the hotbar.
     */
    selectedSlot: number,
    /**
     * Container identifier (usually player inventory).
     */
    containerId: number,
    /**
     * Whether the client should immediately focus the slot.
     */
    shouldSelectSlot: boolean,
  }
  export interface PieceTintColor {
    pieceType: string,
    colors: Int32Array,
  }
  export interface Skin {
    skinId: string,
    playFabId: string,
    resourcePatch: Uint8Array,
    imageWidth: number,
    imageHeight: number,
    skinData: Uint8Array,
    animations: Array<SkinAnimation>,
    capeWidth: number,
    capeHeight: number,
    capeData: Uint8Array,
    geometryData: Uint8Array,
    animationData: Uint8Array,
    geometryDataEngineVersion: Uint8Array,
    capeId: string,
    fullId: string,
    armSize: string,
    skinColor: string,
    personaPieces: Array<PersonaPiece>,
    pieceTintColors: Array<PieceTintColor>,
    isPremium: boolean,
    isPersona: boolean,
    personaCapeOnClassic: boolean,
    isPrimaryUser: boolean,
    overrideAppearance: boolean,
    isTrusted: boolean,
    profileHash: string,
  }
  export interface PlayerListEntry {
    uuid: Uuid,
    entityUniqueId: bigint,
    username: string,
    xuid: string,
    platformChatId: string,
    buildPlatform: BuildPlatform,
    skin: Skin,
    isTeacher: boolean,
    isHost: boolean,
    isSubClient: boolean,
    playerColor: Uint8Array,
  }
  /**
   * Sent by the server to add or remove players from the in-game pause screen player list.
   */
  export interface CPlayerList {
    /**
     * Action type (`ACTION_ADD` = 0 to add, `ACTION_REMOVE` = 1 to remove).
     */
    action: number,
    /**
     * Player entries being added or removed.
     */
    entries: Array<PlayerListEntry>,
  }
  /**
   * Sent by the server to despawn an entity from the client's world.
   */
  export interface CRemoveActor {
    /**
     * Unique entity ID of the entity to remove.
     */
    targetActorId: bigint,
  }
  /**
   * Removes a scoreboard objective, hiding it from the player's screen.
   */
  export interface CRemoveObjective {
    /**
     * Identifier of the active objective to remove.
     */
    objectiveName: string,
  }
  /**
   * Identifies a specific pack instance and sub-pack layer in the active resource pack stack.
   */
  export interface PackInstanceId {
    /**
     * UUID string of the resource pack.
     */
    packId: string,
    /**
     * Semantic version string.
     */
    version: string,
    /**
     * Sub-pack configuration name.
     */
    subPackName: string,
  }
  /**
   * A resource pack UUID paired with its semantic version string.
   */
  export interface PackIdVersion {
    /**
     * Unique identifier for the pack.
     */
    packUuid: Uuid,
    /**
     * Semantic version string (e.g. `1.0.0`).
     */
    packVersion: string,
  }
  /**
   * Information describing a resource pack available on the server.
   */
  export interface PackInfoData {
    /**
     * UUID and version string identifying the pack.
     */
    packIdVersion: PackIdVersion,
    /**
     * Size of the pack in bytes.
     */
    packSize: bigint,
    /**
     * Encryption key for marketplace or encrypted content.
     */
    contentKey: string,
    /**
     * Specific subpack folder name, if applicable.
     */
    subpackName: string,
    /**
     * Content identity identifier.
     */
    contentIdentity: string,
    /**
     * True if the pack contains JavaScript or game test scripts.
     */
    hasScripts: boolean,
    /**
     * True if the pack includes custom add-on behaviors.
     */
    isAddonPack: boolean,
    /**
     * True if the pack includes PBR textures for ray tracing (RTX).
     */
    isRayTracingCapable: boolean,
    /**
     * Optional CDN URL where the client can download the pack.
     */
    cdnUrl: string,
  }
  /**
   * Sent by the server to list all resource and behavior packs required or available to download.
   */
  export interface CResourcePacksInfo {
    /**
     * If true, the client must accept and download all packs to join.
     */
    resourcePackRequired: boolean,
    /**
     * Whether any packs in the list are add-on packs.
     */
    hasAddonPacks: boolean,
    /**
     * Whether any packs contain client-side scripting.
     */
    hasScripts: boolean,
    /**
     * Whether vibrant visual shader enhancements should be disabled.
     */
    forceDisableVibrantVisuals: boolean,
    /**
     * World template UUID and version, if joining a world template.
     */
    worldTemplateIdAndVersion: PackIdVersion,
    /**
     * Array of resource packs available on the server.
     */
    resourcePacks: Array<PackInfoData>,
  }
  export type MetadataValue = MetadataValueByte | MetadataValueShort | MetadataValueInt | MetadataValueFloat | MetadataValueString | MetadataValueCompoundTag | MetadataValueItemPos | MetadataValueInt64 | MetadataValueVec3;
  export interface MetadataValueByte {
    tag: 'byte',
    val: number,
  }
  export interface MetadataValueShort {
    tag: 'short',
    val: number,
  }
  export interface MetadataValueInt {
    tag: 'int',
    val: number,
  }
  export interface MetadataValueFloat {
    tag: 'float',
    val: number,
  }
  export interface MetadataValueString {
    tag: 'string',
    val: string,
  }
  export interface MetadataValueCompoundTag {
    tag: 'compound-tag',
  }
  export interface MetadataValueItemPos {
    tag: 'item-pos',
    val: [number, number, number],
  }
  export interface MetadataValueInt64 {
    tag: 'int64',
    val: bigint,
  }
  export interface MetadataValueVec3 {
    tag: 'vec3',
    val: [number, number, number],
  }
  export interface PropertySyncData {
    intEntriesList: Array<[number, number]>,
    floatEntriesList: Array<[number, number]>,
  }
  /**
   * Sent by the server to spawn non-player entities (mobs, projectiles, vehicles, items) on the client.
   */
  export interface CAddActor {
    /**
     * Unique entity ID across sessions.
     */
    targetActorId: bigint,
    /**
     * Runtime entity ID for the current session.
     */
    targetRuntimeId: bigint,
    /**
     * Entity type identifier (e.g. `minecraft:zombie` or `minecraft:arrow`).
     */
    actorType: string,
    /**
     * World spawn coordinates.
     */
    position: [number, number, number],
    /**
     * Initial movement velocity vector.
     */
    velocity: [number, number, number],
    /**
     * Pitch (x) and yaw (y) rotation angles.
     */
    rotation: [number, number],
    /**
     * Horizontal head yaw rotation angle.
     */
    yHeadRotation: number,
    /**
     * Body yaw rotation angle.
     */
    yBodyRotation: number,
    /**
     * Entity attributes (health, movement speed, follow range).
     */
    attributesList: Array<SyncedAttribute>,
    /**
     * Metadata dictionary (flags, name tags, scale).
     */
    actorData: string,
    /**
     * Dynamic Molang property synchronization data.
     */
    syncedProperties: PropertySyncData,
    /**
     * Entity attachment links (e.g. passenger or leash connections).
     */
    actorLinks: Array<ActorLink>,
  }
  /**
   * Sent by the server to update metadata and Molang properties of an entity (e.g. name tags, fire, scale).
   */
  export interface CSetActorData {
    /**
     * The unique runtime ID of the entity being updated
     */
    targetRuntimeId: bigint,
    /**
     * A map of entity metadata properties (e.g., flags, name tags, scale)
     */
    actorData: string,
    /**
     * Dynamic properties synced between client and server
     */
    syncedProperties: PropertySyncData,
    /**
     * The server tick at which this update occurred
     */
    tick: bigint,
  }
  /**
   * Sent by the server to create, modify, or remove an attachment link between two entities (e.g. riding).
   */
  export interface CSetActorLink {
    /**
     * Attachment link descriptor defining the vehicle and passenger entities.
     */
    link: ActorLink,
  }
  /**
   * Sent by the server to set the movement velocity of an entity (e.g. knockback or explosion velocity).
   */
  export interface CSetActorMotion {
    /**
     * Runtime entity ID of the target actor.
     */
    targetRuntimeId: bigint,
    /**
     * 3D velocity vector applied to the entity.
     */
    motion: [number, number, number],
    /**
     * Simulation tick number for server authoritative syncing.
     */
    tick: bigint,
  }
  /**
   * Synchronizes world difficulty level to the client.
   */
  export interface CSetDifficulty {
    /**
     * World difficulty value (0: Peaceful, 1: Easy, 2: Normal, 3: Hard).
     */
    difficulty: number,
  }
  /**
   * Configures and displays a scoreboard objective in a specific UI slot.
   */
  export interface CSetDisplayObjective {
    /**
     * Slot location where the objective is presented (`sidebar`, `list`, or `belowname`).
     */
    displaySlotName: string,
    /**
     * Internal unique identifier for the scoreboard objective.
     */
    objectiveName: string,
    /**
     * Visible title text displayed atop the scoreboard.
     */
    objectiveDisplayName: string,
    /**
     * Objective criteria string (e.g. `dummy`).
     */
    criteriaName: string,
    /**
     * Ordering direction for scores (0: ascending, 1: descending).
     */
    sortOrder: number,
  }
  /**
   * Updates player health (legacy packet; attribute updates are typically preferred).
   */
  export interface CSetHealth {
    /**
     * New health value assigned to the player.
     */
    health: number,
  }
  /**
   * Updates the player's active game mode (e.g. Survival, Creative, Spectator).
   */
  export interface CSetPlayerGameType {
    /**
     * Target game mode to apply.
     */
    playerGameType: GameType,
  }
  /**
   * A single score line or entry on a scoreboard.
   */
  export interface ScoreEntry {
    /**
     * Unique scoreboard identifier for this entry.
     */
    scoreboardId: bigint,
    /**
     * Associated objective identifier.
     */
    objectiveName: string,
    /**
     * Score value displayed alongside the entry.
     */
    score: number,
    /**
     * Target type (1: player, 2: entity, 3: fake player).
     */
    entryType: number,
    /**
     * Unique entity identifier when entry type is player or entity.
     */
    entityUniqueId: bigint,
    /**
     * Custom label when entry type is a fake player.
     */
    customName: string,
  }
  /**
   * Updates or removes scoreboard entries displayed to the client.
   */
  export interface CSetScore {
    /**
     * Action type determining whether scores are modified (0) or removed (1).
     */
    action: number,
    /**
     * Score entries affected by this update.
     */
    entries: Array<ScoreEntry>,
  }
  /**
   * Scope of the spawn position update.
   * # Variants
   * 
   * ## `"player-respawn"`
   * 
   * Sets an individual player respawn point (e.g. bed or respawn anchor).
   * ## `"world-respawn"`
   * 
   * Sets the global world spawn point, also updating compass direction.
   */
  export type SpawnPositionType = 'player-respawn' | 'world-respawn';
  /**
   * Updates the player or world spawn coordinates, affecting respawning and compass orientation.
   */
  export interface CSetSpawnPosition {
    /**
     * Determines whether this update configures a player-specific or world spawn location.
     */
    spawnPositionType: SpawnPositionType,
    /**
     * Spawn coordinates being set.
     */
    blockPosition: [number, number, number],
    /**
     * Dimension identifier associated with this spawn position.
     */
    dimensionType: number,
    /**
     * World spawn coordinates.
     */
    spawnBlockPos: [number, number, number],
  }
  /**
   * Sent by the server to synchronize the day-night cycle time (in ticks) with the client.
   */
  export interface CSetTime {
    /**
     * In-game time of day in ticks.
     */
    time: number,
  }
  /**
   * Action or display target of a title packet.
   * # Variants
   * 
   * ## `"clear"`
   * 
   * Clears any currently displayed title.
   * ## `"reset"`
   * 
   * Resets title animations and display durations to default values.
   * ## `"title"`
   * 
   * Displays primary title text.
   * ## `"subtitle"`
   * 
   * Displays secondary subtitle text beneath the title.
   * ## `"actionbar"`
   * 
   * Displays text above the player's hotbar (action bar).
   * ## `"times"`
   * 
   * Configures fade-in, stay, and fade-out durations without displaying new text.
   * ## `"title-text-object"`
   * 
   * Displays localized or formatted JSON text as primary title.
   * ## `"subtitle-text-object"`
   * 
   * Displays localized or formatted JSON text as subtitle.
   * ## `"actionbar-text-object"`
   * 
   * Displays localized or formatted JSON text on the action bar.
   */
  export type TitleType = 'clear' | 'reset' | 'title' | 'subtitle' | 'actionbar' | 'times' | 'title-text-object' | 'subtitle-text-object' | 'actionbar-text-object';
  /**
   * Displays or controls on-screen titles, subtitles, or action bar notices.
   */
  export interface CSetTitle {
    /**
     * Operation type to perform (show text, adjust timing, clear, or reset).
     */
    titleType: TitleType,
    /**
     * Content string or raw JSON component displayed on screen.
     */
    titleText: string,
    /**
     * Duration in ticks for the title to fade in.
     */
    fadeInTime: number,
    /**
     * Duration in ticks for the title to remain fully visible.
     */
    stayTime: number,
    /**
     * Duration in ticks for the title to fade out.
     */
    fadeOutTime: number,
    /**
     * Xbox Live user identifier of the recipient, if applicable.
     */
    xuid: string,
    /**
     * Platform-specific online identifier.
     */
    platformOnlineId: string,
    /**
     * Sanitized version of the title message with profanity removed.
     */
    filteredTitleMessage: string,
  }
  /**
   * Displays or dismisses the end-game rolling credits screen.
   */
  export interface CShowCredits {
    /**
     * Runtime entity identifier of the player viewing the credits.
     */
    playerRuntimeId: bigint,
    /**
     * State transition flag (0: start showing credits, 1: stop showing credits).
     */
    creditsState: number,
  }
  export interface GatheringJoinInfo {
    experienceId: Uuid,
    experienceName: string,
    experienceWorldId: Uuid,
    experienceWorldName: string,
    creatorId: string,
    unknownUuid1: Uuid,
    unknownUuid2: Uuid,
    serverId: string,
  }
  export interface StoreEntryPointInfo {
    storeId: string,
    storeName: string,
  }
  export interface PresenceInfo {
    experienceName: string,
    worldName: string,
  }
  export interface ServerJoinInformation {
    gathering?: GatheringJoinInfo,
    storeEntryPoint?: StoreEntryPointInfo,
    presence?: PresenceInfo,
  }
  export interface ServerTelemetryData {
    serverId: string,
    scenarioId: string,
    worldId: string,
    ownerId: string,
  }
  export interface ExperimentToggle {
    name: string,
    enabled: boolean,
  }
  export interface Experiments {
    toggles: Array<ExperimentToggle>,
    experimentsEverToggled: boolean,
  }
  /**
   * Sent by the server to define the order in which resource and behavior packs are applied by the client.
   */
  export interface CResourcePackStackPacket {
    /**
     * If true, textures from the resource packs are strictly required to join.
     */
    texturePackRequired: boolean,
    /**
     * Ordered list of packs to apply in bottom-to-top priority.
     */
    texturePackList: Array<PackInstanceId>,
    /**
     * Base vanilla version of the game.
     */
    baseGameVersion: string,
    /**
     * Experimental gameplay feature toggles enabled for this world.
     */
    experiments: Experiments,
    /**
     * Whether to load editor mode packs.
     */
    includeEditorPacks: boolean,
  }
  /**
   * # Variants
   * 
   * ## `"no-multi-play"`
   * 
   * ## `"invite-only"`
   * 
   * ## `"friends-only"`
   * 
   * ## `"friends-of-friends"`
   * 
   * ## `"public"`
   */
  export type GamePublishSetting = 'no-multi-play' | 'invite-only' | 'friends-only' | 'friends-of-friends' | 'public';
  export interface LevelSettings {
    seed: bigint,
    spawnBiomeType: number,
    customBiomeName: string,
    dimension: number,
    generatorType: number,
    worldGamemode: GameType,
    hardcore: boolean,
    difficulty: number,
    spawnPosition: [number, number, number],
    hasAchievementsDisabled: boolean,
    editorWorldType: number,
    isCreatedInEditor: boolean,
    isExportedFromEditor: boolean,
    dayCycleStopTime: number,
    educationEditionOffer: number,
    hasEducationFeaturesEnabled: boolean,
    educationProductId: string,
    rainLevel: number,
    lightningLevel: number,
    hasConfirmedPlatformLockedContent: boolean,
    wasMultiplayerIntended: boolean,
    wasLanBroadcastingIntended: boolean,
    xboxLiveBroadcastSetting: GamePublishSetting,
    platformBroadcastSetting: GamePublishSetting,
    commandsEnabled: boolean,
    isTexturePacksRequired: boolean,
    ruleData: Array<GameRule>,
    experiments: Experiments,
    bonusChest: boolean,
    hasStartWithMapEnabled: boolean,
    permissionLevel: number,
    serverSimulationDistance: number,
    hasLockedBehaviorPack: boolean,
    hasLockedResourcePack: boolean,
    isFromLockedWorldTemplate: boolean,
    isUsingMsaGamertagsOnly: boolean,
    isFromWorldTemplate: boolean,
    isWorldTemplateOptionLocked: boolean,
    isOnlySpawningV1Villagers: boolean,
    isDisablingPersonas: boolean,
    isDisablingCustomSkins: boolean,
    emoteChatMuted: boolean,
    gameVersion: string,
    limitedWorldWidth: number,
    limitedWorldHeight: number,
    newNether: boolean,
    eduSharedUriButtonName: string,
    eduSharedUriLinkUri: string,
    overrideForceExperimentalGameplayHasValue: boolean,
    chatRestrictionLevel: number,
    disablePlayerInteractions: boolean,
    serverEditorConnectionPolicy: number,
    allowAnonymousBlockDropsInEditorWorlds: boolean,
  }
  /**
   * An entry for a custom block registered on the server.
   * 
   * The runtime ID of these custom block entries is based on their alphabetic index
   * within the registered block palette.
   */
  export interface BlockProperty {
    /**
     * Name or identifier of the custom block (e.g. `namespace:block`).
     */
    name: string,
    /**
     * NBT compound containing properties defining the unique block state.
     */
    properties: NbtTree,
  }
  /**
   * Sent by the server to initialize the client's world, spawn coordinates, gamerules, and entity runtime ID.
   */
  export interface CStartGame {
    /**
     * Persistent unique ID of the player entity across sessions.
     */
    entityId: bigint,
    /**
     * Runtime entity ID uniquely identifying the player during the current session.
     */
    runtimeEntityId: bigint,
    /**
     * Initial game mode assigned to the player.
     */
    playerGamemode: GameType,
    /**
     * World coordinates where the player spawns.
     */
    position: [number, number, number],
    /**
     * Initial pitch rotation angle.
     */
    pitch: number,
    /**
     * Initial yaw rotation angle.
     */
    yaw: number,
    /**
     * World and dimension settings (generator, seed, difficulty, gamerules).
     */
    levelSettings: LevelSettings,
    /**
     * Unique level identifier string.
     */
    levelId: string,
    /**
     * Display name of the world shown in menus.
     */
    levelName: string,
    /**
     * Template ID for marketplace worlds.
     */
    premiumWorldTemplateId: string,
    /**
     * True if the world is running in trial mode.
     */
    isTrial: boolean,
    /**
     * Number of movement ticks kept in rewind history for server authoritative movement.
     */
    rewindHistorySize: number,
    /**
     * True if block breaking progress is checked and controlled by the server.
     */
    serverAuthoritativeBlockBreaking: boolean,
    /**
     * Current in-game world time in ticks.
     */
    currentLevelTime: bigint,
    /**
     * Player's enchanting seed for deterministic enchanting tables.
     */
    enchantmentSeed: number,
    /**
     * Custom block property definitions registered on the server.
     */
    blockProperties: Array<BlockProperty>,
    /**
     * Correlation ID string used for telemetry and matchmaking.
     */
    multiplayerCorrelationId: string,
    /**
     * Whether the modern item stack network manager is enabled.
     */
    enableItemstackNetManager: boolean,
    /**
     * Version string of the server software.
     */
    serverVersion: string,
    compoundId: number,
    compoundLen: number,
    compoundEnd: number,
    /**
     * CRC64 checksum of the block state registry.
     */
    blockRegistryChecksum: bigint,
    /**
     * UUID of the world template if created from a template.
     */
    worldTemplateId: Uuid,
    /**
     * Whether client-side chunk generation is enabled.
     */
    enableClientsideGeneration: boolean,
    /**
     * Whether block runtime IDs are cryptographic hashes instead of sequential IDs.
     */
    blocknetworkIdsAreHashed: boolean,
    /**
     * Whether entity and environment sounds are validated by the server.
     */
    serverAuthSounds: boolean,
    /**
     * Server connection information.
     */
    serverJoinInformation?: ServerJoinInformation,
    /**
     * Telemetry and session tracking identifiers.
     */
    telemetry: ServerTelemetryData,
  }
  /**
   * Sent by the server when an entity or player picks up a dropped item, playing the pickup animation.
   */
  export interface CTakeItemActor {
    /**
     * Runtime entity ID of the item entity being collected.
     */
    itemRuntimeId: bigint,
    /**
     * Runtime entity ID of the collector entity that picked up the item.
     */
    actorRuntimeId: bigint,
  }
  /**
   * Instructs the client to disconnect and reconnect to another server address and port.
   */
  export interface CTransfer {
    /**
     * Destination server hostname or IP address.
     */
    serverAddress: string,
    /**
     * Destination server UDP port.
     */
    serverPort: number,
    /**
     * Whether the client should reload its local world context upon transferring.
     */
    reloadWorld: boolean,
  }
  /**
   * Updates player movement and interaction abilities such as flight and build permissions.
   */
  export interface CUpdateAbilities {
    /**
     * Serialized ability layers and permission parameters.
     */
    data: SerializedAbilitiesData,
  }
  /**
   * Bit flags and identifiers for individual player abilities and privileges.
   * # Variants
   * 
   * ## `"build"`
   * 
   * ## `"mine"`
   * 
   * ## `"doors-and-switches"`
   * 
   * ## `"open-containers"`
   * 
   * ## `"attack-players"`
   * 
   * ## `"attack-mobs"`
   * 
   * ## `"operator-commands"`
   * 
   * ## `"teleport"`
   * 
   * ## `"invulnerable"`
   * 
   * ## `"flying"`
   * 
   * ## `"may-fly"`
   * 
   * ## `"instabuild"`
   * 
   * ## `"lightning"`
   * 
   * ## `"fly-speed"`
   * 
   * ## `"walk-speed"`
   * 
   * ## `"muted"`
   * 
   * ## `"world-builder"`
   * 
   * ## `"no-clip"`
   * 
   * ## `"privileged-builder"`
   * 
   * ## `"vertical-fly-speed"`
   * 
   * ## `"ability-count"`
   */
  export type Ability = 'build' | 'mine' | 'doors-and-switches' | 'open-containers' | 'attack-players' | 'attack-mobs' | 'operator-commands' | 'teleport' | 'invulnerable' | 'flying' | 'may-fly' | 'instabuild' | 'lightning' | 'fly-speed' | 'walk-speed' | 'muted' | 'world-builder' | 'no-clip' | 'privileged-builder' | 'vertical-fly-speed' | 'ability-count';
  /**
   * An attribute modifier that adjusts an attribute by addition or multiplication.
   */
  export interface AttributeModifier {
    /**
     * Unique identifier for the modifier.
     */
    id: string,
    /**
     * Human-readable modifier name.
     */
    name: string,
    /**
     * Numeric modifier amount.
     */
    amount: number,
    /**
     * Mathematical operation (addition, multiply base, multiply total).
     */
    operation: number,
    /**
     * Modifier operand type index.
     */
    operand: number,
    /**
     * Whether the modifier persists across save/load sessions.
     */
    isSerializable: boolean,
  }
  /**
   * Detailed specification of an entity attribute and its active modifiers.
   */
  export interface AttributeData {
    /**
     * Minimum value the attribute can reach.
     */
    minValue: number,
    /**
     * Maximum value the attribute can reach.
     */
    maxValue: number,
    /**
     * Current calculated attribute value.
     */
    currentValue: number,
    /**
     * Base minimum default value.
     */
    defaultMinValue: number,
    /**
     * Base maximum default value.
     */
    defaultMaxValue: number,
    /**
     * Base default value without modifiers.
     */
    defaultValue: number,
    /**
     * Identifier string for the attribute (e.g. `minecraft:health`).
     */
    name: string,
    /**
     * Active modifiers altering this attribute.
     */
    modifiers: Array<AttributeModifier>,
  }
  /**
   * Sent by the server to update an entity's attribute values (e.g. health, absorption, movement speed, hunger).
   */
  export interface CUpdateAttributes {
    /**
     * Runtime entity ID of the target actor.
     */
    targetRuntimeId: bigint,
    /**
     * List of attributes with their current bounds, values, and modifiers.
     */
    attributeList: Array<AttributeData>,
    /**
     * Simulation tick number for sync verification.
     */
    tick: bigint,
  }
  /**
   * Updates a single block state client-side without retransmitting the entire chunk.
   */
  export interface CUpdateBlock {
    /**
     * World coordinates where the block state is being updated.
     */
    blockPosition: [number, number, number],
    /**
     * Runtime identifier corresponding to the new block state.
     */
    blockRuntimeId: number,
    /**
     * Bitflags governing client-side update behaviors such as neighbor updates.
     */
    flags: number,
    /**
     * Target world layer for the block (e.g. 0 for primary blocks, 1 for waterlogging).
     */
    layer: number,
  }
  /**
   * Opens or refreshes a Bedrock merchant screen with its complete offer list.
   */
  export interface CUpdateTrade {
    /**
     * Window identifier of the active trade screen.
     */
    containerId: number,
    /**
     * Window type identifier (typically 15 for villager trading).
     */
    rType: number,
    /**
     * Count of trading options available.
     */
    size: number,
    /**
     * Experience or progression tier of the trading merchant.
     */
    traderTier: number,
    /**
     * Unique identifier of the merchant entity.
     */
    entityUniqueId: bigint,
    /**
     * Unique entity identifier of the last player to interact with this merchant.
     */
    lastTradingPlayer: bigint,
    /**
     * Visible title displayed at the top of the trading interface.
     */
    displayName: string,
    /**
     * Whether to display the modern villager trading UI.
     */
    useNewTradeScreen: boolean,
    /**
     * Whether offer pricing incorporates demand and supply economics.
     */
    usingEconomyTrade: boolean,
    /**
     * Network NBT compound containing full recipe and trade offer definitions.
     */
    data: NbtTree,
  }
  /**
   * Describes a network item stack transmitted over the wire in Bedrock packets.
   * 
   * Contains the item runtime ID, count, aux/metadata value, block runtime state,
   * and variable user data including NBT, can-place, and can-destroy block filters.
   */
  export interface NetworkItemDescriptor {
    /**
     * Runtime item identifier.
     */
    id: number,
    /**
     * Stack item count.
     */
    stackSize: number,
    /**
     * Auxiliary metadata or damage value.
     */
    auxValue: number,
    /**
     * Block runtime ID associated with the item (for block items).
     */
    blockRuntimeId: number,
    /**
     * NBT component data (display name, enchantments, etc.).
     */
    nbtData: NbtTree,
    /**
     * Block identifiers this item can be placed against in Adventure mode.
     */
    placeOnBlocks: Array<string>,
    /**
     * Block identifiers this tool can destroy in Adventure mode.
     */
    destroyBlocks: Array<string>,
    /**
     * Shield blocking tick counter used for shield cooldown sync.
     */
    shieldBlockingTick: bigint,
  }
  export interface InventoryAction {
    sourceType: number,
    windowId?: number,
    sourceFlags?: number,
    inventorySlot: number,
    oldItem: NetworkItemDescriptor,
    newItem: NetworkItemDescriptor,
  }
  export interface UseItemTransactionData {
    actionType: number,
    triggerType: number,
    blockPosition: [number, number, number],
    blockFace: number,
    hotBarSlot: number,
    hand: HandSlot,
    itemInHand: NetworkItemDescriptor,
    playerPosition: [number, number, number],
    clickPosition: [number, number, number],
    blockRuntimeId: number,
    clientPrediction: number,
    clientCooldownState: number,
  }
  export interface UseItemOnEntityTransactionData {
    targetEntityRuntimeId: bigint,
    actionType: number,
    hotBarSlot: number,
    itemInHand: NetworkItemDescriptor,
    playerPosition: [number, number, number],
    clickPosition: [number, number, number],
  }
  export interface ReleaseItemTransactionData {
    actionType: number,
    hotBarSlot: number,
    itemInHand: NetworkItemDescriptor,
    headPosition: [number, number, number],
  }
  export type TransactionData = TransactionDataNormal | TransactionDataMismatch | TransactionDataUseItem | TransactionDataUseItemOnEntity | TransactionDataReleaseItem;
  export interface TransactionDataNormal {
    tag: 'normal',
    val: string,
  }
  export interface TransactionDataMismatch {
    tag: 'mismatch',
    val: string,
  }
  export interface TransactionDataUseItem {
    tag: 'use-item',
    val: UseItemTransactionData,
  }
  export interface TransactionDataUseItemOnEntity {
    tag: 'use-item-on-entity',
    val: UseItemOnEntityTransactionData,
  }
  export interface TransactionDataReleaseItem {
    tag: 'release-item',
    val: ReleaseItemTransactionData,
  }
  /**
   * Sent by the client when performing complex inventory interactions, item usages, and entity attacks.
   */
  export interface SInventoryTransaction {
    /**
     * Legacy transaction request ID used for rollback tracking.
     */
    legacyRequestId: number,
    /**
     * Legacy slot modification entries.
     */
    legacySetItemSlots: Array<LegacySetItemSlot>,
    /**
     * Whether action elements are present in the transaction.
     */
    hasValue: boolean,
    /**
     * List of slot modification actions composing this transaction.
     */
    actions: Array<InventoryAction>,
    /**
     * Transaction category type (`Normal`, `Mismatch`, `ItemUse`, `ItemUseOnEntity`, `ItemRelease`).
     */
    transactionType: number,
    /**
     * Specialized transaction payload corresponding to the transaction type.
     */
    transactionData: TransactionData,
  }
  export interface PlayerUseItemTransactionData {
    actionType: number,
    triggerType: number,
    blockPosition: [number, number, number],
    blockFace: number,
    hotBarSlot: number,
    itemInHand: NetworkItemDescriptor,
    playerPosition: [number, number, number],
    clickPosition: [number, number, number],
    blockRuntimeId: number,
    clientPrediction: number,
    clientCooldownState: number,
  }
  export interface PlayerInventoryAction {
    legacyRequestId: number,
    legacySlots: Array<LegacySetItemSlot>,
    actions: Array<InventoryAction>,
    transaction: PlayerUseItemTransactionData,
  }
  export interface BedrockShapelessRecipe {
    recipeId: string,
    input: Array<ItemDescriptorCount>,
    output: Array<NetworkItemDescriptor>,
    uuid: Uuid,
    block: string,
    priority: number,
    unlockRequirement: RecipeUnlockRequirement,
    recipeNetworkId: number,
  }
  export interface BedrockShapedRecipe {
    recipeId: string,
    width: number,
    height: number,
    input: Array<ItemDescriptorCount>,
    output: Array<NetworkItemDescriptor>,
    uuid: Uuid,
    block: string,
    priority: number,
    assumeSymmetry: boolean,
    unlockRequirement: RecipeUnlockRequirement,
    recipeNetworkId: number,
  }
  export type BedrockRecipe = BedrockRecipeShapeless | BedrockRecipeShaped;
  export interface BedrockRecipeShapeless {
    tag: 'shapeless',
    val: BedrockShapelessRecipe,
  }
  export interface BedrockRecipeShaped {
    tag: 'shaped',
    val: BedrockShapedRecipe,
  }
  /**
   * Sent by the server to send all crafting and smelting recipes available in the world.
   */
  export interface CCraftingData {
    /**
     * List of shaped and shapeless crafting recipes.
     */
    recipes: Array<BedrockRecipe>,
    /**
     * Whether previous recipe entries should be cleared on the client.
     */
    cleanRecipes: boolean,
  }
  export interface CreativeGroupInfoPayload {
    creativeCategory: CreativeCategory,
    name: string,
    groupIconItem: NetworkItemDescriptor,
  }
  export interface CreativeItemEntryPayload {
    id: number,
    item: NetworkItemDescriptor,
    groupIndex: number,
  }
  /**
   * Sent by the server to populate the creative inventory menu with item categories, groups, and items.
   */
  export interface CCreativeContent {
    /**
     * Creative tab groups with category icons and display names.
     */
    groups: Array<CreativeGroupInfoPayload>,
    /**
     * Individual creative item stack entries.
     */
    entries: Array<CreativeItemEntryPayload>,
  }
  /**
   * Wrapped network item stack including its network ID for slot tracking.
   */
  export interface ItemStackWrapper {
    /**
     * Item runtime ID.
     */
    id: number,
    /**
     * Stack count.
     */
    stackSize: number,
    /**
     * Auxiliary metadata or damage value.
     */
    auxValue: number,
    /**
     * Runtime block state identifier.
     */
    blockRuntimeId: number,
    /**
     * Item NBT data.
     */
    nbtData: NbtTree,
    /**
     * Allowed block placement filter.
     */
    placeOnBlocks: Array<string>,
    /**
     * Allowed block destruction filter.
     */
    destroyBlocks: Array<string>,
    /**
     * Shield blocking tick counter.
     */
    shieldBlockingTick: bigint,
    /**
     * Server-assigned unique network stack ID, if present.
     */
    netId?: number,
  }
  /**
   * Sent by the server to spawn a dropped item entity in the world.
   */
  export interface CAddItemActor {
    /**
     * Persistent unique entity ID of the dropped item entity.
     */
    targetActorId: bigint,
    /**
     * Runtime entity ID for the current session.
     */
    targetRuntimeId: bigint,
    /**
     * Item stack representation of the dropped item.
     */
    item: ItemStackWrapper,
    /**
     * World spawn coordinates.
     */
    position: [number, number, number],
    /**
     * Movement velocity vector.
     */
    velocity: [number, number, number],
    /**
     * Metadata dictionary for the item entity.
     */
    entityData: string,
    /**
     * Whether the item originated from fishing.
     */
    isFromFishing: boolean,
  }
  /**
   * Compact network item stack descriptor with unparsed raw extra data bytes.
   */
  export interface NetworkItemStackDescriptor {
    /**
     * Item runtime ID.
     */
    id: number,
    /**
     * Stack count.
     */
    stackSize: number,
    /**
     * Auxiliary metadata or damage value.
     */
    auxValue: number,
    /**
     * Runtime block state identifier.
     */
    blockRuntimeId: number,
    /**
     * Serialized user data buffer (NBT, filters).
     */
    extraData: Uint8Array,
    /**
     * Unique network stack ID.
     */
    netId?: number,
  }
  /**
   * Sent by the client to update the item held or equipped in a mob or player slot.
   */
  export interface SMobEquipment {
    /**
     * Runtime entity ID of the mob or player changing equipment.
     */
    entityRuntimeId: bigint,
    /**
     * Item descriptor being equipped.
     */
    item: NetworkItemStackDescriptor,
    /**
     * Slot index in the container.
     */
    slot: number,
    /**
     * Currently selected hotbar slot.
     */
    selectedSlot: number,
    /**
     * Container identifier (e.g. inventory or armor).
     */
    containerId: number,
  }
  /**
   * Sent by the server to spawn another player client-side into the world.
   */
  export interface CAddPlayer {
    /**
     * UUID of the player being spawned.
     */
    uuid: Uuid,
    /**
     * Player display username.
     */
    playerName: string,
    /**
     * Session-unique runtime entity ID for the player.
     */
    targetRuntimeId: bigint,
    /**
     * Platform-specific chat identifier string.
     */
    platformChatId: string,
    /**
     * Spawn coordinates in world space.
     */
    position: [number, number, number],
    /**
     * Initial movement velocity.
     */
    velocity: [number, number, number],
    /**
     * Pitch (x) and yaw (y) rotation angles.
     */
    rotation: [number, number],
    /**
     * Horizontal head yaw rotation angle.
     */
    yHeadRotation: number,
    /**
     * Item stack currently held in the main hand.
     */
    carriedItem: NetworkItemStackDescriptor,
    /**
     * Game mode of the player.
     */
    playerGameType: GameType,
    /**
     * Entity metadata flags and properties.
     */
    entityData: string,
    /**
     * Dynamic Molang property synchronization.
     */
    syncedProperties: PropertySyncData,
    /**
     * Permissions and ability layers for this player.
     */
    abilitiesData: SerializedAbilitiesData,
    /**
     * Vehicle and attachment links.
     */
    actorLinks: Array<ActorLink>,
    /**
     * Unique device ID of the client device.
     */
    deviceId: string,
    /**
     * Operating system platform of the player.
     */
    buildPlatform: BuildPlatform,
  }
  /**
   * Sent by the server to show the item equipped or held by a mob or other player.
   */
  export interface CMobEquipment {
    /**
     * Runtime entity ID of the equipped actor.
     */
    targetRuntimeId: bigint,
    /**
     * Item descriptor for the equipped item stack.
     */
    item: NetworkItemStackDescriptor,
    /**
     * Slot index within the container.
     */
    slot: number,
    /**
     * Currently selected hotbar slot.
     */
    selectedSlot: number,
    /**
     * Container identifier (e.g. inventory or armor).
     */
    containerId: number,
  }
  /**
   * Identifies the container or inventory screen segment referenced by an item stack request.
   * # Variants
   * 
   * ## `"anvil-input"`
   * 
   * ## `"anvil-material"`
   * 
   * ## `"anvil-result-preview"`
   * 
   * ## `"smithing-table-input"`
   * 
   * ## `"smithing-table-material"`
   * 
   * ## `"smithing-table-result-preview"`
   * 
   * ## `"armor"`
   * 
   * ## `"level-entity"`
   * 
   * ## `"beacon-payment"`
   * 
   * ## `"brewing-stand-input"`
   * 
   * ## `"brewing-stand-result"`
   * 
   * ## `"brewing-stand-fuel"`
   * 
   * ## `"combined-hot-bar-and-inventory"`
   * 
   * ## `"crafting-input"`
   * 
   * ## `"crafting-output-preview"`
   * 
   * ## `"recipe-construction"`
   * 
   * ## `"recipe-nature"`
   * 
   * ## `"recipe-items"`
   * 
   * ## `"recipe-search"`
   * 
   * ## `"recipe-search-bar"`
   * 
   * ## `"recipe-equipment"`
   * 
   * ## `"recipe-book"`
   * 
   * ## `"enchanting-input"`
   * 
   * ## `"enchanting-material"`
   * 
   * ## `"furnace-fuel"`
   * 
   * ## `"furnace-ingredient"`
   * 
   * ## `"furnace-result"`
   * 
   * ## `"horse-equip"`
   * 
   * ## `"hot-bar"`
   * 
   * ## `"inventory"`
   * 
   * ## `"shulker-box"`
   * 
   * ## `"trade-ingredient1"`
   * 
   * ## `"trade-ingredient2"`
   * 
   * ## `"trade-result-preview"`
   * 
   * ## `"offhand"`
   * 
   * ## `"compound-creator-input"`
   * 
   * ## `"compound-creator-output-preview"`
   * 
   * ## `"element-constructor-output-preview"`
   * 
   * ## `"material-reducer-input"`
   * 
   * ## `"material-reducer-output"`
   * 
   * ## `"lab-table-input"`
   * 
   * ## `"loom-input"`
   * 
   * ## `"loom-dye"`
   * 
   * ## `"loom-material"`
   * 
   * ## `"loom-result-preview"`
   * 
   * ## `"blast-furnace-ingredient"`
   * 
   * ## `"smoker-ingredient"`
   * 
   * ## `"trade2-ingredient1"`
   * 
   * ## `"trade2-ingredient2"`
   * 
   * ## `"trade2-result-preview"`
   * 
   * ## `"grindstone-input"`
   * 
   * ## `"grindstone-additional"`
   * 
   * ## `"grindstone-result-preview"`
   * 
   * ## `"stonecutter-input"`
   * 
   * ## `"stonecutter-result-preview"`
   * 
   * ## `"cartography-input"`
   * 
   * ## `"cartography-additional"`
   * 
   * ## `"cartography-result-preview"`
   * 
   * ## `"barrel"`
   * 
   * ## `"cursor"`
   * 
   * ## `"created-output"`
   * 
   * ## `"smithing-table-template"`
   * 
   * ## `"crafter-level-entity"`
   * 
   * ## `"dynamic"`
   * 
   * ## `"recipe-food"`
   * 
   * ## `"recipe-blocks"`
   * 
   * ## `"recipe-furnace-items"`
   */
  export type ContainerName = 'anvil-input' | 'anvil-material' | 'anvil-result-preview' | 'smithing-table-input' | 'smithing-table-material' | 'smithing-table-result-preview' | 'armor' | 'level-entity' | 'beacon-payment' | 'brewing-stand-input' | 'brewing-stand-result' | 'brewing-stand-fuel' | 'combined-hot-bar-and-inventory' | 'crafting-input' | 'crafting-output-preview' | 'recipe-construction' | 'recipe-nature' | 'recipe-items' | 'recipe-search' | 'recipe-search-bar' | 'recipe-equipment' | 'recipe-book' | 'enchanting-input' | 'enchanting-material' | 'furnace-fuel' | 'furnace-ingredient' | 'furnace-result' | 'horse-equip' | 'hot-bar' | 'inventory' | 'shulker-box' | 'trade-ingredient1' | 'trade-ingredient2' | 'trade-result-preview' | 'offhand' | 'compound-creator-input' | 'compound-creator-output-preview' | 'element-constructor-output-preview' | 'material-reducer-input' | 'material-reducer-output' | 'lab-table-input' | 'loom-input' | 'loom-dye' | 'loom-material' | 'loom-result-preview' | 'blast-furnace-ingredient' | 'smoker-ingredient' | 'trade2-ingredient1' | 'trade2-ingredient2' | 'trade2-result-preview' | 'grindstone-input' | 'grindstone-additional' | 'grindstone-result-preview' | 'stonecutter-input' | 'stonecutter-result-preview' | 'cartography-input' | 'cartography-additional' | 'cartography-result-preview' | 'barrel' | 'cursor' | 'created-output' | 'smithing-table-template' | 'crafter-level-entity' | 'dynamic' | 'recipe-food' | 'recipe-blocks' | 'recipe-furnace-items';
  /**
   * Container identifier paired with an optional dynamic session ID for complex inventories.
   */
  export interface FullContainerName {
    /**
     * Specific container slot category.
     */
    containerName: ContainerName,
    /**
     * Dynamic ID assigned to temporary containers (e.g. trading or crafting).
     */
    dynamicId?: number,
  }
  export interface ItemStackRequestSlotInfo {
    containerName: FullContainerName,
    slotId: number,
    stackId: number,
  }
  export interface ItemStackRequestActionTake {
    count: number,
    source: ItemStackRequestSlotInfo,
    destination: ItemStackRequestSlotInfo,
  }
  export interface ItemStackRequestActionPlace {
    count: number,
    source: ItemStackRequestSlotInfo,
    destination: ItemStackRequestSlotInfo,
  }
  export interface ItemStackRequestActionSwap {
    slot1: ItemStackRequestSlotInfo,
    slot2: ItemStackRequestSlotInfo,
  }
  export interface ItemStackRequestActionDrop {
    count: number,
    source: ItemStackRequestSlotInfo,
    randomly: boolean,
  }
  export interface ItemStackRequestActionDestroy {
    count: number,
    source: ItemStackRequestSlotInfo,
  }
  export interface ItemStackRequestActionConsume {
    count: number,
    source: ItemStackRequestSlotInfo,
  }
  export type ItemStackRequestAction = ItemStackRequestActionTake | ItemStackRequestActionPlace | ItemStackRequestActionSwap | ItemStackRequestActionDrop | ItemStackRequestActionDestroy | ItemStackRequestActionConsume | ItemStackRequestActionCreate | ItemStackRequestActionLabTableCombine | ItemStackRequestActionBeaconPayment | ItemStackRequestActionMineBlock | ItemStackRequestActionCraftRecipe | ItemStackRequestActionCraftRecipeAuto | ItemStackRequestActionCraftCreative | ItemStackRequestActionOptional | ItemStackRequestActionGrindstone | ItemStackRequestActionLoom | ItemStackRequestActionCraftNonImplemented | ItemStackRequestActionCraftResultsDeprecated;
  export interface ItemStackRequestActionTake {
    tag: 'take',
    val: ItemStackRequestActionTake,
  }
  export interface ItemStackRequestActionPlace {
    tag: 'place',
    val: ItemStackRequestActionPlace,
  }
  export interface ItemStackRequestActionSwap {
    tag: 'swap',
    val: ItemStackRequestActionSwap,
  }
  export interface ItemStackRequestActionDrop {
    tag: 'drop',
    val: ItemStackRequestActionDrop,
  }
  export interface ItemStackRequestActionDestroy {
    tag: 'destroy',
    val: ItemStackRequestActionDestroy,
  }
  export interface ItemStackRequestActionConsume {
    tag: 'consume',
    val: ItemStackRequestActionConsume,
  }
  export interface ItemStackRequestActionCreate {
    tag: 'create',
    val: ItemStackRequestActionCreate,
  }
  export interface ItemStackRequestActionLabTableCombine {
    tag: 'lab-table-combine',
  }
  export interface ItemStackRequestActionBeaconPayment {
    tag: 'beacon-payment',
    val: ItemStackRequestActionBeaconPayment,
  }
  export interface ItemStackRequestActionMineBlock {
    tag: 'mine-block',
    val: ItemStackRequestActionMineBlock,
  }
  export interface ItemStackRequestActionCraftRecipe {
    tag: 'craft-recipe',
    val: ItemStackRequestActionCraftRecipe,
  }
  export interface ItemStackRequestActionCraftRecipeAuto {
    tag: 'craft-recipe-auto',
    val: ItemStackRequestActionCraftRecipeAuto,
  }
  export interface ItemStackRequestActionCraftCreative {
    tag: 'craft-creative',
    val: ItemStackRequestActionCraftCreative,
  }
  export interface ItemStackRequestActionOptional {
    tag: 'optional',
    val: ItemStackRequestActionOptional,
  }
  export interface ItemStackRequestActionGrindstone {
    tag: 'grindstone',
    val: ItemStackRequestActionGrindstone,
  }
  export interface ItemStackRequestActionLoom {
    tag: 'loom',
    val: ItemStackRequestActionLoom,
  }
  export interface ItemStackRequestActionCraftNonImplemented {
    tag: 'craft-non-implemented',
  }
  export interface ItemStackRequestActionCraftResultsDeprecated {
    tag: 'craft-results-deprecated',
    val: ItemStackRequestActionCraftResultsDeprecated,
  }
  /**
   * An individual inventory request containing slot manipulation actions.
   */
  export interface ItemStackRequest {
    /**
     * Client-assigned sequence ID identifying this request for response correlation.
     */
    requestId: number,
    /**
     * Ordered actions that modify inventory slots (take, place, swap, craft, etc.).
     */
    actions: Array<ItemStackRequestAction>,
    /**
     * Filter strings for text filtering when renaming items.
     */
    filterStrings: Array<string>,
    /**
     * Reason code for profanity or server filtering checks.
     */
    filterCause: number,
  }
  /**
   * A batch of item stack requests sent by the client to manipulate inventory slots.
   */
  export interface SItemStackRequest {
    /**
     * List of item stack requests to execute sequentially.
     */
    requests: Array<ItemStackRequest>,
  }
  /**
   * Sent by the client every tick to transmit player movement, view orientation, and input state under server authoritative movement.
   */
  export interface SPlayerAuthInput {
    /**
     * Pitch rotation angle in degrees.
     */
    pitch: number,
    /**
     * Yaw rotation angle in degrees.
     */
    yaw: number,
    /**
     * Absolute player position in world space.
     */
    position: [number, number, number],
    /**
     * Movement vector created from directional input controls (WASD / analog stick).
     */
    moveVec: [number, number],
    /**
     * Horizontal head yaw rotation angle in degrees.
     */
    headYaw: number,
    /**
     * Bitset of active input flags for the current tick.
     */
    inputData: BigInt64Array,
    /**
     * Input device mode used by the client (mouse, touch, gamepad).
     */
    inputMode: number,
    /**
     * Client play mode (screen, VR, etc.).
     */
    playMode: number,
    /**
     * Touch or crosshair interaction model.
     */
    interactionModel: number,
    /**
     * Pitch angle when an interaction occurred.
     */
    interactPitch: number,
    /**
     * Yaw angle when an interaction occurred.
     */
    interactYaw: number,
    /**
     * Client world simulation tick number.
     */
    tick: bigint,
    /**
     * Positional delta since the previous input tick.
     */
    delta: [number, number, number],
    /**
     * Optional block destruction or interaction actions executed during this tick.
     */
    blockActions?: Array<PlayerBlockAction>,
    /**
     * Optional item use action performed during this tick.
     */
    itemInteraction?: PlayerInventoryAction,
    /**
     * Optional item stack request embedded into the movement tick.
     */
    itemStackRequest?: ItemStackRequest,
    /**
     * Predicted vehicle rotation if riding an entity.
     */
    vehicleRotation?: [number, number],
    /**
     * Unique entity ID of the ridden vehicle.
     */
    vehicleUniqueId?: bigint,
    /**
     * Analog movement stick input values.
     */
    analogMove: [number, number],
    /**
     * Camera orientation vector for camera-relative movement.
     */
    cameraOrientation: [number, number, number],
    /**
     * Unclamped raw movement input vector.
     */
    rawMove: [number, number],
  }
  /**
   * Sent by the server to synchronize the entire contents of an inventory or container window.
   */
  export interface CInventoryContent {
    /**
     * Window ID of the container being populated.
     */
    containerId: number,
    /**
     * Array of item stacks filling every slot of the container.
     */
    slots: Array<NetworkItemStackDescriptor>,
    /**
     * Full container name descriptor with dynamic session ID.
     */
    fullContainerName: FullContainerName,
    /**
     * Storage item descriptor (e.g. shulker box item if inspecting inside a shulker).
     */
    storageItem: NetworkItemStackDescriptor,
  }
  /**
   * Sent by the server to update a single item slot within an open inventory container.
   */
  export interface CInventorySlot {
    /**
     * Window ID of the container being updated.
     */
    containerId: number,
    /**
     * Slot index within the container.
     */
    slot: number,
    /**
     * Optional full container descriptor.
     */
    fullContainerName?: FullContainerName,
    /**
     * Optional storage item descriptor.
     */
    storageItem?: NetworkItemStackDescriptor,
    /**
     * New item stack descriptor placed into the slot.
     */
    item: NetworkItemStackDescriptor,
  }
  export interface ItemStackResponseContainerInfo {
    fullContainerName: FullContainerName,
    slots: Array<ItemStackResponseSlotInfo>,
  }
  /**
   * Status result and slot updates for an individual item stack request.
   */
  export interface ItemStackResponseInfo {
    /**
     * Status code of the response (`0` = Success, `1` = Error).
     */
    result: number,
    /**
     * Request ID matching the client's `ItemStackRequest`.
     */
    clientRequestId: number,
    /**
     * Container slot updates applied as a consequence of the request.
     */
    containers: Array<ItemStackResponseContainerInfo>,
  }
  /**
   * Sent by the server to approve or reject item stack requests and sync modified slots.
   */
  export interface CItemStackResponse {
    /**
     * List of response statuses corresponding to client requests.
     */
    responses: Array<ItemStackResponseInfo>,
  }
  /**
   * Compact representation of an item stack in network transactions with raw extra data bytes.
   */
  export interface NetworkItemStack {
    /**
     * Runtime item ID.
     */
    id: number,
    /**
     * Stack count.
     */
    count: number,
    /**
     * Auxiliary metadata or damage value.
     */
    auxValue: number,
    /**
     * Runtime block state identifier.
     */
    blockRuntimeId: number,
    /**
     * Raw unparsed extra user data buffer.
     */
    extraData: Uint8Array,
  }
  export type ServerboundPacket = ServerboundPacketSActorEvent | ServerboundPacketSAnimate | ServerboundPacketSBlockPickRequest | ServerboundPacketSClientCacheBlobStatus | ServerboundPacketSClientCacheStatus | ServerboundPacketSCommandRequest | ServerboundPacketSContainerClose | ServerboundPacketSEmote | ServerboundPacketSEmoteList | ServerboundPacketSInteract | ServerboundPacketSInventoryTransaction | ServerboundPacketSItemStackRequest | ServerboundPacketSLoadingScreen | ServerboundPacketSLogin | ServerboundPacketSMobEquipment | ServerboundPacketSModalFormResponse | ServerboundPacketSPacketViolationWarning | ServerboundPacketSPlayerAction | ServerboundPacketSPlayerAuthInput | ServerboundPacketSPlayerHotbar | ServerboundPacketSRequestAbility | ServerboundPacketSRequestChunkRadius | ServerboundPacketSRequestNetworkSettings | ServerboundPacketSResourcePackClientResponse | ServerboundPacketSRespawn | ServerboundPacketSSetLocalPlayerAsInitialized | ServerboundPacketSSetPlayerInventoryOptions | ServerboundPacketSText | ServerboundPacketUnknown;
  /**
   * Transmits actor-specific animations, sounds, and state changes (such as hurt, taming, or eating).
   */
  export interface ServerboundPacketSActorEvent {
    tag: 's-actor-event',
    val: SActorEvent,
  }
  /**
   * Plays animations (arm swing, critical strike particles, waking up) on an actor.
   */
  export interface ServerboundPacketSAnimate {
    tag: 's-animate',
    val: SAnimate,
  }
  /**
   * Sent by the client when picking a targeted block (middle-click / pick block action).
   */
  export interface ServerboundPacketSBlockPickRequest {
    tag: 's-block-pick-request',
    val: SBlockPickRequest,
  }
  /**
   * Sent by the client to report cache hits and misses for chunk blobs requested by the server.
   */
  export interface ServerboundPacketSClientCacheBlobStatus {
    tag: 's-client-cache-blob-status',
    val: SClientCacheBlobStatus,
  }
  /**
   * Sent by the client during login to inform the server whether client-side chunk blob caching is supported.
   */
  export interface ServerboundPacketSClientCacheStatus {
    tag: 's-client-cache-status',
    val: SClientCacheStatus,
  }
  /**
   * Sent by the client to request server-side execution of a slash command.
   */
  export interface ServerboundPacketSCommandRequest {
    tag: 's-command-request',
    val: SCommandRequest,
  }
  /**
   * Sent by either client or server to close an open container inventory window.
   */
  export interface ServerboundPacketSContainerClose {
    tag: 's-container-close',
    val: SContainerClose,
  }
  /**
   * Transmits player emote animations to the server and broadcasts them to nearby players.
   */
  export interface ServerboundPacketSEmote {
    tag: 's-emote',
    val: SEmote,
  }
  /**
   * Sent by the client to provide the server with a list of all emotes unlocked and equipped by the player.
   */
  export interface ServerboundPacketSEmoteList {
    tag: 's-emote-list',
    val: SEmoteList,
  }
  /**
   * Sent by the client when interacting with an entity (mounting, NPC dialogue, opening inventory).
   */
  export interface ServerboundPacketSInteract {
    tag: 's-interact',
    val: SInteract,
  }
  /**
   * Sent by the client when performing complex inventory interactions, item usages, and entity attacks.
   */
  export interface ServerboundPacketSInventoryTransaction {
    tag: 's-inventory-transaction',
    val: SInventoryTransaction,
  }
  /**
   * A batch of item stack requests sent by the client to manipulate inventory slots.
   */
  export interface ServerboundPacketSItemStackRequest {
    tag: 's-item-stack-request',
    val: SItemStackRequest,
  }
  /**
   * Sent by the client to update the server on client-side loading screen transitions.
   */
  export interface ServerboundPacketSLoadingScreen {
    tag: 's-loading-screen',
    val: SLoadingScreen,
  }
  /**
   * Sent by the client to initiate the login handshake, containing authentication tokens and device information.
   */
  export interface ServerboundPacketSLogin {
    tag: 's-login',
    val: SLogin,
  }
  /**
   * Sent by the client to update the item held or equipped in a mob or player slot.
   */
  export interface ServerboundPacketSMobEquipment {
    tag: 's-mob-equipment',
    val: SMobEquipment,
  }
  /**
   * Sent by the client in response to a server-sent modal form dialog.
   */
  export interface ServerboundPacketSModalFormResponse {
    tag: 's-modal-form-response',
    val: SModalFormResponse,
  }
  /**
   * Sent by the client to report malformed or unexpected packets received from the server.
   */
  export interface ServerboundPacketSPacketViolationWarning {
    tag: 's-packet-violation-warning',
    val: SPacketViolationWarning,
  }
  /**
   * Sent by the client when performing player actions such as mining, sprinting, sneaking, or dimensions changes.
   */
  export interface ServerboundPacketSPlayerAction {
    tag: 's-player-action',
    val: SPlayerAction,
  }
  /**
   * Sent by the client every tick to transmit player movement, view orientation, and input state under server authoritative movement.
   */
  export interface ServerboundPacketSPlayerAuthInput {
    tag: 's-player-auth-input',
    val: SPlayerAuthInput,
  }
  /**
   * Sent by the Bedrock client when the player changes their active hotbar slot.
   */
  export interface ServerboundPacketSPlayerHotbar {
    tag: 's-player-hotbar',
    val: SPlayerHotbar,
  }
  /**
   * Sent by the client to request permission to modify a player ability (such as flying).
   */
  export interface ServerboundPacketSRequestAbility {
    tag: 's-request-ability',
    val: SRequestAbility,
  }
  /**
   * Sent by the client to request a specific chunk render distance from the server.
   */
  export interface ServerboundPacketSRequestChunkRadius {
    tag: 's-request-chunk-radius',
    val: SRequestChunkRadius,
  }
  /**
   * Sent by the client to query network settings (such as compression algorithms and thresholds) from the server.
   */
  export interface ServerboundPacketSRequestNetworkSettings {
    tag: 's-request-network-settings',
    val: SRequestNetworkSettings,
  }
  /**
   * Sent by the client during resource pack negotiation to acknowledge packs or request downloads.
   */
  export interface ServerboundPacketSResourcePackClientResponse {
    tag: 's-resource-pack-client-response',
    val: SResourcePackClientResponse,
  }
  /**
   * Bidirectional packet managing player respawning and client spawn readiness.
   */
  export interface ServerboundPacketSRespawn {
    tag: 's-respawn',
    val: SRespawn,
  }
  /**
   * Sent by the client after receiving PlayStatus(PlayerSpawn) to signal that world initialization is complete.
   */
  export interface ServerboundPacketSSetLocalPlayerAsInitialized {
    tag: 's-set-local-player-as-initialized',
    val: SSetLocalPlayerAsInitialized,
  }
  /**
   * Sent by the client to sync inventory UI layout options and selected crafting tabs.
   */
  export interface ServerboundPacketSSetPlayerInventoryOptions {
    tag: 's-set-player-inventory-options',
    val: SSetPlayerInventoryOptions,
  }
  /**
   * Transmits in-game chat messages, system alerts, popups, and raw JSON text between client and server.
   */
  export interface ServerboundPacketSText {
    tag: 's-text',
    val: SText,
  }
  export interface ServerboundPacketUnknown {
    tag: 'unknown',
  }
  export type ClientboundPacket = ClientboundPacketCAddActor | ClientboundPacketCAddItemActor | ClientboundPacketCAddPlayer | ClientboundPacketCAvailableCommands | ClientboundPacketCBiomeDefinitionList | ClientboundPacketCBlockActorData | ClientboundPacketCBlockEvent | ClientboundPacketCBossEvent | ClientboundPacketCChangeDimension | ClientboundPacketCChunkRadiusUpdated | ClientboundPacketCClientCacheMissResponse | ClientboundPacketCContainerOpen | ClientboundPacketCCorrectPlayerMovePrediction | ClientboundPacketCCraftingData | ClientboundPacketCCreativeContent | ClientboundPacketCDisconnect | ClientboundPacketCGamerulesChanged | ClientboundPacketCInventoryContent | ClientboundPacketCInventorySlot | ClientboundPacketCItemRegistry | ClientboundPacketCItemStackResponse | ClientboundPacketCJigsawStructureData | ClientboundPacketCLevelEvent | ClientboundPacketCLevelSoundEvent | ClientboundPacketCMobEffect | ClientboundPacketCMobEquipment | ClientboundPacketCModalFormRequest | ClientboundPacketCMoveActorAbsolute | ClientboundPacketCMoveActorDelta | ClientboundPacketCMovePlayer | ClientboundPacketCNetworkChunkPublisherUpdate | ClientboundPacketCNetworkSettings | ClientboundPacketCPlayStatus | ClientboundPacketCPlayerHotbar | ClientboundPacketCPlayerList | ClientboundPacketCRemoveActor | ClientboundPacketCRemoveObjective | ClientboundPacketCResourcePackStackPacket | ClientboundPacketCResourcePacksInfo | ClientboundPacketCSetActorData | ClientboundPacketCSetActorLink | ClientboundPacketCSetActorMotion | ClientboundPacketCSetDifficulty | ClientboundPacketCSetDisplayObjective | ClientboundPacketCSetHealth | ClientboundPacketCSetPlayerGameType | ClientboundPacketCSetScore | ClientboundPacketCSetSpawnPosition | ClientboundPacketCSetTime | ClientboundPacketCSetTitle | ClientboundPacketCShowCredits | ClientboundPacketCStartGame | ClientboundPacketCTakeItemActor | ClientboundPacketCTransfer | ClientboundPacketCUpdateAbilities | ClientboundPacketCUpdateAttributes | ClientboundPacketCUpdateBlock | ClientboundPacketCUpdateTrade | ClientboundPacketCVoxelShapes | ClientboundPacketUnknown;
  /**
   * Sent by the server to spawn non-player entities (mobs, projectiles, vehicles, items) on the client.
   */
  export interface ClientboundPacketCAddActor {
    tag: 'c-add-actor',
    val: CAddActor,
  }
  /**
   * Sent by the server to spawn a dropped item entity in the world.
   */
  export interface ClientboundPacketCAddItemActor {
    tag: 'c-add-item-actor',
    val: CAddItemActor,
  }
  /**
   * Sent by the server to spawn another player client-side into the world.
   */
  export interface ClientboundPacketCAddPlayer {
    tag: 'c-add-player',
    val: CAddPlayer,
  }
  /**
   * Advertises available console and chat commands, arguments, overloads, and auto-completion structures.
   */
  export interface ClientboundPacketCAvailableCommands {
    tag: 'c-available-commands',
    val: CAvailableCommands,
  }
  /**
   * Sent by the server to synchronize all available biome definitions and properties with the client.
   */
  export interface ClientboundPacketCBiomeDefinitionList {
    tag: 'c-biome-definition-list',
  }
  /**
   * Synchronizes the complete block-actor data for a block position.
   */
  export interface ClientboundPacketCBlockActorData {
    tag: 'c-block-actor-data',
    val: CBlockActorData,
  }
  /**
   * Updates a client-side block animation, such as a chest lid opening or closing.
   */
  export interface ClientboundPacketCBlockEvent {
    tag: 'c-block-event',
    val: CBlockEvent,
  }
  /**
   * Sent by the server to make a specific 'boss event' occur in the world.
   * 
   * Packet ID: `74`
   */
  export interface ClientboundPacketCBossEvent {
    tag: 'c-boss-event',
    val: CBossEvent,
  }
  /**
   * Transitions the player to a different dimension with a loading screen.
   */
  export interface ClientboundPacketCChangeDimension {
    tag: 'c-change-dimension',
    val: CChangeDimension,
  }
  /**
   * Sent by the server in response to [`SRequestChunkRadius`](crate::bedrock::server::request_chunk_radius::SRequestChunkRadius) to confirm the approved chunk render distance.
   */
  export interface ClientboundPacketCChunkRadiusUpdated {
    tag: 'c-chunk-radius-updated',
    val: CChunkRadiusUpdated,
  }
  /**
   * Sent by the server in response to [`SClientCacheBlobStatus`](crate::bedrock::server::client_cache_blob_status::SClientCacheBlobStatus) with requested chunk blobs.
   */
  export interface ClientboundPacketCClientCacheMissResponse {
    tag: 'c-client-cache-miss-response',
    val: CClientCacheMissResponse,
  }
  /**
   * Sent by the server to open an inventory container screen (chest, furnace, anvil) on the client.
   */
  export interface ClientboundPacketCContainerOpen {
    tag: 'c-container-open',
    val: CContainerOpen,
  }
  /**
   * Sent by the server to correct the client's predicted movement under server authoritative movement.
   */
  export interface ClientboundPacketCCorrectPlayerMovePrediction {
    tag: 'c-correct-player-move-prediction',
    val: CCorrectPlayerMovePrediction,
  }
  /**
   * Sent by the server to send all crafting and smelting recipes available in the world.
   */
  export interface ClientboundPacketCCraftingData {
    tag: 'c-crafting-data',
    val: CCraftingData,
  }
  /**
   * Sent by the server to populate the creative inventory menu with item categories, groups, and items.
   */
  export interface ClientboundPacketCCreativeContent {
    tag: 'c-creative-content',
    val: CCreativeContent,
  }
  /**
   * Sent by the server to cleanly disconnect a client with an optional error code and kick message.
   */
  export interface ClientboundPacketCDisconnect {
    tag: 'c-disconnect',
    val: CDisconnect,
  }
  /**
   * Sent by the server to update gamerules on the client (e.g. `showcoordinates` or `dodaylightcycle`).
   */
  export interface ClientboundPacketCGamerulesChanged {
    tag: 'c-gamerules-changed',
    val: CGamerulesChanged,
  }
  /**
   * Sent by the server to synchronize the entire contents of an inventory or container window.
   */
  export interface ClientboundPacketCInventoryContent {
    tag: 'c-inventory-content',
    val: CInventoryContent,
  }
  /**
   * Sent by the server to update a single item slot within an open inventory container.
   */
  export interface ClientboundPacketCInventorySlot {
    tag: 'c-inventory-slot',
    val: CInventorySlot,
  }
  /**
   * Sent by the server to register custom and vanilla item identifiers with their component definitions.
   */
  export interface ClientboundPacketCItemRegistry {
    tag: 'c-item-registry',
    val: CItemRegistry,
  }
  /**
   * Sent by the server to approve or reject item stack requests and sync modified slots.
   */
  export interface ClientboundPacketCItemStackResponse {
    tag: 'c-item-stack-response',
    val: CItemStackResponse,
  }
  /**
   * Transmits server-defined jigsaw structure generation rules, processors, and template pools.
   */
  export interface ClientboundPacketCJigsawStructureData {
    tag: 'c-jigsaw-structure-data',
  }
  /**
   * Broadcasts visual or auditory level-wide events, such as particles or block breaking.
   */
  export interface ClientboundPacketCLevelEvent {
    tag: 'c-level-event',
    val: CLevelEvent,
  }
  /**
   * Plays a sound effect at a designated world position or associated with an actor.
   */
  export interface ClientboundPacketCLevelSoundEvent {
    tag: 'c-level-sound-event',
    val: CLevelSoundEvent,
  }
  /**
   * Sent by the server to add, modify, or remove potion/status effects on an entity.
   */
  export interface ClientboundPacketCMobEffect {
    tag: 'c-mob-effect',
    val: CMobEffect,
  }
  /**
   * Sent by the server to show the item equipped or held by a mob or other player.
   */
  export interface ClientboundPacketCMobEquipment {
    tag: 'c-mob-equipment',
    val: CMobEquipment,
  }
  /**
   * Requests the client to open a server-defined UI form (modal dialog, list menu, or custom form).
   */
  export interface ClientboundPacketCModalFormRequest {
    tag: 'c-modal-form-request',
    val: CModalFormRequest,
  }
  /**
   * Sent by the server to update an entity's absolute position and rotation angles.
   */
  export interface ClientboundPacketCMoveActorAbsolute {
    tag: 'c-move-actor-absolute',
    val: CMoveActorAbsolute,
  }
  /**
   * Bandwidth-optimized delta movement packet for updating an entity's position and rotation.
   */
  export interface ClientboundPacketCMoveActorDelta {
    tag: 'c-move-actor-delta',
    val: CMoveActorDelta,
  }
  /**
   * Sent by the server to update a player's movement, teleport, or view angle.
   */
  export interface ClientboundPacketCMovePlayer {
    tag: 'c-move-player',
    val: CMovePlayer,
  }
  /**
   * Sent by the server to update the center anchor position and radius around which chunks remain loaded on the client.
   */
  export interface ClientboundPacketCNetworkChunkPublisherUpdate {
    tag: 'c-network-chunk-publisher-update',
    val: CNetworkChunkPublisherUpdate,
  }
  /**
   * Sent by the server in response to [`SRequestNetworkSettings`](crate::bedrock::server::request_network_settings::SRequestNetworkSettings) to configure packet compression and client throttling.
   */
  export interface ClientboundPacketCNetworkSettings {
    tag: 'c-network-settings',
    val: CNetworkSettings,
  }
  /**
   * Sent by the server to inform the client of login results, version compatibility, or player spawn readiness.
   */
  export interface ClientboundPacketCPlayStatus {
    tag: 'c-play-status',
    val: CPlayStatus,
  }
  /**
   * Sent by the server to update the active selected hotbar slot of the player.
   */
  export interface ClientboundPacketCPlayerHotbar {
    tag: 'c-player-hotbar',
    val: CPlayerHotbar,
  }
  /**
   * Sent by the server to add or remove players from the in-game pause screen player list.
   */
  export interface ClientboundPacketCPlayerList {
    tag: 'c-player-list',
    val: CPlayerList,
  }
  /**
   * Sent by the server to despawn an entity from the client's world.
   */
  export interface ClientboundPacketCRemoveActor {
    tag: 'c-remove-actor',
    val: CRemoveActor,
  }
  /**
   * Removes a scoreboard objective, hiding it from the player's screen.
   */
  export interface ClientboundPacketCRemoveObjective {
    tag: 'c-remove-objective',
    val: CRemoveObjective,
  }
  /**
   * Sent by the server to define the order in which resource and behavior packs are applied by the client.
   */
  export interface ClientboundPacketCResourcePackStackPacket {
    tag: 'c-resource-pack-stack-packet',
    val: CResourcePackStackPacket,
  }
  /**
   * Sent by the server to list all resource and behavior packs required or available to download.
   */
  export interface ClientboundPacketCResourcePacksInfo {
    tag: 'c-resource-packs-info',
    val: CResourcePacksInfo,
  }
  /**
   * Sent by the server to update metadata and Molang properties of an entity (e.g. name tags, fire, scale).
   */
  export interface ClientboundPacketCSetActorData {
    tag: 'c-set-actor-data',
    val: CSetActorData,
  }
  /**
   * Sent by the server to create, modify, or remove an attachment link between two entities (e.g. riding).
   */
  export interface ClientboundPacketCSetActorLink {
    tag: 'c-set-actor-link',
    val: CSetActorLink,
  }
  /**
   * Sent by the server to set the movement velocity of an entity (e.g. knockback or explosion velocity).
   */
  export interface ClientboundPacketCSetActorMotion {
    tag: 'c-set-actor-motion',
    val: CSetActorMotion,
  }
  /**
   * Synchronizes world difficulty level to the client.
   */
  export interface ClientboundPacketCSetDifficulty {
    tag: 'c-set-difficulty',
    val: CSetDifficulty,
  }
  /**
   * Configures and displays a scoreboard objective in a specific UI slot.
   */
  export interface ClientboundPacketCSetDisplayObjective {
    tag: 'c-set-display-objective',
    val: CSetDisplayObjective,
  }
  /**
   * Updates player health (legacy packet; attribute updates are typically preferred).
   */
  export interface ClientboundPacketCSetHealth {
    tag: 'c-set-health',
    val: CSetHealth,
  }
  /**
   * Updates the player's active game mode (e.g. Survival, Creative, Spectator).
   */
  export interface ClientboundPacketCSetPlayerGameType {
    tag: 'c-set-player-game-type',
    val: CSetPlayerGameType,
  }
  /**
   * Updates or removes scoreboard entries displayed to the client.
   */
  export interface ClientboundPacketCSetScore {
    tag: 'c-set-score',
    val: CSetScore,
  }
  /**
   * Updates the player or world spawn coordinates, affecting respawning and compass orientation.
   */
  export interface ClientboundPacketCSetSpawnPosition {
    tag: 'c-set-spawn-position',
    val: CSetSpawnPosition,
  }
  /**
   * Sent by the server to synchronize the day-night cycle time (in ticks) with the client.
   */
  export interface ClientboundPacketCSetTime {
    tag: 'c-set-time',
    val: CSetTime,
  }
  /**
   * Displays or controls on-screen titles, subtitles, or action bar notices.
   */
  export interface ClientboundPacketCSetTitle {
    tag: 'c-set-title',
    val: CSetTitle,
  }
  /**
   * Displays or dismisses the end-game rolling credits screen.
   */
  export interface ClientboundPacketCShowCredits {
    tag: 'c-show-credits',
    val: CShowCredits,
  }
  /**
   * Sent by the server to initialize the client's world, spawn coordinates, gamerules, and entity runtime ID.
   */
  export interface ClientboundPacketCStartGame {
    tag: 'c-start-game',
    val: CStartGame,
  }
  /**
   * Sent by the server when an entity or player picks up a dropped item, playing the pickup animation.
   */
  export interface ClientboundPacketCTakeItemActor {
    tag: 'c-take-item-actor',
    val: CTakeItemActor,
  }
  /**
   * Instructs the client to disconnect and reconnect to another server address and port.
   */
  export interface ClientboundPacketCTransfer {
    tag: 'c-transfer',
    val: CTransfer,
  }
  /**
   * Updates player movement and interaction abilities such as flight and build permissions.
   */
  export interface ClientboundPacketCUpdateAbilities {
    tag: 'c-update-abilities',
    val: CUpdateAbilities,
  }
  /**
   * Sent by the server to update an entity's attribute values (e.g. health, absorption, movement speed, hunger).
   */
  export interface ClientboundPacketCUpdateAttributes {
    tag: 'c-update-attributes',
    val: CUpdateAttributes,
  }
  /**
   * Updates a single block state client-side without retransmitting the entire chunk.
   */
  export interface ClientboundPacketCUpdateBlock {
    tag: 'c-update-block',
    val: CUpdateBlock,
  }
  /**
   * Opens or refreshes a Bedrock merchant screen with its complete offer list.
   */
  export interface ClientboundPacketCUpdateTrade {
    tag: 'c-update-trade',
    val: CUpdateTrade,
  }
  /**
   * Sends custom collision and selection voxel shapes to the client.
   */
  export interface ClientboundPacketCVoxelShapes {
    tag: 'c-voxel-shapes',
  }
  export interface ClientboundPacketUnknown {
    tag: 'unknown',
  }
}
