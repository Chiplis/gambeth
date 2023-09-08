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

const usdcAddress = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";
let usdc;
let betChart = null;

const numberToToken = async (n, m) => {
    if (!activeBet && !m) return BigInt(n);
    const betToken = await activeContract.betTokens(activeBet);
    let d = m || await activeContract.tokenDecimals(BigInt(betToken) ? betToken : usdcAddress);
    if (!d) return BigInt(0);
    return BigInt(n) * BigInt(d);
}

const tokenToNumber = async (n, m) => {
    if (!activeBet && !m) return BigInt(n);
    let d = m || await activeContract.tokenDecimals(await activeContract.betTokens(activeBet) || usdcAddress);
    if (!d) return BigInt(0);
    return (Number(n) / Number(d)).toFixed(2);
}

const aboutBet = document.getElementById("about-bet");
const claimBet = document.getElementById("claim-bet");
const placeBetInputs = document.getElementById("place-bet-inputs");
const chooseBetInputs = document.getElementById("choose-bet-inputs");
const chooseBetPosition = document.getElementById("choose-bet-position");
const placeBet = document.getElementById("place-bet");
const scheduleDate = document.getElementById("schedule-date");
const deadlineDate = document.getElementById("deadline-date");
const betId = document.getElementById("create-bet-id");
const betIdLabel = document.getElementById("create-bet-id-label");
const betIdMsg = "Your bet's name is a unique identifier which lets other users search for it. https://gambeth.com/?id={BET_ID} is a quick way to share your bet with the world!";
const decideBetOutcome = document.getElementById("decide-bet-outcome");
const betDecision = document.getElementById("bet-decision");
const createBetUrl = document.getElementById("create-bet-url");
const placeBetOutcome = document.getElementById("place-bet-outcome");
const placeBetAmount = document.getElementById("place-bet-amount");
const createBetSchema = document.getElementById("create-bet-schema");
const createBetOo = document.getElementById("create-bet-oo");
const createBetPath = document.getElementById("create-bet-path");
const betEntries = document.getElementById("bet-entries");
const marketPrices = document.getElementById("market-prices");

const betPool = document.getElementById("bet-pool");
const userPool = document.getElementById("user-pool");
const ordersPool = document.getElementById("orders-pool");
const openOrders = document.getElementById("open-orders");

const userBuyOrdersEntries = document.getElementById("user-buy-orders-entries");
const userSellOrdersEntries = document.getElementById("user-sell-orders-entries");
const poolBuyOrdersEntries = document.getElementById("pool-buy-orders-entries");
const poolSellOrdersEntries = document.getElementById("pool-sell-orders-entries");

const searchBetId = document.getElementById("search-bet");
const poolName = document.getElementById("pool-name");
const message = document.getElementById("message");
const betContainer = document.getElementById("bet-container");
const createBetChoicesList = document.getElementById("create-bet-choices-list");
const queueBuyOrder = document.getElementById("queue-buy-order");
const queueSellOrder = document.getElementById("queue-sell-order");

const placeBetDataContainer = document.getElementById("place-bet-data-container");
const placeBetChoiceContainer = document.getElementById("place-bet-choice-container");
const placeBetPositionContainer = document.getElementById("place-bet-position-container");

const createBetInitialPool = document.getElementById("create-bet-initial-pool");
const createBetCommission = document.getElementById("create-bet-commission");
const createBetChoices = document.getElementById("create-bet-choices");
const createBetChoice = document.getElementById("create-bet-choice");

const placeBetInfo = document.getElementById("place-bet-info");
const placeBetEntries = document.getElementById("place-bet-entries");
const betUrl = document.getElementById("bet-url");
const betDeadline = document.getElementById("bet-deadline");
const betSchedule = document.getElementById("bet-schedule");
const betInfo = document.getElementById("bet-info");
const urlSchema = document.getElementById("bet-schema");
const schemaPath = document.getElementById("bet-path");
const defaultMessageLocation = document.getElementById("default-message-location");
const createBetQueryOutcome = document.getElementById("create-bet-query-outcome");
const createBetQuery = document.getElementById("create-bet-query");
const createBetPathLabel = document.getElementById("create-bet-path-label");
const createBetQueryInner = document.getElementById("create-bet-query-inner");
const innerMessage = document.getElementById("inner-message");
const closeMessage = document.getElementById("close-message");
const newBet = document.getElementById("new-bet");

