let saveBookmarks = true;

function Task(task_id, task_name, tabs, bookmarks, isOpen) {
    this.id = task_id;
    this.name = task_name;
    this.tabs = tabs;
    this.bookmarks = bookmarks;
    this.history = [];
    this.isOpen = isOpen;
    this.activationTime = [];
    this.deactivationTime = [];
    this.likedPages = [];
    this.archived = false;
}

function createAndActivateDefaultTask() {
    chrome.bookmarks.getTree(function(bookmarks) {
        var task = new Task(0, "Leisure", {}, bookmarks, true); //The default task is active when created.
        TASKS[task.id] = task;
        chrome.windows.getCurrent(function (window) {
            taskToWindow[task.id] = window.id; //Assigned to the current window.
            // change bookmarks,tabs to task 0 bookmarks,tabs
            function activateLeisure(tabsToBeAdded) {

                task.tabs = tabsToBeAdded;
                //Mark task as active
                const now = new Date().getTime();
                task.activationTime.push(now);
                let tasks = {lastAssignedId: 0};
                tasks[task.id] = task;
                TASKS = tasks;
                CTASKID = task.id;

                updateStorage("TASKS", tasks);
                updateStorage("CTASKID", task.id);
                // saveBookmarks = true;
                // changeBookmarks(0, task.id);

                // Refresh all the open tabs so that content script gets injected.
                for (let i = 0; i < tabsToBeAdded.length; i++) {
                    chrome.tabs.reload(tabsToBeAdded[i].id);
                }

                // Close all the other windows. Or should we add all the tabs to the default task?
                chrome.windows.getAll(function (windows) {
                    for (let i = 0; i < windows.length; i++) {
                        if (window.id !== windows[i].id) {
                            chrome.windows.remove(windows[i].id);
                        }
                    }
                });
            }

            // get all the tabs open currently
            chrome.tabs.getAllInWindow(function (tabs) {
                activateLeisure(tabs);
            });
        });
        chrome.browserAction.setBadgeText({"text": "Leisure"}); //Badge set to Leisure
    });
}

//filterTasks takes a dictionary of type {"archived": false}, and returns dict of type {0: "Default", 1: "Shopping"} that fit the filters
function filterTasks(filter) {
    let tasksDict = {};
    for (taskId in TASKS) {
        if (taskId != "lastAssignedId") {
            if (!isEmpty(filter)) {
                for (propName in filter) {
                    if (TASKS[taskId][propName] == filter[propName]) {
                        tasksDict[taskId] = TASKS[taskId].name;
                    }
                }
            } else {
                tasksDict[taskId] = TASKS[taskId].name;
            }
        }
    }
    return tasksDict;
}

function getLikedPages(task_id) {
    const likedPages = [];
    for (let i = 0; i < TASKS[task_id].history.length; i++) {
        if (TASKS[task_id].history[i].isLiked) {
            likedPages.push(TASKS[task_id].history[i]);
        }
    }
    return likedPages;
}

function likePages(urls, task_id) {
    for (let i = 0; i < urls.length; i++) {
        TASKS[task_id].history[indexOfElementWithProperty(TASKS[task_id].history, "url", urls[i])].isLiked = !TASKS[task_id].history[indexOfElementWithProperty(TASKS[task_id].history, "url", urls[i])].isLiked;
    }
    updateStorage("TASKS", TASKS);
}

function deleteFromHistory(urls, task_id) {
    for (let i = 0; i < urls.length; i++) {
        TASKS[task_id].history.splice(indexOfElementWithProperty(TASKS[task_id].history, "url", urls[i]), 1);
    }
    updateStorage("TASKS", TASKS);
}

function createTask(taskName, tabs, createFromCurrentTabs, bookmarks) {
    if (tabs === null) {
        tabs = [];
    }
    if (createFromCurrentTabs) {
        var newTask = new Task(TASKS["lastAssignedId"] + 1, taskName, tabs, []);
        TASKS[TASKS["lastAssignedId"] + 1] = newTask;
        TASKS["lastAssignedId"] = TASKS["lastAssignedId"] + 1;
        updateStorage("TASKS", TASKS);
    } else {
        const emptyArray = [];
        var newTask = new Task(TASKS["lastAssignedId"] + 1, taskName, emptyArray, []);
        TASKS[TASKS["lastAssignedId"] + 1] = newTask;
        TASKS["lastAssignedId"] = TASKS["lastAssignedId"] + 1;
        updateStorage("TASKS", TASKS);
    }
}

function addTabsToTask(taskId, tabs) {
    TASKS[taskId].tabs = TASKS[taskId].tabs.concat(tabs);
    updateStorage("TASKS", TASKS);
    if (taskToWindow.hasOwnProperty(taskId)) {
        //If there is a task that is not open but is in Task urls then open that
        chrome.windows.get(taskToWindow[taskId], {"populate": true}, function (window) {
            const tabs = window.tabs;
            const openUrls = new Set();
            for (let i = 0; i < tabs.length; i++) {
                openUrls.add(tabs[i].url);
            }
            const taskUrls = new Set();
            for (let j = 0; j < TASKS[taskId].tabs.length; j++) {
                taskUrls.add(TASKS[taskId].tabs[j].url);
            }
            if (taskUrls.size > openUrls.size) {
                taskUrls.forEach(function (url) {
                    if (!openUrls.has(url)) {
                        chrome.tabs.create({"windowId": window.id, "url": url, "selected": false});
                    }
                });
            }
        });
    }
}

