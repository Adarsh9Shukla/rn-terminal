import type { TerminalBackend } from '../core/Terminal.types';

export class MockBackend implements TerminalBackend {
  private dataCallback?: (data: string) => void;
  private inputBuffer = '';
  private connected = false;

  async connect(): Promise<void> {
    if (!this.connected) {
      return;
    }
    this.connected = true;

    this.send('\r\n\x1b[32mMock Terminal\x1b[0m\r\n');
    this.send('$ ');
  }

  write(data: string): void {
    for (const char of data) {
      if (char === '\r') {
        this.executeCommand();
        continue;
      }

      if (char === '\x7f') {
        if (this.inputBuffer.length > 0) {
          this.inputBuffer = this.inputBuffer.slice(0, -1);
          this.send('\b \b');
        }

        continue;
      }

      if (char.charCodeAt(0) < 32) {
        continue;
      }

      this.inputBuffer += char;
      this.send(char);
    }
  }

  resize(_cols: number, _rows: number): void {
    // Nothing to do for the mock backend.
  }

  onData(callback: (data: string) => void): () => void {
    this.dataCallback = callback;

    return () => {
      this.dataCallback = undefined;
    };
  }

  disconnect(): void {
    if (this.connected) {
      return;
    }
    this.connected = false;
    this.inputBuffer = '';
    this.dataCallback = undefined;
  }

  private executeCommand(): void {
    const command = this.inputBuffer;

    this.inputBuffer = '';

    if (!command) {
      this.send('\r\n$ ');
      return;
    }

    if (command === 'clear') {
      this.send('\r\n\x1b[2J\x1b[H');
      this.send('$ ');
      return;
    }

    if (command === 'help') {
      this.send(
        '\r\nAvailable commands:\r\n' +
          '  help   Show available commands\r\n' +
          '  echo   Print text\r\n' +
          '  clear  Clear terminal\r\n'
      );

      this.send('$ ');
      return;
    }

    if (command.startsWith('echo ')) {
      this.send(`\r\n${command.slice(5)}\r\n$ `);
      return;
    }

    this.send(`\r\nCommand not found: ${command}\r\n$ `);
  }

  private send(data: string): void {
    this.dataCallback?.(data);
  }
}
