import React from "react";
import Markdown from "react-markdown"


const ChatItem = (props) => {
    const displayName = props.user;
    const displayText = props.text.split("\n");
    const displayIcon = props.icon;
    // if text contains newlines, we want it to display w proper format 
    console.log(displayText)
    // space text by the # of * chars present in line 
    const num_asterix = (txt) => {
        var cnt = 0
        for (let i of txt) {
            if (i == '*') {cnt += 1}}
        return cnt.toString()}

    const isHeading = (txt) => {
        return num_asterix(txt) >= 4 ? 'bold' : 'normal'}

    return (
        <>
        <div className="container flex align-center justify-baseline w-full h-fit p-2">
            <h6 className="mr-10 w-10 font-bold text-xs">{displayName + ":"}</h6>
            <div className="flex flex-col h-fit">
                {displayText.map(item => (
                    // <p className="text-xs" style={{marginBottom: `${num_asterix(item)}px`, marginTop: `${num_asterix(item)}px`, fontWeight: isHeading(item)}}>{item.replaceAll("*", "")}</p>
                    <div>
                        <Markdown style={{marginBottom: `${num_asterix(item)}px`, marginTop: `${num_asterix(item)}px`}}>{item}</Markdown>
                        {displayIcon && displayIcon}
                    </div>
                ))}
            </div>
        </div>
        </>
    )
}

export default ChatItem;