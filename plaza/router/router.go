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

package router

import (
	"net/http"

	"github.com/Nanocloud/community/plaza/routes/about"
	"github.com/Nanocloud/community/plaza/routes/apps"
	"github.com/Nanocloud/community/plaza/routes/exec"
	"github.com/Nanocloud/community/plaza/routes/files"
	"github.com/Nanocloud/community/plaza/routes/power"
	"github.com/Nanocloud/community/plaza/routes/sessions"
	"github.com/Nanocloud/community/plaza/routes/shells"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	mw "github.com/labstack/echo/middleware"
)

type hash map[string]interface{}

func Start() {
	e := echo.New()

	e.Use(mw.Recover())

	e.Post("/exec", exec.Route)
	e.Get("/", about.Get)

	/***
	FILES
	***/

	e.Get("/files", files.Get)
	e.Post("/upload", files.Post)

	/***
	POWER
	***/

	e.Get("/shutdown", power.ShutDown)
	e.Get("/restart", power.Restart)
	e.Get("/checkrds", power.CheckRDS)

	/***
	SESSIONS
	***/

	e.Get("/sessions/:id", sessions.Get)
	e.Delete("/sessions/:id", sessions.Logoff)

	/***
	SHELLS
	***/

	e.Post("/shells", shells.Post)

	/***
	APPS
	***/

	e.Post("/publishapp", apps.PublishApp)
	e.Get("/apps", apps.GetApps)
	e.Delete("/apps/:id", apps.UnpublishApp)

	e.SetHTTPErrorHandler(func(err error, c *echo.Context) {
		c.JSON(
			http.StatusInternalServerError,
			hash{
				"error": err.Error(),
			},
		)
	})

	log.Info("Listenning on port: 9090")
	e.Run(":9090")
}
