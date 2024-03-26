const O_ICON_PATH = './icons/circle-icon.svg';
const X_ICON_PATH = './icons/close-icon.svg';
const FIRST_TURN = "X";

const getElement = (name) => document.querySelector(name);
const getAllElements = (name) => Array.from(document.querySelectorAll(name));
const create = (name) => document.createElement(name);

const confirmNamesModal = getElement('.enter-names');
const confirmNamesHeader = getElement('.enter-names .modal-header');
const confirmNamesButton = getElement('.confirm-names');
const nameInputsArray = getAllElements('.enter-names input');
const secondPlayerEnterNameBlock = getElement('.second-player');
const firstPlayerInput = getElement('.first-player input');
const firstPlayerLabel = getElement('.first-player label');
const secondPlayerInput = getElement('.second-player input');

const validationErrorMessage = getElement('.validation-error');

const selectDifficultyModal = getElement('.select-difficulty');
const difficultyButtonsArray = getAllElements('.difficulty-btn:not(.disabled)');

const toss = getElement('.toss');
const coin = getElement('#coin');
const headSideOfCoin = getElement('.side-x');
const tailSideOfCoin = getElement('.side-o');

const scoreMessage = getElement('.score-message');

const board = getElement('.board');
const cellsArray = getAllElements('.cell');
const startButton = getElement('.start-btn');
const currentPlayerName = getElement('.information .current-player');
const timeToMove = getElement('.information .time-to-move');
const notificationMessage = getElement('.information .notification-message');
const difficultyBlock = getElement('.difficulty-block');
const difficultyMessage = getElement('.difficulty-message');

let gameType;
let difficulty;
let activeTurn;
let gameStarted = false;

const winRows = [["a1", "a2", "a3"], ["b1", "b2", "b3"], ["c1", "c2", "c3"], ["a1", "b1", "c1"], ["a2", "b2", "c2"], ["a3", "b3", "c3"], ["a1", "b2", "c3"], ["a3", "b2", "c1"]];
const initialAvailableCells = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3'];
let availableCells = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3'];

const playersResult = {};
let timeInterval;

const EPlayersSign = {
	X: undefined, O: undefined,
};
const ESignColors = {
	X: "purple", O: "orange",
};
const EGameTypes = {
	training: [], ai: [],
};
const EConfirmHeaders = {
	training: 'enter players name', ai: 'enter your name',
};
const playerSpeed = 7000;
const ETurnSpeedOfUser = {
	novice: 8000, easy: 7000, medium: 5000, hard: 4000,
};
const ETurnSpeedOfAI = {
	novice: 500, easy: 750, medium: 1000, hard: 1250,
};

const clickSound = new Audio('./sounds/click.wav');
const resultSound = new Audio('./sounds/result.wav');


function detectGameType() {
	gameType = window.location.hash.slice(1);
}

function showDifficultySelectionModal() {
	difficultyButtonsArray.forEach((btn) => {
		btn.addEventListener('click', selectDifficulty);
	});

	selectDifficultyModal.classList.remove('d-none');
}

function hideDifficultySelectionModal() {
	difficultyButtonsArray.forEach((btn) => {
		btn.removeEventListener('click', selectDifficulty);
	});

	selectDifficultyModal.remove();
}

function selectDifficulty(event) {
	difficulty = event.target.dataset.difficulty;
	difficultyMessage.innerHTML = difficulty;
	difficultyBlock.classList.remove('d-none');

	hideDifficultySelectionModal();
	startGame();
}

function showConfirmNamesModal() {
	if (gameType === 'ai') {
		secondPlayerEnterNameBlock.classList.add('d-none');
		firstPlayerLabel.remove();
	}

	nameInputsArray.forEach((input) => {
		input.addEventListener('input', removeInputError);
	});
	nameInputsArray.forEach((input) => {
		input.addEventListener('keypress', enterNamesOnEnter);
	});

	confirmNamesButton.addEventListener('click', enterNames);
	confirmNamesHeader.innerHTML = EConfirmHeaders[gameType];
	confirmNamesModal.classList.remove('d-none');
}

function hideConfirmNamesModal() {
	nameInputsArray.forEach((input) => {
		input.removeEventListener('input', removeInputError);
	});
	nameInputsArray.forEach((input) => {
		input.removeEventListener('keypress', enterNamesOnEnter);
	});

	confirmNamesButton.removeEventListener('click', enterNames);
	confirmNamesModal.remove();
}

function enterNamesOnEnter(event) {
	if (event.key === "Enter") {
		event.preventDefault();
		enterNames();
	}
}

