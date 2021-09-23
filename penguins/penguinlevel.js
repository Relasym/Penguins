class PenguinLevel extends Level {
    constructor(context) {
        super(context);
        this.fishSpawnDelay = 1000; //ms
        this.sharkSpawnDelay = 5000; //ms
        this.fishSpawnTimer = 0;
        this.sharkSpawnTimer = 0;
        this.start();
        this.fishCounter = 0;
    }
    draw() {
        this.drawableObjects.forEach((object) => {
            // console.log(object);
            object.draw();
        });
    }
    update(currentFrameDuration) {
        this.totalRuntime += currentFrameDuration;
        this.fishSpawnTimer += currentFrameDuration;
        this.sharkSpawnTimer += currentFrameDuration;
        this.updateableObjects.forEach((object) => {
            object.update(currentFrameDuration);
        });
        if (this.player != null) {
            this.camera.x = this.player.shape.x - 400 + this.player.shape.width / 2;
            this.camera.y = this.player.shape.y - 300 + this.player.shape.height / 2;
        }
        if (this.fishSpawnTimer > this.fishSpawnDelay && this.objectsByFaction[2].size < 100) {
            this.fishSpawnTimer -= this.fishSpawnDelay;
            //add new Fish
            for (let i = 0; i < 4; i++) {
                this.newFish();
            }
        }
        if (this.sharkSpawnTimer > this.sharkSpawnDelay && this.objectsByFaction[3].size < 5) {
            this.sharkSpawnTimer -= this.sharkSpawnDelay;
            //add new Shark(s)
            for (let i = 0; i < 1; i++) {
                this.newShark();
            }
        }
        //collision testing last
        handleCollisions(this.objectsByFaction, this.projectilesByFaction);
    }
    start() {
        totalRuntime = 0;
        fishSpawnTimer = 0;
        sharkSpawnTimer = 0;
        //draw empty frame behind menu
        context.fillStyle = `rgba(${skyColour.r},${skyColour.g},${skyColour.b},${skyColour.a})`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        //create Sky
        //todo: this should be an object without collision
        for (let i = 0; i < 1; i++) {
            let x = -1000000;
            let y = -10000;
            let width = 2000000;
            let height = 10000;
            let speed = 100;
            let color = skyColour;
            let sky = new DrawableObject(this, { x: x, y: y, width: width, height: height }, "rectangle", color);
            sky.hasCollision = false;
            sky.faction = 0;
            sky.register();
        }
        //create Fish
        for (let i = 0; i < 10; i++) {
            this.newFish();
        }
        //create player last so its drawn last, great solution right here
        let color = { r: 0, g: 0, b: 0, a: 1 };
        let player = new Player(this, { x: 300, y: 300, width: 30, height: 50 }, "rectangle", color, 3);
        player.hasCollision = true;
        player.faction = 1;
        player.affectedByGravity = false;
        player.velocity.x = 0;
        player.velocity.y = 0;
        player.register();
        this.player = player;
    }
    end() {
    }
    newFish() {
        let x = canvas.width * Math.random();
        let y = canvas.height * Math.random();
        let scale = Math.random() / 2 + 0.5;
        let width = 50 * scale;
        let height = 20 * scale;
        let speed = 100;
        let xvel = speed * (Math.random() - 0.5);
        let yvel = speed * (Math.random() - 0.5);
        let color = { r: 0, g: 0, b: 0, a: 1 };
        let fish = new Fish(this, { x, y, width, height }, "rectangle", color);
        fish.velocity.x = xvel;
        fish.velocity.y = yvel;
        fish.faction = 2;
        fish.register();
    }
    newShark() {
        let x = canvas.width * Math.random();
        let y = canvas.height * Math.random();
        let scale = Math.random() / 2 + 0.5;
        let width = 100 * scale;
        let height = 40 * scale;
        let speed = 100;
        let xvel = speed * (Math.random() - 0.5);
        let yvel = speed * (Math.random() - 0.5);
        let color = { r: 0, g: 0, b: 0, a: 1 };
        let shark = new Shark(this, { x, y, width, height }, "rectangle", color);
        shark.sharkAccelerationFactor = 3 - 2 * scale;
        shark.velocity.x = xvel;
        shark.velocity.y = yvel;
        shark.faction = 3;
        shark.register();
    }
}
