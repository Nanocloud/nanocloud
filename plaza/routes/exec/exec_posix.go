// +build !windows

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
	"os/exec"
	"strings"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
)

type bodyRequest struct {
	Command []string `json:"command"`
	Stdin   string   `json:"stdin"`
}

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

	cmd := exec.Command(body.Command[0], body.Command[1:]...)
	if body.Stdin != "" {
		cmd.Stdin = strings.NewReader(body.Stdin)
	}

	res := make(map[string]interface{})
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		log.Error(err)
		res["success"] = false
	} else {
		res["success"] = cmd.ProcessState.Success()
	}

	sstdout := stdout.String()
	if len(sstdout) > 0 {
		res["stdout"] = sstdout
	}
	sstderr := stderr.String()
	if len(sstderr) > 0 {
		res["stderr"] = sstderr
	}

	return c.JSON(http.StatusOK, res)
}
