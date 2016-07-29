// +build windows

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

package windows

import (
	"syscall"
	"unsafe"
)

// SetWinlogonShell sets the value of
// `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon` in
// the windows registry.
func SetWinlogonShell(value string) error {
	winlogonKey, err := syscall.UTF16PtrFromString(
		`SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon`)
	if err != nil {
		return err
	}

	shell, err := syscall.UTF16PtrFromString("Shell")
	if err != nil {
		return err
	}
	explorerexe, err := syscall.UTF16PtrFromString(value)
	if err != nil {
		return err
	}

	var winlogon syscall.Handle
	err = syscall.RegOpenKeyEx(
		syscall.HKEY_LOCAL_MACHINE,
		winlogonKey,
		0,
		syscall.KEY_WRITE,
		&winlogon,
	)
	if err != nil {
		return err
	}
	defer syscall.RegCloseKey(winlogon)
	err = regSetKeyValue(
		winlogon,
		nil,
		shell,
		syscall.REG_SZ,
		(*byte)(unsafe.Pointer(explorerexe)),
		uint32(len(value)*2),
	)
	if err != nil {
		return err
	}
	return nil
}
