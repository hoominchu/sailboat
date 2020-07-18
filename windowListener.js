function windowRemovedHandler(oldWindowId) {
    // What does this condition mean?
    if (oldWindowId !== backgroundPageId) {
        if (TASKS[getKeyByValue(taskToWindow, oldWindowId)]) {
            TASKS[getKeyByValue(taskToWindow, oldWindowId)].isOpen = false;
            deactivateTaskInWindow(getKeyByValue(taskToWindow, oldWindowId));
            delete taskToWindow[getKeyByValue(taskToWindow, oldWindowId)];
        }
    }
    chrome.storage.local.set({'TASKS': TASKS}, function () {
        chrome.windows.getAll(function (allWindows) {
            if (allWindows.length > 0) {
                chrome.windows.getCurrent(function (window) {
                    activateTaskInWindow(getKeyByValue(taskToWindow, window.id));
                });
            }
        });
    });
}

function windowCreatedHandler(window) {
    if (isEmpty(taskToWindow)) {
        try {
            chrome.storage.local.get(["TASKS"], function (response) {
                let tasks = response["TASKS"];
                CTASKID = 0;
                //Mark task as active
                const now = new Date().getTime();
                tasks[CTASKID].activationTime.push(now);
                tasks[CTASKID].isOpen = true;

                // The browser opens the tabs automatically. So do not reopen.
                // Maybe we could just go over verify if the open tabs and the task object are in sync.

                chrome.browserAction.setBadgeText({"text": TASKS[CTASKID].name.slice(0, 4)});
                TASKS = tasks;
                // Do not update taskToWindow here. It should get updated in activateWindowInTask.
                activateDefaultTaskOnStartup(true);
                changeBookmarks(CTASKID);
            });
        } catch (err) {
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
}

function windowFocusChangedHandler(newWindowId) {
    if (getKeyByValue(taskToWindow, newWindowId)) { //Check if the window that is switched to has an id associated with it.
        if (CTASKID != getKeyByValue(taskToWindow, newWindowId)) { //If the window that is switched to is not already active do the following..
            deactivateTaskInWindow(CTASKID); //Deactivate the current task.
            if (newWindowId !== chrome.windows.WINDOW_ID_NONE) { //Check if the focus has changed to some new window.
                chrome.windows.get(newWindowId, function (window) {
                    if (window.type === "normal") {
                        activateTaskInWindow(getKeyByValue(taskToWindow, newWindowId));
                    }
                });
            } else { //If there is no window to switch to, don't do anything.
                // Ideally we should show an alert saying we do not recognise this window, would you like to close it?
            }
        }
    } else {
    }
    updateStorage("TASKS", TASKS);
}

function attachWindowListners() {
    console.log('attaching window listners');
    chrome.windows.onRemoved.addListener(windowRemovedHandler);

    chrome.windows.onCreated.addListener(windowCreatedHandler);

    chrome.windows.onFocusChanged.addListener(windowFocusChangedHandler);
}