var helperConfig = require('./config');

var uuid = require('uuid/v4');

var storage = require('azure-storage');
var blobService = storage.createBlobService(helperConfig.storage.name, helperConfig.storage.key);
    
var helperStorage = {};

helperStorage.createContainerIfNotExistsAsync = async function(containerName) {
    return new Promise((resolve, reject) => {
        blobService.createContainerIfNotExists(containerName, {
            publicAccessLevel: 'blob'
        }, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

helperStorage.uploadAsNewFileAsync = async function(containerName, filePath) {
    return new Promise((resolve, reject) => {
        var blobName = uuid();
        blobService.createBlockBlobFromLocalFile(containerName, blobName, filePath, (error, result, response) => {
            if (!error) { 
                resolve(blobName);
            }
            else { 
                reject(error);
            }
        });
    });
}

module.exports = helperStorage;