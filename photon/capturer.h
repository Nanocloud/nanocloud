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

#ifndef PHOTON_CAPTURER_H_
#define PHOTON_CAPTURER_H_

#include <iostream>
#include <string.h>

#include <memory>
#include <vector>

#include "webrtc/base/timeutils.h"
#include "webrtc/media/base/videocapturer.h"
#include "webrtc/media/base/videocommon.h"
#include "webrtc/media/base/videoframe.h"
#include "webrtc/media/engine/webrtcvideoframefactory.h"

#include "webrtc/modules/desktop_capture/win/screen_capturer_win_directx.h"

namespace photon {

// Fake video capturer that allows the test to manually pump in frames.
class Capturer
    : public cricket::VideoCapturer,
      public webrtc::DesktopCapturer::Callback {
 public:
  sigslot::signal1<Capturer*> SignalDestroyed;

  Capturer();
  ~Capturer();

  void ResetSupportedFormats(const std::vector<cricket::VideoFormat>& formats);
  bool CaptureFrame();
  cricket::CaptureState Start(const cricket::VideoFormat& format) override;
  void Stop() override;
  bool IsRunning() override;
  bool IsScreencast() const override;
  bool GetPreferredFourccs(std::vector<uint32_t>* fourccs) override;
  virtual void OnCaptureResult(webrtc::DesktopCapturer::Result result,
      std::unique_ptr<webrtc::DesktopFrame> desktop_frame) override;

 private:
  bool running_;
  int64_t initial_timestamp_;
  int64_t next_timestamp_;
  webrtc::ScreenCapturerWinDirectx * capturer_;
};

}  // namespace photon

#endif  // PHOTON_CAPTURER_H_
