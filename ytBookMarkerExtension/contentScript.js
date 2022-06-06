(() => {
    let youtubeLeftControls, youtubePlayer;
    let currentVideo = "";
    let currentVideoBookmarks = [];

    const fetchBookMarks = () =>{
      // gets all the bookmarks for the video from chrome storage
      return new Promise((resolve)=>{
        chrome.storage.sync.get([currentVideo], (obj) =>{
          resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
        });
      });
    };

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        // handle the different type of activites coming from the DOM
        const { type, value, videoId } = obj;

        if (type === "NEW") {
            currentVideo = videoId;
            newVideoLoaded();
        }
        else if (type === "PLAY"){
          youtubePlayer.currentTime = value;
        }
        else if (type === "DELETE"){

          currentVideoBookmarks = currentVideoBookmarks.filter((bookmark) => bookmark.time != value);
          chrome.storage.sync.set({[currentVideo]: JSON.stringify(currentVideoBookmarks)});
          response(currentVideoBookmarks);
        }
    });

    const newVideoLoaded = async () => {
        // when a new video loads checks if the bookmark button exists and if it doesn't then create the button
        const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
        currentVideoBookmarks = await fetchBookMarks();

        if (!bookmarkBtnExists) {
            const bookmarkBtn = document.createElement("img");

            bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
            bookmarkBtn.className = "ytp-button " + "bookmark-btn";
            bookmarkBtn.title = "Click to bookmark current timestamp";

            youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
            youtubePlayer = document.getElementsByClassName("video-stream")[0];

            youtubeLeftControls.appendChild(bookmarkBtn);
            bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
        }
    }

    const addNewBookmarkEventHandler = async () => {
        // adds a bookmark to the bookmark list

        const currentTime = youtubePlayer.currentTime;
        // creating a bookmark
        const newBookmark = {
            time: currentTime,
            desc: "Bookmark at " + getTime(currentTime),
        };

        currentVideoBookmarks = await fetchBookMarks();

        // storing the bookmarks in chrome storage
        chrome.storage.sync.set({
            [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
        });
    };

    newVideoLoaded();
})();

const getTime = t => {
  // converts youtube time to seconds
    var date = new Date(0);
    date.setSeconds(t);

    return date.toISOString().substr(11, 8);
}
