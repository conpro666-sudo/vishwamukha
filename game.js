/* ============================================================
   VISHWAMUKHA — all game logic
   ------------------------------------------------------------
   One file, 13 labelled sections. Search for "SECTION" to jump
   around. Everything uses plain objects, arrays and functions.
   ============================================================ */


/* ============================================================
   SECTION 1 — CONFIGURATION
   ------------------------------------------------------------
   All the "tuning numbers" live here. Change a number, reload
   the page, and the whole game reacts. Nothing else to hunt for.
   ============================================================ */

const CONFIG = {
  width: 960,            // internal canvas width in pixels
  height: 540,           // internal canvas height in pixels
  groundY: 470,          // y position of the arena floor

  gravity: 0.6,          // downward pull applied every frame
  playerSpeed: 4.5,      // horizontal pixels moved per frame
  jumpPower: 13,         // upward speed given at the start of a jump

  playerMaxHealth: 5,    // hearts
  attackCooldown: 24,    // frames to wait between light attacks
  divineCooldown: 36,    // frames to wait between divine shots
  attackDamage: 1,       // damage of one light attack
  divineDamage: 3,       // damage of one divine shot
  divineCost: 30,        // faith needed for one divine shot
  divineSpeed: 9,        // how fast the divine shot flies

  startFaith: 50,        // faith when the game begins
  maxFaith: 100,
  modakFaith: 20,        // faith gained from eating a modak
  hitFaith: 4,           // faith gained when a light attack lands

  wavesPerDay: 5,
  waveBreakFrames: 100,  // pause between waves (~1.7 seconds)
  dayBreakFrames: 170,   // longer pause between days
};

/* The eleven days. Each entry says how many of each enemy appear
   in EVERY wave of that day, how fast enemies move, and whether
   the final wave is the boss (Andhakasura). This array IS the
   difficulty curve. */
const DAYS = [
  { day: 1,  wisps: 2, brutes: 0, dashers: 0, boss: false, speed: 1.00 },
  { day: 2,  wisps: 2, brutes: 1, dashers: 0, boss: false, speed: 1.00 },
  { day: 3,  wisps: 3, brutes: 1, dashers: 0, boss: false, speed: 1.10 },
  { day: 4,  wisps: 2, brutes: 2, dashers: 1, boss: false, speed: 1.10 },
  { day: 5,  wisps: 3, brutes: 2, dashers: 1, boss: false, speed: 1.20 },
  { day: 6,  wisps: 3, brutes: 2, dashers: 2, boss: false, speed: 1.25 },
  { day: 7,  wisps: 4, brutes: 3, dashers: 2, boss: false, speed: 1.30 },
  { day: 8,  wisps: 4, brutes: 3, dashers: 3, boss: false, speed: 1.40 },
  { day: 9,  wisps: 5, brutes: 3, dashers: 3, boss: false, speed: 1.50 },
  { day: 10, wisps: 5, brutes: 4, dashers: 4, boss: false, speed: 1.60 },
  { day: 11, wisps: 2, brutes: 2, dashers: 2, boss: true,  speed: 1.60 },
];

/* The eleven playable characters. IMPORTANT: the array index must
   match the day index — CHARACTERS[0] plays Day 1 (Thark),
   CHARACTERS[10] plays Day 11 (Lord Ganesha).
   Fields used by the drawing code:
   - name: shown in the day banner, the intro popup and the HUD
   - hair: "short" | "medium" | "long" | "ganesha"
           ("ganesha" means: skip the human drawing entirely)
   - gender: "male" | "female" | "divine" (changes outfit shape and
             whether the forehead mark is a tilak or a bindi)
   - outfitColor: main color of the clothes
   - region: the guardian's region, shown in the intro popup
   - accentColor: OPTIONAL second color (Swapna's red sash) */
const CHARACTERS = [
  { name: "Thark",     hair: "medium",  gender: "male",   outfitColor: "#FF2400", region: "Guardian of the Dawn Gate" },
  { name: "Pardhu",    hair: "short",   gender: "male",   outfitColor: "#1560BD", region: "Guardian of the Green Fields" },
  { name: "Gambheera", hair: "long",    gender: "male",   outfitColor: "#F0E0C0", region: "Guardian of the Mountain Pass" },
  { name: "Sarkar",    hair: "long",    gender: "male",   outfitColor: "#FFFFFF", region: "Guardian of the White City" },
  { name: "Arya",      hair: "medium",  gender: "male",   outfitColor: "#FFDF00", region: "Guardian of the Golden Temple" },
  { name: "Bhumi",     hair: "long",    gender: "female", outfitColor: "#FFC0CB", region: "Guardian of the Sacred Grove" },
  { name: "Swapna",    hair: "long",    gender: "female", outfitColor: "#FFA500", region: "Guardian of the Festival Shore", accentColor: "#D64545" },
  { name: "Kanmani",   hair: "long",    gender: "female", outfitColor: "#FFDAB9", region: "Guardian of the Lamp District" },
  { name: "Mrudhula",  hair: "long",    gender: "female", outfitColor: "#D3D3D3", region: "Guardian of the Silver Lake" },
  { name: "Geeta",     hair: "long",    gender: "female", outfitColor: "#3B8C8C", region: "Guardian of the Final Gate" },
  { name: "Lord Ganesha", hair: "ganesha", gender: "divine", outfitColor: "#E8862E" },
];

/* getCurrentCharacter()
   WHAT: returns the character entry that belongs to the current day.
   RECEIVES: nothing (it reads the global dayIndex, which is 0..10).
   CHANGES: nothing — it only looks data up and returns it.
   WHY: it is the single "who is playing right now?" answer used by
        the drawing code, the day banner, the intro popup and the HUD. */
function getCurrentCharacter() {
  return CHARACTERS[dayIndex];
}

/* The eleven backgrounds. IMPORTANT: the index matches the day index,
   exactly like CHARACTERS — BACKGROUNDS[0] is Day 1's scenery and
   BACKGROUNDS[10] is Lord Ganesha's.
   Each theme is plain data that drawBackground() reads:
   - sky / sun / sunRing : colors of the sky and the sun (or moon)
   - far                 : color of birds and thin scenery lines
   - prop                : WHICH scenery set to draw (a text switch)
   - ground/groundTop/dots : the arena floor colors
   - flower/flowerCore   : the marigold/petal colors on the floor edge
   - hud / hudName       : HUD text colors (dark skies need light text!) */
const BACKGROUNDS = [
  { // Day 1 — Thark, the Dawn Gate
    sky: "#FFE3B3", sun: "#FF9E4A", sunRing: "#F5813C", far: "#C77B3F",
    prop: "gate",
    ground: "#9C5A32", groundTop: "#7A4224", dots: "#8A4E2A",
    flower: "#FF8C42", flowerCore: "#C0392B",
    hud: "#6E4426", hudName: "#8E3B2F",
  },
  { // Day 2 — Pardhu, the Green Fields
    sky: "#EAF6DC", sun: "#F7C948", sunRing: "#E8AE4A", far: "#5E7C3A",
    prop: "fields",
    ground: "#8A6B3A", groundTop: "#6E5430", dots: "#7A5E34",
    flower: "#F2B134", flowerCore: "#D64545",
    hud: "#5E7C3A", hudName: "#3E5C26",
  },
  { // Day 3 — Gambheera, the Mountain Pass
    sky: "#DDE9F2", sun: "#F2B134", sunRing: "#E09B2D", far: "#7A8CA0",
    prop: "mountains",
    ground: "#6E5A48", groundTop: "#57463A", dots: "#5F4E40",
    flower: "#E8B23A", flowerCore: "#B4531F",
    hud: "#4E5E70", hudName: "#37475A",
  },
  { // Day 4 — Sarkar, the White City
    sky: "#FDFBF2", sun: "#F7C948", sunRing: "#E8AE4A", far: "#C9C2B0",
    prop: "city",
    ground: "#C2A97E", groundTop: "#A08A62", dots: "#AE9670",
    flower: "#E8862E", flowerCore: "#B4531F",
    hud: "#6E6552", hudName: "#8E5A2F",
  },
  { // Day 5 — Arya, the Golden Temple
    sky: "#FFF0C4", sun: "#F2B134", sunRing: "#DD9A22", far: "#C9973B",
    prop: "goldentemple",
    ground: "#A8792F", groundTop: "#8A6224", dots: "#96702A",
    flower: "#FFDF00", flowerCore: "#D69E18",
    hud: "#8A6224", hudName: "#A85A10",
  },
  { // Day 6 — Bhumi, the Sacred Grove
    sky: "#E6F4DF", sun: "#F7C948", sunRing: "#E8AE4A", far: "#3E7C4F",
    prop: "grove",
    ground: "#5E8C4A", groundTop: "#49703A", dots: "#537A42",
    flower: "#F6D7A8", flowerCore: "#E8862E",
    hud: "#3E6E3A", hudName: "#2E5C2A",
  },
  { // Day 7 — Swapna, the Festival Shore
    sky: "#FFD1A3", sun: "#FF7E4A", sunRing: "#F0612E", far: "#B96A4A",
    prop: "shore",
    ground: "#DDB878", groundTop: "#BA9455", dots: "#C7A05F",
    flower: "#F6E7CE", flowerCore: "#E8862E",
    hud: "#8A5230", hudName: "#A8402A",
  },
  { // Day 8 — Kanmani, the Lamp District (the evening level!)
    sky: "#463A5C", sun: "#F6EFD9", sunRing: "#D9CFAF", far: "#6E5A8C",
    prop: "lamps",
    ground: "#4E3E30", groundTop: "#3A2E24", dots: "#443729",
    flower: "#F2B134", flowerCore: "#E8862E",
    hud: "#F6E7CE", hudName: "#F2B134",   // LIGHT text for the dark sky
  },
  { // Day 9 — Mrudhula, the Silver Lake
    sky: "#EDF3F8", sun: "#F6E7CE", sunRing: "#D9CFC0", far: "#9AAFC0",
    prop: "lake",
    ground: "#8C9BA5", groundTop: "#71818C", dots: "#7C8B96",
    flower: "#F6E7CE", flowerCore: "#9AAFC0",
    hud: "#5E6E7C", hudName: "#47586A",
  },
  { // Day 10 — Geeta, the Final Gate
    sky: "#E8C4B0", sun: "#E8543F", sunRing: "#C43A28", far: "#6E3B34",
    prop: "fortgate",
    ground: "#4E3A30", groundTop: "#3A2A22", dots: "#42312A",
    flower: "#E8862E", flowerCore: "#C0392B",
    hud: "#5B3A22", hudName: "#8E3B2F",
  },
  { // Day 11 — Lord Ganesha, the Divine Morning
    sky: "#FFF7E0", sun: "#FFDF70", sunRing: "#F2B134", far: "#D9A93C",
    prop: "divine",
    ground: "#C9973B", groundTop: "#A8791F", dots: "#B98A2E",
    flower: "#FFDF00", flowerCore: "#E8862E",
    hud: "#A8791F", hudName: "#C9720F",
  },
];



/* The three enemy types (plus the boss, Andhakasura, as a special
   fourth). All numbers here are plain data — no logic at all.
   NOTE: the internal type string stays "boss" so no gameplay code
   breaks; all VISIBLE text says Andhakasura. */
const ENEMY_TYPES = {
  wisp:   { hp: 1,  w: 30, h: 30,  speed: 1.2, damage: 1, score: 50,   faith: 8  }, // floats toward you
  brute:  { hp: 4,  w: 46, h: 54,  speed: 0.8, damage: 1, score: 100,  faith: 12 }, // slow tank
  dasher: { hp: 2,  w: 34, h: 38,  speed: 1.6, damage: 1, score: 150,  faith: 10 }, // fast + dashes
  boss:   { hp: 40, w: 92, h: 104, speed: 0.7, damage: 2, score: 2000, faith: 100 }, // Andhakasura
};


/* ============================================================
   SECTION 2 — CANVAS SETUP
   ------------------------------------------------------------
   Grab the canvas from the HTML and its 2D drawing tool ("ctx").
   Every drawing function uses ctx. That is all this section does.
   ============================================================ */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


