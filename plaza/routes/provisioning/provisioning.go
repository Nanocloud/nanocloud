/*
 * Nanocloud Community, a comprehensive platform to turn any application
 * into a cloud solution.
 *
 * Copyright (C) 2016 Nanocloud Software
 *
 * This file is part of Nanocloud community.
 *
 * Nanocloud community is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Nanocloud community is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// +build windows,amd64

package provisioning

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"os/exec"
	"strings"
	"syscall"
	"time"
	"unsafe"

	"github.com/Nanocloud/community/plaza/router"
	log "github.com/Sirupsen/logrus"
)

type hash map[string]interface{}

const (
	domain        = "intra.localdomain.com"
	pcname        = "adapps"
	adminUsername = "Administrator"
	adminPassword = "Nanocloud123+"
)

func executeCommand(command string) (string, error) {
	cmd := exec.Command("powershell.exe", command)
	resp, err := cmd.CombinedOutput()
	if err != nil {
		return string(resp), err
	}
	return string(resp), nil
}

var commands = [][]string{
	{
		"New-Item HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows -Name WindowsUpdate",
		"New-Item HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate -Name AU",
		"New-ItemProperty HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU -Name NoAutoUpdate -Value 1",
	},
	{
		"Install-windowsfeature AD-domain-services",
		"Import-Module ADDSDeployment; $pwd=ConvertTo-SecureString '" + adminPassword + "' -asplaintext -force; Install-ADDSForest -CreateDnsDelegation:$false -DatabasePath 'C:\\Windows\\NTDS' -DomainMode 'Win2012R2' -DomainName '" + domain + "' -SafeModeAdministratorPassword:$pwd -DomainNetbiosName 'INTRA' -ForestMode 'Win2012R2' -InstallDns:$true -LogPath 'C:\\Windows\\NTDS' -NoRebootOnCompletion:$true -SysvolPath 'C:\\Windows\\SYSVOL' -Force:$true",
	},
	{
		"set-ItemProperty -Path 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server'-name 'fDenyTSConnections' -Value 0",
		"Enable-NetFirewallRule -Name 'RemoteDesktop-UserMode-In-TCP'",
		"set-ItemProperty -Path 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -name 'UserAuthentication' -Value 1",
	},
	{
		"import-module RemoteDesktop; Import-module ServerManager; Add-WindowsFeature -Name RDS-RD-Server -IncludeAllSubFeature; Add-WindowsFeature -Name RDS-Web-Access -IncludeAllSubFeature; Add-WindowsFeature -Name RDS-Connection-Broker -IncludeAllSubFeature",
	},
	{
		"import-module RemoteDesktop; Import-module ServerManager; Install-windowsfeature RSAT-AD-AdminCenter",
	},
	{
		"sc.exe config RDMS start= auto",
		"NEW-ADOrganizationalUnit 'NanocloudUsers' -path 'DC=intra,DC=localdomain,DC=com'",
	},
	{
		"Import-Module ServerManager; Add-WindowsFeature Adcs-Cert-Authority",
		"$secpasswd = ConvertTo-SecureString '" + adminPassword + "' -AsPlainText -Force;$mycreds = New-Object System.Management.Automation.PSCredential ('" + adminUsername + "', $secpasswd); Install-AdcsCertificationAuthority -CAType 'EnterpriseRootCa' -Credential:$mycreds -force:$true ",
		"New-NetFirewallRule -Protocol TCP -LocalPort 9090 -Direction Inbound -Action Allow -DisplayName PLAZA",
	},
	{
		"C:\\Windows\\System32\\WindowsPowershell\\v1.0\\powershell.exe \"Start-Service RDMS; import-module remotedesktop ; New-RDSessionDeployment -ConnectionBroker " + pcname + "." + domain + " -WebAccessServer " + pcname + "." + domain + " -SessionHost " + pcname + "." + domain + "\"",
	},
	{
		"C:\\Windows\\System32\\WindowsPowershell\\v1.0\\powershell.exe \"import-module remotedesktop ; New-RDSessionCollection -CollectionName collection -SessionHost " + pcname + "." + domain + " -CollectionDescription 'Nanocloud collection' -ConnectionBroker " + pcname + "." + domain + "\"",
	},
	{
		"C:\\Windows\\System32\\WindowsPowershell\\v1.0\\powershell.exe \"import-module remotedesktop ; New-RDRemoteApp -CollectionName collection -DisplayName hapticPowershell -FilePath 'C:\\Windows\\system32\\WindowsPowerShell\\v1.0\\powershell.exe' -Alias hapticPowershell -CommandLineSetting Require -RequiredCommandLine '-ExecutionPolicy Bypass c:\\publishApplication.ps1'\"",
	},
	{
		"C:\\Windows\\System32\\WindowsPowershell\\v1.0\\powershell.exe \"(Get-WmiObject -class 'Win32_TSGeneralSetting' -Namespace root\\cimv2\\terminalservices -ComputerName " + pcname + ").SetUserAuthenticationRequired(0)",
	},
}

const (
	OUCREATION       = 5
	SESSIONDEPLOY    = 7
	CREATECOLLECTION = 8
	PUBLISHAPP       = 9
	DISABLENLA       = 10
)

var confPath = "C:/prov.json"

func executeCommands(commands []string) error {
	var err error
	var resp string
	for _, cmd := range commands {
		resp, err = executeCommand(cmd)
		log.Error(string(resp))
		if err != nil {
			log.Error(err)
			return err
		}
	}
	return nil
}

func markAsDone(conf []bool, action int) {
	conf[action] = true
	b, err := json.Marshal(conf)
	if err != nil {
		log.Error(err)
		return
	}
	err = ioutil.WriteFile(confPath, b, 0644)
}

func LaunchAll() {
	go router.Start()
	ProvisionAll()
}

func AddOu(tab []string) {
	var err error
	for {
		err = executeCommands(tab)
		if err == nil {
			break
		}
		log.Error("Trying again to create OU...")
		time.Sleep(time.Second * 15)
	}
}

type startupinfo struct {
	/* DWORD */ cb uint32
	/* LPSTR */ lpReserved uintptr
	/* LPSTR */ lpDesktop uintptr
	/* LPSTR */ lpTitle uintptr
	/* DWORD */ dwX uint32
	/* DWORD */ dwY uint32
	/* DWORD */ dwXSize uint32
	/* DWORD */ dwYSize uint32
	/* DWORD */ dwXCountChars uint32
	/* DWORD */ dwYCountChars uint32
	/* DWORD */ dwFillAttribute uint32
	/* DWORD */ dwFlags uint32
	/* WORD */ wShowWindow uint16
	/* WORD */ cbReserved2 uint16
	/* LPBYTE */ lpReserved2 uintptr
	/* HANDLE */ hStdInput uintptr
	/* HANDLE */ hStdOutput uintptr
	/* HANDLE */ hStdError uintptr
}

