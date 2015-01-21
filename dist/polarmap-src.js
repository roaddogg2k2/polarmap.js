/*
 PolarMap.js 0.6.2 (de4a964)
 (c) 2014-2015 Arctic Connect, Geo Sensor Web Lab
*/
(function (window, document, L, undefined) {
if (typeof(L) === "undefined") {
  var L = {};
}

L.PolarMap = {
  version: '0.6.2',
  Control: {},
  Util: {}
};

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = L.PolarMap;
} else if (typeof define === 'function' && define.amd) {
  define(L.PolarMap);
}


/*
 * L.PolarMap.Control.Rotation adds two buttons for "rotating" a map.
 */

L.PolarMap.Control.Rotation = L.Control.extend({
  options: {
    position: 'topright',
    cwText: '&orarr;',
    cwTitle: 'Rotate Clockwise',
    ccwText: '&olarr;',
    ccwTitle: 'Rotate Counter-Clockwise'
  },

  onAdd: function (map) {
    var rotationName = 'leaflet-control-rotation',
        container = L.DomUtil.create('div', rotationName + ' leaflet-bar'),
        options = this.options;

    this._cwButton  = this._createButton(options.cwText, options.cwTitle,
            rotationName + '-cw',  container, this._rotateCW);
    this._ccwButton = this._createButton(options.ccwText, options.ccwTitle,
            rotationName + '-ccw', container, this._rotateCCW);

    return container;
  },

  _rotateCW: function (e) {
    if (this.options.onRotateCW) {
      this.options.onRotateCW();
    }
  },

  _rotateCCW: function (e) {
    if (this.options.onRotateCCW) {
      this.options.onRotateCCW();
    }
  },

  _createButton: function (html, title, className, container, fn) {
    var link = L.DomUtil.create('a', className, container);
    link.innerHTML = html;
    link.href = '#';
    link.title = title;

    L.DomEvent
        .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
        .on(link, 'click', L.DomEvent.stop)
        .on(link, 'click', fn, this)
        .on(link, 'click', this._refocusOnMap, this);

    return link;
  },
});

L.PolarMap.Control.rotation = function (options) {
  return new L.PolarMap.Control.Rotation(options);
};


/*
 * L.PolarMap.TileLayer is used for tile layers with custom CRS support.
 */

L.PolarMap.TileLayer = L.TileLayer.extend({});

L.PolarMap.tileLayer = function (url, options) {
  return new L.PolarMap.TileLayer(url, options);
};


// Store the base layer, zoom level, and location in URL hash
// Based on code from [underscore.js](https://github.com/jashkenas/underscore).
// Underscore is MIT licensed:
/*
 *  Copyright (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative
 *  Reporters & Editors
 *
 *  Permission is hereby granted, free of charge, to any person
 *  obtaining a copy of this software and associated documentation
 *  files (the "Software"), to deal in the Software without
 *  restriction, including without limitation the rights to use,
 *  copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the
 *  Software is furnished to do so, subject to the following
 *  conditions:
 *
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 *  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 *  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 *  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 *  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 *  OTHER DEALINGS IN THE SOFTWARE.
*/

L.PolarMap.Util.debounce = function(func, wait, immediate) {
  var timeout, args, context, timestamp, result;

  var later = function() {
    var last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function() {
    context = this;
    args = arguments;
    timestamp = Date.now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};


// Store the base layer, zoom level, and location in URL hash
// Based on code from [leaflet-hash](https://github.com/mlevans/leaflet-hash).
// Leaflet-hash is MIT licensed:
/*
 * Copyright (c) 2013 Michael Lawrence Evans
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

L.PolarMap.Util.Hash = L.Class.extend({
  options: {
    map: null,
    lastHash: null,
    movingMap: false,
    // defer hash change updates every 100ms
    changeDefer: 100,
    changeTimeout: null,
    isListening: false,
    hashChangeInterval: null,
    getBaseLayer: null,
    setBaseLayer: null
  },

  initialize: function (map, options) {
    options = L.setOptions(this, options);

    this.HAS_HASHCHANGE = (function() {
      var doc_mode = window.documentMode;
      return ('onhashchange' in window) &&
        (doc_mode === undefined || doc_mode > 7);
    })();

    this.onHashChange = L.Util.bind(this.onHashChange, this);

    this.map = map;

    // reset the hash
    this.options.lastHash = null;
    this.onHashChange();

    if (!this.options.isListening) {
      this.startListening();
    }
  },

  formatHash: function (map) {
    var hashComponents = [],
        center = map.getCenter(),
        zoom = map.getZoom(),
        precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

    if (this.options.getBaseLayer !== null) {
      hashComponents.push(this.options.getBaseLayer());
    }

    hashComponents.push(zoom, center.lat.toFixed(precision), center.lng.toFixed(precision));

    return "#" + hashComponents.join("/");
  },

  onHashChange: function () {
    // throttle calls to update() so that they only happen every
    // `changeDefer` ms
    if (!this.options.changeTimeout) {
      var that = this;
      this.options.changeTimeout = setTimeout(function() {
        that.update();
        that.options.changeTimeout = null;
      }, this.options.changeDefer);
    }
  },

  onMapMove: function () {
    // bail if we're moving the map (updating from a hash),
    // or if the map is not yet loaded

    if (this.options.movingMap || !this.map._loaded) {
      return false;
    }

    var hash = this.formatHash(this.map);
    if (this.options.lastHash != hash) {
      location.replace(hash);
      this.options.lastHash = hash;
    }
  },

  parseHash: function (hash) {
    if(hash.indexOf('#') === 0) {
      hash = hash.substr(1);
    }
    var args = hash.split("/");
    if (args.length === 4) {
      var baseLayer = args[0],
          zoom = parseInt(args[1], 10),
          lat = parseFloat(args[2]),
          lon = parseFloat(args[3]);

      if (baseLayer === "" || isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
        return false;
      } else {
        return {
          baseLayer: baseLayer,
          center: new L.LatLng(lat, lon),
          zoom: zoom
        };
      }
    } else if (args.length === 3) {
      var zoom = parseInt(args[0], 10),
      lat = parseFloat(args[1]),
      lon = parseFloat(args[2]);
      if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
        return false;
      } else {
        return {
          center: new L.LatLng(lat, lon),
          zoom: zoom
        };
      }
    } else {
      return false;
    }
  },

  removeFrom: function (map) {
    if (this.options.changeTimeout) {
      clearTimeout(this.options.changeTimeout);
    }

    if (this.options.isListening) {
      this.stopListening();
    }

    this.map = null;
  },

  startListening: function () {
    this.map.on("moveend", this.onMapMove, this);

    if (this.HAS_HASHCHANGE) {
      L.DomEvent.addListener(window, "hashchange", this.onHashChange);
    } else {
      clearInterval(this.options.hashChangeInterval);
      this.options.hashChangeInterval = setInterval(this.onHashChange, 50);
    }
    this.options.isListening = true;
  },

  stopListening: function () {
    this.map.off("moveend", this.onMapMove, this);

    if (this.HAS_HASHCHANGE) {
      L.DomEvent.removeListener(window, "hashchange", this.onHashChange);
    } else {
      clearInterval(this.options.hashChangeInterval);
    }
    this.options.isListening = false;
  },

  update: function () {
    var hash = location.hash;
    if (hash === this.options.lastHash) {
      return;
    }
    var parsed = this.parseHash(hash);
    if (parsed) {
      this.options.movingMap = true;

      if (parsed.baseLayer !== undefined) {
        this.options.setBaseLayer(parsed.baseLayer);
      }

      this.map.setView(parsed.center, parsed.zoom);

      this.options.movingMap = false;
    } else {
      this.onMapMove(this.map);
    }
  }
});

L.PolarMap.Util.hash = function (map, options) {
  return new L.PolarMap.Util.Hash(map, options);
};


// Extend the base Leaflet Map class to handle custom init options for
// projected tiles.
L.PolarMap.Map = L.Map.extend({
  // Default options
  options: {
    /*
    baseLayer: Object
    */

    changingMap: false,
    fadeAnimation: true,
    trackResize: true,
    markerZoomAnimation: true,
    center: L.latLng([90,0]),
    zoom: 1
  },

  initialize: function (id, options) {
    options = L.setOptions(this, options);
    var baseLayerOptions = options.baseLayer.options;

    this._initContainer(id);
    this._initLayout();

    // hack for https://github.com/Leaflet/Leaflet/issues/1980
    this._onResize = L.bind(this._onResize, this);

    this._initEvents();

    if (options.maxBounds) {
      this.setMaxBounds(options.maxBounds);
    }

    if (options.center && options.zoom !== undefined) {
      this.setView(L.latLng(options.center), options.zoom, {reset: true});
    }

    this._handlers = [];
    this._layers = {};
    this._zoomBoundLayers = {};

    this.callInitHooks();

    // Update when base layer changed from map control
    this.on('baselayerchange', function (e) {
      var layerOptions = e.layer.options;
      this._update(e.layer);
    });

    this._update(options.baseLayer);
  },

  // Public Functions
  loadTileProjection: function (tileLayer) {
    if (this.options.changingMap) {
      return false;
    }

    // Check for existing layer
    if (this._usingTileProjection(tileLayer)) {
      console.log("That tile layer is already active.");
    } else {
      var tileOptions = tileLayer.options;
      // Drop base tile layers
      this._dropTileLayers();
      this._update(tileLayer);
    }
  },

  // Private Functions
  _defineMapCRS: function (crs, options) {
    var resolutions = [];
    for (var zoom = options.minZoom; zoom <= options.maxZoom; zoom++) {
      resolutions.push(options.maxResolution / Math.pow(2, zoom));
    };

    return new L.Proj.CRS(crs, options.proj4def, {
        origin: options.origin,
        resolutions: resolutions,
        bounds: options.projectedBounds
    });
  },

  _dropTileLayers: function () {
    var map = this;

    map.eachLayer(function (layer) {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
  },

  // Use default CRS classes for common codes, fallback to custom for all other
  // codes.
  _setMapCRS: function (crs, options) {
    switch(crs) {
      case "EPSG:3857":
      return L.CRS.EPSG3857;
      break;
      case "EPSG:3395":
      return L.CRS.EPSG3395;
      break;
      case "EPSG:4326":
      return L.CRS.EPSG4326;
      break;
      default:
        return this._defineMapCRS(crs, options);
      break;
    }
  },

  _update: function (layer) {
    if (this.options.changingMap) {
      return false;
    } else {
      this.options.changingMap = true;

      // preserve map center/zoom level
      var center = this.getCenter(),
          zoom = this.getZoom();

      this._updateCRSAndLayers(layer.options);
      this.addLayer(layer, true);
      this.setView(center, zoom, {reset: true});
      this.setMaxBounds(layer.options.bounds);

      this.options.changingMap = false;
    }
  },

  // This recurses through all the map's layers to update layer positions after
  // their positions moved.
  _updateAllLayers: function (group) {
    var map = this;

    if (group.eachLayer) {
      group.eachLayer(function (layer) {
        map._updateAllLayers(layer);
      });
    } else {
      if (group.redraw) {
        group.redraw();
      } else if (group.update) {
        group.update();
      } else {
        console.log("Don't know how to update", group);
      }
    }
  },

  _updateCRSAndLayers: function (layerOptions) {
    this.options.crs = this._setMapCRS(layerOptions.crs, layerOptions);
    this._updateAllLayers(this);
  },

  _usingTileProjection: function (tileLayer) {
    var alreadyActive = false;
    var layers = this._layers;
    for (var layer in layers) {
      alreadyActive = (layers[layer] === tileLayer);
      if (alreadyActive) break;
    }
    return alreadyActive;
  }
});

L.PolarMap.map = function (id, options) {
  return new L.PolarMap.Map(id, options);
};


/* Strings */

var t = {
  tileHeader: "Arctic Connect: ",
  attribution: 'Map &copy; <a href="http://arcticconnect.org">ArcticConnect</a>. Data &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  locationDetectionError: "Location detection error: "
};

/* Projections */

// Globally define projections for Proj4js. If not defined here, then they must
// be defined in tile provider definitions below.
proj4.defs([
  ["EPSG:3571","+proj=laea +lat_0=90 +lon_0=180 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"],
  ["EPSG:3572","+proj=laea +lat_0=90 +lon_0=-150 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"],
  ["EPSG:3573","+proj=laea +lat_0=90 +lon_0=-100 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"],
  ["EPSG:3574","+proj=laea +lat_0=90 +lon_0=-40 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"],
  ["EPSG:3575","+proj=laea +lat_0=90 +lon_0=10 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"],
  ["EPSG:3576","+proj=laea +lat_0=90 +lon_0=90 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"]
]);

var projections = [
  "EPSG:3571",
  "EPSG:3572",
  "EPSG:3573",
  "EPSG:3574",
  "EPSG:3575",
  "EPSG:3576"
];

/* Tile Layer Configuration */

var tiles = {};

// Custom extent for our EPSG:3571-3576 tiles
var extent = 11000000 + 9036842.762 + 667;

for (var i = 0; i < projections.length; i++) {
  var projection = projections[i];
  var epsg = 3571 + i;
  var url = "http://{s}.tiles.arcticconnect.org/osm_" + epsg + "/{z}/{x}/{y}.png";

  tiles[t.tileHeader + projection] = L.PolarMap.tileLayer(url, {
    name: "ac_" + epsg,
    crs: projection,
    minZoom: 0,
    maxZoom: 18,
    tms: false,
    origin: [-extent, extent],
    maxResolution: ((extent - -extent) / 256),
    projectedBounds: L.bounds(L.point(-extent, extent),L.point(extent, -extent)),
    continuousWorld: false,
    noWrap: true,
    attribution: t.attribution
  });
};

// Set up next/prev linked list

for (var i = 0; i < 6; i++) {
  var prev = (i === 0) ? 5 : i - 1;
  var next = (i === 5) ? 0 : i + 1;
  var layer = tiles[t.tileHeader + "EPSG:" + (3571 + i)];
  layer.prev = tiles[t.tileHeader + "EPSG:" + (3571 + prev)];
  layer.next = tiles[t.tileHeader + "EPSG:" + (3571 + next)];
};

/* PolarMap Library Function */

window.PolarMap = L.Class.extend({
  options: {
    geosearch: false,
    locate: false,
    permalink: true
  },

  statics: {
    VERSION: L.PolarMap.version
  },

  initialize: function (id, options) {
    var _this = this,
        container,
        touches;
    L.Util.setOptions(this, options);
    this.tiles = tiles;

    /* Controls */

    this.layersControl = L.control.layers(this.tiles, null);

    this.rotationControls = L.PolarMap.Control.rotation({
      onRotateCW: function() {
        _this.map.loadTileProjection(_this.getBaseLayer().next);
      },

      onRotateCCW: function() {
        _this.map.loadTileProjection(_this.getBaseLayer().prev);
      }
    });

    /* Map */

    this.map = L.PolarMap.map(id, {
      baseLayer: this.tiles[t.tileHeader + "EPSG:3573"],
      center: [90, 0],
      zoom: 4
    });

    this.layersControl.addTo(this.map);
    this.rotationControls.addTo(this.map);

    if (this.options.geosearch) {
      this._initGeosearch();
    }

    if (this.options.locate) {
      this._initLocate();
    }

    if (this.options.permalink) {
      this._initPermalink();
    }

    /* Custom Map Gestures */
    // We retain the last set of touches to determine rotation direction;
    // the sign of event.rotation cannot be trusted.
    container = this.map.getContainer();

    container.addEventListener("touchstart",
      L.PolarMap.Util.debounce(function(e) {
        touches = [];
      })
    );

    container.addEventListener("touchmove",
      L.PolarMap.Util.debounce(function(e) {
        touches.push(e);
        if (touches.length > 10) {
          touches.shift();
        }
      })
    );

    container.addEventListener("touchend",
      L.PolarMap.Util.debounce(function(e) {
        if (touches.length > 0) {
          e.preventDefault();
          var s1 = touches[0].rotation,
              s2 = touches[touches.length - 1].rotation,
              direction = s1 - s2,
              delta = Math.abs(e.rotation);

          if (delta > 45) {
            if (direction > 0) {
              _this.rotateCCW();
            } else {
              _this.rotateCW();
            }
          }
        }
      })
    );
  },

  addLayer: function (layer, options) {
    this.map.addLayer(layer);

    if (typeof(options) !== "undefined" && options.switcher) {
      this.layersControl.addOverlay(layer, options.name);
    }
  },

  getBaseLayer: function () {
    var foundLayer = null;

    for (var layer in this.tiles) {
      if (this.tiles.hasOwnProperty(layer)) {
        if (this.map.hasLayer(this.tiles[layer])) {
          foundLayer = this.tiles[layer];
        }
      }
    }
    return foundLayer;
  },

  rotateCW: function () {
    this.map.loadTileProjection(this.getBaseLayer().next);
  },

  rotateCCW: function () {
    this.map.loadTileProjection(this.getBaseLayer().prev);
  },

  _initGeosearch: function () {
    new L.Control.GeoSearch({
      provider: new L.GeoSearch.Provider.OpenStreetMap(),
      showMarker: false
    }).addTo(this.map);
  },

  _initLocate: function () {
    var _this = this;
    var userLocation = L.circle();

    this.map.on('locationfound', function (e) {
      userLocation.setLatLng(e.latlng);
      userLocation.setRadius(e.accuracy);

      if (!_this.map.hasLayer(userLocation)) {
        userLocation.addTo(_this.map);
      }

      _this._setProjectionForLongitude(e.longitude);
    });

    this.map.on('locationerror', function (e) {
      console.warn(t.locationDetectionError, e);
    });

    this.map.locate();
  },

  _initPermalink: function () {
    var _this = this;
    this.hash = L.PolarMap.Util.hash(this.map, {
      getBaseLayer: function () {
        return _this.getBaseLayer().options.name;
      },

      setBaseLayer: function (name) {
        _this._setBaseLayer(name);
      }
    });
  },

  _setBaseLayer: function (name) {
    var _this = this;

    for (var layer in this.tiles) {
      if (this.tiles.hasOwnProperty(layer)) {
        if (this.tiles[layer].options.name === name) {
          _this.map.loadTileProjection(this.tiles[layer]);
        }
      }
    }
  },

  _setProjectionForLongitude: function (longitude) {
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

    this.map.loadTileProjection(this.tiles[t.tileHeader + value]);
  }
});

window.polarMap = function (id, options) {
  return new PolarMap(id, options);
};


}(window, document, L));