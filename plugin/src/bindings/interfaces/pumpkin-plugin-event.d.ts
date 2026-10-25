/// <reference path="./pumpkin-plugin-bedrock-packets.d.ts" />
/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-damage-types.d.ts" />
/// <reference path="./pumpkin-plugin-enchantments.d.ts" />
/// <reference path="./pumpkin-plugin-item-stack.d.ts" />
/// <reference path="./pumpkin-plugin-java-dialogs.d.ts" />
/// <reference path="./pumpkin-plugin-java-packets.d.ts" />
/// <reference path="./pumpkin-plugin-player.d.ts" />
/// <reference path="./pumpkin-plugin-screens.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
/// <reference path="./pumpkin-plugin-uuid.d.ts" />
/// <reference path="./pumpkin-plugin-world.d.ts" />
declare module 'pumpkin:plugin/event@0.1.0' {
  export type BlockPos = import('pumpkin:plugin/common@0.1.0').BlockPos;
  export type GameMode = import('pumpkin:plugin/common@0.1.0').GameMode;
  export type Hand = import('pumpkin:plugin/common@0.1.0').Hand;
  export type Position = import('pumpkin:plugin/common@0.1.0').Position;
  export type ClickType = import('pumpkin:plugin/common@0.1.0').ClickType;
  export type ItemStack = import('pumpkin:plugin/item-stack@0.1.0').ItemStack;
  export type Enchantment = import('pumpkin:plugin/enchantments@0.1.0').Enchantment;
  export type DamageType = import('pumpkin:plugin/damage-types@0.1.0').DamageType;
  export type Screen = import('pumpkin:plugin/screens@0.1.0').Screen;
  export type Player = import('pumpkin:plugin/player@0.1.0').Player;
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type World = import('pumpkin:plugin/world@0.1.0').World;
  export type JavaServerboundPacket = import('pumpkin:plugin/java-packets@0.1.0').ServerboundPacket;
  export type JavaClientboundPacket = import('pumpkin:plugin/java-packets@0.1.0').ClientboundPacket;
  export type BedrockServerboundPacket = import('pumpkin:plugin/bedrock-packets@0.1.0').ServerboundPacket;
  export type BedrockClientboundPacket = import('pumpkin:plugin/bedrock-packets@0.1.0').ClientboundPacket;
  export type Uuid = import('pumpkin:plugin/uuid@0.1.0').Uuid;
  export type Dialog = import('pumpkin:plugin/java-dialogs@0.1.0').Dialog;
  export type ServerboundPacket = ServerboundPacketJava | ServerboundPacketBedrock | ServerboundPacketUnknown;
  export interface ServerboundPacketJava {
    tag: 'java',
    val: JavaServerboundPacket,
  }
  export interface ServerboundPacketBedrock {
    tag: 'bedrock',
    val: BedrockServerboundPacket,
  }
  export interface ServerboundPacketUnknown {
    tag: 'unknown',
  }
  export type ClientboundPacket = ClientboundPacketJava | ClientboundPacketBedrock | ClientboundPacketUnknown;
  export interface ClientboundPacketJava {
    tag: 'java',
    val: JavaClientboundPacket,
  }
  export interface ClientboundPacketBedrock {
    tag: 'bedrock',
    val: BedrockClientboundPacket,
  }
  export interface ClientboundPacketUnknown {
    tag: 'unknown',
  }
  /**
   * # Variants
   * 
   * ## `"highest"`
   * 
   * ## `"high"`
   * 
   * ## `"normal"`
   * 
   * ## `"low"`
   * 
   * ## `"lowest"`
   */
  export type EventPriority = 'highest' | 'high' | 'normal' | 'low' | 'lowest';
  export interface PlayerJoinEventData {
    player: Player,
    joinMessage: TextComponent,
    cancelled: boolean,
  }
  export interface PlayerLeaveEventData {
    player: Player,
    leaveMessage: TextComponent,
    cancelled: boolean,
  }
  export interface PlayerLoginEventData {
    player: Player,
    kickMessage: TextComponent,
    cancelled: boolean,
  }
  export interface PlayerChatEventData {
    player: Player,
    message: string,
    recipients: Array<Player>,
    signature?: Uint8Array,
    cancelled: boolean,
  }
  export interface PlayerCommandSendEventData {
    player: Player,
    command: string,
    cancelled: boolean,
  }
  export interface PlayerPermissionCheckEventData {
    player: Player,
    permission: string,
    permissionResult: boolean,
  }
  export interface PlayerMoveEventData {
    player: Player,
    fromPosition: Position,
    toPosition: Position,
    cancelled: boolean,
  }
  export interface PlayerTeleportEventData {
    player: Player,
    fromPosition: Position,
    toPosition: Position,
    cancelled: boolean,
  }
  export interface PlayerChangeWorldEventData {
    player: Player,
    previousWorld: World,
    newWorld: World,
    position: Position,
    yaw: number,
    pitch: number,
    cancelled: boolean,
  }
  export interface PlayerRespawnEventData {
    player: Player,
    previousWorld: World,
    respawnedWorld: World,
    position: Position,
    yaw: number,
    pitch: number,
    alive: boolean,
  }
  export interface PlayerExpChangeEventData {
    player: Player,
    amount: number,
  }
  export interface PlayerItemHeldEventData {
    player: Player,
    previousSlot: number,
    newSlot: number,
    cancelled: boolean,
  }
  export interface PlayerChangedMainHandEventData {
    player: Player,
    mainHand: Hand,
  }
  export interface PlayerGamemodeChangeEventData {
    player: Player,
    previousGamemode: GameMode,
    newGamemode: GameMode,
    cancelled: boolean,
  }
  export interface PlayerCustomPayloadEventData {
    player: Player,
    channel: string,
    data: Uint8Array,
  }
  /**
   * # Variants
   * 
   * ## `"fishing"`
   * 
   * ## `"caught-fish"`
   * 
   * ## `"caught-entity"`
   * 
   * ## `"in-ground"`
   * 
   * ## `"failed-attempt"`
   * 
   * ## `"reel-in"`
   * 
   * ## `"bite"`
   */
  export type PlayerFishState = 'fishing' | 'caught-fish' | 'caught-entity' | 'in-ground' | 'failed-attempt' | 'reel-in' | 'bite';
  export interface PlayerFishEventData {
    player: Player,
    caughtUuid?: Uuid,
    caughtType: string,
    hookUuid: Uuid,
    state: PlayerFishState,
    hand: Hand,
    expToDrop: number,
    cancelled: boolean,
  }
  export interface PlayerEggThrowEventData {
    player: Player,
    eggUuid: Uuid,
    hatching: boolean,
    numHatches: number,
    hatchingType: string,
    cancelled: boolean,
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
  export type EntityInteractionAction = 'interact' | 'attack' | 'interact-at';
  /**
   * # Variants
   * 
   * ## `"left-click-block"`
   * 
   * ## `"left-click-air"`
   * 
   * ## `"right-click-air"`
   * 
   * ## `"right-click-block"`
   */
  export type InteractAction = 'left-click-block' | 'left-click-air' | 'right-click-air' | 'right-click-block';
  export interface PlayerInteractEventData {
    player: Player,
    action: InteractAction,
    clickedPos?: BlockPos,
    block: string,
    cancelled: boolean,
  }
  export interface PlayerToggleSneakEventData {
    player: Player,
    isSneaking: boolean,
    cancelled: boolean,
  }
  export interface PlayerToggleFlightEventData {
    player: Player,
    isFlying: boolean,
    cancelled: boolean,
  }
  export interface PlayerToggleSprintEventData {
    player: Player,
    isSprinting: boolean,
    cancelled: boolean,
  }
  export interface PlayerInteractUnknownEntityEventData {
    player: Player,
    entityId: number,
    action: EntityInteractionAction,
    cancelled: boolean,
  }
  export interface InventoryClickEventData {
    player: Player,
    windowType?: Screen,
    clickType: ClickType,
    slot: number,
    rawSlot: number,
    clickedItem?: ItemStack,
    cursor?: ItemStack,
    hotbarButton: number,
    cancelled: boolean,
  }
  export interface InventoryCloseEventData {
    player: Player,
    windowType?: Screen,
  }
  export interface BlockRedstoneEventData {
    targetWorld: World,
    stateId: number,
    blockPos: BlockPos,
    oldCurrent: number,
    newCurrent: number,
    cancelled: boolean,
  }
  export interface BlockBreakEventData {
    player?: Player,
    block: string,
    blockPos: BlockPos,
    exp: number,
    shouldDrop: boolean,
    cancelled: boolean,
  }
  export interface BlockBurnEventData {
    ignitingBlock: string,
    block: string,
    blockPos: BlockPos,
    targetWorld: World,
    cancelled: boolean,
  }
  export interface BlockCanBuildEventData {
    blockToBuild: string,
    buildable: boolean,
    player: Player,
    block: string,
    cancelled: boolean,
  }
  export interface BlockGrowEventData {
    targetWorld: World,
    oldBlock: string,
    oldStateId: number,
    newBlock: string,
    newStateId: number,
    blockPos: BlockPos,
    cancelled: boolean,
  }
  export interface BlockPlaceEventData {
    player: Player,
    blockPlaced: string,
    blockPlacedAgainst: string,
    blockPos: BlockPos,
    canBuild: boolean,
    cancelled: boolean,
  }
  export interface BedrockFormResponseEventData {
    player: Player,
    formId: number,
    responseData?: string,
  }
  export interface DialogClickActionEventData {
    player: Player,
    id: string,
    payload?: Uint8Array,
    cancelled: boolean,
  }
  export interface DialogShowEventData {
    player: Player,
    dialog: Dialog,
    cancelled: boolean,
  }
  export interface DialogClearEventData {
    player: Player,
    cancelled: boolean,
  }
  export interface ServerCommandEventData {
    command: string,
    cancelled: boolean,
  }
  export interface ServerListPingAddress {
    host: string,
    port: number,
  }
  export interface ServerListPingEventData {
    hostname: string,
    address: ServerListPingAddress,
    motd: TextComponent,
    maxPlayers: number,
    numPlayers: number,
    favicon?: string,
  }
  /**
   * # Variants
   * 
   * ## `"startup"`
   * 
   * ## `"reload"`
   */
  export type ServerLoadType = 'startup' | 'reload';
  export interface ServerLoadEventData {
    loadType: ServerLoadType,
  }
  export interface SpawnChangeEventData {
    targetWorld: World,
    previousPosition: BlockPos,
    previousYaw: number,
    previousPitch: number,
    newPosition: BlockPos,
    newYaw: number,
    newPitch: number,
  }
  export interface ServerBroadcastEventData {
    message: TextComponent,
    sender: TextComponent,
    cancelled: boolean,
  }
  export interface ServerTickStartEventData {
    tick: number,
  }
  export interface ServerTickEndEventData {
    tick: number,
    durationNanos: bigint,
  }
  export interface PacketReceivedEventData {
    player: Player,
    packet: ServerboundPacket,
    packetId: number,
    rawPayload: Uint8Array,
    cancelled: boolean,
  }
  export interface PacketSentEventData {
    player: Player,
    packet: ClientboundPacket,
    packetId: number,
    rawPayload: Uint8Array,
    cancelled: boolean,
  }
  export interface PlayerInteractEntityEventData {
    player: Player,
    entityId: number,
    action: EntityInteractionAction,
    sneaking: boolean,
    cancelled: boolean,
  }
  export interface ChunkLoadEventData {
    targetWorld: World,
    chunkX: number,
    chunkZ: number,
    cancelled: boolean,
  }
  export interface ChunkSaveEventData {
    targetWorld: World,
    chunkX: number,
    chunkZ: number,
    cancelled: boolean,
  }
  export interface ChunkSendEventData {
    targetWorld: World,
    chunkX: number,
    chunkZ: number,
    cancelled: boolean,
  }
  export interface EntityDamageEventData {
    entityId: number,
    damage: number,
    damageType: DamageType,
    cancelled: boolean,
  }
  export interface EntityDeathEventData {
    entityId: number,
    droppedExp: number,
  }
  export interface PlayerDeathEventData {
    player: Player,
    deathMessage: TextComponent,
    droppedExp: number,
    keepInventory: boolean,
    cancelled: boolean,
  }
  export interface EntitySpawnEventData {
    entityId: number,
    entityType: string,
    position: Position,
    targetWorld: World,
    cancelled: boolean,
  }
  export interface EntityCombustEventData {
    entityId: number,
    durationSecs: number,
    cancelled: boolean,
  }
  export interface EntityRegainHealthEventData {
    entityId: number,
    amount: number,
    cancelled: boolean,
  }
  export interface EntityAirChangeEventData {
    entityId: number,
    amount: number,
    cancelled: boolean,
  }
  export interface EntityBreedEventData {
    fatherId: number,
    motherId: number,
    childId: number,
    cancelled: boolean,
  }
  export interface EntityDismountEventData {
    entityId: number,
    dismountedId: number,
    cancelled: boolean,
  }
  export interface EntityDyeEventData {
    entityId: number,
    color: string,
    player?: Player,
    cancelled: boolean,
  }
  export interface EntityEnterLoveModeEventData {
    entityId: number,
    humanEntityId?: number,
    ticksInLove: number,
    cancelled: boolean,
  }
  export interface EntityExplodeEventData {
    /**
     * The exploding entity (0 without a source entity); it is usually removed already.
     */
    entityId: number,
    /**
     * Name of the world the explosion happens in.
     */
    worldName: string,
    position: Position,
    yieldRate: number,
    cancelled: boolean,
  }
  export interface EntityMountEventData {
    entityId: number,
    mountedId: number,
    cancelled: boolean,
  }
  export interface EntityPickupItemEventData {
    entityId: number,
    itemName: string,
    count: number,
    cancelled: boolean,
  }
  export interface EntityPortalEventData {
    entityId: number,
    portalPos: BlockPos,
    cancelled: boolean,
  }
  export interface EntityResurrectEventData {
    entityId: number,
    cancelled: boolean,
  }
  export interface EntityShootBowEventData {
    entityId: number,
    weaponName: string,
    force: number,
    cancelled: boolean,
  }
  export interface EntityTameEventData {
    entityId: number,
    owner: Player,
    cancelled: boolean,
  }
  export interface EntityTargetEventData {
    entityId: number,
    targetId?: number,
    cancelled: boolean,
  }
  export interface EntityTeleportEventData {
    entityId: number,
    fromPosition: Position,
    toPosition: Position,
    cancelled: boolean,
  }
  export interface EntityToggleGlideEventData {
    entityId: number,
    isGliding: boolean,
    cancelled: boolean,
  }
  export interface EntityTransformEventData {
    entityId: number,
    newEntityId: number,
    transformReason: string,
    cancelled: boolean,
  }
  export interface CreatureSpawnEventData {
    entityId: number,
    entityType: string,
    position: Position,
    targetWorld: World,
    spawnReason: string,
    player?: Player,
    cancelled: boolean,
  }
  export interface EnderDragonChangePhaseEventData {
    entityId: number,
    currentPhase: string,
    newPhase: string,
    cancelled: boolean,
  }
  export interface EntityBreakDoorEventData {
    entityId: number,
    blockPos: BlockPos,
    cancelled: boolean,
  }
  export interface EntityChangeBlockEventData {
    entityId: number,
    blockPos: BlockPos,
    newBlock: string,
    cancelled: boolean,
  }
  export interface EntityDamageByBlockEventData {
    entityId: number,
    damagerPos?: BlockPos,
    damage: number,
    cause: string,
    cancelled: boolean,
  }
  export interface EntityDamageByEntityEventData {
    entityId: number,
    damagerId: number,
    damage: number,
    cause: string,
    cancelled: boolean,
  }
  export interface EntityDropItemEventData {
    entityId: number,
    itemName: string,
    count: number,
    cancelled: boolean,
  }
  export interface EntityEnterBlockEventData {
    entityId: number,
    blockPos: BlockPos,
    cancelled: boolean,
  }
  export interface EntityExhaustionEventData {
    entityId: number,
    exhaustion: number,
    cancelled: boolean,
  }
  export interface EntityInteractEventData {
    entityId: number,
    blockPos: BlockPos,
    cancelled: boolean,
  }
  export interface EntityKnockbackEventData {
    entityId: number,
    hitById?: number,
    knockback: Position,
    cancelled: boolean,
  }
  export interface EntityPlaceEventData {
    entityId: number,
    blockPos: BlockPos,
    blockName: string,
    cancelled: boolean,
  }
  export interface EntityPoseChangeEventData {
    entityId: number,
    pose: string,
    cancelled: boolean,
  }
  export interface EntityPotionEffectEventData {
    entityId: number,
    effectName: string,
    duration: number,
    amplifier: number,
    cancelled: boolean,
  }
  export interface EntitySpellCastEventData {
    entityId: number,
    spell: string,
    cancelled: boolean,
  }
  export interface EntityTargetLivingEntityEventData {
    entityId: number,
    targetId?: number,
    reason: string,
    cancelled: boolean,
  }
  export interface EntityToggleSwimEventData {
    entityId: number,
    isSwimming: boolean,
    cancelled: boolean,
  }
  export interface ExplosionPrimeEventData {
    entityId: number,
    radius: number,
    fire: boolean,
    cancelled: boolean,
  }
  export interface FireworkExplodeEventData {
    entityId: number,
    cancelled: boolean,
  }
  export interface FoodLevelChangeEventData {
    entityId: number,
    foodLevel: number,
    cancelled: boolean,
  }
  export interface ItemDespawnEventData {
    entityId: number,
    cancelled: boolean,
  }
  export interface ItemMergeEventData {
    entityId: number,
    targetId: number,
    cancelled: boolean,
  }
  export interface ItemSpawnEventData {
    entityId: number,
    position: Position,
    itemName: string,
    cancelled: boolean,
  }
  export interface PiglinBarterEventData {
    entityId: number,
    inputItem: ItemStack,
    outcome: Array<ItemStack>,
    cancelled: boolean,
  }
  export interface ProjectileHitEventData {
    entityId: number,
    hitPosition: Position,
    hitEntityId?: number,
    cancelled: boolean,
  }
  export interface ProjectileLaunchEventData {
    entityId: number,
    shooterId?: number,
    cancelled: boolean,
  }
  export interface SheepDyeWoolEventData {
    entityId: number,
    dyeColor: number,
    playerId?: number,
    cancelled: boolean,
  }
  export interface SheepRegrowWoolEventData {
    entityId: number,
    cancelled: boolean,
  }
  export interface SlimeSplitEventData {
    entityId: number,
    count: number,
    cancelled: boolean,
  }
  export interface StriderTemperatureChangeEventData {
    entityId: number,
    isShivering: boolean,
    cancelled: boolean,
  }
  export interface VillagerAcquireTradeEventData {
    entityId: number,
    recipeIndex: number,
    cancelled: boolean,
  }
  export interface VillagerCareerChangeEventData {
    entityId: number,
    profession: string,
    reason: string,
    cancelled: boolean,
  }
  export interface VillagerReplenishTradeEventData {
    entityId: number,
    restockQuantity: number,
    cancelled: boolean,
  }
  export interface WardenAngerChangeEventData {
    entityId: number,
    targetId: number,
    oldAnger: number,
    newAnger: number,
    cancelled: boolean,
  }
  export interface AreaEffectCloudApplyEventData {
    entityId: number,
    affectedEntities: Int32Array,
    cancelled: boolean,
  }
  export interface ArrowBodyCountChangeEventData {
    entityId: number,
    oldAmount: number,
    newAmount: number,
    cancelled: boolean,
  }
  export interface BatToggleSleepEventData {
    entityId: number,
    isAwake: boolean,
    cancelled: boolean,
  }
  export interface CreeperPowerEventData {
    entityId: number,
    lightningId?: number,
    cause: string,
    cancelled: boolean,
  }
  export interface EntityCombustByBlockEventData {
    entityId: number,
    combuster: BlockPos,
    duration: number,
    cancelled: boolean,
  }
  export interface EntityCombustByEntityEventData {
    entityId: number,
    combusterId: number,
    duration: number,
    cancelled: boolean,
  }
  export interface EntityKnockbackByEntityEventData {
    entityId: number,
    hitById: number,
    force: number,
    x: number,
    z: number,
    cancelled: boolean,
  }
  export interface EntityPortalEnterEventData {
    entityId: number,
    location: BlockPos,
    cancelled: boolean,
  }
  export interface EntityPortalExitEventData {
    entityId: number,
    fromPos: BlockPos,
    toPos?: BlockPos,
    cancelled: boolean,
  }
  export interface EntityRemoveEventData {
    entityId: number,
    cause: string,
    cancelled: boolean,
  }
  export interface EntityTargetBlockEventData {
    entityId: number,
    blockPos: BlockPos,
    cancelled: boolean,
  }
  export interface EntityUnleashEventData {
    entityId: number,
    reason: string,
    cancelled: boolean,
  }
  export interface ExpBottleEventData {
    entityId: number,
    experience: number,
    location: BlockPos,
    showEffect: boolean,
    cancelled: boolean,
  }
  export interface HorseJumpEventData {
    entityId: number,
    power: number,
    cancelled: boolean,
  }
  export interface LingeringPotionSplashEventData {
    entityId: number,
    location: BlockPos,
    potionItem: string,
    cancelled: boolean,
  }
  export interface PigZapEventData {
    entityId: number,
    lightningId: number,
    pigZombieId: number,
    cancelled: boolean,
  }
  export interface PigZombieAngerEventData {
    entityId: number,
    targetId?: number,
    newAnger: number,
    cancelled: boolean,
  }
  export interface PotionSplashEventData {
    entityId: number,
    location: BlockPos,
    potionItem: string,
    affectedEntities: Int32Array,
    cancelled: boolean,
  }
  export interface SpawnerSpawnEventData {
    entityId: number,
    spawnerPos: BlockPos,
    cancelled: boolean,
  }
  export interface TrialSpawnerSpawnEventData {
    entityId: number,
    spawnerPos: BlockPos,
    cancelled: boolean,
  }
  export interface VillagerReputationChangeEventData {
    entityId: number,
    targetId: number,
    reputationChange: number,
    cancelled: boolean,
  }
  export interface PlayerItemConsumeEventData {
    player: Player,
    itemName: string,
    cancelled: boolean,
  }
  export interface PlayerItemDamageEventData {
    player: Player,
    itemName: string,
    damage: number,
    cancelled: boolean,
  }
  export interface PlayerDropItemEventData {
    player: Player,
    itemName: string,
    count: number,
    cancelled: boolean,
  }
  export interface PlayerBedEnterEventData {
    player: Player,
    bedPos: BlockPos,
    cancelled: boolean,
  }
  export interface PlayerBedLeaveEventData {
    player: Player,
    bedPos: BlockPos,
  }
  export interface PlayerBucketEmptyEventData {
    player: Player,
    blockPos: BlockPos,
    bucket: string,
    cancelled: boolean,
  }
  export interface PlayerBucketFillEventData {
    player: Player,
    blockPos: BlockPos,
    bucket: string,
    cancelled: boolean,
  }
  export interface AsyncPlayerChatEventData {
    player: Player,
    message: string,
    format: TextComponent,
    cancelled: boolean,
  }
  export interface AsyncPlayerPreLoginEventData {
    playerName: string,
    playerUuid: string,
    ipAddress: string,
    kickMessage: TextComponent,
    cancelled: boolean,
  }
  export interface PlayerAdvancementDoneEventData {
    player: Player,
    advancementId: string,
    cancelled: boolean,
  }
  export interface PlayerAnimationEventData {
    player: Player,
    animationType: string,
    cancelled: boolean,
  }
  export interface PlayerArmorStandManipulateEventData {
    player: Player,
    armorStandId: number,
    slot: number,
    cancelled: boolean,
  }
  export interface PlayerBucketEntityEventData {
    player: Player,
    entityId: number,
    bucketItem: string,
    cancelled: boolean,
  }
  export interface PlayerChangedWorldEventData {
    player: Player,
    fromWorld: World,
    toWorld: World,
    cancelled: boolean,
  }
  export interface PlayerChannelEventData {
    player: Player,
    channel: string,
    cancelled: boolean,
  }
  export interface PlayerCommandPreprocessEventData {
    player: Player,
    command: string,
    cancelled: boolean,
  }
  export interface PlayerEditBookEventData {
    player: Player,
    slot: number,
    pages: Array<string>,
    title?: string,
    signing: boolean,
    cancelled: boolean,
  }
  export interface PlayerElytraBoostEventData {
    player: Player,
    fireworkId: number,
    cancelled: boolean,
  }
  export interface PlayerExpCooldownChangeEventData {
    player: Player,
    newCooldown: number,
    cancelled: boolean,
  }
  export interface PlayerHarvestBlockEventData {
    player: Player,
    blockPos: BlockPos,
    harvestedItems: Array<ItemStack>,
    cancelled: boolean,
  }
  export interface PlayerHideEntityEventData {
    player: Player,
    entityId: number,
    cancelled: boolean,
  }
  export interface PlayerItemBreakEventData {
    player: Player,
    itemName: string,
  }
  export interface PlayerItemMendEventData {
    player: Player,
    itemName: string,
    repairAmount: number,
    expConsumed: number,
    cancelled: boolean,
  }
  export interface PlayerKickEventData {
    player: Player,
    reason: string,
    cancelled: boolean,
  }
  export interface PlayerLeashEntityEventData {
    player: Player,
    entityId: number,
    holderId: number,
    cancelled: boolean,
  }
  export interface PlayerLevelChangeEventData {
    player: Player,
    oldLevel: number,
    newLevel: number,
  }
  export interface PlayerLocaleChangeEventData {
    player: Player,
    newLocale: string,
    cancelled: boolean,
  }
  export interface PlayerNameEntityEventData {
    player: Player,
    entityId: number,
    name: TextComponent,
    cancelled: boolean,
  }
  export interface PlayerOpenSignEventData {
    player: Player,
    blockPos: BlockPos,
    isFront: boolean,
    cancelled: boolean,
  }
  export interface PlayerPortalEventData {
    player: Player,
    fromPos: BlockPos,
    toPos?: BlockPos,
    cancelled: boolean,
  }
  export interface PlayerPreLoginEventData {
    playerName: string,
    playerUuid: string,
    ipAddress: string,
    kickMessage: TextComponent,
    cancelled: boolean,
  }
  export interface PlayerRiptideEventData {
    player: Player,
    itemName: string,
    cancelled: boolean,
  }
  export interface PlayerShearEntityEventData {
    player: Player,
    entityId: number,
    hand: number,
    cancelled: boolean,
  }
  export interface PlayerShowEntityEventData {
    player: Player,
    entityId: number,
    cancelled: boolean,
  }
  export interface PlayerSpawnChangeEventData {
    player: Player,
    newSpawn?: BlockPos,
    forced: boolean,
    cancelled: boolean,
  }
  export interface PlayerStatisticIncrementEventData {
    player: Player,
    statisticId: string,
    amount: number,
    cancelled: boolean,
  }
  export interface PlayerSwapHandsEventData {
    player: Player,
    cancelled: boolean,
  }
  export interface PlayerTakeLecternBookEventData {
    player: Player,
    blockPos: BlockPos,
    book: ItemStack,
    cancelled: boolean,
  }
  export interface PlayerUnleashEntityEventData {
    player: Player,
    entityId: number,
    cancelled: boolean,
  }
  export interface PlayerVelocityEventData {
    player: Player,
    velocity: Position,
    cancelled: boolean,
  }
  export interface PlayerInputEventData {
    player: Player,
    input: string,
    cancelled: boolean,
  }
  export interface PlayerInteractAtEntityEventData {
    player: Player,
    entityId: number,
    clickedX: number,
    clickedY: number,
    clickedZ: number,
    hand: number,
    cancelled: boolean,
  }
  export interface PlayerLinksSendEventData {
    player: Player,
    links: Array<string>,
    cancelled: boolean,
  }
  export interface PlayerPickupArrowEventData {
    player: Player,
    arrowId: number,
    cancelled: boolean,
  }
  export interface PlayerRecipeBookClickEventData {
    player: Player,
    recipeId: string,
    makeAll: boolean,
    cancelled: boolean,
  }
  export interface PlayerRecipeBookSettingsChangeEventData {
    player: Player,
    bookType: string,
    isOpen: boolean,
    isFiltering: boolean,
    cancelled: boolean,
  }
  export interface PlayerRecipeDiscoverEventData {
    player: Player,
    recipeId: string,
    cancelled: boolean,
  }
  export interface PlayerRegisterChannelEventData {
    player: Player,
    channel: string,
    cancelled: boolean,
  }
  export interface PlayerResourcePackStatusEventData {
    player: Player,
    packId: string,
    status: string,
    cancelled: boolean,
  }
  export interface PlayerSpawnLocationEventData {
    player: Player,
    spawnPos: Position,
    cancelled: boolean,
  }
  export interface PlayerUnregisterChannelEventData {
    player: Player,
    channel: string,
    cancelled: boolean,
  }
  export interface RaidFinishEventData {
    victory: boolean,
    cancelled: boolean,
  }
  export interface RaidSpawnWaveEventData {
    wave: number,
    pos: BlockPos,
    cancelled: boolean,
  }
  export interface RaidStopEventData {
    reason: string,
    cancelled: boolean,
  }
  export interface RaidTriggerEventData {
    pos: BlockPos,
    cancelled: boolean,
  }
  export interface BlockDamageEventData {
    player: Player,
    blockPos: BlockPos,
    instaBreak: boolean,
    cancelled: boolean,
  }
  export interface BlockIgniteEventData {
    blockPos: BlockPos,
    cancelled: boolean,
  }
  export interface BlockFromToEventData {
    fromPos: BlockPos,
    toPos: BlockPos,
    cancelled: boolean,
  }
  export interface BlockFormEventData {
    blockPos: BlockPos,
    cancelled: boolean,
  }
  export interface BlockFadeEventData {
    blockPos: BlockPos,
    cancelled: boolean,
  }
  export interface BlockDispenseEventData {
    blockPos: BlockPos,
    itemName: string,
    cancelled: boolean,
  }
  export interface BlockExplodeEventData {
    blockPos: BlockPos,
    yieldRate: number,
    cancelled: boolean,
  }
  export interface BlockPhysicsEventData {
    blockPos: BlockPos,
    changedPos: BlockPos,
    cancelled: boolean,
  }
  export interface BlockPistonExtendEventData {
    blockPos: BlockPos,
    direction: string,
    cancelled: boolean,
  }
  export interface BlockPistonRetractEventData {
    blockPos: BlockPos,
    direction: string,
    cancelled: boolean,
  }
  export interface NotePlayEventData {
    blockPos: BlockPos,
    instrument: string,
    note: number,
    cancelled: boolean,
  }
  export interface SignChangeEventData {
    player: Player,
    blockPos: BlockPos,
    lines: Array<string>,
    cancelled: boolean,
  }
  export interface SpongeAbsorbEventData {
    blockPos: BlockPos,
    cancelled: boolean,
  }
  export interface TntPrimeEventData {
    blockPos: BlockPos,
    primeReason: string,
    cancelled: boolean,
  }
  export interface MapInitializeEventData {
    mapId: number,
  }
  export interface HangingBreakEventData {
    entityId: number,
    removerEntityId?: number,
    cancelled: boolean,
  }
  export interface HangingBreakByEntityEventData {
    entityId: number,
    removerEntityId: number,
    cancelled: boolean,
  }
  export interface HangingPlaceEventData {
    entityId: number,
    player?: Player,
    blockPos: BlockPos,
    blockFace: string,
    cancelled: boolean,
  }
  export interface BellResonateEventData {
    blockPos: BlockPos,
    targetWorld: World,
    cancelled: boolean,
  }
  export interface BellRingEventData {
    blockPos: BlockPos,
    targetWorld: World,
    entityId?: number,
    direction?: string,
    cancelled: boolean,
  }
  export interface BlockBrushEventData {
    blockPos: BlockPos,
    targetWorld: World,
    player: Player,
    item: ItemStack,
    cancelled: boolean,
  }
  export interface BlockCookEventData {
    blockPos: BlockPos,
    targetWorld: World,
    source: ItemStack,
    result: ItemStack,
    cancelled: boolean,
  }
  export interface BlockDamageAbortEventData {
    player: Player,
    blockPos: BlockPos,
    targetWorld: World,
    itemInHand: ItemStack,
  }
  export interface BlockDispenseArmorEventData {
    blockPos: BlockPos,
    targetWorld: World,
    targetEntityId: number,
    item: ItemStack,
    cancelled: boolean,
  }
  export interface BlockDispenseLootEventData {
    blockPos: BlockPos,
    targetWorld: World,
    items: Array<ItemStack>,
    cancelled: boolean,
  }
  export interface BlockDropItemEventData {
    blockPos: BlockPos,
    targetWorld: World,
    player?: Player,
    items: Array<ItemStack>,
    cancelled: boolean,
  }
  export interface BlockExpEventData {
    blockPos: BlockPos,
    targetWorld: World,
    exp: number,
  }
  export interface BlockFertilizeEventData {
    blockPos: BlockPos,
    targetWorld: World,
    player?: Player,
    changedBlocks: Array<[BlockPos, number]>,
    cancelled: boolean,
  }
  export interface BlockMultiPlaceEventData {
    player: Player,
    targetWorld: World,
    placedBlocks: Array<[BlockPos, number]>,
    cancelled: boolean,
  }
  export interface BlockReceiveGameEventData {
    blockPos: BlockPos,
    targetWorld: World,
    gameEvent: string,
    sourceEntityId?: number,
    cancelled: boolean,
  }
  export interface BlockShearEntityEventData {
    blockPos: BlockPos,
    targetWorld: World,
    targetEntityId: number,
    item: ItemStack,
    cancelled: boolean,
  }
  export interface BlockSpreadEventData {
    sourcePos: BlockPos,
    targetPos: BlockPos,
    targetWorld: World,
    newStateId: number,
    cancelled: boolean,
  }
  export interface BrewingStartEventData {
    blockPos: BlockPos,
    targetWorld: World,
    brewingTime: number,
    cancelled: boolean,
  }
  export interface CampfireStartEventData {
    blockPos: BlockPos,
    targetWorld: World,
    item: ItemStack,
    slot: number,
    cookingTime: number,
    cancelled: boolean,
  }
  export interface CauldronLevelChangeEventData {
    blockPos: BlockPos,
    targetWorld: World,
    oldLevel: number,
    newLevel: number,
    reason: string,
    entityId?: number,
    cancelled: boolean,
  }
  export interface CrafterCraftEventData {
    blockPos: BlockPos,
    targetWorld: World,
    result: ItemStack,
    cancelled: boolean,
  }
  export interface EntityBlockFormEventData {
    entityId: number,
    blockPos: BlockPos,
    targetWorld: World,
    newStateId: number,
    cancelled: boolean,
  }
  export interface FluidLevelChangeEventData {
    blockPos: BlockPos,
    targetWorld: World,
    newStateId: number,
    cancelled: boolean,
  }
  export interface InventoryBlockStartEventData {
    blockPos: BlockPos,
    targetWorld: World,
  }
  export interface LeavesDecayEventData {
    blockPos: BlockPos,
    targetWorld: World,
    cancelled: boolean,
  }
  export interface MoistureChangeEventData {
    blockPos: BlockPos,
    targetWorld: World,
    newMoisture: number,
    cancelled: boolean,
  }
  export interface SculkBloomEventData {
    blockPos: BlockPos,
    targetWorld: World,
    charge: number,
    cancelled: boolean,
  }
  export interface VaultDisplayItemEventData {
    blockPos: BlockPos,
    targetWorld: World,
    item: ItemStack,
    cancelled: boolean,
  }
  export interface WeatherChangeEventData {
    targetWorld: World,
    toWeatherState: boolean,
    cancelled: boolean,
  }
  export interface ThunderChangeEventData {
    targetWorld: World,
    toThunderState: boolean,
    cancelled: boolean,
  }
  export interface WorldLoadEventData {
    targetWorld: World,
  }
  export interface WorldUnloadEventData {
    targetWorld: World,
    cancelled: boolean,
  }
  export interface AsyncStructureGenerateEventData {
    worldName: string,
    structureName: string,
    pos: BlockPos,
    cancelled: boolean,
  }
  export interface AsyncStructureSpawnEventData {
    worldName: string,
    structureName: string,
    pos: BlockPos,
    cancelled: boolean,
  }
  export interface ChunkPopulateEventData {
    chunkX: number,
    chunkZ: number,
    cancelled: boolean,
  }
  export interface ChunkUnloadEventData {
    chunkX: number,
    chunkZ: number,
    cancelled: boolean,
  }
  export interface EntitiesLoadEventData {
    chunkX: number,
    chunkZ: number,
    entityCount: number,
    cancelled: boolean,
  }
  export interface EntitiesUnloadEventData {
    chunkX: number,
    chunkZ: number,
    entityCount: number,
    cancelled: boolean,
  }
  export interface GenericGameEventData {
    eventId: string,
    pos: Position,
    cancelled: boolean,
  }
  export interface LootGenerateEventData {
    lootTable: string,
    cancelled: boolean,
  }
  export interface PortalCreateEventData {
    pos: BlockPos,
    portalType: string,
    cancelled: boolean,
  }
  export interface StructureGrowEventData {
    pos: BlockPos,
    species: string,
    boneMeal: boolean,
    cancelled: boolean,
  }
  export interface TimeSkipEventData {
    skipAmount: bigint,
    cancelled: boolean,
  }
  export interface WorldInitEventData {
    targetWorld: World,
  }
  export interface WorldSaveEventData {
    worldName: string,
    cancelled: boolean,
  }
  export interface InventoryOpenEventData {
    player: Player,
    cancelled: boolean,
  }
  export interface InventoryDragEventData {
    player: Player,
    cancelled: boolean,
  }
  export interface CraftItemEventData {
    player: Player,
    recipeId: string,
    cancelled: boolean,
  }
  export interface FurnaceSmeltEventData {
    blockPos: BlockPos,
    sourceItem: string,
    resultItem: string,
    cancelled: boolean,
  }
  export interface BrewEventData {
    blockPos: BlockPos,
    fuelLevel: number,
    cancelled: boolean,
  }
  export interface BrewingStandFuelEventData {
    blockPos: BlockPos,
    fuelPower: number,
    cancelled: boolean,
  }
  export interface FurnaceBurnEventData {
    blockPos: BlockPos,
    fuelItem: string,
    burnTime: number,
    cancelled: boolean,
  }
  export interface FurnaceExtractEventData {
    player: Player,
    blockPos: BlockPos,
    itemId: string,
    itemAmount: number,
    expGained: number,
  }
  export interface FurnaceStartSmeltEventData {
    blockPos: BlockPos,
    sourceItem: string,
    cookingTime: number,
    cancelled: boolean,
  }
  export interface HopperInventorySearchEventData {
    blockPos: BlockPos,
    searchPos: BlockPos,
    cancelled: boolean,
  }
  export interface InventoryCreativeEventData {
    player: Player,
    slot: number,
    itemId: string,
    itemCount: number,
    cancelled: boolean,
  }
  export interface InventoryInteractEventData {
    player: Player,
    cancelled: boolean,
  }
  export interface InventoryMoveItemEventData {
    sourcePos: BlockPos,
    targetPos: BlockPos,
    itemId: string,
    itemAmount: number,
    cancelled: boolean,
  }
  export interface InventoryPickupItemEventData {
    blockPos: BlockPos,
    itemEntityId: number,
    itemId: string,
    cancelled: boolean,
  }
  export interface PrepareAnvilEventData {
    player: Player,
    renameText: string,
    repairCost: number,
  }
  export interface PrepareGrindstoneEventData {
    player: Player,
    resultItem?: string,
  }
  export interface PrepareInventoryResultEventData {
    player: Player,
    resultItem?: string,
  }
  export interface PrepareItemCraftEventData {
    player: Player,
    recipeId: string,
    cancelled: boolean,
  }
  export interface PrepareSmithingEventData {
    player: Player,
    resultItem?: string,
  }
  export interface SmithItemEventData {
    player: Player,
    recipeId: string,
    cancelled: boolean,
  }
  export interface TradeSelectEventData {
    player: Player,
    slotIndex: number,
    cancelled: boolean,
  }
  export interface VehicleBlockCollisionEventData {
    vehicleId: number,
    blockPos: BlockPos,
    cancelled: boolean,
  }
  export interface VehicleCollisionEventData {
    vehicleId: number,
    cancelled: boolean,
  }
  export interface VehicleCreateEventData {
    vehicleId: number,
    cancelled: boolean,
  }
  export interface VehicleDamageEventData {
    vehicleId: number,
    damage: number,
    attackerId?: number,
    cancelled: boolean,
  }
  export interface VehicleDestroyEventData {
    vehicleId: number,
    attackerId?: number,
    cancelled: boolean,
  }
  export interface VehicleEnterEventData {
    vehicleId: number,
    enteredId: number,
    cancelled: boolean,
  }
  export interface VehicleEntityCollisionEventData {
    vehicleId: number,
    collidedEntityId: number,
    cancelled: boolean,
  }
  export interface VehicleExitEventData {
    vehicleId: number,
    exitedId: number,
    cancelled: boolean,
  }
  export interface VehicleMoveEventData {
    vehicleId: number,
    fromPosition: Position,
    toPosition: Position,
    cancelled: boolean,
  }
  export interface VehicleUpdateEventData {
    vehicleId: number,
    cancelled: boolean,
  }
  export interface EnchantmentOffer {
    cost: number,
    enchantmentId: number,
    enchantmentLevel: number,
  }
  export interface PrepareItemEnchantEventData {
    player: Player,
    item: ItemStack,
    offers: Array<EnchantmentOffer>,
    bookshelfCount: number,
    cancelled: boolean,
  }
  export interface EnchantmentValue {
    enchantment: Enchantment,
    level: number,
  }
  export interface EnchantItemEventData {
    player: Player,
    item: ItemStack,
    option: number,
    cost: number,
    enchantmentsToAdd: Array<EnchantmentValue>,
    cancelled: boolean,
  }
  export interface LightningStrikeEventData {
    position: Position,
    isEffect: boolean,
    cancelled: boolean,
  }
  /**
   * # Variants
   * 
   * ## `"player-join-event"`
   * 
   * ## `"player-leave-event"`
   * 
   * ## `"player-login-event"`
   * 
   * ## `"player-chat-event"`
   * 
   * ## `"player-command-send-event"`
   * 
   * ## `"player-permission-check-event"`
   * 
   * ## `"player-move-event"`
   * 
   * ## `"player-teleport-event"`
   * 
   * ## `"player-change-world-event"`
   * 
   * ## `"player-respawn-event"`
   * 
   * ## `"player-exp-change-event"`
   * 
   * ## `"player-item-held-event"`
   * 
   * ## `"player-changed-main-hand-event"`
   * 
   * ## `"player-gamemode-change-event"`
   * 
   * ## `"player-custom-payload-event"`
   * 
   * ## `"player-fish-event"`
   * 
   * ## `"player-egg-throw-event"`
   * 
   * ## `"player-interact-unknown-entity-event"`
   * 
   * ## `"player-interact-entity-event"`
   * 
   * ## `"player-interact-event"`
   * 
   * ## `"player-toggle-sneak-event"`
   * 
   * ## `"player-toggle-flight-event"`
   * 
   * ## `"player-toggle-sprint-event"`
   * 
   * ## `"inventory-click-event"`
   * 
   * ## `"inventory-close-event"`
   * 
   * ## `"block-redstone-event"`
   * 
   * ## `"block-break-event"`
   * 
   * ## `"block-burn-event"`
   * 
   * ## `"block-can-build-event"`
   * 
   * ## `"block-grow-event"`
   * 
   * ## `"block-place-event"`
   * 
   * ## `"bedrock-form-response-event"`
   * 
   * ## `"dialog-click-action-event"`
   * 
   * ## `"dialog-show-event"`
   * 
   * ## `"dialog-clear-event"`
   * 
   * ## `"server-command-event"`
   * 
   * ## `"server-list-ping-event"`
   * 
   * ## `"server-load-event"`
   * 
   * ## `"spawn-change-event"`
   * 
   * ## `"server-broadcast-event"`
   * 
   * ## `"server-tick-start-event"`
   * 
   * ## `"server-tick-end-event"`
   * 
   * ## `"packet-received-event"`
   * 
   * ## `"packet-sent-event"`
   * 
   * ## `"chunk-load-event"`
   * 
   * ## `"chunk-save-event"`
   * 
   * ## `"chunk-send-event"`
   * 
   * ## `"entity-damage-event"`
   * 
   * ## `"entity-death-event"`
   * 
   * ## `"player-death-event"`
   * 
   * ## `"entity-spawn-event"`
   * 
   * ## `"entity-combust-event"`
   * 
   * ## `"entity-regain-health-event"`
   * 
   * ## `"entity-air-change-event"`
   * 
   * ## `"entity-breed-event"`
   * 
   * ## `"entity-dismount-event"`
   * 
   * ## `"entity-dye-event"`
   * 
   * ## `"entity-enter-love-mode-event"`
   * 
   * ## `"entity-explode-event"`
   * 
   * ## `"entity-mount-event"`
   * 
   * ## `"entity-pickup-item-event"`
   * 
   * ## `"entity-portal-event"`
   * 
   * ## `"entity-resurrect-event"`
   * 
   * ## `"entity-shoot-bow-event"`
   * 
   * ## `"entity-tame-event"`
   * 
   * ## `"entity-target-event"`
   * 
   * ## `"entity-teleport-event"`
   * 
   * ## `"entity-toggle-glide-event"`
   * 
   * ## `"entity-transform-event"`
   * 
   * ## `"player-item-consume-event"`
   * 
   * ## `"player-item-damage-event"`
   * 
   * ## `"player-drop-item-event"`
   * 
   * ## `"player-bed-enter-event"`
   * 
   * ## `"player-bed-leave-event"`
   * 
   * ## `"player-bucket-empty-event"`
   * 
   * ## `"player-bucket-fill-event"`
   * 
   * ## `"block-damage-event"`
   * 
   * ## `"block-ignite-event"`
   * 
   * ## `"block-from-to-event"`
   * 
   * ## `"block-form-event"`
   * 
   * ## `"block-fade-event"`
   * 
   * ## `"block-dispense-event"`
   * 
   * ## `"block-explode-event"`
   * 
   * ## `"block-physics-event"`
   * 
   * ## `"block-piston-extend-event"`
   * 
   * ## `"block-piston-retract-event"`
   * 
   * ## `"note-play-event"`
   * 
   * ## `"sign-change-event"`
   * 
   * ## `"sponge-absorb-event"`
   * 
   * ## `"tnt-prime-event"`
   * 
   * ## `"weather-change-event"`
   * 
   * ## `"thunder-change-event"`
   * 
   * ## `"world-load-event"`
   * 
   * ## `"world-unload-event"`
   * 
   * ## `"async-structure-generate-event"`
   * 
   * ## `"async-structure-spawn-event"`
   * 
   * ## `"chunk-populate-event"`
   * 
   * ## `"chunk-unload-event"`
   * 
   * ## `"entities-load-event"`
   * 
   * ## `"entities-unload-event"`
   * 
   * ## `"generic-game-event"`
   * 
   * ## `"loot-generate-event"`
   * 
   * ## `"portal-create-event"`
   * 
   * ## `"structure-grow-event"`
   * 
   * ## `"time-skip-event"`
   * 
   * ## `"world-init-event"`
   * 
   * ## `"world-save-event"`
   * 
   * ## `"inventory-open-event"`
   * 
   * ## `"inventory-drag-event"`
   * 
   * ## `"craft-item-event"`
   * 
   * ## `"furnace-smelt-event"`
   * 
   * ## `"brew-event"`
   * 
   * ## `"brewing-stand-fuel-event"`
   * 
   * ## `"furnace-burn-event"`
   * 
   * ## `"furnace-extract-event"`
   * 
   * ## `"furnace-start-smelt-event"`
   * 
   * ## `"hopper-inventory-search-event"`
   * 
   * ## `"inventory-creative-event"`
   * 
   * ## `"inventory-interact-event"`
   * 
   * ## `"inventory-move-item-event"`
   * 
   * ## `"inventory-pickup-item-event"`
   * 
   * ## `"prepare-anvil-event"`
   * 
   * ## `"prepare-grindstone-event"`
   * 
   * ## `"prepare-inventory-result-event"`
   * 
   * ## `"prepare-item-craft-event"`
   * 
   * ## `"prepare-smithing-event"`
   * 
   * ## `"smith-item-event"`
   * 
   * ## `"trade-select-event"`
   * 
   * ## `"vehicle-block-collision-event"`
   * 
   * ## `"vehicle-collision-event"`
   * 
   * ## `"vehicle-create-event"`
   * 
   * ## `"vehicle-damage-event"`
   * 
   * ## `"vehicle-destroy-event"`
   * 
   * ## `"vehicle-enter-event"`
   * 
   * ## `"vehicle-entity-collision-event"`
   * 
   * ## `"vehicle-exit-event"`
   * 
   * ## `"vehicle-move-event"`
   * 
   * ## `"vehicle-update-event"`
   * 
   * ## `"prepare-item-enchant-event"`
   * 
   * ## `"enchant-item-event"`
   * 
   * ## `"map-initialize-event"`
   * 
   * ## `"hanging-break-event"`
   * 
   * ## `"hanging-break-by-entity-event"`
   * 
   * ## `"hanging-place-event"`
   * 
   * ## `"bell-resonate-event"`
   * 
   * ## `"bell-ring-event"`
   * 
   * ## `"block-brush-event"`
   * 
   * ## `"block-cook-event"`
   * 
   * ## `"block-damage-abort-event"`
   * 
   * ## `"block-dispense-armor-event"`
   * 
   * ## `"block-dispense-loot-event"`
   * 
   * ## `"block-drop-item-event"`
   * 
   * ## `"block-exp-event"`
   * 
   * ## `"block-fertilize-event"`
   * 
   * ## `"block-multi-place-event"`
   * 
   * ## `"block-receive-game-event"`
   * 
   * ## `"block-shear-entity-event"`
   * 
   * ## `"block-spread-event"`
   * 
   * ## `"brewing-start-event"`
   * 
   * ## `"campfire-start-event"`
   * 
   * ## `"cauldron-level-change-event"`
   * 
   * ## `"crafter-craft-event"`
   * 
   * ## `"entity-block-form-event"`
   * 
   * ## `"fluid-level-change-event"`
   * 
   * ## `"inventory-block-start-event"`
   * 
   * ## `"leaves-decay-event"`
   * 
   * ## `"moisture-change-event"`
   * 
   * ## `"sculk-bloom-event"`
   * 
   * ## `"vault-display-item-event"`
   * 
   * ## `"creature-spawn-event"`
   * 
   * ## `"ender-dragon-change-phase-event"`
   * 
   * ## `"entity-break-door-event"`
   * 
   * ## `"entity-change-block-event"`
   * 
   * ## `"entity-damage-by-block-event"`
   * 
   * ## `"entity-damage-by-entity-event"`
   * 
   * ## `"entity-drop-item-event"`
   * 
   * ## `"entity-enter-block-event"`
   * 
   * ## `"entity-exhaustion-event"`
   * 
   * ## `"entity-interact-event"`
   * 
   * ## `"entity-knockback-event"`
   * 
   * ## `"entity-place-event"`
   * 
   * ## `"entity-pose-change-event"`
   * 
   * ## `"entity-potion-effect-event"`
   * 
   * ## `"entity-spell-cast-event"`
   * 
   * ## `"entity-target-living-entity-event"`
   * 
   * ## `"entity-toggle-swim-event"`
   * 
   * ## `"explosion-prime-event"`
   * 
   * ## `"firework-explode-event"`
   * 
   * ## `"food-level-change-event"`
   * 
   * ## `"item-despawn-event"`
   * 
   * ## `"item-merge-event"`
   * 
   * ## `"item-spawn-event"`
   * 
   * ## `"piglin-barter-event"`
   * 
   * ## `"projectile-hit-event"`
   * 
   * ## `"projectile-launch-event"`
   * 
   * ## `"sheep-dye-wool-event"`
   * 
   * ## `"sheep-regrow-wool-event"`
   * 
   * ## `"slime-split-event"`
   * 
   * ## `"strider-temperature-change-event"`
   * 
   * ## `"villager-acquire-trade-event"`
   * 
   * ## `"villager-career-change-event"`
   * 
   * ## `"villager-replenish-trade-event"`
   * 
   * ## `"warden-anger-change-event"`
   * 
   * ## `"area-effect-cloud-apply-event"`
   * 
   * ## `"arrow-body-count-change-event"`
   * 
   * ## `"bat-toggle-sleep-event"`
   * 
   * ## `"creeper-power-event"`
   * 
   * ## `"entity-combust-by-block-event"`
   * 
   * ## `"entity-combust-by-entity-event"`
   * 
   * ## `"entity-knockback-by-entity-event"`
   * 
   * ## `"entity-portal-enter-event"`
   * 
   * ## `"entity-portal-exit-event"`
   * 
   * ## `"entity-remove-event"`
   * 
   * ## `"entity-target-block-event"`
   * 
   * ## `"entity-unleash-event"`
   * 
   * ## `"exp-bottle-event"`
   * 
   * ## `"horse-jump-event"`
   * 
   * ## `"lingering-potion-splash-event"`
   * 
   * ## `"pig-zap-event"`
   * 
   * ## `"pig-zombie-anger-event"`
   * 
   * ## `"potion-splash-event"`
   * 
   * ## `"spawner-spawn-event"`
   * 
   * ## `"trial-spawner-spawn-event"`
   * 
   * ## `"villager-reputation-change-event"`
   * 
   * ## `"async-player-chat-event"`
   * 
   * ## `"async-player-pre-login-event"`
   * 
   * ## `"player-advancement-done-event"`
   * 
   * ## `"player-animation-event"`
   * 
   * ## `"player-armor-stand-manipulate-event"`
   * 
   * ## `"player-bucket-entity-event"`
   * 
   * ## `"player-changed-world-event"`
   * 
   * ## `"player-channel-event"`
   * 
   * ## `"player-command-preprocess-event"`
   * 
   * ## `"player-edit-book-event"`
   * 
   * ## `"player-elytra-boost-event"`
   * 
   * ## `"player-exp-cooldown-change-event"`
   * 
   * ## `"player-harvest-block-event"`
   * 
   * ## `"player-hide-entity-event"`
   * 
   * ## `"player-item-break-event"`
   * 
   * ## `"player-item-mend-event"`
   * 
   * ## `"player-kick-event"`
   * 
   * ## `"player-leash-entity-event"`
   * 
   * ## `"player-level-change-event"`
   * 
   * ## `"player-locale-change-event"`
   * 
   * ## `"player-name-entity-event"`
   * 
   * ## `"player-open-sign-event"`
   * 
   * ## `"player-portal-event"`
   * 
   * ## `"player-pre-login-event"`
   * 
   * ## `"player-riptide-event"`
   * 
   * ## `"player-shear-entity-event"`
   * 
   * ## `"player-show-entity-event"`
   * 
   * ## `"player-spawn-change-event"`
   * 
   * ## `"player-statistic-increment-event"`
   * 
   * ## `"player-swap-hands-event"`
   * 
   * ## `"player-take-lectern-book-event"`
   * 
   * ## `"player-unleash-entity-event"`
   * 
   * ## `"player-velocity-event"`
   * 
   * ## `"player-input-event"`
   * 
   * ## `"player-interact-at-entity-event"`
   * 
   * ## `"player-links-send-event"`
   * 
   * ## `"player-pickup-arrow-event"`
   * 
   * ## `"player-recipe-book-click-event"`
   * 
   * ## `"player-recipe-book-settings-change-event"`
   * 
   * ## `"player-recipe-discover-event"`
   * 
   * ## `"player-register-channel-event"`
   * 
   * ## `"player-resource-pack-status-event"`
   * 
   * ## `"player-spawn-location-event"`
   * 
   * ## `"player-unregister-channel-event"`
   * 
   * ## `"raid-finish-event"`
   * 
   * ## `"raid-spawn-wave-event"`
   * 
   * ## `"raid-stop-event"`
   * 
   * ## `"raid-trigger-event"`
   * 
   * ## `"lightning-strike-event"`
   */
  export type EventType = 'player-join-event' | 'player-leave-event' | 'player-login-event' | 'player-chat-event' | 'player-command-send-event' | 'player-permission-check-event' | 'player-move-event' | 'player-teleport-event' | 'player-change-world-event' | 'player-respawn-event' | 'player-exp-change-event' | 'player-item-held-event' | 'player-changed-main-hand-event' | 'player-gamemode-change-event' | 'player-custom-payload-event' | 'player-fish-event' | 'player-egg-throw-event' | 'player-interact-unknown-entity-event' | 'player-interact-entity-event' | 'player-interact-event' | 'player-toggle-sneak-event' | 'player-toggle-flight-event' | 'player-toggle-sprint-event' | 'inventory-click-event' | 'inventory-close-event' | 'block-redstone-event' | 'block-break-event' | 'block-burn-event' | 'block-can-build-event' | 'block-grow-event' | 'block-place-event' | 'bedrock-form-response-event' | 'dialog-click-action-event' | 'dialog-show-event' | 'dialog-clear-event' | 'server-command-event' | 'server-list-ping-event' | 'server-load-event' | 'spawn-change-event' | 'server-broadcast-event' | 'server-tick-start-event' | 'server-tick-end-event' | 'packet-received-event' | 'packet-sent-event' | 'chunk-load-event' | 'chunk-save-event' | 'chunk-send-event' | 'entity-damage-event' | 'entity-death-event' | 'player-death-event' | 'entity-spawn-event' | 'entity-combust-event' | 'entity-regain-health-event' | 'entity-air-change-event' | 'entity-breed-event' | 'entity-dismount-event' | 'entity-dye-event' | 'entity-enter-love-mode-event' | 'entity-explode-event' | 'entity-mount-event' | 'entity-pickup-item-event' | 'entity-portal-event' | 'entity-resurrect-event' | 'entity-shoot-bow-event' | 'entity-tame-event' | 'entity-target-event' | 'entity-teleport-event' | 'entity-toggle-glide-event' | 'entity-transform-event' | 'player-item-consume-event' | 'player-item-damage-event' | 'player-drop-item-event' | 'player-bed-enter-event' | 'player-bed-leave-event' | 'player-bucket-empty-event' | 'player-bucket-fill-event' | 'block-damage-event' | 'block-ignite-event' | 'block-from-to-event' | 'block-form-event' | 'block-fade-event' | 'block-dispense-event' | 'block-explode-event' | 'block-physics-event' | 'block-piston-extend-event' | 'block-piston-retract-event' | 'note-play-event' | 'sign-change-event' | 'sponge-absorb-event' | 'tnt-prime-event' | 'weather-change-event' | 'thunder-change-event' | 'world-load-event' | 'world-unload-event' | 'async-structure-generate-event' | 'async-structure-spawn-event' | 'chunk-populate-event' | 'chunk-unload-event' | 'entities-load-event' | 'entities-unload-event' | 'generic-game-event' | 'loot-generate-event' | 'portal-create-event' | 'structure-grow-event' | 'time-skip-event' | 'world-init-event' | 'world-save-event' | 'inventory-open-event' | 'inventory-drag-event' | 'craft-item-event' | 'furnace-smelt-event' | 'brew-event' | 'brewing-stand-fuel-event' | 'furnace-burn-event' | 'furnace-extract-event' | 'furnace-start-smelt-event' | 'hopper-inventory-search-event' | 'inventory-creative-event' | 'inventory-interact-event' | 'inventory-move-item-event' | 'inventory-pickup-item-event' | 'prepare-anvil-event' | 'prepare-grindstone-event' | 'prepare-inventory-result-event' | 'prepare-item-craft-event' | 'prepare-smithing-event' | 'smith-item-event' | 'trade-select-event' | 'vehicle-block-collision-event' | 'vehicle-collision-event' | 'vehicle-create-event' | 'vehicle-damage-event' | 'vehicle-destroy-event' | 'vehicle-enter-event' | 'vehicle-entity-collision-event' | 'vehicle-exit-event' | 'vehicle-move-event' | 'vehicle-update-event' | 'prepare-item-enchant-event' | 'enchant-item-event' | 'map-initialize-event' | 'hanging-break-event' | 'hanging-break-by-entity-event' | 'hanging-place-event' | 'bell-resonate-event' | 'bell-ring-event' | 'block-brush-event' | 'block-cook-event' | 'block-damage-abort-event' | 'block-dispense-armor-event' | 'block-dispense-loot-event' | 'block-drop-item-event' | 'block-exp-event' | 'block-fertilize-event' | 'block-multi-place-event' | 'block-receive-game-event' | 'block-shear-entity-event' | 'block-spread-event' | 'brewing-start-event' | 'campfire-start-event' | 'cauldron-level-change-event' | 'crafter-craft-event' | 'entity-block-form-event' | 'fluid-level-change-event' | 'inventory-block-start-event' | 'leaves-decay-event' | 'moisture-change-event' | 'sculk-bloom-event' | 'vault-display-item-event' | 'creature-spawn-event' | 'ender-dragon-change-phase-event' | 'entity-break-door-event' | 'entity-change-block-event' | 'entity-damage-by-block-event' | 'entity-damage-by-entity-event' | 'entity-drop-item-event' | 'entity-enter-block-event' | 'entity-exhaustion-event' | 'entity-interact-event' | 'entity-knockback-event' | 'entity-place-event' | 'entity-pose-change-event' | 'entity-potion-effect-event' | 'entity-spell-cast-event' | 'entity-target-living-entity-event' | 'entity-toggle-swim-event' | 'explosion-prime-event' | 'firework-explode-event' | 'food-level-change-event' | 'item-despawn-event' | 'item-merge-event' | 'item-spawn-event' | 'piglin-barter-event' | 'projectile-hit-event' | 'projectile-launch-event' | 'sheep-dye-wool-event' | 'sheep-regrow-wool-event' | 'slime-split-event' | 'strider-temperature-change-event' | 'villager-acquire-trade-event' | 'villager-career-change-event' | 'villager-replenish-trade-event' | 'warden-anger-change-event' | 'area-effect-cloud-apply-event' | 'arrow-body-count-change-event' | 'bat-toggle-sleep-event' | 'creeper-power-event' | 'entity-combust-by-block-event' | 'entity-combust-by-entity-event' | 'entity-knockback-by-entity-event' | 'entity-portal-enter-event' | 'entity-portal-exit-event' | 'entity-remove-event' | 'entity-target-block-event' | 'entity-unleash-event' | 'exp-bottle-event' | 'horse-jump-event' | 'lingering-potion-splash-event' | 'pig-zap-event' | 'pig-zombie-anger-event' | 'potion-splash-event' | 'spawner-spawn-event' | 'trial-spawner-spawn-event' | 'villager-reputation-change-event' | 'async-player-chat-event' | 'async-player-pre-login-event' | 'player-advancement-done-event' | 'player-animation-event' | 'player-armor-stand-manipulate-event' | 'player-bucket-entity-event' | 'player-changed-world-event' | 'player-channel-event' | 'player-command-preprocess-event' | 'player-edit-book-event' | 'player-elytra-boost-event' | 'player-exp-cooldown-change-event' | 'player-harvest-block-event' | 'player-hide-entity-event' | 'player-item-break-event' | 'player-item-mend-event' | 'player-kick-event' | 'player-leash-entity-event' | 'player-level-change-event' | 'player-locale-change-event' | 'player-name-entity-event' | 'player-open-sign-event' | 'player-portal-event' | 'player-pre-login-event' | 'player-riptide-event' | 'player-shear-entity-event' | 'player-show-entity-event' | 'player-spawn-change-event' | 'player-statistic-increment-event' | 'player-swap-hands-event' | 'player-take-lectern-book-event' | 'player-unleash-entity-event' | 'player-velocity-event' | 'player-input-event' | 'player-interact-at-entity-event' | 'player-links-send-event' | 'player-pickup-arrow-event' | 'player-recipe-book-click-event' | 'player-recipe-book-settings-change-event' | 'player-recipe-discover-event' | 'player-register-channel-event' | 'player-resource-pack-status-event' | 'player-spawn-location-event' | 'player-unregister-channel-event' | 'raid-finish-event' | 'raid-spawn-wave-event' | 'raid-stop-event' | 'raid-trigger-event' | 'lightning-strike-event';
  export type Event = EventPlayerJoinEvent | EventPlayerLeaveEvent | EventPlayerLoginEvent | EventPlayerChatEvent | EventPlayerCommandSendEvent | EventPlayerPermissionCheckEvent | EventPlayerMoveEvent | EventPlayerTeleportEvent | EventPlayerChangeWorldEvent | EventPlayerRespawnEvent | EventPlayerExpChangeEvent | EventPlayerItemHeldEvent | EventPlayerChangedMainHandEvent | EventPlayerGamemodeChangeEvent | EventPlayerCustomPayloadEvent | EventPlayerFishEvent | EventPlayerEggThrowEvent | EventPlayerInteractUnknownEntityEvent | EventPlayerInteractEntityEvent | EventPlayerInteractEvent | EventPlayerToggleSneakEvent | EventPlayerToggleFlightEvent | EventPlayerToggleSprintEvent | EventInventoryClickEvent | EventInventoryCloseEvent | EventBlockRedstoneEvent | EventBlockBreakEvent | EventBlockBurnEvent | EventBlockCanBuildEvent | EventBlockGrowEvent | EventBlockPlaceEvent | EventDialogClickActionEvent | EventDialogShowEvent | EventDialogClearEvent | EventBedrockFormResponseEvent | EventServerCommandEvent | EventServerListPingEvent | EventServerLoadEvent | EventSpawnChangeEvent | EventServerBroadcastEvent | EventServerTickStartEvent | EventServerTickEndEvent | EventPacketReceivedEvent | EventPacketSentEvent | EventChunkLoadEvent | EventChunkSaveEvent | EventChunkSendEvent | EventEntityDamageEvent | EventEntityDeathEvent | EventPlayerDeathEvent | EventEntitySpawnEvent | EventEntityCombustEvent | EventEntityRegainHealthEvent | EventEntityAirChangeEvent | EventEntityBreedEvent | EventEntityDismountEvent | EventEntityDyeEvent | EventEntityEnterLoveModeEvent | EventEntityExplodeEvent | EventEntityMountEvent | EventEntityPickupItemEvent | EventEntityPortalEvent | EventEntityResurrectEvent | EventEntityShootBowEvent | EventEntityTameEvent | EventEntityTargetEvent | EventEntityTeleportEvent | EventEntityToggleGlideEvent | EventEntityTransformEvent | EventPlayerItemConsumeEvent | EventPlayerItemDamageEvent | EventPlayerDropItemEvent | EventPlayerBedEnterEvent | EventPlayerBedLeaveEvent | EventPlayerBucketEmptyEvent | EventPlayerBucketFillEvent | EventBlockDamageEvent | EventBlockIgniteEvent | EventBlockFromToEvent | EventBlockFormEvent | EventBlockFadeEvent | EventBlockDispenseEvent | EventBlockExplodeEvent | EventBlockPhysicsEvent | EventBlockPistonExtendEvent | EventBlockPistonRetractEvent | EventNotePlayEvent | EventSignChangeEvent | EventSpongeAbsorbEvent | EventTntPrimeEvent | EventWeatherChangeEvent | EventThunderChangeEvent | EventWorldLoadEvent | EventWorldUnloadEvent | EventAsyncStructureGenerateEvent | EventAsyncStructureSpawnEvent | EventChunkPopulateEvent | EventChunkUnloadEvent | EventEntitiesLoadEvent | EventEntitiesUnloadEvent | EventGenericGameEvent | EventLootGenerateEvent | EventPortalCreateEvent | EventStructureGrowEvent | EventTimeSkipEvent | EventWorldInitEvent | EventWorldSaveEvent | EventInventoryOpenEvent | EventInventoryDragEvent | EventCraftItemEvent | EventFurnaceSmeltEvent | EventBrewEvent | EventBrewingStandFuelEvent | EventFurnaceBurnEvent | EventFurnaceExtractEvent | EventFurnaceStartSmeltEvent | EventHopperInventorySearchEvent | EventInventoryCreativeEvent | EventInventoryInteractEvent | EventInventoryMoveItemEvent | EventInventoryPickupItemEvent | EventPrepareAnvilEvent | EventPrepareGrindstoneEvent | EventPrepareInventoryResultEvent | EventPrepareItemCraftEvent | EventPrepareSmithingEvent | EventSmithItemEvent | EventTradeSelectEvent | EventVehicleBlockCollisionEvent | EventVehicleCollisionEvent | EventVehicleCreateEvent | EventVehicleDamageEvent | EventVehicleDestroyEvent | EventVehicleEnterEvent | EventVehicleEntityCollisionEvent | EventVehicleExitEvent | EventVehicleMoveEvent | EventVehicleUpdateEvent | EventPrepareItemEnchantEvent | EventEnchantItemEvent | EventMapInitializeEvent | EventHangingBreakEvent | EventHangingBreakByEntityEvent | EventHangingPlaceEvent | EventBellResonateEvent | EventBellRingEvent | EventBlockBrushEvent | EventBlockCookEvent | EventBlockDamageAbortEvent | EventBlockDispenseArmorEvent | EventBlockDispenseLootEvent | EventBlockDropItemEvent | EventBlockExpEvent | EventBlockFertilizeEvent | EventBlockMultiPlaceEvent | EventBlockReceiveGameEvent | EventBlockShearEntityEvent | EventBlockSpreadEvent | EventBrewingStartEvent | EventCampfireStartEvent | EventCauldronLevelChangeEvent | EventCrafterCraftEvent | EventEntityBlockFormEvent | EventFluidLevelChangeEvent | EventInventoryBlockStartEvent | EventLeavesDecayEvent | EventMoistureChangeEvent | EventSculkBloomEvent | EventVaultDisplayItemEvent | EventCreatureSpawnEvent | EventEnderDragonChangePhaseEvent | EventEntityBreakDoorEvent | EventEntityChangeBlockEvent | EventEntityDamageByBlockEvent | EventEntityDamageByEntityEvent | EventEntityDropItemEvent | EventEntityEnterBlockEvent | EventEntityExhaustionEvent | EventEntityInteractEvent | EventEntityKnockbackEvent | EventEntityPlaceEvent | EventEntityPoseChangeEvent | EventEntityPotionEffectEvent | EventEntitySpellCastEvent | EventEntityTargetLivingEntityEvent | EventEntityToggleSwimEvent | EventExplosionPrimeEvent | EventFireworkExplodeEvent | EventFoodLevelChangeEvent | EventItemDespawnEvent | EventItemMergeEvent | EventItemSpawnEvent | EventPiglinBarterEvent | EventProjectileHitEvent | EventProjectileLaunchEvent | EventSheepDyeWoolEvent | EventSheepRegrowWoolEvent | EventSlimeSplitEvent | EventStriderTemperatureChangeEvent | EventVillagerAcquireTradeEvent | EventVillagerCareerChangeEvent | EventVillagerReplenishTradeEvent | EventWardenAngerChangeEvent | EventAreaEffectCloudApplyEvent | EventArrowBodyCountChangeEvent | EventBatToggleSleepEvent | EventCreeperPowerEvent | EventEntityCombustByBlockEvent | EventEntityCombustByEntityEvent | EventEntityKnockbackByEntityEvent | EventEntityPortalEnterEvent | EventEntityPortalExitEvent | EventEntityRemoveEvent | EventEntityTargetBlockEvent | EventEntityUnleashEvent | EventExpBottleEvent | EventHorseJumpEvent | EventLingeringPotionSplashEvent | EventPigZapEvent | EventPigZombieAngerEvent | EventPotionSplashEvent | EventSpawnerSpawnEvent | EventTrialSpawnerSpawnEvent | EventVillagerReputationChangeEvent | EventAsyncPlayerChatEvent | EventAsyncPlayerPreLoginEvent | EventPlayerAdvancementDoneEvent | EventPlayerAnimationEvent | EventPlayerArmorStandManipulateEvent | EventPlayerBucketEntityEvent | EventPlayerChangedWorldEvent | EventPlayerChannelEvent | EventPlayerCommandPreprocessEvent | EventPlayerEditBookEvent | EventPlayerElytraBoostEvent | EventPlayerExpCooldownChangeEvent | EventPlayerHarvestBlockEvent | EventPlayerHideEntityEvent | EventPlayerItemBreakEvent | EventPlayerItemMendEvent | EventPlayerKickEvent | EventPlayerLeashEntityEvent | EventPlayerLevelChangeEvent | EventPlayerLocaleChangeEvent | EventPlayerNameEntityEvent | EventPlayerOpenSignEvent | EventPlayerPortalEvent | EventPlayerPreLoginEvent | EventPlayerRiptideEvent | EventPlayerShearEntityEvent | EventPlayerShowEntityEvent | EventPlayerSpawnChangeEvent | EventPlayerStatisticIncrementEvent | EventPlayerSwapHandsEvent | EventPlayerTakeLecternBookEvent | EventPlayerUnleashEntityEvent | EventPlayerVelocityEvent | EventPlayerInputEvent | EventPlayerInteractAtEntityEvent | EventPlayerLinksSendEvent | EventPlayerPickupArrowEvent | EventPlayerRecipeBookClickEvent | EventPlayerRecipeBookSettingsChangeEvent | EventPlayerRecipeDiscoverEvent | EventPlayerRegisterChannelEvent | EventPlayerResourcePackStatusEvent | EventPlayerSpawnLocationEvent | EventPlayerUnregisterChannelEvent | EventRaidFinishEvent | EventRaidSpawnWaveEvent | EventRaidStopEvent | EventRaidTriggerEvent | EventLightningStrikeEvent;
  export interface EventPlayerJoinEvent {
    tag: 'player-join-event',
    val: PlayerJoinEventData,
  }
  export interface EventPlayerLeaveEvent {
    tag: 'player-leave-event',
    val: PlayerLeaveEventData,
  }
  export interface EventPlayerLoginEvent {
    tag: 'player-login-event',
    val: PlayerLoginEventData,
  }
  export interface EventPlayerChatEvent {
    tag: 'player-chat-event',
    val: PlayerChatEventData,
  }
  export interface EventPlayerCommandSendEvent {
    tag: 'player-command-send-event',
    val: PlayerCommandSendEventData,
  }
  export interface EventPlayerPermissionCheckEvent {
    tag: 'player-permission-check-event',
    val: PlayerPermissionCheckEventData,
  }
  export interface EventPlayerMoveEvent {
    tag: 'player-move-event',
    val: PlayerMoveEventData,
  }
  export interface EventPlayerTeleportEvent {
    tag: 'player-teleport-event',
    val: PlayerTeleportEventData,
  }
  export interface EventPlayerChangeWorldEvent {
    tag: 'player-change-world-event',
    val: PlayerChangeWorldEventData,
  }
  export interface EventPlayerRespawnEvent {
    tag: 'player-respawn-event',
    val: PlayerRespawnEventData,
  }
  export interface EventPlayerExpChangeEvent {
    tag: 'player-exp-change-event',
    val: PlayerExpChangeEventData,
  }
  export interface EventPlayerItemHeldEvent {
    tag: 'player-item-held-event',
    val: PlayerItemHeldEventData,
  }
  export interface EventPlayerChangedMainHandEvent {
    tag: 'player-changed-main-hand-event',
    val: PlayerChangedMainHandEventData,
  }
  export interface EventPlayerGamemodeChangeEvent {
    tag: 'player-gamemode-change-event',
    val: PlayerGamemodeChangeEventData,
  }
  export interface EventPlayerCustomPayloadEvent {
    tag: 'player-custom-payload-event',
    val: PlayerCustomPayloadEventData,
  }
  export interface EventPlayerFishEvent {
    tag: 'player-fish-event',
    val: PlayerFishEventData,
  }
  export interface EventPlayerEggThrowEvent {
    tag: 'player-egg-throw-event',
    val: PlayerEggThrowEventData,
  }
  export interface EventPlayerInteractUnknownEntityEvent {
    tag: 'player-interact-unknown-entity-event',
    val: PlayerInteractUnknownEntityEventData,
  }
  export interface EventPlayerInteractEntityEvent {
    tag: 'player-interact-entity-event',
    val: PlayerInteractEntityEventData,
  }
  export interface EventPlayerInteractEvent {
    tag: 'player-interact-event',
    val: PlayerInteractEventData,
  }
  export interface EventPlayerToggleSneakEvent {
    tag: 'player-toggle-sneak-event',
    val: PlayerToggleSneakEventData,
  }
  export interface EventPlayerToggleFlightEvent {
    tag: 'player-toggle-flight-event',
    val: PlayerToggleFlightEventData,
  }
  export interface EventPlayerToggleSprintEvent {
    tag: 'player-toggle-sprint-event',
    val: PlayerToggleSprintEventData,
  }
  export interface EventInventoryClickEvent {
    tag: 'inventory-click-event',
    val: InventoryClickEventData,
  }
  export interface EventInventoryCloseEvent {
    tag: 'inventory-close-event',
    val: InventoryCloseEventData,
  }
  export interface EventBlockRedstoneEvent {
    tag: 'block-redstone-event',
    val: BlockRedstoneEventData,
  }
  export interface EventBlockBreakEvent {
    tag: 'block-break-event',
    val: BlockBreakEventData,
  }
  export interface EventBlockBurnEvent {
    tag: 'block-burn-event',
    val: BlockBurnEventData,
  }
  export interface EventBlockCanBuildEvent {
    tag: 'block-can-build-event',
    val: BlockCanBuildEventData,
  }
  export interface EventBlockGrowEvent {
    tag: 'block-grow-event',
    val: BlockGrowEventData,
  }
  export interface EventBlockPlaceEvent {
    tag: 'block-place-event',
    val: BlockPlaceEventData,
  }
  export interface EventDialogClickActionEvent {
    tag: 'dialog-click-action-event',
    val: DialogClickActionEventData,
  }
  export interface EventDialogShowEvent {
    tag: 'dialog-show-event',
    val: DialogShowEventData,
  }
  export interface EventDialogClearEvent {
    tag: 'dialog-clear-event',
    val: DialogClearEventData,
  }
  export interface EventBedrockFormResponseEvent {
    tag: 'bedrock-form-response-event',
    val: BedrockFormResponseEventData,
  }
  export interface EventServerCommandEvent {
    tag: 'server-command-event',
    val: ServerCommandEventData,
  }
  export interface EventServerListPingEvent {
    tag: 'server-list-ping-event',
    val: ServerListPingEventData,
  }
  export interface EventServerLoadEvent {
    tag: 'server-load-event',
    val: ServerLoadEventData,
  }
  export interface EventSpawnChangeEvent {
    tag: 'spawn-change-event',
    val: SpawnChangeEventData,
  }
  export interface EventServerBroadcastEvent {
    tag: 'server-broadcast-event',
    val: ServerBroadcastEventData,
  }
  export interface EventServerTickStartEvent {
    tag: 'server-tick-start-event',
    val: ServerTickStartEventData,
  }
  export interface EventServerTickEndEvent {
    tag: 'server-tick-end-event',
    val: ServerTickEndEventData,
  }
  export interface EventPacketReceivedEvent {
    tag: 'packet-received-event',
    val: PacketReceivedEventData,
  }
  export interface EventPacketSentEvent {
    tag: 'packet-sent-event',
    val: PacketSentEventData,
  }
  export interface EventChunkLoadEvent {
    tag: 'chunk-load-event',
    val: ChunkLoadEventData,
  }
  export interface EventChunkSaveEvent {
    tag: 'chunk-save-event',
    val: ChunkSaveEventData,
  }
  export interface EventChunkSendEvent {
    tag: 'chunk-send-event',
    val: ChunkSendEventData,
  }
  export interface EventEntityDamageEvent {
    tag: 'entity-damage-event',
    val: EntityDamageEventData,
  }
  export interface EventEntityDeathEvent {
    tag: 'entity-death-event',
    val: EntityDeathEventData,
  }
  export interface EventPlayerDeathEvent {
    tag: 'player-death-event',
    val: PlayerDeathEventData,
  }
  export interface EventEntitySpawnEvent {
    tag: 'entity-spawn-event',
    val: EntitySpawnEventData,
  }
  export interface EventEntityCombustEvent {
    tag: 'entity-combust-event',
    val: EntityCombustEventData,
  }
  export interface EventEntityRegainHealthEvent {
    tag: 'entity-regain-health-event',
    val: EntityRegainHealthEventData,
  }
  export interface EventEntityAirChangeEvent {
    tag: 'entity-air-change-event',
    val: EntityAirChangeEventData,
  }
  export interface EventEntityBreedEvent {
    tag: 'entity-breed-event',
    val: EntityBreedEventData,
  }
  export interface EventEntityDismountEvent {
    tag: 'entity-dismount-event',
    val: EntityDismountEventData,
  }
  export interface EventEntityDyeEvent {
    tag: 'entity-dye-event',
    val: EntityDyeEventData,
  }
  export interface EventEntityEnterLoveModeEvent {
    tag: 'entity-enter-love-mode-event',
    val: EntityEnterLoveModeEventData,
  }
  export interface EventEntityExplodeEvent {
    tag: 'entity-explode-event',
    val: EntityExplodeEventData,
  }
  export interface EventEntityMountEvent {
    tag: 'entity-mount-event',
    val: EntityMountEventData,
  }
  export interface EventEntityPickupItemEvent {
    tag: 'entity-pickup-item-event',
    val: EntityPickupItemEventData,
  }
  export interface EventEntityPortalEvent {
    tag: 'entity-portal-event',
    val: EntityPortalEventData,
  }
  export interface EventEntityResurrectEvent {
    tag: 'entity-resurrect-event',
    val: EntityResurrectEventData,
  }
  export interface EventEntityShootBowEvent {
    tag: 'entity-shoot-bow-event',
    val: EntityShootBowEventData,
  }
  export interface EventEntityTameEvent {
    tag: 'entity-tame-event',
    val: EntityTameEventData,
  }
  export interface EventEntityTargetEvent {
    tag: 'entity-target-event',
    val: EntityTargetEventData,
  }
  export interface EventEntityTeleportEvent {
    tag: 'entity-teleport-event',
    val: EntityTeleportEventData,
  }
  export interface EventEntityToggleGlideEvent {
    tag: 'entity-toggle-glide-event',
    val: EntityToggleGlideEventData,
  }
  export interface EventEntityTransformEvent {
    tag: 'entity-transform-event',
    val: EntityTransformEventData,
  }
  export interface EventPlayerItemConsumeEvent {
    tag: 'player-item-consume-event',
    val: PlayerItemConsumeEventData,
  }
  export interface EventPlayerItemDamageEvent {
    tag: 'player-item-damage-event',
    val: PlayerItemDamageEventData,
  }
  export interface EventPlayerDropItemEvent {
    tag: 'player-drop-item-event',
    val: PlayerDropItemEventData,
  }
  export interface EventPlayerBedEnterEvent {
    tag: 'player-bed-enter-event',
    val: PlayerBedEnterEventData,
  }
  export interface EventPlayerBedLeaveEvent {
    tag: 'player-bed-leave-event',
    val: PlayerBedLeaveEventData,
  }
  export interface EventPlayerBucketEmptyEvent {
    tag: 'player-bucket-empty-event',
    val: PlayerBucketEmptyEventData,
  }
  export interface EventPlayerBucketFillEvent {
    tag: 'player-bucket-fill-event',
    val: PlayerBucketFillEventData,
  }
  export interface EventBlockDamageEvent {
    tag: 'block-damage-event',
    val: BlockDamageEventData,
  }
  export interface EventBlockIgniteEvent {
    tag: 'block-ignite-event',
    val: BlockIgniteEventData,
  }
  export interface EventBlockFromToEvent {
    tag: 'block-from-to-event',
    val: BlockFromToEventData,
  }
  export interface EventBlockFormEvent {
    tag: 'block-form-event',
    val: BlockFormEventData,
  }
  export interface EventBlockFadeEvent {
    tag: 'block-fade-event',
    val: BlockFadeEventData,
  }
  export interface EventBlockDispenseEvent {
    tag: 'block-dispense-event',
    val: BlockDispenseEventData,
  }
  export interface EventBlockExplodeEvent {
    tag: 'block-explode-event',
    val: BlockExplodeEventData,
  }
  export interface EventBlockPhysicsEvent {
    tag: 'block-physics-event',
    val: BlockPhysicsEventData,
  }
  export interface EventBlockPistonExtendEvent {
    tag: 'block-piston-extend-event',
    val: BlockPistonExtendEventData,
  }
  export interface EventBlockPistonRetractEvent {
    tag: 'block-piston-retract-event',
    val: BlockPistonRetractEventData,
  }
  export interface EventNotePlayEvent {
    tag: 'note-play-event',
    val: NotePlayEventData,
  }
  export interface EventSignChangeEvent {
    tag: 'sign-change-event',
    val: SignChangeEventData,
  }
  export interface EventSpongeAbsorbEvent {
    tag: 'sponge-absorb-event',
    val: SpongeAbsorbEventData,
  }
  export interface EventTntPrimeEvent {
    tag: 'tnt-prime-event',
    val: TntPrimeEventData,
  }
  export interface EventWeatherChangeEvent {
    tag: 'weather-change-event',
    val: WeatherChangeEventData,
  }
  export interface EventThunderChangeEvent {
    tag: 'thunder-change-event',
    val: ThunderChangeEventData,
  }
  export interface EventWorldLoadEvent {
    tag: 'world-load-event',
    val: WorldLoadEventData,
  }
  export interface EventWorldUnloadEvent {
    tag: 'world-unload-event',
    val: WorldUnloadEventData,
  }
  export interface EventAsyncStructureGenerateEvent {
    tag: 'async-structure-generate-event',
    val: AsyncStructureGenerateEventData,
  }
  export interface EventAsyncStructureSpawnEvent {
    tag: 'async-structure-spawn-event',
    val: AsyncStructureSpawnEventData,
  }
  export interface EventChunkPopulateEvent {
    tag: 'chunk-populate-event',
    val: ChunkPopulateEventData,
  }
  export interface EventChunkUnloadEvent {
    tag: 'chunk-unload-event',
    val: ChunkUnloadEventData,
  }
  export interface EventEntitiesLoadEvent {
    tag: 'entities-load-event',
    val: EntitiesLoadEventData,
  }
  export interface EventEntitiesUnloadEvent {
    tag: 'entities-unload-event',
    val: EntitiesUnloadEventData,
  }
  export interface EventGenericGameEvent {
    tag: 'generic-game-event',
    val: GenericGameEventData,
  }
  export interface EventLootGenerateEvent {
    tag: 'loot-generate-event',
    val: LootGenerateEventData,
  }
  export interface EventPortalCreateEvent {
    tag: 'portal-create-event',
    val: PortalCreateEventData,
  }
  export interface EventStructureGrowEvent {
    tag: 'structure-grow-event',
    val: StructureGrowEventData,
  }
  export interface EventTimeSkipEvent {
    tag: 'time-skip-event',
    val: TimeSkipEventData,
  }
  export interface EventWorldInitEvent {
    tag: 'world-init-event',
    val: WorldInitEventData,
  }
  export interface EventWorldSaveEvent {
    tag: 'world-save-event',
    val: WorldSaveEventData,
  }
  export interface EventInventoryOpenEvent {
    tag: 'inventory-open-event',
    val: InventoryOpenEventData,
  }
  export interface EventInventoryDragEvent {
    tag: 'inventory-drag-event',
    val: InventoryDragEventData,
  }
  export interface EventCraftItemEvent {
    tag: 'craft-item-event',
    val: CraftItemEventData,
  }
  export interface EventFurnaceSmeltEvent {
    tag: 'furnace-smelt-event',
    val: FurnaceSmeltEventData,
  }
  export interface EventBrewEvent {
    tag: 'brew-event',
    val: BrewEventData,
  }
  export interface EventBrewingStandFuelEvent {
    tag: 'brewing-stand-fuel-event',
    val: BrewingStandFuelEventData,
  }
  export interface EventFurnaceBurnEvent {
    tag: 'furnace-burn-event',
    val: FurnaceBurnEventData,
  }
  export interface EventFurnaceExtractEvent {
    tag: 'furnace-extract-event',
    val: FurnaceExtractEventData,
  }
  export interface EventFurnaceStartSmeltEvent {
    tag: 'furnace-start-smelt-event',
    val: FurnaceStartSmeltEventData,
  }
  export interface EventHopperInventorySearchEvent {
    tag: 'hopper-inventory-search-event',
    val: HopperInventorySearchEventData,
  }
  export interface EventInventoryCreativeEvent {
    tag: 'inventory-creative-event',
    val: InventoryCreativeEventData,
  }
  export interface EventInventoryInteractEvent {
    tag: 'inventory-interact-event',
    val: InventoryInteractEventData,
  }
  export interface EventInventoryMoveItemEvent {
    tag: 'inventory-move-item-event',
    val: InventoryMoveItemEventData,
  }
  export interface EventInventoryPickupItemEvent {
    tag: 'inventory-pickup-item-event',
    val: InventoryPickupItemEventData,
  }
  export interface EventPrepareAnvilEvent {
    tag: 'prepare-anvil-event',
    val: PrepareAnvilEventData,
  }
  export interface EventPrepareGrindstoneEvent {
    tag: 'prepare-grindstone-event',
    val: PrepareGrindstoneEventData,
  }
  export interface EventPrepareInventoryResultEvent {
    tag: 'prepare-inventory-result-event',
    val: PrepareInventoryResultEventData,
  }
  export interface EventPrepareItemCraftEvent {
    tag: 'prepare-item-craft-event',
    val: PrepareItemCraftEventData,
  }
  export interface EventPrepareSmithingEvent {
    tag: 'prepare-smithing-event',
    val: PrepareSmithingEventData,
  }
  export interface EventSmithItemEvent {
    tag: 'smith-item-event',
    val: SmithItemEventData,
  }
  export interface EventTradeSelectEvent {
    tag: 'trade-select-event',
    val: TradeSelectEventData,
  }
  export interface EventVehicleBlockCollisionEvent {
    tag: 'vehicle-block-collision-event',
    val: VehicleBlockCollisionEventData,
  }
  export interface EventVehicleCollisionEvent {
    tag: 'vehicle-collision-event',
    val: VehicleCollisionEventData,
  }
  export interface EventVehicleCreateEvent {
    tag: 'vehicle-create-event',
    val: VehicleCreateEventData,
  }
  export interface EventVehicleDamageEvent {
    tag: 'vehicle-damage-event',
    val: VehicleDamageEventData,
  }
  export interface EventVehicleDestroyEvent {
    tag: 'vehicle-destroy-event',
    val: VehicleDestroyEventData,
  }
  export interface EventVehicleEnterEvent {
    tag: 'vehicle-enter-event',
    val: VehicleEnterEventData,
  }
  export interface EventVehicleEntityCollisionEvent {
    tag: 'vehicle-entity-collision-event',
    val: VehicleEntityCollisionEventData,
  }
  export interface EventVehicleExitEvent {
    tag: 'vehicle-exit-event',
    val: VehicleExitEventData,
  }
  export interface EventVehicleMoveEvent {
    tag: 'vehicle-move-event',
    val: VehicleMoveEventData,
  }
  export interface EventVehicleUpdateEvent {
    tag: 'vehicle-update-event',
    val: VehicleUpdateEventData,
  }
  export interface EventPrepareItemEnchantEvent {
    tag: 'prepare-item-enchant-event',
    val: PrepareItemEnchantEventData,
  }
  export interface EventEnchantItemEvent {
    tag: 'enchant-item-event',
    val: EnchantItemEventData,
  }
  export interface EventMapInitializeEvent {
    tag: 'map-initialize-event',
    val: MapInitializeEventData,
  }
  export interface EventHangingBreakEvent {
    tag: 'hanging-break-event',
    val: HangingBreakEventData,
  }
  export interface EventHangingBreakByEntityEvent {
    tag: 'hanging-break-by-entity-event',
    val: HangingBreakByEntityEventData,
  }
  export interface EventHangingPlaceEvent {
    tag: 'hanging-place-event',
    val: HangingPlaceEventData,
  }
  export interface EventBellResonateEvent {
    tag: 'bell-resonate-event',
    val: BellResonateEventData,
  }
  export interface EventBellRingEvent {
    tag: 'bell-ring-event',
    val: BellRingEventData,
  }
  export interface EventBlockBrushEvent {
    tag: 'block-brush-event',
    val: BlockBrushEventData,
  }
  export interface EventBlockCookEvent {
    tag: 'block-cook-event',
    val: BlockCookEventData,
  }
  export interface EventBlockDamageAbortEvent {
    tag: 'block-damage-abort-event',
    val: BlockDamageAbortEventData,
  }
  export interface EventBlockDispenseArmorEvent {
    tag: 'block-dispense-armor-event',
    val: BlockDispenseArmorEventData,
  }
  export interface EventBlockDispenseLootEvent {
    tag: 'block-dispense-loot-event',
    val: BlockDispenseLootEventData,
  }
  export interface EventBlockDropItemEvent {
    tag: 'block-drop-item-event',
    val: BlockDropItemEventData,
  }
  export interface EventBlockExpEvent {
    tag: 'block-exp-event',
    val: BlockExpEventData,
  }
  export interface EventBlockFertilizeEvent {
    tag: 'block-fertilize-event',
    val: BlockFertilizeEventData,
  }
  export interface EventBlockMultiPlaceEvent {
    tag: 'block-multi-place-event',
    val: BlockMultiPlaceEventData,
  }
  export interface EventBlockReceiveGameEvent {
    tag: 'block-receive-game-event',
    val: BlockReceiveGameEventData,
  }
  export interface EventBlockShearEntityEvent {
    tag: 'block-shear-entity-event',
    val: BlockShearEntityEventData,
  }
  export interface EventBlockSpreadEvent {
    tag: 'block-spread-event',
    val: BlockSpreadEventData,
  }
  export interface EventBrewingStartEvent {
    tag: 'brewing-start-event',
    val: BrewingStartEventData,
  }
  export interface EventCampfireStartEvent {
    tag: 'campfire-start-event',
    val: CampfireStartEventData,
  }
  export interface EventCauldronLevelChangeEvent {
    tag: 'cauldron-level-change-event',
    val: CauldronLevelChangeEventData,
  }
  export interface EventCrafterCraftEvent {
    tag: 'crafter-craft-event',
    val: CrafterCraftEventData,
  }
  export interface EventEntityBlockFormEvent {
    tag: 'entity-block-form-event',
    val: EntityBlockFormEventData,
  }
  export interface EventFluidLevelChangeEvent {
    tag: 'fluid-level-change-event',
    val: FluidLevelChangeEventData,
  }
  export interface EventInventoryBlockStartEvent {
    tag: 'inventory-block-start-event',
    val: InventoryBlockStartEventData,
  }
  export interface EventLeavesDecayEvent {
    tag: 'leaves-decay-event',
    val: LeavesDecayEventData,
  }
  export interface EventMoistureChangeEvent {
    tag: 'moisture-change-event',
    val: MoistureChangeEventData,
  }
  export interface EventSculkBloomEvent {
    tag: 'sculk-bloom-event',
    val: SculkBloomEventData,
  }
  export interface EventVaultDisplayItemEvent {
    tag: 'vault-display-item-event',
    val: VaultDisplayItemEventData,
  }
  export interface EventCreatureSpawnEvent {
    tag: 'creature-spawn-event',
    val: CreatureSpawnEventData,
  }
  export interface EventEnderDragonChangePhaseEvent {
    tag: 'ender-dragon-change-phase-event',
    val: EnderDragonChangePhaseEventData,
  }
  export interface EventEntityBreakDoorEvent {
    tag: 'entity-break-door-event',
    val: EntityBreakDoorEventData,
  }
  export interface EventEntityChangeBlockEvent {
    tag: 'entity-change-block-event',
    val: EntityChangeBlockEventData,
  }
  export interface EventEntityDamageByBlockEvent {
    tag: 'entity-damage-by-block-event',
    val: EntityDamageByBlockEventData,
  }
  export interface EventEntityDamageByEntityEvent {
    tag: 'entity-damage-by-entity-event',
    val: EntityDamageByEntityEventData,
  }
  export interface EventEntityDropItemEvent {
    tag: 'entity-drop-item-event',
    val: EntityDropItemEventData,
  }
  export interface EventEntityEnterBlockEvent {
    tag: 'entity-enter-block-event',
    val: EntityEnterBlockEventData,
  }
  export interface EventEntityExhaustionEvent {
    tag: 'entity-exhaustion-event',
    val: EntityExhaustionEventData,
  }
  export interface EventEntityInteractEvent {
    tag: 'entity-interact-event',
    val: EntityInteractEventData,
  }
  export interface EventEntityKnockbackEvent {
    tag: 'entity-knockback-event',
    val: EntityKnockbackEventData,
  }
  export interface EventEntityPlaceEvent {
    tag: 'entity-place-event',
    val: EntityPlaceEventData,
  }
  export interface EventEntityPoseChangeEvent {
    tag: 'entity-pose-change-event',
    val: EntityPoseChangeEventData,
  }
  export interface EventEntityPotionEffectEvent {
    tag: 'entity-potion-effect-event',
    val: EntityPotionEffectEventData,
  }
  export interface EventEntitySpellCastEvent {
    tag: 'entity-spell-cast-event',
    val: EntitySpellCastEventData,
  }
  export interface EventEntityTargetLivingEntityEvent {
    tag: 'entity-target-living-entity-event',
    val: EntityTargetLivingEntityEventData,
  }
  export interface EventEntityToggleSwimEvent {
    tag: 'entity-toggle-swim-event',
    val: EntityToggleSwimEventData,
  }
  export interface EventExplosionPrimeEvent {
    tag: 'explosion-prime-event',
    val: ExplosionPrimeEventData,
  }
  export interface EventFireworkExplodeEvent {
    tag: 'firework-explode-event',
    val: FireworkExplodeEventData,
  }
  export interface EventFoodLevelChangeEvent {
    tag: 'food-level-change-event',
    val: FoodLevelChangeEventData,
  }
  export interface EventItemDespawnEvent {
    tag: 'item-despawn-event',
    val: ItemDespawnEventData,
  }
  export interface EventItemMergeEvent {
    tag: 'item-merge-event',
    val: ItemMergeEventData,
  }
  export interface EventItemSpawnEvent {
    tag: 'item-spawn-event',
    val: ItemSpawnEventData,
  }
  export interface EventPiglinBarterEvent {
    tag: 'piglin-barter-event',
    val: PiglinBarterEventData,
  }
  export interface EventProjectileHitEvent {
    tag: 'projectile-hit-event',
    val: ProjectileHitEventData,
  }
  export interface EventProjectileLaunchEvent {
    tag: 'projectile-launch-event',
    val: ProjectileLaunchEventData,
  }
  export interface EventSheepDyeWoolEvent {
    tag: 'sheep-dye-wool-event',
    val: SheepDyeWoolEventData,
  }
  export interface EventSheepRegrowWoolEvent {
    tag: 'sheep-regrow-wool-event',
    val: SheepRegrowWoolEventData,
  }
  export interface EventSlimeSplitEvent {
    tag: 'slime-split-event',
    val: SlimeSplitEventData,
  }
  export interface EventStriderTemperatureChangeEvent {
    tag: 'strider-temperature-change-event',
    val: StriderTemperatureChangeEventData,
  }
  export interface EventVillagerAcquireTradeEvent {
    tag: 'villager-acquire-trade-event',
    val: VillagerAcquireTradeEventData,
  }
  export interface EventVillagerCareerChangeEvent {
    tag: 'villager-career-change-event',
    val: VillagerCareerChangeEventData,
  }
  export interface EventVillagerReplenishTradeEvent {
    tag: 'villager-replenish-trade-event',
    val: VillagerReplenishTradeEventData,
  }
  export interface EventWardenAngerChangeEvent {
    tag: 'warden-anger-change-event',
    val: WardenAngerChangeEventData,
  }
  export interface EventAreaEffectCloudApplyEvent {
    tag: 'area-effect-cloud-apply-event',
    val: AreaEffectCloudApplyEventData,
  }
  export interface EventArrowBodyCountChangeEvent {
    tag: 'arrow-body-count-change-event',
    val: ArrowBodyCountChangeEventData,
  }
  export interface EventBatToggleSleepEvent {
    tag: 'bat-toggle-sleep-event',
    val: BatToggleSleepEventData,
  }
  export interface EventCreeperPowerEvent {
    tag: 'creeper-power-event',
    val: CreeperPowerEventData,
  }
  export interface EventEntityCombustByBlockEvent {
    tag: 'entity-combust-by-block-event',
    val: EntityCombustByBlockEventData,
  }
  export interface EventEntityCombustByEntityEvent {
    tag: 'entity-combust-by-entity-event',
    val: EntityCombustByEntityEventData,
  }
  export interface EventEntityKnockbackByEntityEvent {
    tag: 'entity-knockback-by-entity-event',
    val: EntityKnockbackByEntityEventData,
  }
  export interface EventEntityPortalEnterEvent {
    tag: 'entity-portal-enter-event',
    val: EntityPortalEnterEventData,
  }
  export interface EventEntityPortalExitEvent {
    tag: 'entity-portal-exit-event',
    val: EntityPortalExitEventData,
  }
  export interface EventEntityRemoveEvent {
    tag: 'entity-remove-event',
    val: EntityRemoveEventData,
  }
  export interface EventEntityTargetBlockEvent {
    tag: 'entity-target-block-event',
    val: EntityTargetBlockEventData,
  }
  export interface EventEntityUnleashEvent {
    tag: 'entity-unleash-event',
    val: EntityUnleashEventData,
  }
  export interface EventExpBottleEvent {
    tag: 'exp-bottle-event',
    val: ExpBottleEventData,
  }
  export interface EventHorseJumpEvent {
    tag: 'horse-jump-event',
    val: HorseJumpEventData,
  }
  export interface EventLingeringPotionSplashEvent {
    tag: 'lingering-potion-splash-event',
    val: LingeringPotionSplashEventData,
  }
  export interface EventPigZapEvent {
    tag: 'pig-zap-event',
    val: PigZapEventData,
  }
  export interface EventPigZombieAngerEvent {
    tag: 'pig-zombie-anger-event',
    val: PigZombieAngerEventData,
  }
  export interface EventPotionSplashEvent {
    tag: 'potion-splash-event',
    val: PotionSplashEventData,
  }
  export interface EventSpawnerSpawnEvent {
    tag: 'spawner-spawn-event',
    val: SpawnerSpawnEventData,
  }
  export interface EventTrialSpawnerSpawnEvent {
    tag: 'trial-spawner-spawn-event',
    val: TrialSpawnerSpawnEventData,
  }
  export interface EventVillagerReputationChangeEvent {
    tag: 'villager-reputation-change-event',
    val: VillagerReputationChangeEventData,
  }
  export interface EventAsyncPlayerChatEvent {
    tag: 'async-player-chat-event',
    val: AsyncPlayerChatEventData,
  }
  export interface EventAsyncPlayerPreLoginEvent {
    tag: 'async-player-pre-login-event',
    val: AsyncPlayerPreLoginEventData,
  }
  export interface EventPlayerAdvancementDoneEvent {
    tag: 'player-advancement-done-event',
    val: PlayerAdvancementDoneEventData,
  }
  export interface EventPlayerAnimationEvent {
    tag: 'player-animation-event',
    val: PlayerAnimationEventData,
  }
  export interface EventPlayerArmorStandManipulateEvent {
    tag: 'player-armor-stand-manipulate-event',
    val: PlayerArmorStandManipulateEventData,
  }
  export interface EventPlayerBucketEntityEvent {
    tag: 'player-bucket-entity-event',
    val: PlayerBucketEntityEventData,
  }
  export interface EventPlayerChangedWorldEvent {
    tag: 'player-changed-world-event',
    val: PlayerChangedWorldEventData,
  }
  export interface EventPlayerChannelEvent {
    tag: 'player-channel-event',
    val: PlayerChannelEventData,
  }
  export interface EventPlayerCommandPreprocessEvent {
    tag: 'player-command-preprocess-event',
    val: PlayerCommandPreprocessEventData,
  }
  export interface EventPlayerEditBookEvent {
    tag: 'player-edit-book-event',
    val: PlayerEditBookEventData,
  }
  export interface EventPlayerElytraBoostEvent {
    tag: 'player-elytra-boost-event',
    val: PlayerElytraBoostEventData,
  }
  export interface EventPlayerExpCooldownChangeEvent {
    tag: 'player-exp-cooldown-change-event',
    val: PlayerExpCooldownChangeEventData,
  }
  export interface EventPlayerHarvestBlockEvent {
    tag: 'player-harvest-block-event',
    val: PlayerHarvestBlockEventData,
  }
  export interface EventPlayerHideEntityEvent {
    tag: 'player-hide-entity-event',
    val: PlayerHideEntityEventData,
  }
  export interface EventPlayerItemBreakEvent {
    tag: 'player-item-break-event',
    val: PlayerItemBreakEventData,
  }
  export interface EventPlayerItemMendEvent {
    tag: 'player-item-mend-event',
    val: PlayerItemMendEventData,
  }
  export interface EventPlayerKickEvent {
    tag: 'player-kick-event',
    val: PlayerKickEventData,
  }
  export interface EventPlayerLeashEntityEvent {
    tag: 'player-leash-entity-event',
    val: PlayerLeashEntityEventData,
  }
  export interface EventPlayerLevelChangeEvent {
    tag: 'player-level-change-event',
    val: PlayerLevelChangeEventData,
  }
  export interface EventPlayerLocaleChangeEvent {
    tag: 'player-locale-change-event',
    val: PlayerLocaleChangeEventData,
  }
  export interface EventPlayerNameEntityEvent {
    tag: 'player-name-entity-event',
    val: PlayerNameEntityEventData,
  }
  export interface EventPlayerOpenSignEvent {
    tag: 'player-open-sign-event',
    val: PlayerOpenSignEventData,
  }
  export interface EventPlayerPortalEvent {
    tag: 'player-portal-event',
    val: PlayerPortalEventData,
  }
  export interface EventPlayerPreLoginEvent {
    tag: 'player-pre-login-event',
    val: PlayerPreLoginEventData,
  }
  export interface EventPlayerRiptideEvent {
    tag: 'player-riptide-event',
    val: PlayerRiptideEventData,
  }
  export interface EventPlayerShearEntityEvent {
    tag: 'player-shear-entity-event',
    val: PlayerShearEntityEventData,
  }
  export interface EventPlayerShowEntityEvent {
    tag: 'player-show-entity-event',
    val: PlayerShowEntityEventData,
  }
  export interface EventPlayerSpawnChangeEvent {
    tag: 'player-spawn-change-event',
    val: PlayerSpawnChangeEventData,
  }
  export interface EventPlayerStatisticIncrementEvent {
    tag: 'player-statistic-increment-event',
    val: PlayerStatisticIncrementEventData,
  }
  export interface EventPlayerSwapHandsEvent {
    tag: 'player-swap-hands-event',
    val: PlayerSwapHandsEventData,
  }
  export interface EventPlayerTakeLecternBookEvent {
    tag: 'player-take-lectern-book-event',
    val: PlayerTakeLecternBookEventData,
  }
  export interface EventPlayerUnleashEntityEvent {
    tag: 'player-unleash-entity-event',
    val: PlayerUnleashEntityEventData,
  }
  export interface EventPlayerVelocityEvent {
    tag: 'player-velocity-event',
    val: PlayerVelocityEventData,
  }
  export interface EventPlayerInputEvent {
    tag: 'player-input-event',
    val: PlayerInputEventData,
  }
  export interface EventPlayerInteractAtEntityEvent {
    tag: 'player-interact-at-entity-event',
    val: PlayerInteractAtEntityEventData,
  }
  export interface EventPlayerLinksSendEvent {
    tag: 'player-links-send-event',
    val: PlayerLinksSendEventData,
  }
  export interface EventPlayerPickupArrowEvent {
    tag: 'player-pickup-arrow-event',
    val: PlayerPickupArrowEventData,
  }
  export interface EventPlayerRecipeBookClickEvent {
    tag: 'player-recipe-book-click-event',
    val: PlayerRecipeBookClickEventData,
  }
  export interface EventPlayerRecipeBookSettingsChangeEvent {
    tag: 'player-recipe-book-settings-change-event',
    val: PlayerRecipeBookSettingsChangeEventData,
  }
  export interface EventPlayerRecipeDiscoverEvent {
    tag: 'player-recipe-discover-event',
    val: PlayerRecipeDiscoverEventData,
  }
  export interface EventPlayerRegisterChannelEvent {
    tag: 'player-register-channel-event',
    val: PlayerRegisterChannelEventData,
  }
  export interface EventPlayerResourcePackStatusEvent {
    tag: 'player-resource-pack-status-event',
    val: PlayerResourcePackStatusEventData,
  }
  export interface EventPlayerSpawnLocationEvent {
    tag: 'player-spawn-location-event',
    val: PlayerSpawnLocationEventData,
  }
  export interface EventPlayerUnregisterChannelEvent {
    tag: 'player-unregister-channel-event',
    val: PlayerUnregisterChannelEventData,
  }
  export interface EventRaidFinishEvent {
    tag: 'raid-finish-event',
    val: RaidFinishEventData,
  }
  export interface EventRaidSpawnWaveEvent {
    tag: 'raid-spawn-wave-event',
    val: RaidSpawnWaveEventData,
  }
  export interface EventRaidStopEvent {
    tag: 'raid-stop-event',
    val: RaidStopEventData,
  }
  export interface EventRaidTriggerEvent {
    tag: 'raid-trigger-event',
    val: RaidTriggerEventData,
  }
  export interface EventLightningStrikeEvent {
    tag: 'lightning-strike-event',
    val: LightningStrikeEventData,
  }
}