/* ============================================================
   SECTION 3 — GAME VARIABLES
   ------------------------------------------------------------
   The "state" of one run of the game.
   ============================================================ */

let gameState = "menu";  // "menu" | "intro" | "playing" | "paused" | "gameover" | "victory"

let player = null;       // the player object (created by createPlayer)

let enemies = [];        // all enemies currently alive
let divineShots = [];    // golden shots fired by the player
let enemyShots = [];     // dark orbs fired by Andhakasura
let modaks = [];         // collectible sweets in the arena
let slashEffects = [];   // visual arcs shown when you swing
let sparkles = [];       // visual rings shown when you grab a modak

let score = 0;
let faith = CONFIG.startFaith;

let dayIndex = 0;        // which entry of DAYS we are on (0..10)
let waveNumber = 1;      // which wave of the day (1..5)
let waveActive = true;   // true while enemies of the wave are alive
let waveDelayTimer = 0;  // frames left before the next wave spawns

let bannerMessage = "";  // big center text ("Day 2 begins!")
let bannerTimer = 0;     // frames left before the banner fades

let pendingDayMessage = ""; // the message the intro popup is waiting to show

let frameCount = 0;      // counts drawn frames; used for animations


/* ============================================================
   SECTION 4 — INPUT HANDLING
   ------------------------------------------------------------
   Movement keys are HELD (stored as true/false in `keys`).
   Action keys are EVENTS (they call a function once per press).
   ============================================================ */

const keys = { left: false, right: false };

/* handleKeyDown()
   WHAT: reads a keyboard press and reacts to it.
   RECEIVES: the browser's keyboard event.
   CHANGES: keys.left / keys.right, or triggers jump/attack/shot/pause.
   WHY: this is the only way the player can talk to the game. */
function handleKeyDown(event) {
  const key = event.key;

  // stop the page from scrolling when using arrows or space
  const blocked = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "];
  if (blocked.includes(key)) event.preventDefault();

  if (key === "ArrowLeft"  || key === "a" || key === "A") keys.left = true;
  if (key === "ArrowRight" || key === "d" || key === "D") keys.right = true;
  if (key === "ArrowUp" || key === "w" || key === "W" || key === " ") tryJump();
  if (key === "j" || key === "J" || key === "z" || key === "Z") tryLightAttack();
  if (key === "k" || key === "K" || key === "x" || key === "X") tryDivineShot();
  if (key === "p" || key === "P") togglePause();
}

/* handleKeyUp()
   WHAT: releases a held key.
   RECEIVES: the keyboard event.
   CHANGES: keys.left / keys.right back to false.
   WHY: without this the player would keep walking forever. */
function handleKeyUp(event) {
  const key = event.key;
  if (key === "ArrowLeft"  || key === "a" || key === "A") keys.left = false;
  if (key === "ArrowRight" || key === "d" || key === "D") keys.right = false;
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);


/* ============================================================
   SECTION 5 — PLAYER MOVEMENT
   ============================================================ */

/* createPlayer()
   WHAT: builds a fresh player object in the middle of the arena.
   RECEIVES: nothing.
   CHANGES: returns the object that becomes the global `player`.
   WHY: keeping creation in one function makes restarting trivial —
        just call it again and you have a brand new player. */
function createPlayer() {
  return {
    x: CONFIG.width / 2 - 17,   // roughly centered
    y: CONFIG.groundY - 52,     // standing on the floor
    w: 34,
    h: 52,
    vy: 0,                      // vertical speed (gravity acts on this)
    facing: 1,                  // 1 = right, -1 = left (attacks go this way)
    onGround: true,
    health: CONFIG.playerMaxHealth,
    attackCooldown: 0,          // frames left before next swing
    divineCooldown: 0,          // frames left before next shot
    hurtTimer: 0,               // invincibility frames after being hit
  };
}

/* updatePlayer()
   WHAT: moves the player, applies gravity, keeps him inside the
         arena, and counts down his cooldown timers.
   RECEIVES: nothing (reads global `player` and `keys`).
   CHANGES: player.x, player.y, player.vy, player.onGround, timers.
   WHY: called once per frame, it is the heartbeat of player control. */
function updatePlayer() {
  // horizontal movement
  if (keys.left)  { player.x -= CONFIG.playerSpeed; player.facing = -1; }
  if (keys.right) { player.x += CONFIG.playerSpeed; player.facing = 1; }

  // keep the player inside the arena walls
  player.x = Math.max(20, Math.min(CONFIG.width - 20 - player.w, player.x));

  // gravity: pull down, then land on the floor
  player.vy += CONFIG.gravity;
  player.y += player.vy;

  if (player.y + player.h >= CONFIG.groundY) {
    player.y = CONFIG.groundY - player.h; // clamp to floor level
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // timers tick down every frame
  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.divineCooldown > 0) player.divineCooldown--;
  if (player.hurtTimer > 0) player.hurtTimer--;
}

/* tryJump()
   WHAT: makes the player jump, but only if he is standing on ground.
   RECEIVES: nothing.
   CHANGES: player.vy (negative = upward).
   WHY: the onGround check prevents flying by mashing jump in mid-air. */
function tryJump() {
  if (gameState !== "playing") return;
  if (player.onGround) {
    player.vy = -CONFIG.jumpPower;
    player.onGround = false;
  }
}


/* ============================================================
   SECTION 6 — ENEMY MOVEMENT
   ------------------------------------------------------------
   One update function picks the right "move" function per type.
   Every enemy walks/floats TOWARD the player — simple and readable.
   ============================================================ */

/* updateEnemies()
   WHAT: moves every living enemy and counts down its flash timer.
   RECEIVES: nothing (reads global `enemies` and `player`).
   CHANGES: each enemy's x, y, facing, hurtFlash (and timers).
   WHY: one loop keeps all enemies chasing the player each frame. */
function updateEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];

    if (e.hurtFlash > 0) e.hurtFlash--;

    // face the player: 1 if the player is to the right, -1 if left
    const playerCenter = player.x + player.w / 2;
    e.facing = (playerCenter > e.x + e.w / 2) ? 1 : -1;

    if (e.type === "wisp")        moveWisp(e);
    else if (e.type === "brute")  moveBrute(e);
    else if (e.type === "dasher") moveDasher(e);
    else if (e.type === "boss")   moveBoss(e);
  }
}

/* moveWisp(e)
   WHAT: the flying ghost drifts toward the player in BOTH
         directions, so it can chase you into the air.
   RECEIVES: one enemy object `e`.
   CHANGES: e.x and e.y.
   WHY: gives the wisp its "floaty stalker" personality.
   Note: Math.sign(x) returns -1, 0 or 1 — it gives us the
         DIRECTION to move without changing the SPEED. */
function moveWisp(e) {
  const eCX = e.x + e.w / 2, eCY = e.y + e.h / 2;
  const pCX = player.x + player.w / 2, pCY = player.y + player.h / 2;

  // small dead-zone (4px) so the wisp doesn't jitter when it arrives
  if (Math.abs(pCX - eCX) > 4) e.x += Math.sign(pCX - eCX) * e.speed;
  if (Math.abs(pCY - eCY) > 4) e.y += Math.sign(pCY - eCY) * e.speed * 0.6;

  // stay below the sky and above the floor
  if (e.y < 40) e.y = 40;
  if (e.y > CONFIG.groundY - e.h) e.y = CONFIG.groundY - e.h;
}

/* moveBrute(e)
   WHAT: the heavy tank simply walks along the floor toward you.
   RECEIVES: one enemy object `e`.
   CHANGES: e.x (and snaps e.y to the floor).
   WHY: slow-but-steady pressure forces the player to keep moving. */
function moveBrute(e) {
  const eCX = e.x + e.w / 2;
  const pCX = player.x + player.w / 2;
  if (Math.abs(pCX - eCX) > 4) e.x += Math.sign(pCX - eCX) * e.speed;
  e.y = CONFIG.groundY - e.h; // walkers never leave the floor
}

/* moveDasher(e)
   WHAT: walks like the brute, but every ~2 seconds it DASHES
         (moves 2.8x faster for 22 frames).
   RECEIVES: one enemy object `e`.
   CHANGES: e.x, e.dashTimer, e.dashFrames.
   WHY: the sudden speed burst is the dasher's whole identity. */
function moveDasher(e) {
  e.dashTimer--;
  if (e.dashTimer <= 0) {
    e.dashFrames = 22;       // dash lasts 22 frames...
    e.dashTimer = 130;       // ...then waits ~2 seconds again
  }

  let speed = e.speed;
  if (e.dashFrames > 0) {
    e.dashFrames--;
    speed = e.speed * 2.8;   // the dash!
  }

  const eCX = e.x + e.w / 2;
  const pCX = player.x + player.w / 2;
  if (Math.abs(pCX - eCX) > 4) e.x += Math.sign(pCX - eCX) * speed;
  e.y = CONFIG.groundY - e.h;
}

/* moveBoss(e)
   WHAT: Andhakasura walks toward the player like a brute, and every
         ~2.3 seconds fires a dark orb aimed straight at the player.
   RECEIVES: one enemy object `e` (the boss).
   CHANGES: e.x, e.shootTimer, and pushes into `enemyShots`.
   WHY: the aimed shots are what make the Andhakasura fight real. */
function moveBoss(e) {
  // walk toward the player
  const eCX = e.x + e.w / 2;
  const pCX = player.x + player.w / 2;
  if (Math.abs(pCX - eCX) > 4) e.x += Math.sign(pCX - eCX) * e.speed;
  e.y = CONFIG.groundY - e.h;

  // firing timer
  e.shootTimer--;
  if (e.shootTimer <= 0) {
    e.shootTimer = 140;

    // direction from the boss to the player, using Pythagoras:
    // the distance formula gives us a straight aiming line.
    const cx = e.x + e.w / 2, cy = e.y + 40;
    const dx = (player.x + player.w / 2) - cx;
    const dy = (player.y + player.h / 2) - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1; // || 1 avoids dividing by 0

    enemyShots.push({
      x: cx - 8, y: cy - 8, w: 16, h: 16,
      vx: (dx / dist) * 3,   // speed 3 split into x and y parts
      vy: (dy / dist) * 3,
    });
  }
}


/* ============================================================
   SECTION 7 — ATTACKS
   ------------------------------------------------------------
   Player attacks (light swing + divine shot), damage/death for
   enemies, and the timers of all flying objects and visual effects.
   ============================================================ */

/* tryLightAttack()
   WHAT: swings in front of the player and instantly damages every
         enemy inside the swing box. Also spawns a golden arc visual.
   RECEIVES: nothing.
   CHANGES: player.attackCooldown, slashEffects, enemy hp (via
            damageEnemy), and faith if at least one hit lands.
   WHY: the cooldown stops spamming, and the instant hit-check keeps
        the code simple (no moving hitbox object to track). */
function tryLightAttack() {
  if (gameState !== "playing") return;
  if (player.attackCooldown > 0) return;
  player.attackCooldown = CONFIG.attackCooldown;

  // the swing box sits in FRONT of the player, based on facing
  const box = {
    x: (player.facing === 1) ? player.x + player.w - 6 : player.x - 44 + 6,
    y: player.y - 8,
    w: 50,
    h: player.h + 10,
  };

  // purely visual golden arc, fades over 10 frames
  slashEffects.push({
    x: player.x + player.w / 2,
    y: player.y + player.h / 2,
    facing: player.facing,
    life: 10,
  });

  // loop BACKWARDS because damageEnemy may remove enemies from the array
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (rectanglesOverlap(box, enemies[i])) {
      damageEnemy(i, CONFIG.attackDamage);
      faith = Math.min(CONFIG.maxFaith, faith + CONFIG.hitFaith);
    }
  }
}

/* tryDivineShot()
   WHAT: fires a golden projectile horizontally — but it costs faith.
   RECEIVES: nothing.
   CHANGES: `faith`, player.divineCooldown, pushes into `divineShots`.
   WHY: this is what the faith meter is FOR: a strong ranged attack
        you have to earn by collecting modaks and landing hits. */