const urlBet = document.getElementById("url-bet");
const ooBet = document.getElementById("oo-bet");
const betInnerInitialPool = document.getElementById("bet-initial-pool");
const betInnerCommission = document.getElementById("bet-commission");
const betInnerTotalPool = document.getElementById("bet-total-pool");
const betQuery = document.getElementById("bet-query");
const betOoQuery = document.getElementById("bet-oo-query");
const betInnerOutcome = document.getElementById("bet-inner-outcome");

const betIdChanged = () => betIdLabel.innerHTML = betIdMsg.replace("{BET_ID}", betId.value.trim());

const closeNewBet = () => {
    newBet.hideBet = newBet.style.display = 'none';
    betContainer.style.display = newBet.hideBet ? 'none' : 'flex';
}

let fixedCommission = null;

let currentStep = 0;
const steps = Array.from(document.getElementsByClassName("create-bet-step"));

const createBetBtn = async () => {
    newBet.hideBet = betContainer.style.display === 'none';
    betContainer.style.display = 'none';
    newBet.style.display = 'flex';
    newBet.scrollIntoViewIfNeeded();
    createBetSchema.selectedIndex = 0;
    [betContainer.style.display, newBet.style.display] = ['none', 'flex'];
    steps[currentStep].style.position = "initial";
    steps[currentStep].style.opacity = "100%";
}

const renderCreationStep = (idx) => {
    steps[currentStep].style.opacity = "0%";

    setTimeout(() => {
        steps[currentStep].style.display = "none";
        steps[currentStep].style.visibility = "hidden";
        steps[currentStep].style.position = "absolute";
        currentStep = idx;
        steps[currentStep].style.display = "flex";
        steps[currentStep].style.visibility = "visible";
        steps[currentStep].style.position = "initial";
        steps[currentStep].style.opacity = "100%";
    }, 1);
}

const renderPreviousCreationStep = () => {
    renderCreationStep(currentStep === 0 ? steps.length - 1 : currentStep - 1);
}

const renderNextCreationStep = () => {
    renderCreationStep((currentStep + 1) % steps.length);
}

searchBetId.onkeydown = searchTriggered;
let activeBet = null;
let placedBets = [];
let newBetId = null;
let processing = null;

function searchTriggered(e) {
    if (e.keyCode === 13) {
        searchBet(searchBetId.value);
    }
}

let provider, signer, activeContract, owner;
let providerLoaded = false;


function hideMessage() {
    clearInterval(processing);
    message.style.opacity = "0";
    message.style.visibility = "hidden";
}

function triggerMessage(msg, add, remove, after = defaultMessageLocation, click, showClose = true) {
    clearInterval(processing);
    message.style.visibility = "visible";
    after.append(message);
    message.onmouseover = undefined;
    message.onclick = undefined;
    message.ontouchstart = undefined;
    message.classList.add(add);
    remove.forEach((r) => message.classList.remove(r));
    closeMessage.style.display = showClose ? "block" : "none";
    message.style.cursor = "default";
    message.style.display = "flex";
    message.style.opacity = "100%";
    innerMessage.style.cursor = click ? "pointer" : "default";
    innerMessage.onclick = click;
    innerMessage.innerHTML = msg;
    message.scrollIntoViewIfNeeded();
}

function triggerError(msg, after = defaultMessageLocation, click) {
    console.error(msg);
    triggerMessage(msg, "error", ["info", "success"], after, click);
}

function triggerSuccess(msg, callback, after = defaultMessageLocation, delay = 0) {
    triggerMessage(msg, "success", ["info", "error"], after);
    if (callback) {
        setTimeout(callback, delay);
    }
}

function triggerProcessing(msg, after = defaultMessageLocation) {
    triggerMessage(msg, "info", ["error", "success"], after, null, false);
    let i = 0;
    processing = setInterval(() => (innerMessage.innerHTML = msg + ".".repeat(i++ % 4)), 300);
}

const ooContractAddress = "0xbF5A8DD31f9457480202854169A500CBE8fEc2f7";
const provableContractAddress = "0x03Df3D511f18c8F49997d2720d3c33EBCd399e77";
const humanContractAddress = "";
let awaitingApproval = false;

window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{chainId: "0x5"}]
});
['chainChanged', 'accountsChanged'].forEach(e => window.ethereum.on(e, () => {
    loadProvider();
}));


