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

#include "capturer.h"

namespace photon {

Capturer::Capturer()
    : running_(false),
      initial_timestamp_(rtc::TimeNanos()),
      next_timestamp_(rtc::kNumNanosecsPerMillisec),
      capturer_(nullptr) {

  webrtc::ScreenCapturer::ScreenList screens;
  webrtc::DesktopCaptureOptions opts = webrtc::DesktopCaptureOptions::CreateDefault();
  capturer_ = new webrtc::ScreenCapturerWinDirectx(opts);

  if (capturer_->GetScreenList(&screens)) {
    for (webrtc::ScreenCapturer::Screen scr : screens) {
      capturer_->SelectScreen(scr.id);
      break;
    }
    capturer_->Start(this);
  } else {
    std::cout << "No Screen" << std::endl;
  }

  set_frame_factory(new cricket::WebRtcVideoFrameFactory());

  // Default supported formats. Use ResetSupportedFormats to over write.
  std::vector<cricket::VideoFormat> formats;
  formats.push_back(cricket::VideoFormat(800, 600,
        cricket::VideoFormat::FpsToInterval(60), cricket::FOURCC_ARGB));
  /*
    formats.push_back(cricket::VideoFormat(640, 480,
        cricket::VideoFormat::FpsToInterval(30), cricket::FOURCC_I420));
    formats.push_back(cricket::VideoFormat(320, 240,
        cricket::VideoFormat::FpsToInterval(30), cricket::FOURCC_I420));
    formats.push_back(cricket::VideoFormat(160, 120,
        cricket::VideoFormat::FpsToInterval(30), cricket::FOURCC_I420));
    formats.push_back(cricket::VideoFormat(1280, 720,
        cricket::VideoFormat::FpsToInterval(60), cricket::FOURCC_I420));
  */
  ResetSupportedFormats(formats);
}

Capturer::~Capturer() {
  SignalDestroyed(this);
}

void Capturer::ResetSupportedFormats(const std::vector<cricket::VideoFormat>& formats) {
  SetSupportedFormats(formats);
}

bool Capturer::CaptureFrame() {
  if (!running_) {
    return false;
  }
  webrtc::DesktopRect rect = webrtc::DesktopRect::MakeWH(800, 600);
  webrtc::DesktopRegion reg(rect);

  capturer_->Capture(reg);
    return true;
}

cricket::CaptureState Capturer::Start(const cricket::VideoFormat& format) {

  cricket::VideoFormat supported;
  if (GetBestCaptureFormat(format, &supported)) {
    SetCaptureFormat(&supported);
  }
  running_ = true;
  SetCaptureState(cricket::CS_RUNNING);
  return cricket::CS_RUNNING;
}

void Capturer::Stop() {
  running_ = false;
  SetCaptureFormat(NULL);
  SetCaptureState(cricket::CS_STOPPED);
}

bool Capturer::IsRunning() {
  return running_;
}

bool Capturer::IsScreencast() const {
  return true;
}

bool Capturer::GetPreferredFourccs(std::vector<uint32_t>* fourccs) {
  fourccs->push_back(cricket::FOURCC_I420);
  fourccs->push_back(cricket::FOURCC_MJPG);
  return true;
}

void Capturer::OnCaptureResult(webrtc::DesktopCapturer::Result result,
    std::unique_ptr<webrtc::DesktopFrame> desktop_frame) {

  if (!running_) {
    return;
  }

  if (result != webrtc::DesktopCapturer::Result::SUCCESS) {
    return;
  }

  int width = desktop_frame->size().width();
  int height = desktop_frame->size().height();
  uint32_t size = width * 4 * height;

  cricket::CapturedFrame frame;
  frame.width = width;
  frame.height = height;
  frame.fourcc = cricket::FOURCC_ARGB;
  frame.data_size = size;
  frame.time_stamp = rtc::TimeNanos();
  frame.rotation = webrtc::kVideoRotation_0;

  std::unique_ptr<uint8_t[]> data(new uint8_t[size]);

  std::memcpy(data.get(), desktop_frame->data(), size);

  frame.data = data.get();
  SignalFrameCaptured(this, &frame);
}

}  // namespace cricket
