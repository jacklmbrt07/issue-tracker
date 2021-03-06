const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

let id1 = ""; 
let id2 = ""; 
let invalid_id = "123456789";

suite("Functional Tests", function() {
  suite("POST /api/issues/{project} => object with issue data", () => {
    test("Every field filled in", (done) => {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Title",
          issue_text: "text",
          created_by: "Functional Test - Every field filled in",
          assigned_to: "Chai and Mocha",
          status_text: "In QA",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "Title");
          assert.equal(res.body.issue_text, "text");
          assert.equal(
            res.body.created_by,
            "Functional Test - Every field filled in"
          );
          assert.equal(res.body.assigned_to, "Chai and Mocha");
          assert.equal(res.body.status_text, "In QA");
          id1 = res.body._id;
          console.log("id 1 has been set as " + id1);
          done();
        });
    });

    test("Required fields filled in", (done) => {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Title 2",
          issue_text: "text",
          created_by: "Functional Test - Every field filled in",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "Title 2");
          assert.equal(res.body.issue_text, "text");
          assert.equal(
            res.body.created_by,
            "Functional Test - Every field filled in"
          );
          assert.equal(res.body.assigned_to, "");
          assert.equal(res.body.status_text, "");
          id2 = res.body._id;
          console.log("id 2 has been set as " + id2);
          done();
        });
    });

    test("Missing required fields", (done) => {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({ issue_title: "Title" })
        .end((err, res) => {
          assert.equal(res.body.error, 'required field(s) missing');
          done();
        });
    });
  });

  suite("PUT /api/issues/{project} => text", () => {
    test("No body", (done) => {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({ _id: id1})
        .end((err, res) => {
          assert.equal(res.body.error, "no update field(s) sent");
          assert.equal(res.body._id, id1)
          done();
        });
    });

    test("One field to update", (done) => {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          _id: id1,
          issue_text: "new text",
        })
        .end((err, res) => {
          assert.equal(res.body.result, "successfully updated");
          assert.equal(res.body._id, id1);
          done();
        });
    });

    test("Multiple fields to update", (done) => {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          _id: id2,
          issue_title: "new title",
          issue_text: "new text",
        })
        .end((err, res) => {
          assert.equal(res.body.result, "successfully updated");
          assert.equal(res.body._id, id2);          
          done();
        });
    });

    test("Missing id", (done) => {
      chai.request(server).put("/api/issues/test").send({
        _id: '',
        issue_title: "title with no id",
        issue_text: "text with no id",
      })
      .end((err, res) => {
        assert.equal(res.body.error, "missing _id");
        done();
      })
    })

    test("Invalid id", (done) => {
      chai.request(server).put("/api/issues/test").send({
        _id: invalid_id,
        issue_title: "title with invalid id",
        issue_text: "text with invalid id"
      })
      .end((err, res) => {
        assert.equal(res.body.error, "could not update")
        assert.equal(res.body._id, invalid_id)
        done();
      })
    })
  });

  suite("GET /api/issues/{project} => Array of objects with issue data", () => {
    test("No filter", (done) => {
      chai
        .request(server)
        .get("/api/issues/test")
        .query({})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], "issue_title");
          assert.property(res.body[0], "issue_text");
          assert.property(res.body[0], "created_on");
          assert.property(res.body[0], "updated_on");
          assert.property(res.body[0], "created_by");
          assert.property(res.body[0], "assigned_to");
          assert.property(res.body[0], "open");
          assert.property(res.body[0], "status_text");
          assert.property(res.body[0], "_id");
          done();
        });
    });
    test("One filter", (done) => {
      chai
        .request(server)
        .get("/api/issues/test")
        .query({ created_by: "Functional Test - Every field filled in" })
        .end((err, res) => {
          res.body.forEach((issueResult) => {
            assert.equal(issueResult.created_by, 'Functional Test - Every field filled in')
          });
          done();
        });
    });
    test("Multiple filters", (done) => {
      chai
        .request(server)
        .get("/api/issues/test")
        .query({
          open: true,
          created_by: "Functional Test - Every field filled in",
        })
        .end((err, res) => {
          res.body.forEach((issueResult) => {
            assert.equal(issueResult.open, true);
            assert.equal(
              issueResult.created_by,
              "Functional Test - Every field filled in"
            );
          });
          done();
        });
    });
  });

  suite("DELETE /api/issues/{project} => text", () => {
    test("No_id", (done) => {
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({})
        .end((err, res) => {
          assert.equal(res.body.error, "missing _id");
          done();
        });
    });

    test("Valid _id", (done) => {
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({ _id: id1 })
        .end((err, res) => {
          assert.equal(res.body.result, "successfully deleted")
          assert.equal(res.body._id, id1)
          done();
        })
    });

    test("invalid _id", (done) => {
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({ _id: invalid_id})
        .end((err, res) => {
          assert.equal(res.body.error, "could not delete")
          assert.equal(res.body._id, invalid_id);
          done();
        });
    })
  });
});