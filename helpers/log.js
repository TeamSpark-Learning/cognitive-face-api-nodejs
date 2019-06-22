var private = {
    container: document.getElementById('msgLog'),
    messages: {
        progress: document.getElementById('msgProgress'),
        fail: document.getElementById('msgSuccess'),
        success: document.getElementById('msgFailure')
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

helperLog.hideAll = function() {
    private.messages.progress.classList.add('d-none');
    private.messages.fail.classList.add('d-none');
    private.messages.success.classList.add('d-none');
}

module.exports = helperLog;