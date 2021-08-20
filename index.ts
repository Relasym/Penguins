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
const sharkSpawnDelay = 10000; //ms


const simulationFPS = 60; //frames per second
const simulationTPF = 1000 / simulationFPS; //ms
let currentFrameDuration = 0;


let fishcounter = 0; //fish eaten
let isPaused: boolean = false;

const penguinImage = document.getElementsByClassName("penguin").item(0);
const fishImage = document.getElementsByClassName("fish").item(0);
const sharkImage = document.getElementsByClassName("shark").item(0);

const penguinSrc: string = "https://www.freeiconspng.com/uploads/penguin-png-5.png";
const fishSrc: string = "https://www.freeiconspng.com/uploads/fish-png-16.png";
const sharkSrc: string = "https://www.freeiconspng.com/uploads/animal-shark-png-6.png";

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


function start() {
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

    //create Sky
    //todo: this should be an object without collision
    for (let i = 0; i < 1; i++) {
        let x = -1000000;
        let y = -10000
        let width = 2000000;
        let height = 10000;
        let speed = 100;
        let color = skyColour;
        let sky = new DrawableObject({ x: x, y: y, width: width, height: height }, "rectangle", color);
        sky.hasCollision = false;
        sky.faction = 0;
        sky.register();
    }

    //create Fish
    for (let i = 0; i < 10; i++) {
        let x = canvas.width * Math.random();
        let y = canvas.height * Math.random();
        let scale = Math.random() / 2 + 0.5;
        let width = 50 * scale;
        let height = 20 * scale;
        let speed = 100;
        let xvel = speed * (Math.random() - 0.5);
        let yvel = speed * (Math.random() - 0.5);
        let color = { r: 0, g: 0, b: 0, a: 1 };
        let fish = new Fish({ x, y, width, height }, "rectangle", color);
        fish.velocity.x = xvel;
        fish.velocity.y = yvel;
        fish.faction = 2;
        fish.register();
    }

    //create player last so its drawn last, great solution right here
    let color = { r: 0, g: 0, b: 0, a: 1 };
    let player = new Player({ x: 300, y: 300, width: 30, height: 50 }, "rectangle", color, 3);
    player.hasCollision = true;
    player.faction = 1;
    player.affectedByGravity = false;
    player.velocity.x = 25;
    player.velocity.y = 25;
    player.register();

    //draw empty frame behind menu
    context.fillStyle = `rgba(${skyColour.r},${skyColour.g},${skyColour.b},${skyColour.a})`;
    context.fillRect(0, 0, canvas.width, canvas.height);

    //unpause and start Game
    togglePause();
    pauseButton.textContent = "Start";
    mainLoop();
}

