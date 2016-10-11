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

#include "photon/capture_thread.h"
#include "photon/capturer.h"

namespace photon {

CaptureThread::CaptureThread(Capturer *capturer)
    : capturer_(capturer),
      finished_(false),
      running_(false) {}

CaptureThread::~CaptureThread() {}

void CaptureThread::Run() {
  int start, end;
  running_ = true;
  for (;;) {
    start = rtc::TimeNanos();
    capturer_->CaptureFrame();
    end = rtc::TimeNanos();
    SleepMs(10);
  }
  running_ = false;
  finished_ = true;
}

void CaptureThread::OnMessage(rtc::Message * msg) {}

bool CaptureThread::Finished() const {
  return finished_;
}

bool CaptureThread::Running() const {
  return running_;
}

}  // namespace photon
