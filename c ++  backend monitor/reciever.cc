#include <node_api.h>
#include <string>

// This is the actual logic that processes the "received" data
napi_value ReceiveData(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    // 1. Extract the string from JavaScript
    char buffer[1024];
    size_t result;
    napi_get_value_string_utf8(env, args[0], buffer, 1024, &result);

    // 2. Process the data (Example: Simple validation or transformation)
    std::string data(buffer);
    std::string status = "PROCESSED: " + data;

    // 3. Convert back to a JS string and return
    napi_value output;
    napi_create_string_utf8(env, status.c_str(), status.length(), &output);
    
    return output;
}

// Initialize the module
napi_value Init(napi_env env, napi_value exports) {
    napi_value fn;
    napi_create_function(env, NULL, 0, ReceiveData, NULL, &fn);
    napi_set_named_property(env, exports, "receiveData", fn);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
