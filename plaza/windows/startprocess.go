/**
 * Nanocloud turns any traditional software into a cloud solution, without
 * changing or redeveloping existing source code.
 *
 * Copyright (C) 2016 Nanocloud Software
 *
 * This file is part of Nanocloud.
 *
 * Nanocloud is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Nanocloud is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */

// +build windows

package windows

import (
	"errors"
	"fmt"
	"os"
	"syscall"
	"unicode/utf16"
	"unsafe"
)

var zeroProcAttr syscall.ProcAttr
var zeroSysProcAttr syscall.SysProcAttr

func isSlash(c uint8) bool {
	return c == '\\' || c == '/'
}

func normalizeDir(dir string) (name string, err error) {
	ndir, err := syscall.FullPath(dir)
	if err != nil {
		return "", err
	}
	if len(ndir) > 2 && isSlash(ndir[0]) && isSlash(ndir[1]) {
		// dir cannot have \\server\share\path form
		return "", syscall.EINVAL
	}
	return ndir, nil
}

func volToUpper(ch int) int {
	if 'a' <= ch && ch <= 'z' {
		ch += 'A' - 'a'
	}
	return ch
}

// makeCmdLine builds a command line out of args by escaping "special"
// characters and joining the arguments with spaces.
func makeCmdLine(args []string) string {
	var s string
	for _, v := range args {
		if s != "" {
			s += " "
		}
		s += syscall.EscapeArg(v)
	}
	return s
}

func joinExeDirAndFName(dir, p string) (name string, err error) {
	if len(p) == 0 {
		return "", syscall.EINVAL
	}
	if len(p) > 2 && isSlash(p[0]) && isSlash(p[1]) {
		// \\server\share\path form
		return p, nil
	}
	if len(p) > 1 && p[1] == ':' {
		// has drive letter
		if len(p) == 2 {
			return "", syscall.EINVAL
		}
		if isSlash(p[2]) {
			return p, nil
		} else {
			d, err := normalizeDir(dir)
			if err != nil {
				return "", err
			}
			if volToUpper(int(p[0])) == volToUpper(int(d[0])) {
				return syscall.FullPath(d + "\\" + p[2:])
			} else {
				return syscall.FullPath(p)
			}
		}
	} else {
		// no drive letter
		d, err := normalizeDir(dir)
		if err != nil {
			return "", err
		}
		if isSlash(p[0]) {
			return syscall.FullPath(d[:2] + p)
		} else {
			return syscall.FullPath(d + "\\" + p)
		}
	}
	// we shouldn't be here
	// return "", syscall.EINVAL
}

func enableAllPrivileges(token syscall.Token) error {
	privileges := []string{
		"SeCreateTokenPrivilege",
		"SeAssignPrimaryTokenPrivilege",
		"SeLockMemoryPrivilege",
		"SeIncreaseQuotaPrivilege",
		"SeMachineAccountPrivilege",
		"SeTcbPrivilege",
		"SeSecurityPrivilege",
		"SeTakeOwnershipPrivilege",
		"SeLoadDriverPrivilege",
		"SeSystemProfilePrivilege",
		"SeSystemtimePrivilege",
		"SeProfileSingleProcessPrivilege",
		"SeIncreaseBasePriorityPrivilege",
		"SeCreatePagefilePrivilege",
		"SeCreatePermanentPrivilege",
		"SeBackupPrivilege",
		"SeRestorePrivilege",
		"SeShutdownPrivilege",
		"SeDebugPrivilege",
		"SeAuditPrivilege",
		"SeSystemEnvironmentPrivilege",
		"SeChangeNotifyPrivilege",
		"SeRemoteShutdownPrivilege",
		"SeUndockPrivilege",
		"SeSyncAgentPrivilege",
		"SeEnableDelegationPrivilege",
		"SeManageVolumePrivilege",
		"SeImpersonatePrivilege",
		"SeCreateGlobalPrivilege",
		"SeTrustedCredManAccessPrivilege",
		"SeRelabelPrivilege",
		"SeIncreaseWorkingSetPrivilege",
		"SeTimeZonePrivilege",
		"SeCreateSymbolicLinkPrivilege",
	}

	for _, privilege := range privileges {
		err := EnablePrivilege(token, privilege)
		if err != nil {
			return err
		}
	}
	return nil
}

// createEnvBlock converts an array of environment strings into
// the representation required by CreateProcess: a sequence of NUL
// terminated strings followed by a nil.
// Last bytes are two UCS-2 NULs, or four NUL bytes.
func createEnvBlock(envv []string) *uint16 {
	if len(envv) == 0 {
		return &utf16.Encode([]rune("\x00\x00"))[0]
	}
	length := 0
	for _, s := range envv {
		length += len(s) + 1
	}
	length += 1

	b := make([]byte, length)
	i := 0
	for _, s := range envv {
		l := len(s)
		copy(b[i:i+l], []byte(s))
		copy(b[i+l:i+l+1], []byte{0})
		i = i + l + 1
	}
	copy(b[i:i+1], []byte{0})

	return &utf16.Encode([]rune(string(b)))[0]
}

func getUserSessionID(username string) (DWord, error) {
	/* Retreive the user's session */
	var session *wtsSessionInfo1
	sessions, err := wtsEnumerateSessionsEx(0)
	if err != nil {
		return 0, err
	}

	for _, s := range sessions {
		if username == s.userName {
			session = &s
			return session.sessionID, nil
		}
	}
	return 0, errors.New("Session not found")
}

