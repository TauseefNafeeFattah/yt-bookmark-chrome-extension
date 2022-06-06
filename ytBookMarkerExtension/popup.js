import {getActiveTabURL} from "./utils.js";

const addNewBookmark = (bookmarks, bookmark) => {
  // creates a bookmark element for displaying in the DOM
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.id="bookmark-"+bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(controlsElement);
  bookmarks.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks=[]) => {
  // displays all the bookmarks in the DOM

  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML ="";
  if (currentBookmarks.length > 0){
    for (var i = 0; i < currentBookmarks.length; i++){
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  }
  else{
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }
  return;
};

const onPlay = async e => {
  // handles the play button press
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id,{
    type: "PLAY",
    value: bookmarkTime,
  });
};

const onDelete = async e => {
  // handles the delete button press
  const activeTab = await getActiveTabURL();
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const bookMarkElementDelete = document.getElementById("bookmark-"+bookmarkTime);
  bookMarkElementDelete.parentNode.removeChild(bookMarkElementDelete);

  chrome.tabs.sendMessage(activeTab.id,{
    type:"DELETE",
    value:bookmarkTime,
  }, viewBookmarks);
};

const setBookmarkAttributes =  (src, eventListenerMethod, controlParentElement) => {
  // sets the play and delete button and attributes
  const controlElement = document.createElement("img");
  controlElement.src = chrome.runtime.getURL("assets/"+src+".png");
  controlElement.title = src;
  controlElement.addEventListener("click", eventListenerMethod);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
  // adds an event listener to the DOM to see if the page is a youtube watch page or not
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  if(activeTab.url.includes("youtube.com/watch") && currentVideo){
    chrome.storage.sync.get([currentVideo], (data)=>{
      const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]):[];
      viewBookmarks(currentVideoBookmarks)
    });
  }else{
    const container = document.getElementsByClassName("container")[0];
    container.innerHTML = '<div class="title">This is not a youtube video page.</div>';
  }
});
