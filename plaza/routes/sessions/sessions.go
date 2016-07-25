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

package sessions

import (
	"encoding/json"
	"net/http"
	"os/exec"
	"strings"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
)

type hash map[string]interface{}

func formatResponse(tab []string, id string) [][]string {
	var format [][]string
	for _, val := range tab {
		newtab := strings.Fields(val)
		if len(newtab) == 4 {
			if id == "Administrator" || newtab[1] == id {
				format = append(format, newtab)
			}
		}
	}
	return format
}

func Get(c *echo.Context) error {
	cmd := exec.Command("powershell.exe", "query session | ConvertTo-Json -Compress")
	resp, err := cmd.CombinedOutput()
	var tab []string
	err = json.Unmarshal(resp, &tab)
	if err != nil {
		log.Error("Error while unmarshaling query response: ", err)
	}
	response := formatResponse(tab, c.Param("id"))
	if len(response) == 0 {
		response = make([][]string, 0)
	}
	return c.JSON(
		http.StatusOK,
		hash{
			"data": response,
		},
	)
}

func Logoff(c *echo.Context) error {
	cmd := exec.Command("powershell.exe", "query session | ConvertTo-Json -Compress")
	resp, err := cmd.CombinedOutput()
	var tab []string
	err = json.Unmarshal(resp, &tab)
	if err != nil {
		log.Error("Error while unmarshaling query response: ", err)
	}
	response := formatResponse(tab, c.Param("id"))
	if len(response) == 1 {
		cmd := exec.Command("powershell.exe", "logoff "+response[0][2])
		resp, err = cmd.CombinedOutput()
		if err != nil {
			log.Error("Error while loging off user: ", err, string(resp))
		}
	}
	return c.JSON(
		http.StatusOK,
		hash{
			"data": response,
		},
	)
}
