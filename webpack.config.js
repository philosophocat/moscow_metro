const path = require('path');
const { env: mode } = process.env;

module.exports = {
    mode,
    entry: './src/app/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        filename: 'moscow_metro.js',
        path: path.resolve(__dirname, 'build')
    }
};
