module.exports = {
  root: true,
  baseConfig: false,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 6
  },
  extends: [
    'airbnb-base',
  ],
  rules: {
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 1,

    //usage
    'arrow-parens': [0],
    'arrow-spacing': [1],
    'arrow-body-style': [0],
    'camelcase': [0],
    'comma-dangle': [1, 'only-multiline'],
    'comma-spacing': [1],
    'consistent-return': [0, {"treatUndefinedAsUnspecified": true}],
    'class-methods-use-this': [0],
    'eol-last': [0, 'unix'],
    'eqeqeq': [2],
    'func-names': [1, 'never'],
    'global-require': [0],
    'guard-for-in': [2],
    'key-spacing': [1],
    'keyword-spacing': [1],
    // SwitchCase https://github.com/eslint/eslint/issues/1797
    'indent': [2, 2, {'SwitchCase': 1}],
    'max-len': [1],
    'new-cap': [1],
    'no-bitwise': [0, {
      'allow': ['|', '&']
    }],
    'no-lonely-if': [0],
    'no-mixed-operators': [0, {
      'groups': [
        ['+', '-', '*', '/', '%', '**'],
        ['&', '|', '^', '~', '<<', '>>', '>>>'],
        ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
        ['&&', '||'],
        ['in', 'instanceof']
      ],
      'allowSamePrecedence': true
    }],
    'no-empty': [1, {
      'allowEmptyCatch': true
    }],
    'no-empty-function': [2],
    'no-else-return': [0],
    'no-trailing-spaces': [2, {
      'skipBlankLines': true
    }],
    'no-new': [1],
    'no-multiple-empty-lines': [1, { 'max': 2, 'maxEOF': 0, 'maxBOF': 0 }],
    'no-multi-str': [0],
    'no-unused-vars': [2, {'args': 'none'}],
    'no-unused-expressions': [2, {'allowShortCircuit': true}],
    'no-underscore-dangle': [1, {'allowAfterThis': true}],
    'no-restricted-syntax': [1, 'DebuggerStatement'],
    'no-plusplus': [1, { 'allowForLoopAfterthoughts': true }],
    'no-param-reassign': [0, {
      'props': true
    }],
    'no-shadow': [0],
    'object-shorthand': [0],
    'object-curly-spacing': [1],
    'one-var': [1],
    'one-var-declaration-per-line': [1, 'initializations'],
    'prefer-arrow-callback': [0],
    'prefer-const': [0],
    'prefer-template': [0],
    'prefer-spread': [1],
    'padded-blocks': [1],
    'quotes': [1, 'single', {
      'avoidEscape': true,
      'allowTemplateLiterals': true
    }],
    'quote-props': [1],
    'radix': [1, 'as-needed'],
    'spaced-comment': [1],
    'space-infix-ops': [1],
    'semi': [0],
    'space-before-function-paren': [1, 'never'],
    'space-before-blocks': [1],
    'no-unneeded-ternary': [1],
    'newline-per-chained-call': [0, {
      'ignoreChainWithDepth': 3
    }],
    'operator-linebreak': [0],
  },
  env: {
    'commonjs': true,
    'node': true
  },
  globals: {
  },
  settings: {
  },
  color: true,
}

