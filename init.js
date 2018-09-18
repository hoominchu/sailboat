// Local storage fields
const preferredDomainsFieldName = "Preferred domains";
const totalFrequencyFieldName = "Total frequency";
const domainsMetadataFieldName = "metadata";
preferredAuthorsFieldName = "Preferred authors";

// Setting fields of author object
const domainFrequencyFieldName = "frequency";
const activeTasksFieldName = "Active tasks";
const archivedTasksFieldName = "Archived tasks";

// Local storage fields
var preferredAuthorsFieldName = "Preferred authors";
const authorsMetadataFieldName = "metadata";

// Setting fields of author object
const authorFrequencyFieldName = "frequency";
const authorURL = "URL"; // Not being used yet

// Getting current task id
let TASKS = {lastAssignedId: 0};
// var HISTORY = {};
let CTASKID = 0;

const taskToWindow = {};

const tabIdToURL = {};
const activeTabId = 0;

//
const backgroundPageId = -1;
const defaultTaskId = 0;

// //Suggestion log dictionary
// chrome.storage.local.get("Suggestions Log", function (e) {
//     if (isEmpty(e)) {
//         chrome.storage.local.set({"Suggestions Log": {"Correct suggestions": 0, "Incorrect suggestions": 0}});
//     }
// });


chrome.storage.local.get("TASKS", function (taskObject) {
    if (taskObject["TASKS"]) {
        TASKS = taskObject["TASKS"];//On retreiving TASKS from chrome storage, one gets an object {TASKS: balhah}, to retreive the actual array call taskObject["TASKS"]
    }
});

// chrome.storage.local.get(historyFieldName, function(historyObj){
//   if(historyObj[historyFieldName]){
//     HISTORY = historyObj[historyFieldName];
//   }
// });

chrome.storage.local.get("Page Content", function (e) {
    if (isEmpty(e)) {
        chrome.storage.local.set({"Page Content": {}});
    }
});

chrome.storage.local.get("Collections", function (e) {
    if (isEmpty(e)) {
        chrome.storage.local.set({"Collections": {}});
    }
});

chrome.storage.local.get("highlightIdx", function (e) {
    if (isEmpty(e)) {
        chrome.storage.local.set({"highlightIdx": 0});
    }
});

chrome.storage.local.get("Text Log", function (e) {
    if (isEmpty(e)) {
        chrome.storage.local.set({"Text Log": {}});
    }
});

chrome.storage.local.get("Tags", function (e) {
    if (isEmpty(e)) {
        chrome.storage.local.set({"Tags": {}});
    }
});

chrome.storage.local.get("Click Log", function (e) {
    if (isEmpty(e)) {
        chrome.storage.local.set({"Click Log": {}});
    }
});


chrome.storage.local.get("Settings", function (e) {
    if (isEmpty(e)) {
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
        })
    }
});

chrome.storage.local.get("Advanced Search Settings", function (e) {
    if (isEmpty(e)) {
        const defaultAdvSearchSettings = {
            "search in": "Open tabs"
        };
        chrome.storage.local.set({"Advanced Search Settings": defaultAdvSearchSettings}, function () {
            // console.log("Advanced search settings initialised.");
        })
    }
});

chrome.storage.local.get("Debug Stopwords", function (e) {
    if (isEmpty(e)) {
        chrome.storage.local.set({"Debug Stopwords": []}, function () {
            // console.log("Debug stopwords initialised.");
        })
    }
});

// chrome.storage.local.get("CTASKID", function (cTaskIdObject) {
//     if (cTaskIdObject["CTASKID"]>0) {
//         CTASKID = cTaskIdObject["CTASKID"];
//     }
// });

// chrome.storage.local.get(preferredAuthorsFieldName, function (prefAuthObj) {
//     if (JSON.stringify(prefAuthObj) == "{}") {
//         // Adding to the local storage if the field doesn't exist already.
//         var o = {};
//         o[preferredAuthorsFieldName] = {};
//         o[preferredAuthorsFieldName]["metadata"] = {};
//         o[preferredAuthorsFieldName]["metadata"][totalFrequencyFieldName] = 0;
//         console.log(o);
//         chrome.storage.local.set(o, function () {
//             "init"
//         });
//     }
// });

// chrome.storage.local.get(preferredDomainsFieldName, function (prefDomainsObj) {
//     if (JSON.stringify(prefDomainsObj) == "{}") {
//         // Adding to the local storage if the field doesn't exist already.
//         var o = {};
//         o[preferredDomainsFieldName] = {};
//         o[preferredDomainsFieldName]["metadata"] = {};
//         o[preferredDomainsFieldName]["metadata"][totalFrequencyFieldName] = 0;
//         console.log(o);
//         chrome.storage.local.set(o, function () {
//             "init"
//         });
//     }
// });

function isEmpty(obj) {
    for(let prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return JSON.stringify(obj) === JSON.stringify({});
}