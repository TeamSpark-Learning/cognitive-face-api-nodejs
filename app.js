(function() {
    var configs = {
        storageName: '',
        storageKey: '',
        storageContainer: 'faces',

        faceUrl: '',
        faceKey: '',
        faceGroupName: 'inhabitants',
        facePersonName: 'overlord',
        facePersonId: '',
        faceThreshold: 0.7
    };

    var videoPreview = document.getElementById('videoPreview');
    var imgPrevew = document.getElementById('imgPreview');

    var log = require('./helpers/log');
    log.clear();
    log.showProgress();

    var fs = require('fs');
    var path = require('path');

    var url = require('url');
    var https = require('https');

    var uuid = require('uuid/v4');

    var storage = require('azure-storage');
    var blobService = storage.createBlobService(configs.storageName, configs.storageKey);
    
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
            }, handleError);
    }

    function setImageAsMaster() {
        function savePreviewToFile() {
            var dataUrl = imgPrevew.getAttribute('src');
            var regex = /^data:.+\/(.+);base64,(.*)$/;
            
            var matches = dataUrl.match(regex);
            var ext = matches[1];
            var data = matches[2];
            var buffer = new Buffer(data, 'base64');

            return new Promise((resolve, reject) => {
                var filePath = path.join(__dirname, 'buffer', 'face.' + ext);
                fs.writeFile(filePath, buffer, (error) => {
                    if (!error) { 
                        log.append('Preview saved to local file.');
                        resolve(filePath);
                    }
                    else { reject(err); }
                });
            });
        }

        function uploadFileToStorage(filePath) {
            return new Promise((resolve, reject) => {
                var blobName = uuid();
                blobService.createBlockBlobFromLocalFile(configs.storageContainer, blobName, filePath, (error, result, response) => {
                    if (!error) { 
                        log.append('Preview uploaded to Azure Storage.');
                        resolve(blobName);
                    }
                    else { reject(err); }
                });
            });
        }

        function addFaceToModel(blobName) {
            var blobUrl = `https://${configs.storageName}.blob.core.windows.net/${configs.storageContainer}/${blobName}`;

            var model = { Url: blobUrl };
            return callFaceApiEndpoint(`/persongroups/${configs.faceGroupName}/persons/${configs.facePersonId}/persistedfaces`, 'post', model);
        }

        function trainModel() {
            function ensureModelTrained() {
                return callFaceApiEndpoint(`/persongroups/${configs.faceGroupName}/training`, 'get')
                .then((response) => {
                    if (response.status == 'succeeded') {
                        return Promise.resolve();
                    } else {
                        return wait(1000)
                        .then(() => {
                            return ensureModelTrained();
                        }, handleError);
                    }
                }, handleError);
            }

            return callFaceApiEndpoint(`/persongroups/${configs.faceGroupName}/train`, 'post')
            .then(() => {
                return ensureModelTrained();
            }, handleError);
        }

        log.clear();

        savePreviewToFile()
        .then((filePath) => {
            return uploadFileToStorage(filePath);
        }, handleError)
        .then((blobName) => {
            return addFaceToModel(blobName);
        }, handleError)
        .then(() => {
            log.append('Face added.');
            return trainModel();
        }, handleError)
        .then(() => {
            log.append('Model trained.');
        }, handleError);
    }

    function tryToUnlock() {
        function savePreviewToFile() {
            var dataUrl = imgPrevew.getAttribute('src');
            var regex = /^data:.+\/(.+);base64,(.*)$/;
            
            var matches = dataUrl.match(regex);
            var ext = matches[1];
            var data = matches[2];
            var buffer = new Buffer(data, 'base64');

            return new Promise((resolve, reject) => {
                var filePath = path.join(__dirname, 'buffer', 'face.' + ext);
                fs.writeFile(filePath, buffer, (error) => {
                    if (!error) {
                        log.append('Preview saved to local file.');
                        resolve(filePath);
                    }
                    else { reject(err); }
                });
            });
        }

        function uploadFileToStorage(filePath) {
            return new Promise((resolve, reject) => {
                var blobName = uuid();
                blobService.createBlockBlobFromLocalFile(configs.storageContainer, blobName, filePath, (error, result, response) => {
                    if (!error) { 
                        log.append('Preview uploaded to Azure Storage.');
                        resolve(blobName);
                    }
                    else { reject(err); }
                });
            });
        }

        function detectFace(blobName) {
            var blobUrl = `https://${configs.storageName}.blob.core.windows.net/${configs.storageContainer}/${blobName}`;

            var model = { Url: blobUrl };
            return callFaceApiEndpoint(`/detect?returnFaceId=true&returnFaceLandmarks=true`, 'post', model);
        }

        function identityFace(faces) {
            var faceIds = faces.map((face) => { return face.faceId; });

            var model = { faceIds: faceIds, personGroupId: configs.faceGroupName };
            return callFaceApiEndpoint(`/identify`, 'post', model);
        }

        function checkCandidates(faces) {
            return new Promise((resolve, reject) => {
                for (var i = 0; i < faces.length; i++) {
                    for (var j = 0; j < faces[i].candidates.length; j++) {
                        if (faces[i].candidates[j].confidence > configs.faceThreshold) {
                            resolve(true);
                            return;
                        }
                    }
                }
                resolve(false);
            });
        }

        log.clear();
        log.showProgress();

        savePreviewToFile()
        .then((filePath) => {
            return uploadFileToStorage(filePath);
        }, handleError)
        .then((blobName) => {
            return detectFace(blobName);
        }, handleError)
        .then((faces) => {
            log.append('Face detected.');
            return identityFace(faces);
        }, handleError)
        .then((faces) => {
            log.append('Face identified.');
            return checkCandidates(faces);
        }, handleError)
        .then((result) => {
            if (!!result) {
                log.showSuccess();
            } else {
                log.showFail();
            }
        }, handleError);
    }



    function callFaceApiEndpoint(path, method, payload) {
        return new Promise((resolve, reject) => {
            var parsedUrl = url.parse(configs.faceUrl);
            var options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.path + path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': configs.faceKey
                }
            };

            var request = https.request(options, (response) => {
                response.setEncoding('utf8');

                var data = [];
                response.on('data', (chunk) => {
                    data.push(chunk);
                });

                response.on('end', () => {
                    if (response.statusCode >= 400) { 
                        reject(response.statusCode);
                    } else {
                        if (data.length == 0) { resolve() }
                        else { resolve(JSON.parse(data.join(''))); }
                    }
                });
            });

            request.on('error', (error) => {
                reject(error);
            });

            if (!payload) { payload = ''; }
            if (typeof(payload) != 'string') { payload = JSON.stringify(payload); }

            request.write(payload);
            request.end();
        });
    }

    function wait(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(() => { resolve(); }, ms);
        });
    }

    var handleError = function (error) {
        console.error(error);
    }


    // ====================================
    // initialze storage
    blobService.createContainerIfNotExists(configs.storageContainer, {
        publicAccessLevel: 'blob'
    }, (error) => {
        if (error) {
            handleError(error);
        } else {
            log.append('Azure Storage initialized.');
        }
    });


    // ====================================
    // initialize face api
    // 1. get all person gropus
    callFaceApiEndpoint('/persongroups', 'get')
    .then((groups) => {
    // 2. check if person group exists
        var exists = false;
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].personGroupId == configs.faceGroupName) {
                exists = true;
                break;
            }
        }

    // 3. create group if not exists
        if (!exists) {
            var model = { Name: configs.faceGroupName };
            return callFaceApiEndpoint(`/persongroups/${configs.faceGroupName}`, 'put', model);
        } else {
            return Promise.resolve();
        }
    }, handleError)
    .then(() => {
    // 4. get all persons in group
        log.append('Face group initialized.');
        return callFaceApiEndpoint(`/persongroups/${configs.faceGroupName}/persons`, 'get');
    }, handleError)
    .then((persons) => {
        var exists = false;
        for (var i = 0; i < persons.length; i++) {
            if (persons[i].name == configs.facePersonName) {
                exists = true;
                break;
            }
        }
    // 5. create person if not exists
        if (!exists) {
            var model = { Name: configs.facePersonName };
            return callFaceApiEndpoint(`/persongroups/${configs.faceGroupName}/persons`, 'post', model);
        } else {
            return Promise.resolve({ personId: persons[i].personId });
        }
    }, handleError)
    .then((person) => {
        log.append('Person initialized.');
        log.hideAll();        
    // 6. initialize person id
        configs.facePersonId = person.personId;
    }, handleError)


    // ====================================
    // initialize camera
    navigator.getUserMedia({ video: true, audio: false }, (localMediaStream) => {
        videoPreview.srcObject = localMediaStream;
        videoPreview.autoplay = true;
    }, handleError);


    // ====================================
    // attach handlers
    document.getElementById('btnCapture').addEventListener('click', capturePhotoFromCamera);
    document.getElementById('btnSetMaster').addEventListener('click', setImageAsMaster);
    document.getElementById('btnTryUnlock').addEventListener('click', tryToUnlock);
})();