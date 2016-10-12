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

#ifndef PHOTON_CAPTURE_THREAD_H_
#define PHOTON_CAPTURE_THREAD_H_

#include "webrtc/base/thread.h"

#include "photon/capturer.h"

namespace photon {

class CaptureThread : public rtc::AutoThread,
                      public rtc::MessageHandler {
 private:
  Capturer * capturer_;
  bool finished_;
  bool running_;

 public:
  CaptureThread(Capturer *capturer);
  virtual ~CaptureThread();

 protected:
  virtual void Run();

 public:
  virtual void OnMessage(rtc::Message * msg);
  bool Finished() const;
  bool Running() const;

 private:
  void operator=(const CaptureThread &) = delete;
  CaptureThread(const CaptureThread &) = delete;

};

}  // namespace photon

#endif  // PHOTON_CAPTURE_THREAD_H_
