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
