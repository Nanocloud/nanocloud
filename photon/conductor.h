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

#ifndef PHOTON_CONDUCTOR_H_
#define PHOTON_CONDUCTOR_H_

#include <deque>
#include <map>
#include <set>
#include <string>

#include "webrtc/api/mediastreaminterface.h"
#include "webrtc/api/peerconnectioninterface.h"

#include "boost/shared_ptr.hpp"

#include "http/server/response.h"

#if defined(WEBRTC_WIN)
#include "input_manager.h"
#endif

namespace webrtc {
class VideoCaptureModule;
}  // namespace webrtc

namespace cricket {
class VideoRenderer;
}  // namespace cricket

class Conductor
  : public webrtc::PeerConnectionObserver,
    public webrtc::DataChannelObserver,
    public webrtc::CreateSessionDescriptionObserver
{

public:
  enum CallbackID {
    MEDIA_CHANNELS_INITIALIZED = 1,
    PEER_CONNECTION_CLOSED,
    SEND_MESSAGE_TO_PEER,
    NEW_STREAM_ADDED,
    STREAM_REMOVED,
  };
  static rtc::scoped_refptr<webrtc::DataChannelInterface> channel;

  Conductor(const std::string & offer, boost::shared_ptr<photon::http::server::response> res);
  void ConnectToPeer();

  bool connection_active() const;

  virtual void Close();

protected:
  ~Conductor();
  bool InitializePeerConnection();
  bool ReinitializePeerConnectionForLoopback();
  bool CreatePeerConnection();
  void DeletePeerConnection();
  void EnsureStreamingUI();
  void AddStreams();
  cricket::VideoCapturer* OpenVideoCaptureDevice();

  //
  // DataChannelObserver implementation.
  //

  // The data channel state have changed.
  virtual void OnStateChange();
  //  A data buffer was successfully received.
  virtual void OnMessage(const webrtc::DataBuffer& buffer);

  //
  // PeerConnectionObserver implementation.
  //

  void OnSignalingChange(
      webrtc::PeerConnectionInterface::SignalingState new_state) override{};
  void OnAddStream(
      rtc::scoped_refptr<webrtc::MediaStreamInterface> stream) override;
  void OnRemoveStream(
      rtc::scoped_refptr<webrtc::MediaStreamInterface> stream) override;
  void OnDataChannel(webrtc::DataChannelInterface *channel) override;
  void OnRenegotiationNeeded() override {}
  void OnIceConnectionChange(
      webrtc::PeerConnectionInterface::IceConnectionState new_state) override{};
  void OnIceGatheringChange(
      webrtc::PeerConnectionInterface::IceGatheringState new_state) override;
  void OnIceCandidate(const webrtc::IceCandidateInterface* candidate) override;
  void OnIceConnectionReceivingChange(bool receiving) override {}

  // CreateSessionDescriptionObserver implementation.
  virtual void OnSuccess(webrtc::SessionDescriptionInterface* desc);
  virtual void OnFailure(const std::string& error);

protected:
  std::string offer_;
  boost::shared_ptr<photon::http::server::response> response_;

  rtc::scoped_refptr<webrtc::PeerConnectionInterface> peer_connection_;
  rtc::scoped_refptr<webrtc::PeerConnectionFactoryInterface>
    peer_connection_factory_;
  std::map<std::string, rtc::scoped_refptr<webrtc::MediaStreamInterface> >
    active_streams_;

#if defined(WEBRTC_WIN)
  photon::InputManager input_manager_;
#endif
};

#endif  // WEBRTC_EXAMPLES_PEERCONNECTION_CLIENT_CONDUCTOR_H_
