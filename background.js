"use strict";
let switchingTask = false;
let CTASKID;
chrome.storage.local.get("CTASKID", function(response) {
    CTASKID = response['CTASKID'];
    if (typeof response['CTASKID'] !== 'undefined') {
        activateTaskInWindow(CTASKID)
    } else {
        createAndActivateDefaultTask();
    }
});

//todo consolidate all the message listeners into one listner
chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.type === "create-task") {
        createTask(request.taskName, request.tabs, false, {});
        if (request.activated) {
            switchingTask = true;
            saveTaskInWindow(CTASKID);
            deactivateTaskInWindow(CTASKID);
            activateTaskInWindow(TASKS["lastAssignedId"]);
        }
    } else if (request.type === "add-to-task") {
        const senderTab = sender.tab;
        const senderWindowId = senderTab.windowId;
        chrome.windows.get(senderWindowId, {populate: true}, function (window) {
            const tabs = [];
            for (let i = 0; i < window.tabs.length; i++) {
                if (window.tabs[i].highlighted) {
                    tabs.push(window.tabs[i]);
                }
            }
            //tabs array is now ready to use
            //remove tabs that were highlighted
            const tabIdsToClose = [];
            for (let j = 0; j < tabs.length; j++) {
                tabIdsToClose.push(tabs[j].id)
            }
            chrome.tabs.remove(tabIdsToClose);

            addTabsToTask(request.taskId, tabs);
        });
    } else if (request.type === "switch-task" && request.nextTaskId !== "") {
        if (CTASKID != request.nextTaskId) {
            switchingTask = true;
            saveTaskInWindow(CTASKID, function () {
                deactivateTaskInWindow(CTASKID, function () {
                    activateTaskInWindow(request.nextTaskId);
                });
            });
        }
    } else if (request.type === "close-task") {
        closeTask(request.taskId);
    } else if (request.type === "rename-task") {
        renameTask(request.taskId, request.newTaskName);
    } else if (request.type === "delete-task") {
        deleteTask(request.taskToRemove);
    } else if (request.type === "download-tasks") {
        updateClickReport('Export JSON');
        downloadTasks();
    } else if (request.type === "download-collections") {
        downloadCollections();
    } else if (request.type === "like-page") {
        // likePage(request.url, request.content, CTASKID);
    } else if (request.type === "add-url-to-task") {
        addURLToTask(request.url, request.taskId);
    } else if (request.type === "archive-task") {
        archiveTask(request.taskId);
    } else if (request.type === "pause-tasks") {
        CTASKID = 0;
        updateStorage("CTASKID", 0);
    } else if (request.type === "open-liked-pages") {
        openLikedPages(request.taskId);
    } else if (request.type === "search-archive") {
        if (request.query != null) {
            // chrome.tabs.create({"url": "html/searchArchive.html?q=" + request.query});
        }
    } else if (request.type === "onmouseover") {
        const fromWindowID = sender.tab.windowId;
        const targetURL = request["target-url"];
        const highlightTabIndexes = [sender.tab.index];
        chrome.windows.get(fromWindowID, {"populate": true}, function (window) {
            window.tabs.forEach(function (tab) {
                if (targetURL === tab.url) {
                    highlightTabIndexes.push(tab.index)
                }
            });
            chrome.tabs.highlight({"windowId": fromWindowID, "tabs": highlightTabIndexes});
        });
    } else if (request.type === "onmouseout") {
        chrome.tabs.highlight({"windowId": sender.tab.windowId, "tabs": sender.tab.index});
    } else if (request.type === "clicklog") {
        chrome.storage.local.get("Click Log", function (clickLog) {
            clickLog = clickLog["Click Log"];
            if (clickLog.hasOwnProperty(request.text)) {
                clickLog[request.text]++;
            } else {
                clickLog[request.text] = 1;
            }
            chrome.storage.local.set({"Click Log": clickLog});
        });
    } else if (request.type === "give me open tasks") {
        chrome.runtime.sendMessage({
            "type": "array of open tasks",
            "openTasks": Object.keys(taskToWindow)
        });
    } else if (request.type === "likePages") {
        likePages(request.urls, request.taskId);
    } else if (request.type === "deletePages") {
        deleteFromHistory(request.urls, request.taskId);
    } else if (request.type === "restore-tasks") {
        TASKS = request.taskObject;
        updateStorage("TASKS", TASKS);
    } else if (request.type === "restore-collections") {
        let temp = request.collectionsObject["Collections"];
        updateStorage("Collections", temp);
    } else if (request.type === "give unarchived tasks dict") {
        let tasksDict = filterTasks({"archived": false});
        chrome.runtime.sendMessage({
            "type": "unarchived tasks dict",
            "tasksDict": tasksDict
        });
    } else if (request.type === "detect-task") {
        detectTask(request.topics, request.url, request.title);
    } else if (request.type === "interests found") {
        fireInterestNotification(request.interests);
    } else if (request.type === "get-search-results-from-history") {
        // searchHistory({"text": request.query, 'startTime': 0}, sender.tab.id);
    } else if (request.type === "toggle-time-spent-notification") {
        // toggleTimeSpentNotification();
    } else if (request.type === "time-period-for-task-notification") {
        changeTaskNotificationPeriod();
    }
    sendResponse(true);
});

