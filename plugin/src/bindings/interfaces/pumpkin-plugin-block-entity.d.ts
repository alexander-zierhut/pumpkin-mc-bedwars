/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-inventory.d.ts" />
/// <reference path="./pumpkin-plugin-item-stack.d.ts" />
declare module 'pumpkin:plugin/block-entity@0.1.0' {
  export type BlockPos = import('pumpkin:plugin/common@0.1.0').BlockPos;
  export type NbtTree = import('pumpkin:plugin/common@0.1.0').NbtTree;
  export type ItemStack = import('pumpkin:plugin/item-stack@0.1.0').ItemStack;
  export type Inventory = import('pumpkin:plugin/inventory@0.1.0').Inventory;
  /**
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
  export interface SignText {
    messages: Array<string>,
    color: DyeColor,
    hasGlowingText: boolean,
  }
  export type BlockEntityType = BlockEntityTypeCommandBlockEntity | BlockEntityTypeSignBlockEntity | BlockEntityTypeHangingSignBlockEntity | BlockEntityTypeJukeboxBlockEntity | BlockEntityTypeChestBlockEntity | BlockEntityTypeTrappedChestBlockEntity | BlockEntityTypeMobSpawnerBlockEntity | BlockEntityTypeMapBlockEntity | BlockEntityTypeBannerBlockEntity | BlockEntityTypeBarrelBlockEntity | BlockEntityTypeBeaconBlockEntity | BlockEntityTypeBedBlockEntity | BlockEntityTypeBeehiveBlockEntity | BlockEntityTypeBellBlockEntity | BlockEntityTypeBlastingFurnaceBlockEntity | BlockEntityTypeBrewingStandBlockEntity | BlockEntityTypeBrushableBlockBlockEntity | BlockEntityTypeCalibratedSculkSensorBlockEntity | BlockEntityTypeCampfireBlockEntity | BlockEntityTypeChiseledBookshelfBlockEntity | BlockEntityTypeComparatorBlockEntity | BlockEntityTypeConduitBlockEntity | BlockEntityTypeCopperGolemStatueBlockEntity | BlockEntityTypeCrafterBlockEntity | BlockEntityTypeCreakingHeartBlockEntity | BlockEntityTypeDaylightDetectorBlockEntity | BlockEntityTypeDecoratedPotBlockEntity | BlockEntityTypeDispenserBlockEntity | BlockEntityTypeDropperBlockEntity | BlockEntityTypeEnchantingTableBlockEntity | BlockEntityTypeEndGatewayBlockEntity | BlockEntityTypeEndPortalBlockEntity | BlockEntityTypeEnderChestBlockEntity | BlockEntityTypeFurnaceBlockEntity | BlockEntityTypeHopperBlockEntity | BlockEntityTypeJigsawBlockEntity | BlockEntityTypeLecternBlockEntity | BlockEntityTypePistonBlockEntity | BlockEntityTypePotentSulfurBlockEntity | BlockEntityTypeSculkCatalystBlockEntity | BlockEntityTypeSculkSensorBlockEntity | BlockEntityTypeSculkShriekerBlockEntity | BlockEntityTypeShelfBlockEntity | BlockEntityTypeShulkerBoxBlockEntity | BlockEntityTypeSkullBlockEntity | BlockEntityTypeSmokerBlockEntity | BlockEntityTypeStructureBlockBlockEntity | BlockEntityTypeTestBlockBlockEntity | BlockEntityTypeTestInstanceBlockBlockEntity | BlockEntityTypeTrialSpawnerBlockEntity | BlockEntityTypeVaultBlockEntity | BlockEntityTypeContainerBlockEntity;
  export interface BlockEntityTypeCommandBlockEntity {
    tag: 'command-block-entity',
    val: CommandBlockEntity,
  }
  export interface BlockEntityTypeSignBlockEntity {
    tag: 'sign-block-entity',
    val: SignBlockEntity,
  }
  export interface BlockEntityTypeHangingSignBlockEntity {
    tag: 'hanging-sign-block-entity',
    val: HangingSignBlockEntity,
  }
  export interface BlockEntityTypeJukeboxBlockEntity {
    tag: 'jukebox-block-entity',
    val: JukeboxBlockEntity,
  }
  export interface BlockEntityTypeChestBlockEntity {
    tag: 'chest-block-entity',
    val: ChestBlockEntity,
  }
  export interface BlockEntityTypeTrappedChestBlockEntity {
    tag: 'trapped-chest-block-entity',
    val: TrappedChestBlockEntity,
  }
  export interface BlockEntityTypeMobSpawnerBlockEntity {
    tag: 'mob-spawner-block-entity',
    val: MobSpawnerBlockEntity,
  }
  export interface BlockEntityTypeMapBlockEntity {
    tag: 'map-block-entity',
    val: MapBlockEntity,
  }
  export interface BlockEntityTypeBannerBlockEntity {
    tag: 'banner-block-entity',
    val: BannerBlockEntity,
  }
  export interface BlockEntityTypeBarrelBlockEntity {
    tag: 'barrel-block-entity',
    val: BarrelBlockEntity,
  }
  export interface BlockEntityTypeBeaconBlockEntity {
    tag: 'beacon-block-entity',
    val: BeaconBlockEntity,
  }
  export interface BlockEntityTypeBedBlockEntity {
    tag: 'bed-block-entity',
    val: BedBlockEntity,
  }
  export interface BlockEntityTypeBeehiveBlockEntity {
    tag: 'beehive-block-entity',
    val: BeehiveBlockEntity,
  }
  export interface BlockEntityTypeBellBlockEntity {
    tag: 'bell-block-entity',
    val: BellBlockEntity,
  }
  export interface BlockEntityTypeBlastingFurnaceBlockEntity {
    tag: 'blasting-furnace-block-entity',
    val: BlastingFurnaceBlockEntity,
  }
  export interface BlockEntityTypeBrewingStandBlockEntity {
    tag: 'brewing-stand-block-entity',
    val: BrewingStandBlockEntity,
  }
  export interface BlockEntityTypeBrushableBlockBlockEntity {
    tag: 'brushable-block-block-entity',
    val: BrushableBlockBlockEntity,
  }
  export interface BlockEntityTypeCalibratedSculkSensorBlockEntity {
    tag: 'calibrated-sculk-sensor-block-entity',
    val: CalibratedSculkSensorBlockEntity,
  }
  export interface BlockEntityTypeCampfireBlockEntity {
    tag: 'campfire-block-entity',
    val: CampfireBlockEntity,
  }
  export interface BlockEntityTypeChiseledBookshelfBlockEntity {
    tag: 'chiseled-bookshelf-block-entity',
    val: ChiseledBookshelfBlockEntity,
  }
  export interface BlockEntityTypeComparatorBlockEntity {
    tag: 'comparator-block-entity',
    val: ComparatorBlockEntity,
  }
  export interface BlockEntityTypeConduitBlockEntity {
    tag: 'conduit-block-entity',
    val: ConduitBlockEntity,
  }
  export interface BlockEntityTypeCopperGolemStatueBlockEntity {
    tag: 'copper-golem-statue-block-entity',
    val: CopperGolemStatueBlockEntity,
  }
  export interface BlockEntityTypeCrafterBlockEntity {
    tag: 'crafter-block-entity',
    val: CrafterBlockEntity,
  }
  export interface BlockEntityTypeCreakingHeartBlockEntity {
    tag: 'creaking-heart-block-entity',
    val: CreakingHeartBlockEntity,
  }
  export interface BlockEntityTypeDaylightDetectorBlockEntity {
    tag: 'daylight-detector-block-entity',
    val: DaylightDetectorBlockEntity,
  }
  export interface BlockEntityTypeDecoratedPotBlockEntity {
    tag: 'decorated-pot-block-entity',
    val: DecoratedPotBlockEntity,
  }
  export interface BlockEntityTypeDispenserBlockEntity {
    tag: 'dispenser-block-entity',
    val: DispenserBlockEntity,
  }
  export interface BlockEntityTypeDropperBlockEntity {
    tag: 'dropper-block-entity',
    val: DropperBlockEntity,
  }
  export interface BlockEntityTypeEnchantingTableBlockEntity {
    tag: 'enchanting-table-block-entity',
    val: EnchantingTableBlockEntity,
  }
  export interface BlockEntityTypeEndGatewayBlockEntity {
    tag: 'end-gateway-block-entity',
    val: EndGatewayBlockEntity,
  }
  export interface BlockEntityTypeEndPortalBlockEntity {
    tag: 'end-portal-block-entity',
    val: EndPortalBlockEntity,
  }
  export interface BlockEntityTypeEnderChestBlockEntity {
    tag: 'ender-chest-block-entity',
    val: EnderChestBlockEntity,
  }
  export interface BlockEntityTypeFurnaceBlockEntity {
    tag: 'furnace-block-entity',
    val: FurnaceBlockEntity,
  }
  export interface BlockEntityTypeHopperBlockEntity {
    tag: 'hopper-block-entity',
    val: HopperBlockEntity,
  }
  export interface BlockEntityTypeJigsawBlockEntity {
    tag: 'jigsaw-block-entity',
    val: JigsawBlockEntity,
  }
  export interface BlockEntityTypeLecternBlockEntity {
    tag: 'lectern-block-entity',
    val: LecternBlockEntity,
  }
  export interface BlockEntityTypePistonBlockEntity {
    tag: 'piston-block-entity',
    val: PistonBlockEntity,
  }
  export interface BlockEntityTypePotentSulfurBlockEntity {
    tag: 'potent-sulfur-block-entity',
    val: PotentSulfurBlockEntity,
  }
  export interface BlockEntityTypeSculkCatalystBlockEntity {
    tag: 'sculk-catalyst-block-entity',
    val: SculkCatalystBlockEntity,
  }
  export interface BlockEntityTypeSculkSensorBlockEntity {
    tag: 'sculk-sensor-block-entity',
    val: SculkSensorBlockEntity,
  }
  export interface BlockEntityTypeSculkShriekerBlockEntity {
    tag: 'sculk-shrieker-block-entity',
    val: SculkShriekerBlockEntity,
  }
  export interface BlockEntityTypeShelfBlockEntity {
    tag: 'shelf-block-entity',
    val: ShelfBlockEntity,
  }
  export interface BlockEntityTypeShulkerBoxBlockEntity {
    tag: 'shulker-box-block-entity',
    val: ShulkerBoxBlockEntity,
  }
  export interface BlockEntityTypeSkullBlockEntity {
    tag: 'skull-block-entity',
    val: SkullBlockEntity,
  }
  export interface BlockEntityTypeSmokerBlockEntity {
    tag: 'smoker-block-entity',
    val: SmokerBlockEntity,
  }
  export interface BlockEntityTypeStructureBlockBlockEntity {
    tag: 'structure-block-block-entity',
    val: StructureBlockBlockEntity,
  }
  export interface BlockEntityTypeTestBlockBlockEntity {
    tag: 'test-block-block-entity',
    val: TestBlockBlockEntity,
  }
  export interface BlockEntityTypeTestInstanceBlockBlockEntity {
    tag: 'test-instance-block-block-entity',
    val: TestInstanceBlockBlockEntity,
  }
  export interface BlockEntityTypeTrialSpawnerBlockEntity {
    tag: 'trial-spawner-block-entity',
    val: TrialSpawnerBlockEntity,
  }
  export interface BlockEntityTypeVaultBlockEntity {
    tag: 'vault-block-entity',
    val: VaultBlockEntity,
  }
  export interface BlockEntityTypeContainerBlockEntity {
    tag: 'container-block-entity',
    val: ContainerBlockEntity,
  }
  
  export class BannerBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getCustomName(): string | undefined;
    [Symbol.dispose](): void;
  }
  
  export class BarrelBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    viewerCount(): number;
    [Symbol.dispose](): void;
  }
  
  export class BeaconBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    getPrimaryEffect(): number;
    getSecondaryEffect(): number;
    getLevels(): number;
    [Symbol.dispose](): void;
  }
  
  export class BedBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class BeehiveBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getBeeCount(): number;
    [Symbol.dispose](): void;
  }
  
  export class BellBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    isRinging(): boolean;
    getRingTicks(): number;
    [Symbol.dispose](): void;
  }
  
  export class BlastingFurnaceBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    getCookingTimeSpent(): number;
    getCookingTotalTime(): number;
    getLitTimeRemaining(): number;
    getLitTotalTime(): number;
    isBurning(): boolean;
    [Symbol.dispose](): void;
  }
  
  export class BlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    resourceLocation(): string;
    getPosition(): BlockPos;
    getId(): number;
    isDirty(): boolean;
    clearDirty(): void;
    /**
    * Sets a namespaced custom data value on this block entity.
    */
    setCustomData(namespace: string, key: string, value: NbtTree): void;
    /**
    * Returns a namespaced custom data value from this block entity, if set.
    */
    getCustomData(namespace: string, key: string): NbtTree | undefined;
    /**
    * Removes a namespaced custom data value from this block entity.
    */
    removeCustomData(namespace: string, key: string): void;
    /**
    * Returns whether this block entity has a namespaced custom data value.
    */
    hasCustomData(namespace: string, key: string): boolean;
    [Symbol.dispose](): void;
  }
  
  export class BrewingStandBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    getBrewTime(): number;
    getFuel(): number;
    [Symbol.dispose](): void;
  }
  
  export class BrushableBlockBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class CalibratedSculkSensorBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class CampfireBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class ChestBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    viewerCount(): number;
    [Symbol.dispose](): void;
  }
  
  export class ChiseledBookshelfBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    getLastInteractedSlot(): number;
    [Symbol.dispose](): void;
  }
  
  export class CommandBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    lastOutput(): string;
    trackOutput(): boolean;
    successCount(): number;
    command(): string;
    auto(): boolean;
    conditionMet(): boolean;
    powered(): boolean;
    [Symbol.dispose](): void;
  }
  
  export class ComparatorBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getOutputSignal(): number;
    [Symbol.dispose](): void;
  }
  
  export class ConduitBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class ContainerBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    /**
    * Returns the generic inventory handle for this container.
    */
    getInventory(): Inventory;
    getSize(): number;
    isEmpty(): boolean;
    getStack(slot: number): ItemStack | undefined;
    setStack(slot: number, stack: ItemStack | undefined): void;
    removeStack(slot: number): ItemStack | undefined;
    clear(): void;
    [Symbol.dispose](): void;
  }
  
  export class CopperGolemStatueBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class CrafterBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    getCraftingTicksRemaining(): number;
    isTriggered(): boolean;
    [Symbol.dispose](): void;
  }
  
  export class CreakingHeartBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getCreakingUuid(): string | undefined;
    [Symbol.dispose](): void;
  }
  
  export class DaylightDetectorBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class DecoratedPotBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class DispenserBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class DropperBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class EnchantingTableBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class EndGatewayBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getAge(): bigint;
    isExactTeleport(): boolean;
    [Symbol.dispose](): void;
  }
  
  export class EndPortalBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class EnderChestBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    viewerCount(): number;
    [Symbol.dispose](): void;
  }
  
  export class FurnaceBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    getCookingTimeSpent(): number;
    getCookingTotalTime(): number;
    getLitTimeRemaining(): number;
    getLitTotalTime(): number;
    isBurning(): boolean;
    [Symbol.dispose](): void;
  }
  
  export class HangingSignBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getFrontText(): SignText;
    setFrontText(text: SignText): void;
    getBackText(): SignText;
    setBackText(text: SignText): void;
    isWaxed(): boolean;
    setWaxed(waxed: boolean): void;
    [Symbol.dispose](): void;
  }
  
  export class HopperBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    getCooldown(): number;
    [Symbol.dispose](): void;
  }
  
  export class JigsawBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getName(): string;
    getTarget(): string;
    getPool(): string;
    getFinalState(): string;
    getSelectionPriority(): number;
    getPlacementPriority(): number;
    [Symbol.dispose](): void;
  }
  
  export class JukeboxBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    isPlaying(): boolean;
    stopPlaying(): void;
    startPlaying(lengthInTicks: bigint): void;
    [Symbol.dispose](): void;
  }
  
  export class LecternBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    getPage(): number;
    [Symbol.dispose](): void;
  }
  
  export class MapBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getMapId(): number;
    setMapId(mapId: number): void;
    getColors(): Uint8Array;
    setColors(colors: Uint8Array): void;
    setPixel(x: number, y: number, color: number): void;
    getPixel(x: number, y: number): number;
    update(): void;
    streamFrame(frameData: Uint8Array): void;
    [Symbol.dispose](): void;
  }
  
  export class MobSpawnerBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getSpawnCount(): number;
    getSpawnRange(): number;
    getDelay(): number;
    [Symbol.dispose](): void;
  }
  
  export class PistonBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getProgress(): number;
    isExtending(): boolean;
    isSource(): boolean;
    [Symbol.dispose](): void;
  }
  
  export class PotentSulfurBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class SculkCatalystBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class SculkSensorBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class SculkShriekerBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getWarningLevel(): number;
    [Symbol.dispose](): void;
  }
  
  export class ShelfBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class ShulkerBoxBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    viewerCount(): number;
    [Symbol.dispose](): void;
  }
  
  export class SignBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getFrontText(): SignText;
    setFrontText(text: SignText): void;
    getBackText(): SignText;
    setBackText(text: SignText): void;
    isWaxed(): boolean;
    setWaxed(waxed: boolean): void;
    [Symbol.dispose](): void;
  }
  
  export class SkullBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getNoteBlockSound(): string | undefined;
    [Symbol.dispose](): void;
  }
  
  export class SmokerBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    getCookingTimeSpent(): number;
    getCookingTotalTime(): number;
    getLitTimeRemaining(): number;
    getLitTotalTime(): number;
    isBurning(): boolean;
    [Symbol.dispose](): void;
  }
  
  export class StructureBlockBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getName(): string;
    getAuthor(): string;
    getMode(): string;
    getIntegrity(): number;
    getSeed(): bigint;
    [Symbol.dispose](): void;
  }
  
  export class TestBlockBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class TestInstanceBlockBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class TrappedChestBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    getContainer(): ContainerBlockEntity;
    viewerCount(): number;
    [Symbol.dispose](): void;
  }
  
  export class TrialSpawnerBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
  
  export class VaultBlockEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    getBlockEntity(): BlockEntity;
    [Symbol.dispose](): void;
  }
}
