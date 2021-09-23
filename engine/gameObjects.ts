//defines position and size, according to object.type
type shape = {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
}

type color = {
    r: number;
    g: number;
    b: number;
    a?: number;
}

interface BasicInterface {
    shape: shape;
    velocity: { x: any, y: any };
    isDestroying: boolean;
}

//basic object, includes register/deregister and destruction
class BasicObject implements BasicInterface {
    shape: shape;
    velocity: { x: number, y: number };
    faction: number;
    hasCollision = false;
    isDrawable = false;
    isUpdateable = false;
    isDestroying = false;
    destructionTime = 300; //ms
    destructionProgress = 1.0; //destroys object if it reaches 0, used as a multiplier for color alpha
    owner: Level;

    constructor(owner: Level) {
        this.owner = owner;
    }

    register(): void {
        this.owner.allObjects.add(this)
        if (this.isDrawable) { this.owner.drawableObjects.add(this) }
        if (this.isUpdateable) { this.owner.updateableObjects.add(this) }
        this.owner.objectsByFaction[this.faction].add(this);
    }

    deregister(): void {
        this.owner.allObjects.delete(this);
        if (this.isDrawable) { this.owner.drawableObjects.delete(this); }
        if (this.isUpdateable) { this.owner.updateableObjects.delete(this); }
    }

    startDestruction(): void {
        this.hasCollision = false;
        this.isDestroying = true;
        this.owner.objectsByFaction[this.faction].delete(this);
    }

    update(currentFrameDuration: number): void {
        if (this.isDestroying) {
            this.destructionProgress -= currentFrameDuration / this.destructionTime;
        }
        if (this.destructionProgress <= 0) {
            this.deregister();
        }
    }
    distanceTo(object: BasicInterface): number {
        return vectorLength({ x: this.shape.x - object.shape.x, y: this.shape.y - object.shape.y })
    }
}


//basic object with drawing and optional image
class DrawableObject extends BasicObject {
    type: String;
    image: HTMLImageElement;
    imageDirection: String;
    isDrawable = true;
    hasCollision = true;
    rotation = 0;
    canRotate = false;
    shape: shape;
    color: color;
    constructor(owner: Level, shape: shape, type: String, color: color) {
        super(owner)
        this.shape = shape;
        this.type = type;
        this.color = color;
        this.image = new Image();
    }
    draw(): void {
        if (this.type == "circle") {
            //todo add images for circle types
            this.owner.context.beginPath();
            this.owner.context.arc(this.shape.x - this.owner.camera.x, this.shape.y - this.owner.camera.y, this.shape.radius, 0, Math.PI * 2, false);
            if (this.isDestroying) {
                this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a * this.destructionProgress})`;
            } else {
                this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
            }
            this.owner.context.fill();
        }

        if (this.type == "rectangle") {
            if (this.isDestroying) {
                this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a * this.destructionProgress})`;
            } else {
                this.owner.context.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
            }
            this.owner.context.save();
            this.owner.context.globalAlpha = this.destructionProgress;
            let translateX = this.shape.x + this.shape.width / 2 - this.owner.camera.x;
            let translateY = this.shape.y + this.shape.height / 2 - this.owner.camera.y;
            context.translate(translateX, translateY);
            if (this.canRotate) {
                context.rotate(this.rotation);
            }
            if (this.velocity != undefined && this.imageDirection != undefined) {
                if (this.imageDirection == "right" && this.velocity.x < 0 || this.imageDirection == "left" && this.velocity.x > 0) {
                    context.scale(-1, 1);
                }
            }
            context.translate(-1 * translateX, -1 * translateY);
            if (this.image.src == "") {
                context.fillRect(this.shape.x - this.owner.camera.x, this.shape.y - this.owner.camera.y, this.shape.width, this.shape.height);
            } else {
                this.owner.context.drawImage(this.image, this.shape.x - this.owner.camera.x, this.shape.y - this.owner.camera.y, this.shape.width, this.shape.height);
            }
            this.owner.context.restore();
        }

    }
}

//moving object, gravity can be turned on and off
class MovingObject extends DrawableObject {
    affectedByGravity = false;
    isUpdateable = true;
    movesWhileDestroying = false;
    velocity = { x: 0, y: 0 };

    constructor(owner: Level, shape: shape, type: String, color: color) {
        super(owner, shape, type, color);
    }

    update(currentFrameDuration: number): void {
        super.update(currentFrameDuration);
        if (this.affectedByGravity) {
            this.velocity.y += this.owner.gravity * currentFrameDuration / 1000;
        }
        if (!this.isDestroying || this.movesWhileDestroying) {
            this.shape.x += this.velocity.x * currentFrameDuration / 1000;
            this.shape.y += this.velocity.y * currentFrameDuration / 1000;
        }

    }
}

//what was this even for???
class Actor extends MovingObject {
    refireDelay = 1000; //ms
    lastFire = 0;

    constructor(owner: Level, shape: shape, type: String, color: color) {
        super(owner, shape, type, color);
    }
    register(): void {
        super.register();
    }
    startDestruction(): void {
        super.startDestruction();
    }

}



//basic projectile, not doing much
class Projectile extends MovingObject {
    hasCollision = true;
    constructor(owner: Level, shape: shape, type: String, color: color) {
        super(owner, shape, type, color);
    }
    register(): void {
        super.register();
        this.owner.projectileObjects.add(this);
        this.owner.projectilesByFaction[this.faction].add(this);
    }
    deregister(): void {
        super.deregister();
        this.owner.projectileObjects.delete(this);
        this.owner.projectilesByFaction[this.faction].delete(this);
    }
}
