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
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* globals ConfigService */

/*
 * PropertyController is responsible of the installation properties. Those are
 * publicly accessible (without authentication) and are firstly used to customize
 * the frontend.
 *
 * @class PropertyController
 */
module.exports = {

  LimitCheck(color) {
    if (color > 255) {
      color = 255;
    } else if  (color < 0) {
      color = 0;
    }
    return color;
  },

  LightenDarkenColor(col, amt) {

    var usePound = false;

    if (col[0] === '#') {
      col = col.slice(1);
      usePound = true;
    }

    var num = parseInt(col,16);
    var red = (num >> 16) + amt;
    var blue = ((num >> 8) & 0x00FF) + amt;
    var green = (num & 0x0000FF) + amt;

    green = this.LimitCheck(green);
    blue = this.LimitCheck(blue);
    red = this.LimitCheck(red);

    return (usePound ? '#' : '') + (green | (blue << 8) | (red << 16)).toString(16);
  },

  /**
   * find retreives all the properties
   *
   * @method find
   * @public true
   */
  find(req, res) {

    ConfigService.get(
      'title', 'favIconPath', 'logoPath', 'primaryColor', 'autoRegister'
    )
      .then((config) => {

        let logo = '';
        if (config.logoPath) {
          logo = [
            `.sidebar-logo{background-image:url(${config.logoPath})}`,
            `.login-logo{background-image:url(${config.logoPath})}`
          ].join('');
        }

        let favIcon = 'favicon.ico';
        if (config.favIconPath) {
          favIcon = config.favIconPath;
        }


        var lightenColor = this.LightenDarkenColor(config.primaryColor, 20);
        var darkenColor = this.LightenDarkenColor(config.primaryColor, -15);
        let sidebarColor = [
          `.background-color-default{background-color:${config.primaryColor}}`,
          `.background-color-default a:hover{background-color:${lightenColor}}`,
          `.background-color-default li .active{color:${lightenColor}}`,
          `.nav-link.active{background-color:${config.primaryColor} !important}`,
          `.background-nav-default:focus{color:${darkenColor}}`,
          `.background-nav-default.active{color:${darkenColor}}`,
          `.btn-color-default{background-color:${config.primaryColor}}`,
          `.btn-color-default li:hover{background-color:${lightenColor}}`,
          `.btn-color-default{border-color:${lightenColor}}`,
          `.btn-color-default:hover{border-color:${darkenColor}}`,
          `.btn-color-default:hover{background-color:${lightenColor}}`,
          `.btn-color-default:focus{background-color:${darkenColor}}`,
          `.btn-color-default:active{background-color:${darkenColor}}`,
          `.btn-color-default:disabled:hover{background-color:${lightenColor}}`,
          `.btn-color-default:active:focus{background-color:${darkenColor}}`,
          `.btn-color-default:active:focus{border-color:${lightenColor}}`,
          `.btn-color-default:active:hover{border-color:${darkenColor}}`,
          `.btn-color-default:focus{border-color:${lightenColor}}`,
          `.btn-color-default:active{border-color:${lightenColor}}`,
          `.btn-color-default:disabled:hover{border-color:${config.primaryColor}}`,
          `.form-control:focus{border-color:${lightenColor}}`,
          `.form-control:focus{box-shadow: inset 0 1px 1px rgba(0,0,0,0.075), 0 0 8px ${lightenColor}}`,
          `a{color:${config.primaryColor}}`,
          `.link a{color:${config.primaryColor}}`,
          `a:hover{color:${lightenColor}}`,
          `.color-default span{color:${config.primaryColor}}`,
          `.color-default span:hover{color:${config.primaryColor}}`,
          `.color-default i{color:${config.primaryColor}}`,
          `.color-default i:hover{color:${config.primaryColor}}`,
          `.color-default a{color:${config.primaryColor}}`,
          `.color-default a:hover{color:${config.primaryColor}}`,
          `a:focus{color:${darkenColor}}`,
          `.spinner > div{background-color:${config.primaryColor}}`,
          `.sk-folding-cube{background-color:${config.primaryColor}}`,
          `.edit{color:${config.primaryColor}}`,
          `.edit:hover{color:${lightenColor}}`,
          `.alert-info{color:${darkenColor}}`,
          `.nano-switch.enabled{background-color:${config.primaryColor}}`,
          `.nano-switch.enabled{border-color:${config.primaryColor}}`,
          `.nano-switch.disabled{color:${config.primaryColor}}`,
          `.nano-switch.disabled:hover{color:${darkenColor}}`,
          `.tooltipster-default{background-color:${config.primaryColor}}`,
          `.list-group-item.active{background-color:${config.primaryColor}}`,
          `.list-group-item.active:hover{background-color:${config.primaryColor}}`,
          `.list-group-item.active{border-color:${config.primaryColor}}`,
          `.list-group-item.active:hover{border-color:${config.primaryColor}}`,
          `.popup-component .arrow{background-color:${config.primaryColor}}`,
          `.icon-component.hover-darker:hover i{color:${darkenColor}}`,
          `input:focus{outline-color:${config.primaryColor}}`,
          `button:focus{outline-color:${config.primaryColor}}`,
          `.btn:active:focus{outline-color:${config.primaryColor}}`,
          `.icon_link{color:${config.primaryColor}}`,
          `.icon_link:hover{color:${lightenColor}}`,
          `.icon_link.focus{color:${darkenColor}}`,
        ].join('');

        res.send({
          primaryColor: config.primaryColor,
          title: config.title,
          style: logo + sidebarColor,
          favicon: favIcon,
          autoRegister: config.autoRegister
        });
      })
      .catch((err) => res.negotiate(err));
  }

};
