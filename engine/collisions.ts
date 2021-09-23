
/*collision functions */

//checks for object types, then calls appropriate collision detection function
function areObjectsColliding(object1: any, object2: any): boolean {
    collisionChecks++;
    let type1 = object1.type;
    let type2 = object2.type;
    if (type1 = "rectangle") {
        if (type2 = "rectangle") {
            return collisionRectangleRectangle(object1, object2);
        } else {
            return collisionRectangleCircle(object1, object2);
        }
    } else {
        if (type2 = "rectangle") {
            return collisionRectangleCircle(object2, object1);
        } else {
            return collisionCircleCircle(object1, object2);
        }
    }
}

function collisionRectangleRectangle(rectangle1: any, rectangle2: any): boolean {
    return (rectangle1.shape.x < rectangle2.shape.x + rectangle2.shape.width &&
        rectangle1.shape.x + rectangle1.shape.width > rectangle2.shape.x &&
        rectangle1.shape.y < rectangle2.shape.y + rectangle2.shape.height &&
        rectangle1.shape.y + rectangle1.shape.height > rectangle2.shape.y)
}
function collisionRectangleCircle(rectangle: any, circle: any): boolean {
    if (rectangle.type == "circle") {
        let swap = rectangle;
        rectangle = circle;
        circle = swap;
    }
    let xborder = circle.x
    let yborder = circle.y
    if (circle.x < rectangle.x) xborder = rectangle.x
    else if (circle.x > (rectangle.x + rectangle.width)) xborder = rectangle.x + rectangle.width
    if (circle.y < rectangle.y) yborder = rectangle.y
    else if (circle.y > (rectangle.y + rectangle.height)) yborder = rectangle.y + rectangle.height
    let dist = Math.sqrt((circle.x - xborder) ** 2 + (circle.y - yborder) ** 2)
    return (dist <= circle.radius)
}
function collisionCircleCircle(circle1: any, circle2: any): boolean {
    return (vectorLength({ x: circle1.x - circle2.x, y: circle1.y - circle2.y }) <= (circle1.radius + circle2.radius))
}