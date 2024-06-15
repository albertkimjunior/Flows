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
    prompt = f"given these actions {response} what are the most relevent links {links}.  Return just the top 3 URLs delimited by commas in the format: 'link', 'link', 'link'"
    return prompt

def summarize(elements):
    text_content = "\n".join(element.text for element in elements if element.text.strip() != "")
    prompt = f"summarize the following webpage in 1 sentence with a maximum of 10 words{text_content}"
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
    #result = prompt_chatgpt(identify_top_action_links(top_actions, parse_action_links(elements)))
    result = prompt_chatgpt(summarize(elements))
    return result

# Main function to execute the steps
def main1(url):
    html_content = load_website(url)
    elements = partition_html_content(html_content)
    prompt = top_three_actions(elements)
    top_actions = prompt_chatgpt(prompt)
    result = prompt_chatgpt(identify_top_action_links(top_actions, parse_action_links(elements)))
    # result = prompt_chatgpt(summarize(elements))
    return result

# Main function to execute the steps
def main2(url):
    html_content = load_website(url)
    elements = partition_html_content(html_content)
    prompt = top_three_actions(elements)
    top_actions = prompt_chatgpt(prompt)
    #result = prompt_chatgpt(identify_top_action_links(top_actions, parse_action_links(elements)))
    result = prompt_chatgpt(summarize(elements))
    return result

def make_magic(website_url):
    response = main1(website_url)
    response2 = main2(website_url)
    return_dict = {"summary":response2,"actions":response.split(",")}
    print(return_dict)
    return return_dict


if __name__ == "__main__":
    make_magic("https://hackerdojo.com/")  # Replace with your target URL

   

