function attachTabsListners() {
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        //If another webpage is opened in the same tab then:
        // 1. save the task
        // 2. add the new url to history.
        // 3. reload the like button (Do I need this anymore?)

        if (changeInfo.status === "complete") {
            tabIdToURL[tabId] = tab.url;
            saveTaskInWindow(CTASKID);
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
}