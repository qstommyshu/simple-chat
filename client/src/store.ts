import { configureStore } from '@reduxjs/toolkit'
import chatSliceReducer from "./state/chatSlice.ts";

export default configureStore({
    reducer: {
        chat: chatSliceReducer
    }
})