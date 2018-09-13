$(document).ready(function () {
    if (getDomainFromURL(window.location.href).indexOf('.google.') > -1) {
        var query = getUrlParameter('q', window.location.href);
        searchArchivedPages(query);
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
            for (let taskid in tasks) {
                if (taskid !== "lastAssignedId") {
                    const task = tasks[taskid];
                    let searchThroughPages = task["likedPages"];

                    // if (searchIn === "Open tabs") {
                    //     let taskPages = task["tabs"];
                    //     for (let key in taskPages) {
                    //         if (taskPages[key]["url"].indexOf("chrome-extension://") < 0 && taskPages[key]["url"].indexOf("chrome://") < 0) {
                    //             searchThroughPages.push(taskPages[key]["url"]);
                    //         }
                    //     }
                    // }
                    // if (searchIn === "Archived pages") {
                    //     searchThroughPages = task["likedPages"];
                    // }
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
            if (results.length > 0) {
                showArchivedResults(results);
            }

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
    const $archiveResults = $('<div id="sailboat-archive-results"><p style="color: #008cba"><b>From your archive</b></p><hr></div>');
    $archiveResults.css({'max-height':'330px','width':'450px', 'overflow':'scroll'});
    $('#rhs').prepend($archiveResults);

    const resultsElement = document.getElementById("sailboat-archive-results");
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
    }
}