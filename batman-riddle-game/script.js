/*
    Batman Riddle Minigame
    This file controls the riddles, timer, buttons, game screens, and audio.

    Audio setup:
    Put your sound files inside the audio folder with these exact names:
    - audio/intro.mp3
    - audio/game-music.mp3
    - audio/wrong-answer.mp3
    - audio/batman-help.mp3
    - audio/you-lose.mp3
    - audio/you-win.mp3
    - audio/button-hover.mp3

    If your filenames are different, change the paths in the audio object below.
*/

const TOTAL_RIDDLES_TO_WIN = 3;
const STARTING_TIME_SECONDS = 120;

// These are local riddles. This replaces the need for a real API.
const riddles = [
    {
        question: "I speak without a mouth and hear without ears. I have nobody, but I come alive with wind. What am I?",
        answer: "echo"
    },
    {
        question: "The more of me you take, the more you leave behind. What am I?",
        answer: "footsteps"
    },
    {
        question: "What has keys but cannot open locks?",
        answer: "piano"
    },
    {
        question: "What can travel around the world while staying in the same corner?",
        answer: "stamp"
    },
    {
        question: "What gets wetter the more it dries?",
        answer: "towel"
    },
    {
        question: "What has a head, a tail, but no body?",
        answer: "coin"
    },
    {
        question: "What has many teeth but cannot bite?",
        answer: "comb"
    },
    {
        question: "What can fill a room but takes up no space?",
        answer: "light"
    },
    {
       question: "It can be cruel, poetic, or blind, but when it's denied, its violence you may find.",
       answer: "justice"
    }
];

// Audio objects let JavaScript play local sound files.
const audio = {
    intro: new Audio("audio/threeriddlestwomintes.mp3"),
    music: new Audio("audio/64kmusic.mp3"),
    wrong: new Audio("audio/wronganswerNO.mp3"),
    batmanHelp: new Audio("audio/batman's hint a cat.mp3"),
    lose: new Audio("audio/somethingintheway.mp3"),
    win: new Audio("audio/thebatmanvictory.mp3"),
    hover: new Audio("audio/batmanhoversound(heknowsthisone).mp3")
};

// Loop the background music while the game is active.
audio.music.loop = true;

// Grab the HTML elements that JavaScript needs to change.
const timerElement = document.getElementById("timer");
const scoreElement = document.getElementById("score");
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const batmanHelpScreen = document.getElementById("batman-help-screen");
const endScreen = document.getElementById("end-screen");
const startButton = document.getElementById("start-button");
const retryButton = document.getElementById("retry-button");
const answerForm = document.getElementById("answer-form");
const answerInput = document.getElementById("answer-input");
const riddleText = document.getElementById("riddle-text");
const feedbackMessage = document.getElementById("feedback-message");
const askBatmanButton = document.getElementById("ask-batman-button");
const batmanYesButton = document.getElementById("batman-yes-button");
const batmanNoButton = document.getElementById("batman-no-button");
const batmanAnswer = document.getElementById("batman-answer");
const endTitle = document.getElementById("end-title");
const endMessage = document.getElementById("end-message");

let selectedRiddles = [];
let currentRiddleIndex = 0;
let correctAnswers = 0;
let timeLeft = STARTING_TIME_SECONDS;
let timerInterval = null;
let gameIsActive = false;
let introIsPlaying = false;
let gameRunId = 0;

// Some browsers show an error in the console if audio is missing.
// This helper tries to play audio without stopping the whole game if a file is missing.
function playSound(sound) {
    sound.currentTime = 0;
    const playPromise = sound.play();

    if (playPromise !== undefined) {
        playPromise.catch(function () {
            // If the file is missing or blocked, the game keeps going without sound.
        });
    }
}

function playSoundThen(sound, nextFunction) {
    let finished = false;

    function finish() {
        if (finished) {
            return;
        }

        finished = true;
        sound.removeEventListener("ended", finish);
        sound.removeEventListener("error", finish);
        nextFunction();
    }

    sound.addEventListener("ended", finish);
    sound.addEventListener("error", finish);
    sound.currentTime = 0;

    const playPromise = sound.play();

    if (playPromise !== undefined) {
        playPromise.catch(finish);
    }
}

function resumeSound(sound) {
    const playPromise = sound.play();

    if (playPromise !== undefined) {
        playPromise.catch(function () {
            // If the file is missing or blocked, the game keeps going without sound.
        });
    }
}

function stopSound(sound) {
    sound.pause();
    sound.currentTime = 0;
}

function stopAllAudio() {
    stopSound(audio.intro);
    stopSound(audio.music);
    stopSound(audio.wrong);
    stopSound(audio.batmanHelp);
    stopSound(audio.lose);
    stopSound(audio.win);
    stopSound(audio.hover);
}

