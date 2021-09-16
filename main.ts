const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const startTime = performance.now();
const gravity = 500; // units/s^2
const bounceRatio = 0.8;
const currentInputs = new Set();
const destructionTime = 300; //ms
const oceanColour = { r: 124, g: 233, b: 252, a: 1 };
const skyColour = { r: 204, g: 233, b: 252, a: 1 };


type camera = {
    x: number;
    y: number;
}

type vector = {
    x: number;
    y: number;
}

let camera: camera = { x: 0, y: 0 }; //set to player position + screensize offset while running

const fishSpawnDelay = 1000; //ms
const sharkSpawnDelay = 5000; //ms

const simulationFPS = 60; //frames per second
const simulationFPSArray: number[] = new Array();
let simulationFPSAverage: number = 0;
const simulationTPF = 1000 / simulationFPS; //ms
let currentFrameDuration = 0;

var currentLevel: Level;


let fishcounter = 0; //fish eaten
let isPaused: boolean = false;

// const penguinImage = document.getElementsByClassName("penguin").item(0);
// const fishImage = document.getElementsByClassName("fish").item(0);
// const sharkImage = document.getElementsByClassName("shark").item(0);

const penguinSrc: string = "https://www.freeiconspng.com/uploads/penguin-png-5.png";
const fishSrc: string = "https://www.freeiconspng.com/uploads/fish-png-16.png";
const sharkSrc: string = "https://www.freeiconspng.com/uploads/animal-shark-png-6.png";

const penguinImage = new Image();
penguinImage.src = penguinSrc;
const fishImage = new Image();
fishImage.src = fishSrc;
const sharkImage = new Image();
sharkImage.src = sharkSrc;

const pauseButton = document.getElementsByClassName("pausebutton").item(0);
const pauseMenu = document.getElementsByClassName("pausemenu").item(0);

let allObjects: object[] = [];
let drawableObjects: object[] = [];
let updateableObjects: object[] = [];
let collisionObjects: object[] = [];
let terrainObjects: object[] = [];
let projectileObjects: object[] = [];
let collisionChecks: number = 0;

const factionAmount = 10; //realistically no more than 3 (0: terrain, 1: player, rest: other)
const projectilesByFaction: any[][] = [];
const objectsByFaction: any[][] = [];
for (let i = 0; i < factionAmount; i++) {
    projectilesByFaction.push(new Array());
    objectsByFaction.push(new Array());
}

let lastFrameTime = 0;
let totalRuntime = 0;
let fishSpawnTimer = 0; //time since last fish spawn
let sharkSpawnTimer = 0; //time since last shark spawn

let currentFrame = 0;  // last calculated frame, incremented by game logic
let lastDrawnFrame = 0; // last drawn frame, incremented by draw loop

function start(): void {
    //html stat display, static part
    document.getElementById("type1").textContent = "allObjects: ";
    document.getElementById("type2").textContent = "drawableObjects: ";
    document.getElementById("type3").textContent = "updateableObjects: ";
    document.getElementById("type4").textContent = "collisionObjects: ";
    document.getElementById("type5").textContent = "terrainObjects: ";
    document.getElementById("type6").textContent = "collisionChecks: ";
    document.getElementById("type7").textContent = "";
    document.getElementById("type8").textContent = "Player Speed: ";
    document.getElementById("type9").textContent = "Fish eaten: ";
    document.getElementById("type10").textContent = "Frametime: ";

    currentLevel = new Level(context);
    currentLevel.start();

    //draw empty frame behind menu
    context.fillStyle = `rgba(${skyColour.r},${skyColour.g},${skyColour.b},${skyColour.a})`;
    context.fillRect(0, 0, canvas.width, canvas.height);

    //unpause and start Game
    togglePause();
    pauseButton.textContent = "Start";
    logicLoop();
    drawLoop();
}


function logicLoop(): void {
    setTimeout(logicLoop, 0);

    //only process logic if not paused and enough time has paused
    if (!isPaused) {
        currentFrameDuration = performance.now() - lastFrameTime;
        if (currentFrameDuration > simulationTPF - 10) {
            // let animationStartTime = performance.now();

           
            collisionChecks = 0;

           currentLevel.update(currentFrameDuration);

            //collision testing last
            // handleCollisions();

            lastFrameTime = performance.now();
            currentFrame++;


            if (simulationFPSArray.length == 60) {
                simulationFPSArray.shift();
            }
            simulationFPSArray.push(currentFrameDuration);
            // console.log(simulationFPSArray);
            simulationFPSAverage = simulationFPSArray.reduce((a, b) => a + b) / 60;

        }

    }

}

