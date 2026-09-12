import { DeviceEventEmitter, NativeModules } from 'react-native';
export interface PtySession {
  fd: number;
  pid: number;
}
export interface EnvironmentPaths {
  usr: string;
  home: string;
  bin: string;
  lib: string;
}
interface LocalTerminalModule {
  getPlatform(): Promise<string>;
  initializeEnvironment(): Promise<boolean>;
  execute(command: string): Promise<string>;
  bootstrapShell(): Promise<string>;
  startShell(): Promise<string>;
  write(command: string): Promise<string>;
  testTermuxExec(): Promise<string>;
  getNativeLibraryInfo(): Promise<{
    nativeLibraryDir: string;
    termuxExecPath: string;
    helloPath: string;
  }>;
  stopShell(): Promise<string>;

  // createPty(
  //   shellPath: string,
  //   homePath: string,
  //   prefixPath: string,
  //   appDataDir: string,
  //   preloadPath: string
  // ): Promise<PtySession>;
  createPty(
    shellPath: string,
    homePath: string,
    prefixPath: string
  ): Promise<PtySession>;
  writePty(fd: number, data: string): Promise<number>;

  readPty(fd: number): Promise<string>;

  stopPty(): Promise<string>;

  resizePty(fd: number, cols: number, rows: number): Promise<boolean>;
}
const LocalTerminal = NativeModules.LocalTerminal as LocalTerminalModule;
export const onPtyOutput = (callback: (data: string) => void): (() => void) => {
  const subscription = DeviceEventEmitter.addListener(
    'LocalTerminalPtyOutput',
    callback
  );

  return () => {
    subscription.remove();
  };
};
export const onOutput = (callback: (data: string) => void): (() => void) => {
  const subscription = DeviceEventEmitter.addListener(
    'LocalTerminalOutput',
    callback
  );

  return () => {
    subscription.remove();
  };
};

export default LocalTerminal;
