/*collision functions */
function handleCollisions(objectsByFaction, projectilesByFaction) {
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
                            console.log("proj proj coll");
                            projectile1.startDestruction();
                            projectile2.startDestruction();
                        }
                    });
                });
            }
        }
        //projectile collides with faction object other than faction 0 (terrain)
        for (let j = 1; j < objectsByFaction.length; j++) {
            if (i != j) {
                projectilesByFaction[i].forEach((projectile) => {
                    objectsByFaction[j].forEach((object) => {
                        if (projectile.hasCollision && object.hasCollision && areObjectsColliding(projectile, object)) {
                            console.log("proj act coll");
                            projectile.startDestruction();
                            object.startDestruction();
                        }
                    });
                });
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
                });
            });
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
                                levels[currentLevel].fishCounter++;
                            }
                            if (object1.constructor.name == "Fish" && object2.constructor.name == "Shark") {
                                object1.startDestruction();
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
function areObjectsColliding(object1, object2) {
    collisionChecks++;
    let type1 = object1.type;
    let type2 = object2.type;
    if (type1 = "rectangle") {
        if (type2 = "rectangle") {
            return collisionRectangleRectangle(object1, object2);
        }
        else {
            return collisionRectangleCircle(object1, object2);
        }
    }
    else {
        if (type2 = "rectangle") {
            return collisionRectangleCircle(object2, object1);
        }
        else {
            return collisionCircleCircle(object1, object2);
        }
    }
}
function collisionRectangleRectangle(rectangle1, rectangle2) {
    return (rectangle1.shape.x < rectangle2.shape.x + rectangle2.shape.width &&
        rectangle1.shape.x + rectangle1.shape.width > rectangle2.shape.x &&
        rectangle1.shape.y < rectangle2.shape.y + rectangle2.shape.height &&
        rectangle1.shape.y + rectangle1.shape.height > rectangle2.shape.y);
}
function collisionRectangleCircle(rectangle, circle) {
    if (rectangle.type == "circle") {
        let swap = rectangle;
        rectangle = circle;
        circle = swap;
    }
    let xborder = circle.x;
    let yborder = circle.y;
    if (circle.x < rectangle.x)
        xborder = rectangle.x;
    else if (circle.x > (rectangle.x + rectangle.width))
        xborder = rectangle.x + rectangle.width;
    if (circle.y < rectangle.y)
        yborder = rectangle.y;
    else if (circle.y > (rectangle.y + rectangle.height))
        yborder = rectangle.y + rectangle.height;
    let dist = Math.sqrt(Math.pow((circle.x - xborder), 2) + Math.pow((circle.y - yborder), 2));
    return (dist <= circle.radius);
}
function collisionCircleCircle(circle1, circle2) {
    return (vectorLength({ x: circle1.x - circle2.x, y: circle1.y - circle2.y }) <= (circle1.radius + circle2.radius));
}
