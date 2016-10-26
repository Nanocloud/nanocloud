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

#include "input_manager.h"

namespace photon {

InputManager::InputManager()
    : shift_(false) {}

InputManager::~InputManager() {}

void InputManager::KeyEvent(char key, unsigned long flag) {
  unsigned long down = flag;
  flag |= (char) shift_;
  switch (key) {
    case KEY_SHIFT:
      shift_ = down == 0;
      keybd_event(VK_SHIFT, OemKeyScan(VK_SHIFT), (down != 0) * 2, NULL);
      break;
    case '%':
      keybd_event(VK_LEFT, OemKeyScan(VK_LEFT), flag, NULL);
      break;
    case '&':
      keybd_event(VK_UP, OemKeyScan(VK_UP), flag, NULL);
      break;
    case '\'':
      keybd_event(VK_RIGHT, OemKeyScan(VK_RIGHT), flag, NULL);
      break;
    case '(':
      keybd_event(VK_DOWN, OemKeyScan(VK_DOWN), flag, NULL);
      break;
    default:
      keybd_event(VkKeyScan(key), OemKeyScan(key), flag, NULL);
  }
}

void InputManager::KeyDown(char key) {
  KeyEvent(key, 0);
}

void InputManager::KeyUp(char key) {
  KeyEvent(key, KEYEVENTF_KEYUP);
}

void InputManager::MouseMove(int x, int y) {
  mouse_event(
    MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE,
    x,
    y,
    NULL,
    NULL
  );
}

void InputManager::MouseButtonEvent(char button, char state) {
  int flags = 0;
  if (button == 'R') { // Right
    if (state == 'D') { // Down
      flags |= MOUSEEVENTF_RIGHTDOWN;
    }
    else { // UP
      flags |= MOUSEEVENTF_RIGHTUP;
    }
  }
  else { // Left
    if (state == 'D') { // Down
      flags |= MOUSEEVENTF_LEFTDOWN;
    }
    else { // UP
      flags |= MOUSEEVENTF_LEFTUP;
    }
  }

  mouse_event(flags, 0, 0, NULL, NULL);
}

void InputManager::MouseWheelEvent(int x) {
  mouse_event(
      MOUSEEVENTF_WHEEL,
      0,
      0,
      x,
      NULL
  );
}

}  // namespace photon
