const betOperations = document.getElementById("bet-operations");
const claimBet = document.getElementById("claim-bet");
const errorElements = document.getElementsByClassName("error");
const placeBetInputs = document.getElementById("place-bet-inputs");
const placeBet = document.getElementById("place-bet");
const scheduleDate = document.getElementById("schedule-date");
const deadlineDate = document.getElementById("deadline-date");
const betId = document.getElementById("create-bet-id");
const createBetUrl = document.getElementById("create-bet-url");
const placeBetResult = document.getElementById("place-bet-result");
const placeBetAmount = document.getElementById("place-bet-amount");
const createBetAmount = document.getElementById("create-bet-amount");
const createBetAmountLabel = document.getElementById("create-bet-amount-label");
const createBetSchema = document.getElementById("create-bet-schema");
const createBetWolfram = document.getElementById("create-bet-wa");
const createBetPath = document.getElementById("create-bet-path");
const betEntries = document.getElementById("bet-entries");
const betPool = document.getElementById("bet-pool");
const searchBetId = document.getElementById("search-bet");
const poolName = document.getElementById("pool-name");
const poolAmount = document.getElementById("pool-amount");
const betsAmount = document.getElementById("bets-amount");
const end = document.getElementById("end");
const message = document.getElementById("message");
const betContainer = document.getElementById("bet-container");
const intro = document.getElementById("intro");
const createBetMinimum = document.getElementById("create-bet-minimum");
const betCarousel = document.getElementById("bet-carousel");
const placeSingleBet = document.getElementById("place-single-bet");

const createBetDescription = document.getElementById("create-bet-description");
const createBetInitialPool = document.getElementById("create-bet-initial-pool");
const createBetCommission = document.getElementById("create-bet-commission");
const createBetHelp = document.getElementById("create-bet-help");
const createBetInfo = document.getElementById("create-bet-info");

const placeBetInfo = document.getElementById("place-bet-info");
const placeBetEntries = document.getElementById("place-bet-entries");
const betDescription = document.getElementById("bet-description");
const betInnerDescription = document.getElementById("bet-inner-description");
const betUrl = document.getElementById("bet-url");
const betDeadline = document.getElementById("bet-deadline");
const betSchedule = document.getElementById("bet-schedule");
const betInfo = document.getElementById("bet-info");
const urlSchema = document.getElementById("bet-schema");
const schemaPath = document.getElementById("bet-path");
const defaultMessageLocation = document.getElementById("default-message-location");
const createBetQueryResult = document.getElementById("create-bet-query-result");
const createBetQuery = document.getElementById("create-bet-query");
const createBetPathLabel = document.getElementById("create-bet-path-label");
const createBetQueryInner = document.getElementById("create-bet-query-inner");
const innerMessage = document.getElementById("inner-message");
const closeMessage = document.getElementById("close-message");
const queryTesterUrl = document.getElementById("query-tester-url");
const queryTesterResult = document.getElementById("query-tester-result");
const newBet = document.getElementById("new-bet");

const urlBet = document.getElementById("url-bet");
const wolframBet = document.getElementById("wolfram-bet");
const betInnerInitialPool = document.getElementById("bet-initial-pool");
const betInnerCommission = document.getElementById("bet-commission");
const betInnerMinimum = document.getElementById("bet-minimum");
const betTotalPool = document.getElementById("bet-total-pool");
const betInnerTotalPool = document.getElementById("bet-total-pool");
const betResult = document.getElementById("bet-result");
const betQuery = document.getElementById("bet-query");
const betWolframQuery = document.getElementById("bet-wolfram-query");
const betInnerResult = document.getElementById("bet-inner-result");

const closeNewBet = () => {
    newBet.hideBet = newBet.style.display = 'none';
    betContainer.style.display = newBet.hideBet ? 'none' : 'flex';
}

let minimumBet = null;
let fixedCommission = null;

let currentStep = 0;
const steps = Array.from(document.getElementsByClassName("create-bet-step"));

