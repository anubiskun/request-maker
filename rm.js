async function setStorage(key, value) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ [key]: value }, function() {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}
async function getStorage(key) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(key, function(result) {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve(result[key]);
			}
		});
	});
}

async function delStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove(key, function() {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(); // success
            }
        });
    });
}

function getForm() {
    var s, form = {
        'type': 'RM',
        'method': ui('method').__proto__.innerText,
        'url': ui('url').__proto__.value,
        'headers': [],
        'data': []
    };

    for (i = 0; i < ui('requestheaders').body.childNodes.length; i++) {
        s = ui('requestheaders').body.childNodes[i].childNodes[0].innerText;
        if (s.match(/^Accept-Charset$/i) ||
            s.match(/^Accept-Encoding$/i) ||
            s.match(/^Connection$/i) ||
            s.match(/^Content-Length$/i) ||
            s.match(/^Cookie$/i) ||
            s.match(/^Cookie2$/i) ||
            s.match(/^Content-Transfer-Encoding$/i) ||
            s.match(/^Date$/i) ||
            s.match(/^Expect$/i) ||
            s.match(/^Host$/i) ||
            s.match(/^Keep-Alive$/i) ||
            s.match(/^Referer$/i) ||
            s.match(/^TE$/i) ||
            s.match(/^Trailer$/i) ||
            s.match(/^Transfer-Encoding$/i) ||
            s.match(/^Upgrade$/i) ||
            s.match(/^User-Agent$/i) ||
            s.match(/^Via$/i) ||
            s.match(/^Proxy-/i) ||
            s.match(/^Sec-/i) ||
            s.match(/^Origin$/i)) {
            throw new Error('Unsafe request header');
        }
        form.headers.push([ui('requestheaders').body.childNodes[i].childNodes[0].innerText, ui('requestheaders').body.childNodes[i].childNodes[1].innerText])
    }

    for (i = 0; i < ui('requestdata').body.childNodes.length; i++) {
        if (ui('requestdata').body.childNodes[i].childNodes[0].getAttribute('contenteditable') === null) { // raw data
            form.data.push(ui('requestdata').body.childNodes[i].childNodes[1].innerText);
        } else {
            form.data.push([ui('requestdata').body.childNodes[i].childNodes[0].innerText, ui('requestdata').body.childNodes[i].childNodes[1].innerText])
        }

    }

    return form;
}

function stringifyFormData(form) {
    var i, ct = 'text/plain', boundary, data = '';

    // get the content type
    for (i = 0; i < form.headers.length; i++) {
        if (form.headers[i][0].toLowerCase() == 'content-type') {
            ct = form.headers[i][1];
        }
    }

    switch (ct.split(';')[0].toLowerCase()) {

        case 'multipart/form-data':
            // parse the boundary
            boundary = ct.replace(/^.*;\s*boundary=(?:"([^"]{0,70})"|([^;]{0,70})).*$/i, '$1$2');
            if (boundary == ct) {
                boundary = '';
            }

            // build the content
            for (i = 0; i < form.data.length; i++) {
                data += (i ? '\n' : '') + '--' + boundary + '\n';
                if (form.data[i] instanceof Array) {
                    data += 'Content-Disposition: form-data; name="' + encodeURIComponent(form.data[i][0]) + '"\n\n' + form.data[i][1];
                } else { // raw data
                    data += form.data[i];
                }
            }
            data += '\n--' + boundary + '--';
            break;

        case 'application/x-www-form-urlencoded':
        default:
            for (i = 0; i < form.data.length; i++) {
                if (form.data[i] instanceof Array) {
                    data += (i ? '&' : '') + encodeURIComponent(form.data[i][0]) + '=' + encodeURIComponent(form.data[i][1]);
                } else { // raw data
                    data += (i ? '&' : '') + form.data[i];
                }
            }

    }

    return data;
}

function addRow(table, data, before) {
    var i, name, value, special = false,
        row = document.createElement('div'),
        cells = [
            document.createElement('div'),
            document.createElement('div')
        ],
        toggler,
        closer = document.createElement('button');

    if (data instanceof Array) {
        name = data[0];
        value = data[1];
    } else {
        name = 'Raw data';
        value = data.toString();
        special = true;
    }

    if (!special) {
        cells[0].setAttribute('contenteditable', '');
    }
    cells[0].setAttribute('spellcheck', 'false');
    cells[0].innerText = name;

    cells[1].setAttribute('contenteditable', '');
    cells[1].setAttribute('spellcheck', 'false');
    cells[1].innerText = value;

    if (ui(table).__proto__.id == 'requestdata') {
        toggler = document.createElement('button');
        toggler.setAttribute('type', 'button');
        toggler.addEventListener('click', function () { toggleRowType(this.parentNode) });
    }

    closer.setAttribute('type', 'button');
    closer.addEventListener('click', function () { removeRow(this.parentNode) });

    row.appendChild(cells[0]);
    row.appendChild(cells[1]);
    if (ui(table).__proto__.id == 'requestdata') {
        row.appendChild(toggler);
    }
    row.appendChild(closer);

    if (before) {
        ui(table).body.insertBefore(row, before);
    } else {
        ui(table).body.appendChild(row);
        ui(table).body.scrollTop = ui(table).body.scrollHeight;
    }

    for (i = 0; i < ui(table).head.childNodes.length; i++) {
        if (ui(table).head.childNodes[i].dataset) {
            ui(table).head.childNodes[i].dataset['sort'] = 'none';
        }
    }
}