function tryDivineShot() {
  if (gameState !== "playing") return;
  if (player.divineCooldown > 0) return;
  if (faith < CONFIG.divineCost) {
    showBanner("Not enough faith!", 40);
    return;
  }

  faith -= CONFIG.divineCost;
  player.divineCooldown = CONFIG.divineCooldown;

  divineShots.push({
    x: (player.facing === 1) ? player.x + player.w : player.x - 26,
    y: player.y + player.h / 2 - 6,
    w: 26, h: 12,
    vx: CONFIG.divineSpeed * player.facing, // negative = flies left
  });
}

/* damageEnemy(index, amount)
   WHAT: subtracts hp from one enemy; kills it if hp reaches 0.
   RECEIVES: the enemy's index in the array, and the damage amount.
   CHANGES: that enemy's hp and hurtFlash; may remove it (killEnemy).
   WHY: one shared function = one place where damage rules live. */
function damageEnemy(index, amount) {
  const e = enemies[index];
  e.hp -= amount;
  e.hurtFlash = 8; // 8 frames of white flash so hits FEEL real
  if (e.hp <= 0) killEnemy(index);
}

/* killEnemy(index)
   WHAT: pays out score + faith for the kill, maybe drops a modak,
         and removes the enemy from the array.
   RECEIVES: the enemy's index.
   CHANGES: score, faith, modaks, enemies (spliced out).
   WHY: rewards are defined in exactly one place. */
function killEnemy(index) {
  const e = enemies[index];
  score += e.score;
  faith = Math.min(CONFIG.maxFaith, faith + e.faith);

  // 45% chance to drop a modak where the enemy died
  if (Math.random() < 0.45) {
    spawnModakAt(e.x + e.w / 2 - 11, Math.min(e.y, CONFIG.groundY - 26));
  }

  enemies.splice(index, 1); // remove from the array

  if (e.type === "boss") showBanner("ANDHAKASURA'S DARKNESS DISSOLVES INTO LIGHT!", 150);
}

/* updateProjectiles()
   WHAT: moves every divine shot and enemy orb, and deletes any
         that leave the screen. Also fades slash/sparkle visuals.
   RECEIVES: nothing.
   CHANGES: positions of shots; shortens effect arrays.
   WHY: things in flight need to move every frame, and arrays that
        are never cleaned would grow forever. */
function updateProjectiles() {
  // divine shots fly straight sideways
  for (let i = divineShots.length - 1; i >= 0; i--) {
    const s = divineShots[i];
    s.x += s.vx;
    if (s.x < -40 || s.x > CONFIG.width + 40) divineShots.splice(i, 1);
  }

  // enemy orbs fly diagonally
  for (let i = enemyShots.length - 1; i >= 0; i--) {
    const s = enemyShots[i];
    s.x += s.vx;
    s.y += s.vy;
    if (s.x < -60 || s.x > CONFIG.width + 60 ||
        s.y < -60 || s.y > CONFIG.height + 60) {
      enemyShots.splice(i, 1);
    }
  }

  updateEffects();
}

/* updateEffects()
   WHAT: counts down the life of slash arcs and modak sparkles and
         removes them when they reach zero.
   RECEIVES: nothing.
   CHANGES: slashEffects and sparkles arrays.
   WHY: visual effects must disappear or they would draw forever. */
function updateEffects() {
  for (let i = slashEffects.length - 1; i >= 0; i--) {
    slashEffects[i].life--;
    if (slashEffects[i].life <= 0) slashEffects.splice(i, 1);
  }
  for (let i = sparkles.length - 1; i >= 0; i--) {
    sparkles[i].life--;
    if (sparkles[i].life <= 0) sparkles.splice(i, 1);
  }
}


/* ============================================================
   SECTION 8 — COLLISION DETECTION
   ------------------------------------------------------------
   Every collision in the game is "do two rectangles overlap?".
   Player, enemies, shots and modaks all carry x, y, w, h,
   so ONE helper covers every case.
   ============================================================ */

/* rectanglesOverlap(a, b)
   WHAT: returns true if two rectangles (objects with x,y,w,h)
         overlap each other.
   RECEIVES: two rectangle objects.
   CHANGES: nothing — it only asks a question.
   WHY: this single function powers attacks, projectiles, contact
        damage and modak pickup. The four conditions are the standard
        overlap check: if none of the four sides separate the
        rectangles, they must be overlapping. */
function rectanglesOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

/* checkCollisions()
   WHAT: checks the four collision types of the game:
         1) divine shots hitting enemies
         2) enemies touching the player
         3) enemy orbs hitting the player
         4) the player touching modaks
   RECEIVES: nothing.
   CHANGES: removes shots/modaks, damages enemies, hurts the player,
            and can change gameState (game over).
   WHY: running all checks in one function, once per frame, keeps the
        rules ordered and easy to talk through. */
function checkCollisions() {

  // 1) divine shots vs enemies
  for (let s = divineShots.length - 1; s >= 0; s--) {
    for (let e = enemies.length - 1; e >= 0; e--) {
      if (rectanglesOverlap(divineShots[s], enemies[e])) {
        damageEnemy(e, CONFIG.divineDamage);
        divineShots.splice(s, 1); // the shot is used up
        break;                    // move on to the next shot
      }
    }
  }

  // 2) enemies touching the player (only if not invincible)
  if (player.hurtTimer <= 0) {
    for (let i = 0; i < enemies.length; i++) {
      if (rectanglesOverlap(enemies[i], player)) {
        hurtPlayer(enemies[i].damage, enemies[i].x);
        break;
      }
    }
  }

   // 3) enemy orbs vs player.
  // Day 11 special rule: Ganesha is never harmed. Andhakasura's
  // darkness dissolves into light on contact and drains FAITH
  // instead of hearts — the divine is untouchable in body.
  if (player.hurtTimer <= 0) {
    for (let i = enemyShots.length - 1; i >= 0; i--) {
      if (rectanglesOverlap(enemyShots[i], player)) {
        const shotX = enemyShots[i].x, shotY = enemyShots[i].y;
        enemyShots.splice(i, 1);
        if (getCurrentCharacter().hair === "ganesha") {
          faith = Math.max(0, faith - 10);
          sparkles.push({ x: shotX + 8, y: shotY + 8, life: 15 });
        } else {
          hurtPlayer(1, shotX);
        }
      }
    }
  }

  // 4) modak pickup: score, faith, and heal one heart
  for (let i = modaks.length - 1; i >= 0; i--) {
    if (rectanglesOverlap(modaks[i], player)) {
      const mx = modaks[i].x + 11, my = modaks[i].y + 11;
      modaks.splice(i, 1);

      score += 25;
      faith = Math.min(CONFIG.maxFaith, faith + CONFIG.modakFaith);
      player.health = Math.min(CONFIG.playerMaxHealth, player.health + 1);
      sparkles.push({ x: mx, y: my, life: 15 });
    }
  }
}

/* hurtPlayer(damage, sourceX)
   WHAT: damages the player, knocks him away from the hit, grants
         short invincibility, shakes some faith loose, and can end
         the game if hearts run out.
   RECEIVES: how much health to remove, and the x position of the
             attacker (to know which way to knock the player).
   CHANGES: player.health / hurtTimer / vy / x, faith, and possibly
            gameState + the game-over overlay.
   WHY: the invincibility timer (hurtTimer = 80) stops one touch from
        draining all hearts in a single frame. */
function hurtPlayer(damage, sourceX) {
  player.health -= damage;
  player.hurtTimer = 80;                                  // ~1.3s invincible
  player.vy = -7;                                         // small hop
  player.x += (player.x < sourceX) ? -16 : 16;            // knockback away
  faith = Math.max(0, faith - 10);                        // pain shakes faith

   if (player.health <= 0) {
    player.health = 0;
    document.getElementById("gameoverScore").textContent = score;
    document.getElementById("gameoverDay").textContent = DAYS[dayIndex].day;
    // NEW: the button now names the day being retried
    document.getElementById("retryButton").textContent =
      "Retry Day " + DAYS[dayIndex].day;
    setGameState("gameover");
  }
}


/* ============================================================
   SECTION 9 — WAVE MANAGEMENT
   ------------------------------------------------------------
   A "wave" = spawn a group of enemies, and the wave is over when
   enemies.length reaches 0. Between waves there is a short break
   counted down by waveDelayTimer.
   ============================================================ */

/* showBanner(text, frames)
   WHAT: shows a big center message for a number of frames.
   RECEIVES: the text, and how long it should last.
   CHANGES: bannerMessage and bannerTimer.
   WHY: one tiny function every part of the game can use to talk
        to the player ("Wave 2!", "Not enough faith!"). */
function showBanner(text, frames) {
  bannerMessage = text;
  bannerTimer = frames;
}

/* updateBanner()
   WHAT: counts the banner timer down by one each frame.
   RECEIVES: nothing.  CHANGES: bannerTimer.
   WHY: timers must tick even when nothing else is happening. */
function updateBanner() {
  if (bannerTimer > 0) bannerTimer--;
}

/* startWave()
   WHAT: spawns the enemies for the current day + wave number.
         On day 11, wave 5 it spawns ONLY the boss (Andhakasura).
   RECEIVES: nothing (reads dayIndex and waveNumber).
   CHANGES: waveActive becomes true; fills the `enemies` array;
            may drop 2 modaks and show a banner.
   WHY: separating "what spawns" from "when it spawns" makes the
        difficulty trivial to read: it's all in the DAYS array. */
function startWave() {
  waveActive = true;
  const dayConfig = DAYS[dayIndex];

  if (dayConfig.boss && waveNumber === CONFIG.wavesPerDay) {
    spawnEnemy("boss");
    showBanner("ANDHAKASURA AWAKENS!", 120);
  } else {
    for (let i = 0; i < dayConfig.wisps;   i++) spawnEnemy("wisp");
    for (let i = 0; i < dayConfig.brutes;  i++) spawnEnemy("brute");
    for (let i = 0; i < dayConfig.dashers; i++) spawnEnemy("dasher");

    spawnModak(); // two fresh modaks appear every wave
    spawnModak();
  }
}

/* spawnEnemy(type)
   WHAT: builds one enemy object from the ENEMY_TYPES data and puts
         it just outside the arena (it then walks/floats in).
   RECEIVES: the enemy type as text: "wisp", "brute", "dasher", "boss".
   CHANGES: pushes one object into `enemies`.
   WHY: all enemy stats are copied from the data table in one place;
        dayConfig.speed scales difficulty without touching the types. */
function spawnEnemy(type) {
  const stats = ENEMY_TYPES[type];
  const dayConfig = DAYS[dayIndex];

  // Andhakasura always enters from the right; others pick a random side
  const fromLeft = (type === "boss") ? false : Math.random() < 0.5;

  const e = {
    type: type,
    w: stats.w, h: stats.h,
    hp: stats.hp, maxHp: stats.hp,
    speed: stats.speed * dayConfig.speed, // days make everyone faster
    damage: stats.damage,
    score: stats.score,
    faith: stats.faith,
    facing: 1,
    hurtFlash: 0,
    x: fromLeft ? -stats.w - 10 : CONFIG.width + 10,
    y: 0,
    dashTimer: 90,    // used by dasher
    dashFrames: 0,    // used by dasher
    shootTimer: 130,  // used by boss
  };

  // flying enemies appear somewhere in the air; walkers on the floor
  if (type === "wisp") e.y = 100 + Math.random() * 180;
  else e.y = CONFIG.groundY - stats.h;

  enemies.push(e);
}

/* spawnModak()
   WHAT: places one modak at a random spot — either on the floor or
         in the air (so jumping matters).
   RECEIVES: nothing.  CHANGES: pushes into `modaks`.
   WHY: random placement keeps every wave feeling slightly different. */
function spawnModak() {
  const onGround = Math.random() < 0.5;
  modaks.push({
    x: 60 + Math.random() * (CONFIG.width - 140),
    y: onGround ? CONFIG.groundY - 26 : 300 + Math.random() * 90,
    w: 22, h: 22,
  });
}

