const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Workaround: prevent Metro from trying to create 'node:sea' directory on Windows
// (colon is an illegal character in Windows filenames)
config.resolver = config.resolver || {};
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
