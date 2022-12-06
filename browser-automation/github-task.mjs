// Unsubscribe from thread notifications

import puppeteer from 'puppeteer';

const reposXPath = filter => `/html//div[@data-filterable-for="repository-filter-field"]/a[${filter}]`;
const subscriptionCount = async page => (await page.$$('li.notification-thread-subscription')).length;

const unsubscribeButtonXPath = '/html//button[@type="submit" and contains(., "Unsubscribe")]';
const repoFilterSelector = ".notification-subscription-filters-repo";
const repoFilterFieldSelector = "#repository-filter-field";
const filteredReposXPath = reposXPath("not(@hidden)");
const repoFilter = "alphagov/"

const runTask = async () => {
    const wsChromeEndpointUrl = "ws://127.0.0.1:9222/devtools/browser/bf722ffb-424c-44a5-8f3b-5ed25936cf5f";
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointUrl,
    });

    const page = (await browser.pages())[0];
    await page.setViewport({ width: 1180, height: 950 });

    await Promise.all([
        page.goto("https://github.com/notifications/subscriptions", { waitUntil: 'networkidle0' }),
        page.waitForNavigation()
    ]);

    await Promise.all([
        page.click(repoFilterSelector),
        page.waitForSelector(repoFilterFieldSelector)
    ]);

    await Promise.all([
        page.type(repoFilterFieldSelector, repoFilter, { delay: 100 }),
        page.waitForXPath(reposXPath("@hidden"))
    ]);

    const repos = await Promise.all((await page.$x(filteredReposXPath)).map(async row => {
        const rowItem = await row.$("span.select-menu-item-text");
        return await rowItem.evaluate(element => element.textContent);
    }));

    await page.click(repoFilterSelector);
    console.log(`${repos.length} repos to clear`);

    for (const [index, repo] of repos.entries()) {
        console.log(`[${index + 1}/${repos.length}] Clearing ${repo}...`);
        const repoXPath = filteredReposXPath + `/span[.="${repo}"]`;

        await Promise.all([
            page.click(repoFilterSelector, { delay: 20 }),
            page.waitForSelector(repoFilterFieldSelector)
        ]);

        await Promise.all([
            page.type(repoFilterFieldSelector, repo, { delay: 30 }),
            page.waitForXPath(repoXPath),

            // page.waitForFunction(query => {
            //     return document.evaluate(`count(${query})`, document).numberValue == 1
            // }, {}, filteredReposXPath),
        ]);

        await Promise.all([
            // page.keyboard.press("Enter"),
            page.click('xpath' + repoXPath),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);

        await page.waitForXPath('//a[contains(., "Clear current filters")]');

        while (await subscriptionCount(page) > 0) {
            const checkAll = (await page.$x('//input[@type="checkbox" and @data-check-all]'))[0];

            await Promise.all([
                checkAll.click(),
                page.waitForXPath(unsubscribeButtonXPath)
            ]);

            await Promise.all([
                page.click('xpath' + unsubscribeButtonXPath),
                page.waitForNavigation({ waitUntil: 'networkidle0' })
            ]);
        }
    }

    await Promise.all([
        page.goto("https://github.com/notifications/subscriptions"),
        page.waitForNavigation({ waitUntil: 'networkidle0' })
    ])
};

await runTask();
process.exit();
