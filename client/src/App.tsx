import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {Button, TextField} from '@mui/material';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const App: React.FC = () => {
  const [hasURL, setHasURL] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the latest message when messages are updated
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!hasURL) {
      const userMessage: Message = { sender: 'user', text: inputValue };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInputValue('');

      try {
        const response = await axios.post('http://127.0.0.1:8000/url', {
          url: inputValue,
        });

        const botMessage: Message = {
          sender: 'bot',
          text: response.data.body,
        };
        setHasURL(true);

        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        console.error('Error communicating with the backend:', error);
      }
      return;
    }

    if (inputValue.trim() === '') return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/chat', {
        body: inputValue,
      });

      const parsed_response = JSON.parse(response.data);
      console.log(parsed_response)


      const botMessage: Message = {
        sender: 'bot',
        text: response.data.body,
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error communicating with the backend:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };


  return (
      <div style={styles.container}>
        <h1>Simple Chat</h1>
        <div>Current chat reference ID: </div>
        <div>Rewind from chat reference ID: <TextField variant="outlined"/></div>
        <div>I would like to chat about <TextField label="website" variant="outlined"/></div>
        <div style={styles.chatBox} ref={chatBoxRef}>
          {messages.map((message, index) => (
              <div
                  key={index}
                  style={{
                    ...styles.message,
                    alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: message.sender === 'user' ? '#000' : '#ccc',
                    color: '#fff',
                  }}
              >
                {message.text}
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
