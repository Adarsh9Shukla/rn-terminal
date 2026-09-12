import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

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

    #terminal-shell {
      width: 100%;
      height: 100%;
      padding: 12px;
      background: #0b0d10;
      overflow: hidden;
    }

    #terminal {
      width: 100%;
      height: 100%;
      padding: 18px 20px;
      background: #0d1117;
      border: 1px solid rgba(255, 255, 255, 0.075);
      border-radius: 10px;
      overflow: hidden;
    }

    .xterm {
      width: 100%;
      height: 100%;
      padding: 0;
      background: transparent !important;
    }

    .xterm-viewport {
      background: transparent !important;
      overflow-x: auto !important;
      overflow-y: auto !important;
    }

    .xterm-screen {
      width: max-content !important;
      min-width: 100% !important;
    }

    .xterm-rows {
      width: max-content !important;
      min-width: 100%;
    }

    .xterm-cursor-layer {
      opacity: 1;
    }

    /*
     * Keep the textarea available for keyboard input.
     */
    .xterm-helper-textarea {
      position: absolute !important;
      opacity: 0 !important;
    }

    .xterm,
    .xterm-screen,
    .xterm-viewport {
      -webkit-user-select: text;
      user-select: text;
      -webkit-touch-callout: none;
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
      wordWrap: false,
      scrollback: 5000,

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

    const container = document.getElementById('terminal');
terminal.open(container);

console.log('[XTERM] terminal opened');

terminal.write('$ ');
terminal.focus();

console.log('[XTERM] TEST PROMPT WRITTEN');
  
    terminal.onData((data) => {
      console.log('[XTERM INPUT]', JSON.stringify(data));

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'input',
          data
        })
      );
    });

    /*
     * RN -> xterm
     */
    window.writeToTerminal = function(data) {
      console.log('[XTERM OUTPUT]', JSON.stringify(data));

      terminal.write(data);
    };

    window.clearTerminal = function() {
      terminal.clear();
      terminal.scrollToBottom();
    };

    window.focusTerminal = function() {
      terminal.focus();
    };

    setTimeout(() => {
      terminal.focus();
      console.log('[XTERM] focused');
    }, 300);
  </script>

</body>
</html>
`;

export const XtermView = forwardRef<XtermViewHandle, XtermViewProps>(
  ({ onData }, ref) => {
    const webViewRef = useRef<WebView<{}>>(null);
    const [webViewReady, setWebViewReady] = useState(false);

    /*
     * PTY output can arrive before WebView finishes loading.
     * Store it here until xterm is ready.
     */
    const pendingOutputRef = useRef<string[]>([]);

    useImperativeHandle(ref, () => ({
      write: (data: string) => {
        if (!webViewReady) {
          console.log(
            '[XTERM] WebView not ready, queueing:',
            JSON.stringify(data)
          );

          pendingOutputRef.current.push(data);
          return;
        }

        const escaped = JSON.stringify(data);

        webViewRef.current?.injectJavaScript(`
          window.writeToTerminal(${escaped});
          true;
        `);
      },

      clear: () => {
        if (!webViewReady) {
          pendingOutputRef.current = [];
          return;
        }

        webViewRef.current?.injectJavaScript(`
          window.clearTerminal();
          true;
        `);
      },
    }));

    const handleWebViewLoad = () => {
      console.log('[WEBVIEW] loaded');

      setWebViewReady(true);

      /*
       * Flush PTY output that arrived before WebView loaded.
       */
      const pending = pendingOutputRef.current;

      pendingOutputRef.current = [];

      for (const data of pending) {
        const escaped = JSON.stringify(data);

        webViewRef.current?.injectJavaScript(`
          window.writeToTerminal(${escaped});
          true;
        `);
      }

      /*
       * Focus after the page is completely ready.
       */
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          window.focusTerminal();
          true;
        `);
      }, 100);
    };

    return (
      <WebView
        ref={webViewRef}
        style={styles.container}

        originWhitelist={['*']}

        source={{
          html: terminalHtml,
        }}

        javaScriptEnabled={true}
        domStorageEnabled={true}

        scrollEnabled={false}

        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}

        bounces={false}

        automaticallyAdjustContentInsets={false}

        keyboardDisplayRequiresUserAction={false}

        onLoadEnd={handleWebViewLoad}

        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);

            if (message.type === 'input') {
              onData(message.data);
            }
          } catch (error) {
            console.warn('[XTERM] Invalid message:', error);
          }
        }}

        onError={(event) => {
          console.error('[WEBVIEW ERROR]', event.nativeEvent);
        }}

        onHttpError={(event) => {
          console.error('[WEBVIEW HTTP ERROR]', event.nativeEvent);
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
