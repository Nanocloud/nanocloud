package com.nanocloud.auth.noauthlogged;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.ProtocolException;
import java.net.URL;
import javax.json.Json;
import javax.json.JsonObject;

import java.lang.reflect.Field;

import org.json.JSONException;
import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public class NanocloudHttpConnection {

  private static Logger logger = LoggerFactory.getLogger(NanocloudHttpConnection.class);
  private NanocloudHttpConnection() {

  }

  public static final void setRequestMethodUsingWorkaroundForJREBug(
      final HttpURLConnection httpURLConnection, final String method) {
    try {
      httpURLConnection.setRequestMethod(method);
      // Check whether we are running on a buggy JRE
    } catch (final ProtocolException pe) {
      Class<?> connectionClass = httpURLConnection
        .getClass();
      Field delegateField = null;
      try {
        delegateField = connectionClass.getDeclaredField("delegate");
        delegateField.setAccessible(true);
        HttpURLConnection delegateConnection = (HttpURLConnection) delegateField
          .get(httpURLConnection);
        setRequestMethodUsingWorkaroundForJREBug(delegateConnection, method);
      } catch (NoSuchFieldException e) {
        // Ignore for now, keep going
      } catch (IllegalArgumentException e) {
        throw new RuntimeException(e);
      } catch (IllegalAccessException e) {
        throw new RuntimeException(e);
      }
      try {
        Field methodField;
        while (connectionClass != null) {
          try {
            methodField = connectionClass
              .getDeclaredField("method");
          } catch (NoSuchFieldException e) {
            connectionClass = connectionClass.getSuperclass();
            continue;
          }
          methodField.setAccessible(true);
          methodField.set(httpURLConnection, method);
          break;
        }
      } catch (final Exception e) {
        throw new RuntimeException(e);
      }
    } catch (final Exception e) {
      logger.info(e.toString());
    }
  }

  public static JSONObject HttpGet(String URI, String token) {
    JSONObject resp = null;
    try {

      URL myUrl = new URL(URI);
      HttpURLConnection urlConn = (HttpURLConnection)myUrl.openConnection();

      urlConn.setInstanceFollowRedirects(false);
      urlConn.setRequestProperty("Authorization", "Bearer " + token);
      urlConn.setUseCaches(false);

      urlConn.connect();

      InputStream input = urlConn.getInputStream();

      BufferedReader reader = new BufferedReader(new InputStreamReader(input));
      StringBuilder response = new StringBuilder();

      String line;
      while ((line = reader.readLine()) != null) {
        response.append(line);
      }
      reader.close();

      resp =  new JSONObject(response.toString());
    } catch (IOException e) {
      e.printStackTrace();
    } catch (JSONException e) {
      e.printStackTrace();
    }

    return resp;
  }
}
