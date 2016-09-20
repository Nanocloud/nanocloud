# QEMU Manager

# Installation

```
docker build -t qemumanager .
docker run \
  --name qemumanager \
  -v /data/windows-server-2012-r2.qcow2:/data/windows-server-2012-r2.qcow2 \
  -v /dev/kvm:/dev/kvm \
  --privileged \
  -t qemumanager \
  node index.js
```
