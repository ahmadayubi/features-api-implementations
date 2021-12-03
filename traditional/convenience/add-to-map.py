import requests
import json
from osgeo import ogr

group = QgsProject.instance().layerTreeRoot().addGroup("Stations")

# Generates the layer item for the given station
def generateLayer(station):
    stationReq = requests.get("http://api.luchtmeetnet.nl/open_api/stations/"+station+"")
    stationjson = stationReq.json()
    
    stationjson["data"]["geometry"]["type"].capitalize()
    
    geostring = json.dumps(stationjson["data"]["geometry"])
    geom = ogr.CreateGeometryFromJson(geostring)
    geom = QgsGeometry.fromWkt(geom.ExportToWkt())
    
    layer = QgsVectorLayer('Point', station,'memory')
    pr = layer.dataProvider()
    elem = QgsFeature()
    elem.setGeometry(geom)
    
    layer.updateExtents()
    setAttributes(station, layer, pr, elem)
    
    QgsProject.instance().addMapLayer(layer, False)
    group.addLayer(layer)

# Gets the measurements for the station and adds it to the attributes table
def setAttributes(station, layer, pr, elem):
    r = requests.get("http://api.luchtmeetnet.nl/open_api/stations/"+station+"/measurements?page=&order=&order_direction=&formula=")
    rjson = r.json()
    
    pr.addAttributes([QgsField("Time Stamp", QVariant.String), QgsField("Measurement", QVariant.Double), QgsField("Formula", QVariant.String)])
    layer.updateFields()
    
    for m in rjson["data"]:        
        elem.setAttributes([m["timestamp_measured"], m["value"], m["formula"]])
        pr.addFeature(elem)

    

r = requests.get("http://api.luchtmeetnet.nl/open_api/stations")
rjson = r.json()
total_pages = rjson["pagination"]["last_page"]

for station in rjson["data"]:
    generateLayer(station["number"])

# Commented out but can be used to request the next page in the request
#for i in range(2, total_pages + 1):
#    pass
    
