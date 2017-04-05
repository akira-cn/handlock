module.exports = function(env = {}){

  const webpack     = require('webpack'),
        path        = require('path'),
        fs          = require('fs'),
        packageConf = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        
  let version   = packageConf.version,
      library   = packageConf.name.replace(/(?:^|-)(\w)/g, (_, m) => m.toUpperCase()),
      proxyPort = 8081,
      plugins   = [],
      jsLoaders   = [];

  if(env.production){
    //compress js in production environment
    plugins.push(
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false,
          drop_console: false,
         }
      })
    );
  }

  if(fs.existsSync('./.babelrc')){
    //use babel
    let babelConf = JSON.parse(fs.readFileSync('.babelrc'));
    jsLoaders.push({
      loader: 'babel-loader',
      options: babelConf
    });
  }

  return {
    entry: './lib/app.js',
    output: {
      filename: env.production ? `${library}-${version}.min.js` : `${library}.js`,
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/js/',
      library: `${library}`,
      libraryTarget: 'umd'
    },

    plugins: plugins,

    module: {
      rules : [{
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: jsLoaders
      }]
    },

    devServer: {
      proxy: {
        "*": `http://127.0.0.1:${proxyPort}`,
      }
    }
  };
}
