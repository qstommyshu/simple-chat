# simple-chat

The demo video of this project is in this [link](https://youtu.be/SPvllIrlkeI)

The project is deployed to: https://qstommyshu.com/

### Project details

This is a mini-challenge project for hiring purposes. It is a web application that takes in a url and create a knowledge chatbot to answer users questions.

#### Frontend solved challenges:
1. React state management, State Management with Redux.
2. UI related part, use MUI and ai to modify CSS to make it look good enough for a simple project demo.
3. Separate code logic and commenting like how I would do at work.
4. TS testing library, used Deno runtime, so less package complexity for frontend code.

#### Frontend can Improve:
1. Better code logic separation and comments.
2. Add markdown parser to chat messages so AI generated response can look better.

#### Backend Frontend solved challenges:
1. Logic structure separation(constants, DB related operations, etc... are in their own place).
2. .env file to hide secret key and not polluting the current system (This API secret key is only for this project, we should not access it outside of this project, so there is not point of setting an actual environmental variable).
3. Pydantic for data type validation(both AI response and DB data before sending out).
4. Postman for API testing.
5. AI memory system (store conversation history in db, hide system prompt from user).
6. Structured output from ChatGPT api.
7. Lots of try catch, gives clear error if there’s any (Internal server error basically means this type of error is not handled, also means there are potential code error that is not handled).
8. When serve load is large, we can use load balancer and use gRPC for efficient backend communication.

#### Backend can Improve:
1. Summarize previous chat conversation (i.e. when conversation messages exceeds 10 messages, summarize previous 6 messages as they might not be as relevant) or model level memory,  to save storages space and reduce to cost for AI (AI reading messages also cost money!).

2. Add cache server like Redis to store chats, reduce the number of db accesses, and store updated conversation when there are no new messages for some time.
3. Use a DB with better performance if user base is large.
4. Data cleaning in the scraped page_content to reduce DB storage, and feed better quality data to AI.
5. Scrape related url when user asks deeper question.
6. More try catch to handle server side errors, seeing “Internal Server Error, 500” when something go wrong is annoying.
7. Add more unit tests.
8. Add logger for different level, so it is easier to debug in future.

### Project can improve:
Deployment workflow -auto run unit tests and deployment when pushing a code change.

## Reflection:
I think this is a fun project overall. 

I learned OpenAI's structured output API and how to set up a GPT based app. I also did some research on gRPC for this project, but I think that is not suitable to this little project. 

Working on this project also makes me reflect my work style, I think the most important point of working on such a project is to first do deep research and think about the project design comprehensively. That will save lots of debugging and re-implementation work. Also, if the design is complete at initial point, then we can do Test Driven Development easily (write tests first, then write code implementation to pass those tests).

It also got me think what kind of AI application can I build in future🤔