import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { XtermView, type XtermViewHandle } from './XtermView';

import type { TerminalBackend } from '../core/Terminal.types';

interface TerminalProps {
  backend: TerminalBackend;
}

export function Terminal({ backend }: TerminalProps) {
  const terminalRef = useRef<XtermViewHandle>(null);

  useEffect(() => {
    const unsubscribe = backend.onData((data) => {
      terminalRef.current?.write(data);
    });

    backend.connect().catch((error) => {
      console.error('Terminal backend connection failed:', error);
    });

    return () => {
      unsubscribe();
      backend.disconnect();
    };
  }, [backend]);

  const handleInput = (data: string) => {
    backend.write(data);
  };

  return (
    <View style={{ flex: 1 }}>
      <XtermView ref={terminalRef} onData={handleInput} />
    </View>
  );
}
