/**
 * Nanocloud, a comprehensive platform to turn any application into a cloud
 * solution.
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

/**
 * Table diff is an array proxy representigin the
 * differences between "major" and "minor".
 */
export default Ember.ArrayProxy.extend({
  major: null,
  minor: null,

  init() {
    let minor = this.get('minor');
    let major = this.get('major');

    if (!minor.get('length')) {
      this.set('content', major.toArray());
    } else {
      let content = major.filter((u) => minor.indexOf(u) === -1);
      this.set('content', content);
    }

    this._super(...arguments);
  },

  watcher: Ember.observer('minor.length', 'major.length', function(_, prop) {
    let content = this.get('content');
    let major = this.get('major');
    let minor = this.get('minor');

    let majorLen = major.get('length');
    let minorLen = minor.get('length');
    let contentLen = content.get('length');

    let finalLen = majorLen - minorLen;

    if (!majorLen) {
      this.set('content', []);
      return;
    }

    if (!minorLen) {
      this.set('content', major.toArray());
      return;
    }

    if (!contentLen) {
      let content = [];
      for (let i = 0; i < majorLen; ++i) {
        if (minor.indexOf(major.objectAt(i)) === -1) {
          content.push(major.objectAt(i));

          if (++contentLen === finalLen) {
            break;
          }
        }
      }
      this.set('content', content);
      return;
    }

    switch (prop) {
      case 'minor.length':

        if (finalLen < contentLen) {
          // an minor item has been added

          for (let i = 0; i < minorLen; ++i) {
            let item = minor.objectAt(i);
            let idx = content.indexOf(item);

            if (idx !== -1) {
              this.removeAt(idx);
              break;
            }
          }
        } else {
          // a minor item has been removed

          for (let i = 0; i < minorLen; ++i) {
            let item = minor.objectAt(i);
            let idx = content.indexOf(item);

            if (idx === -1) {
              this.pushObject(item);
              break;
            }
          }
        }

        break;

      case 'major.length':
        if (finalLen < contentLen) {
          // a major item has been removed

          for (let i = 0; i < contentLen; ++i) {
            let item = content.objectAt(i);
            let idx = major.indexOf(item);

            if (idx === -1) {
              this.removeAt(idx);
              break;
            }
          }
        } else {
          // a major item has been added

          for (let i = 0; i < contentLen; ++i) {
            let item = major.objectAt(i);
            let idx = content.indexOf(item);

            if (idx === -1) {
              this.pushObject(idx);
              break;
            }
          }
        }

        break;
    }
  })
});
