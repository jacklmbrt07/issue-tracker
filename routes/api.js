"use strict";
const expect = require("chai").expect;
const mongodb = require("mongodb");
const mongoose = require("mongoose");
require("dotenv").config();

module.exports = function (app) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

  let issueSchema = new mongoose.Schema({
    issue_title: { type: String, required: true },
    issue_text: { type: String, required: true },
    created_by: { type: String, required: true },
    assigned_to: String,
    status_text: String,
    open: { type: Boolean, required: true },
    created_on: { type: Date, required: true },
    updated_on: { type: Date, required: true },
    project: String,
  });

  let Issue = mongoose.model("Issue", issueSchema);

  app
    .route("/api/issues/:project")

    .get(function (req, res) {
      var project = req.params.project;
      let filterObject = Object.assign(req.query);
      filterObject.project = req.params.project;

      Issue.find(filterObject, (err, issues) => {
        if(!err && issues){
          res.json(issues)
        }
      })
    })

    .post(function (req, res) {
      var project = req.params.project;

      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by){
        return res.json({ error: 'required field(s) missing' })
      }

      let newIssue = new Issue({
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || "",
        status_text: req.body.status_text || "",
        open: true,
        created_on: new Date().toUTCString(),
        updated_on: new Date().toUTCString(),
        project: project,
      });
      newIssue.save((err, savedIssue) => {
        if (!err && savedIssue) {
          return res.json(savedIssue)
        }
      });
    })

    .put(function (req, res) {
      var project = req.params.project;
      let updateObject = {};
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] != "") {
          updateObject[key] = req.body[key];
        }
      });
      if (Object.keys(updateObject).length < 2) {
        return res.json("no updated field sent");
      }


      Issue.findByIdAndUpdate(
        req.body._id,
        updateObject,
        { new: true },
        (err, updatedIssue) => {
          if (!err && updatedIssue) {
            updatedIssue.updated_on = new Date().toUTCString();
            return res.json({result: 'successfully updated', _id: updatedIssue._id});
          } else if (!updatedIssue) {
            return res.json("could not update " + req.body._id);
          }
        }
      );
    })

    .delete(function (req, res) {
      var project = req.params.project;
      if (!req.body._id) {
        return res.json("id error");
      }
      Issue.findByIdAndRemove(req.body._id, (err, deletedIssue) => {
        if (!err && deletedIssue) {
          res.json("deleted " + deletedIssue.id);
        } else if (!deletedIssue) {
          res.json("could not delete " + req.body._id);
        }
      });
    });
};
