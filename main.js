const contextMenuLinkId = "temporary-container-link";
const contextMenuTabId = "temporary-container-tab";
const contextualIdentityNameLength = 16;

const tabIdToContextId = new Map();
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

browser.menus.create({
    id: contextMenuLinkId,
    title: "Create temporary container",
    contexts: ["bookmark", "link"]
});

browser.menus.create({
    id: contextMenuTabId,
    title: "Reopen in new temporary container",
    contexts: ["tab"]
});

browser.menus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === contextMenuLinkId && info.linkUrl) {
        // create a new temporary container for the selected link
        browser.contextualIdentities.create({
            name: getRandomString(contextualIdentityNameLength),
            color: getRandomItemFromArray(contextualIdentityColors),
            icon: getRandomItemFromArray(contextualIdentityIcons)
        })
        .then((contextualIdentity) => {
            // now create a tab for that link
            browser.tabs.create({
                cookieStoreId: contextualIdentity.cookieStoreId,
                url: info.linkUrl
            })
            .then((tab) => {
                // then store it in our map
                tabIdToContextId.set(tab.id, contextualIdentity.cookieStoreId);
            });
        })
    } else if (info.menuItemId === contextMenuTabId && info.pageUrl) {
        // create a new temporary container for the selected tab
        browser.contextualIdentities.create({
            name: getRandomString(contextualIdentityNameLength),
            color: getRandomItemFromArray(contextualIdentityColors),
            icon: getRandomItemFromArray(contextualIdentityIcons)
        })
        .then((contextualIdentity) => {
            // now create a new tab for that tab
            browser.tabs.create({
                cookieStoreId: contextualIdentity.cookieStoreId,
                url: info.pageUrl
            })
            .then((newTab) => {
                // then store it in our map and remove the old tab
                tabIdToContextId.set(newTab.id, contextualIdentity.cookieStoreId);
                browser.tabs.remove(tab.id);
            });
        })
    }
});

browser.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if (tabId && tabIdToContextId && tabIdToContextId.has(tabId)) {
        browser.contextualIdentities.remove(tabIdToContextId.get(tabId));
        tabIdToContextId.delete(tabId);
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

function checkForOrphanedContextualIdentities() {
    Promise.all([browser.contextualIdentities.query({}),
        browser.tabs.query({})])
    .then((values) => {
        const identities = values[0];
        const tabs = values[1];

        identities.filter((identity) => {
            // filter down to identities we probably created, meaning it's the right length and all numbers
            let allCharsAreNumber = true;
            for (const c of identity.name) {
                if (Number.isNaN(Number.parseInt(c))) {
                    allCharsAreNumber = false;
                }
            }
            return identity.name.length == contextualIdentityNameLength && allCharsAreNumber;
        })
        .forEach((identity) => {
            // now if that identity is not in use by a currently open tab delete it
            let identityInUse = false;
            tabs.forEach((tab) => {
                if (tab.cookieStoreId == identity.cookieStoreId) {
                    identityInUse = true;
                }
            });

            if (!identityInUse) {
                browser.contextualIdentities.remove(identity.cookieStoreId);
            }
        });
    });
}

checkForOrphanedContextualIdentities();