type processinfo struct {
	/* HANDLE */ hProcess uintptr
	/* HANDLE */ hThread uintptr
	/* DWORD */ dwProcessId uint32
	/* DWORD */ dwThreadId uint32
}

type HANDLE uintptr
type PHANDLE *HANDLE

const (
	LOGON_WITH_PROFILE        = 0x1
	LOGON32_LOGON_BATCH       = 4
	LOGON32_PROVIDER_DEFAULT  = 0
	LOGON32_LOGON_INTERACTIVE = 2
)

func executeCommandAsAdmin(cmd string) {
	var si startupinfo
	var handle HANDLE
	var pi processinfo

	si.cb = uint32(unsafe.Sizeof(si))

	a := syscall.MustLoadDLL("advapi32.dll")
	LogonUserW := a.MustFindProc("LogonUserW")
	r1, r2, lastError := LogonUserW.Call(
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(adminUsername))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(domain))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(adminPassword))),
		LOGON32_LOGON_INTERACTIVE,
		LOGON32_PROVIDER_DEFAULT,
		uintptr(unsafe.Pointer(&handle)),
	)
	log.Error(r1)
	log.Error(r2)
	log.Error(lastError)

	CreateProcessAsUser := a.MustFindProc("CreateProcessAsUserW")
	r1, r2, lastError = CreateProcessAsUser.Call(
		uintptr(unsafe.Pointer(handle)),
		uintptr(unsafe.Pointer(nil)),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(cmd))),
		uintptr(unsafe.Pointer(nil)),
		uintptr(unsafe.Pointer(nil)),
		uintptr(0),
		uintptr(unsafe.Pointer(nil)),
		uintptr(unsafe.Pointer(nil)),
		uintptr(unsafe.Pointer(nil)),
		uintptr(unsafe.Pointer(&si)),
		uintptr(unsafe.Pointer(&pi)),
	)
	log.Error(r1)
	log.Error(r2)
	log.Error(lastError)

	b := syscall.MustLoadDLL("Kernel32.dll")
	CloseHandle := b.MustFindProc("CloseHandle")
	r1, r2, lastError = CloseHandle.Call(
		uintptr(unsafe.Pointer(handle)),
	)
	log.Error(r1)
	log.Error(r2)
	log.Error(lastError)
}

