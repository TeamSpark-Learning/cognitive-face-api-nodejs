var private = {
    container: document.getElementById('msgLog'),
    messages: {
        progress: document.getElementById('msgProgress'),
        fail: document.getElementById('msgFailure'),
        success: document.getElementById('msgSuccess'),
        ready: document.getElementById('msgReady')
    }
};

var helperLog = { };

helperLog.logClear = function() {
    private.container.innerHTML = '';
}

helperLog.logAppend = function(message) {
    var li = document.createElement('li');
    var text = document.createTextNode(message);
    li.appendChild(text);
    private.container.appendChild(li);
}

helperLog.logError = function(error) {
    console.error(error);
}

helperLog.statusSetProgress = function() {
    helperLog.statusClear();
    private.messages.progress.classList.remove('d-none');
}

helperLog.statusSetFail = function() {
    helperLog.statusClear();
    private.messages.fail.classList.remove('d-none');
}

helperLog.statusSetSuccess = function() {
    helperLog.statusClear();
    private.messages.success.classList.remove('d-none');
}

helperLog.statusSetReady = function() {
    helperLog.statusClear();
    private.messages.ready.classList.remove('d-none');
}

helperLog.statusClear = function() {
    private.messages.progress.classList.add('d-none');
    private.messages.fail.classList.add('d-none');
    private.messages.success.classList.add('d-none');
    private.messages.ready.classList.add('d-none');
}

module.exports = helperLog;