class BasicObject {
    faction;
    hasCollision = false;
    isDrawable = false;
    isUpdateable = false;
    isDestroying = false;
    destructionTime = 300; //ms
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
            this.destructionProgress -= currentFrameDuration / this.destructionTime;
        }
        if (this.destructionProgress <= 0) {
            this.deregister();
        }
    }
}
class Circle extends BasicObject {
    type = "circle";
    isDrawable = true;
    hasCollision = true;
    constructor(x, y, radius, color) {
        super()
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = new jQuery.Color(color);
    }
    draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        if (this.isDestroying) {
            let color = [...this.color._rgba];
            color[3] *= this.destructionProgress;
            context.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color[3]})`;
        } else {
            context.fillStyle = this.color;
        }
        context.fill();
    }
    update() {
        super.update();
    }
}
class MovingCircle extends Circle {
    affectedByGravity = false;
    isUpdateable = true;
    velocity = { x: 0, y: 0 };
    constructor(x, y, radius, color) {
        super(x, y, radius, color);
    }
    update() {
        super.update();
        if (this.affectedByGravity) {
            this.velocity.y += gravity * currentFrameDuration / 1000;
        }
        if (!this.isDestroying) {
            this.x += this.velocity.x * currentFrameDuration / 1000;
            this.y += this.velocity.y * currentFrameDuration / 1000;
        }

    }
}

class VisualMovingCircle extends Circle {
    //normal moving circle, but moves while being destroyed
    affectedByGravity = false;
    isUpdateable = true;
    velocity = { x: 0, y: 0 };
    constructor(x, y, radius, color) {
        super(x, y, radius, color);
    }
    update() {
        super.update();
        if (this.affectedByGravity) {
            this.velocity.y += gravity * currentFrameDuration / 1000;
        }
        this.x += this.velocity.x * currentFrameDuration / 1000;
        this.y += this.velocity.y * currentFrameDuration / 1000;
    }
}



class TestEnemy extends MovingCircle {
    constructor(x, y, radius, color) {
        super(x, y, radius, color);
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
        super(x, y, radius, color);
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
class Rectangle extends BasicObject {
    type = "rectangle";
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
    isUpdateable = true;
    velocity = { x: 0, y: 0 };
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color)
    }
    update() {
        super.update()
        if (this.affectedByGravity) {
            this.velocity.y += gravity * currentFrameDuration / 1000;
        }
        if (!this.isDestroying) {
            this.x += this.velocity.x * currentFrameDuration / 1000;
            this.y += this.velocity.y * currentFrameDuration / 1000;
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
    image = fishImage;


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

        context.save();
        context.globalAlpha = this.destructionProgress;
        context.translate(this.x + this.width / 2, this.y + this.height / 2);
        context.rotate(this.rotation);
        if (this.velocity.x < 0) {
            context.scale(-1, 1);
        }
        context.translate(-1 * (this.x + this.width / 2), -1 * (this.y + this.height / 2));
        // context.fillRect(this.x, this.y, this.width, this.height);
        context.drawImage(fishImage, this.x-camera.x, this.y-camera.y, this.width, this.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.restore();
    }

}

class Shark extends Actor {
    image = sharkImage;

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

        context.save();
        context.globalAlpha = this.destructionProgress;
        context.translate(this.x + this.width / 2, this.y + this.height / 2);
        context.rotate(this.rotation);
        if (this.velocity.x > 0) {
            context.scale(-1, 1);
        }
        context.translate(-1 * (this.x + this.width / 2), -1 * (this.y + this.height / 2));
        // context.fillRect(this.x, this.y, this.width, this.height);
        context.drawImage(sharkImage, this.x-camera.x, this.y-camera.y, this.width, this.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.restore();
    }

    update() {
        super.update();
        if (objectsByFaction[1].length > 0) {
            this.velocity.x += (objectsByFaction[1][0].x - this.x) / 50;
            this.velocity.y += (objectsByFaction[1][0].y - this.y) / 50;
        }

    }

}


class Player extends MovingRectangle {
    maxspeed = 5000;
    refireDelay = 50; //ms
    lastFire;
    projectileSpeed = 10;

    constructor(x, y, width, height, color, speed) {
        super(x, y, width, height, color);
        this.speed = speed;
        this.lastFire = performance.now();
    }
    update() {
        super.update()


        camera.x=this.x-400+this.width/2;
        camera.y=this.y-300+this.height/2;

        // this.velocity = { x: 0, y: 0 }
        //control
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
                let projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, 5, this.color)
                projectile.velocity.x = 0.5 * this.velocity.x + this.projectileSpeed * Math.sin(this.rotation);
                projectile.velocity.y = 0.5 * this.velocity.y + -1 * this.projectileSpeed * Math.cos(this.rotation);
                projectile.faction = this.faction;
                projectile.register();
                this.lastFire = currentTime;
            }

        }

        //bubbles
        if (Math.random() < vectorLength(this.velocity.x, this.velocity.y) / 200) {
            let bubble = new VisualMovingCircle(this.x + this.width / 2, this.y + this.height, 5, "rgba(150,200,200,1)");
            bubble.faction = this.faction;
            bubble.velocity.x = this.velocity.x * 0.5 + 50 * (Math.random() - 0.5);
            bubble.velocity.y = this.velocity.y * 0.5 + 50 * (Math.random() - 0.5);
            bubble.destructionTime = 3000;
            bubble.register();
            bubble.startDestruction();
        }


        //maximum "speed"
        if (vectorLength(this.velocity.x, this.velocity.y) > this.maxspeed) {
            this.velocity.x *= this.maxspeed / vectorLength(this.velocity.x, this.velocity.y);
            this.velocity.y *= this.maxspeed / vectorLength(this.velocity.x, this.velocity.y);
        }
        // this.velocity.x = Math.min(this.velocity.x, this.maxspeed)
        // this.velocity.x = Math.max(this.velocity.x, -1 * this.maxspeed)
        // this.velocity.y = Math.min(this.velocity.y, this.maxspeed)
        // this.velocity.y = Math.max(this.velocity.y, -1 * this.maxspeed)

        //movement
        this.x += this.velocity.x * currentFrameDuration / 1000;
        this.y += this.velocity.y * currentFrameDuration / 1000;

        //"ground"
        // if (this.y > canvas.height - this.height) {
        //     this.y = canvas.height - this.height;
        //     this.velocity.y = 0;
        //     this.velocity.x = 0;
        // }
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

        context.fillRect(this.x-camera.x, this.y-camera.y, this.width, this.height);
        context.translate(this.x + this.width / 2-camera.x, this.y + this.height / 2-camera.y);
        context.rotate(this.rotation);
        context.translate(-1 * (this.x + this.width / 2-camera.x), -1 * (this.y + this.height / 2-camera.y));
        
        context.drawImage(penguinImage, 55, 0, 115, 200, this.x-camera.x, this.y-camera.y, this.width, this.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
    }


}
class TerrainRectangle extends Rectangle {
    hasCollision = true;
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
    }
    register() {
        super.register();
        objectsByFaction[this.faction].push(this);
    }
    startDestruction() { }
}
