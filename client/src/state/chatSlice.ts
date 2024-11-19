import { createSlice } from '@reduxjs/toolkit';

interface Content {
    text: string,
    options: string[],
}

interface Message {
    role: 'user' | 'system';
    content: Content;
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
            state.history = deepParse(action.payload.conversation);
        },
        addLastMessage: (state, action) => {
            state.history.push(action.payload);
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