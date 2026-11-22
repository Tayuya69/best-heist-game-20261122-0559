// Sapphire Heist v2 — the game rules: alarm, objectives, pickups, the vault
// crack minigame, the camera hack, catches and the win / lose conditions.
// The actors (entities.js) own movement and sight; this class owns what
// those sightings mean and how the job is won or lost.
import { CFG } from './config.js';
import { Camera, Guard, Player, buildSightBlockers, buildSolids } from './entities.js';
import { dist, pointInRect } from './geo.js';
import { MAP } from './map.js';

export class Game {
  constructor(sound) {
    this.sound = sound;
    this.reset();
  }

  reset() {
    this.phase = 'title'; // title | playing | paused | win | caught | lockdown | timeout
    this.time = 0;
    this.timeLeft = CFG.timeLimit;
    this.player = new Player(MAP.spawn);
    this.guards = MAP.guards.map((g) => new Guard(g));
    this.cameras = MAP.cameras.map((c) => new Camera(c));
    this.vaultOpen = false;
    this.caseOpen = false;
    this.loot = MAP.loot.map((l) => ({ ...l, taken: false }));
    this.keycardTaken = false;
    this.alarm = 0;
    this.score = 0;
    this.everSpotted = false;
    this.camerasOfflineUntil = 0;
    this.cameraCooldownUntil = 0;
    this.hack = { active: false, progress: 0 };
    this.crack = { active: false, needle: 0, speed: 0, hits: 0, zone: 0 };
    this.particles = [];
    this.shake = 0;
    this.banner = null;
    this.prompt = null;
    this.finalScore = 0;
    this.finalBreakdown = [];
    this.staging = false; // screenshot scenes can freeze the actors mid-pose
    this.solids = buildSolids(MAP, false);
    this.blockers = buildSightBlockers(MAP);
    this.beepTimer = 0;
  }

  showBanner(text, sub = '', secs = 2.4) {
    this.banner = { text, sub, until: this.time + secs };
  }

