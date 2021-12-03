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
 * @param name - name of the feature
 * @param showChart
 * @param speak - boolean on whether to synthesize text
 */
function showDetails(name = "Feature", showChart = false, speak = false) {
  if (document.getElementById(name)) return;

  let div = document.createElement("div");
  div.id = name;
  if (showChart) {
    fetch(`https://api.luchtmeetnet.nl/open_api/measurements?station_number=${name}&formula=NO2`, {method: 'GET'})
      .then(nextResp => nextResp.json())
      .then(nextJson => {
        div.appendChild(generateChart(nextJson, name));
      });
  }
  document.getElementById("info").appendChild(div);

  if (speak) {
    let text = new SpeechSynthesisUtterance(`You are very close to ${name}`);
    synth.speak(text);
  }
}

/**
 * Removes thumbnail once user is out of range
 * @param name
 */
function hideDetails(name) {
  let div = document.getElementById(name);
  if (div) div.parentElement.removeChild(div);
}

function generateChart(data, station) {
  let ctx = document.createElement("canvas");
  let dctx = ctx.getContext("2d");

  let fdata = formatData(data);
  let c = new Chart(ctx, {
    type: 'line',
    data: {
      labels: fdata.labels,
      datasets: [{
        label: `NO2 Measurements`,
        data: fdata.data,
        pointBackgroundColor: fdata.colors,
        lineTension: 0,
        borderWidth: 1
      }]
    },
    maintainAspectRatio: false,
    options: {
      responsive:true,
      scales: {
        x: [{
          type: 'time',
          display: true,
          scaleLabel: {
            display: true,
            labelString: "Date",
          }
        }],
        y: [{
          ticks: {
            beginAtZero: true,
          },
          display: true,
          scaleLabel: {
            display: true,
            labelString: "NO2 Measurements",
          }
        }]
      },
      plugins: {
        title: {
          display: true,
          text: `Station ${station}`,
          padding: {
            top: 10,
            bottom: 30
          }
        }
      }
    }
  });

  return ctx;
}

function formatData(data){
  let ts = {labels: [], data: [], colors: []};

  for(let d of data.data){
    ts.data.push(d.value);
    ts.labels.push(d.timestamp_measured.slice(0,-12));
    let col;
    if (d.value >= 0 && d.value <= 30) {
      col = "#00ba37";
    } else if (d.value > 30 && d.value <=75){
      col = "#dba617";
    } else {
      col = "#f86368";
    }
    ts.colors.push(col);
  }
  return ts;
}