'use strict';

module.exports.imageFilter = function (req, file, cb) {
   
    if (!file) {       
        return cb(new Error('No file was found'), false);
    }

    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/gif') {       
        return cb(new Error('That is not a valid image file'), false);
    }

    cb(null, true);
};

module.exports.uniqueFileName = function (guid, file) {

    if(guid && file && file.originalname) {        
        return guid + '.' + file.originalname.substr((~-file.originalname.lastIndexOf(".") >>> 0) + 2);
    }

    return null;  
};