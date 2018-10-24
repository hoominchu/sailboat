chrome.bookmarks.onCreated.addListener(function (e){
    saveTaskInWindow(CTASKID);
});

chrome.bookmarks.onRemoved.addListener(function (e){
    saveTaskInWindow(CTASKID);
});

chrome.bookmarks.onChanged.addListener(function (e){
    saveTaskInWindow(CTASKID);
});

chrome.bookmarks.onMoved.addListener(function (e){
    saveTaskInWindow(CTASKID);
});

chrome.bookmarks.onChildrenReordered.addListener(function (e){
    saveTaskInWindow(CTASKID);
});