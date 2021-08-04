const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const startTime = performance.now();
const gravity = 0.1;
const bounceRatio = 0.8;
const currentInputs = new Set();
const factionAmount = 10; //realistically no more than 3

fishcounter = 0;

isPaused = false;

const penguinImage = document.getElementsByClassName("penguin").item(0);
const fishImage = document.getElementsByClassName("fish").item(0);
const pauseButton = document.getElementsByClassName("pausebutton").item(0);
const pauseMenu = document.getElementsByClassName("pausemenu").item(0);



allObjects = [];
drawableObjects = [];
updateableObjects = [];
collisionObjects = [];
terrainObjects = [];
projectileObjects = [];

const projectilesByFaction = []
const objectsByFaction = []
for (i = 0; i < factionAmount; i++) {
    projectilesByFaction.push(new Array());
    objectsByFaction.push(new Array());
}

let frameTime = startTime;
let currentTime = startTime;


function start() {
    //html stat display, static part
    $(".statlist .stat1 .type").html("allObjects: ");
    $(".statlist .stat2 .type").html("drawableObjects: ");
    $(".statlist .stat3 .type").html("updateableObjects: ");
    $(".statlist .stat4 .type").html("collisionObjects: ");
    $(".statlist .stat5 .type").html("terrainObjects: ");
    $(".statlist .stat6").hide();
    $(".statlist .stat7").hide();
    $(".statlist .stat8").hide();
    $(".statlist .stat9").hide();
    $(".statlist .stat10 .type").html("frametime: ");




    //create circles
    // for (i = 0; i < 10; i++) {
    //     x = canvas.width * Math.random();
    //     y = canvas.height * Math.random();
    //     radius = 30 * Math.random() + 10;
    //     speed = 0;
    //     xvel = speed * (Math.random() - 0.5);
    //     yvel = speed * (Math.random() - 0.5);
    //     color = new jQuery.Color(`hsla(${Math.random() * 360},100%,50%,1)`);
    //     testcircle = new TestEnemy(x, y, radius, color, true);
    //     testcircle.velocity.x = xvel;
    //     testcircle.velocity.y = yvel;
    //     testcircle.faction = 2;
    //     testcircle.register();
    // }

    //create rectangles
    // for (i = 0; i < 10; i++) {
    //     x = canvas.width * Math.random();
    //     y = canvas.height * Math.random();
    //     width = 45 * Math.random() + 10;
    //     height = 45 * Math.random() + 10;
    //     speed = 0;
    //     xvel = speed * (Math.random() - 0.5);
    //     yvel = speed * (Math.random() - 0.5);
    //     color = new jQuery.Color(`hsla(${Math.random() * 360},100%,50%,1)`);
    //     testRectangle = new Actor(x, y, width, height, color, true);
    //     testRectangle.velocity.x = xvel;
    //     testRectangle.velocity.y = yvel;
    //     testRectangle.faction = 3;
    //     testRectangle.register();
    // }

    for (i = 0; i < 10; i++) {
        x = canvas.width * Math.random();
        y = canvas.height * Math.random();
        width = 70;
        height = 30;
        speed = 1;
        xvel = speed * (Math.random() - 0.5);
        yvel = speed * (Math.random() - 0.5);
        color = new jQuery.Color("rgba(102,204,255,1)");
        testRectangle = new Fish(x, y, width, height, color, true);
        testRectangle.velocity.x = xvel;
        testRectangle.velocity.y = yvel;
        testRectangle.faction = 2;
        testRectangle.register();
    }

    // create border walls
    wallN = new TerrainRectangle(-100, -90, canvas.width + 200, 100, new jQuery.Color("blue"));
    wallN.faction = 0;
    wallN.register();
    wallE = new TerrainRectangle(canvas.width - 10, -100, 100, canvas.height + 200, new jQuery.Color("blue"));
    wallE.faction = 0;
    wallE.register();
    wallS = new TerrainRectangle(-100, canvas.height - 10, canvas.width + 200, 100, new jQuery.Color("blue"));
    wallS.faction = 0;
    wallS.register();
    wallW = new TerrainRectangle(-90, -100, 100, canvas.height + 200, new jQuery.Color("blue"));
    wallW.faction = 0;
    wallW.register();
    // wallCenter = new TerrainRectangle(400, -100, 100, canvas.height + 200, new jQuery.Color("blue"));
    // wallCenter.faction = 0;
    // wallCenter.register();

    //create player last so its drawn last, great solution right here
    player = new Player(300, 300, 59, 100, new jQuery.Color("white"), 1);
    player.hasCollision = true;
    player.faction = 1;
    player.affectedByGravity = false;
    player.register();


    mainLoop();
    // console.log(objectsByFaction[0])

}

