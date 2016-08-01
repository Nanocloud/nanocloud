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

package processmanager

import (
	"bytes"
	"fmt"
	"os"
	"sync"

	"github.com/Nanocloud/community/plaza/windows"
	log "github.com/Sirupsen/logrus"
)

// session represents a Windows sessions.
type session struct {
	// pid is the pid of the shell application of the session.
	// The shell application is the first application launched when the session
	// open.
	// As the sessions is not necessary running, it may be nul.
	pid int

	// username is the username of the session's owner.
	username string

	// domain is the domain name of the sessions's owner.
	domain string

	// running is true if the sessions is open. False Otherwise.
	running bool

	// apps is a channel containning the list of applications to be launched when
	// the sessions will be ready.
	apps chan *Application
}

// Application wraps a windows process.
type Application struct {
	// Usernane is the username of the user to launch the application on behalf
	// of.
	// The processmanager will look for a windows session owned by this user and
	// create the application process in this session if any. If not, the
	// processmanager will wait for the user sessions to be launched to create
	// the process.
	Username string

	// Domain is the name of the windows domain to which the user belongs.
	Domain string

	// Command is the command line to launch the application.
	Command []string

	// HideWindow specifies whenever the application should be hidden or not.
	// The application's process will be created with the `CREATE_NO_WINDOW` flag
	// if set to true.
	HideWindow bool

	// Stdin is standard input of the application's procces.
	Stdin *bytes.Reader

	// Stdout is standard output of the application's procces.
	Stdout bytes.Buffer

	// Stderr is standard error output of the application's procces.
	Stderr bytes.Buffer

	// Pid is the application's process id.
	Pid int

	// cmd is the underlying windows process handle.
	// It's set when the processmanager allow the process creation.
	cmd *windows.Cmd

	// cmdChan is used by the processmanager to inform the application that the
	// application's process has been created (and may be started).
	cmdChan chan *windows.Cmd
}

// `sessions` stores an hash of the windows sessions owner's name and a
// `session` instance (only one per user session).
var sessions map[string]*session

// Golang maps are not atomic. Use this mutex to use `sessions`.
var sessionsLock sync.Mutex

func init() {
	sessions = make(map[string]*session, 0)
}

// Run starts the application and wait for the process to end.
func (a *Application) Run() error {
	err := a.Start()
	if err != nil {
		return err
	}
	return a.cmd.Wait()
}

// Wait waits for the application's process to end.
func (a *Application) Wait() error {
	return a.cmd.Wait()
}

// Start asks the processmanager to launch the app as soon as possible.
// The application will be launched when this function retunrs if it succeed.
// It will returns and error otherwise.
func (a *Application) Start() error {
	a.cmdChan = make(chan *windows.Cmd)
	s := getSession(a.Username)

	// Ask the session to launch the application.
	s.launchApp(a)

	// As soon as the application process will be created, an handle to the
	// process will be pushed is the application's `cmdChan` channel.
	// In between the `s.launchApp(a)` and the `cmdChan` to return something, we
	// may have to wait for the session to be open by the user. This may last
	// forever.
	a.cmd = <-a.cmdChan

	// This is the one and only process start.
	err := a.cmd.Start()
	if err != nil {
		log.Error(err)
		return err
	}

	a.Pid = a.cmd.Process.Pid
	return nil
}

// launch creates the application process.
// It's up to the processmanager to call this function when it makes sense.
func (a *Application) launch() {

	// In windows, `explorer.exe`, in addtion of beeing the file explorer, is
	// the application responssible of the graphical desktop environment.
	// In order to decide if `explorer.exe` should be launched as a "simple"
	// file explorer window or as a full graphical desktop, it firstly checks that
	// no instances of `explorer.exe` already runs in desktop mode and secondly,
	// check the value of the shell varible to be nothing else than
	// `explorer.exe`.
	// So if the application to be launched is `explorer.exe`, we set the shell
	// value to `explorer.exe` to get the desktop is needed.
	if a.Command[0] == `C:\Windows\explorer.exe` {
		windows.SetWinlogonShell("explorer.exe")
	}

	cmd := windows.Command(a.Username, a.Domain, a.HideWindow, a.Command[0], a.Command[1:]...)
	if a.Stdin != nil {
		cmd.Stdin = a.Stdin
	}

	cmd.Stdout = &a.Stdout
	cmd.Stderr = &a.Stderr
	a.cmdChan <- cmd
}

// setPid sets the pid of the session.
// This occurs when a shell register itself to the processmanager.
// Thanks to this, we know that the windows session is up an running.
func (s *session) setPid(pid int) error {
	if s.running {
		return fmt.Errorf("The session is running already")
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return err
	}
	if proc == nil {
		return fmt.Errorf("Cannot find the specified process. Pid = %d", pid)
	}
	s.pid = pid

	s.running = true
	go func() {
		go s.launchApps()
		proc.Wait() // wait for the session to close.
		s.running = false

		// Session stopped. We reset the shell value.
		windows.SetWinlogonShell("plaza.exe")
	}()
	return nil
}

// launchApp launches the specified app if the sessions is running. Otherwise,
// it pushes the app is the session's applications queue.
func (s *session) launchApp(app *Application) {
	if s.running {
		// If the session is open already, we launch the app...
		go app.launch()
		return
	}
	go func() {
		// ... otherwise, we add the app to the launching queue.
		s.apps <- app
	}()
}

// launchApps launches applications from the sessions's applications queue as
// long as there is application to launch and the session is running.
func (s *session) launchApps() {
	// As long as the session is open and apps need to be launched.
	for s.running {
		select {
		case app := <-s.apps:
			go app.launch()
		default:
			// `s.apps` is empty. No more apps to launch.
			return
		}
	}
}

// SetSessionPid finds or create the sessions for the specified user and affect
// the pid to it.
// pid is the pid of the proccess launched by windows as the shell program
// (usually exeplorer.exe). In our case, it's just a process that we use to
// detect the session state.
func SetSessionPid(pid int, username string) error {
	log.Infof("SetSessionPid %d %s", pid, username)
	s := getSession(username)
	return s.setPid(pid)
}

// getSession finds or creates the user session from `sessions`.
// Golang maps are nonatomic. Always Lock `sessionsLock` to use `sessions`.
func getSession(username string) *session {
	sessionsLock.Lock()
	defer sessionsLock.Unlock()

	sess, ok := sessions[username]
	if !ok {
		sess = &session{
			username: username,
			apps:     make(chan *Application),
		}
		sessions[username] = sess
	}
	return sess
}
