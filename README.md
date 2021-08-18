# Penguins

Quickly, make a game about penguins before they go extinct

todo:
- General
  - [x] decouple simrate from framerate (still capped by framerate)
  - [x] pause function
  - [x] menu
  - [ ] remove jQuery? (using jQuery Color currently)
  - [ ] separate game logic and animate functions
- Collision and Drawing
  - [ ] implement polygon-polygon collision
  - [x] unify object draw types
  - [x] add collision type to objects and simplify collision logic
  - [ ] fix rotation (currently deactivated for everything except visuals)
  - [ ] apply depth color change to all objects, not just background
- Levels
  - [x] add camera (possible issues with transformation matrix in rotateable objects?)
  - [ ] REALLY need an object collection class to handle spawning etc., requires
  - [ ] complete restructuring of class calls
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
  - [ ] flipping images when drawing completely screws camera (cause by flipping around wrong point, also causes teleporting sharks)
  - [ ] collision broken for everything except rectangles (add new class rework coordinates)
  - [ ] very slow since class rework (21ms/frame), check for redundant code in classes
- Bugs, fixed
  - [x] Sharks get way to fast (acceleration unbounded) (added more friction)
  - [x] spacebar triggers pause menu after it has been opened once (.blur() on pause)
  - [x] flying fish
- Bugs, probably fixed (no longer reproducible)
  - [ ] fishcounter off sometimes, events not triggering correctly?
  - [ ] pausemenu triggering for a frame or two, draw issue? (set menu invisible while in background?)
