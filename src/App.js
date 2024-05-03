import ChatBar from './components/Chat_Bar';
import React from 'react';

function App() {
  return (
    <div className="cont flex items-center align-center justify-center w-full h-full rounded-md content-center bg-cyan-950 overflow-y-scroll">
      <ChatBar></ChatBar>
    </div>
  );
}

export default App;
