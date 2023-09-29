const usdcAddress = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";
const ooContractAddress = "0x23F7d4552675424C6D39A7007e68066686E091ad";
const provableContractAddress = "0x03Df3D511f18c8F49997d2720d3c33EBCd399e77";
const humanContractAddress = "";

let usdc;
let betChart = null;

const numberToToken = async n => {
    if (!activeBet) return BigInt(n) * BigInt(1e6);
    let d = await activeContract.tokenDecimals(await activeContract.betTokens(activeBet));
    return BigInt(n) * BigInt(d);
}

const tokenToNumber = async n => {
    if (!activeBet) return (Number(n) / 1e6).toFixed(3);
    let d = await activeContract.tokenDecimals(await activeContract.betTokens(activeBet));
    return (Number(n) / Number(d)).toFixed(3);
}

// TODO: Group elements into separate categories
const exploreMarkets = document.getElementById("explore-markets");
const createBetTotalCost = document.getElementById("create-bet-total-cost");
const createBetMinimumPool = document.getElementById("create-bet-minimum-pool");
const approveToken = document.getElementById("token-wallet");
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
const betIdMsg = "Your market's ID is a unique identifier which allows other users to search for it. <br><br> https://gambeth.com/?id={MARKET_ID}";
const decideBetOutcome = document.getElementById("decide-bet-outcome");
const betDecision = document.getElementById("bet-decision");
const createBetUrl = document.getElementById("create-bet-url");
const placeBetOutcome = document.getElementById("place-bet-outcome");
const placeBetAmount = document.getElementById("place-bet-amount");
const placeBetPrice = document.getElementById("place-bet-price");
const createBetSchema = document.getElementById("create-bet-schema");
const createBetOo = document.getElementById("create-bet-oo");
const createBetOoTitle = document.getElementById("create-bet-oo-title");
const createBetPath = document.getElementById("create-bet-path");
const marketPrices = document.getElementById("market-prices");
const marketPricesTable = document.getElementById("market-prices-table");
const betPool = document.getElementById("bet-pool");
const userBuyOrdersEntries = document.getElementById("user-buy-orders-entries");
const userSellOrdersEntries = document.getElementById("user-sell-orders-entries");
const poolBuyOrdersEntries = document.getElementById("pool-buy-orders-entries");
const poolSellOrdersEntries = document.getElementById("pool-sell-orders-entries");
const searchBetId = document.getElementById("search-bet");
const message = document.getElementById("message");
const betContainer = document.getElementById("bet-container");
const createmarketOutcomeList = document.getElementById("create-bet-choices-list");
const queueBuyOrder = document.getElementById("queue-buy-order");
const placeBetDataContainer = document.getElementById("place-bet-data-container");
const placeBetChoiceContainer = document.getElementById("place-bet-choice-container");
const placeBetPositionContainer = document.getElementById("place-bet-position-container");
const createBetInitialPool = document.getElementById("create-bet-initial-pool");
const createBetCommission = document.getElementById("create-bet-commission");
const createmarketOutcome = document.getElementById("create-bet-choices");
const createBetChoice = document.getElementById("create-bet-choice");
const createBetOdds = document.getElementById("create-bet-odds");
const createBetOddsList = document.getElementById("create-bet-odds-list");
const placeBetInfo = document.getElementById("place-bet-info");
const placeBetBids = document.getElementById("place-bet-bids");
const placeBetBidsTable = document.getElementById("place-bet-bids-table");
const placeBetAsks = document.getElementById("place-bet-asks");
const placeBetAsksTable = document.getElementById("place-bet-asks-table");
const betUrl = document.getElementById("bet-url");
const betDeadline = document.getElementById("bet-deadline");
const betSchedule = document.getElementById("bet-schedule");
const urlSchema = document.getElementById("bet-schema");
const schemaPath = document.getElementById("bet-path");
const defaultMessageLocation = document.getElementById("default-message-location");
const createBetQuery = document.getElementById("create-bet-query");
const createBetPathLabel = document.getElementById("create-bet-path-label");
const createBetQueryInner = document.getElementById("create-bet-query-inner");
const innerMessage = document.getElementById("inner-message");
const closeMessage = document.getElementById("close-message");
const newBet = document.getElementById("new-bet");
const urlBet = document.getElementById("url-bet");
const ooBet = document.getElementById("oo-bet");
const betInnerCommission = document.getElementById("bet-commission");
const betQuery = document.getElementById("bet-query");
const betOoQuery = document.getElementById("bet-oo-query");
const betInnerOutcome = document.getElementById("bet-inner-outcome");
const updateOrdersBtn = document.getElementById("update-orders");

const renderBetIdShare = () => {
    betId.type = "text";
    betIdLabel.innerHTML = betIdMsg.replace("{MARKET_ID}", betId.value.trim() || "{MARKET_ID}")
}

