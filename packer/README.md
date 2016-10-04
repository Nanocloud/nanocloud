# Packer templates for Nanocloud

Create a Windows Server 2012 qcow2 image able to use with Qemu driver.

## Quickstart

Firstly, [install **packer**](http://www.packer.io/intro/getting-started/setup.html).

Then run

```
packer build windows-2012-R2-standard-amd64.json
```

This will download an iso from Microsoft server and create a qcow2 image
with Plaza, Google Chrome and all you need to use Nanocloud.

When the build is finished you can compress your qcow2 image

```
./compress-qcow2.sh output-windows-2012R2/windows-server-2012R2-amd64.qcow2
```

Finally rename and move your file in Qemu directory to be able to use it

```
mv output-windows-2012R2/windows-server-2012R2-amd64.qcow2 ../qemu/image.qcow2
```
