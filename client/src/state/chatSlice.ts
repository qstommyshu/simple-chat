import { createSlice } from '@reduxjs/toolkit';
import { Chat } from "../types";

const initialState: Chat = {
    id: '',
    url: '',
    history: [],
};

const deepParse = (jsonString: string)=> {
    const result = JSON.parse(jsonString)
    if (typeof result === 'object' && result !== null) {
        for (const key in result) {
            if (typeof result[key] === 'string') {
                result[key] = deepParse(result[key]);
            }
        }
    }
    return result
}

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        loadChat: (state, action) => {
            state.id = action.payload.id;
            state.url = action.payload.url;
            state.history = deepParse(action.payload.convo);
        },
        addLastMessage: (state, action) => {
            state.history.push(action.payload);
        },
        updateUrl: (state, action) => {
            state.url = action.payload;
        },
    },
});

export const { loadChat, addLastMessage, updateUrl, } = chatSlice.actions;

const selectChatId = (state: {chat: Chat}) => state.chat.id;
const selectChatUrl = (state: {chat: Chat}) => state.chat.url;
const selectChatHistory = (state: {chat: Chat}) => state.chat.history;

export { selectChatId, selectChatUrl, selectChatHistory};

export default chatSlice.reducer;