import React, { useState, useRef, useEffect } from "react"
import type { PlasmoCSConfig } from "plasmo"
import inactiveImage from "assets/taskpuppy_icon_inactive.png"
import activeImage from "assets/taskpuppy_icon_active.png"
import optionKeyImage from "assets/keys/option_key.png"
import icon1 from "assets/keys/icon1.png"
import icon2 from "assets/keys/icon2.png"
import icon3 from "assets/keys/icon3.png"
import icon4 from "assets/keys/icon4.png"
import icon5 from "assets/keys/icon5.png"
import taskpuppySearchIcon from "assets/taskpuppy_searchbar_icon.png"
import styleText from 'data-text:./content.css'
import Groq from 'groq-sdk';
import type { PlasmoGetStyle } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  // world: 'MAIN',
  run_at: 'document_end',
  css: ["font.css"]
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
const raw_elements = getFilteredElementsAsCSV();
const elements = raw_elements.replace(/(\r\n|\n|\r)/gm, "");
console.log(elements);

const groq = new Groq({ apiKey: "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", dangerouslyAllowBrowser: true });

async function llm_process_options() {
  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "system",
        "content": `Given the current URL: ${currentURL}\n\nFrom the following comma-separated list of HTML elements, identify the top 15 essential tags for user interaction ordered by descending likelihood that the user would interact with that element. Exclude advertising tags and inputs that redirect to the current URL. For each essential tag, create a one-line JSON object with:\n\n* The tag name.\n* All attributes from the input (e.g., href, aria-label, etc.). If an attribute is null or empty, return as empty string.\n* A brief description of the tag's function.\n\nOrder of Importance:\n1. Search field\n2. Sort and filter buttons/inputs\n3. Other important input fields\n4. Log-in/log-out buttons\n5. Miscellaneous important elements\n\nExclusions:\n* Any duplicate entries\n* Advertising links and inputs\n* Links that redirect to the current URL\n\nOutput the JSON objects as a one-line array, enclosed in square brackets. Do not output any other explanatory text.`
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
   const json_output = chatCompletion.choices[0].message.content.match(/\[([^\]]+)\]/g);
   console.log(json_output)
   return JSON.parse(json_output[0]);
}

// console.log(elements);

// state management for toggleable list
// data structure notes for @Michael: Shortcut Title, Action (how the action should be executed) - inclusive of any relevant field, button, etc tags to carry it out
// const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
const iconImages = [icon1, icon2, icon3, icon4, icon5];
const actions = ['Action 1', 'Action 2', 'Action 3', 'Action 4', 'Action 5']; // placeholder for actions list