const createBetBtn = async () => {
    newBet.hideBet = betContainer.style.display == 'none';
    betContainer.style.display = 'none';
    newBet.style.display = 'flex';
    newBet.scrollIntoViewIfNeeded();
    createBetSchema.selectedIndex = 0;
    [betContainer.style.display, newBet.style.display] = ['none', 'flex'];
    steps[currentStep].style.position = "initial";
    steps[currentStep].style.opacity = "100%";
    const prices = (await Promise.all(["URL", "WolframAlpha"].map(t => contract.lastQueryPrice(t)))).map(weiToEth).map(price => price.toString());
    (async () => {
        createBetAmountLabel.innerHTML = `The <a href="https://provable.xyz">oracle service</a> that WSBDD uses to interact with the web needs to be paid for by the bet's creator.` + (contract
            ? ` The suggested amount is ${Math.max(prices[0], prices[1])} ETH.`
            : ``);
    })();
}

const renderCreationStep = (idx) => {
    steps[currentStep].style.opacity = "0";
    steps[currentStep].style.visibility = "hidden";
    const p = steps[currentStep];
    setTimeout(() => { p.style.position = "absolute" }, 200);
    currentStep = idx;
    steps[currentStep].style.visibility = "visible";
    steps[currentStep].style.position = "initial";
    steps[currentStep].style.opacity = "100%";
}

const renderPreviousCreationStep = () => {
    renderCreationStep(currentStep == 0 ? steps.length - 1 : currentStep - 1);
}

const renderNextCreationStep = () => {
    renderCreationStep((currentStep + 1) % steps.length);
}

searchBetId.onkeydown = searchTriggered;
let activeBet = null;
let placedBets = {};
let newBetId = null;
let processing = null;

function searchTriggered(e) {
    if (e.keyCode === 13) {
        searchBet();
    }
}

let provider, contractAddress, signer, contract, signedContract, owner;
let providerLoaded = false;


function hideMessage(delay) {
    clearInterval(processing);
    message.style.visibility = "hidden";
    message.style.opacity = "0";
}

function triggerMessage(msg, add, remove, after = defaultMessageLocation, click, showClose = true) {
    clearInterval(processing);
    message.remove();
    after.append(message);
    message.onmouseover = undefined;
    message.onclick = undefined;
    message.ontouchstart = undefined;
    message.classList.add(add);
    remove.forEach((r) => message.classList.remove(r));
    closeMessage.style.display = showClose ? "block" : "none";
    message.style.cursor = "default";
    message.style.display = "flex";
    message.style.visibility = "visible";
    message.style.opacity = "100%";
    innerMessage.style.cursor = click ? "pointer" : "default";
    innerMessage.onclick = click;
    innerMessage.innerHTML = msg;
    message.scrollIntoViewIfNeeded();
}

function triggerError(msg, after, click) {
    triggerMessage(msg, "error", ["info", "success"], after, click);
}

function triggerSuccess(msg, callback, after) {
    triggerMessage(msg, "success", ["info", "error"], after);
    if (callback) {
        setTimeout(callback, 5000);
    }
}

function triggerProcessing(msg, after) {
    triggerMessage(msg, "info", ["error", "success"], after, null, false);
    let i = 0;
    processing = setInterval(() => (innerMessage.innerHTML = msg + ".".repeat(i++ % 4)), 300);
}

async function showBetInfo() {
    betInfo.style.display='flex';
    
}


async function loadProvider() {
    try {
        if (providerLoaded) return true;

        if (window.ethereum) {
            await window.ethereum.request({ method: "eth_requestAccounts" });
        } else {
            clearTimeout(hideMessage());
            triggerError("No Ethereum provider detected, click to install MetaMask", undefined, () => window.location.href = "https://metamask.io/");
            providerLoaded = false;
            return false;
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        contractAddress = "0xDD7e4B8e0D34807dbc1062bd5576e73aDe17ba8B";
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractAbi, provider);
        signedContract = contract.connect(signer);
        if (contract) {
            owner = await signer.getAddress();
            contract.on("LackingFunds", async (sender, funds) => { if (sender == owner) triggerError(`Insufficient query funds, requiring ${weiToEth(funds)} ETH`) });
            contract.on("CreatedBet", async hashedBetId => { if (hashedBetId.hash == ethers.utils.id(newBetId || "")) triggerSuccess(`Bet created!`, () => { searchBet(newBetId); newBetId = null; }) });
            contract.on("PlacedBets", async (sender, _, betId) => { if (sender == owner) triggerSuccess(`Bet placed!`, () => renderBetPool()) });
            contract.on("LostBet", async (sender) => { if (sender == owner) triggerSuccess("Bet lost, better luck next time!") });
            contract.on("UnwonBet", async (sender) => { if (sender == owner) triggerSuccess("No one won the bet, you've been refunded") });
            contract.on("WonBet", async (sender, amount) => { if (sender == owner) triggerSuccess(`Bet won! ${weiToEth(amount.toString())} ETH transferred to account`) });
            minimumBet = weiToEth(await contract.minimumBet());
            fixedCommission = weiToEth(await contract.fixedCommission());
        }
        providerLoaded = true;
        return true;
    } catch (error) {
        triggerError("Error while loading Ethereum provider: " + (error.code || error));
        providerLoaded = false;
        return false;
    }
}

