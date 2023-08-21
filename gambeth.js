const usdcAddress = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";

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
const createBetWolfram = document.getElementById("create-bet-wa");
const createBetPath = document.getElementById("create-bet-path");
const betEntries = document.getElementById("bet-entries");
const betPool = document.getElementById("bet-pool");
const searchBetId = document.getElementById("search-bet");
const poolName = document.getElementById("pool-name");
const message = document.getElementById("message");
const betContainer = document.getElementById("bet-container");
const createBetMinimum = document.getElementById("create-bet-minimum");
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
const betInnerTotalPool = document.getElementById("bet-total-pool");
const betResult = document.getElementById("bet-result");
const betQuery = document.getElementById("bet-query");
const betWolframQuery = document.getElementById("bet-wolfram-query");
const betInnerResult = document.getElementById("bet-inner-result");

const betIdChanged = () => betIdLabel.innerHTML = betIdMsg.replace("{BET_ID}", betId.value.trim());

const closeNewBet = () => {
    newBet.hideBet = newBet.style.display = 'none';
    betContainer.style.display = newBet.hideBet ? 'none' : 'flex';
}

let minimumBet = null;
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
    steps[currentStep].style.opacity = "0";
    steps[currentStep].style.visibility = "hidden";
    const p = steps[currentStep];
    setTimeout(() => {
        p.style.position = "absolute"
    }, 200);
    currentStep = idx;
    steps[currentStep].style.visibility = "visible";
    steps[currentStep].style.position = "initial";
    steps[currentStep].style.opacity = "100%";
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

async function showBetInfo() {
    betInfo.style.display = 'flex';
}

const stateContractAddress = "0x4D4213122634dD59064B7a7cd900B83c31B0D1fb";
const ooContractAddress = "0xD41f39c42EA095c0bC0539CEfeD2867D8a5f71Bf";
const provableContractAddress = "0x03Df3D511f18c8F49997d2720d3c33EBCd399e77";
const humanContractAddress = "";

async function loadProvider({betId, betType} = {}) {
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
                    newBetId = null;
                }, 2500)
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
                if (sender === owner) triggerSuccess(`Bet won! ${await tokenToNumber(amount.toString())} ETH transferred to account`)
            });
            minimumBet = await tokenToNumber(0);
            createBetMinimum.setAttribute("min", minimumBet);
            fixedCommission = await tokenToNumber(0);
        }

        if (betId) {
            const betKind = await stateContract.betKinds(ethers.encodeBytes32String(betId));
            console.log("Bet kind", betKind, betKind === 0n);
            switch (betKind) {
                case 0n:
                    activeContract = new ethers.Contract(ooContractAddress, optimisticOracleAbi, provider).connect(signer);
                    break;
                case 1n:
                    activeContract = new ethers.Contract(humanContractAddress, [], provider).connect(signer);
                    break;
                case 2n:
                    activeContract = new ethers.Contract(provableContractAddress, provableOracleAbi, provider).connect(signer);
                    activeContract.on("LackingFunds", async (sender, funds) => {
                        if (sender === owner) triggerError(`Insufficient query funds, requiring ${await tokenToNumber(funds)} ETH`)
                    });
                    activeContract.on("DescribedProvableBet", async (hashedBetId, description) => {
                        console.log("Found description", hashedBetId);
                        if (hashedBetId.hash === ethers.id(ethers.encodeBytes32String(activeBet) || "")) {
                            betInnerDescription.innerHTML = description;
                        }
                    });
                    break;
                default:

            }
        } else if (betType) {
            switch (betType) {
                case "oo":
                    activeContract = new ethers.Contract(ooContractAddress, optimisticOracleAbi, provider).connect(signer);
                    break;
                case "bc":
                    activeContract = new ethers.Contract(humanContractAddress, [], provider).connect(signer);
                    break;
                default:
                    activeContract = new ethers.Contract(provableContractAddress, provableOracleAbi, provider).connect(signer);
                    break;
            }
        }

        providerLoaded = true;

        if (!JSON.parse(localStorage.tokenApproved) && !JSON.parse(localStorage.awaitingApproval || false)) {
            try {
                localStorage.awaitingApproval = true;
                let usdc = new ethers.Contract(usdcAddress, tokenAbi, provider).connect(await provider.getSigner());
                await usdc.approve(stateContractAddress, 0);
                localStorage.tokenApproved = true;
            } catch (error) {
                localStorage.tokenApproved = false;
            }
            localStorage.awaitingApproval = false;
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
    placeSingleBet.onclick = filledBet ? () => {
        addSingleBet();
        renderPlaceSingleBet();
    } : "";
    placeSingleBet.style.cursor = filledBet ? "pointer" : "default";
    placeSingleBet.style.opacity = filledBet ? "1" : "0";
}

