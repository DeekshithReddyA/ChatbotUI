# Chat Application Backend

This is the backend service for the multimodal chat application. It provides REST APIs for user management, conversation handling, and AI model interaction.

## Features

- User authentication and management
- Conversation storage and retrieval
- Support for multiple AI models (OpenAI GPT-4o, Gemini, etc.)
- Multimodal content support (text, images, files)
- Message streaming with support for stopping generation mid-way
- S3 bucket integration for conversation storage

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables in a `.env` file:
```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# AWS S3
endpoint_url="your-endpoint-url"
aws_access_key_id="your-access-key"
aws_secret_access_key="your-secret-key"
region="your-region"
BUCKET="your-bucket-name"

# Server
PORT=3000
```
4. Run Prisma migrations:
```bash
npx prisma migrate dev
```
5. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run start` - Start the production server
- `npm run dev` - Build and start the development server

## API Endpoints

### User Management
- `POST /api/user/signup` - Create a new user
- `GET /api/user/get` - Get user information and conversations

### Conversations
- `GET /api/convo/list` - List all conversations
- `GET /api/convo/:id` - Get a specific conversation
- `POST /api/convo/create` - Create a new conversation
- `DELETE /api/convo/:id` - Delete a conversation

### Chat
- `POST /api/chat` - Send a message and receive streaming AI response
- `POST /api/chat/save-stopped` - Save a stopped AI response

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Add tests for your feature
4. Submit a pull request 