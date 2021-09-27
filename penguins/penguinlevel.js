class PenguinLevel extends Level {
    constructor(context) {
        super(context);
        this.fishSpawnDelay = 1000; //ms
        this.sharkSpawnDelay = 5000; //ms
        this.fishPerSpawn = 100;
        this.sharksPerSpawn = 10;
        this.maximumFish = 500;
        this.maximumSharks = 100;
        this.fishSpawnTimer = 0;
        this.sharkSpawnTimer = 0;
        this.start();
        this.fishCounter = 0;
    }
    draw() {
        //depth-dependent color calculation
        let color = [124, 233, 252]; //should be oceancolor
        let newcolor = color.map((color) => {
            let depth = Math.max(0, this.camera.y);
            let maxdepth = 2500;
            let remainingdepth = maxdepth - depth;
            color = color * remainingdepth / maxdepth;
            return color;
        });
        context.fillStyle = `rgba(${newcolor[0]},${newcolor[1]},${newcolor[2]},1)`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        this.drawableObjects.forEach((object) => {
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
        if (this.fishSpawnTimer > this.fishSpawnDelay && this.objectsByFaction[2].size < this.maximumFish) {
            this.fishSpawnTimer -= this.fishSpawnDelay;
            //add new Fish
            for (let i = 0; i < this.fishPerSpawn; i++) {
                this.newFish();
            }
        }
        if (this.sharkSpawnTimer > this.sharkSpawnDelay && this.objectsByFaction[3].size < this.maximumSharks) {
            this.sharkSpawnTimer -= this.sharkSpawnDelay;
            //add new Shark(s)
            for (let i = 0; i < this.sharksPerSpawn; i++) {
                this.newShark();
            }
        }
        //collision testing last
        this.handleCollisions(this.objectsByFaction, this.projectilesByFaction);
    }
    start() {
        totalRuntime = 0;
        fishSpawnTimer = 0;
        sharkSpawnTimer = 0;
        //draw empty frame behind menu
        context.fillStyle = `rgba(${skyColour.r},${skyColour.g},${skyColour.b},${skyColour.a})`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        // let test = new DrawableObject(this,{x:100,y:100,width:400,height:400},"rectangle", {r:100,g:100,b:100,a:1});
        // test.faction=0;
        // test.register();
        //create Sky
        for (let i = 0; i < 1; i++) {
            let x = -1000000;
            let y = -10000;
            let width = 2000000;
            let height = 10000;
            let color = skyColour;
            let sky = new GameObject(this, { x: x, y: y, width: width, height: height }, collisionType.Rectangle, color);
            sky.hasCollision = false;
            sky.isUpdateable = false;
            sky.faction = 0;
            sky.register();
        }
        //create Fish
        for (let i = 0; i < 10; i++) {
            this.newFish();
        }
        //create player
        let color = { r: 0, g: 0, b: 0, a: 1 };
        let player = new Penguin(this, { x: 300, y: 300, width: 30, height: 50 }, collisionType.Rectangle, color, 3);
        player.hasCollision = true;
        player.faction = 1;
        player.affectedByGravity = false;
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
        let color = { r: 255, g: 255, b: 255, a: 1 };
        let fish = new Fish(this, { x, y, width, height }, collisionType.Rectangle, color);
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
        let shark = new Shark(this, { x, y, width, height }, collisionType.Rectangle, color);
        shark.sharkAccelerationFactor = 3 - 2 * scale;
        shark.velocity.x = xvel;
        shark.velocity.y = yvel;
        shark.faction = 3;
        shark.register();
    }
    handleCollisions(objectsByFaction, projectilesByFaction) {
        /*
        TODO
        first projectiles collide:
            a, with non-faction projectiles
            b, with non-faction actors
            c, with terrain
        second actors collide
            a, with non-faction actors
            b, with terrain
        */
        //Projectile collisions
        for (let i = 0; i < projectilesByFaction.length; i++) { //faction 0 should not have projectiles?
            //  projectile collides with other projectile
            for (let j = 0; j < projectilesByFaction.length; j++) {
                if (i != j) {
                    projectilesByFaction[i].forEach((projectile1) => {
                        projectilesByFaction[j].forEach((projectile2) => {
                            if (projectile1.hasCollision && projectile2.hasCollision && areObjectsColliding(projectile1, projectile2)) {
                                console.log("proj proj coll");
                                projectile1.startDestruction();
                                projectile2.startDestruction();
                            }
                        });
                    });
                }
            }
            //projectile collides with faction object other than faction 0 (terrain)
            for (let j = 1; j < objectsByFaction.length; j++) {
                if (i != j) {
                    projectilesByFaction[i].forEach((projectile) => {
                        objectsByFaction[j].forEach((object) => {
                            if (projectile.hasCollision && object.hasCollision && areObjectsColliding(projectile, object)) {
                                console.log("proj act coll");
                                projectile.startDestruction();
                                object.startDestruction();
                            }
                        });
                    });
                }
            }
            //projectile collides with faction 0 object (terrain)
            if (i != 0) {
                //TODO let faction 0 projectiles collide with terrain?
                projectilesByFaction[i].forEach((projectile) => {
                    objectsByFaction[0].forEach((object) => {
                        if (projectile.hasCollision && object.hasCollision && areObjectsColliding(projectile, object)) {
                            projectile.startDestruction();
                            console.log("proj terr coll");
                        }
                    });
                });
            }
        }
        for (let i = 1; i < objectsByFaction.length; i++) {
            for (let j = i + 1; j < objectsByFaction.length; j++) {
                if (i != j) {
                    for (let object1 of objectsByFaction[i]) {
                        for (let object2 of objectsByFaction[j]) {
                            if (object1.hasCollision && object2.hasCollision && areObjectsColliding(object1, object2)) {
                                if (object1.constructor.name == "Penguin" && object2.constructor.name == "Fish") {
                                    object2.startDestruction();
                                    levels[currentLevel].fishCounter++;
                                }
                                if (object1.constructor.name == "Fish" && object2.constructor.name == "Shark") {
                                    object1.startDestruction();
                                }
                                if (object1.constructor.name == "Penguin" && object2.constructor.name == "Shark") {
                                    object1.startDestruction();
                                    document.getElementById("menuline2").innerHTML = "Game Over!";
                                    togglePause();
                                }
                            }
                        }
                    }
                }
            }
            for (let object1 of objectsByFaction[i]) {
                for (let object2 of objectsByFaction[0]) {
                    if (object1.hasCollision && object2.hasCollision && areObjectsColliding(object1, object2)) {
                        object1.velocity = { x: 0, y: 0 };
                        //object colliding with terrain stop completely
                    }
                }
            }
        }
    }
}
