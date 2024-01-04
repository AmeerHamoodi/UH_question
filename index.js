const puppeteer = require("puppeteer-extra");
const prompt = require("prompt-sync")({ sigint: true });
const faker = require("@faker-js/faker");

console.log("Welcome!");

const MEETS_REGEX = /^https:\/\/meet\.google\.com\/[a-z0-9-]{3}-[a-z0-9-]{4}-[a-z0-9-]{3}$/;

let meetingURL;
let numberOfAgents;

function askMeetingURL() {
    meetingURL = prompt("Please enter the meeting URL you'd like to join: ");
    if (!MEETS_REGEX.test(meetingURL)) {
        console.log("--------------------------------------------");
        console.log("Please enter a valid Google Meets URL");
        console.log("--------------------------------------------");
        askMeetingURL();
    }
}
askMeetingURL();

function askAgents() {
    numberOfAgents = prompt("Please enter the number of agents you'd like to join the call: ");
    if (isNaN(parseInt(numberOfAgents)) || numberOfAgents.includes(".")) {
        console.log("--------------------------------------------");
        console.log("The entered number of participants must be an integer");
        console.log("--------------------------------------------");
        return askAgents();
    }
    numberOfAgents = parseInt(numberOfAgents);
}
askAgents();

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox"] });

    for (let i = 0; i < numberOfAgents; i++) {
        const page = await browser.newPage();
        const ctx = await browser.defaultBrowserContext();
        await ctx.overridePermissions("https://meet.google.com", [
            "microphone",
            "camera",
            "notifications",
        ]);

        await page.goto(meetingURL);

        // wait for loader to disappear
        await page.waitForSelector("[jsName=OQ2Y6]", { hidden: true });

        // find name input element
        const element = await page.waitForSelector("[jsName=YPqjbf]");
        await element.focus();
        // hack to make sure that name is always entered
        await element.press("Backspace");
        await page.keyboard.type(faker.faker.person.fullName());

        // find button
        const button = await page.waitForSelector("[jsName=Qx7uuf]");
        await button.click();

        await element.dispose();
    }
})();
