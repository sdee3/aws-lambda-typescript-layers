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
        use: 'node-loader'
      },
      {
        test: /\.(ts|js)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-typescript']
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      '@aws-sdk/client-s3': path.resolve(
        __dirname,
        'layers/aws-deps/nodejs/node_modules/@aws-sdk/client-s3'
      ),
      three: path.resolve(__dirname, 'layers/three/nodejs/node_modules/three'),
      vblob: path.resolve(__dirname, 'layers/three/nodejs/node_modules/vblob')
    },
    extensions: ['.ts', '.js']
  },
  output: {
    chunkFormat: 'commonjs',
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, 'functions/dist'),
    filename: 'app.js'
  }
}

export default config
