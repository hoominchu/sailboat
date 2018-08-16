var start

$(document).ready(function(){
  start = new Date();
})

function handleVisibilityChange() {
    if (document.hidden || document.unloaded) {
      var end = new Date();
      var timeSpent = end-start
      chrome.runtime.sendMessage({
        "type": "time spent on page",
        "url": window.location.href,
        "timeSpent": timeSpent
      });
    } else  {
      start = new Date();
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange, false);
