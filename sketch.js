/*
Interactive Eye Grid Animation with Pac-Man
- Creates randomly placed pairs of eyes that track mouse movement
- Pac-Man moves around eating individual eyes
- Eyes change color based on distance from mouse cursor
- Random size variation for each pair of eyes
- Animated eyelids that smoothly open and close
- Uses HSB color mode for smooth color transitions
- Canvas automatically resizes to fill browser window
- Ensures eyes stay within canvas boundaries
*/

let blinkStates = [];
let lastBlinkTime = [];
const BLINK_INTERVAL = 3000; // Base time between blinks (milliseconds)
const BLINK_CHANCE = 0.3;   // Probability of blinking when interval is reached
const NUM_EYE_PAIRS = 20;   // Number of eye pairs to create

// Pac-Man properties
let pacman = {
  x: 0,
  y: 0,
  size: 60,
  speed: 4,
  mouthAngle: 0,
  direction: 0,
  target: null
};

// Array to track which eyes have been eaten
let eatenEyes = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB); // Switch to HSB color mode (Hue, Saturation, Brightness)
  
  // Initialize Pac-Man position
  pacman.x = width/2;
  pacman.y = height/2;
  
  // Create array to store random sizes
  randomizeSizes();
}

// Arrays to store random sizes
let eyeSizes = [];
let pupilSizes = [];
let positions = [];

// Function to generate random sizes and positions for eyes
function randomizeSizes() {
  eyeSizes = [];
  pupilSizes = [];
  positions = [];
  blinkStates = [];
  lastBlinkTime = [];
  eatenEyes = [];
  
  const maxEyeSize = 80;
  const margin = maxEyeSize/2;
  const eyeSpacing = 90;
  
  for(let i = 0; i < NUM_EYE_PAIRS; i++) {
    let x = random(margin, width - margin - eyeSpacing);
    let y = random(margin, height - margin);
    
    let overlap = false;
    for(let j = 0; j < positions.length; j++) {
      let d = dist(x, y, positions[j].x, positions[j].y);
      if(d < maxEyeSize * 2) {
        overlap = true;
        break;
      }
    }
    
    if(!overlap) {
      let eyeSize = random(40, maxEyeSize);
      let pupilSize = eyeSize * 0.4;
      
      positions.push({x: x, y: y});
      eyeSizes.push(eyeSize);
      pupilSizes.push(pupilSize);
      blinkStates.push(0);
      lastBlinkTime.push(millis() + random(-BLINK_INTERVAL, BLINK_INTERVAL));
      eatenEyes.push({ left: false, right: false }); // Track eaten state for each eye
    } else {
      i--;
    }
  }
}

function draw() {
  background(0);
  
  let eyeSpacing = 90;
  
  // Update Pac-Man target and movement
  updatePacMan();
  
  // Draw eyes
  for(let i = 0; i < positions.length; i++) {
    let x = positions[i].x;
    let y = positions[i].y;
    let currentEyeSize = eyeSizes[i];
    let currentPupilSize = pupilSizes[i];
    
    if (millis() - lastBlinkTime[i] > BLINK_INTERVAL) {
      if (random() < BLINK_CHANCE) {
        blinkStates[i] = 1;
      }
      lastBlinkTime[i] = millis();
    }
    
    if (blinkStates[i] > 0) {
      blinkStates[i] -= 0.1;
      if (blinkStates[i] < 0) blinkStates[i] = 0;
    }
    
    let centerX = x + eyeSpacing/2;
    let centerY = y;
    let d = dist(mouseX, mouseY, centerX, centerY);
    
    let hue = map(d, 0, 500, 0, 360);
    let saturation = map(d, 0, 300, 100, 50);
    let brightness = map(d, 0, 200, 100, 70);
    
    let eyeColor = color(hue, saturation, brightness);
    
    // Draw eyes only if they haven't been eaten
    if (!eatenEyes[i].left) {
      let leftEyeX = x;
      let leftEyeY = y;
      let leftAngle = atan2(mouseY - leftEyeY, mouseX - leftEyeX);
      let leftPupilX = leftEyeX + cos(leftAngle) * (currentEyeSize/4);
      let leftPupilY = leftEyeY + sin(leftAngle) * (currentEyeSize/4);
      drawEye(leftEyeX, leftEyeY, currentEyeSize, leftPupilX, leftPupilY, currentPupilSize, eyeColor, blinkStates[i]);
    }
    
    if (!eatenEyes[i].right) {
      let rightEyeX = x + eyeSpacing;
      let rightEyeY = y;
      let rightAngle = atan2(mouseY - rightEyeY, mouseX - rightEyeX);
      let rightPupilX = rightEyeX + cos(rightAngle) * (currentEyeSize/4);
      let rightPupilY = rightEyeY + sin(rightAngle) * (currentEyeSize/4);
      drawEye(rightEyeX, rightEyeY, currentEyeSize, rightPupilX, rightPupilY, currentPupilSize, eyeColor, blinkStates[i]);
    }
  }
  
  // Draw Pac-Man
  drawPacMan();
}

