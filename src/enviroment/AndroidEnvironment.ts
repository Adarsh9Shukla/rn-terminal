import { NativeModules } from 'react-native';
import type { TerminalEnvironment } from './TerminalEnvironment';
import type { EnvironmentPaths } from '../native/LocalTerminal';

const LocalTerminal = NativeModules.LocalTerminal;

export class AndroidEnvironment implements TerminalEnvironment {
  private paths: EnvironmentPaths | null = null;

  async initialize(): Promise<void> {
    await LocalTerminal.initializeEnvironment();

    await LocalTerminal.bootstrapShell();

    this.paths = await LocalTerminal.getEnvironmentPaths();
  }
  async getPaths(): Promise<EnvironmentPaths> {
    if (!this.paths) {
      await this.initialize();
    }

    return this.paths!;
  }
  getPrefixPath(): string {
    if (!this.paths) {
      throw new Error('Android environment is not initialized');
    }

    return this.paths.usr;
  }

  getHomePath(): string {
    if (!this.paths) {
      throw new Error('Android environment is not initialized');
    }

    return this.paths.home;
  }

  async isInitialized(): Promise<boolean> {
    return this.paths !== null;
  }
}
