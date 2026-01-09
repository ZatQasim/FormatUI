#include <node_api.h>
#include <fstream>
#include <string>
#include <chrono>
#include <iostream>

// Global file stream
std::ofstream logFile;

napi_value OpenLog(napi_env env, napi_callback_info info) {
    if (!logFile.is_open()) {
        logFile.open("system_audit.log", std::ios::app);
    }
    return NULL;
}

napi_value WriteLog(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    char buffer[2048];
    size_t result;
    napi_get_value_string_utf8(env, args[0], buffer, 2048, &result);

    // Get timestamp
    auto now = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
    
    // Write directly to disk (Fast)
    logFile << "[" << std::ctime(&now) << "] " << buffer << std::endl;
    logFile.flush(); // Ensure it's saved immediately

    return NULL;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "open", 0, OpenLog, 0, 0, 0, napi_default, 0 },
        { "write", 0, WriteLog, 0, 0, 0, napi_default, 0 }
    };
    napi_define_properties(env, exports, 2, desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
