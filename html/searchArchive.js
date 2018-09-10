$(document).ready(function () {

    // chrome.storage.local.get("Advanced Search Settings", function (advancedSearchSettings) {
    //     advancedSearchSettings = advancedSearchSettings["Advanced Search Settings"];
    chrome.storage.local.get("TASKS", function (tasks) {
        tasks = tasks["TASKS"];
        chrome.storage.local.get("CTASKID", function (ctaskid) {
            ctaskid = ctaskid["CTASKID"];
            chrome.storage.local.get("Page Content", function (pageContent) {
                pageContent = pageContent["Page Content"];

                // showSearchInOptions(advancedSearchSettings);

                // document.getElementById("currentTaskMessage").innerText = "You are searching through the archived pages of task : " + currentTask["name"];

                // Check if URL has 'q' parameter and search directly if present.
                const query = getUrlParameter("q");
                if (query !== undefined) {
                    if (query.length > 0) {
                        document.getElementById("searchArchiveInput").value = query;
                        const results = searchArchivedPages(query, tasks, pageContent);
                        showResults(results);
                    }
                }

                document.getElementById("submitSearchArchiveQuery").onclick = function (ev) {
                    let query = document.getElementById("searchArchiveInput").value;
                    let results = searchArchivedPages(query, tasks, pageContent);
                    showResults(results);
                };

                document.getElementById("searchArchiveInput").addEventListener("keyup", function (event) {
                    event.preventDefault();
                    if (event.keyCode === 13) {
                        document.getElementById("submitSearchArchiveQuery").click();
                    }
                });

            });
        });
    });
    // });
});

function showResults(results) {
    const resultsElement = document.getElementById("archiveSearchResults");
    resultsElement.innerText = "";

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
    else {
        resultsElement.innerText = "No matches found. Archive more pages!";
    }
}

function getUrlParameter(sParam) {
    let sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}

function showSearchInOptions(advancedSearchSettings) {
    // let defaultAdvSearchSettings = {
    //     "search in": "Open tabs"
    // };

    let search_in_options_set_to = advancedSearchSettings["search in"];
    let search_in_options = ["Open tabs", "Archived pages"];

    let search_in_options_element = document.getElementById("search_in_options");

    for (let i = 0; i < search_in_options.length; i++) {
        let option = document.createElement("button");
        let classString = "btn";
        if (search_in_options[i] == search_in_options_set_to) {
            classString = classString + " " + "btn-primary";
        }
        else {
            classString = classString + " " + "btn-secondary";
        }

        if (i == 0) {
            classString = classString + " round-corner-left";
        }
        if (i == search_in_options.length - 1) {
            classString = classString + " round-corner-right";
        }

        option.className = classString;
        option.innerText = search_in_options[i];
        option.onclick = function (ev) {
            console.log(ev);
            advancedSearchSettings["search in"] = this.innerText;
            updateStorage("Advanced Search Settings", advancedSearchSettings);
            location.reload();
        };

        search_in_options_element.appendChild(option);
    }
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

// Updates chrome.storage.local with key and object.
function updateStorage(key, obj) {
    let tempObj = {};
    tempObj[key] = obj;
    chrome.storage.local.set(tempObj);
}

function searchArchivedPages(query, tasks, pageContent) {
    let searchIn = "Archived pages"; //searchSettings["search in"];
    let results = [];

    let queryTerms = [];

    query = query.trim();

    if (query[0] === "\"" && query[query.length - 1] === "\"") {
        query = query.substring(1, query.length - 1);
        queryTerms = [query];
    } else {
        queryTerms = query.split(" ");
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
                                    let contextString = getContextString(queryTerms[j], content, 30);
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
    return results;

    function sortResults(results) {
        results.sort(function (a, b) {
            return b["matched terms"].length - a["matched terms"].length;
        });

        return results;
    }
}
