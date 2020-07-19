// Getting current task id
let TASKS = {lastAssignedId: 0};
let taskToWindow = {};
const tabIdToURL = {};
const activeTabId = 0;
const backgroundPageId = -1;

// Initializing lunr index for archived pages.
var searchIndex = elasticlunr(function() {
    this.addField('title');
    this.addField('text');
    this.setRef('id');
});

console.log('init script is running');

function isEmpty(obj) {
    for (let prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }
    return JSON.stringify(obj) === JSON.stringify({});
}

chrome.storage.local.get(["sailboatInitialised", 'CTASKID', 'TASKS', 'taskToWindow'], function (response) {
    if (typeof response["sailboatInitialised"] !== 'undefined' && typeof response['CTASKID'] !== 'undefined' && response['CTASKID'] !== -1) {
        TASKS = response['TASKS'];
        activateDefaultTaskOnStartup(false);
        initSearchIndex();
    } else {
        console.log('Creating default task');
        // Set the variables in the local storage if sailboatInitialised is not true
        createAndActivateDefaultTask();

        chrome.storage.local.set({"page-content": {}});
        chrome.storage.local.set({"collections": {'Books': {}, 'Movies': {}, 'People': {}, 'Places': {}}});
        chrome.storage.local.set({"text-log": {}});
        chrome.storage.local.set({"tags": {}});
        chrome.storage.local.set({"click-log": {}});
        chrome.storage.local.set({"report-views": {}});
        chrome.storage.local.set({
            "report-clicks": {
                'SB results clicks': 0,
                'Open Archived Pages': 0,
                'Export JSON': 0,
                'Restore JSON': 0
            }
        });

        const DEFAULT_SETTINGS = {
            "notifications": "Enabled",
            "suggestions-based-on": "Open tabs",
            "suggestions-threshold": "Medium",
            "block-notifications-on": ["www.google.com", "www.google.co.in", "www.facebook.com"],
            "isDockCollapsed": "false"
        };
        // Setting default settings in local storage.
        chrome.storage.local.set({"sailboat-settings": DEFAULT_SETTINGS});

        const defaultAdvSearchSettings = {"search in": "Open tabs"};
        chrome.storage.local.set({"advanced-search-settings": defaultAdvSearchSettings});

        chrome.storage.local.set({"debug-stopwords": []});
        chrome.bookmarks.getTree(function(bookmarks) {
            chrome.storage.local.set({'allBookmarks': bookmarks});
        });
        chrome.storage.local.set({"sailboatInitialised": 'true'}, function () {
            console.log("sailboatInitialised set to true in local storage.");
        });
    }
});

function initSearchIndex() {
    chrome.storage.local.get('page-content', function(response) {
        const pageContent = response['page-content'];
        for (let url in pageContent) {
            searchIndex.addDoc({
                'id': url,
                'title': pageContent[url].title,
                'text': pageContent[url].textContent
            });
        }
    });
}

//
// chrome.storage.local.get("Report Snapshots", function (e) {
//     if (isEmpty(e)) {
//         chrome.storage.local.set({"Report Snapshots": {}});
//     }
// });
//
// chrome.storage.local.get("Report Switches", function (e) {
//     if (isEmpty(e)) {
//         chrome.storage.local.set({"Report Switches": {}});
//     }
// });
//
// chrome.storage.local.get("Report Views", function (e) {
//     if (isEmpty(e)) {
//         chrome.storage.local.set({"Report Views": {}});
//     }
// });

// const trackerDownloads = 'tracker-' + sessionId + "-downloads";
// const trackerTabActivate = 'tracker-' + sessionId + "-tab-activate";
// const trackerTabCreate = 'tracker-' + sessionId + "-tab-create";
// const trackerTabRemove = 'tracker-' + sessionId + "-tab-remove";
//
// chrome.storage.local.get(trackerDownloads, function (e) {
//     if (isEmpty(e)) {
//         let obj = {};
//         obj[trackerDownloads] = {};
//         chrome.storage.local.set(obj);
//     }
// });
//
// chrome.storage.local.get(trackerTabActivate, function (e) {
//     if (isEmpty(e)) {
//         let obj = {};
//         obj[trackerTabActivate] = {};
//         chrome.storage.local.set(obj);
//     }
// });
//
// chrome.storage.local.get(trackerTabCreate, function (e) {
//     if (isEmpty(e)) {
//         let obj = {};
//         obj[trackerTabCreate] = {};
//         chrome.storage.local.set(obj);
//     }
// });
//
// chrome.storage.local.get(trackerTabRemove, function (e) {
//     if (isEmpty(e)) {
//         let obj = {};
//         obj[trackerTabRemove] = {};
//         chrome.storage.local.set(obj);
//     }
// });