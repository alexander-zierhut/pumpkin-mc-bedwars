declare module 'pumpkin:plugin/ipc@0.1.0' {
  /**
   * Sends a message to the specified plugin, synchronously receiving a response (or an error).
   */
  export function sendIpcMessage(recipient: PluginId, message: IpcMessage): Result<IpcMessage, string>;
  export type PluginId = string;
  export type IpcMessage = Uint8Array;
  export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
}
