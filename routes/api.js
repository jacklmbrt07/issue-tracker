"use strict";
const expect = require("chai").expect;
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
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
    open: Boolean,
    created_on: Date,
    updated_on: Date,
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
        created_on: new Date(),
        updated_on: new Date(),
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
      let project = req.params.project;
      const { _id, open, issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      if (!_id) {
        return res.json({error: "missing _id"})
      }

      if (!open && !issue_title && !issue_text && !created_by && !assigned_to && !status_text) {
        return res.json({ error: "no update field(s) sent", _id: _id});
      }

      Project.findOne({name: project}, (err, projectData) => {
        if (err || !projectData) {
          res.json({ error: "could not update", _id: _id});
        } else {
          const issueData = projectData.issues.id(_id);
          if (!issueData) {
            return res.json({ error: "could not update", _id: _id});
          }
          issueData.issue_title = issue_title || issueData.issue_title;
          issueData.issue_text = issue_text || issueData.issue_text;
          issueData.created_by = created_by || issueData.created_by;
          issueData.assigned_to = assigned_to || issueData.assigned_to;
          issueData.status_text = status_text || issueData.status_text;
          issueData.updated_on = new Date();
          issueData.open = open;
          projectData.save((err, data) => {
            if (err || !data) {
              res.json({ error: "could not update", _id: _id});
            } else {
               return res.json({ result: "successfully updated", _id: _id });
            }
          });
        }
      });
    })

    .delete(function(req, res) {
      let project = req.params.project;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: "missing _id"});
      }

      Project.findOne({name: project}, (err, projectData) => {
        if(err || !projectData) {
          res.send({error: "could not delete", _id:_id });
        } else {
          const issueData = projectData.issues.id(_id);
          if (!issueData){
            return res.send({error: "could not delete", _id: _id})
          }
          issueData.remove();

          projectData.save((err, data) => {
            if (err || !data){
              res.json({error: "could not delete", _id: issueData._id})
            } else {
              res.json({ result: "successfully deleted", _id: issueData._id})
            }
          });
        }
      })

    });
};
