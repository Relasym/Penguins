//defines position and size, according to object.type
type definition = {
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
    definition: definition;
    velocity: {x: any,y: any};
}

//basic object, includes register/deregister and destruction
class BasicObject implements BasicInterface{
    definition : definition;
    velocity: {x:number,y:number};
    faction: number;
    hasCollision = false;
    isDrawable = false;
    isUpdateable = false;
    isDestroying = false;
    destructionTime = 300; //ms
    destructionProgress = 1.0; //destroys object if it reaches 0, used as a multiplier for color alpha
    owner : Level;

    constructor(owner: Level ) {
        this.owner=owner;
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
    distanceTo(object : BasicInterface): number {
        return vectorLength({x:this.definition.x-object.definition.x,y:this.definition.y-object.definition.y})
    }
}


//basic object with drawing and optional image
class DrawableObject extends BasicObject {
    type: String;
    image: HTMLImageElement;
    isDrawable = true;
    hasCollision = true;
    rotation = 0;
    definition: definition;
    color: color;
    constructor(owner: Level, definition: definition, type: String, color: color) {
        super(owner)
        this.definition = definition;
        this.type = type;
        this.color = color;
        this.image = new Image();
    }
    draw(): void {
        if (this.type == "circle") {
            //todo add images for circle types
            this.owner.context.beginPath();
            this.owner.context.arc(this.definition.x - this.owner.camera.x, this.definition.y - this.owner.camera.y, this.definition.radius, 0, Math.PI * 2, false);
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
    affectedByGravity = false;
    isUpdateable = true;
    movesWhileDestroying = false;
    velocity = { x: 0, y: 0 };

    constructor(owner: Level, definition: definition, type: String, color: color) {
        super(owner, definition, type, color);
    }

    update(currentFrameDuration: number): void {
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
    refireDelay = 1000; //ms
    lastFire = 0;

    constructor(owner: Level, definition: definition, type: String, color: color) {
        super(owner, definition, type, color);
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
    constructor(owner: Level, definition: definition, type: String, color: color) {
        super(owner, definition, type, color);
    }
    draw(): void {
        super.draw();
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
