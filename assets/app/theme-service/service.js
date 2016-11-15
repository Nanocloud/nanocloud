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
import colorAdjust from 'nanocloud/utils/color-adjust';

export default Ember.Service.extend({
  setupColor(color) {
    var lightenColor = colorAdjust(color, 20);
    var darkenColor = colorAdjust(color, -15);
    let collection = [
      `.background-color-default{background-color:${color}}`,
      `.background-color-default a:hover{background-color:${lightenColor}}`,
      `.background-color-default li .active{color:${lightenColor}}`,
      `.nav-link.active{background-color:${color} !important}`,
      `.background-nav-default:focus{color:${darkenColor}}`,
      `.background-nav-default.active{color:${darkenColor}}`,
      `.btn-color-default{background-color:${color}}`,
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
      `.btn-color-default:active:hover{background-color:${darkenColor}}`,
      `.btn-color-default:focus{border-color:${lightenColor}}`,
      `.btn-color-default:active{border-color:${lightenColor}}`,
      `.btn-color-default:disabled:hover{border-color:${color}}`,
      `.form-control:focus{border-color:${lightenColor}}`,
      `.form-control:focus{box-shadow: inset 0 1px 1px rgba(0,0,0,0.075), 0 0 8px ${lightenColor}}`,
      `a{color:${color}}`,
      `.link a{color:${color}}`,
      `a:hover{color:${lightenColor}}`,
      `.color-default span{color:${color}}`,
      `.color-default span:hover{color:${color}}`,
      `.color-default i{color:${color}}`,
      `.color-default i:hover{color:${color}}`,
      `.color-default a{color:${color}}`,
      `.color-default a:hover{color:${color}}`,
      `a:focus{color:${darkenColor}}`,
      `.spinner > div{background-color:${color}}`,
      `.edit{color:${color}}`,
      `.edit:hover{color:${lightenColor}}`,
      `.alert-info{color:${darkenColor}}`,
      `.nano-switch.enabled{background-color:${color}}`,
      `.nano-switch.enabled{border-color:${color}}`,
      `.nano-switch.disabled{color:${color}}`,
      `.nano-switch.disabled:hover{color:${darkenColor}}`,
      `.tooltipster-default{background-color:${color}}`,
      `.list-group-item.active{background-color:${color}}`,
      `.list-group-item.active:hover{background-color:${color}}`,
      `.list-group-item.active{border-color:${color}}`,
      `.list-group-item.active:hover{border-color:${color}}`,
      `.popup-component .arrow{background-color:${color}}`,
      `.icon-component.hover-darker:hover i{color:${darkenColor}}`,
      `input:focus{outline-color:${color}}`,
      `button:focus{outline-color:${color}}`,
      `.btn:active:focus{outline-color:${color}}`,
      `.icon_link{color:${color}}`,
      `.icon_link:hover{color:${lightenColor}}`,
      `.icon_link.focus{color:${darkenColor}}`,
      `.vdi .vdi-topbar .item:hover{color:${lightenColor}}`,
      `.vdi .vdi-topbar .item:hover i{color:${lightenColor} !important}`,
      `.vdi .vdi-topbar .selected, .vdi .vdi-topbar .selected i{color:${color} !important}`,
      `.file-explorer .file-list-wrapper > .item.selected{background-color:${color}}`,
      `.file-explorer .file-list-wrapper > .item:hover{color:${darkenColor}}`,
      `.file-explorer .file-list-wrapper > .item:hover.selected{color:#ffffff}`,
      `.vdi-drag-n-drop .drag-n-drop-area{background-color:${lightenColor}}`,
      `.icon-component.hover-lighter:hover i{color:${lightenColor}}`,
      `md-checkbox.md-default-theme.md-checked .md-icon, md-checkbox.md-checked .md-icon{background-color:${lightenColor}}`,
    ].join('');

    let head = Ember.$(document.head);

    let s = Ember.$('<style></style>');
    s.html(collection);
    head.append(s);
  }
});
