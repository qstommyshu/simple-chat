import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Divider,
  Avatar,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
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

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
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

  // Effect to scroll to the latest message when messages are updated
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const rewindChat = async (prevChatId: string) => {
    if (!prevChatId.trim()) {
      showSnackbar('Please enter a valid chat ID.', 'warning');
      return;
    }
    try {
      setIsLoading(true);
      const prevChat = await loadChatFromId(prevChatId);
      setPrevChatId('');
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
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        padding: 2,
        fontFamily: 'Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Simple Chat
      </Typography>

      <Paper elevation={3} sx={{ padding: 2, marginBottom: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">Current Chat Reference ID:</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" color="primary">
              {chatId || 'Not Set'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Rewind from Previous Chat ID"
              variant="outlined"
              fullWidth
              value={prevChatId}
              type="number"
              onChange={(e) => setPrevChatId(e.target.value)}
              disabled={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={() => rewindChat(prevChatId)}
              disabled={!prevChatId.trim() || isLoading}
            >
              Confirm
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ padding: 2, marginBottom: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              label="Website URL"
              variant="outlined"
              fullWidth
              value={url}
              onChange={(e) => dispatch(updateUrl(e.target.value))}
              disabled={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={setURL}
              disabled={!url.trim() || isLoading}
            >
              Set URL
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box
        sx={{
          flexGrow: 1,
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
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
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
                  backgroundColor: message.role === 'user' ? '#1976d2' : '#e0e0e0',
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
            <Box sx={{ marginTop: 1, display: 'flex', flexWrap: 'wrap' }}>
              {options.map((option, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  color="primary"
                  sx={{ marginRight: 1, marginBottom: 1 }}
                  onClick={() => sendToServer(option)}
                >
                  {option}
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </Box>

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

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;
