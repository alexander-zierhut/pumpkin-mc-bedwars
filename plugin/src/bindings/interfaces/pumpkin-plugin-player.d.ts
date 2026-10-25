/// <reference path="./pumpkin-plugin-advancement.d.ts" />
/// <reference path="./pumpkin-plugin-bedrock-packets.d.ts" />
/// <reference path="./pumpkin-plugin-common.d.ts" />
/// <reference path="./pumpkin-plugin-damage-types.d.ts" />
/// <reference path="./pumpkin-plugin-entity-statuses.d.ts" />
/// <reference path="./pumpkin-plugin-forms.d.ts" />
/// <reference path="./pumpkin-plugin-gui.d.ts" />
/// <reference path="./pumpkin-plugin-inventory.d.ts" />
/// <reference path="./pumpkin-plugin-item-stack.d.ts" />
/// <reference path="./pumpkin-plugin-java-dialogs.d.ts" />
/// <reference path="./pumpkin-plugin-java-packets.d.ts" />
/// <reference path="./pumpkin-plugin-particles.d.ts" />
/// <reference path="./pumpkin-plugin-permission.d.ts" />
/// <reference path="./pumpkin-plugin-scoreboard.d.ts" />
/// <reference path="./pumpkin-plugin-sounds.d.ts" />
/// <reference path="./pumpkin-plugin-statistics.d.ts" />
/// <reference path="./pumpkin-plugin-status-effect.d.ts" />
/// <reference path="./pumpkin-plugin-text.d.ts" />
/// <reference path="./pumpkin-plugin-uuid.d.ts" />
/// <reference path="./pumpkin-plugin-world.d.ts" />
declare module 'pumpkin:plugin/player@0.1.0' {
  /**
   * Returns a list of all players in a specific world.
   */
  export function getWorldPlayers(worldRef: World): Array<Player>;
  export type Hand = import('pumpkin:plugin/common@0.1.0').Hand;
  export type Position = import('pumpkin:plugin/common@0.1.0').Position;
  export type GameMode = import('pumpkin:plugin/common@0.1.0').GameMode;
  export type BlockPos = import('pumpkin:plugin/common@0.1.0').BlockPos;
  export type ItemStack = import('pumpkin:plugin/item-stack@0.1.0').ItemStack;
  export type World = import('pumpkin:plugin/world@0.1.0').World;
  export type Entity = import('pumpkin:plugin/world@0.1.0').Entity;
  export type RayTraceBlockResult = import('pumpkin:plugin/world@0.1.0').RayTraceBlockResult;
  export type RayTraceEntityResult = import('pumpkin:plugin/world@0.1.0').RayTraceEntityResult;
  export type PermissionLevel = import('pumpkin:plugin/permission@0.1.0').PermissionLevel;
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  export type Gui = import('pumpkin:plugin/gui@0.1.0').Gui;
  export type Form = import('pumpkin:plugin/forms@0.1.0').Form;
  export type Dialog = import('pumpkin:plugin/java-dialogs@0.1.0').Dialog;
  export type JavaPacket = import('pumpkin:plugin/java-packets@0.1.0').ClientboundPacket;
  export type BedrockPacket = import('pumpkin:plugin/bedrock-packets@0.1.0').ClientboundPacket;
  export type Uuid = import('pumpkin:plugin/uuid@0.1.0').Uuid;
  export type StatusEffectType = import('pumpkin:plugin/status-effect@0.1.0').StatusEffectType;
  export type StatusEffectInstance = import('pumpkin:plugin/status-effect@0.1.0').StatusEffectInstance;
  export type Scoreboard = import('pumpkin:plugin/scoreboard@0.1.0').Scoreboard;
  export type BedrockScoreboard = import('pumpkin:plugin/scoreboard@0.1.0').BedrockScoreboard;
  export type AdvancementProgress = import('pumpkin:plugin/advancement@0.1.0').AdvancementProgress;
  export type DamageType = import('pumpkin:plugin/damage-types@0.1.0').DamageType;
  export type StatisticCategory = import('pumpkin:plugin/statistics@0.1.0').StatisticCategory;
  export type CustomStatistic = import('pumpkin:plugin/statistics@0.1.0').CustomStatistic;
  export type Inventory = import('pumpkin:plugin/inventory@0.1.0').Inventory;
  export type PlayerInventory = import('pumpkin:plugin/inventory@0.1.0').PlayerInventory;
  export type Sound = import('pumpkin:plugin/sounds@0.1.0').Sound;
  export type SoundCategory = import('pumpkin:plugin/sounds@0.1.0').SoundCategory;
  export type Particle = import('pumpkin:plugin/particles@0.1.0').Particle;
  export type EntityStatus = import('pumpkin:plugin/entity-statuses@0.1.0').EntityStatus;
  /**
   * Represents per-player weather condition overrides.
   * # Variants
   * 
   * ## `"clear"`
   * 
   * ## `"downfall"`
   */
  export type PlayerWeather = 'clear' | 'downfall';
  /**
   * Types of projectiles that can be launched by a player.
   * # Variants
   * 
   * ## `"arrow"`
   * 
   * ## `"snowball"`
   * 
   * ## `"egg"`
   * 
   * ## `"ender-pearl"`
   * 
   * ## `"splash-potion"`
   * 
   * ## `"fireball"`
   * 
   * ## `"small-fireball"`
   * 
   * ## `"trident"`
   * 
   * ## `"wind-charge"`
   */
  export type ProjectileType = 'arrow' | 'snowball' | 'egg' | 'ender-pearl' | 'splash-potion' | 'fireball' | 'small-fireball' | 'trident' | 'wind-charge';
  /**
   * Types of clientbound game events.
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
  export type ClientGameEvent = 'no-respawn-block-available' | 'begin-raining' | 'end-raining' | 'change-game-mode' | 'win-game' | 'demo-event' | 'arrow-hit-player' | 'rain-level-change' | 'thunder-level-change' | 'play-pufferfish-string-sound' | 'play-elder-guardian-mob-appearance' | 'enabled-respawn-screen' | 'limited-crafting' | 'start-waiting-chunks';
  /**
   * Built-in known server link types displayed in the client Escape pause menu.
   * # Variants
   * 
   * ## `"bug-report"`
   * 
   * ## `"community-guidelines"`
   * 
   * ## `"support"`
   * 
   * ## `"status"`
   * 
   * ## `"feedback"`
   * 
   * ## `"community"`
   * 
   * ## `"website"`
   * 
   * ## `"forums"`
   * 
   * ## `"news"`
   * 
   * ## `"announcements"`
   */
  export type KnownServerLink = 'bug-report' | 'community-guidelines' | 'support' | 'status' | 'feedback' | 'community' | 'website' | 'forums' | 'news' | 'announcements';
  /**
   * Label for a server link: either a built-in standard link type or a custom text component.
   */
  export type ServerLinkLabel = ServerLinkLabelKnown | ServerLinkLabelCustom;
  export interface ServerLinkLabelKnown {
    tag: 'known',
    val: KnownServerLink,
  }
  export interface ServerLinkLabelCustom {
    tag: 'custom',
    val: TextComponent,
  }
  /**
   * Represents a server link entry with a label and destination URL.
   */
  export interface ServerLink {
    label: ServerLinkLabel,
    url: string,
  }
  /**
   * Various abilities a player can have.
   */
  export interface PlayerAbilities {
    /**
     * Whether the player is invulnerable to damage.
     */
    invulnerable: boolean,
    /**
     * Whether the player is currently flying.
     */
    flying: boolean,
    /**
     * Whether the player is allowed to fly.
     */
    allowFlying: boolean,
    /**
     * Whether the player is in creative mode.
     */
    creative: boolean,
    /**
     * Whether the player can modify the world.
     */
    allowModifyWorld: boolean,
    /**
     * The speed at which the player flies.
     */
    flySpeed: number,
    /**
     * The speed at which the player walks.
     */
    walkSpeed: number,
  }
  /**
   * Represents a player's skin textures and metadata.
   */
  export interface PlayerSkin {
    /**
     * The base64-encoded texture data (usually JSON containing skin/cape URLs).
     */
    value: string,
    /**
     * The optional signature for the texture data.
     */
    signature?: string,
  }
  /**
   * Represents which skin parts are visible.
   */
  export interface SkinParts {
    cape?: boolean,
    jacket?: boolean,
    leftSleeve?: boolean,
    rightSleeve?: boolean,
    leftPantsLeg?: boolean,
    rightPantsLeg?: boolean,
    hat?: boolean,
  }
  /**
   * Represents the various abilities a Bedrock Edition player can have.
   * # Variants
   * 
   * ## `"build"`
   * 
   * Whether the player can build.
   * ## `"mine"`
   * 
   * Whether the player can mine blocks.
   * ## `"doors-and-switches"`
   * 
   * Whether the player can use doors and switches.
   * ## `"open-containers"`
   * 
   * Whether the player can open containers.
   * ## `"attack-players"`
   * 
   * Whether the player can attack other players.
   * ## `"attack-mobs"`
   * 
   * Whether the player can attack mobs.
   * ## `"operator-commands"`
   * 
   * Whether the player can use operator commands.
   * ## `"teleport"`
   * 
   * Whether the player can teleport.
   * ## `"invulnerable"`
   * 
   * Whether the player is invulnerable.
   * ## `"flying"`
   * 
   * Whether the player is currently flying.
   * ## `"may-fly"`
   * 
   * Whether the player is allowed to fly.
   * ## `"instabuild"`
   * 
   * Whether the player has instant build (creative).
   * ## `"lightning"`
   * 
   * Whether the player can use lightning-related abilities.
   * ## `"fly-speed"`
   * 
   * The speed at which the player flies.
   * ## `"walk-speed"`
   * 
   * The speed at which the player walks.
   * ## `"muted"`
   * 
   * Whether the player is muted.
   * ## `"world-builder"`
   * 
   * Whether the player is a world builder.
   * ## `"no-clip"`
   * 
   * Whether the player has no-clip enabled.
   * ## `"privileged-builder"`
   * 
   * Whether the player is a privileged builder.
   * ## `"vertical-fly-speed"`
   * 
   * The speed at which the player flies vertically.
   */
  export type BedrockAbility = 'build' | 'mine' | 'doors-and-switches' | 'open-containers' | 'attack-players' | 'attack-mobs' | 'operator-commands' | 'teleport' | 'invulnerable' | 'flying' | 'may-fly' | 'instabuild' | 'lightning' | 'fly-speed' | 'walk-speed' | 'muted' | 'world-builder' | 'no-clip' | 'privileged-builder' | 'vertical-fly-speed';
  /**
   * Represents the various status flags a Bedrock Edition entity can have.
   * These flags control client-side rendering and behavior.
   * # Variants
   * 
   * ## `"on-fire"`
   * 
   * Whether the entity is currently on fire.
   * ## `"sneaking"`
   * 
   * Whether the entity is sneaking.
   * ## `"riding"`
   * 
   * Whether the entity is riding another entity.
   * ## `"sprinting"`
   * 
   * Whether the entity is sprinting.
   * ## `"using-item"`
   * 
   * Whether the entity is using an item (e.g., eating, blocking).
   * ## `"invisible"`
   * 
   * Whether the entity is invisible.
   * ## `"tempted"`
   * 
   * Whether the entity is tempted by an item.
   * ## `"in-love"`
   * 
   * Whether the entity is in love (breeding).
   * ## `"saddled"`
   * 
   * Whether the entity is saddled.
   * ## `"powered"`
   * 
   * Whether the entity is powered (e.g., charged creeper).
   * ## `"ignited"`
   * 
   * Whether the entity is ignited.
   * ## `"baby"`
   * 
   * Whether the entity is a baby.
   * ## `"converting"`
   * 
   * Whether the entity is currently converting to another type.
   * ## `"critical"`
   * 
   * Whether the entity is in a critical state.
   * ## `"show-name"`
   * 
   * Whether to show the entity's name tag.
   * ## `"always-show-name"`
   * 
   * Whether to always show the entity's name tag.
   * ## `"no-ai"`
   * 
   * Whether the entity has no AI.
   * ## `"silent"`
   * 
   * Whether the entity is silent.
   * ## `"wall-climbing"`
   * 
   * Whether the entity is climbing a wall.
   * ## `"climb"`
   * 
   * Whether the entity is climbing.
   * ## `"swim"`
   * 
   * Whether the entity is swimming.
   * ## `"fly"`
   * 
   * Whether the entity is flying.
   * ## `"walk"`
   * 
   * Whether the entity is walking.
   * ## `"resting"`
   * 
   * Whether the entity is resting.
   * ## `"sitting"`
   * 
   * Whether the entity is sitting.
   * ## `"angry"`
   * 
   * Whether the entity is angry.
   * ## `"interested"`
   * 
   * Whether the entity is interested.
   * ## `"charged"`
   * 
   * Whether the entity is charged.
   * ## `"tamed"`
   * 
   * Whether the entity is tamed.
   * ## `"orphaned"`
   * 
   * Whether the entity is orphaned.
   * ## `"leashed"`
   * 
   * Whether the entity is leashed.
   * ## `"sheared"`
   * 
   * Whether the entity is sheared.
   * ## `"gliding"`
   * 
   * Whether the entity is gliding (elytra).
   * ## `"elder"`
   * 
   * Whether the entity is an elder (e.g., elder guardian).
   * ## `"moving"`
   * 
   * Whether the entity is moving.
   * ## `"breathing"`
   * 
   * Whether the entity is breathing.
   * ## `"chested"`
   * 
   * Whether the entity has a chest (e.g., donkey).
   * ## `"stackable"`
   * 
   * Whether the entity is stackable.
   * ## `"show-bottom"`
   * 
   * Whether to show the bottom of the entity.
   * ## `"standing"`
   * 
   * Whether the entity is standing.
   * ## `"shaking"`
   * 
   * Whether the entity is shaking.
   * ## `"idling"`
   * 
   * Whether the entity is idling.
   * ## `"casting"`
   * 
   * Whether the entity is casting (e.g., evoker).
   * ## `"charging"`
   * 
   * Whether the entity is charging an attack.
   * ## `"keyboard-controlled"`
   * 
   * Whether the entity is controlled by a keyboard.
   * ## `"power-jump"`
   * 
   * Whether the entity is performing a power jump.
   * ## `"dash"`
   * 
   * Whether the entity is dashing.
   * ## `"lingering"`
   * 
   * Whether the entity is lingering.
   * ## `"has-collision"`
   * 
   * Whether the entity has collision.
   * ## `"has-gravity"`
   * 
   * Whether the entity has gravity.
   * ## `"fire-immune"`
   * 
   * Whether the entity is immune to fire.
   * ## `"dancing"`
   * 
   * Whether the entity is dancing.
   * ## `"enchanted"`
   * 
   * Whether the entity is enchanted.
   * ## `"return-trident"`
   * 
   * Whether a trident will return to the entity.
   * ## `"container-private"`
   * 
   * Whether the container is private.
   * ## `"transforming"`
   * 
   * Whether the entity is transforming.
   * ## `"damage-nearby-mobs"`
   * 
   * Whether the entity damages nearby mobs.
   * ## `"swimming"`
   * 
   * Whether the entity is swimming.
   * ## `"bribed"`
   * 
   * Whether the entity has been bribed.
   * ## `"pregnant"`
   * 
   * Whether the entity is pregnant.
   * ## `"laying-egg"`
   * 
   * Whether the entity is laying an egg.
   * ## `"passenger-can-pick"`
   * 
   * Whether a passenger can pick up the entity.
   * ## `"transition-sitting"`
   * 
   * Whether the entity is transitioning to sitting.
   * ## `"eating"`
   * 
   * Whether the entity is eating.
   * ## `"laying-down"`
   * 
   * Whether the entity is laying down.
   * ## `"sneezing"`
   * 
   * Whether the entity is sneezing.
   * ## `"trusting"`
   * 
   * Whether the entity is trusting.
   * ## `"rolling"`
   * 
   * Whether the entity is rolling.
   * ## `"scared"`
   * 
   * Whether the entity is scared.
   * ## `"in-scaffolding"`
   * 
   * Whether the entity is in scaffolding.
   * ## `"over-scaffolding"`
   * 
   * Whether the entity is over scaffolding.
   * ## `"descend-through-block"`
   * 
   * Whether the entity is descending through a block.
   * ## `"blocking"`
   * 
   * Whether the entity is blocking.
   * ## `"transition-blocking"`
   * 
   * Whether the entity is transitioning to blocking.
   * ## `"blocked-using-shield"`
   * 
   * Whether the entity is blocked using a shield.
   * ## `"blocked-using-damaged-shield"`
   * 
   * Whether the entity is blocked using a damaged shield.
   * ## `"sleeping"`
   * 
   * Whether the entity is sleeping.
   * ## `"wants-to-wake"`
   * 
   * Whether the entity wants to wake up.
   * ## `"trade-interest"`
   * 
   * Whether the entity shows interest in trading.
   * ## `"door-breaker"`
   * 
   * Whether the entity can break doors.
   * ## `"breaking-obstruction"`
   * 
   * Whether the entity is breaking an obstruction.
   * ## `"door-opener"`
   * 
   * Whether the entity can open doors.
   * ## `"captain"`
   * 
   * Whether the entity is a captain (raid).
   * ## `"stunned"`
   * 
   * Whether the entity is stunned.
   * ## `"roaring"`
   * 
   * Whether the entity is roaring.
   * ## `"delayed-attack"`
   * 
   * Whether the entity has a delayed attack.
   * ## `"avoiding-mobs"`
   * 
   * Whether the entity is avoiding mobs.
   * ## `"avoiding-block"`
   * 
   * Whether the entity is avoiding a block.
   * ## `"facing-target-to-range-attack"`
   * 
   * Whether the entity is facing a target for a ranged attack.
   * ## `"hidden-when-invisible"`
   * 
   * Whether the entity is hidden when invisible.
   * ## `"in-ui"`
   * 
   * Whether the entity is in a UI.
   * ## `"stalking"`
   * 
   * Whether the entity is stalking.
   * ## `"emoting"`
   * 
   * Whether the entity is emoting.
   * ## `"celebrating"`
   * 
   * Whether the entity is celebrating.
   * ## `"admiring"`
   * 
   * Whether the entity is admiring (piglin).
   * ## `"celebrating-special"`
   * 
   * Whether the entity is celebrating a special event.
   * ## `"out-of-control"`
   * 
   * Whether the entity is out of control.
   * ## `"ram-attack"`
   * 
   * Whether the entity is performing a ram attack.
   * ## `"playing-dead"`
   * 
   * Whether the entity is playing dead.
   * ## `"in-ascending-block"`
   * 
   * Whether the entity is in an ascending block.
   * ## `"over-descending-block"`
   * 
   * Whether the entity is over a descending block.
   * ## `"croaking"`
   * 
   * Whether the entity is croaking (frog).
   * ## `"digest-mob"`
   * 
   * Whether the entity is digesting a mob.
   * ## `"jump-goal"`
   * 
   * Whether the entity has a jump goal.
   * ## `"emerging"`
   * 
   * Whether the entity is emerging.
   * ## `"sniffing"`
   * 
   * Whether the entity is sniffing.
   * ## `"digging"`
   * 
   * Whether the entity is digging.
   * ## `"sonic-boom"`
   * 
   * Whether the entity is performing a sonic boom.
   * ## `"has-dash-timeout"`
   * 
   * Whether the entity has a dash timeout.
   * ## `"push-towards-closest-space"`
   * 
   * Whether the entity is pushed towards the closest space.
   * ## `"scenting"`
   * 
   * Whether the entity is scenting.
   * ## `"rising"`
   * 
   * Whether the entity is rising.
   * ## `"feeling-happy"`
   * 
   * Whether the entity is feeling happy.
   * ## `"searching"`
   * 
   * Whether the entity is searching.
   * ## `"crawling"`
   * 
   * Whether the entity is crawling.
   * ## `"body-rotation-blocked"`
   * 
   * Whether the entity's body rotation is blocked.
   * ## `"render-when-invisible"`
   * 
   * Whether the entity is rendered when invisible.
   * ## `"body-rotation-axis-aligned"`
   * 
   * Whether the entity's body rotation is axis-aligned.
   * ## `"collidable"`
   * 
   * Whether the entity is collidable.
   * ## `"wasd-air-controlled"`
   * 
   * Whether the entity is air-controlled via WASD.
   * ## `"does-server-auth-only-dismount"`
   * 
   * Whether only the server can authorize a dismount.
   * ## `"body-rotation-always-follows-head"`
   * 
   * Whether the body rotation always follows the head.
   * ## `"can-use-vertical-movement-action"`
   * 
   * Whether the entity can use vertical movement actions.
   * ## `"rotation-locked-to-vehicle"`
   * 
   * Whether rotation is locked to the vehicle.
   */
  export type BedrockStatusFlag = 'on-fire' | 'sneaking' | 'riding' | 'sprinting' | 'using-item' | 'invisible' | 'tempted' | 'in-love' | 'saddled' | 'powered' | 'ignited' | 'baby' | 'converting' | 'critical' | 'show-name' | 'always-show-name' | 'no-ai' | 'silent' | 'wall-climbing' | 'climb' | 'swim' | 'fly' | 'walk' | 'resting' | 'sitting' | 'angry' | 'interested' | 'charged' | 'tamed' | 'orphaned' | 'leashed' | 'sheared' | 'gliding' | 'elder' | 'moving' | 'breathing' | 'chested' | 'stackable' | 'show-bottom' | 'standing' | 'shaking' | 'idling' | 'casting' | 'charging' | 'keyboard-controlled' | 'power-jump' | 'dash' | 'lingering' | 'has-collision' | 'has-gravity' | 'fire-immune' | 'dancing' | 'enchanted' | 'return-trident' | 'container-private' | 'transforming' | 'damage-nearby-mobs' | 'swimming' | 'bribed' | 'pregnant' | 'laying-egg' | 'passenger-can-pick' | 'transition-sitting' | 'eating' | 'laying-down' | 'sneezing' | 'trusting' | 'rolling' | 'scared' | 'in-scaffolding' | 'over-scaffolding' | 'descend-through-block' | 'blocking' | 'transition-blocking' | 'blocked-using-shield' | 'blocked-using-damaged-shield' | 'sleeping' | 'wants-to-wake' | 'trade-interest' | 'door-breaker' | 'breaking-obstruction' | 'door-opener' | 'captain' | 'stunned' | 'roaring' | 'delayed-attack' | 'avoiding-mobs' | 'avoiding-block' | 'facing-target-to-range-attack' | 'hidden-when-invisible' | 'in-ui' | 'stalking' | 'emoting' | 'celebrating' | 'admiring' | 'celebrating-special' | 'out-of-control' | 'ram-attack' | 'playing-dead' | 'in-ascending-block' | 'over-descending-block' | 'croaking' | 'digest-mob' | 'jump-goal' | 'emerging' | 'sniffing' | 'digging' | 'sonic-boom' | 'has-dash-timeout' | 'push-towards-closest-space' | 'scenting' | 'rising' | 'feeling-happy' | 'searching' | 'crawling' | 'body-rotation-blocked' | 'render-when-invisible' | 'body-rotation-axis-aligned' | 'collidable' | 'wasd-air-controlled' | 'does-server-auth-only-dismount' | 'body-rotation-always-follows-head' | 'can-use-vertical-movement-action' | 'rotation-locked-to-vehicle';
  /**
   * Represents a specific version of the Minecraft Java Edition protocol.
   * # Variants
   * 
   * ## `"v-1-7-2"`
   * 
   * ## `"v-1-7-6"`
   * 
   * ## `"v-1-8"`
   * 
   * ## `"v-1-9"`
   * 
   * ## `"v-1-9-1"`
   * 
   * ## `"v-1-9-2"`
   * 
   * ## `"v-1-9-3"`
   * 
   * ## `"v-1-10"`
   * 
   * ## `"v-1-11"`
   * 
   * ## `"v-1-11-1"`
   * 
   * ## `"v-1-12"`
   * 
   * ## `"v-1-12-1"`
   * 
   * ## `"v-1-12-2"`
   * 
   * ## `"v-1-13"`
   * 
   * ## `"v-1-13-1"`
   * 
   * ## `"v-1-13-2"`
   * 
   * ## `"v-1-14"`
   * 
   * ## `"v-1-14-1"`
   * 
   * ## `"v-1-14-2"`
   * 
   * ## `"v-1-14-3"`
   * 
   * ## `"v-1-14-4"`
   * 
   * ## `"v-1-15"`
   * 
   * ## `"v-1-15-1"`
   * 
   * ## `"v-1-15-2"`
   * 
   * ## `"v-1-16"`
   * 
   * ## `"v-1-16-1"`
   * 
   * ## `"v-1-16-2"`
   * 
   * ## `"v-1-16-3"`
   * 
   * ## `"v-1-16-4"`
   * 
   * ## `"v-1-17"`
   * 
   * ## `"v-1-17-1"`
   * 
   * ## `"v-1-18"`
   * 
   * ## `"v-1-18-2"`
   * 
   * ## `"v-1-19"`
   * 
   * ## `"v-1-19-1"`
   * 
   * ## `"v-1-19-3"`
   * 
   * ## `"v-1-19-4"`
   * 
   * ## `"v-1-20"`
   * 
   * ## `"v-1-20-2"`
   * 
   * ## `"v-1-20-3"`
   * 
   * ## `"v-1-20-5"`
   * 
   * ## `"v-1-21"`
   * 
   * ## `"v-1-21-2"`
   * 
   * ## `"v-1-21-4"`
   * 
   * ## `"v-1-21-5"`
   * 
   * ## `"v-1-21-6"`
   * 
   * ## `"v-1-21-7"`
   * 
   * ## `"v-1-21-9"`
   * 
   * ## `"v-1-21-11"`
   * 
   * ## `"v-26-1"`
   * 
   * ## `"v-26-2"`
   * 
   * ## `"v-26-3"`
   * 
   * ## `"unknown"`
   */
  export type JavaMinecraftVersion = 'v-1-7-2' | 'v-1-7-6' | 'v-1-8' | 'v-1-9' | 'v-1-9-1' | 'v-1-9-2' | 'v-1-9-3' | 'v-1-10' | 'v-1-11' | 'v-1-11-1' | 'v-1-12' | 'v-1-12-1' | 'v-1-12-2' | 'v-1-13' | 'v-1-13-1' | 'v-1-13-2' | 'v-1-14' | 'v-1-14-1' | 'v-1-14-2' | 'v-1-14-3' | 'v-1-14-4' | 'v-1-15' | 'v-1-15-1' | 'v-1-15-2' | 'v-1-16' | 'v-1-16-1' | 'v-1-16-2' | 'v-1-16-3' | 'v-1-16-4' | 'v-1-17' | 'v-1-17-1' | 'v-1-18' | 'v-1-18-2' | 'v-1-19' | 'v-1-19-1' | 'v-1-19-3' | 'v-1-19-4' | 'v-1-20' | 'v-1-20-2' | 'v-1-20-3' | 'v-1-20-5' | 'v-1-21' | 'v-1-21-2' | 'v-1-21-4' | 'v-1-21-5' | 'v-1-21-6' | 'v-1-21-7' | 'v-1-21-9' | 'v-1-21-11' | 'v-26-1' | 'v-26-2' | 'v-26-3' | 'unknown';
  /**
   * Represents a specific version of the Minecraft Bedrock Edition protocol.
   * # Variants
   * 
   * ## `"v-1-21"`
   * 
   * ## `"v-1-26-30"`
   * 
   * ## `"unknown"`
   */
  export type BedrockMinecraftVersion = 'v-1-21' | 'v-1-26-30' | 'unknown';
  /**
   * The chat visibility settings for a player.
   * # Variants
   * 
   * ## `"enabled"`
   * 
   * Chat is fully enabled.
   * ## `"commands-only"`
   * 
   * Only system messages and commands are shown.
   * ## `"hidden"`
   * 
   * Chat is completely hidden.
   */
  export type ChatMode = 'enabled' | 'commands-only' | 'hidden';
  /**
   * Represents settings for a Java Edition player.
   */
  export interface JavaPlayerSettings {
    /**
     * The player's preferred language (e.g., \"en_us\").
     */
    locale: string,
    /**
     * The maximum distance at which chunks are rendered.
     */
    viewDistance: number,
    /**
     * The player's chat visibility settings.
     */
    chatMode: ChatMode,
    /**
     * Whether chat colors are enabled.
     */
    chatColors: boolean,
    /**
     * The player's skin configuration options.
     */
    skinParts: SkinParts,
    /**
     * The player's dominant hand (left or right).
     */
    mainHand: Hand,
    /**
     * Whether text filtering is enabled.
     */
    textFiltering: boolean,
    /**
     * Whether the player wants to appear in the server list.
     */
    serverListing: boolean,
  }
  /**
   * Represents the operating system of a Bedrock Edition client.
   * # Variants
   * 
   * ## `"android"`
   * 
   * ## `"ios"`
   * 
   * ## `"osx"`
   * 
   * ## `"amazon"`
   * 
   * ## `"gear-vr"`
   * 
   * ## `"holo-lens"`
   * 
   * ## `"windows-10"`
   * 
   * ## `"win-32"`
   * 
   * ## `"dedicated"`
   * 
   * ## `"tv-os"`
   * 
   * ## `"playstation"`
   * 
   * ## `"nintendo"`
   * 
   * ## `"xbox"`
   * 
   * ## `"windows-phone"`
   * 
   * ## `"linux"`
   * 
   * ## `"unknown"`
   * 
   * Fallback for unrecognized operating systems.
   */
  export type BedrockDeviceOs = 'android' | 'ios' | 'osx' | 'amazon' | 'gear-vr' | 'holo-lens' | 'windows-10' | 'win-32' | 'dedicated' | 'tv-os' | 'playstation' | 'nintendo' | 'xbox' | 'windows-phone' | 'linux' | 'unknown';
  /**
   * Represents the input mode used by a Bedrock Edition client.
   * # Variants
   * 
   * ## `"unknown"`
   * 
   * Unknown input mode.
   * ## `"mouse"`
   * 
   * Mouse and keyboard.
   * ## `"touch"`
   * 
   * Touch screen.
   * ## `"game-pad"`
   * 
   * Game controller.
   * ## `"motion-controller"`
   * 
   * Motion-based controller.
   */
  export type BedrockInputMode = 'unknown' | 'mouse' | 'touch' | 'game-pad' | 'motion-controller';
  /**
   * Represents the UI profile used by a Bedrock Edition client.
   * # Variants
   * 
   * ## `"classic"`
   * 
   * Classic desktop UI.
   * ## `"pocket"`
   * 
   * Pocket/Mobile optimized UI.
   * ## `"unknown"`
   * 
   * Unknown UI profile.
   */
  export type BedrockUiProfile = 'classic' | 'pocket' | 'unknown';
  /**
   * Represents the graphics mode used by a Bedrock Edition client.
   * # Variants
   * 
   * ## `"simple"`
   * 
   * ## `"fancy"`
   * 
   * ## `"ray-traced"`
   * 
   * ## `"unknown"`
   */
  export type BedrockGraphicsMode = 'simple' | 'fancy' | 'ray-traced' | 'unknown';
  /**
   * Represents settings and client data for a Bedrock Edition player.
   */
  export interface BedrockPlayerSettings {
    /**
     * The client's specific game version string.
     */
    gameVersion: string,
    /**
     * The operating system of the client device.
     */
    deviceOs: BedrockDeviceOs,
    /**
     * A unique identifier for the client device.
     */
    deviceId: string,
    /**
     * The model name of the client device.
     */
    deviceModel: string,
    /**
     * The player's preferred language code (e.g., \"en_US\").
     */
    languageCode: string,
    /**
     * The input mode currently used by the player.
     */
    currentInputMode: BedrockInputMode,
    /**
     * The default input mode for the client device.
     */
    defaultInputMode: BedrockInputMode,
    /**
     * The UI layout profile used by the client.
     */
    uiProfile: BedrockUiProfile,
    /**
     * The current GUI scale setting.
     */
    guiScale: number,
    /**
     * Whether the player is in Editor mode.
     */
    isEditorMode: boolean,
    /**
     * The maximum view distance the client supports.
     */
    maxViewDistance: number,
    /**
     * The memory tier of the client device (indicates performance level).
     */
    memoryTier: number,
    /**
     * The graphics mode used by the client.
     */
    graphicsMode: BedrockGraphicsMode,
    /**
     * The player's unique PlayFab identifier.
     */
    playfabId: string,
    /**
     * A random 64-bit ID generated by the client.
     */
    clientRandomId: bigint,
    /**
     * Platform-specific offline identifier.
     */
    platformOfflineId: string,
    /**
     * Platform-specific online identifier.
     */
    platformOnlineId: string,
    /**
     * The unique ID of the player's current skin.
     */
    skinId: string,
    /**
     * The model arm size (e.g., \"wide\" or \"slim\").
     */
    armSize: string,
    /**
     * Whether the player is using a Character Creator (Persona) skin.
     */
    isPersonaSkin: boolean,
    /**
     * Whether the skin is a premium (paid) skin.
     */
    isPremiumSkin: boolean,
    /**
     * Whether the skin is from a trusted source.
     */
    isTrustedSkin: boolean,
  }
  /**
   * Protocol-level disconnect reasons for Minecraft Bedrock Edition.
   * # Variants
   * 
   * ## `"unknown"`
   * 
   * ## `"cant-connect-no-internet"`
   * 
   * ## `"no-permissions"`
   * 
   * ## `"unrecoverable-error"`
   * 
   * ## `"third-party-blocked"`
   * 
   * ## `"third-party-no-internet"`
   * 
   * ## `"third-party-bad-ip"`
   * 
   * ## `"third-party-no-server-or-server-locked"`
   * 
   * ## `"version-mismatch"`
   * 
   * ## `"skin-issue"`
   * 
   * ## `"invite-session-not-found"`
   * 
   * ## `"edu-level-settings-missing"`
   * 
   * ## `"local-server-not-found"`
   * 
   * ## `"legacy-disconnect"`
   * 
   * ## `"user-leave-game-attempted"`
   * 
   * ## `"platform-locked-skins-error"`
   * 
   * ## `"realms-world-unassigned"`
   * 
   * ## `"realms-server-cant-connect"`
   * 
   * ## `"realms-server-hidden"`
   * 
   * ## `"realms-server-disabled-beta"`
   * 
   * ## `"realms-server-disabled"`
   * 
   * ## `"cross-platform-disabled"`
   * 
   * ## `"cant-connect"`
   * 
   * ## `"session-not-found"`
   * 
   * ## `"client-settings-incompatible-with-server"`
   * 
   * ## `"server-full"`
   * 
   * ## `"invalid-platform-skin"`
   * 
   * ## `"edition-version-mismatch"`
   * 
   * ## `"edition-mismatch"`
   * 
   * ## `"level-newer-than-exe-version"`
   * 
   * ## `"no-fail-occurred"`
   * 
   * ## `"banned-skin"`
   * 
   * ## `"timeout"`
   * 
   * ## `"server-not-found"`
   * 
   * ## `"outdated-server"`
   * 
   * ## `"outdated-client"`
   * 
   * ## `"no-premium-platform"`
   * 
   * ## `"multiplayer-disabled"`
   * 
   * ## `"no-wifi"`
   * 
   * ## `"world-corruption"`
   * 
   * ## `"no-reason"`
   * 
   * ## `"disconnected"`
   * 
   * ## `"invalid-player"`
   * 
   * ## `"logged-in-other-location"`
   * 
   * ## `"server-id-conflict"`
   * 
   * ## `"not-allowed"`
   * 
   * ## `"not-authenticated"`
   * 
   * ## `"invalid-tenant"`
   * 
   * ## `"unknown-packet"`
   * 
   * ## `"unexpected-packet"`
   * 
   * ## `"invalid-command-request-packet"`
   * 
   * ## `"host-suspended"`
   * 
   * ## `"login-packet-no-request"`
   * 
   * ## `"login-packet-no-cert"`
   * 
   * ## `"missing-client"`
   * 
   * ## `"kicked"`
   * 
   * ## `"kicked-for-exploit"`
   * 
   * ## `"kicked-for-idle"`
   * 
   * ## `"resource-pack-problem"`
   * 
   * ## `"incompatible-pack"`
   * 
   * ## `"out-of-storage"`
   * 
   * ## `"invalid-level"`
   * 
   * ## `"disconnect-packet"`
   * 
   * ## `"block-mismatch"`
   * 
   * ## `"invalid-heights"`
   * 
   * ## `"invalid-widths"`
   * 
   * ## `"connection-lost"`
   * 
   * ## `"zombie-connection"`
   * 
   * ## `"shutdown"`
   * 
   * ## `"reason-not-set"`
   * 
   * ## `"loading-state-timeout"`
   * 
   * ## `"resource-pack-loading-failed"`
   * 
   * ## `"searching-for-session-loading-screen-failed"`
   * 
   * ## `"nether-net-protocol-version"`
   * 
   * ## `"subsystem-status-error"`
   * 
   * ## `"empty-auth-from-discovery"`
   * 
   * ## `"empty-url-from-discovery"`
   * 
   * ## `"expired-auth-from-discovery"`
   * 
   * ## `"unknown-signal-service-sign-in-failure"`
   * 
   * ## `"xbl-join-lobby-failure"`
   * 
   * ## `"unspecified-client-instance-disconnection"`
   * 
   * ## `"nether-net-session-not-found"`
   * 
   * ## `"nether-net-create-peer-connection"`
   * 
   * ## `"nether-net-ice"`
   * 
   * ## `"nether-net-connect-request"`
   * 
   * ## `"nether-net-connect-response"`
   * 
   * ## `"nether-net-negotiation-timeout"`
   * 
   * ## `"nether-net-inactivity-timeout"`
   * 
   * ## `"stale-connection-being-replaced"`
   * 
   * ## `"realms-session-not-found"`
   * 
   * ## `"bad-packet"`
   * 
   * ## `"nether-net-failed-to-create-offer"`
   * 
   * ## `"nether-net-failed-to-create-answer"`
   * 
   * ## `"nether-net-failed-to-set-local-description"`
   * 
   * ## `"nether-net-failed-to-set-remote-description"`
   * 
   * ## `"nether-net-negotiation-timeout-waiting-for-response"`
   * 
   * ## `"nether-net-negotiation-timeout-waiting-for-accept"`
   * 
   * ## `"nether-net-incoming-connection-ignored"`
   * 
   * ## `"nether-net-signaling-parsing-failure"`
   * 
   * ## `"nether-net-signaling-unknown-error"`
   * 
   * ## `"nether-net-signaling-unicast-delivery-failed"`
   * 
   * ## `"nether-net-signaling-broadcast-delivery-failed"`
   * 
   * ## `"nether-net-signaling-generic-delivery-failed"`
   * 
   * ## `"editor-mismatch-editor-world"`
   * 
   * ## `"editor-mismatch-vanilla-world"`
   * 
   * ## `"world-transfer-not-primary-client"`
   * 
   * ## `"request-server-shutdown"`
   * 
   * ## `"client-game-setup-cancelled"`
   * 
   * ## `"client-game-setup-failed"`
   * 
   * ## `"no-venue"`
   * 
   * ## `"nether-net-signaling-signin-failed"`
   * 
   * ## `"session-access-denied"`
   * 
   * ## `"service-signin-issue"`
   * 
   * ## `"nether-net-no-signaling-channel"`
   * 
   * ## `"nether-net-not-logged-in"`
   * 
   * ## `"nether-net-client-signaling-error"`
   * 
   * ## `"sub-client-login-disabled"`
   * 
   * ## `"deep-link-trying-to-open-demo-world-while-signed-in"`
   * 
   * ## `"async-join-task-denied"`
   * 
   * ## `"realms-timeline-required"`
   * 
   * ## `"guest-without-host"`
   * 
   * ## `"failed-to-join-experience"`
   * 
   * ## `"nether-net-data-channel-closed"`
   * 
   * ## `"discovery-environment-mismatch"`
   * 
   * ## `"host-without-keys"`
   * 
   * ## `"host-signed-out"`
   * 
   * ## `"script-watchdog-exception"`
   * 
   * ## `"script-memory-limit-exceeded"`
   * 
   * ## `"storage-low-during-gameplay"`
   * 
   * ## `"storage-full-during-gameplay"`
   * 
   * ## `"level-storage-corruption"`
   * 
   * ## `"edition-mismatch-vanilla-to-edu"`
   * 
   * ## `"edition-mismatch-edu-to-vanilla"`
   * 
   * ## `"editor-mismatch-editor-to-vanilla"`
   * 
   * ## `"editor-mismatch-vanilla-to-editor"`
   * 
   * ## `"deny-listed"`
   * 
   * ## `"nonce-missing"`
   * 
   * ## `"nonce-not-found"`
   * 
   * ## `"nonce-expired"`
   * 
   * ## `"nonce-not-valid"`
   * 
   * ## `"host-disconnected"`
   * 
   * ## `"editor-join-intent-policy-failure"`
   * 
   * ## `"nether-net-identity-not-allowed"`
   * 
   * ## `"invalid-name"`
   * 
   * ## `"expired-token"`
   * 
   * ## `"host-accepts-no-type-of-auth"`
   * 
   * ## `"not-authenticated-fast-fail"`
   * 
   * ## `"editor-not-allowed"`
   */
  export type BedrockDisconnectReason = 'unknown' | 'cant-connect-no-internet' | 'no-permissions' | 'unrecoverable-error' | 'third-party-blocked' | 'third-party-no-internet' | 'third-party-bad-ip' | 'third-party-no-server-or-server-locked' | 'version-mismatch' | 'skin-issue' | 'invite-session-not-found' | 'edu-level-settings-missing' | 'local-server-not-found' | 'legacy-disconnect' | 'user-leave-game-attempted' | 'platform-locked-skins-error' | 'realms-world-unassigned' | 'realms-server-cant-connect' | 'realms-server-hidden' | 'realms-server-disabled-beta' | 'realms-server-disabled' | 'cross-platform-disabled' | 'cant-connect' | 'session-not-found' | 'client-settings-incompatible-with-server' | 'server-full' | 'invalid-platform-skin' | 'edition-version-mismatch' | 'edition-mismatch' | 'level-newer-than-exe-version' | 'no-fail-occurred' | 'banned-skin' | 'timeout' | 'server-not-found' | 'outdated-server' | 'outdated-client' | 'no-premium-platform' | 'multiplayer-disabled' | 'no-wifi' | 'world-corruption' | 'no-reason' | 'disconnected' | 'invalid-player' | 'logged-in-other-location' | 'server-id-conflict' | 'not-allowed' | 'not-authenticated' | 'invalid-tenant' | 'unknown-packet' | 'unexpected-packet' | 'invalid-command-request-packet' | 'host-suspended' | 'login-packet-no-request' | 'login-packet-no-cert' | 'missing-client' | 'kicked' | 'kicked-for-exploit' | 'kicked-for-idle' | 'resource-pack-problem' | 'incompatible-pack' | 'out-of-storage' | 'invalid-level' | 'disconnect-packet' | 'block-mismatch' | 'invalid-heights' | 'invalid-widths' | 'connection-lost' | 'zombie-connection' | 'shutdown' | 'reason-not-set' | 'loading-state-timeout' | 'resource-pack-loading-failed' | 'searching-for-session-loading-screen-failed' | 'nether-net-protocol-version' | 'subsystem-status-error' | 'empty-auth-from-discovery' | 'empty-url-from-discovery' | 'expired-auth-from-discovery' | 'unknown-signal-service-sign-in-failure' | 'xbl-join-lobby-failure' | 'unspecified-client-instance-disconnection' | 'nether-net-session-not-found' | 'nether-net-create-peer-connection' | 'nether-net-ice' | 'nether-net-connect-request' | 'nether-net-connect-response' | 'nether-net-negotiation-timeout' | 'nether-net-inactivity-timeout' | 'stale-connection-being-replaced' | 'realms-session-not-found' | 'bad-packet' | 'nether-net-failed-to-create-offer' | 'nether-net-failed-to-create-answer' | 'nether-net-failed-to-set-local-description' | 'nether-net-failed-to-set-remote-description' | 'nether-net-negotiation-timeout-waiting-for-response' | 'nether-net-negotiation-timeout-waiting-for-accept' | 'nether-net-incoming-connection-ignored' | 'nether-net-signaling-parsing-failure' | 'nether-net-signaling-unknown-error' | 'nether-net-signaling-unicast-delivery-failed' | 'nether-net-signaling-broadcast-delivery-failed' | 'nether-net-signaling-generic-delivery-failed' | 'editor-mismatch-editor-world' | 'editor-mismatch-vanilla-world' | 'world-transfer-not-primary-client' | 'request-server-shutdown' | 'client-game-setup-cancelled' | 'client-game-setup-failed' | 'no-venue' | 'nether-net-signaling-signin-failed' | 'session-access-denied' | 'service-signin-issue' | 'nether-net-no-signaling-channel' | 'nether-net-not-logged-in' | 'nether-net-client-signaling-error' | 'sub-client-login-disabled' | 'deep-link-trying-to-open-demo-world-while-signed-in' | 'async-join-task-denied' | 'realms-timeline-required' | 'guest-without-host' | 'failed-to-join-experience' | 'nether-net-data-channel-closed' | 'discovery-environment-mismatch' | 'host-without-keys' | 'host-signed-out' | 'script-watchdog-exception' | 'script-memory-limit-exceeded' | 'storage-low-during-gameplay' | 'storage-full-during-gameplay' | 'level-storage-corruption' | 'edition-mismatch-vanilla-to-edu' | 'edition-mismatch-edu-to-vanilla' | 'editor-mismatch-editor-to-vanilla' | 'editor-mismatch-vanilla-to-editor' | 'deny-listed' | 'nonce-missing' | 'nonce-not-found' | 'nonce-expired' | 'nonce-not-valid' | 'host-disconnected' | 'editor-join-intent-policy-failure' | 'nether-net-identity-not-allowed' | 'invalid-name' | 'expired-token' | 'host-accepts-no-type-of-auth' | 'not-authenticated-fast-fail' | 'editor-not-allowed';
  /**
   * Policy for tearing down the player's network connection.
   * # Variants
   * 
   * ## `"graceful"`
   * 
   * Send the disconnect packet and gracefully close the connection.
   * ## `"immediate-close"`
   * 
   * Send the disconnect packet and close the socket immediately.
   * ## `"drop-connection"`
   * 
   * Terminate the connection immediately without sending any disconnect packet.
   */
  export type SocketTeardownPolicy = 'graceful' | 'immediate-close' | 'drop-connection';
  /**
   * Options for disconnecting a Java Edition player.
   */
  export interface JavaKickOptions {
    /**
     * The formatted text component displayed on the Java disconnect screen.
     */
    reason: TextComponent,
    /**
     * Whether to log the kick in the server console (default: true).
     */
    logToConsole: boolean,
    /**
     * How the connection is closed (default: graceful).
     */
    teardownPolicy: SocketTeardownPolicy,
  }
  /**
   * Options for disconnecting a Bedrock Edition player.
   */
  export interface BedrockKickOptions {
    /**
     * Protocol level disconnect code (default: kicked).
     */
    reason: BedrockDisconnectReason,
    /**
     * Message displayed on the Bedrock disconnect screen (default: "").
     */
    message: string,
    /**
     * Whether to suppress the disconnect message on the client screen (default: false).
     */
    skipMessage: boolean,
    /**
     * Filtered message string for safety/parental filters (default: "").
     */
    filteredMessage: string,
    /**
     * Whether to log the kick in the server console (default: true).
     */
    logToConsole: boolean,
    /**
     * How the connection is closed (default: graceful).
     */
    teardownPolicy: SocketTeardownPolicy,
  }
  /**
   * Options for banning a player.
   */
  export interface BanPlayerOptions {
    /**
     * Ban reason displayed to the player and stored in the ban list.
     */
    reason?: TextComponent,
    /**
     * Source or authority responsible for the ban (default: "Plugin").
     */
    source?: string,
    /**
     * Ban expiration in RFC-3339 format, if temporary.
     */
    expiresAtUtc?: string,
    /**
     * Ban duration in seconds from now, if temporary.
     */
    durationSeconds?: bigint,
    /**
     * Whether to immediately kick the player if currently online (default: true).
     */
    kickIfOnline: boolean,
    /**
     * Whether to log the ban action to the server console (default: true).
     */
    logToConsole: boolean,
  }
  /**
   * Options for banning an IP address.
   */
  export interface BanIpOptions {
    /**
     * Ban reason stored in the IP ban list.
     */
    reason?: TextComponent,
    /**
     * Source or authority responsible for the ban (default: "Plugin").
     */
    source?: string,
    /**
     * Ban expiration in RFC-3339 format, if temporary.
     */
    expiresAtUtc?: string,
    /**
     * Ban duration in seconds from now, if temporary.
     */
    durationSeconds?: bigint,
    /**
     * Whether to immediately kick all online players with this IP (default: true).
     */
    kickMatchingPlayers: boolean,
    /**
     * Whether to log the IP ban action to the server console (default: true).
     */
    logToConsole: boolean,
  }
  /**
   * Represents a resource pack sent to a Java Edition player.
   */
  export interface JavaResourcePack {
    /**
     * Unique identifier for the resource pack.
     */
    id: Uuid,
    /**
     * The URL to the resource pack file.
     */
    url: string,
    /**
     * The SHA1 hash (40-character hex string) of the pack.
     */
    hash: string,
    /**
     * Whether the player is forced to accept the pack.
     */
    forced: boolean,
    /**
     * Optional prompt message displayed in the pack acceptance screen.
     */
    promptMessage?: TextComponent,
  }
  /**
   * Represents an individual Bedrock Edition resource pack entry.
   */
  export interface BedrockResourcePackEntry {
    /**
     * Unique identifier for the Bedrock pack.
     */
    id: Uuid,
    /**
     * Version string of the Bedrock pack (e.g., "1.0.0").
     */
    version: string,
    /**
     * Size of the pack in bytes.
     */
    size: bigint,
    /**
     * Download URL for remote Bedrock packs.
     */
    downloadUrl: string,
    /**
     * Optional encryption content key for encrypted packs.
     */
    contentKey?: string,
    /**
     * Optional sub-pack name inside the archive.
     */
    subPackName?: string,
    /**
     * Optional content identifier.
     */
    contentId?: string,
    /**
     * Whether the pack contains client scripts.
     */
    hasScripts: boolean,
    /**
     * Whether the pack is marked as an addon pack.
     */
    addonPack: boolean,
    /**
     * Whether Ray Tracing / RTX features are enabled for the pack.
     */
    rtxEnabled: boolean,
  }
  /**
   * Represents the resource packs information payload sent to Bedrock clients.
   */
  export interface BedrockResourcePacksInfo {
    /**
     * If true, players cannot join without accepting packs.
     */
    required: boolean,
    /**
     * Whether the server offers addon packs.
     */
    hasAddonPacks: boolean,
    /**
     * Whether any of the packs contain client scripts.
     */
    hasScripts: boolean,
    /**
     * Whether vibrant visuals should be forced disabled.
     */
    isVibrantVisualsForceDisabled: boolean,
    /**
     * World template ID, if any.
     */
    worldTemplateId?: Uuid,
    /**
     * World template version, if any.
     */
    worldTemplateVersion?: string,
    /**
     * List of resource packs to send to the player.
     */
    packs: Array<BedrockResourcePackEntry>,
  }
  
