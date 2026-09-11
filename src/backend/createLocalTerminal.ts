import { LocalPTYBackend } from './LocalPTYBackend';

export function createLocalTerminal() {
  return new LocalPTYBackend();
}
