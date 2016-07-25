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

package power

import (
	"net/http"
	"os/exec"

	"github.com/labstack/echo"
)

type hash map[string]interface{}

func reterr(e error, resp string, c *echo.Context) error {
	return c.JSON(
		http.StatusInternalServerError,
		hash{
			"error": []hash{
				hash{
					"title":  e.Error(),
					"detail": resp,
				},
			},
		},
	)
}

func retok(c *echo.Context) error {
	return c.JSON(
		http.StatusOK,
		hash{
			"data": hash{
				"success": true,
			},
		},
	)
}

func ShutDown(c *echo.Context) error {
	cmd := exec.Command("powershell.exe", "Stop-Computer -Force")
	resp, err := cmd.CombinedOutput()
	if err != nil {
		return reterr(err, string(resp), c)
	}
	return retok(c)
}

func Restart(c *echo.Context) error {
	cmd := exec.Command("powershell.exe", "Restart-Computer -Force")
	resp, err := cmd.CombinedOutput()
	if err != nil {
		return c.JSON(
			http.StatusInternalServerError,
			hash{
				"error":    err.Error(),
				"response": resp,
			},
		)
	}
	return c.JSON(
		http.StatusOK,
		hash{
			"success": true,
		},
	)
}

func CheckRDS(c *echo.Context) error {
	cmd := exec.Command("powershell.exe", "Write-Host (Get-Service -Name RDMS).status")
	resp, err := cmd.CombinedOutput()
	if err != nil {
		return c.JSON(
			http.StatusInternalServerError,
			hash{
				"error":    err.Error(),
				"response": resp,
			},
		)
	}
	return c.JSON(
		http.StatusOK,
		hash{
			"state": string(resp),
		},
	)
}
