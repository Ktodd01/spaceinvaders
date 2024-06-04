World.frameRate = 40;
var score = 0;
var highscore = 0;
var mode = 0;
var speed = 0;
var wave = 1;
var powerUpActive = false;
var rapidFireActive = false;
var powerUpEndTime = 0;
var rapidFireEndTime = 0;
var comboMultiplier = 1;
var comboTimeout = 2000;
var lastHitTime = 0;

var enemies = createGroup();
var enemyLaserGroup = createGroup();
var enemyTypes = ["enemy", "strong_enemy", "fast_enemy", "shooting_enemy"];
for (var i = 0; i < 12; i++) {
  var x = (i % 6) * 50 + 50;
  var y = Math.floor(i / 6) * 35 + 50;
  var enemy = createSprite(x, y);
  enemy.setAnimation(random(enemyTypes));
  enemy.scale = 0.2;
  enemy.health = enemy.animation.name === "strong_enemy" ? 3 : 1;
  enemy.speed = enemy.animation.name === "fast_enemy" ? 2 : 1;
  enemies.add(enemy);
}

var boom = createSprite(200, 200);
boom.setAnimation("dead");
boom.scale = 4;
boom.visible = false;

var player = createSprite(200, 380);
player.setAnimation("player_retro");
player.scale = 4;

var laser = createSprite(200, -20);
laser.setAnimation("laser");

var powerUps = createGroup();
createPowerUp();

createEdgeSprites();

function draw() {
  playerMove();
  playerShoot();
  enemyFunction();
  powerUpFunction();
  showScore();
  sideWalls();
  modes();
  gameOver();
  drawSprites();
}

function playerMove() {
  if (keyDown("left")) {
    player.x -= 5;
  }
  if (keyDown("right")) {
    player.x += 5;
  }
}

function playerShoot() {
  if (keyDown("up") && (laser.y < -10 || rapidFireActive)) {
    laser.x = player.x;
    laser.y = player.y - 20;
    laser.velocityY = -15;
    playSound("sound://category_retro/retro_game_enemy_spawn_10.mp3", false);
  }
}

function enemyFunction() {
  enemies.overlap(laser, function(enemy) {
    if (enemy.visible) {
      boom.x = enemy.x;
      boom.y = enemy.y;
      boom.visible = true;
      enemy.health -= 1;
      laser.y = -20;
      score += 1 * comboMultiplier;
      playSound("sound://category_projectile/retro_game_weapon_laser_shot_single.mp3", false);
      if (enemy.health <= 0) {
        enemy.visible = false;
        enemy.velocityX = 0;
      }
      // Update combo multiplier
      if (millis() - lastHitTime < comboTimeout) {
        comboMultiplier += 1;
      } else {
        comboMultiplier = 1;
      }
      lastHitTime = millis();
    }
  });

  enemies.forEach(function(enemy) {
    if (mode == 1) {
      if (wave % 2 == 0) {
        // Zigzag movement
        enemy.velocityX = speed * enemy.speed * Math.sin(frameCount / 10);
      } else {
        // Circular movement
        enemy.velocityX = speed * enemy.speed * Math.cos(frameCount / 10);
        enemy.velocityY = speed * enemy.speed * Math.sin(frameCount / 10);
      }
      if (enemy.isTouching(rightEdge) || enemy.isTouching(leftEdge)) {
        enemy.velocityX *= -1;
        enemy.y += 20;
      }

      // Shooting behavior for shooting enemies
      if (enemy.animation.name === "shooting_enemy" && frameCount % 100 === 0) {
        var enemyLaser = createSprite(enemy.x, enemy.y);
        enemyLaser.setAnimation("enemy_laser");
        enemyLaser.velocityY = 5;
        enemyLaserGroup.add(enemyLaser);
      }
    }
  });

  // Remove enemy lasers when they go off screen
  enemyLaserGroup.forEach(function(laser) {
    if (laser.y > height) {
      laser.remove();
    }
  });

  if (enemies.countActive() === 0 && mode == 1) {
    resetEnemies();
    speed += 1;
    enemies.setVelocityXEach(speed);
    wave += 1;
  }
}

