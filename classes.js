class BasicObject {
    faction;
    hasCollision = false;
    isDrawable = false;
    isUpdateable = false;
    isDestroying = false;
    faction;
    destructionTime = 300; //ms
    destructionProgress = 1.0; //destroys object if it reaches 0, used as a multiplier for color alpha

    register() {
        allObjects.push(this)
        if (this.isDrawable) { drawableObjects.push(this) }
        if (this.isUpdateable) { updateableObjects.push(this) }
        objectsByFaction[this.faction].push(this);
    }

    deregister() {
        allObjects.splice(allObjects.indexOf(this), 1);
        if (this.isDrawable) { drawableObjects.splice(drawableObjects.indexOf(this), 1); }
        if (this.isUpdateable) { updateableObjects.splice(updateableObjects.indexOf(this), 1); }
    }

    startDestruction() {
        this.hasCollision = false;
        this.isDestroying = true;
        objectsByFaction[this.faction].splice(objectsByFaction[this.faction].indexOf(this), 1);
    }

    update() {
        if (this.isDestroying) {
            this.destructionProgress -= currentFrameDuration / this.destructionTime;
        }
        if (this.destructionProgress <= 0) {
            this.deregister();
        }
    }
}

class DrawableObject extends BasicObject {
    type;
    image=null;
    isDrawable = true;
    hasCollision = true;
    rotation=0;
    constructor(definition, type, color) {
        super()
        this.definition = definition;
        this.type = type;
        this.color = color;
    }
    draw() {
        if (this.type == "circle") {
            //todo add images for circle types
            context.beginPath();
            context.arc(this.definition.x - camera.x, this.definition.y - camera.y, this.definition.radius, 0, Math.PI * 2, false);
            if (this.isDestroying) {
                context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a*this.destructionProgress})`;
            } else {
                context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
            }
            context.fill();
        }

        if (this.type == "rectangle") {
            if (this.isDestroying) {
                let color = [...this.color._rgba];
                color[3] *= this.destructionProgress;
                context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a*this.destructionProgress})`;
            } else {
                context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
            }

            context.translate(this.definition.x + this.definition.width / 2, this.definition.y + this.definition.height / 2);
            context.rotate(this.rotation);
            context.translate(-1 * (this.definition.x + this.definition.width / 2), -1 * (this.definition.y + this.definition.height / 2));
            context.fillRect(this.definition.x - camera.x, this.definition.y - camera.y, this.definition.width, this.definition.height);
            if (this.image != null) {
                context.drawImage(image, this.definition.x - camera.x, this.definition.y - camera.y, this.definition.width, this.definition.height);
            }
            context.setTransform(1, 0, 0, 1, 0, 0);
        }

    }
}

class MovingObject extends DrawableObject {
    affectedByGravity = false;
    isUpdateable = true;
    movesWhileDestroying = false;
    velocity = { x: 0, y: 0 };

    constructor(definition, type, color) {
        super(definition, type, color);
    }

    update() {
        super.update();
        if (this.affectedByGravity) {
            this.velocity.y += gravity * currentFrameDuration / 1000;
        }
        if (!this.isDestroying || this.movesWhileDestroying) {
            this.definition.x += this.velocity.x * currentFrameDuration / 1000;
            this.definition.y += this.velocity.y * currentFrameDuration / 1000;
        }

    }
}

class Actor extends MovingObject {
    refireDelay = 1000; //ms
    lastFire = 0;

    constructor(definition, type, color) {
        super(definition, type, color);
    }
    register() {
        super.register();
        objectsByFaction[this.faction].push(this);
    }
    startDestruction() {
        super.startDestruction();
        objectsByFaction[this.faction].splice(objectsByFaction[this.faction].indexOf(this), 1);
    }
    // remove cause fish don't shoot. usually.
    // update() {
    //     super.update();
    //     let currentTime = performance.now()
    //     if (currentTime > this.lastFire + this.refireDelay) {
    //         let projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, 5, new jQuery.Color(this.color.rgba()))
    //         projectile.velocity.x = (this.velocity.x > 0) ? this.velocity.x * 0.5 + 5 : this.velocity.x * 0.5 - 5;
    //         projectile.velocity.y = this.velocity.y * 0.5;
    //         projectile.faction = this.faction;
    //         projectile.register();
    //         this.lastFire = currentTime;
    //     }
    // }
}

