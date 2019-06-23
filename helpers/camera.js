var private = {

};

var helperCamera = { };

helperCamera.initializeWebcam = async function() {
    return new Promise((resolve, reject) => {
        navigator.getUserMedia({ video: true, audio: false }, (localMediaStream) => {
            videoPreview.srcObject = localMediaStream;
            videoPreview.autoplay = true;
            resolve();
        }, (error) => {
            reject(error);
        });
    });
};

module.exports = helperCamera;