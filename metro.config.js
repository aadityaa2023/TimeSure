const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package exports to prevent 'import.meta' errors from third-party ESM dependencies (like zustand) on Web
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