loadProvider();

const ethToWei = (eth) => ethers.utils.parseEther(eth);
const weiToEth = (wei) => (wei / Math.pow(10, 18)).toString();

const createBetAmountTitle = `Provable's oracle service used by WSBDD needs to be paid for by the bet's creator.`;
createBetAmountLabel.title = createBetAmountTitle;

window.onload = () => {
    const betId = new URL(window.location).searchParams.get("id");
    if (betId) {
        searchBet(betId.toLowerCase().trim());
    }
}

function commissionChanged() {
    createBetCommission.value = Number.parseFloat((100 / Math.round(100 / createBetCommission.value)).toFixed(10));
}

async function resetButtons() {
    placeBetInputs.style.display = "none";
    [claimBet, placeBet, betPool].forEach((elm) => {
        elm.style.opacity = 0;
        elm.style.visibility = "hidden";
    });
}

function renderPlaceSingleBet() {
    const filledBet = (placeBetResult.value && placeBetAmount.value);
    placeSingleBet.onclick = filledBet ? () => { addSingleBet(); renderPlaceSingleBet(); } : "";
    placeSingleBet.style.cursor = filledBet ? "pointer" : "default";
    placeSingleBet.style.opacity = filledBet ? "1" : "0";
}

async function renderClaimBet() {
    const addr = await signer.getAddress();
    if ((await contract.userPools(activeBet, addr)) == 0 || !(await contract.finishedBets(activeBet))) {
        claimBet.style.display = "none";
        claimBet.style.visibility = "hidden";
        claimBet.style.opacity = "0";
    } else {
        claimBet.style.display = "block";
        claimBet.style.visibility = "visible";
        claimBet.style.opacity = "100%";
        const claimedBet = await contract.claimedBets(activeBet, addr);
        claimBet.innerHTML = claimedBet ? "Claimed" : "Claim";
        claimBet.disabled = claimedBet;
    }
}

async function renderPlaceBet() {
    const betFinished = await contract.finishedBets(activeBet);
    const deadlineReached = (await contract.betDeadlines(activeBet)) <= Math.round(new Date().getTime() / 1000);
    const bettingDisabled = betFinished || deadlineReached;

    placeBet.style.visibility = "visible";
    placeBet.style.opacity = "100%";

    placeBetInputs.style.display = bettingDisabled ? "none" : "flex";
    placeBetInputs.style.opacity = bettingDisabled ? 0 : "100%";
    placeBetInputs.style.visibility = bettingDisabled ? "hidden" : "visible";
    placeBetAmount.placeholder = `${weiToEth(await contract.betMinimums(activeBet))} minimum`;
    placeBet.innerHTML = bettingDisabled ? (betFinished ? "Finished" : "Deadline Reached") : "Place Bet";
    placeSingleBet.style.display = bettingDisabled ? "none" : "block";
    placeBet.disabled = bettingDisabled;
}

