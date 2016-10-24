cmake_minimum_required(VERSION 2.8)
project(Photon)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH}
    ${CMAKE_SOURCE_DIR}/CMakeModules)

find_package(Git REQUIRED)
find_package(DepotTools REQUIRED)

#
# Options
#

option(BUILD_TESTS "Build test binaries" OFF)
option(BUILD_SAMPLES "Build samples binaries" OFF)

#
# Versioning
#

set(LIBWEBRTC_MAJOR_VERSION 0)
set(LIBWEBRTC_MINOR_VERSION 0)
set(LIBWEBRTC_PATCH_VERSION 1)
set(LIBWEBRTC_BUILD_VERSION rc.4)

set(LIBWEBRTC_API_VERSION
    "${LIBWEBRTC_MAJOR_VERSION}.${LIBWEBRTC_MINOR_VERSION}.${LIBWEBRTC_PATCH_VERSION}")
set(LIBWEBRTC_VERSION
    ${LIBWEBRTC_API_VERSION}-${LIBWEBRTC_BUILD_VERSION})

set(LIBWEBRTC_LIBRARY_PROPERTIES ${LIBWEBRTC_LIBRARY_PROPERTIES}
    VERSION "${LIBWEBRTC_VERSION}"
    SOVERSION "${LIBWEBRTC_API_VERSION}")

set(LIBWEBRTC_WEBRTC_REVISION 7502401788fcba5c9f81a9e4701e2f0831e78698)

#
# Directories
#

if (NOT LIBWEBRTC_INSTALL_BIN_DIR)
  set(LIBWEBRTC_INSTALL_BIN_DIR "bin")
endif ()
if (NOT LIBWEBRTC_INSTALL_LIB_DIR)
  set(LIBWEBRTC_INSTALL_LIB_DIR "lib")
endif ()
if (NOT LIBWEBRTC_INSTALL_DATA_DIR)
  set(LIBWEBRTC_INSTALL_DATA_DIR "share")
endif ()
if (NOT LIBWEBRTC_INSTALL_INCLUDE_DIR)
  set(LIBWEBRTC_INSTALL_INCLUDE_DIR "include")
endif ()

set(LIBWEBRTC_LIBRARY_NAME ${CMAKE_STATIC_LIBRARY_PREFIX}webrtc${CMAKE_STATIC_LIBRARY_SUFFIX})

set(LIBWEBRTC_LIBRARY_PATH ${CMAKE_BINARY_DIR}/${LIBWEBRTC_INSTALL_LIB_DIR}/${LIBWEBRTC_LIBRARY_NAME})

set(LIBWEBRTC_BUILD_ROOT ${CMAKE_SOURCE_DIR}/src/out/Default)
set(LIBWEBRTC_CHROMIUM_DEPS https://github.com/aisouard/libwebrtc-chromium-deps.git)

add_subdirectory(Targets)

if (BUILD_SAMPLES)
  add_subdirectory(Samples)
endif (BUILD_SAMPLES)

project(Photon)

set(PHOTON_SOURCE_FILES
        capture_thread.cc
        capturer.cc
        conductor.cc
        defaults.cc
        input_manager.cc
        main.cc
        http/server/connection.cc
        http/server/connection_manager.cc
        http/server/request_parser.cc
        http/server/response.cc
        http/server/server.cc
)

set(PHOTON_HEADER_FILES
        capture_thread.h
        capturer.h
        conductor.h
        defaults.h
        input_manager.h
        http/server/connection.h
        http/server/connection_manager.h
        http/server/header.h
        http/server/request.h
        http/server/request_handler.h
        http/server/request_parser.h
        http/server/response.h
        http/server/server.h
)

include_directories(${CMAKE_SOURCE_DIR}/src)

if(WIN32)
  include_directories(${CMAKE_SOURCE_DIR}/packages/boost.1.62.0.0/lib/native/include)
endif(WIN32)

if(WIN32)
    add_definitions(-DWEBRTC_WIN -DNOMINMAX)
else(WIN32)
    add_definitions(-DWEBRTC_POSIX -std=gnu++0x -D_GLIBCXX_USE_CXX11_ABI=0)
endif(WIN32)

add_executable(Photon
        ${PHOTON_SOURCE_FILES}
        ${PHOTON_HEADER_FILES})

set(PHOTON_LIBRARIES ${LIBWEBRTC_LIBRARY_PATH})

target_link_libraries(Photon ${PHOTON_LIBRARIES})

find_program(NUGET nuget)
if(NOT NUGET)
  message(FATAL "Cannot find nuget command line tool.\nInstall it with e.g. choco install nuget.commandline")
else()
  execute_process(COMMAND ${NUGET} restore ${CMAKE_SOURCE_DIR}/Photon.sln)
endif()
