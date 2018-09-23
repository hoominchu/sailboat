const commonwords = ["the", "of", "and", "a", "to", "in", "is", "you", "that", "it", "he", "was", "for", "on", "are", "as", "with", "his", "they", "i", "at", "be", "this", "have", "from", "or", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "use", "an", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "him", "into", "time", "has", "look", "two", "more", "write", "go", "see", "number", "no", "way", "could", "people", "my", "than", "first", "been", "call", "who", "its", "now", "find", "long", "down", "day", "did", "get", "come", "made", "may", "part"];

const domainsToExclude = ["www.google.co.in", "www.google.co.in"];
const sailboatLogo = chrome.extension.getURL("images/logo_white_sails_no_text.png");

$(document).ready(function () {
    if (getDomainFromURL(window.location.href).indexOf('.google.') > -1) {
        const $resultsBox = $('<div id="sailboat-results" style="border: 1px solid lightblue;">');
        $resultsBox.css({'max-height':'330px','width':'435px', 'overflow':'scroll'});
        $('#rhs').prepend($resultsBox);

        const $sailboatHeader = $("<div id ='sailboat-header' style='height:40px; display:inline-block; width:100%'><img src='" +sailboatLogo+"' style='height:40px; display:block; margin:auto;'/></div>");
        $sailboatHeader.css({'margin-bottom':'5px'});
        $resultsBox.append($sailboatHeader);

        const $resultsContentDiv = $('<div style="padding: 10px;" id="sailboat-results-content">');
        $resultsBox.append($resultsContentDiv);

        var query = getUrlParameter('q', window.location.href);
        if (query) {
            searchArchivedPages(query);
        }
        searchArchivedPages(query);
        getSearchResultsFromHistory(query);
    }
});