  export class BedrockPlayer implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Returns the Minecraft Bedrock Edition version of the player.
    */
    getVersion(): BedrockMinecraftVersion;
    /**
    * Returns the player's configuration settings.
    */
    getSettings(): BedrockPlayerSettings;
    /**
    * Returns whether a specific Bedrock-only ability is enabled for the player.
    */
    getAbility(ability: BedrockAbility): boolean;
    /**
    * Sets whether a specific Bedrock-only ability is enabled for the player.
    */
    setAbility(ability: BedrockAbility, value: boolean): void;
    /**
    * Returns whether a specific Bedrock-only status flag is enabled for the player.
    * 
    * Status flags control things like whether the player is on fire, sneaking,
    * sprinting, or has specific visual effects.
    */
    getStatusFlag(flag: BedrockStatusFlag): boolean;
    /**
    * Sets whether a specific Bedrock-only status flag is enabled for the player.
    * 
    * This can be used to manually trigger client-side visual states.
    */
    setStatusFlag(flag: BedrockStatusFlag, value: boolean): void;
    /**
    * Sends a Bedrock-specific clientbound packet to the player.
    */
    sendPacket(packet: BedrockPacket): void;
    /**
    * Opens a Bedrock custom form for the player.
    */
    openForm(form: Form): number;
    /**
    * Returns the Bedrock scoreboard handle for this player.
    */
    getScoreboard(): BedrockScoreboard;
    /**
    * Resets the player's custom Bedrock scoreboard back to the world scoreboard.
    */
    resetScoreboard(): void;
    /**
    * Sends resource packs information to the Bedrock player.
    */
    sendResourcePacksInfo(info: BedrockResourcePacksInfo): void;
    /**
    * Kicks the Bedrock player with the specified options.
    */
    kick(options: BedrockKickOptions): void;
    [Symbol.dispose](): void;
  }
  
  export class JavaPlayer implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Returns the Minecraft Java Edition version of the player.
    */
    getVersion(): JavaMinecraftVersion;
    /**
    * Returns the brand of the player's client (e.g., \"vanilla\", \"fabric\").
    */
    getBrand(): string;
    /**
    * Returns the server address the player used to connect.
    */
    getServerAddress(): string;
    /**
    * Returns the player's configuration settings.
    */
    getSettings(): JavaPlayerSettings;
    /**
    * Sends a Java-specific clientbound packet to the player.
    */
    sendPacket(packet: JavaPacket): void;
    /**
    * Sends a custom payload packet (plugin message) to the player.
    */
    sendCustomPayload(channel: string, data: Uint8Array): void;
    /**
    * Shows a dialog to the player.
    */
    showDialog(dialog: Dialog): void;
    /**
    * Clears any currently shown dialog for the player.
    */
    clearDialog(): void;
    /**
    * Returns the Java scoreboard handle for this player.
    */
    getScoreboard(): Scoreboard;
    /**
    * Resets the player's custom Java scoreboard back to the world scoreboard.
    */
    resetScoreboard(): void;
    /**
    * Sends a resource pack to the Java player.
    */
    sendResourcePack(pack: JavaResourcePack): void;
    /**
    * Removes a specific resource pack by UUID for the Java player.
    */
    removeResourcePack(id: Uuid): void;
    /**
    * Clears all custom resource packs for the Java player.
    */
    clearResourcePacks(): void;
    /**
    * Kicks the Java player with the specified options.
    */
    kick(options: JavaKickOptions): void;
    /**
    * Sends a clientbound GameEvent packet to the Java player.
    */
    sendGameEvent(event: ClientGameEvent, value: number): void;
    /**
    * Sends an entity status / animation event packet to the Java player for a specific entity ID.
    */
    sendEntityStatus(entityId: number, status: EntityStatus): void;
    [Symbol.dispose](): void;
  }
  
  export class Player implements Disposable {
    /**
     * This type does not have a public constructor.
     */
    private constructor();
    /**
    * Returns the player as an entity.
    */
    asEntity(): Entity;
    /**
    * Returns the player's unique UUID as a string.
    */
    getId(): Uuid;
    /**
    * Returns the player's username.
    */
    getName(): string;
    /**
    * Basic state
    * Returns the player's current position in the world.
    */
    getPosition(): Position;
    /**
    * Returns the player's current yaw (horizontal rotation).
    */
    getYaw(): number;
    /**
    * Returns the player's current pitch (vertical rotation).
    */
    getPitch(): number;
    /**
    * Returns the world the player is currently in.
    */
    getWorld(): World;
    /**
    * Returns the player's current game mode.
    */
    getGamemode(): GameMode;
    /**
    * Changes the player's game mode. Returns true if successful.
    */
    setGamemode(mode: GameMode): boolean;
    /**
    * Returns the player's locale (e.g., \"en_us\").
    */
    getLocale(): string;
    /**
    * Returns the player's current ping in milliseconds.
    */
    getPing(): number;
    /**
    * Permissions & metadata
    * Returns the player's permission level (0-4).
    */
    getPermissionLevel(): PermissionLevel;
    /**
    * Sets the player's permission level.
    */
    setPermissionLevel(level: PermissionLevel): void;
    /**
    * Grants or denies a specific permission node for the player.
    */
    setPermission(node: string, value: boolean): void;
    /**
    * Removes an explicitly set permission node from the player.
    */
    unsetPermission(node: string): void;
    /**
    * Returns `Some(true)` if granted, `Some(false)` if denied, or `None` if not set.
    */
    hasPermissionSet(node: string): boolean | undefined;
    /**
    * Checks if the player has a specific permission node.
    */
    hasPermission(node: string): boolean;
    /**
    * Returns the player's display name, which may include formatting.
    */
    getDisplayName(): TextComponent;
    /**
    * Sets the player's display name.
    */
    setDisplayName(displayName: TextComponent): void;
    /**
    * Gets the player's custom tab list name.
    */
    getTabListName(): TextComponent | undefined;
    /**
    * Sets the player's custom tab list name.
    */
    setTabListName(name: TextComponent | undefined): void;
    /**
    * Messaging & titles
    * Sends a system message to the player's chat.
    */
    sendSystemMessage(text: TextComponent, overlay: boolean): void;
    /**
    * Deletes a signed chat message from the player's chat window using its 256-byte signature.
    */
    deleteMessageBySignature(signature: Uint8Array): void;
    /**
    * Deletes a signed chat message from the player's chat window using its signature cache ID.
    */
    deleteMessageById(signatureId: number): void;
    /**
    * Sets the header and footer of the player's Tab list.
    */
    setTabListHeaderFooter(header: TextComponent, footer: TextComponent): void;
    /**
    * Sets the sorting order of the player in the Tab list.
    */
    setTabListOrder(order: number): void;
    /**
    * Sets the latency (ping) shown for the player in the Tab list.
    */
    setTabListLatency(latency: number): void;
    /**
    * Sets whether the player is visible in the Tab list.
    */
    setTabListListed(listed: boolean): void;
    /**
    * Shows a large title on the player's screen.
    */
    showTitle(text: TextComponent): void;
    /**
    * Shows a smaller subtitle on the player's screen.
    */
    showSubtitle(text: TextComponent): void;
    /**
    * Shows a message in the action bar area.
    */
    showActionbar(text: TextComponent): void;
    /**
    * Sets the fade-in, stay, and fade-out times for titles.
    */
    sendTitleAnimation(fadeIn: number, stay: number, fadeOut: number): void;
    /**
    * Camera & Spectating
    * Sets the player's camera to view from the perspective of another entity.
    * If `entity` is `none`, the camera is reset back to the player.
    */
    setCamera(entity: Entity | undefined): void;
    /**
    * Sets the player's camera to view from the perspective of an entity with the given entity ID.
    * If `entity-id` is the player's own entity ID, the camera is reset back to the player.
    */
    setCameraEntityId(entityId: number): void;
    /**
    * Gets the entity ID of the entity that the player's camera is currently attached to,
    * or the player's own entity ID if the camera has not been overridden.
    */
    getCameraEntityId(): number;
    /**
    * Resets the player's camera back to their own perspective.
    */
    resetCamera(): void;
    /**
    * Audio & Particles
    * Plays a sound effect for this player at their current location.
    */
    playSound(sound: Sound, category: SoundCategory, volume: number, pitch: number): void;
    /**
    * Plays a sound effect for this player at a specific location.
    */
    playSoundAt(pos: Position, sound: Sound, category: SoundCategory, volume: number, pitch: number): void;
    /**
    * Stops a sound effect from playing for this player.
    */
    stopSound(sound: Sound | undefined, category: SoundCategory | undefined): void;
    /**
    * Plays a custom resource pack sound identifier for this player at their current location.
    */
    playCustomSound(soundName: string, category: SoundCategory, volume: number, pitch: number): void;
    /**
    * Plays a custom resource pack sound identifier for this player at a specific location.
    */
    playCustomSoundAt(pos: Position, soundName: string, category: SoundCategory, volume: number, pitch: number): void;
    /**
    * Stops a custom sound identifier from playing for this player.
    */
    stopCustomSound(soundName: string | undefined, category: SoundCategory | undefined): void;
    /**
    * Spawns particles visible only to this player.
    */
    spawnParticles(particle: Particle, pos: Position, count: number, offset: Position, maxSpeed: number): void;
    /**
    * Visuals & Client Overrides
    * Sends a temporary fake block change to the player's client without modifying the server world.
    */
    sendBlockChange(pos: BlockPos, blockId: number): void;
    /**
    * Resets a temporary fake block change by resending the actual world block at that position.
    */
    resetBlockChange(pos: BlockPos): void;
    /**
    * Sends a hurt / damage-tilt animation to the player's client (causes screen shake in the given yaw direction).
    */
    sendHurtAnimation(yaw: number): void;
    /**
    * Opens a written book interface for the player from the specified hand.
    */
    openBook(hand: Hand): void;
    /**
    * Forces the sign text editor to open for the player at the specified sign block position.
    */
    openSignEditor(pos: BlockPos, isFrontText: boolean): void;
    /**
    * Velocity & Physics
    * Sets the player's velocity / motion vector.
    */
    setVelocity(velocity: Position): void;
    /**
    * Applies directional knockback impulse to the player.
    */
    applyKnockback(strength: number, x: number, z: number): void;
    /**
    * Movement Lock & Freezing
    * Sets whether the player's movement is locked (frozen in place) for cutscenes and NPC dialogues.
    */
    setMovementLocked(locked: boolean): void;
    /**
    * Returns whether the player's movement is currently locked.
    */
    isMovementLocked(): boolean;
    /**
    * Sets the number of freeze ticks on the player (controlling the powdered snow / frostbite screen vignette).
    */
    setFreezeTicks(ticks: number): void;
    /**
    * Returns the current number of freeze ticks on the player.
    */
    getFreezeTicks(): number;
    /**
    * Sends custom server links to the player (displayed in the client Esc pause menu in 1.21+).
    */
    setServerLinks(links: Array<ServerLink>): void;
    /**
    * Teleport & kick
    * Teleports the player to a position in a world.
    */
    teleport(position: Position, yaw: number | undefined, pitch: number | undefined, world: World): void;
    /**
    * Teleports the player to another world at a specific position.
    */
    teleportWorld(worldRef: World, position: Position, yaw: number | undefined, pitch: number | undefined): void;
    /**
    * Forces the player to respawn.
    */
    respawn(): void;
    /**
    * Opens a GUI for the player.
    */
    openGui(guiRef: Gui): void;
    /**
    * Closes the screen (chest, GUI, ...) the player has open.
    */
    closeScreen(): void;
    /**
    * Sends the player's inventory and cursor to the client again (after a cancelled click).
    */
    syncInventory(): void;
    /**
    * Bans the player with the specified options.
    */
    ban(options: BanPlayerOptions): void;
    /**
    * Bans the player's IP address with the specified options.
    */
    banIp(options: BanIpOptions): void;
    /**
    * Transfers the player to another server.
    */
    transfer(host: string, port: number): void;
    /**
    * Status Effects
    * Gives a status effect to the player.
    */
    addEffect(effect: StatusEffectInstance): void;
    /**
    * Removes a status effect from the player.
    */
    removeEffect(effect: StatusEffectType): void;
    /**
    * Clears all active status effects from the player.
    */
    clearEffects(): void;
    /**
    * Checks if a status effect is currently applied to the player.
    */
    hasEffect(effect: StatusEffectType): boolean;
    /**
    * Returns the status effect instance applied to the player, if any.
    */
    getEffect(effect: StatusEffectType): StatusEffectInstance | undefined;
    /**
    * Returns all status effects currently applied to the player.
    */
    getActiveEffects(): Array<StatusEffectInstance>;
    /**
    * Health & Damage
    * Heals the player by a specified amount.
    */
    heal(amount: number): void;
    /**
    * Deals damage to the player by a specified amount with a damage type.
    */
    damage(amount: number, damageType: DamageType): void;
    /**
    * Kills the player instantly.
    */
    kill(): void;
    /**
    * Statistics
    * Gets the value of a statistic for this player in the given category and ID.
    */
    getStatistic(category: StatisticCategory, statId: number): number;
    /**
    * Sets the value of a statistic for this player in the given category and ID.
    */
    setStatistic(category: StatisticCategory, statId: number, value: number): void;
    /**
    * Increments the value of a statistic for this player in the given category and ID.
    */
    incrementStatistic(category: StatisticCategory, statId: number, amount: number): void;
    /**
    * Gets the value of a custom statistic for this player.
    */
    getCustomStatistic(stat: CustomStatistic): number;
    /**
    * Sets the value of a custom statistic for this player.
    */
    setCustomStatistic(stat: CustomStatistic, value: number): void;
    /**
    * Increments the value of a custom statistic for this player.
    */
    incrementCustomStatistic(stat: CustomStatistic, amount: number): void;
    /**
    * Sends the player's updated statistics packet to the client.
    */
    sendStats(): void;
    /**
    * Gets the team name that this player belongs to on their active scoreboard, if any.
    */
    getTeam(): string | undefined;
    /**
    * Cooldowns
    * Starts an item cooldown for a specific item group name.
    */
    startCooldown(group: string, durationTicks: number): void;
    /**
    * Returns the cooldown progress (0.0 to 1.0) for a specific item group.
    */
    getCooldown(group: string): number;
    /**
    * Checks if a specific item group is currently on cooldown.
    */
    isOnCooldown(group: string): boolean;
    /**
    * Abilities & Flight
    * Sets whether the player is allowed to fly.
    */
    setAllowFlight(allowed: boolean): void;
    /**
    * Sets the player's flying speed.
    */
    setFlySpeed(speed: number): void;
    /**
    * Sets the player's walking speed.
    */
    setWalkSpeed(speed: number): void;
    /**
    * Sets whether the player is invulnerable to damage.
    */
    setInvulnerable(invulnerable: boolean): void;
    /**
    * Inventory
    * Returns the player's inventory handle for managing main storage, armor, and equipment.
    */
    getInventory(): PlayerInventory;
    /**
    * Returns the player's ender chest inventory handle.
    */
    getEnderChest(): Inventory;
    /**
    * Returns the index of the currently selected hotbar slot (0-8).
    */
    getSelectedSlot(): number;
    /**
    * Returns the item currently in the specified hand.
    */
    getItemInHand(hand: Hand): ItemStack | undefined;
    /**
    * Returns the item in the specified inventory slot.
    */
    getInventoryItem(slot: number): ItemStack | undefined;
    /**
    * Sets the item in the specified hand.
    */
    setItemInHand(hand: Hand, stack: ItemStack | undefined): void;
    /**
    * Sets the item in the specified inventory slot.
    */
    setInventoryItem(slot: number, stack: ItemStack | undefined): void;
    /**
    * Ender Chest Inventory
    * Returns the item in the specified ender chest slot (0-26).
    */
    getEnderChestItem(slot: number): ItemStack | undefined;
    /**
    * Sets the item in the specified ender chest slot (0-26).
    */
    setEnderChestItem(slot: number, stack: ItemStack | undefined): void;
    /**
    * Clears all items from the player's ender chest.
    */
    clearEnderChest(): void;
    /**
    * Opens the player's ender chest inventory screen for them.
    */
    openEnderChest(): void;
    /**
    * Status
    * Returns the player's current health.
    */
    getHealth(): number;
    /**
    * Sets the player's current health.
    */
    setHealth(health: number): void;
    /**
    * Returns the player's maximum health.
    */
    getMaxHealth(): number;
    /**
    * Sets the player's maximum health.
    */
    setMaxHealth(maxHealth: number): void;
    /**
    * Returns the player's food level (0-20).
    */
    getFoodLevel(): number;
    /**
    * Sets the player's food level.
    */
    setFoodLevel(foodLevel: number): void;
    /**
    * Returns the player's food saturation level.
    */
    getSaturation(): number;
    /**
    * Sets the player's food saturation level.
    */
    setSaturation(saturation: number): void;
    /**
    * Returns the player's food exhaustion level.
    */
    getExhaustion(): number;
    /**
    * Sets the player's food exhaustion level.
    */
    setExhaustion(exhaustion: number): void;
    /**
    * Returns the player's current absorption amount.
    */
    getAbsorption(): number;
    /**
    * Sets the player's current absorption amount.
    */
    setAbsorption(absorption: number): void;
    /**
    * Returns the player's total experience level.
    */
    getExperienceLevel(): number;
    /**
    * Returns the player's progress toward the next level (0.0 to 1.0).
    */
    getExperienceProgress(): number;
    /**
    * Returns the total experience points the player has.
    */
    getExperiencePoints(): number;
    /**
    * Sets the player's total experience level.
    */
    setExperienceLevel(level: number): void;
    /**
    * Sets the player's progress toward the next level.
    */
    setExperienceProgress(progress: number): void;
    /**
    * Sets the player's total experience points.
    */
    setExperiencePoints(points: number): void;
    /**
    * Adds experience levels to the player.
    */
    addExperienceLevels(levels: number): void;
    /**
    * Adds experience points to the player.
    */
    addExperiencePoints(points: number): void;
    /**
    * Returns whether the player is currently flying.
    */
    isFlying(): boolean;
    /**
    * Sets whether the player should be flying.
    */
    setFlying(flying: boolean): void;
    /**
    * Returns the player's current abilities.
    */
    getAbilities(): PlayerAbilities;
    /**
    * Updates the player's abilities.
    */
    setAbilities(abilities: PlayerAbilities): void;
    /**
    * Returns the player's IP address.
    */
    getIp(): string;
    /**
    * Returns the player's current skin textures.
    */
    getSkin(): PlayerSkin | undefined;
    /**
    * Updates the player's skin textures.
    * Note: this only updates the fields, it doesn't reload the skin.
    */
    setSkin(skin: PlayerSkin): void;
    /**
    * Returns which skin parts are visible.
    */
    getSkinParts(): SkinParts;
    /**
    * Sets which skin parts are visible.
    */
    setSkinParts(parts: SkinParts): void;
    /**
    * Per-Player Environment & Overrides
    * Overrides the time of day shown to this player.
    */
    setPlayerTime(time: bigint, relative: boolean): void;
    /**
    * Resets the player's time to sync with the server world time.
    */
    resetPlayerTime(): void;
    /**
    * Returns the custom time set for this player, if any.
    */
    getPlayerTime(): bigint | undefined;
    /**
    * Checks if the custom player time is relative to the world time.
    */
    isPlayerTimeRelative(): boolean;
    /**
    * Overrides the weather condition shown to this player.
    */
    setPlayerWeather(weather: PlayerWeather): void;
    /**
    * Resets the player's weather to match the server world weather.
    */
    resetPlayerWeather(): void;
    /**
    * Returns the custom weather set for this player, if any.
    */
    getPlayerWeather(): PlayerWeather | undefined;
    /**
    * Sets the position where the player's compass points.
    */
    setCompassTarget(pos: Position): void;
    /**
    * Returns the position where the player's compass currently points.
    */
    getCompassTarget(): Position;
    /**
    * Sets the player's custom respawn / bed location.
    */
    setRespawnLocation(pos: Position): void;
    /**
    * Returns the player's custom respawn / bed location, if set.
    */
    getRespawnLocation(): Position | undefined;
    /**
    * Hides another player from this player's view (vanish).
    */
    hidePlayer(other: Player): void;
    /**
    * Shows a previously hidden player to this player.
    */
    showPlayer(other: Player): void;
    /**
    * Checks if this player can see another specified player.
    */
    canSee(other: Player): boolean;
    /**
    * Checks if this player can see another specified player.
    */
    canSeePlayer(other: Player): boolean;
    /**
    * Sets the tab list ping / latency indicator in milliseconds.
    */
    setTabListPing(latencyMs: number): void;
    /**
    * Sets a client-side item cooldown overlay.
    */
    setItemCooldown(itemId: string, ticks: number): void;
    /**
    * Returns the remaining cooldown ticks for an item, if active.
    */
    getItemCooldown(itemId: string): number | undefined;
    /**
    * Checks if an item is currently on cooldown.
    */
    hasItemCooldown(itemId: string): boolean;
    /**
    * Performs a ray-trace from the player's eye position in looking direction to find the targeted block.
    */
    rayTraceBlock(maxDistance: number, includeFluids: boolean): RayTraceBlockResult | undefined;
    /**
    * Performs a ray-trace from the player's eye position in looking direction to find the targeted entity.
    */
    rayTraceEntity(maxDistance: number): RayTraceEntityResult | undefined;
    /**
    * Returns the entity currently targeted in the looking direction within the specified distance.
    */
    getTargetEntity(maxDistance: number): Entity | undefined;
    /**
    * Raycasts from the player's eyes to find the block being targeted.
    */
    getTargetBlock(maxDistance: number): Position | undefined;
    /**
    * Performs a raycast from the player's eyes to find the exact block and face being targeted.
    */
    getTargetBlockExact(maxDistance: number, includeFluids: boolean): RayTraceBlockResult | undefined;
    /**
    * Launches a projectile from the player's eyes in their line of sight.
    */
    launchProjectile(type: ProjectileType): Entity | undefined;
    /**
    * Advancements
    * Returns the progress of the specified advancement for this player, if the advancement exists.
    */
    getAdvancementProgress(advancementId: string): AdvancementProgress | undefined;
    /**
    * Awards a specific criterion of an advancement to the player.
    * Returns true if the criterion was successfully awarded (was not already completed).
    */
    awardAdvancementCriterion(advancementId: string, criterion: string): boolean;
    /**
    * Revokes a specific criterion of an advancement from the player.
    * Returns true if the criterion was successfully revoked (was previously completed).
    */
    revokeAdvancementCriterion(advancementId: string, criterion: string): boolean;
    /**
    * Awards all criteria of the specified advancement to the player.
    * Returns true if any criterion was newly awarded.
    */
    awardAdvancement(advancementId: string): boolean;
    /**
    * Revokes all criteria of the specified advancement from the player.
    * Returns true if any criterion was newly revoked.
    */
    revokeAdvancement(advancementId: string): boolean;
    /**
    * Checks whether the player has completed the specified advancement.
    */
    hasAdvancement(advancementId: string): boolean;
    /**
    * Returns a list of all advancement IDs completed by this player.
    */
    getCompletedAdvancements(): Array<string>;
    /**
    * Returns the ID of the currently selected advancement tab for this player, if any.
    */
    getSelectedAdvancementTab(): string | undefined;
    /**
    * Sets the selected advancement tab for this player (must be a root advancement ID).
    */
    setSelectedAdvancementTab(tabId: string | undefined): void;
    /**
    * Returns a Java-specific player handle, if the player is connected via Java Edition.
    * 
    * This allows access to Java-exclusive features like sending specific packets
    * or retrieving the client brand.
    */
    asJava(): JavaPlayer | undefined;
    /**
    * Returns a Bedrock-specific player handle, if the player is connected via Bedrock Edition.
    * 
    * This allows access to Bedrock-exclusive features like custom forms
    * or detailed device information.
    */
    asBedrock(): BedrockPlayer | undefined;
    [Symbol.dispose](): void;
  }
}
