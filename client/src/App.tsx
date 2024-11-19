import React, { useState, useRef, useEffect } from 'react';
import {Button, TextField, Input} from '@mui/material';
import {useSelector, useDispatch} from "react-redux";
import {
  selectChatId,
  selectChatUrl,
  selectChatHistory,
  loadChat,
  updateUrl,
  addLastMessage
} from "./state/chatSlice.ts";
import { Message } from "./types";
import {loadChatFromId, sendChatMessage, sendURL} from "./routes";

const App: React.FC = () => {
  const dispatch = useDispatch();
  const chatId = useSelector(selectChatId);
  const url = useSelector(selectChatUrl);
  const chat = useSelector(selectChatHistory);
  const [options, setOptions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [prevChatId, setPrevChatId] = useState<string>('');
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the latest message when messages are updated
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const rewindChat = async (prevChatId: string) => {
    const prevChat = await loadChatFromId(prevChatId);
    setPrevChatId('')
    dispatch(loadChat(prevChat))
  }

  const setURL = async () => {
    const chat = await sendURL(url);
    dispatch(loadChat(chat));
  }

  const sendMessage = async (userInput: string) => {
    if (userInput.trim() === '') return;

    const userMessage: Message = { role: 'user', content: userInput };
    dispatch(addLastMessage(userMessage));
    setUserInput('');
    setOptions([]);

    const [botMessage, options] = await sendChatMessage(chatId, userMessage);
    dispatch(addLastMessage(botMessage));
    setOptions(options);
    return;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage(userInput);
    }
  };

  return (
      <div style={styles.container}>
        <h1>Simple Chat</h1>
        <div>Current chat reference ID: {chatId}</div>
        <div>
          Rewind from previous chat ID:
          <Input
              value={prevChatId}
              type={"number"}
              onChange={e => setPrevChatId(e.target.value)}
          />
          <Button
              variant="contained"
              onClick={()=>rewindChat(prevChatId)}>
            Confirm
          </Button>
        </div>
        <div>
          I would like to chat about
          <TextField label="website" variant="outlined"
                     value={url}
                     onChange={e => dispatch(updateUrl(e.target.value))}
          />
          <Button variant="contained" onClick={setURL}>set url</Button>
        </div>
        <div style={styles.chatBox} ref={chatBoxRef}>
          {chat.map((message, index) => (
              <div
                  key={index}
                  style={{
                    ...styles.message,
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: message.role === 'user' ? '#000' : '#ccc',
                    color: '#fff',
                  }}
              >
                {message.content}
              </div>
          ))}
          {options.map((option, index) => (
              <div key={index}>
                <Button
                    variant="outlined"
                    onClick={()=>{
                      sendMessage(option);
                    }}
                >{option}</Button>
              </div>
          ))}
        </div>
        <div style={styles.inputArea}>
          <input
              type="text"
              placeholder="Enter a URL..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={styles.input}
          />
          <Button variant="contained" onClick={() => sendMessage(userInput)}>Send</Button>
        </div>
      </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '400px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  chatBox: {
    border: '1px solid #ccc',
    padding: '10px',
    height: '400px',
    overflowY: 'scroll',
    display: 'flex',
    flexDirection: 'column',
  },
  message: {
    maxWidth: '80%',
    padding: '10px',
    margin: '5px 0',
    borderRadius: '10px',
  },
  inputArea: {
    display: 'flex',
    marginTop: '10px',
  },
  input: {
    flexGrow: 1,
    padding: '10px',
    fontSize: '16px',
  },
  button: {
    padding: '0 20px',
    fontSize: '16px',
  },
};

export default App;
