/// <reference path="./pumpkin-plugin-text.d.ts" />
declare module 'pumpkin:plugin/forms@0.1.0' {
  export type TextComponent = import('pumpkin:plugin/text@0.1.0').TextComponent;
  /**
   * # Variants
   * 
   * ## `"url"`
   * 
   * ## `"path"`
   */
  export type ImageType = 'url' | 'path';
  export interface FormImage {
    type: ImageType,
    data: string,
  }
  export interface SimpleFormButton {
    text: TextComponent,
    image?: FormImage,
  }
  export interface SimpleForm {
    title: TextComponent,
    content: TextComponent,
    buttons: Array<SimpleFormButton>,
  }
  export interface ModalForm {
    title: TextComponent,
    content: TextComponent,
    button1: TextComponent,
    button2: TextComponent,
  }
  export type CustomFormElement = CustomFormElementLabel | CustomFormElementToggle | CustomFormElementSlider | CustomFormElementStepSlider | CustomFormElementDropdown | CustomFormElementInput;
  export interface CustomFormElementLabel {
    tag: 'label',
    val: TextComponent,
  }
  export interface CustomFormElementToggle {
    tag: 'toggle',
    val: [TextComponent, boolean],
  }
  export interface CustomFormElementSlider {
    tag: 'slider',
    val: [TextComponent, number, number, number, number],
  }
  /**
   * text, min, max, step, default
   */
  export interface CustomFormElementStepSlider {
    tag: 'step-slider',
    val: [TextComponent, Array<string>, number],
  }
  /**
   * text, steps, default
   */
  export interface CustomFormElementDropdown {
    tag: 'dropdown',
    val: [TextComponent, Array<string>, number],
  }
  /**
   * text, options, default
   */
  export interface CustomFormElementInput {
    tag: 'input',
    val: [TextComponent, string, string],
  }
  export interface CustomForm {
    title: TextComponent,
    elements: Array<CustomFormElement>,
  }
  export type Form = FormSimple | FormModal | FormCustom;
  export interface FormSimple {
    tag: 'simple',
    val: SimpleForm,
  }
  export interface FormModal {
    tag: 'modal',
    val: ModalForm,
  }
  export interface FormCustom {
    tag: 'custom',
    val: CustomForm,
  }
}
