// Delete configured projects from a target

import puppeteer from 'puppeteer';
import path from 'path';

const asyncFilter = async (array, predicate) =>
    Promise.all(array.map(predicate)).then(results => array.filter((_, index) => results[index]));

const runTask = async () => {
    const wsChromeEndpointUrl = "ws://127.0.0.1:9222/devtools/browser/dcd23f4e-17ef-43be-adce-ab68bd3cb6ce";
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointUrl,
    });

    const page = (await browser.pages())[0];
    await page.setViewport({ width: 1450, height: 950 });

    await Promise.all([
        page.goto("https://app.snyk.io/org/uktrade/projects", { waitUntil: 'networkidle0' }),
        page.waitForNavigation()
    ]);

    const frame = await (await page.$x('//iframe[@title="Page content"]'))[0].contentFrame();
    const searchBox = await frame.$('#sidebar-search-filter');

    await Promise.all([
        searchBox.type("tech-team", { delay: 100 }),
        frame.waitForSelector('xpath/html//div[contains(@data-snyk-test, "di-tech-team")]')
    ]);

    const projectGroup = (await frame.$$('.vue--project-groups > .vue--project-group'))[0];

    await Promise.all([
        projectGroup.click(),
        frame.waitForSelector('.vue--project-group-item')
    ]);

    const projectGroupItems = await projectGroup.$$('.vue--project-group-item');

    const projectTargets = await Promise.all(projectGroupItems.map(async item => {
        const link = await item.$('.vue--project-group-item__container > header > a');
        const name = await link.evaluate(element => element.getAttribute("data-snyk-test"));
        const url = await link.evaluate(element => element.href);

        return {
            name: name,
            settingsUrl: new URL(path.join(url, "settings")).href
        }
    }));

    if (projectTargets.length === 0) {
        console.log("All projects deleted");
        return;
    }

    console.log(`${projectTargets.length} projects to delete`);

    const deactivateButtonSelector = 'xpath/html//div[@id="deactivate"]//button[contains(., "Deactivate project")]';
    const deleteButtonSelector = 'xpath/html//div[@id="delete-project"]//button[contains(., "Delete project")]';

    page.on('dialog', async dialog => {
        await dialog.accept();
    });

    for (const [index, projectTarget] of projectTargets.entries()) {
        console.log(`[${index + 1}/${projectTargets.length}] Deleting ${projectTarget.name}...`);

        await Promise.all([
            page.goto(projectTarget.settingsUrl, { waitUntil: 'networkidle0' }),
            page.waitForNavigation(),
        ]);

        let frame = await (await page.$x('//iframe[@title="Page content"]'))[0].contentFrame();
        const deactivateButton = await frame.$(deactivateButtonSelector);

        if (deactivateButton) {
            await Promise.all([
                frame.click(deactivateButtonSelector),
                page.waitForNavigation({ waitUntil: 'networkidle0' })
            ]);

            await Promise.all([
                page.goto(projectTarget.settingsUrl, { waitUntil: 'networkidle0' }),
                page.waitForNavigation(),
            ]);

            frame = await (await page.$x('//iframe[@title="Page content"]'))[0].contentFrame();
        }

        const deleteButton = await frame.$(deleteButtonSelector);

        if (deleteButton) {
            await Promise.all([
                frame.click(deleteButtonSelector),
                page.waitForNavigation({ waitUntil: 'networkidle0' })
            ]);
        }
    };
};

await runTask();
process.exit();
