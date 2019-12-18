var helperInitialize = {};

var helperConfig = require('./config');
var helperLog = require('./log');

var helperFace = require('./face');
var helperStorage = require('./storage');

helperInitialize.initializeWebcamAsync = async function(video) {
    var node = typeof(video) == 'string' ?
        node = document.getElementById(video) :
        video;

    return new Promise((resolve, reject) => {
        navigator.getUserMedia({ video: true, audio: false }, (localMediaStream) => {
            node.srcObject = localMediaStream;
            node.autoplay = true;
            resolve();
        }, (error) => {
            reject(error);
        });
    });
}

helperInitialize.initializeFaceApiAsync = async function() {
    try {
        helperLog.logAppend('Getting all face groups.');

        var groups = await helperFace.getAllGroupsAsync();

        helperLog.logAppend(`Looking for "${helperConfig.face.group}" group.`);

        var exists = false;
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].personGroupId == helperConfig.face.group) {
                exists = true;
                break;
            }
        }

        if (!exists) {
            helperLog.logAppend(`Group "${helperConfig.face.group}" not found. Creating.`);

            await helperFace.createGroupAsync(helperConfig.face.group, helperConfig.face.group);

            helperLog.logAppend(`Group "${helperConfig.face.group}" created.`);
        } else {
            helperLog.logAppend(`Group "${helperConfig.face.group}" exists.`);
        }
    } catch (error) {
        throw error;
    }
}

helperInitialize.initializeStorageAsync = async function() {
    try {
        await helperStorage.createContainerIfNotExistsAsync(helperConfig.storage.container);
    } catch (error) {
        throw error;
    }
}

module.exports = helperInitialize;