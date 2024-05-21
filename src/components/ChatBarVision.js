/* global chrome */
import React, {useState, useRef, useEffect} from "react";
import ChatItem from "./ChatItem";
import {CiTrash, CiCirclePlus} from 'react-icons/ci';
import { FaPencilAlt } from 'react-icons/fa';
import { ThreeDots, Bars } from "react-loading-icons";
import { bouncy } from "ldrs";
import Markdown from "react-markdown";
import { motion } from "framer-motion";


// same as normal chat bar but want to test use of gemini pro vision 
const ChatBarVision = (props) => {
    const apiKey = props.apiKey;

    const tabNum = props.tab;
    const [titleWait, setTitleWait] = useState(false)

    const [image, setImage] = useState(null)
    const [imageName, setImageName] = useState(null)
    const [imageURL, setImageURL] = useState(null)

    const [title, setTitle] = useState(`Tab ${tabNum}`)
    const [user, setUser] = useState("User")
    const [bot, setBot] = useState("Gemini")
    const [isChanging, setIsChanging] = useState(false)

    const [blur, setBlur] = useState('none')

    const [waiting, setWaiting] = useState(false)

    const [chatItems, setChatItems] = useState([])
    const chatBottom = useRef();

    // const API_key = "AIzaSyDbYafelS05UpJY63Q9PT5-tEmxJzwotcA"
    // console.log("API Key:", API_key, apiKey)

    const { GoogleGenerativeAI } = require("@google/generative-ai");

    // Access your API key as an environment variable (see "Set up your API key" above)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    const vis_model = genAI.getGenerativeModel({ model: "gemini-pro-vision"});


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
        if (image) {
            chatItems.push([text, user, imageURL])
            console.log(imageURL)
        } //use imageURL if there
        else {chatItems.push([text, user])}
        var newItems = chatItems.slice()
        setChatItems(newItems)
        setWaiting(true)
        setBlur('lg')
        // query Gemini for response and add chat item to chatWindow 
        // console.log(chatItems)
        try {
            // handle image entry 
            if (image) {
                console.log("prompting vision model with:", image)
                // var conv_result = await chat.sendMessage([text, image])
                var conv_result = await vis_model.generateContent([text, image])
            } else {
                console.log('prompting text model with:', text)
                console.log(model, chat)
                var conv_result = await chat.sendMessage(text)
            }
            // const conv_result = await chat.sendMessage(text)
            const conv_response = await conv_result.response;
            const conv_answer = conv_response.text();
            // console.log(conv_answer)
            const chat_hist = await chat.getHistory();
            // console.log(chat_hist)
            chatItems.push([conv_answer, bot])
            if (image) {
                var vision_hist = [{role:'user', parts:[{text:text}]}, {role:'model', parts:[{text:conv_answer}]}]
                for (let item of vision_hist) {chat_hist.push(item)} //add vision prompt to history
                console.log(chat_hist)
                setChat(model.startChat({history:chat_hist})) //reset chat w updated history 
            }
            setWaiting(false)
            setBlur('none')
            setImage(null) //having queried with prior image, reset to null
            setImageName(null)
            setImageURL(null)
        
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
            console.log(err)
            chatItems.push(["Sorry, can't help with that (API error)", bot])
            setImage(null)
            setImageName(null)
            setImageURL(null)
            newItems = chatItems.slice()
            setWaiting(false)
            setBlur('none')
        }
        setChatItems(newItems)

        // var priorHist = await chat.getHistory() 
        // // when resetting from img to normal model, remove img data from history as to not interfere with operation of normal model
        // for (let i =0; i < priorHist.length; i ++) {
        //     console.log(priorHist[i].parts)
        //     if (priorHist[i].parts.length > 1) { 
        //         console.log('removing:', priorHist[i].parts[1])
        //         priorHist[i].parts = [priorHist[i].parts[0]]}
        // }
        // setChat(model.startChat({history:priorHist})) //reset chat updating history 
    }

    //!!! have to change to ensure correct input is selected here (distinguish btwn file input and text input)
    const handleSubmit = async (e) => {
        // retrieve text from input 
        setImageName(null)
        e.preventDefault();
        const input = document.querySelectorAll("input")[1]
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

    // const fs = require('fs')
    // // can prompt model with data returned from this method 
    const fileToGenerativePart = (base64Data, mimeType) => {
        return {
          inlineData: {
            data: base64Data,
            mimeType
          },
        };
    }

    const handleImgAddition = async (e) => {
        const imgPath = e.target.files[0];

        // type shud be equal to imgPath.split(".")[1]
        const imgType = imgPath.type 
        console.log(imgPath, imgType)

        // take img name and display below upload button
        setImageName(imgPath.name)
        
        // send message to background file with imgPath, imgType for background to return image data object that we can query model with 
        // chrome.runtime.sendMessage({ img:imgPath, type:imgType }, (res) => {
        //     console.log(res)
        //     const imgData = res.img;
        //     console.log(imgData)
        //     setImage(imgData)
        // });

        const base64img = getBase64(imgPath, base64Callback, imgType)
        console.log("base 64 data:", base64img)
        console.log('state img:', image)
        // var priorHist = await chat.getHistory()


        // // augment priorHist to have inlineData s.t it's acceptable by vision model
        // for (let i =0; i < priorHist.length; i ++) {
        //     console.log(priorHist[i].parts)
        //     if (priorHist[i].role != 'model' && priorHist[i].parts.length == 1) { 
        //         const tempInline = {inlineData:{data:"", mimeType:'image/png'}}
        //         console.log('adding:', tempInline)
        //         priorHist[i].parts.push(tempInline)}
        // }
        // setChat(model.startChat({history:priorHist}))

    }

    const getBase64 =  (file, callback, file_type) => {
        const reader = new FileReader();
        reader.onload = () => callback(null, reader.result, file_type);
        reader.onerror =  (error) => callback(error);
        reader.readAsDataURL(file);
    }

    const base64Callback = async (err, res, file_type) => {
        if (!err) {
            // use image object full url to create item to display
            setImageURL(res)
            // get promptable image object and update image state 
            res = res.replace('data:image/png;base64,', '')
            console.log(res)
            const promptableImg = fileToGenerativePart(res, file_type)
            console.log(promptableImg)
            setImage(promptableImg)
        } else {
            setImage(null);
            setImageName(null)
            setImageURL(null)
        }
      };

    bouncy.register()
    

    return (
        <>
        <div className="container bg-cyan-950 shadow-2xl rounded-md w-[600px] h-[364px] flex flex-col justify-end items-center p-2">
            <motion.div initial={{ opacity: 0, x:-250}}
                                animate={{ opacity: 1, x:0}}
                                transition={{ duration: 0.4 }} className="w-full h-[328px] flex flex-col justify-end items-center px-2 pt-5">
                <h6 className="text-sky-50 text-md top-0 p-1 absolute font-semibold border-sky-50 border-1 rounded-b-md border-t-0">
                    {!titleWait && <Markdown>{title}</Markdown>}
                    {titleWait && <l-bouncy size={'28'} speed={'0.9'} color={"white"}></l-bouncy>}
                </h6>
                <div className={`chat text-sky-50 overflow-y-scroll w-full h-[320px] mt-3 mb-5 flex flex-col blur-[${blur}]`}>
                    {chatItems.map(item => (
                            <ChatItem text={item[0]} user={item[1]} imgUrl={item[2] ? item[2] : null}></ChatItem>
                    ))}
                    {waiting &&  
                        <ChatItem text={""} user={"Gemini"} icon={<l-bouncy size={'28'} speed={'0.9'} color={"white"}></l-bouncy>}></ChatItem>
                    }
                    <div id="bottom" ref={chatBottom}></div>
                </div>
            </motion.div>
            
            <form className={`input w-5/6 h-8 rounded-lg flex blur-${blur}`} onSubmit={handleSubmit}>
                {/* ROUNDED SEARCH BAR WHERE YOU TYPE QUERY */}
                <div className="">
                    {imageName && <h6 className="text-xs text-sky-50 text-center absolute bottom-9 left-0">{`${imageName.slice(0,15)}...`}</h6>} 
                    <div title="upload image" className="bg-cyan-800 w-fit h-fit border-2 rounded-lg border-sky text-sky-50 mr-2 text-lg text-center p-1 opacity-100 transition-all duration-200 cursor-pointer" onClick={() => {document.querySelector('#fileSelect').click();}}>
                        <CiCirclePlus></CiCirclePlus>
                    </div>
                    <input id="fileSelect" className="hidden" placeholder="" type="file" onChange={handleImgAddition}/>
                </div>
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

export default ChatBarVision;