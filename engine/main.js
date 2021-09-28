const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const startTime = performance.now();
const currentInputs = new Set();
const levelAmount = 4;
const levels = new Array(levelAmount);
var currentLevel;
let camera = { x: 0, y: 0 }; //set to player position + screensize offset while running
const simulationFPS = 60; //frames per second
const simulationFPSArray = new Array();
let simulationFPSAverage = 0;
const simulationTPF = 1000 / simulationFPS; //ms
let currentFrameDuration = 0;
let isPaused = false;
const pauseButton = document.getElementsByClassName("pausebutton").item(0);
const pauseMenu = document.getElementsByClassName("pausemenu").item(0);
let collisionChecks = 0;
let lastFrameTime = 0;
let totalRuntime = 0;
let currentFrame = 0; // last calculated frame, incremented by game logic
let lastDrawnFrame = 0; // last drawn frame, incremented by draw loop
function start() {
    //html stat display, static part
    document.getElementById("type1").textContent = "allObjects: ";
    document.getElementById("type2").textContent = "drawableObjects: ";
    document.getElementById("type3").textContent = "updateableObjects: ";
    document.getElementById("type4").textContent = "Fish: ";
    document.getElementById("type5").textContent = "Sharks: ";
    document.getElementById("type6").textContent = "collisionChecks: ";
    document.getElementById("type7").textContent = "";
    document.getElementById("type8").textContent = "Player Speed: ";
    document.getElementById("type9").textContent = "Fish eaten: ";
    document.getElementById("type10").textContent = "Frametime: ";
    currentLevel = 0;
    levels[0] = new PenguinLevel(context);
    //unpause and start Game
    togglePause();
    pauseButton.textContent = "Start";
    logicLoop();
    drawLoop();
}
function logicLoop() {
    setTimeout(logicLoop, 0);
    //only process logic if not paused and enough time has paused
    if (!isPaused) {
        currentFrameDuration = performance.now() - lastFrameTime;
        if (currentFrameDuration > simulationTPF - 10) {
            collisionChecks = 0;
            levels[currentLevel].update(currentFrameDuration);
            lastFrameTime = performance.now();
            currentFrame++;
            if (simulationFPSArray.length == 60) {
                simulationFPSArray.shift();
            }
            simulationFPSArray.push(currentFrameDuration);
            simulationFPSAverage = simulationFPSArray.reduce((a, b) => a + b) / 60;
        }
    }
}
function drawLoop() {
    //draw frame & callback
    requestAnimationFrame(drawLoop);
    if (!isPaused && currentFrame > lastDrawnFrame) {
        lastDrawnFrame++;
        //reset frame
        context.clearRect(0, 0, canvas.width, canvas.height);
        levels[currentLevel].draw();
        //update stats
        // document.getElementById("value1").textContent = allObjects.length.toString();
        document.getElementById("value2").textContent = levels[currentLevel].drawableObjects.size.toString();
        document.getElementById("value3").textContent = levels[currentLevel].updateableObjects.size.toString();
        document.getElementById("value4").textContent = levels[currentLevel].objectsByFaction[2].size.toString();
        document.getElementById("value5").textContent = levels[currentLevel].objectsByFaction[3].size.toString();
        document.getElementById("value7").textContent = collisionChecks.toString();
        if (levels[currentLevel].objectsByFaction[1].size > 0) {
            document.getElementById("value8").textContent = Math.round(vectorLength(levels[currentLevel].player.velocity)).toString();
        }
        document.getElementById("value9").textContent = levels[currentLevel].fishCounter.toString();
        // document.getElementById("value10").textContent = performance.now() - lastFrameTime + "ms";
        document.getElementById("value10").textContent = Math.round(simulationFPSAverage).toString();
        document.getElementById("fishcounter").textContent = levels[currentLevel].fishCounter.toString();
    }
}
function vectorLength(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}
function normalizeVector(vector) {
    let length = vectorLength(vector);
    return { x: vector.x / length, y: vector.y / length };
}
/* storing currently pressed buttons */
document.addEventListener('keydown', (keypress) => {
    currentInputs.add(keypress.key);
    if (keypress.key == "Escape") {
        togglePause();
    }
    if (keypress.key == "1") {
        activateOrCreateLevel(1);
    }
    if (keypress.key == "2") {
        activateOrCreateLevel(2);
    }
    if (keypress.key == "3") {
        activateOrCreateLevel(3);
    }
    if (keypress.key == "r" && isPaused == false) {
        levels[currentLevel] = new PenguinLevel(context);
    }
});
document.addEventListener('keyup', (keypress) => {
    currentInputs.delete(keypress.key);
});
document.addEventListener('mousedown', (btn) => {
    currentInputs.add("MB" + btn.button);
    // let mouseX = btn.clientX - canvas.offsetLeft;
    // let mouseY = btn.clientY - canvas.offsetTop;
    // console.log(mouseX + " " + mouseY)
});
document.addEventListener('mouseup', (btn) => {
    currentInputs.delete("MB" + btn.button);
});
pauseButton.addEventListener("click", function () {
    togglePause();
    this.blur(); //unfocus so spacebar can't trigger pause
});
function activateOrCreateLevel(number) {
    if (levels[number] == null) {
        levels[number] = new PenguinLevel(context);
    }
    currentLevel = number;
}
function togglePause() {
    pauseMenu.classList.toggle("visible");
    lastFrameTime = performance.now();
    isPaused = !isPaused;
    pauseButton.textContent = "Continue";
    // console.log("Current Objects: ");
    // console.log(objectsByFaction);
    if (levels[currentLevel].objectsByFaction[1].size == 0) {
        console.info("Restarting");
        levels[currentLevel] = new PenguinLevel(context);
        start();
        togglePause();
        pauseButton.textContent = "Restart";
        document.getElementById("menuline2").innerHTML = "use WASD to hunt tasty fish!";
    }
    // console.log(camera);
}
//DOM loaded
window.addEventListener('DOMContentLoaded', (event) => {
});
//fully loaded
window.addEventListener('load', (event) => {
    start();
});
