const Chart = window.Chart;

export class ConvenienceMap {
  baseurl;
  apiurl;
  stations = [];
  map;
  constructor(base) {
    this.baseurl = base;
    this.apiurl = "https://api.luchtmeetnet.nl/open_api/";
    this.addToDom();
    fetch(this.apiurl + "stations?page=1", {method: 'GET'})
      .then(resp => resp.json())
      .then(json => {
        let totalPages = json.pagination.last_page;

        for(let s of json.data){
          this.appendStationInfo(s.number);
        }

        for(let i = 2; i <= totalPages; i++) {
          fetch(this.apiurl + `stations?page=${i}`, {method: 'GET'})
            .then(nextResp => nextResp.json())
            .then(nextJson => {
              for (let s of nextJson.data) {
                this.appendStationInfo(s.number);
              }
            });
        }
      }).catch(err => console.log(err));
  }

  addToDom() {
    this.map = L.map('cmap').setView([52, 5], 7);
    L.tileLayer(this.baseurl).addTo(this.map);

    this.map.on("click", this.concentrationAt, this);
    // map.locate({setView: true, watch: true})
    //   .on('locationfound', function(e){
    //     var marker = L.marker([e.latitude, e.longitude]).bindPopup('Your are here :)');
    //     var circle = L.circle([e.latitude, e.longitude], e.accuracy/2, {
    //       weight: 1,
    //       color: 'blue',
    //       fillColor: '#cacaca',
    //       fillOpacity: 0.2
    //     });
    //     map.addLayer(marker);
    //     map.addLayer(circle);
    //   })
    //   .on('locationerror', function(e){
    //     console.log(e);
    //     alert("Location access denied.");
    //   });
  }

  addStationToMap(data, name) {
    // TODO: The api geojson doesn't follow standard, needed to make into uppercase
    data.geometry.type = data.geometry.type[0].toUpperCase() + data.geometry.type.slice(1);
    let geojsonFeature = {
      "type": "Feature",
      "geometry": data.geometry,
    };
    let icon = L.icon({iconUrl: "assets/station.png", iconSize: [24, 24], iconAnchor: [12, 12],});
    //let popup = L.popup().setContent(this.concentrationOf(name));
    let s = L.geoJSON(geojsonFeature, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {icon:icon});//.bindPopup(popup);
      }
    });
    this.map.addLayer(s);
  }

  appendStationInfo(name) {
    fetch(this.apiurl + `stations/${name}`, {method: 'GET'})
      .then(resp => resp.json())
      .then(json => {
        if(json.data.components.includes("NO2")) {
          this.addStationToMap(json.data, name);
          this.stations.push(json.data);
        }
      }).catch(err => console.log(err));
  }

  concentrationOf(station) {
    let div = document.createElement("div");
    fetch(this.apiurl + `stations/${station}/measurements?page=&order=&order_direction=&formula=`, {method: 'GET'})
      .then(nextResp => nextResp.json())
      .then(nextJson => {
        div.innerHTML = JSON.stringify(nextJson);
      });
    return div;
  }

  concentrationAt(e) {
    fetch(this.apiurl + `concentrations?formula=no2&longitude=${e.latlng.lng}&latitude=${e.latlng.lat}`, {method: 'GET'})
      .then(nextResp => nextResp.json())
      .then(nextJson => {
        L.popup({maxWidth : 400})
          .setLatLng(e.latlng)
          .setContent(this.createPopup(nextJson, e.latlng))
          .openOn(this.map);
      });
  }

  createPopup(data, loc) {
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
            text: `Location (long:${loc.lng.toFixed(3)} lat:${loc.lat.toFixed(3)})`,
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