function resetEnemies() {
  enemies.clear();
  for (var i = 0; i < 12 + wave; i++) {
    var x = (i % 6) * 50 + 50;
    var y = Math.floor(i / 6) * 35 + 50;
    var enemy = createSprite(x, y);
    enemy.setAnimation(random(enemyTypes));
    enemy.scale = 0.2;
    enemy.health = enemy.animation.name === "strong_enemy" ? 3 : 1;
    enemy.speed = enemy.animation.name === "fast_enemy" ? 2 : 1;
    enemies.add(enemy);
  }
  createPowerUp();
}

function createPowerUp() {
  if (random(1) < 0.5) {
    var powerUp = createSprite(random(50, 350), random(50, 350));
    powerUp.setAnimation(random(["invincibility", "rapid_fire"]));
    powerUp.scale = 0.3;
    powerUps.add(powerUp);
  }
}

function powerUpFunction() {
  if (powerUpActive && millis() > powerUpEndTime) {
    powerUpActive = false;
    player.setAnimation("player_retro");
  }
  if (rapidFireActive && millis() > rapidFireEndTime) {
    rapidFireActive = false;
  }

  player.overlap(powerUps, function(player, powerUp) {
    if (powerUp.getAnimationLabel() === "invincibility") {
      powerUpActive = true;
      powerUpEndTime = millis() + 10000; // 10 seconds of invincibility
      player.setAnimation("player_invincible");
    } else if (powerUp.getAnimationLabel() === "rapid_fire") {
      rapidFireActive = true;
      rapidFireEndTime = millis() + 10000; // 10 seconds of rapid fire
    }
    powerUp.remove();
    playSound("sound://category_retro/retro_game_power_up.mp3", false);

    // Add visual effect for power-up collection
    var powerUpEffect = createSprite(player.x, player.y);
    powerUpEffect.setAnimation("power_up_effect");
    powerUpEffect.lifetime = 20;
  });
}

function showScore() {
  if (mode == 1) {
    background("black");
    fill("white");
    textSize(20);
    text("Score: " + score, 10, 20);
    text("High Score: " + highscore, 120, 20);
    text("Wave: " + wave, 300, 20);
    text("Combo: x" + comboMultiplier, 200, 20);

    // Display power-up status
    if (powerUpActive) {
      fill("yellow");
      textSize(15);
      text("Invincibility", 10, 40);
    }
    if (rapidFireActive) {
      fill("red");
      textSize(15);
      text("Rapid Fire", 10, 60);
    }
  }
}

function sideWalls() {
  player.collide(leftEdge);
  player.collide(rightEdge);
}

function modes() {
  if (mode == 0) {
    stopSound("Space-Invaders---Space-Invaders.mp3");
    background("black");
    textSize(40);
    fill("white");
    text("SPACE INVADERS", 20, 100);
    textSize(35);
    text("Press 1 to Play", 80, 200);
    text("Press 2 for Instructions", 20, 250);
    player.visible = false;
    enemies.setVisibleEach(false);
    laser.visible = false;
    score = 0;
    wave = 1;
  }
  if (keyWentDown("1") && mode == 0) {
    mode = 1;
    player.visible = true;
    enemies.setVisibleEach(true);
    laser.visible = true;
    speed = 1;
    enemies.setVelocityXEach(speed);
    playSound("Space-Invaders---Space-Invaders.mp3", true);
  }
  if (keyWentDown("0")) {
    mode = 0;
    resetEnemies();
    enemies.setVelocityXEach(0);
  }
  if (keyWentDown("2") && mode == 0) {
    mode = 2;
    background("black");
    textSize(50);
    fill("white");
    text("Instructions", 30, 100);
    textSize(20);
    text("Press 0 to return to menu", 20, 30);
    text("Left/Right to move and Up to shoot", 20, 150);
    text("Killing an enemy is 1 point", 20, 180);
    text("Game over if an enemy reaches ground", 20, 210);
    text("Every wave enemy speed increases", 20, 240);
  }
}

function gameOver() {
  enemies.forEach(function(enemy) {
    if (enemy.y > 400) {
      mode = 3;
      stopSound("Space-Invaders---Space-Invaders.mp3");
      if (score > highscore) {
        highscore = score;
      }
      background("black");
      fill("white");
      textSize(40);
      text("Game Over", 100, 200);
      textSize(20);
      text("Score: " + score, 170, 250);
      text("High Score: " + highscore, 170, 270);
      text("Wave: " + wave, 170, 300);
      text("Press 0 to return to menu", 90, 330);
      player.visible = false;
      enemies.setVisibleEach(false);
      laser.visible = false;
    }
  });
}
