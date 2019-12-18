var url = require('url');
var https = require('https');

var helperConfig = require('./config');

var helperHttps = { };

helperHttps.callFaceApiEndpointAsync = async function (path, method, payload) {
    return new Promise((resolve, reject) => {
        var parsedUrl = url.parse(helperConfig.face.endpoint);
        var options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.path + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': helperConfig.face.key
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
                    var result = data.length == 0 ?
                        null :
                        JSON.parse(data.join(''));

                    resolve(result);
                }
            });
        });

        request.on('error', (error) => {
            reject(error);
        });

        if (!payload) { 
            payload = '';
        }
        
        if (typeof(payload) != 'string') {
            payload = JSON.stringify(payload);
        }

        request.write(payload);
        request.end();
    });
}

module.exports = helperHttps;