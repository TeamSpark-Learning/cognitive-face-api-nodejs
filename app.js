(function() {
    var configs = {
        storageName: '',
        storageKey: '',
        storageContainer: 'faces'
    };

    var videoPreview = document.getElementById('videoPreview');
    var imgPrevew = document.getElementById('imgPreview');

    var Webcam = require('webcamjs');
    Webcam.attach(videoPreview);

    var storage = require('azure-storage');
    var blobService = storage.createBlobService(configs.storageName, configs.storageKey);
    blobService.createContainerIfNotExists(configs.storageContainer, {
        publicAccessLevel: 'blob'
    }, function(error, result, response) {
        if (!error) {
            // if result = true, container was created.
            // if result = false, container already existed.
        }
    });


    document.getElementById('btnCapture')
        .addEventListener('click', capturePhotoFromCamera);

    navigator.getUserMedia({ video: true, audio: false }, (localMediaStream) => {
        videoPreview.srcObject = localMediaStream
        videoPreview.autoplay = true
    }, (e) => { });

    function capturePhotoFromCamera() {
        Webcam.snap(function(data){
            imgPrevew.setAttribute('src', data);
        });
    }
})();