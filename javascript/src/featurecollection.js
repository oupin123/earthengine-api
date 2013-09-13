/**
 * @fileoverview Representation of an Earth Engine FeatureCollection.
 */

goog.provide('ee.FeatureCollection');

goog.require('ee.ApiFunction');
goog.require('ee.Collection');
goog.require('ee.ComputedObject');
goog.require('ee.Feature');
goog.require('ee.Geometry');
goog.require('ee.Types');
goog.require('goog.array');



/**
 * FeatureCollections can be constructed from the following arguments:
 *   - A string: assumed to be the name of a collection.
 *   - A number: assumed to be the ID of a Fusion Table.
 *   - A single geometry.
 *   - A single feature.
 *   - An array of features.
 *   - A computed object: reinterpreted as a collection.
 *
 * @param {string|number|Array.<*>|ee.ComputedObject|
 *         ee.Geometry|ee.Feature|ee.FeatureCollection} args
 *     The constructor arguments.
 * @param {string=} opt_column The name of the geometry column to use.  Only
 *     useful with constructor types 1 and 2.
 * @constructor
 * @extends {ee.Collection}
 */
ee.FeatureCollection = function(args, opt_column) {
  // Constructor safety.
  if (!(this instanceof ee.FeatureCollection)) {
    return new ee.FeatureCollection(args, opt_column);
  } else if (args instanceof ee.FeatureCollection) {
    return args;
  }

  if (arguments.length > 2) {
    throw Error(
        'The FeatureCollection constructor takes at most 2 arguments (' +
        arguments.length + ' given)');
  }

  ee.FeatureCollection.initialize();

  // Wrap geometries with features.
  if (args instanceof ee.Geometry) {
    args = new ee.Feature(args);
  }

  // Wrap single features in an array.
  if (args instanceof ee.Feature) {
    args = [args];
  }

  if (ee.Types.isNumber(args) || ee.Types.isString(args)) {
    // An ID.
    var actualArgs = {'tableId': args};
    if (opt_column) {
      actualArgs['geometryColumn'] = opt_column;
    }
    goog.base(this, new ee.ApiFunction('Collection.loadTable'), actualArgs);
  } else if (goog.isArray(args)) {
    // A list of features.
    goog.base(this, new ee.ApiFunction('Collection'), {
      'features': goog.array.map(args, function(elem) {
        return new ee.Feature(elem);
      })
    });
  } else if (args instanceof ee.ComputedObject) {
    // A custom object to reinterpret as a FeatureCollection.
    goog.base(this, args.func, args.args);
  } else {
    throw Error('Unrecognized argument type to convert to a ' +
                'FeatureCollection: ' + args);
  }
};
goog.inherits(ee.FeatureCollection, ee.Collection);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.FeatureCollection.initialized_ = false;


/**
 * Imports API functions to this class.
 * @hidden
 */
ee.FeatureCollection.initialize = function() {
  if (!ee.FeatureCollection.initialized_) {
    ee.ApiFunction.importApi(
        ee.FeatureCollection, 'FeatureCollection', 'FeatureCollection');
    ee.Collection.createAutoMapFunctions(ee.FeatureCollection, ee.Feature);
    ee.FeatureCollection.initialized_ = true;
  }
};


/**
 * Removes imported API functions from this class.
 * @hidden
 */
ee.FeatureCollection.reset = function() {
  ee.ApiFunction.clearApi(ee.FeatureCollection);
  ee.FeatureCollection.initialized_ = false;
};


/**
 * An imperative function that returns a map id and token, suitable for
 * generating a Map overlay.
 *
 * @param {Object?=} opt_visParams The visualization parameters. Currently only
 *     one parameter, 'color', containing an RGB color string is allowed.  If
 *     vis_params isn't specified, then the color #000000 is used.
 * @param {function(Object, string=)=} opt_callback An async callback.
 * @return {ee.data.MapId} An object containing a mapid string, an access
 *     token, plus a Collection.draw image wrapping this collection.
 */
ee.FeatureCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var painted = ee.ApiFunction._apply('Collection.draw', {
    'collection': this,
    'color': (opt_visParams || {})['color'] || '000000'
  });

  if (opt_callback) {
    painted.getMap(null, opt_callback);
  } else {
    return painted.getMap();
  }
};


/**
 * An imperative function that returns all the known information about this
 * collection via an AJAX call.
 *
 * @param {function(ee.data.FeatureCollectionDescription)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {ee.data.FeatureCollectionDescription} A collection description
 *     whose fields include:
 *     - features: an array containing metadata about the features in the
 *           collection.
 *     - properties: an optional dictionary containing the collection's
 *           metadata properties.
 */
ee.FeatureCollection.prototype.getInfo = function(opt_callback) {
  return /** @type {ee.data.FeatureCollectionDescription} */(
      goog.base(this, 'getInfo', opt_callback));
};


/** @inheritDoc */
ee.FeatureCollection.prototype.map = function(
    algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  return /** @type {ee.FeatureCollection} */(this.mapInternal(
      ee.Feature, algorithm,
      opt_dynamicArgs, opt_constantArgs, opt_destination));
};


/** @inheritDoc */
ee.FeatureCollection.prototype.name = function() {
  return 'FeatureCollection';
};


goog.exportSymbol('ee.FeatureCollection', ee.FeatureCollection);
goog.exportProperty(ee.FeatureCollection.prototype, 'map',
                    ee.FeatureCollection.prototype.map);
goog.exportProperty(ee.FeatureCollection.prototype, 'getMap',
                    ee.FeatureCollection.prototype.getMap);