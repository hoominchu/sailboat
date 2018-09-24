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
                    chrome.storage.local.set({"Collections": collections});
                });
            });
            $collectionNames.append($trashIconForCollection);
            $collectionObj.append($collectionNames);
            for (let item in collection) {
                let $iconGroup = $('<div class="collection-item-icon-group"></div>');

                const wikiLink = 'http://en.wikipedia.org/wiki/' + item.replace(' ', '_');
                const $wikiIcon = $('<div class="collection-item-icon wiki-icon"></div>');
                $iconGroup.append($wikiIcon);
                $wikiIcon.click(function () {
                    $('iframe.iframe').attr('src', wikiLink);
                    $('#magic_modal').modal('show');
                });

                if (collectionName.toLowerCase() === 'books') {
                    const goodreadsLink = 'https://www.goodreads.com/search?q=' + item.replace(' ', '+');
                    const $goodreadsIcon = $('<a href="' + goodreadsLink + '" target="_blank"><div class="collection-item-icon goodreads-icon"></div></a>');
                    $iconGroup.append($goodreadsIcon);
                }

                if (collectionName.toLowerCase() === 'books' || collectionName.toLowerCase() === 'movies') {
                    const amazonLink = 'https://www.amazon.in/s/?field-keywords=' + item.replace(' ', '+');
                    const $amazonIcon = $('<a href="' + amazonLink + '" target="_blank"><div class="collection-item-icon amazon-icon"></div></a>');
                    $iconGroup.append($amazonIcon);
                }

                if (collectionName.toLowerCase() === 'places') {
                    const mapsLink = 'http://maps.google.com/?q=' + item.replace(' ', '+');
                    const $mapsIcon = $('<a href="' + mapsLink + '" target="_blank"><div class="collection-item-icon gmaps-icon"></div></a>');
                    $iconGroup.append($mapsIcon);
                }

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
                        chrome.storage.local.set({"Collections": collections});

                    });
                });
                let itemCleanedForId = item.replace(/\./g,'');
                itemCleanedForId = itemCleanedForId.replace(/'/g,'');
                itemCleanedForId = itemCleanedForId.replace(/,/g,'');
                itemCleanedForId = itemCleanedForId.replace(/\s/g,'');
                const $item = $('<p class="collection-item item text-primary" id="' + itemCleanedForId + '">' + item + ' (' + collection[item] + ')' + '</p>');

                $item.append($trashIconForItem);
                $item.append($iconGroup);

                $collectionObj.append($item);
            }
            collectionsElem.append('<hr>');
            collectionsElem.append($collectionObj);
        }
        showMovieInfo();
    });
}

function showMovieInfo() {
    //key 6938093c
    chrome.storage.local.get("Collections", function (collections) {
        collections = collections["Collections"];
        const moviesCollection = collections['Movies'];
        for (let movieName in moviesCollection) {
            let movieNameCleaned = movieName.replace(/\./g, ' ');
            movieNameCleaned = movieNameCleaned.replace(/'/g, ' ');
            movieNameCleaned = movieNameCleaned.replace(/,/g, ' ');
            let movieNameForId = movieNameCleaned.replace(/\s/g, '');
            let omdbRequestURL = 'http://www.omdbapi.com/?apikey=6938093c&t=' + movieNameCleaned.toLowerCase().replace(/\s/g, '+');
            let xmlhttp;
            if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
                xmlhttp = new XMLHttpRequest();
            }
            else {// code for IE6, IE5
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            }
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                    const jsonText = xmlhttp.responseText;
                    const jsonObj = JSON.parse(jsonText);
                    let movieInfoString = jsonObj['Director'] + ' | ';
                    movieInfoString += jsonObj['Genre'] + ' | ';
                    movieInfoString += jsonObj['Language'] + ' | ';
                    movieInfoString += 'Runtime : ' + jsonObj['Runtime'] + ' | <br>';
                    movieInfoString += 'Awards : ' + jsonObj['Awards'] + ' | <br>';
                    movieInfoString += 'IMDB : ' + jsonObj['imdbRating'] + ' | ';
                    movieInfoString += 'RT : ' + jsonObj['Ratings'][1]['Value'] + ' | ';
                    let $movieInfo = $('<div class = "movie-info small">'+ movieInfoString + '</div>');
                    $('#' + movieNameForId).after($movieInfo);
                }
            };
            xmlhttp.open("GET", omdbRequestURL, true);
            xmlhttp.send();
        }
    });
}

function httpGet(page, $elem) {
    if (!page)
        return;

    page.replace(/\s/g, '_');
    const wikipediaURL = 'http://en.wikipedia.org/wiki/' + page;
    let xmlhttp;
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    }
    else {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            const htmlContent = xmlhttp.responseText;
            const $wikiPage = $(htmlContent);
            const $infobox = $('.infobox', $wikiPage);
            const $infoboxImage = $('.image', $infobox);
            $elem.append($infoboxImage);
        }
    };
    xmlhttp.open("GET", wikipediaURL, false);
    xmlhttp.send();
}