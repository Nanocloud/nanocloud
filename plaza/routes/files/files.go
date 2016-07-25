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

package files

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"strconv"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"github.com/manyminds/api2go/jsonapi"
)

type hash map[string]interface{}

type file struct {
	Id      string `json:"-"`
	ModTime int64  `json:"mod_time"`
	Name    string `json:"name"`
	Size    int64  `json:"size"`
	Type    string `json:"type"`
}

func (f *file) GetID() string {
	return f.Id
}

func Post(w http.ResponseWriter, r *http.Request) {
	var dst *os.File
	username := r.URL.Query()["username"][0]
	filename := r.URL.Query()["filename"][0]
	var path string

	if runtime.GOOS == "windows" {
		dstDir := fmt.Sprintf(`C:\Users\%s\Desktop\Nanocloud`, username)
		err := os.MkdirAll(dstDir, 0777)

		if err != nil {
			log.Error(err)
			http.Error(w, "Unable to create destination directory", http.StatusInternalServerError)
			return
		}

		path = fmt.Sprintf(`%s\%s`, dstDir, filename)
	} else {
		path = fmt.Sprintf("/home/%s/%s", username, filename)
	}

	_, err := os.Stat(path)
	// if a file with exactly the same name already exists
	if err == nil {
		// we rename it like 'file (2).txt'
		for i := 1; i > 0; i++ {
			extension := filepath.Ext(path)
			new_file := path[0:len(path)-len(extension)] + " (" + strconv.Itoa(i) + ")" + extension
			_, err = os.Stat(new_file)
			if err != nil {
				dst, err = os.Create(new_file)
				if err != nil {
					log.Error(err)
				}
				break
			}
		}
	} else {
		dst, err = os.Create(path)
	}
	if err != nil {
		log.Error(err)
		http.Error(w, "Unable to create destination file", http.StatusInternalServerError)
		return
	}

	defer dst.Close()

	_, err = io.Copy(dst, r.Body)
	if err != nil {
		log.Error(err)
		http.Error(w, "Unable to write destination file", http.StatusInternalServerError)
		return
	}
}

func Get(c *echo.Context) error {
	filepath := c.Query("path")
	showHidden := c.Query("show_hidden") == "true"
	create := c.Query("create") == "true"

	if len(filepath) < 1 {
		return c.JSON(
			http.StatusBadRequest,
			hash{
				"error": "Path not specified",
			},
		)
	}

	s, err := os.Stat(filepath)
	if err != nil {
		log.Error(err.(*os.PathError).Err.Error())
		m := err.(*os.PathError).Err.Error()
		if m == "no such file or directory" || m == "The system cannot find the file specified." {
			if create {
				err := os.MkdirAll(filepath, 0777)
				if err != nil {
					return err
				}
				s, err = os.Stat(filepath)
				if err != nil {
					return err
				}
			} else {
				return c.JSON(
					http.StatusNotFound,
					hash{
						"error": "no such file or directory",
					},
				)
			}
		} else {
			return err
		}
	}

	if s.Mode().IsDir() {
		f, err := os.Open(filepath)
		if err != nil {
			return err
		}
		defer f.Close()

		files, err := f.Readdir(-1)
		if err != nil {
			return err
		}

		rt := make([]*file, 0)

		for _, fi := range files {
			name := fi.Name()
			if !showHidden && isFileHidden(fi) {
				continue
			}

			fullpath := path.Join(filepath, name)
			id, err := loadFileId(fullpath)
			if err != nil {
				log.Errorf("Cannot retrieve file id for file: %s: %s", fullpath, err.Error())
				continue
			}

			f := &file{
				Id:      id,
				ModTime: fi.ModTime().Unix(),
				Name:    name,
				Size:    fi.Size(),
			}
			if fi.IsDir() {
				f.Type = "directory"
			} else {
				f.Type = "regular file"
			}
			rt = append(rt, f)
		}
		/*
		 * The Content-Length is not set is the buffer length is more than 2048
		 */
		b, err := jsonapi.Marshal(rt)
		if err != nil {
			log.Error(err)
			return err
		}

		r := c.Response()
		r.Header().Set("Content-Length", strconv.Itoa(len(b)))
		r.Header().Set("Content-Type", "application/json; charset=utf-8")
		r.Write(b)
		return nil
	}

	return c.File(
		filepath,
		s.Name(),
		true,
	)
}
