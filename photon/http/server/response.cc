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

#include "response.h"

#include <iostream>

namespace photon {
namespace http {
namespace server {

const response::http_status_code_t_ response::http_status_codes_[] = {
  { 200, "OK"                    },
  { 201, "Created"               },
  { 202, "Accepted"              },
  { 204, "No Content"            },
  { 300, "Multiple Choices"      },
  { 301, "Moved Permanently"     },
  { 302, "Moved Temporarily"     },
  { 304, "Not Modified"          },
  { 400, "Bad Request"           },
  { 401, "Unauthorized"          },
  { 403, "Forbidden"             },
  { 404, "Not Found"             },
  { 500, "Internal Server Error" },
  { 501, "Not Implemented"       },
  { 502, "Bad Gateway"           },
  { 503, "Service Unavailable"   },
  { 0  , nullptr                 }
};

const char response::name_value_separator[] = { ':', ' ' };
const char response::crlf_[] = { '\r', '\n' };
const char response::http_version_[] = "HTTP/1.0 ";

response::response(boost::asio::ip::tcp::socket socket)
  : status_(0),
    response_sent_(false),
    socket_(std::move(socket))
{

}

void response::header(const std::string & key, const std::string & value) {
  headers_[key] = value;
}

void response::status(int status) {
  status_ = status;
}

const char *response::http_code_label(int code) {
  for (int i = 0; http_status_codes_[i].code; ++i) {
    if (http_status_codes_[i].code == code) {
      return http_status_codes_[i].value;
    }
  }
  return nullptr;
}

void response::send_response() {
  assert(!response_sent_);
  response_sent_ = true;

  std::string buffer;

  boost::system::error_code ec;
  const char * http_status_label = http_code_label(status_);
  assert(nullptr != http_status_label);

  buffer.append(http_version_);
  buffer.append(std::to_string(status_));
  buffer.push_back(' ');
  buffer.append(http_status_label);

  buffer.append(crlf_, 2);

  for (auto it = headers_.begin(); it != headers_.end(); ++it) {
    buffer.append(it->first);
    buffer.append(name_value_separator, 2);
    buffer.append(it->second);
    buffer.append(crlf_, 2);

    LOG(INFO) << it->first << ":" << it->second;
  }

  buffer.append(crlf_, 2);
  buffer.append(body_);

  boost::asio::write(socket_, boost::asio::buffer(buffer), ec);

  if (ec) {
    LOG(INFO) << "Fail";
    LOG(INFO) << ec.message();
  }
  else
  {
    // Initiate graceful connection closure.
    boost::system::error_code ignored_ec;
    socket_.shutdown(boost::asio::ip::tcp::socket::shutdown_both,
        ignored_ec);

    if (ec != boost::asio::error::operation_aborted)
    {
      socket_.close();
    }
  }
}

void response::text(const std::string & text) {
  assert(!response_sent_);

  header("Content-Length", std::to_string(text.size()));
  header("Content-Type", "text/plain");

  body_ = text;
  send_response();
}

} // namespace server
} // namespace http
} // namespace photon
