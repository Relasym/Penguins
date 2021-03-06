type camera = {
    x: number;
    y: number;
}

class Level {
    context: CanvasRenderingContext2D;
    player?: Penguin;
    camera?: camera;

    allObjects: Set<object> = new Set();
    drawableObjects: Set<object> = new Set();
    updateableObjects: Set<object> = new Set();
    projectileObjects: Set<object> = new Set();

    totalRuntime: number;

    factionAmount = 10; //realistically no more than 4-5 (0: terrain, 1: player, rest: other)
    objectsByFaction: Set<BasicInterface>[] = [];
    projectilesByFaction: Set<object>[] = [];

    gravity = 300;


    constructor(context: CanvasRenderingContext2D) {
        this.context = context;
        for (let i = 0; i < this.factionAmount; i++) {
            this.projectilesByFaction.push(new Set());
            this.objectsByFaction.push(new Set());
        }
        this.totalRuntime = 0;
        this.camera = { x: 0, y: 0 };
    }

    draw() {
        this.drawableObjects.forEach((object: GameObject) => {
            object.draw();
        });
        this.player.draw();
    }

    update(currentFrameDuration: number) {
        this.totalRuntime += currentFrameDuration;

        this.updateableObjects.forEach((object: GameObject) => {
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
        let player = new Penguin(this, { x: 300, y: 300, width: 30, height: 50 }, collisionType.Rectangle, color, 3);
        player.hasCollision = true;
        player.faction = 1;
        player.affectedByGravity = false;
        player.velocity.x = 25;
        player.velocity.y = 25;
        player.register();
        this.player = player;

    }

    end() { }
    handleCollisions(objectsByFaction: any, projectilesByFaction: any): void {/*collision checks and results go here*/ }
}

class GameObjectController<T extends GameObject> {
    fillFactor = 0.75;
    growFactor = 2;
    defaultSize = 10;
    currentItems: number;
    currentSize: number;
    objects: T[];
    objectType: { new(): T; }

    constructor(size?: number) {
        let startingSize = size || this.defaultSize;
        this.objects = new Array(startingSize);
        this.currentItems = 0;
        this.currentSize = startingSize
        for (let i = 0; i < startingSize; i++) {
            this.objects[i] = new this.objectType();
        }
    }
    sizeCheck() {
        if (this.currentItems > this.fillFactor * this.currentSize) {
            let newsize = this.currentSize * this.growFactor;
            let newObjects: T[] = new Array<T>(newsize);
            for (let i = 0; i < this.currentItems; i++) {
                newObjects[i] = this.objects[i];
            }
            this.currentItems = newsize;
            this.objects = newObjects;
        }
    }

}