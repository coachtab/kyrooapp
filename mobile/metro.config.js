// metro.config.js
// Ensures UTF-8 source files (including German umlauts: ä ö ü Ä Ö Ü ß)
// and supplementary-plane characters (emoji / flag surrogates) are
// preserved exactly as-is through the Metro bundler and Hermes/JSC runtime.

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Terser by default can mangle non-ASCII identifiers and collapse Unicode
// escape sequences in ways that break surrogate pairs on some runtimes.
// Explicitly disable both to keep every UTF-16 code unit intact.
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...((config.transformer && config.transformer.minifierConfig) || {}),
    // Keep all Unicode characters as-is (no \uXXXX → literal collapsing)
    output: {
      ascii_only: false,
      comments: false,
    },
    compress: {},
  },
};

module.exports = config;
