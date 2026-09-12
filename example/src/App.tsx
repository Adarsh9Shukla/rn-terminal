import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Terminal, createLocalTerminal } from 'react-native-rn-terminal';
import { NativeModules } from 'react-native';
import { PackageManager } from 'react-native-rn-terminal';
console.log('NATIVE MODULES:', Object.keys(NativeModules));
console.log('LOCAL TERMINAL:', NativeModules.LocalTerminalModule);
export default function App() {
  const backend = useMemo(() => createLocalTerminal(), []);

  useEffect(() => {
    async function testPackages() {
      try {
        const installed = await PackageManager.install('hello');

        console.log('INSTALLED PACKAGE:', installed);
        console.log(
          'HELLO INSTALLED:',
          await PackageManager.isInstalled('hello')
        );
        const removed = await PackageManager.uninstall('hello');

        console.log('HELLO UNINSTALLED:', removed);
      } catch (error) {
        console.error('PACKAGE TEST ERROR:', error);
      }
    }

    testPackages();
  }, []);
  (async () => {})();
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Terminal backend={backend} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});