function toggleTimeSpentNotification() {
    chrome.storage.local.get("time-spent-notification", function (value) {
        if (typeof value["time-spent-notification"] === "undefined" || value["time-spent-notification"]) {
            chrome.storage.local.get("time-period-for-task-notification", function (result) {
                if (!result["time-period-for-task-notification"]) {
                    chrome.alarms.create("taskName notification", {"delayInMinutes": 5, "periodInMinutes": 10})
                } else {
                    chrome.alarms.create("time-spent-notification", {
                        "delayInMinutes": 5,
                        "periodInMinutes": parseInt(result["time-period-for-task-notification"])
                    });
                }
            });
        } else {
            chrome.alarms.clear("time-spent-notification")
        }
    });
}

// chrome.commands.onCommand.addListener(function(command) {
//     console.log('Command:', command);
// });

function changeTaskNotificationPeriod() {
    chrome.storage.local.get("time-period-for-task-notification", function (value) {
        chrome.alarms.clear("time-spent-notification");
        chrome.alarms.create("time-spent-notification", {
            "delayInMinutes": 5,
            "periodInMinutes": parseInt(value["time-period-for-task-notification"])
        });
    });
}

// chrome.storage.local.get("time-spent-notification", function (value) {
//     if (typeof value["time-spent-notification"] === "undefined" || value["time-spent-notification"]) {
//         chrome.storage.local.get("time-period-for-task-notification", function (result) {
//             if (!result["time-period-for-task-notification"]) {
//                 chrome.alarms.create("taskName notification", {"delayInMinutes": 5, "periodInMinutes": 10})
//             } else {
//                 chrome.alarms.create("time-spent-notification", {
//                     "delayInMinutes": 5,
//                     "periodInMinutes": parseInt(result["time-period-for-task-notification"])
//                 });
//             }
//         });
//     }
// });

// chrome.omnibox.onInputEntered.addListener(function (query, disposition) {
//     if (query != null) {
//         chrome.tabs.create({"url": "html/searchArchive.html?q=" + query});
//     }
// });

// chrome.alarms.onAlarm.addListener(function (alarm) {
//     if (alarm.name === "time-spent-notification") {
//         fireTaskNameNotification(CTASKID, "timeSpentNotification");
//     }
// });

//Save downloads to appropriate task folder
// chrome.downloads.onDeterminingFilename.addListener(function (item, suggest) {
//     const currentTaskName = TASKS[CTASKID].name;
//     suggest({filename: currentTaskName + "/" + item.filename});
// });

function downloadCollections() {
    let dateObj = new Date();
    let date = dateObj.toDateString();
    chrome.storage.local.get("Collections", function (collections) {
        downloadObjectAsJson(collections, "Sailboat Collections from " + date);
    });
}

