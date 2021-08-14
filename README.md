# Penguins

Quickly, make a game about penguins before they go extinct

todo:
- General
  - [x] decouple simrate from framerate (still capped by framerate)
  - [x] pause function
  - [x] menu
  - [ ] remove jQuery?
  - [ ] separate game logic and animate functions
- Collision and Drawing
  - [ ] implement polygon-polygon collision
  - [ ] unify object draw types
  - [x] add collision type to objects and simplify collision logic
  - [ ] fix rotation (currently deactivated for everything except visuals)
  - [ ] apply depth color change to all objects, not just background
- Levels
  - [x] add camera (possible issues with transformation matrix in rotateable objects?)
  - [ ] REALLY need a object collection class to handle spawning etc.
  - [ ] change autodestruct of objects to use level boundary
  - [ ] add level boundary
- Content
  - [x] add shark
  - [x] bubbles!
  - [x] sky and out-of water effects
  - [x] water color changing with depth
  - [x] fish respawning, sharp spawning
- Bugs, current
  - [ ] penguin moving in rectangles instead of straight lines when changing direction (max speed issue?)
  - [ ] debug stattrackers too close in small windows
  - [ ] framerate inconsistent (double frames on 144hz)
  - [ ] flipping images when drawing completely screws camera???
- Bugs, fixed
  - [x] Sharks get way to fast (acceleration unbounded) (added more friction)
  - [x] spacebar triggers pause menu after it has been opened once (.blur() on pause)
- Bugs, no longer reproducable
  - [ ] fishcounter off sometimes, events not triggering correctly?
  - [ ] pausemenu triggering for a frame or two, draw issue? (set menu invisible while in background?)
