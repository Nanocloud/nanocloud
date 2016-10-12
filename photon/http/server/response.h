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

#ifndef PHOTON_HTTP_SERVER_RESPONSE_H
#define PHOTON_HTTP_SERVER_RESPONSE_H

#include <string>
#include <map>

#include "webrtc/base/logging.h"

#include "boost/asio.hpp"

namespace photon {
namespace http {
namespace server {

class response
{
public:
  struct http_status_code_t_ {
    const int code;
    const char *value;
  };

  static const char name_value_separator[];
  static const char http_version_[];
  static const char crlf_[];
  static const http_status_code_t_ http_status_codes_[];

  std::map<std::string, std::string> headers_;
  std::string body_;

  static const char *http_code_label(int code);
  void send_response();

public:
  int status_;
  bool response_sent_;
  boost::asio::ip::tcp::socket socket_;

  response(boost::asio::ip::tcp::socket socket_);

  void header(const std::string & key, const std::string & value);
  void status(int status);
  void text(const std::string & text);
};

} // namespace server
} // namespace http
} // namespace photon

#endif // PHOTON_HTTP_SERVER_RESPONSE_H
