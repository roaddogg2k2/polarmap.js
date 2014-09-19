// Extend the base Leaflet Map class to handle custom init options for
// projected tiles.
L.PolarMap = L.Map.extend({
  // Default options
  options: {
    /*
    tileProjection: Object
    */

    fadeAnimation: true,
    trackResize: true,
    markerZoomAnimation: true
  },

  initialize: function (id, options) {
    options = L.setOptions(this, options);
    var tileOptions = options.tileProjection;

    this._initContainer(id);
    this._initLayout();

    // hack for https://github.com/Leaflet/Leaflet/issues/1980
    this._onResize = L.bind(this._onResize, this);

    this._initEvents();

    if (options.maxBounds) {
      this.setMaxBounds(options.maxBounds);
    }

    if (options.tileProjection.zoom !== undefined) {
      this._zoom = this._limitZoom(options.tileProjection.zoom);
    }

    this._handlers = [];
    this._layers = {};
    this._zoomBoundLayers = {};

    this.callInitHooks();

    // Set the map CRS
    this.options.crs = this._setMapCRS(tileOptions.crs, tileOptions);

    // Add the projected tile layer
    var baseLayer = L.tileLayer(tileOptions.url, tileOptions);
    this._addLayers([baseLayer]);

    if (options.tileProjection.center && options.tileProjection.zoom !== undefined) {
      this.setView(L.latLng(options.tileProjection.center), options.tileProjection.zoom, {reset: true});
    }
  },

  _defineMapCRS: function (crs, options) {
    if (options.origin) {
      options.transformation = new L.Transformation(1, -options.origin[0], -1, options.origin[1]);
    }

    var resolutions = [];
    for (var zoom = options.minZoom; zoom <= options.maxZoom; zoom++) {
      resolutions.push(options.maxResolution / Math.pow(2, zoom));
    };

    return new L.Proj.CRS(crs, options.proj4def, {
        origin: options.origin,
        resolutions: resolutions
    });
  },

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
  }
});

L.polarMap = function (id, options) {
  return new L.PolarMap(id, options);
};
