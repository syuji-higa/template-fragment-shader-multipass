const { join } = require('path')
const CopyPlugin = require('copy-webpack-plugin')

const config = {
  output: {
    path: join(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(frag|vert|glsl)$/,
        use: 'webpack-glsl-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts']
  }
}

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.devtool = 'cheap-module-eval-source-map'
    config.devServer = {
      contentBase: join(__dirname, 'src'),
      watchContentBase: true
    }
  } else if (argv.mode === 'production') {
    config.plugins = [
      new CopyPlugin(
        [
          {
            from: 'src/index.html',
            force: true
          },
          {
            from: 'src/*.+(ico)',
            to: '[name].[ext]',
            type: 'template',
            force: true
          }
        ],
        { copyUnmodified: true }
      )
    ]
  }
  return config
}
