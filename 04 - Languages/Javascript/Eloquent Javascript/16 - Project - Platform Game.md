```
Source:
Tags: 
Last-Updated:
```

[◀](https://eloquentjavascript.net/15_event.html) [◆](https://eloquentjavascript.net/index.html) [▶](https://eloquentjavascript.net/17_canvas.html)

# Chapter 16Project: A Platform Game

> [](https://eloquentjavascript.net/16_game.html#p_kUA7+lr6ay)All reality is a game.
> 
> Iain Banks, The Player of Games

![Picture of a game character jumping over lava](https://eloquentjavascript.net/img/chapter_picture_16.jpg)

[](https://eloquentjavascript.net/16_game.html#p_OqEjiDXza0)Much of my initial fascination with computers, like that of many nerdy kids, had to do with computer games. I was drawn into the tiny simulated worlds that I could manipulate and in which stories (sort of) unfolded—more, I suppose, because of the way I projected my imagination into them than because of the possibilities they actually offered.

[](https://eloquentjavascript.net/16_game.html#p_hkas9mExVc)I don’t wish a career in game programming on anyone. Much like the music industry, the discrepancy between the number of eager young people wanting to work in it and the actual demand for such people creates a rather unhealthy environment. But writing games for fun is amusing.

[](https://eloquentjavascript.net/16_game.html#p_U1BQ0KJdvV)This chapter will walk through the implementation of a small platform game. Platform games (or “jump and run” games) are games that expect the player to move a figure through a world, which is usually two-dimensional and viewed from the side, while jumping over and onto things.

## [](https://eloquentjavascript.net/16_game.html#h_lMtTRzata0)The game

[](https://eloquentjavascript.net/16_game.html#p_C38xTPlNF8)Our game will be roughly based on [Dark Blue](http://www.lessmilk.com/games/10) by Thomas Palef. I chose that game because it is both entertaining and minimalist and because it can be built without too much code. It looks like this:

![The game Dark Blue](https://eloquentjavascript.net/img/darkblue.png)

[](https://eloquentjavascript.net/16_game.html#p_mIXBfsCnQQ)The dark box represents the player, whose task is to collect the yellow boxes (coins) while avoiding the red stuff (lava). A level is completed when all coins have been collected.

[](https://eloquentjavascript.net/16_game.html#p_Y1K6GO/tu5)The player can walk around with the left and right arrow keys and can jump with the up arrow. Jumping is a specialty of this game character. It can reach several times its own height and can change direction in midair. This may not be entirely realistic, but it helps give the player the feeling of being in direct control of the on-screen avatar.

[](https://eloquentjavascript.net/16_game.html#p_or+OtPnSO1)The game consists of a static background, laid out like a grid, with the moving elements overlaid on that background. Each field on the grid is either empty, solid, or lava. The moving elements are the player, coins, and certain pieces of lava. The positions of these elements are not constrained to the grid—their coordinates may be fractional, allowing smooth motion.

## [](https://eloquentjavascript.net/16_game.html#h_hLFu/U4fE5)The technology

[](https://eloquentjavascript.net/16_game.html#p_w6B1L26QOc)We will use the browser DOM to display the game, and we’ll read user input by handling key events.

[](https://eloquentjavascript.net/16_game.html#p_wha4Kv9EnE)The screen- and keyboard-related code is only a small part of the work we need to do to build this game. Since everything looks like colored boxes, drawing is uncomplicated: we create DOM elements and use styling to give them a background color, size, and position.

[](https://eloquentjavascript.net/16_game.html#p_iXpeeK1cBS)We can represent the background as a table since it is an unchanging grid of squares. The free-moving elements can be overlaid using absolutely positioned elements.

[](https://eloquentjavascript.net/16_game.html#p_uCQz+7JTon)In games and other programs that should animate graphics and respond to user input without noticeable delay, efficiency is important. Although the DOM was not originally designed for high-performance graphics, it is actually better at this than you would expect. You saw some animations in [Chapter 14](https://eloquentjavascript.net/14_dom.html#animation). On a modern machine, a simple game like this performs well, even if we don’t worry about optimization very much.

[](https://eloquentjavascript.net/16_game.html#p_fFvps6KPyM)In the [next chapter](https://eloquentjavascript.net/17_canvas.html), we will explore another browser technology, the `<canvas>` tag, which provides a more traditional way to draw graphics, working in terms of shapes and pixels rather than DOM elements.

## [](https://eloquentjavascript.net/16_game.html#h_7UfwmBGLOk)Levels

[](https://eloquentjavascript.net/16_game.html#p_abOzbCGnYG)We’ll want a human-readable, human-editable way to specify levels. Since it is okay for everything to start out on a grid, we could use big strings in which each character represents an element—either a part of the background grid or a moving element.

[](https://eloquentjavascript.net/16_game.html#p_On1HrmEvoL)The plan for a small level might look like this:
    
    [](https://eloquentjavascript.net/16_game.html#c_txvY7tsNJp)let simpleLevelPlan = ` ...................... ..#................#.. ..#..............=.#.. ..#.........o.o....#.. ..#.@......#####...#.. ..#####............#.. ......#++++++++++++#.. ......##############.. ......................`;

[](https://eloquentjavascript.net/16_game.html#p_9xefWk13KJ)Periods are empty space, hash (`#`) characters are walls, and plus signs are lava. The player’s starting position is the at sign (`@`). Every O character is a coin, and the equal sign (`=`) at the top is a block of lava that moves back and forth horizontally.

[](https://eloquentjavascript.net/16_game.html#p_0EQudcPkjK)We’ll support two additional kinds of moving lava: the pipe character (`|`) creates vertically moving blobs, and `v` indicates _dripping_ lava—vertically moving lava that doesn’t bounce back and forth but only moves down, jumping back to its start position when it hits the floor.

[](https://eloquentjavascript.net/16_game.html#p_JSlRu3lL/0)A whole game consists of multiple levels that the player must complete. A level is completed when all coins have been collected. If the player touches lava, the current level is restored to its starting position, and the player may try again.

## [](https://eloquentjavascript.net/16_game.html#h_DeVC1tufta)Reading a level

[](https://eloquentjavascript.net/16_game.html#p_YiuShyNEuf)The following class stores a level object. Its argument should be the string that defines the level.
    
    [](https://eloquentjavascript.net/16_game.html#c_ObYKMNTKci)class Level { constructor(plan) { let rows = plan.trim().split("
    ").map(l => [...l]); this.height = rows.length; this.width = rows[0].length; this.startActors = []; this.rows = rows.map((row, y) => { return row.map((ch, x) => { let type = levelChars[ch]; if (typeof type == "string") return type; this.startActors.push( type.create(new Vec(x, y), ch)); return "empty"; }); }); } }

[](https://eloquentjavascript.net/16_game.html#p_JIksXnWVuw)The `trim` method is used to remove whitespace at the start and end of the plan string. This allows our example plan to start with a newline so that all the lines are directly below each other. The remaining string is split on newline characters, and each line is spread into an array, producing arrays of characters.

[](https://eloquentjavascript.net/16_game.html#p_LoAi+0JNfy)So `rows` holds an array of arrays of characters, the rows of the plan. We can derive the level’s width and height from these. But we must still separate the moving elements from the background grid. We’ll call moving elements _actors_. They’ll be stored in an array of objects. The background will be an array of arrays of strings, holding field types such as `"empty"`, `"wall"`, or `"lava"`.

[](https://eloquentjavascript.net/16_game.html#p_rJcldM+jM6)To create these arrays, we map over the rows and then over their content. Remember that `map` passes the array index as a second argument to the mapping function, which tells us the x- and y-coordinates of a given character. Positions in the game will be stored as pairs of coordinates, with the top left being 0,0 and each background square being 1 unit high and wide.

[](https://eloquentjavascript.net/16_game.html#p_MMksR1/9C2)To interpret the characters in the plan, the `Level` constructor uses the `levelChars` object, which maps background elements to strings and actor characters to classes. When `type` is an actor class, its static `create` method is used to create an object, which is added to `startActors`, and the mapping function returns `"empty"` for this background square.

[](https://eloquentjavascript.net/16_game.html#p_XPViP3s8zO)The position of the actor is stored as a `Vec` object. This is a two-dimensional vector, an object with `x` and `y` properties, as seen in the exercises of [Chapter 6](https://eloquentjavascript.net/06_object.html#exercise_vector).

[](https://eloquentjavascript.net/16_game.html#p_nuR5OrGgSy)As the game runs, actors will end up in different places or even disappear entirely (as coins do when collected). We’ll use a `State` class to track the state of a running game.
    
    [](https://eloquentjavascript.net/16_game.html#c_8mXPZZkFTr)class State { constructor(level, actors, status) { this.level = level; this.actors = actors; this.status = status; } static start(level) { return new State(level, level.startActors, "playing"); } get player() { return this.actors.find(a => a.type == "player"); } }

[](https://eloquentjavascript.net/16_game.html#p_ykNWl1yVwU)The `status` property will switch to `"lost"` or `"won"` when the game has ended.

[](https://eloquentjavascript.net/16_game.html#p_HXx6FQb6dD)This is again a persistent data structure—updating the game state creates a new state and leaves the old one intact.

## [](https://eloquentjavascript.net/16_game.html#h_pw0251T7gn)Actors

[](https://eloquentjavascript.net/16_game.html#p_JlMpFXE8o0)Actor objects represent the current position and state of a given moving element in our game. All actor objects conform to the same interface. Their `pos` property holds the coordinates of the element’s top-left corner, and their `size` property holds its size.

[](https://eloquentjavascript.net/16_game.html#p_zAiZFPI5Yc)Then they have an `update` method, which is used to compute their new state and position after a given time step. It simulates the thing the actor does—moving in response to the arrow keys for the player and bouncing back and forth for the lava—and returns a new, updated actor object.

[](https://eloquentjavascript.net/16_game.html#p_yHrnzwQ8R4)A `type` property contains a string that identifies the type of the actor—`"player"`, `"coin"`, or `"lava"`. This is useful when drawing the game—the look of the rectangle drawn for an actor is based on its type.

[](https://eloquentjavascript.net/16_game.html#p_vyajSMujgl)Actor classes have a static `create` method that is used by the `Level` constructor to create an actor from a character in the level plan. It is given the coordinates of the character and the character itself, which is needed because the `Lava` class handles several different characters.

[](https://eloquentjavascript.net/16_game.html#p_lWgsae+2Q1)This is the `Vec` class that we’ll use for our two-dimensional values, such as the position and size of actors.
    
    [](https://eloquentjavascript.net/16_game.html#c_Hb9lakixOM)class Vec { constructor(x, y) { this.x = x; this.y = y; } plus(other) { return new Vec(this.x + other.x, this.y + other.y); } times(factor) { return new Vec(this.x * factor, this.y * factor); } }

[](https://eloquentjavascript.net/16_game.html#p_gWWk7Ulj1q)The `times` method scales a vector by a given number. It will be useful when we need to multiply a speed vector by a time interval to get the distance traveled during that time.

[](https://eloquentjavascript.net/16_game.html#p_AGmjtw30RN)The different types of actors get their own classes since their behavior is very different. Let’s define these classes. We’ll get to their `update` methods later.

[](https://eloquentjavascript.net/16_game.html#p_qFX0r+uydc)The player class has a property `speed` that stores its current speed to simulate momentum and gravity.
    
    [](https://eloquentjavascript.net/16_game.html#c_+Zda+gD/W/)class Player { constructor(pos, speed) { this.pos = pos; this.speed = speed; } get type() { return "player"; } static create(pos) { return new Player(pos.plus(new Vec(0, -0.5)), new Vec(0, 0)); } } Player.prototype.size = new Vec(0.8, 1.5);

[](https://eloquentjavascript.net/16_game.html#p_pJwDuA/gUR)Because a player is one-and-a-half squares high, its initial position is set to be half a square above the position where the `@` character appeared. This way, its bottom aligns with the bottom of the square it appeared in.

[](https://eloquentjavascript.net/16_game.html#p_X3b7n+ph7P)The `size` property is the same for all instances of `Player`, so we store it on the prototype rather than on the instances themselves. We could have used a getter like `type`, but that would create and return a new `Vec` object every time the property is read, which would be wasteful. (Strings, being immutable, don’t have to be re-created every time they are evaluated.)

[](https://eloquentjavascript.net/16_game.html#p_CZIhBrKg4H)When constructing a `Lava` actor, we need to initialize the object differently depending on the character it is based on. Dynamic lava moves along at its current speed until it hits an obstacle. At that point, if it has a `reset` property, it will jump back to its start position (dripping). If it does not, it will invert its speed and continue in the other direction (bouncing).

[](https://eloquentjavascript.net/16_game.html#p_0NJ2jc8Gmf)The `create` method looks at the character that the `Level` constructor passes and creates the appropriate lava actor.
    
    [](https://eloquentjavascript.net/16_game.html#c_OquWedN4L5)class Lava { constructor(pos, speed, reset) { this.pos = pos; this.speed = speed; this.reset = reset; } get type() { return "lava"; } static create(pos, ch) { if (ch == "=") { return new Lava(pos, new Vec(2, 0)); } else if (ch == "|") { return new Lava(pos, new Vec(0, 2)); } else if (ch == "v") { return new Lava(pos, new Vec(0, 3), pos); } } } Lava.prototype.size = new Vec(1, 1);

[](https://eloquentjavascript.net/16_game.html#p_fqdOUTLAz4)`Coin` actors are relatively simple. They mostly just sit in their place. But to liven up the game a little, they are given a “wobble”, a slight vertical back-and-forth motion. To track this, a coin object stores a base position as well as a `wobble` property that tracks the phase of the bouncing motion. Together, these determine the coin’s actual position (stored in the `pos` property).
    
    [](https://eloquentjavascript.net/16_game.html#c_f2L1vFl5w5)class Coin { constructor(pos, basePos, wobble) { this.pos = pos; this.basePos = basePos; this.wobble = wobble; } get type() { return "coin"; } static create(pos) { let basePos = pos.plus(new Vec(0.2, 0.1)); return new Coin(basePos, basePos, Math.random() * Math.PI * 2); } } Coin.prototype.size = new Vec(0.6, 0.6);

[](https://eloquentjavascript.net/16_game.html#p_C16pTz7oRy)In [Chapter 14](https://eloquentjavascript.net/14_dom.html#sin_cos), we saw that `Math.sin` gives us the y-coordinate of a point on a circle. That coordinate goes back and forth in a smooth waveform as we move along the circle, which makes the sine function useful for modeling a wavy motion.

[](https://eloquentjavascript.net/16_game.html#p_gQCua74XOk)To avoid a situation where all coins move up and down synchronously, the starting phase of each coin is randomized. The period of `Math.sin`’s wave, the width of a wave it produces, is 2π. We multiply the value returned by `Math.random` by that number to give the coin a random starting position on the wave.

[](https://eloquentjavascript.net/16_game.html#p_0wsl0zoIAL)We can now define the `levelChars` object that maps plan characters to either background grid types or actor classes.
    
    [](https://eloquentjavascript.net/16_game.html#c_VxaicldIYi)const levelChars = { ".": "empty", "#": "wall", "+": "lava", "@": Player, "o": Coin, "=": Lava, "|": Lava, "v": Lava };

[](https://eloquentjavascript.net/16_game.html#p_DkV+hEDKE5)That gives us all the parts needed to create a `Level` instance.
    
    [](https://eloquentjavascript.net/16_game.html#c_CDJvcZL+0x)let simpleLevel = new Level(simpleLevelPlan); console.log(`${simpleLevel.width} by ${simpleLevel.height}`); // → 22 by 9

[](https://eloquentjavascript.net/16_game.html#p_lCdOTin0mI)The task ahead is to display such levels on the screen and to model time and motion inside them.

## [](https://eloquentjavascript.net/16_game.html#h_uCRd57RG2L)Encapsulation as a burden

[](https://eloquentjavascript.net/16_game.html#p_M65QHGE4qM)Most of the code in this chapter does not worry about encapsulation very much for two reasons. First, encapsulation takes extra effort. It makes programs bigger and requires additional concepts and interfaces to be introduced. Since there is only so much code you can throw at a reader before their eyes glaze over, I’ve made an effort to keep the program small.

[](https://eloquentjavascript.net/16_game.html#p_21KwkzRO2L)Second, the various elements in this game are so closely tied together that if the behavior of one of them changed, it is unlikely that any of the others would be able to stay the same. Interfaces between the elements would end up encoding a lot of assumptions about the way the game works. This makes them a lot less effective—whenever you change one part of the system, you still have to worry about the way it impacts the other parts because their interfaces wouldn’t cover the new situation.

[](https://eloquentjavascript.net/16_game.html#p_0qau17Yus5)Some _cutting points_ in a system lend themselves well to separation through rigorous interfaces, but others don’t. Trying to encapsulate something that isn’t a suitable boundary is a sure way to waste a lot of energy. When you are making this mistake, you’ll usually notice that your interfaces are getting awkwardly large and detailed and that they need to be changed often, as the program evolves.

[](https://eloquentjavascript.net/16_game.html#p_zVT1v9P1c6)There is one thing that we _will_ encapsulate, and that is the drawing subsystem. The reason for this is that we’ll display the same game in a different way in the [next chapter](https://eloquentjavascript.net/17_canvas.html#canvasdisplay). By putting the drawing behind an interface, we can load the same game program there and plug in a new display module.

## [](https://eloquentjavascript.net/16_game.html#h_neNgUMdlHQ)Drawing

[](https://eloquentjavascript.net/16_game.html#p_bjlUPfTgQP)The encapsulation of the drawing code is done by defining a _display_ object, which displays a given level and state. The display type we define in this chapter is called `DOMDisplay` because it uses DOM elements to show the level.

[](https://eloquentjavascript.net/16_game.html#p_8XJ1fe7OPg)We’ll be using a style sheet to set the actual colors and other fixed properties of the elements that make up the game. It would also be possible to directly assign to the elements’ `style` property when we create them, but that would produce more verbose programs.

[](https://eloquentjavascript.net/16_game.html#p_nm5ENHsGf9)The following helper function provides a succinct way to create an element and give it some attributes and child nodes:
    
    [](https://eloquentjavascript.net/16_game.html#c_IslrNCPEgI)function elt(name, attrs, ...children) { let dom = document.createElement(name); for (let attr of Object.keys(attrs)) { dom.setAttribute(attr, attrs[attr]); } for (let child of children) { dom.appendChild(child); } return dom; }

[](https://eloquentjavascript.net/16_game.html#p_Xjpq/reXQf)A display is created by giving it a parent element to which it should append itself and a level object.
    
    [](https://eloquentjavascript.net/16_game.html#c_YPdTKEt761)class DOMDisplay { constructor(parent, level) { this.dom = elt("div", {class: "game"}, drawGrid(level)); this.actorLayer = null; parent.appendChild(this.dom); } clear() { this.dom.remove(); } }

[](https://eloquentjavascript.net/16_game.html#p_mbvJm4+nKS)The level’s background grid, which never changes, is drawn once. Actors are redrawn every time the display is updated with a given state. The `actorLayer` property will be used to track the element that holds the actors so that they can be easily removed and replaced.

[](https://eloquentjavascript.net/16_game.html#p_si3+n3Lijy)Our coordinates and sizes are tracked in grid units, where a size or distance of 1 means one grid block. When setting pixel sizes, we will have to scale these coordinates up—everything in the game would be ridiculously small at a single pixel per square. The `scale` constant gives the number of pixels that a single unit takes up on the screen.
    
    [](https://eloquentjavascript.net/16_game.html#c_LrmszCVXMZ)const scale = 20; function drawGrid(level) { return elt("table", { class: "background", style: `width: ${level.width * scale}px` }, ...level.rows.map(row => elt("tr", {style: `height: ${scale}px`}, ...row.map(type => elt("td", {class: type}))) )); }

[](https://eloquentjavascript.net/16_game.html#p_cGH93DulN/)As mentioned, the background is drawn as a `<table>` element. This nicely corresponds to the structure of the `rows` property of the level—each row of the grid is turned into a table row (`<tr>` element). The strings in the grid are used as class names for the table cell (`<td>`) elements. The spread (triple dot) operator is used to pass arrays of child nodes to `elt` as separate arguments.

[](https://eloquentjavascript.net/16_game.html#p_rtSatvHAOz)The following CSS makes the table look like the background we want:
    
    [](https://eloquentjavascript.net/16_game.html#c_wOP5LzF6Sp).background { background: rgb(52, 166, 251); table-layout: fixed; border-spacing: 0; } .background td { padding: 0; } .lava { background: rgb(255, 100, 100); } .wall { background: white; }

[](https://eloquentjavascript.net/16_game.html#p_Fm4CLmRVL5)Some of these (`table-layout`, `border-spacing`, and `padding`) are used to suppress unwanted default behavior. We don’t want the layout of the table to depend upon the contents of its cells, and we don’t want space between the table cells or padding inside them.

[](https://eloquentjavascript.net/16_game.html#p_SjTsFY8eD3)The `background` rule sets the background color. CSS allows colors to be specified both as words (`white`) or with a format such as `rgb(R, G, B)`, where the red, green, and blue components of the color are separated into three numbers from 0 to 255. So, in `rgb(52, 166, 251)`, the red component is 52, green is 166, and blue is 251. Since the blue component is the largest, the resulting color will be bluish. You can see that in the `.lava` rule, the first number (red) is the largest.

[](https://eloquentjavascript.net/16_game.html#p_EGE24ax3xh)We draw each actor by creating a DOM element for it and setting that element’s position and size based on the actor’s properties. The values have to be multiplied by `scale` to go from game units to pixels.
    
    [](https://eloquentjavascript.net/16_game.html#c_SJNWL3kOZh)function drawActors(actors) { return elt("div", {}, ...actors.map(actor => { let rect = elt("div", {class: `actor ${actor.type}`}); rect.style.width = `${actor.size.x * scale}px`; rect.style.height = `${actor.size.y * scale}px`; rect.style.left = `${actor.pos.x * scale}px`; rect.style.top = `${actor.pos.y * scale}px`; return rect; })); }

[](https://eloquentjavascript.net/16_game.html#p_mTuOphlRZ6)To give an element more than one class, we separate the class names by spaces. In the CSS code shown next, the `actor` class gives the actors their absolute position. Their type name is used as an extra class to give them a color. We don’t have to define the `lava` class again because we’re reusing the class for the lava grid squares we defined earlier.
    
    [](https://eloquentjavascript.net/16_game.html#c_ksr13Gc65g).actor { position: absolute; } .coin { background: rgb(241, 229, 89); } .player { background: rgb(64, 64, 64); }

[](https://eloquentjavascript.net/16_game.html#p_4qUaGsKUgq)The `syncState` method is used to make the display show a given state. It first removes the old actor graphics, if any, and then redraws the actors in their new positions. It may be tempting to try to reuse the DOM elements for actors, but to make that work, we would need a lot of additional bookkeeping to associate actors with DOM elements and to make sure we remove elements when their actors vanish. Since there will typically be only a handful of actors in the game, redrawing all of them is not expensive.
    
    [](https://eloquentjavascript.net/16_game.html#c_/bAFVECbGl)DOMDisplay.prototype.syncState = function(state) { if (this.actorLayer) this.actorLayer.remove(); this.actorLayer = drawActors(state.actors); this.dom.appendChild(this.actorLayer); this.dom.className = `game ${state.status}`; this.scrollPlayerIntoView(state); };

[](https://eloquentjavascript.net/16_game.html#p_sZEoSNaFbo)By adding the level’s current status as a class name to the wrapper, we can style the player actor slightly differently when the game is won or lost by adding a CSS rule that takes effect only when the player has an ancestor element with a given class.
    
    [](https://eloquentjavascript.net/16_game.html#c_6QpUiIcdtL).lost .player { background: rgb(160, 64, 64); } .won .player { box-shadow: -4px -7px 8px white, 4px -7px 8px white; }

[](https://eloquentjavascript.net/16_game.html#p_RiEBu6FHP5)After touching lava, the player’s color turns dark red, suggesting scorching. When the last coin has been collected, we add two blurred white shadows—one to the top left and one to the top right—to create a white halo effect.

[](https://eloquentjavascript.net/16_game.html#p_3Lai0THCj4)We can’t assume that the level always fits in the _viewport_—the element into which we draw the game. That is why the `scrollPlayerIntoView` call is needed. It ensures that if the level is protruding outside the viewport, we scroll that viewport to make sure the player is near its center. The following CSS gives the game’s wrapping DOM element a maximum size and ensures that anything that sticks out of the element’s box is not visible. We also give it a relative position so that the actors inside it are positioned relative to the level’s top-left corner.
    
    [](https://eloquentjavascript.net/16_game.html#c_cxq+gtsZuW).game { overflow: hidden; max-width: 600px; max-height: 450px; position: relative; }

[](https://eloquentjavascript.net/16_game.html#p_IgYwZuZ1Co)In the `scrollPlayerIntoView` method, we find the player’s position and update the wrapping element’s scroll position. We change the scroll position by manipulating that element’s `scrollLeft` and `scrollTop` properties when the player is too close to the edge.
    
    [](https://eloquentjavascript.net/16_game.html#c_Of96qEfT96)DOMDisplay.prototype.scrollPlayerIntoView = function(state) { let width = this.dom.clientWidth; let height = this.dom.clientHeight; let margin = width / 3; // The viewport let left = this.dom.scrollLeft, right = left + width; let top = this.dom.scrollTop, bottom = top + height; let player = state.player; let center = player.pos.plus(player.size.times(0.5)) .times(scale); if (center.x < left + margin) { this.dom.scrollLeft = center.x - margin; } else if (center.x > right - margin) { this.dom.scrollLeft = center.x + margin - width; } if (center.y < top + margin) { this.dom.scrollTop = center.y - margin; } else if (center.y > bottom - margin) { this.dom.scrollTop = center.y + margin - height; } };

[](https://eloquentjavascript.net/16_game.html#p_3qHzB4KoD+)The way the player’s center is found shows how the methods on our `Vec` type allow computations with objects to be written in a relatively readable way. To find the actor’s center, we add its position (its top-left corner) and half its size. That is the center in level coordinates, but we need it in pixel coordinates, so we then multiply the resulting vector by our display scale.

[](https://eloquentjavascript.net/16_game.html#p_nyYhuiyn32)Next, a series of checks verifies that the player position isn’t outside of the allowed range. Note that sometimes this will set nonsense scroll coordinates that are below zero or beyond the element’s scrollable area. This is okay—the DOM will constrain them to acceptable values. Setting `scrollLeft` to -10 will cause it to become 0.

[](https://eloquentjavascript.net/16_game.html#p_MFibm1pU7d)It would have been slightly simpler to always try to scroll the player to the center of the viewport. But this creates a rather jarring effect. As you are jumping, the view will constantly shift up and down. It is more pleasant to have a “neutral” area in the middle of the screen where you can move around without causing any scrolling.

[](https://eloquentjavascript.net/16_game.html#p_LSD2j1d23Y)We are now able to display our tiny level.
    
    [](https://eloquentjavascript.net/16_game.html#c_LDPexlnWt1)<link rel="stylesheet" href="css/game.css"> <script> let simpleLevel = new Level(simpleLevelPlan); let display = new DOMDisplay(document.body, simpleLevel); display.syncState(State.start(simpleLevel)); </script>

[](https://eloquentjavascript.net/16_game.html#p_WeN+Ro9UkI)The `<link>` tag, when used with `rel="stylesheet"`, is a way to load a CSS file into a page. The file `game.css` contains the styles necessary for our game.

## [](https://eloquentjavascript.net/16_game.html#h_zX4xC7JBQU)Motion and collision

[](https://eloquentjavascript.net/16_game.html#p_Ans+nACOmo)Now we’re at the point where we can start adding motion—the most interesting aspect of the game. The basic approach, taken by most games like this, is to split time into small steps and, for each step, move the actors by a distance corresponding to their speed multiplied by the size of the time step. We’ll measure time in seconds, so speeds are expressed in units per second.

[](https://eloquentjavascript.net/16_game.html#p_AMJvAGiWYs)Moving things is easy. The difficult part is dealing with the interactions between the elements. When the player hits a wall or floor, they should not simply move through it. The game must notice when a given motion causes an object to hit another object and respond accordingly. For walls, the motion must be stopped. When hitting a coin, it must be collected. When touching lava, the game should be lost.

[](https://eloquentjavascript.net/16_game.html#p_0knqUiUFMu)Solving this for the general case is a big task. You can find libraries, usually called _physics engines_, that simulate interaction between physical objects in two or three dimensions. We’ll take a more modest approach in this chapter, handling only collisions between rectangular objects and handling them in a rather simplistic way.

[](https://eloquentjavascript.net/16_game.html#p_siPXpdT6C4)Before moving the player or a block of lava, we test whether the motion would take it inside of a wall. If it does, we simply cancel the motion altogether. The response to such a collision depends on the type of actor—the player will stop, whereas a lava block will bounce back.

[](https://eloquentjavascript.net/16_game.html#p_SnXtyooCGY)This approach requires our time steps to be rather small since it will cause motion to stop before the objects actually touch. If the time steps (and thus the motion steps) are too big, the player would end up hovering a noticeable distance above the ground. Another approach, arguably better but more complicated, would be to find the exact collision spot and move there. We will take the simple approach and hide its problems by ensuring the animation proceeds in small steps.

[](https://eloquentjavascript.net/16_game.html#p_3qnJ7o6jgV)This method tells us whether a rectangle (specified by a position and a size) touches a grid element of the given type.
    
    [](https://eloquentjavascript.net/16_game.html#c_L9DHo/CdJs)Level.prototype.touches = function(pos, size, type) { let xStart = Math.floor(pos.x); let xEnd = Math.ceil(pos.x + size.x); let yStart = Math.floor(pos.y); let yEnd = Math.ceil(pos.y + size.y); for (let y = yStart; y < yEnd; y++) { for (let x = xStart; x < xEnd; x++) { let isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height; let here = isOutside ? "wall" : this.rows[y][x]; if (here == type) return true; } } return false; };

[](https://eloquentjavascript.net/16_game.html#p_4FaUFI2Ppt)The method computes the set of grid squares that the body overlaps with by using `Math.floor` and `Math.ceil` on its coordinates. Remember that grid squares are 1 by 1 units in size. By rounding the sides of a box up and down, we get the range of background squares that the box touches.

![Finding collisions on a grid](https://eloquentjavascript.net/img/game-grid.svg)

[](https://eloquentjavascript.net/16_game.html#p_y0L2VEuDgy)We loop over the block of grid squares found by rounding the coordinates and return `true` when a matching square is found. Squares outside of the level are always treated as `"wall"` to ensure that the player can’t leave the world and that we won’t accidentally try to read outside of the bounds of our `rows` array.

[](https://eloquentjavascript.net/16_game.html#p_VPBaabj50T)The state `update` method uses `touches` to figure out whether the player is touching lava.
    
    [](https://eloquentjavascript.net/16_game.html#c_af6Xo1AsIn)State.prototype.update = function(time, keys) { let actors = this.actors .map(actor => actor.update(time, this, keys)); let newState = new State(this.level, actors, this.status); if (newState.status != "playing") return newState; let player = newState.player; if (this.level.touches(player.pos, player.size, "lava")) { return new State(this.level, actors, "lost"); } for (let actor of actors) { if (actor != player && overlap(actor, player)) { newState = actor.collide(newState); } } return newState; };

[](https://eloquentjavascript.net/16_game.html#p_i/qab4417U)The method is passed a time step and a data structure that tells it which keys are being held down. The first thing it does is call the `update` method on all actors, producing an array of updated actors. The actors also get the time step, the keys, and the state, so that they can base their update on those. Only the player will actually read keys, since that’s the only actor that’s controlled by the keyboard.

[](https://eloquentjavascript.net/16_game.html#p_CTpNIbtVGd)If the game is already over, no further processing has to be done (the game can’t be won after being lost, or vice versa). Otherwise, the method tests whether the player is touching background lava. If so, the game is lost, and we’re done. Finally, if the game really is still going on, it sees whether any other actors overlap the player.

[](https://eloquentjavascript.net/16_game.html#p_JshvA9JB7k)Overlap between actors is detected with the `overlap` function. It takes two actor objects and returns true when they touch—which is the case when they overlap both along the x-axis and along the y-axis.
    
    [](https://eloquentjavascript.net/16_game.html#c_Z19icVgfA7)function overlap(actor1, actor2) { return actor1.pos.x + actor1.size.x > actor2.pos.x && actor1.pos.x < actor2.pos.x + actor2.size.x && actor1.pos.y + actor1.size.y > actor2.pos.y && actor1.pos.y < actor2.pos.y + actor2.size.y; }

[](https://eloquentjavascript.net/16_game.html#p_EMdttGHwtg)If any actor does overlap, its `collide` method gets a chance to update the state. Touching a lava actor sets the game status to `"lost"`. Coins vanish when you touch them and set the status to `"won"` when they are the last coin of the level.
    
    [](https://eloquentjavascript.net/16_game.html#c_jNqQLSOJRn)Lava.prototype.collide = function(state) { return new State(state.level, state.actors, "lost"); }; Coin.prototype.collide = function(state) { let filtered = state.actors.filter(a => a != this); let status = state.status; if (!filtered.some(a => a.type == "coin")) status = "won"; return new State(state.level, filtered, status); };

## [](https://eloquentjavascript.net/16_game.html#h_GaxRpVIsuF)Actor updates

[](https://eloquentjavascript.net/16_game.html#p_fbEQ61HTVq)Actor objects’ `update` methods take as arguments the time step, the state object, and a `keys` object. The one for the `Lava` actor type ignores the `keys` object.
    
    [](https://eloquentjavascript.net/16_game.html#c_vuIaAGYDTl)Lava.prototype.update = function(time, state) { let newPos = this.pos.plus(this.speed.times(time)); if (!state.level.touches(newPos, this.size, "wall")) { return new Lava(newPos, this.speed, this.reset); } else if (this.reset) { return new Lava(this.reset, this.speed, this.reset); } else { return new Lava(this.pos, this.speed.times(-1)); } };

[](https://eloquentjavascript.net/16_game.html#p_NnAl39AH58)This `update` method computes a new position by adding the product of the time step and the current speed to its old position. If no obstacle blocks that new position, it moves there. If there is an obstacle, the behavior depends on the type of the lava block—dripping lava has a `reset` position, to which it jumps back when it hits something. Bouncing lava inverts its speed by multiplying it by -1 so that it starts moving in the opposite direction.

[](https://eloquentjavascript.net/16_game.html#p_AsHqJXqhZP)Coins use their `update` method to wobble. They ignore collisions with the grid since they are simply wobbling around inside of their own square.
    
    [](https://eloquentjavascript.net/16_game.html#c_+DC3G3xD19)const wobbleSpeed = 8, wobbleDist = 0.07; Coin.prototype.update = function(time) { let wobble = this.wobble + time * wobbleSpeed; let wobblePos = Math.sin(wobble) * wobbleDist; return new Coin(this.basePos.plus(new Vec(0, wobblePos)), this.basePos, wobble); };

[](https://eloquentjavascript.net/16_game.html#p_SYkdq1IZii)The `wobble` property is incremented to track time and then used as an argument to `Math.sin` to find the new position on the wave. The coin’s current position is then computed from its base position and an offset based on this wave.

[](https://eloquentjavascript.net/16_game.html#p_SuUDJCzjex)That leaves the player itself. Player motion is handled separately per axis because hitting the floor should not prevent horizontal motion, and hitting a wall should not stop falling or jumping motion.
    
    [](https://eloquentjavascript.net/16_game.html#c_cBJRAPnr2+)const playerXSpeed = 7; const gravity = 30; const jumpSpeed = 17; Player.prototype.update = function(time, state, keys) { let xSpeed = 0; if (keys.ArrowLeft) xSpeed -= playerXSpeed; if (keys.ArrowRight) xSpeed += playerXSpeed; let pos = this.pos; let movedX = pos.plus(new Vec(xSpeed * time, 0)); if (!state.level.touches(movedX, this.size, "wall")) { pos = movedX; } let ySpeed = this.speed.y + time * gravity; let movedY = pos.plus(new Vec(0, ySpeed * time)); if (!state.level.touches(movedY, this.size, "wall")) { pos = movedY; } else if (keys.ArrowUp && ySpeed > 0) { ySpeed = -jumpSpeed; } else { ySpeed = 0; } return new Player(pos, new Vec(xSpeed, ySpeed)); };

[](https://eloquentjavascript.net/16_game.html#p_rmP4WNaYTL)The horizontal motion is computed based on the state of the left and right arrow keys. When there’s no wall blocking the new position created by this motion, it is used. Otherwise, the old position is kept.

[](https://eloquentjavascript.net/16_game.html#p_BP0T8XR1kg)Vertical motion works in a similar way but has to simulate jumping and gravity. The player’s vertical speed (`ySpeed`) is first accelerated to account for gravity.

[](https://eloquentjavascript.net/16_game.html#p_3H8Calt+MC)We check for walls again. If we don’t hit any, the new position is used. If there _is_ a wall, there are two possible outcomes. When the up arrow is pressed _and_ we are moving down (meaning the thing we hit is below us), the speed is set to a relatively large, negative value. This causes the player to jump. If that is not the case, the player simply bumped into something, and the speed is set to zero.

[](https://eloquentjavascript.net/16_game.html#p_HeVD7be3z6)The gravity strength, jumping speed, and pretty much all other constants in this game have been set by trial and error. I tested values until I found a combination I liked.

## [](https://eloquentjavascript.net/16_game.html#h_zKch6Si/SS)Tracking keys

[](https://eloquentjavascript.net/16_game.html#p_NBxmiqrPk8)For a game like this, we do not want keys to take effect once per keypress. Rather, we want their effect (moving the player figure) to stay active as long as they are held.

[](https://eloquentjavascript.net/16_game.html#p_AHo2Emv/R2)We need to set up a key handler that stores the current state of the left, right, and up arrow keys. We will also want to call `preventDefault` for those keys so that they don’t end up scrolling the page.

[](https://eloquentjavascript.net/16_game.html#p_oH4kiTyM1E)The following function, when given an array of key names, will return an object that tracks the current position of those keys. It registers event handlers for `"keydown"` and `"keyup"` events and, when the key code in the event is present in the set of codes that it is tracking, updates the object.
    
    [](https://eloquentjavascript.net/16_game.html#c_HHYPd26+il)function trackKeys(keys) { let down = Object.create(null); function track(event) { if (keys.includes(event.key)) { down[event.key] = event.type == "keydown"; event.preventDefault(); } } window.addEventListener("keydown", track); window.addEventListener("keyup", track); return down; } const arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

[](https://eloquentjavascript.net/16_game.html#p_/Gh0/QdYTL)The same handler function is used for both event types. It looks at the event object’s `type` property to determine whether the key state should be updated to true (`"keydown"`) or false (`"keyup"`).

## [](https://eloquentjavascript.net/16_game.html#h_/jwYTlYjAy)Running the game

[](https://eloquentjavascript.net/16_game.html#p_h0hF0+vYTt)The `requestAnimationFrame` function, which we saw in [Chapter 14](https://eloquentjavascript.net/14_dom.html#animationFrame), provides a good way to animate a game. But its interface is quite primitive—using it requires us to track the time at which our function was called the last time around and call `requestAnimationFrame` again after every frame.

[](https://eloquentjavascript.net/16_game.html#p_YcIf88ICqS)Let’s define a helper function that wraps those boring parts in a convenient interface and allows us to simply call `runAnimation`, giving it a function that expects a time difference as an argument and draws a single frame. When the frame function returns the value `false`, the animation stops.
    
    [](https://eloquentjavascript.net/16_game.html#c_AVT0noPnDW)function runAnimation(frameFunc) { let lastTime = null; function frame(time) { if (lastTime != null) { let timeStep = Math.min(time - lastTime, 100) / 1000; if (frameFunc(timeStep) === false) return; } lastTime = time; requestAnimationFrame(frame); } requestAnimationFrame(frame); }

[](https://eloquentjavascript.net/16_game.html#p_2lfHQQNum5)I have set a maximum frame step of 100 milliseconds (one-tenth of a second). When the browser tab or window with our page is hidden, `requestAnimationFrame` calls will be suspended until the tab or window is shown again. In this case, the difference between `lastTime` and `time` will be the entire time in which the page was hidden. Advancing the game by that much in a single step would look silly and might cause weird side effects, such as the player falling through the floor.

[](https://eloquentjavascript.net/16_game.html#p_jKakPLUmwL)The function also converts the time steps to seconds, which are an easier quantity to think about than milliseconds.

[](https://eloquentjavascript.net/16_game.html#p_kwKnkc4FM+)The `runLevel` function takes a `Level` object and a display constructor and returns a promise. It displays the level (in `document.body`) and lets the user play through it. When the level is finished (lost or won), `runLevel` waits one more second (to let the user see what happens) and then clears the display, stops the animation, and resolves the promise to the game’s end status.
    
    [](https://eloquentjavascript.net/16_game.html#c_HTrHnVaIWA)function runLevel(level, Display) { let display = new Display(document.body, level); let state = State.start(level); let ending = 1; return new Promise(resolve => { runAnimation(time => { state = state.update(time, arrowKeys); display.syncState(state); if (state.status == "playing") { return true; } else if (ending > 0) { ending -= time; return true; } else { display.clear(); resolve(state.status); return false; } }); }); }

[](https://eloquentjavascript.net/16_game.html#p_eyKzVe0sIB)A game is a sequence of levels. Whenever the player dies, the current level is restarted. When a level is completed, we move on to the next level. This can be expressed by the following function, which takes an array of level plans (strings) and a display constructor:
    
    [](https://eloquentjavascript.net/16_game.html#c_SyT3weqmk4)async function runGame(plans, Display) { for (let level = 0; level < plans.length;) { let status = await runLevel(new Level(plans[level]), Display); if (status == "won") level++; } console.log("You've won!"); }

[](https://eloquentjavascript.net/16_game.html#p_ibGanBtTKe)Because we made `runLevel` return a promise, `runGame` can be written using an `async` function, as shown in [Chapter 11](https://eloquentjavascript.net/11_async.html). It returns another promise, which resolves when the player finishes the game.

[](https://eloquentjavascript.net/16_game.html#p_/6dLhjN2fB)There is a set of level plans available in the `GAME_LEVELS` binding in [this chapter’s sandbox](https://eloquentjavascript.net/code#16). This page feeds them to `runGame`, starting an actual game.
    
    [](https://eloquentjavascript.net/16_game.html#c_ftVm34P6My)<link rel="stylesheet" href="css/game.css"> <body> <script> runGame(GAME_LEVELS, DOMDisplay); </script> </body>

[](https://eloquentjavascript.net/16_game.html#p_MkrZ67rFcA)See if you can beat those. I had quite a lot of fun building them.

## [](https://eloquentjavascript.net/16_game.html#h_TcUD2vzyMe)Exercises

### [](https://eloquentjavascript.net/16_game.html#i_tFsh86eaJC)Game over

[](https://eloquentjavascript.net/16_game.html#p_Qg9LKDI5Td)It’s traditional for platform games to have the player start with a limited number of _lives_ and subtract one life each time they die. When the player is out of lives, the game restarts from the beginning.

[](https://eloquentjavascript.net/16_game.html#p_cg64RJFkZh)Adjust `runGame` to implement lives. Have the player start with three. Output the current number of lives (using `console.log`) every time a level starts.
    
    [](https://eloquentjavascript.net/16_game.html#c_/XVg6hHOl5)<link rel="stylesheet" href="css/game.css"> <body> <script> // The old runGame function. Modify it... async function runGame(plans, Display) { for (let level = 0; level < plans.length;) { let status = await runLevel(new Level(plans[level]), Display); if (status == "won") level++; } console.log("You've won!"); } runGame(GAME_LEVELS, DOMDisplay); </script> </body>

### [](https://eloquentjavascript.net/16_game.html#i_cNfzuXtVqI)Pausing the game

[](https://eloquentjavascript.net/16_game.html#p_a/Q1DcuFrC)Make it possible to pause (suspend) and unpause the game by pressing the Esc key.

[](https://eloquentjavascript.net/16_game.html#p_FpramcVlTZ)This can be done by changing the `runLevel` function to use another keyboard event handler and interrupting or resuming the animation whenever the Esc key is hit.

[](https://eloquentjavascript.net/16_game.html#p_QBqhApUa2T)The `runAnimation` interface may not look like it is suitable for this at first glance, but it is if you rearrange the way `runLevel` calls it.

[](https://eloquentjavascript.net/16_game.html#p_WJUxvtDgig)When you have that working, there is something else you could try. The way we have been registering keyboard event handlers is somewhat problematic. The `arrowKeys` object is currently a global binding, and its event handlers are kept around even when no game is running. You could say they _leak_ out of our system. Extend `trackKeys` to provide a way to unregister its handlers and then change `runLevel` to register its handlers when it starts and unregister them again when it is finished.
    
    [](https://eloquentjavascript.net/16_game.html#c_ybbf+T2p9b)<link rel="stylesheet" href="css/game.css"> <body> <script> // The old runLevel function. Modify this... function runLevel(level, Display) { let display = new Display(document.body, level); let state = State.start(level); let ending = 1; return new Promise(resolve => { runAnimation(time => { state = state.update(time, arrowKeys); display.syncState(state); if (state.status == "playing") { return true; } else if (ending > 0) { ending -= time; return true; } else { display.clear(); resolve(state.status); return false; } }); }); } runGame(GAME_LEVELS, DOMDisplay); </script> </body>

### [](https://eloquentjavascript.net/16_game.html#i_tKK8cGG5os)A monster

[](https://eloquentjavascript.net/16_game.html#p_RtEFEXlrkS)It is traditional for platform games to have enemies that you can jump on top of to defeat. This exercise asks you to add such an actor type to the game.

[](https://eloquentjavascript.net/16_game.html#p_Mhy2ENHlzV)We’ll call it a monster. Monsters move only horizontally. You can make them move in the direction of the player, bounce back and forth like horizontal lava, or have any movement pattern you want. The class doesn’t have to handle falling, but it should make sure the monster doesn’t walk through walls.

[](https://eloquentjavascript.net/16_game.html#p_kN0Yd5LQRq)When a monster touches the player, the effect depends on whether the player is jumping on top of them or not. You can approximate this by checking whether the player’s bottom is near the monster’s top. If this is the case, the monster disappears. If not, the game is lost.
    
    [](https://eloquentjavascript.net/16_game.html#c_rthUoERAau)<link rel="stylesheet" href="css/game.css"> <style>.monster { background: purple }</style> <body> <script> // Complete the constructor, update, and collide methods class Monster { constructor(pos, /* ... */) {} get type() { return "monster"; } static create(pos) { return new Monster(pos.plus(new Vec(0, -1))); } update(time, state) {} collide(state) {} } Monster.prototype.size = new Vec(1.2, 2); levelChars["M"] = Monster; runLevel(new Level(` .................................. .################################. .#..............................#. .#..............................#. .#..............................#. .#...........................o..#. .#..@...........................#. .##########..............########. ..........#..o..o..o..o..#........ ..........#...........M..#........ ..........################........ .................................. `), DOMDisplay); </script> </body>

[◀](https://eloquentjavascript.net/15_event.html) [◆](https://eloquentjavascript.net/index.html) [▶](https://eloquentjavascript.net/17_canvas.html)