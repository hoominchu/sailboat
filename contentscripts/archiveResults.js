const commonwords = ["the", "man", "good", "of", "and", "a", "to", "in", "is", "you", "that", "it", "he", "was", "for", "on", "are", "as", "with", "his", "they", "i", "at", "be", "this", "have", "from", "or", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "use", "an", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "him", "into", "time", "has", "look", "two", "more", "write", "go", "see", "number", "no", "way", "could", "people", "my", "than", "first", "been", "call", "who", "its", "now", "find", "long", "down", "day", "did", "get", "come", "made", "may", "part"];

const domainsToExclude = ["www.google.co.in", "www.google.co.in"];
const sailboatLogo = chrome.extension.getURL("images/logo_white_sails_no_text.png");
const collapseResultsIcon = chrome.extension.getURL("images/collapse.svg");

$(document).ready(function () {
    if (getDomainFromURL(window.location.href).indexOf('.google.') > -1 && isGoogleResultsPage()) {
        const query = getUrlParameter('q', window.location.href);
        try {
            if (removeWordsFromString(commonwords, query)) { //Show results only if the query contains something except stopwords.
                const $resultsBox = $('<div id="sailboat-results" class="sailboat-results">');
                $(document.body).append($resultsBox);

                const $sailboatHeader = $("<div id ='sailboat-header' class='sailboat-header'><img src='" + sailboatLogo + "' style='height:40px; display:block; margin:auto;'/><div class='collapse-sailboat-results-btn'><img src='" + collapseResultsIcon + "' class='collapse-results-icon'></div></div>");
                $resultsBox.append($sailboatHeader);

                const $resultsContentDiv = $('<div id="sailboat-results-content" class="sailboat-results-content">');
                $resultsBox.append($resultsContentDiv);
                $('.collapse-sailboat-results-btn').click(function () {
                    $('.sailboat-results').animate({'height': '0', 'border-width': '0'}, 200);
                })
                sendSearchArchiveMessage(query);
            }
        } catch (e) {
            console.log(e);
        }
    }
});

function isGoogleResultsPage() { //check if the page is an actual search results page
    if (getUrlParameter('tbm', window.location.href)) {
        const $urlIsGoogleMapPage = Boolean(getUrlParameter('tbm', window.location.href) === 'lcl');
        if ($urlIsGoogleMapPage) { //when tbm=lcl google search results goes into maps mode.
            return false;
        }
    }
    else {
        return true;
    }
}

function sendSearchArchiveMessage(query) {
    chrome.runtime.sendMessage({'type':'search-archive', 'query': query});
}

function showArchivedResults(results) {
    const fromYourArchive = $('<div class="from-your-archive-title"><span class="num-archive-results">#</span> results from your archive</div><hr></div>');
    $("#sailboat-results-content").append(fromYourArchive);

    const $resultsElement = $('#sailboat-results-content');

    let nResults = 0
    if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            if (results[i].score < 0.5)
                continue;
            let $resultElement = $('<div class="sailboat-result-element"></div>');
            let $title = $('<div class = "sailboat-result-url">' + results[i]['doc']['title'] + '</a></div>');
            let $url = $('<a href="' + results[i]["ref"] + '"><small>' + results[i]['ref'] + '</small></a>');
            $resultElement.append($title).append($url);
            $resultsElement.append($resultElement);
            $resultElement.click(function (ev) {
                chrome.storage.local.get('Report Clicks', function (report) {
                    report = report['Report Clicks'];
                    report['SB results clicks']++;
                    chrome.storage.local.set({'Report Clicks': report});
                })
            });
            nResults++;
        }
        $('.num-archive-results').text(nResults);
    } else {
        $("#sailboat-results-content").append($("<p style='line-height: 1.8em;'>No matches found. Archive more pages!</p>"));
    }
}

chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === "set-search-results-from-history") {
        const resultsFromHistory = $('<hr><div><p style="color: #008cba;"><b>From your history</b></p><hr></div>');
        const resultsElement = $("#sailboat-results-content");
        resultsElement.append(resultsFromHistory);
        let results = message.results;
        let resultsMinusResultsFromGoogleSearch = 0;
        for (var i = 0; i < results.length; i++) {
            if (domainsToExclude.indexOf(getDomainFromURL(results[i]["url"])) < 0) {
                let urlString = $("<p><a href='" + results[i]["url"] + "'>" + results[i]["title"] + "</a>" + "</p>");
                resultsElement.append(urlString);
                resultsMinusResultsFromGoogleSearch++;
            }
        }
        if (resultsMinusResultsFromGoogleSearch === 0) {
            var historyNoMatches = $("<p>No matches found in history.</p>");
            resultsElement.append(historyNoMatches);
        }
        resultsElement.append("<div style='height:5px;'></div>");
    }

    if (message.type === 'show-archived-results-on-google-page') {
        showArchivedResults(message.results);
    }
});

function removeWordsFromString(wordsToRemove, string) {
    //wordsToRemove is an array of words that should be removed.
    //this function returns a string with the specific words removed.

    if (!string)
        return '';

    let words = string.split(" ");
    const stringLength = words.length;
    for (let i = 0; i < stringLength; i++) {
        if (wordsToRemove.indexOf(words[i]) > -1) {
            words.splice(i, 1);
            i = i - 1; //reset the counter to the previous position.
        }
    }
    return words.join(" ");
}
