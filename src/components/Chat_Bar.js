import React, {useState, useRef, useEffect} from "react";
import ChatItem from "./ChatItem";
import {CiTrash} from 'react-icons/ci'


const ChatBar = () => {
    const [chatItems, setChatItems] = useState([])
    const chatBottom = useRef();

    const API_key = "AIzaSyDbYafelS05UpJY63Q9PT5-tEmxJzwotcA"
    const { GoogleGenerativeAI } = require("@google/generative-ai");

    // Access your API key as an environment variable (see "Set up your API key" above)
    const genAI = new GoogleGenerativeAI(API_key);
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});

    const [chat, setChat] = useState(model.startChat({
        history: []
    }))

    const handleReset = () => {
        setChat(model.startChat({
            history: []
        }))
        setChatItems([])
    }
    
    useEffect(() => {
        chatBottom.current?.scrollIntoView({behavior:'smooth'})
    }, [chatItems])

    const handleChat = async (text) => {
    // add user chat item to chatWindow
        chatItems.push([text, "User"])
        var newItems = chatItems.slice()
        setChatItems(newItems)

        // query Gemini for response and add chat item to chatWindow 
        // console.log(chatItems)
        try {
            const conv_result = await chat.sendMessage(text)
            const conv_response = await conv_result.response;
            const conv_answer = conv_response.text();
            console.log(conv_answer)
            const chat_hist = await chat.getHistory();
            console.log(chat_hist)
            chatItems.push([conv_answer, "Botimus Prime"])
            
            // const gemini_result = await model.generateContent(text)
            // const response = await gemini_result.response;
            // const answer = response.text()
            // // console.log(response)
            // console.log(answer)
            // chatItems.push([answer, "Botimus Prime"])
            newItems = chatItems.slice()
        } catch (err) {
            chatItems.push(["Sorry, can't help with that (API error)", "Botimus Prime"])
            newItems = chatItems.slice()
        }
        setChatItems(newItems)
    }

    const handleSubmit = (e) => {
        // retrieve text from input 
        e.preventDefault();
        const input = document.querySelector("input")
        const toPrompt = input.value
        console.log(input.value)
        handleChat(toPrompt)
        input.value = ""
    }

    return (
        <>
        <div className="container bg-cyan-950 shadow-2xl rounded-md w-[500px] h-[275px] flex flex-col justify-end items-center p-4">
            <div className="chat text-sky-50 overflow-scroll w-full h-[235px]  mb-10 flex flex-col">
                {chatItems.map(item => (
                        <ChatItem text={item[0]} user={item[1]}></ChatItem>
                ))}
                <div ref={chatBottom}></div>
            </div>
            
            <form className="input w-5/6 h-8 rounded-lg flex" onSubmit={handleSubmit}>
                {/* ROUNDED SEARCH BAR WHERE YOU TYPE QUERY */}
                <input className="w-full h-full rounded-lg rounded-r-none p-2 border-2 border-sky border-r-0 outline-none" type="text" />
                <button type="submit" className="enter bg-cyan-800 h-8 w-1/6 border-2 rounded-lg rounded-l-none border-sky border-l-0 text-sky-50">
                    Chat
                </button>
            </form>

            <button className="bg-cyan-800 w-fit h-fit border-2 rounded-lg border-sky text-sky-50 absolute top-2 right-2 text-lg p-1" onClick={handleReset}>
                    <CiTrash></CiTrash>
            </button>
        </div>
        </>
    )
}

// SIMPLE INTERFACE WITH: 
//  - chat window consisting of:
//      - text area that displays your query (after you enter it) and the agents response
//      - chat input where you type your prompts/queries 

// Upon user pressing enter OR selecting chat: 
//  - retrieve text currently in input
//  - display text in 'chat' window 
//  - prompt Gemini API w text 
//  - print response to 'chat' window 

export default ChatBar;