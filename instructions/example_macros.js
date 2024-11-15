// Super Strength - Burst - Affliction
new Sequence()
    .superStrengthEffect()
    .castSlam()
    .burstSlam()
    .play();

await new Promise(resolve => setTimeout(resolve, 2000));

let sequence = new Sequence();
let targets = GameHelper.targetedTokens;
for (const target of targets) {
    sequence.superStrengthEffect()
        .affectAffliction({ affected: target })
        .play();
}

// ------------------------------------------------------------------------------
// Super Strength - Burst - Damage
new Sequence()
    .superStrengthEffect()
    .castSlam()
    .burstSlam()
    .play();

await new Promise(resolve => setTimeout(resolve, 2000));

sequence = new Sequence();
targets = GameHelper.targetedTokens;
for (const target of targets) {
    sequence.superStrengthEffect()
        .affectDamage({ affected: target, persist: false })
        .play();
}

// ------------------------------------------------------------------------------
// Super Strength - Burst - Dazzle
const template = canvas.templates.placeables[canvas.templates.placeables.length - 1];

new Sequence()
    .superStrengthEffect()
    .cast()
    .pause(200)
    .burstDazzle()
    .play();

targets = GameHelper.targets;
for (let t of targets) {
    new Sequence()
        .superStrengthEffect()
        .affectDamage({ affected: t })
        .play();
}

const affected = canvas.templates.placeables[0];
const coneStart = { x: affected.data.x, y: affected.data.y };
let loc = { x: 4950, y: 3000 };

let s = new Sequence()
    .superStrengthEffect()
    .cast()
    .projectToCone()
    .pause(400)
    .cone()
    .play();

await new Promise(resolve => setTimeout(resolve, 800));
for (let target of GameHelper.targets) {
    new Sequence()
        .superStrengthEffect()
        .affectAffliction({ affected: target })
        .pause(400)
        .play();
}

// ------------------------------------------------------------------------------
// Super Strength - Cone - Affliction
const coneAffected = canvas.templates.placeables[0];
const coneStartPoint = { x: coneAffected.data.x, y: coneAffected.data.y };
loc = { x: 4950, y: 3000 };

s = new Sequence()
    .superStrengthEffect()
    .cast()
    .projectToCone()
    .pause(400)
    .cone()
    .play();

await new Promise(resolve => setTimeout(resolve, 800));

for (let target of GameHelper.targets) {
    new Sequence()
        .superStrengthEffect()
        .affectAffliction({ affected: target })
        .pause(400)
        .play();
}

// ------------------------------------------------------------------------------
// Super Strength - Line - Affliction
s = new Sequence()
    .superStrengthEffect()
    .cast()
    .projectToCone()
    .pause(400)
    .line()
    .play();

await new Promise(resolve => setTimeout(resolve, 800));

for (let target of GameHelper.targets) {
    new Sequence()
        .superStrengthEffect()
        .affectAffliction({ affected: target })
        .pause(400)
        .play();
}

// ------------------------------------------------------------------------------
// Super Strength - Melee - Damage
const selectedTargets = Array.from(game.user.targets);
for (let target of selectedTargets) {
    new Sequence()
        .superStrengthEffect()
        .meleeCast({ affected: target })
        .affectDamage({ affected: target })
        .play();
}

// ------------------------------------------------------------------------------
// Insect - Personal - Regeneration
new Sequence()
    .insectEffect()
    .affectHealing()
    .play();