class Fish extends Actor {
    image = fishImage;


    constructor(definition, type, color) {
        super(definition, type, color)
    }

    draw() {
        if (this.isDestroying) {
            context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a*this.destructionProgress})`;
        } else {
            context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        }

        context.save();
        context.globalAlpha = this.destructionProgress;
        // context.translate(this.x + this.width / 2, this.y + this.height / 2);
        // context.rotate(this.rotation);

        // context.translate(-1 * (this.x + this.width / 2), -1 * (this.y + this.height / 2));
        // context.fillRect(this.x, this.y, this.width, this.height);
        // if (this.velocity.x < 0) {
        //     context.scale(-1, 1);
        // }
        context.drawImage(fishImage, this.definition.x - camera.x, this.definition.y - camera.y, this.definition.width, this.definition.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.restore();
    }

    update() {
        super.update();

        if (this.definition.y < 0) {
            this.affectedByGravity = true;
        } else {
            this.affectedByGravity = false;
        }

    }

    startDestruction() {
        super.startDestruction();
        for (let object of objectsByFaction[this.faction]) {
            let distance = vectorLength(object.definition.x-this.definition.x,object.definition.y-this.definition.y);
            if(distance<200) {
                object.velocity.x += (this.definition.x-object.definition.x)*-50/distance;
                object.velocity.y += (this.definition.y-object.definition.y)*-50/distance;
            }
        }
    }

}

class Shark extends Actor {
    image = sharkImage;
    sharkAccelerationFactor = 1; // acceleration per distance from player per second

    constructor(definition, type, color) {
        super(definition, type, color);
    }

    draw() {
        if (this.isDestroying) {
            context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a*this.destructionProgress})`;
        } else {
            context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        }

        context.save();
        context.globalAlpha = this.destructionProgress;
        // context.translate(this.x + this.width / 2, this.y + this.height / 2);
        // context.rotate(this.rotation);

        // context.translate(-1 * (this.x + this.width / 2), -1 * (this.y + this.height / 2));
        // context.fillRect(this.x, this.y, this.width, this.height);
        // if (this.velocity.x > 0) {
        //     context.scale(-1, 1);
        // }
        context.drawImage(sharkImage, this.definition.x - camera.x, this.definition.y - camera.y, this.definition.width, this.definition.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.restore();
    }

    update() {
        super.update();

        if (this.definition.y < 0) {
            this.affectedByGravity = true;
        } else {
            this.affectedByGravity = false;
            if (objectsByFaction[1].length > 0) {
                this.velocity.x += (objectsByFaction[1][0].definition.x - this.definition.x) * this.sharkAccelerationFactor * currentFrameDuration / 1000;
                this.velocity.y += (objectsByFaction[1][0].definition.y - this.definition.y) * this.sharkAccelerationFactor * currentFrameDuration / 1000;
            }
        }

        //friction
        if (this.definition.y > 0) {
            this.velocity.x *= 0.99;
            this.velocity.y *= 0.99;
        }

    }

}

class Player extends Actor {
    maxspeed = 5000; //units (currently ==pixels) per second
    refireDelay = 50; //ms
    lastFire;
    projectileSpeed = 10; //old, needs update
    image=penguinImage;
    allBubbleSpeed=300; //player speed at which a bubble is spawned every frame 


