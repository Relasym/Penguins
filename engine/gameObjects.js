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
