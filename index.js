const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const startTime = performance.now();
const gravity = 500; // units/s^2
const bounceRatio = 0.8;
const currentInputs = new Set();
const destructionTime = 300; //ms
const oceanColour =  {r:124,g:233,b:252,a:1};
const skyColour = {r:204,g:233,b:252,a:1};
camera = { x: 0, y: 0 }; //set to player position + screensize offset while running

const fishSpawnDelay = 1000;
const sharkSpawnDelay = 10000;


simulationFPS = 60; //frames per second
simulationTPF = 1000 / simulationFPS; //ms
currentFrameDuration = 0;


fishcounter = 0; //fish eaten
isPaused = false;

const penguinImage = document.getElementsByClassName("penguin").item(0);
const fishImage = document.getElementsByClassName("fish").item(0);
const sharkImage = document.getElementsByClassName("shark").item(0);

const pauseButton = document.getElementsByClassName("pausebutton").item(0);
const pauseMenu = document.getElementsByClassName("pausemenu").item(0);



allObjects = [];
drawableObjects = [];
updateableObjects = [];
collisionObjects = [];
terrainObjects = [];
projectileObjects = [];

const factionAmount = 10; //realistically no more than 3 (0: terrain, 1: player, rest: other)
const projectilesByFaction = []
const objectsByFaction = []
for (i = 0; i < factionAmount; i++) {
    projectilesByFaction.push(new Array());
    objectsByFaction.push(new Array());
}

let lastFrameTime = 0;
totalRuntime = 0;
fishSpawnTimer = 0; //time since last fish spawn
sharkSpawnTimer = 0; //time since last shark spawn


function start() {
    //html stat display, static part
    document.getElementById("type1").textContent="allObjects: ";
    document.getElementById("type2").textContent="drawableObjects: ";
    document.getElementById("type3").textContent="updateableObjects: ";
    document.getElementById("type4").textContent="collisionObjects: ";
    document.getElementById("type5").textContent="terrainObjects: ";
    document.getElementById("type6").textContent="";
    document.getElementById("type7").textContent="";
    document.getElementById("type8").textContent="";
    document.getElementById("type9").textContent="Fish eaten: ";
    document.getElementById("type10").textContent="Frametime: ";

    //create Sky
    //todo: this should be an object without collision
    for (i = 0; i < 1; i++) {
        x = -1000000;
        y = -10000
        width = 2000000;
        height = 10000;
        speed = 100;
        color = skyColour;
        sky = new DrawableObject({ x, y, width, height }, "rectangle", color);
        sky.hasCollision=false;
        sky.faction = 0;
        sky.register();
    }

    //create Fish
    for (i = 0; i < 10; i++) {
        x = canvas.width * Math.random();
        y = canvas.height * Math.random();
        let scale = Math.random() / 2 + 0.5;
        width = 50 * scale;
        height = 20 * scale;
        speed = 100;
        xvel = speed * (Math.random() - 0.5);
        yvel = speed * (Math.random() - 0.5);
        color = {r:0,g:0,b:0,a:1};
        fish = new Fish({ x, y, width, height }, "rectangle", color);
        fish.velocity.x = xvel;
        fish.velocity.y = yvel;
        fish.faction = 2;
        fish.register();
    }

    //create Shark
    //todo: should not spawn on or directly ahead of player
    // for (i = 0; i < 1; i++) {
    //     x = canvas.width * Math.random();
    //     y = canvas.height * Math.random();
    //     let scale = Math.random() / 2 + 0.5;
    //     width = 100 * scale;
    //     height = 40 * scale;
    //     speed = 100;
    //     xvel = speed * (Math.random() - 0.5);
    //     yvel = speed * (Math.random() - 0.5);
    //     color = {r:0,g:0,b:0,a:1};
    //     shark = new Shark({ x, y, width, height }, "rectangle", color);
    //     shark.velocity.x = xvel;
    //     shark.velocity.y = yvel;
    //     shark.faction = 3;
    //     shark.register();
    // }

    //create player last so its drawn last, great solution right here
    color = {r:0,g:0,b:0,a:1};
    player = new Player({ x: 300, y: 300, width: 30, height: 50 }, "rectangle", color, 3);
    player.hasCollision = true;
    player.faction = 1;
    player.affectedByGravity = false;
    player.velocity.x=25;
    player.velocity.y=25;
    player.register();

    //draw empty frame behind menu
    context.fillStyle = `rgba(${skyColour.r},${skyColour.g},${skyColour.b},${skyColour.a})`;
    context.fillRect(0, 0, canvas.width, canvas.height);

    togglePause();
    pauseButton.textContent = "Start";
    mainLoop();
}

