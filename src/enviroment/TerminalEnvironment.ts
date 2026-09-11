export interface EnvironmentPaths {
  usr: string;
  home: string;
  bin: string;
  lib: string;
}

export interface TerminalEnvironment {
  initialize(): Promise<void>;

  getPrefixPath(): string;

  getHomePath(): string;

  isInitialized(): Promise<boolean>;
}
