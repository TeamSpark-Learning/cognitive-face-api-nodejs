(async function() {
    var helperLog = require('./helpers/log');
    helperLog.logClear();
    helperLog.statusSetProgress();


    var configs2 = require('./helpers/config');

    var helperFace = require('./helpers/face');
    var helperCamera = require('./helpers/camera');

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

    
    var imgPrevew = document.getElementById('imgPreview');

    

    

    var fs = require('fs');
    var path = require('path');

    var url = require('url');
    var https = require('https');

    var uuid = require('uuid/v4');

    var storage = require('azure-storage');
    var blobService = storage.createBlobService(configs2.storage.name, configs2.storage.key);
    
    async function capturePhotoFromCameraAsync() {
        try{
            var image = await helperCamera.takeSnapAsync();
            imgPrevew.setAttribute('src', image);
            await helperCamera.saveImageToFileAsync(imgPrevew, 'file');
        } catch (error) {
            helperLog.logError(error);
        }
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
                        helperLog.logAppend('Preview saved to local file.');
                        resolve(filePath);
                    }
                    else { reject(err); }
                });
            });
        }

        function uploadFileToStorage(filePath) {
            return new Promise((resolve, reject) => {
                var blobName = uuid();
                blobService.createBlockBlobFromLocalFile(configs2.storage.container, blobName, filePath, (error, result, response) => {
                    if (!error) { 
                        helperLog.logAppend('Preview uploaded to Azure Storage.');
                        resolve(blobName);
                    }
                    else { reject(err); }
                });
            });
        }

        function addFaceToModel(blobName) {
            var blobUrl = `https://${configs2.storage.name}.blob.core.windows.net/${configs2.storage.container}/${blobName}`;

            var model = { Url: blobUrl };
            return callFaceApiEndpoint(`/persongroups/${configs2.face.group}/persons/${configs.facePersonId}/persistedfaces`, 'post', model);
        }

        function trainModel() {
            function ensureModelTrained() {
                return callFaceApiEndpoint(`/persongroups/${configs2.face.group}/training`, 'get')
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

            return callFaceApiEndpoint(`/persongroups/${configs2.face.group}/train`, 'post')
            .then(() => {
                return ensureModelTrained();
            }, handleError);
        }

        helperLog.logClear();

        savePreviewToFile()
        .then((filePath) => {
            return uploadFileToStorage(filePath);
        }, handleError)
        .then((blobName) => {
            return addFaceToModel(blobName);
        }, handleError)
        .then(() => {
            helperLog.logAppend('Face added.');
            return trainModel();
        }, handleError)
        .then(() => {
            helperLog.logAppend('Model trained.');
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
                        helperLog.logAppend('Preview saved to local file.');
                        resolve(filePath);
                    }
                    else { reject(err); }
                });
            });
        }

        function uploadFileToStorage(filePath) {
            return new Promise((resolve, reject) => {
                var blobName = uuid();
                blobService.createBlockBlobFromLocalFile(configs2.storage.container, blobName, filePath, (error, result, response) => {
                    if (!error) { 
                        helperLog.logAppend('Preview uploaded to Azure Storage.');
                        resolve(blobName);
                    }
                    else { reject(err); }
                });
            });
        }

        function detectFace(blobName) {
            var blobUrl = `https://${configs2.storage.name}.blob.core.windows.net/${configs2.storage.container}/${blobName}`;

            var model = { Url: blobUrl };
            return callFaceApiEndpoint(`/detect?returnFaceId=true&returnFaceLandmarks=true`, 'post', model);
        }

        function identityFace(faces) {
            var faceIds = faces.map((face) => { return face.faceId; });

            var model = { faceIds: faceIds, personGroupId: configs2.face.group };
            return callFaceApiEndpoint(`/identify`, 'post', model);
        }

        function checkCandidates(faces) {
            return new Promise((resolve, reject) => {
                for (var i = 0; i < faces.length; i++) {
                    for (var j = 0; j < faces[i].candidates.length; j++) {
                        if (faces[i].candidates[j].confidence > configs2.face.threshold) {
                            resolve(true);
                            return;
                        }
                    }
                }
                resolve(false);
            });
        }

        helperLog.logClear();
        helperLog.statusSetProgress();

        savePreviewToFile()
        .then((filePath) => {
            return uploadFileToStorage(filePath);
        }, handleError)
        .then((blobName) => {
            return detectFace(blobName);
        }, handleError)
        .then((faces) => {
            helperLog.logAppend('Face detected.');
            return identityFace(faces);
        }, handleError)
        .then((faces) => {
            helperLog.logAppend('Face identified.');
            return checkCandidates(faces);
        }, handleError)
        .then((result) => {
            if (!!result) {
                helperLog.statusSetSuccess();
            } else {
                helperLog.statusSetFail();
            }
        }, handleError);
    }



    function callFaceApiEndpoint(path, method, payload) {
        return new Promise((resolve, reject) => {
            var parsedUrl = url.parse(configs2.face.endpoint);
            var options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.path + path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': configs2.face.key
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
    // initialize face api
    // 1. get all person gropus
    callFaceApiEndpoint('/persongroups', 'get')
    .then((groups) => {
    // 2. check if person group exists
        var exists = false;
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].personGroupId == configs2.face.group) {
                exists = true;
                break;
            }
        }

    // 3. create group if not exists
        if (!exists) {
            var model = { Name: configs2.face.group };
            return callFaceApiEndpoint(`/persongroups/${configs2.face.group}`, 'put', model);
        } else {
            return Promise.resolve();
        }
    }, handleError)
    .then(() => {
    // 4. get all persons in group
        helperLog.logAppend('Face group initialized.');
        return callFaceApiEndpoint(`/persongroups/${configs2.face.group}/persons`, 'get');
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
            return callFaceApiEndpoint(`/persongroups/${configs2.face.group}/persons`, 'post', model);
        } else {
            return Promise.resolve({ personId: persons[i].personId });
        }
    }, handleError)
    .then((person) => {
        helperLog.logAppend('Person initialized.');
        helperLog.statusClear();        
    // 6. initialize person id
        configs.facePersonId = person.personId;
    }, handleError)





    // ====================================
    // initialize
    var helperInitialize = require('./helpers/initialize');
    try {
        await Promise.all(
            helperInitialize.initializeWebcamAsync('videoPreview'),
            helperInitialize.initializeFaceApiAsync(),
            helperInitialize.initializeStorageAsync()
        );
    } catch(error) {
        helperLog.logError(error);
    }


    // ====================================
    // attach handlers
    document.getElementById('btnCapture').addEventListener('click', capturePhotoFromCameraAsync);
    document.getElementById('btnSetMaster').addEventListener('click', setImageAsMaster);
    document.getElementById('btnTryUnlock').addEventListener('click', tryToUnlock);

    helperLog.statusClear();
})();