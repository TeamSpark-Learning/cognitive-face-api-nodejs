var path = require('path');
var fs = require('fs');

var helperCamera = { };

helperCamera.takeSnapAsync = async function() {
    var canvas = document.createElement('canvas');  // create a canvas
    var ctx = canvas.getContext('2d');              // get its context
    canvas.width = videoPreview.videoWidth;         // set its size to the one of the video
    canvas.height = videoPreview.videoHeight;
    ctx.drawImage(videoPreview, 0, 0);              // the video
    return new Promise((resolve, reject) => {
        resolve(canvas.toDataURL());
    });
}

helperCamera.saveImageToFileAsync = async function(image, fileName) {
    var node = typeof(image) == 'string' ?
        node = document.getElementById(image) :
        image;

    var dataUrl = node.getAttribute('src');

    var markerData = ';base64,';
    var indexData = dataUrl.indexOf(markerData);

    var markerExtension = 'image/';
    var indexExtension = dataUrl.indexOf(markerExtension);

    var extension = dataUrl.substring(indexExtension + markerExtension.length, indexData);
    var data = dataUrl.substring(indexData + markerData.length);

    var buffer = new Buffer(data, 'base64');

    return new Promise((resolve, reject) => {
        var filePath = path.join(__dirname, '..', 'buffer', `${fileName}.${extension}`);
        fs.writeFile(filePath, buffer, (error) => {
            if (!error) { 
                resolve(filePath);
            }
            else { 
                reject(error);
            }
        });
    });
}

module.exports = helperCamera;