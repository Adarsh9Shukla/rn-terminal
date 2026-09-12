export { Terminal } from './components/Terminal';

export { LocalPTYBackend } from './backend/LocalPTYBackend';

export { createLocalTerminal } from './backend/createLocalTerminal';

export type { TerminalBackend } from './core/Terminal.types';
export { AndroidEnvironment } from './enviroment/AndroidEnvironment';
export { RuntimeManager } from './core/Runtime';
export type {
  EnvironmentPaths,
  TerminalEnvironment,
} from './enviroment/TerminalEnvironment';
export { PackageManager } from './core/PackageManager';
export type { InstalledPackage } from './core/PackageManager';
