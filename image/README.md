# Nanocloud image

This directory list what is necessary on a windows image to work with
Nanocloud.

## Basic configuration

- Install Chrome

```
Invoke-WebRequest http://dl.google.com/chrome/install/chrome_installer.exe -OutFile chrome_installer.exe
./chrome_installer.exe /install
rm chrome_installer.exe
```
- Install Microsoft Desktop Experience

```
Add-WindowsFeature Desktop-Experience
```

- Hide Amazon's icons on desktop
- Remove Server Manager and Powershell from taskbar
- Add Nanocloud Wallpaper

## Configure auto logon

Auto logon is necessary to join machine to LDAP on start.

```
Invoke-WebRequest https://live.sysinternals.com/Autologon.exe -OutFile Autologon.exe
.\Autologon.exe
```

Agree terms and add user credentials you want to auto logon.

```
rm Autologon.exe
```

## Configure RDS

Install RDS Windows features:

```
Import-module RemoteDesktop
Import-module ServerManager
Add-WindowsFeature -Name RDS-RD-Server -IncludeAllSubFeature
Add-WindowsFeature -Name RDS-Web-Access -IncludeAllSubFeature
Add-WindowsFeature -Name RDS-Connection-Broker -IncludeAllSubFeature
Install-WindowsFeature RSAT-AD-AdminCenter
```

*Don't forget to restart your machine to complete installation of
Windows features.*
