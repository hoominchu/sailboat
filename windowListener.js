chrome.windows.onRemoved.addListener(function (oldWindowId) {

    if (oldWindowId !== backgroundPageId) {
        TASKS[getKeyByValue(taskToWindow, oldWindowId)].isOpen = false;
        deactivateTaskInWindow(getKeyByValue(taskToWindow, oldWindowId));
        delete taskToWindow[getKeyByValue(taskToWindow, oldWindowId)];
    }

    chrome.windows.getAll(function (allWindows) {
        if (allWindows.length > 0) {
            chrome.windows.getCurrent(function (window) {
                activateTaskInWindow(getKeyByValue(taskToWindow, window.id));
            });
        }
    });
    updateStorage("TASKS", TASKS);
    reloadSailboatTabs();
});

chrome.windows.onCreated.addListener(function (window) {
    if (isEmpty(taskToWindow)) { //If no window is open, then newly created window should have last TASK that was open.
        try {
            chrome.storage.local.get(["TASKS", 'CTASKID'], function (response) {
                let tasks = response["TASKS"];
                CTASKID = response['CTASKID'];
                //Mark task as active
                const now = new Date().getTime();
                tasks[CTASKID].activationTime.push(now);
                tasks[CTASKID].isOpen = true;

                // The browser opens the tabs automatically. So do not reopen.
                // Maybe we could just go over verify if the open tabs and the task object are in sync.
                // if (tasks[CTASKID].tabs.length > 0) { //task has more than 0 tabs.
                //     for (let i = 0; i < tasks[0].tabs.length; i++) {
                //         let url = tasks[0].tabs[i].url;
                //         chrome.tabs.create({"url": url}, function (tab) {
                //             if (i === 0) {
                //                 chrome.tabs.query({"url": "chrome://newtab/"}, function (tabs) {
                //                     if (tabs && tabs.length > 0)
                //                         chrome.tabs.remove(tabs[0].id);
                //                 });
                //             }
                //         });
                //     }
                // }

                taskToWindow[CTASKID] = window.id; //assign the window id to the task

                chrome.browserAction.setBadgeText({"text": TASKS[CTASKID].name.slice(0, 4)});

                TASKS = tasks;
                // updateStorage("TASKS", tasks);

                saveBookmarks = false;
                changeBookmarks(-1, 0);
                // reloadSailboatTabs();
            });
        }
        catch (err) {
            console.log(err.message);
        }
    } else {
        if (!switchingTask) {
            if (!(window.type === chrome.windows.WindowType.POPUP || window.type === chrome.windows.WindowType.PANEL || window.type === chrome.windows.APP || window.type === chrome.windows.WindowType.DEVTOOLS)) {
                chrome.windows.remove(window.id);
                alert("Sorry, we currently support only 1 window per task!")
            }
        }

    }
});

chrome.windows.onFocusChanged.addListener(function (newWindowId) {
    if (getKeyByValue(taskToWindow, newWindowId)) { //Check if the window that is switched to has an id associated with it.
        if (CTASKID != getKeyByValue(taskToWindow, newWindowId)) { //If the window that is switched to is not already active do the following..
            deactivateTaskInWindow(CTASKID); //Deactivate the current task.
            if (newWindowId !== chrome.windows.WINDOW_ID_NONE) { //Check if the focus has changed to some new window.
                chrome.windows.get(newWindowId, function (window) {
                    if (window.type === "normal") {
                        console.log('this is getting triggered: ' + taskToWindow + ' : ' + newWindowId);
                        activateTaskInWindow(getKeyByValue(taskToWindow, newWindowId));
                    }
                });
            }
            else { //If there in no window to switch to, don't do anything.
            }

        }
    }
    else {
    }

    updateStorage("TASKS", TASKS);

    // reloadSailboatTabs();

});