function mainLoop() {
    //recursion
    requestAnimationFrame(mainLoop);



    if (!isPaused) {
        //reset frame
        context.fillStyle = "rgba(102,204,255,1)";

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillRect(0, 0, canvas.width, canvas.height);

        //update objects
        updateableObjects.forEach(object => {
            object.update();
        })

        //collision testing after updating but before drawing
        handleCollisions();

        //cleanup offscreen objects
        drawableObjects.forEach(object => {
            if (object.x < -canvas.width || object.x > 2 * canvas.width || object.y < -canvas.height || object.y > 2 * canvas.height) {
                object.deregister();
            }
        })

        //draw objects
        drawableObjects.forEach(object => {
            object.draw();
        })

        //update stats
        $(".statlist .stat1 .value").html(allObjects.length);
        $(".statlist .stat2 .value").html(drawableObjects.length);
        $(".statlist .stat3 .value").html(updateableObjects.length);
        $(".statlist .stat4 .value").html(collisionObjects.length);
        $(".statlist .stat5 .value").html(terrainObjects.length);
        $(".statlist .stat10 .value").html(performance.now() - currentTime + "ms");
        $(".fishcounter").html(fishcounter);
        currentTime = performance.now();
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
        if (i != 0) { //TODO let faction 0 projectiles collide with terrain?
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
                            // TODO Collisions between objects from 
                            if (object1.constructor.name == "Player" && object2.constructor.name == "Fish") {
                                object2.startDestruction();
                                fishcounter++;
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
                }
            }
        }


    }


}

function togglePause() {
    console.log("pause/unpause");
    pauseMenu.classList.toggle("visible");
    isPaused = !isPaused;

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
            return collisionRectangleCircle(object2, object1); //<- IMPORTANT
        } else {
            return collisionCircleCircle(object1, object2);
        }
    }
}

function collisionRectangleRectangle(rectangle1, rectangle2) {
    return (rectangle1.x < rectangle2.x + rectangle2.width &&
        rectangle1.x + rectangle1.width > rectangle2.x &&
        rectangle1.y < rectangle2.y + rectangle2.height &&
        rectangle1.y + rectangle1.height > rectangle2.y)
}
function collisionRectangleCircle(rectangle, circle) {
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
    return (pyth(circle1.x - circle2.x, circle1.y - circle2.y) <= (circle1.radius + circle2.radius))
}
function pyth(x, y) {
    return Math.sqrt(x * x + y * y)
}
function normalize(vector) {
    length = pyth(vector.x, vector.y)
    return { x: vector.x / length, y: vector.y / length }
}


/* logging pressed keys */
document.addEventListener('keydown', keypress => {
    currentInputs.add(keypress.key);
    if (keypress.key == "Escape") {
        togglePause();
    }
    console.log(currentInputs)
});
document.addEventListener('keyup', keypress => {
    currentInputs.delete(keypress.key);
});
document.addEventListener('mousedown', btn => {
    currentInputs.add("MB" + btn.button)
    console.log(currentInputs)
    // console.log(btn)
    // console.log(canvas)
    mouseX = btn.clientX - canvas.offsetLeft;
    mouseY = btn.clientY - canvas.offsetTop;
    // console.log(mouseX + " " + mouseY)
});
document.addEventListener('mouseup', btn => {
    currentInputs.delete("MB" + btn.button)
});
pauseButton.addEventListener("click", function () {
    togglePause();
    this.blur();
})

start()