func waitDeploy(cmd string) {
	for {
		time.Sleep(time.Second * 45)
		resp, _ := executeCommand("import-module remotedesktop; Get-RDSessionCollection -CollectionName 'collection'")
		if !strings.Contains(string(resp), "does not exist") {
			log.Error("|||||||||||", string(resp), "|||||||||||||||||")
			log.Error("Session successfuly deployed...")
			break
		} else {
			log.Error("Trying de deploy a session...")
			executeCommandAsAdmin(cmd)
		}
	}
}

func waitCollection(cmd string) {
	for {
		resp, _ := executeCommand("import-module remotedesktop; Get-RDSessionCollection -CollectionName 'collection'")
		if strings.Contains(string(resp), "Nanocloud") {
			log.Error("Collection successfully created")
			break
		} else {
			log.Error("Trying to create a collection...")
			executeCommandAsAdmin(cmd)
			time.Sleep(time.Second * 45)
		}
	}
}

func waitApp(cmd string) {
	for {
		resp, _ := executeCommand("import-module remotedesktop; Get-RDRemoteApp")
		if strings.Contains(string(resp), "haptic") {
			log.Error("App published successfully")
			break
		} else {
			log.Error("Trying to publish hapticpowershit...")
			executeCommandAsAdmin(cmd)
			time.Sleep(time.Second * 45)
		}
	}
}

func movePublishAppScript() {
	err := os.Rename("D:\\publishApplication.ps1", "C:\\publishApplication.ps1")
	if err != nil {
		log.Error(err)
	}
}

func vmReady() bool {

	resp, _ := executeCommand("import-module remotedesktop; Get-RDRemoteApp")
	if strings.Contains(string(resp), "haptic") {
		return true
	}
	return false
}

func ProvisionAll() {
	if _, err := os.Stat(confPath); os.IsNotExist(err) {
		os.Create(confPath)
		var p = make([]bool, 11)
		b, err := json.Marshal(p)
		if err != nil {
			log.Error(err)
		}
		err = ioutil.WriteFile(confPath, b, 0644)
	}

	file, err := ioutil.ReadFile(confPath)
	if err != nil {
		log.Error(err)
		return
	}
	var conf []bool
	err = json.Unmarshal(file, &conf)
	if conf[10] == true || vmReady() {
		return
	}
	movePublishAppScript()
	for index, done := range conf {
		if !done {
			for i, val := range commands[index:] {
				switch i + index {
				case OUCREATION:
					AddOu(val)
				case SESSIONDEPLOY:
					waitDeploy(val[0])
				case CREATECOLLECTION:
					waitCollection(val[0])
				case PUBLISHAPP:
					waitApp(val[0])
				case DISABLENLA:
					executeCommandAsAdmin(val[0])
				default:
					err = executeCommands(val)
				}
				if err == nil {
					markAsDone(conf, i+index)
				} else {
					return
				}
				if i+index == 4 {
					executeCommand("Restart-Computer -Force")
					return
				}
			}
			break
		}
	}
	executeCommand("Stop-Computer -Force")
	return
}

