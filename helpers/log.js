var private = {
    container: document.getElementById('msgLog'),
    messages: {
        progress: document.getElementById('msgProgress'),
        fail: document.getElementById('msgFailure'),
        success: document.getElementById('msgSuccess')
    }
};

var helperLog = { };

helperLog.clear = function() {
    private.container.innerHTML = '';
}

helperLog.append = function(message) {
    var li = document.createElement('li');
    var text = document.createTextNode(message);
    li.appendChild(text);
    private.container.appendChild(li);
}

helperLog.showProgress = function() {
    helperLog.hideAll();
    private.messages.progress.classList.remove('d-none');
}

helperLog.showFail = function() {
    helperLog.hideAll();
    private.messages.fail.classList.remove('d-none');
}

helperLog.showSuccess = function() {
    helperLog.hideAll();
    private.messages.success.classList.remove('d-none');
}

helperLog.hideAll = function() {
    private.messages.progress.classList.add('d-none');
    private.messages.fail.classList.add('d-none');
    private.messages.success.classList.add('d-none');
}

module.exports = helperLog;