async function searchBet(id) {
    try {
        if (!(await loadProvider())) return;
        placedBets = {};
        newBet.style.display = "none";
        resetButtons();
        triggerProcessing("Fetching bet");
        betContainer.style.opacity = "0";
        betContainer.style.visibility = "hidden";
        activeBet = id || searchBetId.value;
        searchBetId.value = activeBet;
        const betExists = await contract.createdBets(activeBet);
        if (!betExists) {
            betContainer.style.display = "none";
            triggerError("Invalid Bet ID");
            return;
        }
        const location = new URL(window.location.toString());
        location.searchParams.set("id", activeBet);
        history.pushState({}, "", location.toString());
        betContainer.style.display = "flex";
        const createdFilter = (await contract.queryFilter(contract.filters.CreatedBet(activeBet)))[0];
        const [initialPool, description, query] = createdFilter.args.slice(1).map(arg => arg.toString());
        const { url, schema, path } = unpackQuery(query);

        wolframBet.style.display = schema ? "none" : "flex";
        urlBet.style.display = schema ? "flex" : "none";
        (schema ? betQuery : betWolframQuery).innerHTML = query;
        urlSchema.innerHTML = schema || "Unknown";
        betUrl.innerHTML = url || query;
        schemaPath.innerHTML = path || "Unknown";
        const deadline = new Date(await contract.betDeadlines(activeBet) * 1000);
        betDeadline.innerHTML = deadline.toISOString().replace("T", " ").split(".")[0].slice(0, -3);
        const schedule = new Date(await contract.betSchedules(activeBet) * 1000);
        betSchedule.innerHTML = schedule.toISOString().replace("T", " ").split(".")[0].slice(0, -3);
        const result = await contract.betResults(activeBet);
        betInnerDescription.innerHTML = description;
        betInnerInitialPool.innerHTML = weiToEth(initialPool).toString() + "Ð";
        betInnerTotalPool.innerHTML = weiToEth((await contract.betPools(activeBet)).toString()).toString() + "Ð";
        betInnerCommission.innerHTML = Number.parseFloat((100 / (await contract.betCommissions(activeBet))).toFixed(5)) + "%";
        betInnerMinimum.innerHTML = weiToEth(await contract.betMinimums(activeBet)) + "Ð";
        betDescription.style.display = description ? "flex" : "none";
        betResult.style.display = result ? "flex" : "none";
        betInnerResult.innerHTML = result;
        Promise.all([renderPlaceBet(), renderClaimBet(), renderBetPool()]).then(() => {
            hideMessage();
            betContainer.style.opacity = "100%";
            betContainer.style.visibility = "visible";
        });
    } catch (error) {
        betContainer.style.display = "none";
        console.error(error);
        triggerError(providerErrorMsg(error));
    }
}

function unpackQuery(u) {
    let url = u.toLowerCase();

    const htmlRegex = /(html)\((.*)\)\.xpath\((.*)\)/;
    const jsonRegex = /(json)\((.*)\)\.?(.*)/
    const xmlRegex = /(xml)\((.*)\)\.(.*)/

    const match = url.match(htmlRegex) || url.match(xmlRegex) || url.match(jsonRegex) || {};
    return { schema: match[1], url: match[2], path: match[3] }
}

const parseBetQuery = (schema, url, path) => `${schema}(${url})${schema == "html" ? `.xpath(${path})` : path}`;