function renderCostMessages() {
    const ratios = createdMarketOutcome.map(outcome => document.querySelector(`#create-market-${outcome.replaceAll(" ", "-")}`).value).map(Number).filter(v => v);
    const minShares = !Math.min(...ratios) ? 0 : Math.ceil(100 / Math.min(...ratios));
    createBetMinimumPool.innerHTML = `The market must be bootstrapped with at least ${minShares} initial shares.`;
    createBetInitialPool.value = minShares;
    createBetTotalCost.innerHTML = (5 + Math.sqrt(
            ratios.map(v => (createBetInitialPool.value / 100 * v) ** 2).reduce((a, b) => a + b), 0)
    ).toFixed(2) + " USDC";
}

const closeCreateMarket = () => {
    newBet.style.display = 'none';
}

let fixedCommission = null;

let currentStep = 0;
const steps = Array.from(document.getElementsByClassName("create-bet-step"));

const createMarket = async () => {
    // betContainer.style.display = 'none';
    newBet.style.display = 'flex';
    window.scrollTo({top: 0, behavior: "smooth"})
    createBetSchema.selectedIndex = 0;
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

function searchTriggered(e) {
    if (e.keyCode === 13) {
        searchBet(searchBetId.value);
    }
}

let provider, signer, activeContract, owner;
let providerLoaded = false;


function hideMessage() {
    message.style.opacity = "0";
    message.style.visibility = "hidden";
}

function triggerMessage(msg, add, remove, after = defaultMessageLocation, click, showClose = true) {
    after.append(message);
    message.classList.add(add);
    remove.forEach((r) => message.classList.remove(r));
    closeMessage.style.display = showClose ? "block" : "none";
    message.style.visibility = "visible";
    message.onclick = () => {
        if (click) {
            click();
            hideMessage();
            window.scrollTo({top: 0, behavior: "smooth"});
        }
    }
    message.style.cursor = click ? "pointer" : "default";
    message.style.display = "flex";
    message.style.opacity = "100%";
    innerMessage.innerHTML = msg;
}

function addIntervalText(elm, innerHtmlText, interval) {
    return setInterval(() => {
        elm.innerHTML = innerHtmlText(elm.innerHTML);
    });
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
    innerMessage.innerHTML = msg + `<div style='transform: scale(0.5)' class='lds-dual-ring'></div>`;
}

let awaitingApproval = false;
const loadChain = async () => {
    let eth = (window.ethereum || {request: () => null, on: () => null});
    ['chainChanged', 'accountsChanged'].forEach(e => eth.on(e, () => {
        loadProvider();
    }));
    await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{chainId: "0x5"}]
    });
}
loadChain();


