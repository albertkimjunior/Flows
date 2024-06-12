import React, { useState, useRef, useEffect } from "react"
import type { PlasmoCSConfig } from "plasmo"

// FLOWS image files
// logo
import flowsFloatingPrompt from "assets/flows_action_logo.png"
// icons
import active_summarize from "assets/icons/summarize_active.png"
import inactive_summarize from "assets/icons/summarize_inactive.png"
import active_search from "assets/icons/supersearch_active.png"
import inactive_search from "assets/icons/supersearch_inactive.png"
import active_submit from "assets/icons/submit_flow_active.png"
import inactive_submit from "assets/icons/submit_flow_inactive.png"

import return_key from "assets/keys/return_key.png"
import escape_key from "assets/keys/escape_key.png"

// CSS and APIs
import styleText from 'data-text:./content.css'
import type { PlasmoGetStyle } from "plasmo"

// Backend
// import { llm_process_options, getFilteredElementsAsCSV, findElement, executeClickAction, executeInputAction, } from './backend';
import backend from './backend';

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
let raw_elements = backend.getFilteredElementsAsCSV();
raw_elements = raw_elements.replace(/(\r\n|\n|\r)/gm, "");
const elements = raw_elements.replace(/\s+/g, ' ');
console.log(elements);

// state management for toggleable list
// data structure notes for @Michael: Shortcut Title, Action (how the action should be executed) - inclusive of any relevant field, button, etc tags to carry it out

// FLOWS changes

// Note: prob need to change this to JSON object later
const flowsConfig = {
  "summarize": {
    "flow": "Summarize page actions",
    "type": "direct",
    "inputPlaceholder": "[Enter] for Page Summary & Table of Contents.",
    "inputFieldValue": ""
  },
  "search": {
    "flow": "Search page, fast",
    "type": "input",
    "inputPlaceholder": "searchhhhhdh",
    "inputFieldValue": ""
  },
  "submit": {
    "flow": "Suggest a new flow",
    "type": "input",
    "inputPlaceholder": "submitttth",
    "inputFieldValue": ""
  }
}

const flowKeys = Object.keys(flowsConfig);
const flowActions = flowKeys.map(key => flowsConfig[key].flow);
const flowTypes = flowKeys.map(key => flowsConfig[key].type);
const flowInputPlaceholders = flowKeys.map(key => flowsConfig[key].inputPlaceholder);
const flowInputFieldValues = flowKeys.map(key => flowsConfig[key].inputFieldValue);

// remember, this is hard-coded. There will be separate data object that adjusts the flowType, flowText, icon, etc based on the flowAction.
const activeIconImages = [active_summarize, active_search, active_submit];
const inactiveIconImages = [inactive_summarize, inactive_search, inactive_submit];
const flowsBranch = true;
const actionOrientedRelease = true;

