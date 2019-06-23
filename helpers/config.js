var nconf = require('nconf');
var path = require('path');

nconf.file({ file: path.join(__dirname, '..', 'config.json') });

var configHelper = {
    storage: {
        name: nconf.get('storage').name,
        key: nconf.get('storage').key,
        container: nconf.get('storage').container
    },
    face: {
        endpoint: nconf.get('face').endpoint,
        key: nconf.get('face').key,
        group: nconf.get('face').group,
        threshold: 0.7
    }
};

module.exports = configHelper;