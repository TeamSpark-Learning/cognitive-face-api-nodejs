(function() {
    var configs = {
        storageName: '',
        storageKey: '',
        storageContainer: 'faces'
    };

    var videoPreview = document.getElementById('videoPreview');
    var imgPrevew = document.getElementById('imgPreview');

    var storage = require('azure-storage');
    var blobService = storage.createBlobService(configs.storageName, configs.storageKey);
    blobService.createContainerIfNotExists(configs.storageContainer, {
        publicAccessLevel: 'blob'
    }, function(error, result, response) {
        if (error) {
            alert(error);
        }
    });

    document.getElementById('btnCapture')
        .addEventListener('click', capturePhotoFromCamera);

    navigator.getUserMedia({ video: true, audio: false }, (localMediaStream) => {
        videoPreview.srcObject = localMediaStream
        videoPreview.autoplay = true
    }, (e) => { });

    function capturePhotoFromCamera() {
        function takeASnap() {
            var canvas = document.createElement('canvas');  // create a canvas
            var ctx = canvas.getContext('2d');              // get its context
            canvas.width = videoPreview.videoWidth;         // set its size to the one of the video
            canvas.height = videoPreview.videoHeight;
            ctx.drawImage(videoPreview, 0, 0);              // the video
            return new Promise((resolve, reject) => {
                resolve(canvas.toDataURL());
            });
        }

        takeASnap()
            .then((data) => {
                imgPrevew.setAttribute('src', data);
            });

    }
})();