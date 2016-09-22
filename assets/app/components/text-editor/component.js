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

/* globals CKEDITOR */

export default Ember.Component.extend({

  _editor: null,
  'on-change': null,

  didInsertElement() {
    let textarea = this.element.querySelector('.editor');
    let editor = this._editor = CKEDITOR.replace(textarea,  {
      extraPlugins: 'placeholder',
      toolbar: [
        [ 'Source', '-', 'Save', 'NewPage', '-', 'Undo', 'Redo' ],
        [ 'Find', 'Replace', '-', 'SelectAll', 'RemoveFormat' ],
        [ 'Link', 'Unlink', 'Image' ],
        '/',
        [ 'FontSize', 'Bold', 'Italic', 'Underline' ],
        [ 'NumberedList', 'BulletedList', '-', 'Blockquote' ],
        [ 'TextColor', '-', 'Smiley', 'SpecialChar', '-', 'Maximize' ],
        ['CreatePlaceholder']
      ],
    });

    editor.on('change', (e) => {
      this.sendAction('on-change', e.editor.getData());
    });
  },

  willDestroyElement() {
    this._editor.destroy();
    this._editor = null;
  }
});
