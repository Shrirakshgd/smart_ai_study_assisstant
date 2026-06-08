import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from dotenv import load_dotenv

load_dotenv()

# Check if GEMINI_API_KEY is set, if not, user needs to provide it.
# We map it from either GOOGLE_API_KEY or GEMINI_API_KEY
if "GEMINI_API_KEY" in os.environ and "GOOGLE_API_KEY" not in os.environ:
    os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

DB_DIR = "./chroma_db"
VECTOR_STORE = None
CURRENT_DOC_CONTEXT = ""

def get_llm():
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

def get_embeddings():
    return GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")

def init_vector_store():
    global VECTOR_STORE
    if VECTOR_STORE is None:
        VECTOR_STORE = Chroma(
            embedding_function=get_embeddings(),
            persist_directory=DB_DIR
        )
    return VECTOR_STORE

CURRENT_NOTE_ID = None

def process_document(file_path: str, filename: str, note_id: int):
    global CURRENT_DOC_CONTEXT, CURRENT_NOTE_ID
    
    if filename.endswith('.pdf'):
        loader = PyPDFLoader(file_path)
    else:
        loader = TextLoader(file_path, encoding='utf-8')
        
    docs = loader.load()
    
    # Store the raw text for summarization and quiz generation
    CURRENT_DOC_CONTEXT = "\n\n".join([doc.page_content for doc in docs])
    CURRENT_NOTE_ID = note_id
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    
    for split in splits:
        split.metadata["note_id"] = note_id
    
    vector_store = init_vector_store()
    vector_store.add_documents(splits)
    
    return CURRENT_DOC_CONTEXT

import spacy
from sklearn.feature_extraction.text import TfidfVectorizer

nlp_model = None

def get_spacy_nlp():
    global nlp_model
    if nlp_model is None:
        try:
            nlp_model = spacy.load("en_core_web_sm")
        except:
            nlp_model = False
    return nlp_model

def extract_keywords(text: str, top_n: int = 5) -> str:
    if not text or len(text) < 10:
        return ""
        
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=30)
        tfidf_matrix = vectorizer.fit_transform([text])
        feature_names = vectorizer.get_feature_names_out()
        tfidf_scores = tfidf_matrix.toarray()[0]
        
        sorted_indices = tfidf_scores.argsort()[::-1]
        top_tfidf_words = [feature_names[i] for i in sorted_indices[:top_n*2]]
        
        nlp = get_spacy_nlp()
        if nlp:
            doc = nlp(text[:10000])
            entities = [ent.text.lower() for ent in doc.ents if ent.label_ in ['ORG', 'PERSON', 'GPE', 'EVENT', 'PRODUCT', 'LOC']]
            combined = list(set(top_tfidf_words + entities))
            keywords = [w.capitalize() for w in combined if len(w) > 2 and not w.isnumeric()]
            return ", ".join(keywords[:top_n])
        else:
            return ", ".join([w.capitalize() for w in top_tfidf_words[:top_n]])
    except Exception:
        return ""

def load_note_context(text: str, note_id: int):
    global CURRENT_DOC_CONTEXT, CURRENT_NOTE_ID
    # We DO NOT re-embed the text here. It is already in Chroma.
    CURRENT_DOC_CONTEXT = text
    CURRENT_NOTE_ID = note_id

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def ask_question(question: str) -> str:
    global CURRENT_NOTE_ID
    vector_store = init_vector_store()
    
    if CURRENT_NOTE_ID is not None:
        retriever = vector_store.as_retriever(search_kwargs={"k": 4, "filter": {"note_id": CURRENT_NOTE_ID}})
    else:
        retriever = vector_store.as_retriever(search_kwargs={"k": 4})
        
    llm = get_llm()
    
    template = """You are a smart AI study assistant. Use the following pieces of retrieved context to answer the user's question. If you don't know the answer based on the context, say that you don't know. Keep the answer concise and helpful.

Context: {context}

Question: {question}

Answer:"""
    
    prompt = PromptTemplate.from_template(template)
    
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    
    return rag_chain.invoke(question)

def generate_summary() -> str:
    global CURRENT_DOC_CONTEXT
    if not CURRENT_DOC_CONTEXT:
        return "No document uploaded yet."
        
    llm = get_llm()
    prompt = PromptTemplate(
        template="You are an expert tutor. Please provide a comprehensive summary of the following text, highlighting the main concepts and key takeaways. Format your response as neatly written, cohesive paragraphs (prose). Do NOT use any markdown formatting such as bullet points (*), hash symbols (#) for headings, or numbered lists. Provide only plain text paragraphs.\n\nText: {text}\n\nSummary:",
        input_variables=["text"]
    )
    
    # Truncate context to avoid token limits if necessary
    text_to_summarize = CURRENT_DOC_CONTEXT[:30000] 
    
    chain = prompt | llm
    response = chain.invoke({"text": text_to_summarize})
    return response.content

def generate_quiz(num_questions: int) -> str:
    global CURRENT_DOC_CONTEXT
    if not CURRENT_DOC_CONTEXT:
        return "No document uploaded yet."
        
    llm = get_llm()
    prompt = PromptTemplate(
        template="You are an expert tutor. Generate a {num_questions}-question quiz based on the following text. "
                 "Format the output as multiple-choice questions with answers provided at the end. "
                 "Do NOT use any markdown formatting such as bolding (**), asterisks (*), or hash symbols (#). "
                 "Use standard numbering (1., 2.) for questions and lettering (A., B.) for options. Provide only plain text.\n\n"
                 "Text: {text}\n\nQuiz:",
        input_variables=["num_questions", "text"]
    )
    
    text_to_quiz = CURRENT_DOC_CONTEXT[:30000]
    
    chain = prompt | llm
    response = chain.invoke({"num_questions": num_questions, "text": text_to_quiz})
    return response.content

def reset_context():
    global VECTOR_STORE, CURRENT_DOC_CONTEXT
    CURRENT_DOC_CONTEXT = ""
    if VECTOR_STORE:
        try:
            VECTOR_STORE.delete_collection()
        except Exception:
            pass
        VECTOR_STORE = None
        
    if os.path.exists(DB_DIR):
        import shutil
        shutil.rmtree(DB_DIR, ignore_errors=True)
