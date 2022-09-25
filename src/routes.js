import { KeyValueStore, Dataset, createPlaywrightRouter } from "crawlee";
import { selector } from "./selector.js";
export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ request, page, log }) => {
    const title = await page.title();
    log.info(`${title}`, { url: request.loadedUrl });
    await page.waitForTimeout(1500);
    const yearData = await getYourData(page, selector[request.label], "in");
    const monthData = await getYourData(page, selector[request.label], "month");
    const weekData = await getYourData(page, selector[request.label], "week");
    const todayData = await getYourData(page, selector[request.label], "today");
    const data = { yearData, monthData, weekData, todayData };
    // console.log(data);
    // const storeData = await KeyValueStore.getValue("data");
    // storeData
    //     ? await KeyValueStore.setValue("data", { ...data, ...storeData })
    //     : await KeyValueStore.setValue("data", { ...data });
    await KeyValueStore.setValue(request.label, { ...data });
    // await Dataset.pushData(data);
});

const getYourData = async (page, selectors, time) => {
    await page.evaluate(() => {
        document.querySelectorAll(".counter-main")?.forEach(($this) => {
            $this.setAttribute(
                "data-content",
                $this.innerHTML.toLowerCase().replaceAll(" ", "_")
            );
        });
        document
            .querySelectorAll(".counter-option-button")
            ?.forEach(($this) => {
                $this.setAttribute(
                    "data-content",
                    $this.innerHTML.toLowerCase().replaceAll(" ", "_")
                );
            });
    });
    await page.evaluate((time) => {
        document
            .querySelectorAll("button[data-content*='" + time + "']")
            ?.forEach(($this) => {
                $this?.click();
            });
    }, time);
    await page.waitForTimeout(1500);
    return await page.evaluate((selectors) => {
        let data = {};
        Object.keys(selectors).forEach((key) => {
            data[key] = document
                .querySelector(selectors[key])
                ?.innerText?.replaceAll(",", "");
        });
        return data;
    }, selectors);
};
