/*
faction
hasCollision = false;
isDrawable = false;
isUpdateable = false;
isDestroying = false;
affectedByGravity=false;

*/
class BasicObject {
    faction;
    hasCollision = false;
    isDrawable = false;
    isUpdateable = false;
    isDestroying = false;
    destructionProgress = 1.0; //destroys object if it reaches 0, used as a multiplier for color alpha

    register() {
        allObjects.push(this)
        if (this.isDrawable) { drawableObjects.push(this) }
        if (this.isUpdateable) { updateableObjects.push(this) }
    }

    deregister() {
        allObjects.splice(allObjects.indexOf(this), 1)
        if (this.isDrawable) { drawableObjects.splice(drawableObjects.indexOf(this), 1) }
        if (this.isUpdateable) { updateableObjects.splice(updateableObjects.indexOf(this), 1) }
    }

    startDestruction() {
        this.hasCollision = false
        this.isDestroying = true;
    }

    update() {
        if (this.isDestroying) {
            this.destructionProgress -= 0.11;
        }
        if (this.destructionProgress <= 0) {
            this.deregister();
        }
    }
}
class Circle extends BasicObject {
    type="circle";
    isDrawable = true;
    hasCollision = true;
    constructor(x, y, radius, color) {
        super()
        this.x = x
        this.y = y
        this.radius = radius
        this.color = new jQuery.Color(color)
    }
    draw() {
        context.beginPath()
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        if (this.isDestroying) {
            let color = [...this.color._rgba];
            color[3] *= this.destructionProgress;
            context.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color[3]})`;
        } else {
            context.fillStyle = this.color;
        }
        context.fill()
    }
    update() {
        super.update()
    }
}
class MovingCircle extends Circle {
    affectedByGravity = false;
    isUpdateable = true;
    velocity = { x: 0, y: 0 };
    constructor(x, y, radius, color) {
        super(x, y, radius, color)
    }
    update() {
        super.update();
        if (this.affectedByGravity) {
            this.velocity.y += gravity;
        }
        if (!this.isDestroying) {
            this.x += this.velocity.x
            this.y += this.velocity.y
        }

    }
}
class TestEnemy extends MovingCircle {
    constructor(x, y, radius, color) {
        super(x, y, radius, color)
    }
    register() {
        super.register();
        objectsByFaction[this.faction].push(this);
    }
    startDestruction() {
        super.startDestruction();
        objectsByFaction[this.faction].splice(objectsByFaction[this.faction].indexOf(this), 1);
    }
}
class Projectile extends MovingCircle {
    hasCollision = true;
    constructor(x, y, radius, color) {
        super(x, y, radius, color)
    }
    draw() {
        super.draw()
    }
    register() {
        super.register()
        projectileObjects.push(this)
        projectilesByFaction[this.faction].push(this);

    }
    deregister() {
        super.deregister()
        projectileObjects.splice(projectileObjects.indexOf(this), 1);
        projectilesByFaction[this.faction].splice(projectilesByFaction[this.faction].indexOf(this), 1);
    }
}
class Rectangle extends BasicObject {
    type="rectangle";
    hasCollision = true;
    isDrawable = true;
    rotation = 0 * Math.PI / 180;
    constructor(x, y, width, height, color) {
        super();
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width
        this.color = color;
    }
    draw() {
        if (this.isDestroying) {
            let color = [...this.color._rgba];
            color[3] *= this.destructionProgress;
            context.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color[3]})`;
        } else {
            context.fillStyle = this.color;
        }

        context.translate(this.x + this.width / 2, this.y + this.height / 2);
        context.rotate(this.rotation);
        context.translate(-1 * (this.x + this.width / 2), -1 * (this.y + this.height / 2));
        context.fillRect(this.x, this.y, this.width, this.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
    }
    update() {
        super.update();
    }
}
class MovingRectangle extends Rectangle {
    affectedByGravity = false;
    isUpdateable = true
    velocity = { x: 0, y: 0 };
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color)
    }
    update() {
        super.update()
        if (this.affectedByGravity) {
            this.velocity.y += gravity;
        }
        if (!this.isDestroying) {
            this.x += this.velocity.x
            this.y += this.velocity.y
        }

    }

}
class Actor extends MovingRectangle {
    refireDelay = 1000; //ms
    lastFire = 0;
    
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color)
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
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color)
    }

    draw() {
        if (this.isDestroying) {
            let color = [...this.color._rgba];
            color[3] *= this.destructionProgress;
            context.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color[3]})`;
        } else {
            context.fillStyle = this.color;
        }

        context.translate(this.x + this.width / 2, this.y + this.height / 2);
        context.rotate(this.rotation);
        context.translate(-1 * (this.x + this.width / 2), -1 * (this.y + this.height / 2));
        // context.fillRect(this.x, this.y, this.width, this.height);
        context.drawImage(fishImage, this.x, this.y,this.width,this.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
    }

}


class Player extends MovingRectangle {
    maxspeed = 5;
    refireDelay = 50; //ms
    lastFire;
    projectileSpeed=10;
    
    constructor(x, y, width, height, color, speed) {
        super(x, y, width, height, color)
        this.speed = speed
        this.lastFire = performance.now();
    }
    update() {
        super.update()
        // this.velocity = { x: 0, y: 0 }
        //control
        if (currentInputs.has("w")) { 
            this.velocity.x+=this.speed*Math.sin(this.rotation)
            this.velocity.y-=this.speed*Math.cos(this.rotation) }
        if (currentInputs.has("s")) { 
            this.velocity.x-=this.speed*Math.sin(this.rotation)
            this.velocity.y+=this.speed*Math.cos(this.rotation) }
        if (currentInputs.has("a")) { this.rotation-=0.03; }
        if (currentInputs.has("d")) { this.rotation+=0.03; }
        if (currentInputs.has(" ")) {
            let currentTime = performance.now()
            if (currentTime > this.lastFire + this.refireDelay) {
                let projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, 5, this.color)
                projectile.velocity.x = 0.5*this.velocity.x + this.projectileSpeed*Math.sin(this.rotation);
                projectile.velocity.y = 0.5*this.velocity.y + -1*this.projectileSpeed*Math.cos(this.rotation);
                projectile.faction = this.faction;
                projectile.register();
                this.lastFire = currentTime;
            }

        }

        //maximum "speed"
        if(pyth(this.velocity.x,this.velocity.y)>this.maxspeed) {
            this.velocity.x*=this.maxspeed/pyth(this.velocity.x,this.velocity.y);
            this.velocity.y*=this.maxspeed/pyth(this.velocity.x,this.velocity.y);
        }
        // this.velocity.x = Math.min(this.velocity.x, this.maxspeed)
        // this.velocity.x = Math.max(this.velocity.x, -1 * this.maxspeed)
        // this.velocity.y = Math.min(this.velocity.y, this.maxspeed)
        // this.velocity.y = Math.max(this.velocity.y, -1 * this.maxspeed)

        //movement
        this.x += this.velocity.x
        this.y += this.velocity.y

        //"ground"
        if (this.y > canvas.height - this.height) {
            this.y = canvas.height - this.height
            this.velocity.y = 0
            this.velocity.x = 0
        }
    }
    register() {
        super.register();
        objectsByFaction[this.faction].push(this);
    }
    startDestruction() {
        super.startDestruction();
        objectsByFaction[this.faction].splice(objectsByFaction[this.faction].indexOf(this), 1);
    }
    draw() {
        if (this.isDestroying) {
            let color = [...this.color._rgba];
            color[3] *= this.destructionProgress;
            context.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color[3]})`;
        } else {
            context.fillStyle = this.color;
        }
        
        /*
        steps:
        move matrix to center of object
        rotate
        move matrix back to origin
        draw
        reset transformation matrix
        */

        context.translate(this.x + this.width / 2, this.y + this.height / 2);
        context.rotate(this.rotation);
        context.translate(-1 * (this.x + this.width / 2), -1 * (this.y + this.height / 2));
        // context.fillRect(this.x, this.y, this.width, this.height);
        context.drawImage(penguinImage, 55,0,115,200,this.x, this.y,this.width,this.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
    }


}
class TerrainRectangle extends Rectangle {
    hasCollision = true;
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color)
    }
    register() {
        super.register();
        objectsByFaction[this.faction].push(this);
    }
    startDestruction() { }
}
