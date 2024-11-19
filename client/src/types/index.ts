export interface Message {
    role: 'user' | 'system';
    content: string;
}

export interface Chat {
    id: string;
    url: string;
    history: Message[];
}
