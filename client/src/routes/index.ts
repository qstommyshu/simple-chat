import axios from "axios";
import {Chat, Message} from "../types";
import {autoCompleteUrl} from "../utils";

export const loadChatFromId = async (id: string): Promise<Chat> => {
    try {
        const response = await axios.get(`http://127.0.0.1:8000/load_chat?id=${id}`);
        console.log(response.data)
        return response.data;
    } catch (error) {
        console.error('Error communicating with the backend:', error);
        throw new Error('Failed to load chat');
    }
}

export const sendChatMessage = async (id: string, userMessage: Message): Promise<[Message, string[]]> => {
    try {
        const response = await axios.post('http://127.0.0.1:8000/chat', {
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
    console.log(`complete url is ${completeUrl}`)
    try {
        const response = await axios.post('http://127.0.0.1:8000/url', {
          url: completeUrl,
        });
        console.log(response.data)
        return response.data;
    } catch (error) {
        console.error('Error communicating with the backend:', error);
        throw new Error('Failed to send url');
    }
}
