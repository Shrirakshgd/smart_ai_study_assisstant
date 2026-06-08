# Smart AI Study Assistant

A full-stack intelligent study assistant powered by Natural Language Processing (NLP) and Retrieval-Augmented Generation (RAG). The application allows users to upload study materials, process them, and ask context-aware questions to an AI.

## Architecture

This project is built using a modern decoupled architecture:

### Frontend
- **Framework:** React 19 with Vite
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Styling:** Vanilla CSS & Lucide Icons

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite (with SQLAlchemy ORM)
- **Authentication:** JWT (JSON Web Tokens) with Passlib bcrypt hashing
- **AI / LLM Integration:** Langchain & Google GenAI (Gemini)
- **Vector Database:** ChromaDB (for efficient semantic search and RAG)
- **Document Processing:** PyPDF

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Google Cloud / MakerSuite API Key (for Google GenAI)

### Backend Setup
1. Navigate to the `backend` directory.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder and add your environment variables:
   ```env
   GOOGLE_API_KEY=your_google_api_key_here
   SECRET_KEY=your_jwt_secret_key
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Features
- **User Authentication:** Secure login and registration.
- **Document Upload:** Upload PDF study materials.
- **AI Querying:** Ask questions based on the uploaded materials using RAG.
- **Context-Aware Responses:** The AI strictly uses the uploaded knowledge base to provide accurate answers.

## License
MIT License
