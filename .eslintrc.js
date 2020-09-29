module.exports = {
    extends: [
        '@fesk/standard',
        'plugin:import/typescript',
    ],
    rules: {
        'import/named': 0,
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/interface-name-prefix': 1,
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/ban-ts-ignore': 1,
        '@typescript-eslint/no-var-requires': 0,
        '@typescript-eslint/camelcase': 0,
        'require-yield': 0,
    },
};
