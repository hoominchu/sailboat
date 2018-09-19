$(document).ready(function() {
    document.addEventListener("keypress", function(event) {
        if (event.keyCode === 13) {
            const newCollectionName = $('#collectionNameInput').val();
            chrome.storage.local.get("Collections", function (collections) {
                collections = collections["Collections"];
                if (!collections.hasOwnProperty(newCollectionName)) {
                    collections[newCollectionName] = {};
                }
                chrome.storage.local.set({"Collections":collections});
                alert("Collection : " + newCollectionName + " added.");
                $('#collectionNameInput').val("");
                chrome.runtime.sendMessage({"type":"collections edited"});
            })
        }
    });

    showCurrentCollections();
});

function showCurrentCollections() {
    chrome.storage.local.get("Collections", function (collections) {
        collections = collections["Collections"];
        const collectionsElem = $('#collections');
        for (let collectionName in collections) {
            let collection = collections[collectionName];
            const $collectionObj = $('<div></div>');
            const $collectionNames = $('<h6 class="text-primary">' + collectionName + '</h6><hr>');
            $collectionObj.append($collectionNames);
            for (let item in collection) {
                const $item = $('<p>' + item + ' (' + collection[item] + ')' + '</p>');
                $collectionObj.append($item);
            }
            collectionsElem.append('<hr>');
            collectionsElem.append($collectionObj);
        }
    });
}