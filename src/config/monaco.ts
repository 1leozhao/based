'use client';

import * as monaco from 'monaco-editor';

// Define Solidity language configuration
const solidityLanguageConfig: monaco.languages.IMonarchLanguage = {
  defaultToken: 'invalid',
  tokenPostfix: '.sol',

  keywords: [
    'pragma', 'solidity', 'contract', 'library', 'interface',
    'function', 'modifier', 'event', 'constructor',
    'address', 'string', 'bool', 'uint', 'int', 'bytes',
    'public', 'private', 'external', 'internal', 'payable',
    'view', 'pure', 'constant', 'storage', 'memory', 'calldata',
    'if', 'else', 'for', 'while', 'do', 'break', 'continue',
    'return', 'throw', 'emit', 'try', 'catch', 'revert',
    'using', 'new', 'delete', 'mapping'
  ],

  typeKeywords: [
    'contract', 'library', 'interface', 'function', 'modifier',
    'event', 'constructor', 'address', 'string', 'bool',
    'uint', 'int', 'bytes'
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':',
    '==', '<=', '>=', '!=', '&&', '||', '++', '--',
    '+', '-', '*', '/', '&', '|', '^', '%', '<<',
    '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
    '^=', '%=', '<<=', '>>=', '>>>='
  ],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@typeKeywords': 'keyword.type',
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      { include: '@whitespace' },
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],
      [/[;,.]/, 'delimiter'],
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }]
    ],
    comment: [
      [/[^\/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      ["\\*/", 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ],
    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],
    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],
  }
};

// Configure Monaco Editor
export function configureMonaco() {
  // Register Solidity language
  monaco.languages.register({ id: 'solidity' });
  monaco.languages.setMonarchTokensProvider('solidity', solidityLanguageConfig);

  // Set light theme (0x.org inspired)
  monaco.editor.defineTheme('based-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
      { token: 'keyword.type', foreground: '0000FF' },
      { token: 'string', foreground: 'D16969' },
      { token: 'number', foreground: '098658' },
      { token: 'delimiter', foreground: '000000' },
      { token: 'operator', foreground: '000000' },
      { token: 'comment', foreground: '008000' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editor.lineHighlightBackground': '#F7F7F7',
      'editorCursor.foreground': '#000000',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
    }
  });

  // Set dark theme
  monaco.editor.defineTheme('based-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'keyword.type', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'delimiter', foreground: 'D4D4D4' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'comment', foreground: '6A9955' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#2D2D2D',
      'editorCursor.foreground': '#FFFFFF',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
    }
  });
} 