function enterNames() {
	const name1 = firstPlayerInput.value;
	const name2 = gameType === 'ai' ? 'AI' : secondPlayerInput.value;

	if (!name1 || !name2) {
		validationErrorMessage.classList.remove('d-none');

		firstPlayerInput.classList.remove('input-error');
		secondPlayerInput.classList.remove('input-error');

		if (!name1) {
			firstPlayerInput.classList.add('input-error');
			validationErrorMessage.innerHTML = 'all fields are required*';
		}

		if (!name2) {
			secondPlayerInput.classList.add('input-error');
			validationErrorMessage.innerHTML = 'all fields are required*';
		}

		return;
	}

	const sameName = name1.toLowerCase() === name2.toLowerCase();

	if (sameName) {
		validationErrorMessage.classList.remove('d-none');
		firstPlayerInput.classList.add('input-error');
		secondPlayerInput.classList.add('input-error');
		validationErrorMessage.innerHTML = 'names cannot be the same*';

		return;
	}

	EGameTypes[gameType].push(firstPlayerInput.value, secondPlayerInput.value || 'AI');

	hideConfirmNamesModal();
	setStatsNotification();

	if (gameType === 'training') {
		startGame();
	}

	if (gameType === 'ai') {
		showDifficultySelectionModal();
	}
}

function removeInputError(event) {
	event.target.classList.remove('input-error');
	validationErrorMessage.classList.add('d-none');
}

function tossTheCoin() {
	let firstTurnBy;

	toss.classList.remove('d-none');
	coin.classList.remove('heads', 'tails');

	headSideOfCoin.innerHTML = EGameTypes[gameType][0];
	tailSideOfCoin.innerHTML = EGameTypes[gameType][1];

	if (Math.random() <= 0.5) {
		firstTurnBy = EGameTypes[gameType][0];
		coin.classList.add('heads');
	} else {
		firstTurnBy = EGameTypes[gameType][1];
		coin.classList.add('tails');
	}

	const secondTurnBy = EGameTypes[gameType].find(player => player !== firstTurnBy);

	EPlayersSign.X = firstTurnBy;
	EPlayersSign.O = secondTurnBy;

	setTimeout(() => {
		setTurnMessage();
		toss.classList.add('d-none');
		timeToMove.classList.remove('d-none');
		setTimer();

		if (gameType === 'ai' && EPlayersSign[activeTurn] === 'AI') {
			makeAIMove(difficulty);
		}
	}, 4500);
}

function startGame() {
	restart();
	tossTheCoin();

	board.addEventListener("click", makeUserMove);
	console.log('Game was started');
}

function setTurnMessage(resultMessage = undefined) {
	currentPlayerName.innerHTML = resultMessage || `${EPlayersSign[activeTurn]}`;

	currentPlayerName.classList.remove(ESignColors.X);
	currentPlayerName.classList.remove(ESignColors.O);

	if (!gameStarted) {
		currentPlayerName.innerHTML = "";
	}

	if (activeTurn === "X" && gameStarted && !resultMessage) {
		currentPlayerName.classList.add(ESignColors.X);
	}

	if (activeTurn === "O" && gameStarted && !resultMessage) {
		currentPlayerName.classList.add(ESignColors.O);
	}
}

function makeUserMove(event) {
	if (!gameStarted || (gameType === 'ai' && EPlayersSign[activeTurn] === 'AI')) return;

	const cellId = event.target.dataset.id;
	const element = getElement(`[data-id="${cellId}"]`);

	makeTurn(element, cellId);
}

function makeAIMove(difficultyLevel) {
	let cellId = availableCells[0];

	if (difficultyLevel === 'easy') {
		cellId = availableCells[Math.floor(Math.random() * availableCells.length)];
	}

	if (difficultyLevel === 'medium') {
		const aiSign = activeTurn;
		const userSign = Object.keys(EPlayersSign).find((sign) => sign !== activeTurn);

		cellId = getBestAICell(aiSign) || getBestAICell(userSign) || availableCells[Math.floor(Math.random() * availableCells.length)];
	}

	if (difficultyLevel === 'hard') {
		console.log('logic for hard difficulty');
	}

	const element = getElement(`[data-id="${cellId}"]`);

	setTimeout(() => {
		makeTurn(element, cellId);
	}, ETurnSpeedOfAI[difficultyLevel]);
}

function getBestAICell(sign) {
	const currentRowsState = getCurrentRowsState();
	const rowWithPossibleWinIndex = currentRowsState.findIndex((rowState) => rowState.length === 2 && rowState === `${sign}${sign}`);

	if (rowWithPossibleWinIndex === -1) return;

	return winRows[rowWithPossibleWinIndex].find((cellId) => availableCells.includes(cellId));
}

function makeTurn(element, cellId) {
	clickSound.play();

	if (availableCells.includes(cellId)) {
		setTimer();
		resetNotificationMessage();
		drawSign(element);

		availableCells = availableCells.filter(cell => cell !== cellId);

		if (!isWinner(activeTurn)) {
			if (isTied()) {
				showResult('draw');

				return;
			}

			changeTurn();

			if (gameType === 'ai' && EPlayersSign[activeTurn] === 'AI') {
				makeAIMove(difficulty);
			}

			return;
		}

		showResult('win', activeTurn);
	} else {
		setNotificationMessage('This cell is already checked, choose another one', 'warning');
	}
}