function Content() {
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const contentRef = useRef(null);
  const leftMenuRef = useRef(null);
  const rightMenuRef = useRef(null);

  const [rightMenuHeight, setRightMenuHeight] = useState('0px');
  
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false); // state variable for isOpen list toggle status
  const [focusedIndex, setFocusedIndex] = useState(0); // state variable for focusedIndex in Items list (the focused <li> tag)
  const [inputFocused, setInputFocused] = useState(false); // state variable for inputFocused
  const onInputFocus = () => {
    console.log("input focused")
    setInputFocused(true);
  }
  const onInputBlur = () => {
    console.log("input blurred")
    setTimeout(() => {
      setInputFocused(false);
    }, 10);
  }

  useEffect(() => {
    if (isOpen && inputFocused) {
      inputRef.current.focus();
    } else if (isOpen && listRef.current) {
      listRef.current.focus();
    }

    const updateHeight = () => {
      if (leftMenuRef.current) {
        setRightMenuHeight(`${leftMenuRef.current.offsetHeight}px`);
      }
    };

    // be prepared to make this more robust, I think it is happening on multiple types of changes to focusedIndex
    if (focusedIndex === 0) {
      // Delay the height update slightly to ensure it captures the new state
      setTimeout(updateHeight, 10);
    }

    // document.addEventListener('click', handleClickOutside, true);
    window.addEventListener('keydown', handleToggleKeyDown);
    return () => {
      // document.removeEventListener('click', handleClickOutside, true);
      window.removeEventListener('keydown', handleToggleKeyDown);
    };
  }, [inputFocused, isOpen, leftMenuRef.current, listRef.current, focusedIndex]);

  const [actionInitiated, initiateAction] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState(''); // state variable for inputPlaceholder
  const [inputValue, setInputValue] = useState(''); // state variable for inputValue
  useEffect(() => {
    setInputValue(flowInputFieldValues[focusedIndex]); // Update inputValue when focusedIndex changes
  }, [focusedIndex]);

  // const [rightMenuHeight, setRightMenuHeight] = useState('0px');
  // useEffect(() => {
  //   if (rightMenuRef.current) {
  //     setRightMenuHeight(`${leftMenuRef.current.offsetHeight}px`);
  //   }
  // }, [rightMenuRef.current]);

  // const [loaded, setLoaded] = useState(false);
  // later a value to adjust to use to display list or display loading indicator gif
  const loaded = true;

  // USE FOR BACK-END HANDLING LATER
  // Regular function that calls the async function using .then()
  // const handleProcessOptions = () => {
  //   backend.llm_process_options()
  //     .then(result => {
  //       setData(result);
  //     })
  //     .catch(error => {
  //       console.error('Error processing options:', error);
  //     });
  // };

  // Use useEffect to call the function when the component mounts
  // useEffect(() => {
  //   handleProcessOptions();
  // }, []);

  // Add this line to extract the first 5 items and store their descriptions
  const items = data ? data.slice(0, 5).map(item => item.description) : [];

  // function to handle click on icon
  // toggles the isOpen state
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // listens for clicks outside of content elements to defocus Taskpuppy
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     const clickNotOnContentDiv = !contentRef.current.contains(event.target);
  //     const clickOnListDiv = listRef.current.contains(event.target);

  //     if (clickOnListDiv) {
  //       listRef.current.focus();
  //     } else if (clickNotOnContentDiv) {
  //       setIsOpen(false);
  //     }
  //   };

  //   document.addEventListener('click', handleClickOutside, true);

  //   return () => {
  //     document.removeEventListener('click', handleClickOutside, true);
  //   };
  // }, []);

  // function to handle keydown event
  const handleToggleKeyDown = (event) => {
    setInputPlaceholder(flowInputPlaceholders[focusedIndex]);
    // const isToggleCommand = event.key === 'Option' || event.key === 'Alt';
    const isFlowsCommand = event.altKey && event.code === 'Backquote';

    // if ⌘ + ~ key is pressed
    if (isFlowsCommand) {
      console.log('detected key combo')
      setIsOpen(prev => !prev);
    }

    if (event.key === 'Escape' && !inputFocused) {
      setIsOpen(false);
    }

    if (event.altKey && !isFlowsCommand) {
      console.log(flowInputFieldValues);
    }
  };

  // console.log(data);
  // function to handle keydown event on list, used for list toggle navigation and to listen for "Enter/Return" key to show input
  const handleListKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default arrow key behavior (scrolling)

      if (event.key === 'ArrowDown') {
        setFocusedIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % flowKeys.length;
          setInputPlaceholder(flowInputPlaceholders[newIndex]);
          return newIndex;
        });
      } else if (event.key === 'ArrowUp') {
        setFocusedIndex((prevIndex) => {
          const newIndex = (prevIndex - 1 + flowKeys.length) % flowKeys.length;
          setInputPlaceholder(flowInputPlaceholders[newIndex]);
          return newIndex;
        });
      }
    } else if (event.key === 'Enter' || event.key === 'Return') {
      console.log(focusedIndex);
      // console.log(data[focusedIndex]);
      if (flowTypes[focusedIndex] === 'direct') {
        initiateAction(true);
        // needs to execute the action directly
        executeFlowAction(flowActions[focusedIndex]);
      } else if (flowTypes[focusedIndex] === 'input') {
        // needs to activate input field, with the action being executed on handleInputDown's enter
        inputRef.current.focus();
        setInputFocused(true);
        event.preventDefault();
      }
      // SAVE for later when you pass in dynamic flow actions
      // if (data[focusedIndex].tag === "a" || data[focusedIndex].tag === "button") {
      //   backend.executeClickAction(data[focusedIndex]);
      // } else {
      //   setInputPlaceholder(mainInputPlaceholders[flowAction[listIndex]]);
      // }
    } else if (event.key >= '1' && event.key <= '5') { // DISABLE IF NOT USING # KEY SHORTCUTS
      // LOLOL this currently somehow works for event.metaKey and number combo for whatever reason


      // NOTE: this won't work out of box anymore because of refactoring o data into flowsConfig JSON
      // Handle keys 1, 2, 3, 4, and 5
      // event.preventDefault();
      // const listIndex = parseInt(event.key, 10) - 1; // Convert key to index (0-based)
      // if (listIndex >= 0 && listIndex < flowKeys.length) {
      //   setFocusedIndex(listIndex);
      //   setInputPlaceholder(flowInputPlaceholders[listIndex]);
      // }
      // if (listIndex >= 0 && listIndex < flows.length) {
      //   if (data[focusedIndex].tag === "a" || data[focusedIndex].tag === "button") {
      //     // backend.executeClickAction(data[focusedIndex]);
      //   } else {
      //     setFocusedIndex(listIndex);
      //     setInputPlaceholder(mainInputPlaceholders[flowAction[listIndex]]);
      //   }
      // }
    }
  };

  // function to handle keydown event on input, used for input navigation and to listen for "Enter/Return" key to execute action
  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === 'Return') {
      initiateAction(true);
      executeFlowAction(flowActions[focusedIndex]);
      // Execute action based on selected item

      // TODO HERE - Execute action based on selected item
      // setFocusedIndex((prevIndex) => {
      //   const newIndex = (prevIndex + 1) % flows.length;
      //   setInputPlaceholder(mainInputPlaceholders[flowAction[newIndex]]);
      //   return newIndex;
      // });
      // // listRef.current.focus();
      // console.log(flows[focusedIndex]);
      // console.log('Input value:', inputValue); // input value is logged into inputValue state variable, use as needed
      // backend.executeInputAction(data[focusedIndex], inputValue);
    // General escape keys to close input
    // relies on fact that when input is in focus, pressing any of these keys will usually mean that user wants to close it
      event.preventDefault();
    } else if (event.key === 'Escape') {
      listRef.current.focus()
    }
  };

  // Probably need to put this in its own .tsx file and pass in the action type as a property
  // Also will likely pass in input field value & then make that call on webpage somehow?
  // Do I also need to pass in the ref of the content div where it should then pass in those values?
  // If a particular URL has already been logged/retrieved, is it better to keep it rather than re-generating later on?
  // This also has to now make the menu item's 
  // probably need an actionExecuted array (ugh I need to take all these arrays and make a JSON) that has true or false
  // and if false for that index, pressing Enter on menu item focuses the right menu contents rather than the input field or executing the action again
  // also, if flowType is not direct, probably needs to be a way to handle new inputs (new search, new flow submission, etc)
  const executeFlowAction = (action) => {
    console.log(action);
    // some logic to do stuff depending on which action is passed in
  }

  return (
    <div ref={contentRef}>
      {/* Larger div for the icon and list */}
      <div
        style={{
          position: "fixed",
          right: '1%',
          bottom: '25%',
          backgroundColor: 'rgba(53, 53, 53, 0.6)',
          backdropFilter: "blur(10px)",
          borderRadius: '10px',
          padding: '0.5em 0.8em'
        }}
        >
        <div style = {{ display: 'flex', flexDirection: 'row', alignSelf: 'flex-end' }}>
          <img src={flowsFloatingPrompt} alt="Flows Activation Keys" className="activation-key" onClick={handleClick}/>
        </div>
      </div>
      {/* Flows Menu */}
      {flowsBranch && isOpen && (
        <div>
          {actionInitiated && (
            <div ref={rightMenuRef} style={{
              position: 'fixed',
              bottom: flowTypes[focusedIndex] === 'direct' ? '24vh' : '21vh', // REFACTOR BOTTOM UI BOX TO BE ANCHORED TO SLIGHTLY ABOVE BOTTOM OF TOP UI BOX
              left: actionInitiated ? '36%' : '46%',
              transform: 'translate(-12vw, 0)',
              backgroundColor: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: "blur(10px)",
              borderRadius: '20px',
              width: '48vw',
              maxHeight: '48vh', // REFACTOR BOTTOM UI BOX TO BE ANCHORED TO SLIGHTLY ABOVE BOTTOM OF TOP UI BOX
              minHeight: flowTypes[focusedIndex] === 'direct' ? '40vh' : '44vh', // REFACTOR BOTTOM UI BOX TO BE ANCHORED TO SLIGHTLY ABOVE BOTTOM OF TOP UI BOX
              height: rightMenuHeight,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white', // Assuming a light text color for contrast
              padding: '0'
            }}
            >
              <div style={{ position: 'fixed', display: 'flex', flexDirection: 'column', left: '61%', top: '6%', bottom: '6%', width: '35%'}}>
                <p style={{ position: 'relative', textAlign: 'left', fontSize: '0.6em', color: 'rgba(207, 207, 207, 1.0)'}}>Flowing FLowing Flowing FLowing Flowing '{flowActions[focusedIndex]}'</p>
              </div>
            </div>
          )}
          <div ref={leftMenuRef} style={{
            position: 'fixed',
            bottom: flowTypes[focusedIndex] === 'direct' ? '24vh' : '21vh', // REFACTOR BOTTOM UI BOX TO BE ANCHORED TO SLIGHTLY ABOVE BOTTOM OF TOP UI BOX
            left: actionInitiated ? '36%' : '46%',
            transform: 'translate(-12vw, 0)',
            backgroundColor: 'rgba(16, 16, 16, 0.95)',
            backdropFilter: "blur(10px)",
            borderRadius: '20px',
            width: '28vw',
            maxHeight: '48vh', // REFACTOR BOTTOM UI BOX TO BE ANCHORED TO SLIGHTLY ABOVE BOTTOM OF TOP UI BOX
            minHeight: flowTypes[focusedIndex] === 'direct' ? '40vh' : '44vh', // REFACTOR BOTTOM UI BOX TO BE ANCHORED TO SLIGHTLY ABOVE BOTTOM OF TOP UI BOX
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white', // Assuming a light text color for contrast
            padding: '0'
          }}
          >
            {/* Content inside the div can be added here */}
            <ul ref={listRef} tabIndex={-1} onKeyDown={handleListKeyDown}
              style={{
                backgroundColor: 'rgba(53, 53, 53, 0.95)',
                backdropFilter: "blur(10px)",
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                outline: 'none',
                margin: '0px',
                padding: '16px 0px',
                width: '100%',
                maxHeight: '30vh',
                minHeight: '20vh',
                overflow: 'hidden'
              }}>
              {flowActions.map((flow, index) => (
                <li
                key={index}
                tabIndex={0}
                style={{
                  backgroundColor: focusedIndex === index ? 'rgba(41, 41, 41)' : 'transparent',
                  boxShadow: focusedIndex === index ? '5px 5px 0px rgba(0,0,0)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '1.1em',
                  padding: '0.9em 1.2em',
                  fontFamily: 'PressStart2P',
                  color: 'white',
                  fontSize: '0.7em',
                  margin: '1% 6%',
                  outline: 'none',
                }}
                >
                  <img
                    src={focusedIndex === index ? activeIconImages[index] : inactiveIconImages[index]}
                    alt={`Icon for ${flow}`}
                    style={{ width: '12%', height: '22%', marginRight: '1em'}}
                  />
                  <p style={{ maxWidth: flowTypes[index] !== 'direct' ? '68%' : '86%' }}>{flowActions[index]}</p>
                  {focusedIndex === index && flowTypes[index] !== 'direct' && !inputFocused && (
                    <img
                      src={return_key}
                      alt="Return Key"
                      style={{ position: 'absolute', right: '8%', width: '16%', height: '12%'}}
                    />
                  )}
                </li>
              ))}
            </ul>
            <div className="textarea-container">
              {inputFocused && (
                <img
                  src={escape_key}
                  alt="Escape Key"
                  style={{
                    position: 'absolute',
                    bottom: '-20%',
                    left: '0%',
                    width: '10%',
                    height: '30%',
                    zIndex: 2,
                  }}
                />
              )}
              {/* the aforementioned "janky handling logic" */}
              {((inputFocused && flowTypes[focusedIndex] !== 'direct') || (flowTypes[focusedIndex] === 'direct')) && (
                  <img
                    src={return_key}
                    alt="Return Key"
                    style={{
                      position: 'absolute',
                      bottom: inputFocused ? '-20%' :'32%',
                      left: '80%',
                      width: '20%',
                      height: '36%',
                      zIndex: 2,
                    }}
                  />
              )}
              <textarea
                ref={inputRef}
                placeholder={inputPlaceholder}
                onKeyDown={handleInputKeyDown}
                className="custom-input"
                value={inputValue}
                style={{ top: '10%', width: flowTypes[focusedIndex] === 'direct' ? '80%' : '100%' }}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  flowInputFieldValues[focusedIndex] = e.target.value;
                }}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Content