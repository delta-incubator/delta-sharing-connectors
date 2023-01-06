const { GasPlugin } = require('esbuild-gas-plugin');

require('esbuild').build({
  entryPoints: ['src/server/index.js'],
  bundle: true,
  // util.js requires process, which is undefined in GAS
  define: {'process.env.NODE_DEBUG': false},
  platform: "browser",
  outfile: 'dist/bundle.js',
  plugins: [GasPlugin]
}).catch(() => process.exit(1))