async function createBet() {
    try {
        if (!(await loadProvider())) return;
        betContainer.style.display = "none";
        resetButtons();
        clearTimeout(hideMessage());

        const schema = createBetSchema.value;
        const url = createBetUrl.value;
        const path = createBetPath.value;
        const query = schema == "wa" ? createBetWolfram.value : parseBetQuery(schema, url, path);
        const schedule = Date.parse(`${scheduleDate.value}`) / 1000;
        const deadline = Date.parse(`${deadlineDate.value}`) / 1000;
        const commission = Math.round(100 / createBetCommission.value);
        const description = createBetDescription.value || "";

        if (!window.ethereum) {
            triggerError("No Ethereum provider detected", createBetQuery, () => window.location.href = "https://metamask.io/");
            return;
        } else if (!betId.value.trim()) {
            triggerError("No bet ID submitted", createBetQuery, () => renderCreationStep(0));
            return;
        } else if (await contract.createdBets(betId.value)) {
            triggerError("Bet ID already exists", createBetQuery, () => renderCreationStep(0));
            return;
        } else if (await contract.createdBets(betId.value)) {
            triggerError("No funds for oracle service", createBetQuery, () => renderCreationStep(1));
            return;
        } else if (!deadline || !schedule) {
            triggerError("Need to specify both bet's deadline to enter and scheduled execution", createBetQuery, () => renderCreationStep(6));
            return;
        } else if (deadline > schedule) {
            triggerError("Bet's deadline to enter can't be set after scheduled time to run", createBetQuery, () => renderCreationStep(6));
            return;
        } else if (deadline < Date.parse(new Date()) / 1000) {
            triggerError("Bet's deadline to enter needs to be a future date", createBetQuery, () => renderCreationStep(6));
            return;
        } else if (schedule >= Date.parse(new Date()) / 1000 + 60 * 24 * 3600) {
            triggerError("Bet cannot be scheduled more than 60 days from now", createBetQuery, () => renderCreationStep(6));
            return;
        } else if (createBetMinimum.value < minimumBet) {
            triggerError(`Minimum bet is ${minimumBet} ETH`, createBetQuery, () => renderCreationStep(3));
            return;
        } else if (!createBetCommission || createBetCommission.value == 0 || createBetCommission.value > 50) {
            triggerError("Commission can't be 0% nor higher than 50%", createBetQuery, () => renderCreationStep(2));
            return;
        }

        activeBet = betId.value.toLowerCase().trim();
        newBetId = activeBet;
        const initialPool = ethToWei(createBetInitialPool.value || "0");
        const value = ethToWei(createBetAmount.value || "0").add(initialPool);

        triggerProcessing("Creating bet", createBetQueryResult);
        await signedContract.createBet(createBetSchema.value == "wa" ? "WolframAlpha" : "URL", activeBet, query, deadline, schedule, commission, ethToWei(createBetMinimum.value), initialPool, description, { value });
    } catch (error) {
        newBetId = null;
        console.error(error);
        triggerError(providerErrorMsg(error), createBetQuery);
    }
}

async function renderPlacedBets() {
    placeBetInfo.style.display = Object.keys(placedBets).length ? "block" : "none";
    const commission = (await contract.betCommissions(activeBet)).toString();
    placeBetEntries.innerHTML = `
        ${Object.entries(placedBets).map(([k, v]) => `<tr><td onclick="delete placedBets['${k}']; renderPlacedBets()">✖</td><td>${k}</td><td>${v - fixedCommission}</td></tr>`).join("")}
    `;
}

function addSingleBet() {
    placedBets[placeBetResult.value] = parseFloat(placeBetAmount.value) + (placedBets[placeBetResult.value] || 0);
    renderPlacedBets();
    placeBetAmount.value = "";
    placeBetResult.value = "";
}

async function addBet() {
    try {
        if (placeBetAmount.value && placeBetResult.value) {
            addSingleBet();
        }
        const results = Object.keys(placedBets).filter(pb => pb);
        const amounts = results.map(r => placedBets[r]).map(a => a.toString()).map(ethToWei);
        if (!results.length || !amounts.length) {
            triggerError("No bets have been placed, make sure result and amount fields are not empty.")
            return;
        }
        const sum = amounts.reduce((acc, b) => acc.add(b), ethToWei("0")).toString();
        triggerProcessing("Placing bet" + (results.length > 1 ? "s" : ""));
        console.log(results, amounts.map(a => a.toString()), sum);
        await signedContract.placeBets(activeBet, results, amounts.map(a => a.toString()), { value: sum });
        placedBets = {};
        placeSingleBet.style.opacity = 0;
        placeBetInfo.style.display = "none";
        placeBetEntries.innerHTML = "";
    } catch (error) {
        console.error(error);
        clearTimeout(hideMessage());
        triggerError(providerErrorMsg(error));
    }
}

