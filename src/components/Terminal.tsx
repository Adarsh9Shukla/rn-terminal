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
    let cancelled = false;

    const unsubscribe = backend.onData((data) => {
      if (!cancelled) {
        console.log('TERMINAL RECEIVED:', JSON.stringify(data));
        terminalRef.current?.write(data);
      }
    });

    backend.connect().catch((error) => {
      console.error('Terminal backend connection failed:', error);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      backend.disconnect();
    };
  }, [backend]);

  const handleInput = (data: string) => {
    console.log('TERMINAL INPUT:', JSON.stringify(data));
    backend.write(data);
  };

  return (
    <View style={{ flex: 1 }}>
      <XtermView ref={terminalRef} onData={handleInput} />
    </View>
  );
}
