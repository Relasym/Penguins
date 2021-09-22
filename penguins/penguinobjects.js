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
        this.frictionPerSecond = 0.002;
        this.sharkAccelerationFactor = 2; // acceleration per distance from player per second
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
            if (this.targetAge > this.maxTrackingTime || this.currentTarget == null) {
                if (this.owner.player != null && this.distanceTo(this.owner.player) < 500) {
                    this.currentTarget = this.owner.player;
                    this.targetAge = 0;
                    this.maxTrackingTime = 500 + Math.random() * 1000;
                }
                else if (this.currentTarget == null) {
                    //find new target
                    let attempts = 0;
                    for (let fish of this.owner.objectsByFaction[2]) {
                        attempts++;
                        if (this.distanceTo(fish) < attempts * 50) {
                            this.currentTarget = fish;
                            this.targetAge = 0;
                            this.maxTrackingTime = 1000 + Math.random() * 5000;
                            break;
                        }
                    }
                    if (this.currentTarget == null) {
                        //still no target? go after the player
                        this.currentTarget = this.owner.player;
                    }
                }
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
}
