const betOperations = document.getElementById("bet-operations");
const claimBet = document.getElementById("claim-bet");
const errorElements = document.getElementsByClassName("error");
const placeBetInputs = document.getElementById("place-bet-inputs");
const placeBet = document.getElementById("place-bet");
const scheduleDate = document.getElementById("schedule-date");
const deadlineDate = document.getElementById("deadline-date");
const scheduleTime = document.getElementById("schedule-time");
const deadlineTime = document.getElementById("deadline-time");
const betId = document.getElementById("create-bet-id");
const createBetUrl = document.getElementById("create-bet-url");
const placeBetResult = document.getElementById("place-bet-result");
const placeBetAmount = document.getElementById("place-bet-amount");
const createBetAmount = document.getElementById("create-bet-amount-label");
const createBetSchema = document.getElementById("create-bet-schema");
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
const betCommission = document.getElementById("create-bet-commission");
const createBetHelp = document.getElementById("create-bet-help");
const createBetInfo = document.getElementById("create-bet-info");
const intro = document.getElementById("intro");
const createBetMinimum = document.getElementById("create-bet-minimum");
const betCarousel = document.getElementById("bet-carousel");
const placeSingleBet = document.getElementById("place-single-bet");
const createBetDescription = document.getElementById("create-bet-description");
const createBetInitialPool = document.getElementById("create-bet-initial-pool");
const createBetCommission = document.getElementById("create-bet-commission");

const placeBetInfo = document.getElementById("place-bet-info");
const placeBetEntries = document.getElementById("place-bet-entries");
const betDescription = document.getElementById("bet-description");
const betInnerDescription = document.getElementById("bet-inner-description");
const betUrl = document.getElementById("bet-url");
const betDeadline = document.getElementById("bet-deadline");
const betSchedule = document.getElementById("bet-schedule");
const betInfo = document.getElementById("bet-info");
const urlSchema = document.getElementById("schema");
const schemaPath = document.getElementById("path");
const defaultMessageLocation = document.getElementById("default-message-location");
const createBetQueryResult = document.getElementById("create-bet-query-result");
const betQuery = document.getElementById("bet-query");
const innerMessage = document.getElementById("inner-message");
const closeMessage = document.getElementById("close-message");
const queryTesterUrl = document.getElementById("query-tester-url");
const queryTesterResult = document.getElementById("query-tester-result");
const newBet = document.getElementById("new-bet");
const betInitialPool = document.getElementById("bet-initial-pool");
const betInnerInitialPool = document.getElementById("bet-inner-initial-pool");
const betTotalPool = document.getElementById("bet-total-pool");
const betInnerTotalPool = document.getElementById("bet-inner-total-pool");
const betFinalResult = document.getElementById("bet-final-result");
const betInnerFinalResult = document.getElementById("bet-inner-final-result");

const closeNewBet = () => {
    newBet.hideBet = newBet.style.display = 'none';
    betContainer.style.display = newBet.hideBet ? 'none' : 'flex';
}

let currentStep = 0;
const steps = Array.from(document.getElementsByClassName("create-bet-step"));

const createBetBtn = () => {
    newBet.hideBet = betContainer.style.display == 'none';
    betContainer.style.display = 'none';
    newBet.style.display = 'flex';
    newBet.scrollIntoViewIfNeeded();
    createBetSchema.selectedIndex = 0;
    [betContainer.style.display, newBet.style.display] = ['none', 'flex'];
    steps[currentStep].style.position = "initial";
    steps[currentStep].style.opacity = "100%";
    (async () => {
        createBetAmount.innerHTML = `The <a href="https://provable.xyz">oracle service</a> that WSBDD uses to interact with the web needs to be paid for by the bet's creator.` + (contract
            ? ` The suggested amount is ${weiToEth((await contract.lastQueryPrice())).toString()} ETH.`
            : ``);
    })();
}

const renderPreviousCreationStep = () => {
    steps[currentStep].style.opacity = "0";
    steps[currentStep].style.visibility = "hidden";
    const p = steps[currentStep];
    setTimeout(() => { p.style.position = "absolute" }, 200);
    currentStep = currentStep == 0 ? steps.length - 1 : currentStep - 1;
    steps[currentStep].style.visibility = "visible";
    steps[currentStep].style.position = "initial";
    steps[currentStep].style.opacity = "100%";
}

const renderNextCreationStep = () => {
    steps[currentStep].style.opacity = "0";
    steps[currentStep].style.visibility = "hidden";
    const p = steps[currentStep];
    setTimeout(() => { p.style.position = "absolute" }, 200);
    currentStep = (currentStep + 1) % steps.length;
    steps[currentStep].style.visibility = "visible";
    steps[currentStep].style.position = "initial";
    steps[currentStep].style.opacity = "100%";
}

