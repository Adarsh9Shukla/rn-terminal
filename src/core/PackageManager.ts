import { NativeModules } from 'react-native';

export interface InstalledPackage {
  name: string;
  version: string;
  architecture: string;
}

interface LocalTerminalNativeModule {
  listInstalledPackages(): Promise<InstalledPackage[]>;
  isPackageInstalled(name: string): Promise<boolean>;
  installPackage(name: string): Promise<InstalledPackage>;
  uninstallPackage(name: string): Promise<boolean>;
}

const LocalTerminal = NativeModules.LocalTerminal as LocalTerminalNativeModule;

function getNativeModule() {
  if (!LocalTerminal) {
    throw new Error('LocalTerminal native module is not available');
  }

  return LocalTerminal;
}

export const PackageManager = {
  list(): Promise<InstalledPackage[]> {
    return getNativeModule().listInstalledPackages();
  },

  isInstalled(name: string): Promise<boolean> {
    return getNativeModule().isPackageInstalled(name);
  },
  install(name: string): Promise<InstalledPackage> {
    return getNativeModule().installPackage(name);
  },
  uninstall(name: string): Promise<boolean> {
    return getNativeModule().uninstallPackage(name);
  },
};