function drawSign(element) {
	const sign = create('img');

	if (activeTurn === "X") {
		sign.setAttribute('src', X_ICON_PATH);
		sign.dataset.sign = "X";
	}

	if (activeTurn === "O") {
		sign.setAttribute('src', O_ICON_PATH);
		sign.dataset.sign = "O";
	}

	element.appendChild(sign);
}

function changeTurn() {
	activeTurn = activeTurn === "X" ? "O" : "X";
	setTurnMessage();
}

function isTied() {
	return cellsArray.every(cell => cell.innerHTML !== "");
}

function isWinner(sign) {
	const winCondition = `${sign}${sign}${sign}`;

	const currentRowsState = getCurrentRowsState();

	return Boolean(currentRowsState.find((row) => row === winCondition));
}

function getCurrentRowsState() {
	const boardState = cellsArray.reduce((previousState, currentCell) => {
		const currentCellSign = currentCell.firstChild?.dataset.sign || "";

		return {
			...previousState, [currentCell.dataset.id]: currentCellSign
		};
	}, {});

	return winRows.map((row) => {
		return row.reduce((prev, currentCellId) => {
			return prev + boardState[currentCellId];
		}, "");
	});
}

function showResult(result, player = undefined) {
	resultSound.play();

	if (result === 'draw') {
		updateScore('draw');
		setTurnMessage('It is a DRAW, start a new game');
	}

	if (result === 'lose') {
		updateScore(EGameTypes[gameType].find((name) => name !== EPlayersSign[player]));
		setTurnMessage(`<span class="${ESignColors[player]}">${EPlayersSign[player]}</span> lost due to wasted time`);
	}

	if (result === 'win' && (gameType === 'training' || gameType === 'ai' && EPlayersSign[player] !== 'AI')) {
		updateScore(EPlayersSign[player]);
		setTurnMessage(`Congratulations, <span class="${ESignColors[player]}">${EPlayersSign[player]}</span> won!`);
	}

	if (result === 'win' && gameType === 'ai' && EPlayersSign[player] === 'AI') {
		updateScore(EPlayersSign[player]);
		setTurnMessage(`Unfortunataly you lost, <span class="${ESignColors[player]}">${EPlayersSign[player]}</span> won!`);
	}

	resetSettings();
}

function setStatsNotification() {
	playersResult[EGameTypes[gameType][0]] = 0;
	playersResult[EGameTypes[gameType][1]] = 0;
	playersResult.draw = 0;

	scoreMessage.innerHTML = Object.values(playersResult).join(':');
}

function updateScore(player) {
	playersResult[player] += 1;

	scoreMessage.innerHTML = Object.values(playersResult).join(':');
}

function getTimeRemaining(duration) {
	const total = duration - Date.now();
	const seconds = Math.floor((total / 1000) % 60);
	const milliseconds = `${Math.floor((total % 1000))}`.slice(0, 2);

	return {
		total, seconds, milliseconds
	};
}

function initializeTimer(endTime) {
	clearInterval(timeInterval);
	timeInterval = setInterval(updateClock, 10);

	function updateClock() {
		const time = getTimeRemaining(endTime);

		if (time.total <= 0) {
			clearInterval(timeInterval);
			showResult('lose', activeTurn);

			return;
		}

		timeToMove.innerHTML = `${time.seconds}:${time.milliseconds}`;
	}
}

function setTimer() {
	if (gameType === 'training') {
		initializeTimer((Date.now() + playerSpeed));
	}

	if (gameType === 'ai') {
		initializeTimer((Date.now() + ETurnSpeedOfUser[difficulty]));
	}
}

function setNotificationMessage(message, type) {
	notificationMessage.classList.remove('warning', 'notification', 'hidden');
	notificationMessage.classList.add(type);
	notificationMessage.innerHTML = message;
}

function resetNotificationMessage() {
	notificationMessage.classList.remove('warning', 'notification');
	notificationMessage.classList.add('hidden');
	notificationMessage.innerHTML = "";
}

function resetSettings() {
	gameStarted = false;
	clearInterval(timeInterval);
	timeToMove.innerHTML = `0:00`;
	timeToMove.classList.add('d-none');
	resetNotificationMessage();
}

function restart() {
	board.removeEventListener("click", makeUserMove);

	cellsArray.forEach(cell => {
		cell.innerHTML = "";
	});

	resetSettings();
	setTurnMessage();

	availableCells = initialAvailableCells;
	gameStarted = true;
	toss.classList.remove('d-none');
	activeTurn = FIRST_TURN;
}

document.addEventListener('DOMContentLoaded', () => {
	detectGameType();
	showConfirmNamesModal();
});
startButton.addEventListener('click', startGame);
