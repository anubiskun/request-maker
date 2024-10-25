/**
 * Copyright (c) 2011 Juho Nurminen
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

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
			chrome.extension.sendRequest('noScripts');
		}
		document.documentElement.removeChild(noscript);
		throw new Error('JavaScript is disabled'); // end execution
	} else {
		chrome.extension.sendRequest('yesScripts', function () {
			// request logging disabled
			document.documentElement.removeChild(script);
		});
		document.documentElement.removeChild(noscript);
	}

	// inject catcher.js to the DOM
	script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = chrome.extension.getURL('catcher.js');
	script.innerHTML = '<!-- script injected by Request Maker -->';
	document.documentElement.appendChild(script);

	// forward the events
	script.addEventListener('chkponkhgjjimmbdfndpmaenfioopinf', function (event) {
		chrome.extension.sendRequest({
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
