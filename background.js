"use strict";

const reportSnapshotPeriod = 1; // in minutes

function searchHistory(query, tabId) {
    chrome.history.search(query, function (results) {
        chrome.tabs.sendMessage(tabId, {"type": "set-search-results-from-history", "results": results});
    });
}


createAndActivateDefaultTask();

//Save downloads to appropriate task folder
chrome.downloads.onDeterminingFilename.addListener(function (item, suggest) {
    const currentTaskName = TASKS[CTASKID].name;
    suggest({filename: currentTaskName + "/" + item.filename});
});


function extrapolateUrlFromCookie(cookie) {
    let prefix = cookie.secure ? "https://" : "http://";
    if (cookie.domain.charAt(0) == ".")
        prefix += "www";

    return prefix + cookie.domain + cookie.path;
}


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
            fireTaskNameNotification(request.nextTaskId, "switchNotification");
        }
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
        downloadTasks();
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
    } else if (request.type === "give unarchived tasks dict") {
        let tasksDict = filterTasks({"archived": false});
        chrome.runtime.sendMessage({
            "type": "unarchived tasks dict",
            "tasksDict": tasksDict
        });
    } else if (request.type === "time spent on page") {
        addTotalTimeToPageInTask(CTASKID, request.url, request.timeSpent);
    }
    else if (request.type === "detect-task") {
        detectTask(request.topics, request.url, request.title);
    } else if (request.type === "interests found") {
        fireInterestNotification(request.interests);
    }
    else if (request.type === "get-search-results-from-history") {
        searchHistory({"text": request.query}, sender.tab.id);
    }
});

// chrome.bookmarks.onCreated.addListener(function (e){
//   saveTaskInWindow(CTASKID);
// });
//
// chrome.bookmarks.onRemoved.addListener(function (e){
//   saveTaskInWindow(CTASKID);
// });
//
// chrome.bookmarks.onChanged.addListener(function (e){
//   saveTaskInWindow(CTASKID);
// });
//
// chrome.bookmarks.onMoved.addListener(function (e){
//   saveTaskInWindow(CTASKID);
// });
//
// chrome.bookmarks.onChildrenReordered.addListener(function (e){
//   saveTaskInWindow(CTASKID);
// });

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //If another webpage is opened in the same tab then:
    // 1. save the task
    // 2. add the new url to history.
    // 3. reload the like button (Do I need this anymore?)

    if (changeInfo.status === "complete") {
        if (tabIdToURL !== {}) {
            const date = new Date();
            // updateExitTime(tabIdToURL[tabId], date.toString())
        }
        tabIdToURL[tabId] = tab.url;
        saveTaskInWindow(CTASKID);
        // addToHistory(tab.url, tab.title, CTASKID);
    }
    chrome.tabs.sendMessage(tabId, {"type": "reload-like-button", data: tab})
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    //If a tab is closed check if the window is closing too.
    //If the window is not closing, save the task.
    if (!removeInfo.isWindowClosing) {
        saveTaskInWindow(CTASKID);
    }
});

chrome.windows.onRemoved.addListener(function (windowId) {
    //If window is removed deactivate the task and delete taskId from taskToWindow dict and
    //Don't need to save it because already saved on each tab open/close/update;
    if (windowId !== backgroundPageId) {
        TASKS[getKeyByValue(taskToWindow, windowId)].isOpen = false; //Don't need to save the Tasks object because it is already saved.
        deactivateTaskInWindow(getKeyByValue(taskToWindow, windowId));
        delete taskToWindow[getKeyByValue(taskToWindow, windowId)];
    }
});

chrome.windows.onFocusChanged.addListener(function (newWindowId) {
    if (getKeyByValue(taskToWindow, newWindowId)) { //Check if the window that is switched to has an id associated with it.
        if (CTASKID != getKeyByValue(taskToWindow, newWindowId)) { //If the window that is switched to is not already active do the following..
            deactivateTaskInWindow(CTASKID); //Deactivate the current task.
            if (newWindowId !== chrome.windows.WINDOW_ID_NONE) { //Check if the focus has changed to some new window.
                chrome.windows.get(newWindowId, function (window) {
                    if (window.type === "normal") {
                        activateTaskInWindow(getKeyByValue(taskToWindow, newWindowId));
                    }
                });
            }
            else { //If there in no window to switch to, don't do anything.
            }

        }
    }

    reloadSailboatTabs();
});


//Add keyboard shortcuts here.
chrome.commands.onCommand.addListener(function (command) {
    if (command === "like-page") {
        chrome.tabs.get(activeTabId, function (tab) {
            likePage(tab.url, "shortcut");
        });
    }
});


