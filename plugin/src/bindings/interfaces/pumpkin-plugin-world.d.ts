/// <reference path="./pumpkin-plugin-attributes.d.ts" />
/// <reference path="./pumpkin-plugin-biomes.d.ts" />
/// <reference path="./pumpkin-plugin-block-entity.d.ts" />
/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-damage-types.d.ts" />
/// <reference path="./pumpkin-plugin-entity-types.d.ts" />
/// <reference path="./pumpkin-plugin-game-rules.d.ts" />
/// <reference path="./pumpkin-plugin-item-stack.d.ts" />
/// <reference path="./pumpkin-plugin-particles.d.ts" />
/// <reference path="./pumpkin-plugin-scoreboard.d.ts" />
/// <reference path="./pumpkin-plugin-sounds.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
/// <reference path="./pumpkin-plugin-uuid.d.ts" />
declare module 'pumpkin:plugin/world@0.1.0' {
  /**
   * Resolves a block name and optional properties to a block state ID.
   * Returns none if the block name is unknown.
   */
  export function resolveBlockState(name: string, properties: Array<[string, string]>): number | undefined;
  /**
   * Resolves a block state ID back to its block name and properties.
   * Returns none if the state ID is unknown.
   */
  export function blockStateToInfo(stateId: number): BlockStateInfo | undefined;
  /**
   * Gets a block type by its numerical block ID.
   */
  export function getBlockById(id: number): Block | undefined;
  /**
   * Gets a block type by its namespaced name (e.g., "minecraft:stone" or "stone").
   */
  export function getBlockByName(name: string): Block | undefined;
  /**
   * Gets all registered blocks.
   */
  export function getAllBlocks(): Array<Block>;
  /**
   * Gets the names of all registered blocks.
   */
  export function getAllBlockNames(): Array<string>;
  /**
   * Gets the total number of registered block types.
   */
  export function getBlockCount(): number;
  /**
   * Gets the total number of registered block states.
   */
  export function getBlockStateCount(): number;
  /**
   * Gets all valid block states for a block type.
   */
  export function getStatesForBlock(block: Block): Array<BlockState>;
  /**
   * Gets all valid block states for a numerical block ID.
   */
  export function getStatesForBlockId(blockId: number): Array<BlockState>;
  /**
   * Gets all valid state IDs for a numerical block ID.
   */
  export function getStateIdsForBlockId(blockId: number): Uint16Array;
  /**
   * Gets property key-value pairs for a numerical block state ID.
   */
  export function getBlockProperties(stateId: number): Array<[string, string]>;
  /**
   * Gets the block type associated with a block state ID.
   */
  export function getBlockFromStateId(stateId: number): Block | undefined;
  /**
   * Gets the block type associated with a block state.
   */
  export function getBlockFromState(state: BlockState): Block;
  /**
   * Gets the default block state for a block type.
   */
  export function getDefaultStateFromBlock(block: Block): BlockState;
  /**
   * Gets the default block state for a numerical block ID.
   */
  export function getDefaultStateFromBlockId(blockId: number): BlockState | undefined;
  /**
   * Gets the detailed block state for a numerical block state ID.
   */
  export function getBlockStateById(stateId: number): BlockState | undefined;
  export type Position = import('pumpkin:plugin/common@0.1.0').Position;
  export type EntityPose = import('pumpkin:plugin/common@0.1.0').EntityPose;
  export type BlockPos = import('pumpkin:plugin/common@0.1.0').BlockPos;
  export type NbtTree = import('pumpkin:plugin/common@0.1.0').NbtTree;
  export type BlockEntity = import('pumpkin:plugin/block-entity@0.1.0').BlockEntity;
  export type CommandBlockEntity = import('pumpkin:plugin/block-entity@0.1.0').CommandBlockEntity;
  export type BlockEntityType = import('pumpkin:plugin/block-entity@0.1.0').BlockEntityType;
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type Scoreboard = import('pumpkin:plugin/scoreboard@0.1.0').Scoreboard;
  export type Particle = import('pumpkin:plugin/particles@0.1.0').Particle;
  export type Sound = import('pumpkin:plugin/sounds@0.1.0').Sound;
  export type SoundCategory = import('pumpkin:plugin/sounds@0.1.0').SoundCategory;
  export type EntityType = import('pumpkin:plugin/entity-types@0.1.0').EntityType;
  export type Biome = import('pumpkin:plugin/biomes@0.1.0').Biome;
  export type Attribute = import('pumpkin:plugin/attributes@0.1.0').Attribute;
  export type ModifierOperation = import('pumpkin:plugin/attributes@0.1.0').ModifierOperation;
  export type AttributeModifier = import('pumpkin:plugin/attributes@0.1.0').AttributeModifier;
  export type ItemStack = import('pumpkin:plugin/item-stack@0.1.0').ItemStack;
  export type DamageType = import('pumpkin:plugin/damage-types@0.1.0').DamageType;
  export type GameRule = import('pumpkin:plugin/game-rules@0.1.0').GameRule;
  export type GameRuleValue = import('pumpkin:plugin/game-rules@0.1.0').GameRuleValue;
  export type Uuid = import('pumpkin:plugin/uuid@0.1.0').Uuid;
  /**
   * Equipment slots available on living entities (mobs, armor stands, players).
   * # Variants
   * 
   * ## `"main-hand"`
   * 
   * ## `"off-hand"`
   * 
   * ## `"feet"`
   * 
   * ## `"legs"`
   * 
   * ## `"chest"`
   * 
   * ## `"head"`
   * 
   * ## `"body"`
   * 
   * ## `"saddle"`
   */
  export type EquipmentSlot = 'main-hand' | 'off-hand' | 'feet' | 'legs' | 'chest' | 'head' | 'body' | 'saddle';
  /**
   * Defines how a block reacts when pushed by a piston.
   * # Variants
   * 
   * ## `"normal"`
   * 
   * Normal behavior; the block can be pushed and pulled.
   * ## `"destroy"`
   * 
   * The block is destroyed when pushed.
   * ## `"block"`
   * 
   * The block cannot be pushed or pulled.
   * ## `"ignore"`
   * 
   * The block is ignored by pistons.
   * ## `"push-only"`
   * 
   * The block can only be pushed, not pulled.
   */
  export type PistonBehavior = 'normal' | 'destroy' | 'block' | 'ignore' | 'push-only';
  /**
   * Predefined AI goals that can be added to mob entities.
   */
  export type BuiltinAiGoal = BuiltinAiGoalSwim | BuiltinAiGoalWanderAround | BuiltinAiGoalMeleeAttack | BuiltinAiGoalLookAtPlayer | BuiltinAiGoalLookAround | BuiltinAiGoalEscapeDanger | BuiltinAiGoalAvoidEntity | BuiltinAiGoalBlazeAttack | BuiltinAiGoalCreeperIgnite | BuiltinAiGoalEatGrass | BuiltinAiGoalZombieAttack;
  export interface BuiltinAiGoalSwim {
    tag: 'swim',
  }
  export interface BuiltinAiGoalWanderAround {
    tag: 'wander-around',
    val: number,
  }
  export interface BuiltinAiGoalMeleeAttack {
    tag: 'melee-attack',
    val: number,
  }
  export interface BuiltinAiGoalLookAtPlayer {
    tag: 'look-at-player',
    val: number,
  }
  export interface BuiltinAiGoalLookAround {
    tag: 'look-around',
  }
  export interface BuiltinAiGoalEscapeDanger {
    tag: 'escape-danger',
    val: number,
  }
  export interface BuiltinAiGoalAvoidEntity {
    tag: 'avoid-entity',
    val: number,
  }
  export interface BuiltinAiGoalBlazeAttack {
    tag: 'blaze-attack',
  }
  export interface BuiltinAiGoalCreeperIgnite {
    tag: 'creeper-ignite',
  }
  export interface BuiltinAiGoalEatGrass {
    tag: 'eat-grass',
  }
  export interface BuiltinAiGoalZombieAttack {
    tag: 'zombie-attack',
    val: number,
  }
  /**
   * Node and terrain classification types evaluated during mob pathfinding.
   * # Variants
   * 
   * ## `"blocked"`
   * 
   * ## `"open"`
   * 
   * ## `"walkable"`
   * 
   * ## `"walkable-door"`
   * 
   * ## `"trapdoor"`
   * 
   * ## `"powder-snow"`
   * 
   * ## `"danger-powder-snow"`
   * 
   * ## `"fence"`
   * 
   * ## `"lava"`
   * 
   * ## `"water"`
   * 
   * ## `"water-border"`
   * 
   * ## `"rail"`
   * 
   * ## `"unpassable-rail"`
   * 
   * ## `"danger-fire"`
   * 
   * ## `"damage-fire"`
   * 
   * ## `"danger-other"`
   * 
   * ## `"damage-other"`
   * 
   * ## `"door-open"`
   * 
   * ## `"door-wood-closed"`
   * 
   * ## `"door-iron-closed"`
   * 
   * ## `"breach"`
   * 
   * ## `"leaves"`
   * 
   * ## `"sticky-honey"`
   * 
   * ## `"cocoa"`
   * 
   * ## `"damage-cautious"`
   * 
   * ## `"danger-trapdoor"`
   */
  export type PathNodeType = 'blocked' | 'open' | 'walkable' | 'walkable-door' | 'trapdoor' | 'powder-snow' | 'danger-powder-snow' | 'fence' | 'lava' | 'water' | 'water-border' | 'rail' | 'unpassable-rail' | 'danger-fire' | 'damage-fire' | 'danger-other' | 'damage-other' | 'door-open' | 'door-wood-closed' | 'door-iron-closed' | 'breach' | 'leaves' | 'sticky-honey' | 'cocoa' | 'damage-cautious' | 'danger-trapdoor';
  /**
   * Minecraft 16 dye colors.
   * # Variants
   * 
   * ## `"white"`
   * 
   * ## `"orange"`
   * 
   * ## `"magenta"`
   * 
   * ## `"light-blue"`
   * 
   * ## `"yellow"`
   * 
   * ## `"lime"`
   * 
   * ## `"pink"`
   * 
   * ## `"gray"`
   * 
   * ## `"light-gray"`
   * 
   * ## `"cyan"`
   * 
   * ## `"purple"`
   * 
   * ## `"blue"`
   * 
   * ## `"brown"`
   * 
   * ## `"green"`
   * 
   * ## `"red"`
   * 
   * ## `"black"`
   */
  export type DyeColor = 'white' | 'orange' | 'magenta' | 'light-blue' | 'yellow' | 'lime' | 'pink' | 'gray' | 'light-gray' | 'cyan' | 'purple' | 'blue' | 'brown' | 'green' | 'red' | 'black';
  /**
   * Villager profession identifiers.
   * # Variants
   * 
   * ## `"none"`
   * 
   * ## `"armorer"`
   * 
   * ## `"butcher"`
   * 
   * ## `"cartographer"`
   * 
   * ## `"cleric"`
   * 
   * ## `"farmer"`
   * 
   * ## `"fisherman"`
   * 
   * ## `"fletcher"`
   * 
   * ## `"leatherworker"`
   * 
   * ## `"librarian"`
   * 
   * ## `"mason"`
   * 
   * ## `"nitwit"`
   * 
   * ## `"shepherd"`
   * 
   * ## `"toolsmith"`
   * 
   * ## `"weaponsmith"`
   */
  export type VillagerProfession = 'none' | 'armorer' | 'butcher' | 'cartographer' | 'cleric' | 'farmer' | 'fisherman' | 'fletcher' | 'leatherworker' | 'librarian' | 'mason' | 'nitwit' | 'shepherd' | 'toolsmith' | 'weaponsmith';
  /**
   * Specialized data for sheep entities.
   */
  export interface SheepData {
    color: DyeColor,
    isSheared: boolean,
  }
  /**
   * Specialized data for wolf entities.
   */
  export interface WolfData {
    isTamed: boolean,
    owner?: Uuid,
    isSitting: boolean,
    collarColor: DyeColor,
    isAngry: boolean,
    isBegging: boolean,
  }
  /**
   * Specialized data for cat entities.
   */
  export interface CatData {
    isTamed: boolean,
    owner?: Uuid,
    isSitting: boolean,
    collarColor: DyeColor,
  }
  /**
   * Specialized data for villager entities.
   */
  export interface VillagerData {
    profession: VillagerProfession,
    level: number,
    experience: number,
  }
  /**
   * Specialized data for creeper entities.
   */
  export interface CreeperData {
    isPowered: boolean,
    fuse: number,
    isIgnited: boolean,
    explosionRadius: number,
  }
  /**
   * Specialized data for slime and magma cube entities.
   */
  export interface SlimeData {
    size: number,
  }
  /**
   * Specialized data for enderman entities.
   */
  export interface EndermanData {
    carriedBlockState?: number,
    isScreaming: boolean,
    isStaring: boolean,
  }
  /**
   * Specialized data for iron golem entities.
   */
  export interface IronGolemData {
    isPlayerCreated: boolean,
  }
  /**
   * Specialized data for fox entities.
   */
  export interface FoxData {
    isSitting: boolean,
    isSleeping: boolean,
    isCrouching: boolean,
  }
  /**
   * Specialized data for ageable animal mobs.
   */
  export interface AgeableData {
    isBaby: boolean,
    age: number,
    inLoveTicks: number,
  }
  /**
   * Specialized data for zombie entities.
   */
  export interface ZombieData {
    isBaby: boolean,
    canBreakDoors: boolean,
  }
  /**
   * Defines how an explosion interacts with blocks in the world.
   * # Variants
   * 
   * ## `"none"`
   * 
   * No interaction with blocks.
   * ## `"block"`
   * 
   * Blocks are destroyed and may drop loot.
   * ## `"mob"`
   * 
   * Interaction typical for mob-caused explosions.
   * ## `"tnt"`
   * 
   * Interaction typical for TNT explosions.
   * ## `"trigger"`
   * 
   * Triggers specific block behaviors.
   */
  export type ExplosionInteraction = 'none' | 'block' | 'mob' | 'tnt' | 'trigger';
  /**
   * Flags used to control block updates and notifications.
   */
  export interface BlockFlags {
    /**
     * Notifies neighbor blocks of the change.
     */
    notifyNeighbors?: boolean,
    /**
     * Notifies client listeners of the change.
     */
    notifyListeners?: boolean,
    /**
     * Forces the block state even if it's the same.
     */
    forceState?: boolean,
    /**
     * Skips dropping items when the block is removed.
     */
    skipDrops?: boolean,
    /**
     * Indicates the block was moved (e.g., by a piston).
     */
    moved?: boolean,
    /**
     * Skips state replacement for redstone wires.
     */
    skipRedstoneWireStateReplacement?: boolean,
    /**
     * Skips the callback when a block entity is replaced.
     */
    skipBlockEntityReplacedCallback?: boolean,
    /**
     * Skips the callback when a block is added.
     */
    skipBlockAddedCallback?: boolean,
  }
  /**
   * Flammability properties of a block.
   */
  export interface Flammable {
    spreadChance: number,
    burnChance: number,
  }
  /**
   * Musical instruments used by note blocks.
   * # Variants
   * 
   * ## `"harp"`
   * 
   * ## `"basedrum"`
   * 
   * ## `"snare"`
   * 
   * ## `"hat"`
   * 
   * ## `"bass"`
   * 
   * ## `"flute"`
   * 
   * ## `"bell"`
   * 
   * ## `"guitar"`
   * 
   * ## `"chime"`
   * 
   * ## `"xylophone"`
   * 
   * ## `"iron-xylophone"`
   * 
   * ## `"cow-bell"`
   * 
   * ## `"didgeridoo"`
   * 
   * ## `"bit"`
   * 
   * ## `"banjo"`
   * 
   * ## `"pling"`
   * 
   * ## `"trumpet"`
   * 
   * ## `"trumpet-exposed"`
   * 
   * ## `"trumpet-oxidized"`
   * 
   * ## `"trumpet-weathered"`
   * 
   * ## `"zombie"`
   * 
   * ## `"skeleton"`
   * 
   * ## `"creeper"`
   * 
   * ## `"dragon"`
   * 
   * ## `"wither-skeleton"`
   * 
   * ## `"piglin"`
   * 
   * ## `"custom-head"`
   */
  export type NoteblockInstrument = 'harp' | 'basedrum' | 'snare' | 'hat' | 'bass' | 'flute' | 'bell' | 'guitar' | 'chime' | 'xylophone' | 'iron-xylophone' | 'cow-bell' | 'didgeridoo' | 'bit' | 'banjo' | 'pling' | 'trumpet' | 'trumpet-exposed' | 'trumpet-oxidized' | 'trumpet-weathered' | 'zombie' | 'skeleton' | 'creeper' | 'dragon' | 'wither-skeleton' | 'piglin' | 'custom-head';
  /**
   * Static definition of a Minecraft block type.
   */
  export interface Block {
    /**
     * The internal numerical ID of the block type.
     */
    id: number,
    /**
     * The unique namespaced ID (e.g., "minecraft:stone").
     */
    name: string,
    /**
     * How hard the block is to break (-1.0 for unbreakable blocks).
     */
    hardness: number,
    /**
     * Resistance to explosions.
     */
    blastResistance: number,
    /**
     * The color of this block when displayed on a map.
     */
    mapColor: number,
    /**
     * The friction coefficient (0.6 default, 0.98 for ice).
     */
    slipperiness: number,
    /**
     * How much this block affects entity walk speed.
     */
    velocityMultiplier: number,
    /**
     * How much this block affects entity jump height.
     */
    jumpVelocityMultiplier: number,
    /**
     * The item ID associated with this block in inventory/drops.
     */
    itemId: number,
    /**
     * The default block state ID when placed without extra properties.
     */
    defaultStateId: number,
    /**
     * All valid state IDs belonging to this block type.
     */
    stateIds: Uint16Array,
    /**
     * Whether this block is solid by default.
     */
    isSolid: boolean,
    /**
     * Whether this block is considered air.
     */
    isAir: boolean,
    /**
     * Whether this block is flammable.
     */
    isFlammable: boolean,
    /**
     * Flammability details if flammable.
     */
    flammable?: Flammable,
  }
  /**
   * A simple wrapper for a block state ID.
   */
  export interface BlockStateId {
    id: number,
  }
  /**
   * Result of an entity ray-trace operation.
   */
  export interface RayTraceEntityResult {
    /**
     * The entity that was hit.
     */
    entity: Entity,
    /**
     * The exact hit coordinates in world space.
     */
    hitPos: Position,
    /**
     * The distance from the ray start to the hit position.
     */
    distance: number,
  }
  /**
   * Represents an axis-aligned bounding box.
   */
  export interface BoundingBox {
    min: Position,
    max: Position,
  }
  /**
   * Detailed information about a block's state.
   */
  export interface BlockState {
    /**
     * The internal numerical ID of the block state.
     */
    id: number,
    /**
     * The numerical ID of the parent block type.
     */
    blockId: number,
    /**
     * The namespaced identifier of the parent block type.
     */
    blockName: string,
    /**
     * The light level emitted by this block (0-15).
     */
    luminance: number,
    /**
     * How much light this block blocks.
     */
    opacity: number,
    /**
     * The hardness of the block, determining mining speed.
     */
    hardness: number,
    /**
     * Whether this block is considered air.
     */
    isAir: boolean,
    /**
     * Whether this block is a liquid.
     */
    isLiquid: boolean,
    /**
     * Whether this block is a solid.
     */
    isSolid: boolean,
    /**
     * Whether this block occupies a full cube.
     */
    isFullCube: boolean,
    /**
     * How this block behaves when pushed by a piston.
     */
    pistonBehavior: PistonBehavior,
    /**
     * Whether this block receives random ticks.
     */
    hasRandomTicks: boolean,
    /**
     * Whether this block can catch fire.
     */
    burnable: boolean,
    /**
     * Whether a specific tool is required to mine this block and get drops.
     */
    toolRequired: boolean,
    /**
     * Whether this block has transparency on its sides.
     */
    sidedTransparency: boolean,
    /**
     * Whether this block can be replaced by another block (e.g., grass).
     */
    replaceable: boolean,
    /**
     * Whether this block is considered a solid block for redstone purposes.
     */
    isSolidBlock: boolean,
    /**
     * The numerical ID of the block entity type, if any.
     */
    blockEntityType: number,
    /**
     * The instrument used for note blocks when placed on top of this block.
     */
    instrument: NoteblockInstrument,
    /**
     * The collision shapes of this block.
     */
    collisionShapes: Array<BoundingBox>,
    /**
     * The outline shapes of this block.
     */
    outlineShapes: Array<BoundingBox>,
    /**
     * Whether the bottom side of the block is solid.
     */
    downSideSolid: boolean,
    /**
     * Whether the top side of the block is solid.
     */
    upSideSolid: boolean,
    /**
     * Whether the north side of the block is solid.
     */
    northSideSolid: boolean,
    /**
     * Whether the south side of the block is solid.
     */
    southSideSolid: boolean,
    /**
     * Whether the west side of the block is solid.
     */
    westSideSolid: boolean,
    /**
     * Whether the east side of the block is solid.
     */
    eastSideSolid: boolean,
    /**
     * Whether the center of the bottom side is solid.
     */
    downCenterSolid: boolean,
    /**
     * Whether the center of the top side is solid.
     */
    upCenterSolid: boolean,
    /**
     * The color of this block when displayed on a map.
     */
    mapColor: number,
    /**
     * The block state's property key-value pairs (e.g. facing=north).
     */
    properties: Array<[string, string]>,
  }
  /**
   * Represents the configured shared spawn location for a world.
   */
  export interface WorldSpawnLocation {
    /**
     * The block position of the shared world spawn.
     */
    pos: BlockPos,
    /**
     * The yaw players should face when spawning here.
     */
    yaw: number,
    /**
     * The pitch players should use when spawning here.
     */
    pitch: number,
  }
  /**
   * Represents a cardinal direction or block face.
   * # Variants
   * 
   * ## `"down"`
   * 
   * ## `"up"`
   * 
   * ## `"north"`
   * 
   * ## `"south"`
   * 
   * ## `"west"`
   * 
   * ## `"east"`
   */
  export type BlockDirection = 'down' | 'up' | 'north' | 'south' | 'west' | 'east';
  /**
   * Specialized data for shulker entities.
   */
  export interface ShulkerData {
    attachedFace: BlockDirection,
    peekAmount: number,
    color?: DyeColor,
  }
  /**
   * Tagged variant holding specialized data for specific mob types.
   */
  export type MobData = MobDataSheep | MobDataWolf | MobDataCat | MobDataVillager | MobDataCreeper | MobDataSlime | MobDataEnderman | MobDataIronGolem | MobDataFox | MobDataAgeable | MobDataZombie | MobDataShulker | MobDataGeneric;
  export interface MobDataSheep {
    tag: 'sheep',
    val: SheepData,
  }
  export interface MobDataWolf {
    tag: 'wolf',
    val: WolfData,
  }
  export interface MobDataCat {
    tag: 'cat',
    val: CatData,
  }
  export interface MobDataVillager {
    tag: 'villager',
    val: VillagerData,
  }
  export interface MobDataCreeper {
    tag: 'creeper',
    val: CreeperData,
  }
  export interface MobDataSlime {
    tag: 'slime',
    val: SlimeData,
  }
  export interface MobDataEnderman {
    tag: 'enderman',
    val: EndermanData,
  }
  export interface MobDataIronGolem {
    tag: 'iron-golem',
    val: IronGolemData,
  }
  export interface MobDataFox {
    tag: 'fox',
    val: FoxData,
  }
  export interface MobDataAgeable {
    tag: 'ageable',
    val: AgeableData,
  }
  export interface MobDataZombie {
    tag: 'zombie',
    val: ZombieData,
  }
  export interface MobDataShulker {
    tag: 'shulker',
    val: ShulkerData,
  }
  export interface MobDataGeneric {
    tag: 'generic',
  }
  /**
   * Result of a raycast operation.
   */
  export interface RaycastResult {
    /**
     * The block position that was hit.
     */
    pos: BlockPos,
    /**
     * The face of the block that was hit.
     */
    face: BlockDirection,
  }
  /**
   * Detailed result of a block ray-trace operation.
   */
  export interface RayTraceBlockResult {
    /**
     * The block position that was hit.
     */
    pos: BlockPos,
    /**
     * The face of the block that was hit.
     */
    face: BlockDirection,
    /**
     * The exact hit coordinates in world space.
     */
    hitPos: Position,
  }
  /**
   * Generation phase for custom chunk generation.
   * # Variants
   * 
   * ## `"biomes"`
   * 
   * ## `"noise"`
   * 
   * ## `"surface"`
   * 
   * ## `"features"`
   */
  export type GenerationPhase = 'biomes' | 'noise' | 'surface' | 'features';
  /**
   * A block's registry name and its property key-value pairs for a state ID.
   */
  export interface BlockStateInfo {
    name: string,
    properties: Array<[string, string]>,
  }
  
