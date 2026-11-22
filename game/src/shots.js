// shots.js — screenshot scenes (?scene=cover|spotted|win|title).
// Each preset is a real game state: the cover shows the full heist in one
// frame (room, thief, guard cones, cameras, loot, alarm meter), spotted shows
// a hunt at high alarm, win shows the getaway screen, title the title screen.

export function applyScene(state, scene) {
  if (scene === 'cover') {
    // Mid-job: thief on the carpet below the sapphire case, one gold already
    // lifted, Mara's cone sweeping past, a camera beam crossing the room.
    state.phase = 'playing';
    state.player.x = 470;
    state.player.y = 400;
    state.player.facing = -Math.PI / 2;
    state.alarm = 34;
    state.elapsed = 47;
    state.score = 150;
    state.loot['gold-west'] = true;
    state.loot.sapphire = false;
    state.guards[0].x = 200;
    state.guards[0].y = 320;
    state.guards[0].heading = Math.PI / 2;
    state.guards[1].x = 560;
    state.guards[1].y = 210;
    state.guards[1].heading = Math.PI;
    state.guards[1].suspicion = 42;
    state.guards[1].state = 'suspicious';
    state.guards[2].x = 780;
    state.guards[2].y = 420;
    state.guards[2].heading = -Math.PI / 2;
    state.cameras[0].clock = 2.1;
    state.cameras[0].angle = Math.PI / 2 + 0.55;
    state.cameras[1].clock = 0.6;
    state.cameras[1].angle = Math.PI - 0.4;
  } else if (scene === 'spotted') {
    // The hunt: Mara spotted the thief by the east desk, alarm nearly full.
    state.phase = 'playing';
    state.player.x = 640;
    state.player.y = 330;
    state.player.facing = Math.PI;
    state.alarm = 76;
    state.elapsed = 96;
    state.score = 300;
    state.loot['gold-west'] = true;
    state.loot.intel = true;
    state.guards[1].x = 560;
    state.guards[1].y = 300;
    state.guards[1].heading = Math.atan2(330 - 300, 640 - 560);
    state.guards[1].suspicion = 100;
    state.guards[1].state = 'hunt';
    state.guards[1].lastSeen = { x: 640, y: 330 };
    state.guards[1].huntTimer = 4.5;
    state.guards[0].x = 150;
    state.guards[0].y = 250;
    state.guards[0].heading = 0;
    state.guards[2].x = 830;
    state.guards[2].y = 250;
    state.guards[2].heading = Math.PI;
    state.cameras[0].clock = 4.0;
    state.cameras[0].angle = Math.PI / 2 - 0.6;
    state.cameras[1].clock = 1.2;
    state.cameras[1].angle = Math.PI + 0.3;
    state.cameras[1].locked = true;
  } else if (scene === 'win') {
    state.phase = 'win';
    state.alarm = 58;
    state.elapsed = 132;
    state.score = 500 + 150 + 150 + Math.max(0, Math.round((240 - 132) * 2));
    state.loot.sapphire = true;
    state.loot['gold-west'] = true;
    state.loot['gold-east'] = true;
    state.loot.intel = true;
    state.player.x = 880;
    state.player.y = 520;
  } else {
    // title (and anything unknown): the title screen over the live hall.
    state.phase = 'title';
    state.startFlash = true;
  }
}
