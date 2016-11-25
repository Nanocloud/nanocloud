REG.exe Add HKLM\Software\Microsoft\ServerManager /V DoNotOpenServerManagerAtLogon /t REG_DWORD /D 0x1 /F
Set-ExecutionPolicy RemoteSigned -force
Invoke-WebRequest https://s3-eu-west-1.amazonaws.com/nanocloud/plaza/1.0.1/windows/amd64/plaza.exe -OutFile C:\plaza.exe
C:\plaza.exe install
rm C:\plaza.exe
New-NetFirewallRule -Protocol TCP -LocalPort 9090 -Direction Inbound -Action Allow -DisplayName PLAZA