function showScreen(screenToShow) {
    // Hide every screen first.
    startScreen.classList.remove("active");
    gameScreen.classList.remove("active");
    batmanHelpScreen.classList.remove("active");
    endScreen.classList.remove("active");

    // Then show only the screen we want.
    screenToShow.classList.add("active");
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateScoreDisplay() {
    scoreElement.textContent = `${correctAnswers} / ${TOTAL_RIDDLES_TO_WIN}`;
}

function chooseRandomRiddles() {
    // Make a copy of the riddle list so the original array stays unchanged.
    const shuffledRiddles = [...riddles];

    // Shuffle the copied array using a simple random sort.
    shuffledRiddles.sort(function () {
        return Math.random() - 0.5;
    });

    // Use only the number of riddles needed to win.
    selectedRiddles = shuffledRiddles.slice(0, TOTAL_RIDDLES_TO_WIN);
}

function showCurrentRiddle() {
    const currentRiddle = selectedRiddles[currentRiddleIndex];
    riddleText.textContent = currentRiddle.question;
    answerInput.value = "";
    answerInput.focus();
}

function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();

    timerInterval = setInterval(function () {
        timeLeft -= 1;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            loseGame("Time is up. Gotham has fallen.");
        }
    }, 1000);
}

function startGame() {
    gameRunId += 1;
    stopAllAudio();
    clearInterval(timerInterval);

    introIsPlaying = true;
    gameIsActive = false;
    correctAnswers = 0;
    currentRiddleIndex = 0;
    timeLeft = STARTING_TIME_SECONDS;
    feedbackMessage.textContent = "";
    batmanAnswer.textContent = "He might know the answer. Maybe.";

    chooseRandomRiddles();
    updateTimerDisplay();
    updateScoreDisplay();
    showScreen(startScreen);

    // The intro plays first. Gameplay begins after it ends.
    // If the intro file is missing, the catch block starts gameplay anyway.
    audio.intro.currentTime = 0;
    const introPromise = audio.intro.play();

    if (introPromise !== undefined) {
        introPromise.catch(function () {
            beginGameplay();
        });
    }
}

function beginGameplay() {
    if (!introIsPlaying) {
        return;
    }

    introIsPlaying = false;
    gameIsActive = true;
    showScreen(gameScreen);
    showCurrentRiddle();
    startTimer();
    resumeSound(audio.music);
}

function winGame() {
    gameIsActive = false;
    introIsPlaying = false;
    clearInterval(timerInterval);
    stopSound(audio.intro);
    stopSound(audio.music);
    stopSound(audio.batmanHelp);

    endTitle.textContent = "Gotham Is Saved";
    endMessage.textContent = "You do not hide in the shadows, you are the shadows. You are Vengence";
    showScreen(endScreen);
    playSound(audio.win);
}

function loseGame(message, playWrongSoundFirst = false) {
    const endingRunId = gameRunId;

    gameIsActive = false;
    introIsPlaying = false;
    clearInterval(timerInterval);
    stopSound(audio.intro);
    stopSound(audio.music);
    stopSound(audio.batmanHelp);
    stopSound(audio.lose);
    stopSound(audio.wrong);

    endTitle.textContent = "You Lose";
    endMessage.textContent = message;
    showScreen(endScreen);

    // A wrong answer plays its sound first, then the final lose-screen sound.
    // This keeps the two clips from playing over each other.
    if (playWrongSoundFirst) {
        playSoundThen(audio.wrong, function () {
            if (endingRunId === gameRunId && !gameIsActive) {
                playSound(audio.lose);
            }
        });
    } else {
        playSound(audio.lose);
    }
}

function checkAnswer(event) {
    event.preventDefault();

    if (!gameIsActive) {
        return;
    }

    const playerAnswer = answerInput.value.trim().toLowerCase();
    const correctAnswer = selectedRiddles[currentRiddleIndex].answer.toLowerCase();

    if (playerAnswer === correctAnswer) {
        correctAnswers += 1;
        currentRiddleIndex += 1;
        updateScoreDisplay();

        if (correctAnswers === TOTAL_RIDDLES_TO_WIN) {
            winGame();
        } else {
            feedbackMessage.textContent = "Correct. The Riddler has another one.";
            showCurrentRiddle();
        }
    } else {
        loseGame("Gotham blew up XD", true);
    }
}

function showBatmanHelpPrompt() {
    if (!gameIsActive) {
        return;
    }

    batmanAnswer.textContent = "He might know the answer. Maybe.";
    feedbackMessage.textContent = "";
    showScreen(batmanHelpScreen);
}

function acceptBatmanHelp() {
    if (!gameIsActive) {
        return;
    }

    audio.music.pause();
    batmanAnswer.textContent = 'Batman says: "A cat."';
    playSound(audio.batmanHelp);
}

function closeBatmanHelp() {
    if (!gameIsActive) {
        return;
    }

    showScreen(gameScreen);
    answerInput.focus();
}

// When Batman's sound effect finishes, resume the music if the game is still active.
audio.batmanHelp.addEventListener("ended", function () {
    if (gameIsActive) {
        resumeSound(audio.music);
    }
});

// If the intro audio finishes normally, gameplay begins.
audio.intro.addEventListener("ended", beginGameplay);

// If the intro file is missing or cannot play, begin the game anyway.
audio.intro.addEventListener("error", beginGameplay);

startButton.addEventListener("click", startGame);
retryButton.addEventListener("click", startGame);
answerForm.addEventListener("submit", checkAnswer);
askBatmanButton.addEventListener("click", showBatmanHelpPrompt);
batmanYesButton.addEventListener("click", acceptBatmanHelp);
batmanNoButton.addEventListener("click", closeBatmanHelp);

askBatmanButton.addEventListener("mouseenter", function () {
    if (gameIsActive) {
        playSound(audio.hover);
    }
});

// Set the initial display values when the page first loads.
updateTimerDisplay();
updateScoreDisplay();
