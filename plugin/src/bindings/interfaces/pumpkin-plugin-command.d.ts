/// <reference path="./pumpkin-plugin-block-entity.d.ts" />
/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-item-stack.d.ts" />
/// <reference path="./pumpkin-plugin-player.d.ts" />
/// <reference path="./pumpkin-plugin-server.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
/// <reference path="./pumpkin-plugin-world.d.ts" />
declare module 'pumpkin:plugin/command@0.1.0' {
  export type World = import('pumpkin:plugin/world@0.1.0').World;
  export type Entity = import('pumpkin:plugin/world@0.1.0').Entity;
  export type Player = import('pumpkin:plugin/player@0.1.0').Player;
  export type CommandBlockEntity = import('pumpkin:plugin/block-entity@0.1.0').CommandBlockEntity;
  export type Position = import('pumpkin:plugin/common@0.1.0').Position;
  export type BlockPos = import('pumpkin:plugin/common@0.1.0').BlockPos;
  export type Locale = import('pumpkin:plugin/common@0.1.0').Locale;
  export type GameMode = import('pumpkin:plugin/common@0.1.0').GameMode;
  export type ItemStack = import('pumpkin:plugin/item-stack@0.1.0').ItemStack;
  export type Server = import('pumpkin:plugin/server@0.1.0').Server;
  export type Difficulty = import('pumpkin:plugin/server@0.1.0').Difficulty;
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type CommandError = CommandErrorInvalidConsumption | CommandErrorInvalidRequirement | CommandErrorPermissionDenied | CommandErrorCommandFailed;
  export interface CommandErrorInvalidConsumption {
    tag: 'invalid-consumption',
    val: string | undefined,
  }
  export interface CommandErrorInvalidRequirement {
    tag: 'invalid-requirement',
  }
  export interface CommandErrorPermissionDenied {
    tag: 'permission-denied',
  }
  export interface CommandErrorCommandFailed {
    tag: 'command-failed',
    val: TextComponent,
  }
  export interface SuggestionRequest {
    input: string,
    cursor: number,
    start: number,
    remaining: string,
  }
  export interface CommandSuggestion {
    value: string,
    tooltip?: TextComponent,
  }
  export interface CommandSuggestions {
    start: number,
    length: number,
    values: Array<CommandSuggestion>,
  }
  export interface EntityArgument {
    single: boolean,
    playersOnly: boolean,
  }
  export type CommandSenderType = CommandSenderTypeRcon | CommandSenderTypeConsole | CommandSenderTypePlayer | CommandSenderTypeCommandBlock | CommandSenderTypeDummy;
  export interface CommandSenderTypeRcon {
    tag: 'rcon',
  }
  export interface CommandSenderTypeConsole {
    tag: 'console',
  }
  export interface CommandSenderTypePlayer {
    tag: 'player',
    val: Player,
  }
  export interface CommandSenderTypeCommandBlock {
    tag: 'command-block',
    val: [CommandBlockEntity, World],
  }
  export interface CommandSenderTypeDummy {
    tag: 'dummy',
  }
  /**
   * # Variants
   * 
   * ## `"zero"`
   * 
   * ## `"one"`
   * 
   * ## `"two"`
   * 
   * ## `"three"`
   * 
   * ## `"four"`
   */
  export type PermissionLevel = 'zero' | 'one' | 'two' | 'three' | 'four';
  /**
   * # Variants
   * 
   * ## `"single-word"`
   * 
   * ## `"quotable"`
   * 
   * ## `"greedy"`
   */
  export type StringType = 'single-word' | 'quotable' | 'greedy';
  export type ArgumentType = ArgumentTypeBool | ArgumentTypeFloat | ArgumentTypeDouble | ArgumentTypeInteger | ArgumentTypeLong | ArgumentTypeString | ArgumentTypeEntities | ArgumentTypeEntity | ArgumentTypePlayers | ArgumentTypeGameProfile | ArgumentTypeBlockPos | ArgumentTypeColumnPos | ArgumentTypePosition3d | ArgumentTypePosition2d | ArgumentTypeBlockState | ArgumentTypeBlockPredicate | ArgumentTypeItem | ArgumentTypeItemPredicate | ArgumentTypeColor | ArgumentTypeComponent | ArgumentTypeStyle | ArgumentTypeMessage | ArgumentTypeNbtCompoundTag | ArgumentTypeNbtTag | ArgumentTypeNbtPath | ArgumentTypeObjective | ArgumentTypeObjectiveCriteria | ArgumentTypeOperation | ArgumentTypeParticle | ArgumentTypeAngle | ArgumentTypeRotation | ArgumentTypeScoreboardSlot | ArgumentTypeScoreHolder | ArgumentTypeSwizzle | ArgumentTypeTeam | ArgumentTypeItemSlot | ArgumentTypeResourceLocation | ArgumentTypeMobEffect | ArgumentTypeFunction | ArgumentTypeEntityAnchor | ArgumentTypeIntRange | ArgumentTypeFloatRange | ArgumentTypeDimension | ArgumentTypeGamemode | ArgumentTypeDifficulty | ArgumentTypeTime | ArgumentTypeResource | ArgumentTypeResourceOrTag | ArgumentTypeResourceOrTagKey | ArgumentTypeResourceKey | ArgumentTypeTemplateMirror | ArgumentTypeTemplateRotation | ArgumentTypeUuid;
  export interface ArgumentTypeBool {
    tag: 'bool',
  }
  export interface ArgumentTypeFloat {
    tag: 'float',
    val: [number | undefined, number | undefined],
  }
  export interface ArgumentTypeDouble {
    tag: 'double',
    val: [number | undefined, number | undefined],
  }
  export interface ArgumentTypeInteger {
    tag: 'integer',
    val: [number | undefined, number | undefined],
  }
  export interface ArgumentTypeLong {
    tag: 'long',
    val: [bigint | undefined, bigint | undefined],
  }
  export interface ArgumentTypeString {
    tag: 'string',
    val: StringType,
  }
  export interface ArgumentTypeEntities {
    tag: 'entities',
  }
  export interface ArgumentTypeEntity {
    tag: 'entity',
  }
  export interface ArgumentTypePlayers {
    tag: 'players',
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
  export interface ArgumentTypePosition3d {
    tag: 'position3d',
  }
  export interface ArgumentTypePosition2d {
    tag: 'position2d',
  }
  export interface ArgumentTypeBlockState {
    tag: 'block-state',
  }
  export interface ArgumentTypeBlockPredicate {
    tag: 'block-predicate',
  }
  export interface ArgumentTypeItem {
    tag: 'item',
  }
  export interface ArgumentTypeItemPredicate {
    tag: 'item-predicate',
  }
  export interface ArgumentTypeColor {
    tag: 'color',
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
  export interface ArgumentTypeNbtCompoundTag {
    tag: 'nbt-compound-tag',
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
    val: boolean,
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
  export interface ArgumentTypeResourceLocation {
    tag: 'resource-location',
  }
  export interface ArgumentTypeMobEffect {
    tag: 'mob-effect',
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
  export interface ArgumentTypeDifficulty {
    tag: 'difficulty',
  }
  export interface ArgumentTypeTime {
    tag: 'time',
    val: number | undefined,
  }
  export interface ArgumentTypeResource {
    tag: 'resource',
    val: string,
  }
  export interface ArgumentTypeResourceOrTag {
    tag: 'resource-or-tag',
    val: string,
  }
  export interface ArgumentTypeResourceOrTagKey {
    tag: 'resource-or-tag-key',
    val: string,
  }
  export interface ArgumentTypeResourceKey {
    tag: 'resource-key',
    val: string,
  }
  export interface ArgumentTypeTemplateMirror {
    tag: 'template-mirror',
  }
  export interface ArgumentTypeTemplateRotation {
    tag: 'template-rotation',
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
   * ## `"available-biomes"`
   * 
   * ## `"summonable-entities"`
   */
  export type SuggestionType = 'ask-server' | 'all-recipes' | 'available-sounds' | 'available-biomes' | 'summonable-entities';
  /**
   * # Variants
   * 
   * ## `"pink"`
   * 
   * ## `"blue"`
   * 
   * ## `"red"`
   * 
   * ## `"green"`
   * 
   * ## `"yellow"`
   * 
   * ## `"purple"`
   * 
   * ## `"white"`
   */
  export type BossbarColor = 'pink' | 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'white';
  /**
   * # Variants
   * 
   * ## `"no-division"`
   * 
   * ## `"notches6"`
   * 
   * ## `"notches10"`
   * 
   * ## `"notches12"`
   * 
   * ## `"notches20"`
   */
  export type BossbarStyle = 'no-division' | 'notches6' | 'notches10' | 'notches12' | 'notches20';
  /**
   * # Variants
   * 
   * ## `"master"`
   * 
   * ## `"music"`
   * 
   * ## `"records"`
   * 
   * ## `"weather"`
   * 
   * ## `"blocks"`
   * 
   * ## `"hostile"`
   * 
   * ## `"neutral"`
   * 
   * ## `"players"`
   * 
   * ## `"ambient"`
   * 
   * ## `"voice"`
   */
  export type SoundCategory = 'master' | 'music' | 'records' | 'weather' | 'blocks' | 'hostile' | 'neutral' | 'players' | 'ambient' | 'voice';
  /**
   * # Variants
   * 
   * ## `"eyes"`
   * 
   * ## `"feet"`
   */
  export type EntityAnchor = 'eyes' | 'feet';
  export type Number = NumberFloat64 | NumberFloat32 | NumberInt32 | NumberInt64;
  export interface NumberFloat64 {
    tag: 'float64',
    val: number,
  }
  export interface NumberFloat32 {
    tag: 'float32',
    val: number,
  }
  export interface NumberInt32 {
    tag: 'int32',
    val: number,
  }
  export interface NumberInt64 {
    tag: 'int64',
    val: bigint,
  }
  export type NotInBounds = NotInBoundsLowerBound | NotInBoundsUpperBound;
  export interface NotInBoundsLowerBound {
    tag: 'lower-bound',
    val: [Number, Number],
  }
  export interface NotInBoundsUpperBound {
    tag: 'upper-bound',
    val: [Number, Number],
  }
  export type Arg = ArgSimple | ArgMsg | ArgBool | ArgItem | ArgItemPredicate | ArgResourceLocation | ArgBlock | ArgBlockPredicate | ArgTime | ArgNum | ArgBlockPos | ArgPos3d | ArgPos2d | ArgRotation | ArgGamemode | ArgDifficulty | ArgPlayers | ArgParticle | ArgTextComponent | ArgBossbarColor | ArgBossbarStyle | ArgSoundCategory | ArgDamageType | ArgEffect | ArgEnchantment | ArgAdvancement | ArgEntityAnchor;
  export interface ArgSimple {
    tag: 'simple',
    val: string,
  }
  export interface ArgMsg {
    tag: 'msg',
    val: string,
  }
  export interface ArgBool {
    tag: 'bool',
    val: boolean,
  }
  export interface ArgItem {
    tag: 'item',
    val: string,
  }
  export interface ArgItemPredicate {
    tag: 'item-predicate',
    val: string,
  }
  export interface ArgResourceLocation {
    tag: 'resource-location',
    val: string,
  }
  export interface ArgBlock {
    tag: 'block',
    val: string,
  }
  export interface ArgBlockPredicate {
    tag: 'block-predicate',
    val: string,
  }
  export interface ArgTime {
    tag: 'time',
    val: number,
  }
  export interface ArgNum {
    tag: 'num',
    val: Result<Number, NotInBounds>,
  }
  export interface ArgBlockPos {
    tag: 'block-pos',
    val: BlockPos,
  }
  export interface ArgPos3d {
    tag: 'pos3d',
    val: [number, number, number],
  }
  export interface ArgPos2d {
    tag: 'pos2d',
    val: [number, number],
  }
  export interface ArgRotation {
    tag: 'rotation',
    val: [number, boolean, number, boolean],
  }
  export interface ArgGamemode {
    tag: 'gamemode',
    val: GameMode,
  }
  export interface ArgDifficulty {
    tag: 'difficulty',
    val: Difficulty,
  }
  export interface ArgPlayers {
    tag: 'players',
    val: Array<Player>,
  }
  export interface ArgParticle {
    tag: 'particle',
    val: string,
  }
  export interface ArgTextComponent {
    tag: 'text-component',
    val: TextComponent,
  }
  export interface ArgBossbarColor {
    tag: 'bossbar-color',
    val: BossbarColor,
  }
  export interface ArgBossbarStyle {
    tag: 'bossbar-style',
    val: BossbarStyle,
  }
  export interface ArgSoundCategory {
    tag: 'sound-category',
    val: SoundCategory,
  }
  export interface ArgDamageType {
    tag: 'damage-type',
    val: string,
  }
  export interface ArgEffect {
    tag: 'effect',
    val: string,
  }
  export interface ArgEnchantment {
    tag: 'enchantment',
    val: string,
  }
  export interface ArgAdvancement {
    tag: 'advancement',
    val: string,
  }
  export interface ArgEntityAnchor {
    tag: 'entity-anchor',
    val: EntityAnchor,
  }
  export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  
  export class Command implements Disposable {
    /**
    * First name is primary, rest are aliases
    */
    constructor(names: Array<string>, description: string)
    then(node: CommandNode): void;
    executeWithHandlerId(handlerId: number): void;
    [Symbol.dispose](): void;
  }
  
