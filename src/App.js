import ChatBar from './components/Chat_Bar';
import React, {useState} from 'react';
import { CiCirclePlus } from 'react-icons/ci';

function App() {
  const [chats, setChats] = useState([<ChatBar></ChatBar>])

  const [activeInd, setActiveInd] = useState(chats[0])

  



  return (
    <div className="cont flex items-center align-center justify-center w-full h-full rounded-md content-center bg-cyan-950 overflow-y-scroll">
      {/* could have tabs of chat bars for different chats instead of just one */}
      {/* would have list of chatbars and corresponding tabs */}
      {/* when tab is selected, its corresponding chatbar is set to activate view */}
      <ChatBar></ChatBar>

      {/* need button for adding new chat */}
      <button className="bg-cyan-800 w-fit h-fit border-2 rounded-lg border-sky text-sky-50 absolute top-12 right-2 text-lg p-1 opacity-50 hover:opacity-100 transition-all duration-200">
                    <CiCirclePlus></CiCirclePlus>
      </button>
    </div>
  );
}

export default App;
