
module.exports = {
  upload: function(file){
    try{
      let qcdn = require('@q/qcdn');
      return qcdn.upload(file, {
        https: true,
        keepName: true
      });
    }catch(ex){
      return Promise.reject('no cdn uploader specified!');
    }
  }
}