function activateTaskInWindow(taskId) {
    //Activating a task involves the following:
    //1. Set the CTASKID to its id.
    //2. Mark its task object as active and add the current time to its activation time.
    //3. Set the badge to current task.
    //4. Switch/Create to the task's window.
    //5. Add the task's bookmarks to the current bookmarks.
    //6. Update storage for changes.

    chrome.storage.local.get(['TASKS', 'CTASKID'], function (response) {
        let tasks = response["TASKS"];
        chrome.windows.getCurrent(function (window) {
            if (taskId === response['CTASKID']) {
                taskToWindow[taskId] = window.id;
            }
            try {
                //Mark task as active.
                let now = new Date().getTime();
                tasks[taskId].activationTime.push(now);
                tasks[taskId].isOpen = true;

                if (taskToWindow.hasOwnProperty(taskId)) {
                    // task is already open in some window, so just switch to that window.
                    chrome.windows.update(taskToWindow[taskId], {"focused": true});

                } else {
                    // task is not open, so we create a new window with its tabs.
                    let urls = [];
                    if (tasks[taskId].tabs.length > 0) { // task has more than 0 tabs.
                        for (let i = 0; i < tasks[taskId].tabs.length; i++) {
                            urls.push(tasks[taskId].tabs[i].url);
                        }
                    } else {
                        // if no tabs in the task - open index page
                        urls.push("html/index.html");
                    }
                    chrome.windows.create({"url": urls}, function (window) { //create a window with these tabs
                        taskToWindow[taskId] = window.id; //assign the window id to the task
                    });
                }

                TASKS = tasks;

                //Set the badge text as new task name.
                chrome.browserAction.setBadgeText({"text": TASKS[taskId].name.slice(0, 4)});

                updateStorage("TASKS", tasks); //Update chrome storage.

                let lastTaskId;
                if (response["CTASKID"]) {
                    lastTaskId = response["CTASKID"];
                } else {
                    lastTaskId = 0;
                }
                // saveBookmarks = false;
                changeBookmarks(lastTaskId, taskId);
                updateStorage("CTASKID", taskId);
                CTASKID = taskId; //Set the CTASKID as the id of the task/x
                // switchingTask = false;
            } catch (err) {
                console.log(err.message);
            }
        });
    });
}

function saveBookmarksInStorage(taskId) {
    chrome.bookmarks.getTree(function (bookmarks) {
        TASKS[taskId].bookmarks = bookmarks;
        updateStorage("TASKS", TASKS);
    });
}

//This works only to save the task in the current window.
function saveTaskInWindow(taskId, f) {
    // save the tabs in the TASK object
    if (window) {
        if (TASKS[taskId]) {
            chrome.windows.getCurrent({"populate": true}, function (window) {
                TASKS[taskId].tabs = window.tabs;
                updateStorage("TASKS", TASKS);
                if (f != null) {
                    f();
                }
            });
        }
    }
}

//Run this when a task is deactivated.
function deactivateTaskInWindow(taskId, f) {
    if (CTASKID === taskId) {
        //Mark task object as inactive and add the current time to its deactivation time.
        TASKS[taskId].deactivationTime.push(new Date().getTime());
        // Save the bookmarks
        chrome.bookmarks.getTree(function(bookmarks) {
            TASKS[taskId].bookmarks = bookmarks;
            updateStorage("TASKS", TASKS);
            if (f != null) {
                f();
            }
        });
    }
}

function deleteTask(task_id) {
    if (TASKS[task_id]) {
        delete TASKS[task_id];
        if (taskToWindow[task_id]) {
            chrome.windows.remove(taskToWindow[task_id]);
            delete taskToWindow[task_id];
        }
        updateStorage("TASKS", TASKS);
    }
}

function renameTask(task_id, newName) {
    if (TASKS[task_id]) {
        TASKS[task_id].name = newName;
        updateStorage("TASKS", TASKS);
    }
}

function addURLToTask(url, task_id) {
    TASKS[task_id].tabs.push({"url": url});
    if (taskToWindow[task_id]) {
        chrome.tabs.create({"windowId": taskToWindow[task_id], "url": url, "selected": false});
    }
    updateStorage("TASKS", TASKS);
}

function archiveTask(task_id) {
    if (task_id != CTASKID) {
        TASKS[task_id].archived = !TASKS[task_id].archived;
        updateStorage("TASKS", TASKS);
    } else {
        alert("Can't archive an open task. Please switch before archiving.")
    }
}

function openLikedPages(task_id) {
    const likedPages = getLikedPages(task_id);
    const likedPagesUrls = [];
    for (let i = 0; i < likedPages.length; i++) {
        likedPagesUrls.push(likedPages[i].url);
    }
    openTabs(likedPagesUrls);
}

function closeTask(taskId) {
    chrome.windows.remove(taskToWindow[taskId]);
    TASKS[taskId].isOpen = false;
    reloadSailboatTabs();
}

function downloadTasks() {
    let dateObj = new Date();
    let date = dateObj.toDateString();
    downloadObjectAsJson(TASKS, "Sailboat Tasks from " + date);
}

