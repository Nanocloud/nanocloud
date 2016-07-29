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

import "syscall"

var dlls map[string]*syscall.DLL

func loadDLL(name string) (dll *syscall.DLL, err error) {
	if dlls == nil {
		dlls = make(map[string]*syscall.DLL)
	}

	dll, exists := dlls[name]
	if !exists {
		dll, err = syscall.LoadDLL(name)
		if err != nil {
			return
		}
		dlls[name] = dll
	}
	return
}

func loadProc(dllName string, procName string) (*syscall.Proc, error) {
	dll, err := loadDLL(dllName)
	if err != nil {
		return nil, err
	}
	return dll.FindProc(procName)
}
