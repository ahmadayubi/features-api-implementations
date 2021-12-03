let featuresCollection = [];
let SCREENW = 1000, SCREENH = 1000;
let playerPos;
let zoom = 8;
let loading = true;

let initialPosition;

let BLACK, WHITE, RED, GREEN, YELLOW;

let synthCheckbox;
let thumbnailCheckbox;
let warningSlider, limitSlider;



let url = "https://api.luchtmeetnet.nl/open_api/";

let jetFont;

/**
 * preload is the function used by p5.js to load assets before rendering
 */
function preload() {
  jetFont = loadFont('assets/jet.ttf');
}

/**
 * setup is the function ran during canvas creation
 */
function setup() {
  BLACK = color(40, 42, 54);
  WHITE = color(248, 248, 242);
  RED = color(234, 124, 107);
  GREEN = color(78, 243, 107);
  YELLOW = color(223, 231, 131);

  SCREENH = windowHeight - 20;
  SCREENW = windowWidth - 20;

  playerPos = { x: 5, y: 52.4 };
  initialPosition = LngLatToPixel([0, 0]);

  createCanvas(SCREENW, SCREENH);
  textFont(jetFont);
  textSize(20);
  textAlign(CENTER, CENTER);

  warningSlider = createSlider(0, 100, 10, 1);
  warningSlider.position(10, SCREENH - 40);
  warningSlider.style('width', '80px');

  limitSlider = createSlider(0, 150, 10, 1);
  limitSlider.position(10, SCREENH - 60);
  limitSlider.style('width', '80px');

  synthCheckbox = createCheckbox("", false)
  synthCheckbox.position(10, SCREENH - 85);

  thumbnailCheckbox = createCheckbox("", false)
  thumbnailCheckbox.position(10, SCREENH - 105);
  httpGet(url + "stations?page=1", 'json', false, (response) => {
    let totalPages = response.pagination.last_page;

    for(let s of response.data){
      appendStationInfo(s.number);
    }

    // Commented out due to server overload, prevents getting all features
    // for(let i = 2; i <= totalPages; i++) {
    //   httpGet(url + `stations?page=${i}`, 'json', false, (nextResp) => {
    //     for(let s of nextResp.data){
    //       appendStationInfo(s.number);
    //     }
    //   });
    // }
    loading = false;
  });
}

function appendStationInfo(name) {
  httpGet(url + `stations/${name}`, 'json', false, (response) => {
    if(response.data.components.includes("NO2"))
      featuresCollection.push({name:name, ...response.data});
  });
}

/**
 * draw is the function that runs on each frame
 */
function draw() {
  textSize(20);
  noStroke();
  background(WHITE);
  if (loading) {
    fill(BLACK);
    text("Loading Data...", SCREENW / 2, SCREENH / 2);
  } else {
    if (keyIsDown(LEFT_ARROW)) {
      playerPos.x -= (1 / Math.pow(2, zoom));
    }
    if (keyIsDown(RIGHT_ARROW)) {
      playerPos.x += (1 / Math.pow(2, zoom));
    }
    if (keyIsDown(DOWN_ARROW)) {
      playerPos.y -= (1 / Math.pow(2, zoom));
    }
    if (keyIsDown(UP_ARROW)) {
      playerPos.y += (1 / Math.pow(2, zoom));
    }
    if (keyIsDown(88)) {
      zoom += 0.5;
    }
    if (keyIsDown(90)) {
      zoom -= 0.5;
    }

    let playerPixel = { x: SCREENW / 2, y: SCREENH / 2 };
    let playerReadPixel = LngLatToPixel([playerPos.x, playerPos.y]);

    let warnings = 1;
    let collided = false;
    for (feature of featuresCollection.slice(0, limitSlider.value())) {
      let featurePixelCenter;
      if (feature.geometry.type === "point") { // The API doesn't conform perfectly to GEOJson, uses point instead of Point
        let pixelPoint = LngLatToPixel(feature.geometry.coordinates, playerReadPixel, initialPosition);
        featurePixelCenter = pixelPoint;
        fill(GREEN);
        circle(pixelPoint.x, pixelPoint.y, 20);
      } else {
        fill(GREEN);
        beginShape();
        for (coords of feature.geometry.coordinates) {
          for (coord of coords) {
            let c = LngLatToPixel(coord, playerReadPixel, initialPosition);
            vertex(c.x, c.y);
            featurePixelCenter = c;
          }
        }
        endShape(CLOSE);
      }

      let dist = getDistanceFromLatLonInKm(playerPos.x, playerPos.y, feature.geometry.coordinates[0], feature.geometry.coordinates[1]);
      let name = feature.name;
      if (dist <= warningSlider.value()) {
        fill(BLACK);
        try {
          text(`Approading ${name}`, SCREENW / 2, warnings * 20);
        } catch (e) {
          text(`Approading Feature.`, SCREENW / 2, warnings * 20);
        }
        new Line(playerPixel, featurePixelCenter, dist, color(238, 159, 82)).draw();
        warnings++;
        showDetails(name, thumbnailCheckbox.checked(), synthCheckbox.checked());
      } else {
        hideDetails(name);
      }
    }

    fill(BLACK);
    strokeWeight(4);
    circle(SCREENW / 2, SCREENH / 2, 20);
  }
  fill(BLACK);
  textSize(15);

  textAlign(LEFT, BASELINE);
  text(`Synthesize Speech`, 30, SCREENH - 70);
  text(`Show Measurements`, 30, SCREENH - 90);
  text(`(${limitSlider.value()}) Number of Stations`, 100, SCREENH - 50);
  text(`(${warningSlider.value()} km) Close Distance Tolerance`, 100, SCREENH - 30);
  // text("Request New Features \nusing items from an OGC Features API", 180, SCREENH - 100);
  textAlign(CENTER, CENTER);

  text("Controls", SCREENW - 130, SCREENH - 140);
  text("LEFT ARROW - move left", SCREENW - 130, SCREENH - 120);
  text("RIGHT ARROW - move right", SCREENW - 130, SCREENH - 100);
  text("UP ARROW - move up", SCREENW - 130, SCREENH - 80);
  text("DOWN ARROW - move down", SCREENW - 130, SCREENH - 60);
  text("x - zoom in", SCREENW - 130, SCREENH - 40);
  text("z - zoom out", SCREENW - 130, SCREENH - 20);
}

/**
 * This function converts Longitude, Latitude points to pixel points
 * @param point - Longitude, latitude point object
 * @param offset - offset object, used to track movement later on
 * @param initial - initial object, used to center the objects when first rendering points
 * @returns {{x: number, y: number}}
 * @constructor
 */
function LngLatToPixel(point, offset = { x: 0, y: 0 }, initial = { x: 0, y: 0 }) {
  let n = Math.pow(2.0, zoom);
  let x = (((180 + point[0]) * SCREENW / 360) * n) + (initial.x - offset.x) + (SCREENW / 2) * (1 - n);
  let latRad = point[1] * Math.PI / 180;
  let mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
  let y = (((SCREENH / 2) - (SCREENW * mercN / (2 * Math.PI))) * n) + (initial.y - offset.y) + (SCREENH / 2) * (1 - n);

  return { x: x, y: y };
}