function drawLoop(): void {
    //draw frame & callback
    requestAnimationFrame(drawLoop);

    if (!isPaused && currentFrame > lastDrawnFrame) {
        lastDrawnFrame++;


        //reset frame
        context.clearRect(0, 0, canvas.width, canvas.height);

        //depth-dependent color calculation
        let color = [124, 233, 252];
        let newcolor = color.map((color) => {
            let depth = Math.max(0, camera.y);
            let maxdepth = 2500;
            let remainingdepth = maxdepth - depth;
            color = color * remainingdepth / maxdepth;
            return color;
        });
        context.fillStyle = `rgba(${newcolor[0]},${newcolor[1]},${newcolor[2]},1)`;
        context.fillRect(0, 0, canvas.width, canvas.height);

       currentLevel.draw();
       
        //draw player object again so it's on top. hack.
        if (objectsByFaction[1].length > 0) {
            objectsByFaction[1][0].draw();
        }

        //update stats
        // document.getElementById("value1").textContent = allObjects.length.toString();
        document.getElementById("value2").textContent = drawableObjects.length.toString();
        document.getElementById("value3").textContent = updateableObjects.length.toString();
        document.getElementById("value4").textContent = collisionObjects.length.toString();
        document.getElementById("value5").textContent = terrainObjects.length.toString();
        document.getElementById("value7").textContent = collisionChecks.toString();
        if (objectsByFaction[1].length > 0) {
            document.getElementById("value8").textContent = Math.round(vectorLength(objectsByFaction[1][0].velocity)).toString();
        }
        document.getElementById("value9").textContent = fishcounter.toString();
        // document.getElementById("value10").textContent = performance.now() - lastFrameTime + "ms";
        document.getElementById("value10").textContent = Math.round(simulationFPSAverage).toString();
        document.getElementById("fishcounter").textContent = fishcounter.toString();

    }

}

/*collision functions */
function handleCollisions(objectsByFaction: any, projectilesByFaction: any): void {
    /*
    TODO
    first projectiles collide:
        a, with non-faction projectiles
        b, with non-faction actors
        c, with terrain
    second actors collide
        a, with non-faction actors
        b, with terrain
    */


    //Projectile collisions
    for (let i = 0; i < projectilesByFaction.length; i++) { //faction 0 should not have projectiles?
        //  projectile collides with other projectile
        for (let j = 0; j < projectilesByFaction.length; j++) {
            if (i != j) {
                projectilesByFaction[i].forEach((projectile1: any) => {
                    projectilesByFaction[j].forEach((projectile2: any) => {
                        if (projectile1.hasCollision && projectile2.hasCollision && areObjectsColliding(projectile1, projectile2)) {
                            console.log("proj proj coll")
                            projectile1.startDestruction();
                            projectile2.startDestruction();
                        }
                    })
                })
            }
        }
        //projectile collides with faction object other than faction 0 (terrain)
        for (let j = 1; j < objectsByFaction.length; j++) {
            if (i != j) {
                projectilesByFaction[i].forEach((projectile: any) => {
                    objectsByFaction[j].forEach((object: any) => {
                        if (projectile.hasCollision && object.hasCollision && areObjectsColliding(projectile, object)) {
                            console.log("proj act coll")
                            projectile.startDestruction();
                            object.startDestruction();
                        }
                    })
                })
            }
        }
        //projectile collides with faction 0 object (terrain)
        if (i != 0) {
            //TODO let faction 0 projectiles collide with terrain?
            projectilesByFaction[i].forEach((projectile: any) => {
                objectsByFaction[0].forEach((object: any) => {
                    if (projectile.hasCollision && object.hasCollision && areObjectsColliding(projectile, object)) {
                        projectile.startDestruction();
                        console.log("proj terr coll");
                    }
                })
            })
        }
    }

    for (let i = 1; i < objectsByFaction.length; i++) {
        for (let j = i + 1; j < objectsByFaction.length; j++) {
            if (i != j) {
                for (let object1 of objectsByFaction[i]) {
                    for (let object2 of objectsByFaction[j]) {
                        if (object1.hasCollision && object2.hasCollision && areObjectsColliding(object1, object2)) {
                            if (object1.constructor.name == "Player" && object2.constructor.name == "Fish") {
                                object2.startDestruction();
                                fishcounter++;
                            }
                            if (object1.constructor.name == "Player" && object2.constructor.name == "Shark") {
                                object1.startDestruction();
                                document.getElementById("menuline2").innerHTML = "Game Over!";
                                togglePause();
                            }
                        }
                    }
                }
            }
        }

        for (let object1 of objectsByFaction[i]) {
            for (let object2 of objectsByFaction[0]) {
                if (object1.hasCollision && object2.hasCollision && areObjectsColliding(object1, object2)) {
                    object1.velocity = { x: 0, y: 0 };
                    //object colliding with terrain stop completely
                }
            }
        }


    }


}




