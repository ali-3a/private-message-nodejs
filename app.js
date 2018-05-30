/**
 * @file
 * Server-side Nodejs implementation to handle the private message module.
 */

/*global require, console, process*/
/*jslint white:true, this, browser:true, es6*/

(function (require, console, process) {
  "use strict";

  const app = require('express');
  const http = require('http');
  const https = require('https');
  const io = require('socket.io');
  const helmet = require('helmet');
  // Set the configuration directory location.
  process.env.NODE_CONFIG_DIR = '../config/';
  const config = require('config');
  const fs = require('fs');

  const port = config.get('Connection.dbConfig.port');
  const httpsConfig = config.get('Connection.https');
  const secretKey = config.get('Connection.secret');

  function checkSecretValid(secret) {
    if (secret === secretKey) {
      console.log('Valid secret received');

      return true;
    }

    if (secret && secret.length) {
      console.log('Invalid secret received. Expected: ' + secretKey + " Received: " + secret);
    }
    else if (!secret) {
      console.log('Secret not received. Please check Private Message configuration page in Drupal.');
    }

    return false;
  }

  const express = app();
  express.use(helmet());

  var server;
  if (httpsConfig) {
    if (httpsConfig.privateKey && httpsConfig.certificate) {

      const options = {
        key: fs.readFileSync(httpsConfig.privateKey, 'utf8'),
        cert: fs.readFileSync(httpsConfig.certificate, 'utf8')
      };

      server = https.createServer(options, express);
    }
    else {
      if (!httpsConfig.privateKey) {
        console.log("SSL private key location not set in configuration. HTTPS connection cannot be made.");
      }
      if (!httpsConfig.certificate) {
        console.log("SSL certificate location not set in configuration. HTTPS connection cannot be made.");
      }
    }
  }
  else {
    server = http.Server(express);
  }
  var ioSocket = io(server);

  // The private message thread namespace. This namespace will be used to
  // emit triggers that update private messages with new messages.
  var threadChannel = ioSocket.of('/pm_thread');
  threadChannel.on('connection', function (socket) {

    console.log('user connected to pm_thread namespace');

    // Each private message thread will have its own room. This ensures that
    // emissions only go to other users in the room, and not across all private
    // message users everywhere.
    socket.on('thread', function (threadId, secret) {
      if (checkSecretValid(secret)) {
        console.log("joining thread: " + threadId);
        // Join the room for the given thread.
        socket.join(threadId);
      }
    });

    // Triggered when a new private message has been added to a thread.
    socket.on('new private message', function (threadId, secret) {
      if (checkSecretValid(secret)) {
        console.log("Sending private message to thread: " + threadId);
        // Tell all users in the room that a new private message is ready to be
        // fetched.
        threadChannel.to(threadId).emit('new private message');
      }
    });

    socket.on('disconnect', function () {
      console.log('user disconnected from thread namespace');
    });
  });

  // The private message inbox namespace. This namespace will be used to
  // emit triggers that update the private message inbox.
  var inboxChannel = ioSocket.of('/pm_inbox');
  inboxChannel.on('connection', function (socket) {

    console.log('user connected to pm_inbox namespace');

    // Each user will have their own 'room'. This is so that updates to an
    // individual user's inbox can happen, rather than having all users update
    // their inbox.
    socket.on('user', function (uid, secret) {
      if (checkSecretValid(secret)) {
        console.log("joining pm inbox for user: " + uid);
        // Join the room for the given user.
        socket.join(uid);
      }
    });

    // Triggered when a thread a user is a member of has been updated.
    socket.on('update pm inbox', function (uid, secret) {
      if (checkSecretValid(secret)) {
        console.log("triggering PM Inbox update for user: " + uid);
        // Tell the users inbox to update.
        inboxChannel.to(uid).emit('update pm inbox');
      }
    });

    socket.on('disconnect', function () {
      console.log('user disconnected from pm_inbox namespace');
    });
  });

  // The private message notification namespace. This namespace will be used to
  // emit a trigger to update the unread thread count.
  var notficationBlockChannel = ioSocket.of('/pm_notifications');
  notficationBlockChannel.on('connection', function (socket) {

    console.log('user connected to pm_notifications namespace');

    // Each user will have their own room. This ensures that emissions only go
    // to them, and not across all private message users everywhere.
    socket.on('user', function (user, secret) {
      if (checkSecretValid(secret)) {
        console.log("joining pm thread count notification for user: " + user);
        // Join the room for the given user.
        socket.join(user);
      }
    });

    // Triggered when a thread a user is a member of has been updated.
    socket.on('update pm unread thread count', function (uid, secret) {
      if (checkSecretValid(secret)) {
        console.log("triggering PM Notification update for user: " + uid);
        // Tell the users inbox to update.
        notficationBlockChannel.to(uid).emit('update pm unread thread count');
      }
    });

    socket.on('disconnect', function () {
      console.log('user disconnected from pm_notifications namespace');
    });
  });

  // The private message pm_browser_notification namespace. This namespace will
  // be used to emit a trigger to send a browser notifiation of the new message.
  var browserNotificationChannel = ioSocket.of('/pm_browser_notification');
  browserNotificationChannel.on('connection', function (socket) {

    console.log('user connected to pm_browser_notification namespace');

    // Each user will have their own room. This ensures that emissions only go
    // to them, and not across all private message users everywhere.
    socket.on('user', function (user, secret) {
      if (checkSecretValid(secret)) {
        console.log("joining browser notifications for user: " + user);
        // Join the room for the given user.
        socket.join(user);
      }
    });

    // Triggered when a thread a user is a member of has been updated.
    socket.on('notify browser new message', function (uid, message, secret) {
      if (checkSecretValid(secret)) {
        console.log("triggering browser notification for user: " + uid);
        // Trigger browser notifications of new messages.
        browserNotificationChannel.to(uid).emit('notify browser new message', message);
      }
    });

    socket.on('disconnect', function () {
      console.log('user disconnected from pm_browser_notification namespace');
    });
  });

  // The private message status_report namespace. This namespace will be used to
  // provides a status report for the server.
  var statusReportChannel = ioSocket.of('/status_report');
　statusReportChannel.on('connection', function (socket) {

    console.log('user connected to status_report namespace');

    socket.on('check secret', function (secret) {
      console.log('Checking secret: ' + secret);
      if (checkSecretValid(secret)) {
        statusReportChannel.emit('check secret', 'Server running and correctly configured');
      }
      else {
        statusReportChannel.emit('check secret', 'Server running but incorrectly configured');
      }
    });

  });

  if (server) {
    server.listen(port, function () {
      console.log('listening on: ' + (httpsConfig ? 'https' : 'http'));
      console.log('listening on port: ' + port);
    });
  }
  else {
    console.log('The server could not be started');
  }

}(require, console, process));
