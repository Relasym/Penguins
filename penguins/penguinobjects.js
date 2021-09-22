//moves and scares other fish when it gets eaten
class Fish extends Actor {
    constructor(owner, definition, type, color) {
        super(owner, definition, type, color);
        this.image = fishImage;
    }
    draw() {
        if (this.isDestroying) {
            this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a * this.destructionProgress})`;
        }
        else {
            this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        }
        this.owner.context.save();
        this.owner.context.globalAlpha = this.destructionProgress;
        // context.translate(this.x + this.width / 2, this.y + this.height / 2);
        // context.rotate(this.rotation);
        // context.translate(-1 * (this.x + this.width / 2), -1 * (this.y + this.height / 2));
        // context.fillRect(this.x, this.y, this.width, this.height);
        // if (this.velocity.x < 0) {
        //     context.scale(-1, 1);
        // }
        this.owner.context.drawImage(this.image, this.definition.x - this.owner.camera.x, this.definition.y - this.owner.camera.y, this.definition.width, this.definition.height);
        this.owner.context.setTransform(1, 0, 0, 1, 0, 0);
        this.owner.context.restore();
    }
    update(currentFrameDuration) {
        super.update(currentFrameDuration);
        if (this.definition.y < 0) {
            this.affectedByGravity = true;
        }
        else {
            this.affectedByGravity = false;
        }
    }
    startDestruction() {
        super.startDestruction();
        for (let object of this.owner.objectsByFaction[this.faction]) {
            let distance = vectorLength({ x: object.definition.x - this.definition.x, y: object.definition.y - this.definition.y });
            if (distance < 200) {
                object.velocity.x += (this.definition.x - object.definition.x) * -50 / distance;
                object.velocity.y += (this.definition.y - object.definition.y) * -50 / distance;
            }
        }
    }
}
//follows the player, not very accurately
class Shark extends Actor {
    constructor(owner, definition, type, color) {
        super(owner, definition, type, color);
        this.targetAge = 0; //time in ms since target was selected
        this.maxTrackingTime = 0; //time in ms to track current target
        this.retargetingDelay = 500; //time in ms until shark actually tracks
        this.frictionPerSecond = 0.005;
        this.sharkAccelerationFactor = 3; // acceleration per distance from player per second
        this.image = sharkImage;
    }
    draw() {
        if (this.isDestroying) {
            this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a * this.destructionProgress})`;
        }
        else {
            this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        }
        this.owner.context.save();
        this.owner.context.globalAlpha = this.destructionProgress;
        // context.translate(this.x + this.width / 2, this.y + this.height / 2);
        // context.rotate(this.rotation);
        // context.translate(-1 * (this.x + this.width / 2), -1 * (this.y + this.height / 2));
        // context.fillRect(this.x, this.y, this.width, this.height);
        // if (this.velocity.x > 0) {
        //     context.scale(-1, 1);
        // }
        this.owner.context.drawImage(this.image, this.definition.x - this.owner.camera.x, this.definition.y - this.owner.camera.y, this.definition.width, this.definition.height);
        this.owner.context.setTransform(1, 0, 0, 1, 0, 0);
        this.owner.context.restore();
    }
    update(currentFrameDuration) {
        super.update(currentFrameDuration);
        this.targetAge += currentFrameDuration;
        if (this.definition.y < 0) {
            this.affectedByGravity = true;
        }
        else {
            this.affectedByGravity = false;
            if (this.targetAge > this.maxTrackingTime || this.currentTarget == null || this.currentTarget.isDestroying) {
                this.currentTarget = null;
                this.findNewTarget();
            }
            if (this.targetAge > this.retargetingDelay) {
                this.velocity.x += (this.currentTarget.definition.x - this.definition.x) * this.sharkAccelerationFactor * currentFrameDuration / 1000;
                this.velocity.y += (this.currentTarget.definition.y - this.definition.y) * this.sharkAccelerationFactor * currentFrameDuration / 1000;
            }
        }
        //friction
        if (this.definition.y > 0) {
            let friction = vectorLength(this.velocity) * this.frictionPerSecond * currentFrameDuration / 1000;
            //this doesn't give quite the same friction for every framerate, but it's a reasonable approximation
            this.velocity.x *= 1 - (friction);
            this.velocity.y *= 1 - (friction);
        }
    }
    findNewTarget() {
        if (this.owner.player != null && this.distanceTo(this.owner.player) < 200) {
            this.currentTarget = this.owner.player;
            this.startTrackingTimers();
        }
        else if (this.currentTarget == null) {
            //find new target, choose nearby fish, but get less picky with each attempt
            let attempts = 0;
            for (let fish of this.owner.objectsByFaction[2]) {
                attempts++;
                if (this.distanceTo(fish) < attempts * 50) {
                    this.currentTarget = fish;
                    this.startTrackingTimers();
                    break;
                }
            }
            if (this.currentTarget == null) {
                //still no target? go after the player
                this.currentTarget = this.owner.player;
            }
        }
    }
    startTrackingTimers() {
        this.targetAge = 0;
        this.maxTrackingTime = 2000 + Math.random() * 3000;
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
