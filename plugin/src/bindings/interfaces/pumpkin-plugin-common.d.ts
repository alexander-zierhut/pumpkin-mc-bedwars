declare module 'pumpkin:plugin/common@0.1.0' {
  /**
   * Serialized text component as a postcard byte array.
   * @deprecated Use the text-component resource from the text interface instead.
   */
  export type RawTextComponent = Uint8Array;
  /**
   * Represents one entry in an NBT compound tag.
   */
  export interface NbtEntry {
    key: string,
    value: number,
  }
  /**
   * Represents a Minecraft NBT tag.
   */
  export type NbtTag = NbtTagByte | NbtTagShort | NbtTagInt | NbtTagLong | NbtTagFloat | NbtTagDouble | NbtTagByteArray | NbtTagStringTag | NbtTagListTag | NbtTagCompound | NbtTagIntArray | NbtTagLongArray;
  export interface NbtTagByte {
    tag: 'byte',
    val: number,
  }
  export interface NbtTagShort {
    tag: 'short',
    val: number,
  }
  export interface NbtTagInt {
    tag: 'int',
    val: number,
  }
  export interface NbtTagLong {
    tag: 'long',
    val: bigint,
  }
  export interface NbtTagFloat {
    tag: 'float',
    val: number,
  }
  export interface NbtTagDouble {
    tag: 'double',
    val: number,
  }
  export interface NbtTagByteArray {
    tag: 'byte-array',
    val: Int8Array,
  }
  export interface NbtTagStringTag {
    tag: 'string-tag',
    val: string,
  }
  export interface NbtTagListTag {
    tag: 'list-tag',
    val: Uint32Array,
  }
  export interface NbtTagCompound {
    tag: 'compound',
    val: Array<NbtEntry>,
  }
  export interface NbtTagIntArray {
    tag: 'int-array',
    val: Int32Array,
  }
  export interface NbtTagLongArray {
    tag: 'long-array',
    val: BigInt64Array,
  }
  /**
   * Represents a Minecraft NBT tag tree.
   */
  export interface NbtTree {
    root: number,
    tags: Array<NbtTag>,
  }
  /**
   * A position in the world grid (integers).
   */
  export interface BlockPos {
    x: number,
    y: number,
    z: number,
  }
  /**
   * A precise coordinate in the world (floats).
   */
  export type Position = [number, number, number];
  /**
   * Represents the hands of a player.
   * # Variants
   * 
   * ## `"left"`
   * 
   * ## `"right"`
   */
  export type Hand = 'left' | 'right';
  /**
   * Represents the game modes available in Minecraft.
   * # Variants
   * 
   * ## `"survival"`
   * 
   * ## `"creative"`
   * 
   * ## `"adventure"`
   * 
   * ## `"spectator"`
   */
  export type GameMode = 'survival' | 'creative' | 'adventure' | 'spectator';
  /**
   * The 16 base Minecraft colors.
   * # Variants
   * 
   * ## `"black"`
   * 
   * ## `"dark-blue"`
   * 
   * ## `"dark-green"`
   * 
   * ## `"dark-aqua"`
   * 
   * ## `"dark-red"`
   * 
   * ## `"dark-purple"`
   * 
   * ## `"gold"`
   * 
   * ## `"gray"`
   * 
   * ## `"dark-gray"`
   * 
   * ## `"blue"`
   * 
   * ## `"green"`
   * 
   * ## `"aqua"`
   * 
   * ## `"red"`
   * 
   * ## `"light-purple"`
   * 
   * ## `"yellow"`
   * 
   * ## `"white"`
   */
  export type NamedColor = 'black' | 'dark-blue' | 'dark-green' | 'dark-aqua' | 'dark-red' | 'dark-purple' | 'gold' | 'gray' | 'dark-gray' | 'blue' | 'green' | 'aqua' | 'red' | 'light-purple' | 'yellow' | 'white';
  /**
   * An RGB color represented by its red, green, and blue components.
   */
  export interface RgbColor {
    r: number,
    g: number,
    b: number,
  }
  /**
   * An ARGB color with alpha (transparency) channel.
   */
  export interface ArgbColor {
    a: number,
    r: number,
    g: number,
    b: number,
  }
  /**
   * Represents the type of click interaction in a GUI.
   * # Variants
   * 
   * ## `"left"`
   * 
   * ## `"right"`
   * 
   * ## `"shift-left"`
   * 
   * ## `"shift-right"`
   * 
   * ## `"middle"`
   * 
   * ## `"drop"`
   * 
   * ## `"control-drop"`
   * 
   * ## `"double-click"`
   * 
   * ## `"number-key"`
   * 
   * ## `"unknown"`
   */
  export type ClickType = 'left' | 'right' | 'shift-left' | 'shift-right' | 'middle' | 'drop' | 'control-drop' | 'double-click' | 'number-key' | 'unknown';
  /**
   * Represents the various poses an entity can be in.
   * # Variants
   * 
   * ## `"standing"`
   * 
   * ## `"fall-flying"`
   * 
   * ## `"sleeping"`
   * 
   * ## `"swimming"`
   * 
   * ## `"spin-attack"`
   * 
   * ## `"crouching"`
   * 
   * ## `"long-jumping"`
   * 
   * ## `"dying"`
   * 
   * ## `"croaking"`
   * 
   * ## `"using-tongue"`
   * 
   * ## `"sitting"`
   * 
   * ## `"roaring"`
   * 
   * ## `"sniffing"`
   * 
   * ## `"emerging"`
   * 
   * ## `"digging"`
   * 
   * ## `"sliding"`
   * 
   * ## `"shooting"`
   * 
   * ## `"inhaling"`
   */
  export type EntityPose = 'standing' | 'fall-flying' | 'sleeping' | 'swimming' | 'spin-attack' | 'crouching' | 'long-jumping' | 'dying' | 'croaking' | 'using-tongue' | 'sitting' | 'roaring' | 'sniffing' | 'emerging' | 'digging' | 'sliding' | 'shooting' | 'inhaling';
  /**
   * All Minecraft-supported locales.
   * # Variants
   * 
   * ## `"af-za"`
   * 
   * ## `"ar-sa"`
   * 
   * ## `"ast-es"`
   * 
   * ## `"az-az"`
   * 
   * ## `"ba-ru"`
   * 
   * ## `"bar"`
   * 
   * ## `"be-by"`
   * 
   * ## `"bg-bg"`
   * 
   * ## `"br-fr"`
   * 
   * ## `"brb"`
   * 
   * ## `"bs-ba"`
   * 
   * ## `"ca-es"`
   * 
   * ## `"cs-cz"`
   * 
   * ## `"cy-gb"`
   * 
   * ## `"da-dk"`
   * 
   * ## `"de-at"`
   * 
   * ## `"de-ch"`
   * 
   * ## `"de-de"`
   * 
   * ## `"el-gr"`
   * 
   * ## `"en-au"`
   * 
   * ## `"en-ca"`
   * 
   * ## `"en-gb"`
   * 
   * ## `"en-nz"`
   * 
   * ## `"en-pt"`
   * 
   * ## `"en-ud"`
   * 
   * ## `"en-us"`
   * 
   * ## `"enp"`
   * 
   * ## `"enws"`
   * 
   * ## `"eo-uy"`
   * 
   * ## `"es-ar"`
   * 
   * ## `"es-cl"`
   * 
   * ## `"es-ec"`
   * 
   * ## `"es-es"`
   * 
   * ## `"es-mx"`
   * 
   * ## `"es-uy"`
   * 
   * ## `"es-ve"`
   * 
   * ## `"esan"`
   * 
   * ## `"et-ee"`
   * 
   * ## `"eu-es"`
   * 
   * ## `"fa-ir"`
   * 
   * ## `"fi-fi"`
   * 
   * ## `"fil-ph"`
   * 
   * ## `"fo-fo"`
   * 
   * ## `"fr-ca"`
   * 
   * ## `"fr-fr"`
   * 
   * ## `"fra-de"`
   * 
   * ## `"fur-it"`
   * 
   * ## `"fy-nl"`
   * 
   * ## `"ga-ie"`
   * 
   * ## `"gd-gb"`
   * 
   * ## `"gl-es"`
   * 
   * ## `"haw-us"`
   * 
   * ## `"he-il"`
   * 
   * ## `"hi-in"`
   * 
   * ## `"hr-hr"`
   * 
   * ## `"hu-hu"`
   * 
   * ## `"hy-am"`
   * 
   * ## `"id-id"`
   * 
   * ## `"ig-ng"`
   * 
   * ## `"io-en"`
   * 
   * ## `"is-is"`
   * 
   * ## `"isv"`
   * 
   * ## `"it-it"`
   * 
   * ## `"ja-jp"`
   * 
   * ## `"jbo-en"`
   * 
   * ## `"ka-ge"`
   * 
   * ## `"kk-kz"`
   * 
   * ## `"kn-in"`
   * 
   * ## `"ko-kr"`
   * 
   * ## `"ksh"`
   * 
   * ## `"kw-gb"`
   * 
   * ## `"la-la"`
   * 
   * ## `"lb-lu"`
   * 
   * ## `"li-li"`
   * 
   * ## `"lmo"`
   * 
   * ## `"lo-la"`
   * 
   * ## `"lol-us"`
   * 
   * ## `"lt-lt"`
   * 
   * ## `"lv-lv"`
   * 
   * ## `"lzh"`
   * 
   * ## `"mk-mk"`
   * 
   * ## `"mn-mn"`
   * 
   * ## `"ms-my"`
   * 
   * ## `"mt-mt"`
   * 
   * ## `"nah"`
   * 
   * ## `"nds-de"`
   * 
   * ## `"nl-be"`
   * 
   * ## `"nl-nl"`
   * 
   * ## `"nn-no"`
   * 
   * ## `"no-no"`
   * 
   * ## `"oc-fr"`
   * 
   * ## `"ovd"`
   * 
   * ## `"pl-pl"`
   * 
   * ## `"pt-br"`
   * 
   * ## `"pt-pt"`
   * 
   * ## `"qya-aa"`
   * 
   * ## `"ro-ro"`
   * 
   * ## `"rpr"`
   * 
   * ## `"ru-ru"`
   * 
   * ## `"ry-ua"`
   * 
   * ## `"sah-sah"`
   * 
   * ## `"se-no"`
   * 
   * ## `"sk-sk"`
   * 
   * ## `"sl-si"`
   * 
   * ## `"so-so"`
   * 
   * ## `"sq-al"`
   * 
   * ## `"sr-cs"`
   * 
   * ## `"sr-sp"`
   * 
   * ## `"sv-se"`
   * 
   * ## `"sxu"`
   * 
   * ## `"szl"`
   * 
   * ## `"ta-in"`
   * 
   * ## `"th-th"`
   * 
   * ## `"tl-ph"`
   * 
   * ## `"tlh-aa"`
   * 
   * ## `"tok"`
   * 
   * ## `"tr-tr"`
   * 
   * ## `"tt-ru"`
   * 
   * ## `"uk-ua"`
   * 
   * ## `"val-es"`
   * 
   * ## `"vec-it"`
   * 
   * ## `"vi-vn"`
   * 
   * ## `"yi-de"`
   * 
   * ## `"yo-ng"`
   * 
   * ## `"zh-cn"`
   * 
   * ## `"zh-hk"`
   * 
   * ## `"zh-tw"`
   * 
   * ## `"zlm-arab"`
   */
  export type Locale = 'af-za' | 'ar-sa' | 'ast-es' | 'az-az' | 'ba-ru' | 'bar' | 'be-by' | 'bg-bg' | 'br-fr' | 'brb' | 'bs-ba' | 'ca-es' | 'cs-cz' | 'cy-gb' | 'da-dk' | 'de-at' | 'de-ch' | 'de-de' | 'el-gr' | 'en-au' | 'en-ca' | 'en-gb' | 'en-nz' | 'en-pt' | 'en-ud' | 'en-us' | 'enp' | 'enws' | 'eo-uy' | 'es-ar' | 'es-cl' | 'es-ec' | 'es-es' | 'es-mx' | 'es-uy' | 'es-ve' | 'esan' | 'et-ee' | 'eu-es' | 'fa-ir' | 'fi-fi' | 'fil-ph' | 'fo-fo' | 'fr-ca' | 'fr-fr' | 'fra-de' | 'fur-it' | 'fy-nl' | 'ga-ie' | 'gd-gb' | 'gl-es' | 'haw-us' | 'he-il' | 'hi-in' | 'hr-hr' | 'hu-hu' | 'hy-am' | 'id-id' | 'ig-ng' | 'io-en' | 'is-is' | 'isv' | 'it-it' | 'ja-jp' | 'jbo-en' | 'ka-ge' | 'kk-kz' | 'kn-in' | 'ko-kr' | 'ksh' | 'kw-gb' | 'la-la' | 'lb-lu' | 'li-li' | 'lmo' | 'lo-la' | 'lol-us' | 'lt-lt' | 'lv-lv' | 'lzh' | 'mk-mk' | 'mn-mn' | 'ms-my' | 'mt-mt' | 'nah' | 'nds-de' | 'nl-be' | 'nl-nl' | 'nn-no' | 'no-no' | 'oc-fr' | 'ovd' | 'pl-pl' | 'pt-br' | 'pt-pt' | 'qya-aa' | 'ro-ro' | 'rpr' | 'ru-ru' | 'ry-ua' | 'sah-sah' | 'se-no' | 'sk-sk' | 'sl-si' | 'so-so' | 'sq-al' | 'sr-cs' | 'sr-sp' | 'sv-se' | 'sxu' | 'szl' | 'ta-in' | 'th-th' | 'tl-ph' | 'tlh-aa' | 'tok' | 'tr-tr' | 'tt-ru' | 'uk-ua' | 'val-es' | 'vec-it' | 'vi-vn' | 'yi-de' | 'yo-ng' | 'zh-cn' | 'zh-hk' | 'zh-tw' | 'zlm-arab';
}
