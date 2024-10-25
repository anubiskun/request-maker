/**
 * Copyright (c) 2011, 2012 Juho Nurminen
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

var tabs = { };

delete localStorage['tabs']; // used in <= 0.1.1.6, no longer needed

chrome.browserAction.disable();

// get form data from the content scripts
chrome.extension.onRequest.addListener(function (form, sender, stop) {
		var id = sender.tab.id;

		if (!tabs[id]) {
			tabs[id] = { };
		}

		if (!localStorage['tabAutoFocus']) {
			localStorage['tabAutoFocus'] = "true";
		} else if (!localStorage['hideTabs']) {
			localStorage['hideTabs'] = "true";
		}

		if (form == 'noScripts' && !localStorage['disableRequestLogging']) {
			tabs[id].noScripts = true;
			chrome.browserAction.enable(id);
		} else if (form == 'yesScripts') {
			delete tabs[id].noScripts;
			if (localStorage['disableRequestLogging']) {
				stop();
			}
		} else if (!localStorage['disableRequestLogging']) {
			if (!tabs[id].forms) {
				tabs[id].forms = [ ];
			}
			tabs[id].forms.push(form);
			chrome.browserAction.enable(id);
		}
	});


// show the page action where necessary
chrome.tabs.onUpdated.addListener(function (id, info) {
		if (tabs[id] && tabs[id].forms) {
			chrome.browserAction.enable(id);
		}
	});


// clean up
chrome.tabs.onRemoved.addListener(function (id) {
		delete tabs[id];
	});
