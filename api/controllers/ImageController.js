/**
 * Nanocloud turns any traditional software into a cloud solution, without
 * changing or redeveloping existing source code.
 *
 * Copyright (C) 2016 Nanocloud Software
 *
 * This file is part of Nanocloud.
 *
 * Nanocloud is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Nanocloud is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */

/* globals Machine, MachineService, JsonApiService, Image, App */
/* globals AppGroup, ImageGroup */

const Promise = require('bluebird');
const _ = require('lodash');

module.exports = {

  /*
   * Retrieves images a given user can access
   *
   * @param {Object} a user object (usually req.user)
   * @return {Promise[array]} a promise resolving to an array of Images
   */
  _getImages(user) {

    return new Promise((resolve, reject) => {
      return Image.query({
        text: `SELECT DISTINCT
                 "image".id,
                 "image".name,
                 "image".deleted,
                 "image".password
                 FROM "image"
                 LEFT JOIN "imagegroup" on imagegroup.image = image.id
                 LEFT JOIN "group" on imagegroup.group = "group".id
                 LEFT JOIN "usergroup" on usergroup.group = "group".id
                 WHERE (usergroup.user = $1::varchar OR $2::boolean = true) AND "image".deleted = false`,
        values: [
          user.id,
          user.isAdmin
        ]
      }, (err, images) => {

        if (err) {
          return reject(err);
        }

        return resolve(images);
      });
    });
  },

  create: function(req, res) {

    let machineId = _.get(req, 'body.data.attributes.build-from');
    let name = _.get(req, 'body.data.attributes.name');
    if (!machineId) {
      return res.badRequest('Invalid base machine ID');
    }

    /**
     * Sometimes AWS can take several minutes to create an image.
     * but the default timeout is 120 secondes (2 minutes).
     * Upping it to 600 secondes (10 minutes, it's arbitrary) allows
     * you to make sure that AWS has enough time to create an image.
     */
    res.setTimeout(600000);
    Machine.findOne(machineId)
      .then((machine) => {

        return MachineService.createImage({
          name: name,
          buildFrom: machine.id
        });
      })
      .then((image) => {
        return Machine.update({
          id: image.buildFrom
        }, {
          image: image.id
        })
          .then(() => {
            return res.created(image);
          });
      })
      .catch(res.negotiate);
  },

  findOne: function(req, res) {
    if (req.user.isAdmin) {
      Image.findOne({
        id: req.allParams().id
      })
        .populate('apps')
        .populate('groups')
        .then(res.ok)
        .catch(res.negotiate);
    } else {
      this._getImages(req.user)
        .then((images) => {
          images = images.rows;
          var image = _.find(images, function(element) { return element.id === req.allParams().id; });
          if (image) {
            return res.ok(image);
          }
          return res.notFound();
        });
    }
  },

  find: function(req, res) {

    this._getImages(req.user)
      .then((images) => {
        let imageIds = _.map(images.rows, 'id');
        Image.find(imageIds)
          .populate('apps')
          .populate('groups')
          .then((images) => {

            /**
             * The images we find are populated with ALL their apps, but for regular
             * users, we should delete on this app table all apps the user should not
             * have access.
             *
             * To do this, we take all apps associated to the user's group, who their
             * image has not been deleted.
             * Then, for all images, we check the difference between image's apps,
             * and apps user should have access, and we delete fields on image's apps,
             * who are not corresponding to user's apps.
             */

            return App.query({
              text: `SELECT DISTINCT
                 "app".id,
                 "app".alias,
                 "app"."displayName",
                 "app"."filePath",
                 "app"."image"
                 FROM "app"
                 LEFT JOIN "appgroup" on appgroup.app = app.id
                 LEFT JOIN "group" on appgroup.group = "group".id
                 LEFT JOIN "usergroup" on usergroup.group = "group".id
                 LEFT JOIN "image" on image.id = "app".image
                 WHERE (usergroup.user = $1::varchar OR $2::boolean = true)
                 AND image.deleted = false`,
              values: [
                req.user.id,
                req.user.isAdmin
              ]
            }, (err, groupApps) => {
              if (err) {
                return res.negotiate(err);
              }
              groupApps = groupApps.rows;
              _.map(images, (image) => {
                _.remove(image.apps, (app) => {
                  /**
                   * If apps of an image is find on apps included on the user's group,
                   * it seems we should not delete it from the table, cause the user
                   * should have access to it, so we return false.
                   */
                  return (_.find(groupApps, { id: app.id })) ? false : true;
                });
              });
              return res.ok(images);
            });
          });
      })
      .catch(res.negociate);
  },

  destroy: function(req, res) {
    var imageId = req.allParams().id;
    return Image.findOne({ id: imageId })
      .then((image) => {
        return MachineService.deleteImage(image);
      })
      .then((imageDeleted) => {
        return Image.update({
          id: imageDeleted.id
        }, {
          deleted: true
        });
      })
      .then((image) => {
        return MachineService.updateMachinesPool()
          .then(() => {
            res.status(202);
            return res.send(JsonApiService.serialize('images', image[0]));
          });
      })
      .then(() => {
        return ImageGroup.destroy({
          image: imageId
        });
      })
      .then(() => {
        return App.find({
          image: imageId
        });
      })
      .then((apps) => {
        apps.forEach((app) => {
          return AppGroup.destroy({ app: app.id })
            .then(() => {
              return App.destroy({ id: app.id });
            });
        });
      })
      .catch(res.negociate);
  }
};