function areObjectsColliding(object1: any, object2: any): boolean {
    collisionChecks++;
    let type1 = object1.type;
    let type2 = object2.type;
    if (type1 = "rectangle") {
        if (type2 = "rectangle") {
            return collisionRectangleRectangle(object1, object2);
        } else {
            return collisionRectangleCircle(object1, object2);
        }
    } else {
        if (type2 = "rectangle") {
            return collisionRectangleCircle(object2, object1); //<- IMPORTANT todo order should be irrelevant, fix this
        } else {
            return collisionCircleCircle(object1, object2);
        }
    }
}

function collisionRectangleRectangle(rectangle1: any, rectangle2: any): boolean {
    return (rectangle1.definition.x < rectangle2.definition.x + rectangle2.definition.width &&
        rectangle1.definition.x + rectangle1.definition.width > rectangle2.definition.x &&
        rectangle1.definition.y < rectangle2.definition.y + rectangle2.definition.height &&
        rectangle1.definition.y + rectangle1.definition.height > rectangle2.definition.y)
}
function collisionRectangleCircle(rectangle: any, circle: any): boolean {
    //order should be irrelevant, FIX!
    let xborder = circle.x
    let yborder = circle.y
    if (circle.x < rectangle.x) xborder = rectangle.x
    else if (circle.x > (rectangle.x + rectangle.width)) xborder = rectangle.x + rectangle.width
    if (circle.y < rectangle.y) yborder = rectangle.y
    else if (circle.y > (rectangle.y + rectangle.height)) yborder = rectangle.y + rectangle.height
    let dist = Math.sqrt((circle.x - xborder) ** 2 + (circle.y - yborder) ** 2)
    return (dist <= circle.radius)
}
function collisionCircleCircle(circle1: any, circle2: any): boolean {
    return (vectorLength({ x: circle1.x - circle2.x, y: circle1.y - circle2.y }) <= (circle1.radius + circle2.radius))
}
function vectorLength(vector: vector): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y)
}
function normalizeVector(vector: vector): vector {
    let length = vectorLength(vector);
    return { x: vector.x / length, y: vector.y / length };
}


/* storing currently pressed buttons */
document.addEventListener('keydown', (keypress) => {
    currentInputs.add(keypress.key);
    if (keypress.key == "Escape") {
        togglePause();
    }
    // console.log(currentInputs);

});
document.addEventListener('keyup', (keypress) => {
    currentInputs.delete(keypress.key);
});

document.addEventListener('mousedown', (btn) => {
    currentInputs.add("MB" + btn.button)
    // console.log(currentInputs)
    // let mouseX = btn.clientX - canvas.offsetLeft;
    // let mouseY = btn.clientY - canvas.offsetTop;
    // console.log(mouseX + " " + mouseY)
});
document.addEventListener('mouseup', (btn) => {
    currentInputs.delete("MB" + btn.button)
});

pauseButton.addEventListener("click", function () {
    togglePause();
    this.blur(); //unfocus so spacebar can't trigger pause
})

function togglePause(): void {
    pauseMenu.classList.toggle("visible");
    lastFrameTime = performance.now();
    isPaused = !isPaused;
    pauseButton.textContent = "Continue";
    // console.log("Current Objects: ");
    // console.log(objectsByFaction);

    if (currentLevel.objectsByFaction[1].length == 0) {
        console.info("Restarting");
        currentLevel = new Level(context);
        
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
