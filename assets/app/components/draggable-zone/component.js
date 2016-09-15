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

export default Ember.Component.extend({
  classNames        : [ 'draggableDropzone' ],
  classNameBindings : [ 'dragClass' ],
  dragClass         : 'deactivated',
  lastTarget        : null,

  abortChangeDir() {
    if (this.get('runLater')) {
      Ember.run.cancel(this.get('runLater'));
      this.set('runLater', null);
    }
  },

  dragLeave() {
    this.abortChangeDir();
    if (this.get('enabled') === true) {
      this.set('dragClass', 'deactivated');
    }
  },

  dragOver(event) {

    if (this.get('setLastObjectHovered')) {
      this.sendAction('setLastObjectHovered');
    }
    else {
      this.set('lastObjectHovered', event.target.id);
    }

    if (this.get('lastObjectHovered') === this.get('elementBeingDragged')) {
      return false;
    }

    if (!this.get('runLater')) {
      var runLater = Ember.run.later(this, function() {
        this.abortChangeDir();
        event.stopPropagation();
        this.sendAction('dragAction');
      }, 1200);

      this.set('runLater', runLater);
    }

    if (this.get('enabled') === true) {

      if (this.get('lastTarget') !== this.get('draggedTarget')) {
        this.set('dragClass', 'activated');
      }
      else {
        this.set('dragClass', 'deactivated');
      }
    }
    return false;
  },

  drop(event) {
    event.preventDefault();
    this.abortChangeDir();

    let uploadData = event.dataTransfer.files;
    if (uploadData.length > 0) {
      this.sendAction('onFileUpload', event.dataTransfer.files[0]);
    }
    else {
      if (this.get('lastObjectHovered') !== this.get('elementBeingDragged')) {
        this.sendAction('dropAction');
      }
    }

    this.set('lastObjectHovered', null);
    return false;
  },
});
