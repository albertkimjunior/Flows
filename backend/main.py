from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import HumanMessagePromptTemplate, ChatPromptTemplate
from langchain.document_loaders import TextLoader
#from langchain.text_splitter import CharacterTextSplitter
from langchain.schema import Document
from langchain.document_loaders import UnstructuredURLLoader
from langchain.embeddings import OpenAIEmbeddings
from unstructured.partition.html import partition_html
from unstructured.chunking.title import chunk_by_title
import requests

from transformers import pipeline
import datetime
import random
import json
from dotenv import load_dotenv



# Step 1: Load the website content
def load_website(url):
    response = requests.get(url)
    if response.status_code == 200:
        return response.text
    else:
        raise Exception(f"Failed to load page with status code: {response.status_code}")

# Step 2: Partition the HTML content
def partition_html_content(html_content):
    elements = partition_html(text=html_content)
    chunks = chunk_by_title(elements)

    for chunk in chunks:
        print(chunk)
        print("\n\n" + "-"*80)
    return elements

def parse_action_links(elements):
    action_links = {}
    for element in elements:
        if element.links:
            action_links[element.links[0]['text']] = element.links[0]['url']
    return action_links

# Step 3: Create a prompt for ChatGPT to identify top 3 actions
def top_three_actions(elements):
    text_content = "\n".join(element.text for element in elements if element.text.strip() != "")
    print(f"what is the length of ")
    prompt = f"The following is the content of a website:\n\n{text_content}\n\nBased on the above content, what are the top 3 actions a user can take on this website?"
    return prompt

def identify_top_action_links(response, top_action_links):
    links = ""
    for key, value in top_action_links.items():
        links += f"| {key} : {value} |" 
    prompt = f"given these actions {response} what are the most relevent links {links}"
    return prompt

# Function to interact with OpenAI's ChatGPT
def prompt_chatgpt(prompt):
    # Initialize OpenAI LLM (replace with your OpenAI API key if needed)
    chat = ChatOpenAI()
    
    # Create prompt template and chain
    chat_prompt = ChatPromptTemplate(
        input_variables=["content"],
        messages=[
            HumanMessagePromptTemplate.from_template("{content}")
        ]
    )
    
    llm_chain = LLMChain(llm=chat, prompt=chat_prompt)
    
    response = llm_chain({"content": prompt})
    return response['text']

# Main function to execute the steps
def main(url):
    html_content = load_website(url)
    elements = partition_html_content(html_content)
    prompt = top_three_actions(elements)
    top_actions = prompt_chatgpt(prompt)
    result = prompt_chatgpt(identify_top_action_links(top_actions, parse_action_links(elements)))
    return result

if __name__ == "__main__":
    website_url = "https://chipotle.com/"  # Replace with your target URL
    response = main(website_url)
    print(response)




# class ActionFinder:
#     def __init__(self, chunk_size=5000, chunk_overlap=0):

#         self.action_finder = ActionFinder()
#         self.chat = ChatOpenAI()
#         self.llm_chain = self.create_llm_chain()
#         self.emotion_dict = {}

#     def website_entry(self):
#         return 
        
#     def create_llm_chain(self):
#         prompt = ChatPromptTemplate(
#             input_variables=["content", "messages"],
#             messages=[
#                 HumanMessagePromptTemplate.from_template("{content}")
#             ]
#         )
#         return LLMChain(llm=self.chat, prompt=prompt)

#     def find_actions(self, entry_key, prompt_text):
#         if entry_key in self.emotion_dict:
#             journal_entry = self.emotion_dict[entry_key]['text']
#             response = self.llm_chain({"content": prompt_text + website_chunk})
#             return response['text']
#         else:
#             return "Invalid entry key."
    


# # Main function to execute the steps
# def main(url):
#     html_content = load_website(url)
#     elements = partition_html_content(html_content)
#     prompt = create_prompt(elements)
#     chatgpt_response = prompt_chatgpt(prompt)
#     return chatgpt_response

# if __name__ == "__main__":
#     website_url = "https://lite.cnn.com/"  # Replace with your target URL
#     response = main(website_url)
#     print(response)

# class website_chunker:
#     def __init__(self, html_text, chunk_size=5000, chunk_overlap=0):
#         self.journal_text = journal_text
#         self.chunk_size = chunk_size
#         self.chunk_overlap = chunk_overlap
#         self.docs = self.split_text()

#     def split_text(self):
#         text_splitter = CharacterTextSplitter(
#             chunk_size=self.chunk_size,
#             chunk_overlap=self.chunk_overlap
#         )
#         return text_splitter.split_documents([Document(page_content=self.journal_text)])
    
