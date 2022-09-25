/**
 * This template is a production ready boilerplate for developing with `PlaywrightCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */
console.time("logtime");
// For more information, see https://sdk.apify.com
import { Actor } from "apify";
// For more information, see https://crawlee.dev
import { Dataset, KeyValueStore, PlaywrightCrawler } from "crawlee";
import { router } from "./routes.js";
import { sheetData, tabs } from "./selector.js";
// Initialize the Apify SDK
await Actor.init();
let tabData = tabs;

const startUrls = [
    {
        url: "https://www.worldometers.info/",
        label: "worldometers",
    },
    {
        url: "https://www.theworldcounts.com/challenges/toxic-exposures/use-of-chemicals",
        label: "chemicals",
    },
    {
        url: "https://www.theworldcounts.com/challenges/climate-change/global-warming",
        label: "global_warming",
    },
    {
        url: "https://www.theworldcounts.com/challenges/climate-change/energy",
        label: "energy",
    },
    {
        url: "https://www.theworldcounts.com/challenges/planet-earth/waste",
        label: "waste",
    },
    {
        url: "https://www.theworldcounts.com/challenges/planet-earth/forests-and-deserts",
        label: "forests",
    },
    {
        url: "https://www.theworldcounts.com/challenges/planet-earth/oceans",
        label: "oceans",
    },
    {
        url: "https://www.theworldcounts.com/challenges/planet-earth/air",
        label: "air",
    },
    {
        url: "https://www.theworldcounts.com/challenges/planet-earth/mining",
        label: "mining",
    },
    {
        url: "https://www.theworldcounts.com/challenges/planet-earth/freshwater",
        label: "freshwater",
    },
    {
        url: "https://www.theworldcounts.com/challenges/planet-earth/state-of-the-planet",
        label: "planet",
    },
    { url: "https://www.theworldcounts.com/challenges", label: "challenges" },
    {
        url: "https://www.theworldcounts.com/challenges/consumption/foods-and-beverages",
        label: "foods",
    },
    {
        url: "https://www.theworldcounts.com/challenges/consumption/clothing",
        label: "clothing",
    },
    {
        url: "https://www.theworldcounts.com/challenges/consumption/other-products",
        label: "other",
    },
    {
        url: "https://www.theworldcounts.com/challenges/people-and-poverty",
        label: "people",
    },
];

// const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new PlaywrightCrawler({
    // proxyConfiguration,
    requestHandler: router,
    minConcurrency: 3,
    maxConcurrency: 10,
    // headless: false,
    preNavigationHooks: [
        async ({ page }) => {
            page.route("**/*.{png,jpg,jpeg}", (route) => {
                route.abort();
            });
        },
    ],
});

await crawler.run(startUrls);
let x = await Promise.all(
    startUrls.map((s) => {
        return KeyValueStore.getValue(s.label);
    })
);
let data = { yearData: {}, monthData: {}, weekData: {}, todayData: {} };
x?.forEach((y) => {
    Object.keys(data)?.forEach((d) => {
        Object.keys(y?.[d])?.forEach((t) => {
            data[d][t] = y[d][t];
        });
    });
});
await KeyValueStore.setValue("finalData", x);

let title = [
    "Sub-Category",
    "In 2022",
    "This month",
    "This week",
    "Today",
    "link",
];

Object.keys(tabData).forEach((key) => {
    let sheetTab = sheetData.filter((s) => s.tab == key);
    let SendData = [];
    SendData.push(title);
    sheetTab.forEach((s) => {
        SendData.push([
            s.value,
            data.yearData[s.selector] ? data.yearData[s.selector] : "",
            data.monthData[s.selector] ? data.monthData[s.selector] : "",
            data.weekData[s.selector] ? data.weekData[s.selector] : "",
            data.todayData[s.selector] ? data.todayData[s.selector] : "",
            startUrls.find((url) => url.label == s.Label).url,
        ]);
    });
    console.log(key);
    tabData[key]["data"] = SendData;
    tabData[key]["id"] = sheetTab[0].id;
});
await KeyValueStore.setValue("tabData", tabData);
// const time = new Date();
// let data = { time };
// x.forEach((y) => {
//     data = { ...data, ...y };
// });
let array = Object.keys(tabData);
for (let index = 0; index < array.length; index++) {
    const key = array[index];
    await Actor.call(process.env.APIFY_USER_ID + "/login", {
        createBackup: false,
        deduplicateByEquality: false,
        keepSheetColumnOrder: true,
        columnsOrder: title,
        mode: "replace",
        publicSpreadsheet: false,
        range: key,
        rawData: tabData[key]["data"],
        spreadsheetId: tabData[key]["id"],
        transformFunction:
            '// Uncomment this code only if you don\'t use "Deduplicate by field" or "Deduplicate by equality"\n// This code behaves as if there was no transform function\n/*({ spreadsheetData, datasetData }) => {\n    return spreadsheetData.concat(datasetData);\n}*/',
    });
}
await Dataset.pushData(data);
// await Actor.call("glaring_santoor/login", {
//     createBackup: false,
//     deduplicateByEquality: false,
//     keepSheetColumnOrder: false,
//     mode: "append",
//     publicSpreadsheet: false,
//     range: "results!A1",
//     rawData: data,
//     spreadsheetId: "1N3LpoB77GiHiuQtl_8olNs0TOGtEGCWoUSangCGtTRw",
//     transformFunction:
//         '// Uncomment this code only if you don\'t use "Deduplicate by field" or "Deduplicate by equality"\n// This code behaves as if there was no transform function\n/*({ spreadsheetData, datasetData }) => {\n    return spreadsheetData.concat(datasetData);\n}*/',
// });
// Exit successfully
await Actor.exit();
console.timeEnd("logtime");
