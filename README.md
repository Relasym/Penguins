# Penguins

Quickly, make a game about penguins before they go extinct

todo:
- General
  - [x] decouple simrate from framerate (still capped by framerate)
  - [x] pause function
  - [x] menu
- Collision and Drawing
  - [ ] implement polygon-polygon collision
  - [ ] unify object draw types
  - [x] add collision type to objects and simplify collision logic
- Levels
  - [ ] add camera (possible issues with transformation matrix in rotateable objects?)
  - [ ] implement level class (collection of drawable objects) + cleanup (really necessary? basically a singleton)
  - [ ] change autodestruct of objects to use level boundary
- Content
  - [x] add shark
  - [x] bubbles!
- Bugs
  - [ ] penguin moving in rectangles instead of straight lines when changing direction (max speed issue?)
  - [ ] fishcounter off sometimes, events not triggering correctly?
  - [ ] pausemenu triggering for a frame or two, draw issue? (set menu invisible while in background?)
  - [x] spacebar triggers pause menu after it has been opened once
  - [ ] debug stattrackers too close in small windows
  - [ ] framerate inconsistent (double frames on 144hz)
