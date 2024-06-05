import React, { useState, useRef, useEffect } from "react"
import type { PlasmoCSConfig } from "plasmo"
import iconImage from "assets/taskpuppy_icon_inactive.png"
import icon1 from "assets/keys/icon1.png"
import icon2 from "assets/keys/icon2.png"
import icon3 from "assets/keys/icon3.png"
import icon4 from "assets/keys/icon4.png"
import icon5 from "assets/keys/icon5.png"
import styleText from 'data-text:./content.css'
import Groq from 'groq-sdk';
import type { PlasmoGetStyle } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: 'MAIN',
  run_at: 'document_end',
}

import type { PlasmoGetOverlayAnchor } from "plasmo"

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () => {
  const body = await document.querySelector("body")
  return body
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const currentURL = window.location.href;
const elements = getFilteredElementsAsCSV();

const groq = new Groq({ apiKey: "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", dangerouslyAllowBrowser: true });

async function llm_process_options() {
  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "system",
        "content": `Given the current URL: ${currentURL}\n\nFrom the following comma-separated list of HTML elements, identify the top 15 essential tags for user interaction ordered by descending likelihood that the user would interact with that element. Exclude advertising tags and inputs that redirect to the current URL. For each essential tag, create a one-line JSON object with:\n\n* The tag name.\n* All attributes from the input (e.g., href, aria-label, etc.). If an attribute is null or empty, return as empty string.\n* A brief description of the tag's function.\n\nOrder of Importance:\n1. Search field\n2. Sort and filter buttons/inputs\n3. Other important input fields\n4. Log-in/log-out buttons\n5. Miscellaneous important elements\n\nExclusions:\n* Advertising links and inputs\n* Links that redirect to the current URL\n\nOutput the JSON objects as a one-line array, enclosed in square brackets. Do not output any other explanatory text.`
      },
      {
        "role": "user",
        "content": `${elements}`
      },
    ],
    "model": "llama3-70b-8192",
    "temperature": 0,
    "max_tokens": 1024,
    "top_p": 1,
    "stream": false,
    "stop": null
  });

   console.log(chatCompletion.choices[0].message.content);
   return JSON.parse(chatCompletion.choices[0].message.content);
}

// state management for toggleable list
// data structure notes for @Michael: Shortcut Title, Action (how the action should be executed) - inclusive of any relevant field, button, etc tags to carry it out
const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
const iconImages = [icon1, icon2, icon3, icon4, icon5];
const actions = ['Action 1', 'Action 2', 'Action 3', 'Action 4', 'Action 5']; // placeholder for actions list