function mainLoop() {
    //draw frame & callback
    requestAnimationFrame(mainLoop);

    if (!isPaused) {
        currentFrameDuration = performance.now() - lastFrameTime;
        if (currentFrameDuration > simulationTPF) {
            // let animationStartTime = performance.now();

            totalRuntime += currentFrameDuration;
            fishSpawnTimer += currentFrameDuration;
            sharkSpawnTimer += currentFrameDuration;

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
            updateableObjects.forEach((object) => {
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
            if (fishSpawnTimer > fishSpawnDelay && objectsByFaction[2].length<50) {
                fishSpawnTimer -= fishSpawnDelay;
                //add new Fish
                for (i = 0; i < 2; i++) {
                    x = canvas.width * Math.random();
                    y = canvas.height * Math.random();
                    let scale = Math.random() / 2 + 0.5;
                    width = 50 * scale;
                    height = 20 * scale;
                    speed = 100;
                    xvel = speed * (Math.random() - 0.5);
                    yvel = speed * (Math.random() - 0.5);
                    color = {r:0,g:0,b:0,a:1};
                    fish = new Fish({ x, y, width, height }, "rectangle", color);
                    fish.velocity.x = xvel;
                    fish.velocity.y = yvel;
                    fish.faction = 2;
                    fish.register();
                }
            }

            if (sharkSpawnTimer > sharkSpawnDelay && objectsByFaction[3].length<4) {
                sharkSpawnTimer -= sharkSpawnDelay;
                //add new Shark(s)
                for (i = 0; i < 1; i++) {
                    x = canvas.width * Math.random();
                    y = canvas.height * Math.random();
                    let scale = Math.random() / 2 + 0.5;
                    width = 100 * scale;
                    height = 40 * scale;
                    speed = 100;
                    xvel = speed * (Math.random() - 0.5);
                    yvel = speed * (Math.random() - 0.5);
                    color = {r:0,g:0,b:0,a:1};
                    shark = new Shark({ x, y, width, height }, "rectangle", color);
                    shark.velocity.x = xvel;
                    shark.velocity.y = yvel;
                    shark.faction = 3;
                    shark.register();
                }
            }

            //draw objects
            drawableObjects.forEach((object) => {
                // console.log(object);
                object.draw();
            });
            if(objectsByFaction[1].length>0) {
                objectsByFaction[1][0].draw();
            }

            //update stats
            document.getElementById("value1").textContent=allObjects.length;
            document.getElementById("value2").textContent=drawableObjects.length;
            document.getElementById("value3").textContent=updateableObjects.length;
            document.getElementById("value4").textContent=collisionObjects.length;
            document.getElementById("value5").textContent=terrainObjects.length;
            document.getElementById("value9").textContent=fishcounter;
            document.getElementById("value10").textContent=performance.now() - lastFrameTime + "ms";
            document.getElementById("fishcounter").textContent=fishcounter;

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
                for (object1 of objectsByFaction[i]) {
                    for (object2 of objectsByFaction[j]) {
                        if (object1.hasCollision && object2.hasCollision && areObjectsColliding(object1, object2)) {
                            if (object1.constructor.name == "Player" && object2.constructor.name == "Fish") {
                                object2.startDestruction();
                                fishcounter++;
                            }
                            if (object1.constructor.name == "Player" && object2.constructor.name == "Shark") {
                                object1.startDestruction();
                                togglePause();
                                document.getElementById("menuline2").innerHTML="Game Over!";
                            }
                        }
                    }
                }
            }
        }

        for (object1 of objectsByFaction[i]) {
            for (object2 of objectsByFaction[0]) {
                if (object1.hasCollision && object2.hasCollision && areObjectsColliding(object1, object2)) {
                    object1.velocity = { x: 0, y: 0 };
                    //object colliding with terrain stop completely
                }
            }
        }


    }


}




function areObjectsColliding(object1, object2) {
    type1 = object1.type;
    type2 = object2.type;
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

function collisionRectangleRectangle(rectangle1, rectangle2) {
    return (rectangle1.definition.x < rectangle2.definition.x + rectangle2.definition.width &&
        rectangle1.definition.x + rectangle1.definition.width > rectangle2.definition.x &&
        rectangle1.definition.y < rectangle2.definition.y + rectangle2.definition.height &&
        rectangle1.definition.y + rectangle1.definition.height > rectangle2.definition.y)
}
function collisionRectangleCircle(rectangle, circle) {
    //order should be irrelevant, FIX!
    xborder = circle.x
    yborder = circle.y
    if (circle.x < rectangle.x) xborder = rectangle.x
    else if (circle.x > (rectangle.x + rectangle.width)) xborder = rectangle.x + rectangle.width
    if (circle.y < rectangle.y) yborder = rectangle.y
    else if (circle.y > (rectangle.y + rectangle.height)) yborder = rectangle.y + rectangle.height
    dist = Math.sqrt((circle.x - xborder) ** 2 + (circle.y - yborder) ** 2)
    return (dist <= circle.radius)
}
function collisionCircleCircle(circle1, circle2) {
    return (vectorLength(circle1.x - circle2.x, circle1.y - circle2.y) <= (circle1.radius + circle2.radius))
}
function vectorLength(x, y) {
    return Math.sqrt(x * x + y * y)
}
function normalizeVector({ x, y }) {
    let length = vectorLength(x, y);
    return { x: x / length, y: y / length };
}
function normalize(vector) {
    length = vectorLength(vector.x, vector.y)
    return { x: vector.x / length, y: vector.y / length }
}


/* logging pressed keys */
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
    mouseX = btn.clientX - canvas.offsetLeft;
    mouseY = btn.clientY - canvas.offsetTop;
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
    console.log(objectsByFaction);
    // console.log(camera);
}

start()