searchBetId.onkeydown = searchTriggered;
let activeBet = null;
let placedBets = {};
let processing = null;

let currentBetUrl = null;

function searchTriggered(e) {
    if (e.keyCode === 13) {
        searchBet();
    }
}

let provider, address, signer, contract, signedContract, owner;
let providerLoaded = false;


function hideMessage(delay) {
    // document.getElementById("intro").style.display = "none";
    clearInterval(processing);
    message.style.visibility = "hidden";
    message.style.opacity = "0";
}

function triggerMessage(msg, add, remove, after = defaultMessageLocation, showClose = true, click) {
    clearInterval(processing);
    message.remove();
    console.log(after);
    after.append(message);
    message.onmouseover = undefined;
    message.onclick = click;
    message.ontouchstart = undefined;
    message.classList.add(add);
    remove.forEach((r) => message.classList.remove(r));
    closeMessage.style.display = showClose ? "block" : "none";
    message.style.cursor = "default";
    message.style.display = "flex";
    message.style.visibility = "visible";
    message.style.opacity = "100%";
    innerMessage.innerHTML = msg;
    message.scrollIntoViewIfNeeded();
}

function triggerError(msg, after, link) {
    triggerMessage(msg, "error", ["info", "success"], after);
    if (link) {
        innerMessage.onclick = () => window.location.href = link;
        innerMessage.style.cursor = "pointer";
    }
}

function triggerSuccess(msg, callback, after, click) {
    triggerMessage(msg, "success", ["info", "error"], after, click);
    if (callback) {
        setTimeout(callback, 5000);
    }
}

function triggerProcessing(msg, after, click) {
    triggerMessage(msg, "info", ["error", "success"], after, false);
    let i = 0;
    processing = setInterval(() => (innerMessage.innerHTML = msg + ".".repeat(i++ % 4)), 300);
}


