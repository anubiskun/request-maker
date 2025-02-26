(function () {

    var i, j, script,
        open = XMLHttpRequest.prototype.open,
        setRequestHeader = XMLHttpRequest.prototype.setRequestHeader,
        send = XMLHttpRequest.prototype.send,
        submit = HTMLFormElement.prototype.submit,
        button,
        formCatcher,

        // boudary creator for multipart/form-data
        getBoundary = function (data) {
            var i,
                chars = '0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz'
            boundary = '----WebKitFormBoundary';

            for (i = 0; i < 16; i++) {
                boundary += chars[Math.floor(Math.random() * 62)];
            }

            for (i = 0; i < data.length; i++) {
                if (data[i][0].match(boundary) || data[i][1].match(boundary)) {
                    boundary = getBoundary(data);
                    break;
                }
            }

            return boundary;
        },

        array = function () { // JSON fix
            var a = window.Array.apply(window, arguments);
            a.toJSON = undefined;
            return a;
        },

        serializeForm = function (form) {
            var url = form.getAttribute('action') || '',
                method = form.getAttribute('method') && form.getAttribute('method').toUpperCase() == 'POST' ? 'POST' : 'GET',
                data = array(),
                multipart = form.getAttribute('enctype') &&
                    form.getAttribute('enctype').substr(0, 19).toLowerCase() == 'multipart/form-data'
                    ? true : false;

            // parse the data
            for (i = 0; i < form.length; i++) {
                if (form[i].name && form[i].getAttribute('disabled') === null) {
                    if (multipart && method == 'POST' && form[i].nodeName == 'INPUT' && form[i].type.toUpperCase() == 'FILE' && form[i].files.length) {
                        for (j = 0; j < form[i].files.length; j++) {
                            data.push(
                                'Content-Disposition: form-data; name="' + encodeURIComponent(form[i].name) + '"; ' +
                                'filename="' + encodeURIComponent(form[i].files[j].name) + '"\n' +
                                'Content-Type: ' + (form[i].files[j].type || 'text/plain') + '\n\n' +
                                '[File contents not captured]'
                            );
                        }
                    } else if (
                        (form[i].nodeName == 'INPUT' &&
                            (form[i].type.toUpperCase() == 'RADIO' || form[i].type.toUpperCase() == 'CHECKBOX' ? form[i].checked : true) &&
                            (form[i].type.toUpperCase() == 'SUBMIT' ? form[i].isSameNode(button) : true)) ||
                        form[i].nodeName == 'SELECT' ||
                        form[i].nodeName == 'BUTTON' ||
                        form[i].nodeName == 'TEXTAREA'
                    ) {
                        data.push(array(form[i].name, form[i].value));
                    }
                }
            }

            // append GET data to the URL
            if (method == 'GET') {
                if (url.indexOf('#') != -1) {
                    url = url.substr(0, url.indexOf('#'));
                }
                if (url.indexOf('?') != -1 && url.charAt(url.length - 1) != '&') {
                    url += '&';
                } else {
                    url += '?';
                }

                for (i = 0; i < data.length; i++) {
                    url += (i ? '&' : '') + encodeURIComponent(data[i][0]) + '=' + encodeURIComponent(data[i][1]);
                }

                data = array(); // clear data
            }

            return {
                'type': 'Form',
                'method': method,
                'url': url,
                'headers': method == 'POST' ? array(array(
                    'Content-Type',
                    multipart ? 'multipart/form-data; boundary=' + getBoundary(data) : 'application/x-www-form-urlencoded'
                )) : array(),
                'data': data
            };
        };

    // get this script element
    for (i = 0; i < document.scripts.length; i++) {
        if (document.scripts[i].src == 'chrome-extension://chkponkhgjjimmbdfndpmaenfioopinf/catcher.js' ||
            (document.scripts[i].src == 'chrome-extension://hghmdhgjmjbilodfdaabijjjncdggnob/catcher.js')) {
            script = document.scripts[i];
        }
    }
    if (!script) {
        return;
    }

    function restoreXHRAndForm() {
        XMLHttpRequest.prototype.open = open;
        XMLHttpRequest.prototype.setRequestHeader = setRequestHeader;
        XMLHttpRequest.prototype.send = send;
        window.removeEventListener('submit', formCatcher, true);
        HTMLFormElement.prototype.submit = submit;
    }

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.removedNodes.length) {
                for (const node of mutation.removedNodes) {
                    if (node.isSameNode(script)) {
                        restoreXHRAndForm();
                        observer.disconnect(); // Stop observing after script removal
                    }
                }
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true // Observe all descendants
    });

    // Catch XHR
    XMLHttpRequest.prototype.open = function (method, url) {
        open.apply(this, arguments);

        this['chkponkhgjjimmbdfndpmaenfioopinf'] = {
            'type': 'XHR',
            'method': method.toUpperCase(),
            'url': url.toString()
        };
    };

    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
        setRequestHeader.apply(this, arguments);

        header = header === null || header === undefined ? header : header.toString();
        value = value === null || value === undefined ? value : value.toString();

        if (!('headers' in this['chkponkhgjjimmbdfndpmaenfioopinf'])) {
            this['chkponkhgjjimmbdfndpmaenfioopinf'].headers = array();
        }

        if (!( // Check for 'unsafe' headers
            header.match(/^Accept-Charset$/i) ||
            header.match(/^Accept-Encoding$/i) ||
            header.match(/^Connection$/i) ||
            header.match(/^Content-Length$/i) ||
            header.match(/^Cookie$/i) ||
            header.match(/^Cookie2$/i) ||
            header.match(/^Content-Transfer-Encoding$/i) ||
            header.match(/^Date$/i) ||
            header.match(/^Expect$/i) ||
            header.match(/^Host$/i) ||
            header.match(/^Keep-Alive$/i) ||
            header.match(/^Referer$/i) ||
            header.match(/^TE$/i) ||
            header.match(/^Trailer$/i) ||
            header.match(/^Transfer-Encoding$/i) ||
            header.match(/^Upgrade$/i) ||
            header.match(/^User-Agent$/i) ||
            header.match(/^Via$/i) ||
            header.match(/^Proxy-/i) ||
            header.match(/^Sec-/i) ||
            header.match(/^Origin$/i)
        )) {
            this['chkponkhgjjimmbdfndpmaenfioopinf'].headers.push(array(header, value));
        }
    };

    XMLHttpRequest.prototype.send = function (data) {
        var event = document.createEvent('CustomEvent');

        send.apply(this, arguments);

        if (data === null || data === undefined) {
            this['chkponkhgjjimmbdfndpmaenfioopinf'].data = array();
        } else if (data instanceof FormData) {
            this['chkponkhgjjimmbdfndpmaenfioopinf'].data = array('[Unable to capture XHR Level 2 FormData]');
        } else {
            this['chkponkhgjjimmbdfndpmaenfioopinf'].data = array(data.toString());
        }

        event.initCustomEvent('chkponkhgjjimmbdfndpmaenfioopinf', false, false, this['chkponkhgjjimmbdfndpmaenfioopinf']);
        script.dispatchEvent(event);
        delete this['chkponkhgjjimmbdfndpmaenfioopinf'];
    };

    // Catch form submissions
    window.addEventListener('click', function (event) {
        if (
            (event.target.nodeName == 'INPUT' && event.target.type && event.target.type.toUpperCase() == 'SUBMIT') ||
            (event.target.nodeName == 'BUTTON' && (!event.target.type || (event.target.type.toUpperCase() != 'BUTTON' && event.target.type.toUpperCase() != 'RESET')))
        ) {
            // remember a click on a submit button
            button = event.target;
            // queue an asychronous function
            setTimeout(function () {
                // forget the click
                delete button;
            }, 0);
        }
    }, true);

    window.addEventListener('submit', formCatcher = function (event) {
        var result = document.createEvent('CustomEvent');

        result.initCustomEvent('chkponkhgjjimmbdfndpmaenfioopinf', false, false, serializeForm(event.target));
        script.dispatchEvent(result);
    }, true);

    HTMLFormElement.prototype.submit = function () {
        submit.apply(this, arguments);
        formCatcher({ 'target': this });
    };

})();
