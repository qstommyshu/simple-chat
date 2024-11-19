import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
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

interface Message {
    role: 'user' | 'system';
    content: string;
}

const App: React.FC = () => {
  const dispatch = useDispatch();
  const chatId = useSelector(selectChatId);
  const url = useSelector(selectChatUrl);
  const history: Message[] = useSelector(selectChatHistory);
  const [options, setOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [prevChatId, setPrevChatId] = useState<string>('');
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the latest message when messages are updated
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [history]);

  const rewind_chat = async (id: string) => {
    try {
        const response = await axios.get(`http://127.0.0.1:8000/load_chat?id=${id}`)
        dispatch(loadChat(response.data))
        setPrevChatId('')
      } catch (error) {
        console.error('Error communicating with the backend:', error);
      }
      return;
  }

  const setURL = async () => {
      try {
        const response = await axios.post('http://127.0.0.1:8000/url', {
          url: url,
        });
        // dispatch(updateChatId(response.data.id))
        dispatch(loadChat(response.data))
        // dispatch(addLastMessage(response.data.body))

      } catch (error) {
        console.error('Error communicating with the backend:', error);
      }
      return;
  }

  const handleSend = async (inputValue) => {

    if (inputValue.trim() === '') return;

    const userMessage: Message = { role: 'user', content: inputValue };
    dispatch(addLastMessage(userMessage))
    setInputValue('');
    setOptions([]);

    try {
      const response = await axios.post('http://127.0.0.1:8000/chat', {
        body: userMessage,
        id: chatId,
      });

      console.log(response.data)

      const botMessage: Message = {
        role: 'system',
        content: response.data.body,
      };
      dispatch(addLastMessage(botMessage))
      setOptions(response.data.options)
    } catch (error) {
      console.error('Error communicating with the backend:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSend(inputValue);
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
              onClick={()=>rewind_chat(prevChatId)}>
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
          {history.map((message, index) => (
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
              <div>
                <Button
                    variant="contained"
                    onClick={()=>{
                      handleSend(option);
                    }}
                >{option}</Button>
              </div>
          ))}
        </div>
        <div style={styles.inputArea}>
          <input
              type="text"
              placeholder="Enter a URL..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              style={styles.input}
          />
          <Button variant="contained" onClick={handleSend}>Send</Button>
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