/* spawnModakAt(x, y)
   WHAT: places a modak at an exact position (used for enemy drops).
   RECEIVES: x and y coordinates.
   CHANGES: pushes into `modaks`.
   WHY: killEnemy needs a modak to appear where the enemy died,
        not at a random place. */
function spawnModakAt(x, y) {
  modaks.push({
    x: Math.max(20, Math.min(CONFIG.width - 45, x)),
    y: y,
    w: 22, h: 22,
  });
}

/* updateWaveState()
   WHAT: the traffic controller of progression. It (a) counts down
         the break before the next wave, and (b) detects when a wave
         is cleared and decides what happens next: next wave, next
         day, or victory.
   RECEIVES: nothing.
   CHANGES: waveDelayTimer, waveNumber, and via startDay/victory it
            can change the entire game state.
   WHY: "enemies.length === 0" is the single simple condition that
        drives ALL progression in the game. */
function updateWaveState() {

  // (a) waiting before the next wave — tick down, then spawn
  if (waveDelayTimer > 0) {
    waveDelayTimer--;
    if (waveDelayTimer === 0) startWave();
    return; // nothing else to check while waiting
  }

  // (b) wave cleared?  (waveActive stops this firing before wave 1)
  if (waveActive && enemies.length === 0) {
    waveActive = false;

    if (waveNumber < CONFIG.wavesPerDay) {
      // more waves left today
      waveNumber++;
      waveDelayTimer = CONFIG.waveBreakFrames;
      showBanner("Wave " + waveNumber + " — get ready!", CONFIG.waveBreakFrames);
    } else if (dayIndex < DAYS.length - 1) {
      // day finished — move to the next day
      startDay(dayIndex + 1);
    } else {
      // last day, last wave, boss dead: VICTORY
      document.getElementById("victoryScore").textContent = score;
      setGameState("victory");
    }
  }
}


/* ============================================================
   SECTION 10 — DAY PROGRESSION
   ============================================================ */

/* startGame()
   WHAT: full reset — score, faith, player, all arrays — then starts
         day 1 (which opens the Thark intro popup).
   RECEIVES: nothing.
   CHANGES: basically everything; that's the point.
   WHY: used by the start button AND every restart button, so there
        is exactly one way the game begins. Note: it does NOT call
        setGameState("playing") — startDay(0) opens the popup, and
        beginDay() starts the gameplay when PLAY! is pressed. */
function startGame() {
  score = 0;
  faith = CONFIG.startFaith;
  enemies = [];
  divineShots = [];
  enemyShots = [];
  modaks = [];
  slashEffects = [];
  sparkles = [];
  player = createPlayer();
  startDay(0); // dayIndex 0 = Day 1 = Thark — opens the intro popup
}

/* retryDay()
   WHAT: gives the player another attempt at the CURRENT day —
         the level they just lost on. Score is KEPT (this is the
         arcade "continue" idea), but faith and hearts are refilled
         and the arena is cleared.
   RECEIVES: nothing (reads the global dayIndex).
   CHANGES: faith, all game arrays, player (fresh), and via
            startDay(dayIndex, true) it opens the same day's
            intro popup again.
   WHY: losing on Day 4 and being sent back to Day 1 feels unfair
        and makes the game exhausting to replay. Retrying the same
        level keeps the challenge and the fun. */

function retryDay() {
  faith = CONFIG.startFaith;
  enemies = [];
  divineShots = [];
  enemyShots = [];
  modaks = [];
  slashEffects = [];
  sparkles = [];
  player = createPlayer();
  startDay(dayIndex, true); // SAME day — no bonus, no heal
}

/* startDay(index, retrying)
   WHAT: starts a new day and sets up the intro popup for the
         guardian that is entering the arena. It also handles the
         score bonus awarded for clearing the previous day.
   RECEIVES: the day index to open, and whether this is a retry of
             the same day.
   CHANGES: dayIndex, waveNumber, modaks, pendingDayMessage,
            and the visible overlay state.
   WHY: each day has a story intro screen before play begins, and
        the game loop expects this single entry point for all day
        transitions. */

  function startDay(index = 0, retrying = false) {
  dayIndex = index;
  waveNumber = 1;
  waveActive = false;
  modaks = [];

  const character = getCurrentCharacter();

  if (index === DAYS.length - 1) {
    pendingDayMessage = "Lord Ganesha arrives — Vighnaharta!";
  } else if (index === 0) {
    pendingDayMessage = "Day 1 — " + character.name + " enters the battle!";
  } else if (!retrying) {
    const bonus = DAYS[index - 1].day * 100;
    score += bonus;
    player.health = Math.min(CONFIG.playerMaxHealth, player.health + 1);
    pendingDayMessage = "Day " + DAYS[index].day + " — " + character.name +
      " enters the battle! (+" + bonus + ")";
  } else {
    pendingDayMessage = "Day " + DAYS[index].day + " — " + character.name +
      " tries again!";
  }

  showIntroPopup();
  setGameState("intro");
}

/* showIntroPopup()
   WHAT: fills the intro popup's name and story text with the
         current character's data, ready to be shown.
   RECEIVES: nothing (reads CHARACTERS via getCurrentCharacter).
   CHANGES: the text of two HTML elements (introCharacterName,
            introStory).
   WHY: one function keeps the HTML filling in one place, so the
        popup always matches the character drawn on the canvas. */
function showIntroPopup() {
  const c = getCurrentCharacter();
  document.getElementById("introCharacterName").textContent =
    c.name.toUpperCase();

  if (c.region) {
    document.getElementById("introStory").textContent =
      c.region + ". Each victory weakens one part of Andhakasura's shadow army.";
  } else {
    // Day 11 — Lord Ganesha has no region; he has a different role
    document.getElementById("introStory").textContent =
      "The ten guardians have prepared the world. The Vighnaharta has come to purify the Final Darkness Core.";
  }
}

/* beginDay()
   WHAT: called when the player presses PLAY! on the intro popup.
         Unfreezes the game and starts the first wave of the day.
   RECEIVES: nothing (reads pendingDayMessage).
   CHANGES: gameState (back to "playing"), waveDelayTimer, and it
            shows the day banner on the canvas.
   WHY: the popup and the gameplay are connected by exactly one
        small function — easy to find, easy to explain. */
function beginDay() {
  setGameState("playing");
  waveDelayTimer = CONFIG.waveBreakFrames; // short breath before wave 1
  showBanner(pendingDayMessage, CONFIG.dayBreakFrames);
}


/* ============================================================
   SECTION 11 — DRAWING FUNCTIONS
   ------------------------------------------------------------
   Nothing here changes the game; it only PAINTS the current state.
   ============================================================ */

/* draw()
   WHAT: paints one complete picture of the game, back to front:
         background → modaks → enemies → orbs → player → shots →
         effects → HUD → banner.
   RECEIVES: nothing.
   CHANGES: nothing (drawing should never change game data).
   WHY: the order matters — later things are drawn ON TOP of
        earlier things, so the player appears in front of enemies. */
function draw() {
  drawBackground();
  drawModaks();
  drawEnemies();
  drawEnemyShots();
  drawPlayer();
  drawDivineShots();
  drawSlashEffects();
  drawSparkles();
  drawHUD();
  drawBanner();
}

/* drawBackground()
   WHAT: paints today's scenery. It reads the theme object for the
         current day from BACKGROUNDS[dayIndex] — so the whole arena
         automatically changes with every new guardian, including
         Lord Ganesha's divine morning on Day 11.
   RECEIVES: nothing (reads dayIndex).
   CHANGES: nothing — drawing only.
   WHY: the region each guardian protects becomes visible. The theme
        array controls colors; the `prop` text picks which scenery
        shapes are drawn. No images needed — all shapes. */
