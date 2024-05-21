
const fs = require('fs');
console.log("background up")
    // can prompt model with data returned from this method 
const fileToGenerativePart = (path, mimeType) => {
        return {
          inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
          },
        };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message)
  console.log("receiving message")
    if(message.img != null) {
       console.log("received the image from the popup page");
       const imgPath = message.img 
       const imgType = message.type
       const imgData = fileToGenerativePart(imgPath, imgType)
       sendResponse({img:imgData})
    //    send back imgData to pop-up 
    }
  });
