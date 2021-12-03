import { OGCMap } from "./ogc-map.js";
import { ConvenienceMap } from "./convenience-map.js";

document.addEventListener("DOMContentLoaded", function () {
  let ogcMap = new OGCMap("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
  let convMap = new ConvenienceMap("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
});