function removeRow(row) {
    row.parentNode.removeChild(row);
}

function toggleRowType(row) {
    var i, array, data,
        ct = 'text/plain';

    // get the content type
    for (i = 0; i < ui('requestheaders').body.childNodes.length; i++) {
        if (ui('requestheaders').body.childNodes[i].childNodes[0].innerText.toLowerCase() == 'content-type') {
            ct = ui('requestheaders').body.childNodes[i].childNodes[1].innerText;
        }
    }

    // do the conversion
    if (row.childNodes[0].getAttribute('contenteditable') === null) { // raw to formatted
        switch (ct.split(';')[0].toLowerCase()) {
            case 'multipart/form-data':
                // parse the boundary
                boundary = ct.replace(/^.*;\s*boundary=(?:"([^"]{0,70})"|([^;]{0,70})).*$/i, '$1$2');
                if (boundary == ct) {
                    boundary = '';
                }

                // split at boundaries
                array = row.childNodes[1].innerText.replace(
                    new RegExp('\n--' + boundary.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + '--$', 'm'), ''
                ).split('\n--' + boundary + '\n');

                for (i = 0; i < array.length; i++) {
                    array[i] = array[i].split('\n\n'); // separate the headers from the content
                    // parse the name
                    if (array[i][0] == (array[i][0] = array[i][0].replace(/^[\s\S]*content-disposition:\s*form-data\s*;(?:.*;)*\s*name=(?:"([^"\n]*)"|([^;\n]*))[\s\S]*$/im, '$1$2'))) {
                        array[i][0] = '';
                    }
                    // rejoin the value
                    array[i][1] = array[i].slice(1).join('\n\n');

                    addRow('requestdata', [decodeURIComponent(array[i][0]), array[i][1]], row);
                }
                removeRow(row);
                break;

            case 'application/x-www-form-urlencoded':
                array = row.childNodes[1].innerText.split('&');
                for (i = 0; i < array.length; i++) {
                    addRow('requestdata', [
                        decodeURIComponent(array[i].substr(0, array[i].indexOf('=') != -1 ? array[i].indexOf('=') : undefined)),
                        array[i].indexOf('=') != -1 ? decodeURIComponent(array[i].substr(array[i].indexOf('=') + 1)) : ''
                    ], row);
                }
                removeRow(row);
                break;
        }
    } else { // formatted to raw
        switch (ct.split(';')[0].toLowerCase()) {
            case 'multipart/form-data':
                addRow('requestdata', 'Content-Disposition: form-data; name="' + encodeURIComponent(row.childNodes[0].innerText) + '"\n\n' + row.childNodes[1].innerText, row);
                removeRow(row);
                break;

            case 'application/x-www-form-urlencoded':
            default: // unsupported content type
                addRow('requestdata', encodeURIComponent(row.childNodes[0].innerText) + '=' + encodeURIComponent(row.childNodes[1].innerText), row)
                removeRow(row);
                break;
        }
    }
}

function replaceDocument(uri) { // replaces the rendered document without changing session history
    var iframe = document.createElement('iframe');

    iframe.setAttribute('id', 'document');
    iframe.setAttribute('sandbox', ui('document').__proto__.sandbox);
    iframe.setAttribute('src', uri);

    ui('document').__proto__.parentNode.replaceChild(iframe, ui('document').__proto__);

    // prevent navigation
    ui('document').__proto__.addEventListener('beforeload', function (e) {
        if (e.url != this.src) {
            e.preventDefault();
        }
    });
}

function parseQueryString() {
    var i, form;

    if (location.search) {
        form = JSON.parse(decodeURIComponent(escape(atob(location.search.substring(1)))));
    } else {
        form = {
            'method': 'POST',
            'url': '',
            'headers': [],
            'data': []
        };
    }

    ui('tabs').disableTab(1);
    ui('tabs').disableTab(2);
    ui('tabs').disableTab(3);

    if (location.hash == '#options') {
        ui('tabs').showTab(4);
    } else {
        ui('tabs').showTab(0);
    }

    // set the request method
    ui('method').__proto__.innerText = form.method.toUpperCase();

    // clear the tables
    ui('requestheaders').body.innerHTML = '';
    ui('requestdata').body.innerHTML = '';

    // display the form
    ui('url').__proto__.value = form.url;
    for (i = 0; i < form.headers.length; i++) {
        addRow('requestheaders', form.headers[i]);
    }
    for (i = 0; i < form.data.length; i++) {
        addRow('requestdata', form.data[i]);
    }

    // clear no-scripts notice
    chrome.runtime.sendMessage({ action: 'yesScripts' });
}

ui.onReady(async () => {

    window.addEventListener('popstate', parseQueryString);

    // set up the send button
    ui('request').__proto__.addEventListener('submit', function (e) {
        var i, form,
            request = new XMLHttpRequest();

        e.preventDefault();

        ui('tabs').disableTab(1);
        ui('tabs').disableTab(2);
        ui('tabs').disableTab(3);

        // reset the status
        ui('HTTPStatusText').__proto__.innerText = '';
        // do the XHR
        request.addEventListener('readystatechange', async function () {
            var doctype, html, title;

            // update the status
            ui('XHRStatus').__proto__.firstChild.style.webkitTransition = null;
            ui('XHRStatus').__proto__.firstChild.style.width = this.readyState * 25 + '%';

            ui('url').__proto__.style.backgroundColor = ''; // clear errors
            switch (this.readyState) {
                case this.HEADERS_RECEIVED:
                    ui('tabs').enableTab(1);
                    if (await getStorage('tabAutoFocus')) {
                        ui('tabs').showTab(1);
                    }

                    ui('HTTPStatusText').__proto__.innerText = this.status + ' ' + this.statusText;
                    ui('responseheaders').__proto__.contentWindow.location.replace('view-source/view-source.html?m=text/plain&c=' + encodeURIComponent(this.getAllResponseHeaders()));
                    break;
                case this.responseText && this.DONE:
                    ui('source').__proto__.contentWindow.location.replace('view-source/view-source.html?m=' + this.getResponseHeader("Content-Type").split(';')[0] + '&c=' + encodeURIComponent(this.responseText));
                    ui('tabs').enableTab(3);
                    if (await getStorage('tabAutoFocus')) {
                        ui('tabs').showTab(3);
                    }
                    if (this.getResponseHeader("Content-Type") && (
                        this.getResponseHeader("Content-Type").substr(0, 9) == 'text/html' ||
                        this.getResponseHeader("Content-Type").substr(0, 17) == 'application/xhtml'
                    )) {
                        // parse the title
                        ui('title').__proto__.style.backgroundImage = "url('chrome://favicon/" + form.url + "')";
                        title = this.responseText.match(/(?:<title(?:\s[^>]*)?>)((?:\n|.)*)<\/title(?:\s[^>]*)*>/im);
                        title = title ? title[1].replace('\n', ' ')
                            .replace(/&([^;]*);?/g, function ($0, $1) { // parse html entities
                                switch ($1) {
                                    case 'amp': return '&';
                                    case 'lt': return '<';
                                    case 'gt': return '>';
                                    case 'quot': return '"';
                                    default: if ($1.charAt(0) == '#') {
                                        $1 = $1.substr(1);
                                        if ($1.charAt(0).toLowerCase() == 'x') {
                                            $1 = '0' + $1;
                                        }

                                        return String.fromCharCode($1);
                                    }
                                }
                            }) :
                            form.url;
                        ui('title').__proto__.replaceChild(document.createTextNode(title), ui('title').__proto__.firstChild); // .firstChild is the text node

                        // parse the doctype
                        html = this.responseText.replace(/^[\s\n]*<!DOCTYPE\s[^>]*>/im, function (s) {
                            doctype = s;
                            return '';
                        });

                        // render the document
                        replaceDocument('data:'
                            + this.getResponseHeader("Content-Type").replace(/^application\/xhtml[^;]*/, 'text/html')
                            + ';base64,'
                            + btoa(unescape(encodeURI(
                                (doctype ? doctype : '') +
                                '<base href="' +
                                form.url.replace(/&/g, '&amp;').replace(/</g, '&lt;') // escape special characters
                                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;') +
                                '" />' + html
                            )))
                        );

                        ui('tabs').enableTab(2);
                        if (await getStorage('tabAutoFocus')) {
                            ui('tabs').showTab(2);
                        }
                    }
            }
        });

        request.addEventListener('error', function () {
            ui('url').__proto__.style.backgroundColor = '#FDD';
        });

        // update the status
        ui('XHRStatus').__proto__.firstChild.style.webkitTransition = '0';
        ui('XHRStatus').__proto__.firstChild.style.width = '0';

        try {

            // send it
            form = getForm();
            request.open(form.method, form.url);
            for (i = 0; i < form.headers.length; i++) {
                request.setRequestHeader(form.headers[i][0], form.headers[i][1]);
            }
            request.send(stringifyFormData(form));

        } catch (e) {
            ui('url').__proto__.style.backgroundColor = '#FDD';
            return;
        }

        // log the request in the page action
        chrome.runtime.sendMessage(form);

        history.pushState(null, null, '?' + btoa(unescape(encodeURI(JSON.stringify(form)))));

    });

    // set up the forms and controls in the request tab
    ui('method').__proto__.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });
    ui('method').__proto__.addEventListener('mousedown', function (e) {
        var i, methods = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'];

        e.preventDefault();

        for (i = 0; i < methods.length; i++) {
            if (methods[i] == this.innerText) {
                break;
            }
        }
        if (e.button == 0) {
            i++;
        } else if (e.button == 2) {
            i--;
        }
        this.innerText = methods[i + methods.length * (i < 0) - methods.length * (i >= methods.length)];
    });
    ui('headeradder').__proto__.addEventListener('submit', function (e) {
        e.preventDefault();
        addRow('requestheaders', [ui('headeradder_header').__proto__.value, ui('headeradder_content').__proto__.value]);
        ui('headeradder_header').__proto__.value = '';
        ui('headeradder_content').__proto__.value = '';
    });
    ui('dataadder').__proto__.addEventListener('submit', function (e) {
        e.preventDefault();
        addRow('requestdata', [ui('dataadder_name').__proto__.value, ui('dataadder_value').__proto__.value]);
        ui('dataadder_name').__proto__.value = '';
        ui('dataadder_value').__proto__.value = '';
    });

    // set up the Allow JavaScript checkbox
    ui('js').__proto__.addEventListener('change', function () {
        if (this.checked) {
            ui('document').__proto__.sandbox = 'allow-scripts';
        } else {
            ui('document').__proto__.sandbox = '';
        }

        ui('document').__proto__.src = ui('document').__proto__.src;
    });
    if (await getStorage('allowJavaScript')) {
        ui('js').__proto__.click();
    }

    // options tab
    if (await getStorage('tabAutoFocus')) {
        ui('tabAutoFocus').__proto__.checked = true;
    }
    ui('tabAutoFocus').__proto__.addEventListener('change', async () => {
        if (this.checked) {
            await setStorage('tabAutoFocus', true);
        } else {
            await delStorage('tabAutoFocus');
        }
    });
    if (await getStorage('hideTabs')) {
        ui('hideTabs').__proto__.checked = true;
        ui('hider').__proto__.style.height = '100%';
        document.body.style.webkitTransition = '0';
        document.body.style.left = '-130px';
        // queue an asynchronous function
        setTimeout(function () {
            document.body.style.webkitTransition = null;
        }, 0);
    }
    ui('hideTabs').__proto__.addEventListener('change', async () => {
        if (this.checked) {
            await setStorage('hideTabs', true);
        } else {
            await delStorage('hideTabs');
        }
    });
    if (await getStorage('allowJavaScript')) {
        ui('allowJavaScript').__proto__.checked = true;
    }
    ui('allowJavaScript').__proto__.addEventListener('change', async () => {
        if (this.checked) {
            await setStorage('allowJavaScript', true);
            if (!ui('js').__proto__.checked) {
                ui('js').__proto__.click();
            }
        } else {
            await delStorage('allowJavaScript');
            if (ui('js').__proto__.checked) {
                ui('js').__proto__.click();
            }
        }
    });
    if (await getStorage('disableRequestLogging')) {
        ui('disableRequestLogging').__proto__.checked = true;
    }
    ui('disableRequestLogging').__proto__.addEventListener('change', async () => {
        if (this.checked) {
            await setStorage('disableRequestLogging', true);
        } else {
            await delStorage('disableRequestLogging');
        }
    });
    if (await getStorage('useDefaultScrollbarInLog')) {
        ui('useDefaultScrollbarInLog').__proto__.checked = true;
    }
    ui('useDefaultScrollbarInLog').__proto__.addEventListener('change', async () => {
        if (this.checked) {
            await setStorage('useDefaultScrollbarInLog', true);
        } else {
            await delStorage('useDefaultScrollbarInLog');
        }
    });

    // set up the hide button
    ui('hider').__proto__.addEventListener('click', function () {
        if (document.body.style.left == '-130px') {
            document.body.style.left = null;
            this.style.height = null;
        } else {
            document.body.style.left = '-130px';
            this.style.height = '100%';
        }
    });

    parseQueryString();
});
