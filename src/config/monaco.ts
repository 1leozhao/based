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

    // Set light theme (0x.org inspired)
    monaco.editor.defineTheme('based-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '2563eb' },  // Primary blue
        { token: 'type.identifier', foreground: '4f46e5' }, // Secondary purple
        { token: 'identifier', foreground: '111827' }, // Text primary
        { token: 'string', foreground: '059669' }, // Green
        { token: 'number', foreground: 'dc2626' }, // Red
        { token: 'comment', foreground: '6b7280' }, // Gray
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#111827',
        'editorLineNumber.foreground': '#9ca3af',
        'editorLineNumber.activeForeground': '#4b5563',
        'editor.selectionBackground': '#e5e7eb',
        'editor.inactiveSelectionBackground': '#f3f4f6',
        'editorIndentGuide.background': '#f3f4f6',
        'editorIndentGuide.activeBackground': '#e5e7eb',
        'editor.lineHighlightBackground': '#f8fafc',
        'editor.lineHighlightBorder': '#f1f5f9',
      }
    });

    // Set dark theme (Night Owl inspired)
    monaco.editor.defineTheme('based-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '82AAFF' }, // Light blue
        { token: 'type.identifier', foreground: 'C792EA' }, // Purple
        { token: 'identifier', foreground: 'D6DEEB' }, // White-blue
        { token: 'string', foreground: 'ECC48D' }, // Light orange
        { token: 'number', foreground: 'F78C6C' }, // Orange
        { token: 'comment', foreground: '637777' }, // Gray
      ],
      colors: {
        'editor.background': '#011627',
        'editor.foreground': '#d6deeb',
        'editorLineNumber.foreground': '#4b6479',
        'editorLineNumber.activeForeground': '#c5e4fd',
        'editor.selectionBackground': '#1d3b53',
        'editor.inactiveSelectionBackground': '#0b2942',
        'editor.lineHighlightBackground': '#0b2942',
        'editor.lineHighlightBorder': '#122d42',
        'editorIndentGuide.background': '#0b2942',
        'editorIndentGuide.activeBackground': '#1d3b53',
      }
    });

    // Set default theme
    monaco.editor.setTheme('based-light');
  });
}; 