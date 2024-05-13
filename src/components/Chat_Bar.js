/* global chrome */
import React, {useState, useRef, useEffect} from "react";
import ChatItem from "./ChatItem";
import {CiTrash} from 'react-icons/ci';
import { FaPencilAlt } from 'react-icons/fa';
import { ThreeDots, Bars } from "react-loading-icons";
import { bouncy } from "ldrs";
import Markdown from "react-markdown";
import { motion } from "framer-motion";


const ChatBar = (props) => {
    const apiKey = props.apiKey;

    const tabNum = props.tab;
    const [titleWait, setTitleWait] = useState(false)

    const [title, setTitle] = useState(`Tab ${tabNum}`)
    const [user, setUser] = useState("User")
    const [bot, setBot] = useState("Gemini")
    const [isChanging, setIsChanging] = useState(false)

    const [blur, setBlur] = useState('none')

    const [waiting, setWaiting] = useState(false)

    const [chatItems, setChatItems] = useState([])
    const chatBottom = useRef();

    const API_key = "AIzaSyDbYafelS05UpJY63Q9PT5-tEmxJzwotcA"
    console.log("API Key:", API_key, apiKey)

    const { GoogleGenerativeAI } = require("@google/generative-ai");

    // Access your API key as an environment variable (see "Set up your API key" above)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});


    const [chat, setChat] = useState(model.startChat({
        history: []
    }))

    const getTitle = async (alt_chat) => {
        setTitleWait(true)
        // prompt model for name of tab then reset model s.t history doesn't include this prompt
        const conv_result = await alt_chat.sendMessage("Give me a single seven word or less description for this chat given all my prompts for you. Do not include any text except the description")
        const conv_response = await conv_result.response;
        const conv_answer = conv_response.text();
        setTitle(conv_answer)
        setTitleWait(false)

    }

    // on initial render, retrieve chat history from local history
    // also create title for tab based on chat history 
    useEffect(() => {
        // retrieve prior chat from chrome local storage 
        chrome.storage.local.get(['user', `chat_history_${tabNum}`, `chat_items_${tabNum}`], (result) => {
        console.log("Retrieved from local storage:", result)
        var chat_history = []
        var chat_items = []
        if (tabNum == 0) {
            chat_history = result.chat_history_0
            chat_items = result.chat_items_0} 
        else { 
            chat_history = result.chat_history_1
            chat_items = result.chat_items_1}
        
        var new_user = result.user;
        if (new_user) {setUser(new_user)}

        // trim chat history and chat items s.t they only correspond to history for this tab
        console.log(chat_history, chat_items)
        console.log("Setting initial state to:", chat_history, chat_items)
        if (chat_items.length > 0) {
            console.log("setting chat items to locally stored items")
            setChatItems(chat_items)
            const alt_chat = model.startChat({history:chat_history})
            getTitle(alt_chat)
        }
        
        if (chat_history) {
            console.log('setting chat to locally stored history')
            // change title 
            console.log("changing title given history:", chat_history)
            // reset chat history to exclude title prompt ^ 
            setChat(model.startChat({history:chat_history}))
        }

        console.log(chatItems, chat)


        })
    }, [])


    const handleReset = () => {
        setChat(model.startChat({
            history: []
        }))
        setChatItems([])
        var toSave = []
        if (tabNum == 0) {
            toSave = {chat_history_0: [], chat_items_0: []}
        } else {
            toSave = {chat_history_1: [], chat_items_1: []}
        }
        chrome.storage.local.set(toSave)
        setTitle(`Tab ${tabNum}`)
    }
    
    useEffect(() => {
        chatBottom.current?.scrollIntoView({behavior:'smooth'})
    }, [chatItems])

    const handleChat = async (text) => {
    // add user chat item to chatWindow
        chatItems.push([text, user,])
        var newItems = chatItems.slice()
        setChatItems(newItems)
        setWaiting(true)
        setBlur('lg')
        // query Gemini for response and add chat item to chatWindow 
        // console.log(chatItems)
        try {
            const conv_result = await chat.sendMessage(text)
            const conv_response = await conv_result.response;
            const conv_answer = conv_response.text();
            // console.log(conv_answer)
            const chat_hist = await chat.getHistory();
            // console.log(chat_hist)
            chatItems.push([conv_answer, bot])
            setWaiting(false)
            setBlur('none')
            
            // const gemini_result = await model.generateContent(text)
            // const response = await gemini_result.response;
            // const answer = response.text()
            // // console.log(response)
            // console.log(answer)
            // chatItems.push([answer, "Botimus Prime"])
            newItems = chatItems.slice()
            var toSave = []
            if (tabNum == 0) {
                toSave = {chat_history_0: chat_hist, chat_items_0: chatItems}
            } else {
                toSave = {chat_history_1: chat_hist, chat_items_1: chatItems}
            }
            console.log("Saving to local storage:", toSave)
            chrome.storage.local.set(toSave)
            // chrome.storage.local.set({chat_history:chat_hist})
            // chrome.storage.local.set({chat_items:chatItems})
        } catch (err) {
            chatItems.push(["Sorry, can't help with that (API error)", bot])
            newItems = chatItems.slice()
            setWaiting(false)
            setBlur('none')
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

    const handleNameChange = (e) => {
        // open pop-up windows prompting the user to change its own or the bots name 
        e.preventDefault()
        var newName = document.querySelectorAll("input")
        newName = newName[newName.length-1].value
        console.log(newName)
        setUser(newName)
        setIsChanging(false)
        chrome.storage.local.set({user:newName})
    }

    bouncy.register()
    

    return (
        <>
        <div className="container bg-cyan-950 shadow-2xl rounded-md w-[600px] h-[364px] flex flex-col justify-end items-center p-2">
            <motion.div initial={{ opacity: 0, y:-250}}
                                animate={{ opacity: 1, y:0}}
                                transition={{ duration: 0.4 }} className="w-full h-[328px] flex flex-col justify-end items-center px-2 pt-5">
                <h6 className="text-sky-50 text-md top-0 p-1 absolute font-semibold border-sky-50 border-1 rounded-b-md border-t-0">
                    {!titleWait && <Markdown>{title}</Markdown>}
                    {titleWait && <l-bouncy size={'28'} speed={'0.9'} color={"white"}></l-bouncy>}
                </h6>
                <div className={`chat text-sky-50 overflow-scroll w-full h-[320px] mt-3 mb-5 flex flex-col blur-[${blur}]`}>
                    {chatItems.map(item => (
                            <ChatItem text={item[0]} user={item[1]}></ChatItem>
                    ))}
                    {waiting &&  
                        <ChatItem text={""} user={"Gemini"} icon={<l-bouncy size={'28'} speed={'0.9'} color={"white"}></l-bouncy>}></ChatItem>
                    }
                    <div id="bottom" ref={chatBottom}></div>
                </div>
            </motion.div>
            
            <form className={`input w-5/6 h-8 rounded-lg flex blur-${blur}`} onSubmit={handleSubmit}>
                {/* ROUNDED SEARCH BAR WHERE YOU TYPE QUERY */}
                <input className="w-full h-full rounded-lg rounded-r-none p-1 border-2 border-sky border-r-0 outline-none" type="text" />
                <button type="submit" className="enter bg-cyan-800 h-8 w-1/6 border-2 rounded-lg rounded-l-none border-sky border-l-0 text-sky-50">
                    Chat
                </button>
            </form>
            <button title="reset chat" className="bg-cyan-800 w-fit h-fit border-2 rounded-lg border-sky text-sky-50 absolute top-2 right-2 text-lg p-1 opacity-50 hover:opacity-100 transition-all duration-200" onClick={handleReset}>
                    <CiTrash></CiTrash>
            </button>
            <button title="change name" className="bg-cyan-800 w-fit h-fit border-2 rounded-lg border-sky text-sky-50 absolute top-12 right-2 text-lg p-1 opacity-50 hover:opacity-100 transition-all duration-200" onClick={() => {setIsChanging(true)}}>
                    <FaPencilAlt></FaPencilAlt>
            </button>

            {isChanging && 
                <div className="w-full h-[364px] bottom-0 absolute flex items-center justify-center overflow-visible backdrop-blur-lg">
                        <div className="absolute w-full h-[350px] backdrop-blur-lg blur-md z-10"></div>
                        <form className="input w-5/6 h-8 rounded-lg flex mt-2 items-center align-center justify-center blur-none z-20" onSubmit={handleNameChange}>
                            {/* ROUNDED SEARCH BAR WHERE YOU TYPE QUERY */}
                            <input placeholder={user} className="w-2/5 h-8 rounded-lg rounded-r-none p-2 border-2 border-sky border-r-0 outline-none blur-none" type="text" />
                            <button type="submit" className="enter bg-cyan-800 h-8 w-1/6 border-2 rounded-lg rounded-l-none border-sky border-l-0 text-sky-50 blur-none">
                                Set Name
                            </button>
                        </form>
                </div>    
            }
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