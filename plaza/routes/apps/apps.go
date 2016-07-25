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

package apps

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"os/exec"
	"strings"
	"time"

	"github.com/Nanocloud/community/plaza/utils"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
)

type hash map[string]interface{}

const domain = "intra.localdomain.com"

type ApplicationParams struct {
	Id             int    `json:"-"`
	CollectionName string `json:"collection-name"`
	Alias          string `json:"alias"`
	DisplayName    string `json:"display-name"`
	FilePath       string `json:"file-path"`
	IconContents   []byte `json:"icon-content"`
}

type ApplicationParamsWin struct {
	Id             int
	CollectionName string
	Alias          string
	DisplayName    string
	FilePath       string
	IconContents   []byte
}

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

func checkIfPublishSucceeded(c *echo.Context, displayname string) error {
	for i := 0; i < 5; i++ {
		cmd := exec.Command("powershell.exe", "Import-Module RemoteDesktop; Get-RDRemoteApp -DisplayName "+displayname)
		resp, _ := cmd.CombinedOutput()
		if strings.Contains(string(resp), displayname) {
			return retok(c)
		}
		time.Sleep(time.Second * 3)
	}
	return reterr(errors.New("Publish app failed"), "Failed to publish "+displayname, c)
}

func checkIfUnpublishSucceeded(c *echo.Context, alias string) error {
	for i := 0; i < 5; i++ {
		cmd := exec.Command("powershell.exe", "Import-Module RemoteDesktop; Get-RDRemoteApp -Alias "+alias)
		resp, _ := cmd.CombinedOutput()
		if !strings.Contains(string(resp), alias) {
			return retok(c)
		}
		time.Sleep(time.Second * 3)
	}
	return reterr(errors.New("Unpublish app failed"), "Failed to unpublish "+alias, c)
}

func PublishApp(c *echo.Context) error {
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		log.Error(err)
		return reterr(err, "", c)
	}
	var all struct {
		Data struct {
			Attributes struct {
				Alias          string `json:"alias"`
				CollectionName string `json:"collection-name"`
				DisplayName    string `json:"display-name"`
				FilePath       string `json:"file-path"`
				Path           string `json:"path"`
			}
			Type string `json:"type"`
		} `json:"data"`
	}
	err = json.Unmarshal(body, &all)
	if err != nil {
		log.Error(err)
		return reterr(err, "", c)
	}

	username, pwd, _ := c.Request().BasicAuth()
	utils.ExecuteCommandAsAdmin("C:\\Windows\\System32\\WindowsPowershell\\v1.0\\powershell.exe Import-module RemoteDesktop; New-RDRemoteApp -CollectionName "+all.Data.Attributes.CollectionName+" -DisplayName "+all.Data.Attributes.DisplayName+" -FilePath '"+all.Data.Attributes.Path+"'", username, pwd, domain)
	return checkIfPublishSucceeded(c, all.Data.Attributes.DisplayName)
}

func UnpublishApp(c *echo.Context) error {
	id := c.Param("id")
	username, pwd, _ := c.Request().BasicAuth()
	utils.ExecuteCommandAsAdmin("C:\\Windows\\System32\\WindowsPowershell\\v1.0\\powershell.exe Import-Module RemoteDesktop; Remove-RDRemoteApp -Alias '"+id+"' -CollectionName collection -Force", username, pwd, domain)
	return checkIfUnpublishSucceeded(c, id)
}

func GetApps(c *echo.Context) error {
	var applications []ApplicationParamsWin
	var winapp ApplicationParamsWin
	var apps []ApplicationParams
	cmd := exec.Command("powershell.exe", "Import-Module RemoteDesktop; Get-RDRemoteApp | ConvertTo-Json -Compress")
	resp, err := cmd.CombinedOutput()
	if err != nil {
		return reterr(err, string(resp), c)
	}
	err = json.Unmarshal(resp, &applications)
	if err != nil {
		err = json.Unmarshal(resp, &winapp)
		if err != nil {
			return reterr(err, "", c)
		}
		return c.JSON(
			http.StatusOK,
			ApplicationParams{
				CollectionName: winapp.CollectionName,
				DisplayName:    winapp.DisplayName,
				Alias:          winapp.Alias,
				FilePath:       winapp.FilePath,
				IconContents:   winapp.IconContents,
			},
		)
	}
	for _, app := range applications {
		apps = append(apps, ApplicationParams{
			CollectionName: app.CollectionName,
			DisplayName:    app.DisplayName,
			Alias:          app.Alias,
			FilePath:       app.FilePath,
			IconContents:   app.IconContents,
		})
	}
	return c.JSON(
		http.StatusOK,
		apps,
	)
}
