let synth = window.speechSynthesis;

/**
 * Function that implements the Haversine formula to calculate distance
 * @param lon1
 * @param lat1
 * @param lon2
 * @param lat2
 * @returns {number} - distance in terms of kilometers
 */
function getDistanceFromLatLonInKm(lon1, lat1, lon2, lat2) {
  function toRad(deg) {
    return deg * (Math.PI / 180);
  }
  let R = 6356.752314245179;
  let la1 = toRad(lat1), lo1 = toRad(lon1), la2 = toRad(lat2), lo2 = toRad(lon2);
  let dLat = la2 - la1, dLon = lo2 - lo1;
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return d;
}

/**
 * Allows additional components to be displayed on the screen
 * @param url - url of the thumbnail
 * @param name - name of the feature
 * @param showImg - boolean on whether to show thumbnail
 * @param speak - boolean on whether to synthesize text
 */
function showDetails(url, name = "Feature", showImg = false, speak = false) {
  if (document.getElementById(url)) return;

  let img = document.createElement("img");
  img.id = url;
  if (showImg) {
    img.style.visibility = "visible";
    img.style.width = 50;
    img.src = url;
  }
  document.getElementById("info").appendChild(img);

  if (speak) {
    var text = new SpeechSynthesisUtterance(`You are very close to ${name}`);
    synth.speak(text);
  }
}

/**
 * Removes thumbnail once user is out of range
 * @param url - url of the thumbnail
 */
function hideDetails(url) {
  let img = document.getElementById(url);
  if (img) img.parentElement.removeChild(img);
}