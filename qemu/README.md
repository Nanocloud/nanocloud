# QEMU Manager

Manages local machines using Qemu.

# Installation

A qcow2 image is expected to be located in `./qemu/image.qcow2`.
This image must be a Windows Server 2012 with plaza installed an RDP
enabled.

You can download a qcow2 image with this link: https://s3-eu-west-1.amazonaws.com/nanocloud/windows-server-2012-r2.qcow2

```
docker-compose -f docker-compose-extra.yml up qemu-manager
```
