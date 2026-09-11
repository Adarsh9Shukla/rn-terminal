cmake_minimum_required(VERSION 3.22.1)

project(rnterminal)

add_library(
    rnterminal
    SHARED
    src/main/cpp/pty.cpp
)

find_library(
    log-lib
    log
)

target_link_libraries(
    rnterminal
    ${log-lib}
)