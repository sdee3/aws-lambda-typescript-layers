import path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = {
  entry: './functions/src/app.ts',
  mode: 'production',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.(ts|js)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-typescript'],
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@aws-sdk/client-s3': path.resolve(
        __dirname,
        'layers/aws-deps/nodejs/node_modules/@aws-sdk/client-s3'
      ),
      '@andreekeberg/imagedata': path.resolve(
        __dirname,
        './layers/three/nodejs/node_modules/@andreekeberg/imagedata'
      ),
      canvas: path.resolve(
        __dirname,
        './layers/three/nodejs/node_modules/canvas'
      ),
      'fetch-blob': path.resolve(
        __dirname,
        './layers/three/nodejs/node_modules/fetch-blob'
      ),
      jsdom: path.resolve(
        __dirname,
        './layers/three/nodejs/node_modules/jsdom'
      ),
      'node-fetch': path.resolve(
        __dirname,
        './layers/three/nodejs/node_modules/node-fetch'
      ),
      filereader: path.resolve(
        __dirname,
        './layers/three/nodejs/node_modules/filereader'
      ),
      'node-html-parser': path.resolve(
        __dirname,
        './layers/three/nodejs/node_modules/node-html-parser'
      ),
      three: path.resolve(__dirname, 'layers/three/nodejs/node_modules/three'),
    },
    extensions: ['.ts', '.js'],
  },
  output: {
    chunkFormat: 'commonjs',
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, 'functions/dist'),
    filename: 'app.js',
  },
}

export default config