function updatePacMan() {
  // Animate mouth
  pacman.mouthAngle = map(sin(frameCount * 0.2), -1, 1, 0.1, 0.5);
  
  // Find nearest uneaten eye if no target
  if (!pacman.target) {
    let minDist = Infinity;
    let allEyesEaten = true;  // Flag to check if all eyes are eaten
    
    for(let i = 0; i < positions.length; i++) {
      // Check left eye
      if (!eatenEyes[i].left) {
        allEyesEaten = false;  // Found an uneaten eye
        let d = dist(pacman.x, pacman.y, positions[i].x, positions[i].y);
        if (d < minDist) {
          minDist = d;
          pacman.target = { index: i, side: 'left' };
        }
      }
      // Check right eye
      if (!eatenEyes[i].right) {
        allEyesEaten = false;  // Found an uneaten eye
        let d = dist(pacman.x, pacman.y, positions[i].x + 90, positions[i].y);
        if (d < minDist) {
          minDist = d;
          pacman.target = { index: i, side: 'right' };
        }
      }
    }
    
    // If all eyes are eaten, regenerate them
    if (allEyesEaten) {
      randomizeSizes();
    }
  }
  
  // Move toward target
  if (pacman.target) {
    let targetX = positions[pacman.target.index].x + (pacman.target.side === 'right' ? 90 : 0);
    let targetY = positions[pacman.target.index].y;
    
    let angle = atan2(targetY - pacman.y, targetX - pacman.x);
    pacman.direction = angle;
    pacman.x += cos(angle) * pacman.speed;
    pacman.y += sin(angle) * pacman.speed;
    
    // Check if reached target
    let d = dist(pacman.x, pacman.y, targetX, targetY);
    if (d < pacman.size/2) {
      // Eat the eye
      eatenEyes[pacman.target.index][pacman.target.side] = true;
      pacman.target = null;
    }
  }
}

function drawPacMan() {
  push();
  translate(pacman.x, pacman.y);
  rotate(pacman.direction);
  
  colorMode(RGB);  // Temporarily switch to RGB mode
  fill(255, 255, 0);  // Yellow in RGB
  arc(0, 0, pacman.size, pacman.size, 
      pacman.mouthAngle, TWO_PI - pacman.mouthAngle);
  colorMode(HSB);  // Switch back to HSB
  pop();
}

function drawEye(eyeX, eyeY, eyeSize, pupilX, pupilY, pupilSize, eyeColor, blinkState) {
  fill(eyeColor);
  ellipse(eyeX, eyeY, eyeSize, eyeSize);
  
  fill(0);
  ellipse(pupilX, pupilY, pupilSize, pupilSize);
  
  fill(0);
  let lidHeight = map(blinkState, 0, 1, 0, eyeSize);
  rect(eyeX - eyeSize/2, eyeY - eyeSize/2, eyeSize, lidHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  randomizeSizes();
}

function mousePressed() {
  randomizeSizes();
}
