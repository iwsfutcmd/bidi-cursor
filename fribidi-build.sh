emcc \
    lib/.libs/libfribidi.a \
    -O3 \
    --no-entry \
    -s STANDALONE_WASM \
    -s EXPORTED_FUNCTIONS='["_fribidi_log2vis", "_malloc", "_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["cwrap", "getValue", "setValue", "HEAP32", "HEAP8"]' \
    -s MODULARIZE=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s SINGLE_FILE=1 \
    -s EXPORT_NAME='createFriBidiModule' \
    -s ENVIRONMENT=web \
    -o fribidi.js