    constructor(definition, type, color, speed) {
        super(definition, type, color);
        this.speed = speed;
        this.lastFire = performance.now();
    }
    update() {
        super.update()

        //todo remove this hack
        camera.x = this.definition.x - 400 + this.definition.width / 2;
        camera.y = this.definition.y - 300 + this.definition.height / 2;

        // this.velocity = { x: 0, y: 0 }
        //control
        if (this.definition.y < 0) {
            this.affectedByGravity = true;
            if (currentInputs.has("a")) { this.rotation -= 0.1; }
            if (currentInputs.has("d")) { this.rotation += 0.1; }
        } else {
            this.affectedByGravity = false;
            if (currentInputs.has("w")) {
                this.velocity.x += this.speed * Math.sin(this.rotation)
                this.velocity.y -= this.speed * Math.cos(this.rotation)
            }
            if (currentInputs.has("s")) {
                this.velocity.x -= this.speed * Math.sin(this.rotation)
                this.velocity.y += this.speed * Math.cos(this.rotation)
            }
            if (currentInputs.has("a")) { this.rotation -= 0.1; }
            if (currentInputs.has("d")) { this.rotation += 0.1; }
            if (currentInputs.has(" ")) {
                let currentTime = performance.now()
                if (currentTime > this.lastFire + this.refireDelay) {
                    let projectile = new Projectile(this.definition.x + this.definition.width / 2, this.definition.y + this.definition.height / 2, 5, {r:0,b:0,g:0,a:1} )
                    projectile.velocity.x = 0.5 * this.velocity.x + this.projectileSpeed * Math.sin(this.rotation);
                    projectile.velocity.y = 0.5 * this.velocity.y + -1 * this.projectileSpeed * Math.cos(this.rotation);
                    projectile.faction = this.faction;
                    projectile.register();
                    this.lastFire = currentTime;
                }

            }

        }

        //create bubbles
        if (Math.random() < vectorLength(this.velocity.x, this.velocity.y) / this.allBubbleSpeed) {
            let bubble = new MovingObject({ x: this.definition.x + this.definition.width / 2, y: this.definition.y + this.definition.height / 2, radius: 3 }, "circle",  {r:255,b:255,g:255,a:0.7} );
            bubble.movesWhileDestroying = true;
            bubble.faction = this.faction;
            bubble.velocity.x = this.velocity.x * 0.5 + 50 * (Math.random() - 0.5);
            bubble.velocity.y = this.velocity.y * 0.5 + 50 * (Math.random() - 0.5);
            bubble.destructionTime = 3000;
            bubble.register();
            bubble.startDestruction();
        }

        //maximum speed
        if (vectorLength(this.velocity.x, this.velocity.y) > this.maxspeed) {
            this.velocity = normalizeVector(this.velocity);
        }

        //friction
        if (this.definition.y > 0) {
            this.velocity.x *= 0.998;
            this.velocity.y *= 0.998;
        }

        //movement
        this.definition.x += this.velocity.x * currentFrameDuration / 1000;
        this.definition.y += this.velocity.y * currentFrameDuration / 1000;

    }
    draw() {
        if (this.isDestroying) {
            context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a*this.destructionProgress})`;
        } else {
            context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        }

        /*
        steps:
        move matrix to center of object
        rotate
        move matrix back to origin
        draw
        reset transformation matrix
        */

        // context.fillRect(this.x, this.y, this.width, this.height);
        context.translate(this.definition.x + this.definition.width / 2 - camera.x, this.definition.y + this.definition.height / 2 - camera.y);
        context.rotate(this.rotation);
        context.translate(-1 * (this.definition.x + this.definition.width / 2 - camera.x), -1 * (this.definition.y + this.definition.height / 2 - camera.y));

        context.drawImage(penguinImage, 55, 0, 115, 200, this.definition.x - camera.x, this.definition.y - camera.y, this.definition.width, this.definition.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
    }

}

class Projectile extends MovingObject {
    hasCollision = true;
    constructor(definition, type, color) {
        super(definition, type, color);
    }
    draw() {
        super.draw();
    }
    register() {
        super.register();
        projectileObjects.push(this);
        projectilesByFaction[this.faction].push(this);
    }
    deregister() {
        super.deregister();
        projectileObjects.splice(projectileObjects.indexOf(this), 1);
        projectilesByFaction[this.faction].splice(projectilesByFaction[this.faction].indexOf(this), 1);
    }
}
