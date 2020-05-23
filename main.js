const contextMenuId = "temporary-container";
const tabIdToContextId = {};
const contextualIdentityColors = [
    "blue",
    "turquoise",
    "green",
    "yellow",
    "orange",
    "red",
    "pink",
    "purple",
    "toolbar"
];
const contextualIdentityIcons = [
    "fingerprint",
    "briefcase",
    "dollar",
    "cart",
    "circle",
    "gift",
    "vacation",
    "food",
    "fruit",
    "pet",
    "tree",
    "chill",
    "fence"
];

const id = browser.menus.create({
    id: contextMenuId,
    title: "Create temporary container",
    contexts: ["bookmark", "link"]
});

browser.menus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === contextMenuId && info.linkUrl) {
        browser.contextualIdentities.create({
            name: getRandomString(16),
            color: getRandomItemFromArray(contextualIdentityColors),
            icon: getRandomItemFromArray(contextualIdentityIcons)
        })
        .then((contextualIdentity) => {
            browser.tabs.create({
                cookieStoreId: contextualIdentity.cookieStoreId,
                url: info.linkUrl
            })
            .then((tab) => {
                tabIdToContextId[tab.id] = contextualIdentity.cookieStoreId;
            });
        })
    }
});

browser.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if (tabId && tabIdToContextId && tabIdToContextId[tabId]) {
        browser.contextualIdentities.remove(tabIdToContextId[tabId]);
        delete tabIdToContextId[tabId];
    }
});

function getRandomString(length) {
    let str = "";
    for (let i = 0; i < length; i++) {
        str += getRandomInt(10);
    }
    return str;
}

function getRandomItemFromArray(arr) {
    return arr[getRandomInt(arr.length)];
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