  export class Chunk implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Gets the chunk's X coordinate.
    */
    getX(): number;
    /**
    * Gets the chunk's Z coordinate.
    */
    getZ(): number;
    /**
    * Gets the block state ID at the specified position relative to the chunk.
    * X and Z must be in the range [0, 15].
    */
    getBlockStateId(pos: BlockPos): number;
    /**
    * Gets detailed block state information at the specified position relative to the chunk.
    * X and Z must be in the range [0, 15].
    */
    getBlockState(pos: BlockPos): BlockState;
    /**
    * Sets the block state at the specified position relative to the chunk.
    * X and Z must be in the range [0, 15].
    */
    setBlockState(pos: BlockPos, state: number): void;
    /**
    * Gets the block at the specified position relative to the chunk.
    * X and Z must be in the range [0, 15].
    */
    getBlock(pos: BlockPos): Block;
    /**
    * Sets the block at the specified position relative to the chunk using its default state.
    * X and Z must be in the range [0, 15].
    */
    setBlock(pos: BlockPos, block: Block): void;
    /**
    * Sets the block by block ID at the specified position relative to the chunk using its default state.
    * X and Z must be in the range [0, 15].
    */
    setBlockById(pos: BlockPos, blockId: number): void;
    /**
    * Gets the biome at the specified position relative to the chunk.
    * X and Z must be in the range [0, 15].
    */
    getBiome(pos: BlockPos): Biome;
    /**
    * Gets the block entity at the specified position relative to the chunk, if any.
    * X and Z must be in the range [0, 15].
    */
    getBlockEntity(pos: BlockPos): BlockEntityType | undefined;
    /**
    * Gets the highest non-air block Y coordinate at the specified X and Z relative to the chunk.
    * X and Z must be in the range [0, 15].
    */
    getTopBlockY(x: number, z: number): number;
    /**
    * Gets the sky light level at the specified position relative to the chunk.
    * X and Z must be in the range [0, 15].
    */
    getSkyLight(pos: BlockPos): number;
    /**
    * Gets the block light level at the specified position relative to the chunk.
    * X and Z must be in the range [0, 15].
    */
    getBlockLight(pos: BlockPos): number;
    /**
    * Sets a namespaced custom data value on this chunk.
    */
    setCustomData(namespace: string, key: string, value: NbtTree): void;
    /**
    * Returns a namespaced custom data value from this chunk, if set.
    */
    getCustomData(namespace: string, key: string): NbtTree | undefined;
    /**
    * Removes a namespaced custom data value from this chunk.
    */
    removeCustomData(namespace: string, key: string): void;
    /**
    * Returns whether this chunk has a namespaced custom data value.
    */
    hasCustomData(namespace: string, key: string): boolean;
    [Symbol.dispose](): void;
  }
  
  export class ChunkBuffer implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Returns the chunk X coordinate.
    */
    getX(): number;
    /**
    * Returns the chunk Z coordinate.
    */
    getZ(): number;
    /**
    * Returns the minimum Y coordinate for this world.
    */
    getMinY(): number;
    /**
    * Returns the height of the chunk in blocks.
    */
    getHeight(): number;
    /**
    * Sets the block state ID at local coordinates (0..16, y, 0..16).
    */
    setBlockStateId(x: number, y: number, z: number, stateId: number): void;
    /**
    * Gets the block state ID at local coordinates (0..16, y, 0..16).
    */
    getBlockStateId(x: number, y: number, z: number): number;
    /**
    * Fills an entire horizontal 16x16 layer at the given Y level with a block state ID.
    */
    fillLayer(y: number, stateId: number): void;
    /**
    * Fills a vertical column from min-y to max-y at local (x, z) with a block state ID.
    */
    fillRange(x: number, minY: number, maxY: number, z: number, stateId: number): void;
    /**
    * Fills a 3D cuboid with a block state ID.
    */
    fillCuboid(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, stateId: number): void;
    /**
    * Sets the biome at local coordinates (0..16, y, 0..16).
    */
    setBiome(x: number, y: number, z: number, biome: Biome): void;
    /**
    * Fills the entire chunk with the given biome.
    */
    fillBiome(biome: Biome): void;
    [Symbol.dispose](): void;
  }
  
  export class Entity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getId(): number;
    getUuid(): Uuid;
    getType(): EntityType;
    getPosition(): Position;
    getWorld(): World;
    getYaw(): number;
    getPitch(): number;
    getHeadYaw(): number;
    teleport(pos: Position, worldRef: World): void;
    setVelocity(velocity: Position): void;
    getVelocity(): Position;
    getPose(): EntityPose;
    getName(): TextComponent;
    setCustomName(name: TextComponent): void;
    getCustomName(): TextComponent | undefined;
    setCustomNameVisible(visible: boolean): void;
    isCustomNameVisible(): boolean;
    isInvulnerable(): boolean;
    setInvulnerable(invulnerable: boolean): void;
    getFireTicks(): number;
    setFireTicks(ticks: number): void;
    getFallDistance(): number;
    setFallDistance(distance: number): void;
    getTicksLived(): number;
    setTicksLived(ticks: number): void;
    isSneaking(): boolean;
    setSneaking(sneaking: boolean): void;
    isSprinting(): boolean;
    setSprinting(sprinting: boolean): void;
    isSwimming(): boolean;
    setSwimming(swimming: boolean): void;
    isInvisible(): boolean;
    setInvisible(invisible: boolean): void;
    isGlowing(): boolean;
    setGlowing(glowing: boolean): void;
    isFallFlying(): boolean;
    setFallFlying(fallFlying: boolean): void;
    isSilent(): boolean;
    setSilent(silent: boolean): void;
    hasGravity(): boolean;
    setHasGravity(gravity: boolean): void;
    getWidth(): number;
    getHeight(): number;
    setRotation(yaw: number, pitch: number): void;
    isOnGround(): boolean;
    isOnFire(): boolean;
    setOnFire(onFire: boolean): void;
    hasVisualFire(): boolean;
    setVisualFire(visualFire: boolean): void;
    getPortalCooldown(): number;
    setPortalCooldown(cooldown: number): void;
    getRemainingAir(): number;
    setRemainingAir(air: number): void;
    getMaxAir(): number;
    getEyeHeight(): number;
    getEyePosition(): Position;
    getNearbyEntities(x: number, y: number, z: number): Array<Entity>;
    getVehicle(): Entity | undefined;
    setVehicle(vehicle: Entity | undefined): void;
    getPassengers(): Array<Entity>;
    addPassenger(passenger: Entity): void;
    removePassenger(passenger: Entity): void;
    ejectPassengers(): void;
    getBoundingBox(): BoundingBox;
    isInWater(): boolean;
    isInLava(): boolean;
    remove(): void;
    /**
    * Performs a raycast from the entity's eye position in its looking direction.
    */
    raycast(maxDistance: number, fluidHandling: boolean): RaycastResult | undefined;
    /**
    * Performs a ray-trace from the entity's eye position in its looking direction to find the targeted block.
    */
    rayTraceBlock(maxDistance: number, includeFluids: boolean): RayTraceBlockResult | undefined;
    /**
    * Performs a ray-trace from the entity's eye position in its looking direction to find the targeted entity.
    */
    rayTraceEntity(maxDistance: number): RayTraceEntityResult | undefined;
    /**
    * Returns the entity currently targeted in the looking direction within the specified distance.
    */
    getTargetEntity(maxDistance: number): Entity | undefined;
    /**
    * Sets a namespaced custom data value on this entity.
    */
    setCustomData(namespace: string, key: string, value: NbtTree): void;
    /**
    * Returns a namespaced custom data value from this entity, if set.
    */
    getCustomData(namespace: string, key: string): NbtTree | undefined;
    /**
    * Removes a namespaced custom data value from this entity.
    */
    removeCustomData(namespace: string, key: string): void;
    /**
    * Returns whether this entity has a namespaced custom data value.
    */
    hasCustomData(namespace: string, key: string): boolean;
    /**
    * Returns this entity as a living-entity if it has health and attributes, or none otherwise.
    */
    asLiving(): LivingEntity | undefined;
    /**
    * Returns this entity as a mob if it is an AI-driven mob entity, or none otherwise.
    */
    asMob(): Mob | undefined;
    /**
    * Returns whether this entity is a living entity.
    */
    isLiving(): boolean;
    /**
    * Returns whether this entity is an AI-driven mob.
    */
    isMob(): boolean;
    [Symbol.dispose](): void;
  }
  
  export class LivingEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Converts back to the base entity handle.
    */
    asEntity(): Entity;
    /**
    * Returns this living entity as a mob if it has AI/navigation, or none otherwise.
    */
    asMob(): Mob | undefined;
    /**
    * Returns whether this living entity is an AI-driven mob.
    */
    isMob(): boolean;
    /**
    * Health & Combat
    */
    getHealth(): number;
    setHealth(health: number): void;
    getMaxHealth(): number;
    setMaxHealth(maxHealth: number): void;
    damage(amount: number, damageType: DamageType): void;
    isDead(): boolean;
    getAbsorption(): number;
    setAbsorption(amount: number): void;
    /**
    * Attributes
    */
    getAttributeValue(attr: Attribute): number;
    getAttributeBase(attr: Attribute): number;
    setAttributeBase(attr: Attribute, value: number): void;
    addAttributeModifier(attr: Attribute, modifier: AttributeModifier): void;
    removeAttributeModifier(attr: Attribute, id: string): void;
    getAttributeModifiers(attr: Attribute): Array<AttributeModifier>;
    resetAttribute(attr: Attribute): void;
    resetAllAttributes(): void;
    /**
    * Equipment
    */
    getEquipment(slot: EquipmentSlot): ItemStack | undefined;
    setEquipment(slot: EquipmentSlot, stack: ItemStack | undefined): void;
    clearEquipment(): void;
    getAge(): number;
    setAge(age: number): void;
    sendSystemMessage(message: TextComponent): void;
    [Symbol.dispose](): void;
  }
  
  export class Mob implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Converts back to the base entity handle.
    */
    asEntity(): Entity;
    /**
    * Converts to the living-entity handle.
    */
    asLiving(): LivingEntity;
    /**
    * Goals & Targeting
    */
    addAiGoal(priority: number, goal: BuiltinAiGoal): void;
    addCustomAiGoal(priority: number, goalId: number): void;
    clearAiGoals(): void;
    setAiDisabled(disabled: boolean): void;
    isAiDisabled(): boolean;
    setTarget(target: Entity | undefined): void;
    getTarget(): Entity | undefined;
    /**
    * Pathfinding & Navigation
    */
    navigateToPos(pos: Position, speed: number): boolean;
    navigateToEntity(target: Entity, speed: number): boolean;
    stopNavigation(): void;
    isNavigating(): boolean;
    hasReachedDestination(): boolean;
    setNavigationSpeed(speed: number): void;
    canReach(pos: Position, maxDistance: number): boolean;
    setPathfindingMalus(nodeType: PathNodeType, malus: number): void;
    getPathfindingMalus(nodeType: PathNodeType): number;
    lookAt(pos: Position): void;
    lookAtEntity(target: Entity): void;
    /**
    * Returns the specialized mob-specific data for this mob.
    */
    getMobData(): MobData;
    /**
    * Sets the specialized mob-specific data for this mob.
    * Returns false if the provided data variant is incompatible with this mob.
    */
    setMobData(data: MobData): boolean;
    /**
    * Sets the number of freeze ticks on this entity (0 to 140).
    */
    setFreezeTicks(ticks: number): void;
    /**
    * Returns the number of freeze ticks currently on this entity.
    */
    getFreezeTicks(): number;
    [Symbol.dispose](): void;
  }
  
  export class World implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Returns the unique identifier of this world.
    */
    getId(): string;
    /**
    * Gets the world border associated with this world (alias for get-world-border).
    */
    getBorder(): WorldBorder;
    /**
    * Gets the world border associated with this world.
    */
    getWorldBorder(): WorldBorder;
    /**
    * Gets the chunk at the specified chunk coordinates.
    */
    getChunk(x: number, z: number): Chunk | undefined;
    /**
    * Gets the block state ID at the specified position.
    */
    getBlockStateId(pos: BlockPos): number;
    /**
    * Gets detailed block state information at the specified position.
    */
    getBlockState(pos: BlockPos): BlockState;
    /**
    * Sets the block state at the specified position.
    */
    setBlockState(pos: BlockPos, state: number, updateFlags: BlockFlags): void;
    /**
    * Gets the block type at the specified position.
    */
    getBlock(pos: BlockPos): Block;
    /**
    * Gets the numerical block ID at the specified position.
    */
    getBlockId(pos: BlockPos): number;
    /**
    * Sets the block at the specified position using its default state.
    */
    setBlock(pos: BlockPos, block: Block, updateFlags: BlockFlags): void;
    /**
    * Sets the block at the specified position by numerical block ID using its default state.
    */
    setBlockById(pos: BlockPos, blockId: number, updateFlags: BlockFlags): void;
    /**
    * Sets the block at the specified position by namespaced name using its default state.
    * Returns true if the block was recognized and set.
    */
    setBlockByName(pos: BlockPos, name: string, updateFlags: BlockFlags): boolean;
    /**
    * Returns the current time of day in ticks.
    */
    getTimeOfDay(): bigint;
    /**
    * Sets the current time of day in ticks.
    */
    setTimeOfDay(time: bigint): void;
    /**
    * Returns the total age of the world in ticks.
    */
    getWorldAge(): bigint;
    /**
    * Returns the dimension type (e.g., \"minecraft:overworld\").
    */
    getDimension(): string;
    /**
    * Returns the configured shared spawn location for this world.
    */
    getSpawnLocation(): WorldSpawnLocation;
    /**
    * Gets the highest non-air block Y coordinate at the specified X and Z.
    */
    getTopBlockY(x: number, z: number): number;
    /**
    * Gets the highest motion-blocking block Y coordinate.
    */
    getMotionBlockingHeight(x: number, z: number): number;
    /**
    * Returns whether it is currently raining or snowing.
    */
    isRaining(): boolean;
    /**
    * Sets whether it should be raining or snowing.
    */
    setRaining(raining: boolean): void;
    /**
    * Returns whether there is currently a thunderstorm.
    */
    isThundering(): boolean;
    /**
    * Sets whether there should be a thunderstorm.
    */
    setThundering(thundering: boolean): void;
    /**
    * Broadcasts a system message to all players in this world.
    */
    broadcastSystemMessage(message: TextComponent, overlay: boolean): void;
    /**
    * Returns the scoreboard associated with this world.
    */
    getScoreboard(): Scoreboard;
    /**
    * Plays a sound at the specified position for all players in the world.
    */
    playSound(sound: Sound, category: SoundCategory, pos: Position, volume: number, pitch: number): void;
    /**
    * Plays a custom resource pack sound identifier at the specified position for all players in the world.
    */
    playCustomSound(soundName: string, category: SoundCategory, pos: Position, volume: number, pitch: number): void;
    /**
    * Spawns particles at the specified position.
    */
    spawnParticle(particle: Particle, pos: Position, offset: Position, maxSpeed: number, count: number): void;
    /**
    * Creates an explosion at the specified position.
    */
    createExplosion(pos: Position, power: number, createFire: boolean, interaction: ExplosionInteraction): void;
    /**
    * Creates a TNT-like explosion (vanilla rays, block resistance, damage, knockback) that only
    * destroys the listed blocks. `entity-damage` replaces the distance-based damage and
    * `exempt-entities` take no damage. Returns the listed blocks that were destroyed.
    */
    explodeFiltered(pos: Position, power: number, breakable: Array<BlockPos>, entityDamage: number | undefined, exemptEntities: Int32Array): Array<BlockPos>;
    /**
    * Returns the sea level of this world.
    */
    getSeaLevel(): number;
    /**
    * Returns the minimum Y coordinate (bottom of the world).
    */
    getMinY(): number;
    /**
    * Returns the sky light level at the specified position.
    */
    getSkyLight(pos: BlockPos): number;
    /**
    * Sets the sky light level at the specified position.
    */
    setSkyLight(pos: BlockPos, level: number): void;
    /**
    * Returns the block light level at the specified position.
    */
    getBlockLight(pos: BlockPos): number;
    /**
    * Sets the block light level at the specified position.
    */
    setBlockLight(pos: BlockPos, level: number): void;
    /**
    * Returns the biome at the specified position.
    */
    getBiome(pos: BlockPos): Biome;
    /**
    * Spawns an entity of the specified type at the given position.
    */
    spawnEntity(entityType: EntityType, pos: Position): Entity;
    /**
    * Drops an item stack as an item entity. Without `velocity` it gets the small random
    * spread of a block drop; `pickup-delay` is in ticks (vanilla block drops use 10).
    * With `can-merge` false the entity never merges with other item entities.
    */
    dropItem(pos: Position, item: ItemStack, velocity: Position | undefined, pickupDelay: number, canMerge: boolean): Entity;
    /**
    * Returns the entity with this network id in this world, players included.
    */
    getEntityById(id: number): Entity | undefined;
    /**
    * Keeps the chunks covering the block columns between the two corners loaded (like `/forceload`),
    * or releases them. Block reads in unloaded chunks return air and writes are lost, so a
    * plugin that edits an area without players nearby forces it first. Loading is asynchronous.
    */
    setChunksForced(cornerA: BlockPos, cornerB: BlockPos, forced: boolean): void;
    /**
    * Whether the chunk at these chunk coordinates is loaded.
    */
    isChunkLoaded(chunkX: number, chunkZ: number): boolean;
    /**
    * Returns a list of all entities in this world.
    */
    getEntities(): Array<Entity>;
    /**
    * Spawns a lightning bolt at the specified position.
    */
    strikeLightning(pos: Position, effectOnly: boolean): void;
    /**
    * Performs a raycast from start position to end position to hit blocks.
    */
    rayTraceBlocks(start: Position, end: Position): Position | undefined;
    /**
    * Performs a raycast from start position to end position to hit blocks, with optional fluid handling.
    */
    rayTraceBlock(start: Position, end: Position, includeFluids: boolean): RayTraceBlockResult | undefined;
    /**
    * Performs a raycast from start position to end position to find the closest entity hit.
    */
    rayTraceEntity(start: Position, end: Position): RayTraceEntityResult | undefined;
    /**
    * Performs a raycast from start position to end position to find all entities hit along the ray.
    */
    rayTraceEntities(start: Position, end: Position): Array<RayTraceEntityResult>;
    /**
    * Returns the block entity at the specified position, if any.
    */
    getBlockEntity(pos: BlockPos): BlockEntityType | undefined;
    /**
    * Returns the raw NBT bytes of the block entity at the given position, if any.
    */
    getBlockEntityNbt(pos: BlockPos): Uint8Array | undefined;
    /**
    * Restores a block entity from raw NBT bytes at the given position.
    * The NBT must contain a valid "id" field (e.g. "minecraft:chest").
    */
    setBlockEntityNbt(pos: BlockPos, nbtData: Uint8Array): void;
    /**
    * Returns the name of this world (e.g. "world", "world_nether", "arena_1").
    */
    getName(): string;
    /**
    * Saves all chunk data, block entities, and entities for this world to disk.
    */
    save(): void;
    /**
    * Sets a custom chunk generator for this world using a registered generator ID.
    */
    setChunkGenerator(generatorId: number): void;
    /**
    * Sets a namespaced custom data value on this world.
    */
    setCustomData(namespace: string, key: string, value: NbtTree): void;
    /**
    * Returns a namespaced custom data value from this world, if set.
    */
    getCustomData(namespace: string, key: string): NbtTree | undefined;
    /**
    * Removes a namespaced custom data value from this world.
    */
    removeCustomData(namespace: string, key: string): void;
    /**
    * Returns whether this world has a namespaced custom data value.
    */
    hasCustomData(namespace: string, key: string): boolean;
    /**
    * Gets the value of a game rule in this world.
    */
    getGameRule(rule: GameRule): GameRuleValue;
    /**
    * Sets the value of a game rule in this world.
    */
    setGameRule(rule: GameRule, value: GameRuleValue): void;
    [Symbol.dispose](): void;
  }
  
  export class WorldBorder implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Gets the center X coordinate of the border.
    */
    getCenterX(): number;
    /**
    * Gets the center Z coordinate of the border.
    */
    getCenterZ(): number;
    /**
    * Gets the center position of the border.
    */
    getCenter(): Position;
    /**
    * Sets the center coordinates of the border.
    */
    setCenter(x: number, z: number): void;
    /**
    * Gets the current diameter of the border.
    */
    getDiameter(): number;
    /**
    * Gets the current diameter of the border (alias for get-diameter).
    */
    getSize(): number;
    /**
    * Sets the diameter of the border, optionally with a speed (in ticks) for lerping.
    */
    setDiameter(diameter: number, speed: bigint | undefined): void;
    /**
    * Sets the size of the border instantly.
    */
    setSize(size: number): void;
    /**
    * Sets the size of the border with a transition duration in seconds.
    */
    setSizeTransition(newSize: number, timeSeconds: bigint): void;
    /**
    * Gets the target diameter when lerping/transitioning.
    */
    getTargetDiameter(): number;
    /**
    * Gets the target transition duration/speed in ticks.
    */
    getTargetSpeed(): bigint;
    /**
    * Gets the distance from the border where warning effects start (in blocks).
    */
    getWarningDistance(): number;
    /**
    * Sets the warning distance (in blocks).
    */
    setWarningDistance(distance: number): void;
    /**
    * Gets the time before a player hitting the border is warned (in seconds).
    */
    getWarningDelay(): number;
    /**
    * Sets the warning delay (in seconds).
    */
    setWarningDelay(delay: number): void;
    /**
    * Gets the warning time (alias for get-warning-delay).
    */
    getWarningTime(): number;
    /**
    * Sets the warning time (alias for set-warning-delay).
    */
    setWarningTime(time: number): void;
    /**
    * Gets the safe damage buffer distance outside the border (in blocks).
    */
    getDamageBuffer(): number;
    /**
    * Sets the safe damage buffer distance outside the border (in blocks).
    */
    setDamageBuffer(buffer: number): void;
    /**
    * Gets the damage amount inflicted per block per second when outside the buffer.
    */
    getDamageAmount(): number;
    /**
    * Sets the damage amount inflicted per block per second when outside the buffer.
    */
    setDamageAmount(damage: number): void;
    /**
    * Returns whether the specified coordinates are within the border.
    */
    contains(x: number, z: number): boolean;
    /**
    * Returns whether the specified position is within the border.
    */
    containsPos(pos: Position): boolean;
    /**
    * Resets the world border to vanilla default settings.
    */
    reset(): void;
    [Symbol.dispose](): void;
  }
}
