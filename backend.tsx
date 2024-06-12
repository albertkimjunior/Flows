import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true
})

async function llm_process_options(currentURL, elements) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Given the current URL: ${currentURL}\n\nFrom the following comma-separated list of HTML elements, identify the top 15 essential tags for user interaction ordered by descending likelihood that the user would interact with that element. Exclude advertising tags and inputs that redirect to the current URL. For each essential tag, create a one-line JSON object with:\n\n* The tag name.\n* All attributes from the input (e.g., href, aria-label, etc.). If an attribute is null or empty, return as empty string.\n* A brief description of the tag's function. Only include elements with confidently determined functions.\n\nAdapt the output based on the webpage type. For example:\n* E-commerce: product search fields, sort/product filters, add-to-cart buttons.\n* Travel booking: destination search fields, sort/date filters, booking buttons.\n* Informational: search fields, table of contents links, citation links.\n* Professional networking: job search fields, sort/connection buttons, profile edit buttons.\n* Software development: repository search fields, sort/commit buttons, issue creation buttons.\n\nOrder of Importance:\n1. Search field\n2. Sort and filter buttons/inputs\n3. Other important input fields\n4. Log-in/log-out buttons\n5. Miscellaneous important elements\n\nExclusions:\n* Any duplicate entries\n* Advertising links and inputs\n* Links that redirect to the current URL\n\nOutput the JSON objects as a one-line array, enclosed in square brackets. Do not output any other explanatory text.`
      },
      {
        role: "user",
        content: `${elements}`
      }
    ],
    model: "llama3-70b-8192",
    temperature: 0,
    max_tokens: 1024,
    top_p: 1,
    stream: false,
    stop: null
  })

  console.log(chatCompletion.choices[0].message.content)
  const json_output =
    chatCompletion.choices[0].message.content.match(/\[([^\]]+)\]/g)
  console.log(json_output)
  return JSON.parse(json_output[0])
}

function getInteractableElements() {
  // Define the selectors for interactable elements
  const selectors = [
    "input",
    "button",
    "textarea"
    // 'a[href]'
  ]

  // Use querySelectorAll to find all matching elements
  const elements = document.querySelectorAll(selectors.join(","))

  // Convert NodeList to an array for easier manipulation
  const interactableElements = Array.from(elements)

  // Filter out elements based on specific criteria if needed
  // For example, filter out hidden elements
  const visibleElements = interactableElements.filter(
    (el) => el.offsetParent !== null
  )

  return visibleElements
}

function getFilteredElementsAsCSV() {
  const elements = getInteractableElements()
  return elements
    .map((el) => {
      let tag = ""
      if (el.tagName.toLowerCase() === "a") {
        tag = `a href="${el.href}"`
      } else if (el.tagName.toLowerCase() === "button") {
        tag = "button"
        // if (el.type)        tag += ` type=${el.type}`;
        // console.log(tag);
      } else if (el.tagName.toLowerCase() === "input") {
        tag = "input"
        // if (el.type)        tag += ` type=${el.type}`;
        if (el.name) tag += ` name="${el.name}"`
        if (el.role) tag += ` role="${el.role}"`
      } else if (el.tagName.toLowerCase() === "textarea") {
        tag = "textarea"
        if (el.maxLength) tag += ` maxLength="${el.maxLength}"`
      }
      if (el.text) tag += ` text="${el.text}"`
      if (el.ariaLabel) tag += ` aria-label="${el.ariaLabel}"`
      if (el.placeholder) tag += ` placeholder="${el.placeholder}"`

      if (tag !== el.tagName.toLowerCase()) return tag
    })
    .join(",")
}

const findElement = (item) => {
  const { tag, attributes } = item
  const selector = Object.entries(attributes)
    .filter(([key, value]) => value !== "")
    .map(([key, value]) => `[${key}="${value}"]`)
    .join("")
  console.log(`${tag}${selector}`)
  return document.querySelector(`${tag}${selector}`)
}

// Add this function to handle actions based on the tag type
const executeClickAction = (item) => {
  const element = findElement(item)
  if (element) {
    if (item.tag === "a" || item.tag === "button") {
      // Simulate a click action
      element.click()
      console.log(`Simulated click on ${item.description}`)
    }
  } else {
    console.error(`Element not found for ${item.description}`)
  }
}

// Add this function to handle actions based on the tag type
const executeInputAction = (item, inputVal) => {
  const element = findElement(item)
  console.log(element)
  if (element) {
    if (item.tag === "input" || item.tag === "textarea") {
      element.value = inputVal

      // Dispatch input and change events to ensure the value is recognized
      const inputEvent = new Event(item.tag, { bubbles: true })
      const changeEvent = new Event("change", { bubbles: true })
      element.dispatchEvent(inputEvent)
      element.dispatchEvent(changeEvent)

      // // Check for jsaction or similar script
      // if (element.hasAttribute('jsaction')) {
      //   // Simulate the event that jsaction is listening for
      //   const jsActionEvent = new Event('input', { bubbles: true });
      //   element.dispatchEvent(jsActionEvent);

      //   // Optionally, simulate pressing the Enter key if needed
      //   const enterEvent = new KeyboardEvent('keydown', {
      //     key: 'Enter',
      //     code: 'Enter',
      //     keyCode: 13,
      //     which: 13,
      //     bubbles: true,
      //     cancelable: true
      //   });
      //   element.dispatchEvent(enterEvent);
      // }
      // Find the form element
      let form = element.closest("form")

      // Check if the element has a form attribute
      if (!form && element.form) {
        form = element.form
      }

      if (form) {
        // Try to find a submit button
        const submitButton = form.querySelector(
          'button[type="submit"], input[type="submit"]'
        )
        if (submitButton) {
          // Click the submit button if found
          submitButton.click()
        } else {
          // If no submit button is found, directly submit the form
          form.submit()
        }
      } else {
        console.error("Form element not found")
      }
    }
  } else {
    console.error(`Element not found for ${item.description}`)
  }
}

export default {
    llm_process_options,
    getInteractableElements,
    getFilteredElementsAsCSV,
    findElement,
    executeClickAction,
    executeInputAction,
}