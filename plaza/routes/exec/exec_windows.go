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

package exec

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"

	"github.com/Nanocloud/community/plaza/processmanager"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
)

type bodyRequest struct {
	Username   string   `json:"username"`
	Domain     string   `json:"domain"`
	Command    []string `json:"command"`
	Stdin      string   `json:"stdin"`
	HideWindow bool     `json:"hide-window"`
	Wait       bool     `json:"wait"`
}

// Route handles the `POST /exec` requests.
// It execute the command passed in the body of the request on the target
// machine.
// It excpect JSON encoded data in the request's body that should contains the
// following attributes:
//  - username string (required): The username of the Windows user to launch the
//    application on behalf.
//  - domain string: The domain name of the user if any.
//  - command [string] (required): The command line of the process to execute.
//  - stdin string: The string to write on the standard input of the process.
//  - hide-window boolean: If true, the process graphical window will be hidden.
//  - wait boolean: If true, the response will be sent once the created proccess
//    will have exited and the answer will contain the standard and the error
//    ouput. If false, The response will be sent once the process will have been
//    created and the answer will contain the pid of the process.
func Route(c *echo.Context) error {
	b, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return err
	}

	body := bodyRequest{}
	err = json.Unmarshal(b, &body)
	if err != nil {
		return err
	}

	app := processmanager.Application{
		Username:   body.Username,
		Domain:     body.Domain,
		HideWindow: body.HideWindow,
		Command:    body.Command,
	}
	if len(body.Stdin) > 0 {
		app.Stdin = bytes.NewReader([]byte(body.Stdin))
	}

	res := make(map[string]interface{})
	if body.Wait {
		err = app.Run()
		if err != nil {
			log.Error(err)
			return err
		}

		res["stdout"] = app.Stdout.String()
		res["stderr"] = app.Stderr.String()
	} else {
		err = app.Start()
		if err != nil {
			log.Error(err)
			return err
		}
		res["pid"] = app.Pid
	}

	return c.JSON(http.StatusOK, res)
}