function drawBackground() {
  const theme = BACKGROUNDS[dayIndex]; // today's scenery data

  // sky
  ctx.fillStyle = theme.sky;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  // sun (or moon on Day 8) with a simple ring
  ctx.fillStyle = theme.sun;
  ctx.beginPath();
  ctx.arc(790, 96, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = theme.sunRing;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(790, 96, 62, 0, Math.PI * 2);
  ctx.stroke();

  // two birds drifting across the sky
  ctx.strokeStyle = theme.far;
  ctx.lineWidth = 2;
  drawBird((frameCount * 0.4 + 200) % (CONFIG.width + 100) - 50, 90);
  drawBird((frameCount * 0.3 + 700) % (CONFIG.width + 100) - 50, 60);

  // far scenery — the `prop` text picks today's shapes
  if (theme.prop === "gate") {
    drawGateProp(130, 0.9);
    drawGateProp(830, 0.65);
  } else if (theme.prop === "fields") {
    drawHillsProp(180, 1.0);
    drawHillsProp(760, 0.8);
  } else if (theme.prop === "mountains") {
    drawMountainProp(150, 1.0);
    drawMountainProp(820, 0.7);
  } else if (theme.prop === "city") {
    drawCityProp(150, 0.9);
    drawCityProp(820, 0.7);
  } else if (theme.prop === "goldentemple") {
    drawTemple(130, 0.9, "#E8B23A");
    drawTemple(830, 0.65, "#E8B23A");
  } else if (theme.prop === "grove") {
    drawGroveProp(120, 1.0);
    drawGroveProp(300, 0.7);
    drawGroveProp(820, 0.9);
  } else if (theme.prop === "shore") {
    drawShoreBand();
  } else if (theme.prop === "lake") {
    drawLakeBand();
  } else if (theme.prop === "fortgate") {
    drawFortGateProp(480, 1.0);
  } else if (theme.prop === "lamps") {
    // dark rooftops of the lamp district (lamps hang after bunting)
    ctx.fillStyle = "#2E2438";
    ctx.fillRect(60, CONFIG.groundY - 90, 140, 90);
    ctx.fillRect(260, CONFIG.groundY - 70, 110, 70);
    ctx.fillRect(700, CONFIG.groundY - 100, 160, 100);
    // a few lit windows
    ctx.fillStyle = "#F2B134";
    ctx.fillRect(90, CONFIG.groundY - 60, 14, 14);
    ctx.fillRect(130, CONFIG.groundY - 60, 14, 14);
    ctx.fillRect(740, CONFIG.groundY - 60, 14, 14);
  } else if (theme.prop === "divine") {
    drawDivineProp();
    drawTemple(130, 0.9, "#E8C46B");
    drawTemple(830, 0.65, "#E8C46B");
  } else if (theme.prop === "temples") {
    // fallback: the original sandstone temples
    drawTemple(130, 0.9, "#E0B57E");
    drawTemple(830, 0.65, "#E0B57E");
  }

  // festival bunting across the top (every day keeps its festive string)
  drawBunting();

  // the Lamp District hangs glowing diyas FROM the bunting line
  if (theme.prop === "lamps") drawLampsProp();

  // the arena floor
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, CONFIG.groundY, CONFIG.width, CONFIG.height - CONFIG.groundY);
  ctx.fillStyle = theme.groundTop;
  ctx.fillRect(0, CONFIG.groundY, CONFIG.width, 6);

  // floor texture dashes
  ctx.fillStyle = theme.dots;
  for (let i = 0; i < 24; i++) {
    const x = (i * 137 + 40) % CONFIG.width;
    const y = CONFIG.groundY + 18 + (i * 53) % 44;
    ctx.fillRect(x, y, 16, 3);
  }

  // marigold flowers / petals along the floor edge
  for (let i = 0; i < 13; i++) {
    const x = 30 + i * 76;
    ctx.fillStyle = theme.flower;
    ctx.beginPath();
    ctx.arc(x, CONFIG.groundY + 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.flowerCore;
    ctx.beginPath();
    ctx.arc(x, CONFIG.groundY + 16, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* drawTemple(x, scale, color)
   WHAT: draws a stepped temple silhouette — now in ANY color, so
         different days can reuse it (golden temples on Days 5/11).
   RECEIVES: center x, a size multiplier, and the building color. */
function drawTemple(x, scale, color) {
  const baseY = CONFIG.groundY;
  ctx.fillStyle = color;
  ctx.fillRect(x - 60 * scale, baseY - 50 * scale, 120 * scale, 50 * scale);
  ctx.fillRect(x - 40 * scale, baseY - 95 * scale, 80 * scale, 45 * scale);
  ctx.fillRect(x - 24 * scale, baseY - 135 * scale, 48 * scale, 40 * scale);

  ctx.beginPath();
  ctx.moveTo(x - 26 * scale, baseY - 135 * scale);
  ctx.lineTo(x + 26 * scale, baseY - 135 * scale);
  ctx.lineTo(x, baseY - 175 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.fillRect(x - 1.5, baseY - 202 * scale, 3, 27 * scale);
  ctx.fillStyle = "#D96C3B";
  ctx.beginPath();
  ctx.moveTo(x + 1.5, baseY - 200 * scale);
  ctx.lineTo(x + 18 * scale, baseY - 194 * scale);
  ctx.lineTo(x + 1.5, baseY - 188 * scale);
  ctx.closePath();
  ctx.fill();
}

/* ============================================================
   SCENERY PROPS — one small function per region. Each uses only
   basic shapes. drawBackground() picks which ones to call today
   by reading theme.prop.
   ============================================================ */

/* Day 1 — the Dawn Gate: two sandstone pillars and a beam. */
function drawGateProp(x, scale) {
  const baseY = CONFIG.groundY;
  ctx.fillStyle = "#C77B3F";
  ctx.fillRect(x - 46 * scale, baseY - 150 * scale, 26 * scale, 150 * scale);
  ctx.fillRect(x + 20 * scale, baseY - 150 * scale, 26 * scale, 150 * scale);
  ctx.fillRect(x - 56 * scale, baseY - 172 * scale, 112 * scale, 24 * scale);
  ctx.beginPath();
  ctx.arc(x, baseY - 180 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 1.5, baseY - 202 * scale, 3, 24 * scale);
  ctx.fillStyle = "#C0392B";
  ctx.beginPath();
  ctx.moveTo(x + 1.5, baseY - 200 * scale);
  ctx.lineTo(x + 18 * scale, baseY - 194 * scale);
  ctx.lineTo(x + 1.5, baseY - 188 * scale);
  ctx.closePath();
  ctx.fill();
}

/* Day 2 — the Green Fields: rounded hills and little crop lines. */
function drawHillsProp(x, scale) {
  const baseY = CONFIG.groundY;
  ctx.fillStyle = "#94B873";
  ctx.beginPath();
  ctx.arc(x + 60 * scale, baseY + 20, 60 * scale, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#7BA05B";
  ctx.beginPath();
  ctx.arc(x, baseY + 20, 90 * scale, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#5E7C3A";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const px = x - 60 * scale + i * 24 * scale;
    ctx.moveTo(px, baseY - 10);
    ctx.lineTo(px, baseY - 24);
  }
  ctx.stroke();
}

/* Day 3 — the Mountain Pass: grey peaks with zig-zag snow caps. */
function drawMountainProp(x, scale) {
  const baseY = CONFIG.groundY;
  ctx.fillStyle = "#8A9BAC";
  ctx.beginPath();
  ctx.moveTo(x - 90 * scale, baseY);
  ctx.lineTo(x, baseY - 160 * scale);
  ctx.lineTo(x + 90 * scale, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#F4F8FB";
  ctx.beginPath();
  ctx.moveTo(x - 22 * scale, baseY - 118 * scale);
  ctx.lineTo(x, baseY - 160 * scale);
  ctx.lineTo(x + 22 * scale, baseY - 118 * scale);
  ctx.lineTo(x + 10 * scale, baseY - 108 * scale);
  ctx.lineTo(x, baseY - 116 * scale);
  ctx.lineTo(x - 10 * scale, baseY - 108 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#75879A";
  ctx.beginPath();
  ctx.moveTo(x + 30 * scale, baseY);
  ctx.lineTo(x + 85 * scale, baseY - 90 * scale);
  ctx.lineTo(x + 140 * scale, baseY);
  ctx.closePath();
  ctx.fill();
}

/* Day 4 — the White City: a domed white building with lit windows. */
function drawCityProp(x, scale) {
  const baseY = CONFIG.groundY;
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#D9CFC0";
  ctx.lineWidth = 2;
  drawRoundedRect(x - 40 * scale, baseY - 90 * scale, 80 * scale, 90 * scale,
                  6 * scale, true, true);
  ctx.beginPath();
  ctx.arc(x, baseY - 90 * scale, 34 * scale, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(x - 2 * scale, baseY - 136 * scale, 4 * scale, 14 * scale);
  ctx.fillStyle = "#BFD9E8";
  ctx.fillRect(x - 24 * scale, baseY - 70 * scale, 12 * scale, 16 * scale);
  ctx.fillRect(x - 6 * scale,  baseY - 70 * scale, 12 * scale, 16 * scale);
  ctx.fillRect(x + 12 * scale, baseY - 70 * scale, 12 * scale, 16 * scale);
}

/* Day 6 — the Sacred Grove: trees with round canopies. */
function drawGroveProp(x, scale) {
  const baseY = CONFIG.groundY;
  ctx.fillStyle = "#6E4A2C";
  ctx.fillRect(x - 6 * scale, baseY - 70 * scale, 12 * scale, 70 * scale);
  ctx.fillStyle = "#4E8C4A";
  ctx.beginPath();
  ctx.arc(x - 22 * scale, baseY - 78 * scale, 26 * scale, 0, Math.PI * 2);
  ctx.arc(x + 22 * scale, baseY - 78 * scale, 26 * scale, 0, Math.PI * 2);
  ctx.arc(x, baseY - 100 * scale, 30 * scale, 0, Math.PI * 2);
  ctx.fill();
}

/* Day 7 — the Festival Shore: a band of sea, waves and a tiny boat. */
function drawShoreBand() {
  const top = CONFIG.groundY - 70;
  ctx.fillStyle = "#3E8E7E";
  ctx.fillRect(0, top, CONFIG.width, 70);
  ctx.strokeStyle = "#F6E7CE";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const wx = i * 90 + 20;
    const wy = top + 18 + (i % 3) * 16;
    ctx.arc(wx, wy, 14, Math.PI * 1.15, Math.PI * 1.85);
  }
  ctx.stroke();
  ctx.fillStyle = "#F6E7CE";
  ctx.beginPath();
  ctx.moveTo(700, top + 34);
  ctx.lineTo(700, top + 8);
  ctx.lineTo(726, top + 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#6E4426";
  ctx.fillRect(688, top + 34, 46, 5);
}

/* Day 9 — the Silver Lake: water with drifting shimmer and a lotus. */
function drawLakeBand() {
  const top = CONFIG.groundY - 60;
  ctx.fillStyle = "#AFC8D8";
  ctx.fillRect(0, top, CONFIG.width, 60);
  ctx.strokeStyle = "#F6FBFF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const sx = (i * 97 + (frameCount / 3) % 60) % CONFIG.width;
    const sy = top + 12 + (i % 4) * 12;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 18, sy);
  }
  ctx.stroke();
  ctx.fillStyle = "#F6A5C0";
  ctx.beginPath();
  ctx.arc(180, top + 30, 8, Math.PI, 0);
  ctx.arc(196, top + 30, 8, Math.PI, 0);
  ctx.fill();
}

/* Day 10 — the Final Gate: a dark fort wall with an arched gateway. */
function drawFortGateProp(x, scale) {
  const baseY = CONFIG.groundY;
  ctx.fillStyle = "#5E3A2E";
  ctx.fillRect(x - 90 * scale, baseY - 120 * scale, 180 * scale, 120 * scale);
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(x - 90 * scale + i * 32 * scale,
                 baseY - 136 * scale, 18 * scale, 16 * scale);
  }
  ctx.fillStyle = "#2E1C16";
  ctx.beginPath();
  ctx.moveTo(x - 26 * scale, baseY);
  ctx.lineTo(x - 26 * scale, baseY - 55 * scale);
  ctx.arc(x, baseY - 55 * scale, 26 * scale, Math.PI, 0);
  ctx.lineTo(x + 26 * scale, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#8E3B2F";
  ctx.beginPath();
  ctx.moveTo(x - 60 * scale, baseY - 136 * scale);
  ctx.lineTo(x - 44 * scale, baseY - 130 * scale);
  ctx.lineTo(x - 60 * scale, baseY - 124 * scale);
  ctx.closePath();
  ctx.fill();
}

/* Day 8 — hanging oil lamps that glow and gently flicker. */
function drawLampsProp() {
  for (let i = 0; i < 8; i++) {
    const lx = 70 + i * 120;
    const sway = Math.sin(frameCount / 50 + i) * 3;
    ctx.strokeStyle = "#B98A54";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 34);
    ctx.lineTo(lx + sway, 92);
    ctx.stroke();
    ctx.fillStyle = "#C9973B";
    ctx.beginPath();
    ctx.arc(lx + sway, 96, 7, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#FFB347";
    ctx.beginPath();
    ctx.ellipse(lx + sway, 90, 3, 5 + Math.sin(frameCount / 8 + i) * 1.2,
                0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* Day 11 — the Divine Morning: slow-turning golden rays, a soft
   halo, and two little clouds. */
function drawDivineProp() {
  const cx = 480, cy = 150;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(frameCount / 400);
  ctx.fillStyle = "rgba(242, 177, 52, 0.25)";
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(320, -22);
    ctx.lineTo(320, 22);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "rgba(255, 223, 112, 0.35)";
  ctx.beginPath();
  ctx.arc(cx, cy, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFDF4";
  drawCloud(200, 110, 1);
  drawCloud(760, 150, 0.8);
}

/* drawCloud(x, y, scale) — three overlapping circles. */
function drawCloud(x, y, scale) {
  ctx.beginPath();
  ctx.arc(x - 26 * scale, y, 16 * scale, 0, Math.PI * 2);
  ctx.arc(x, y - 10 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 26 * scale, y, 16 * scale, 0, Math.PI * 2);
  ctx.fill();
}
/* drawBird(x, y)
   WHAT: draws one small bird as two little arcs (its wings). */
function drawBird(x, y) {
  ctx.beginPath();
  ctx.arc(x - 6, y, 6, Math.PI * 1.1, Math.PI * 1.9);
  ctx.arc(x + 6, y, 6, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
}



/* drawBunting()
   WHAT: draws a string of triangle festival flags that gently sway. */
function drawBunting() {
  const colors = ["#E8722E", "#3E8E7E", "#D64545", "#E8B23A"];
  ctx.strokeStyle = "#B98A54";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 34);
  ctx.lineTo(CONFIG.width, 34);
  ctx.stroke();

  for (let i = 0; i < 16; i++) {
    const sway = Math.sin(frameCount / 40 + i) * 3;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(20 + i * 60, 34 + sway);
    ctx.lineTo(64 + i * 60, 34 + sway);
    ctx.lineTo(42 + i * 60, 62 + sway);
    ctx.closePath();
    ctx.fill();
  }
}

/* drawRoundedRect(x, y, w, h, r, fill, stroke)
   WHAT: draws a rectangle with rounded corners. */
function drawRoundedRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/* drawShadow(x, y, r)
   WHAT: draws a flat dark ellipse under a character. */
function drawShadow(x, y, r) {
  ctx.fillStyle = "rgba(58, 36, 27, 0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y, r, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ------------------------------------------------------------
   PLAYER DRAWING — three functions working together:
   drawPlayer()         picks the design (human or Ganesha)
   drawHumanGuardian()  draws the ten human guardians
   drawGanesha()        positions the Day 11 hero on the arena
   drawGaneshaSprite()  the pure Ganesha artwork
   ------------------------------------------------------------ */

/* drawPlayer()
   WHAT: the "traffic controller" of player visuals. Checks who is
         playing (via getCurrentCharacter) and calls the right
         drawing function. Handles the shared invincibility blink.
   RECEIVES: nothing (reads global `player` and `dayIndex`).
   CHANGES: nothing — drawing only.
   WHY: Days 1–10 draw a human guardian and ONLY Day 11 draws
        Ganesha. The hitbox, movement and attacks are NOT touched. */
function drawPlayer() {
  // blink while invincible (skip drawing every other 4-frame block)
  if (player.hurtTimer > 0 && Math.floor(frameCount / 4) % 2 === 0) return;

  const character = getCurrentCharacter();

  if (character.hair === "ganesha") {
    drawGanesha();
  } else {
    drawHumanGuardian(character);
  }
}

/* drawHumanGuardian(character)
   WHAT: draws one of the ten human guardians — final version.
         Includes: A-line dress for females, joined male legs,
         symmetric face with BINDI (female) or tapered TILAK (male),
         and a small NOSE + slight HALF-SMILE for every guardian.
   RECEIVES: one entry from the CHARACTERS array.
   CHANGES: nothing — drawing only. The 34 x 52 hitbox is untouched.
   WHY: one function + one gender check = two silhouettes, and every
        guardian has a complete face. */
function drawHumanGuardian(character) {
  const p = player;
  const cx = p.x + p.w / 2;
  const isFemale = (character.gender === "female");
  const hairColor = "#3A2A1E";

  drawShadow(cx, CONFIG.groundY + 6, 20);

  // long hair drawn BEHIND everything, extending down both sides
  if (character.hair === "long") {
    ctx.fillStyle = hairColor;
    drawRoundedRect(cx - 16, p.y - 2, 32, 32, 10, true, false);
  }

  // legs / feet
  ctx.fillStyle = "#5B3A22";
  if (isFemale) {
    // the dress covers the legs, so only small feet peek out below
    ctx.fillRect(p.x + 8, p.y + p.h - 5, 7, 5);
    ctx.fillRect(p.x + p.w - 15, p.y + p.h - 5, 7, 5);
  } else {
    // male legs — bigger AND extended upward so their tops hide
    // behind the outfit (drawn right after) — no gap, no floating
    ctx.fillRect(cx - 11, p.y + 36, 10, 16);
    ctx.fillRect(cx + 1, p.y + 36, 10, 16);
  }

  // outfit body
  ctx.strokeStyle = "rgba(58, 36, 27, 0.35)"; // keeps light colors visible
  ctx.lineWidth = 2;
  ctx.fillStyle = character.outfitColor;

  if (isFemale) {
    // FEMALE: A-line dress — trapezoid, narrow at the shoulders,
    // wide at the hem, with a gently curved bottom edge
    const shoulderY = p.y + 16;
    const hemY = p.y + p.h - 7;
    ctx.beginPath();
    ctx.moveTo(cx - 11, shoulderY);
    ctx.lineTo(cx + 11, shoulderY);
    ctx.lineTo(cx + 19, hemY);
    ctx.quadraticCurveTo(cx, hemY + 4, cx - 19, hemY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // MALE: straight outfit
    drawRoundedRect(p.x + 2, p.y + 16, p.w - 4, p.h - 30, 7, true, true);
  }

  // one simple arm on the facing side, with a small hand
  ctx.fillStyle = "#F6D7A8";
  const armX = (p.facing === 1) ? p.x + p.w - 6 : p.x - 2;
  drawRoundedRect(armX, p.y + 20, 8, 14, 4, true, false);
  ctx.beginPath();
  ctx.arc(armX + 4, p.y + 36, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // optional sash (Swapna's red stripe over the orange outfit)
  if (character.accentColor) {
    ctx.fillStyle = character.accentColor;
    ctx.fillRect(p.x + 2, p.y + 30, p.w - 4, 4);
  }

  // head
  ctx.fillStyle = "#F6D7A8";
  ctx.beginPath();
  ctx.arc(cx, p.y + 11, 11, 0, Math.PI * 2);
  ctx.fill();

  // hair on top (all three human styles cover the top of the head)
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.arc(cx, p.y + 9, 11, Math.PI, 0); // top half circle
  ctx.fill();

  // medium hair: short strands down the sides
  if (character.hair === "medium") {
    ctx.fillRect(cx - 13, p.y + 6, 4, 10);
    ctx.fillRect(cx + 9, p.y + 6, 4, 10);
  }

  // long hair: longer strands in front of the shoulders
  if (character.hair === "long") {
    ctx.fillRect(cx - 13, p.y + 6, 4, 16);
    ctx.fillRect(cx + 9, p.y + 6, 4, 16);
  }

  // eyes — symmetric around the face center, so the forehead mark
  // sits EXACTLY midway between them
  ctx.fillStyle = "#2A1B16";
  ctx.beginPath();
  ctx.arc(cx - 4, p.y + 12, 1.8, 0, Math.PI * 2);
  ctx.arc(cx + 4, p.y + 12, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // NOSE — small, thin stroke below the eyes, dead center
  ctx.strokeStyle = "#E0A96D";
  ctx.lineWidth = 1.0;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, p.y + 13.8);
  ctx.lineTo(cx, p.y + 15.0);
  ctx.stroke();

  // MOUTH — slight half-smile: small line that dips gently in the
  // middle (the control point pulls it down only ~0.4 units)
  ctx.strokeStyle = "#5B3A22";
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(cx - 1.2, p.y + 16.4);
  ctx.quadraticCurveTo(cx, p.y + 17.2, cx + 1.2, p.y + 16.4);
  ctx.stroke();

  // forehead mark: small BINDI (female) / thin tapered TILAK (male).
  // The hairline is at p.y + 9 and the eyes at p.y + 12, so the
  // visible forehead band is 3 units tall and its middle is p.y + 10.5.
  ctx.fillStyle = "#C0392B";
  if (isFemale) {
    // bindi: small round dot, dead center of the band
    ctx.beginPath();
    ctx.arc(cx, p.y + 10.5, 0.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // tilak: tapered brush-stroke shape — sharp point at the top,
    // widening downward, rounded base
    ctx.beginPath();
    ctx.moveTo(cx, p.y + 9);                                            // sharp top point
    ctx.quadraticCurveTo(cx + 0.35, p.y + 10.1, cx + 0.6, p.y + 11.1);  // right side
    ctx.quadraticCurveTo(cx + 0.6, p.y + 11.8, cx, p.y + 12);           // rounded base
    ctx.quadraticCurveTo(cx - 0.6, p.y + 11.8, cx - 0.6, p.y + 11.1);   // left side
    ctx.quadraticCurveTo(cx - 0.35, p.y + 10.1, cx, p.y + 9);           // back to point
    ctx.closePath();
    ctx.fill();
  }
}

/* ------------------------------------------------------------
   LORD GANESHA — two functions working together:
   drawGanesha()       = the game glue (position, size, shadow)
   drawGaneshaSprite() = the pure artwork (draws at any x, y, size)
   ------------------------------------------------------------ */

/* drawGanesha()
   WHAT: places the approved Ganesha artwork onto the arena. It
         computes WHERE to draw and HOW BIG, draws the ground
         shadow, then hands the actual painting to
         drawGaneshaSprite().
   RECEIVES: nothing (reads the global `player` object).
   CHANGES: nothing — drawing only.
   WHY: keeps game logic and artwork separated. The invisible
        hitbox stays 34 x 52 pixels, so movement, jumping, attacks
        and collisions behave exactly as before — only the picture
        is new. */
function drawGanesha() {
  const p = player;

  const W = 102;                  // display width in pixels.
                                  // Andhakasura is 92 wide, so
                                  // Ganesha still looks bigger.
  const H = Math.round(W * 1.45); // the sprite is designed on a
                                  // 100 x 145 grid, so its height
                                  // is always width * 1.45.

  // center the 102px picture on the 34px hitbox
  const bx = p.x + p.w / 2 - W / 2;
  // plant the feet on the bottom edge of the hitbox
  // (which is the floor whenever he is standing)
  const by = p.y + p.h - H;

  // ground shadow, same as every other character gets
  drawShadow(p.x + p.w / 2, CONFIG.groundY + 6, 48);

  // the approved artwork, at the computed place and size
  drawGaneshaSprite(ctx, bx, by, W);
}

/* drawGaneshaSprite(ctx, x, y, size)
   WHAT: draws the full Lord Ganesha character (crown bead to feet)
         using only basic Canvas shapes. Front-facing portrait:
         LONG sharp tusk on the viewer's RIGHT, short clipped
         (broken) tusk on the viewer's LEFT. No mouth — the trunk
         fills the lower face, per the approved design.
   RECEIVES: ctx = the 2D context to draw on,
             x, y = top-left corner of the drawing area (pixels),
             size = character WIDTH in pixels (height = size * 1.45).
   CHANGES: nothing except canvas pixels. All ctx state is saved
            and restored, so it never leaks styles into the loop.
   WHY: one pure function = safe to call every frame, scales to any
        size, and can be previewed outside the game unchanged. */
function drawGaneshaSprite(ctx, x, y, size) {
  const u = size / 100;          // one design unit in pixels
  const X = v => x + v * u;      // grid-x -> canvas-x
  const Y = v => y + v * u;      // grid-y -> canvas-y

  // local rounded-rectangle helper (same arcTo technique as the game)
  function rr(vx, vy, vw, vh, vr) {
    const rx = X(vx), ry = Y(vy), rw = vw * u, rh = vh * u, rad = vr * u;
    ctx.beginPath();
    ctx.moveTo(rx + rad, ry);
    ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, rad);
    ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, rad);
    ctx.arcTo(rx, ry + rh, rx, ry, rad);
    ctx.arcTo(rx, ry, rx + rw, ry, rad);
    ctx.closePath();
    ctx.fill();
  }
  // local circle helper
  function dot(vx, vy, vr) {
    ctx.beginPath();
    ctx.arc(X(vx), Y(vy), vr * u, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();

  // palette (flat vector, no gradients)
  const SKIN = "#F6D7A8", TUSK = "#FFFFFF", TUSK_LINE = "#D9CBB0",
        ORANGE = "#F28A1C", SHADOW = "#C9660F", GOLD = "#F2B134",
        GOLD_DARK = "#B87A10", RED = "#C0392B", TRUNK = "#EFC08F",
        FEET = "#3B2C22", INK = "#1E1512";

  // ---- FEET: two charcoal blocks at the very bottom ----
  ctx.fillStyle = FEET;
  rr(30, 136, 16, 9, 2);
  rr(54, 136, 16, 9, 2);

  // ---- ARMS: cream blocks tucked slightly behind the torso,
  //      each with a golden wristband near its bottom ----
  ctx.fillStyle = SKIN;
  rr(16, 88, 9, 32, 3);   // left arm
  rr(75, 88, 9, 32, 3);   // right arm
  ctx.fillStyle = GOLD;
  rr(16, 110, 9, 6, 2);   // left wristband
  rr(75, 110, 9, 6, 2);   // right wristband

  // ---- TORSO: vibrant orange rounded rect + lower-middle detail ----
  ctx.fillStyle = ORANGE;
  rr(22, 80, 56, 56, 12);
  ctx.fillStyle = SHADOW;                              // darker orange stripe
  ctx.fillRect(X(22), Y(104), 56 * u, 7 * u);
  ctx.fillStyle = GOLD;                                // golden belt stripe
  ctx.fillRect(X(22), Y(111), 56 * u, 5.5 * u);
  ctx.fillStyle = GOLD;                                // center medallion
  ctx.strokeStyle = GOLD_DARK;
  ctx.lineWidth = 1.2 * u;
  dot(50, 113.75, 5.5);
  ctx.stroke();

  // ---- EARS (behind), HEAD, EYES, TILAK ----
  ctx.fillStyle = SKIN;
  dot(25.5, 60, 13);      // left ear peeks out
  dot(74.5, 60, 13);      // right ear peeks out
  dot(50, 60, 22);        // head covers the inner halves

  ctx.fillStyle = INK;    // two clean black circular eyes
  dot(42.5, 57.5, 2.8);
  dot(57.5, 57.5, 2.8);

  ctx.fillStyle = RED;    // sharp small vertical tilak, dead center
  ctx.fillRect(X(48.7), Y(43), 2.6 * u, 10 * u);

  // ---- TUSKS (crucial iconography) ----
  ctx.fillStyle = TUSK;
  ctx.strokeStyle = TUSK_LINE;
  ctx.lineWidth = 1.1 * u;
  ctx.lineJoin = "round";

  // LONG tusk — viewer's RIGHT: curved, white, sharp point
  ctx.beginPath();
  ctx.moveTo(X(59), Y(72));
  ctx.quadraticCurveTo(X(78), Y(74), X(83), Y(97));   // outer sweep to tip
  ctx.quadraticCurveTo(X(71), Y(83), X(60), Y(79));   // inner curve back
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // BROKEN tusk — viewer's LEFT: short, ends in a FLAT clipped edge
  ctx.beginPath();
  ctx.moveTo(X(41), Y(72));
  ctx.quadraticCurveTo(X(30), Y(73), X(28), Y(82));   // outer sweep
  ctx.lineTo(X(34), Y(82));                           // straight flat cut
  ctx.quadraticCurveTo(X(38), Y(78), X(42), Y(77));   // inner curve back
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ---- TRUNK: warm cream, sweeps down, curls elegantly to the side ----
  ctx.strokeStyle = TRUNK;
  ctx.lineWidth = 7.5 * u;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(X(50), Y(66));
  ctx.quadraticCurveTo(X(48), Y(86), X(56), Y(93));   // down...
  ctx.quadraticCurveTo(X(63), Y(99), X(68), Y(92));   // ...and over
  ctx.stroke();

  // ---- LAYERED CROWN: fork tier, trapezoid tier, line + bead ----
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = GOLD_DARK;
  ctx.lineWidth = 1.6 * u;

  // double-pointed triangular fork tier (drawn first, base covers it)
  ctx.beginPath();
  ctx.moveTo(X(39), Y(30));
  ctx.lineTo(X(45), Y(17));
  ctx.lineTo(X(50), Y(26));
  ctx.lineTo(X(55), Y(17));
  ctx.lineTo(X(61), Y(30));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // wide trapezoidal base tier
  ctx.beginPath();
  ctx.moveTo(X(37), Y(30));
  ctx.lineTo(X(63), Y(30));
  ctx.lineTo(X(68), Y(40));
  ctx.lineTo(X(32), Y(40));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // thin gold vertical line rising between the fork points...
  ctx.fillRect(X(49), Y(6), 2 * u, 12 * u);
  // ...topped with a small circular bead
  dot(50, 4.5, 2.5);
  ctx.stroke();

  ctx.restore();
}

/* drawEnemies()
   WHAT: for every enemy: draws its shadow, then calls its own shape
         function, then draws a white flash if it was just hit. */
function drawEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    drawShadow(e.x + e.w / 2, CONFIG.groundY + 6, e.w * 0.55);

    if (e.type === "wisp")        drawWisp(e);
    else if (e.type === "brute")  drawBrute(e);
    else if (e.type === "dasher") drawDasher(e);
    else if (e.type === "boss")   drawBoss(e);

    // white flash right after taking damage
    if (e.hurtFlash > 0) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#FFFFFF";
      drawRoundedRect(e.x, e.y, e.w, e.h, 8, true, false);
      ctx.globalAlpha = 1;
    }
  }
}

/* drawWisp(e) — the floating ghost: a circle top with a lumpy
   zig-zag bottom, red eyes, and a small straight mouth. */
function drawWisp(e) {
  const y = e.y + Math.sin(frameCount / 12 + e.x * 0.05) * 4;

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#5C5551";
  ctx.beginPath();
  ctx.arc(e.x + 15, y + 12, 14, Math.PI, 0); // top half circle
  ctx.lineTo(e.x + 29, y + 24);              // right side...
  ctx.lineTo(e.x + 22, y + 20);              // ...then zig-zag bottom
  ctx.lineTo(e.x + 15, y + 26);
  ctx.lineTo(e.x + 8, y + 20);
  ctx.lineTo(e.x + 1, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#E85454";
  ctx.beginPath();
  ctx.arc(e.x + 10, y + 11, 2.5, 0, Math.PI * 2);
  ctx.arc(e.x + 20, y + 11, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // small straight mouth
  ctx.strokeStyle = "#2A1B16";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(e.x + 12, y + 17);
  ctx.lineTo(e.x + 18, y + 17);
  ctx.stroke();
}

/* drawBrute(e) — the tank: big maroon body, cream horns, angry
   eyes with slanted brows, and a toothy mouth. */
function drawBrute(e) {
  ctx.fillStyle = "#7E3B34";
  drawRoundedRect(e.x, e.y + 6, e.w, e.h - 6, 10, true, false);

  // legs
  ctx.fillStyle = "#5E2A25";
  ctx.fillRect(e.x + 6, e.y + e.h - 8, 10, 8);
  ctx.fillRect(e.x + e.w - 16, e.y + e.h - 8, 10, 8);

  // horns (two triangles)
  ctx.fillStyle = "#E8D5B5";
  ctx.beginPath();
  ctx.moveTo(e.x + 6, e.y + 10);
  ctx.lineTo(e.x + 16, e.y + 10);
  ctx.lineTo(e.x + 4, e.y - 6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(e.x + 30, e.y + 10);
  ctx.lineTo(e.x + 40, e.y + 10);
  ctx.lineTo(e.x + 42, e.y - 6);
  ctx.closePath();
  ctx.fill();

  // eyes with slanted angry brows
  ctx.fillStyle = "#F3E3C2";
  ctx.fillRect(e.x + 8, e.y + 18, 12, 7);
  ctx.fillRect(e.x + 26, e.y + 18, 12, 7);
  ctx.fillStyle = "#D64545";
  ctx.beginPath();
  ctx.arc(e.x + 14, e.y + 22, 2.5, 0, Math.PI * 2);
  ctx.arc(e.x + 32, e.y + 22, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4A1F1B";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(e.x + 7, e.y + 16);  ctx.lineTo(e.x + 19, e.y + 20);
  ctx.moveTo(e.x + 39, e.y + 16); ctx.lineTo(e.x + 27, e.y + 20);
  ctx.stroke();

  // mouth with two teeth
  ctx.fillStyle = "#4A1F1B";
  ctx.fillRect(e.x + 10, e.y + 34, 26, 9);
  ctx.fillStyle = "#F3E3C2";
  ctx.beginPath();
  ctx.moveTo(e.x + 13, e.y + 34); ctx.lineTo(e.x + 19, e.y + 34);
  ctx.lineTo(e.x + 16, e.y + 39);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(e.x + 27, e.y + 34); ctx.lineTo(e.x + 33, e.y + 34);
  ctx.lineTo(e.x + 30, e.y + 39);
  ctx.closePath();
  ctx.fill();
}

/* drawDasher(e) — the fast one: lean dark body, one big eye, a
   small straight mouth, and speed lines while dashing. */
function drawDasher(e) {
  // speed lines behind the dasher
  if (e.dashFrames > 0) {
    ctx.strokeStyle = "rgba(59, 53, 50, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const backX = (e.facing === 1) ? e.x - 4 : e.x + e.w + 4;
    ctx.moveTo(backX, e.y + 18); ctx.lineTo(backX - e.facing * 14, e.y + 18);
    ctx.moveTo(backX, e.y + 26); ctx.lineTo(backX - e.facing * 18, e.y + 26);
    ctx.moveTo(backX, e.y + 34); ctx.lineTo(backX - e.facing * 12, e.y + 34);
    ctx.stroke();
  }

  ctx.fillStyle = "#3B3532";
  drawRoundedRect(e.x, e.y + 14, e.w, e.h - 14, 7, true, false);
  ctx.beginPath();
  ctx.arc(e.x + e.w / 2, e.y + 12, 12, 0, Math.PI * 2);
  ctx.fill();

  // small horns
  ctx.beginPath();
  ctx.moveTo(e.x + 6, e.y + 4);  ctx.lineTo(e.x + 12, e.y + 6);
  ctx.lineTo(e.x + 6, e.y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(e.x + 28, e.y + 4); ctx.lineTo(e.x + 22, e.y + 6);
  ctx.lineTo(e.x + 28, e.y + 10);
  ctx.closePath();
  ctx.fill();

  // one big eye with a pupil that follows facing
  ctx.fillStyle = "#F3E3C2";
  ctx.beginPath();
  ctx.arc(e.x + e.w / 2, e.y + 12, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#D64545";
  ctx.beginPath();
  ctx.arc(e.x + e.w / 2 + e.facing * 2, e.y + 12, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // small straight mouth
  ctx.strokeStyle = "#F3E3C2";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(e.x + e.w / 2 - 3.5, e.y + 24);
  ctx.lineTo(e.x + e.w / 2 + 3.5, e.y + 24);
  ctx.stroke();

  // feet
  ctx.fillRect(e.x + 5, e.y + e.h - 5, 8, 5);
  ctx.fillRect(e.x + e.w - 13, e.y + e.h - 5, 8, 5);
}

/* drawBoss(e) — Andhakasura: huge maroon body, big curved horns,
   glowing yellow eyes, toothy mouth, and a gold medallion. */
function drawBoss(e) {
  ctx.fillStyle = "#6E2A24";
  drawRoundedRect(e.x, e.y + 10, e.w, e.h - 10, 14, true, false);

  // legs
  ctx.fillStyle = "#521C17";
  ctx.fillRect(e.x + 12, e.y + e.h - 10, 18, 10);
  ctx.fillRect(e.x + e.w - 30, e.y + e.h - 10, 18, 10);

  // big horns
  ctx.fillStyle = "#E8D5B5";
  ctx.beginPath();
  ctx.moveTo(e.x + 4, e.y + 22);
  ctx.lineTo(e.x + 22, e.y + 14);
  ctx.lineTo(e.x - 6, e.y - 16);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(e.x + e.w - 4, e.y + 22);
  ctx.lineTo(e.x + e.w - 22, e.y + 14);
  ctx.lineTo(e.x + e.w + 6, e.y - 16);
  ctx.closePath();
  ctx.fill();

  // glowing eyes
  ctx.fillStyle = "#F2B134";
  ctx.beginPath();
  ctx.arc(e.x + 28, e.y + 36, 7, 0, Math.PI * 2);
  ctx.arc(e.x + 64, e.y + 36, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#D64545";
  ctx.beginPath();
  ctx.arc(e.x + 28 + e.facing * 2, e.y + 36, 3, 0, Math.PI * 2);
  ctx.arc(e.x + 64 + e.facing * 2, e.y + 36, 3, 0, Math.PI * 2);
  ctx.fill();

  // mouth with a row of teeth
  ctx.fillStyle = "#3A120E";
  ctx.fillRect(e.x + 18, e.y + 52, 56, 15);
  ctx.fillStyle = "#F3E3C2";
  for (let t = 0; t < 4; t++) {
    const tx = e.x + 22 + t * 14;
    ctx.beginPath();
    ctx.moveTo(tx, e.y + 52);
    ctx.lineTo(tx + 9, e.y + 52);
    ctx.lineTo(tx + 4.5, e.y + 60);
    ctx.closePath();
    ctx.fill();
  }

  // gold medallion on the chest
  ctx.fillStyle = "#F2B134";
  ctx.beginPath();
  ctx.arc(e.x + e.w / 2, e.y + 84, 9, 0, Math.PI * 2);
  ctx.fill();
}

/* drawModaks()
   WHAT: paints each modak: a golden dumpling circle, three pleat
         lines, an orange topknot, and a gentle bob. */
function drawModaks() {
  for (let i = 0; i < modaks.length; i++) {
    const m = modaks[i];
    const y = m.y + Math.sin(frameCount / 14 + m.x * 0.08) * 3;

    ctx.fillStyle = "#F2CE7B";
    ctx.beginPath();
    ctx.arc(m.x + 11, y + 12, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#C99B45";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(m.x + 11, y + 3); ctx.lineTo(m.x + 4,  y + 12);
    ctx.moveTo(m.x + 11, y + 3); ctx.lineTo(m.x + 11, y + 15);
    ctx.moveTo(m.x + 11, y + 3); ctx.lineTo(m.x + 18, y + 12);
    ctx.stroke();

    ctx.fillStyle = "#E8862E";
    ctx.beginPath();
    ctx.arc(m.x + 11, y + 1, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* drawDivineShots()
   WHAT: paints each golden shot: two faded trail circles behind it
         and a bright orb with a white core. */
function drawDivineShots() {
  for (let i = 0; i < divineShots.length; i++) {
    const s = divineShots[i];
    const cx = s.x + s.w / 2, cy = s.y + s.h / 2;

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#F2B134";
    ctx.beginPath();
    ctx.arc(cx - s.vx * 2.2, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - s.vx * 4.2, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#F2B134";
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFF6DC";
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* drawEnemyShots()
   WHAT: paints the boss's dark orbs with a pulsing red core. */
function drawEnemyShots() {
  for (let i = 0; i < enemyShots.length; i++) {
    const s = enemyShots[i];
    const cx = s.x + s.w / 2, cy = s.y + s.h / 2;

    ctx.fillStyle = "#8E2F2F";
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4A120E";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.stroke();

    // core size pulses with a sine wave
    ctx.fillStyle = "#D64545";
    ctx.beginPath();
    ctx.arc(cx, cy, 3 + Math.sin(frameCount / 6), 0, Math.PI * 2);
    ctx.fill();
  }
}

/* drawSlashEffects()
   WHAT: paints the golden attack arc in front of the player, fading
         out over its 10-frame life. */
function drawSlashEffects() {
  for (let i = 0; i < slashEffects.length; i++) {
    const f = slashEffects[i];
    const t = f.life / 10; // 1 at spawn, fading to 0

    ctx.globalAlpha = t;
    ctx.strokeStyle = "#F2B134";
    ctx.lineWidth = 6 * t + 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (f.facing === 1) ctx.arc(f.x + 14, f.y, 30, -0.9, 0.9);
    else                ctx.arc(f.x - 14, f.y, 30, Math.PI - 0.9, Math.PI + 0.9);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/* drawSparkles()
   WHAT: paints an expanding gold ring wherever a modak was collected. */
function drawSparkles() {
  for (let i = 0; i < sparkles.length; i++) {
    const sp = sparkles[i];
    const t = sp.life / 15;
    ctx.globalAlpha = t;
    ctx.strokeStyle = "#F2B134";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 8 + (1 - t) * 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/* drawHeart(x, y, size, filled)
   WHAT: draws one heart from two circles and a triangle — filled
         red if the player still has this heart, outline if not. */
function drawHeart(x, y, s, filled) {
  ctx.beginPath();
  ctx.arc(x - s * 0.25, y - s * 0.2, s * 0.28, 0, Math.PI * 2);
  ctx.arc(x + s * 0.25, y - s * 0.2, s * 0.28, 0, Math.PI * 2);
  ctx.moveTo(x - s * 0.5, y);
  ctx.lineTo(x + s * 0.5, y);
  ctx.lineTo(x, y + s * 0.6);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = "#D64545";
    ctx.fill();
  } else {
    ctx.strokeStyle = "#B99C7A";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/* drawHUD()
   WHAT: paints hearts, faith bar, score, day/wave and character name.
         Text colors come from today's theme, so the HUD stays
         readable even on the dark Lamp District sky. */
function drawHUD() {
  const theme = BACKGROUNDS[dayIndex]; // today's colors

  // hearts (one per max health; filled ones = remaining health)
  for (let i = 0; i < CONFIG.playerMaxHealth; i++) {
    drawHeart(30 + i * 30, 28, 12, i < player.health);
  }

  // faith bar
  const fx = 22, fy = 44, fw = 170, fh = 13;
  ctx.fillStyle = "#3A241B";
  drawRoundedRect(fx - 2, fy - 2, fw + 4, fh + 4, 6, true, false);
  ctx.fillStyle = "#54402E";
  drawRoundedRect(fx, fy, fw, fh, 4, true, false);
  // bright gold when there is enough faith for a shot, dim otherwise
  ctx.fillStyle = (faith >= CONFIG.divineCost) ? "#F2B134" : "#B98A54";
  drawRoundedRect(fx, fy, fw * faith / CONFIG.maxFaith, fh, 4, true, false);
  ctx.font = "800 13px 'Baloo 2', sans-serif";
  ctx.fillStyle = theme.hud;
  ctx.fillText("FAITH", fx + fw + 10, fy);

  // score, day/wave and character name (right-aligned)
  ctx.textAlign = "right";
  ctx.font = "800 24px 'Baloo 2', sans-serif";
  ctx.fillStyle = theme.hud;
  ctx.fillText("SCORE " + score, CONFIG.width - 20, 16);
  ctx.font = "800 16px 'Baloo 2', sans-serif";
  ctx.fillText("DAY " + DAYS[dayIndex].day + "  •  WAVE " + waveNumber,
               CONFIG.width - 20, 48);
  // the current character's name, right under the day line
  ctx.fillStyle = theme.hudName;
  ctx.fillText(getCurrentCharacter().name.toUpperCase(), CONFIG.width - 20, 70);
  ctx.textAlign = "left";

  drawBossBar();
}

/* drawBossBar()
   WHAT: if Andhakasura is alive, finds him and paints a big health
         bar at the top center of the screen, labeled ANDHAKASURA. */
function drawBossBar() {
  let boss = null;
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].type === "boss") boss = enemies[i];
  }
  if (!boss) return;

  const w = 320, x = (CONFIG.width - w) / 2, y = 14;

  ctx.fillStyle = "rgba(42, 27, 22, 0.75)";
  drawRoundedRect(x - 6, y - 6, w + 12, 40, 8, true, false);
  ctx.fillStyle = "#3A241B";
  drawRoundedRect(x, y, w, 14, 5, true, false);
  ctx.fillStyle = "#D64545";
  drawRoundedRect(x, y, w * (boss.hp / boss.maxHp), 14, 5, true, false);

  ctx.font = "800 13px 'Baloo 2', sans-serif";
  ctx.fillStyle = "#F6E7CE";
  ctx.fillText("ANDHAKASURA", x, y + 20);
}

/* drawBanner()
   WHAT: paints the big center message while bannerTimer > 0, fading
         out smoothly near the end. */
function drawBanner() {
  if (bannerTimer <= 0) return;

  const alpha = Math.min(1, bannerTimer / 30); // fade in the last 30 frames
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.font = "800 38px 'Baloo 2', sans-serif";
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#3A241B";
  ctx.strokeText(bannerMessage, CONFIG.width / 2, 150);
  ctx.fillStyle = "#F6E7CE";
  ctx.fillText(bannerMessage, CONFIG.width / 2, 150);
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;
}


/* ============================================================
   SECTION 12 — GAME LOOP
   ------------------------------------------------------------
   The heart of the game: one function that runs forever,
   updating logic ~60 times per second and redrawing every time.
   ============================================================ */

/* update()
   WHAT: runs one "tick" of game logic by calling the update
         functions in the correct order.
   RECEIVES: nothing.
   CHANGES: whatever those functions change.
   WHY: keeping the order in ONE place makes the frame easy to reason
        about: move → enemies → projectiles → collisions → waves. */
function update() {
  updatePlayer();
  updateEnemies();
  updateProjectiles();
  checkCollisions();
  updateWaveState();
  updateEffects();
  updateBanner();
}

/* gameLoop(timestamp)
   WHAT: the endless heartbeat. The browser calls it ~60–144 times
         per second; it updates the game and redraws.
   RECEIVES: `timestamp` — the current time in milliseconds, given
             automatically by requestAnimationFrame.
   CHANGES: frameCount, lastUpdate, and the whole game via update().
   WHY: the timestamp check ("has at least 15ms passed?") keeps the
        speed the same on every monitor — without it, the game would
        run more than twice as fast on a 144Hz screen. */
let lastUpdate = 0;

function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);      // book the next frame first

  if (timestamp - lastUpdate < 15) return; // skip: too soon for 60fps
  lastUpdate = timestamp;

  frameCount++;                          // animations keep ticking
  if (gameState === "playing") update(); // logic only while playing
  draw();                                // always paint (menus sit on top)
}


/* ============================================================
   SECTION 13 — BUTTON AND MOBILE CONTROLS
   ------------------------------------------------------------
   Everything here connects HTML buttons to game functions.
   Mobile buttons reuse the SAME flags/functions as the keyboard,
   so no game logic needs to know where the input came from.
   ============================================================ */

/* setGameState(newState)
   WHAT: changes gameState AND shows exactly the right overlay
         (menu / intro / pause / game over / victory) by toggling
         a class.
   RECEIVES: the new state as text.
   CHANGES: gameState and the visibility of the five overlay divs.
   WHY: this is the single doorway between screens — no other code
        has to touch the overlays. */
function setGameState(newState) {
  gameState = newState;
  document.getElementById("menuOverlay").classList.toggle("hidden", newState !== "menu");
  document.getElementById("introOverlay").classList.toggle("hidden", newState !== "intro");
  document.getElementById("pauseOverlay").classList.toggle("hidden", newState !== "paused");
  document.getElementById("gameoverOverlay").classList.toggle("hidden", newState !== "gameover");
  document.getElementById("victoryOverlay").classList.toggle("hidden", newState !== "victory");
}

/* togglePause()
   WHAT: switches between playing and paused.
   RECEIVES: nothing.  CHANGES: gameState (via setGameState).
   WHY: freezing update() while still drawing is the simplest
        possible pause: the world just stops being ticked. */
function togglePause() {
  if (gameState === "playing") setGameState("paused");
  else if (gameState === "paused") setGameState("playing");
}

/* bindHoldButton(id, keyName)
   WHAT: wires a mobile button so HOLDING it sets keys[keyName] to
         true (and releasing sets it false) — exactly like a key.
   RECEIVES: the button's HTML id, and which key flag to control.
   CHANGES: the `keys` object; adds a visual "pressed" style.
   WHY: one function wires both movement buttons with zero repetition. */
function bindHoldButton(id, keyName) {
  const btn = document.getElementById(id);

  const press = function (event) {
    event.preventDefault(); // stop scrolling / text selection
    keys[keyName] = true;
    btn.classList.add("pressed");
  };
  const release = function (event) {
    event.preventDefault();
    keys[keyName] = false;
    btn.classList.remove("pressed");
  };

  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointerleave", release); // finger slid off
  btn.addEventListener("pointercancel", release);
}

/* bindTapButton(id, action)
   WHAT: wires a mobile button that should fire ONE action per tap
         (jump, attack, divine shot).
   RECEIVES: the button's id, and the function to call.
   CHANGES: nothing itself — the action function does the work.
   WHY: mirrors the keyboard's "event" style inputs. */
function bindTapButton(id, action) {
  document.getElementById(id).addEventListener("pointerdown", function (event) {
    event.preventDefault();
    action();
  });
}

// ----- menu / intro / pause / restart buttons -----
document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("playButton").addEventListener("click", beginDay);
document.getElementById("resumeButton").addEventListener("click", function () {
  setGameState("playing");
});
document.getElementById("retryButton").addEventListener("click", retryDay);        // was startGame
document.getElementById("pauseRestartButton").addEventListener("click", retryDay); // was startGame
document.getElementById("playAgainButton").addEventListener("click", startGame);
document.getElementById("startOverButton").addEventListener("click", startGame);   // NEW
document.getElementById("pauseButton").addEventListener("click", togglePause);

// ----- mobile buttons -----
bindHoldButton("btnLeft", "left");
bindHoldButton("btnRight", "right");
bindTapButton("btnJump", tryJump);
bindTapButton("btnAttack", tryLightAttack);
bindTapButton("btnDivine", tryDivineShot);

// auto-pause when the tab loses focus (polite detail)
window.addEventListener("blur", function () {
  if (gameState === "playing") setGameState("paused");
});


/* ============================================================
   FIRST BOOT
   ------------------------------------------------------------
   Create a player so the arena is not empty behind the menu,
   show the menu, and start the loop. That's the whole startup.
   ============================================================ */

player = createPlayer();
setGameState("menu");
requestAnimationFrame(gameLoop);