function Content() {
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // const [loaded, setLoaded] = useState(false);
  // later a value to adjust to use to display list or display loading indicator gif
  const loaded = true;

  // Regular function that calls the async function using .then()
  const handleProcessOptions = () => {
    llm_process_options()
      .then(result => {
        setData(result);
      })
      .catch(error => {
        console.error('Error processing options:', error);
      });
  };

  // Use useEffect to call the function when the component mounts
  useEffect(() => {
    handleProcessOptions();
  }, []);

  console.log(setData);

  // function to handle click on icon
  // toggles the isOpen state
  const handleClick = () => {
    setIsOpen(!isOpen);
    if (showInput) {
      setShowInput(false);
    }
    console.log(elements);
  };

  // function to handle keydown event
  const handleToggleKeyDown = (event) => {
    const isToggleCommand = event.key === 'Option' || event.key === 'Alt';
    const isExitCommand = event.key === 'Escape';
    // if Option/Alt key is pressed, toggle the isOpen state
    if (isToggleCommand) {
      setIsOpen(!isOpen);
    }
    // if Escape key is pressed, close the list always
    // also means that pressing Escape will not open the list view
    if (isExitCommand) {
      setIsOpen(false);
    }
  };

  // useEffect hook to handle focus on list when it is open
  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.focus();
    }
    document.addEventListener('keydown', handleToggleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleToggleKeyDown);
    };
  }, [isOpen]);

  // useEffect hook to handle focus on input when it is shown
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  // function to handle keydown event on list, used for list toggle navigation and to listen for "Enter/Return" key to show input
  const handleListKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default arrow key behavior (scrolling)

      if (event.key === 'ArrowDown') {
        setFocusedIndex((prevIndex) => (prevIndex + 1) % items.length);
      } else if (event.key === 'ArrowUp') {
        setFocusedIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
      }
    } else if (event.key === 'Enter' || event.key === 'Return') {
      setShowInput(true);
      setInputPlaceholder(items[focusedIndex]);
      // setIsOpen(false);
    }
  };

  // function to handle keydown event on input, used for input navigation and to listen for "Enter/Return" key to execute action
  const handleInputKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default arrow key behavior (scrolling)
  
      // handled in this way because React sometimes delays state changes because it batches them
      // but this is meant to just update the index of the field when input field is in focus and Arrow keys are used to navigate
      setFocusedIndex((prevIndex) => {
        const newIndex = event.key === 'ArrowDown'
          ? (prevIndex + 1) % items.length
          : (prevIndex - 1 + items.length) % items.length;
  
        setInputPlaceholder(items[newIndex]);
        return newIndex;
      });
    } else if (event.key === 'Enter' || event.key === 'Return') {
      // Execute action based on selected item
      // TODO HERE - Execute action based on selected item
      setShowInput(false);
      setFocusedIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % items.length;
        setInputPlaceholder(items[newIndex]);
        return newIndex;
      });
      listRef.current.focus();
      console.log(actions[focusedIndex]);
    // General escape keys to close input
    // relies on fact that when input is in focus, pressing any of these keys will usually mean that user wants to close it
    } else if (event.key === 'Escape' || event.key === 'Option' || event.key === 'Alt') {
      setShowInput(false);
    }
  };

  return (
    <div>
      {/* Larger div for the icon and list */}
      <div style={{ position: "fixed", bottom: 20, right: 20 , display: 'flex', flexDirection: 'column-reverse', height: '40vh'}}>
        {/* Icon image */}
        <img
          src={iconImage}
          alt="Taskpuppy Icon"
          onClick={handleClick}
          className="main-icon"
        />
        {/* List of icons */}
        {isOpen && (
          // The items, when in focus, use handleListKeyDown function to listen to key presses
          <ul ref={listRef} tabIndex={-1} onKeyDown={handleListKeyDown}
          style={{
            backgroundColor: 'rgba(227, 227, 227, 0.5)', // Light gray with 70% opacity
            width: '20vw', // 10% of the viewport width
            alignSelf: 'flex-end', // Align the list to the right edge of the icon
            padding: '1.3em',
            borderRadius: '0.5em',
          }}>
            {items.map((item, index) => (
              <li
              key={index}
              tabIndex={0}
              style={{
                backgroundColor: focusedIndex === index ? 'lightgray' : 'transparent',
                display: 'flex',
                alignItems: 'center',
              }}
              >
              <img src={iconImages[index]} alt={`Icon for ${item}`} style={{ width: '37px', height: '36px', marginRight: '0.5em' }} />
              <p>{item}</p>
            </li>
            ))}
          </ul>
        )}
      </div>
      {/* Input field */}
      {showInput && (
        <div style={{ position: 'fixed', bottom: '25%', left: '50%', transform: 'translate(-50%, 50%)' }}>
          {/* The input field, when in focus, use handleInputKeyDown function to listen to key presses */}
          <input ref={inputRef} placeholder={inputPlaceholder} onKeyDown={handleInputKeyDown} className="custom-input"/>
        </div>
      )}
    </div>
  )
}

function getInteractableElements() {
  // Define the selectors for interactable elements
  const selectors = [
    'input', 'button', 'a[href]'
  ];

  // Use querySelectorAll to find all matching elements
  const elements = document.querySelectorAll(selectors.join(','));

  // Convert NodeList to an array for easier manipulation
  const interactableElements = Array.from(elements);

  // Filter out elements based on specific criteria if needed
  // For example, filter out hidden elements
  const visibleElements = interactableElements.filter(el => el.offsetParent !== null);

  return visibleElements;
}

function getFilteredElementsAsCSV() {
  const elements = getInteractableElements();
  return elements.map(el => {
    if (el.tagName.toLowerCase() === 'a') {
      return `a href=${el.href} aria-label=${el.ariaLabel} text=${el.text}`;
    } else if (el.tagName.toLowerCase() === 'button') {
      return `button text=${el.text}`;
    } else if (el.tagName.toLowerCase() === 'input') {
      return `input type=${el.type} placeholder=${el.placeholder} id=${el.id} aria-label=${el.ariaLabel}`;
    }
  }).join(',');
}

export default Content