chrome.omnibox.onInputEntered.addListener(function (query, disposition) {
    if (query != null) {
        chrome.tabs.create({"url": "html/searchArchive.html?q=" + query});
    }
});

// Creates notification for suggested task.
// chrome.runtime.onMessage.addListener(function (response, sender) {
//     if (response.type == "task suggestion") {
//
//     }
// });

function fireInterestNotification(interests) {
    const interestsList = [];
    let messageString = "";
    for (let i = 0; i < interests.length; i++) {
        const interest = interests[i];
        const collectionName = interest.collectionName;
        const itemName = interest.itemName;
        const frequency = interest.frequency;
        const interestListItem = {};
        interestListItem['title'] = itemName;
        interestListItem['message'] = collectionName + ' (' + frequency + ')';
        interestsList.push(interestListItem);
        messageString += itemName + ' (' + collectionName + ') | ';
    }

    chrome.notifications.create({
        "type": "basic",
        "iconUrl": "images/logo_white_sails_no_text.png",
        "title": "This page looks interesting!",
        "message": messageString,
        "requireInteraction": false
    }, function (notificationID) {
        console.log("Last error:", chrome.runtime.lastError);
    });
}

chrome.storage.local.get("time-period-for-task-notification", function (result) {
    if (!result["time-period-for-task-notification"]) {
        chrome.alarms.create("taskName notification", {"delayInMinutes": 0, "periodInMinutes": 10})

    }
    else {
        chrome.alarms.create("taskName-notification", {
            "delayInMinutes": 0,
            "periodInMinutes": parseInt(result["time-period-for-task-notification"])
        })
    }
});

// Alarm for taking snapshot of Sailboat
chrome.alarms.create('reportSnapshot', {'delayInMinutes': 0, 'periodInMinutes': reportSnapshotPeriod});

chrome.alarms.onAlarm.addListener(function(alarm){
  if(alarm.name == "taskName-notification") {
      chrome.storage.local.get("time-spent-notification", function (value) {
          if (value["time-spent-notification"]) {
              fireTaskNameNotification(CTASKID, "timeSpentNotification");
          }
      });
  } else if (alarm.name === "reportSnapshot") {
      takeReportSnapshot();
  }
});


function getNArchivedTasks(tasks) {
    let nArchivedTasks = 0;

    if (!tasks)
        return nArchivedTasks;

    for (const taskid in tasks) {
        if (taskid !== 'lastAssignedId') {
            if (tasks[taskid]['archived']){
                nArchivedTasks++;
            }
        }
    }
    return nArchivedTasks;
}

function takeReportSnapshot() {

    const now = new Date().getTime();

    chrome.storage.local.get(['Report Snapshots', 'TASKS'], function (response) {
        chrome.windows.getAll({populate:true},function(windows){

            let reportSnapshots = response['Report Snapshots'];
            let tasks = response['TASKS'];

            reportSnapshots[now] = {};

            const nTasks = Object.keys(tasks).length - 1;
            const nArchivedTasks = getNArchivedTasks(tasks);
            reportSnapshots[now]['nTasks'] = nTasks;
            reportSnapshots[now]['nArchivedTasks'] = nArchivedTasks;

            // Windows part
            let windowsState = {};

            for (const k in windows) {
                const windowID = windows[k]['id'];
                const nTabs = windows[k]['tabs'].length;
                const isIncognito = windows[k]['incognito'];
                windowsState[windowID] = {};
                windowsState[windowID]['nTabs'] = nTabs;
                windowsState[windowID]['isIncognito'] = isIncognito;
            }
            reportSnapshots[now]['windowState'] = windowsState;

            chrome.storage.local.set({'Report Snapshots' : reportSnapshots});
        });
    });
}

function fireTaskNameNotification(taskId, notificationType) {
    let taskNAME = " Default";
    if (TASKS[taskId]) {
        taskNAME = " " + TASKS[taskId].name
    }
    if (notificationType === "timeSpentNotification") {
        const date = new Date();
        let dd = date.getDate();
        let mm = date.getMonth() + 1; //January is 0!
        let yyyy = date.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        var dateString = dd + '-' + mm + '-' + yyyy;
        var historyDate = 'HISTORY-' + dateString;
        chrome.storage.local.get(historyDate, function (historyObject) {
            historyObject = historyObject[historyDate];
            const hrsSpent = Math.floor(historyObject[taskId].totalTime / 3600);
            const minsSpent = Math.floor((historyObject[taskId].totalTime / 3600 - hrsSpent) * 60);
            let message = "";
            if (hrsSpent > 0) {
                if (minsSpent > 0) {
                    message = "Total Time Spent on the task: " + hrsSpent + " hour and " + minsSpent + " minutes"
                }
                else {
                    message = "Total Time Spent on the task: " + hrsSpent + " hour"
                }
            }
            else {
                if (minsSpent > 0) {
                    message = "Total Time Spent on the task: " + minsSpent + " minutes"
                }
                else {
                    message = "Total Time Spent on the task: Less than a minute"
                }
            }
            chrome.notifications.create({
                "type": "basic",
                "iconUrl": "images/logo_white_sails_no_text.png",
                "title": "You are on : " + taskNAME,
                "message": message
            });
        });

    }
    else if (notificationType === "switchNotification") {chrome.storage.local.get("task-switch-notification", function(value){
          if(value["task-switch-notification"]){
        chrome.notifications.create({
            "type": "basic",
            "iconUrl": "images/logo_white_sails_no_text.png",
            "title": "Task Switched to:" + taskNAME,
            "message": "You have switched to" + taskNAME
        });
    }
})
  }
}

