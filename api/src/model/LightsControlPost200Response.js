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

import ApiClient from '../ApiClient';

/**
 * The LightsControlPost200Response model module.
 * @module model/LightsControlPost200Response
 * @version 0.0.1
 */
class LightsControlPost200Response {
  /**
   * Constructs a new <code>LightsControlPost200Response</code>.
   * @alias module:model/LightsControlPost200Response
   */
  constructor() {
    LightsControlPost200Response.initialize(this);
  }

  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */
  static initialize(obj) {}

  /**
   * Constructs a <code>LightsControlPost200Response</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/LightsControlPost200Response} obj Optional instance to populate.
   * @return {module:model/LightsControlPost200Response} The populated <code>LightsControlPost200Response</code> instance.
   */
  static constructFromObject(data, obj) {
    if (data) {
      obj = obj || new LightsControlPost200Response();

      if (data.hasOwnProperty('message')) {
        obj['message'] = ApiClient.convertToType(data['message'], 'String');
      }
    }
    return obj;
  }

  /**
   * Validates the JSON data with respect to <code>LightsControlPost200Response</code>.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @return {boolean} to indicate whether the JSON data is valid with respect to <code>LightsControlPost200Response</code>.
   */
  static validateJSON(data) {
    // ensure the json data is a string
    if (
      data['message'] &&
      !(
        typeof data['message'] === 'string' || data['message'] instanceof String
      )
    ) {
      throw new Error(
        'Expected the field `message` to be a primitive type in the JSON string but got ' +
          data['message']
      );
    }

    return true;
  }
}

/**
 * @member {String} message
 */
LightsControlPost200Response.prototype['message'] = undefined;

export default LightsControlPost200Response;
