// chrome.windows.onFocusChanged.addListener(function (newWindowId) {
//     if (getKeyByValue(taskToWindow, newWindowId)) { //Check if the window that is switched to has an id associated with it.
//         if (CTASKID != getKeyByValue(taskToWindow, newWindowId)) { //If the window that is switched to is not already active do the following..
//             deactivateTaskInWindow(CTASKID); //Deactivate the current task.
//             if (newWindowId !== chrome.windows.WINDOW_ID_NONE) { //Check if the focus has changed to some new window.
//                 chrome.windows.get(newWindowId, function (window) {
//                     if (window.type === "normal") {
//                         activateTaskInWindow(getKeyByValue(taskToWindow, newWindowId));
//                     }
//                 });
//             }
//             else { //If there in no window to switch to, don't do anything.
//             }
//
//         }
//     }
//     else{
//     }
//
//     reloadSailboatTabs();
// });

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

       }
    });

});

chrome.windows.onCreated.addListener(function(window){
    if(isEmpty(taskToWindow)){
        taskToWindow[0] = window.id;
        activateTaskInWindow(0);
    }
});