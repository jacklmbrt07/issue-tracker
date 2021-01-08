"use strict";
const expect = require("chai").expect;
const mongodb = require("mongodb");
const mongoose = require("mongoose");
require("dotenv").config();

module.exports = function(app) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

  const issueSchema = new mongoose.Schema({
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

  const Issue = mongoose.model("Issue", issueSchema);

  const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    issues: [issueSchema],
  })

  const Project = mongoose.model("Project", projectSchema)

  app
    .route("/api/issues/:project")

    .get(function(req, res) {
      let project = req.params.project;
      const { _id, open, issue_title, issue_text, created_by, assigned_to, status_text } = req.query;

      Project.aggregate([
        { $match: { name: project }},
        { $unwind: "$issues"},
        _id != undefined ? { $match: { "issues._id": ObjectId(_id)}} : { $match: {}},
        open != undefined ? { $match: { "issues.open": open }} : { $match: {}},
        issue_title != undefined ? { $match: { "issues.issue_title": issue_title }} : { $match: {}},
        issue_text != undefined ? { $match: { "issues.issue_text": issue_text }} : { $match: {}},
        created_by != undefined ? { $match: { "issues.created_by": created_by }} : { $match: {}},
        assigned_to != undefined ? { $match: { "issues.assigned_to": assigned_to }} : { $match: {}},
        status_text != undefined ? { $match: { "issues.status_text": status_text }} : { $match: {}},
      ]).exec((err, data) => {
        if (!data) {
          res.json({});
        } else {
          let mappedData = data.map((item) => item.issues);
          res.json(mappedData)
        }
      })

    })

    .post(function(req, res) {
      let project = req.params.project;

      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by) {
        return res.json({ error: 'required field(s) missing' })
      }

      let newIssue = new Issue({
        issue_title: req.body.issue_title || "",
        issue_text: req.body.issue_text || "",
        created_by: req.body.created_by || "",
        assigned_to: req.body.assigned_to || "",
        status_text: req.body.status_text || "",
        open: true,
        created_on: new Date().toUTCString(),
        updated_on: new Date().toUTCString(),
      });

      Project.findOne({ name: project }, (err, projectData) => {
        if (!projectData) {
          const newProject = new Project({ name: project });
          newProject.issues.push(newIssue);
          newProject.save((err, data) => {
            if (err || !data) {
              res.send("There was an error saving in post")
            } else {
              res.json(newIssue);
            }
          });
        } else {
          projectData.issues.push(newIssue);
          projectData.save((err, data) => {
            if (err || !data) {
              res.send("There was an error saving in post");
            } else {
              res.json(newIssue);
            }
          })
        }
      })

    })

    .put(function(req, res) {
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



      if (req.body._id != "") {
        Issue.findByIdAndUpdate(
          req.body._id,
          updateObject,
          { new: true },
          (err, updatedIssue) => {
            if (!err && updatedIssue) {
              updatedIssue.updated_on = new Date().toUTCString();
              return res.json({ result: 'successfully updated', _id: updatedIssue._id });
            } else if (!updatedIssue) {
              return res.json("could not update " + req.body._id);
            }
          }
        );
      } else return res.json({ error: "missing _id" })
    })

    .delete(function(req, res) {
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
