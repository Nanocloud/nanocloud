// +build windows

/*
 * Nanocloud Community, a comprehensive platform to turn any application
 * into a cloud solution.
 *
 * Copyright (C) 2015 Nanocloud Software
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

package service

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/Nanocloud/community/plaza/router"
	log "github.com/Sirupsen/logrus"
	"golang.org/x/sys/windows/svc"
	"golang.org/x/sys/windows/svc/eventlog"
	"golang.org/x/sys/windows/svc/mgr"
)

const (
	serviceName = "plaza"
)

var (
	ServiceExistsAlready = errors.New("Service Exists Already")
	ServiceNotFound      = errors.New("Service Not Found")
)

func exePath() (string, error) {
	prog := os.Args[0]
	p, err := filepath.Abs(prog)
	if err != nil {
		return "", err
	}
	fi, err := os.Stat(p)
	if err == nil {
		if !fi.Mode().IsDir() {
			return p, nil
		}
		err = fmt.Errorf("%s is directory", p)
	}
	if filepath.Ext(p) == "" {
		p += ".exe"
		fi, err := os.Stat(p)
		if err == nil {
			if !fi.Mode().IsDir() {
				return p, nil
			}
			err = fmt.Errorf("%s is directory", p)
		}
	}
	return "", err
}

func startService(name string) error {
	log.Info("Starting Service")
	m, err := mgr.Connect()
	if err != nil {
		return err
	}
	defer m.Disconnect()
	s, err := m.OpenService(name)
	if err != nil {
		return fmt.Errorf("could not access service: %v", err)
	}
	defer s.Close()
	err = s.Start("service")
	if err != nil {
		return fmt.Errorf("could not start service: %v", err)
	}
	log.Info("Service started")
	return nil
}

func removeService(name string) error {
	log.Info("Removing service")

	m, err := mgr.Connect()
	if err != nil {
		return err
	}
	defer m.Disconnect()
	s, err := m.OpenService(name)
	if err != nil {
		log.Info("Service not installed")
		return ServiceNotFound
	}
	defer s.Close()
	err = s.Delete()
	if err != nil {
		return err
	}
	err = eventlog.Remove(name)
	if err != nil {
		return fmt.Errorf("RemoveEventLogSource() failed: %s", err)
	}
	log.Info("Service removed")
	return nil
}

func installService(name, exepath string) error {
	log.Info("Installing service")
	m, err := mgr.Connect()
	if err != nil {
		return err
	}
	defer m.Disconnect()
	s, err := m.OpenService(name)
	if err == nil {
		s.Close()
		log.Info("Service already installed")
		return ServiceExistsAlready
	}

	log.Info("Creating service")
	s, err = m.CreateService(
		name,
		exepath,
		mgr.Config{
			StartType:   mgr.StartAutomatic,
			DisplayName: name,
		},
		"service",
	)

	if err != nil {
		return err
	}
	defer s.Close()
	err = eventlog.InstallAsEventCreate(name, eventlog.Error|eventlog.Warning|eventlog.Info)
	if err != nil {
		s.Delete()
		return fmt.Errorf("SetupEventLogSource() failed: %s", err)
	}
	log.Info("Service created")
	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	cerr := out.Close()
	if err != nil {
		return err
	}
	return cerr
}

func InstallItSelf() error {
	if runtime.GOOS != "windows" {
		return errors.New("System Not Supported")
	}

	exepath, err := exePath()
	if err != nil {
		return err
	}

	err = removeService(serviceName)
	if err != nil {
		if err != ServiceNotFound {
			return err
		}
	}

	dst := `C:\Windows\plaza.exe`

	if exepath != dst {
		err = copyFile(exepath, dst)
		if err != nil {
			return err
		}
	}

	err = installService(serviceName, dst)
	if err != nil {
		return err
	}

	return startService(serviceName)
}

type myservice struct{}

func (m *myservice) Execute(args []string, r <-chan svc.ChangeRequest, changes chan<- svc.Status) (ssec bool, errno uint32) {
	log.Info("Executing service")
	const cmdsAccepted = svc.AcceptStop | svc.AcceptShutdown
	changes <- svc.Status{State: svc.StartPending}

	go router.Start()

	changes <- svc.Status{State: svc.Running, Accepts: cmdsAccepted}
loop:
	for {
		c := <-r
		switch c.Cmd {
		case svc.Interrogate:
			changes <- c.CurrentStatus
			// Testing deadlock from https://code.google.com/p/winsvc/issues/detail?id=4
			time.Sleep(100 * time.Millisecond)
			changes <- c.CurrentStatus
		case svc.Stop, svc.Shutdown:
			break loop
		default:
			log.Error("unexpected control request #%d", c)
		}
	}
	changes <- svc.Status{State: svc.StopPending}
	return
}

func Run() error {
	log.Infof("starting %s service", serviceName)

	err := svc.Run(serviceName, &myservice{})
	if err != nil {
		log.Infof("%s service failed: %v", serviceName, err)
		return err
	}
	log.Infof("service stopped")
	return nil
}