async function loadProvider({betId = activeBet, betType} = {}) {
    try {
        await hideMessage();
        if (window.ethereum) {
            await window.ethereum.request({method: "eth_requestAccounts"});
        } else {
            clearTimeout(hideMessage());
            triggerError("No Ethereum provider detected, click to install MetaMask", undefined, () => window.location.href = "https://metamask.io/");
            providerLoaded = false;
            return false;
        }
        provider = new ethers.BrowserProvider(window.ethereum);
        const {chainId} = await provider.getNetwork();
        if (chainId != 5) {
            hideMessage();
            clearTimeout();
            triggerError("Please switch to Goerli tesnet", undefined);
            providerLoaded = false;
            return false;
        }
        signer = await provider.getSigner();
        if (!gambethStateAbi) throw "ABI not loaded";
        

        if (betId) {
            const betKind = await activeContract.betKinds(betId);
            switch (betKind) {
                case 0n:
                    activeContract = new ethers.Contract(ooContractAddress, optimisticOracleAbi, provider).connect(signer);
                    break;
                case 1n:
                    activeContract = new ethers.Contract(humanContractAddress, [], provider).connect(signer);
                    break;
            }
        } else if (betType) {
            switch (betType) {
                case "oo":
                    activeContract = new ethers.Contract(ooContractAddress, optimisticOracleAbi, provider).connect(signer);
                    break;
                case "bc":
                    activeContract = humanContractAddress
                        ? new ethers.Contract(humanContractAddress, [], provider).connect(signer)
                        : null;
                    break;
                default:
                    activeContract = new ethers.Contract(provableContractAddress, provableOracleAbi, provider).connect(signer);
                    break;
            }
        }

        if (activeContract) {
            owner = await signer.getAddress();
            activeContract.on("CreatedBet", async hashedBetId => {
                if (hashedBetId.hash === ethers.id(newBetId || "")) triggerSuccess(`Bet created!`, () => {
                    searchBet(newBetId);
                }, undefined, 2500)
            });
            activeContract.on("PlacedBets", async (sender) => {
                if (sender === owner) triggerSuccess(`Bet placed!`, renderBetPool)
            });
            activeContract.on("LostBet", async (sender) => {
                if (sender === owner) triggerSuccess("Bet lost, better luck next time!")
            });
            activeContract.on("UnwonBet", async (sender) => {
                if (sender === owner) triggerSuccess("No one won the bet, you've been refunded")
            });
            activeContract.on("WonBet", async (sender, amount) => {
                if (sender === owner) triggerSuccess(`Bet won! ${await tokenToNumber(amount.toString())} USDC transferred to account`)
            });
            fixedCommission = await tokenToNumber(0);
        }

        providerLoaded = true;

        usdc = new ethers.Contract(usdcAddress, tokenAbi, provider).connect(await provider.getSigner());
        let allowance = await usdc.allowance(owner, ooContractAddress);
        if (allowance === 0n && !awaitingApproval) {
            try {
                awaitingApproval = true;
                await usdc.approve(ooContractAddress, 999999999999);
            } catch (error) {
                triggerError(error);
            }
        }

        return true;
    } catch (error) {
        console.error(error);
        triggerError("Error while loading Ethereum provider: " + (error.code || error) + (error.code === "CALL_EXCEPTION" ? ". Switch to Sepolia testnet" : ""));
        providerLoaded = false;
        return false;
    }
}

loadProvider();

window.onload = () => searchBet((new URL(window.location).searchParams.get("id") || "").toLowerCase().trim());

async function resetButtons() {
    placeBetInputs.style.display = "none";
    [claimBet, placeBet, betPool].forEach((elm) => {
        elm.style.opacity = 0;
        elm.style.visibility = "hidden";
    });
}

function renderPlaceSingleBet() {
    const filledBet = (placeBetOutcome.value || chooseBetInputs.style.display !== "none") && placeBetAmount.value;
    queueBuyOrder.onclick = filledBet ? () => {
        addSingleBet({amount: Number(placeBetAmount.value), outcome: placeBetOutcome.value || chooseBetInputs.value, orderType: chooseBetPosition.value.toUpperCase()});
        renderPlaceSingleBet();
    } : "";
    queueBuyOrder.style.cursor = filledBet ? "pointer" : "default";
    queueBuyOrder.style.opacity = filledBet ? "1" : "0";
}

renderPlaceSingleBet();