async function loadProvider() {
    try {
        if (providerLoaded) return true;

        if (window.ethereum) {
            await window.ethereum.request({ method: "eth_requestAccounts" });
        } else {
            clearTimeout(hideMessage());
            triggerError("No Ethereum provider detected, click to install MetaMask", undefined, "https://metamask.io");
            providerLoaded = false;
            return false;
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        address = "0xbB2Dfc930A209Aa32E49f0b49264ba6b4270782A";
        signer = provider.getSigner();
        contract = new ethers.Contract(address, contractAbi, provider);
        signedContract = contract.connect(signer);
        if (contract) {
            owner = await signer.getAddress();
            contract.on("LackingFunds", async (sender, funds) => { if (sender == owner) triggerError(`Insufficient query funds, requiring ${weiToEth(funds)} ETH`) });
            contract.on("CreatedBet", async (_, __, betId) => { if (betId == activeBet) triggerSuccess(`Bet created!`, () => { searchBet(betId) }) });
            contract.on("PlacedBets", async (sender, _, __, betId) => { if (sender == owner) triggerSuccess(`Bet placed!`, () => searchBet(betId)) });
            contract.on("LostBet", async (sender) => { if (sender == owner) triggerSuccess("Bet lost, better luck next time!") });
            contract.on("UnwonBet", async (sender) => { if (sender == owner) triggerSuccess("No one won the bet, you've been refunded") });
            contract.on("WonBet", async (sender, amount) => { if (sender == owner) triggerSuccess(`Bet won! ${weiToEth(amount.toString())} ETH transferred to account`) });
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
createBetAmount.title = createBetAmountTitle;

window.onload = () => {
    const betId = new URL(window.location).searchParams.get("id");
    console.log(betId);
    if (betId) {
        searchBet(betId.toLowerCase().trim());
    }
}

function commissionChanged() {
    createBetCommission.value = Number.parseFloat(100 / Math.round(100 / createBetCommission.value)).toFixed(2);
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
        console.log("Hello!")
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
    placeBetAmount.placeholder = `${weiToEth(await contract.betMinimums(activeBet))} minimum, 0.0005 fixed commission`;
    console.log(placeBetAmount.placeholder);
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
        if (!window.ethereum) {
            triggerError("No Ethereum provider detected, click to install MetaMask", undefined, "https://metamask.io");
            return;
        }
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
        currentBetUrl = await contract.betQueries(activeBet);
        const { url, schema, path } = unpackUrl(currentBetUrl);
        urlSchema.innerHTML = schema || "Unknown";
        betUrl.innerHTML = url || currentBetUrl;
        schemaPath.innerHTML = path || "Unknown";
        betDeadline.innerHTML = new Date(await contract.betDeadlines(activeBet) * 1000).toISOString().replace("T", " ").split(".")[0].slice(0, -3);
        const createdFilter = (await contract.queryFilter(contract.filters.CreatedBet(null, activeBet)))[0];
        const [schedule, initialPool, description] = [new Date(createdFilter.args[3].toString() * 1000), createdFilter.args[4].toString(), createdFilter.args[5].toString()];
        const result = await contract.betResults(activeBet);
        betSchedule.innerHTML = schedule.toISOString().replace("T", " ").split(".")[0].slice(0, -3);
        betInnerDescription.innerHTML = description;
        betInnerInitialPool.innerHTML = weiToEth(initialPool).toString() + "Ð";
        betInnerTotalPool.innerHTML = weiToEth((await contract.betPools(activeBet)).toString()).toString() + "Ð";
        betDescription.style.display = description ? "flex" : "none";
        betFinalResult.style.display = result ? "flex" : "none";
        betFinalResult.innerHTML = result;
        Promise.all([renderPlaceBet(), renderClaimBet(), renderBetPool()]).then(() => {
            hideMessage();
            betContainer.style.opacity = "100%";
            betContainer.style.visibility = "visible";
        });
    } catch (error) {
        betContainer.style.display = "none";
        console.error(error);
        triggerError(`Unexpected error: ${error.code ? `code: ${error.code}` : error}`);
    }
}

function unpackUrl(u) {
    let url = u.toLowerCase();

    const htmlRegex = /(html)\((.*)\)\.xpath\((.*)\)/;
    const jsonRegex = /(json)\((.*)\)\.?(.*)/
    const xmlRegex = /(xml)\((.*)\)\.(.*)/

    const match = url.match(htmlRegex) || url.match(xmlRegex) || url.match(jsonRegex) || {};
    return { schema: match[1], url: match[2], path: match[3] }
}

const createBetQuery = (schema, url, path) => `${schema}(${url})${schema == "html" ? `.xpath(${path})` : path}`;

async function createBet() {
    try {
        if (!(await loadProvider())) return;
        betContainer.style.display = "none";
        resetButtons();
        clearTimeout(hideMessage());

        const schema = createBetSchema.value;
        const url = createBetUrl.value;
        const path = createBetPath.value;
        const query = createBetQuery(schema, url, path);
        const schedule = Date.parse(`${scheduleDate.value} ${scheduleTime.value}`) / 1000;
        const deadline = Date.parse(`${deadlineDate.value} ${deadlineTime.value}`) / 1000;
        const commission = Math.round(100 / betCommission.value);
        const description = createBetDescription.value || "";

        if (!window.ethereum) {
            triggerError("No Ethereum provider detected", betQuery, "https://metamask.io");
            return;
        } else if (await contract.createdBets(betId.value)) {
            triggerError("Bet ID already exists", betQuery);
            return;
        } else if (deadline > schedule) {
            triggerError("Bet's deadline to enter can't be set after scheduled time to run", betQuery);
            return;
        } else if (deadline < Date.parse(new Date()) / 1000) {
            triggerError("Bet's deadline to enter needs to be a future date", betQuery);
            return;
        } else if (schedule >= Date.parse(new Date()) / 1000 + 60 * 24 * 3600) {
            triggerError("Bet cannot be scheduled more than 60 days from now", betQuery);
            return;
        } else if (createBetMinimum.value < 0.001) {
            triggerError("Minimum betting amount is 0.001 ETH", betQuery);
            return;
        } else if (betCommission.value == 0) {
            triggerError("Commission can't be 0%", betQuery);
            return;
        } else if (schema == "schema") {
            triggerError("Need to specify query's schema", betQuery);
            return;
        }
        activeBet = betId.value.toLowerCase().trim();
        const initialPool = ethToWei(createBetInitialPool.value || "0");
        const value = ethToWei(createBetAmount.value || "0").add(initialPool);

        triggerProcessing("Creating bet", createBetQueryResult);
        await signedContract.createBet(activeBet, query, deadline, schedule, commission, ethToWei(createBetMinimum.value).toString(), initialPool, description, { value });
        // [betId, url, amount, scheduleDate, deadlineDate, scheduleTime, deadlineTime].forEach(n => n.value = "");
        [scheduleDate, deadlineDate, scheduleTime, deadlineTime].forEach((d) => (d.type = "text"));
    } catch (error) {
        console.error(error);
        triggerError(`Unexpected error - ${error.code || error}`, betQuery);
    }
}

function renderPlacedBets() {
    placeBetInfo.style.display = Object.keys(placedBets).length ? "block" : "none";
    placeBetEntries.innerHTML = `
        ${Object.entries(placedBets).map(([k, v]) => `<tr><td onclick="delete placedBets['${k}']; renderPlacedBets()">✖</td><td>${k}</td><td>${v}</td></tr>`).join("")}
    `;
}

function addSingleBet() {
    placedBets[placeBetResult.value] = parseFloat(placeBetAmount.value) + (placedBets[placeBetResult.value] || 0) - 0.0005;
    renderPlacedBets();
    placeBetAmount.value = "";
    placeBetResult.value = "";
}

async function addBet() {
    try {
        if (placeBetAmount.value && placeBetResult.value) {
            addSingleBet();
        }
        const results = Object.keys(placedBets).map(pb => pb || "");
        const amounts = results.map(r => placedBets[r]).map(a => ethToWei(a.toString()));
        if (!results.length || !amounts.length) {
            triggerError("No bets have been placed, make sure result and amount fields are not empty.")
            return;
        }
        const sum = amounts.reduce((acc, b) => acc.add(b), ethToWei("0")).toString();
        triggerProcessing("Placing bet" + (results.length > 1 ? "s" : ""));
        await signedContract.placeBets(activeBet, results, amounts.map(a => a.toString()), { value: sum });
        placedBets = {};
        placeSingleBet.style.opacity = 0;
        placeBetInfo.style.display = "none";
        placeBetEntries.innerHTML = "";
    } catch (error) {
        console.error(error);
        clearTimeout(hideMessage());
        triggerError(`Unexpected error: ${error.code ? `code: ${error.code}` : error}`);
    }
}

async function claimReward() {
    try {
        triggerProcessing("Claming reward");
        signedContract.claimBet(activeBet);
    } catch (error) {
        console.error(error);
        triggerError(`Unexpected error: ${error.code ? `code: ${error.code}` : error}`);
    }
}

async function testQuery(url, errorMsg, after = defaultMessageLocation) {
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
        "datasource": "URL",
        "query": url
    }
    const baseURL = "https://api.oraclize.it/api/v1/query";
    triggerProcessing("Querying", after);
    setTimeout(async () => {
        let result;
        try {
            const queryId = (await fetch(`${baseURL}/create`, { method: "POST", body: JSON.stringify(payload) }).then(r => r.json()).catch(console.log)).result.id;
            const fullResult = (await fetch(`${baseURL}/${queryId}/status`).then(r => r.json()).catch(console.log));
            const error = fullResult.result.checks.find(check => check.errors.length);
            result = fullResult.result.checks[0].results[0];
            if (error || !result) throw error;
        } catch (error) {
            console.error(error);
            triggerError(errorMsg || "Error while trying to fetch result, check query and try again.", after);
            return;
        }
        triggerSuccess("Result: " + result, null, after);
    }, 2000);
}

async function renderBetPool() {
    try {
        const placedBets = await contract.queryFilter(contract.filters.PlacedBets(null, activeBet));
        const betResults = {};
        placedBets.forEach(pb => { pb.args[4].forEach(result => { betResults[result] = (betResults[result] || 0) + 1; }) });
        const results = await Promise.all(Object.keys(betResults).map((result) => contract.resultPools(activeBet, result)));
        const resultsPool = {};
        Object.keys(betResults).map((result, idx) => {
            console.log(weiToEth(results[idx]));
            resultsPool[result] = weiToEth(results[idx]);
        })

        const allEntries = Object.entries(betResults);

        //const totalPool = weiToEth(Object.entries(resultsPool).reduce((a, b) => a[1].add(b[1]), [null, ethToWei("0")]));

        allEntries.sort((a, b) => resultsPool[b[0]] - resultsPool[a[0]]);
        const entries = allEntries
            .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td><td>${(resultsPool[k])}</td></tr>`)
            .slice(0, 25)
            .join("");

        poolName.innerHTML = activeBet + " Pool";
        betEntries.innerHTML = entries;

        betPool.style.visibility = "visible";
        betPool.style.opacity = "100%";
    } catch (error) {
        console.error(error);
        triggerError(`Unexpected error: ${error.code ? `code: ${error.code}` : error}`);
    }
}

Element.prototype.scrollIntoViewIfNeeded = function () {
    var rect = this.getBoundingClientRect();
    var input = document.querySelectorAll('input');
    for (i = 0; i < input.length; i++) {
        if (!input[i].placeholder) continue;
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