function searchArchivedPages(query) {
    chrome.storage.local.get("TASKS", function (tasks) {
        tasks = tasks["TASKS"];
        chrome.storage.local.get("Page Content", function (pageContent) {
            pageContent = pageContent["Page Content"];
            let searchIn = "Archived pages"; //searchSettings["search in"];
            let results = [];

            let queryTerms = [];

            query = query.trim();

            if (query[0] === "\"" && query[query.length - 1] === "\"") {
                query = query.substring(1, query.length - 1);
                queryTerms = [query];
            } else {
                queryTerms = query.split("+");
            }

            for (let i = 0; i < queryTerms.length; i++) {
                if (commonwords.indexOf(queryTerms[i]) > -1) {
                    queryTerms.splice(i, 1);
                }
            }

            for (let taskid in tasks) {
                if (taskid !== "lastAssignedId") {
                    const task = tasks[taskid];
                    let searchThroughPages = task["likedPages"];

                    if (searchThroughPages.length === 0) {
                    }
                    else {
                        for (let i = 0; i < searchThroughPages.length; i++) {

                            if (searchThroughPages[i] != null) {
                                let url = searchThroughPages[i];
                                if (pageContent.hasOwnProperty(url)) {
                                    let content = pageContent[url];
                                    let wordsArray;
                                    try {
                                        wordsArray = content.toLowerCase().split(/[.\-_\s,()@!&*+{}:;"'\\?]/);
                                    } catch (e) {
                                        // alert("Please try reloading tab : " + url + ".");
                                    }


                                    let result = {
                                        "url": url,
                                        "task": task["name"],
                                        "matched terms": [],
                                        "context": []
                                    };

                                    for (let j = 0; j < queryTerms.length; j++) {
                                        if (wordsArray.indexOf(queryTerms[j].toLowerCase()) > -1) {
                                            result["matched terms"].push(queryTerms[j]);
                                            let contextString = getContextString(queryTerms[j], content, 10);
                                            result["context"].push(contextString);
                                        }
                                    }
                                    if (result["matched terms"].length > 0) {
                                        results.push(result);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            results = sortResults(results);
            showArchivedResults(results);


            function sortResults(results) {
                results.sort(function (a, b) {
                    return b["matched terms"].length - a["matched terms"].length;
                });

                return results;
            }
        })
    });
}

function getContextString(term, string, length) {
    let wordsArray = string.split(/[.\-_\s,()@!&*+{}:;"'\\?]/);
    let wordsArrayLowercase = string.toLowerCase().split(/[.\-_\s,()@!&*+{}:;"'\\?]/);
    let indexOfTerm = wordsArrayLowercase.indexOf(term.toLowerCase());
    let startPosition = 0;
    if (indexOfTerm > length / 2) {
        startPosition = indexOfTerm - (length / 2);
    }
    let contextTokens = wordsArray.splice(startPosition, length);
    let retStr = "";
    for (let i = 0; i < contextTokens.length; i++) {
        if (contextTokens[i].toLowerCase() === term.toLowerCase()) {
            retStr = retStr + " <strong><abbr>" + contextTokens[i] + "</abbr></strong> ";
        }
        else {
            retStr = retStr + " " + contextTokens[i] + " ";
        }
    }

    return retStr;
}

function showArchivedResults(results) {
    console.log(results);
    const $archiveResults = $('<div id="sailboat-archive-results" style="padding: 10px; border: 1px solid lightblue;"><p style="color: #008cba;"><b>From your archive</b></p><hr></div>');
    $archiveResults.css({'max-height':'330px','width':'435px', 'overflow':'scroll', 'margin-bottom':'10px'});
    $('#rhs').prepend($archiveResults);

    const fromYourArchive = $('<p style="color: #008cba;"><b>From your archive</b></p><hr></div>')
    $("#sailboat-results-content").append(fromYourArchive);

    const resultsElement = document.getElementById("sailboat-results-content");
    // resultsElement.innerText = "";

    if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            let resultElement = document.createElement("p");
            let urlString = "<p><a href='" + results[i]["url"] + "'>" + results[i]["url"] + "</a> | Task : "+results[i]["task"]+"</p>";
            let matchedTermsString = "<p><small>Matched terms : ";
            let contextStrings = "<p><small>";
            let matchedTerms = results[i]["matched terms"];
            for (let j = 0; j < matchedTerms.length; j++) {
                matchedTermsString = matchedTermsString + "<strong>" + matchedTerms[j] + "</strong>" + " | ";
                contextStrings = contextStrings + results[i]["context"][j] + "<br>";
            }
            matchedTermsString = matchedTermsString + "</p></small>";
            contextStrings = contextStrings + "</p></small>";
            resultElement.innerHTML = urlString + matchedTermsString + contextStrings + "<br>";
            resultsElement.appendChild(resultElement);
        }
    } else {
        $("#sailboat-results-content").append($("<p>No matches found. Archive more pages!</p>"));
    }
}

function getSearchResultsFromHistory(query){
  chrome.runtime.sendMessage({"type":"get-search-results-from-history", "query": query});
}

chrome.runtime.onMessage.addListener(function(message){
  if(message.type == "set-search-results-from-history"){
    const resultsFromHistory = $('<div><p style="color: #008cba;"><b>From your history</b></p><hr></div>');
    const resultsElement = $("#sailboat-results-content");
    resultsElement.append(resultsFromHistory);
    results = message.results;
    let resultsMinusResultsFromGoogleSearch = 0;
    for(var i = 0; i<results.length;i++){
        if(domainsToExclude.indexOf(getDomainFromURL(results[i]["url"]))<0){
          console.log(getDomainFromURL(results[i]["url"]));
          let urlString = $("<p><a href='" + results[i]["url"] + "'>" + results[i]["title"] + "</a>"+"</p>");
          resultsElement.append(urlString);
          resultsMinusResultsFromGoogleSearch++;
        }
    }
    if(resultsMinusResultsFromGoogleSearch == 0){
      var historyNoMatches = $("<p>No matches found in history.</p>");
      resultsElement.append(historyNoMatches);
    }
    resultsElement.append("<div style='height:5px;'></div>");
  }
});
