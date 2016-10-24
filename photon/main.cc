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

#include "webrtc/base/physicalsocketserver.h"
#include "webrtc/base/ssladapter.h"
#include "webrtc/base/thread.h"

#include "boost/asio.hpp"
#include "boost/thread/thread.hpp"

#include "conductor.h"
#include "server.h"

namespace boost {
  void throw_exception(std::exception const & e) {
    std::cerr << e.what() << std::endl;
  }
}

class ConductorThr
  : public rtc::Runnable {

private:
  std::string offer_;
  rtc::scoped_refptr<Conductor> conductor_;
  rtc::Thread thr_;

public:
  ConductorThr()
  {
    thr_.Start(this);
  }

  virtual ~ConductorThr() {

  }

  void ConnectToPeer(const std::string & offer, boost::shared_ptr<photon::http::server::response> res) {
        conductor_ = new rtc::RefCountedObject<Conductor>(offer, res);

        thr_.Invoke<void>(RTC_FROM_HERE, rtc::Bind(&Conductor::ConnectToPeer, conductor_));
  }

  virtual void Run(rtc::Thread* thread) {
    thr_.ProcessMessages(rtc::ThreadManager::kForever);
  }
};

class Photon {

private:
  ConductorThr conductor_thr_;

public:
  void request_handler(photon::http::server::request req, boost::shared_ptr<photon::http::server::response> res) {
    if (!req.method.compare("POST") && !req.uri.compare("/webrtc")) {

      conductor_thr_.ConnectToPeer(req.body, res);
    } else {
      res->status(404);
      res->text("Not Found");
    }
  }
};

int main(int argc, char *argv[]) {
  rtc::InitializeSSL();

  Photon p;

  photon::http::server::server s(8888,
      std::bind(&Photon::request_handler,
                &p,
                std::placeholders::_1,
                std::placeholders::_2));

  s.run();
  rtc::CleanupSSL();

  return 0;
}