function fireTaskSuggestion(response) {
    const probableTaskID = response["probable task id"];
    // console.log("Notification should fire");
    const matchedTags = response["matched tags"];
    let matchedTagsString = "";
    for (var i = 0; i < matchedTags.length; i++) {
        matchedTagsString = matchedTagsString + matchedTags[i][0] + ", ";
    }
    const fromPageURL = response["page url"];
    const fromPageTitle = response["page title"];
    const probableTask = response["probable task"];

    chrome.notifications.create({
        "type": "basic",
        "iconUrl": "images/logo_white_sails_no_text.png",
        "title": "Task Suggestion : " + probableTask,
        "message": matchedTagsString,
        "buttons": [{"title": "See all matched tags"}, {"title": "Add to task " + probableTask}],
        // "items":[{"title":"sdfs","message":"sdfawefar"},{"title":"erwq","message":"qweqwer"},{"title":"zxz","message":"vbcxvbx"}],
        "isClickable": true,
        "requireInteraction": false
    }, function (notificationID) {
        // Respond to the user's clicking one of the buttons
        chrome.notifications.onButtonClicked.addListener(function (notifId, btnIdx) {
            if (notifId === notificationID) {

                // This button adds the current webpage to the suggested task and takes the user to the suggested task.
                if (btnIdx === 0) {
                    // // Logging that the suggestion is correct.
                    // chrome.storage.local.get("Suggestions Log", function (resp) {
                    //     resp["Suggestions Log"]["Correct suggestions"]++;
                    //     updateStorage("Suggestions Log", resp);
                    // });

                    // Call function to add to task and move to task.

                    // Redirecting to matchedTags.html and displaying all matched tags.
                    chrome.storage.local.set({
                        "Matched Tags": {
                            "type": "show matched tags",
                            "matched tags": matchedTags,
                            "from page URL": fromPageURL,
                            "from page title": fromPageTitle,
                            "probable task name": probableTask
                        }
                    }, function () {
                        chrome.tabs.create({"url": "html/matchedTags.html"})
                    });
                }
                // // This button adds the current webpage to the suggested task and stays in the current task.
                else if (btnIdx === 1) {
                    //     // Logging that the suggestion is correct.
                    //     chrome.storage.local.get("Suggestions Log", function (resp) {
                    //         resp["Suggestions Log"]["Correct suggestions"]++;
                    //         updateStorage("Suggestions Log", resp);
                    //     });
                    //
                    //     // Call function to add to task but not move to task.

                    chrome.storage.local.get("Text Log", function (textLog) {
                        textLog = textLog["Text Log"];

                        for (let i = 0; i < matchedTags.length; i++) {
                            const key = matchedTags[i][0].toLowerCase();
                            if (textLog.hasOwnProperty(key)) {
                                textLog[key]["correctOccurences"]++;
                            }
                        }

                        updateStorage("Text Log", textLog);

                    });
                }
            }
        });

        // When the user clicks on close the current page is added to the current task.
        chrome.notifications.onClosed.addListener(function () {
            // Logging that the suggestion is incorrect.
            // chrome.storage.local.get("Suggestions Log", function (resp) {
            //     resp["Suggestions Log"]["Incorrect suggestions"]++;
            //     updateStorage("Suggestions Log", resp);
            // });
            chrome.storage.local.get("Text Log", function (textLog) {
                textLog = textLog["Text Log"];

                for (let i = 0; i < matchedTags.length; i++) {
                    const key = matchedTags[i][0].toLowerCase();
                    if (textLog.hasOwnProperty(key)) {
                        const tag = textLog[key];
                        textLog[key]["incorrectOccurences"]++;
                    }
                }

                updateStorage("Text Log", textLog);

            });
        });
    });
}
