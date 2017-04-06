#!/usr/bin/env node

const webpack = require('webpack');
const fs      = require('fs');
const path    = require('path');

let webpackConf = require('../webpack.config.js');

webpack(webpackConf({production: true}), function(err, stats){
  let cdnUploader = require('./cdn-uploader'),
      output = stats.compilation.compiler.options.output,
      file = path.resolve(output.path, output.filename);

  cdnUploader.upload(file).then(function(res){
    let readmeFile = path.resolve(__dirname, '..', 'README.md');
    let content = fs.readFileSync(readmeFile, 'utf-8');
    content = content.replace(/script src="(.*)"/igm, `script src="${res[file]}"`);
    fs.writeFileSync(readmeFile, content);
  });  
});
