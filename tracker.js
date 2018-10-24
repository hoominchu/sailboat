// const reportSnapshotPeriod = 5; // in minutes
//
// // Alarm for taking snapshot of Sailboat
// chrome.alarms.create('reportSnapshot', {'delayInMinutes': 5, 'periodInMinutes': reportSnapshotPeriod});
//
// function getNArchivedTasks(tasks) {
//     let nArchivedTasks = 0;
//
//     if (!tasks)
//         return nArchivedTasks;
//
//     for (const taskid in tasks) {
//         if (taskid !== 'lastAssignedId') {
//             if (tasks[taskid]['archived']) {
//                 nArchivedTasks++;
//             }
//         }
//     }
//     return nArchivedTasks;
// }
//
// function getNArchivedPages(tasks) {
//     let nArchivedPages = {};
//
//     if (!tasks)
//         return nArchivedPages;
//
//     for (const taskid in tasks) {
//         if (taskid !== 'lastAssignedId') {
//             nArchivedPages[taskid] = tasks[taskid]['likedPages'].length;
//         }
//     }
//     return nArchivedPages;
// }
//
// function recordInReport() {
//     var todayDate = new Date().toJSON().slice(0, 10);
//     chrome.storage.local.get('Report Switches', function (report) {
//         report = report['Report Switches'];
//         if (report.hasOwnProperty(todayDate)) {
//             report[todayDate]['nSwitches']++;
//         } else {
//             report[todayDate] = {};
//             report[todayDate]['nSwitches'] = 1;
//         }
//         chrome.storage.local.set({'Report Switches': report});
//     })
// }
//
// function updateClickReport(key) {
//     chrome.storage.local.get('Report Clicks', function (report) {
//         report = report['Report Clicks'];
//         report[key]++;
//         chrome.storage.local.set({'Report Clicks': report});
//     });
// }
//
// function takeReportSnapshot() {
//
//     const now = new Date().getTime();
//
//     chrome.storage.local.get(['Report Snapshots', 'TASKS'], function (response) {
//         chrome.windows.getAll({populate: true}, function (windows) {
//
//             let reportSnapshots = response['Report Snapshots'];
//             let tasks = response['TASKS'];
//
//             reportSnapshots[now] = {};
//
//             const nTasks = Object.keys(tasks).length - 1;
//             const nArchivedTasks = getNArchivedTasks(tasks);
//             const nArchivedPages = getNArchivedPages(tasks);
//             reportSnapshots[now]['nTasks'] = nTasks;
//             reportSnapshots[now]['nArchivedTasks'] = nArchivedTasks;
//             reportSnapshots[now]['nArchivedPages'] = nArchivedPages;
//
//             // Windows part
//             let windowsState = {};
//
//             for (const k in windows) {
//                 const windowID = windows[k]['id'];
//                 const nTabs = windows[k]['tabs'].length;
//                 const isIncognito = windows[k]['incognito'];
//                 windowsState[windowID] = {};
//                 windowsState[windowID]['nTabs'] = nTabs;
//                 windowsState[windowID]['isIncognito'] = isIncognito;
//             }
//             reportSnapshots[now]['windowState'] = windowsState;
//
//             chrome.storage.local.set({'Report Snapshots': reportSnapshots});
//         });
//     });
// }

let tracker = []


function trackEvent(eventName, details){
    let trackEvent = {};
    trackEvent["eventName"] = eventName;
    trackEvent["details"] = details;
    let date = new Date();
    trackEvent["timeStamp"] = date.toString();
    trackEvent["taskToWindow"] = taskToWindow;
    trackEvent["tasks"] = TASKS;
    return trackEvent;
}



chrome.tabs.onCreated.addListener(function (tab){
    let prop = {};
    prop["createdTab"] = tab;
    tracker.push(trackEvent("tab-created", prop));
    updateStorage("tracker", tracker);
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo){
    let prop = {};
    prop["tabId"] = tabId;
    prop["removeinfo"] = removeInfo;
    tracker.push(trackEvent("tab-removed", prop));
    updateStorage("tracker", tracker);

});

chrome.tabs.onActivated.addListener(function (activeInfo){
    let prop = {};
    prop["activeInfo"] = activeInfo;
    tracker.push(trackEvent("tab-activated", prop));
    updateStorage("tracker", tracker);
});

chrome.tabs.onMoved.addListener(function (tabId, moveInfo){
    let prop = {};
    prop["tabId"] = tabId;
    prop["moveInfo"] = moveInfo;
    tracker.push(trackEvent("tab-moved", prop));
    updateStorage("tracker", tracker);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab){
    let prop = {};
    prop["tabId"] = tabId;
    prop["changeInfo"] = changeInfo;
    prop["tab"] = tab;
    tracker.push(trackEvent("tab-updated", prop));
    updateStorage("tracker", tracker);
});

chrome.windows.onCreated.addListener(function (window){
    let prop = {};
    prop["createdWindow"] = window;
    tracker.push(trackEvent("window-created", prop));
    updateStorage("tracker", tracker);
});

chrome.windows.onRemoved.addListener(function(windowId){
    let prop = {};
    prop["idOfRemovedWindow"] = windowId;
   tracker.push(trackEvent("window-removed", prop));
   updateStorage("tracker", tracker);
});

chrome.windows.onFocusChanged.addListener(function(windowId){
    let prop = {};
    prop["idOfNewlyFocusedWindow"] = windowId;
    tracker.push(trackEvent("window-focus-changed", prop));
    updateStorage("tracker", tracker);
});