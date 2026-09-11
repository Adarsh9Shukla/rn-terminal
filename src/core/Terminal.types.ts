export interface TerminalBackend {
  connect(): Promise<void>;

  write(data: string): void;

  resize(cols: number, rows: number): void;

  onData(callback: (data: string) => void): () => void;

  disconnect(): void;
}