async function loadProvider({
                                betId = activeBet || new URL(window.location).searchParams.get("id"),
                                betType = "oo"
                            } = {}) {
    try {
        if (window.ethereum) {
            await window.ethereum.request({method: "eth_requestAccounts"});
        } else {
            clearTimeout();
            triggerError("No Ethereum provider detected, click to install MetaMask", undefined, () => window.location.href = "https://metamask.io/");
            providerLoaded = false;
            return false;
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        const {chainId} = await provider.getNetwork();
        if (chainId !== 5n) {
            clearTimeout();
            triggerError("Please switch to Goerli tesnet", undefined, loadChain);
            providerLoaded = false;
            return false;
        }
        signer = await provider.getSigner();
        if (!gambethStateAbi) throw "ABI not loaded";

        if (betId && activeContract) {
            const betKind = await activeContract.betKinds(betId);
            switch (betKind) {
                case 0n:
                    activeContract = new ethers.Contract(ooContractAddress, ooAbi, provider).connect(signer);
                    break;
                case 1n:
                    activeContract = new ethers.Contract(humanContractAddress, [], provider).connect(signer);
                    break;
            }
        } else if (betType) {
            switch (betType) {
                case "oo":
                    activeContract = new ethers.Contract(ooContractAddress, ooAbi, provider).connect(signer);
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
            if (betId) {
                await loadProvider();
            }
        }

        if (activeContract) {
            owner = await signer.getAddress();
            activeContract.on("CreatedBet", async hashedBetId => {
                if (hashedBetId.hash === ethers.id(newBetId || "")) triggerSuccess(`Market created!`, () => {
                    searchBet(newBetId);
                }, undefined, 2500)
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
            activeBet = betId;
            await Promise.all([renderBetPool(), fetchOrders(true)]);
        }
        await renderWallet();
        providerLoaded = true;
        return true;
    } catch (error) {
        console.error(error);
        triggerError("Error while loading Ethereum provider: " + (error.code || error) + (error.code === "CALL_EXCEPTION" ? ". Switch to Goerli testnet" : ""));
        providerLoaded = false;
        return false;
    }
}

loadProvider();

window.onload = () => searchBet((new URL(window.location).searchParams.get("id") || "").toLowerCase().trim());

async function renderWallet() {
    usdc = new ethers.Contract(usdcAddress, tokenAbi, provider).connect(await provider.getSigner());
    const balance = await usdc.balanceOf(owner);
    approveToken.onclick = async () => {
        if (awaitingApproval) {
            return;
        }
        try {
            awaitingApproval = true;
            await usdc.approve(ooContractAddress, balance).then(tx => tx.wait());
            await renderWallet();
        } catch (error) {
            triggerError(error);
        }
        awaitingApproval = false;
    }
    const allowance = await usdc.allowance(owner, ooContractAddress);
    const wallet = balance > allowance ? allowance : balance;
    approveToken.innerHTML = wallet === 0n ? "Approve" : ("$" + await tokenToNumber(wallet).then(Number));
}

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
        addSingleBet({
            amount: Number(placeBetAmount.value),
            outcome: placeBetOutcome.value || chooseBetInputs.value,
            orderPosition: (Array.from(chooseBetPosition.querySelectorAll(".choose-bet-position-option")).filter(e => e.checked)[0] || {value: ""}).value.toUpperCase()
        });
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
    const scheduleReached = await activeContract.marketDeadline(activeBet) * BigInt(1000) < BigInt(new Date().getTime());
    let showClaim = finishedBet || (!resolutionRequested && scheduleReached) || (resolutionRequested && !finishedBet);
    showClaim &&= !outcome.length ? true : await activeContract.userPools(activeBet, addr, outcome) !== 0n;
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
            ? (finishedBet ? "Claim" : "")
            : "Settle";
    const disableLink = ["Claimed", ""].includes(claimBet.innerHTML);
    claimBet.classList.remove(disableLink ? "link" : null);
    claimBet.classList.add(!disableLink ? "link" : null);
    claimBet.disabled = claimBet.innerHTML === "Claimed" || claimBet.innerHTML === "Settling";
    claimBet.style.cursor = claimBet.disabled ? "initial" : "pointer";
}

async function activeBetKind() {
    switch (await activeContract.betKinds(activeBet || "")) {
        case 0n:
            return "oo";
        case 1n:
            return "human";
        case 2n:
            return "provable";
    }
}

async function activeBetOutcomes() {
    return await activeContract.getOutcomes(activeBet || "");
}

async function renderPlaceBet() {

    const deadline = await activeContract.marketLockout(activeBet) * BigInt(1000);
    const lockedPool = deadline <= Math.round(new Date().getTime());
    const schedule = await activeContract.marketDeadline(activeBet) * BigInt(1000);
    const scheduleReached = schedule <= Math.round(new Date().getTime());
    const betKind = await activeBetKind();

    betDecision.style.display = betKind === "human"
        ? ((lockedPool && await activeContract.betOwners(activeBet) === owner) ? "block" : "none")
        : "none";

    placeBet.style.visibility = "visible";
    placeBet.style.opacity = "100%";
    placeBet.innerHTML = lockedPool ? (scheduleReached ? "" : "Limit order") : "Place Orders";
    placeBet.classList.remove(scheduleReached ? "link" : null);
    placeBet.classList.add(!scheduleReached ? "link" : null);
    placeBet.disabled = scheduleReached;

    placeBetInputs.style.display = lockedPool ? "none" : "flex";
    placeBetInputs.style.opacity = lockedPool ? 0 : "100%";
    placeBetInputs.style.visibility = lockedPool ? "hidden" : "visible";

    placeBetDataContainer.style.display = scheduleReached ? "none" : "flex";
    placeBetChoiceContainer.style.display = scheduleReached ? "none" : "flex";
    placeBetPositionContainer.style.display = scheduleReached ? "none" : "flex";
    queueBuyOrder.style.display = scheduleReached ? "none" : "block";

    if (betKind === "oo") {
        placeBetInputs.style.display = "none";
        chooseBetInputs.style.display = "block";
        chooseBetInputs.innerHTML = (await activeBetOutcomes())
            .map(choice => `<option value="${choice}">${choice}</option>`)
            .join("");
    } else {
        placeBetInputs.style.display = "block";
        chooseBetInputs.style.display = "none";
    }

}

async function calculateCost(newBets, bids) {
    if (!newBets.length) {
        return null;
    }

    const outcomes = await activeBetOutcomes();
    const pools = await Promise.all(outcomes.map(o => activeContract.resultPools(activeBet, o).then(Number)));
    const transfers = await Promise.all(outcomes.map(o => activeContract.resultTransfers(activeBet, o).then(tokenToNumber).then(Number)));

    const limitCost = (await Promise.all(newBets
        .filter(b => b.pricePerShare !== 0)
        .map(async ({pricePerShare, amount}) => Number(pricePerShare) / await activeDecimals() * Number(amount))))
        .reduce((a, b) => a + b, 0);

    const previousCost = await activeContract.calculateCost(activeBet).then(async a => Number(a) / await activeDecimals());

    const newCost = outcomes.map(outcome => {
        let newCost = Math.sqrt(pools
            .map((pool, o) => (
                (pool + newBets.filter(b => b.pricePerShare === 0 && b.outcome === outcome && outcomes[o] === outcome)
                    .map(({amount}) => amount)
                    .reduce((a, b) => a + b, 0) * (bids ? 1 : -1)) ** 2
            )).reduce((a, b) => a + b, 0)
        );
        const totalCost = Math.abs(newCost - previousCost);
        const transfer = transfers[outcomes.indexOf(outcome)];
        return bids ? totalCost : transfer > totalCost ? totalCost : transfer;
    }).reduce((a, b) => a + b, 0);
    let payout = Math.sqrt(pools
        .map((pool, o) => (
            (pool + newBets.filter(b => b.outcome === outcomes[o])
                .map(({amount}) => Number(amount))
                .reduce((a, b) => a + b, 0) * (bids ? 1 : -1)) ** 2
        )).reduce((a, b) => a + b, 0)
    );
    const payouts = outcomes.map((o, i) => ({[o]: payout / (newBets.filter(({outcome}) => outcome === o).map(({amount}) => Number(amount)).reduce((a, b) => a + b, 0) * (bids ? 1 : -1) + pools[i])}));
    return {
        payout: Object.assign({}, ...payouts),
        cost: limitCost + newCost
    };
}

async function calculatePrice(result) {
    return Number(await activeContract.resultPools(activeBet, result)) / Number(await activeContract.calculateCost(activeBet).then(async a => Number(a) / await activeDecimals()));
}

async function browseMarkets() {
    exploreMarkets.innerHTML = (await activeContract.queryFilter(activeContract.filters.CreatedOptimisticBet(activeBet)))
        .map(e => [e.args[e.args.length - 4], e.args[e.args.length - 3]])
        .map(([id, name]) => `<a href="/?id=${id}">${name}</a>`)
        .join("");
    window.scrollTo({top: 0, behavior: "smooth"});
}

async function searchBet(betId = activeBet) {
    if (!betId) {
        return;
    }
    try {
        triggerProcessing("Loading market");

        if (!(await loadProvider({betId}))) {
            return;
        }
        placedBets = [];
        await Promise.all([renderPlacedBets(), fetchOrders(true), resetButtons()]);
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
        const query = createdFilter.args.slice(1).map(arg => arg.toString())[1];
        const {url, schema, path} = unpackQuery(query);

        ooBet.style.display = schema ? "none" : "flex";
        urlBet.style.display = schema ? "flex" : "none";
        (schema ? betQuery : betOoQuery).innerHTML = query;
        urlSchema.innerHTML = schema || "Unknown";
        betUrl.innerHTML = url || query;
        schemaPath.innerHTML = path || "Unknown";
        let deadline = await activeContract.marketLockout(activeBet) * BigInt(1000);
        deadline = new Date(Number(deadline.toString()));
        betDeadline.innerHTML = deadline.toISOString().replace("T", " ").split(".")[0].slice(0, -3) + " UTC";
        let schedule = await activeContract.marketDeadline(activeBet) * BigInt(1000);
        schedule = new Date(Number(schedule.toString()));
        betSchedule.innerHTML = schedule.toISOString().replace("T", " ").split(".")[0].slice(0, -3) + " UTC";
        let outcome = await activeContract.getResult(activeBet);
        const innerCommission = Number(await activeContract.betCommissions(activeBet)) / Number(await activeContract.betCommissionDenominator(activeBet)) * 100;
        betInnerCommission.innerHTML = Number.parseFloat(innerCommission) + "%";
        betInnerOutcome.innerHTML = outcome || "Unresolved";
        Promise.all([renderPlaceBet(), renderClaimBet(), renderBetPool()]).then(() => {
            hideMessage();
            betContainer.style.opacity = "100%";
            betContainer.style.visibility = "visible";
        });
        await fetchOrders(true);
    } catch (error) {
        betContainer.style.display = "none";
        console.error(error);
        triggerError(providerErrorMsg(error));
    }
    searchBetId.value = "";
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
        hideMessage();
        clearTimeout();
        const schema = createBetSchema.value;
        const query = createBetOo.value;
        const title = createBetOoTitle.value;
        const schedule = Date.parse(`${scheduleDate.value}`) / 1000;
        const deadline = Date.parse(`${deadlineDate.value}`) / 1000;
        let commission = Number(createBetCommission.value || 0).toString();
        let exponent = commission.includes(".") ? commission.length - commission.indexOf(".") : 0;
        commission = commission.replace(".", "");
        let commissionDenominator = exponent ? Math.pow(10, exponent - 1) : 100;
        const odds = Array.from(createBetOdds.getElementsByTagName("input")).map(e => Number(e.value || 0));
        activeBet = (betId.value || "").toLowerCase().trim();
        newBetId = activeBet;
        const initialPool = createBetInitialPool.value || "0";
        const outcomes = createdMarketOutcome;
        triggerProcessing("Creating market");
        if (!window.ethereum) {
            triggerError("No Ethereum provider detected", undefined, () => window.location.href = "https://metamask.io/");
            return;
        } else if (await usdc.allowance(owner, ooContractAddress) === 0n) {
            triggerError(`Please approve a minimum of ${createBetTotalCost.innerHTML || "0 USDC"}  to create your market.`, undefined, async () => await usdc.approve(ooContractAddress, Number(createBetTotalCost.innerHTML.split(" USDC")[0]) || await usdc.balanceOf(owner)));
            return;
        } else if (!betId.value.trim()) {
            triggerError("No bet ID submitted", undefined, () => renderCreationStep(0));
            return;
        } else if (!deadline || !schedule) {
            triggerError("Need to specify both deadline and scheduled execution", undefined, () => renderCreationStep(7));
            return;
        } else if (deadline > schedule) {
            triggerError("Bet's deadline to enter can't be set after scheduled time to run", undefined, () => renderCreationStep(7));
            return;
        } else if (deadline < Date.parse(new Date()) / 1000) {
            triggerError("Bet's deadline to enter needs to be a future date", undefined, () => renderCreationStep(7));
            return;
        } else if (odds.reduce((a, b) => a + b, 0) !== 100) {
            triggerError("Outcome odds must add up to 100", undefined, () => renderCreationStep(3));
            return;
        } else if (isNaN(Number.parseFloat(commission)) || commission > 50) {
            triggerError("Commission should be a number between 0 and 50", undefined, () => renderCreationStep(4));
            return;
        } else if (await activeContract.createdBets(betId.value)) {
            triggerError("Bet ID already exists", undefined, () => renderCreationStep(0));
            return;
        }
        switch (schema) {
            case "bc":
                await activeContract.createHumanBet("0x07865c6E87B9F70255377e024ace6630C1Eaa37F", activeBet, deadline, schedule, commissionDenominator, commission, initialPool, query).then(tx => tx.wait());
                break;
            case "oo":
                await activeContract.createOptimisticBet("0x07865c6E87B9F70255377e024ace6630C1Eaa37F", activeBet, deadline, schedule, commissionDenominator, commission, initialPool, outcomes, odds, title, query).then(tx => tx.wait());
                break;
        }
        createdMarketOutcome = [];
    } catch (error) {
        newBetId = null;
        console.error(error);
        triggerError(providerErrorMsg(error), createBetQuery);
    }
}

async function renderPlacedBets() {

    placedBets = groupOrders(placedBets);

    const placedBids = placedBets.filter(({orderPosition}) => orderPosition === "BUY");
    const placedAsks = placedBets.filter(({orderPosition}) => orderPosition === "SELL");

    const totalBids = await calculateCost(placedBids, true);
    const totalAsks = await calculateCost(placedAsks, false);

    placeBetInfo.style.display = placedBets.length ? "flex" : "none";
    placeBetAsksTable.style.display = placedAsks.length ? "block" : "none";
    placeBetBidsTable.style.display = placedBids.length ? "block" : "none";

    placeBetBids.innerHTML = (await Promise.all(placedBids.map(async order => {
        const orderString = JSON.stringify(order).replaceAll('"', '\\"');
        return `
    <tr style="background-color: #069b69">
        <td style="margin: 5px; display: block" onclick='placedBets.splice(placedBets.map(p => JSON.stringify(p)).indexOf("${orderString}"), 1); renderPlacedBets()'>✖</td>
        <td>${order.outcome}</td>
        <td>${order.amount}</td>
        <td>${order.pricePerShare ? (order.pricePerShare / await activeDecimals()) : "MARKET"}</td>
        <td>${'$' + totalBids.payout[order.outcome].toFixed(3)}</td>
        <td></td>
    </tr>`
    }))).join("");
    placeBetAsks.innerHTML = (await Promise.all(placedAsks.map(async order => {
        const orderString = JSON.stringify(order).replaceAll('"', '\\"');
        return `
    <tr style="background-color: #ff4747">
        <td style="margin: 5px; display: block" onclick='placedBets.splice(placedBets.map(p => JSON.stringify(p)).indexOf("${orderString}"), 1); renderPlacedBets()'>✖</td>
        <td>${order.outcome}</td>
        <td>${order.amount}</td>
        <td>${order.pricePerShare ? (order.pricePerShare / await activeDecimals()) : "MARKET"}</td>
        <td></td>
    </tr>`
    }))).join("");
    placeBetBids.innerHTML += totalBids ? `<tr style="background-color: #6f75e5"><td></td><td></td><td></td><td><td></td><td>${totalBids.cost.toFixed(3)}</td></tr>` : "";
    placeBetAsks.innerHTML += totalAsks ? `<tr style="background-color: #6f75e5"><td></td><td></td><td><td></td><td>${totalAsks.cost.toFixed(3)}</td></tr>` : "";
}

async function activeDecimals() {
    return await activeContract.tokenDecimals(await activeContract.betTokens(activeBet)).then(Number);
}

async function addSingleBet(order) {
    const foundOrder = placedBets.filter(o => o.orderPosition === order.orderPosition && o.outcome === order.outcome && o.pricePerShare === order.pricePerShare)[0];
    if (!foundOrder) {
        placedBets.push({
            ...order,
            pricePerShare: Math.floor((placeBetPrice.value || 0) * await activeDecimals())
        });
    } else {
        foundOrder.amount += order.amount;
    }
    renderPlacedBets();
    placeBetAmount.value = "";
    placeBetOutcome.value = "";
}

async function buyBet() {
    if (await activeBetKind() === "oo") {
        await fillOrder();
    } else {
        await addFreeBet();
    }
}

const betOrders = {};
const fetchOrders = async (refresh) => {
    betOrders[activeBet] = refresh ? [] : (betOrders[activeBet] || []);
    const contractOrders = await (activeContract || {getOrders: async () => []}).getOrders(activeBet || "", betOrders[activeBet].length, 100);
    const newOrders = contractOrders.map((o, idx) => ({
        orderPosition: o[0] ? "SELL" : "BUY",
        pricePerShare: o[1],
        outcome: o[2],
        amount: o[3],
        user: o[4],
        idx: o[5]
    }));
    betOrders[activeBet] = betOrders[activeBet].concat(newOrders);
    betOrders[activeBet].sort((a, b) => a.orderPosition < b.orderPosition ? 1 : (Number(a.pricePerShare) - Number(b.pricePerShare)))
    if (newOrders.length || refresh) {
        await renderOrders();
    }
}

function groupOrders(orders) {
    const grouped = [];
    orders.forEach(o => {
        const {outcome, orderPosition, amount, pricePerShare} = o;
        const update = grouped.filter(g => g.orderPosition === orderPosition && g.pricePerShare === pricePerShare && g.outcome === outcome)[0];
        if (update) {
            update.amount += amount;
        } else {
            grouped.push(o);
        }
    });
    grouped.sort((a, b) => a.orderPosition < b.orderPosition ? 1 : a.orderPosition === "SELL"
        ? (calculateCost([a], false) - calculateCost([b], false))
        : (calculateCost([b], false) - calculateCost([a], true))
    );
    return grouped;
}

function prepareOrder(outcome, orderPosition, amount, price) {
    placeBetAmount.value = amount;
    placeBetPrice.value = price;
    chooseBetInputs.value = outcome;
    queueBuyOrder.style.display = "flex";
    queueBuyOrder.style.opacity = "1";
    document.getElementById(`place-bet-position-${orderPosition.toLowerCase()}`).checked = true;
    window.scrollTo({top: 0, behavior: "smooth"})
}

async function renderOrders() {
    const toRow = async ({idx, outcome, orderPosition, amount, pricePerShare}) => `
    <tr onclick="prepareOrder(\`${outcome}\`, '${orderPosition}', ${amount}, ${Number(pricePerShare) / await activeDecimals()})">
        <td>${outcome}</td>
        <td>${amount}</td>
        <td>${(Number(pricePerShare) / await activeDecimals()).toFixed(3)}</td>
        <td style="display: none">${idx}</td>
    </tr>`;

    const outcomes = await activeBetOutcomes();

    const toEditableRow = async ({idx, outcome, amount, pricePerShare}) => {
        const price = (Number(pricePerShare) / await activeDecimals()).toFixed(3);
        return `
            <tr>
                <td><select onchange="updateOrdersBtn.style.display = 'flex'" style="color: #f3f9d2">${outcomes.map(o => `<option ${o === outcome ? 'selected' : ''} value="${o}">${o}</option>`).join("")}</select></td>
                <td><input onchange="updateOrdersBtn.style.display = 'flex'" style="color: #f3f9d2; background-color: rgba(0,0,0,0)" type="number" value="${amount}" size="${amount.toString().length + 3}" oninput="this.size = this.value.length + 3" min="0" step="1"></td>
                <td><input onchange="updateOrdersBtn.style.display = 'flex'" style="color: #f3f9d2; background-color: rgba(0,0,0,0)" type="number" value="${price}" size="${price.toString().length + 3}" oninput="this.size = this.value.length + 3" min="0" step="0.001"></td>
                <td style="display: none">${idx}</td>
            </tr>`;
    };

    const userBuys = betOrders[activeBet].filter(b => b.amount > 0n && b.user === owner).filter(o => o.orderPosition === "BUY");
    const userSells = betOrders[activeBet].filter(b => b.amount > 0n && b.user === owner).filter(o => o.orderPosition === "SELL");
    const poolBuys = betOrders[activeBet].filter(b => b.amount > 0n && b.user !== owner).filter(o => o.orderPosition === "BUY");
    const poolSells = betOrders[activeBet].filter(b => b.amount > 0n && b.user !== owner).filter(o => o.orderPosition === "SELL");

    await Promise.all([[userBuyOrdersEntries, userBuys], [userSellOrdersEntries, userSells]].map(async ([elm, orders]) => {
        elm.innerHTML = `${(await Promise.all(orders.map(toEditableRow))).join("")}`;
    }));

    await Promise.all([[poolBuyOrdersEntries, poolBuys], [poolSellOrdersEntries, poolSells]].map(async ([elm, orders]) => {
        elm.innerHTML = `${(await Promise.all(groupOrders(orders).map(toRow))).join("")}`;
    }));
}

async function updateOrders() {
    const amounts = [];
    const prices = [];
    const outcomes = [];
    const ids = [];

    const decimals = await activeDecimals();

    [userBuyOrdersEntries, userSellOrdersEntries]
        .map(entries => Array.from(entries.getElementsByTagName("tr")))
        .flatMap(rows => rows.map(row => Array.from(row.getElementsByTagName("td"))))
        .map(([outcome, amount, price, id]) => {
            amounts.push(amount.getElementsByTagName("input")[0].value);
            prices.push(price.getElementsByTagName("input")[0].value * decimals);
            outcomes.push(outcome.getElementsByTagName("select")[0].value);
            ids.push(id.innerHTML);
        });
    const sanitizedOutcomes = outcomes.map(o => o.replaceAll("<div>", "").replaceAll("</div>", "").replaceAll("<br>", ""));
    console.log(amounts, prices, sanitizedOutcomes, ids);
    const tx = await activeContract.changeOrder(amounts, prices, activeBet, sanitizedOutcomes, ids);
    await tx.wait();
    await fetchOrders(true);
    updateOrdersBtn.style.display = "none";
}

setInterval(fetchOrders, 10000);

async function fillOrder() {
    const newOrders = placedBets.filter(order => order.amount > 0n);
    // Sells should be filled before buys
    newOrders.sort((a, b) => a.orderPosition < b.orderPosition ? 1 : a.pricePerShare - b.pricePerShare);
    const prices = newOrders.map(o => o.pricePerShare);
    const amounts = await Promise.all(newOrders.map(o => o.amount).map(numberToToken));
    if (!newOrders.length || !amounts.length) {
        triggerError("No bets have been placed, make sure outcome and amount fields are not empty.")
        return;
    } else if (await usdc.allowance(owner, ooContractAddress) === 0n) {
        triggerError(`Please approve Gambeth to use some of your funds before placing a bet.`, undefined, async () => await usdc.approve(ooContractAddress, await usdc.balanceOf(owner)));
        return;
    }

    for (let order of placedBets) {
        const pendingSells = await activeContract.pendingSells(activeBet, owner, order.outcome);
        const userBet = await activeContract.userPools(activeBet, owner, order.outcome);
        const orderAmount = BigInt(order.amount);
        if (order.orderPosition === "SELL" && pendingSells + orderAmount > userBet) {
            triggerError(`You don't have enough '${order.outcome}' shares to place sell order`)
            return;
        }
    }

    triggerProcessing(`Placing order${newOrders.length > 1 ? "s" : ""}`);
    const finalAmounts = await Promise.all(amounts.map(async a => a.toString() / await activeDecimals()));
    const orders = betOrders[activeBet];
    const orderIndexes = placedBets.map(({orderPosition, outcome, pricePerShare}) => orders
        .filter(o => o.amount)
        .filter(o => o.outcome === outcome)
        .filter(o => o.orderPosition !== orderPosition)
        .filter(o => pricePerShare === 0 || (orderPosition === "BUY" ? (pricePerShare >= o.pricePerShare) : (pricePerShare <= o.pricePerShare)))
        .map(o => o.idx));
    const filledOrder = await activeContract.fillOrder(finalAmounts, prices, placedBets.map(o => o.orderPosition === "BUY" ? 0n : 1n), activeBet, newOrders.map(o => o.outcome), orderIndexes);
    placedBets = [];
    await renderPlacedBets();
    await filledOrder.wait();
    triggerSuccess(`Order placed!`, hideMessage, undefined, 2500);
    await Promise.all([fetchOrders(true), renderBetPool()]);
}

async function addFreeBet() {
    try {
        if (placeBetAmount.value && placeBetOutcome.value) {
            await addSingleBet({
                amount: Number(placeBetAmount.value),
                outcome: placeBetOutcome.value || chooseBetInputs.value,
                orderPosition: chooseBetPosition.value.toUpperCase()
            });
        }
        await placeContractBet();
        queueBuyOrder.style.opacity = 0;
        placeBetInfo.style.display = "none";
        placeBetBids.innerHTML = "";
    } catch (error) {
        console.error(error);
        hideMessage();
        clearTimeout();
        triggerError(providerErrorMsg(error));
    }
}

let createdMarketOutcome = [];

async function addBetChoice() {
    createBetChoice.value ||= "";
    if (!(createBetChoice.value.trim())) {
        return;
    }
    if (!createdMarketOutcome.includes(createBetChoice.value)) {
        createdMarketOutcome.push(createBetChoice.value);
    }
    createmarketOutcomeList.innerHTML = createdMarketOutcome.map(v => `<li>${v}</li>`).join("");
    createBetOdds.innerHTML = createdMarketOutcome.map(v => `<div><input oninput="renderCostMessages()" id="create-market-${v.replaceAll(" ", "-")}" style="width: 3rem; height: 1rem; margin: 1rem; placeholder="${v}">%</div>`).join("");
    createBetOddsList.innerHTML = createdMarketOutcome.map(v => `<li style="display: flex; justify-content: flex-start; margin: 1rem; width: 100%">${v}</li>`).join("");
    createBetChoice.value = "";
}

async function changeBetType() {

    const betType = createBetSchema.value;
    createmarketOutcome.style.display = betType === "oo" ? "flex" : "none";

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
            const filter = (await activeContract.queryFilter(activeContract.filters.CreatedOptimisticBet(activeBet)))[0].args;
            const query = filter[filter.length - 1];
            if (!(await activeContract.marketCreation(activeBet))) {
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
        if (!activeContract || !activeBet) {
            return;
        }
        const placedBets = await activeContract.queryFilter(activeContract.filters.PlacedBets(null, activeBet));
        const contractPrices = await activeContract.betPools(activeBet);
        marketPrices.innerHTML = ``;
        marketPricesTable.style.opacity = "0";
        if (contractPrices) {
            const marketOutcome = await activeBetOutcomes();
            const payout = async outcome => (Number(await activeContract.calculateCost(activeBet).then(async a => Number(a) / await activeDecimals())) / Number(await activeContract.resultPools(activeBet, outcome)));
            const calcPrices = await Promise.all(marketOutcome.map(calculatePrice));
            const prices = calcPrices.map(async (p, i) => {
                const outcome = marketOutcome[i];
                const mktPrice = Math.round(p * 1000) / 1000;
                const odds = (Math.pow(p, 2) * 100).toFixed(2);
                const pay = (await payout(marketOutcome[i])).toFixed(3);
                const owned = await activeContract.userPools(activeBet, owner, outcome);
                const avgPrice = await activeContract.userTransfers(activeBet, owner, outcome).then(async a => Math.round((Number(a) / await activeDecimals()) / Number(owned) * 1000) / 1000);
                const multiple = (Number.isNaN(avgPrice) || !Number.isFinite(avgPrice)) ? null : (pay / avgPrice).toFixed(2);
                return `<tr>
                    <td>${outcome}</td>
                    <td>${owned || "-"}</td>
                    <td>${odds}%</td><td>$${mktPrice}</td>
                    <td>${(Number.isNaN(avgPrice) || !Number.isFinite(avgPrice)) ? "-" : ("$" + avgPrice)}</td>
                    <td>$${pay} ${multiple ? (" -" + multiple + "x") : ""}</td>
                </tr>`
            });
            marketPrices.innerHTML = (await Promise.all(prices)).join("");
            marketPricesTable.style.opacity = "100%";
        }
        const betOutcomes = {};
        (await activeBetOutcomes()).forEach(o => betOutcomes[o] = 0);
        placedBets.forEach(pb => pb.args[3].forEach(outcome => betOutcomes[outcome] += 1));
        const outcomes = await Promise.all(
            await activeBetOutcomes().then(outcomes => outcomes.map(o => activeContract.resultPools(activeBet, o)))
        );
        const outcomesPool = outcomes;
        const selectColor = (number) => `hsl(${number * 137.508},50%,75%)`;
        const data = {
            labels: Object.keys(betOutcomes),
            datasets: [{
                data: outcomesPool.map(a => a.toString()),
                backgroundColor: outcomes.length < 7 ? undefined : outcomes.map((_, i) => selectColor(i)),
            }]
        };
        const config = {
            type: 'doughnut',
            data,
        };
        const filter = (await activeContract.queryFilter(activeContract.filters.CreatedOptimisticBet(activeBet)))[0].args;
        aboutBet.innerHTML = filter[filter.length - 3];
        if (betChart) {
            betChart.destroy();
        }
        Chart.defaults.color = "#FFF";
        betChart = new Chart(betPool, config);
        betChart.options.plugins.legend.position = 'right';
        betChart.update();
        betPool.style.visibility = "visible";
        betPool.style.opacity = "100%";
    } catch (error) {
        console.error(error);
        triggerError(providerErrorMsg(error));
    }
}