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
  chrome.bookmarks.getTree(function(bookmarks){ //Get the bookmarks and add them to the default task.
    var task = new Task(0, "Default", {}, bookmarks, true); //The default task is active when created.
    TASKS[task.id] = task;
    chrome.windows.getCurrent(function (window) {
        taskToWindow[0] = window.id; //Assigned to the current window.
    });
    chrome.browserAction.setBadgeText({"text": "Default"}); //Badge set to Default
  });
}

function addTotalTimeToPageInTask(task_id, url, timeSpent) {
  try{
    TASKS[task_id].history.find((page) => page.url === url).timeSpent += timeSpent;
  }
  catch(err){
    console.log("Could not log time for " + " " + url + " because of " + err );
  }
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
            }
            else {
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
        var newTask = new Task(TASKS["lastAssignedId"] + 1, taskName, tabs, bookmarks);
        TASKS[TASKS["lastAssignedId"] + 1] = newTask;
        TASKS["lastAssignedId"] = TASKS["lastAssignedId"] + 1;
        updateStorage("TASKS", TASKS);
    }
    else {
        const emptyArray = [];
        var newTask = new Task(TASKS["lastAssignedId"] + 1, taskName, emptyArray, bookmarks);
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

function activateTaskInWindow(task_id) {
  //Activating a task involves the following:
  //1. Set the CTASKID to it's id.
  //2. Mark its task object as active and add the current time to its activation time.
  //3. Set the badge to current task.
  //4. Switch/Create to the task's window.
  //5. Add the task's bookmarks to the current bookmarks.
  //6. Update storage for changes.

  chrome.storage.local.get("TASKS", function (tasks) {
        tasks = tasks["TASKS"];
        if(task_id != CTASKID){ //Do all this only if it is not already active.
          try {

            //Mark task as active.
            var now = new Date();
            tasks[task_id].activationTime.push(now.toString());
            tasks[task_id].isOpen = true;
            console.log(tasks[task_id].name + " marked as active.");

            if (taskToWindow.hasOwnProperty(task_id)) { //Task is already open in some window, so just switch to that window.
                chrome.windows.update(taskToWindow[task_id], {"focused": true});
            }

            else { //Task is not open, so we create a new window with its tabs.

                if (tasks[task_id].tabs.length > 0) { //task has more than 0 tabs.
                    var urls = [];
                    for (var i = 0; i < tasks[task_id].tabs.length; i++) {
                        urls.push(tasks[task_id].tabs[i].url);
                    }
                    chrome.windows.create({"url": urls}, function (window) { //create a window with these tabs
                        var taskId = task_id;
                        taskToWindow[taskId] = window.id; //assign the window id to the task
                    });
                }
                else {
                    chrome.windows.create({"url": "html/index.html"}, function (window) { //task has 0 tabs.
                        var taskId = task_id;
                        taskToWindow[taskId] = window.id; //assign the window id to the task
                    });
                }
            }

            //Set the badge text as new task name.
            chrome.browserAction.setBadgeText({"text": TASKS[task_id].name.slice(0, 4)});

            CTASKID = task_id; //Set the CTASKID as the id of the task/

            //Add the bookmarks for the current task;
            createBookmarks(task_id);

            TASKS = tasks;

            updateStorage("TASKS", tasks); //Update chrome storage.
            updateStorage("CTASKID", task_id)


        }
        catch (err) {
            console.log(err.message);
        }
      }
    });
}

//This works only to save the task in the current window.
function saveTaskInWindow(task_id) {
    //Saving involves the following:
    //1.Replacing the task's tabs with the tabs in the current window.
    //2.Replacing the task's bookmarks with the current bookmarks.
    if (TASKS[task_id]) {
        chrome.tabs.query({"windowId": chrome.windows.WINDOW_ID_CURRENT}, function (tabs) {
            TASKS[task_id].tabs = tabs;
            updateStorage("TASKS", TASKS);
        });
        chrome.bookmarks.getTree(function (bookmarks) {
            TASKS[task_id].bookmarks = bookmarks;
            updateStorage("TASKS", TASKS);
        });
    }
}

//Run this when a task is deactivated.
function deactivateTaskInWindow(task_id) {
  //Deativating a task involves the following:
  //1. Set the CTASKID to the default id. This is done last so that everything else is done considering the current task as active.
  //2. Mark its task object as inactive and add the current time to its deactivation time.
  //3. Set the badge to default task.
  //4. Note there is no analogue of Switch/Create to the task's window.
  //5. Remove the task's bookmarks
  //6. Update storage for changes.

    if(CTASKID == task_id){
      //Mark task object as inactive and add the current time to its deactivation time.
      var now = new Date();
      TASKS[task_id].deactivationTime.push(now.toString());

      chrome.browserAction.setBadgeText({"text": "Default"});  //Set the badge text to Default

      removeBookmarks(task_id);
      // CTASKID = 0;

      updateStorage("TASKS", TASKS);
      updateStorage("CTASKID", task_id);
    }

}

function deleteTask(task_id) {
    if (TASKS[task_id]) {
        if (taskToWindow[task_id]) {
            alert("This task is open. Please close it before deleting.");
        }
        else {
            const confirmation = confirm("Deleting a task will remove all the history and liked pages of the task. Are you sure you want to delete it ?");
            if (confirmation) {
                delete TASKS[task_id];
                if (taskToWindow[task_id]) {
                    chrome.windows.remove(taskToWindow[task_id]);
                    delete taskToWindow[task_id];
                }
                updateStorage("TASKS", TASKS);
            }
        }
    }
}

function renameTask(task_id, newName) {
    if (TASKS[task_id]) {
        TASKS[task_id].name = newName;
        updateStorage("TASKS", TASKS);
    }
}

function addURLToTask(url, task_id) {
    TASKS[task_id].tabs.push({"url":url});
    if(taskToWindow[task_id]){
        chrome.tabs.create({"windowId": taskToWindow[task_id], "url": url, "selected": false});
    }
    updateStorage("TASKS", TASKS);
}

function archiveTask(task_id) {
    if (task_id != CTASKID) {
        TASKS[task_id].archived = !TASKS[task_id].archived;
        updateStorage("TASKS", TASKS);
    }
    else {
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
}

function downloadTasks(){
  let dateObj = new Date();
  var date = dateObj.toDateString();
  downloadObjectAsJson(TASKS, "Sailboat Tasks from " + date);
}
