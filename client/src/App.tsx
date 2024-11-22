import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Divider,
  Avatar,
  CircularProgress,
  Snackbar,
  Grid,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat'; // Added for the title
import { useSelector, useDispatch } from 'react-redux';
import {
  selectChatId,
  selectChatUrl,
  selectChatHistory,
  loadChat,
  updateUrl,
  addLastMessage,
} from './state/chatSlice.ts';
import { Message } from './types';
import { loadChatFromId, sendChatMessage, sendURL } from './routes';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const App: React.FC = () => {
  const dispatch = useDispatch();
  const chatId = useSelector(selectChatId);
  const url = useSelector(selectChatUrl);
  const chat = useSelector(selectChatHistory);
  const [options, setOptions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [prevChatId, setPrevChatId] = useState<string>('');
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChatUrlSet, setIsChatUrlSet] = useState<boolean>(false);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('info');

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Updated Effect to scroll to the latest message when messages or options are updated
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat, options]); // Added 'options' to dependencies

  const rewindChat = async (prevChatId: string) => {
    if (!prevChatId.trim()) {
      showSnackbar('Please enter a valid chat ID.', 'warning');
      return;
    }
    try {
      setIsLoading(true);
      const prevChat = await loadChatFromId(prevChatId);
      setPrevChatId('');
      setOptions([]);
      setIsChatUrlSet(true);
      dispatch(loadChat(prevChat));
      showSnackbar('Chat rewound successfully!', 'success');
    } catch (error) {
      console.error('Failed to rewind chat:', error);
      showSnackbar('Failed to rewind chat. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const setURL = async () => {
    if (!url.trim()) {
      showSnackbar('Please enter a valid URL.', 'warning');
      return;
    }
    try {
      setIsLoading(true);
      const chat = await sendURL(url);
      setIsChatUrlSet(true);
      dispatch(loadChat(chat));
      showSnackbar('URL set successfully!', 'success');
    } catch (error) {
      console.error('Failed to set URL:', error);
      showSnackbar('Failed to set URL. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (userInput.trim() === '') return;
    const messageToSend = userInput.trim();
    setUserInput('');
    sendToServer(messageToSend);
  };

  const sendToServer = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message };
    dispatch(addLastMessage(userMessage));
    setOptions([]);
    setIsLoading(true);

    try {
      const [botMessage, options] = await sendChatMessage(chatId, userMessage);
      dispatch(addLastMessage(botMessage));
      setOptions(options);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, something went wrong.',
      };
      dispatch(addLastMessage(errorMessage));
      showSnackbar('Failed to send message. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
      <Box
        sx={{
          width: '80%',
          margin: '20px auto',
          padding: 2,
          fontFamily: 'Roboto, sans-serif',
          justifyContent: 'center',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 3,
          borderRadius: 2,
          background: '#aaaaaa', // Updated background
        }}
      >
      {/* Updated Title */}
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{
          fontFamily: 'Comic Sans MS, cursive, sans-serif',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to right, #ff6e7f, #bfe9ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        <ChatIcon sx={{ fontSize: '2.5rem', marginRight: '0.5rem' }} />
        Simple Chat
      </Typography>

      {/* Added Slogan Near Title */}
      <Typography
        variant="subtitle1"
        align="center"
        gutterBottom
        sx={{
          fontFamily: 'Roboto, sans-serif',
          fontStyle: 'italic',
          color: '#ffffff',
          marginBottom: 2,
        }}
      >
        Simply chat to get what you want
      </Typography>

      {/* Main Content */}
      <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Side - Chat Box and Input */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            // width: '100%',
              width: {
                xs: '90%',
                md: '1300px',
              },
          }}
          flexShrink={0}
        >
          {/* Chat Box Section */}
          <Box
            sx={{
              flexGrow: 1, // Allow the chat box to take up available space
              overflowY: 'auto',
              padding: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              marginBottom: 2,
            }}
            ref={chatBoxRef}
          >
            <List>
              {chat.map((message, index) => (
                <ListItem
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent:
                      message.role === 'user' ? 'flex-end' : 'flex-start',
                    padding: 0,
                  }}
                >
                  {message.role !== 'user' && (
                    <Avatar sx={{ bgcolor: '#1976d2', marginRight: 1 }}>A</Avatar>
                  )}
                  <Paper
                    sx={{
                      padding: 1.5,
                      maxWidth: '80%',
                      backgroundColor:
                        message.role === 'user' ? '#1976d2' : '#e0e0e0',
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: message.role === 'user' ? '#fff' : '#000',
                      }}
                    >
                      {message.content}
                    </Typography>
                  </Paper>
                  {message.role === 'user' && (
                    <Avatar sx={{ bgcolor: '#4caf50', marginLeft: 1 }}>U</Avatar>
                  )}
                </ListItem>
              ))}
            </List>

            {options.length > 0 && (
              <Box sx={{ marginTop: 2 }}>
                <Divider />
                <Box
                  sx={{
                    marginTop: 1,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1, // Adds consistent spacing between Chips
                  }}
                >
                  {options.map((option, index) => (
                    <Chip
                      key={index}
                      label={option}
                      clickable
                      color="primary"
                      variant="outlined"
                      onClick={() => sendToServer(option)}
                      sx={{
                        borderRadius: '16px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        fontWeight: '500',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Input Field */}
          <Paper elevation={3} sx={{ padding: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Type your message..."
                variant="outlined"
                fullWidth
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        color="primary"
                        onClick={sendMessage}
                        disabled={!userInput.trim() || isLoading}
                        aria-label="send message"
                      >
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {isLoading && (
                <CircularProgress size={24} sx={{ marginLeft: 2 }} />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Side - Controls */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Reference ID Section */}
          <Paper
            elevation={3}
            sx={{
              flexGrow: 1, // Allow the controls section to take up available space
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 2,
              overflowY: 'auto', // Add scroll if content exceeds available space
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Current Chat Reference ID */}
              <Typography variant="subtitle1">
                Current Chat Reference ID:
              </Typography>
              <Typography variant="h6" color="primary">
                {chatId || 'Not Set'}
              </Typography>

              {/* Rewind Chat ID */}
              <TextField
                label="Rewind from Previous Chat ID"
                variant="outlined"
                fullWidth
                value={prevChatId}
                type="number"
                onChange={(e) => setPrevChatId(e.target.value)}
                disabled={isLoading}
              />

              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={() => rewindChat(prevChatId)}
                disabled={!prevChatId.trim() || isLoading}
              >
                Rewind Chat
              </Button>

              {/* Website URL Slogan */}
              <Typography variant="subtitle1">
                This conversation chats about:
              </Typography>
              <Typography variant="h6" color="primary">
                {url || 'No URL Set'}
              </Typography>

              {/* Website URL Input */}
                {isChatUrlSet ?
                    'url for current chat is set, start a new chat to chat about another website' :
                    <>
                    <TextField
                        label="Website URL"
                        variant="outlined"
                        fullWidth
                        value={url}
                        onChange={(e) => dispatch(updateUrl(e.target.value))}
                        disabled={isLoading}
                      />

                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={setURL}
                        disabled={!url.trim() || isLoading}
                      >
                        Set URL
                      </Button>
                    </>
                }
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;