function changeBetType() {
    const betType = createBetSchema.value.toUpperCase();

    createBetWolfram.style.display = betType != "WA" ? "none" : "block";

    [createBetUrl, createBetPath]
        .forEach(elm => [elm.style.display, document.querySelector(`label[for="${elm.id}"]`).style.display] = Array(2).fill(betType == "WA" ? "none" : "block"));
    [createBetWolfram.style.display, document.querySelector(`label[for="${createBetWolfram.id}"]`).style.display] = Array(2).fill(betType != "WA" ? "none" : "block");
    createBetQuery.style.display = betType == "WA" ? "none" : "flex";

    createBetQueryInner.innerHTML = parseBetQuery(createBetSchema.value, createBetUrl.value, createBetPath.value);
    switch (betType) {
        case "XML":
        case "JSON":
            createBetPathLabel.innerHTML = `Extract result from ${betType} node using <a href='https://github.com/FlowCommunications/JSONPath#expression-syntax' style='text-decoration: underline'>JSONPath</a>`
            break;
        case "HTML":
            createBetPathLabel.innerHTML = "Extract result from HTML node using <a href='https://www.w3.org/TR/xpath/' style='text-decoration: underline'>XPath</a>"
            break;
    };
}

function providerErrorMsg(error) {
    return `Provider error - ${error.code ? `Code: ${error.code}` : error}`;
}

async function claimReward() {
    try {
        triggerProcessing("Claming reward");
        signedContract.claimBet(activeBet);
    } catch (error) {
        console.error(error);
        triggerError(providerErrorMsg(error));
    }
}

async function testQueryCreate() {
    testQuery(createBetSchema.value == "wa" ? "WolframAlpha" : "URL", createBetSchema.value == "wa" ? createBetWolfram.value : createBetQueryInner.innerHTML, 'Query failed, you can still create the bet if you know it will succeed when it is scheduled to run', createBetQueryResult);
}

async function testQuery(betType, url, errorMsg, after = defaultMessageLocation) {
    if (!url) {
        triggerError("No URL detected.", after);
        return;
    }
    const payload = {
        "context": {
            "name": "oraclize_website_testquery",
            "protocol": "http",
            "type": "web"
        },
        "datasource": betType,
        "query": url
    }
    const baseURL = "https://api.oraclize.it/api/v1/query";
    triggerProcessing("Querying", after);
    setTimeout(async () => {
        let result;
        const queryId = (await fetch(`${baseURL}/create`, { method: "POST", body: JSON.stringify(payload) }).then(r => r.json()).catch(console.log)).result.id;
        let error;
        setTimeout(async () => {
            try {
                const fullResult = (await fetch(`${baseURL}/${queryId}/status`).then(r => r.json()).catch(console.error));
                const error = fullResult.result.checks.find(check => check.errors.length);
                result = fullResult.result.checks[0].results[0];
                if (error || !result) throw error;
            } catch (error) {
                console.error(error);
                triggerError(errorMsg || "Error while trying to fetch result, check query and try again.", after);
                return;
            }
            triggerSuccess("Result: " + result, null, after);
        }, 5000);

    }, 500);
}

async function renderBetPool() {
    try {
        const placedBets = await contract.queryFilter(contract.filters.PlacedBets(null, activeBet));
        const betResults = {};
        placedBets.forEach(pb => { pb.args[3].forEach(result => { betResults[result] = (betResults[result] || 0) + 1; }) });
        const results = await Promise.all(Object.keys(betResults).map((result) => contract.resultPools(activeBet, result)));
        const resultsPool = {};
        Object.keys(betResults).map((result, idx) => {
            resultsPool[result] = weiToEth(results[idx]);
        })

        const allEntries = Object.entries(betResults);

        allEntries.sort((a, b) => resultsPool[b[0]] - resultsPool[a[0]]);
        const entries = allEntries
            .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td><td>${(resultsPool[k])}</td></tr>`)
            .join("");

        poolName.innerHTML = activeBet + " Pool";
        betEntries.innerHTML = entries;

        betPool.style.visibility = "visible";
        betPool.style.opacity = "100%";
    } catch (error) {
        console.error(error);
        triggerError(providerErrorMsg(error));
    }
}

Element.prototype.scrollIntoViewIfNeeded = function () {
    var rect = this.getBoundingClientRect();
    var input = document.querySelectorAll('input');
    for (i = 0; i < input.length; i++) {
        if (!input[i].placeholder || input[i].id === "search-bet") continue;
        if (input[i].getAttribute('size') < input[i].getAttribute('placeholder').length)
            input[i].setAttribute('size', input[i].getAttribute('placeholder').length);
    }
    if (!(
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )) this.scrollIntoView();
}
