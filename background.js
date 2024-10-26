// background.js

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

const tabs = {};

// Disable the action initially
chrome.action.disable();

// Message listener
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
	
    const id = sender.tab?.id;

    if (!tabs[id]) {
        tabs[id] = {};
    }

	if (request.action === 'getTabData') {
		sendResponse(tabs || {});
	}

	if (!await getStorage('tabAutoFocus')) {
		await setStorage('tabAutoFocus', "true");
	} else if (!await getStorage('hideTabs')) {
		await setStorage('hideTabs', "true");
	}	

	try {
		if (request.action === 'noScripts' && !(await getStorage('disableRequestLogging'))) {
			tabs[id].noScripts = true;
			chrome.action.enable(id);
		} else if (request.action === 'yesScripts') {
			delete tabs[id].noScripts;
			if (await getStorage('disableRequestLogging')) {
				sendResponse(true);
			} 
		} else if (!(await getStorage('disableRequestLogging'))) {
			if (!tabs[id].forms) {
				tabs[id].forms = [];
			}
			tabs[id].forms.push(request);
			
			chrome.action.enable(id);
		}
	} catch (error) {
		console.error("Error handling message:", error);
	}
	
});

// Tab update listener
chrome.tabs.onUpdated.addListener(async (id, info) => {
    if (tabs[id] && tabs[id].forms) {
        chrome.action.enable(id);
    }
});

// Tab removal listener
chrome.tabs.onRemoved.addListener(function (id) {
    delete tabs[id];
});
