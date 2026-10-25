/// <reference path="./pumpkin-plugin-item-stack.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
/// <reference path="./pumpkin-plugin-uuid.d.ts" />
/// <reference path="./pumpkin-plugin-world.d.ts" />
declare module 'pumpkin:plugin/display@0.1.0' {
  export type Entity = import('pumpkin:plugin/world@0.1.0').Entity;
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type ItemStack = import('pumpkin:plugin/item-stack@0.1.0').ItemStack;
  export type Uuid = import('pumpkin:plugin/uuid@0.1.0').Uuid;
  /**
   * Billboard rendering constraints for display entities.
   * # Variants
   * 
   * ## `"fixed"`
   * 
   * ## `"vertical"`
   * 
   * ## `"horizontal"`
   * 
   * ## `"center"`
   */
  export type BillboardMode = 'fixed' | 'vertical' | 'horizontal' | 'center';
  /**
   * Item display transformation modes for item display entities.
   * # Variants
   * 
   * ## `"none"`
   * 
   * ## `"thirdperson-lefthand"`
   * 
   * ## `"thirdperson-righthand"`
   * 
   * ## `"firstperson-lefthand"`
   * 
   * ## `"firstperson-righthand"`
   * 
   * ## `"head"`
   * 
   * ## `"gui"`
   * 
   * ## `"ground"`
   * 
   * ## `"fixed"`
   */
  export type ItemDisplayMode = 'none' | 'thirdperson-lefthand' | 'thirdperson-righthand' | 'firstperson-lefthand' | 'firstperson-righthand' | 'head' | 'gui' | 'ground' | 'fixed';
  /**
   * Text alignment options for text display entities.
   * # Variants
   * 
   * ## `"center"`
   * 
   * ## `"left"`
   * 
   * ## `"right"`
   */
  export type TextAlignment = 'center' | 'left' | 'right';
  /**
   * 3D single-precision vector.
   */
  export interface Vector3f {
    x: number,
    y: number,
    z: number,
  }
  /**
   * Single-precision quaternion representing a 3D rotation.
   */
  export interface Quaternionf {
    x: number,
    y: number,
    z: number,
    w: number,
  }
  /**
   * Transformation (translation, scale, left and right rotations) for display entities.
   */
  export interface DisplayTransformation {
    translation: Vector3f,
    scale: Vector3f,
    leftRotation: Quaternionf,
    rightRotation: Quaternionf,
  }
  
  export class BlockDisplayEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    static fromEntity(entity: Entity): BlockDisplayEntity | undefined;
    getDisplay(): DisplayEntity;
    getEntity(): Entity;
    getBlockStateId(): number;
    setBlockStateId(stateId: number): void;
    [Symbol.dispose](): void;
  }
  
  export class DisplayEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    static fromEntity(entity: Entity): DisplayEntity | undefined;
    getEntity(): Entity;
    getTransformation(): DisplayTransformation;
    setTransformation(transformation: DisplayTransformation): void;
    getInterpolationDuration(): number;
    setInterpolationDuration(duration: number): void;
    getInterpolationStart(): number;
    setInterpolationStart(deltaTicks: number): void;
    getTeleportDuration(): number;
    setTeleportDuration(duration: number): void;
    getBillboard(): BillboardMode;
    setBillboard(mode: BillboardMode): void;
    getViewRange(): number;
    setViewRange(range: number): void;
    getShadowRadius(): number;
    setShadowRadius(radius: number): void;
    getShadowStrength(): number;
    setShadowStrength(strength: number): void;
    getDisplayWidth(): number;
    setDisplayWidth(width: number): void;
    getDisplayHeight(): number;
    setDisplayHeight(height: number): void;
    getGlowColorOverride(): number;
    setGlowColorOverride(color: number): void;
    getBrightness(): number;
    setBrightness(brightness: number): void;
    [Symbol.dispose](): void;
  }
  
  export class InteractionEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    static fromEntity(entity: Entity): InteractionEntity | undefined;
    getEntity(): Entity;
    getWidth(): number;
    setWidth(width: number): void;
    getHeight(): number;
    setHeight(height: number): void;
    getResponse(): boolean;
    setResponse(response: boolean): void;
    getLastAttacker(): Uuid | undefined;
    getLastInteraction(): Uuid | undefined;
    [Symbol.dispose](): void;
  }
  
  export class ItemDisplayEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    static fromEntity(entity: Entity): ItemDisplayEntity | undefined;
    getDisplay(): DisplayEntity;
    getEntity(): Entity;
    getItem(): ItemStack | undefined;
    setItem(item: ItemStack | undefined): void;
    getItemDisplayMode(): ItemDisplayMode;
    setItemDisplayMode(mode: ItemDisplayMode): void;
    [Symbol.dispose](): void;
  }
  
  export class TextDisplayEntity implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    static fromEntity(entity: Entity): TextDisplayEntity | undefined;
    getDisplay(): DisplayEntity;
    getEntity(): Entity;
    getText(): TextComponent;
    setText(text: TextComponent): void;
    getLineWidth(): number;
    setLineWidth(width: number): void;
    getBackground(): number;
    setBackground(color: number): void;
    getTextOpacity(): number;
    setTextOpacity(opacity: number): void;
    getShadow(): boolean;
    setShadow(shadow: boolean): void;
    getSeeThrough(): boolean;
    setSeeThrough(seeThrough: boolean): void;
    getDefaultBackground(): boolean;
    setDefaultBackground(defaultBackground: boolean): void;
    getAlignment(): TextAlignment;
    setAlignment(alignment: TextAlignment): void;
    [Symbol.dispose](): void;
  }
}
