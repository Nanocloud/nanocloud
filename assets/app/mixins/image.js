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

import Ember from 'ember';

export default Ember.Mixin.create({

  session: Ember.inject.service('session'),

  saveImage() {

    var xhr = Ember.$.ajax({
      type: 'POST',
      headers: { Authorization : 'Bearer ' + this.get('session.access_token')},
      url: '/api/images',
    });
    xhr.then(() => {
      window.swal({
        title: 'Success!',
        text: 'Your image has been saved successfully!',
        type: 'success',
        showCancelButton: false,
        confirmButtonText: 'Dismiss!',
        closeOnConfirm: true,
        animation: false
      }, () => {
        this.toast.success('Your image has been saved successfully');
      });
    })

    window.swal({
      title: 'In progress..',
      text: `
        <div class='sk-folding-cube'>
          <div class='sk-cube1 sk-cube'></div>
          <div class='sk-cube2 sk-cube'></div>
          <div class='sk-cube4 sk-cube'></div>
          <div class='sk-cube3 sk-cube'></div>
        </div>
        Please wait while the image is being saved`,
      html: true,
      showCancelButton: false,
      confirmButtonText: 'Cancel',
      closeOnConfirm: true,
      animation: false,
    }, () => {
      this.toast.error('The image has not been saved');
      xhr.abort();
    });
    return xhr;
  },

  askSaveImage() {
    this.send('closeAll');
    window.swal({
      title: 'Let\'s save an image!',
      text: 'Please confirm that you want to save an image.',
      type: 'info',
      showCancelButton: true,
      confirmButtonText: 'Yes!',
      cancelButtonText: 'Nope',
      closeOnConfirm: false,
      animation: false
    }, () => {
      this.saveImage();
    });
  },

  askSaveImageFirst() {
    if (this.get('windowCollector.onboardApp')) {
      this.closeAppPublisher();
      return;
    }
    this.send('closeAll');
    window.swal({
      title: 'Oh wait..',
      text: 'Do you want to save an image first?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes!',
      cancelButtonText: 'Nope',
      closeOnConfirm: false,
      animation: false
    }, (isConfirm) => {
      if (isConfirm) {
        this.saveImage()
        .then(() => {
          this.openAppPublisher();
        });
      }
      else {
        this.openAppPublisher();
      }
    });
  },

  actions: {
    askSaveImage() {
      this.askSaveImage();
    },
    askSaveImageFirst() {
      this.askSaveImageFirst();
    },
  }
});
