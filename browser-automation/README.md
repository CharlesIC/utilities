# Browswer automation

Simple base project showing Chrome automation with Puppeteer

```shell
npm install

npm run task
```

Check the `puppeteer-us-keyboard-layout.ts` file for reference to all key definitions.

e.g.
`await page.keyboard.press("ArrowLeft");` where the string is a definition (the first column in the .ts file)

### Connect to a running Chrome instance

The instance URL changes each time the command is run

```shell
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')
```
