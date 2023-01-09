const { GasPlugin } = require('esbuild-gas-plugin');

require('esbuild').build({
  entryPoints: ['src/index.js'],
  bundle: true,
  define: {
    // util.js requires process, which is undefined in GAS
    'process.env.NODE_DEBUG': false,
    'console.assert': 'assert'
  },
  platform: "browser",
  outfile: 'dist/bundle.js',
  plugins: [GasPlugin]
}).catch(() => process.exit(1))