function searchArchive(query, tabId) {
    query = query.replace(/\+/g, ' ');
    var results = lunrIndex.search(query);
    chrome.tabs.sendMessage(tabId, {"type": "show-archived-results-on-google-page", "results": results});
}
// add to history
function addToHistory(url, title, taskId, startTime, endTime) {

    if (url.indexOf('://newtab/') < 0 && url !== "about:blank" && url) {

        let today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth() + 1; //January is 0!
        let yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        today = dd + '-' + mm + '-' + yyyy;
        let historyToday = 'HISTORY-' + today;


        // add/update the entry in the history object
        chrome.storage.local.get([historyToday, "TASKS"], function (results) {

            let history;
            let tasks = results["TASKS"];

            //initialise the history object for today if not present
            if (!results[historyToday]) {
                history = {};
            } else {
                history = results[historyToday];
            }

            // get the task name
            let taskObject = tasks[taskId];
            let taskName = taskObject.name;

            if (!(taskId in history)) {
                history[taskId] = {
                    "urls": {},
                    "totalTime": 0,
                    "taskName": taskName
                }
            }

            let taskHistory = history[taskId];
            let urls = taskHistory["urls"];
            let totalTaskTime = taskHistory["totalTime"];

            let timeDiff = (endTime - startTime) / 1000;
            totalTaskTime += timeDiff;

            if (!(url in urls)) {
                urls[url] = {
                    "timeIntervals": [],
                    "timeSpent": 0,
                    "title": title,
                    "lastVisited": startTime.getTime()
                }
            }
            let urlHistory = urls[url];
            let timeIntervals = urlHistory["timeIntervals"];
            let timeSpent = urlHistory["timeSpent"];
            timeIntervals.push([startTime.toLocaleTimeString(), endTime.toLocaleTimeString()]);
            timeSpent += timeDiff;
            urls[url] = {
                "timeIntervals": timeIntervals,
                "timeSpent": timeSpent,
                "title": title,
                "lastVisited": startTime.getTime()
            };

            history[taskId] = {
                "urls": urls,
                "totalTime": totalTaskTime,
                "taskName": taskName
            };

            let o = {};
            o[historyToday] = history;
            chrome.storage.local.set(o);
        });
    }

}


var currentTabInfo = null;

function handleOnUpdated(tabId, changeInfo, tab) {
    if(currentTabInfo != null) {
        if(changeInfo.url && changeInfo.url !== currentTabInfo.url) {
            addToHistory(currentTabInfo.url, currentTabInfo.title, CTASKID, currentTabInfo.startTime, new Date());
            currentTabInfo = null;
        }
    }
    currentTabInfo = {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        startTime: new Date()
    };

}

function handleOnActivated(activeInfo) {
    if(currentTabInfo != null) {
        addToHistory(currentTabInfo.url, currentTabInfo.title, CTASKID, currentTabInfo.startTime, new Date());
        currentTabInfo = null;
    }
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        currentTabInfo = {
            id: tab.id,
            url: tab.url,
            title: tab.title,
            startTime: new Date()
        };
    });
}

function handleOnRemoved(tabId, removeInfo) {
    if(currentTabInfo != null) {
        if(tabId === currentTabInfo.id) {
            addToHistory(currentTabInfo.url, currentTabInfo.title, CTASKID, currentTabInfo.startTime, new Date());
        }
    }
}

function handleWindowOnFocusChanged(windowId) {
    if(currentTabInfo != null) {
        addToHistory(currentTabInfo.url, currentTabInfo.title, CTASKID, currentTabInfo.startTime, new Date());
        currentTabInfo = null;
    }
}

chrome.tabs.onUpdated.addListener(handleOnUpdated);
chrome.tabs.onActivated.addListener(handleOnActivated);
chrome.tabs.onRemoved.addListener(handleOnRemoved);
chrome.windows.onFocusChanged.addListener(handleWindowOnFocusChanged);



