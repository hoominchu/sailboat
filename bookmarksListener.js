function attachBookmarksListner() {
    chrome.bookmarks.onCreated.addListener(function (e) {
        if (saveBookmarks) {
            saveBookmarksInStorage(CTASKID);
        }
    });

    chrome.bookmarks.onRemoved.addListener(function (e) {
        if (saveBookmarks) {
            saveBookmarksInStorage(CTASKID);
        }
    });

    chrome.bookmarks.onChanged.addListener(function (e) {
        if (saveBookmarks) {
            saveBookmarksInStorage(CTASKID);
        }
    });

    chrome.bookmarks.onMoved.addListener(function (e) {
        if (saveBookmarks) {
            saveBookmarksInStorage(CTASKID);
        }
    });

    chrome.bookmarks.onChildrenReordered.addListener(function (e) {
        if (saveBookmarks) {
            saveBookmarksInStorage(CTASKID);
        }
    });
}

function saveBookmarksInStorage(taskId) {
    chrome.bookmarks.getTree(function(bookmarks) {
        TASKS[taskId].bookmarks = bookmarks;
        updateStorage("TASKS", TASKS);
    });
}