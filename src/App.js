/* global chrome */
import ChatBar from './components/Chat_Bar';
import React, {useState, useEffect} from 'react';
import { IoIosSwap } from "react-icons/io";
import {motion} from 'framer-motion'
import ChatBarVision from './components/ChatBarVision';



function App() {
  // const [chats, setChats] = useState([<ChatBar></ChatBar>])

  const [needKey, setNeedKey] = useState(true)

  const [key, setKey] = useState('')

  const [curTab, setCurTab] = useState([true, false])

  // write useEffect to retrieve stored API key and update states accordingly 
  //   if exists: set key = stored api key and setNeedKey(false)
  //   else, do nothing and prompt for entry 
  useEffect(() => {
    chrome.storage.local.get(['apiKey'], (result) => {
      console.log("Retrieved from local storage:", result)
      var api_key = result.apiKey;
      if (api_key) {
        setKey(api_key)
        setNeedKey(false)
      }
      })
  }, [])

  const handleAPIKey = () => {
    const inp = document.querySelector("input")
    const apiKey = inp.value;
    setNeedKey(false)
    setKey(apiKey)
    const toSave = {apiKey: apiKey}
    chrome.storage.local.set(toSave)
  }

  return (
    <div className="cont flex items-center align-center justify-center w-full h-full rounded-md content-center bg-cyan-950 overflow-y-scroll">
      {/* could have tabs of chat bars for different chats instead of just one */}
      {/* would have list of chatbars and corresponding tabs */}
      {/* when tab is selected, its corresponding chatbar is set to activate view */}
      {needKey && 
        <div className="w-full h-[364px] bottom-0 absolute flex items-center justify-center overflow-visible backdrop-blur-lg">
          <div className="absolute w-full h-[350px] backdrop-blur-lg blur-md z-10"></div>
          <form className="input w-5/6 h-8 rounded-lg flex mt-2 items-center align-center justify-center blur-none z-20" onSubmit={handleAPIKey}>
              {/* ROUNDED SEARCH BAR WHERE YOU TYPE QUERY */}
              <input placeholder={'Enter API Key'} type="password" className="w-2/5 h-8 rounded-lg rounded-r-none p-2 border-2 border-sky border-r-0 outline-none blur-none"/>
              <button type="submit" className="enter bg-cyan-800 h-8 w-1/6 border-2 rounded-lg rounded-l-none border-sky border-l-0 text-sky-50 blur-none">
                  Set API Key
              </button>
          </form>
        </div>
      } 

      {!needKey && 
        <div>
          {curTab[0] &&  <ChatBarVision tab={0} apiKey={key}></ChatBarVision>} 
          {curTab[1] &&  <ChatBarVision tab={1} apiKey={key}></ChatBarVision>} 
          {/* {curTab[0] &&  <ChatBar tab={0} apiKey={key}></ChatBar>}  */}
          {/* {curTab[1] &&  <ChatBar tab={1} apiKey={key}></ChatBar>}   */}
          <button title='switch tabs' className="bg-cyan-800 w-fit h-fit border-2 rounded-lg border-sky text-sky-50 absolute top-[88px] right-2 text-lg p-1 opacity-50 hover:opacity-100 transition-all duration-200" onClick={() => {setCurTab([!curTab[0], !curTab[1]])}}>
                        <IoIosSwap></IoIosSwap>
          </button>
        </div>
      }
      
    </div>
  );
}

export default App;
