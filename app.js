(function() {
    var videoPreview = document.getElementById('videoPreview');
    var imgPrevew = document.getElementById('imgPreview');

    var Webcam = require('webcamjs');
    Webcam.attach(videoPreview);

    document.getElementById('btnSave').addEventListener('click', getPhotoFromCamera);

    navigator.getUserMedia({ video: true, audio: false }, (localMediaStream) => {
        videoPreview.srcObject = localMediaStream
        videoPreview.autoplay = true
     }, (e) => { });

     function getPhotoFromCamera() {
        Webcam.snap(function(data){
            imgPrevew.setAttribute('src', data);
        });
     }
})();