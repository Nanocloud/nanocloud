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

#include "print.h"

using namespace std;

bool SendPDF(std::string path) {
  HANDLE hFile;
  DWORD  dwBytesRead;
  BYTE buffer[4096];

  int retRead;
  unsigned int offset = 0;
  unsigned char *fileContent = NULL;
  stringstream str;

  hFile = CreateFile(path.c_str(),
    GENERIC_READ,             // open for reading
    FILE_SHARE_READ,          // do not share
    NULL,                     // no security
    OPEN_EXISTING,            // existing file only
    FILE_ATTRIBUTE_NORMAL,
    NULL);

  while ((retRead = ReadFile(hFile, buffer, sizeof(buffer), &dwBytesRead, NULL))
    && dwBytesRead > 0) 
  {
    fileContent = (unsigned char *)realloc(fileContent, dwBytesRead + offset);
    memcpy(fileContent + offset, buffer, dwBytesRead);
    offset += dwBytesRead;
  }

  str << fileContent;

	rtc::CopyOnWriteBuffer buff(fileContent, offset);
  return Conductor::channel->Send(webrtc::DataBuffer(buff, true));
}