async function renderClaimBet() {
    const addr = await signer.getAddress();
    let finishedBet = false;
    try {
        finishedBet = await activeContract.finishedBets(activeBet);
    } catch {
        try {
            await activeContract.getSettledData(activeBet);
            finishedBet = true;
        } catch {}
    }
    if ((await stateContract.userPools(activeBet, addr)) === 0 || !finishedBet) {
        claimBet.style.display = "none";
        claimBet.style.visibility = "hidden";
        claimBet.style.opacity = "0";
    } else {
        claimBet.style.display = "block";
        claimBet.style.visibility = "visible";
        claimBet.style.opacity = "100%";
        const claimedBet = await stateContract.claimedBets(activeBet, addr);
        claimBet.innerHTML = claimedBet ? "Claimed" : "Claim";
        claimBet.disabled = claimedBet;
    }
}

async function renderPlaceBet() {

    const deadline = await stateContract.betDeadlines(activeBet) * BigInt(1000);
    const bettingDisabled = deadline <= Math.round(new Date().getTime());

    betDecision.style.display = await stateContract.betKinds(activeBet) === 1n
        ? ((bettingDisabled && await stateContract.betOwners(activeBet) === owner) ? "block" : "none")
        : "none";

    placeBet.style.visibility = "visible";
    placeBet.style.opacity = "100%";

    placeBetInputs.style.display = bettingDisabled ? "none" : "flex";
    placeBetInputs.style.opacity = bettingDisabled ? 0 : "100%";
    placeBetInputs.style.visibility = bettingDisabled ? "hidden" : "visible";
    const min = await tokenToNumber(await stateContract.betMinimums(activeBet));
    placeBetAmount.setAttribute("min", min);
    placeBetAmount.placeholder = `${min} minimum`;
    placeBet.innerHTML = bettingDisabled ? "Deadline Reached" : "Place Bet";
    placeSingleBet.style.display = bettingDisabled ? "none" : "block";
    placeBet.disabled = bettingDisabled;
}

