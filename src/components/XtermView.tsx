import { forwardRef, useImperativeHandle, useRef } from 'react';

import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface XtermViewHandle {
  write: (data: string) => void;
  clear: () => void;
}

interface XtermViewProps {
  onData: (data: string) => void;
}

const terminalHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />

    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css"
    />

    <style>
      * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #0b0d10;
        overflow: hidden;
        color-scheme: dark;
      }

      body {
        font-family:
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          "Liberation Mono",
          "Courier New",
          monospace;
      }

      /*
       * Terminal outer shell
       */
      #terminal-shell {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 12px;

        background:
          radial-gradient(
            circle at 50% 0%,
            rgba(255, 255, 255, 0.035),
            transparent 45%
          ),
          #0b0d10;

        overflow: hidden;
      }

      /*
       * Actual terminal window
       */
      #terminal {
  position: relative;
  width: 100%;
  height: 100%;

  /* More space around the terminal content */
  padding: 18px 20px;

  background:
    linear-gradient(
      rgba(255, 255, 255, 0.012) 50%,
      transparent 50%
    ),
    #0d1117;

  background-size: 100% 4px;

  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 10px;

  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.35),
    0 12px 40px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.025);

  overflow: hidden;
}

      /*
       * xterm container
       */
     .xterm {
  width: 100%;
  height: 100%;
  padding: 0;
  background: transparent !important;
}

.xterm-viewport {
  width: 100% !important;
  height: 100% !important;

  background: transparent !important;

  /* Vertical + horizontal scrolling */
  overflow-x: auto !important;
  overflow-y: auto !important;

  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.20) transparent;

  -webkit-overflow-scrolling: touch;
}

/* Scrollbars */
.xterm-viewport::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.xterm-viewport::-webkit-scrollbar-track {
  background: transparent;
}

.xterm-viewport::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.20);
  border-radius: 10px;
}

.xterm-viewport::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
}

/*
 * Don't force the terminal screen to wrap into the WebView.
 */
.xterm-screen {
  width: max-content !important;
  min-width: 100% !important;
}

.xterm-rows {
  width: max-content !important;
  min-width: 100%;
  padding: 0;
}

      /*
       * Chromium / WebView scrollbar
       */
      .xterm-viewport::-webkit-scrollbar {
        width: 7px;
        height: 7px;
      }

      .xterm-viewport::-webkit-scrollbar-track {
        background: transparent;
      }

      .xterm-viewport::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.18);
        border-radius: 10px;
      }

      .xterm-viewport::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /*
       * Screen / rows - allow horizontal expansion beyond WebView width
       */
      

      /*
       * Improve text rendering
       */
      .xterm-screen canvas {
        image-rendering: auto;
      }

      /*
       * Selection
       */
      .xterm .xterm-selection {
        background: rgba(88, 166, 255, 0.30) !important;
      }

      /*
       * Cursor
       */
      .xterm-cursor-layer {
        opacity: 1;
      }

      /*
       * Hide xterm's textarea visually while retaining input
       */
      .xterm-helper-textarea {
        position: absolute !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /*
       * Prevent WebView's default text selection / callout
       */
      .xterm,
      .xterm-screen,
      .xterm-viewport {
        -webkit-user-select: text;
        user-select: text;
        -webkit-touch-callout: none;
      }

      /*
       * Small-screen adjustments
       */
      @media (max-width: 600px) {
        #terminal-shell {
          padding: 6px;
        }

        #terminal {
          padding: 10px 11px;
          border-radius: 7px;
        }
      }
    </style>
  </head>

  <body>
    <div id="terminal-shell">
      <div id="terminal"></div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>

    <script>
const terminal = new Terminal({
  cursorBlink: true,
  cursorStyle: 'block',

  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

  fontSize: 12,
  lineHeight: 1.45,
  letterSpacing: 0,

  convertEol: true,

  // IMPORTANT
  wordWrap: false,

  scrollback: 5000,

  allowTransparency: true,

  scrollSensitivity: 3,
  fastScrollModifier: 'alt',
  fastScrollSensitivity: 5,

  theme: {
    background: '#0d1117',
    foreground: '#e6edf3',

    cursor: '#f0f6fc',
    cursorAccent: '#0d1117',

    selectionBackground: '#264f78',

    black: '#484f58',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#b1bac4',

    brightBlack: '#6e7681',
    brightRed: '#ffa198',
    brightGreen: '#56d364',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#56d4dd',
    brightWhite: '#f0f6fc'
  }
});

      terminal.open(document.getElementById('terminal'));

      /*
       * Make sure the terminal gets calculated correctly after WebView layout.
       */
      setTimeout(() => {
        terminal.resize(
          Math.max(1, terminal.cols),
          Math.max(1, terminal.rows)
        );
        terminal.focus();
      }, 100);

      /*
       * Resize xterm when the WebView changes size.
       */
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          try {
            terminal.fit?.();
          } catch (e) {
            // fit addon may not be installed
          }
        });
      });

      resizeObserver.observe(document.getElementById('terminal'));

      /*
       * Send keyboard input back to React Native.
       */
      terminal.onData((data) => {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            data,
            length: data.length,
            codes: Array.from(data).map(
              char => char.charCodeAt(0)
            )
          })
        );
      });

      /*
       * Exposed API for React Native.
       */
      window.writeToTerminal = function(data) {
        terminal.write(data);
      };

      window.clearTerminal = function() {
        terminal.clear();
        terminal.scrollToBottom();
      };

      window.focusTerminal = function() {
        terminal.focus();
      };

      /*
       * Initial focus.
       */
      terminal.focus();
    </script>
  </body>
</html>
`;

export const XtermView = forwardRef<XtermViewHandle, XtermViewProps>(
  ({ onData }, ref) => {
    const webViewRef = useRef<WebView<{}>>(null);

    useImperativeHandle(ref, () => ({
      write: (data: string) => {
        const escaped = JSON.stringify(data);

        webViewRef.current?.injectJavaScript(`
        window.writeToTerminal(${escaped});
        true;
      `);
      },

      clear: () => {
        webViewRef.current?.injectJavaScript(`
        window.clearTerminal();
        true;
      `);
      },
    }));

    return (
      <WebView
        ref={webViewRef}
        style={styles.container}
        originWhitelist={['*']}
        source={{ html: terminalHtml }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        automaticallyAdjustContentInsets={false}
        keyboardDisplayRequiresUserAction={false}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            onData(message.data);
          } catch (error) {
            console.warn('Invalid xterm message:', error);
          }
        }}
      />
    );
  }
);

XtermView.displayName = 'XtermView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
