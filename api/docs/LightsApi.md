# OralEyeApi.LightsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**lightsBlueMaxTimePost**](LightsApi.md#lightsBlueMaxTimePost) | **POST** /lights/blue/max_time | Set blue light maximum on time for health safety
[**lightsControlPost**](LightsApi.md#lightsControlPost) | **POST** /lights/control | Set lights on/off
[**lightsStatusGet**](LightsApi.md#lightsStatusGet) | **GET** /lights/status | Get status of the lights



## lightsBlueMaxTimePost

> LightsControlPost200Response lightsBlueMaxTimePost(lightsBlueMaxTimePostRequest)

Set blue light maximum on time for health safety

### Example

```javascript
import OralEyeApi from 'oral_eye_api';

let apiInstance = new OralEyeApi.LightsApi();
let lightsBlueMaxTimePostRequest = new OralEyeApi.LightsBlueMaxTimePostRequest(); // LightsBlueMaxTimePostRequest | 
apiInstance.lightsBlueMaxTimePost(lightsBlueMaxTimePostRequest, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **lightsBlueMaxTimePostRequest** | [**LightsBlueMaxTimePostRequest**](LightsBlueMaxTimePostRequest.md)|  | 

### Return type

[**LightsControlPost200Response**](LightsControlPost200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json


## lightsControlPost

> LightsControlPost200Response lightsControlPost(lightsStatusGet200Response)

Set lights on/off

### Example

```javascript
import OralEyeApi from 'oral_eye_api';

let apiInstance = new OralEyeApi.LightsApi();
let lightsStatusGet200Response = new OralEyeApi.LightsStatusGet200Response(); // LightsStatusGet200Response | 
apiInstance.lightsControlPost(lightsStatusGet200Response, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **lightsStatusGet200Response** | [**LightsStatusGet200Response**](LightsStatusGet200Response.md)|  | 

### Return type

[**LightsControlPost200Response**](LightsControlPost200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json


## lightsStatusGet

> LightsStatusGet200Response lightsStatusGet()

Get status of the lights

### Example

```javascript
import OralEyeApi from 'oral_eye_api';

let apiInstance = new OralEyeApi.LightsApi();
apiInstance.lightsStatusGet((error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**LightsStatusGet200Response**](LightsStatusGet200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

