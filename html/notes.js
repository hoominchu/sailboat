$(document).ready(function () {
    getNotes();
});

$('#notes').on('input propertychange paste', function() {
    saveNotes();
});

function saveNotes(){
    const notes = document.getElementById("notes").value
    chrome.storage.local.set({"notes": notes});
}

function getNotes(){
    chrome.storage.local.get("notes", function(notes){
        if(notes["notes"]){
            document.getElementById("notes").value = notes["notes"];
        }
    })
}

