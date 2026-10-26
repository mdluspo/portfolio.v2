export const arrowkopoCaseStudy = [
  {
    section: 'The challenge',
    title: 'Survive<br>the system grid.',
    body: '<p class="case-category">HTML5 CANVAS / ARCADE SURVIVAL / V1.3.0</p><p class="document-lead">A high-velocity arcade survival prototype built around momentum, shifting hazards, collectible energy, and cybernetic abilities.</p><figure class="case-showcase journal-photo journal-photo--action"><img src="/assets/projects/arrowkopo.png" alt="ARROWKOPO System Overdrive arcade survival game" width="1105" height="652"><figcaption>Field capture — System Overdrive v1.3.0</figcaption></figure><p class="case-margin-note">The grid is the arena. Movement is the main verb.</p>'
  },
  {
    section: 'The game',
    title: 'System<br>overdrive.',
    body: '<p class="document-lead">The player dodges tracking enemies, threads through lethal shifting laser arrays, and collects matrix inputs while the arena keeps applying pressure.</p><div class="case-rule-flow"><span>Tracking enemies close the route</span><span>Laser arrays reshape the safe space</span><span>Matrix inputs charge a response</span><span>Cybernetic abilities reset the odds</span></div><svg class="case-doodle case-doodle--arrow" viewBox="0 0 180 105" aria-hidden="true"><path pathLength="1" d="M17 20c33 3 59 3 88 0m-90 22c26-2 55 0 82-1M18 65c32-3 59-2 88 1m-89 21c36 0 65 1 95-2M34 9c0 30 1 57-2 87M65 8c-2 31-1 59 1 88m30-87c1 31 0 58-2 88"/><path pathLength="1" d="m113 15 18 17-13 13 22 15-17 16 24 15m-72-48 17 9-15 8 19 10"/><path pathLength="1" d="M126 7c18 5 31 17 36 32m-8-5 8 5-2-10M111 92c-16-5-29-14-36-27m1 10-1-10 10 3"/></svg>'
  },
  {
    section: 'The core loop',
    title: 'Read. Move.<br>Commit.',
    body: '<ol class="case-steps"><li><b>Read.</b> Track enemy paths, projectiles, and moving laser hitboxes.</li><li><b>Move.</b> Glide across the bounded arena and spend a Micro Dash when the safe route closes.</li><li><b>Charge.</b> Collect purple and yellow matrix orbs to build the ability core.</li><li><b>Overdrive.</b> Spend energy on the right ability, survive the pressure, and push the score higher.</li></ol><div class="case-doodle-pair case-doodle-pair--arrow" aria-hidden="true"><svg class="case-doodle case-doodle--arrow-crosshair" viewBox="0 0 92 92"><path pathLength="1" d="M46 12c19 0 34 15 34 34S65 80 46 80 12 65 12 46s15-34 34-34Z"/><path pathLength="1" d="M46 3v22m0 42v22M3 46h22m42 0h22"/><path pathLength="1" d="M38 38h16v16H38Z"/></svg><svg class="case-doodle case-doodle--arrow-burst" viewBox="0 0 125 85"><path pathLength="1" d="m61 6 7 22 19-13-7 23 28-1-23 15 26 12-30-2 10 18-24-14-10 15-1-22-24 13 13-21-29 1 26-14-25-10 29 2Z"/><path pathLength="1" d="M50 38h23m-17 9h12"/></svg></div>'
  },
  {
    section: 'Movement',
    title: 'Momentum creates<br>the tension.',
    body: '<section class="case-section"><h3>Inertia glide</h3><p>Smooth keyboard physics make each correction carry weight across the bounded 2D space.</p></section><section class="case-section"><h3>Micro Dash</h3><p>A short phase shift passes through laser hitboxes and hostile enemies. Holding at most two charges turns escape into a limited tactical resource.</p></section><svg class="case-doodle case-doodle--arrow-motion" viewBox="0 0 185 100" aria-hidden="true"><path pathLength="1" d="M18 55c19-17 37-25 56-25 21 0 34 12 50 11 15 0 27-7 40-20"/><path pathLength="1" d="m151 15 13 6-5 14M22 69c21-10 39-13 56-9m-62 23c14-5 27-6 39-4"/><path pathLength="1" d="M91 18 80 37l13 9-17 27 32-34-13-8 10-13Z"/></svg>'
  },
  {
    section: 'Energy economy',
    title: 'Collect first.<br>Choose under pressure.',
    body: '<section class="case-section"><h3>Readable inputs</h3><p>Neon-purple matrix orbs add 5 energy; yellow orbs add 10. That simple pickup language feeds a more consequential ability economy.</p></section><p class="document-lead">The player is constantly weighing survival now against saving for a stronger system response later.</p>'
  },
  {
    section: 'System Overdrive',
    title: 'Four answers<br>to danger.',
    body: '<ol class="case-steps"><li><b>Q / EMP Freeze — 200.</b> Locks hazards, projectiles, and tracking paths for three seconds.</li><li><b>E / Hyper Dash — 450.</b> Boosts acceleration and velocity, creates a chromatic trail, and refills both dash charges.</li><li><b>F / Thorn Barrier — 700.</b> Shatters physical entities and projectiles on contact.</li><li><b>R / Tactical Nuke — 2500.</b> Clears every hostile projectile and enemy unit on screen.</li></ol><svg class="case-doodle case-doodle--arrow-energy" viewBox="0 0 180 105" aria-hidden="true"><path pathLength="1" d="M91 10c17 0 30 13 30 29 0 14-9 24-20 29l-3 24-14-22c-14-3-24-15-24-30 0-17 13-30 31-30Z"/><path pathLength="1" d="m93 22-15 25 14-2-7 20 22-29-15 3Z"/><path pathLength="1" d="M43 24c-11 8-18 19-20 31m4-6-4 7-5-7m119-24c11 8 18 19 20 31m-4-7 4 7 5-7M42 83c14 8 30 12 48 12 20 0 37-5 50-14"/></svg>'
  },
  {
    section: 'Architecture',
    title: 'Decoupled for<br>fast iteration.',
    body: '<section class="case-section"><h3>A scannable browser-game stack</h3><p>Semantic structure and the HUD live in <b>index.html</b>; dark-grid layout and neon feedback live in <b>styles.css</b>; rendering, collision, and particle vectors live in <b>game.js</b>.</p></section><p class="case-caption">A GitHub Actions workflow packages release assets, while the package scripts support the local development server.</p><svg class="case-doodle case-doodle--arrow-code" viewBox="0 0 175 95" aria-hidden="true"><path pathLength="1" d="M13 14c45-4 95-3 148 1l-3 66c-45 4-94 3-143 0Z"/><path pathLength="1" d="M15 29c48-2 95-2 145 0M28 21h4m8 0h4m8 0h4"/><path pathLength="1" d="m49 45-12 10 12 10m28-24-9 29m24-25 12 10-12 10m25-15h23m-23 9h16"/></svg>'
  },
  {
    section: 'Reflection',
    title: 'Make pressure<br>feel fair.',
    body: '<p class="document-lead">ARROWKOPO works because movement, hazards, pickups, and abilities all reinforce the same survival loop.</p><section class="case-section"><h3>What comes next</h3><p>Continued playtesting can tune acceleration, dash recovery, laser readability, energy pacing, and the balance between immediate defensive abilities and the high-cost Tactical Nuke.</p></section><p class="case-caption">No retention or player-performance outcome is claimed in this case study.</p>'
  }
];