async function renderClaimBet() {
    const addr = await signer.getAddress();
    const finishedBet = await activeContract.finishedBets(activeBet);
    const outcome = await activeContract.getResult(activeBet);
    const resolutionRequested = BigInt(await activeContract.betRequester(activeBet)) !== 0n;
    const scheduleReached = await activeContract.betSchedules(activeBet) * BigInt(1000) < BigInt(new Date().getTime());
    let showClaim = finishedBet || (!resolutionRequested && scheduleReached) || (resolutionRequested && !finishedBet);
    showClaim &&= !outcome.length ? true : await activeContract.userBets(activeBet, addr, outcome) !== 0n;
    if (!showClaim) {
        claimBet.style.display = "none";
        claimBet.style.visibility = "hidden";
        claimBet.style.opacity = "0";
    } else {
        claimBet.style.display = "block";
        claimBet.style.visibility = "visible";
        claimBet.style.opacity = "100%";
    }
    const claimedBet = await activeContract.claimedBets(activeBet, addr);
    claimBet.innerHTML = claimedBet
        ? "Claimed"
        : resolutionRequested
            ? (finishedBet ? "Claim" : "Settling")
            : "Settle";
    const disableLink = ["Claimed", "Settling"].includes(claimBet.innerHTML);
    claimBet.classList.remove(disableLink ? "link" : null);
    claimBet.classList.add(!disableLink ? "link" : null);
    claimBet.disabled = claimBet.innerHTML === "Claimed" || claimBet.innerHTML === "Settling";
    claimBet.style.cursor = claimBet.disabled ? "initial" : "pointer";
}

async function activeBetKind() {
    switch (await activeContract.betKinds(activeBet)) {
        case 0n:
            return "oo";
        case 1n:
            return "human";
        case 2n:
            return "provable";
    }
}

async function activeBetChoices() {
    const outcomes = [];
    let i = 0;
    while (true) {
        try {
            let outcome = await activeContract.betResults(activeBet, BigInt(i++));
            if (!outcome) return outcomes;
            outcomes.push(outcome);
        } catch {
            return outcomes;
        }
    }
}

async function renderPlaceBet() {

    const deadline = await activeContract.betDeadlines(activeBet) * BigInt(1000);
    const lockedPool = deadline <= Math.round(new Date().getTime());
    const schedule = await activeContract.betSchedules(activeBet) * BigInt(1000);
    const scheduleReached = schedule <= Math.round(new Date().getTime());
    const betKind = await activeBetKind();

    betDecision.style.display = betKind === "human"
        ? ((lockedPool && await activeContract.betOwners(activeBet) === owner) ? "block" : "none")
        : "none";

    placeBet.style.visibility = "visible";
    placeBet.style.opacity = "100%";
    placeBet.innerHTML = lockedPool ? (scheduleReached ? "Finished" : "Buy") : "Place";
    placeBet.classList.remove(scheduleReached ? "link" : null);
    placeBet.classList.add(!scheduleReached ? "link" : null);
    placeBet.disabled = scheduleReached;

    placeBetInputs.style.display = lockedPool ? "none" : "flex";
    placeBetInputs.style.opacity = lockedPool ? 0 : "100%";
    placeBetInputs.style.visibility = lockedPool ? "hidden" : "visible";

    placeBetDataContainer.style.display = scheduleReached ? "none" : "block";
    placeBetChoiceContainer.style.display = scheduleReached ? "none" : "flex";
    placeBetPositionContainer.style.display = scheduleReached ? "none" : "flex";
    queueBuyOrder.style.display = scheduleReached ? "none" : "block";

    if (betKind === "oo") {
        placeBetInputs.style.display = "none";
        chooseBetInputs.style.display = "block";
        chooseBetInputs.innerHTML = (await activeBetChoices())
            .map(choice => `<option value="${choice}">${choice}</option>`)
            .join("");
    } else {
        placeBetInputs.style.display = "block";
        chooseBetInputs.style.display = "none";
    }

}

async function calculateShares({outcome, cost}) {
    const currentCost = await activeContract.calculateCost(activeBet);
    const outcomes = await activeBetChoices();
    const pool = await activeContract.resultPools(activeBet, outcome);
    let restPools = await Promise.all(outcomes.filter(r => r !== outcome).map(r => activeContract.resultPools(activeBet, r)));
    restPools = restPools.map(a => a * a).reduce((a, b) => a + b, 0n);
    console.log(restPools);
    const prices = (cost + currentCost) * (cost + currentCost);
    console.log(prices - restPools);
    const shares = Math.sqrt(Number(prices - restPools)) - Number(pool);
    console.log(shares);
    return shares;
}

async function calculateCost(newBets) {
    if (!Object.keys(newBets).length) {
        return "";
    }
    const outcomes = await activeBetChoices();
    const pools = await Promise.all(outcomes.map(o => activeContract.resultPools(activeBet, o).then(tokenToNumber).then(Number)));
    const newCost = Math.sqrt(outcomes.map((o, i) => Math.pow((newBets[o] || 0) + pools[i], 2)).reduce((a, b) => a + b, 0));
    return newCost - await activeContract.calculateCost(activeBet).then(tokenToNumber).then(Number);
}

async function calculatePrice(result) {
    return Number(await activeContract.resultPools(activeBet, result)) / Number(await activeContract.calculateCost(activeBet));
}

