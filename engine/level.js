class Level {
    constructor(context) {
        this.allObjects = new Set();
        this.drawableObjects = new Set();
        this.updateableObjects = new Set();
        this.projectileObjects = new Set();
        this.factionAmount = 10; //realistically no more than 4-5 (0: terrain, 1: player, rest: other)
        this.objectsByFaction = [];
        this.projectilesByFaction = [];
        this.gravity = 300;
        this.context = context;
        for (let i = 0; i < this.factionAmount; i++) {
            this.projectilesByFaction.push(new Set());
            this.objectsByFaction.push(new Set());
        }
        this.totalRuntime = 0;
        this.camera = { x: 0, y: 0 };
    }
    draw() {
        this.drawableObjects.forEach((object) => {
            object.draw();
        });
        this.player.draw();
    }
    update(currentFrameDuration) {
        this.totalRuntime += currentFrameDuration;
        this.updateableObjects.forEach((object) => {
            object.update(currentFrameDuration);
        });
        if (this.player != null) {
            this.camera.x = this.player.shape.x - 400 + this.player.shape.width / 2;
            this.camera.y = this.player.shape.y - 300 + this.player.shape.height / 2;
        }
        //collision testing last
        this.handleCollisions(this.objectsByFaction, this.projectilesByFaction);
    }
    start() {
        totalRuntime = 0;
        //create player last so its drawn last, great solution right here
        let color = { r: 0, g: 0, b: 0, a: 1 };
        let player = new Penguin(this, { x: 300, y: 300, width: 30, height: 50 }, "rectangle", color, 3);
        player.hasCollision = true;
        player.faction = 1;
        player.affectedByGravity = false;
        player.velocity.x = 25;
        player.velocity.y = 25;
        player.register();
        this.player = player;
    }
    end() { }
    handleCollisions(objectsByFaction, projectilesByFaction) { }
}
class GameObjectController {
    constructor(size) {
        this.fillFactor = 0.75;
        this.growFactor = 2;
        this.defaultSize = 10;
        let startingSize = size || this.defaultSize;
        this.objects = new Array(startingSize);
        this.currentItems = 0;
        this.currentSize = startingSize;
        for (let i = 0; i < startingSize; i++) {
            this.objects[i] = new this.objectType();
        }
    }
    sizeCheck() {
        if (this.currentItems > this.fillFactor * this.currentSize) {
            let newsize = this.currentSize * this.growFactor;
            let newObjects = new Array(newsize);
            for (let i = 0; i < this.currentItems; i++) {
                newObjects[i] = this.objects[i];
            }
            this.currentItems = newsize;
            this.objects = newObjects;
        }
    }
}
