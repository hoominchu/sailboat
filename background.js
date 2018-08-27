"use strict";

createAndActivateDefaultTask();

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
        // console.log(window.tabs);
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
        saveTaskInWindow(CTASKID);
        console.log("switch from " + CTASKID +" to " + request.nextTaskId);
        deactivateTaskInWindow(CTASKID);
        activateTaskInWindow(request.nextTaskId);
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
    else if(request.type === "restore-tasks"){
      TASKS = request.taskObject;
      updateStorage("TASKS", TASKS);
    }
    else if(request.type === "give unarchived tasks dict"){
      let tasksDict = filterTasks({"archived": false});
      chrome.runtime.sendMessage({
        "type": "unarchived tasks dict",
        "tasksDict":tasksDict
      });
    }
    else if(request.type === "time spent on page"){
      addTotalTimeToPageInTask(CTASKID, request.url, request.timeSpent);
    }
});

chrome.windows.onRemoved.addListener(function (windowId) {
  //If window is removed deactivate the task and delete taskId from taskToWindow dict and
  //Don't need to save it because already saved on each tab open/close/update;
    if (windowId !== backgroundPageId) {
        deactivateTaskInWindow(getKeyByValue(taskToWindow, windowId));
        delete taskToWindow[getKeyByValue(taskToWindow, windowId)];
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
        saveTaskInWindow(CTASKID);
        addToHistory(tab.url, tab.title, CTASKID);
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

chrome.windows.onFocusChanged.addListener(function (newWindowId) {
  if(CTASKID != getKeyByValue(taskToWindow, newWindowId)){
    deactivateTaskInWindow(CTASKID); //Deactivate the current task.
    if (newWindowId !== chrome.windows.WINDOW_ID_NONE) { //Check if the focus has changed to some new window.
        chrome.windows.get(newWindowId, function (window) {
            if (window.type === "normal") {
              if(getKeyByValue(taskToWindow, newWindowId)){ //Check if the window that is switched to has a task associated with it.
                activateTaskInWindow(getKeyByValue(taskToWindow, newWindowId));
              }
              else{ //If the window has no task associated with it, what should we do?
              }
            }
        });
    }
    else{ //If there in no window to switch to, don't do anything.

    }
  }
});


//Add keyboard shortcuts here.
chrome.commands.onCommand.addListener(function (command) {
    if (command === "like-page") {
        chrome.tabs.get(activeTabId, function (tab) {
            likePage(tab.url, "shortcut");
        });
    }
});

//Save downloads to appropriate task folder
chrome.downloads.onDeterminingFilename.addListener(function (item, suggest) {
    var currentTaskName = TASKS[CTASKID].name;
    suggest({filename: currentTaskName + "/" + item.filename});
});
