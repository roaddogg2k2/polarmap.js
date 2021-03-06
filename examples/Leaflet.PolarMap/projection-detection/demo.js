var map;

// Create object to define tile provider settings and transformations. Supports
// all Leaflet TileLayer options.
var projectedTiles = {
  "EPSG:3571 Bering Sea": L.PolarMap.layer3571,
  "EPSG:3572 Alaska"    : L.PolarMap.layer3572,
  "EPSG:3573 Canada"    : L.PolarMap.layer3573,
  "EPSG:3574 Atlantic"  : L.PolarMap.layer3574,
  "EPSG:3575 Europe"    : L.PolarMap.layer3575,
  "EPSG:3576 Russia"    : L.PolarMap.layer3576
};

// Return the tile layer that has a key containing `projection`
var getTileLayerForProjection = function(projection) {
  for (var key in projectedTiles) {
    if (projectedTiles.hasOwnProperty(key)) {
      if (key.indexOf(projection) !== -1) {
        return projectedTiles[key];
      }
    }
  }

  return null;
};

// Set up next/prev linked list
$.each(projectedTiles, function (layerName, layer) {
  var keys = Object.keys(projectedTiles);
  var index = keys.indexOf(layerName);
  var prev = (index === 0) ? keys.length - 1 : index - 1;
  var next = (index === keys.length - 1) ? 0 : index + 1;

  layer.prev = projectedTiles[keys[prev]];
  layer.next = projectedTiles[keys[next]];
});

// Initialization
$(document).ready(function() {
  Autosize.enable();

  // Load PolarMap
  var defaultLayer = projectedTiles["EPSG:3571 Bering Sea"];
  map = L.PolarMap.map('xmap', {
    baseLayer: defaultLayer,
    center: defaultLayer.options.center,
    zoom: defaultLayer.options.zoom
  });

  // Add a Leaflet layer group. Assumed to be EPSG:3857.
  L.layerGroup([
    L.marker([51.080126, -114.13380900]).bindPopup("University of Calgary"),
    L.marker([90, 100]).bindPopup("North Pole")
  ]).addTo(map);

  var layersControl = L.control.layers(projectedTiles, null);
  layersControl.addTo(map);

  // Wire up rotation controls
  var getBaseLayer = function() {
    var foundLayer = null;
    $.each(projectedTiles, function (layerName, layer) {
      if (map.hasLayer(layer)) {
        foundLayer = layer;
      }
    });
    return foundLayer;
  };

  var rotationControls = L.PolarMap.Control.rotation({
    onRotateCW: function() {
      map.loadTileProjection(getBaseLayer().next);
    },

    onRotateCCW: function() {
      map.loadTileProjection(getBaseLayer().prev);
    }
  });
  rotationControls.addTo(map);

  // Projection Selection
  var setProjectionForLongitude = function (longitude) {
    var value;
    if (longitude >= -180 && longitude <= -165) {
      value = "EPSG:3571";
    } else if (longitude > -165 && longitude <= -125) {
      value = "EPSG:3572";
    } else if (longitude > -125 && longitude <= -70) {
      value = "EPSG:3573";
    } else if (longitude > -70 && longitude <= -15) {
      value = "EPSG:3574";
    } else if (longitude > -15 && longitude <= 50) {
      value = "EPSG:3575";
    } else if (longitude > 50 && longitude <= 135) {
      value = "EPSG:3576";
    } else {
      value = "EPSG:3571";
    }

    map.loadTileProjection(getTileLayerForProjection(value));
  };

  // Automatic Location and Projection Detection
  var userLocation = L.circle();

  map.on('locationfound', function (e) {
    console.log("Location info", e);
    userLocation.setLatLng(e.latlng);
    userLocation.setRadius(e.accuracy);

    if (!map.hasLayer(userLocation)) {
      userLocation.addTo(map);
    }

    setProjectionForLongitude(e.longitude);
  });

  map.on('locationerror', function (e) {
    console.warn("Location detection error:", e);
  });

  map.locate();
});
