// Getting current task id
let TASKS = {lastAssignedId: 0};
// var HISTORY = {};

const taskToWindow = {};

const tabIdToURL = {};
const activeTabId = 0;

const backgroundPageId = -1;

// Initializing lunr index for archived pages.
var lunrIndex;
var archivedDocs = [];

function isEmpty(obj) {
    for (let prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }
    return JSON.stringify(obj) === JSON.stringify({});
}

// Set the variables in the local storage if sailboatInitialised is not true

chrome.storage.local.get(["sailboatInitialised", 'CTASKID'], function (response) {
    if (typeof response["sailboatInitialised"] !== 'undefined' && typeof response['CTASKID'] !== 'undefined' && response['CTASKID'] !== -1) {
        activateTaskInWindow(response['CTASKID']);
    } else {

        createAndActivateDefaultTask();

        chrome.storage.local.get('Page Content', function (pageContent) {
            pageContent = pageContent['Page Content'];
            for (var url in pageContent) {
                var doc = {};
                doc['url'] = url;
                doc['content'] = pageContent[url];
                archivedDocs.push(doc);
            }

            // lunrIndex = elasticlunr(function () {
            //     this.setRef('url');
            //     this.addField('content');
            // });

            // for (var i = 0; i < archivedDocs.length; i++) {
            //     lunrIndex.addDoc(archivedDocs[i]);
            // }
        });

        chrome.storage.local.set({"Page Content": {}});

        chrome.storage.local.set({"Collections": {'Books': {}, 'Movies': {}, 'People': {}, 'Places': {}}});

        chrome.storage.local.set({"Text Log": {}});

        chrome.storage.local.set({"Tags": {}});

        chrome.storage.local.set({"Click Log": {}});

        chrome.storage.local.set({
            "Report Clicks": {
                'SB results clicks': 0,
                'Open Archived Pages': 0,
                'Export JSON': 0,
                'Restore JSON': 0
            }
        });

        chrome.storage.local.set({ "Report Views": {} });

        const DEFAULT_SETTINGS = {
            "notifications": "Enabled",
            "suggestions based on": "Open tabs",
            "suggestions threshold": "Medium",
            "block notifications on": ["www.google.com", "www.google.co.in", "www.facebook.com"],
            "isDockCollapsed": "false"
        };

        // Setting default settings in local storage.
        chrome.storage.local.set({"Settings": DEFAULT_SETTINGS}, function () {
            // console.log("Settings object initialised in local storage.");
        });

        const defaultAdvSearchSettings = {
            "search in": "Open tabs"
        };
        chrome.storage.local.set({"Advanced Search Settings": defaultAdvSearchSettings}, function () {
            // console.log("Advanced search settings initialised.");
        });

        chrome.storage.local.set({"Debug Stopwords": []}, function () {
            // console.log("Debug stopwords initialised.");
        });

        chrome.storage.local.set({"sailboatInitialised": 'true'}, function () {
            console.log("sailboatInitialised set to true in local storage.");
        });

        chrome.bookmarks.getTree(function(bookmarks) {
            chrome.storage.local.set({'allBookmarks': bookmarks});
        });
    }
});

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