  burst(x, y, color, n = 14, speed = 90) {
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: 0.6 + Math.random() * 0.5, max: 1.1, color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  // The one context action for E: terminal hack, vault unlock, case crack.
  interact() {
    if (this.phase !== 'playing') return;
    if (this.crack.active) {
      this.crackHit();
      return;
    }
    const p = this.player;
    if (!this.vaultOpen && dist(p.x, p.y, 560, 150) < CFG.interactRadius + 10) {
      if (p.hasKeycard) {
        this.vaultOpen = true;
        this.solids = buildSolids(MAP, true);
        this.sound.unlock();
        this.burst(560, 150, '#35d07f', 18);
        this.showBanner('VAULT DOOR OPEN', 'The sapphire is inside — crack the case');
      } else {
        this.showBanner('LOCKED', 'The vault needs the security keycard', 1.6);
        this.sound.crackBad();
      }
      return;
    }
    if (!this.caseOpen && this.vaultOpen &&
      dist(p.x, p.y, MAP.sapphireCase.x + 30, MAP.sapphireCase.y + 18) < CFG.interactRadius + 14) {
      this.crack.active = true;
      this.crack.needle = 0;
      this.crack.speed = CFG.crackNeedleBase;
      this.crack.hits = 0;
      this.crack.zone = (Math.random() * 2 - 1) * 0.55;
      this.showBanner('CRACKING THE CASE', 'Press E when the needle is in the green', 2.2);
      return;
    }
    if (dist(p.x, p.y, MAP.terminal.x, MAP.terminal.y) < CFG.interactRadius) {
      if (this.time < this.cameraCooldownUntil) {
        this.showBanner('TERMINAL COOLING DOWN', 'Wait for the hack to reset', 1.6);
        return;
      }
      if (this.time < this.camerasOfflineUntil) {
        this.showBanner('CAMERAS ALREADY DARK', 'They stay off a little longer', 1.6);
        return;
      }
      this.hack.active = true;
      this.hack.progress = 0;
      this.showBanner('HACKING CAMERAS…', 'Hold still at the terminal', 2.0);
    }
  }

  crackHit() {
    const c = this.crack;
    const needlePos = Math.sin(c.needle);
    if (Math.abs(needlePos - c.zone) <= CFG.crackGreenHalf) {
      c.hits += 1;
      this.sound.crackGood();
      this.burst(MAP.sapphireCase.x + 30, MAP.sapphireCase.y + 18, '#4fd2ff', 12);
      if (c.hits >= CFG.crackHitsNeeded) {
        this.crack.active = false;
        this.caseOpen = true;
        this.player.hasSapphire = true;
        this.score += CFG.scoreSapphire;
        this.sound.pickup();
        this.burst(MAP.sapphireCase.x + 30, MAP.sapphireCase.y + 18, '#4fd2ff', 26, 140);
        this.shake = Math.max(this.shake, 4);
        this.showBanner('STAR SAPPHIRE SECURED', 'Now get out the front door — fast', 3.0);
      } else {
        c.zone = (Math.random() * 2 - 1) * 0.55;
        c.speed = CFG.crackNeedleBase + c.hits * CFG.crackNeedleStep;
        this.showBanner(`TUMBLER ${c.hits} OF ${CFG.crackHitsNeeded} — AGAIN`, '', 1.2);
      }
    } else {
      this.alarm = Math.min(100, this.alarm + CFG.alarmCrackFail);
      this.sound.crackBad();
      this.shake = Math.max(this.shake, 6);
      this.showBanner('WRONG TIMING', `Alarm +${CFG.alarmCrackFail} — the needle keeps moving`, 1.6);
    }
  }

  update(dt, input) {
    if (this.phase !== 'playing') return;
    if (this.staging) return; // screenshot staging: actors frozen mid-pose
    this.time += dt;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.phase = 'timeout';
      this.sound.lose();
      return;
    }

    const p = this.player;
    const wasMoving = p.moving;
    if (!this.crack.active) p.update(dt, input, this.solids);
    else p.moving = false; // frozen at the case while cracking
    if (p.moving && !wasMoving) this.sound.ensure();
    if (p.moving) {
      this.beepTimer -= dt;
      if (this.beepTimer <= 0) {
        this.sound.footstep(p.sneaking);
        this.beepTimer = p.sneaking ? 0.42 : 0.3;
      }
    }

    // Guards see, suspect, chase; a full suspicion meter raises the alarm.
    let seenByGuard = false;
    let guardAlerted = false;
    for (const g of this.guards) {
      if (g.update(dt, p, this.blockers)) guardAlerted = true;
      if (g.seesPlayer) seenByGuard = true;
    }
    if (guardAlerted) {
      this.everSpotted = true;
      this.alarm = Math.min(100, this.alarm + 12);
      this.sound.alarmSting();
      this.shake = Math.max(this.shake, 7);
      this.showBanner('SPOTTED!', 'A guard raised the alarm — break line of sight', 2.2);
    }

    // Cameras sweep and lock on.
    const camerasOff = this.time < this.camerasOfflineUntil;
    let seenByCamera = false;
    for (const c of this.cameras) {
      c.update(dt, this.time, p, this.blockers, camerasOff);
      if (c.locking) seenByCamera = true;
    }
    if (seenByCamera) {
      this.everSpotted = true;
      this.beepTimer -= dt;
      if (this.beepTimer <= 0) {
        this.sound.cameraBeep();
        this.beepTimer = 0.5;
      }
    }

    // Alarm rises while anyone has eyes on the thief, bleeds off otherwise.
    if (seenByGuard) this.alarm += CFG.alarmSeenPerSec * dt;
    if (seenByCamera) this.alarm += CFG.cameraLockPerSec * dt;
    if (!seenByGuard && !seenByCamera) this.alarm -= CFG.alarmDecayPerSec * dt;
    this.alarm = Math.max(0, Math.min(100, this.alarm));
    if (this.alarm >= 100) {
      this.phase = 'lockdown';
      this.sound.lose();
      return;
    }

    // Camera hack channel: stand still at the terminal until it completes.
    if (this.hack.active) {
      if (dist(p.x, p.y, MAP.terminal.x, MAP.terminal.y) > CFG.interactRadius || p.moving) {
        this.hack.active = false;
        this.hack.progress = 0;
      } else {
        this.hack.progress += dt;
        if (this.hack.progress >= CFG.cameraHackSecs) {
          this.hack.active = false;
          this.camerasOfflineUntil = this.time + CFG.cameraOfflineSecs;
          this.cameraCooldownUntil = this.camerasOfflineUntil + CFG.cameraCooldownSecs;
          this.sound.hackDone();
          this.burst(MAP.terminal.x, MAP.terminal.y, '#35d07f', 18);
          this.showBanner('CAMERAS DARK', `All cameras offline for ${CFG.cameraOfflineSecs}s`, 2.6);
        }
      }
    }

    // Crack needle keeps sweeping while the minigame is open.
    if (this.crack.active) {
      this.crack.needle += this.crack.speed * dt;
    }

    // Auto-pickups: side loot and the keycard.
    for (const l of this.loot) {
      if (!l.taken && dist(p.x, p.y, l.x, l.y) < CFG.pickupRadius) {
        l.taken = true;
        this.score += l.points;
        this.sound.coin();
        this.burst(l.x, l.y, '#f2c14e', 12);
        this.showBanner(`+${l.points} — ${l.kind.toUpperCase()}`, '', 1.4);
      }
    }
    if (!this.keycardTaken && dist(p.x, p.y, MAP.keycard.x, MAP.keycard.y) < CFG.pickupRadius) {
      this.keycardTaken = true;
      p.hasKeycard = true;
      this.sound.keycard();
      this.burst(MAP.keycard.x, MAP.keycard.y, '#35d07f', 14);
      this.showBanner('KEYCARD LIFTED', 'The vault door will open for you now', 2.4);
    }

    // Caught: a chasing guard touches the thief.
    if (p.invuln <= 0) {
      for (const g of this.guards) {
        if (g.state === 'chase' && dist(p.x, p.y, g.x, g.y) < CFG.catchRadius + g.radius - 6) {
          this.caught();
          break;
        }
      }
    }

    // Win: sapphire in hand, standing in the front-door exit zone.
    if (p.hasSapphire && pointInRect(p.x, p.y, MAP.exit)) {
      this.win();
      return;
    }

    // Particles and shake decay.
    for (const pt of this.particles) {
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    this.shake = Math.max(0, this.shake - dt * 14);

    this.prompt = this.computePrompt();
  }

  caught() {
    const p = this.player;
    p.hearts -= 1;
    this.alarm = Math.min(100, this.alarm + CFG.alarmCaughtJump);
    this.sound.caught();
    this.shake = 10;
    this.burst(p.x, p.y, '#e05252', 22, 130);
    this.crack.active = false;
    this.hack.active = false;
    if (p.hearts <= 0) {
      this.phase = 'caught';
      this.sound.lose();
      return;
    }
    p.x = MAP.spawn.x;
    p.y = MAP.spawn.y;
    p.clickTarget = null;
    p.invuln = CFG.catchInvuln;
    for (const g of this.guards) {
      g.suspicion = 30;
      g.state = 'return';
      g.lastSeen = null;
    }
    this.showBanner(`CAUGHT — ${p.hearts} ${p.hearts === 1 ? 'LIFE' : 'LIVES'} LEFT`,
      'You were dragged back to the front door', 2.6);
  }

  win() {
    this.phase = 'win';
    const timeBonus = Math.floor(this.timeLeft) * CFG.scoreTimePerSec;
    const ghostBonus = this.everSpotted ? 0 : CFG.scoreGhost;
    this.finalScore = this.score + timeBonus + ghostBonus;
    this.finalBreakdown = [
      ['Loot', this.score],
      ['Time bonus', timeBonus],
      ['Ghost bonus', ghostBonus],
    ];
    this.sound.win();
  }

  objective() {
    const p = this.player;
    if (!p.hasKeycard) return 'Lift the keycard from the security room';
    if (!this.vaultOpen) return 'Unlock the vault door with the keycard (E)';
    if (!p.hasSapphire) return 'Crack the sapphire case (E at the case)';
    return 'Escape out the front door!';
  }

  computePrompt() {
    const p = this.player;
    if (this.crack.active) return 'E — stop the needle in the green';
    if (!this.vaultOpen && dist(p.x, p.y, 560, 150) < CFG.interactRadius + 10) {
      return p.hasKeycard ? 'E — unlock the vault door' : 'Locked — needs the keycard';
    }
    if (!this.caseOpen && this.vaultOpen &&
      dist(p.x, p.y, MAP.sapphireCase.x + 30, MAP.sapphireCase.y + 18) < CFG.interactRadius + 14) {
      return 'E — crack the case';
    }
    if (dist(p.x, p.y, MAP.terminal.x, MAP.terminal.y) < CFG.interactRadius) {
      if (this.time < this.camerasOfflineUntil) return 'Cameras dark';
      if (this.time < this.cameraCooldownUntil) return 'Terminal cooling down';
      return 'E — hack the cameras';
    }
    return null;
  }
}
