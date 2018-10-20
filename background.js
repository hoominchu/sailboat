"use strict";

createAndActivateDefaultTask();

//todo consolidate all the message listeners into one listner
chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.type === "create-task") {
        createTask(request.taskName, request.tabs, false, {});
        if (request.activated) {
            saveTaskInWindow(CTASKID);
            deactivateTaskInWindow(CTASKID);
            activateTaskInWindow(TASKS["lastAssignedId"]);
        }
    }

    else if (request.type === "add-to-task") {
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
    }

    else if (request.type === "switch-task" && request.nextTaskId !== "") {
        if (CTASKID != request.nextTaskId) {
            saveTaskInWindow(CTASKID);
            deactivateTaskInWindow(CTASKID);
            activateTaskInWindow(request.nextTaskId);
        }
        recordInReport();
    }

    else if (request.type === "close-task") {
        closeTask(request.taskId);
    }

    else if (request.type === "rename-task") {
        renameTask(request.taskId, request.newTaskName);
    }

    else if (request.type === "delete-task") {
        deleteTask(request.taskToRemove);
    }

    else if (request.type === "download-tasks") {
        updateClickReport('Export JSON');
        downloadTasks();
    }

    else if (request.type === "download-collections") {
        downloadCollections();
    }

    else if (request.type === "like-page") {
        likePage(request.url, CTASKID);
    }

    else if (request.type === "add-url-to-task") {
        addURLToTask(request.url, request.taskId);
    }

    else if (request.type === "archive-task") {
        archiveTask(request.taskId);
    }

    else if (request.type === "pause-tasks") {
        CTASKID = 0;
        updateStorage("CTASKID", 0);
    }

    else if (request.type === "open-liked-pages") {
        openLikedPages(request.taskId);
    }

    else if (request.type === "search-archive") {
        if (request.query != null) {
            chrome.tabs.create({"url": "html/searchArchive.html?q=" + request.query});
        }
    }

    else if (request.type === "onmouseover") {
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
    }

    else if (request.type === "onmouseout") {
        chrome.tabs.highlight({"windowId": sender.tab.windowId, "tabs": sender.tab.index});
    }

    else if (request.type === "clicklog") {
        chrome.storage.local.get("Click Log", function (clickLog) {
            clickLog = clickLog["Click Log"];
            if (clickLog.hasOwnProperty(request.text)) {
                clickLog[request.text]++;
            } else {
                clickLog[request.text] = 1;
            }
            chrome.storage.local.set({"Click Log": clickLog});
        });
    }

    else if (request.type === "give me open tasks") {
        chrome.runtime.sendMessage({
            "type": "array of open tasks",
            "openTasks": Object.keys(taskToWindow)
        });
    }

    else if (request.type === "likePages") {
        likePages(request.urls, request.taskId);
    }

    else if (request.type === "deletePages") {
        deleteFromHistory(request.urls, request.taskId);
    }

    else if (request.type === "restore-tasks") {
        TASKS = request.taskObject;
        updateStorage("TASKS", TASKS);
    }

    else if (request.type === "restore-collections") {
        let temp = request.collectionsObject["Collections"];
        updateStorage("Collections", temp);
    }

    else if (request.type === "give unarchived tasks dict") {
        let tasksDict = filterTasks({"archived": false});
        chrome.runtime.sendMessage({
            "type": "unarchived tasks dict",
            "tasksDict": tasksDict
        });
    }

    else if (request.type === "detect-task") {
        detectTask(request.topics, request.url, request.title);
    }

    else if (request.type === "interests found") {
        fireInterestNotification(request.interests);
    }

    else if (request.type === "get-search-results-from-history") {
        searchHistory({"text": request.query}, sender.tab.id);
    }

    else if (request.type === "toggle-time-spent-notification"){
        toggleTimeSpentNotification();
    }

    else if (request.type === "time-period-for-task-notification"){
        changeTaskNotificationPeriod();
    }
});

function toggleTimeSpentNotification(){
    chrome.storage.local.get("time-spent-notification", function (value) {
        if(typeof value["time-spent-notification"] === "undefined" || value["time-spent-notification"]){
            chrome.storage.local.get("time-period-for-task-notification", function (result) {
                if (!result["time-period-for-task-notification"]) {
                    chrome.alarms.create("taskName notification", {"delayInMinutes": 5, "periodInMinutes": 10})
                }
                else {
                    chrome.alarms.create("time-spent-notification", {
                        "delayInMinutes": 5,
                        "periodInMinutes": parseInt(result["time-period-for-task-notification"])
                    });
                }
            });
        }
        else {
            chrome.alarms.clear("time-spent-notification")
        }
    });
}

function changeTaskNotificationPeriod(){
    chrome.storage.local.get("time-period-for-task-notification", function (value) {
        chrome.alarms.clear("time-spent-notification");
        chrome.alarms.create("time-spent-notification", {"delayInMinutes": 5, "periodInMinutes": parseInt(value["time-period-for-task-notification"])});
    });
}

chrome.storage.local.get("time-spent-notification", function (value) {
    if(typeof value["time-spent-notification"] === "undefined" || value["time-spent-notification"]){
        chrome.storage.local.get("time-period-for-task-notification", function (result) {
            if (!result["time-period-for-task-notification"]) {
                chrome.alarms.create("taskName notification", {"delayInMinutes": 5, "periodInMinutes": 10})
            }
            else {
                chrome.alarms.create("time-spent-notification", {
                    "delayInMinutes": 5,
                    "periodInMinutes": parseInt(result["time-period-for-task-notification"])
                });
            }
        });
    }
});



// chrome.omnibox.onInputEntered.addListener(function (query, disposition) {
//     if (query != null) {
//         chrome.tabs.create({"url": "html/searchArchive.html?q=" + query});
//     }
// });

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name == "time-spent-notification") {
        fireTaskNameNotification(CTASKID, "timeSpentNotification");
    }
    else if (alarm.name === "reportSnapshot") {
        takeReportSnapshot();
    }
});

//Save downloads to appropriate task folder
chrome.downloads.onDeterminingFilename.addListener(function (item, suggest) {
    const currentTaskName = TASKS[CTASKID].name;
    suggest({filename: currentTaskName + "/" + item.filename});
});

function downloadCollections(){
    let dateObj = new Date();
    let date = dateObj.toDateString();
    chrome.storage.local.get("Collections", function(collections){
        downloadObjectAsJson(collections, "Sailboat Collections from " + date);

    });
}