async function searchBet(betId) {
    try {
        await loadProvider({betId});
        placedBets = {};
        newBet.style.display = "none";
        await resetButtons();
        triggerProcessing("Fetching bet");
        betContainer.style.opacity = "0";
        betContainer.style.visibility = "hidden";
        console.log(betId, searchBetId.value);
        activeBet = ethers.encodeBytes32String(betId || searchBetId.value);
        console.log(activeBet);
        const betExists = await stateContract.createdBets(activeBet);
        if (!betExists) {
            betContainer.style.display = "none";
            triggerError("Invalid Bet ID");
            return;
        }
        const location = new URL(window.location.toString());
        location.searchParams.set("id", ethers.decodeBytes32String(activeBet));
        history.pushState({}, "", location.toString());
        betContainer.style.display = "flex";
        const bets = await stateContract.queryFilter(stateContract.filters.CreatedBet(activeBet));
        const createdFilter = bets[0];
        const [initialPool, description] = createdFilter.args.slice(1).map(arg => arg.toString());
        const query = (await stateContract.betQueries(activeBet));
        const {url, schema, path} = unpackQuery(query);

        wolframBet.style.display = schema ? "none" : "flex";
        urlBet.style.display = schema ? "flex" : "none";
        (schema ? betQuery : betWolframQuery).innerHTML = query;
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
        let result;
        try {
            result = await activeContract.getResult(activeBet);
        } catch(error) {
            result = "";
        }
        betInnerDescription.innerHTML = description;
        betInnerInitialPool.innerHTML = (await tokenToNumber(initialPool)).toString() + "Ð";
        betInnerTotalPool.innerHTML = (await tokenToNumber((await stateContract.betPools(activeBet)))).toString() + "Ð";
        const innerCommission = (100 / Number((await stateContract.betCommissions(activeBet)).toString())).toFixed(5);
        betInnerCommission.innerHTML = Number.parseFloat(innerCommission) + "%";
        betInnerMinimum.innerHTML = await tokenToNumber(await stateContract.betMinimums(activeBet)) + "Ð";
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
    return {schema: match[1], url: match[2], path: match[3]}
}

const parseBetQuery = (schema, url, path) => `${schema}(${url})${schema === "html" ? `.xpath(${path})` : path}`;

async function createBet() {
    try {
        if (!(await loadProvider({betType: createBetSchema.value}))) return;
        console.log("Provider loaded successfully");
        betContainer.style.display = "none";
        await resetButtons();
        clearTimeout(hideMessage());

        const schema = createBetSchema.value;
        const url = createBetUrl.value;
        const path = createBetPath.value;
        const query = ["wa", "bc", "oo"].includes(schema)
            ? createBetWolfram.value
            : parseBetQuery(schema, url, path);
        const schedule = Date.parse(`${scheduleDate.value}`) / 1000;
        const deadline = Date.parse(`${deadlineDate.value}`) / 1000;
        const commission = Math.round(100 / createBetCommission.value);

        if (!window.ethereum) {
            triggerError("No Ethereum provider detected", createBetQuery, () => window.location.href = "https://metamask.io/");
            return;
        } else if (!betId.value.trim()) {
            triggerError("No bet ID submitted", createBetQuery, () => renderCreationStep(0));
            return;
        } else if (await stateContract.createdBets(ethers.encodeBytes32String(betId.value))) {
            triggerError("Bet ID already exists", createBetQuery, () => renderCreationStep(0));
            return;
        } else if (await stateContract.createdBets(ethers.encodeBytes32String(betId.value))) {
            triggerError("No funds for oracle service", createBetQuery, () => renderCreationStep(1));
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
        } else if (await tokenToNumber(createBetMinimum.value) < minimumBet) {
            triggerError(`Minimum bet is ${minimumBet} ETH, was ${createBetMinimum.value}`, createBetQuery, () => renderCreationStep(3));
            return;
        } else if (!createBetCommission || createBetCommission.value === 0 || createBetCommission.value > 50) {
            triggerError("Commission can't be 0% nor higher than 50%", createBetQuery, () => renderCreationStep(2));
            return;
        }
        console.log("No exceptions");
        activeBet = ethers.encodeBytes32String(betId.value.toLowerCase().trim());
        newBetId = activeBet;
        const initialPool = await numberToToken(createBetInitialPool.value || "0");
        console.log("Initial pool", initialPool);
        let prices = [];
        try {
            prices = (await Promise.all(["URL", "WolframAlpha"].map(stateContract.lastQueryPrice))).map(tokenToNumber);
        } catch (error) {
            prices = [];
        }
        console.log("Prices", prices);
        const oracleFund = prices[1] > prices[0] ? prices[1] : prices[0];
        console.log(schedule);
        const value = !oracleFund ? undefined : (await numberToToken(oracleFund) * (await stateContract.oracleMultiplier(schedule)));
        console.log("Oracle fund: ", value);
        triggerProcessing("Creating bet", createBetQueryResult);
        switch (schema) {
            case "bc":
                await activeContract.createHumanBet("0x07865c6E87B9F70255377e024ace6630C1Eaa37F", activeBet, deadline, schedule, commission, await numberToToken(createBetMinimum.value), initialPool, query);
                break;
            case "oo":
                await activeContract.createOptimisticBet("0x07865c6E87B9F70255377e024ace6630C1Eaa37F", activeBet, deadline, schedule, commission, await numberToToken(createBetMinimum.value), initialPool, query);
                break;
            default:
                await activeContract.createProvableBet("0x07865c6E87B9F70255377e024ace6630C1Eaa37F", deadline, schedule, commission, await numberToToken(createBetMinimum.value || 0), initialPool, ethers.encodeBytes32String(createBetSchema.value === "wa" ? "WolframAlpha" : "URL"), ethers.encodeBytes32String(activeBet), query, {value: value.toString()});
        }
        const description = createBetDescription.value || "";
    } catch (error) {
        newBetId = null;
        console.error(error);
        triggerError(providerErrorMsg(error), createBetQuery);
    }
}

async function renderPlacedBets() {
    placeBetInfo.style.display = Object.keys(placedBets).length ? "block" : "none";
    placeBetEntries.innerHTML = `
        ${Object.entries(placedBets).map(([k, v]) => `<tr><td onclick="delete placedBets['${k}']; renderPlacedBets()">✖</td><td>${k}</td><td>${BigInt(v) - fixedCommission}</td></tr>`).join("")}
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
        const amounts = await Promise.all(results.map(r => placedBets[r]).map(a => a.toString()).map(numberToToken));
        if (!results.length || !amounts.length) {
            triggerError("No bets have been placed, make sure result and amount fields are not empty.")
            return;
        }
        const sum = amounts.reduce((acc, b) => acc + b, BigInt(0)).toString();
        triggerProcessing("Placing bet" + (results.length > 1 ? "s" : ""));
        console.log(results, amounts.map(a => a.toString()), sum);
        await activeContract.placeBets(activeBet, results, amounts.map(a => a.toString()));
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

async function changeBetType() {
    const betType = createBetSchema.value;

    if (betType === "html") {
        createBetPath.placeholder = "/html/body/div[1]/div/div/div[2]/main/div[4]/table/tbody/tr[2]/td[3]/text()"
    } else {
        createBetPath.placeholder = ".result.0.last"
    }

    createBetWolfram.style.display = ["wa", "bc", "oo"].includes(betType) ? "block" : "none";

    [createBetUrl, createBetPath]
        .forEach(elm => [elm.style.display, document.querySelector(`label[for="${elm.id}"]`).style.display] = Array(2).fill(["wa", "bc", "oo"].includes(betType) ? "none" : "block"));
    [createBetWolfram.style.display, document.querySelector(`label[for="${createBetWolfram.id}"]`).style.display] = Array(2).fill(["wa", "bc", "oo"].includes(betType) ? "block" : "none");
    createBetQuery.style.display = ["wa", "bc", "oo"].includes(betType) ? "none" : "flex";

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
    loadProvider({betType})
}

function providerErrorMsg(error) {
    return `Provider error - ${error.code ? `Code: ${error.code}` : error}`;
}

async function claimReward() {
    try {
        triggerProcessing("Claming reward");
        activeContract.claimBet(activeBet);
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

async function testQueryInfo() {
    testQuery(['xml', 'html', 'json'].map(s => (betQuery.innerHTML || betWolframQuery.innerHTML).startsWith(s)).some(x => x) ? 'URL' : 'WolframAlpha', betQuery.innerHTML || betWolframQuery.innerHTML, 'Query error encountered, bets will be refunded if this happens during scheduled execution');
}

async function testQueryCreate() {
    testQuery(createBetSchema.value === "wa" ? "WolframAlpha" : "URL", createBetSchema.value === "wa" ? createBetWolfram.value : createBetQueryInner.innerHTML, 'Query failed, you can still create the bet if you know it will succeed when it is scheduled to run', createBetQueryResult);
}

async function testQuery(betType, url, errorMsg, after = defaultMessageLocation) {
    if (!url) {
        triggerError(`No ${betType === "URL" ? "URL" : "Query"} detected.`, after);
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
    let result;
    const queryId = (await fetch(`${baseURL}/create`, {
        method: "POST",
        body: JSON.stringify(payload)
    }).then(r => r.json()).catch(console.log)).result.id;
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

        allEntries.sort((a, b) => resultsPool[b[0]] - resultsPool[a[0]]);
        const entries = allEntries
            .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td><td>${(resultsPool[k])}</td></tr>`)
            .join("");

        poolName.innerHTML = ethers.decodeBytes32String(activeBet) + " Pool";
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
