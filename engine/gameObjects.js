//basic object, includes register/deregister and destruction
class BasicObject {
    constructor(owner) {
        this.hasCollision = false;
        this.isDrawable = false;
        this.isUpdateable = false;
        this.isDestroying = false;
        this.destructionTime = 300; //ms
        this.destructionProgress = 1.0; //destroys object if it reaches 0, used as a multiplier for color alpha
        this.owner = owner;
    }
    register() {
        this.owner.allObjects.add(this);
        if (this.isDrawable) {
            this.owner.drawableObjects.add(this);
        }
        if (this.isUpdateable) {
            this.owner.updateableObjects.add(this);
        }
        this.owner.objectsByFaction[this.faction].add(this);
    }
    deregister() {
        this.owner.allObjects.delete(this);
        if (this.isDrawable) {
            this.owner.drawableObjects.delete(this);
        }
        if (this.isUpdateable) {
            this.owner.updateableObjects.delete(this);
        }
    }
    startDestruction() {
        this.hasCollision = false;
        this.isDestroying = true;
        this.owner.objectsByFaction[this.faction].delete(this);
    }
    update(currentFrameDuration) {
        if (this.isDestroying) {
            this.destructionProgress -= currentFrameDuration / this.destructionTime;
        }
        if (this.destructionProgress <= 0) {
            this.deregister();
        }
    }
    distanceTo(object) {
        return vectorLength({ x: this.definition.x - object.definition.x, y: this.definition.y - object.definition.y });
    }
}
//basic object with drawing and optional image
class DrawableObject extends BasicObject {
    constructor(owner, definition, type, color) {
        super(owner);
        this.isDrawable = true;
        this.hasCollision = true;
        this.rotation = 0;
        this.definition = definition;
        this.type = type;
        this.color = color;
        this.image = new Image();
    }
    draw() {
        if (this.type == "circle") {
            //todo add images for circle types
            this.owner.context.beginPath();
            this.owner.context.arc(this.definition.x - this.owner.camera.x, this.definition.y - this.owner.camera.y, this.definition.radius, 0, Math.PI * 2, false);
            if (this.isDestroying) {
                this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a * this.destructionProgress})`;
            }
            else {
                this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
            }
            this.owner.context.fill();
        }
        if (this.type == "rectangle") {
            if (this.isDestroying) {
                this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a * this.destructionProgress})`;
            }
            else {
                this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
            }
            this.owner.context.translate(this.definition.x + this.definition.width / 2, this.definition.y + this.definition.height / 2);
            this.owner.context.rotate(this.rotation);
            this.owner.context.translate(-1 * (this.definition.x + this.definition.width / 2), -1 * (this.definition.y + this.definition.height / 2));
            this.owner.context.fillRect(this.definition.x - this.owner.camera.x, this.definition.y - this.owner.camera.y, this.definition.width, this.definition.height);
            if (this.image != null) {
                this.owner.context.drawImage(this.image, this.definition.x - this.owner.camera.x, this.definition.y - this.owner.camera.y, this.definition.width, this.definition.height);
            }
            this.owner.context.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
}
//moving object, gravity can be turned on and off
class MovingObject extends DrawableObject {
    constructor(owner, definition, type, color) {
        super(owner, definition, type, color);
        this.affectedByGravity = false;
        this.isUpdateable = true;
        this.movesWhileDestroying = false;
        this.velocity = { x: 0, y: 0 };
    }
    update(currentFrameDuration) {
        super.update(currentFrameDuration);
        if (this.affectedByGravity) {
            this.velocity.y += gravity * currentFrameDuration / 1000;
        }
        if (!this.isDestroying || this.movesWhileDestroying) {
            this.definition.x += this.velocity.x * currentFrameDuration / 1000;
            this.definition.y += this.velocity.y * currentFrameDuration / 1000;
        }
    }
}
//what was this even for???
class Actor extends MovingObject {
    constructor(owner, definition, type, color) {
        super(owner, definition, type, color);
        this.refireDelay = 1000; //ms
        this.lastFire = 0;
    }
    register() {
        super.register();
    }
    startDestruction() {
        super.startDestruction();
    }
}
//a very hungry penguin
class Player extends Actor {
    constructor(owner, definition, type, color, speed) {
        super(owner, definition, type, color);
        this.rotationSpeed = Math.PI * 2.0; //radians per second
        this.maxspeed = 5000; //units (currently ==pixels) per second
        this.refireDelay = 50; //ms
        this.projectileSpeed = 10; //old, needs update
        this.allBubbleSpeed = 300; //player speed at which a bubble is spawned every frame 
        this.frictionPerSecond = 0.003;
        this.speed = speed;
        this.lastFire = performance.now();
        this.image = penguinImage;
    }
    update(currentFrameDuration) {
        super.update(currentFrameDuration);
        // this.velocity = { x: 0, y: 0 }
        //control
        if (this.definition.y < 0) {
            this.affectedByGravity = true;
            if (currentInputs.has("a")) {
                this.rotation -= this.rotationSpeed * currentFrameDuration / 1000;
            }
            if (currentInputs.has("d")) {
                this.rotation += this.rotationSpeed * currentFrameDuration / 1000;
            }
        }
        else {
            this.affectedByGravity = false;
            if (currentInputs.has("w")) {
                this.velocity.x += this.speed * Math.sin(this.rotation);
                this.velocity.y -= this.speed * Math.cos(this.rotation);
            }
            if (currentInputs.has("s")) {
                this.velocity.x -= this.speed * Math.sin(this.rotation);
                this.velocity.y += this.speed * Math.cos(this.rotation);
            }
            if (currentInputs.has("a")) {
                this.rotation -= this.rotationSpeed * currentFrameDuration / 1000;
            }
            if (currentInputs.has("d")) {
                this.rotation += this.rotationSpeed * currentFrameDuration / 1000;
            }
            //sry penguin, no guns for you
            // if (currentInputs.has(" ")) {
            //     let currentTime = performance.now()
            //     if (currentTime > this.lastFire + this.refireDelay) {
            //         let projectile = new Projectile({x: this.definition.x + this.definition.width / 2, y: this.definition.y + this.definition.height / 2, radius: 5}, "circle", { r: 0, b: 0, g: 0, a: 1 })
            //         projectile.velocity.x = 0.5 * this.velocity.x + this.projectileSpeed * Math.sin(this.rotation);
            //         projectile.velocity.y = 0.5 * this.velocity.y + -1 * this.projectileSpeed * Math.cos(this.rotation);
            //         projectile.faction = this.faction;
            //         projectile.register();
            //         this.lastFire = currentTime;
            //     }
            // }
        }
        //create bubbles
        if (this.definition.y > 0 && Math.random() < vectorLength(this.velocity) / this.allBubbleSpeed) {
            let x = this.definition.x + this.definition.width / 2 - this.definition.height * 0.8 / 2 * Math.sin(this.rotation);
            let y = this.definition.y + this.definition.height / 2 + this.definition.height * 0.9 / 2 * Math.cos(this.rotation);
            let radius = 1 + (Math.random() * vectorLength(this.velocity) / 100);
            let bubble = new MovingObject(this.owner, { x: x, y: y, radius: radius }, "circle", { r: 255, b: 255, g: 255, a: 0.7 });
            bubble.movesWhileDestroying = true;
            bubble.faction = this.faction;
            bubble.velocity.x = this.velocity.x * 0.5 + 50 * (Math.random() - 0.5);
            bubble.velocity.y = this.velocity.y * 0.5 + 50 * (Math.random() - 0.5);
            bubble.destructionTime = 3000;
            bubble.register();
            bubble.startDestruction();
        }
        //maximum speed
        if (vectorLength(this.velocity) > this.maxspeed) {
            this.velocity = normalizeVector(this.velocity);
        }
        //friction
        if (this.definition.y > 0) {
            let friction = vectorLength(this.velocity) * this.frictionPerSecond * currentFrameDuration / 1000;
            //this doesn't give quite the same friction for every framerate, but it's a reasonable approximation
            this.velocity.x *= 1 - (friction);
            this.velocity.y *= 1 - (friction);
        }
        //movement
        this.definition.x += this.velocity.x * currentFrameDuration / 1000;
        this.definition.y += this.velocity.y * currentFrameDuration / 1000;
    }
    draw() {
        if (this.isDestroying) {
            this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a * this.destructionProgress})`;
        }
        else {
            this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
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
        this.owner.context.translate(this.definition.x + this.definition.width / 2 - this.owner.camera.x, this.definition.y + this.definition.height / 2 - this.owner.camera.y);
        this.owner.context.rotate(this.rotation);
        this.owner.context.translate(-1 * (this.definition.x + this.definition.width / 2 - this.owner.camera.x), -1 * (this.definition.y + this.definition.height / 2 - this.owner.camera.y));
        this.owner.context.drawImage(this.image, 55, 0, 115, 200, this.definition.x - this.owner.camera.x, this.definition.y - this.owner.camera.y, this.definition.width, this.definition.height);
        this.owner.context.setTransform(1, 0, 0, 1, 0, 0);
    }
}
//basic projectile, not doing much
class Projectile extends MovingObject {
    constructor(owner, definition, type, color) {
        super(owner, definition, type, color);
        this.hasCollision = true;
    }
    draw() {
        super.draw();
    }
    register() {
        super.register();
        this.owner.projectileObjects.add(this);
        this.owner.projectilesByFaction[this.faction].add(this);
    }
    deregister() {
        super.deregister();
        this.owner.projectileObjects.delete(this);
        this.owner.projectilesByFaction[this.faction].delete(this);
    }
}
