import type { TerminalBackend } from '../core/Terminal.types';

import LocalTerminal, {
  onPtyOutput,
  type PtySession,
} from '../native/LocalTerminal';

import { AndroidEnvironment } from '../enviroment/AndroidEnvironment';

export class LocalPTYBackend implements TerminalBackend {
  private session: PtySession | null = null;
  private unsubscribeOutput: (() => void) | null = null;
  private dataCallback: ((data: string) => void) | null = null;

  async connect(): Promise<void> {
    if (this.session !== null) {
      return;
    }

    const environment = new AndroidEnvironment();

    await environment.initialize();

    const paths = await environment.getPaths();

    this.unsubscribeOutput = onPtyOutput((data) => {
      console.log('PTY OUTPUT:', JSON.stringify(data)); // Log a more readable version as well.
      console.log('PTY OUTPUT TEXT:', data);
      this.dataCallback?.(data);
    });

    try {
      this.session = await LocalTerminal.createPty(
        '/system/bin/sh',
        paths.home,
        paths.usr
      );
    } catch (error) {
      this.unsubscribeOutput?.();
      this.unsubscribeOutput = null;
      throw error;
    }
  }

  write(data: string): void {
    const session = this.session;

    if (session === null) {
      return;
    }

    LocalTerminal.writePty(session.fd, data);
  }
  resize(cols: number, rows: number): void {
    const session = this.session;

    if (session === null) {
      return;
    }

    LocalTerminal.resizePty(session.fd, cols, rows).catch((error) => {
      console.error('PTY resize failed:', error);
    });
  }

  onData(callback: (data: string) => void): () => void {
    this.dataCallback = callback;

    return () => {
      if (this.dataCallback === callback) {
        this.dataCallback = null;
      }
    };
  }

  disconnect(): void {
    this.unsubscribeOutput?.();
    this.unsubscribeOutput = null;

    if (this.session !== null) {
      LocalTerminal.stopPty().catch((error) => {
        console.error('PTY stop failed:', error);
      });

      this.session = null;
    }

    this.dataCallback = null;
  }
}