/*
func DisableWU(c *echo.Context) error {
	return executeCommands(commands["disablewu"], c)
}

func reterr(e error, resp string, c *echo.Context) error {
	return c.JSON(
		http.StatusInternalServerError,
		hash{
			"error": []hash{
				hash{
					"title":  e.Error(),
					"detail": resp,
				},
			},
		},
	)
}

func retok(c *echo.Context) error {
	return c.JSON(
		http.StatusOK,
		hash{
			"data": hash{
				"success": true,
			},
		},
	)
}

func CheckWU(c *echo.Context) error {
	resp, err := executeCommand("Get-ItemProperty HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU")
	if err != nil {
		return reterr(err, resp, c)
	}
	if strings.Contains(resp, "NoAutoUpdate : 1") {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"windows-update": "disabled",
				},
			},
		)
	} else {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"windows-update": "enabled",
				},
			},
		)
	}
}

func InstallAD(c *echo.Context) error {
	return executeCommands(commands["installad"], c)
}

func CheckAD(c *echo.Context) error {
	resp, err := executeCommand("Get-ADForest")
	if err != nil {
		return reterr(err, resp, c)
	}
	if strings.Contains(resp, "intra.localdomain.com") {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"state": "Nanocloud forest installed",
				},
			},
		)
	} else {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"state": "Nanocloud forest not installed",
				},
			},
		)
	}
}

func EnableRDP(c *echo.Context) error {
	return executeCommands(commands["enablerdp"], c)
}

func CheckRDP(c *echo.Context) error {
	resp, err := executeCommand("Write-Host (Get-Service -Name RDMS).status")
	if err != nil {
		return reterr(err, resp, c)
	}
	if strings.Contains(resp, "Running") {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"state": "RDP Service running",
				},
			},
		)
	} else {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"state": "RDP Service is down",
				},
			},
		)
	}
}

func InstallRDS(c *echo.Context) error {
	return executeCommands(commands["installrds"], c)
}

func CheckRDS(c *echo.Context) error {
	resp, err := executeCommand("Write-Host (Get-Service -Name TermService).status")
	if err != nil {
		return reterr(err, resp, c)
	}
	if strings.Contains(resp, "Running") {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"state": "RDS Service running",
				},
			},
		)
	} else {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"state": "RDS Service is down",
				},
			},
		)
	}
}

func CreateOU(c *echo.Context) error {
	return executeCommands(commands["createou"], c)
}

func CheckOU(c *echo.Context) error {
	resp, err := executeCommand("Get-ADOrganizationalUnit -Filter 'Name -like \"NanocloudUsers\"'")
	if err != nil {
		return reterr(err, resp, c)
	}
	if strings.Contains(resp, "NanocloudUsers") {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"organizational-unit": "created",
				},
			},
		)
	} else {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"organizational-unit": "Not created",
				},
			},
		)
	}
}

func InstallADCS(c *echo.Context) error {
	return executeCommands(commands["installadcs"], c)
}

func CheckADCS(c *echo.Context) error {
	resp, err := executeCommand("Write-Host (Get-Service -Name CertSvc).status")
	if err != nil {
		return reterr(err, resp, c)
	}
	if strings.Contains(resp, "Running") {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"state": "ADCS Service running",
				},
			},
		)
	} else {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"state": "ADCS Service is down",
				},
			},
		)
	}
}

func SessionDeploy(c *echo.Context) error {
	return executeCommands(commands["sessiondeploy"], c)
}

func CheckCollection(c *echo.Context) error {
	resp, err := executeCommand("import-module remotedesktop; Get-RDSessionCollection -CollectionName 'collection'")
	if err != nil {
		return reterr(err, resp, c)
	}
	if strings.Contains(resp, "collection") {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"status": "collection created",
				},
			},
		)
	} else {
		return c.JSON(
			http.StatusOK,
			hash{
				"data": hash{
					"status": "collection not created",
				},
			},
		)
	}
}*/
