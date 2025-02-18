import { loader } from '@monaco-editor/react';

// Define Solidity language configuration
const solidityLanguageConfig = {
  defaultToken: 'invalid',
  tokenPostfix: '.sol',

  keywords: [
    'pragma', 'solidity', 'contract', 'library', 'interface',
    'function', 'modifier', 'event', 'struct', 'enum',
    'public', 'private', 'internal', 'external', 'pure',
    'view', 'payable', 'virtual', 'override', 'abstract',
    'returns', 'memory', 'storage', 'calldata', 'constant',
    'immutable', 'constructor', 'mapping', 'address', 'bool',
    'string', 'bytes', 'uint', 'int', 'fixed', 'ufixed',
    'if', 'else', 'for', 'while', 'do', 'break', 'continue',
    'return', 'throw', 'emit', 'try', 'catch', 'revert',
    'assembly', 'import', 'from', 'as', 'using', 'is',
    'new', 'delete', 'require', 'assert', 'type'
  ],

  typeKeywords: [
    'address', 'bool', 'string', 'bytes', 'byte', 'int', 'uint',
    'fixed', 'ufixed', 'mapping'
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
      [/[a-z_$][\w$]*/, {
        cases: {
          '@typeKeywords': 'keyword',
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      [/[A-Z][\w$]*/, 'type.identifier'],
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
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid']
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
export const configureMonaco = () => {
  loader.init().then(monaco => {
    // Register Solidity language
    monaco.languages.register({ id: 'solidity' });
    monaco.languages.setMonarchTokensProvider('solidity', solidityLanguageConfig);

    // Set editor theme
    monaco.editor.defineTheme('baseide-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569CD6' },
        { token: 'type.identifier', foreground: '4EC9B0' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'comment', foreground: '6A9955' },
      ],
      colors: {
        'editor.background': '#1f2937',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#6b7280',
        'editorLineNumber.activeForeground': '#d4d4d4',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      }
    });
  });
}; 