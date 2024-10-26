var script, noscript;

function absolutify(url) {
	if (url === '') {
		url = location.origin + location.pathname;
	} else if (/^https?:\/\//.test(url)) {
		url = url;
	} else if (!url) {
		url = location.origin + location.pathname + location.search;
	} else if (/^\?/.test(url)) {
		url = location.origin + location.pathname + url;
	} else if (/^\/\//.test(url)) {
		url = location.protocol + url;
	} else if (/^\//.test(url)) {
		url = location.origin + url;
	} else {
		url = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1) + url;
	}

	return url.replace(/(^https?:\/\/[^\/]+)(\/[^\?]+)(\?|$)/i, function ($0, $1, $2, $3) {
		$2 = $2.replace(/\\/g, '/');
		while ($2 != ($2 = $2.replace(/\/\.(\/|$)/g, '/')));
		while ($2 != ($2 = $2.replace(/(^|\/[^\/]+)\/\.\.(\/|$)/g, '/')));
		return $1 + $2 + $3;
	});
}

var cScriptLoader = (function ()
{
    function cScriptLoader(files)
    {
        var _this = this;
        this.log = function (t)
        {
            console.log("ScriptLoader: " + t);
        };
        this.withNoCache = function (filename)
        {
            if (filename.indexOf("?") === -1)
                filename += "?no_cache=" + new Date().getTime();
            else
                filename += "&no_cache=" + new Date().getTime();
            return filename;
        };
        this.loadStyle = function (filename)
        {
            // HTMLLinkElement
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = _this.withNoCache(filename);
            _this.log('Loading style ' + filename);
            link.onload = function ()
            {
                _this.log('Loaded style "' + filename + '".');
            };
            link.onerror = function ()
            {
                _this.log('Error loading style "' + filename + '".');
            };
            _this.m_head.appendChild(link);
        };
        this.loadScript = function (i)
        {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = _this.withNoCache(_this.m_js_files[i]);
            var loadNextScript = function ()
            {
                if (i + 1 < _this.m_js_files.length)
                {
                    _this.loadScript(i + 1);
                }
            };
            script.onload = function ()
            {
                _this.log('Loaded script "' + _this.m_js_files[i] + '".');
                loadNextScript();
            };
            script.onerror = function ()
            {
                _this.log('Error loading script "' + _this.m_js_files[i] + '".');
                loadNextScript();
            };
            _this.log('Loading script "' + _this.m_js_files[i] + '".');
            _this.m_head.appendChild(script);
        };
        this.loadFiles = function ()
        {
            // this.log(this.m_css_files);
            // this.log(this.m_js_files);
            for (var i = 0; i < _this.m_css_files.length; ++i)
                _this.loadStyle(_this.m_css_files[i]);
            _this.loadScript(0);
        };
        this.m_js_files = [];
        this.m_css_files = [];
        this.m_head = document.getElementsByTagName("head")[0];
        // this.m_head = document.head; // IE9+ only
        function endsWith(str, suffix)
        {
            if (str === null || suffix === null)
                return false;
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        }
        for (var i = 0; i < files.length; ++i)
        {
            if (endsWith(files[i], ".css"))
            {
                this.m_css_files.push(files[i]);
            }
            else if (endsWith(files[i], ".js"))
            {
                this.m_js_files.push(files[i]);
            }
            else
                this.log('Error unknown filetype "' + files[i] + '".');
        }
    }
    return cScriptLoader;
})();

console.log("Script Injector Loaded!");

try {
	// Check whether JavaScript is on or not
	noscript = document.createElement('noscript');
	noscript.innerText = 'no scripts?';
	noscript.style.display = 'block';
	noscript.style.visibility = 'hidden';
	noscript.style.position = 'fixed';
	document.documentElement.appendChild(noscript);
	if (noscript.clientHeight) { // has the noscript element been rendered?
		if (window == window.top) {
			chrome.runtime.sendMessage({ action: 'noScripts' });
		}
		document.documentElement.removeChild(noscript);
		throw new Error('JavaScript is disabled'); // end execution
	} else {
		chrome.runtime.sendMessage({ action: 'yesScripts' }, (data) => {
			// request logging disabled
			if (data) {
				document.documentElement.removeChild(script);
			}
		});
		document.documentElement.removeChild(noscript);
	}

	// inject catcher.js to the DOM
	script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = chrome.runtime.getURL('catcher.js');
	script.innerHTML = '<!-- script injected by Anubiskun -->';
	document.documentElement.prepend(script);
	

	// forward the events
	script.addEventListener('chkponkhgjjimmbdfndpmaenfioopinf', function (event) {
		chrome.runtime.sendMessage({
			'anu': true,
			'type': event.detail.type,
			'method': event.detail.method,
			'url': absolutify(event.detail.url),
			'headers': event.detail.headers ? event.detail.headers : [],
			'data': event.detail.data
		});
	});
} catch (e) {
	if (e.message != 'JavaScript is disabled') {
		throw e;
	}
}
