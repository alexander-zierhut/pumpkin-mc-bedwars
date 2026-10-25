declare module 'pumpkin:plugin/metadata@0.1.0' {
  export function getMetadata(): PluginMetadata;
  export interface PluginMetadata {
    /**
     * Name of the plugin.
     */
    name: string,
    /**
     * Plugin version (semver).
     */
    version: string,
    /**
     * Plugin authors.
     */
    authors: Array<string>,
    /**
     * Short description of the plugin.
     */
    description: string,
    /**
     * Plugin dependencies.
     */
    dependencies: Array<string>,
    /**
     * Permissions requested by the plugin.
     */
    permissions: Array<string>,
  }
}
