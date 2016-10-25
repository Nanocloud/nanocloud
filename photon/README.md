# Photon

Photon is an experimental high performance remote application streaming engine. It is a daemon relying on WebRTC to stream a Windows desktop to a web client.

Photon is **still experimental** see known limitations at the end of this README.

## Prerequisites

* Visual Studio 2015 Update 2 - Download the [Installer][vs2015-installer] or [ISO image][vs2015-iso]

  Make sure that you install the following components:

  * Visual C++, which will select three sub-categories including MFC
  * Universal Windows Apps Development Tools > Tools
  * Universal Windows Apps Development Tools > Windows 10 SDK (**10.0.10586**)

  You must have the **10586** SDK installed or else you will hit compile errors such as redefined macros.

* Depots tools from Google (https://www.chromium.org/developers/how-tos/install-depot-tools)

* Cmake > 2.8

* Nuget

## Build Photon

Run the following command in the photon directory:

```
cmake . -DCMAKE_GENERATOR_PLATFORM=x64 -DCMAKE_BUILD_TYPE=Release
```

This will generate a Visual Studio solution **Photon.sln**.
This solution contains everything to build Photon and its dependencies (including WebRTC).

**For now, only compilation in Release mode works**

To build Photon, simply right click on the solution and then click *Build*.
The binary will be available in `photon/Release/Photon.exe`.

## Known limitations

Building:
- Even though the build system relies on `cmake` to build Photon, this has only been tested on Windows yet
- Photon is only compilable in Release mode for now

Streaming engine compared to Guacamole (Nanocloud's current streaming engine):
- No clipboard synchronisation
- No printer
- No live window resizing
- More latency in regular office applications

[appveyor-img]:https://ci.appveyor.com/api/projects/status/yd1s303md3tt4w9a?svg=true
[appveyor-href]:https://ci.appveyor.com/project/aisouard/libwebrtc
[travis-img]:https://travis-ci.org/aisouard/libwebrtc.svg?branch=master
[travis-href]:https://travis-ci.org/aisouard/libwebrtc
[vs2015-installer]:https://go.microsoft.com/fwlink/?LinkId=615448&clcid=0x409
[vs2015-iso]:https://go.microsoft.com/fwlink/?LinkId=615448&clcid=0x409
