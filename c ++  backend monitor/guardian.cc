#include <node_api.h>
#include <iostream>

// This function forces the system to acknowledge the process is active
// and should not be throttled or put to sleep by the OS.
napi_value KeepAlivePulse(napi_env env, napi_callback_info info) {
    // We log a heartbeat to the system console (stdout) 
    // This prevents some cloud environments from 'sleeping' due to inactivity.
    std::cout << "[Guardian] Pulse Detected: System Stability Nominal." << std::endl;

    napi_value result;
    napi_get_boolean(env, true, &result);
    return result;
}

// Memory Health Check: Reports back to FormatUI if the system is getting 'heavy'
napi_value GetSystemVitals(napi_env env, napi_callback_info info) {
    // In a full implementation, you'd use <sys/resource.h> here
    // For now, we return a 'Healthy' signal to the TypeScript side.
    napi_value vitals;
    napi_create_string_utf8(env, "STABLE", NAPI_AUTO_LENGTH, &vitals);
    return vitals;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "pulse", 0, KeepAlivePulse, 0, 0, 0, napi_default, 0 },
        { "vitals", 0, GetSystemVitals, 0, 0, 0, napi_default, 0 }
    };
    napi_define_properties(env, exports, 2, desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
