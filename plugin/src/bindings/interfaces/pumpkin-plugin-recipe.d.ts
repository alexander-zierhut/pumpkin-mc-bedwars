/// <reference path="./pumpkin-plugin-item-stack.d.ts" />
declare module 'pumpkin:plugin/recipe@0.1.0' {
  export type ItemStack = import('pumpkin:plugin/item-stack@0.1.0').ItemStack;
  /**
   * Recipe category for the recipe book.
   * # Variants
   * 
   * ## `"building"`
   * 
   * ## `"redstone"`
   * 
   * ## `"equipment"`
   * 
   * ## `"misc"`
   * 
   * ## `"food"`
   * 
   * ## `"blocks"`
   */
  export type RecipeCategory = 'building' | 'redstone' | 'equipment' | 'misc' | 'food' | 'blocks';
  /**
   * Represents an ingredient in a recipe.
   */
  export type Ingredient = IngredientItem | IngredientTag | IngredientOneOf;
  /**
   * A specific item (e.g. "minecraft:diamond").
   */
  export interface IngredientItem {
    tag: 'item',
    val: string,
  }
  /**
   * A tag group of items (e.g., "minecraft:logs").
   */
  export interface IngredientTag {
    tag: 'tag',
    val: string,
  }
  /**
   * One of multiple specific items.
   */
  export interface IngredientOneOf {
    tag: 'one-of',
    val: Array<string>,
  }
  /**
   * Represents a shaped crafting recipe.
   */
  export interface ShapedRecipe {
    /**
     * The pattern of the recipe (e.g., ["# #", " s ", "# #"]).
     */
    pattern: Array<string>,
    /**
     * Mapping of characters in the pattern to ingredients.
     */
    key: Array<[string, Ingredient]>,
    /**
     * The resulting item stack.
     */
    output: ItemStack,
    /**
     * The recipe group (optional).
     */
    group?: string,
    /**
     * The recipe category in the recipe book.
     */
    category?: RecipeCategory,
    /**
     * Whether to show a toast notification when the recipe is unlocked.
     */
    showNotification?: boolean,
  }
  /**
   * Represents a shapeless crafting recipe.
   */
  export interface ShapelessRecipe {
    /**
     * The list of ingredients required.
     */
    ingredients: Array<Ingredient>,
    /**
     * The resulting item stack.
     */
    output: ItemStack,
    /**
     * The recipe group (optional).
     */
    group?: string,
    /**
     * The recipe category in the recipe book.
     */
    category?: RecipeCategory,
  }
  /**
   * Represents a cooking recipe (Smelting, Blasting, Smoking, Campfire).
   */
  export interface CookingRecipe {
    /**
     * The ingredient to cook.
     */
    ingredient: Ingredient,
    /**
     * The resulting item stack.
     */
    output: ItemStack,
    /**
     * Experience points awarded.
     */
    experience: number,
    /**
     * Cooking time in ticks.
     */
    cookingTime: number,
    /**
     * The recipe group (optional).
     */
    group?: string,
    /**
     * The recipe category in the recipe book.
     */
    category?: RecipeCategory,
  }
  /**
   * Types of cooking stations.
   * # Variants
   * 
   * ## `"smelting"`
   * 
   * ## `"blasting"`
   * 
   * ## `"smoking"`
   * 
   * ## `"campfire"`
   */
  export type CookingType = 'smelting' | 'blasting' | 'smoking' | 'campfire';
  
  export class RecipeManager implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Registers a shaped crafting recipe.
    */
    registerShaped(id: string, recipe: ShapedRecipe): void;
    /**
    * Registers a shapeless crafting recipe.
    */
    registerShapeless(id: string, recipe: ShapelessRecipe): void;
    /**
    * Registers a cooking recipe.
    */
    registerCooking(id: string, stationType: CookingType, recipe: CookingRecipe): void;
    [Symbol.dispose](): void;
  }
}
