# Vishwamukha 🪔
A 2D arena brawler themed on Vinayaka Chaturthi.

# ▶ Play now: https://conpro666-sudo.github.io/vishwamukha/

# The Story:
Andhakasura, the Demon of Darkness, sends his shadow army to destroy the Lord Ganesh's festival. Each day, a guardian chosen by Lord Ganesha protects one region — Thark at the Dawn Gate, Gambheera in theMountain Pass, Kanmani in the Lamp District, and seven more — withits own themed arena. On Day 11, Lord Ganesha himself, the Vighnaharta, arrives to face Andhakasura and purify the Final Darkness Core.


# How to Play:
Survive 5 waves per day/level. Defeat enemies, collect modaks, build faith, and reach the final battle.



# Action	Keyboard	Mobile:
Move	A / D or ← →	hold ◀ ▶
Jump	W / ↑ / Space	JUMP
Light attack	J or Z	ATTACK
Divine shot (30 faith)	K or X	DIVINE
Pause	P	Pause button
Scoring: enemies give 50–2000 points, modaks +25 and +20 faith(+1 heart), clearing a day gives a bonus (day × 100). Faith powersthe divine shot. Lose all 5 hearts and the run ends — beatAndhakasura on Day 11 for victory.

# Features:
11 days × 5 waves, data-driven difficulty (DAYS array)
Lord Ganesha + 10 original human guardians, each drawn withCanvas shapes (bindi/tilak, dress/kurta silhouettes, hairstyles)
11 unique themed backgrounds — one region per guardian, includinga night-time Lamp District and Ganesha's divine golden morning
3 enemy types (wisp, brute, dasher) + Andhakasura boss fight
Faith economy: collect modaks and land hits to earn powerfuldivine shots
Intro popup for every day; pause, restart, victory & game-overscreens — a complete playable loop
Keyboard + touch controls; works on phone and laptop browsers
Respectful theme handling: Lord Ganesha is never harmed — darknessdissolves into light around him


# Tech & Structure:
Plain HTML5 Canvas 2D + vanilla JavaScript (one game.js,13 labelled sections) + one CSS file — zero dependencies
Game loop: update state ~60×/sec, then redraw everything
One rectangle-overlap function powers all collisions
Characters, days and backgrounds are plain data arrays(CHARACTERS, DAYS, BACKGROUNDS — index = day)
Running Locally
Download the three files (index.html, style.css, game.js)
Open index.html in any modern browser — or use VS Code Live Server
