const usdcAddress = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";
let usdc;

const numberToToken = async (n, m) => {
    if (!activeBet && !m) return BigInt(n);
    const betToken = await stateContract.betTokens(activeBet);
    let d = m || await stateContract.tokenDecimals(BigInt(betToken) ? betToken : usdcAddress);
    if (!d) return BigInt(0);
    return BigInt(n) * BigInt(d);
}

const tokenToNumber = async (n, m) => {
    if (!activeBet && !m) return BigInt(n);
    let d = m || await stateContract.tokenDecimals(await stateContract.betTokens(activeBet) || usdcAddress);
    if (!d) return BigInt(0);
    return BigInt(n) / BigInt(d);
}
const claimBet = document.getElementById("claim-bet");
const placeBetInputs = document.getElementById("place-bet-inputs");
const chooseBetInputs = document.getElementById("choose-bet-inputs");
const placeBet = document.getElementById("place-bet");
const scheduleDate = document.getElementById("schedule-date");
const deadlineDate = document.getElementById("deadline-date");
const betId = document.getElementById("create-bet-id");
const betIdLabel = document.getElementById("create-bet-id-label");
const betIdMsg = "Your bet's name is a unique identifier which lets other users search for it. https://gambeth.com/?id={BET_ID} is a quick way to share your bet with the world!";
const decideBetResult = document.getElementById("decide-bet-result");
const betDecision = document.getElementById("bet-decision");
const createBetUrl = document.getElementById("create-bet-url");
const placeBetResult = document.getElementById("place-bet-result");
const placeBetAmount = document.getElementById("place-bet-amount");
const createBetSchema = document.getElementById("create-bet-schema");
const createBetOo = document.getElementById("create-bet-oo");
const createBetPath = document.getElementById("create-bet-path");
const betEntries = document.getElementById("bet-entries");
const betPool = document.getElementById("bet-pool");
const searchBetId = document.getElementById("search-bet");
const poolName = document.getElementById("pool-name");
const message = document.getElementById("message");
const betContainer = document.getElementById("bet-container");
const createBetChoicesList = document.getElementById("create-bet-choices-list");
const placeSingleBet = document.getElementById("place-single-bet");
const placeBetAmountContainer = document.getElementById("place-bet-amount-container");
const placeBetChoiceContainer = document.getElementById("place-bet-choice-container");

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
const createBetQueryResult = document.getElementById("create-bet-query-result");
const createBetQuery = document.getElementById("create-bet-query");
const createBetPathLabel = document.getElementById("create-bet-path-label");
const createBetQueryInner = document.getElementById("create-bet-query-inner");
const innerMessage = document.getElementById("inner-message");
const closeMessage = document.getElementById("close-message");
const newBet = document.getElementById("new-bet");

const sellBet = document.getElementById("sell-bet");

const urlBet = document.getElementById("url-bet");
const ooBet = document.getElementById("oo-bet");
const betInnerInitialPool = document.getElementById("bet-initial-pool");
const betInnerCommission = document.getElementById("bet-commission");
const betInnerTotalPool = document.getElementById("bet-total-pool");
const betQuery = document.getElementById("bet-query");
const betOoQuery = document.getElementById("bet-oo-query");
const betInnerResult = document.getElementById("bet-inner-result");

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
let placedBets = {};
let newBetId = null;
let processing = null;

function searchTriggered(e) {
    if (e.keyCode === 13) {
        searchBet();
    }
}

let provider, signer, stateContract, activeContract, owner;
let providerLoaded = false;


