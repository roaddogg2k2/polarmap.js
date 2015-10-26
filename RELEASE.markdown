# Release Notes

### v1.0.1 2015-06-04

* Fix bug where removing map did not remove layers from memory

### v1.0.0 2015-01-26

* Fix lint issues
* Mark package as public for NPM
* Mark package as public for Bower
* Update URL to new AWM homepage

### v0.7.0 2015-01-21

* Extract custom classes for our tile layers
* Include support for a bower.json file
* Finalize Node package.json file
* Add specs for library

### v0.6.2 2014-10-29

* Reset dependencies, bundle build products when using NPM

### v0.6.1 2014-10-29

* Build and minify when package is installed by NPM

### v0.6.0 2014-10-22

* Add wrapper level interface around lower-level plugin API

### v0.5.1 2014-10-22

* Add example for Style Editor plugin
* Add example for Shapefiles plugin
* Add example for Marker Clustering plugin
* Add example for Leaflet Paths plugin

### v0.5 2014-10-15

* Fix bug where map is not centered after switching projections
* Add permalink to Polarmap.js
* Integrate location search with PolarMap.js

### v0.4.0 2014-10-09

* Include AWM projections by default
* Add rotation map controls to change the projection
* Add a dropdown menu to select the projection
* Optionally have an init flag to detect user location and select best projection
* Prevent client from loading tiles that are out of bounds, as it causes 404 errors
* Fix projection error where tile projection and marker projection do not align

### v0.3.0 2014-09-29

* Change design to function like a Leaflet plugin
* Remove unnecessary EPSG code loading (using Proj4 instead)

### v0.2.0 2014-09-18

* Rename library to PolarMap.js
* Major JavaScript refactoring
* Remove offline tile providers from examples
* Use NPM for managing development dependencies
* Include AWM attribution text

### v0.1 2014-07-24

* Initial Prototype