  export class CommandNode implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    static literal(name: string): CommandNode;
    static argument(name: string, type: ArgumentType): CommandNode;
    then(node: CommandNode): void;
    executeWithHandlerId(handlerId: number): void;
    suggestWithHandlerId(handlerId: number): void;
    requireWithHandlerId(handlerId: number): void;
    [Symbol.dispose](): void;
  }
  
  export class CommandSender implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getCommandSenderType(): CommandSenderType;
    getName(): string;
    sendMessage(text: TextComponent): void;
    sendSystemMessage(text: TextComponent): void;
    sendError(text: TextComponent): void;
    setSuccessCount(count: number): void;
    isPlayer(): boolean;
    isConsole(): boolean;
    asPlayer(): Player | undefined;
    permissionLevel(): PermissionLevel;
    hasPermissionLevel(level: PermissionLevel): boolean;
    hasPermission(server: Server, node: string): boolean;
    position(): Position | undefined;
    world(): World | undefined;
    getLocale(): Locale;
    shouldReceiveFeedback(): boolean;
    shouldBroadcastConsoleToOps(): boolean;
    shouldTrackOutput(): boolean;
    [Symbol.dispose](): void;
  }
  
  export class ConsumedArgs implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getValue(key: string): Arg;
    [Symbol.dispose](): void;
  }
}
