/**
 * OralEye API
 * API for controlling lights and camera on OralEye device
 *
 * The version of the OpenAPI document: 0.0.1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 *
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD.
    define(['expect.js', process.cwd() + '/src/index'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    factory(require('expect.js'), require(process.cwd() + '/src/index'));
  } else {
    // Browser globals (root is window)
    factory(root.expect, root.OralEyeApi);
  }
})(this, function (expect, OralEyeApi) {
  'use strict';

  var instance;

  beforeEach(function () {
    instance = new OralEyeApi.CameraManualFocusPostRequest();
  });

  var getProperty = function (object, getter, property) {
    // Use getter method if present; otherwise, get the property directly.
    if (typeof object[getter] === 'function') return object[getter]();
    else return object[property];
  };

  var setProperty = function (object, setter, property, value) {
    // Use setter method if present; otherwise, set the property directly.
    if (typeof object[setter] === 'function') object[setter](value);
    else object[property] = value;
  };

  describe('CameraManualFocusPostRequest', function () {
    it('should create an instance of CameraManualFocusPostRequest', function () {
      // uncomment below and update the code to test CameraManualFocusPostRequest
      //var instance = new OralEyeApi.CameraManualFocusPostRequest();
      //expect(instance).to.be.a(OralEyeApi.CameraManualFocusPostRequest);
    });

    it('should have the property distance (base name: "distance")', function () {
      // uncomment below and update the code to test the property distance
      //var instance = new OralEyeApi.CameraManualFocusPostRequest();
      //expect(instance).to.be();
    });
  });
});
