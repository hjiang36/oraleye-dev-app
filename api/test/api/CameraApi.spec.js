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
    instance = new OralEyeApi.CameraApi();
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

  describe('CameraApi', function () {
    describe('cameraAutofocusPost', function () {
      it('should call cameraAutofocusPost successfully', function (done) {
        //uncomment below and update the code to test cameraAutofocusPost
        //instance.cameraAutofocusPost(function(error) {
        //  if (error) throw error;
        //expect().to.be();
        //});
        done();
      });
    });
    describe('cameraCapturePost', function () {
      it('should call cameraCapturePost successfully', function (done) {
        //uncomment below and update the code to test cameraCapturePost
        //instance.cameraCapturePost(function(error) {
        //  if (error) throw error;
        //expect().to.be();
        //});
        done();
      });
    });
    describe('cameraExposurePost', function () {
      it('should call cameraExposurePost successfully', function (done) {
        //uncomment below and update the code to test cameraExposurePost
        //instance.cameraExposurePost(function(error) {
        //  if (error) throw error;
        //expect().to.be();
        //});
        done();
      });
    });
    describe('cameraManualFocusPost', function () {
      it('should call cameraManualFocusPost successfully', function (done) {
        //uncomment below and update the code to test cameraManualFocusPost
        //instance.cameraManualFocusPost(function(error) {
        //  if (error) throw error;
        //expect().to.be();
        //});
        done();
      });
    });
    describe('cameraPreviewStartPost', function () {
      it('should call cameraPreviewStartPost successfully', function (done) {
        //uncomment below and update the code to test cameraPreviewStartPost
        //instance.cameraPreviewStartPost(function(error) {
        //  if (error) throw error;
        //expect().to.be();
        //});
        done();
      });
    });
    describe('cameraPreviewStopPost', function () {
      it('should call cameraPreviewStopPost successfully', function (done) {
        //uncomment below and update the code to test cameraPreviewStopPost
        //instance.cameraPreviewStopPost(function(error) {
        //  if (error) throw error;
        //expect().to.be();
        //});
        done();
      });
    });
  });
});
