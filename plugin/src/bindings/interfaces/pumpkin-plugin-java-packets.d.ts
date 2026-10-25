/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-uuid.d.ts" />
declare module 'pumpkin:plugin/java-packets@0.1.0' {
  export type Uuid = import('pumpkin:plugin/uuid@0.1.0').Uuid;
  export type NbtTree = import('pumpkin:plugin/common@0.1.0').NbtTree;
  /**
   * Sent by the client to inform the server about its local settings
   */
  export interface ConfigSClientInformationConfig {
    /**
     * The language code used by the client (e.g., "`en_us`")
     */
    locale: string,
    /**
     * The maximum number of chunks the client renders
     */
    viewDistance: number,
    /**
     * Visibility of chat messages (0: Enabled, 1: Commands Only, 2: Hidden)
     */
    chatMode: number,
    /**
     * Whether the client wants chat colors/formatting rendered
     */
    chatColors: boolean,
    /**
     * Bitmask representing displayed skin parts (e.g., cape, jacket, sleeves)
     */
    skinParts: number,
    /**
     * The player's dominant hand (0: Left, 1: Right)
     */
    mainHand: number,
    /**
     * Whether the client wants text filtering (e.g., for profanity) enabled
     */
    textFiltering: boolean,
    /**
     * Whether the player should appear in the server's online player list
     */
    serverListing: boolean,
  }
  /**
   * Response to a `CCookieRequest` from the server during the configuration phase
   * 
   * Cookies allow servers to store small amounts of data on the client side,
   * which can be retrieved later (e.g., for session tracking or preferences)
   */
  export interface ConfigSConfigCookieResponse {
    /**
     * The unique identifier for the cookie being returned
     */
    key: string,
    /**
     * Indicates whether a payload is attached to this response
     */
    hasPayload: boolean,
    /**
     * The actual data stored in the cookie. Limited to 5120 bytes
     */
    payload?: Uint8Array,
  }
  export interface ConfigSCustomClickAction {
    actionId: string,
    payload?: Uint8Array,
  }
  export interface ConfigSKeepAlive {
    keepAliveId: bigint,
  }
  export interface ConfigSKnownPacks {
    knownPacks: Array<string>,
  }
  /**
   * A packet used for custom communication between the client and server.
   * 
   * This allows mods, plugins, or proxy
   * software to send proprietary data over the standard Minecraft protocol.
   */
  export interface ConfigSPluginMessage {
    /**
     * The name of the channel used to distinguish different types of messages.
     * Example: `minecraft:brand` or `velocity:main`.
     */
    channel: string,
    /**
     * The payload sent by the client.
     */
    data: Uint8Array,
  }
  export interface ConfigSConfigPong {
    id: number,
  }
  export type ResourcePackResponseResult = ResourcePackResponseResultDownloadSuccess | ResourcePackResponseResultDownloadFail | ResourcePackResponseResultDownloaded | ResourcePackResponseResultAccepted | ResourcePackResponseResultDeclined | ResourcePackResponseResultInvalidUrl | ResourcePackResponseResultReloadFailed | ResourcePackResponseResultDiscarded | ResourcePackResponseResultUnknown;
  export interface ResourcePackResponseResultDownloadSuccess {
    tag: 'download-success',
  }
  export interface ResourcePackResponseResultDownloadFail {
    tag: 'download-fail',
  }
  export interface ResourcePackResponseResultDownloaded {
    tag: 'downloaded',
  }
  export interface ResourcePackResponseResultAccepted {
    tag: 'accepted',
  }
  export interface ResourcePackResponseResultDeclined {
    tag: 'declined',
  }
  export interface ResourcePackResponseResultInvalidUrl {
    tag: 'invalid-url',
  }
  export interface ResourcePackResponseResultReloadFailed {
    tag: 'reload-failed',
  }
  export interface ResourcePackResponseResultDiscarded {
    tag: 'discarded',
  }
  export interface ResourcePackResponseResultUnknown {
    tag: 'unknown',
    val: number,
  }
  /**
   * Sent by the client to inform the server of the status of a requested resource pack.
   * 
   * This allows the server to know if the player is using the required textures
   * or if the download failed.
   */
  export interface ConfigSConfigResourcePack {
    /**
     * The unique identifier of the resource pack this response refers to.
     */
    uuid: Uuid,
    /**
     * The status code of the operation, mapped to [`ResourcePackResponseResult`].
     */
    result: number,
  }
  /**
   * Response to a `CCookieRequest` (login) from the server.
   * The Notchian server only accepts responses of up to 5 kiB in size.
   */
  export interface LoginSLoginCookieResponse {
    key: string,
    payload?: Uint8Array,
  }
  export interface SEncryptionResponse {
    sharedSecret: Uint8Array,
    verifyToken: Uint8Array,
  }
  export interface LoginSLoginStart {
    name: string,
    uuid: Uuid,
  }
  export interface LoginSLoginPluginResponse {
    messageId: number,
    data?: Uint8Array,
  }
  export interface SAttack {
    entityId: number,
  }
  export interface SBlockEntityTagQuery {
    transactionId: number,
    location: [number, number, number],
  }
  export interface SBundleItemSelected {
    slotId: number,
    selectedItemIndex: number,
  }
  export interface SChangeDifficulty {
    difficulty: string,
  }
  export interface SChangeGameMode {
    gameMode: string,
  }
  export interface SChatAck {
    offset: number,
  }
  export interface SChatCommand {
    command: string,
  }
  export interface ArgumentSignature {
    name: string,
    signature: Uint8Array,
  }
  export interface SChatCommandSigned {
    command: string,
    timestamp: bigint,
    salt: bigint,
    argumentSignatures: Array<ArgumentSignature>,
    messageCount: number,
    acknowledged: Uint8Array,
    checksum: number,
  }
  export interface SChatMessage {
    message: string,
    timestamp: bigint,
    salt: bigint,
    signature?: Uint8Array,
    messageCount: number,
    acknowledged: Uint8Array,
    checksum: number,
  }
  export interface SChunkBatch {
    chunksPerTick: number,
  }
  /**
   * # Variants
   * 
   * ## `"pickup"`
   * 
   * Performs a normal slot click. This can pick up or place items in the slot, possibly merging the cursor stack into the slot, or swapping the slot stack with the cursor stack if they can't be merged.
   * ## `"quick-move"`
   * 
   * Performs a shift-click. This usually quickly moves items between the player's inventory and the open screen handler.
   * ## `"swap"`
   * 
   * Exchanges items between a slot and a hotbar slot. This is usually triggered by the player pressing a 1-9 number key while hovering over a slot.
   * When the action type is swap, the click data is the hotbar slot to swap with (0-8).
   * ## `"clone"`
   * 
   * Clones the item in the slot. Usually triggered by middle clicking an item in creative mode.
   * ## `"throw"`
   * 
   * Throws the item out of the inventory. This is usually triggered by the player pressing Q while hovering over a slot, or clicking outside the window.
   * When the action type is throw, the click data determines whether to throw a whole stack (1) or a single item from that stack (0).
   * ## `"quick-craft"`
   * 
   * Drags items between multiple slots. This is usually triggered by the player clicking and dragging between slots.
   * This action happens in 3 stages. Stage 0 signals that the drag has begun, and stage 2 signals that the drag has ended. In between multiple stage 1s signal which slots were dragged on.
   * ## `"pickup-all"`
   * 
   * Replenishes the cursor stack with items from the screen handler. This is usually triggered by the player double clicking.
   */
  export type SlotActionType = 'pickup' | 'quick-move' | 'swap' | 'clone' | 'throw' | 'quick-craft' | 'pickup-all';
  export interface SClickSlot {
    syncId: number,
    revision: number,
    slot: number,
    button: number,
    mode: SlotActionType,
    lengthOfArray: number,
    arrayOfChangedSlots: Array<[number, string]>,
    carriedItem: string,
  }
  export interface SClientCommand {
    actionId: number,
  }
  export interface SClientInformationPlay {
    locale: string,
    viewDistance: number,
    chatMode: number,
    chatColors: boolean,
    skinParts: number,
    mainHand: number,
    textFiltering: boolean,
    serverListing: boolean,
  }
  export interface SCloseContainer {
    windowId: number,
  }
  export interface SCommandSuggestion {
    id: number,
    command: string,
  }
  export interface SConfirmTeleport {
    teleportId: number,
    position: [number, number, number],
    yaw: number,
    pitch: number,
  }
  export interface SContainerButtonClick {
    windowId: number,
    buttonId: number,
  }
  export interface SContainerSlotStateChanged {
    slotId: number,
    containerId: number,
    newState: boolean,
  }
  /**
   * Response to a `CCookieRequest` (play) from the server.
   * The Notchian (vanilla) server only accepts responses of up to 5 KiB in size.
   */
  export interface SCookieResponse {
    key: string,
    payload?: Uint8Array,
  }
  export interface SCustomClickAction {
    actionId: string,
    payload?: Uint8Array,
  }
  /**
   * A packet used for custom communication between the client and server.
   * 
   * This allows mods, plugins, or proxy software to send proprietary data over the standard
   * Minecraft protocol.
   */
  export interface SCustomPayload {
    /**
     * The name of the channel used to distinguish different types of messages.
     * Example: `minecraft:brand` or `voicechat:request_secret`.
     */
    channel: string,
    /**
     * The payload sent by the client.
     */
    data: Uint8Array,
  }
  export interface SDebugSampleSubscription {
    sampleType: number,
  }
  export interface SDebugSubscriptionRequest {
    sampleType: number,
  }
  export interface SEditBook {
    slot: number,
    pages: Array<string>,
    title?: string,
  }
  export interface SEntityTagQuery {
    transactionId: number,
    entityId: number,
  }
  export interface SInteract {
    entityId: number,
    rType: number,
    targetPosition?: [number, number, number],
    hand?: number,
    sneaking: boolean,
  }
  /**
   * # Variants
   * 
   * ## `"interact"`
   * 
   * ## `"attack"`
   * 
   * ## `"interact-at"`
   */
  export type ActionType = 'interact' | 'attack' | 'interact-at';
  export interface SJigsawGenerate {
    pos: [number, number, number],
    levels: number,
    keepJigsaws: boolean,
  }
  export interface SKeepAlive {
    keepAliveId: bigint,
  }
  export interface SLockDifficulty {
    locked: boolean,
  }
  export interface SMoveVehicle {
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    onGround: boolean,
  }
  export interface SPaddleBoat {
    leftPaddle: boolean,
    rightPaddle: boolean,
  }
  export interface SPickItemFromBlock {
    pos: [number, number, number],
    includeData: boolean,
  }
  export interface SPickItemFromEntity {
    id: number,
    includeData: boolean,
  }
  export interface SPlayPingRequest {
    payload: bigint,
  }
  export interface SPlaceRecipe {
    containerId: number,
    recipeDisplayId: number,
    useMaxItems: boolean,
  }
  export interface SPlayerAbilities {
    flags: number,
    flySpeed?: number,
    walkSpeed?: number,
  }
  export interface SPlayerAction {
    status: number,
    position: [number, number, number],
    face: number,
    sequence: number,
  }
  /**
   * # Variants
   * 
   * ## `"started-digging"`
   * 
   * Sent when the player starts digging a block. If the block was insta-mined or the player is in creative mode, the client will not send `Status` = `FinishedDigging``, and will assume the server completed the destruction. To detect this, it is necessary to calculate the block destruction speed server-side.
   * ## `"cancelled-digging"`
   * 
   * Sent when the player lets go of the Mine Block key (default: left click). Face is always set to -Y.
   * ## `"finished-digging"`
   * 
   * Sent when the client thinks it is finished.
   * ## `"drop-item-stack"`
   * 
   * Triggered by using the Drop Item key (default: Q) with the modifier to drop the entire selected stack (default: Control or Command, depending on OS). Location is always set to 0/0/0, Face is always set to -Y. Sequence is always set to 0.
   * ## `"drop-item"`
   * 
   * Triggered by using the Drop Item key (default: Q). Location is always set to 0/0/0, Face is always set to -Y. Sequence is always set to 0.
   * ## `"release-item-in-use"`
   * 
   * I didn't make that up
   * Indicates that the currently held item should have its state updated such as eating food, pulling back bows, using buckets, etc. Location is always set to 0/0/0, Face is always set to -Y. Sequence is always set to 0.
   * ## `"swap-item"`
   * 
   * Used to swap or assign an item to the second hand. Location is always set to 0/0/0, Face is always set to -Y. Sequence is always set to 0.
   * ## `"spear-jab"`
   * 
   * Sent when a player is holding a spear and performs a jab attack.
   * ## `"change-destroy-direction"`
   * 
   * Sent since 26.3 when the player keeps mining but looks at another face of the block.
   */
  export type Status = 'started-digging' | 'cancelled-digging' | 'finished-digging' | 'drop-item-stack' | 'drop-item' | 'release-item-in-use' | 'swap-item' | 'spear-jab' | 'change-destroy-direction';
  /**
   * # Variants
   * 
   * ## `"start-sneaking"`
   * 
   * ## `"stop-sneaking"`
   * 
   * ## `"leave-bed"`
   * 
   * ## `"start-sprinting"`
   * 
   * ## `"stop-sprinting"`
   * 
   * ## `"start-horse-jump"`
   * 
   * ## `"stop-horse-jump"`
   * 
   * ## `"open-vehicle-inventory"`
   * 
   * ## `"start-flying-elytra"`
   */
  export type Action = 'start-sneaking' | 'stop-sneaking' | 'leave-bed' | 'start-sprinting' | 'stop-sprinting' | 'start-horse-jump' | 'stop-horse-jump' | 'open-vehicle-inventory' | 'start-flying-elytra';
  export interface SPlayerCommand {
    entityId: number,
    action: Action,
    jumpBoost: number,
  }
  export interface SSetPlayerGround {
    onGround: boolean,
  }
  export interface SPlayerInput {
    input: number,
  }
  export interface SPlayerPosition {
    position: [number, number, number],
    /**
     * bit 0: [`FLAG_ON_GROUND`], bit 1: [`FLAG_IN_WALL`]
     */
    collision: number,
  }
  export interface SPlayerPositionRotation {
    position: [number, number, number],
    yaw: number,
    pitch: number,
    /**
     * bit 0: [`FLAG_ON_GROUND`], bit 1: [`FLAG_IN_WALL`]
     */
    collision: number,
  }
  export interface SPlayerRotation {
    yaw: number,
    pitch: number,
    ground: boolean,
  }
  export interface SPlayerSession {
    sessionId: Uuid,
    expiresAt: bigint,
    publicKey: Uint8Array,
    keySignature: Uint8Array,
  }
  export interface SPlayPong {
    id: number,
  }
  export interface SRecipeBookChangeSettings {
    bookType: number,
    isOpen: boolean,
    isFiltering: boolean,
  }
  export interface SRecipeBookSeenRecipe {
    recipeDisplayId: number,
  }
  export interface SRenameItem {
    itemName: string,
  }
  export type PlayResourcePackResult = PlayResourcePackResultDownloadSuccess | PlayResourcePackResultDeclined | PlayResourcePackResultDownloadFail | PlayResourcePackResultAccepted | PlayResourcePackResultDownloaded | PlayResourcePackResultInvalidUrl | PlayResourcePackResultReloadFailed | PlayResourcePackResultDiscarded | PlayResourcePackResultUnknown;
  export interface PlayResourcePackResultDownloadSuccess {
    tag: 'download-success',
  }
  export interface PlayResourcePackResultDeclined {
    tag: 'declined',
  }
  export interface PlayResourcePackResultDownloadFail {
    tag: 'download-fail',
  }
  export interface PlayResourcePackResultAccepted {
    tag: 'accepted',
  }
  export interface PlayResourcePackResultDownloaded {
    tag: 'downloaded',
  }
  export interface PlayResourcePackResultInvalidUrl {
    tag: 'invalid-url',
  }
  export interface PlayResourcePackResultReloadFailed {
    tag: 'reload-failed',
  }
  export interface PlayResourcePackResultDiscarded {
    tag: 'discarded',
  }
  export interface PlayResourcePackResultUnknown {
    tag: 'unknown',
    val: number,
  }
  export interface SPlayResourcePack {
    uuid: Uuid,
    result: number,
  }
  export type SSeenAdvancement = SSeenAdvancementOpenTab | SSeenAdvancementCloseTab;
  export interface SSeenAdvancementOpenTab {
    tag: 'open-tab',
    val: string,
  }
  export interface SSeenAdvancementCloseTab {
    tag: 'close-tab',
  }
  export interface SSelectTrade {
    selectedSlot: number,
  }
  export interface SSetBeacon {
    primaryEffect?: number,
    secondaryEffect?: number,
  }
  export interface SSetCommandBlock {
    pos: [number, number, number],
    command: string,
    mode: number,
    /**
     * Operation mode flags
     * - 0x01: Track output
     * - 0x02: Is conditional
     * - 0x04: Automatic
     */
    flags: number,
  }
  /**
   * # Variants
   * 
   * ## `"chain"`
   * 
   * ## `"repeating"`
   * 
   * ## `"impulse"`
   * 
   * Redstone only
   */
  export type CommandBlockMode = 'chain' | 'repeating' | 'impulse';
  export interface SSetCommandMinecart {
    entityId: number,
    command: string,
    trackOutput: boolean,
  }
  export interface SSetCreativeSlot {
    slot: number,
    clickedItem: string,
  }
  export interface GameRuleEntry {
    gameRuleKey: string,
    value: string,
  }
  export interface SSetGameRule {
    entries: Array<GameRuleEntry>,
  }
  export interface SSetHeldItem {
    slot: number,
  }
  export interface SSetJigsawBlock {
    pos: [number, number, number],
    name: string,
    target: string,
    pool: string,
    finalState: string,
    joint: string,
    selectionPriority: number,
    placementPriority: number,
  }
  export interface SSetStructureBlock {
    location: [number, number, number],
    action: number,
    mode: number,
    name: string,
    offsetX: number,
    offsetY: number,
    offsetZ: number,
    sizeX: number,
    sizeY: number,
    sizeZ: number,
    mirror: number,
    rotation: number,
    metadata: string,
    integrity: number,
    seed: bigint,
    flags: number,
  }
  /**
   * # Variants
   * 
   * ## `"start"`
   * 
   * ## `"log"`
   * 
   * ## `"fail"`
   * 
   * ## `"accept"`
   */
  export type TestBlockMode = 'start' | 'log' | 'fail' | 'accept';
  export interface SSetTestBlock {
    position: [number, number, number],
    mode: TestBlockMode,
    message: string,
  }
  export interface SSpectateEntity {
    /**
     * Vanilla `OPTIONAL_VAR_INT`: 0 for no target, otherwise the entity ID plus one.
     */
    target: number,
  }
  export interface SSwingArm {
    hand: number,
  }
  export interface STeleportToEntity {
    target: Uuid,
  }
  /**
   * # Variants
   * 
   * ## `"init"`
   * 
   * ## `"query"`
   * 
   * ## `"set"`
   * 
   * ## `"reset"`
   * 
   * ## `"save"`
   * 
   * ## `"export"`
   * 
   * ## `"run"`
   */
  export type TestInstanceBlockAction = 'init' | 'query' | 'set' | 'reset' | 'save' | 'export' | 'run';
  export interface VarIntVector3 {
    x: number,
    y: number,
    z: number,
  }
  /**
   * # Variants
   * 
   * ## `"cleared"`
   * 
   * ## `"running"`
   * 
   * ## `"success"`
   * 
   * ## `"failed"`
   */
  export type TestInstanceBlockStatus = 'cleared' | 'running' | 'success' | 'failed';
  export interface TestInstanceBlockData {
    test?: string,
    size: VarIntVector3,
    rotation: string,
    ignoreEntities: boolean,
    status: TestInstanceBlockStatus,
    errorMessage?: string,
  }
  export interface STestInstanceBlockAction {
    pos: [number, number, number],
    action: TestInstanceBlockAction,
    data: TestInstanceBlockData,
  }
  export interface SUpdateSign {
    location: [number, number, number],
    isFrontText: boolean,
    line1: string,
    line2: string,
    line3: string,
    line4: string,
  }
  export interface SUseItem {
    hand: number,
    sequence: number,
    yaw: number,
    pitch: number,
  }
  export interface SUseItemOn {
    hand: number,
    position: [number, number, number],
    face: number,
    cursorPos: [number, number, number],
    insideBlock: boolean,
    isAgainstWorldBorder: boolean,
    sequence: number,
  }
  /**
   * Sent by the client to measure the round-trip time (latency) to the server.
   * 
   * This is the second part of the Server List Ping (SLP) process
   * The server should respond with `CPingResponse`.
   */
  export interface StatusSStatusPingRequest {
    payload: bigint,
  }
  export interface ConfigCConfigAddResourcePack {
    uuid: Uuid,
    url: string,
    hash: string,
    forced: boolean,
    promptMessage?: string,
  }
  export interface ConfigCCodeOfConduct {
    codeOfConduct: string,
  }
  export interface ConfigCConfigDisconnect {
    reason: string,
  }
  /**
   * Requests a cookie that was previously stored.
   */
  export interface ConfigCCookieRequest {
    key: string,
  }
  export interface ConfigCConfigCustomReportDetails {
    details: Array<[string, string]>,
  }
  export interface ConfigCFeatureFlags {
    features: Array<string>,
  }
  export interface ConfigCKnownPacks {
    knownPacks: Array<string>,
  }
  export interface ConfigCConfigPing {
    id: number,
  }
  export interface ConfigCPluginMessage {
    channel: string,
    data: Uint8Array,
  }
  export interface ConfigCConfigPostEffects {
    effects: Array<string>,
  }
  /**
   * Added in 1.20.2
   */
  export interface ConfigCRegistryData {
    registryId: string,
    entries: Array<string>,
  }
  export interface ConfigCConfigRemoveResourcePack {
    uuid?: Uuid,
  }
  export interface ConfigCConfigServerLinks {
    links: Array<string>,
  }
  export interface ConfigCConfigShowDialog {
    dialog: string,
  }
  /**
   * Stores some arbitrary data on the client, which persists between server transfers.
   * The Notchian (vanilla) client only accepts cookies of up to 5 KiB in size.
   */
  export interface ConfigCStoreCookie {
    key: string,
    payload: Uint8Array,
  }
  export interface ConfigCTransfer {
    host: string,
    port: number,
  }
  export interface ConfigCUpdateTags {
    tags: Array<string>,
  }
  /**
   * Sent by the server to retrieve a previously stored cookie from the client.
   * 
   * This occurs during the login phase, allowing the server to identify
   * returning players or retrieve session data stored during a previous visit.
   */
  export interface LoginCLoginCookieRequest {
    /**
     * The unique identifier of the cookie being requested.
     */
    key: string,
  }
  /**
   * Sent by the server to initiate the encryption handshake.
   * 
   * This packet provides the client with the server's public key and a
   * verification token, allowing the client to generate a shared secret
   * for secure communication.
   */
  export interface CEncryptionRequest {
    /**
     * The server's ID string. In modern Minecraft, this is usually
     * an empty string unless the server is using legacy authentication.
     */
    serverId: string,
    /**
     * The server's DER-encoded RSA public key.
     */
    publicKey: Uint8Array,
    /**
     * A random bitstring used to verify that the client can correctly
     * encrypt data with the server's public key.
     */
    verifyToken: Uint8Array,
    /**
     * Indicates whether the server is in "online mode" and requires
     * Mojang authentication.
     */
    shouldAuthenticate: boolean,
  }
  /**
   * Sent by the server to reject a login attempt or kick a player during the login phase
   * 
   * This is used for reasons such as the server being full, the player being banned,
   * or version mismatches. After this packet is sent, the connection is closed.
   */
  export interface LoginCLoginDisconnect {
    /**
     * A JSON-encoded chat component explaining why the player was disconnected.
     */
    jsonReason: string,
  }
  /**
   * Sent by the server to initiate a custom plugin messaging exchange during login.
   * 
   * This is used by server software (like proxies or anti-cheats) to request
   * information from a client-side mod before the player officially joins.
   */
  export interface LoginCLoginPluginRequest {
    /**
     * A unique ID for this request. The client must include this same ID
     * in its response so the server can match them up.
     */
    messageId: number,
    /**
     * The name of the custom channel (e.g., "velocity:main").
     */
    channel: string,
    /**
     * The raw payload data. Unlike standard plugin messages, this data
     * is often serialized without a length prefix at the end of the packet.
     */
    data: Uint8Array,
  }
  /**
   * Sent by the server to enable network compression for all subsequent packets.
   * 
   * Once this packet is sent, both the server and the client must compress any
   * packet with a size equal to or greater than the specified threshold.
   */
  export interface LoginCSetCompression {
    /**
     * The packet size threshold (in bytes) at which compression is applied.
     * 
     * Packets smaller than this are sent uncompressed. A negative threshold
     * typically disables compression.
     */
    threshold: number,
  }
  /**
   * Sent by the server to acknowledge a sequence of block changes initiated by the client.
   * 
   * This packet is critical for preventing "ghost blocks" and synchronization issues.
   * It tells the client that the server has processed all actions up to a specific point.
   */
  export interface CAcknowledgeBlockChange {
    /**
     * The ID of the last sequence processed by the server.
     * 
     * The client increments this ID every time it starts a sequence of actions
     * (like breaking or placing a block), and the server must mirror it back
     * to confirm processing is complete.
     */
    sequenceId: number,
  }
  /**
   * Updates the text displayed above the player's hotbar (the Action Bar).
   * 
   * Unlike chat messages, Action Bar text is transient and generally used for
   * non-critical status information like "Now entering: Wilderness" or
   * mana/stamina counters.
   */
  export interface CActionBar {
    /**
     * The text component to be displayed.
     */
    actionBar: string,
  }
  export interface CAddResourcePack {
    uuid: Uuid,
    url: string,
    hash: string,
    forced: boolean,
    promptMessage?: string,
  }
  export interface Statistic {
    categoryId: number,
    statisticId: number,
    value: number,
  }
  export interface CAwardStats {
    stats: Array<Statistic>,
  }
  /**
   * Updates the visual "breaking" progress of a block for all clients.
   * 
   * This packet controls the overlay of cracks that appear on a block when
   * it is being mined. It is often used to show other players' mining progress.
   */
  export interface CSetBlockDestroyStage {
    /**
     * A unique ID for this destruction instance. Usually the miner's Entity ID.
     * If multiple entities mine the same block, they must use different IDs.
     */
    entityId: number,
    /**
     * The coordinates of the block being destroyed.
     */
    location: [number, number, number],
    /**
     * The destruction stage, typically a value from 0 to 9.
     * Any value outside 0-9 (like -1) will remove the destruction overlay.
     */
    destroyStage: number,
  }
  /**
   * Updates the NBT data of a block entity (e.g., signs, chests, or banners).
   * 
   * This packet is sent by the server when a block entity's state changes
   * (like text on a sign) or when the block entity is loaded into the client's view.
   */
  export interface CBlockEntityData {
    /**
     * The world coordinates of the block entity.
     */
    location: [number, number, number],
    /**
     * The type of block entity being updated (e.g., Mob Spawner, Command Block).
     */
    rType: number,
    /**
     * The raw NBT payload containing the block's specific data.
     */
    nbtData: Uint8Array,
  }
  /**
   * Triggers a physical block animation or sound effect.
   * 
   * This is used for simple block interactions that don't necessarily change
   * NBT data, such as chests opening/closing, pistons extending, or note blocks playing.
   */
  export interface CBlockEvent {
    /**
     * The coordinates where the event occurs.
     */
    location: [number, number, number],
    /**
     * The ID of the action to perform. Meaning varies by block type.
     */
    actionId: number,
    /**
     * A parameter for the action (e.g., note pitch or instrument).
     */
    actionParameter: number,
    /**
     * The block type ID (e.g., `minecraft:chest`).
     * Note: This is the block ID, not the state ID.
     */
    blockType: number,
  }
  /**
   * Updates a single block state at a specific location in the world.
   * 
   * This is the most common way to sync world changes to the client, such as
   * when a player places a block, a fluid flows, or a redstone component toggles.
   */
  export interface CBlockUpdate {
    /**
     * The world coordinates of the block being updated.
     */
    location: [number, number, number],
    /**
     * The new block state ID.
     */
    stateId: number,
  }
  export interface BosseventActionAdd {
    title: string,
    health: number,
    color: number,
    division: number,
    flags: number,
  }
  export interface BosseventActionUpdateStyle {
    color: number,
    dividers: number,
  }
  export type BosseventAction = BosseventActionAdd | BosseventActionRemove | BosseventActionUpdateHealth | BosseventActionUpdateTile | BosseventActionUpdateStyle | BosseventActionUpdateFlags;
  export interface BosseventActionAdd {
    tag: 'add',
    val: BosseventActionAdd,
  }
  export interface BosseventActionRemove {
    tag: 'remove',
  }
  export interface BosseventActionUpdateHealth {
    tag: 'update-health',
    val: number,
  }
  export interface BosseventActionUpdateTile {
    tag: 'update-tile',
    val: string,
  }
  export interface BosseventActionUpdateStyle {
    tag: 'update-style',
    val: BosseventActionUpdateStyle,
  }
  export interface BosseventActionUpdateFlags {
    tag: 'update-flags',
    val: number,
  }
  /**
   * Updates the "Boss Bar" displayed at the top of the player's screen.
   * 
   * This packet is used to manage health bars for entities like the Ender Dragon
   * or Wither, as well as custom progress bars for server events or raids.
   */
  export interface CBossEvent {
    /**
     * A unique identifier for this specific boss bar instance.
     */
    uuid: Uuid,
    /**
     * The action to perform (Add, Remove, Update Health, etc.).
     */
    action: BosseventAction,
  }
  /**
   * Updates the center of the player's loaded chunk radius (the "view center").
   * 
   * This packet tells the client which chunk coordinate it should use as the
   * focal point for loading and unloading chunks. It is typically sent when
   * a player moves across a chunk boundary.
   */
  export interface CCenterChunk {
    /**
     * The X coordinate of the center chunk.
     */
    chunkX: number,
    /**
     * The Z coordinate of the center chunk.
     */
    chunkZ: number,
  }
  /**
   * Notifies the client of a change in the world's difficulty level or lock status.
   * 
   * This updates the client's internal state, which affects certain UI elements
   * and client-side behavior (though actual game logic like mob damage is
   * primarily handled by the server).
   */
  export interface CChangeDifficulty {
    /**
     * The current difficulty level of the world.
     * 
     * * **0**: Peaceful
     * * **1**: Easy
     * * **2**: Normal
     * * **3**: Hard
     */
    difficulty: number,
    /**
     * Whether the difficulty is locked (Added in 1.14). If true, the client's difficulty
     * toggle in the options menu will be disabled.
     */
    locked: boolean,
  }
  /**
   * Notifies the client that the server has finished sending a batch of chunks.
   * 
   * Introduced in modern protocol versions to optimize world loading, this packet
   * allows the client to acknowledge the receipt of a group of chunks, helping
   * the server regulate the flow of data and prevent network congestion.
   */
  export interface CChunkBatchEnd {
    /**
     * The number of chunks sent in the batch that just finished.
     */
    batchSize: number,
  }
  /**
   * Heightmap data accompanying a chunk packet.
   */
  export interface ChunkHeightmaps {
    worldSurface?: BigInt64Array,
    motionBlocking?: BigInt64Array,
    motionBlockingNoLeaves?: BigInt64Array,
  }
  /**
   * Block entity metadata serialized in chunk packets.
   */
  export interface ChunkBlockEntity {
    packedXz: number,
    y: number,
    typeId: number,
    data: NbtTree,
  }
  export interface ChunkBiomeEntry {
    chunkX: number,
    chunkZ: number,
    data: Uint8Array,
  }
  export interface CChunksBiomes {
    chunks: Array<ChunkBiomeEntry>,
  }
  /**
   * Removes any currently displayed Title or Subtitle from the player's screen.
   * 
   * This packet is used to immediately hide titles that are currently in their
   * "stay" or "fade-out" phases.
   */
  export interface CClearTitle {
    /**
     * If true, the client also resets the title timings (fade-in, stay, fade-out)
     * to their default values (10, 70, 20 ticks).
     * 
     * Set this to false if you want to clear the text but keep custom timings
     * for the next title you send.
     */
    reset: boolean,
  }
  /**
   * Notifies the client that a container (inventory, chest, etc.) has been closed.
   * 
   * This is used by the server to force the player's UI to shut, for example,
   * if the player moves too far away from a chest or if an NPC's trade window
   * is invalidated.
   */
  export interface CCloseContainer {
    /**
     * The ID of the container window to close.
     * 
     * A value of 0 usually refers to the player's own inventory, while higher
     * values refer to active windows opened via previous packets.
     */
    syncId: number,
  }
  /**
   * Notifies the client that a player has died.
   * 
   * This packet is responsible for triggering the death screen on the client
   * and displaying the death message in the chat for the deceased player.
   */
  export interface CCombatDeath {
    /**
     * The Entity ID of the player who died.
     */
    playerId: number,
    /**
     * The death message to be displayed (e.g., "Player was pricked to death by a Cactus").
     */
    message: string,
  }
  export interface CCombatEnd {
    durationTicks: number,
  }
  export interface CommandSuggestion {
    suggestion: string,
    tooltip?: string,
  }
  /**
   * Sent by the server to provide a list of "tab-completion" suggestions.
   * 
   * This packet responds to a client's request for help with commands,
   * appearing as a scrollable list of options while the player is typing
   * in the chat bar.
   */
  export interface CCommandSuggestions {
    /**
     * The unique ID of the request this response is for.
     * This must match the ID sent by the client in the request packet.
     */
    id: number,
    /**
     * The starting character index in the chat bar where the completion
     * should be inserted.
     */
    start: number,
    /**
     * The number of characters in the original text to replace with
     * the suggestion.
     */
    length: number,
    /**
     * The list of possible completions, which can include tooltips
     * for extra context.
     */
    matches: Array<CommandSuggestion>,
  }
  export interface ProtoNodeTypeLiteral {
    name: string,
    isExecutable: boolean,
    redirectTarget?: number,
    /**
     * Added in 1.21.6. Indicates that the command node is restricted.
     */
    restricted: boolean,
  }
  export interface ArgumentTypeFloat {
    min?: number,
    max?: number,
  }
  export interface ArgumentTypeDouble {
    min?: number,
    max?: number,
  }
  export interface ArgumentTypeInteger {
    min?: number,
    max?: number,
  }
  export interface ArgumentTypeLong {
    min?: bigint,
    max?: bigint,
  }
  export interface ArgumentTypeEntity {
    flags: number,
  }
  export interface ArgumentTypeScoreHolder {
    flags: number,
  }
  export interface ArgumentTypeTime {
    min: number,
  }
  export interface ArgumentTypeResourceOrTag {
    identifier: string,
  }
  export interface ArgumentTypeResourceOrTagKey {
    identifier: string,
  }
  export interface ArgumentTypeResource {
    identifier: string,
  }
  export interface ArgumentTypeResourceKey {
    identifier: string,
  }
  /**
   * # Variants
   * 
   * ## `"single-word"`
   * 
   * ## `"quotable-phrase"`
   * 
   * ## `"greedy-phrase"`
   * 
   * does not stop after a space
   */
  export type StringProtoArgBehavior = 'single-word' | 'quotable-phrase' | 'greedy-phrase';
  export type ArgumentType = ArgumentTypeBool | ArgumentTypeFloat | ArgumentTypeDouble | ArgumentTypeInteger | ArgumentTypeLong | ArgumentTypeString | ArgumentTypeEntity | ArgumentTypeGameProfile | ArgumentTypeBlockPos | ArgumentTypeColumnPos | ArgumentTypeVec3 | ArgumentTypeVec2 | ArgumentTypeBlockState | ArgumentTypeBlockPredicate | ArgumentTypeItemStack | ArgumentTypeItemPredicate | ArgumentTypeColor | ArgumentTypeHexColor | ArgumentTypeComponent | ArgumentTypeStyle | ArgumentTypeMessage | ArgumentTypeNbtCompound | ArgumentTypeNbtTag | ArgumentTypeNbtPath | ArgumentTypeObjective | ArgumentTypeObjectiveCriteria | ArgumentTypeOperation | ArgumentTypeParticle | ArgumentTypeAngle | ArgumentTypeRotation | ArgumentTypeScoreboardSlot | ArgumentTypeScoreHolder | ArgumentTypeSwizzle | ArgumentTypeTeam | ArgumentTypeItemSlot | ArgumentTypeItemSlots | ArgumentTypeResourceLocation | ArgumentTypeFunction | ArgumentTypeEntityAnchor | ArgumentTypeIntRange | ArgumentTypeFloatRange | ArgumentTypeDimension | ArgumentTypeGamemode | ArgumentTypeTime | ArgumentTypeResourceOrTag | ArgumentTypeResourceOrTagKey | ArgumentTypeResource | ArgumentTypeResourceKey | ArgumentTypeResourceSelector | ArgumentTypeTemplateMirror | ArgumentTypeTemplateRotation | ArgumentTypeHeightmap | ArgumentTypeLootTable | ArgumentTypeLootPredicate | ArgumentTypeLootModifier | ArgumentTypeDialog | ArgumentTypeUuid;
  export interface ArgumentTypeBool {
    tag: 'bool',
  }
  export interface ArgumentTypeFloat {
    tag: 'float',
    val: ArgumentTypeFloat,
  }
  export interface ArgumentTypeDouble {
    tag: 'double',
    val: ArgumentTypeDouble,
  }
  export interface ArgumentTypeInteger {
    tag: 'integer',
    val: ArgumentTypeInteger,
  }
  export interface ArgumentTypeLong {
    tag: 'long',
    val: ArgumentTypeLong,
  }
  export interface ArgumentTypeString {
    tag: 'string',
    val: StringProtoArgBehavior,
  }
  export interface ArgumentTypeEntity {
    tag: 'entity',
    val: ArgumentTypeEntity,
  }
  export interface ArgumentTypeGameProfile {
    tag: 'game-profile',
  }
  export interface ArgumentTypeBlockPos {
    tag: 'block-pos',
  }
  export interface ArgumentTypeColumnPos {
    tag: 'column-pos',
  }
  export interface ArgumentTypeVec3 {
    tag: 'vec3',
  }
  export interface ArgumentTypeVec2 {
    tag: 'vec2',
  }
  export interface ArgumentTypeBlockState {
    tag: 'block-state',
  }
  export interface ArgumentTypeBlockPredicate {
    tag: 'block-predicate',
  }
  export interface ArgumentTypeItemStack {
    tag: 'item-stack',
  }
  export interface ArgumentTypeItemPredicate {
    tag: 'item-predicate',
  }
  export interface ArgumentTypeColor {
    tag: 'color',
  }
  export interface ArgumentTypeHexColor {
    tag: 'hex-color',
  }
  export interface ArgumentTypeComponent {
    tag: 'component',
  }
  export interface ArgumentTypeStyle {
    tag: 'style',
  }
  export interface ArgumentTypeMessage {
    tag: 'message',
  }
  export interface ArgumentTypeNbtCompound {
    tag: 'nbt-compound',
  }
  export interface ArgumentTypeNbtTag {
    tag: 'nbt-tag',
  }
  export interface ArgumentTypeNbtPath {
    tag: 'nbt-path',
  }
  export interface ArgumentTypeObjective {
    tag: 'objective',
  }
  export interface ArgumentTypeObjectiveCriteria {
    tag: 'objective-criteria',
  }
  export interface ArgumentTypeOperation {
    tag: 'operation',
  }
  export interface ArgumentTypeParticle {
    tag: 'particle',
  }
  export interface ArgumentTypeAngle {
    tag: 'angle',
  }
  export interface ArgumentTypeRotation {
    tag: 'rotation',
  }
  export interface ArgumentTypeScoreboardSlot {
    tag: 'scoreboard-slot',
  }
  export interface ArgumentTypeScoreHolder {
    tag: 'score-holder',
    val: ArgumentTypeScoreHolder,
  }
  export interface ArgumentTypeSwizzle {
    tag: 'swizzle',
  }
  export interface ArgumentTypeTeam {
    tag: 'team',
  }
  export interface ArgumentTypeItemSlot {
    tag: 'item-slot',
  }
  export interface ArgumentTypeItemSlots {
    tag: 'item-slots',
  }
  export interface ArgumentTypeResourceLocation {
    tag: 'resource-location',
  }
  export interface ArgumentTypeFunction {
    tag: 'function',
  }
  export interface ArgumentTypeEntityAnchor {
    tag: 'entity-anchor',
  }
  export interface ArgumentTypeIntRange {
    tag: 'int-range',
  }
  export interface ArgumentTypeFloatRange {
    tag: 'float-range',
  }
  export interface ArgumentTypeDimension {
    tag: 'dimension',
  }
  export interface ArgumentTypeGamemode {
    tag: 'gamemode',
  }
  export interface ArgumentTypeTime {
    tag: 'time',
    val: ArgumentTypeTime,
  }
  export interface ArgumentTypeResourceOrTag {
    tag: 'resource-or-tag',
    val: ArgumentTypeResourceOrTag,
  }
  export interface ArgumentTypeResourceOrTagKey {
    tag: 'resource-or-tag-key',
    val: ArgumentTypeResourceOrTagKey,
  }
  export interface ArgumentTypeResource {
    tag: 'resource',
    val: ArgumentTypeResource,
  }
  export interface ArgumentTypeResourceKey {
    tag: 'resource-key',
    val: ArgumentTypeResourceKey,
  }
  export interface ArgumentTypeResourceSelector {
    tag: 'resource-selector',
  }
  export interface ArgumentTypeTemplateMirror {
    tag: 'template-mirror',
  }
  export interface ArgumentTypeTemplateRotation {
    tag: 'template-rotation',
  }
  export interface ArgumentTypeHeightmap {
    tag: 'heightmap',
  }
  export interface ArgumentTypeLootTable {
    tag: 'loot-table',
  }
  export interface ArgumentTypeLootPredicate {
    tag: 'loot-predicate',
  }
  export interface ArgumentTypeLootModifier {
    tag: 'loot-modifier',
  }
  export interface ArgumentTypeDialog {
    tag: 'dialog',
  }
  export interface ArgumentTypeUuid {
    tag: 'uuid',
  }
  /**
   * # Variants
   * 
   * ## `"ask-server"`
   * 
   * ## `"all-recipes"`
   * 
   * ## `"available-sounds"`
   * 
   * ## `"summonable-entities"`
   */
  export type SuggestionProviders = 'ask-server' | 'all-recipes' | 'available-sounds' | 'summonable-entities';
  export interface ProtoNodeTypeArgument {
    name: string,
    isExecutable: boolean,
    redirectTarget?: number,
    parser: ArgumentType,
    overrideSuggestionType?: SuggestionProviders,
    /**
     * Added in 1.21.6. Indicates that the command node is restricted.
     */
    restricted: boolean,
  }
  export type ProtoNodeType = ProtoNodeTypeRoot | ProtoNodeTypeLiteral | ProtoNodeTypeArgument;
  export interface ProtoNodeTypeRoot {
    tag: 'root',
  }
  export interface ProtoNodeTypeLiteral {
    tag: 'literal',
    val: ProtoNodeTypeLiteral,
  }
  export interface ProtoNodeTypeArgument {
    tag: 'argument',
    val: ProtoNodeTypeArgument,
  }
  export interface ProtoNode {
    children: Int32Array,
    nodeType: ProtoNodeType,
  }
  /**
   * Sends the entire command tree to the client for client-side parsing and tab-completion.
   * 
   * Minecraft uses the "Brigadier" command system. This packet informs the client
   * which commands exist, their arguments, and how they branch, allowing the
   * client to highlight syntax errors in red before the command is even sent.
   */
  export interface CCommands {
    /**
     * A flat list of all nodes in the command graph.
     * Nodes reference each other by their index in this array.
     */
    nodes: Array<ProtoNode>,
    /**
     * The index of the "root" node in the `nodes` array.
     * This is the entry point for all commands (the '/' symbol).
     */
    rootNodeIndex: number,
  }
  /**
   * Sent by the server to request a "cookie" (stored data) from the client.
   * 
   * Introduced in modern Minecraft versions, cookies allow servers to store
   * small amounts of persistent data on the client side that can be retrieved
   * even across different server instances or sub-servers in a network.
   */
  export interface CPlayCookieRequest {
    /**
     * The unique identifier (namespace:path) of the cookie to retrieve.
     */
    key: string,
  }
  export interface CCustomChatCompletions {
    action: number,
    entries: Array<string>,
  }
  /**
   * A packet used for custom communication between the server and client.
   */
  export interface CCustomPayload {
    channel: string,
    data: Uint8Array,
  }
  export interface CPlayCustomReportDetails {
    details: Array<[string, string]>,
  }
  /**
   * Notifies the client that an entity has taken damage.
   * 
   * This packet is used to trigger damage animations (like the red tint on mobs),
   * directional knockback visuals, and sound effects. It provides the client
   * with specific details about the damage source to ensure the visual feedback
   * matches the cause.
   */
  export interface CDamageEvent {
    /**
     * The Entity ID of the entity taking damage.
     */
    entityId: number,
    /**
     * The ID of the damage type (references the `minecraft:damage_type` registry).
     * Examples: `magic`, `fall`, `on_fire`, or `arrow`.
     */
    sourceTypeId: number,
    /**
     * The Entity ID of the actual cause of the damage (e.g., the player who shot the arrow).
     * Set to 0 if there is no specific entity cause.
     */
    sourceCauseId: number,
    /**
     * The Entity ID of the direct damager (e.g., the arrow entity itself).
     * Set to 0 if this is the same as the cause or if not applicable.
     */
    sourceDirectId: number,
    /**
     * The coordinates of the damage source. Used by the client to calculate
     * the direction of the "damage tilt" camera effect.
     */
    sourcePosition?: [number, number, number],
  }
  export interface CDebugBlockValue {
    pos: [number, number, number],
    name: string,
    value: string,
  }
  export interface CDebugChunkValue {
    chunkPos: [number, number],
    name: string,
    value: string,
  }
  export interface CDebugEntityValue {
    entityId: number,
    name: string,
    value: string,
  }
  export interface CDebugEvent {
    name: string,
    data: Uint8Array,
  }
  export interface CDebugSample {
    sample: BigInt64Array,
    sampleType: number,
  }
  export interface CDeleteChat {
    signatureId: number,
    signature?: Uint8Array,
  }
  /**
   * Forces the client to disconnect from the server while in the "Play" state.
   * 
   * This packet displays the provided reason to the player on a dedicated
   * disconnection screen. It is used for kicks, server shutdowns, or when
   * a player is banned.
   */
  export interface CPlayDisconnect {
    /**
     * The message shown to the player explaining why they were disconnected.
     * This supports full JSON formatting (colors, bold, links, etc.).
     */
    reason: string,
  }
  /**
   * Sends a chat message that is not cryptographically signed by a player.
   * 
   * Introduced to support server-side "disguised" identities (like /say or NPC chat),
   * this packet bypasses the player-to-player chat signing requirements while
   * still allowing the client to format the message using the standard chat registry.
   */
  export interface CDisguisedChatMessage {
    /**
     * The raw content of the message.
     */
    message: string,
    /**
     * An index into the `minecraft:chat_type` registry.
     * This determines the decoration (e.g., "<%s> %s" or "[%s -> %s] %s").
     */
    chatType: number,
    /**
     * The name shown as the "sender" of the message.
     */
    senderName: string,
    /**
     * The optional name shown as the "target" (used for private messages/whispers).
     */
    targetName?: string,
  }
  /**
   * Instructs the client to display a specific scoreboard objective in a given slot.
   * 
   * This packet is the final step in showing a scoreboard to a player. After
   * an objective is created and populated with scores, this packet "maps"
   * that objective to a visual location like the sidebar or the player list.
   */
  export interface CDisplayObjective {
    /**
     * The display slot/position for the objective.
     */
    position: number,
    /**
     * The unique internal name of the objective to be displayed.
     * To hide an objective in a specific slot, send an empty string.
     */
    scoreName: string,
  }
  /**
   * Triggers a specific animation for an entity that is visible to the client.
   * 
   * This is primarily used for player-driven animations like swinging an arm
   * or showing damage, but it can apply to other entities as well.
   */
  export interface CEntityAnimation {
    /**
     * The Entity ID of the entity performing the animation.
     */
    entityId: number,
    /**
     * The ID of the animation to play.
     * See the table below for standard values.
     */
    animation: number,
  }
  /**
   * Plays the swing animation of an entity's hand.
   * 
   * Up to 26.2 this was an animation of [`CEntityAnimation`], since 26.3 it is its own packet that
   * also carries the swing animation of the held item.
   */
  export interface CSwingArm {
    entityId: number,
    offHand: boolean,
  }
  /**
   * # Variants
   * 
   * ## `"swing-main-arm"`
   * 
   * ## `"leave-bed"`
   * 
   * ## `"swing-offhand"`
   * 
   * ## `"critical-effect"`
   * 
   * ## `"magic-criticaleffect"`
   */
  export type Animation = 'swing-main-arm' | 'leave-bed' | 'swing-offhand' | 'critical-effect' | 'magic-criticaleffect';
  /**
   * Updates the "Data Tracker" values for an entity.
   * 
   * Entity Metadata (or `DataWatchers`) controls persistent visual states that
   * don't require a full packet to update, such as whether an entity is on fire,
   * crouching, glowing, or the custom name displayed above its head.
   */
  export interface CSetEntityMetadata {
    /**
     * The Entity ID of the entity whose metadata is being updated.
     */
    entityId: number,
    /**
     * A serialized collection of metadata entries.
     * Ends with a terminal byte (0xFF).
     */
    metadata: Uint8Array,
  }
  /**
   * Updates the exact position, rotation, and velocity of an entity.
   * 
   * This packet is used for server-side authority over entity movement.
   * In the latest protocol versions, this replaces several older "Relative Move"
   * packets to provide more precise synchronization and reduce "rubber-banding."
   * 
   * Note: This packet must NOT be used for the player receiving the packet or
   * any entity the player is currently riding.
   */
  export interface CEntityPositionSync {
    /**
     * The Entity ID of the entity being moved.
     */
    entityId: number,
    /**
     * The absolute position of the entity in the world.
     */
    position: [number, number, number],
    /**
     * The current velocity (delta) of the entity, used by the client
     * for smooth interpolation.
     */
    delta: [number, number, number],
    /**
     * The absolute yaw (horizontal rotation) in degrees.
     */
    yaw: number,
    /**
     * The absolute pitch (vertical rotation) in degrees.
     */
    pitch: number,
    /**
     * Whether the entity is currently touching the ground.
     */
    onGround: boolean,
  }
  /**
   * Plays a sound effect that originates from a specific entity.
   * 
   * Unlike global sounds, this sound will follow the entity as it moves
   * through the world. The client handles the panning and attenuation
   * (volume drop-off) based on the distance between the player and the entity.
   */
  export interface CEntitySoundEffect {
    /**
     * The sound to play. Can be a hardcoded ID or a custom `SoundEvent`
     * (Resource Location).
     */
    soundEvent: string,
    /**
     * The category of the sound (e.g., Master, Music, Weather, Players).
     * Used by the client to apply volume sliders from settings.
     */
    soundCategory: number,
    /**
     * The Entity ID that the sound is "attached" to.
     */
    entityId: number,
    /**
     * The loudness of the sound (usually 1.0).
     */
    volume: number,
    /**
     * The playback speed/pitch (0.5 to 2.0).
     */
    pitch: number,
    /**
     * A random seed used for sound variations (like different pitch shifts
     * for the same sound).
     */
    seed: bigint,
  }
  /**
   * Sends a status update for a specific entity.
   * 
   * This packet is a "catch-all" for various entity triggers that don't
   * warrant a complex packet of their own. It primarily handles visual
   * and logical state triggers, such as tool breaking, totem usage,
   * or sheep shearing.
   */
  export interface CEntityStatus {
    /**
     * The Entity ID of the entity affected by the status change.
     */
    entityId: number,
    /**
     * The ID of the status/event to trigger.
     * See the table below for common entity statuses.
     */
    entityStatus: number,
  }
  /**
   * Updates the velocity of an entity.
   * 
   * This packet informs the client of a sudden change in an entity's movement,
   * such as knockback from an attack, explosions, or being launched by a piston.
   */
  export interface CEntityVelocity {
    /**
     * The Entity ID of the entity whose velocity is being set
     */
    entityId: number,
    /**
     * The velocity vector
     */
    velocity: string,
  }
  /**
   * Notifies the client that an explosion has occurred.
   * 
   * This is a high-level packet that handles the visual, auditory, and physical
   * effects of an explosion in a single call. It triggers the explosion particles,
   * plays the sound at the source, and applies knockback to the player.
   */
  export interface CExplosion {
    /**
     * The center coordinates of the explosion.
     */
    center: [number, number, number],
    /**
     * The strength/radius of the explosion.
     * Higher values increase the visual size of the particle effect.
     */
    radius: number,
    /**
     * The number of blocks affected/destroyed.
     */
    blockCount: number,
    /**
     * The impulse/knockback applied to the player receiving this packet.
     * If None, no velocity change is applied.
     */
    knockback?: [number, number, number],
    /**
     * The ID of the particle to use for the explosion (e.g., `minecraft:explosion_emitter`).
     */
    particle: number,
    /**
     * The sound to play (e.g., `minecraft:entity.generic.explode`).
     */
    sound: string,
    /**
     * The size of the block particles pool, used for debris visuals in 1.21.9+.
     */
    blockParticlesPoolSize: number,
  }
  /**
   * Updates the game state or triggers specific environmental changes.
   * 
   * This packet is the primary way the server communicates global or
   * context-specific transitions, such as changing the weather,
   * altering the player's gamemode, or displaying the credits.
   */
  export interface CGameEvent {
    /**
     * The ID of the event type.
     */
    event: number,
    /**
     * A value associated with the event (usage depends on the event ID).
     */
    value: number,
  }
  /**
   * # Variants
   * 
   * ## `"no-respawn-block-available"`
   * 
   * ## `"begin-raining"`
   * 
   * ## `"end-raining"`
   * 
   * ## `"change-game-mode"`
   * 
   * ## `"win-game"`
   * 
   * ## `"demo-event"`
   * 
   * ## `"arrow-hit-player"`
   * 
   * ## `"rain-level-change"`
   * 
   * ## `"thunder-level-change"`
   * 
   * ## `"play-pufferfish-string-sound"`
   * 
   * ## `"play-elder-guardian-mob-appearance"`
   * 
   * ## `"enabled-respawn-screen"`
   * 
   * ## `"limited-crafting"`
   * 
   * ## `"start-waiting-chunks"`
   */
  export type GameEvent = 'no-respawn-block-available' | 'begin-raining' | 'end-raining' | 'change-game-mode' | 'win-game' | 'demo-event' | 'arrow-hit-player' | 'rain-level-change' | 'thunder-level-change' | 'play-pufferfish-string-sound' | 'play-elder-guardian-mob-appearance' | 'enabled-respawn-screen' | 'limited-crafting' | 'start-waiting-chunks';
  export interface CGameRuleValues {
    rules: Array<[string, string]>,
  }
  export interface CGameTestHighlightPos {
    pos: [number, number, number],
    color: number,
    label: string,
    durationMs: number,
  }
  /**
   * Rotates an entity's head to a specific yaw.
   * 
   * In Minecraft, an entity's "body yaw" and "head yaw" are separate.
   * While standard movement packets update the body, this packet is
   * required to make an entity (like a player or a mob) look in a
   * specific direction without necessarily turning its entire body.
   */
  export interface CHeadRot {
    /**
     * The Entity ID of the entity whose head is rotating.
     */
    entityId: number,
    /**
     * The new head yaw, in steps of 1/256 of a full turn (0-255).
     */
    headYaw: number,
  }
  /**
   * Triggers the "hurt" visual effect on an entity.
   * 
   * This packet causes the entity to turn red and perform a directional
   * camera shake or model tilt. It is typically sent immediately after
   * an entity's health is reduced.
   */
  export interface CHurtAnimation {
    /**
     * The Entity ID of the entity that was hurt.
     */
    entityId: number,
    /**
     * The yaw (direction) from which the damage originated.
     * This determines the direction the entity's model tilts.
     */
    yaw: number,
  }
  /**
   * Fully initializes the world border for the client.
   * 
   * This packet is sent when a player joins the world or changes dimensions.
   * It synchronizes the current position, size, and all warning parameters
   * to ensure the client-side visual barrier matches the server's authority.
   */
  export interface CInitializeWorldBorder {
    /**
     * The X coordinate of the center of the world border.
     */
    x: number,
    /**
     * The Z coordinate of the center of the world border.
     */
    z: number,
    /**
     * The diameter the border is moving from.
     */
    oldDiameter: number,
    /**
     * The diameter the border is moving toward.
     */
    newDiameter: number,
    /**
     * The time (in milliseconds) it will take to reach `new_diameter`.
     */
    speed: bigint,
    /**
     * The maximum distance a player can be teleported by a portal
     * before the border prevents the teleport.
     */
    portalTeleportBoundary: number,
    /**
     * Distance in blocks from the border where the screen starts to tint red.
     */
    warningBlocks: number,
    /**
     * Time in seconds that a player must be on a collision course with
     * the border before the warning tint appears.
     */
    warningTime: number,
  }
  export interface CItemCooldown {
    group: string,
    cooldown: number,
  }
  /**
   * Maintains the connection and measures latency (ping) between client and server.
   * 
   * The server sends this packet at regular intervals (typically every 15–20 seconds).
   * The client must respond with the exact same ID. If the server does not receive
   * a response within a timeout period (usually 30 seconds), it will disconnect
   * the player with a "Timed Out" message.
   */
  export interface CKeepAlive {
    /**
     * A unique random identifier for this specific keep-alive request.
     * Used to match the server's request with the client's response.
     */
    keepAliveId: bigint,
  }
  /**
   * Triggers a specific sound or particle effect at a world location.
   * 
   * This packet handles a wide variety of "world-level" events, such as
   * block breaking particles, firework explosions, or ambient sounds
   * like doors opening and portals humming.
   */
  export interface CLevelEvent {
    /**
     * The ID of the event to trigger.
     * Event IDs are generally divided into Sound Events (1000s) and
     * Particle/Visual Events (2000s).
     */
    event: number,
    /**
     * The world coordinates where the event occurs.
     */
    location: [number, number, number],
    /**
     * Event-specific data (e.g., the block ID for break particles
     * or the direction of a smoke puff).
     */
    data: number,
    /**
     * If true, the sound is played at a constant volume regardless of
     * the player's distance from the `location`.
     */
    disableRelativeVolume: boolean,
  }
  export interface LightData {
    trustEdges: boolean,
    skyLightMask: BigInt64Array,
    blockLightMask: BigInt64Array,
    emptySkyLightMask: BigInt64Array,
    emptyBlockLightMask: BigInt64Array,
    skyLightArrays: Array<Uint8Array>,
    blockLightArrays: Array<Uint8Array>,
  }
  /**
   * The chunk data and light packet sent to clients (`LEVEL_CHUNK_WITH_LIGHT`).
   * 
   * Contains chunk position, heightmaps, pre-encoded section and biome payload,
   * block entities, and lighting data.
   */
  export interface CChunkData {
    chunkX: number,
    chunkZ: number,
    heightmaps: ChunkHeightmaps,
    data: Uint8Array,
    blockEntities: Array<ChunkBlockEntity>,
    lightData: LightData,
  }
  /**
   * Sent by the server to update light levels (block light and sky light) for a chunk.
   * 
   * This packet updates lighting data for a specific chunk without sending the full chunk data.
   * It was introduced in Minecraft 1.14 (protocol version 477).
   */
  export interface CLightUpdate {
    chunkX: number,
    chunkZ: number,
    lightData: LightData,
  }
  export interface MapIcon {
    iconType: number,
    x: number,
    z: number,
    direction: number,
    displayName?: string,
  }
  export interface MapPatch {
    columns: number,
    rows: number,
    x: number,
    z: number,
    data: Uint8Array,
  }
  export interface CMapItemData {
    mapId: number,
    scale: number,
    trackingPosition: boolean,
    locked: boolean,
    icons?: Array<MapIcon>,
    data?: MapPatch,
  }
  export interface MerchantOffer {
    baseCostA: string,
    output: string,
    costB?: string,
    rewardExp: boolean,
    uses: number,
    maxUses: number,
    xp: number,
    specialPrice: number,
    priceMultiplier: number,
    demand: number,
  }
  export interface CMerchantOffers {
    windowId: number,
    offers: Array<MerchantOffer>,
    villagerLevel: number,
    experience: number,
    isRegularVillager: boolean,
    canRestock: boolean,
  }
  export interface MinecartStep {
    position: [number, number, number],
    movement: [number, number, number],
    yaw: number,
    pitch: number,
    weight: number,
  }
  export interface CMoveMinecartAlongTrack {
    entityId: number,
    steps: Array<MinecartStep>,
  }
  export interface CMoveVehicle {
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
  }
  /**
   * Updates multiple blocks within a single chunk section (or chunk in older versions).
   * 
   * This packet is much more efficient than sending multiple individual
   * `CBlockUpdate` packets when many changes occur in the same area
   * (e.g., explosions, structure generation, or large-scale terraforming).
   */
  export interface CMultiBlockUpdate {
    /**
     * Chunk section position (x, y, z)
     */
    chunkSection: [number, number, number],
    /**
     * Suppress light updates (used in 1.16..=1.19.4)
     */
    suppressLightUpdates: boolean,
    /**
     * Array of block updates: (`BlockPos`, `BlockStateId`)
     */
    updates: Array<[[number, number, number], string]>,
  }
  export interface COpenBook {
    hand: number,
  }
  export interface COpenMountScreen {
    windowId: number,
    slotCount: number,
    entityId: number,
  }
  /**
   * Instructs the client to open a specific type of GUI (inventory, chest, etc.).
   * 
   * This packet is sent when a player interacts with a block (like a chest)
   * or when a command/plugin forces an interface to open. It establishes a
   * `sync_id` which must be used in all subsequent "Set Slot" or "Click Slot"
   * packets to ensure the server and client are talking about the same window.
   */
  export interface COpenScreen {
    /**
     * A unique identifier for the current window session.
     * Typically increments by 1 for every new window opened.
     */
    syncId: number,
    /**
     * The ID of the window type to open (e.g., Generic 9x3, Crafting Table).
     * See the table below for standard IDs.
     */
    windowType: number,
    /**
     * The title displayed at the top of the GUI.
     * Supports full JSON formatting (colors, bold, etc.).
     */
    windowTitle: string,
  }
  /**
   * Opens the sign text input screen for the client.
   * 
   * This packet is sent by the server to force the client to show the
   * sign editing interface. This usually happens immediately after a
   * player places a sign or interacts with an existing one (if allowed).
   */
  export interface COpenSignEditor {
    /**
     * The world coordinates of the sign block to be edited.
     */
    location: [number, number, number],
    /**
     * Whether the editor should open the front or the back of the sign.
     * Introduced in the 1.20 "Trails & Tales" update for double-sided signs.
     */
    isFrontText: boolean,
  }
  /**
   * Spawns a cluster of particles at a specific location.
   * 
   * This is the most versatile visual packet in the protocol. It allows for
   * precise control over particle density, spread, and speed. It can also
   * carry extra data for complex particles like redstone dust (color) or
   * block/item breaking (textures).
   */
  export interface CParticle {
    /**
     * If true, the particle renders even if the client's "Particles"
     * setting is set to "Minimal".
     */
    forceSpawn: boolean,
    /**
     * If true, the distance at which particles are visible is significantly
     * increased (from 256 to 65536 blocks). Often used for massive events.
     */
    important: boolean,
    /**
     * The absolute center position of the particle cluster.
     */
    position: [number, number, number],
    /**
     * The maximum distance from the center that particles can spawn.
     */
    offset: [number, number, number],
    /**
     * The velocity or "spread" speed of the particles.
     */
    maxSpeed: number,
    /**
     * The total number of particles to spawn in this cluster.
     */
    particleCount: number,
    /**
     * The ID of the particle type (e.g., `minecraft:flame`).
     */
    particleId: number,
    /**
     * Extra data required by specific particles (e.g., block states for
     * `block` particles or RGB values for `dust`).
     */
    data: Uint8Array,
  }
  export interface CPlayPing {
    id: number,
  }
  /**
   * Responds to a client-initiated ping request to synchronize game state.
   */
  export interface CPingResponse {
    /**
     * The unique identifier sent by the client in the initial Ping packet.
     * The server must return this exact value.
     */
    payload: bigint,
  }
  export interface CPlaceGhostRecipe {
    windowId: number,
    recipeId: string,
  }
  /**
   * Updates the player's movement and interaction abilities.
   * 
   * This packet informs the client about the player's state (flying, invulnerable)
   * and sets the movement speeds. While the client applies these visuals,
   * the server must still validate these states to prevent cheating.
   */
  export interface CPlayerAbilities {
    /**
     * A bitmask of player states.
     * Bit 0 (0x01): Invulnerable (Creative mode)
     * Bit 1 (0x02): Flying
     * Bit 2 (0x04): Allow Flying
     * Bit 3 (0x08): Creative Mode (Instant Break)
     */
    flags: number,
    /**
     * The multiplier for flying speed.
     * Default is 0.05.
     */
    flyingSpeed: number,
    /**
     * The field of view modifier (Walking speed multiplier).
     * Default is 0.1.
     */
    fieldOfView: number,
  }
  export interface InitChat {
    sessionId: Uuid,
    expiresAt: bigint,
    publicKey: Uint8Array,
    signature: Uint8Array,
  }
  export interface PreviousMessage {
    id: number,
    signature?: Uint8Array,
  }
  export type FilterType = FilterTypePassThrough | FilterTypeFullyFiltered | FilterTypePartiallyFiltered;
  /**
   * Message is not filtered at all
   */
  export interface FilterTypePassThrough {
    tag: 'pass-through',
  }
  /**
   * Message is fully filtered
   */
  export interface FilterTypeFullyFiltered {
    tag: 'fully-filtered',
  }
  /**
   * Only some characters in the message are filtered
   */
  export interface FilterTypePartiallyFiltered {
    tag: 'partially-filtered',
    val: BigInt64Array,
  }
  /**
   * Sends a cryptographically signed player chat message to the client.
   * 
   * This packet is the backbone of the modern secure chat system. It includes
   * tracking indices, digital signatures, and context for reporting.
   */
  export interface CPlayerChatMessage {
    /**
     * Incremental index for messages sent TO this specific client.
     * Starts at 0 on login; client disconnects if the sequence is broken.
     */
    globalIndex: number,
    /**
     * The UUID of the player who sent the message.
     */
    sender: Uuid,
    /**
     * Incremental index for messages sent BY the sender player.
     * Used by the client to verify the order of the sender's history.
     */
    index: number,
    /**
     * The RSA signature (256 bytes) verifying the message's authenticity.
     */
    messageSignature?: Uint8Array,
    /**
     * The raw plain-text content of the message.
     */
    message: string,
    /**
     * Epoch timestamp (milliseconds) when the message was sent.
     */
    timestamp: bigint,
    /**
     * A random 64-bit value used to ensure signature uniqueness.
     */
    salt: bigint,
    /**
     * Last 20 message signatures seen by the sender, providing context
     * for chat reporting and ensuring no messages were omitted.
     */
    previousMessages: Array<PreviousMessage>,
    /**
     * Optional formatted version of the message (e.g., if the server
     * added colors or links that aren't in the signed raw text).
     */
    unsignedContent?: string,
    /**
     * Indicates if the message should be hidden or partially masked
     * by the client's profanity filter.
     */
    filterType: FilterType,
    /**
     * ID of the chat type registry entry (e.g., "chat", "`say_command`").
     * Usually `(index + 1)`.
     */
    chatType: number,
    /**
     * The display name of the sender.
     */
    senderName: string,
    /**
     * The display name of the target (used in private messages).
     */
    targetName?: string,
  }
  export interface CPlayerLookAt {
    fromAnchor: number,
    targetX: number,
    targetY: number,
    targetZ: number,
    entity?: [number, number],
  }
  /**
   * Updates the player's position and rotation on the client.
   * 
   * Commonly known as the "Teleport Packet," this is sent by the server to
   * force a change in the player's location. The client must respond with a
   * `Teleport Confirm` packet matching the `teleport_id`.
   */
  export interface CPlayerPosition {
    /**
     * A unique ID for this teleport. The client must echo this back
     * to confirm the teleport was processed.
     */
    teleportId: number,
    /**
     * The absolute or relative target position.
     */
    position: [number, number, number],
    /**
     * The intended velocity of the player after teleporting.
     */
    delta: [number, number, number],
    /**
     * The horizontal rotation (0-360 degrees).
     */
    yaw: number,
    /**
     * The vertical rotation (-90 to 90 degrees).
     */
    pitch: number,
    /**
     * A set of flags determining which of the above fields are relative (~).
     */
    relatives: Array<string>,
  }
  /**
   * Sent by the server to remove one or more players from the client's player list (tab list).
   * 
   * This packet is typically used when a player leaves the server or becomes invisible
   * to the recipient (e.g., moving out of tracking range).
   */
  export interface CRemovePlayerInfo {
    /**
     * A list of UUIDs corresponding to the players that should be removed.
     */
    players: Array<Uuid>,
  }
  export interface CPlayerRotation {
    yaw: number,
    pitch: number,
  }
  export interface PlayerSpawnData {
    /**
     * The Dimension for the current dimension's properties (lighting, sky color).
     */
    dimension: string,
    /**
     * Used by the client to seed local biome noise and decoration algorithms.
     */
    hashedSeed: bigint,
    gameMode: number,
    /**
     * The previous gamemode (used for the F3+F4 toggle UI). -1 if none.
     */
    previousGamemode: number,
    /**
     * If true, the world is a debug world (all blocks shown in a grid).
     */
    debug: boolean,
    /**
     * If true, the world is a flat world (affects the horizon rendering).
     */
    isFlat: boolean,
    /**
     * The location where the player last died (Added in 1.19, used for the recovery compass).
     */
    deathDimensionName?: [string, [number, number, number]],
    /**
     * Added in 1.20.
     */
    portalCooldown: number,
    /**
     * The height of the ocean level, usually 63 (Added in 1.21.2).
     */
    sealevel: number,
  }
  /**
   * The "Join Game" packet that transitions the client from the Configuration state
   * to the Play state.
   * 
   * This is one of the largest and most important packets in the protocol. It
   * initializes the player's world view, dimension settings, and local game
   * rules. Once received, the client begins rendering the world.
   */
  export interface CLogin {
    /**
     * The unique ID assigned to the player for the current session.
     */
    entityId: number,
    isHardcore: boolean,
    /**
     * A list of all dimensions present on the server (Added in 1.16).
     */
    dimensionNames: Array<string>,
    maxPlayers: number,
    /**
     * The number of chunks the client will render in each direction (Added in 1.14).
     */
    viewDistance: number,
    /**
     * The distance at which entities and world ticks are processed (Added in 1.18).
     */
    simulatedDistance: number,
    /**
     * If true, hides coordinates and other info from the F3 screen (Added in 1.8).
     */
    reducedDebugInfo: boolean,
    /**
     * Added in 1.15.
     */
    enabledRespawnScreen: boolean,
    /**
     * Added in 1.19.3.
     */
    limitedCrafting: boolean,
    spawnData: PlayerSpawnData,
    /**
     * Added in 26.2.
     */
    onlineMode: boolean,
    /**
     * If true, the client will warn the player if they send unsigned chat messages (Added in 1.20.5).
     */
    enforceSecureChat: boolean,
  }
  /**
   * Sent by the server to set the client's default spawn point and compass target.
   * 
   * This packet updates where the player will respawn upon death (if no bed or anchor is set)
   * and dictates the coordinates that a compass will point toward.
   */
  export interface CPlayerSpawnPosition {
    /**
     * The namespaced ID of the dimension (e.g., "minecraft:overworld").
     * Required for the client to determine if the spawn point is in their current world.
     * (1.21.9+)
     */
    dimensionName: string,
    /**
     * The X, Y, and Z coordinates of the spawn location.
     */
    location: [number, number, number],
    /**
     * The horizontal rotation (0-360 degrees) the player's camera should face upon respawning.
     * (1.17+)
     */
    yaw: number,
    /**
     * The vertical rotation (-90 to 90 degrees) the player's camera should face upon respawning.
     * (1.21.9+)
     */
    pitch: number,
  }
  export interface CPostEffects {
    effects: Array<string>,
  }
  export interface CProjectilePower {
    entityId: number,
    xPower: number,
    yPower: number,
    zPower: number,
  }
  /**
   * Clientbound packet that adds recipes to the client's recipe book.
   * `replace = true` means the client replaces its current recipe list.
   */
  export interface CRecipeBookAdd {
    replace: boolean,
  }
  export interface CRecipeBookRemove {
    recipes: Int32Array,
  }
  /**
   * Sent by the server to update the player's recipe book open/filter state.
   * 
   * Wire format: 4 `TypeSettings` pairs (crafting, furnace, `blast_furnace`, smoker),
   * each pair is (`is_open`: bool, `is_filtering`: bool).
   */
  export interface CRecipeBookSettings {
    craftingOpen: boolean,
    craftingFiltering: boolean,
    furnaceOpen: boolean,
    furnaceFiltering: boolean,
    blastFurnaceOpen: boolean,
    blastFurnaceFiltering: boolean,
    smokerOpen: boolean,
    smokerFiltering: boolean,
  }
  /**
   * Sent by the server to instruct the client to remove (despawn) one or more entities.
   * 
   * This is typically sent when an entity leaves the player's tracking range,
   * is killed, or is otherwise removed from the world.
   */
  export interface CRemoveEntities {
    /**
     * A list of entity IDs to be removed.
     */
    entityIds: Int32Array,
  }
  export interface CRemoveMobEffect {
    entityId: number,
    effectId: number,
  }
  export interface CRemoveResourcePack {
    uuid?: Uuid,
  }
  export interface CResetScore {
    entityName: string,
    objectiveName?: string,
  }
  export interface CRespawn {
    playerSpawnInfo: PlayerSpawnData,
    dataKept: number,
  }
  export interface CSelectAdvancementsTab {
    tabId?: string,
  }
  export interface CServerData {
    motd: string,
    iconBase64?: string,
  }
  export interface CPlayServerLinks {
    links: Array<string>,
  }
  export interface CSetBorderCenter {
    x: number,
    z: number,
  }
  export interface CSetBorderLerpSize {
    oldDiameter: number,
    newDiameter: number,
    speed: bigint,
  }
  export interface CSetBorderSize {
    diameter: number,
  }
  export interface CSetBorderWarningDelay {
    warningTime: number,
  }
  export interface CSetBorderWarningDistance {
    warningBlocks: number,
  }
  export interface CSetCamera {
    cameraId: number,
  }
  export interface CSetChunkCacheRadius {
    radius: number,
  }
  export interface CSetContainerContent {
    windowId: number,
    stateId: number,
    slotData: Array<string>,
    carriedItem: string,
  }
  export interface CSetContainerProperty {
    windowId: number,
    property: number,
    value: number,
  }
  export interface CSetContainerSlot {
    windowId: number,
    stateId: number,
    slot: number,
    slotData: string,
  }
  export interface CSetCursorItem {
    stack: string,
  }
  /**
   * Sent by the server to attach (leash) or detach an entity to another entity (e.g. leash knot, player, mob).
   */
  export interface CSetEntityLink {
    attachedEntityId: number,
    holdingEntityId: number,
    leash: boolean,
  }
  export interface CSetEquipment {
    entityId: number,
    equipment: Array<[number, string]>,
  }
  export interface CSetExperience {
    progress: number,
    level: number,
    totalExperience: number,
  }
  export interface CSetHealth {
    health: number,
    food: number,
    foodSaturation: number,
  }
  export interface CSetSelectedSlot {
    slot: number,
  }
  export interface CSetPassengers {
    entityId: number,
    passengers: Int32Array,
  }
  export interface CSetPlayerInventory {
    slot: number,
    item: string,
  }
  /**
   * # Variants
   * 
   * ## `"create"`
   * 
   * ## `"remove"`
   * 
   * ## `"update"`
   * 
   * ## `"add-players"`
   * 
   * ## `"remove-players"`
   */
  export type TeamMethod = 'create' | 'remove' | 'update' | 'add-players' | 'remove-players';
  export interface TeamParameters {
    displayName: string,
    options: number,
    nametagVisibility: string,
    collisionRule: string,
    color: number,
    playerPrefix: string,
    playerSuffix: string,
  }
  export interface CSetPlayerTeam {
    teamName: string,
    method: TeamMethod,
    parameters?: TeamParameters,
    players: Array<string>,
  }
  export interface CSetSimulationDistance {
    simulationDistance: number,
  }
  export interface CUpdateTime {
    gameTime: bigint,
    /**
     * (`clock_registry_id`, `total_ticks`, `partial_tick`, rate)
     */
    clockUpdates: Array<[number, bigint, number, number]>,
  }
  export interface CTitleText {
    title: string,
  }
  export interface CTitleAnimation {
    fadeInTicks: number,
    stayTicks: number,
    fadeOutTicks: number,
  }
  export interface CPlayShowDialog {
    dialog: string,
  }
  export interface CSoundEffect {
    soundEvent: string,
    soundCategory: number,
    position: [number, number, number],
    volume: number,
    pitch: number,
    seed: bigint,
  }
  export interface CSpawnEntity {
    entityId: number,
    entityUuid: Uuid,
    rType: number,
    position: [number, number, number],
    velocity: string,
    pitch: number,
    yaw: number,
    headYaw: number,
    data: number,
  }
  export interface CStopSound {
    soundId?: string,
    category?: string,
  }
  /**
   * Stores some arbitrary data on the client, which persists between server transfers.
   * The Notchian client only accepts cookies of up to 5 kiB in size.
   */
  export interface CStoreCookie {
    key: string,
    payload: Uint8Array,
  }
  export interface CSubtitle {
    subtitle: string,
  }
  /**
   * Sends a system chat message to the client.
   * 
   * System messages are messages sent by the server itself (such as join/quit notices,
   * command feedback, server announcements, or actionbar overlay messages).
   */
  export interface CSystemChatMessage {
    content: string,
    /**
     * When true, the message is displayed above the hotbar (actionbar).
     * When false, it is displayed in the normal chat box.
     */
    overlay: boolean,
  }
  /**
   * Updates the header and footer of the player list (Tab List).
   */
  export interface CTabList {
    /**
     * The text to be displayed at the top of the player list.
     */
    header: string,
    /**
     * The text to be displayed at the bottom of the player list.
     */
    footer: string,
  }
  export interface CTagQueryResponse {
    transactionId: number,
    nbtBytes: Uint8Array,
  }
  export interface CTakeItemEntity {
    /**
     * The entity id of the item entity.
     */
    entityId: number,
    /**
     * The entity id of the entity who is collecting the item.
     */
    collectorEntityId: number,
    /**
     * The Number of items in the Stack
     */
    stackAmount: number,
  }
  /**
   * Only used when teleporting a player's vehicle, this packet is sent to the player.
   */
  export interface CTeleportEntity {
    entityId: number,
    position: [number, number, number],
    delta: [number, number, number],
    yaw: number,
    pitch: number,
    relatives: Array<string>,
    onGround: boolean,
  }
  export interface CTestInstanceBlockStatus {
    pos: [number, number, number],
    status: number,
    message?: string,
  }
  export interface CTickingState {
    tickRate: number,
    isFrozen: boolean,
  }
  export interface CTickingStep {
    tickSteps: number,
  }
  export interface CTransfer {
    host: string,
    port: number,
  }
  export interface CUnloadChunk {
    x: number,
    z: number,
  }
  export interface CUpdateAdvancements {
    reset: boolean,
    added: Array<string>,
    removed: Array<string>,
    progress: Array<string>,
    showAdvancements: boolean,
  }
  export interface AttributeModifier {
    id: string,
    amount: number,
    operation: number,
  }
  export interface Property {
    id: number,
    value: number,
    modifiers: Array<AttributeModifier>,
  }
  /**
   * Sent by the server to signal a successful login and transition to the configuration phase
   * 
   * This packet provides the client with its official UUID and username as
   * recognized by the server, along with any associated skin or cape properties.
   */
  export interface CLoginSuccess {
    /**
     * The unique identifier assigned to the player.
     */
    uuid: Uuid,
    /**
     * The player's verified username.
     */
    username: string,
    /**
     * A list of properties for the player's profile, such as skin data and signatures.
     * This is typically retrieved from the Mojang authentication servers.
     */
    properties: Array<Property>,
    /**
     * (<1.21.2) Whether strict error handling should be enabled.
     */
    strictErrorHandling: boolean,
    /**
     * Added in 26.2
     */
    sessionId: Uuid,
  }
  export interface PlayerActionAddPlayer {
    name: string,
    properties: Array<Property>,
  }
  export type PlayerAction = PlayerActionAddPlayer | PlayerActionInitializeChat | PlayerActionUpdateGameMode | PlayerActionUpdateListed | PlayerActionUpdateLatency | PlayerActionUpdateDisplayName | PlayerActionUpdateListOrder | PlayerActionUpdateHat;
  export interface PlayerActionAddPlayer {
    tag: 'add-player',
    val: PlayerActionAddPlayer,
  }
  export interface PlayerActionInitializeChat {
    tag: 'initialize-chat',
    val: InitChat | undefined,
  }
  export interface PlayerActionUpdateGameMode {
    tag: 'update-game-mode',
    val: number,
  }
  export interface PlayerActionUpdateListed {
    tag: 'update-listed',
    val: boolean,
  }
  export interface PlayerActionUpdateLatency {
    tag: 'update-latency',
    val: number,
  }
  export interface PlayerActionUpdateDisplayName {
    tag: 'update-display-name',
    val: string | undefined,
  }
  /**
   * Added in 1.21.2
   */
  export interface PlayerActionUpdateListOrder {
    tag: 'update-list-order',
    val: number,
  }
  /**
   * Added in 1.21.4
   * Toggles the visibility of the player's hat layer (second skin layer).
   */
  export interface PlayerActionUpdateHat {
    tag: 'update-hat',
    val: boolean,
  }
  export interface Player {
    uuid: Uuid,
    actions: Array<PlayerAction>,
  }
  /**
   * Updates one or more players' information on the client.
   * 
   * This packet replaces the legacy "Player Info" packet with a more efficient
   * bitmask-driven approach. Instead of sending full data every time, the
   * server only sends the fields specified in the `actions` bitmask.
   */
  export interface CPlayerInfoUpdate {
    /**
     * The bitmask (`PlayerInfoFlags`) determining which data follows.
     */
    actions: number,
    /**
     * The list of players being updated. Each player entry contains
     * data fields in the order they appear in the bitmask.
     */
    players: Array<Player>,
  }
  export interface CUpdateAttributes {
    entityId: number,
    properties: Array<Property>,
  }
  export interface CUpdateEntityPos {
    entityId: number,
    delta: [number, number, number],
    onGround: boolean,
  }
  export interface CUpdateEntityPosRot {
    entityId: number,
    delta: [number, number, number],
    yaw: number,
    pitch: number,
    onGround: boolean,
  }
  export interface CUpdateEntityRot {
    entityId: number,
    yaw: number,
    pitch: number,
    onGround: boolean,
  }
  export interface CUpdateMobEffect {
    entityId: number,
    effectId: number,
    amplifier: number,
    duration: number,
    flags: number,
  }
  export interface CUpdateObjectives {
    objectiveName: string,
    mode: number,
    displayName: string,
    renderType: number,
    numberFormat?: string,
  }
  /**
   * # Variants
   * 
   * ## `"add"`
   * 
   * ## `"remove"`
   * 
   * ## `"update"`
   */
  export type Mode = 'add' | 'remove' | 'update';
  /**
   * # Variants
   * 
   * ## `"integer"`
   * 
   * ## `"hearts"`
   */
  export type RenderType = 'integer' | 'hearts';
  export interface CUpdateRecipes {
    rawData: Uint8Array,
  }
  /**
   * Sent by the server to create or update a score for an entity on a specific objective.
   * 
   * This packet is the primary way to manage scoreboard data. In the latest protocol,
   * it also supports optional custom formatting for how the numeric score is displayed.
   */
  export interface CUpdateScore {
    /**
     * The name of the entity whose score is being updated (e.g., a player's username
     * or a non-player entry like "Kills").
     */
    entityName: string,
    /**
     * The internal name of the objective this score belongs to.
     */
    objectiveName: string,
    /**
     * The actual integer value of the score.
     */
    value: number,
    /**
     * An optional custom name for the entity to be displayed in the scoreboard.
     * If `None`, the `entity_name` is used by default.
     */
    displayName?: string,
    /**
     * Optional formatting for the number (e.g., blank, fixed text, or styled).
     * This allows for scores to appear as something other than raw numbers.
     */
    numberFormat?: string,
  }
  export interface CUpdateTagsPlay {
    tags: Array<string>,
  }
  /**
   * # Variants
   * 
   * ## `"track"`
   * 
   * ## `"untrack"`
   * 
   * ## `"update"`
   */
  export type WaypointOperation = 'track' | 'untrack' | 'update';
  export interface WaypointTargetChunk {
    x: number,
    z: number,
  }
  export type WaypointTarget = WaypointTargetPosition | WaypointTargetChunk | WaypointTargetAzimuth | WaypointTargetEmpty;
  export interface WaypointTargetPosition {
    tag: 'position',
    val: [number, number, number],
  }
  export interface WaypointTargetChunk {
    tag: 'chunk',
    val: WaypointTargetChunk,
  }
  export interface WaypointTargetAzimuth {
    tag: 'azimuth',
    val: number,
  }
  export interface WaypointTargetEmpty {
    tag: 'empty',
  }
  export interface WaypointIcon {
    style?: string,
    color: number,
  }
  export interface TrackedWaypoint {
    identifier: Uuid,
    icon?: WaypointIcon,
    target: WaypointTarget,
  }
  /**
   * Syncs tracked waypoints (`ClientboundTrackedWaypointPacket`) to client.
   */
  export interface CWaypoint {
    operation: WaypointOperation,
    waypoint: TrackedWaypoint,
  }
  /**
   * Sent by the server to trigger a specific sound or particle effect at a world location.
   * 
   * This is used for a wide variety of effects, from breaking blocks and firework
   * explosions to splashing water or record playing.
   */
  export interface CWorldEvent {
    /**
     * The ID of the event to trigger (e.g., 1000 for a bow shoot, 2001 for block break).
     * Refer to the latest protocol registry for the full list of sound/particle IDs.
     */
    event: number,
    /**
     * The world coordinates where the effect should originate.
     */
    location: [number, number, number],
    /**
     * Additional metadata associated with the event.
     * 
     * For example, if breaking a block, this contains the block ID.
     * For firework particles, it may contain the color or type.
     */
    data: number,
    /**
     * If true, the sound will be played at a constant volume regardless of the
     * player's distance from the `location`.
     */
    disableRelativeVolume: boolean,
  }
  /**
   * Sent by the server to complete a latency check initiated by a `SStatusPingRequest`.
   * 
   * This is the final packet in the Server List Ping (SLP) sequence. It allows the
   * client to calculate the round-trip time (ping) to the server.
   */
  export interface StatusCPingResponse {
    /**
     * The exact 64-bit integer received from the client's ping request.
     * 
     * The client uses this value to ensure the response matches the specific
     * request it sent and to measure elapsed time.
     */
    payload: bigint,
  }
  /**
   * Sent by the server in response to a `SStatusRequest`.
   * 
   * This packet provides the client with the information required to display the
   * server in the multiplayer menu, including the MOTD, player count, and icon
   */
  export interface StatusCStatusResponse {
    /**
     * A JSON-encoded string containing the server's status data.
     * 
     * The maximum length of this string is 32,767 characters. It typically
     * includes fields for `version`, `players`, `description` (MOTD), and `favicon`
     */
    jsonResponse: string,
  }
  export type ServerboundPacket = ServerboundPacketConfigSAcceptCodeOfConduct | ServerboundPacketConfigSAcknowledgeFinishConfig | ServerboundPacketConfigSClientInformationConfig | ServerboundPacketConfigSConfigCookieResponse | ServerboundPacketConfigSCustomClickAction | ServerboundPacketConfigSKeepAlive | ServerboundPacketConfigSKnownPacks | ServerboundPacketConfigSPluginMessage | ServerboundPacketConfigSConfigPong | ServerboundPacketConfigSConfigResourcePack | ServerboundPacketLoginSLoginCookieResponse | ServerboundPacketLoginSLoginAcknowledged | ServerboundPacketLoginSLoginStart | ServerboundPacketLoginSLoginPluginResponse | ServerboundPacketSAttack | ServerboundPacketSBlockEntityTagQuery | ServerboundPacketSBundleItemSelected | ServerboundPacketSChangeDifficulty | ServerboundPacketSChangeGameMode | ServerboundPacketSChatAck | ServerboundPacketSChatCommand | ServerboundPacketSChatCommandSigned | ServerboundPacketSChatMessage | ServerboundPacketSChunkBatch | ServerboundPacketSClickSlot | ServerboundPacketSClientCommand | ServerboundPacketSClientInformationPlay | ServerboundPacketSClientTickEnd | ServerboundPacketSCloseContainer | ServerboundPacketSCommandSuggestion | ServerboundPacketSConfigurationAcknowledged | ServerboundPacketSContainerButtonClick | ServerboundPacketSContainerSlotStateChanged | ServerboundPacketSCookieResponse | ServerboundPacketSCustomClickAction | ServerboundPacketSCustomPayload | ServerboundPacketSDebugSampleSubscription | ServerboundPacketSDebugSubscriptionRequest | ServerboundPacketSEditBook | ServerboundPacketSEntityTagQuery | ServerboundPacketSInteract | ServerboundPacketSJigsawGenerate | ServerboundPacketSKeepAlive | ServerboundPacketSLockDifficulty | ServerboundPacketSMoveVehicle | ServerboundPacketSPaddleBoat | ServerboundPacketSPickItemFromBlock | ServerboundPacketSPickItemFromEntity | ServerboundPacketSPlayPingRequest | ServerboundPacketSPlaceRecipe | ServerboundPacketSPlayerAbilities | ServerboundPacketSPlayerAction | ServerboundPacketSPlayerCommand | ServerboundPacketSSetPlayerGround | ServerboundPacketSPlayerInput | ServerboundPacketSPlayerLoaded | ServerboundPacketSPlayerPosition | ServerboundPacketSPlayerPositionRotation | ServerboundPacketSPlayerRotation | ServerboundPacketSPlayerSession | ServerboundPacketSPlayPong | ServerboundPacketSRecipeBookChangeSettings | ServerboundPacketSRecipeBookSeenRecipe | ServerboundPacketSRenameItem | ServerboundPacketSPlayResourcePack | ServerboundPacketSSeenAdvancement | ServerboundPacketSSelectTrade | ServerboundPacketSSetBeacon | ServerboundPacketSSetCommandBlock | ServerboundPacketSSetCommandMinecart | ServerboundPacketSSetCreativeSlot | ServerboundPacketSSetGameRule | ServerboundPacketSSetHeldItem | ServerboundPacketSSetJigsawBlock | ServerboundPacketSSetStructureBlock | ServerboundPacketSSetTestBlock | ServerboundPacketSSpectateEntity | ServerboundPacketSTeleportToEntity | ServerboundPacketSTestInstanceBlockAction | ServerboundPacketSUpdateSign | ServerboundPacketSUseItem | ServerboundPacketSUseItemOn | ServerboundPacketStatusSStatusPingRequest | ServerboundPacketStatusSStatusRequest | ServerboundPacketUnknown;
  export interface ServerboundPacketConfigSAcceptCodeOfConduct {
    tag: 'config-s-accept-code-of-conduct',
  }
  /**
   * This packet signals to the server that the client is ready to transition
   * from the `Configuration` state to the `Play` state.
   */
  export interface ServerboundPacketConfigSAcknowledgeFinishConfig {
    tag: 'config-s-acknowledge-finish-config',
  }
  /**
   * Sent by the client to inform the server about its local settings
   */
  export interface ServerboundPacketConfigSClientInformationConfig {
    tag: 'config-s-client-information-config',
    val: ConfigSClientInformationConfig,
  }
  /**
   * Response to a `CCookieRequest` from the server during the configuration phase
   * 
   * Cookies allow servers to store small amounts of data on the client side,
   * which can be retrieved later (e.g., for session tracking or preferences)
   */
  export interface ServerboundPacketConfigSConfigCookieResponse {
    tag: 'config-s-config-cookie-response',
    val: ConfigSConfigCookieResponse,
  }
  export interface ServerboundPacketConfigSCustomClickAction {
    tag: 'config-s-custom-click-action',
    val: ConfigSCustomClickAction,
  }
  export interface ServerboundPacketConfigSKeepAlive {
    tag: 'config-s-keep-alive',
    val: ConfigSKeepAlive,
  }
  export interface ServerboundPacketConfigSKnownPacks {
    tag: 'config-s-known-packs',
    val: ConfigSKnownPacks,
  }
  /**
   * A packet used for custom communication between the client and server.
   * 
   * This allows mods, plugins, or proxy
   * software to send proprietary data over the standard Minecraft protocol.
   */
  export interface ServerboundPacketConfigSPluginMessage {
    tag: 'config-s-plugin-message',
    val: ConfigSPluginMessage,
  }
  export interface ServerboundPacketConfigSConfigPong {
    tag: 'config-s-config-pong',
    val: ConfigSConfigPong,
  }
  /**
   * Sent by the client to inform the server of the status of a requested resource pack.
   * 
   * This allows the server to know if the player is using the required textures
   * or if the download failed.
   */
  export interface ServerboundPacketConfigSConfigResourcePack {
    tag: 'config-s-config-resource-pack',
    val: ConfigSConfigResourcePack,
  }
  /**
   * Response to a `CCookieRequest` (login) from the server.
   * The Notchian server only accepts responses of up to 5 kiB in size.
   */
  export interface ServerboundPacketLoginSLoginCookieResponse {
    tag: 'login-s-login-cookie-response',
    val: LoginSLoginCookieResponse,
  }
  /**
   * Acknowledgement to the `CLoginSuccess` packet sent by the server.
   */
  export interface ServerboundPacketLoginSLoginAcknowledged {
    tag: 'login-s-login-acknowledged',
  }
  export interface ServerboundPacketLoginSLoginStart {
    tag: 'login-s-login-start',
    val: LoginSLoginStart,
  }
  export interface ServerboundPacketLoginSLoginPluginResponse {
    tag: 'login-s-login-plugin-response',
    val: LoginSLoginPluginResponse,
  }
  export interface ServerboundPacketSAttack {
    tag: 's-attack',
    val: SAttack,
  }
  export interface ServerboundPacketSBlockEntityTagQuery {
    tag: 's-block-entity-tag-query',
    val: SBlockEntityTagQuery,
  }
  export interface ServerboundPacketSBundleItemSelected {
    tag: 's-bundle-item-selected',
    val: SBundleItemSelected,
  }
  export interface ServerboundPacketSChangeDifficulty {
    tag: 's-change-difficulty',
    val: SChangeDifficulty,
  }
  export interface ServerboundPacketSChangeGameMode {
    tag: 's-change-game-mode',
    val: SChangeGameMode,
  }
  export interface ServerboundPacketSChatAck {
    tag: 's-chat-ack',
    val: SChatAck,
  }
  export interface ServerboundPacketSChatCommand {
    tag: 's-chat-command',
    val: SChatCommand,
  }
  export interface ServerboundPacketSChatCommandSigned {
    tag: 's-chat-command-signed',
    val: SChatCommandSigned,
  }
  export interface ServerboundPacketSChatMessage {
    tag: 's-chat-message',
    val: SChatMessage,
  }
  export interface ServerboundPacketSChunkBatch {
    tag: 's-chunk-batch',
    val: SChunkBatch,
  }
  export interface ServerboundPacketSClickSlot {
    tag: 's-click-slot',
    val: SClickSlot,
  }
  export interface ServerboundPacketSClientCommand {
    tag: 's-client-command',
    val: SClientCommand,
  }
  export interface ServerboundPacketSClientInformationPlay {
    tag: 's-client-information-play',
    val: SClientInformationPlay,
  }
  export interface ServerboundPacketSClientTickEnd {
    tag: 's-client-tick-end',
  }
  export interface ServerboundPacketSCloseContainer {
    tag: 's-close-container',
    val: SCloseContainer,
  }
  export interface ServerboundPacketSCommandSuggestion {
    tag: 's-command-suggestion',
    val: SCommandSuggestion,
  }
  export interface ServerboundPacketSConfigurationAcknowledged {
    tag: 's-configuration-acknowledged',
  }
  export interface ServerboundPacketSContainerButtonClick {
    tag: 's-container-button-click',
    val: SContainerButtonClick,
  }
  export interface ServerboundPacketSContainerSlotStateChanged {
    tag: 's-container-slot-state-changed',
    val: SContainerSlotStateChanged,
  }
  /**
   * Response to a `CCookieRequest` (play) from the server.
   * The Notchian (vanilla) server only accepts responses of up to 5 KiB in size.
   */
  export interface ServerboundPacketSCookieResponse {
    tag: 's-cookie-response',
    val: SCookieResponse,
  }
  export interface ServerboundPacketSCustomClickAction {
    tag: 's-custom-click-action',
    val: SCustomClickAction,
  }
  /**
   * A packet used for custom communication between the client and server.
   * 
   * This allows mods, plugins, or proxy software to send proprietary data over the standard
   * Minecraft protocol.
   */
  export interface ServerboundPacketSCustomPayload {
    tag: 's-custom-payload',
    val: SCustomPayload,
  }
  export interface ServerboundPacketSDebugSampleSubscription {
    tag: 's-debug-sample-subscription',
    val: SDebugSampleSubscription,
  }
  export interface ServerboundPacketSDebugSubscriptionRequest {
    tag: 's-debug-subscription-request',
    val: SDebugSubscriptionRequest,
  }
  export interface ServerboundPacketSEditBook {
    tag: 's-edit-book',
    val: SEditBook,
  }
  export interface ServerboundPacketSEntityTagQuery {
    tag: 's-entity-tag-query',
    val: SEntityTagQuery,
  }
  export interface ServerboundPacketSInteract {
    tag: 's-interact',
    val: SInteract,
  }
  export interface ServerboundPacketSJigsawGenerate {
    tag: 's-jigsaw-generate',
    val: SJigsawGenerate,
  }
  export interface ServerboundPacketSKeepAlive {
    tag: 's-keep-alive',
    val: SKeepAlive,
  }
  export interface ServerboundPacketSLockDifficulty {
    tag: 's-lock-difficulty',
    val: SLockDifficulty,
  }
  export interface ServerboundPacketSMoveVehicle {
    tag: 's-move-vehicle',
    val: SMoveVehicle,
  }
  export interface ServerboundPacketSPaddleBoat {
    tag: 's-paddle-boat',
    val: SPaddleBoat,
  }
  export interface ServerboundPacketSPickItemFromBlock {
    tag: 's-pick-item-from-block',
    val: SPickItemFromBlock,
  }
  export interface ServerboundPacketSPickItemFromEntity {
    tag: 's-pick-item-from-entity',
    val: SPickItemFromEntity,
  }
  export interface ServerboundPacketSPlayPingRequest {
    tag: 's-play-ping-request',
    val: SPlayPingRequest,
  }
  export interface ServerboundPacketSPlaceRecipe {
    tag: 's-place-recipe',
    val: SPlaceRecipe,
  }
  export interface ServerboundPacketSPlayerAbilities {
    tag: 's-player-abilities',
    val: SPlayerAbilities,
  }
  export interface ServerboundPacketSPlayerAction {
    tag: 's-player-action',
    val: SPlayerAction,
  }
  export interface ServerboundPacketSPlayerCommand {
    tag: 's-player-command',
    val: SPlayerCommand,
  }
  export interface ServerboundPacketSSetPlayerGround {
    tag: 's-set-player-ground',
    val: SSetPlayerGround,
  }
  export interface ServerboundPacketSPlayerInput {
    tag: 's-player-input',
    val: SPlayerInput,
  }
  /**
   * Added in 1.21.4
   */
  export interface ServerboundPacketSPlayerLoaded {
    tag: 's-player-loaded',
  }
  export interface ServerboundPacketSPlayerPosition {
    tag: 's-player-position',
    val: SPlayerPosition,
  }
  export interface ServerboundPacketSPlayerPositionRotation {
    tag: 's-player-position-rotation',
    val: SPlayerPositionRotation,
  }
  export interface ServerboundPacketSPlayerRotation {
    tag: 's-player-rotation',
    val: SPlayerRotation,
  }
  export interface ServerboundPacketSPlayerSession {
    tag: 's-player-session',
    val: SPlayerSession,
  }
  export interface ServerboundPacketSPlayPong {
    tag: 's-play-pong',
    val: SPlayPong,
  }
  export interface ServerboundPacketSRecipeBookChangeSettings {
    tag: 's-recipe-book-change-settings',
    val: SRecipeBookChangeSettings,
  }
  export interface ServerboundPacketSRecipeBookSeenRecipe {
    tag: 's-recipe-book-seen-recipe',
    val: SRecipeBookSeenRecipe,
  }
  export interface ServerboundPacketSRenameItem {
    tag: 's-rename-item',
    val: SRenameItem,
  }
  export interface ServerboundPacketSPlayResourcePack {
    tag: 's-play-resource-pack',
    val: SPlayResourcePack,
  }
  export interface ServerboundPacketSSeenAdvancement {
    tag: 's-seen-advancement',
    val: SSeenAdvancement,
  }
  export interface ServerboundPacketSSelectTrade {
    tag: 's-select-trade',
    val: SSelectTrade,
  }
  export interface ServerboundPacketSSetBeacon {
    tag: 's-set-beacon',
    val: SSetBeacon,
  }
  export interface ServerboundPacketSSetCommandBlock {
    tag: 's-set-command-block',
    val: SSetCommandBlock,
  }
  export interface ServerboundPacketSSetCommandMinecart {
    tag: 's-set-command-minecart',
    val: SSetCommandMinecart,
  }
  export interface ServerboundPacketSSetCreativeSlot {
    tag: 's-set-creative-slot',
    val: SSetCreativeSlot,
  }
  export interface ServerboundPacketSSetGameRule {
    tag: 's-set-game-rule',
    val: SSetGameRule,
  }
  export interface ServerboundPacketSSetHeldItem {
    tag: 's-set-held-item',
    val: SSetHeldItem,
  }
  export interface ServerboundPacketSSetJigsawBlock {
    tag: 's-set-jigsaw-block',
    val: SSetJigsawBlock,
  }
  export interface ServerboundPacketSSetStructureBlock {
    tag: 's-set-structure-block',
    val: SSetStructureBlock,
  }
  export interface ServerboundPacketSSetTestBlock {
    tag: 's-set-test-block',
    val: SSetTestBlock,
  }
  export interface ServerboundPacketSSpectateEntity {
    tag: 's-spectate-entity',
    val: SSpectateEntity,
  }
  export interface ServerboundPacketSTeleportToEntity {
    tag: 's-teleport-to-entity',
    val: STeleportToEntity,
  }
  export interface ServerboundPacketSTestInstanceBlockAction {
    tag: 's-test-instance-block-action',
    val: STestInstanceBlockAction,
  }
  export interface ServerboundPacketSUpdateSign {
    tag: 's-update-sign',
    val: SUpdateSign,
  }
  export interface ServerboundPacketSUseItem {
    tag: 's-use-item',
    val: SUseItem,
  }
  export interface ServerboundPacketSUseItemOn {
    tag: 's-use-item-on',
    val: SUseItemOn,
  }
  /**
   * Sent by the client to measure the round-trip time (latency) to the server.
   * 
   * This is the second part of the Server List Ping (SLP) process
   * The server should respond with `CPingResponse`.
   */
  export interface ServerboundPacketStatusSStatusPingRequest {
    tag: 'status-s-status-ping-request',
    val: StatusSStatusPingRequest,
  }
  /**
   * Sent by the client to request the server's current status information.
   * 
   * This is the first packet sent during the "Status" state.
   * The server should respond with `CStatusResponse`.
   */
  export interface ServerboundPacketStatusSStatusRequest {
    tag: 'status-s-status-request',
  }
  export interface ServerboundPacketUnknown {
    tag: 'unknown',
  }
  export type ClientboundPacket = ClientboundPacketConfigCConfigAddResourcePack | ClientboundPacketConfigCConfigClearDialog | ClientboundPacketConfigCCodeOfConduct | ClientboundPacketConfigCConfigDisconnect | ClientboundPacketConfigCCookieRequest | ClientboundPacketConfigCConfigCustomReportDetails | ClientboundPacketConfigCFeatureFlags | ClientboundPacketConfigCFinishConfig | ClientboundPacketConfigCKnownPacks | ClientboundPacketConfigCConfigPing | ClientboundPacketConfigCPluginMessage | ClientboundPacketConfigCConfigPostEffects | ClientboundPacketConfigCRegistryData | ClientboundPacketConfigCConfigRemoveResourcePack | ClientboundPacketConfigCConfigResetChat | ClientboundPacketConfigCConfigServerLinks | ClientboundPacketConfigCConfigShowDialog | ClientboundPacketConfigCStoreCookie | ClientboundPacketConfigCTransfer | ClientboundPacketConfigCUpdateTags | ClientboundPacketLoginCLoginCookieRequest | ClientboundPacketLoginCLoginDisconnect | ClientboundPacketLoginCLoginPluginRequest | ClientboundPacketLoginCSetCompression | ClientboundPacketCAcknowledgeBlockChange | ClientboundPacketCActionBar | ClientboundPacketCAddResourcePack | ClientboundPacketCAwardStats | ClientboundPacketCSetBlockDestroyStage | ClientboundPacketCBlockEntityData | ClientboundPacketCBlockEvent | ClientboundPacketCBlockUpdate | ClientboundPacketCBossEvent | ClientboundPacketCBundleDelimiter | ClientboundPacketCCenterChunk | ClientboundPacketCChangeDifficulty | ClientboundPacketCChunkBatchEnd | ClientboundPacketCChunkBatchStart | ClientboundPacketCChunksBiomes | ClientboundPacketCPlayClearDialog | ClientboundPacketCClearTitle | ClientboundPacketCCloseContainer | ClientboundPacketCCombatDeath | ClientboundPacketCCombatEnter | ClientboundPacketCCombatEnd | ClientboundPacketCCommandSuggestions | ClientboundPacketCCommands | ClientboundPacketCPlayCookieRequest | ClientboundPacketCCustomChatCompletions | ClientboundPacketCCustomPayload | ClientboundPacketCPlayCustomReportDetails | ClientboundPacketCDamageEvent | ClientboundPacketCDebugBlockValue | ClientboundPacketCDebugChunkValue | ClientboundPacketCDebugEntityValue | ClientboundPacketCDebugEvent | ClientboundPacketCDebugSample | ClientboundPacketCDeleteChat | ClientboundPacketCPlayDisconnect | ClientboundPacketCDisguisedChatMessage | ClientboundPacketCDisplayObjective | ClientboundPacketCEntityAnimation | ClientboundPacketCSetEntityMetadata | ClientboundPacketCEntitySoundEffect | ClientboundPacketCEntityStatus | ClientboundPacketCEntityVelocity | ClientboundPacketCExplosion | ClientboundPacketCGameEvent | ClientboundPacketCGameRuleValues | ClientboundPacketCGameTestHighlightPos | ClientboundPacketCHeadRot | ClientboundPacketCHurtAnimation | ClientboundPacketCInitializeWorldBorder | ClientboundPacketCItemCooldown | ClientboundPacketCKeepAlive | ClientboundPacketCLevelEvent | ClientboundPacketCLightUpdate | ClientboundPacketCLogin | ClientboundPacketCLowDiskSpaceWarning | ClientboundPacketCMapItemData | ClientboundPacketCMerchantOffers | ClientboundPacketCMoveMinecartAlongTrack | ClientboundPacketCMoveVehicle | ClientboundPacketCMultiBlockUpdate | ClientboundPacketCOpenBook | ClientboundPacketCOpenMountScreen | ClientboundPacketCOpenScreen | ClientboundPacketCOpenSignEditor | ClientboundPacketCParticle | ClientboundPacketCPlayPing | ClientboundPacketCPingResponse | ClientboundPacketCPlaceGhostRecipe | ClientboundPacketCPlayerAbilities | ClientboundPacketCPlayerChatMessage | ClientboundPacketCPlayerInfoUpdate | ClientboundPacketCPlayerLookAt | ClientboundPacketCPlayerPosition | ClientboundPacketCRemovePlayerInfo | ClientboundPacketCPlayerRotation | ClientboundPacketCPlayerSpawnPosition | ClientboundPacketCPostEffects | ClientboundPacketCProjectilePower | ClientboundPacketCRecipeBookAdd | ClientboundPacketCRecipeBookRemove | ClientboundPacketCRecipeBookSettings | ClientboundPacketCRemoveEntities | ClientboundPacketCRemoveMobEffect | ClientboundPacketCRemoveResourcePack | ClientboundPacketCResetScore | ClientboundPacketCRespawn | ClientboundPacketCSelectAdvancementsTab | ClientboundPacketCServerData | ClientboundPacketCPlayServerLinks | ClientboundPacketCSetBorderCenter | ClientboundPacketCSetBorderLerpSize | ClientboundPacketCSetBorderSize | ClientboundPacketCSetBorderWarningDelay | ClientboundPacketCSetBorderWarningDistance | ClientboundPacketCSetCamera | ClientboundPacketCSetChunkCacheRadius | ClientboundPacketCSetContainerContent | ClientboundPacketCSetContainerProperty | ClientboundPacketCSetContainerSlot | ClientboundPacketCSetCursorItem | ClientboundPacketCSetEntityLink | ClientboundPacketCSetEquipment | ClientboundPacketCSetExperience | ClientboundPacketCSetHealth | ClientboundPacketCSetPassengers | ClientboundPacketCSetPlayerInventory | ClientboundPacketCSetPlayerTeam | ClientboundPacketCSetSimulationDistance | ClientboundPacketCUpdateTime | ClientboundPacketCTitleText | ClientboundPacketCTitleAnimation | ClientboundPacketCPlayShowDialog | ClientboundPacketCSoundEffect | ClientboundPacketCSpawnEntity | ClientboundPacketCStartConfiguration | ClientboundPacketCStopSound | ClientboundPacketCStoreCookie | ClientboundPacketCSubtitle | ClientboundPacketCTabList | ClientboundPacketCTagQueryResponse | ClientboundPacketCTakeItemEntity | ClientboundPacketCTeleportEntity | ClientboundPacketCTestInstanceBlockStatus | ClientboundPacketCTickingState | ClientboundPacketCTickingStep | ClientboundPacketCTransfer | ClientboundPacketCUnloadChunk | ClientboundPacketCUpdateAdvancements | ClientboundPacketCUpdateAttributes | ClientboundPacketCUpdateEntityPos | ClientboundPacketCUpdateEntityPosRot | ClientboundPacketCUpdateEntityRot | ClientboundPacketCUpdateMobEffect | ClientboundPacketCUpdateObjectives | ClientboundPacketCUpdateRecipes | ClientboundPacketCUpdateScore | ClientboundPacketCWaypoint | ClientboundPacketCWorldEvent | ClientboundPacketStatusCPingResponse | ClientboundPacketStatusCStatusResponse | ClientboundPacketUnknown;
  export interface ClientboundPacketConfigCConfigAddResourcePack {
    tag: 'config-c-config-add-resource-pack',
    val: ConfigCConfigAddResourcePack,
  }
  export interface ClientboundPacketConfigCConfigClearDialog {
    tag: 'config-c-config-clear-dialog',
  }
  export interface ClientboundPacketConfigCCodeOfConduct {
    tag: 'config-c-code-of-conduct',
    val: ConfigCCodeOfConduct,
  }
  export interface ClientboundPacketConfigCConfigDisconnect {
    tag: 'config-c-config-disconnect',
    val: ConfigCConfigDisconnect,
  }
  /**
   * Requests a cookie that was previously stored.
   */
  export interface ClientboundPacketConfigCCookieRequest {
    tag: 'config-c-cookie-request',
    val: ConfigCCookieRequest,
  }
  export interface ClientboundPacketConfigCConfigCustomReportDetails {
    tag: 'config-c-config-custom-report-details',
    val: ConfigCConfigCustomReportDetails,
  }
  export interface ClientboundPacketConfigCFeatureFlags {
    tag: 'config-c-feature-flags',
    val: ConfigCFeatureFlags,
  }
  export interface ClientboundPacketConfigCFinishConfig {
    tag: 'config-c-finish-config',
  }
  export interface ClientboundPacketConfigCKnownPacks {
    tag: 'config-c-known-packs',
    val: ConfigCKnownPacks,
  }
  export interface ClientboundPacketConfigCConfigPing {
    tag: 'config-c-config-ping',
    val: ConfigCConfigPing,
  }
  export interface ClientboundPacketConfigCPluginMessage {
    tag: 'config-c-plugin-message',
    val: ConfigCPluginMessage,
  }
  export interface ClientboundPacketConfigCConfigPostEffects {
    tag: 'config-c-config-post-effects',
    val: ConfigCConfigPostEffects,
  }
  /**
   * Added in 1.20.2
   */
  export interface ClientboundPacketConfigCRegistryData {
    tag: 'config-c-registry-data',
    val: ConfigCRegistryData,
  }
  export interface ClientboundPacketConfigCConfigRemoveResourcePack {
    tag: 'config-c-config-remove-resource-pack',
    val: ConfigCConfigRemoveResourcePack,
  }
  export interface ClientboundPacketConfigCConfigResetChat {
    tag: 'config-c-config-reset-chat',
  }
  export interface ClientboundPacketConfigCConfigServerLinks {
    tag: 'config-c-config-server-links',
    val: ConfigCConfigServerLinks,
  }
  export interface ClientboundPacketConfigCConfigShowDialog {
    tag: 'config-c-config-show-dialog',
    val: ConfigCConfigShowDialog,
  }
  /**
   * Stores some arbitrary data on the client, which persists between server transfers.
   * The Notchian (vanilla) client only accepts cookies of up to 5 KiB in size.
   */
  export interface ClientboundPacketConfigCStoreCookie {
    tag: 'config-c-store-cookie',
    val: ConfigCStoreCookie,
  }
  export interface ClientboundPacketConfigCTransfer {
    tag: 'config-c-transfer',
    val: ConfigCTransfer,
  }
  export interface ClientboundPacketConfigCUpdateTags {
    tag: 'config-c-update-tags',
    val: ConfigCUpdateTags,
  }
  /**
   * Sent by the server to retrieve a previously stored cookie from the client.
   * 
   * This occurs during the login phase, allowing the server to identify
   * returning players or retrieve session data stored during a previous visit.
   */
  export interface ClientboundPacketLoginCLoginCookieRequest {
    tag: 'login-c-login-cookie-request',
    val: LoginCLoginCookieRequest,
  }
  /**
   * Sent by the server to reject a login attempt or kick a player during the login phase
   * 
   * This is used for reasons such as the server being full, the player being banned,
   * or version mismatches. After this packet is sent, the connection is closed.
   */
  export interface ClientboundPacketLoginCLoginDisconnect {
    tag: 'login-c-login-disconnect',
    val: LoginCLoginDisconnect,
  }
  /**
   * Sent by the server to initiate a custom plugin messaging exchange during login.
   * 
   * This is used by server software (like proxies or anti-cheats) to request
   * information from a client-side mod before the player officially joins.
   */
  export interface ClientboundPacketLoginCLoginPluginRequest {
    tag: 'login-c-login-plugin-request',
    val: LoginCLoginPluginRequest,
  }
  /**
   * Sent by the server to enable network compression for all subsequent packets.
   * 
   * Once this packet is sent, both the server and the client must compress any
   * packet with a size equal to or greater than the specified threshold.
   */
  export interface ClientboundPacketLoginCSetCompression {
    tag: 'login-c-set-compression',
    val: LoginCSetCompression,
  }
  /**
   * Sent by the server to acknowledge a sequence of block changes initiated by the client.
   * 
   * This packet is critical for preventing "ghost blocks" and synchronization issues.
   * It tells the client that the server has processed all actions up to a specific point.
   */
  export interface ClientboundPacketCAcknowledgeBlockChange {
    tag: 'c-acknowledge-block-change',
    val: CAcknowledgeBlockChange,
  }
  /**
   * Updates the text displayed above the player's hotbar (the Action Bar).
   * 
   * Unlike chat messages, Action Bar text is transient and generally used for
   * non-critical status information like "Now entering: Wilderness" or
   * mana/stamina counters.
   */
  export interface ClientboundPacketCActionBar {
    tag: 'c-action-bar',
    val: CActionBar,
  }
  export interface ClientboundPacketCAddResourcePack {
    tag: 'c-add-resource-pack',
    val: CAddResourcePack,
  }
  export interface ClientboundPacketCAwardStats {
    tag: 'c-award-stats',
    val: CAwardStats,
  }
  /**
   * Updates the visual "breaking" progress of a block for all clients.
   * 
   * This packet controls the overlay of cracks that appear on a block when
   * it is being mined. It is often used to show other players' mining progress.
   */
  export interface ClientboundPacketCSetBlockDestroyStage {
    tag: 'c-set-block-destroy-stage',
    val: CSetBlockDestroyStage,
  }
  /**
   * Updates the NBT data of a block entity (e.g., signs, chests, or banners).
   * 
   * This packet is sent by the server when a block entity's state changes
   * (like text on a sign) or when the block entity is loaded into the client's view.
   */
  export interface ClientboundPacketCBlockEntityData {
    tag: 'c-block-entity-data',
    val: CBlockEntityData,
  }
  /**
   * Triggers a physical block animation or sound effect.
   * 
   * This is used for simple block interactions that don't necessarily change
   * NBT data, such as chests opening/closing, pistons extending, or note blocks playing.
   */
  export interface ClientboundPacketCBlockEvent {
    tag: 'c-block-event',
    val: CBlockEvent,
  }
  /**
   * Updates a single block state at a specific location in the world.
   * 
   * This is the most common way to sync world changes to the client, such as
   * when a player places a block, a fluid flows, or a redstone component toggles.
   */
  export interface ClientboundPacketCBlockUpdate {
    tag: 'c-block-update',
    val: CBlockUpdate,
  }
  /**
   * Updates the "Boss Bar" displayed at the top of the player's screen.
   * 
   * This packet is used to manage health bars for entities like the Ender Dragon
   * or Wither, as well as custom progress bars for server events or raids.
   */
  export interface ClientboundPacketCBossEvent {
    tag: 'c-boss-event',
    val: CBossEvent,
  }
  export interface ClientboundPacketCBundleDelimiter {
    tag: 'c-bundle-delimiter',
  }
  /**
   * Updates the center of the player's loaded chunk radius (the "view center").
   * 
   * This packet tells the client which chunk coordinate it should use as the
   * focal point for loading and unloading chunks. It is typically sent when
   * a player moves across a chunk boundary.
   */
  export interface ClientboundPacketCCenterChunk {
    tag: 'c-center-chunk',
    val: CCenterChunk,
  }
  /**
   * Notifies the client of a change in the world's difficulty level or lock status.
   * 
   * This updates the client's internal state, which affects certain UI elements
   * and client-side behavior (though actual game logic like mob damage is
   * primarily handled by the server).
   */
  export interface ClientboundPacketCChangeDifficulty {
    tag: 'c-change-difficulty',
    val: CChangeDifficulty,
  }
  /**
   * Notifies the client that the server has finished sending a batch of chunks.
   * 
   * Introduced in modern protocol versions to optimize world loading, this packet
   * allows the client to acknowledge the receipt of a group of chunks, helping
   * the server regulate the flow of data and prevent network congestion.
   */
  export interface ClientboundPacketCChunkBatchEnd {
    tag: 'c-chunk-batch-end',
    val: CChunkBatchEnd,
  }
  /**
   * Signals the beginning of a new batch of chunk data packets.
   * 
   * This packet initiates a synchronized chunk loading sequence. In modern
   * protocol versions, the server must wrap chunk data transmissions between
   * a `Start` and `End` packet to manage client-side backpressure and
   * network throughput.
   */
  export interface ClientboundPacketCChunkBatchStart {
    tag: 'c-chunk-batch-start',
  }
  export interface ClientboundPacketCChunksBiomes {
    tag: 'c-chunks-biomes',
    val: CChunksBiomes,
  }
  export interface ClientboundPacketCPlayClearDialog {
    tag: 'c-play-clear-dialog',
  }
  /**
   * Removes any currently displayed Title or Subtitle from the player's screen.
   * 
   * This packet is used to immediately hide titles that are currently in their
   * "stay" or "fade-out" phases.
   */
  export interface ClientboundPacketCClearTitle {
    tag: 'c-clear-title',
    val: CClearTitle,
  }
  /**
   * Notifies the client that a container (inventory, chest, etc.) has been closed.
   * 
   * This is used by the server to force the player's UI to shut, for example,
   * if the player moves too far away from a chest or if an NPC's trade window
   * is invalidated.
   */
  export interface ClientboundPacketCCloseContainer {
    tag: 'c-close-container',
    val: CCloseContainer,
  }
  /**
   * Notifies the client that a player has died.
   * 
   * This packet is responsible for triggering the death screen on the client
   * and displaying the death message in the chat for the deceased player.
   */
  export interface ClientboundPacketCCombatDeath {
    tag: 'c-combat-death',
    val: CCombatDeath,
  }
  export interface ClientboundPacketCCombatEnter {
    tag: 'c-combat-enter',
  }
  export interface ClientboundPacketCCombatEnd {
    tag: 'c-combat-end',
    val: CCombatEnd,
  }
  /**
   * Sent by the server to provide a list of "tab-completion" suggestions.
   * 
   * This packet responds to a client's request for help with commands,
   * appearing as a scrollable list of options while the player is typing
   * in the chat bar.
   */
  export interface ClientboundPacketCCommandSuggestions {
    tag: 'c-command-suggestions',
    val: CCommandSuggestions,
  }
  /**
   * Sends the entire command tree to the client for client-side parsing and tab-completion.
   * 
   * Minecraft uses the "Brigadier" command system. This packet informs the client
   * which commands exist, their arguments, and how they branch, allowing the
   * client to highlight syntax errors in red before the command is even sent.
   */
  export interface ClientboundPacketCCommands {
    tag: 'c-commands',
    val: CCommands,
  }
  /**
   * Sent by the server to request a "cookie" (stored data) from the client.
   * 
   * Introduced in modern Minecraft versions, cookies allow servers to store
   * small amounts of persistent data on the client side that can be retrieved
   * even across different server instances or sub-servers in a network.
   */
  export interface ClientboundPacketCPlayCookieRequest {
    tag: 'c-play-cookie-request',
    val: CPlayCookieRequest,
  }
  export interface ClientboundPacketCCustomChatCompletions {
    tag: 'c-custom-chat-completions',
    val: CCustomChatCompletions,
  }
  /**
   * A packet used for custom communication between the server and client.
   */
  export interface ClientboundPacketCCustomPayload {
    tag: 'c-custom-payload',
    val: CCustomPayload,
  }
  export interface ClientboundPacketCPlayCustomReportDetails {
    tag: 'c-play-custom-report-details',
    val: CPlayCustomReportDetails,
  }
  /**
   * Notifies the client that an entity has taken damage.
   * 
   * This packet is used to trigger damage animations (like the red tint on mobs),
   * directional knockback visuals, and sound effects. It provides the client
   * with specific details about the damage source to ensure the visual feedback
   * matches the cause.
   */
  export interface ClientboundPacketCDamageEvent {
    tag: 'c-damage-event',
    val: CDamageEvent,
  }
  export interface ClientboundPacketCDebugBlockValue {
    tag: 'c-debug-block-value',
    val: CDebugBlockValue,
  }
  export interface ClientboundPacketCDebugChunkValue {
    tag: 'c-debug-chunk-value',
    val: CDebugChunkValue,
  }
  export interface ClientboundPacketCDebugEntityValue {
    tag: 'c-debug-entity-value',
    val: CDebugEntityValue,
  }
  export interface ClientboundPacketCDebugEvent {
    tag: 'c-debug-event',
    val: CDebugEvent,
  }
  export interface ClientboundPacketCDebugSample {
    tag: 'c-debug-sample',
    val: CDebugSample,
  }
  export interface ClientboundPacketCDeleteChat {
    tag: 'c-delete-chat',
    val: CDeleteChat,
  }
  /**
   * Forces the client to disconnect from the server while in the "Play" state.
   * 
   * This packet displays the provided reason to the player on a dedicated
   * disconnection screen. It is used for kicks, server shutdowns, or when
   * a player is banned.
   */
  export interface ClientboundPacketCPlayDisconnect {
    tag: 'c-play-disconnect',
    val: CPlayDisconnect,
  }
  /**
   * Sends a chat message that is not cryptographically signed by a player.
   * 
   * Introduced to support server-side "disguised" identities (like /say or NPC chat),
   * this packet bypasses the player-to-player chat signing requirements while
   * still allowing the client to format the message using the standard chat registry.
   */
  export interface ClientboundPacketCDisguisedChatMessage {
    tag: 'c-disguised-chat-message',
    val: CDisguisedChatMessage,
  }
  /**
   * Instructs the client to display a specific scoreboard objective in a given slot.
   * 
   * This packet is the final step in showing a scoreboard to a player. After
   * an objective is created and populated with scores, this packet "maps"
   * that objective to a visual location like the sidebar or the player list.
   */
  export interface ClientboundPacketCDisplayObjective {
    tag: 'c-display-objective',
    val: CDisplayObjective,
  }
  /**
   * Triggers a specific animation for an entity that is visible to the client.
   * 
   * This is primarily used for player-driven animations like swinging an arm
   * or showing damage, but it can apply to other entities as well.
   */
  export interface ClientboundPacketCEntityAnimation {
    tag: 'c-entity-animation',
    val: CEntityAnimation,
  }
  /**
   * Updates the "Data Tracker" values for an entity.
   * 
   * Entity Metadata (or `DataWatchers`) controls persistent visual states that
   * don't require a full packet to update, such as whether an entity is on fire,
   * crouching, glowing, or the custom name displayed above its head.
   */
  export interface ClientboundPacketCSetEntityMetadata {
    tag: 'c-set-entity-metadata',
    val: CSetEntityMetadata,
  }
  /**
   * Plays a sound effect that originates from a specific entity.
   * 
   * Unlike global sounds, this sound will follow the entity as it moves
   * through the world. The client handles the panning and attenuation
   * (volume drop-off) based on the distance between the player and the entity.
   */
  export interface ClientboundPacketCEntitySoundEffect {
    tag: 'c-entity-sound-effect',
    val: CEntitySoundEffect,
  }
  /**
   * Sends a status update for a specific entity.
   * 
   * This packet is a "catch-all" for various entity triggers that don't
   * warrant a complex packet of their own. It primarily handles visual
   * and logical state triggers, such as tool breaking, totem usage,
   * or sheep shearing.
   */
  export interface ClientboundPacketCEntityStatus {
    tag: 'c-entity-status',
    val: CEntityStatus,
  }
  /**
   * Updates the velocity of an entity.
   * 
   * This packet informs the client of a sudden change in an entity's movement,
   * such as knockback from an attack, explosions, or being launched by a piston.
   */
  export interface ClientboundPacketCEntityVelocity {
    tag: 'c-entity-velocity',
    val: CEntityVelocity,
  }
  /**
   * Notifies the client that an explosion has occurred.
   * 
   * This is a high-level packet that handles the visual, auditory, and physical
   * effects of an explosion in a single call. It triggers the explosion particles,
   * plays the sound at the source, and applies knockback to the player.
   */
  export interface ClientboundPacketCExplosion {
    tag: 'c-explosion',
    val: CExplosion,
  }
  /**
   * Updates the game state or triggers specific environmental changes.
   * 
   * This packet is the primary way the server communicates global or
   * context-specific transitions, such as changing the weather,
   * altering the player's gamemode, or displaying the credits.
   */
  export interface ClientboundPacketCGameEvent {
    tag: 'c-game-event',
    val: CGameEvent,
  }
  export interface ClientboundPacketCGameRuleValues {
    tag: 'c-game-rule-values',
    val: CGameRuleValues,
  }
  export interface ClientboundPacketCGameTestHighlightPos {
    tag: 'c-game-test-highlight-pos',
    val: CGameTestHighlightPos,
  }
  /**
   * Rotates an entity's head to a specific yaw.
   * 
   * In Minecraft, an entity's "body yaw" and "head yaw" are separate.
   * While standard movement packets update the body, this packet is
   * required to make an entity (like a player or a mob) look in a
   * specific direction without necessarily turning its entire body.
   */
  export interface ClientboundPacketCHeadRot {
    tag: 'c-head-rot',
    val: CHeadRot,
  }
  /**
   * Triggers the "hurt" visual effect on an entity.
   * 
   * This packet causes the entity to turn red and perform a directional
   * camera shake or model tilt. It is typically sent immediately after
   * an entity's health is reduced.
   */
  export interface ClientboundPacketCHurtAnimation {
    tag: 'c-hurt-animation',
    val: CHurtAnimation,
  }
  /**
   * Fully initializes the world border for the client.
   * 
   * This packet is sent when a player joins the world or changes dimensions.
   * It synchronizes the current position, size, and all warning parameters
   * to ensure the client-side visual barrier matches the server's authority.
   */
  export interface ClientboundPacketCInitializeWorldBorder {
    tag: 'c-initialize-world-border',
    val: CInitializeWorldBorder,
  }
  export interface ClientboundPacketCItemCooldown {
    tag: 'c-item-cooldown',
    val: CItemCooldown,
  }
  /**
   * Maintains the connection and measures latency (ping) between client and server.
   * 
   * The server sends this packet at regular intervals (typically every 15–20 seconds).
   * The client must respond with the exact same ID. If the server does not receive
   * a response within a timeout period (usually 30 seconds), it will disconnect
   * the player with a "Timed Out" message.
   */
  export interface ClientboundPacketCKeepAlive {
    tag: 'c-keep-alive',
    val: CKeepAlive,
  }
  /**
   * Triggers a specific sound or particle effect at a world location.
   * 
   * This packet handles a wide variety of "world-level" events, such as
   * block breaking particles, firework explosions, or ambient sounds
   * like doors opening and portals humming.
   */
  export interface ClientboundPacketCLevelEvent {
    tag: 'c-level-event',
    val: CLevelEvent,
  }
  /**
   * Sent by the server to update light levels (block light and sky light) for a chunk.
   * 
   * This packet updates lighting data for a specific chunk without sending the full chunk data.
   * It was introduced in Minecraft 1.14 (protocol version 477).
   */
  export interface ClientboundPacketCLightUpdate {
    tag: 'c-light-update',
    val: CLightUpdate,
  }
  /**
   * The "Join Game" packet that transitions the client from the Configuration state
   * to the Play state.
   * 
   * This is one of the largest and most important packets in the protocol. It
   * initializes the player's world view, dimension settings, and local game
   * rules. Once received, the client begins rendering the world.
   */
  export interface ClientboundPacketCLogin {
    tag: 'c-login',
    val: CLogin,
  }
  /**
   * Warns the client that the server is running low on disk space.
   * 
   * Added in 26.1. This packet informs the client to display a warning
   * overlay/notification about low storage.
   */
  export interface ClientboundPacketCLowDiskSpaceWarning {
    tag: 'c-low-disk-space-warning',
  }
  export interface ClientboundPacketCMapItemData {
    tag: 'c-map-item-data',
    val: CMapItemData,
  }
  export interface ClientboundPacketCMerchantOffers {
    tag: 'c-merchant-offers',
    val: CMerchantOffers,
  }
  export interface ClientboundPacketCMoveMinecartAlongTrack {
    tag: 'c-move-minecart-along-track',
    val: CMoveMinecartAlongTrack,
  }
  export interface ClientboundPacketCMoveVehicle {
    tag: 'c-move-vehicle',
    val: CMoveVehicle,
  }
  /**
   * Updates multiple blocks within a single chunk section (or chunk in older versions).
   * 
   * This packet is much more efficient than sending multiple individual
   * `CBlockUpdate` packets when many changes occur in the same area
   * (e.g., explosions, structure generation, or large-scale terraforming).
   */
  export interface ClientboundPacketCMultiBlockUpdate {
    tag: 'c-multi-block-update',
    val: CMultiBlockUpdate,
  }
  export interface ClientboundPacketCOpenBook {
    tag: 'c-open-book',
    val: COpenBook,
  }
  export interface ClientboundPacketCOpenMountScreen {
    tag: 'c-open-mount-screen',
    val: COpenMountScreen,
  }
  /**
   * Instructs the client to open a specific type of GUI (inventory, chest, etc.).
   * 
   * This packet is sent when a player interacts with a block (like a chest)
   * or when a command/plugin forces an interface to open. It establishes a
   * `sync_id` which must be used in all subsequent "Set Slot" or "Click Slot"
   * packets to ensure the server and client are talking about the same window.
   */
  export interface ClientboundPacketCOpenScreen {
    tag: 'c-open-screen',
    val: COpenScreen,
  }
  /**
   * Opens the sign text input screen for the client.
   * 
   * This packet is sent by the server to force the client to show the
   * sign editing interface. This usually happens immediately after a
   * player places a sign or interacts with an existing one (if allowed).
   */
  export interface ClientboundPacketCOpenSignEditor {
    tag: 'c-open-sign-editor',
    val: COpenSignEditor,
  }
  /**
   * Spawns a cluster of particles at a specific location.
   * 
   * This is the most versatile visual packet in the protocol. It allows for
   * precise control over particle density, spread, and speed. It can also
   * carry extra data for complex particles like redstone dust (color) or
   * block/item breaking (textures).
   */
  export interface ClientboundPacketCParticle {
    tag: 'c-particle',
    val: CParticle,
  }
  export interface ClientboundPacketCPlayPing {
    tag: 'c-play-ping',
    val: CPlayPing,
  }
  /**
   * Responds to a client-initiated ping request to synchronize game state.
   */
  export interface ClientboundPacketCPingResponse {
    tag: 'c-ping-response',
    val: CPingResponse,
  }
  export interface ClientboundPacketCPlaceGhostRecipe {
    tag: 'c-place-ghost-recipe',
    val: CPlaceGhostRecipe,
  }
  /**
   * Updates the player's movement and interaction abilities.
   * 
   * This packet informs the client about the player's state (flying, invulnerable)
   * and sets the movement speeds. While the client applies these visuals,
   * the server must still validate these states to prevent cheating.
   */
  export interface ClientboundPacketCPlayerAbilities {
    tag: 'c-player-abilities',
    val: CPlayerAbilities,
  }
  /**
   * Sends a cryptographically signed player chat message to the client.
   * 
   * This packet is the backbone of the modern secure chat system. It includes
   * tracking indices, digital signatures, and context for reporting.
   */
  export interface ClientboundPacketCPlayerChatMessage {
    tag: 'c-player-chat-message',
    val: CPlayerChatMessage,
  }
  /**
   * Updates one or more players' information on the client.
   * 
   * This packet replaces the legacy "Player Info" packet with a more efficient
   * bitmask-driven approach. Instead of sending full data every time, the
   * server only sends the fields specified in the `actions` bitmask.
   */
  export interface ClientboundPacketCPlayerInfoUpdate {
    tag: 'c-player-info-update',
    val: CPlayerInfoUpdate,
  }
  export interface ClientboundPacketCPlayerLookAt {
    tag: 'c-player-look-at',
    val: CPlayerLookAt,
  }
  /**
   * Updates the player's position and rotation on the client.
   * 
   * Commonly known as the "Teleport Packet," this is sent by the server to
   * force a change in the player's location. The client must respond with a
   * `Teleport Confirm` packet matching the `teleport_id`.
   */
  export interface ClientboundPacketCPlayerPosition {
    tag: 'c-player-position',
    val: CPlayerPosition,
  }
  /**
   * Sent by the server to remove one or more players from the client's player list (tab list).
   * 
   * This packet is typically used when a player leaves the server or becomes invisible
   * to the recipient (e.g., moving out of tracking range).
   */
  export interface ClientboundPacketCRemovePlayerInfo {
    tag: 'c-remove-player-info',
    val: CRemovePlayerInfo,
  }
  export interface ClientboundPacketCPlayerRotation {
    tag: 'c-player-rotation',
    val: CPlayerRotation,
  }
  /**
   * Sent by the server to set the client's default spawn point and compass target.
   * 
   * This packet updates where the player will respawn upon death (if no bed or anchor is set)
   * and dictates the coordinates that a compass will point toward.
   */
  export interface ClientboundPacketCPlayerSpawnPosition {
    tag: 'c-player-spawn-position',
    val: CPlayerSpawnPosition,
  }
  export interface ClientboundPacketCPostEffects {
    tag: 'c-post-effects',
    val: CPostEffects,
  }
  export interface ClientboundPacketCProjectilePower {
    tag: 'c-projectile-power',
    val: CProjectilePower,
  }
  /**
   * Clientbound packet that adds recipes to the client's recipe book.
   * `replace = true` means the client replaces its current recipe list.
   */
  export interface ClientboundPacketCRecipeBookAdd {
    tag: 'c-recipe-book-add',
    val: CRecipeBookAdd,
  }
  export interface ClientboundPacketCRecipeBookRemove {
    tag: 'c-recipe-book-remove',
    val: CRecipeBookRemove,
  }
  /**
   * Sent by the server to update the player's recipe book open/filter state.
   * 
   * Wire format: 4 `TypeSettings` pairs (crafting, furnace, `blast_furnace`, smoker),
   * each pair is (`is_open`: bool, `is_filtering`: bool).
   */
  export interface ClientboundPacketCRecipeBookSettings {
    tag: 'c-recipe-book-settings',
    val: CRecipeBookSettings,
  }
  /**
   * Sent by the server to instruct the client to remove (despawn) one or more entities.
   * 
   * This is typically sent when an entity leaves the player's tracking range,
   * is killed, or is otherwise removed from the world.
   */
  export interface ClientboundPacketCRemoveEntities {
    tag: 'c-remove-entities',
    val: CRemoveEntities,
  }
  export interface ClientboundPacketCRemoveMobEffect {
    tag: 'c-remove-mob-effect',
    val: CRemoveMobEffect,
  }
  export interface ClientboundPacketCRemoveResourcePack {
    tag: 'c-remove-resource-pack',
    val: CRemoveResourcePack,
  }
  export interface ClientboundPacketCResetScore {
    tag: 'c-reset-score',
    val: CResetScore,
  }
  export interface ClientboundPacketCRespawn {
    tag: 'c-respawn',
    val: CRespawn,
  }
  export interface ClientboundPacketCSelectAdvancementsTab {
    tag: 'c-select-advancements-tab',
    val: CSelectAdvancementsTab,
  }
  export interface ClientboundPacketCServerData {
    tag: 'c-server-data',
    val: CServerData,
  }
  export interface ClientboundPacketCPlayServerLinks {
    tag: 'c-play-server-links',
    val: CPlayServerLinks,
  }
  export interface ClientboundPacketCSetBorderCenter {
    tag: 'c-set-border-center',
    val: CSetBorderCenter,
  }
  export interface ClientboundPacketCSetBorderLerpSize {
    tag: 'c-set-border-lerp-size',
    val: CSetBorderLerpSize,
  }
  export interface ClientboundPacketCSetBorderSize {
    tag: 'c-set-border-size',
    val: CSetBorderSize,
  }
  export interface ClientboundPacketCSetBorderWarningDelay {
    tag: 'c-set-border-warning-delay',
    val: CSetBorderWarningDelay,
  }
  export interface ClientboundPacketCSetBorderWarningDistance {
    tag: 'c-set-border-warning-distance',
    val: CSetBorderWarningDistance,
  }
  export interface ClientboundPacketCSetCamera {
    tag: 'c-set-camera',
    val: CSetCamera,
  }
  export interface ClientboundPacketCSetChunkCacheRadius {
    tag: 'c-set-chunk-cache-radius',
    val: CSetChunkCacheRadius,
  }
  export interface ClientboundPacketCSetContainerContent {
    tag: 'c-set-container-content',
    val: CSetContainerContent,
  }
  export interface ClientboundPacketCSetContainerProperty {
    tag: 'c-set-container-property',
    val: CSetContainerProperty,
  }
  export interface ClientboundPacketCSetContainerSlot {
    tag: 'c-set-container-slot',
    val: CSetContainerSlot,
  }
  export interface ClientboundPacketCSetCursorItem {
    tag: 'c-set-cursor-item',
    val: CSetCursorItem,
  }
  /**
   * Sent by the server to attach (leash) or detach an entity to another entity (e.g. leash knot, player, mob).
   */
  export interface ClientboundPacketCSetEntityLink {
    tag: 'c-set-entity-link',
    val: CSetEntityLink,
  }
  export interface ClientboundPacketCSetEquipment {
    tag: 'c-set-equipment',
    val: CSetEquipment,
  }
  export interface ClientboundPacketCSetExperience {
    tag: 'c-set-experience',
    val: CSetExperience,
  }
  export interface ClientboundPacketCSetHealth {
    tag: 'c-set-health',
    val: CSetHealth,
  }
  export interface ClientboundPacketCSetPassengers {
    tag: 'c-set-passengers',
    val: CSetPassengers,
  }
  export interface ClientboundPacketCSetPlayerInventory {
    tag: 'c-set-player-inventory',
    val: CSetPlayerInventory,
  }
  export interface ClientboundPacketCSetPlayerTeam {
    tag: 'c-set-player-team',
    val: CSetPlayerTeam,
  }
  export interface ClientboundPacketCSetSimulationDistance {
    tag: 'c-set-simulation-distance',
    val: CSetSimulationDistance,
  }
  export interface ClientboundPacketCUpdateTime {
    tag: 'c-update-time',
    val: CUpdateTime,
  }
  export interface ClientboundPacketCTitleText {
    tag: 'c-title-text',
    val: CTitleText,
  }
  export interface ClientboundPacketCTitleAnimation {
    tag: 'c-title-animation',
    val: CTitleAnimation,
  }
  export interface ClientboundPacketCPlayShowDialog {
    tag: 'c-play-show-dialog',
    val: CPlayShowDialog,
  }
  export interface ClientboundPacketCSoundEffect {
    tag: 'c-sound-effect',
    val: CSoundEffect,
  }
  export interface ClientboundPacketCSpawnEntity {
    tag: 'c-spawn-entity',
    val: CSpawnEntity,
  }
  export interface ClientboundPacketCStartConfiguration {
    tag: 'c-start-configuration',
  }
  export interface ClientboundPacketCStopSound {
    tag: 'c-stop-sound',
    val: CStopSound,
  }
  /**
   * Stores some arbitrary data on the client, which persists between server transfers.
   * The Notchian client only accepts cookies of up to 5 kiB in size.
   */
  export interface ClientboundPacketCStoreCookie {
    tag: 'c-store-cookie',
    val: CStoreCookie,
  }
  export interface ClientboundPacketCSubtitle {
    tag: 'c-subtitle',
    val: CSubtitle,
  }
  /**
   * Updates the header and footer of the player list (Tab List).
   */
  export interface ClientboundPacketCTabList {
    tag: 'c-tab-list',
    val: CTabList,
  }
  export interface ClientboundPacketCTagQueryResponse {
    tag: 'c-tag-query-response',
    val: CTagQueryResponse,
  }
  export interface ClientboundPacketCTakeItemEntity {
    tag: 'c-take-item-entity',
    val: CTakeItemEntity,
  }
  /**
   * Only used when teleporting a player's vehicle, this packet is sent to the player.
   */
  export interface ClientboundPacketCTeleportEntity {
    tag: 'c-teleport-entity',
    val: CTeleportEntity,
  }
  export interface ClientboundPacketCTestInstanceBlockStatus {
    tag: 'c-test-instance-block-status',
    val: CTestInstanceBlockStatus,
  }
  export interface ClientboundPacketCTickingState {
    tag: 'c-ticking-state',
    val: CTickingState,
  }
  export interface ClientboundPacketCTickingStep {
    tag: 'c-ticking-step',
    val: CTickingStep,
  }
  export interface ClientboundPacketCTransfer {
    tag: 'c-transfer',
    val: CTransfer,
  }
  export interface ClientboundPacketCUnloadChunk {
    tag: 'c-unload-chunk',
    val: CUnloadChunk,
  }
  export interface ClientboundPacketCUpdateAdvancements {
    tag: 'c-update-advancements',
    val: CUpdateAdvancements,
  }
  export interface ClientboundPacketCUpdateAttributes {
    tag: 'c-update-attributes',
    val: CUpdateAttributes,
  }
  export interface ClientboundPacketCUpdateEntityPos {
    tag: 'c-update-entity-pos',
    val: CUpdateEntityPos,
  }
  export interface ClientboundPacketCUpdateEntityPosRot {
    tag: 'c-update-entity-pos-rot',
    val: CUpdateEntityPosRot,
  }
  export interface ClientboundPacketCUpdateEntityRot {
    tag: 'c-update-entity-rot',
    val: CUpdateEntityRot,
  }
  export interface ClientboundPacketCUpdateMobEffect {
    tag: 'c-update-mob-effect',
    val: CUpdateMobEffect,
  }
  export interface ClientboundPacketCUpdateObjectives {
    tag: 'c-update-objectives',
    val: CUpdateObjectives,
  }
  export interface ClientboundPacketCUpdateRecipes {
    tag: 'c-update-recipes',
    val: CUpdateRecipes,
  }
  /**
   * Sent by the server to create or update a score for an entity on a specific objective.
   * 
   * This packet is the primary way to manage scoreboard data. In the latest protocol,
   * it also supports optional custom formatting for how the numeric score is displayed.
   */
  export interface ClientboundPacketCUpdateScore {
    tag: 'c-update-score',
    val: CUpdateScore,
  }
  /**
   * Syncs tracked waypoints (`ClientboundTrackedWaypointPacket`) to client.
   */
  export interface ClientboundPacketCWaypoint {
    tag: 'c-waypoint',
    val: CWaypoint,
  }
  /**
   * Sent by the server to trigger a specific sound or particle effect at a world location.
   * 
   * This is used for a wide variety of effects, from breaking blocks and firework
   * explosions to splashing water or record playing.
   */
  export interface ClientboundPacketCWorldEvent {
    tag: 'c-world-event',
    val: CWorldEvent,
  }
  /**
   * Sent by the server to complete a latency check initiated by a `SStatusPingRequest`.
   * 
   * This is the final packet in the Server List Ping (SLP) sequence. It allows the
   * client to calculate the round-trip time (ping) to the server.
   */
  export interface ClientboundPacketStatusCPingResponse {
    tag: 'status-c-ping-response',
    val: StatusCPingResponse,
  }
  /**
   * Sent by the server in response to a `SStatusRequest`.
   * 
   * This packet provides the client with the information required to display the
   * server in the multiplayer menu, including the MOTD, player count, and icon
   */
  export interface ClientboundPacketStatusCStatusResponse {
    tag: 'status-c-status-response',
    val: StatusCStatusResponse,
  }
  export interface ClientboundPacketUnknown {
    tag: 'unknown',
  }
}