func startProcessAsUser(
	argv0 string, argv []string,
	username string, domain string,
	attr *syscall.ProcAttr,
) (pid int, handle uintptr, err error) {
	if len(argv0) == 0 {
		return 0, 0, syscall.EWINDOWS
	}
	if attr == nil {
		attr = &zeroProcAttr
	}
	sys := attr.Sys
	if sys == nil {
		sys = &zeroSysProcAttr
	}

	if len(attr.Files) > 3 {
		return 0, 0, syscall.EWINDOWS
	}
	if len(attr.Files) < 3 {
		return 0, 0, syscall.EINVAL
	}

	if len(attr.Dir) != 0 {
		// StartProcess assumes that argv0 is relative to attr.Dir,
		// because it implies Chdir(attr.Dir) before executing argv0.
		// Windows CreateProcess assumes the opposite: it looks for
		// argv0 relative to the current directory, and, only once the new
		// process is started, it does Chdir(attr.Dir). We are adjusting
		// for that difference here by making argv0 absolute.
		argv0, err = joinExeDirAndFName(attr.Dir, argv0)
		if err != nil {
			return 0, 0, err
		}
	}
	argv0p, err := syscall.UTF16PtrFromString(argv0)
	if err != nil {
		return 0, 0, err
	}

	var cmdline string
	// Windows CreateProcess takes the command line as a single string:
	// use attr.CmdLine if set, else build the command line by escaping
	// and joining each argument with spaces
	if sys.CmdLine != "" {
		cmdline = sys.CmdLine
	} else {
		cmdline = makeCmdLine(argv)
	}

	var argvp *uint16
	if len(cmdline) != 0 {
		argvp, err = syscall.UTF16PtrFromString(cmdline)
		if err != nil {
			return 0, 0, err
		}
	}

	// Acquire the fork lock so that no other threads
	// create new fds that are not yet close-on-exec
	// before we fork.
	syscall.ForkLock.Lock()
	defer syscall.ForkLock.Unlock()

	p, _ := syscall.GetCurrentProcess()
	fd := make([]syscall.Handle, len(attr.Files))
	for i := range attr.Files {
		if attr.Files[i] > 0 {
			err = syscall.DuplicateHandle(p, syscall.Handle(attr.Files[i]), p, &fd[i], 0, true, syscall.DUPLICATE_SAME_ACCESS)
			if err != nil {
				return 0, 0, errors.New("DuplicateHandle: " + err.Error())
			}
			defer syscall.CloseHandle(syscall.Handle(fd[i]))
		}
	}
	si := new(syscall.StartupInfo)
	si.Cb = uint32(unsafe.Sizeof(*si))
	si.Flags = syscall.STARTF_USESTDHANDLES
	if sys.HideWindow {
		si.Flags |= syscall.STARTF_USESHOWWINDOW
		si.ShowWindow = syscall.SW_HIDE
	}
	si.StdInput = fd[0]
	si.StdOutput = fd[1]
	si.StdErr = fd[2]

	wsDesktop, err := syscall.UTF16PtrFromString(`winsta0\default`)
	if err != nil {
		return 0, 0, err
	}

	si.Desktop = wsDesktop

	sessionID, err := getUserSessionID(username)
	if err != nil {
		return 0, 0, err
	}

	token, err := wtsQueryUserToken(sessionID)
	if err != nil {
		return 0, 0, fmt.Errorf("Query User Token Failed: %s", err.Error())
	}
	defer token.Close()

	err = enableAllPrivileges(token)
	if err != nil {
		return 0, 0, errors.New("enableAllPrivileges: " + err.Error())
	}

	var dirp *uint16
	if len(attr.Dir) != 0 {
		dirp, err = syscall.UTF16PtrFromString(attr.Dir)
		if err != nil {
			return 0, 0, err
		}
	} else {
		dirp, err = getUserProfileDirectory(token)
		if err != nil {
			return 0, 0, err
		}
	}

	var env *uint16
	env, err = createEnvironmentBlock(token, false)
	if err != nil {
		return 0, 0, errors.New("createEnvironmentBlock: " + err.Error())
	}
	defer destroyEnvironmentBlock(env)

	err = impersonateLoggedOnUser(token)
	if err != nil {
		return 0, 0, errors.New("impersonateLoggedOnUser: " + err.Error())
	}
	defer revertToSelf()

	pi := new(syscall.ProcessInformation)

	flags := sys.CreationFlags

	flags |= syscall.CREATE_UNICODE_ENVIRONMENT
	flags |= uint32(normalPriorityClass)
	flags |= uint32(createNewConsole)

	err = createProcessAsUser(
		token,
		argv0p,
		argvp,
		nil,
		nil,
		true,
		flags,
		env,
		dirp,
		si,
		pi,
	)
	if err != nil {
		return 0, 0, errors.New("createProcessAsUser: " + err.Error())
	}

	defer syscall.CloseHandle(syscall.Handle(pi.Thread))

	return int(pi.ProcessId), uintptr(pi.Process), nil
}

func startProcess(
	name string, argv []string,
	username string, domain string,
	attr *os.ProcAttr,
) (p *Process, err error) {
	sysattr := &syscall.ProcAttr{
		Dir: attr.Dir,
		Sys: attr.Sys,
	}
	for _, f := range attr.Files {
		sysattr.Files = append(sysattr.Files, f.Fd())
	}

	pid, h, e := startProcessAsUser(name, argv, username, domain, sysattr)

	if e != nil {
		return nil, e
	}
	return newProcess(pid, h), nil
}
