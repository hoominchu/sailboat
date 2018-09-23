$(document).ready(function () {
    document.addEventListener("keypress", function (event) {
        if (event.keyCode === 13) {
            const newCollectionName = $('#collectionNameInput').val();
            chrome.storage.local.get("Collections", function (collections) {
                collections = collections["Collections"];
                if (!collections.hasOwnProperty(newCollectionName)) {
                    collections[newCollectionName] = {};
                }
                chrome.storage.local.set({"Collections": collections});
                alert("Collection : " + newCollectionName + " added.");
                $('#collectionNameInput').val("");
                chrome.runtime.sendMessage({"type": "collections edited"});
            })
        }
    });
    showCurrentCollections();
});

function showCurrentCollections() {
    const trashIconURL = chrome.runtime.getURL('images/trash.svg');
    chrome.storage.local.get("Collections", function (collections) {
        collections = collections["Collections"];
        let $trashIconForCollection = $('<div class="delete_icon"></div>');
        $trashIconForCollection.css('background-image', 'url(' + trashIconURL + ')');
        $trashIconForCollection.css('background-size', 'cover');
        const collectionsElem = $('#collections');
        for (let collectionName in collections) {
            let collection = collections[collectionName];
            const $collectionObj = $('<div></div>');
            const $collectionNames = $('<h6 class="text-primary">' + collectionName + '</h6><hr>');
            $trashIconForCollection.click(function () {
                const collectionName = $(this).parent().text().trim();
                $(this).parent().parent().remove();
                chrome.storage.local.get("Collections", function (collections) {
                    collections = collections["Collections"];
                    delete collections[collectionName];
                    chrome.storage.local.set({"Collections":collections});
                });
            });
            $collectionNames.append($trashIconForCollection);
            $collectionObj.append($collectionNames);
            for (let item in collection) {
                let $trashIconForItem = $('<div class="delete_icon"></div>');
                $trashIconForItem.css('background-image', 'url(' + trashIconURL + ')');
                $trashIconForItem.css('background-size', 'cover');
                $trashIconForItem.click(function () {
                   const itemName = $(this).parent().text().split('(')[0].trim();
                   const collectionName = $(this).parent().parent().find('h6').text().trim();
                   $(this).parent().remove();
                   chrome.storage.local.get("Collections", function (collections) {
                       collections = collections["Collections"];
                       delete collections[collectionName][itemName];
                       chrome.storage.local.set({"Collections":collections});

                   });
                });
                const $item = $('<p>' + item + ' (' + collection[item] + ')' + '</p>');
                $item.append($trashIconForItem);
                $collectionObj.append($item);
            }
            collectionsElem.append('<hr>');
            collectionsElem.append($collectionObj);
        }
    });
}