/**
 * @file
 * Server-side Nodejs implementation to handle the private message module.
 */

/*global require, console*/
/*jslint white:true, this, browser:true*/

(function (require, console) {
  "use strict";

  var app = require('express')();
  var http = require('http').Server(app);
  var io = require('socket.io')(http);
  var helmet = require('helmet');
  app.use(helmet());

  // The private message thread namespace. This namespace will be used to
  // emit triggers that update private messages with new messages.
  var threadChannel = io.of('/pm_thread');
  threadChannel.on('connection', function (socket) {

    console.log('user connected to pm_thread namespace');

    // Each private message thread will have its own room. This ensures that
    // emissions only go to other users in the room, and not across all private
    // message users everywhere.
    socket.on('thread', function (threadId) {
      console.log("joining thread: " + threadId);
      // Join the room for the given thread.
      socket.join(threadId);
    });

    // Triggered when a new private message has been added to a thread.
    socket.on('new private message', function (threadId) {
      console.log("Sending private message to thread: " + threadId);
      // Tell all users in the room that a new private message is ready to be
      // fetched.
      threadChannel.to(threadId).emit('new private message');
    });

    socket.on('disconnect', function () {
      console.log('user disconnected from thread namespace');
    });
  });

  // The private message inbox namespace. This namespace will be used to
  // emit triggers that update the private message inbox.
  var inboxChannel = io.of('/pm_inbox');
  inboxChannel.on('connection', function (socket) {

    console.log('user connected to pm_inbox namespace');

    // Each user will have their own 'room'. This is so that updates to an
    // individual user's inbox can happen, rather than having all users update
    // their inbox.
    socket.on('user', function (uid) {
      console.log("joining pm inbox for user: " + uid);
      // Join the room for the given user.
      socket.join(uid);
    });

    // Triggered when a thread a user is a member of has been updated.
    socket.on('update pm inbox', function (uid) {
      console.log("triggering PM Inbox update for user: " + uid);
      // Tell the users inbox to update.
      inboxChannel.to(uid).emit('update pm inbox');
    });

    socket.on('disconnect', function () {
      console.log('user disconnected from pm_inbox namespace');
    });
  });

  // The private message notification namespace. This namespace will be used to
  // emit a trigger to update the unread thread count.
  var notficationBlockChannel = io.of('/pm_notifications');
  notficationBlockChannel.on('connection', function (socket) {

    console.log('user connected to pm_notifications namespace');

    // Each user will have their own room. This ensures that emissions only go
    // to them, and not across all private message users everywhere.
    socket.on('user', function (user) {
      console.log("joining pm thread count notification for user: " + user);
      // Join the room for the given user.
      socket.join(user);
    });

    // Triggered when a thread a user is a member of has been updated.
    socket.on('update pm unread thread count', function (uid) {
      console.log("triggering PM Notification update for user: " + uid);
      // Tell the users inbox to update.
      notficationBlockChannel.to(uid).emit('update pm unread thread count');
    });

    socket.on('disconnect', function () {
      console.log('user disconnected from pm_notifications namespace');
    });
  });

  // The private message pm_browser_notification namespace. This namespace will
  // be used to emit a trigger to send a browser notifiation of the new message.
  var browserNotificationChannel = io.of('/pm_browser_notification');
  browserNotificationChannel.on('connection', function (socket) {

    console.log('user connected to pm_browser_notification namespace');

    // Each user will have their own room. This ensures that emissions only go
    // to them, and not across all private message users everywhere.
    socket.on('user', function (user) {
      console.log("joining browser notifications for user: " + user);
      // Join the room for the given user.
      socket.join(user);
    });

    // Triggered when a thread a user is a member of has been updated.
    socket.on('notify browser new message', function (uid, message) {
      console.log("triggering browser notification for user: " + uid);
      // Trigger browser notifications of new messages.
      browserNotificationChannel.to(uid).emit('notify browser new message', message);
    });

    socket.on('disconnect', function () {
      console.log('user disconnected from pm_browser_notification namespace');
    });
  });

  http.listen(8080, function () {
    console.log('listening on *:8080');
  });

}(require, console));
