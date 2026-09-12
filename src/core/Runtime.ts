import { NativeModules } from 'react-native';

interface RuntimeInfo {
  prefix: string;
  home: string;
  bin: string;
}

interface LocalTerminalNativeModule {
  getRuntimeInfo(): Promise<RuntimeInfo>;
}

const LocalTerminal = NativeModules.LocalTerminal as LocalTerminalNativeModule;

export const RuntimeManager = {
  async initialize(): Promise<RuntimeInfo> {
    if (!LocalTerminal) {
      throw new Error('LocalTerminal native module is not available');
    }

    return LocalTerminal.getRuntimeInfo();
  },

  async getInfo(): Promise<RuntimeInfo> {
    if (!LocalTerminal) {
      throw new Error('LocalTerminal native module is not available');
    }

    return LocalTerminal.getRuntimeInfo();
  },
};
