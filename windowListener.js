chrome.windows.onRemoved.addListener(function(oldWindowId){
    if(oldWindowId !== backgroundPageId){
        TASKS[getKeyByValue(taskToWindow, oldWindowId)].isOpen = false;
        deactivateTaskInWindow(getKeyByValue(taskToWindow, oldWindowId));
        delete taskToWindow[getKeyByValue(taskToWindow, oldWindowId)];
    }
    chrome.windows.getAll(function(allWindows){
       if(allWindows.length >0){
           chrome.windows.getCurrent(function(window){
              activateTaskInWindow(getKeyByValue(taskToWindow, window.id));
           });
       }
       else{
            CTASKID = -1;
            updateStorage("CTASKID", -1);
       }
    });

});

chrome.windows.onCreated.addListener(function(window){
    if(isEmpty(taskToWindow)){ //If no window is open, the newly created window should have the default task.
        try{
            chrome.storage.local.get("TASKS", function (tasks) {
                tasks = tasks["TASKS"];
                //Mark task as active.
                const now = new Date();
                tasks[0].activationTime.push(now.toString());
                tasks[0].isOpen = true;

                if (tasks[0].tabs.length > 0) { //task has more than 0 tabs.
                    for (let i = 0; i < tasks[0].tabs.length; i++) {
                        let url = tasks[0].tabs[i].url;
                        chrome.tabs.create({"url": url}, function(tab){
                            if(i === 0){
                                chrome.tabs.query({"url": "chrome://newtab/"}, function(tabs){
                                    chrome.tabs.remove(tabs[0].id);
                                });
                            }
                        });

                    }
                }

                taskToWindow[0] = window.id; //assign the window id to the task

                chrome.browserAction.setBadgeText({"text": TASKS[0].name.slice(0, 4)});

                createBookmarks(0);

                TASKS = tasks;

                CTASKID = 0;

                updateStorage("TASKS", tasks);
                updateStorage("CTASKID", 0);

            });
        }
        catch (err) {
            console.log(err.message);
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
                            activateTaskInWindow(getKeyByValue(taskToWindow, newWindowId));
                        }
                    });
                }
                else { //If there in no window to switch to, don't do anything.
                }

            }
        }
        else{
        }

        reloadSailboatTabs();
    });