import axios from "axios";
import {Chat, Message} from "../types";
import {autoCompleteUrl} from "../utils";

const BASE_URL = "http://127.0.0.1:8000"

export const loadChatFromId = async (id: string): Promise<Chat> => {
    try {
        const response = await axios.get(`${BASE_URL}/load_chat?id=${id}`);
        return response.data;
    } catch (error) {
        console.error('Error communicating with the backend:', error);
        throw new Error('Failed to load chat');
    }
}

export const sendChatMessage = async (id: string, userMessage: Message): Promise<[Message, string[]]> => {
    try {
        const response = await axios.post(`${BASE_URL}/chat`, {
            body: userMessage,
            id: id,
        });
        const botMessage: Message = {
            role: 'assistant',
            content: response.data.body
        }
        return [botMessage, response.data.options]
    } catch (error) {
        console.error('Error communicating with the backend:', error);
        throw new Error('Failed to send chat message');
    }
}

export const sendURL = async (url: string): Promise<Chat> => {
    const completeUrl = autoCompleteUrl(url);
    try {
        const response = await axios.post(`${BASE_URL}/url`, {
          url: completeUrl,
        });
        return response.data;
    } catch (error) {
        console.error('Error communicating with the backend:', error);
        throw new Error('Failed to send url');
    }
}