function Content() {
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false); // state variable for isOpen list toggle status
  const [focusedIndex, setFocusedIndex] = useState(0); // state variable for focusedIndex in Items list (the focused <li> tag)
  const [showInput, setShowInput] = useState(false); // state variable for showInput input field toggle status
  const [inputPlaceholder, setInputPlaceholder] = useState(''); // state variable for inputPlaceholder
  const [inputValue, setInputValue] = useState(''); // state variable for inputValue
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const contentRef = useRef(null);

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

  // Add this line to extract the first 5 items and store their descriptions
  const items = data ? data.slice(0, 5).map(item => item.description) : [];

  // function to handle click on icon
  // toggles the isOpen state
  const handleClick = () => {
    setIsOpen(!isOpen);
    if (showInput) {
      setShowInput(false);
    }
  };

  const toggleShowInput = () => {
    setShowInput((prevShowInput) => {
      if (prevShowInput) {
        // If showInput is currently true, set it to false
        return false;
      } else {
        // If showInput is currently false, return the previous value (no change)
        return prevShowInput;
      }
    });
  };

  // listens for clicks outside of content elements to defocus Taskpuppy
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowInput(false);
      }
    };

    document.addEventListener('click', handleClickOutside, true);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  // function to handle keydown event
  const handleToggleKeyDown = (event) => {
    const isToggleCommand = event.key === 'Option' || event.key === 'Alt';
    const isExitCommand = event.key === 'Escape';
    // if Option/Alt key is pressed, toggle the isOpen state
    if (isToggleCommand) {
      setIsOpen(!isOpen);
      toggleShowInput();
    }
    // if Escape key is pressed, close the list always
    // also means that pressing Escape will not open the list view
    if (isExitCommand) {
      setIsOpen(false);
      setShowInput(false);
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

  console.log(data);
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
      console.log(focusedIndex);
      console.log(data[focusedIndex]);
      if (data[focusedIndex].tag === "a" || data[focusedIndex].tag === "button") {
        executeClickAction(data[focusedIndex]);
      } else {
        setShowInput(true);
        setInputPlaceholder(items[focusedIndex]);
      }
      // setIsOpen(false);
    } else if (event.key >= '1' && event.key <= '5') {
      // Handle keys 1, 2, 3, 4, and 5
      event.preventDefault();
      const itemIndex = parseInt(event.key, 10) - 1; // Convert key to index (0-based)
      if (itemIndex >= 0 && itemIndex < items.length) {
        if (data[focusedIndex].tag === "a" || data[focusedIndex].tag === "button") {
          executeClickAction(data[focusedIndex]);
        } else {
          setFocusedIndex(itemIndex);
          setShowInput(true);
          setInputPlaceholder(items[itemIndex]);
        }
      }
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
      // console.log(actions[focusedIndex]);
      console.log('Input value:', inputValue); // input value is logged into inputValue state variable, use as needed
      executeInputAction(data[focusedIndex], inputValue);
    // General escape keys to close input
    // relies on fact that when input is in focus, pressing any of these keys will usually mean that user wants to close it
    } else if (event.key === 'Escape' || event.key === 'Option' || event.key === 'Alt') {
      setShowInput(false);
    }
  };

  return (
    <div ref={contentRef}>
      {/* Larger div for the icon and list */}
      <div style={{ position: "fixed", bottom: 20, right: 20 , display: 'flex', flexDirection: 'column-reverse', height: '40vh'}}>
        <div style = {{ display: 'flex', flexDirection: 'row', alignSelf: 'flex-end' }}>
          <img src={optionKeyImage} alt="Option Key" className="option-key" onClick={handleClick}/>
          {/* Icon image */}
          <img
            src={isOpen ? activeImage : inactiveImage}
            alt="Taskpuppy Icon"
            onClick={handleClick}
            className="main-icon"
          />
        </div>
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
            outline: 'none',
          }}>
            {items.map((item, index) => (
              <li
              key={index}
              tabIndex={0}
              style={{
                backgroundColor: focusedIndex === index ? 'rgba(255, 179, 179, 0.4)' : 'transparent',
                border: focusedIndex === index ? '2px solid rgba(255, 96, 96, 0.8)' : 'none',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '0.5em',
                padding: '0.3em 0.5em',
                fontFamily: 'PressStart2P',
                color: 'black',
                fontSize: '0.7em',
                margin: '0.7em 0',
                outline: 'none',
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
        <div style={{ position: 'fixed', bottom: '35%', left: '50%', transform: 'translate(-50%, 50%)' }}>
          {/* The input field, when in focus, use handleInputKeyDown function to listen to key presses */}
          <img src={taskpuppySearchIcon} alt="Search Icon" style={{ position: 'absolute', width: '36px', height: '34px', marginLeft: '0.9em', marginTop: '1.1em', zIndex: 2 }} />
          <input ref={inputRef} placeholder={inputPlaceholder} onKeyDown={handleInputKeyDown} className="custom-input" value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
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
      let a_tag = `a href=${el.href}`;
      if (el.ariaLabel) a_tag += ` aria-label=${el.ariaLabel}`;
      if (el.text)      a_tag += ` text=${el.text}`;
      return a_tag;
    } else if (el.tagName.toLowerCase() === 'button') {
      let button_tag = `button`;
      if (el.ariaLabel) button_tag += ` aria-label=${el.ariaLabel}`;
      if (el.text)      button_tag += ` text=${el.text}`;
      if (el.type)      button_tag += ` type=${el.type}`;
      return button_tag;
    } else if (el.tagName.toLowerCase() === 'input') {
      let input_tag = "input";
      if (el.type)        input_tag += ` type=${el.type}`;
      if (el.placeholder) input_tag += ` placeholder=${el.placeholder}`;
      // if (el.id)          input_tag += ` id=${el.id}`;
      if (el.ariaLabel)   input_tag += ` aria-label=${el.ariaLabel}`;
      return input_tag;
    }
  }).join(',');
}

const findElement = (item) => {
  const { tag, attributes } = item;
  const selector = Object.entries(attributes)
    .filter(([key, value]) => value !== '')
    .map(([key, value]) => `[${key}="${value}"]`)
    .join('');
  console.log(`${tag}${selector}`)
  return document.querySelector(`${tag}${selector}`);
};

// Add this function to handle actions based on the tag type
const executeClickAction = (item) => {
  const element = findElement(item);
  if (element) {
    if (item.tag === 'a' || item.tag === 'button') {
      // Simulate a click action
      element.click();
      console.log(`Simulated click on ${item.description}`);
    }
  } else {
    console.error(`Element not found for ${item.description}`);
  }
};

// Add this function to handle actions based on the tag type
const executeInputAction = (item, inputVal) => {
  const element = findElement(item);
  console.log(element);
  if (element) {
    if (item.tag === 'input') {
      // Simulate typing into the input field
      element.value = inputVal;
      console.log(`Simulated typing in ${item.description}`);
    }
  } else {
    console.error(`Element not found for ${item.description}`);
  }
};

export default Content