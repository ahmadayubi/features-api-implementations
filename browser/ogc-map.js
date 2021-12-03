export class OGCMap {
  baseurl;
  map;
  apiurl;
  constructor(base) {
    this.baseurl = base;
    this.addToDom();
    this.apiurl = "https://api.luchtmeetnet.nl/open_api/";
    let icon = L.icon({iconUrl: "assets/station.png", iconSize: [24, 24], iconAnchor: [12, 12],});
    fetch("https://apisandbox.geonovum.nl/pygeoapi_luchtmeetnet/collections/stations/items?f=json")
      .then(resp => resp.json())
      .then((data) => {
        L.geoJSON(data, {
          pointToLayer: function (feature, latlng) {
            let popup = L.popup({maxWidth: 400}).setContent(OGCMap.prototype.createPopupOptions(feature.properties));
            return L.marker(latlng, {icon: icon}).bindPopup(popup);
          }
        }).addTo(this.map);

      })
      .catch(err => console.log(err));
  }

  addToDom() {
    this.map = L.map('gjmap').setView([52, 5], 7);
    L.tileLayer(this.baseurl).addTo(this.map);
  }

  createPopupOptions(props) {
    let container = document.createElement("div");
    container.style.width = "400px";
    for (let comp of props.components){
      let item = document.createElement("span");
      item.classList.add("badge", "bg-primary", "m-2");
      item.style.cursor = "pointer";
      item.onclick = function () {
        fetch(comp.measurements, {method: 'GET'})
          .then(nextResp => nextResp.json())
          .then(nextJson => {
            let chart = OGCMap.prototype.createPopup(nextJson, props.number, item.innerText);
            container.appendChild(chart);
            item.parentElement.removeChild(item);
          });
      }
      item.innerHTML = comp.formula;
      container.appendChild(item);
    }
    return container;
  }

  createPopup(data, loc, type = "NO2") {
    let container = document.createElement("div");
    container.style.width = "400px";
    container.style.position = "relative";

    let ctx = document.createElement("canvas");
    let dctx = ctx.getContext("2d");


    let fdata = this.formatData(data);
    let c = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fdata.labels,
        datasets: [{
          label: `${type} Measurements`,
          data: fdata.data,
          pointBackgroundColor: type === "NO2" ? fdata.colors : null,
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
              labelString: `${type} Measurements`,
            }
          }]
        },
        plugins: {
          title: {
            display: true,
            text: typeof loc === "string" ? loc : `Location (long:${loc.lng.toFixed(3)} lat:${loc.lat.toFixed(3)})`,
          }
        }
      }
    });

    container.appendChild(ctx);
    return container;
  }

  formatData(data){
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
}