function hideMessage() {
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

function triggerError(msg, after = defaultMessageLocation, click) {
    console.error(msg);
    triggerMessage(msg, "error", ["info", "success"], after, click);
}

function triggerSuccess(msg, callback, after = defaultMessageLocation, delay = 0) {
    console.log(after);
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

const stateContractAddress = "0xC9747E408c9806e37aD5e392b93fb589E5E0FF6d";
const ooContractAddress = "0xa633d7c1a50AD070c41bb4e569c3612adD85e46a";
const provableContractAddress = "0x03Df3D511f18c8F49997d2720d3c33EBCd399e77";
const humanContractAddress = "";
let awaitingApproval = false;

['chainChanged', 'accountsChanged'].forEach(e => window.ethereum.on(e, async () => await loadProvider()));

async function loadProvider({betId = activeBet, betType} = {}) {
    try {
        console.log("Loading provider with ", {betId, betType});
        if (window.ethereum) {
            await window.ethereum.request({method: "eth_requestAccounts"});
        } else {
            clearTimeout(hideMessage());
            triggerError("No Ethereum provider detected, click to install MetaMask", undefined, () => window.location.href = "https://metamask.io/");
            providerLoaded = false;
            return false;
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        if (!gambethStateAbi) throw "ABI not loaded";
        stateContract = new ethers.Contract(stateContractAddress, gambethStateAbi, provider);
        if (stateContract) {
            owner = await signer.getAddress();
            stateContract.on("CreatedBet", async hashedBetId => {
                if (hashedBetId.hash === ethers.id(newBetId || "")) triggerSuccess(`Bet created!`, () => {
                    searchBet(newBetId);
                }, undefined, 2500)
            });
            stateContract.on("PlacedBets", async (sender) => {
                if (sender === owner) triggerSuccess(`Bet placed!`, renderBetPool)
            });
            stateContract.on("LostBet", async (sender) => {
                if (sender === owner) triggerSuccess("Bet lost, better luck next time!")
            });
            stateContract.on("UnwonBet", async (sender) => {
                if (sender === owner) triggerSuccess("No one won the bet, you've been refunded")
            });
            stateContract.on("WonBet", async (sender, amount) => {
                console.log("Won bet with", amount + " reward");
                if (sender === owner) triggerSuccess(`Bet won! ${await tokenToNumber(amount.toString())} USDC transferred to account`)
            });
            fixedCommission = await tokenToNumber(0);
        }

        if (betId) {
            const betKind = await stateContract.betKinds(betId);
            console.log("Bet kind", betKind, betKind === 0n);
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

        providerLoaded = true;

        usdc = new ethers.Contract(usdcAddress, tokenAbi, provider).connect(await provider.getSigner());
        let allowance = await usdc.allowance(owner, stateContractAddress);
        console.log("Allowance", allowance);
        if (allowance === 0n && !awaitingApproval) {
            try {
                awaitingApproval = true;
                await usdc.approve(stateContractAddress, 999999999999);
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

window.onload = () => {
    let betId = new URL(window.location).searchParams.get("id");
    if (betId) {
        searchBet(betId);
    } else if (betId) {
        console.log(betId);
        betId = betId.toLowerCase().trim();
        searchBet(betId);
    }
}

async function resetButtons() {
    placeBetInputs.style.display = "none";
    [claimBet, placeBet, betPool].forEach((elm) => {
        elm.style.opacity = 0;
        elm.style.visibility = "hidden";
    });
}

function renderPlaceSingleBet() {
    const filledBet = (placeBetResult.value && placeBetAmount.value) || (chooseBetInputs.style.display !== "none");
    placeSingleBet.onclick = filledBet ? () => {
        addSingleBet(placeBetResult.value || chooseBetInputs.value, placeBetAmount.value);
        renderPlaceSingleBet();
    } : "";
    placeSingleBet.style.cursor = filledBet ? "pointer" : "default";
    placeSingleBet.style.opacity = filledBet ? "1" : "0";
}

renderPlaceSingleBet();

async function renderClaimBet() {
    const addr = await signer.getAddress();
    const finishedBet = await activeContract.finishedBets(activeBet);
    const result = await activeContract.getResult(activeBet);
    const resolutionRequested = BigInt(await activeContract.betRequester(activeBet)) !== 0n;
    const scheduleReached = await stateContract.betSchedules(activeBet) * BigInt(1000) < BigInt(new Date().getTime());
    let showClaim = finishedBet || (!resolutionRequested && scheduleReached) || (resolutionRequested && !finishedBet);
    showClaim &&= !result.length ? true : await stateContract.userBets(activeBet, addr, result) !== 0n;
    if (!showClaim) {
        claimBet.style.display = "none";
        claimBet.style.visibility = "hidden";
        claimBet.style.opacity = "0";
    } else {
        claimBet.style.display = "block";
        claimBet.style.visibility = "visible";
        claimBet.style.opacity = "100%";
    }
    const claimedBet = await stateContract.claimedBets(activeBet, addr);
    claimBet.innerHTML = claimedBet
        ? "Claimed"
        : resolutionRequested
            ? (finishedBet ? "Claim" : "Settling")
            : "Settle";
    const disableLink = ["Claimed", "Settling"].includes(claimBet.innerHTML);
    claimBet.classList.remove(disableLink ? "link" : null);
    claimBet.classList.add(!disableLink ? "link" : null);
    console.log(claimBet.innerHTML);
    claimBet.disabled = claimBet.innerHTML === "Claimed" || claimBet.innerHTML === "Settling";
    claimBet.style.cursor = claimBet.disabled ? "initial" : "pointer";
}

async function activeBetKind() {
    switch (await stateContract.betKinds(activeBet)) {
        case 0n:
            return "oo";
        case 1n:
            return "human";
        case 2n:
            return "provable";
    }
}

async function activeBetChoices() {
    const results = [];
    let i = 0;
    while (true) {
        let result = await activeContract.betChoices(activeBet, BigInt(i++));
        if (!result) return results;
        results.push(result);
    }
}

async function renderPlaceBet() {

    const deadline = await stateContract.betDeadlines(activeBet) * BigInt(1000);
    const lockedPool = deadline <= Math.round(new Date().getTime());
    const schedule = await stateContract.betSchedules(activeBet) * BigInt(1000);
    const scheduleReached = schedule <= Math.round(new Date().getTime());
    const betKind = await activeBetKind();

    betDecision.style.display = betKind === "human"
        ? ((lockedPool && await stateContract.betOwners(activeBet) === owner) ? "block" : "none")
        : "none";

    placeBet.style.visibility = "visible";
    placeBet.style.opacity = "100%";
    placeBet.innerHTML = lockedPool ? (scheduleReached ? "Finished" : "Buy") : "Place";
    placeBet.disabled = scheduleReached;

    placeBetInputs.style.display = lockedPool ? "none" : "flex";
    placeBetInputs.style.opacity = lockedPool ? 0 : "100%";
    placeBetInputs.style.visibility = lockedPool ? "hidden" : "visible";

    placeBetAmountContainer.style.display = scheduleReached ? "none" : "block";
    placeBetChoiceContainer.style.display = scheduleReached ? "none" : "block";
    placeSingleBet.style.display = scheduleReached ? "none" : "block";
    sellBet.style.display = scheduleReached ? "none" : "block";

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

async function searchBet(betId = activeBet) {
    try {
        await loadProvider({betId});
        placedBets = {};
        newBet.style.display = "none";
        await resetButtons();
        triggerProcessing("Fetching bet");
        betContainer.style.opacity = "0";
        betContainer.style.visibility = "hidden";
        console.log(betId, searchBetId.value);
        activeBet = !betId && !searchBetId.value ? activeBet : betId;
        console.log(activeBet);
        const betExists = await stateContract.createdBets(activeBet);
        if (!betExists) {
            betContainer.style.display = "none";
            triggerError("Invalid Bet ID");
            return;
        }
        const location = new URL(window.location.toString());
        location.searchParams.set("id", activeBet);
        history.pushState({}, "", location.toString());
        betContainer.style.display = "flex";
        const bets = await stateContract.queryFilter(stateContract.filters.CreatedBet(activeBet));
        const createdFilter = bets[0];
        const [initialPool, query] = createdFilter.args.slice(1).map(arg => arg.toString());
        const {url, schema, path} = unpackQuery(query);

        ooBet.style.display = schema ? "none" : "flex";
        urlBet.style.display = schema ? "flex" : "none";
        (schema ? betQuery : betOoQuery).innerHTML = query;
        urlSchema.innerHTML = schema || "Unknown";
        betUrl.innerHTML = url || query;
        schemaPath.innerHTML = path || "Unknown";
        let deadline = await stateContract.betDeadlines(activeBet) * BigInt(1000);
        deadline = new Date(Number(deadline.toString()));
        betDeadline.innerHTML = deadline.toISOString().replace("T", " ").split(".")[0].slice(0, -3);
        let schedule = await stateContract.betSchedules(activeBet) * BigInt(1000);
        schedule = new Date(Number(schedule.toString()));
        betSchedule.innerHTML = schedule.toISOString().replace("T", " ").split(".")[0].slice(0, -3);
        console.log("Active bet", activeBet);
        let result = await activeContract.getResult(activeBet);
        let symbol = await usdc.symbol();
        betInnerInitialPool.innerHTML = (await tokenToNumber(initialPool)).toString() + " " + symbol;
        betInnerTotalPool.innerHTML = (await tokenToNumber((await stateContract.betPools(activeBet)))).toString() + " " + symbol;
        const innerCommission = Number(await stateContract.betCommissions(activeBet)) / Number(await stateContract.betCommissionDenominator(activeBet));
        betInnerCommission.innerHTML = Number.parseFloat(innerCommission) + "%";
        betInnerResult.innerHTML = result || "Unresolved";
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
        // if (!(await loadProvider({betType: createBetSchema.value}))) return;
        console.log("Provider loaded successfully");
        betContainer.style.display = "none";
        // await resetButtons();
        clearTimeout(hideMessage());

        const schema = createBetSchema.value;
        let query = createBetOo.value;
        const schedule = Date.parse(`${scheduleDate.value}`) / 1000;
        const deadline = Date.parse(`${deadlineDate.value}`) / 1000;
        let commission = Number(createBetCommission.value || 0).toString();
        let exponent = commission.includes(".") ? commission.length - commission.indexOf(".") : 0;
        commission = commission.replace(".", "");
        let commissionDenominator = exponent ? Math.pow(10, exponent - 1) : 1;
        console.log(commission, exponent, commissionDenominator);

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
        } else if (await stateContract.createdBets(betId.value)) {
            triggerError("Bet ID already exists", createBetQuery, () => renderCreationStep(0));
            return;
        }
        console.log("No exceptions");
        activeBet = betId.value.toLowerCase().trim();
        newBetId = activeBet;
        const initialPool = await numberToToken(createBetInitialPool.value || "0");
        console.log("Initial pool", initialPool);
        let prices = [];
        try {
            prices = (await Promise.all(["URL", "OoAlpha"].map(stateContract.lastQueryPrice))).map(tokenToNumber);
        } catch (error) {
            prices = [];
        }
        console.log("Prices", prices);
        const oracleFund = prices[1] > prices[0] ? prices[1] : prices[0];
        console.log(schedule);
        const value = !oracleFund ? undefined : (await numberToToken(oracleFund) * (await stateContract.oracleMultiplier(schedule)));
        console.log("Oracle fund: ", value);
        triggerProcessing("Creating bet", createBetQueryResult);
        const results = createBetChoicesList.innerHTML
            .replaceAll("<li>", "\n")
            .replaceAll("</li>", "")
            .split("\n")
            .filter(e => e);
        if (results.length) {
            query += " Choose " + results.map((choice, idx) => `${idx} for ${choice}, `).join("");
            query = query.slice(0, query.length - 2);
            query += `. Choose ${results.length} if the question can't be answered at the current time or if none of the previous options are correct.`
        }
        console.log("Bet results/query", results, query);
        switch (schema) {
            case "bc":
                await activeContract.createHumanBet("0x07865c6E87B9F70255377e024ace6630C1Eaa37F", activeBet, deadline, schedule, commissionDenominator, commission, initialPool, query);
                break;
            case "oo":
                console.log(activeBet, deadline, schedule, commissionDenominator, commission, initialPool, results, query);
                await activeContract.createOptimisticBet("0x07865c6E87B9F70255377e024ace6630C1Eaa37F", activeBet, deadline, schedule, commissionDenominator, commission, initialPool, results, query);
                break;
        }
    } catch (error) {
        newBetId = null;
        console.error(error);
        triggerError(providerErrorMsg(error), createBetQuery);
    }
}

async function renderPlacedBets() {
    placeBetInfo.style.display = Object.keys(placedBets).length ? "block" : "none";
    console.log(placedBets);
    placeBetEntries.innerHTML = `
        ${Object.entries(placedBets).map(([k, v]) => `<tr><td onclick="delete placedBets['${k}']; renderPlacedBets()">✖</td><td>${k}</td><td>${BigInt(v) - fixedCommission}</td></tr>`).join("")}
    `;
}

function addSingleBet(result, amount) {
    placedBets[result] = parseFloat(amount) + (placedBets[result] || 0);
    renderPlacedBets();
    placeBetAmount.value = "";
    placeBetResult.value = "";
}

async function buyBet() {
    if (await activeBetKind() === "oo") {
        console.log(chooseBetInputs.value);
        await fillOrder("BUY");
    } else {
        await addFreeBet();
    }
}

async function fillOrder(orderType) {
    const results = Object.keys(placedBets).filter(pb => pb);
    const amounts = await Promise.all(results.map(r => placedBets[r]).map(a => a.toString()).map(numberToToken));
    const sum = amounts.reduce((acc, b) => acc + b, BigInt(0));
    if (!results.length || !amounts.length) {
        triggerError("No bets have been placed, make sure result and amount fields are not empty.")
        return;
    }
    for (let i = 0; i < results.length; i++) {
        if (orderType === "SELL" && await stateContract.pendingSells(activeBet, owner, results[i]) + amounts[i] > await stateContract.userBets(activeBet, owner, results[i])) {
            triggerError("Sell value exceeded.")
            return;
        }
    }

    triggerProcessing("Placing order" + (results.length > 1 ? "s" : ""));
    console.log(results, amounts.map(a => a.toString()), sum);
    const finalAmounts = amounts.map(a => a.toString());
    const [numerator, denominator] = [1n, 1n];
    const orders = (await stateContract.getOrders(activeBet, 0, 100))
        .map(a => Array.from(a))
        .map((o, idx) => ({
            orderType: o[0] ? "SELL" : "BUY",
            numerator: o[1],
            denominator: o[2],
            result: o[3],
            amount: o[4],
            user: o[5],
            idx
        }));
    const orderIndexes = orders
        .filter(o => o.amount)
        .filter(o => o.orderType !== orderType)
        .filter(o => orderType === "SELL" ? (o.numerator * denominator >= numerator * o.denominator) : (o.numerator * denominator <= numerator * o.denominator))
        .map(o => o.idx);
    console.log(orderIndexes.map(i => orders[i]));
    await activeContract.fillOrder(finalAmounts, finalAmounts.map(() => 1), finalAmounts.map(() => 1), [orderType === "BUY" ? 0n : 1n], activeBet, results, [orderIndexes]);
    placedBets = {};
    await renderPlacedBets();
}

async function addFreeBet() {
    try {
        if (placeBetAmount.value && placeBetResult.value) {
            addSingleBet(placeBetResult.value, placeBetAmount.value);
        }
        await placeContractBet();
        placeSingleBet.style.opacity = 0;
        placeBetInfo.style.display = "none";
        placeBetEntries.innerHTML = "";
    } catch (error) {
        console.error(error);
        clearTimeout(hideMessage());
        triggerError(providerErrorMsg(error));
    }
}

async function addBetChoice() {
    console.log("Adding bet");
    createBetChoice.value ||= "";
    if (!(createBetChoice.value.trim()) || createBetChoicesList.innerHTML.toLowerCase().includes(createBetChoice.value.toLowerCase())) {
        return;
    }
    createBetChoicesList.innerHTML += `<li>${createBetChoice.value}</li>`
    createBetChoice.value = "";
}

changeBetType();

async function changeBetType() {
    console.log("Changing bet type");

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
            createBetPathLabel.innerHTML = `Extract result from JSON node using <a href='https://github.com/FlowCommunications/JSONPath#expression-syntax' style='text-decoration: underline'>JSONPath</a>`;
            break;
        case "xml":
            createBetUrl.placeholder = "https://www.fueleconomy.gov/ws/rest/fuelprices";
            createBetPath.placeholder = ".fuelPrices.diesel";
            createBetPathLabel.innerHTML = `Extract result from XML node using <a href='https://www.w3.org/TR/xpath/' style='text-decoration: underline'>XPath</a> or <a href='https://github.com/martinblech/xmltodict' style='text-decoration: underline'>xmltodict</a>`;
            break;
        case "html":
            createBetUrl.placeholder = "https://www.investing.com/indices/major-indices";
            createBetPath.placeholder = "/html/body/div[1]/div/div/div[2]/main/div[4]/table/tbody/tr[2]/td[3]/text()";
            createBetPathLabel.innerHTML = "Extract result from HTML node using <a href='https://www.w3.org/TR/xpath/' style='text-decoration: underline'>XPath</a>";
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
        activeContract.decideHumanBet(activeBet, decideBetResult.value);
    } catch (error) {
        console.error(error);
        triggerError(providerErrorMsg(error));
    }
}

async function renderBetPool() {
    try {
        const placedBets = await stateContract.queryFilter(stateContract.filters.PlacedBets(null, activeBet));
        const betResults = {};
        placedBets.forEach(pb => {
            pb.args[3].forEach(result => {
                betResults[result] = (betResults[result] || 0) + 1;
            })
        });
        const results = await Promise.all(Object.keys(betResults).map((result) => stateContract.resultPools(activeBet, result)));
        const resultsPool = {};
        await Promise.all(Object.keys(betResults).map(async (result, idx) => {
            resultsPool[result] = await tokenToNumber(results[idx]);
        }))

        const allEntries = Object.entries(betResults);

        allEntries.sort((a, b) => resultsPool[b[0]] < resultsPool[a[0]] ? -1 : 1);
        const entries = allEntries
            .map(([k, v]) => `<tr style="background-color: #fd9243"><td>${k}</td><td>${(resultsPool[k])}</td></tr>`)
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
