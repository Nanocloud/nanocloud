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

package files

import (
	"fmt"
	"os"
	"syscall"
)

func loadFileId(filepath string) (string, error) {
	pathp, err := syscall.UTF16PtrFromString(filepath)
	if err != nil {
		return "", err
	}
	h, err := syscall.CreateFile(pathp, 0, 0, nil, syscall.OPEN_EXISTING, syscall.FILE_FLAG_BACKUP_SEMANTICS, 0)
	if err != nil {
		return "", err
	}
	defer syscall.CloseHandle(h)
	var i syscall.ByHandleFileInformation
	err = syscall.GetFileInformationByHandle(syscall.Handle(h), &i)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%x-%x-%x", i.VolumeSerialNumber, i.FileIndexHigh, i.FileIndexLow), nil
}

func isFileHidden(file os.FileInfo) bool {
	sys := file.Sys().(*syscall.Win32FileAttributeData)

	if sys.FileAttributes&syscall.FILE_ATTRIBUTE_HIDDEN == syscall.FILE_ATTRIBUTE_HIDDEN {
		return true
	}
	return false
}
