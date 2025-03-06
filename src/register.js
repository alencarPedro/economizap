// Load environment variables first
require('dotenv').config();

// Register ts-node with simpler configuration
require('ts-node').register({
	transpileOnly: true,
	compilerOptions: {
		module: 'commonjs',
		esModuleInterop: true,
	},
});

// Run the server
require('./server.ts');
