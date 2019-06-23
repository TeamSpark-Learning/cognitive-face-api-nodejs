var helperHttps = require('./https');

var method = {
    GET: 'GET',
    PUT: 'PUT',
    POST: 'POST'
};

var helperFace = { };

helperFace.getAllGroupsAsync = async function() {
    try {
        return await helperHttps.callFaceApiEndpointAsync(
            '/persongroups',
            method.GET);
    } catch (error) {
        throw error;
    }
}

helperFace.createGroupAsync = async function(groupId, groupName) {
    var model = { name: groupName };
    
    try {
        return await helperHttps.callFaceApiEndpointAsync(
            `/persongroups/${groupId}`,
            method.PUT,
            model);
    } catch (error) {
        throw error;
    }
}

helperFace.getAllPersonsAsync = async function(groupId) {
    try {
        return await helperHttps.callFaceApiEndpointAsync(
            `/persongroups/${groupId}/persons`,
            method.GET);
    } catch (error) {
        throw error;
    }
}

helperFace.createPersonAsync = async function(groupId, personName) {
    var model = { name: personName };

    try {
        return await helperHttps.callFaceApiEndpointAsync(
            `/persongroups/${groupId}/persons`,
            method.POST,
            model);
    } catch (error) {
        throw error;
    }
}






module.exports = helperFace;