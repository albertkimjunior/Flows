This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Backend Functions

* `llm_process_options`: takes `currentURL` and a string `elements` as arguments. This is the chief function powered by Groq. Returns JSON payload of LLM response
* `executeInputAction`: gets an HTML tag object `item` and `inputVal`. This is the very simple "input some text then submit" flow
* `executeClickAction`: enables clicking
* `findElement`: finds that element based on tag and list of selectors (e.g. 'id')
* `getFilteredElementsAsCSV`: the function for processing the list of filtered elements to extract necessary selectors
* `getInteractableElements`: the function that gets a list of items that meet the filters, which are input, button, and textarea at the moment.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!