function mainLoop() {
    //draw frame & callback
    requestAnimationFrame(mainLoop);

    //only process logic if not paused and enough time has paused
    if (!isPaused) {
        currentFrameDuration = performance.now() - lastFrameTime;
        if (currentFrameDuration > simulationTPF) {
            // let animationStartTime = performance.now();

            totalRuntime += currentFrameDuration;
            fishSpawnTimer += currentFrameDuration;
            sharkSpawnTimer += currentFrameDuration;
            collisionChecks = 0;

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

            //update objects
            updateableObjects.forEach((object: BasicObject) => {
                object.update();
            });

            //collision testing after updating but before drawing
            handleCollisions();

            //cleanup offscreen objects
            // drawableObjects.forEach(object => {
            //     if (object.x < -canvas.width || object.x > 2 * canvas.width || object.y < -canvas.height || object.y > 2 * canvas.height) {
            //         object.deregister();
            //     }
            // })

            //add new objects
            if (fishSpawnTimer > fishSpawnDelay && objectsByFaction[2].length < 100) {
                fishSpawnTimer -= fishSpawnDelay;
                //add new Fish
                for (let i = 0; i < 4; i++) {
                    let x = canvas.width * Math.random();
                    let y = canvas.height * Math.random();
                    let scale = Math.random() / 2 + 0.5;
                    let width = 50 * scale;
                    let height = 20 * scale;
                    let speed = 100;
                    let xvel = speed * (Math.random() - 0.5);
                    let yvel = speed * (Math.random() - 0.5);
                    let color = { r: 0, g: 0, b: 0, a: 1 };
                    let fish = new Fish({ x, y, width, height }, "rectangle", color);
                    fish.velocity.x = xvel;
                    fish.velocity.y = yvel;
                    fish.faction = 2;
                    fish.register();
                }
            }

            if (sharkSpawnTimer > sharkSpawnDelay && objectsByFaction[3].length < 4) {
                sharkSpawnTimer -= sharkSpawnDelay;
                //add new Shark(s)
                for (let i = 0; i < 1; i++) {
                    let x = canvas.width * Math.random();
                    let y = canvas.height * Math.random();
                    let scale = Math.random() / 2 + 0.5;
                    let width = 100 * scale;
                    let height = 40 * scale;
                    let speed = 100;
                    let xvel = speed * (Math.random() - 0.5);
                    let yvel = speed * (Math.random() - 0.5);
                    let color = { r: 0, g: 0, b: 0, a: 1 };
                    let shark = new Shark({ x, y, width, height }, "rectangle", color);
                    shark.velocity.x = xvel;
                    shark.velocity.y = yvel;
                    shark.faction = 3;
                    shark.register();
                }
            }

            //draw objects
            drawableObjects.forEach((object: DrawableObject) => {
                // console.log(object);
                object.draw();
            });
            if (objectsByFaction[1].length > 0) {
                objectsByFaction[1][0].draw();
            }

            //update stats
            document.getElementById("value1").textContent = allObjects.length.toString();
            document.getElementById("value2").textContent = drawableObjects.length.toString();
            document.getElementById("value3").textContent = updateableObjects.length.toString();
            document.getElementById("value4").textContent = collisionObjects.length.toString();
            document.getElementById("value5").textContent = terrainObjects.length.toString();
            document.getElementById("value7").textContent = collisionChecks.toString();
            if (objectsByFaction[1].length > 0) {
                document.getElementById("value8").textContent = Math.round(vectorLength(objectsByFaction[1][0].velocity)).toString();
            }
            document.getElementById("value9").textContent = fishcounter.toString();
            document.getElementById("value10").textContent = performance.now() - lastFrameTime + "ms";
            document.getElementById("fishcounter").textContent = fishcounter.toString();

            lastFrameTime = performance.now();

            // let animationEndTime = performance.now();
            // console.log(animationEndTime - animationStartTime);
        }

    }


}

/*collision functions */
function handleCollisions() {
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
                projectilesByFaction[i].forEach((projectile1) => {
                    projectilesByFaction[j].forEach((projectile2) => {
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
                projectilesByFaction[i].forEach((projectile) => {
                    objectsByFaction[j].forEach((object) => {
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
            projectilesByFaction[i].forEach((projectile) => {
                objectsByFaction[0].forEach((object) => {
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
                                togglePause();
                                document.getElementById("menuline2").innerHTML = "Game Over!";
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




function areObjectsColliding(object1: any, object2: any) {
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

function collisionRectangleRectangle(rectangle1: any, rectangle2: any) {
    return (rectangle1.definition.x < rectangle2.definition.x + rectangle2.definition.width &&
        rectangle1.definition.x + rectangle1.definition.width > rectangle2.definition.x &&
        rectangle1.definition.y < rectangle2.definition.y + rectangle2.definition.height &&
        rectangle1.definition.y + rectangle1.definition.height > rectangle2.definition.y)
}
function collisionRectangleCircle(rectangle: any, circle: any) {
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
function collisionCircleCircle(circle1: any, circle2: any) {
    return (vectorLength({ x: circle1.x - circle2.x, y: circle1.y - circle2.y }) <= (circle1.radius + circle2.radius))
}
function vectorLength(vector: vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y)
}
function normalizeVector(vector: vector) {
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

function togglePause() {
    pauseMenu.classList.toggle("visible");
    lastFrameTime = performance.now();
    isPaused = !isPaused;
    pauseButton.textContent = "Continue";
    console.log("Current Objects: ")
    console.log(objectsByFaction);
    // console.log(camera);
}


//DOM loaded
window.addEventListener('DOMContentLoaded', (event) => {
});

//fully loaded
window.addEventListener('load', (event) => {
    start();
});
