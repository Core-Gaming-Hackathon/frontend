// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: true,
});

// Export the bundle analyzer wrapper
module.exports = withBundleAnalyzer;