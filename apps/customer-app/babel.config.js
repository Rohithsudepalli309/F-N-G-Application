module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Load .env variables as compile-time constants
    ['module:babel-plugin-dotenv-import', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true,
    }],
    'react-native-reanimated/plugin', // must be last
  ],
};
