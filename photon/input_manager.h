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

#ifndef PHOTON_INPUT_MANAGER_H_
#define PHOTON_INPUT_MANAGER_H_

#include <Windows.h>
#include <string>

#define KEY_SHIFT 0x10

namespace photon {

class InputManager {
 public:
  InputManager(void);
  ~InputManager(void);
  void KeyDown(char key);
  void KeyUp(char key);
  void MouseMove(int x, int y);
  void MouseButtonEvent(char button, char state);
  void MouseWheelEvent(int x);
  void SetClipboard(const std::wstring & data);
  const std::wstring GetClipboard();

 private:
  void KeyEvent(char key, unsigned long flags);

  bool shift_;
};

}  // namespace photon

#endif  // PHOTON_INPUT_MANAGER_H_