async function searchBet(betId = activeBet) {
    if (!betId) {
        return;
    }
    try {
        if (!(await loadProvider({betId}))) {
            return;
        }
        await fetchOrders(true);
        placedBets = [];
        newBet.style.display = "none";
        await resetButtons();
        triggerProcessing("Loading bet");
        betContainer.style.opacity = "0";
        betContainer.style.visibility = "hidden";
        activeBet = searchBetId.value || betId;
        const betExists = await activeContract.createdBets(activeBet);
        if (!betExists) {
            betContainer.style.display = "none";
            triggerError("Invalid Bet ID");
            return;
        }
        const location = new URL(window.location.toString());
        location.searchParams.set("id", activeBet);
        history.pushState({}, "", location.toString());
        betContainer.style.display = "flex";
        const bets = await activeContract.queryFilter(activeContract.filters.CreatedBet(activeBet));
        const createdFilter = bets[0];
        const [initialPool, query] = createdFilter.args.slice(1).map(arg => arg.toString());
        const {url, schema, path} = unpackQuery(query);

        ooBet.style.display = schema ? "none" : "flex";
        urlBet.style.display = schema ? "flex" : "none";
        (schema ? betQuery : betOoQuery).innerHTML = query;
        urlSchema.innerHTML = schema || "Unknown";
        betUrl.innerHTML = url || query;
        schemaPath.innerHTML = path || "Unknown";
        let deadline = await activeContract.betDeadlines(activeBet) * BigInt(1000);
        deadline = new Date(Number(deadline.toString()));
        betDeadline.innerHTML = deadline.toISOString().replace("T", " ").split(".")[0].slice(0, -3);
        let schedule = await activeContract.betSchedules(activeBet) * BigInt(1000);
        schedule = new Date(Number(schedule.toString()));
        betSchedule.innerHTML = schedule.toISOString().replace("T", " ").split(".")[0].slice(0, -3);
        let outcome = await activeContract.getResult(activeBet);
        let symbol = await usdc.symbol();
        betInnerInitialPool.innerHTML = (await tokenToNumber(initialPool)).toString() + " " + symbol;
        const totalPool = async () => {
            const outcomes = await activeBetChoices();
            const pools = await Promise.all(outcomes.map(o => activeContract.resultTransfers(activeBet, o)));
            console.log(pools);
            return pools.reduce((a, b) => a + b, 0n);
        }
        betInnerTotalPool.innerHTML = (await tokenToNumber(await totalPool())).toString() + " " + symbol;
        const innerCommission = Number(await activeContract.betCommissions(activeBet)) / Number(await activeContract.betCommissionDenominator(activeBet)) * 100;
        betInnerCommission.innerHTML = Number.parseFloat(innerCommission) + "%";
        betInnerOutcome.innerHTML = outcome || "Unresolved";
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
    return {schema: match[1], url: match[2], path: match[3]}
}

const parseBetQuery = (schema, url, path) => `${schema}(${url})${schema === "html" ? `.xpath(${path})` : path}`;

async function createBet() {
    try {
        betContainer.style.display = "none";
        clearTimeout(hideMessage());

        const schema = createBetSchema.value;
        let query = createBetOo.value;
        const schedule = Date.parse(`${scheduleDate.value}`) / 1000;
        const deadline = Date.parse(`${deadlineDate.value}`) / 1000;
        let commission = Number(createBetCommission.value || 0).toString();
        let exponent = commission.includes(".") ? commission.length - commission.indexOf(".") : 0;
        commission = commission.replace(".", "");
        let commissionDenominator = exponent ? Math.pow(10, exponent - 1) : 100;

        if (!window.ethereum) {
            triggerError("No Ethereum provider detected", createBetQuery, () => window.location.href = "https://metamask.io/");
            return;
        } else if (!betId.value.trim()) {
            triggerError("No bet ID submitted", createBetQuery, () => renderCreationStep(0));
            return;
        } else if (!deadline || !schedule) {
            triggerError("Need to specify both deadline and scheduled execution", createBetQuery, () => renderCreationStep(6));
            return;
        } else if (deadline > schedule) {
            triggerError("Bet's deadline to enter can't be set after scheduled time to run", createBetQuery, () => renderCreationStep(6));
            return;
        } else if (deadline < Date.parse(new Date()) / 1000) {
            triggerError("Bet's deadline to enter needs to be a future date", createBetQuery, () => renderCreationStep(6));
            return;
        } else if (isNaN(Number.parseFloat(commission)) || commission > 50) {
            triggerError("Commission should be a number between 0 and 50", createBetQuery, () => renderCreationStep(2));
            return;
        } else if (await activeContract.createdBets(betId.value)) {
            triggerError("Bet ID already exists", createBetQuery, () => renderCreationStep(0));
            return;
        }
        activeBet = betId.value.toLowerCase().trim();
        newBetId = activeBet;
        const initialPool = await numberToToken(createBetInitialPool.value || "0");
        triggerProcessing("Creating bet", createBetQueryOutcome);
        const outcomes = createdBetChoices;
        if (outcomes.length) {
            query += " Choose " + outcomes.map((choice, idx) => `${idx} for ${choice}, `).join("");
            query = query.slice(0, query.length - 2);
            query += `. Choose ${outcomes.length} if the question can't be answered at the current time or if none of the previous options are correct.`
        }
        triggerProcessing("Creating bet");
        switch (schema) {
            case "bc":
                await activeContract.createHumanBet("0x07865c6E87B9F70255377e024ace6630C1Eaa37F", activeBet, deadline, schedule, commissionDenominator, commission, initialPool, query);
                break;
            case "oo":
                await (await activeContract.createOptimisticBet("0x07865c6E87B9F70255377e024ace6630C1Eaa37F", activeBet, deadline, schedule, commissionDenominator, commission, initialPool, [...new Set(outcomes)], query)).wait();
                break;
        }
    } catch (error) {
        newBetId = null;
        console.error(error);
        triggerError(providerErrorMsg(error), createBetQuery);
    }

    createdBetChoices = [];
}

async function renderPlacedBets() {
    console.log(placedBets);
    placeBetInfo.style.display = placedBets.length ? "block" : "none";
    placeBetEntries.innerHTML = placedBets.map((order, i) => `<tr><td onclick="placedBets.splice(${i}, 1); renderPlacedBets()">✖</td><td>${order.orderType}</td><td>${order.outcome}</td><td>${order.amount}</td><td></td></tr>`).join("");
    const newBets = {};
    placedBets.filter(p => p.orderType === "BUY").forEach(b => newBets[b.outcome] = (newBets[b.outcome] || 0) + Number(b.amount));
    const totalCost = await calculateCost(newBets);
    placeBetEntries.innerHTML += totalCost ? `<tr><td></td><td></td><td></td><td><td>${totalCost.toFixed(2)}</td></tr>` : "";
}

async function addSingleBet(order) {
    const foundOrder = placedBets.filter(o => o.orderType === order.orderType && o.outcome === order.outcome)[0];
    if (!foundOrder) {
        placedBets.push(order);
    } else {
        foundOrder.amount += order.amount;
    }
    renderPlacedBets();
    placeBetAmount.value = "";
    placeBetOutcome.value = "";
}

async function buyBet() {
    if (await activeBetKind() === "oo") {
        await fillOrder("BUY");
    } else {
        await addFreeBet();
    }
}

const betOrders = {};
let orderCounter = 0;
const fetchOrders = async (refresh) => {
    if (!activeBet || !activeContract) {
        return;
    }
    betOrders[activeBet] = refresh ? [] : (betOrders[activeBet] || []);
    orderCounter = refresh ? 0 : orderCounter;
    const contractOrders = await activeContract.getOrders(activeBet, orderCounter, 100);
    if (!contractOrders.length) {
        return;
    }
    const newOrders = contractOrders.map((o, idx) => ({
        orderType: o[0] ? "SELL" : "BUY",
        numerator: o[1],
        denominator: o[2],
        outcome: o[3],
        amount: o[4],
        user: o[5],
        idx
    }));
    orderCounter += newOrders.length;
    console.log(newOrders);
    betOrders[activeBet] = betOrders[activeBet].concat(newOrders.filter(o => o.amount !== 0n));
    await renderOrders();
}

async function renderOrders() {
    console.log(betOrders);
    const toRow = async ({orderType, outcome, amount, numerator, denominator}) => {
        const shares = await tokenToNumber(amount);
        console.log(shares);
        return (`<tr></tr><td>${outcome}</td><td>${shares}</td><td>${(shares * Number(numerator)) / Number(denominator)}</td></tr>`)
    };

    const userBuys = betOrders[activeBet].filter(b => b.user === owner).filter(o => o.orderType === "BUY");
    const userSells = betOrders[activeBet].filter(b => b.user === owner).filter(o => o.orderType === "SELL");
    const poolBuys = betOrders[activeBet].filter(b => b.user !== owner).filter(o => o.orderType === "BUY");
    const poolSells = betOrders[activeBet].filter(b => b.user !== owner).filter(o => o.orderType === "SELL");

    userBuyOrdersEntries.innerHTML = `${(await Promise.all(userBuys.map(toRow))).join("")}`;
    userSellOrdersEntries.innerHTML = `${(await Promise.all(userSells.map(toRow))).join("")}`;
    poolBuyOrdersEntries.innerHTML = `${(await Promise.all(poolBuys.map(toRow))).join("")}`;
    poolSellOrdersEntries.innerHTML = `${(await Promise.all(poolSells.map(toRow))).join("")}`;
}

setInterval(fetchOrders, 1000);

async function fillOrder() {
    const outcomes = placedBets.filter(order => order.amount > 0n);
    console.log(outcomes);

    const amounts = await Promise.all(outcomes.map(o => o.amount).map(a => numberToToken(a)));
    if (!outcomes.length || !amounts.length) {
        triggerError("No bets have been placed, make sure outcome and amount fields are not empty.")
        return;
    }

    for (let order of placedBets) {
        if (order.orderType === "SELL" && await activeContract.pendingSells(activeBet, owner, order.outcome) + BigInt(order.amount) > await activeContract.userBets(activeBet, owner, order.outcome)) {
            triggerError("Insufficient owned shares to perform sell order.")
            return;
        }
    }

    triggerProcessing(`Placing order${outcomes.length > 1 ? "s" : ""}`);
    const finalAmounts = amounts.map(a => a.toString());
    const [numerator, denominator] = [1n, 1n];
    const orders = betOrders[activeBet];
    const orderIndexes = placedBets.map(({orderType}) => orders
        .filter(o => o.amount)
        .filter(o => o.orderType !== orderType)
        .filter(o => orderType === "SELL" ? (o.numerator * denominator >= numerator * o.denominator) : (o.numerator * denominator <= numerator * o.denominator))
        .map(o => o.idx));
    console.log(orderIndexes);
    console.log(finalAmounts);

    const filledOrder = await activeContract.fillOrder(finalAmounts, finalAmounts.map(() => 1), finalAmounts.map(() => 1), placedBets.map(o => o.orderType === "BUY" ? 0n : 1n), activeBet, outcomes.map(o => o.outcome), orderIndexes);
    await filledOrder.wait();
    hideMessage();
    placedBets = [];
    await fetchOrders(true);
    renderPlacedBets();
}

async function addFreeBet() {
    try {
        if (placeBetAmount.value && placeBetOutcome.value) {
            addSingleBet({amount: Number(placeBetAmount.value), outcome: placeBetOutcome.value || chooseBetInputs.value, orderType: document.getElementById("choose-bet-position").value.toUpperCase()});
        }
        await placeContractBet();
        queueBuyOrder.style.opacity = 0;
        placeBetInfo.style.display = "none";
        placeBetEntries.innerHTML = "";
    } catch (error) {
        console.error(error);
        clearTimeout(hideMessage());
        triggerError(providerErrorMsg(error));
    }
}

let createdBetChoices = [];

async function addBetChoice() {
    createBetChoice.value ||= "";
    if (!(createBetChoice.value.trim())) {
        return;
    }
    if (!createdBetChoices.includes(createBetChoice.value)) {
        createdBetChoices.push(createBetChoice.value);
    }
    createBetChoicesList.innerHTML = createdBetChoices.map(v => `<li>${v}</li>`).join("");
    createBetChoice.value = "";
}

changeBetType();

async function changeBetType() {

    const betType = createBetSchema.value;
    createBetChoices.style.display = betType === "oo" ? "flex" : "none";

    createBetOo.style.display = ["bc", "oo"].includes(betType) ? "block" : "none";

    [createBetUrl, createBetPath]
        .forEach(elm => [elm.style.display, document.querySelector(`label[for="${elm.id}"]`).style.display] = Array(2).fill(["bc", "oo"].includes(betType) ? "none" : "block"));
    [createBetOo.style.display, document.querySelector(`label[for="${createBetOo.id}"]`).style.display] = Array(2).fill(["bc", "oo"].includes(betType) ? "block" : "none");
    createBetQuery.style.display = ["bc", "oo"].includes(betType) ? "none" : "flex";

    createBetQueryInner.innerHTML = parseBetQuery(createBetSchema.value, createBetUrl.value, createBetPath.value);
    switch (betType) {
        case "json":
            createBetUrl.placeholder = "https://www.therocktrading.com/api/ticker/BTCEUR"
            createBetPath.placeholder = ".result.0.last";
            createBetPathLabel.innerHTML = `Extract outcome from JSON node using <a href='https://github.com/FlowCommunications/JSONPath#expression-syntax' style='text-decoration: underline'>JSONPath</a>`;
            break;
        case "xml":
            createBetUrl.placeholder = "https://www.fueleconomy.gov/ws/rest/fuelprices";
            createBetPath.placeholder = ".fuelPrices.diesel";
            createBetPathLabel.innerHTML = `Extract outcome from XML node using <a href='https://www.w3.org/TR/xpath/' style='text-decoration: underline'>XPath</a> or <a href='https://github.com/martinblech/xmltodict' style='text-decoration: underline'>xmltodict</a>`;
            break;
        case "html":
            createBetUrl.placeholder = "https://www.investing.com/indices/major-indices";
            createBetPath.placeholder = "/html/body/div[1]/div/div/div[2]/main/div[4]/table/tbody/tr[2]/td[3]/text()";
            createBetPathLabel.innerHTML = "Extract outcome from HTML node using <a href='https://www.w3.org/TR/xpath/' style='text-decoration: underline'>XPath</a>";
            break;
    }
    await loadProvider({betType})
}

function providerErrorMsg(error) {
    return `Provider error - ${error.code ? `Code: ${error.code}` : error}`;
}

async function claimReward() {
    try {
        if (await activeBetKind() === "oo") {
            const query = (await activeContract.queryFilter(activeContract.filters.CreatedOptimisticBet(activeBet)))[0].args[1];
            if (!(await activeContract.betRequestTimes(activeBet))) {
                triggerProcessing("Reward will be transferred after bet's been settled.");
                await activeContract.requestBetResolution(activeBet, query);
            } else {
                triggerProcessing("Claming reward");
                await activeContract.claimBet(activeBet, query);
            }
            triggerSuccess("");
        } else {
            await activeContract.claimBet(activeBet);
        }
        await searchBet(activeBet);
    } catch (error) {
        console.error(error);
        triggerError(providerErrorMsg(error));
    }
}

async function decideBet() {
    try {
        triggerProcessing("Settling bet");
        activeContract.decideHumanBet(activeBet, decideBetOutcome.value);
    } catch (error) {
        console.error(error);
        triggerError(providerErrorMsg(error));
    }
}

async function renderBetPool() {
    try {
        const placedBets = await activeContract.queryFilter(activeContract.filters.PlacedBets(null, activeBet));
        const contractPrices = await activeContract.betPools(activeBet);
        marketPrices.innerHTML = ``;
        if (contractPrices) {
            const betChoices = await activeBetChoices();
            const payout = async outcome => (Number(await activeContract.calculateCost(activeBet)) / Number(await activeContract.resultPools(activeBet, outcome)));
            const calcPrices = await Promise.all(betChoices.map(calculatePrice));
            const prices = calcPrices.map(async (p, i) => {
                const outcome = betChoices[i];
                const mktPrice = Math.round(p * 100) / 100;
                const odds = (Math.pow(p, 2) * 100).toFixed(2);
                const pay = (await payout(betChoices[i])).toFixed(2);
                const owned = await activeContract.userBets(activeBet, owner, outcome).then(tokenToNumber).then(Math.round);
                const avgPrice = await activeContract.userTransfers(activeBet, owner, outcome).then(tokenToNumber).then(a => Math.round(Number(a) / owned * 100) / 100);
                return `<tr><td>${outcome}</td><td>${owned || "-"}</td><td>${odds}%</td><td>$${mktPrice}</td><td>${Number.isNaN(avgPrice) ? "-" : ("$" + avgPrice)}</td><td>$${pay}</td></tr>`
            });
            marketPrices.innerHTML = (await Promise.all(prices)).join("");
        }
        const betOutcomes = {};
        placedBets.forEach(pb => {
            pb.args[3].forEach(outcome => {
                betOutcomes[outcome] = (betOutcomes[outcome] || 0) + 1;
            })
        });
        const outcomes = await Promise.all((await activeBetChoices()).map((outcome) => activeContract.resultPools(activeBet, outcome)));
        const outcomesPool = await Promise.all(outcomes.map(async a => await tokenToNumber(a)))
        const selectColor = (number) => `hsl(${number * 137.508},50%,75%)`;
        const data = {
            labels: Object.keys(betOutcomes),
            datasets: [{
                data: outcomesPool.map(a => a.toString()),
                backgroundColor: outcomes.map((_, i) => selectColor(i))
            }]
        };
        const config = {
            type: 'doughnut',
            data,
        };
        aboutBet.innerHTML = `${activeBet}`;
        if (betChart) {
            betChart.destroy();
        }
        betChart = new Chart(betPool, config);
        betPool.style.visibility = "visible";
        betPool.style.opacity = "100%";
    } catch (error) {
        console.error(error);
        triggerError(providerErrorMsg(error));
    }
}