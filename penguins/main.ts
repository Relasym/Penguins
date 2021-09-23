const fishSpawnDelay = 1000; //ms
const sharkSpawnDelay = 5000; //ms


const penguinSrc: string = "https://www.freeiconspng.com/uploads/penguin-png-5.png";
const fishSrc: string = "https://www.freeiconspng.com/uploads/fish-png-16.png";
const sharkSrc: string = "https://www.freeiconspng.com/uploads/animal-shark-png-6.png";
const penguinImage = new Image();
penguinImage.src = penguinSrc;
const fishImage = new Image();
fishImage.src = fishSrc;
const sharkImage = new Image();
sharkImage.src = sharkSrc;

const oceanColour = { r: 124, g: 233, b: 252, a: 1 };
const skyColour = { r: 204, g: 233, b: 252, a: 1 };

let fishSpawnTimer = 0; //time since last fish spawn
let sharkSpawnTimer = 0; //time since last shark spawn