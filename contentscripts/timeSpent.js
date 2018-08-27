let start;

$(document).ready(function(){
  start = new Date();
});

function handleVisibilityChange() {
    if (document.hidden || document.unloaded) {
        const end = new Date();
        const timeSpent = end - start;
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
