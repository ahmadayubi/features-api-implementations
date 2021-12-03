## Traditional Client Implementations

### OGC Features API

Connecting an OGC Features API compliant API can be added simply by following the instruction below:

1. Open QGIS, navigate to the Data Source Manager
2. Select WFS/OGC API - Features and simply paste the base url of the API in the URL textbox.
3. Click OK, then press Connect
4. Select the collections you wish to add to the map and click Add.
5. Done

Requires:

- QGIS

### Convenience API

Connecting the convenience API can be done using the python script in this repository, naigate to the convenience folder
and download the provided script. Simply open the Python editor in QGIS and load the script, once you run the script the
stations will be add to the map.

You can also view the measurements of the stations by opening the attributes table.

Requires:

- Provided Python Script
- QGIS