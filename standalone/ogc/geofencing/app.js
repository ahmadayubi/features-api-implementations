let featuresCollection = [];
let SCREENW = 1000, SCREENH = 1000;
let playerPos;
let zoom = 8;
let loading = true;

let initialPosition;

let BLACK, WHITE, RED, GREEN, YELLOW;

let synthCheckbox;
let thumbnailCheckbox;
let cautionSlider, warningSlider, limitSlider;
//let apiURL, resetButton;

// The following section was formally used to convert from pixel to longitude, latitude
// let RADIUS = 6378137;
// let RADIUS_M = 6356752.314245179;
// var wgs84 = new proj4.Proj('EPSG:4326');
// var meters = new proj4.Proj('EPSG:3857');


let url = "https://apitestbed.geonovum.nl/pygeoapi/collections/dutch_windmills/items?limit=150";
//let url = "https://demo.pygeoapi.io/master/collections/lakes/items";

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

  cautionSlider = createSlider(0, 150, 10, 1);
  cautionSlider.position(10, SCREENH - 20);
  cautionSlider.style('width', '80px');

  warningSlider = createSlider(0, 100, 5, 1);
  warningSlider.position(10, SCREENH - 40);
  warningSlider.style('width', '80px');

  limitSlider = createSlider(0, 150, 10, 1);
  limitSlider.position(10, SCREENH - 60);
  limitSlider.style('width', '80px');

  synthCheckbox = createCheckbox("", false)
  synthCheckbox.position(10, SCREENH - 85);

  thumbnailCheckbox = createCheckbox("", false)
  thumbnailCheckbox.position(10, SCREENH - 105);

  // apiURL = createInput();
  // apiURL.position(20, SCREENH - 80);

  // resetButton = createButton('Get New Features');
  // resetButton.position(apiURL.x + apiURL.width, SCREENH - 80);
  // resetButton.mousePressed(refresh);

  httpGet(url, 'json', false, (response) => {
    featuresCollection = response.features;
    loading = false;
  });
}

// function refresh() {
//   if (apiURL.value() !== "") {
//     url = apiURL.value();
//     setup();
//   }
// }

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
      if (feature.geometry.type === "Point") {
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
      let name = feature.properties.NAAM ?? feature.properties.name;
      if (dist <= 0.1) {
        collided = true;
      } else if (dist <= warningSlider.value()) {
        fill(RED);
        text(`Very Close To ${name}`, SCREENW / 2, warnings * 20);
        showDetails(feature.properties.THUMBNAIL, name, thumbnailCheckbox.checked(), synthCheckbox.checked());
        new Line(playerPixel, featurePixelCenter, dist, RED).draw();
        warnings++;
      } else if (dist <= cautionSlider.value()) {
        fill(BLACK);
        try {
          text(`Approading ${name}`, SCREENW / 2, warnings * 20);
        } catch (e) {
          text(`Approading Feature.`, SCREENW / 2, warnings * 20);
        }
        new Line(playerPixel, featurePixelCenter, dist, color(238, 159, 82)).draw();
        warnings++;
      } else {
        hideDetails(feature.properties.THUMBNAIL);
      }
    }

    fill(BLACK);
    strokeWeight(4);
    circle(SCREENW / 2, SCREENH / 2, 20);

    if (collided) {
      background(RED);
      fill(WHITE);
      text("You Are Trespassing.", SCREENW / 2, SCREENH / 2);
    }
  }
  fill(BLACK);
  textSize(15);

  textAlign(LEFT, BASELINE);
  text(`Synthesize Speech`, 30, SCREENH - 70);
  text(`Show Thumbnail`, 30, SCREENH - 90);
  text(`(${limitSlider.value()}) Number of Windmills`, 100, SCREENH - 50);
  text(`(${cautionSlider.value()} km) Close Distance Tolerance`, 100, SCREENH - 10);
  text(`(${warningSlider.value()} km) Very Close Distance Tolerance`, 100, SCREENH - 30);
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

  // let x = (180 + point[0]) * SCREENW / 360;
  // let latRad = point[1] * Math.PI / 180;
  // let mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
  // let y = (SCREENH / 2) - (SCREENW * mercN / (2 * Math.PI));

  return { x: x, y: y };
}

/**
 * This function was used to originally convert from pixel to longitude, latitude
 * leveraging the open source community I used leaflet's implementation for a similar
 * function, this unfortunately didn't work correctly for my case, I had to implement
 * a custom solution found by finding the inverse the the longitude, latitude -> pixel point function
 * @param p - the pixel point object
 */
/*function pixelToLngLat(p) {
  let x = (p.x + xOffset);
  let y = (p.y + yOffset);
  let lng = x * 360 / SCREENW - 180;
  let N = Math.atan(Math.pow(Math.E, (-2 * Math.PI * (y - (SCREENH / 2))) / SCREENW)) - (Math.PI / 4);
  let lat = 360 * N / Math.PI;

  return proj4.toPoint([lng, lat]);


  let lat = (Math.atan(Math.exp((p.y + yOffset * zOffset))) * 2 - Math.PI / 2) * 180 / Math.PI;
  let lng = ((p.x + xOffset * zOffset)) * 180 / Math.PI;

  LEAFLETS IMPLEMENTATION
  var d = 180 / Math.PI,
    r = RADIUS,
    tmp = RADIUS_M / r,
    e = Math.sqrt(1 - tmp * tmp),
    ts = Math.exp(-(p.y + yOffset * zOffset) / r),
    phi = Math.PI / 2 - 2 * Math.atan(ts);

  for (var i = 0, dphi = 0.1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
    con = e * Math.sin(phi);
    con = Math.pow((1 - con) / (1 + con), e / 2);
    dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
    phi += dphi;
  }

  return new proj4.Point(phi * d, (p.x + xOffset * zOffset) * d / r);
}*/

/*function xyToLngLat(p) {
  let lat = (Math.atan(Math.exp(((p.y + yOffset) * zOffset) / RADIUS)) * 2 - Math.PI / 2) * 180 / Math.PI;
  let lng = (((p.x + xOffset) * zOffset)) * 180 / Math.PI;
  return { x: lng, y: lat };
}*/

// Below are two functions previously used but were later not required
/*function convertToPixel(loc, isPoint) {

  let points = [];

  if (isPoint) {
    let p = LngLatToPixel(loc);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
    points.push(p)
  } else {
    for (section of loc) {
      for (coords of section) {
        let p = LngLatToPixel(coords);
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
        points.push(p);
      }
    }
  }
  return points;
}*/

/*function appylyMovement(points, zoomed) {
  let mix = Number.POSITIVE_INFINITY,
    max = Number.NEGATIVE_INFINITY,
    miy = Number.POSITIVE_INFINITY,
    may = Number.NEGATIVE_INFINITY;

  for (point of points) {
    if (zoomed) {
      point.x = (point.x * zoom) + (SCREENW / 2) * (1 - zoom)
      point.y = (point.y * zoom) + (SCREENH / 2) * (1 - zoom)
    } else {
      point.x = point.x + xVel;
      point.y = point.y + yVel;
    }
    mix = Math.min(mix, point.x);
    miy = Math.min(miy, point.y);
    max = Math.max(max, point.x);
    may = Math.max(may, point.y);
  }
  return { x: (mix + max) / 2, y: (miy + may) / 2 };
}*/