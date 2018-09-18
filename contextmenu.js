refreshContextMenu();

function refreshContextMenu() {
    chrome.storage.local.get("Collections", function (collections) {
        collections = collections["Collections"];
        chrome.contextMenus.removeAll(function () {
            chrome.contextMenus.create({"title": "Add to collection", "id": "rootMenu", "contexts": ["selection","link"]});
            for (let collectionName in collections) {
                chrome.contextMenus.create({
                    "title": collectionName,
                    "parentId": "rootMenu",
                    "id": collectionName,
                    "contexts": ["selection","link"]
                });
            }
        })
    });
}

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.parentMenuItemId === "rootMenu") {
        console.log(info);
        chrome.storage.local.get("Collections", function (collections) {
            collections = collections["Collections"];
            if (!collections[info.menuItemId].hasOwnProperty(info.selectionText)) {
                collections[info.menuItemId][info.selectionText] = 1;
            }
            chrome.storage.local.set({"Collections":collections});
        })
    }
});
