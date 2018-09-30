$(document).ready(function () {

    setTimeout(function () {
        gapi.client.setApiKey('AIzaSyAuPajSr17inQQYo4hXnh6DiWCs84fJXpo');
        gapi.client.load('youtube', 'v3', function () {
            console.log('gclient youtube loaded');
        });
    }, 500);


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
            const $collectionName = $('<h6 class="text-primary">' + collectionName + '</h6><hr>');
            $trashIconForCollection.click(function () {
                const collectionName = $(this).parent().text().trim();
                $(this).parent().parent().remove();
                chrome.storage.local.get("Collections", function (collections) {
                    collections = collections["Collections"];
                    delete collections[collectionName];
                    chrome.storage.local.set({"Collections": collections});
                });
            });
            $collectionName.append($trashIconForCollection);
            $collectionObj.append($collectionName);
            for (let item in collection) {

                // Create all the relevant icons group based on the collection name. For example, movies will have imdblink. Books will have goodreads. Places can have maps.
                let $iconGroup = $('<div class="collection-item-icon-group col-lg-2"></div>');

                // Wikipedia link is for all the collection
                const wikiLink = 'http://en.wikipedia.org/wiki/' + item.replace(' ', '_');
                const $wikiIcon = $('<div class="collection-item-icon wiki-icon"></div>');
                $iconGroup.append($wikiIcon);
                $wikiIcon.click(function () {
                    $('iframe.magicbox-iframe').attr('src', wikiLink);
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

                if (collectionName.toLowerCase() === 'movies') {
                    const $youtubeIcon = $('<div class="collection-item-icon youtube-icon"></div>');
                    $iconGroup.append($youtubeIcon);
                    $youtubeIcon.click(function () {
                        searchYoutubeAndSetVideoTarget(item, cleanItemForId(item));
                    });
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
                let itemCleanedForId = cleanItemForId(item);
                const $itemDiv = $('<div class="row collection-div" id="' + itemCleanedForId + '"></div>');
                $($itemDiv).after('<hr>');
                const $item = $('<p class="collection-item item text-primary col-lg-9">' + item + ' (' + collection[item] + ')' + '</p>');

                const $itemTitleRow = $('<div class="row col-lg-12 collection-title"></div>');
                $itemTitleRow.append($item);
                $itemTitleRow.append($iconGroup);
                $itemTitleRow.append($trashIconForItem);
                $itemDiv.prepend($itemTitleRow);

                $collectionObj.append($itemDiv);
            }
            collectionsElem.append('<hr>');
            collectionsElem.append($collectionObj);
        }
        showMovieInfo();
    });
}

$('#magic_modal').on('hidden.bs.modal', function () {
    $('iframe.magicbox-iframe').attr('src', '');
});

function cleanItemForId(item) {
    let itemCleanedForId = item.replace(/\./g, '');
    itemCleanedForId = itemCleanedForId.replace(/'/g, '');
    itemCleanedForId = itemCleanedForId.replace(/,/g, '');
    itemCleanedForId = itemCleanedForId.replace(/\s/g, '');
    return itemCleanedForId;
}

function searchYoutubeAndSetVideoTarget(q, itemId) {
    const youtubeLink = 'https://www.youtube.com/embed/';
    const request = gapi.client.youtube.search.list({
        q: q + ' trailer',
        part: 'snippet'
    });

    request.execute(function (response) {
        if (response) {
            try {
                const firstVideoId = response.result['items'][0]['id']['videoId'];
                const $yticon = $('#' + itemId).find('.youtube-icon');
                $yticon.attr('video-target', youtubeLink + firstVideoId);
                $('iframe.magicbox-iframe').attr('src', youtubeLink + firstVideoId);
                $('#magic_modal').modal('show');
            } catch (e) {
                console.log(e);
            }

        }
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
                    const $director = $('<div class = "director text-success">' + jsonObj['Director'] + '</div>');
                    $director.click(function () {
                        const directorWikiLink = 'http://en.wikipedia.org/wiki/' + jsonObj['Director'].replace(/\s/g, '_').replace(/\.',/g, '');
                        $('iframe.magicbox-iframe').attr('src', directorWikiLink);
                        $('#magic_modal').modal('show');
                    });
                    let movieInfoString = '';
                    if (jsonObj.hasOwnProperty('Genre'))
                        movieInfoString = jsonObj['Genre'] + '<br>';
                    if (jsonObj.hasOwnProperty('Language'))
                        movieInfoString += jsonObj['Language'] + '<br>';
                    if (jsonObj.hasOwnProperty('Runtime'))
                        movieInfoString += 'Runtime : ' + jsonObj['Runtime'] + '<br>';
                    if (jsonObj.hasOwnProperty('Awards'))
                        movieInfoString += 'Awards : ' + jsonObj['Awards'] + '<br>';
                    if (jsonObj.hasOwnProperty('imdbRating'))
                        movieInfoString += 'IMDB : ' + jsonObj['imdbRating'] + '<br>';
                    if (jsonObj.hasOwnProperty('Ratings')) {
                        if (jsonObj['Ratings'][1])
                            movieInfoString += 'RT : ' + jsonObj['Ratings'][1]['Value'] + '<br>';
                    }
                    let $movieInfo = $('<div class = "movie-info col-lg-4">' + movieInfoString + '</div>');
                    $movieInfo.prepend($director);
                    const $moviePlot = $('<div class = "movie-plot col-lg-5">' + jsonObj['Plot'] + '</div>');
                    const $moviePoster = $('<div class="movie-poster col-lg-3"><img class="movie-poster-img" width="100%" src="' + jsonObj['Poster'] + '"></div>');
                    $('#' + movieNameForId).append($movieInfo).append($moviePlot).append($moviePoster);
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