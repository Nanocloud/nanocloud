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

package shells

import (
	"encoding/json"
	"io/ioutil"

	"github.com/Nanocloud/community/plaza/processmanager"
	"github.com/labstack/echo"
)

// Post registers a new shell to the processmanager
func Post(c *echo.Context) error {
	type bodyRequest struct {
		Username string `json:"username"`
		Pid      int    `json:"pid"`
	}

	b, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return err
	}

	body := bodyRequest{}
	err = json.Unmarshal(b, &body)
	if err != nil {
		return err
	}
	err = processmanager.SetSessionPid(body.Pid, body.Username)
	if err != nil {
		return err
	}
	return nil
}
