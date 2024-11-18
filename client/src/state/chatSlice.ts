import { createSlice } from '@reduxjs/toolkit';

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

interface Chat {
    id: string;
    url: string;
    history: Message[];
}

const initialState: Chat = {
    id: '',
    url: '',
    history: [],
};

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        loadChat: (state, action) => {
            state.id = action.payload.id;
            state.url = action.payload.url;
            state.history = JSON.parse(action.payload.history);
        },
        addLastMessage: (state, action) => {
            state.history.push(action.payload.message);
        },
        updateChatId: (state, action) => {
            state.id = action.payload;
        },
        updateUrl: (state, action) => {
            state.url = action.payload;
        },
        updateHistory: (state, action) => {
            state.history = action.payload;
        }
    },
});

export const { loadChat, addLastMessage, updateChatId, updateUrl, updateHistory} = chatSlice.actions;

const selectChatId = (state) => state.chat.id;
const selectChatUrl = (state) => state.chat.url;
const selectChatHistory = (state) => state.chat.history;

export { selectChatId, selectChatUrl, selectChatHistory};

export default chatSlice.reducer;