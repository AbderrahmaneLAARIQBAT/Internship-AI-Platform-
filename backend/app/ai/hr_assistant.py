from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.ai.llm_provider import get_llm_provider

def ask_hr_assistant(query: str, context_data: str = "") -> str:
    """
    Answers an HR-related query using the configured LLM and optional context data 
    (like list of candidates or a specific CV).
    """
    llm = get_llm_provider()
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a Senior HR Assistant AI for the Intern AI Platform. "
                   "Your role is to help HR managers find the best candidates, summarize CVs, "
                   "and generate emails (acceptance/rejection). Be professional, concise, and helpful.\n\n"
                   "Context Data:\n{context_data}"),
        ("human", "{query}")
    ])
    
    chain = prompt | llm | StrOutputParser()
    
    response = chain.invoke({
        "query": query,
        "context_data": context_data or "No specific context provided."
    })
    
    return response
